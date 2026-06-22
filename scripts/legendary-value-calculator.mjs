const GRADE_LEVELS = new Map([
  ["special", 3],
  ["rare", 4],
  ["legendary", 5],
  ["hidden", 6],
  ["distortion", 7],
  ["changed", 8],
  ["limited", 9],
  ["transcend", 10],
  ["immortal", 11],
  ["eternal", 12],
  ["specialUnit", 15],
  ["seraphim", 23]
]);

const GRADE_BY_LEVEL = new Map([...GRADE_LEVELS.entries()].map(([grade, level]) => [level, grade]));

const FIXED_GRADE_VALUES = new Map([
  ["special", 0.1111],
  ["rare", 0.3333],
  ["legendary", 1],
  ["immortal", 3]
]);

const FALLBACK_VALUES_BY_LEVEL = new Map([
  [3, 0.1111],
  [4, 0.3333],
  [5, 1],
  [11, 3]
]);

function roundLegendaryValue(value) {
  return Number(value.toFixed(4));
}

function directValueFor(row) {
  const sheetValue = Number(row.sheetLegendaryValue);
  if (row.sheetLegendaryValue !== "" && Number.isFinite(sheetValue)) {
    return sheetValue;
  }

  return FIXED_GRADE_VALUES.get(row.grade) ?? 0;
}

function sourceOrdsearchId(id) {
  const match = id.match(/^ord_(\d+)/);
  return match ? match[1] : undefined;
}

function directMixBlock(html, ordsearchId) {
  const commonIndex = html.indexOf(`id="common${ordsearchId}"`);
  if (commonIndex < 0) {
    return "";
  }

  const beforeCommon = html.slice(0, commonIndex);
  const rowStart = beforeCommon.lastIndexOf("<tr");
  const rowEnd = html.indexOf("</tr>", commonIndex);

  if (rowStart < 0 || rowEnd < 0) {
    return "";
  }

  return html.slice(rowStart, rowEnd);
}

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#039;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtml(value) {
  return decodeHtml(value.replace(/<[^>]+>/g, " "));
}

function materialLinksFromMixBlock(block) {
  return [...block.matchAll(/<a\b(?=[^>]*\bmix-link\b)(?=[^>]*\blevel-(\d+)\b)[^>]*href="\/characters\/(\d+)"[^>]*>([\s\S]*?)<\/a>/g)].map(
    (match) => ({
      level: Number(match[1]),
      ordsearchId: match[2],
      name: stripHtml(match[3])
    }),
  );
}

function rowByOrdsearchId(rows) {
  const result = new Map();
  for (const row of rows) {
    const ordsearchId = sourceOrdsearchId(row.id);
    if (ordsearchId && !result.has(ordsearchId)) {
      result.set(ordsearchId, row);
    }
  }

  return result;
}

export async function calculateLegendaryRows(rows, options = {}) {
  const fetchHtml =
    options.fetchHtml ??
    (async (ordsearchId) => {
      const response = await fetch(`https://ordsearch.net/characters/${ordsearchId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ord_${ordsearchId}: ${response.status}`);
      }

      return response.text();
    });
  const rowLookup = rowByOrdsearchId(rows);
  const htmlCache = new Map();
  const valueCache = new Map();
  const auditCache = new Map();
  const inProgress = new Set();

  async function htmlFor(ordsearchId) {
    if (!htmlCache.has(ordsearchId)) {
      htmlCache.set(ordsearchId, await fetchHtml(ordsearchId));
    }

    return htmlCache.get(ordsearchId);
  }

  async function calculateMaterial(material, parentLevel) {
    if (material.level >= parentLevel) {
      return {
        ...material,
        skipped: true,
        value: 0,
        reason: "same-or-higher-grade"
      };
    }

    const knownRow = rowLookup.get(material.ordsearchId);
    if (knownRow) {
      const value = await calculateRow(knownRow);
      return {
        ...material,
        skipped: false,
        value
      };
    }

    const fallbackValue = FALLBACK_VALUES_BY_LEVEL.get(material.level);
    if (fallbackValue !== undefined) {
      return {
        ...material,
        skipped: false,
        value: fallbackValue,
        reason: "level-fallback"
      };
    }

    const grade = GRADE_BY_LEVEL.get(material.level);
    if (grade) {
      const value = await calculateRow({
        id: `ord_${material.ordsearchId}`,
        nameKo: material.name,
        grade,
        sheetLegendaryValue: ""
      });
      return {
        ...material,
        skipped: false,
        value,
        reason: "fetched-recursive"
      };
    }

    return {
      ...material,
      skipped: true,
      value: 0,
      reason: "unknown-level"
    };
  }

  async function calculateRow(row) {
    const ordsearchId = sourceOrdsearchId(row.id);
    const cacheKey = ordsearchId ?? row.id;
    if (valueCache.has(cacheKey)) {
      return valueCache.get(cacheKey);
    }

    if (FIXED_GRADE_VALUES.has(row.grade)) {
      const fixedValue = roundLegendaryValue(directValueFor(row));
      valueCache.set(cacheKey, fixedValue);
      auditCache.set(cacheKey, []);
      return fixedValue;
    }

    const targetLevel = GRADE_LEVELS.get(row.grade);
    if (!ordsearchId || !targetLevel || inProgress.has(cacheKey)) {
      valueCache.set(cacheKey, 0);
      auditCache.set(cacheKey, []);
      return 0;
    }

    inProgress.add(cacheKey);
    const html = await htmlFor(ordsearchId);
    const materials = materialLinksFromMixBlock(directMixBlock(html, ordsearchId));
    const materialResults = [];
    for (const material of materials) {
      materialResults.push(await calculateMaterial(material, targetLevel));
    }

    let value = roundLegendaryValue(materialResults.reduce((total, material) => total + material.value, 0));
    if (value === 0) {
      const sourceUpgrades = materials.filter(
        (material) =>
          material.level === targetLevel &&
          material.ordsearchId !== ordsearchId &&
          rowLookup.has(material.ordsearchId),
      );
      if (sourceUpgrades.length === 1) {
        value = await calculateRow(rowLookup.get(sourceUpgrades[0].ordsearchId));
        const sourceAudit = materialResults.find((material) => material.ordsearchId === sourceUpgrades[0].ordsearchId);
        if (sourceAudit) {
          sourceAudit.value = value;
          sourceAudit.reason = "same-grade-upgrade-source";
        }
      }
    }

    valueCache.set(cacheKey, value);
    auditCache.set(cacheKey, materialResults);
    inProgress.delete(cacheKey);
    return value;
  }

  const result = [];
  for (const row of rows) {
    const ordsearchId = sourceOrdsearchId(row.id);
    const cacheKey = ordsearchId ?? row.id;
    const legendaryValue = await calculateRow(row);
    result.push({
      ...row,
      legendaryValue,
      materials: auditCache.get(cacheKey) ?? []
    });
  }

  return result;
}
