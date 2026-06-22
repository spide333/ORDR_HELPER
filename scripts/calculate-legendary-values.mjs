import fs from "node:fs/promises";

import { calculateLegendaryRows } from "./legendary-value-calculator.mjs";

const inputCsv = process.argv[2] ?? "data/sheet1-after-stun-prob-paste-check-20260621.csv";
const outputJson = process.argv[3] ?? "data/legendary-values-20260621.json";
const outputTsv = process.argv[4] ?? "data/legendary-values-v-paste-20260621.tsv";

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

const csvRows = parseCsv(await fs.readFile(inputCsv, "utf8"));
const headers = csvRows[0];
const idIndex = headers.indexOf("id");
const nameIndex = headers.indexOf("nameKo");
const gradeIndex = headers.indexOf("grade");
const legendaryValueIndex = headers.indexOf("몇전설");

if (idIndex < 0 || nameIndex < 0 || gradeIndex < 0) {
  throw new Error("Missing required id/nameKo/grade columns");
}

const inputRows = csvRows.slice(1).map((row) => ({
  id: row[idIndex],
  nameKo: row[nameIndex],
  grade: row[gradeIndex],
  sheetLegendaryValue: legendaryValueIndex >= 0 ? row[legendaryValueIndex].trim() : ""
}));
const auditRows = await calculateLegendaryRows(inputRows);
const pasteRows = auditRows.map((row) => [row.legendaryValue === 0 ? "" : String(row.legendaryValue)]);

await fs.writeFile(outputJson, JSON.stringify(auditRows, null, 2) + "\n");
await fs.writeFile(outputTsv, pasteRows.map((row) => row.join("\t")).join("\n"));

console.log(`Wrote ${auditRows.length} legendary values`);
console.log(`Non-zero rows: ${auditRows.filter((row) => row.legendaryValue > 0).length}`);
