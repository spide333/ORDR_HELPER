import fs from "node:fs/promises";

const inputCsv = process.argv[2] ?? "data/sheet1-after-stun-prob-paste-check-20260621.csv";
const legendaryValuesJson = process.argv[3] ?? "data/legendary-values-20260621.json";
const outputJson = process.argv[4] ?? "src/data/localCharacterSeeds.json";

const supportedGrades = new Set([
  "special",
  "rare",
  "legendary",
  "hidden",
  "changed",
  "transcend",
  "immortal",
  "limited",
  "eternal",
  "distortion",
  "specialUnit",
  "seraphim"
]);
const supportedDamageTypes = new Set(["physical", "magical", "common"]);

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

function normalizeDamageType(value) {
  const normalized = value.trim();
  return supportedDamageTypes.has(normalized) ? normalized : "common";
}

const csvRows = parseCsv(await fs.readFile(inputCsv, "utf8"));
const headers = csvRows[0];
const legendaryValues = new Map(
  JSON.parse(await fs.readFile(legendaryValuesJson, "utf8")).map((row) => [row.id, row.legendaryValue]),
);

function cell(row, key) {
  const index = headers.indexOf(key);
  return index >= 0 ? row[index].trim() : "";
}

function legendaryValueFor(row) {
  const sheetValue = cell(row, "몇전설");
  if (sheetValue.length > 0) {
    return Number(sheetValue);
  }

  return Number(legendaryValues.get(cell(row, "id")) ?? 0);
}

const seeds = csvRows
  .slice(1)
  .map((row) => ({
    id: cell(row, "id"),
    nameKo: cell(row, "nameKo"),
    grade: cell(row, "grade"),
    damageType: normalizeDamageType(cell(row, "damageType")),
    sortName: cell(row, "sortName") || cell(row, "nameKo"),
    legendaryValue: legendaryValueFor(row)
  }))
  .filter((seed) => seed.id.length > 0 && seed.nameKo.length > 0 && supportedGrades.has(seed.grade));

await fs.writeFile(outputJson, JSON.stringify(seeds, null, 2) + "\n");

console.log(`Wrote ${seeds.length} local character seeds`);
