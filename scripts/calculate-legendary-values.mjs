import fs from "node:fs/promises";

const inputCsv = process.argv[2] ?? "data/sheet1-after-stun-prob-paste-check-20260621.csv";
const outputJson = process.argv[3] ?? "data/legendary-values-20260621.json";
const outputTsv = process.argv[4] ?? "data/legendary-values-v-paste-20260621.tsv";

const LEGENDARY_BY_GRADE = new Map([
  ["immortal", 3]
]);

const TRANSCEND_MATERIAL_VALUES = new Map([
  [5, 1],
  [4, 0.3333],
  [3, 0.1111]
]);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const current = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (current === "\"" && next === "\"") {
        value += "\"";
        index += 1;
      } else if (current === "\"") {
        quoted = false;
      } else {
        value += current;
      }
    } else if (current === "\"") {
      quoted = true;
    } else if (current === ",") {
      row.push(value);
      value = "";
    } else if (current === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else if (current !== "\r") {
      value += current;
    }
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  return rows;
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

function materialLevelsFromMixBlock(block) {
  return [...block.matchAll(/class="level-(\d+)\s+mix-link\b/g)].map((match) => Number(match[1]));
}

async function calculateTranscendValue(ordsearchId, htmlCache) {
  if (!htmlCache.has(ordsearchId)) {
    const response = await fetch(`https://ordsearch.net/characters/${ordsearchId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ord_${ordsearchId}: ${response.status}`);
    }

    htmlCache.set(ordsearchId, await response.text());
  }

  const block = directMixBlock(htmlCache.get(ordsearchId), ordsearchId);
  const levels = materialLevelsFromMixBlock(block);
  const value = levels.reduce((total, level) => total + (TRANSCEND_MATERIAL_VALUES.get(level) ?? 0), 0);

  return {
    value,
    levels
  };
}

const csvRows = parseCsv(await fs.readFile(inputCsv, "utf8"));
const headers = csvRows[0];
const idIndex = headers.indexOf("id");
const nameIndex = headers.indexOf("nameKo");
const gradeIndex = headers.indexOf("grade");

if (idIndex < 0 || nameIndex < 0 || gradeIndex < 0) {
  throw new Error("Missing required id/nameKo/grade columns");
}

const htmlCache = new Map();
const auditRows = [];
const pasteRows = [];

for (const row of csvRows.slice(1)) {
  const id = row[idIndex];
  const nameKo = row[nameIndex];
  const grade = row[gradeIndex];
  let legendaryValue = LEGENDARY_BY_GRADE.get(grade) ?? 0;
  let materialLevels = [];

  if (grade === "transcend") {
    const ordsearchId = sourceOrdsearchId(id);
    if (ordsearchId) {
      const result = await calculateTranscendValue(ordsearchId, htmlCache);
      legendaryValue = result.value;
      materialLevels = result.levels;
    }
  }

  const roundedValue = Number(legendaryValue.toFixed(4));
  auditRows.push({
    id,
    nameKo,
    grade,
    legendaryValue: roundedValue,
    materialLevels
  });
  pasteRows.push([roundedValue === 0 ? "" : String(roundedValue)]);
}

await fs.writeFile(outputJson, JSON.stringify(auditRows, null, 2) + "\n");
await fs.writeFile(outputTsv, pasteRows.map((row) => row.join("\t")).join("\n"));

console.log(`Wrote ${auditRows.length} legendary values`);
console.log(`Non-zero rows: ${auditRows.filter((row) => row.legendaryValue > 0).length}`);
