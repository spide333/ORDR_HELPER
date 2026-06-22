import { describe, expect, it } from "vitest";

import { calculateLegendaryRows } from "./legendary-value-calculator.mjs";

function mixHtml(ordsearchId, links) {
  return `<table><tr><td>${links
    .map(({ level, id, name }) => `<a class="level-${level} mix-link" href="/characters/${id}">${name}</a>`)
    .join(" / ")}<div id="common${ordsearchId}"></div></td></tr></table>`;
}

describe("calculateLegendaryRows", () => {
  it("recursively sums lower-grade materials and skips same-grade materials", async () => {
    const rows = [
      { id: "ord_1", nameKo: "전설", grade: "legendary", sheetLegendaryValue: "1" },
      { id: "ord_100", nameKo: "히든", grade: "hidden", sheetLegendaryValue: "" },
      { id: "ord_200", nameKo: "변화", grade: "changed", sheetLegendaryValue: "" },
      { id: "ord_300", nameKo: "초월", grade: "transcend", sheetLegendaryValue: "" }
    ];
    const htmlByOrdsearchId = new Map([
      [
        "100",
        mixHtml("100", [
          { level: 5, id: "1", name: "전설" },
          { level: 4, id: "2", name: "희귀" },
          { level: 3, id: "3", name: "특별" }
        ])
      ],
      [
        "200",
        mixHtml("200", [
          { level: 6, id: "100", name: "히든" },
          { level: 5, id: "1", name: "전설" }
        ])
      ],
      [
        "300",
        mixHtml("300", [
          { level: 8, id: "200", name: "변화" },
          { level: 4, id: "4", name: "희귀" },
          { level: 10, id: "999", name: "초월 재료" }
        ])
      ]
    ]);

    const result = await calculateLegendaryRows(rows, {
      fetchHtml: async (ordsearchId) => htmlByOrdsearchId.get(ordsearchId) ?? ""
    });

    expect(result.find((row) => row.id === "ord_100")?.legendaryValue).toBe(1.4444);
    expect(result.find((row) => row.id === "ord_200")?.legendaryValue).toBe(2.4444);
    expect(result.find((row) => row.id === "ord_300")?.legendaryValue).toBe(2.7777);
  });

  it("inherits the source value for same-grade upgrade recipes", async () => {
    const rows = [
      { id: "ord_1", nameKo: "전설", grade: "legendary", sheetLegendaryValue: "1" },
      { id: "ord_300", nameKo: "초월", grade: "transcend", sheetLegendaryValue: "" },
      { id: "ord_301", nameKo: "초월 강화", grade: "transcend", sheetLegendaryValue: "" }
    ];
    const htmlByOrdsearchId = new Map([
      [
        "300",
        mixHtml("300", [
          { level: 5, id: "1", name: "전설" },
          { level: 5, id: "2", name: "전설2" }
        ])
      ],
      [
        "301",
        mixHtml("301", [
          { level: 10, id: "300", name: "초월" },
          { level: 14, id: "999", name: "강화 재료" }
        ])
      ]
    ]);

    const result = await calculateLegendaryRows(rows, {
      fetchHtml: async (ordsearchId) => htmlByOrdsearchId.get(ordsearchId) ?? ""
    });

    expect(result.find((row) => row.id === "ord_301")?.legendaryValue).toBe(2);
  });
});
