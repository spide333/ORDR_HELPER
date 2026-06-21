import fs from "node:fs/promises";
import path from "node:path";

const outputDir = path.resolve("data");

const levels = [
  { level: 3, grade: "special", label: "특별함" },
  { level: 4, grade: "rare", label: "희귀함" },
  { level: 5, grade: "legendary", label: "전설적인" },
  { level: 6, grade: "hidden", label: "히든조합" },
  { level: 7, grade: "distortion", label: "왜곡됨" },
  { level: 8, grade: "changed", label: "변화된" },
  { level: 9, grade: "limited", label: "제한됨" },
  { level: 10, grade: "transcend", label: "초월함" },
  { level: 11, grade: "immortal", label: "불멸의" },
  { level: 12, grade: "eternal", label: "영원한" },
  { level: 15, grade: "specialUnit", label: "특수함" },
  { level: 23, grade: "seraphim", label: "세라핌" }
];

const characterHeaders = [
  "id",
  "nameKo",
  "grade",
  "damageType",
  "imageKey",
  "imageUrl",
  "sortName",
  "attack",
  "magicAttack",
  "armorReduction",
  "bossDamage",
  "stun",
  "slow",
  "manaRegen",
  "isEnabled",
  "updatedAt"
];

const statHeaders = ["key", "label", "order", "enabled", "includeInTotal"];

const statRows = [
  ["attack", "공격", "1", "TRUE", "TRUE"],
  ["magicAttack", "마공", "2", "TRUE", "TRUE"],
  ["armorReduction", "방깎", "3", "TRUE", "TRUE"],
  ["bossDamage", "보딜", "4", "TRUE", "TRUE"],
  ["stun", "스턴", "5", "TRUE", "TRUE"],
  ["slow", "이감", "6", "TRUE", "TRUE"],
  ["manaRegen", "마젠", "7", "TRUE", "TRUE"]
];

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
  return decodeHtml(value.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " "));
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll("\"", "\"\"")}"`;
  }

  return text;
}

function tsvEscape(value) {
  return String(value ?? "").replace(/\t/g, " ").replace(/\r?\n/g, " ").trim();
}

function toCsv(rows) {
  return rows.map((row) => row.map(csvEscape).join(",")).join("\n") + "\n";
}

function toTsv(rows) {
  return rows.map((row) => row.map(tsvEscape).join("\t")).join("\n") + "\n";
}

function normalizeName(alt, gradeLabel) {
  const suffix = ` - ${gradeLabel}`;
  return alt.endsWith(suffix) ? alt.slice(0, -suffix.length).trim() : alt.trim();
}

function inferDamageType(text) {
  const magicCount = (text.match(/마법\s*데미지|마법데미지/g) ?? []).length;
  const physicalCount = (text.match(/물리\s*데미지|물리데미지/g) ?? []).length;
  if (magicCount > 0 && physicalCount > 0) {
    return "common";
  }

  return magicCount > physicalCount ? "magical" : "physical";
}

function parseUpdatedAt(block) {
  const match = block.match(/(\d{4})\.(\d{2})\.(\d{2})\s*수정/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : "";
}

function parseExpectedCount(html) {
  const match = html.match(/<span class="fw-bold">"[^"]+"<\/span>[\s\S]*?(\d+)\s*건/);
  return match ? Number(match[1]) : undefined;
}

function parseCharacters(html, levelConfig) {
  return html
    .split(/<div class="[^"]*character-info[^"]*">/)
    .slice(1)
    .map((block) => {
      const imgMatch = block.match(/<img src="([^"]+)"[\s\S]*?alt="([^"]+)"/);
      const hrefMatch = block.match(/<a href="\/characters\/(\d+)" class="text-body[^"]*">/);
      if (!imgMatch || !hrefMatch) {
        return undefined;
      }

      const ordsearchId = hrefMatch[1];
      const imageUrl = decodeHtml(imgMatch[1]);
      const alt = decodeHtml(imgMatch[2]);
      const nameKo = normalizeName(alt, levelConfig.label);
      const detailText = stripHtml(block);

      return {
        id: `ord_${ordsearchId}`,
        nameKo,
        grade: levelConfig.grade,
        damageType: inferDamageType(detailText),
        imageKey: `ord_${ordsearchId}`,
        imageUrl,
        sortName: nameKo,
        attack: "0",
        magicAttack: "0",
        armorReduction: "0",
        bossDamage: "0",
        stun: "0",
        slow: "0",
        manaRegen: "0",
        isEnabled: "TRUE",
        updatedAt: parseUpdatedAt(block)
      };
    })
    .filter(Boolean);
}

async function fetchLevel(levelConfig) {
  const byId = new Map();
  let expectedCount;

  for (let page = 1; page <= 20; page += 1) {
    const url = `https://ordsearch.net/characters?level=${levelConfig.level}&page=${page}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }

    const html = await response.text();
    expectedCount ??= parseExpectedCount(html);
    const characters = parseCharacters(html, levelConfig);
    if (characters.length === 0) {
      break;
    }

    for (const character of characters) {
      byId.set(character.id, character);
    }

    if (expectedCount && byId.size >= expectedCount) {
      break;
    }
  }

  return {
    expectedCount,
    characters: [...byId.values()]
  };
}

await fs.mkdir(outputDir, { recursive: true });

const allCharacters = [];
const summary = [];

for (const levelConfig of levels) {
  const result = await fetchLevel(levelConfig);
  allCharacters.push(...result.characters);
  summary.push({
    level: levelConfig.level,
    label: levelConfig.label,
    grade: levelConfig.grade,
    expectedCount: result.expectedCount ?? null,
    scrapedCount: result.characters.length
  });
}

const characterRows = [
  characterHeaders,
  ...allCharacters.map((character) => characterHeaders.map((header) => character[header]))
];
const statDefinitionRows = [statHeaders, ...statRows];

await fs.writeFile(path.join(outputDir, "ordr-characters.csv"), toCsv(characterRows));
await fs.writeFile(path.join(outputDir, "ordr-characters.tsv"), toTsv(characterRows));
await fs.writeFile(path.join(outputDir, "ordr-stat-definitions.csv"), toCsv(statDefinitionRows));
await fs.writeFile(path.join(outputDir, "ordr-stat-definitions.tsv"), toTsv(statDefinitionRows));
await fs.writeFile(path.join(outputDir, "ordr-scrape-summary.json"), JSON.stringify(summary, null, 2) + "\n");

console.table(summary);
console.log(`Total characters: ${allCharacters.length}`);
