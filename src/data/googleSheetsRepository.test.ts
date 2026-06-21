import { describe, expect, it, vi } from "vitest";
import { mapCharacterRow } from "./characterMapper";
import {
  loadCharacterDataFromCsvUrls,
  loadCharactersFromCsvUrl,
  loadStatDefinitionsFromCsvUrl
} from "./googleSheetsRepository";

describe("mapCharacterRow", () => {
  it("maps a Google Sheets row into a Character", () => {
    expect(
      mapCharacterRow({
        id: "roger_immortal",
        nameKo: "로져",
        grade: "immortal",
        damageType: "physical",
        imageKey: "roger_immortal",
        imageUrl: "",
        sortName: "",
        attack: "35",
        magicAttack: "",
        armorReduction: "8",
        bossDamage: "12",
        stun: "0",
        slow: "",
        manaRegen: "3",
        isEnabled: "TRUE",
        updatedAt: "2026-06-16"
      }),
    ).toMatchObject({
      id: "roger_immortal",
      nameKo: "로져",
      grade: "immortal",
      damageType: "physical",
      imageKey: "roger_immortal",
      imageUrl: "",
      sortName: "로져",
      stats: {
        attack: 35,
        magicAttack: 0,
        armorReduction: 8,
        bossDamage: 12,
        stun: 0,
        slow: 0,
        manaRegen: 3
      },
      isEnabled: true,
      updatedAt: "2026-06-16"
    });
  });

  it("rejects rows with invalid enum values", () => {
    expect(() =>
      mapCharacterRow({
        id: "bad",
        nameKo: "오류",
        grade: "unknown-grade",
        damageType: "physical",
        imageKey: "bad",
        isEnabled: "TRUE"
      }),
    ).toThrow("Invalid grade");
  });

  it("accepts common damage type rows from Google Sheets", () => {
    expect(
      mapCharacterRow({
        id: "common_unit",
        nameKo: "공용유닛",
        grade: "hidden",
        damageType: "common",
        imageKey: "common_unit",
        attack: "5",
        magicAttack: "5",
        armorReduction: "0",
        bossDamage: "1",
        stun: "0",
        slow: "0",
        manaRegen: "0",
        isEnabled: "TRUE"
      }),
    ).toMatchObject({
      id: "common_unit",
      damageType: "common"
    });
  });

  it("uses common damage type when the Google Sheets cell is blank", () => {
    expect(
      mapCharacterRow({
        id: "blank_damage_type",
        nameKo: "빈타입",
        grade: "hidden",
        damageType: "   ",
        imageKey: "blank_damage_type",
        attack: "5",
        magicAttack: "5",
        armorReduction: "0",
        bossDamage: "1",
        stun: "0",
        slow: "0",
        manaRegen: "0",
        isEnabled: "TRUE"
      }),
    ).toMatchObject({
      id: "blank_damage_type",
      damageType: "common"
    });
  });

  it("throws when a required stat column is missing", () => {
    expect(
      mapCharacterRow({
        id: "roger_immortal",
        nameKo: "로져",
        grade: "immortal",
        damageType: "physical",
        imageKey: "roger_immortal",
        magicAttack: "",
        armorReduction: "8",
        bossDamage: "12",
        stun: "0",
        slow: "",
        manaRegen: "3",
        isEnabled: "TRUE"
      }),
    ).toMatchObject({
      stats: {
        attack: 0,
        armorReduction: 8
      }
    });
  });

  it("defaults to enabled when isEnabled is missing", () => {
    expect(
      mapCharacterRow({
        id: "roger_immortal",
        nameKo: "로져",
        grade: "immortal",
        damageType: "physical",
        imageKey: "roger_immortal",
        attack: "35",
        magicAttack: "",
        armorReduction: "8",
        bossDamage: "12",
        stun: "0",
        slow: "",
        manaRegen: "3"
      }),
    ).toMatchObject({
      id: "roger_immortal",
      isEnabled: true
    });
  });

  it("maps stat values from Sheet2 labels when Sheet1 uses Korean headers", () => {
    expect(
      mapCharacterRow(
        {
          id: "roger_immortal",
          nameKo: "로져",
          grade: "immortal",
          damageType: "physical",
          imageKey: "roger_immortal",
          방깎: "8",
          공증: "35"
        },
        [
          { key: "armorReduction", label: "방깎", order: 1, enabled: true, important: true, includeInTotal: true },
          { key: "attackIncrease", label: "공증", order: 2, enabled: true, important: true, includeInTotal: true }
        ],
      ).stats,
    ).toEqual({
      armorReduction: 8,
      attackIncrease: 35
    });
  });

  it("uses 0 when a numeric stat value is invalid", () => {
    expect(
      mapCharacterRow({
        id: "roger_immortal",
        nameKo: "로져",
        grade: "immortal",
        damageType: "physical",
        imageKey: "roger_immortal",
        attack: "abc",
        magicAttack: "",
        armorReduction: "8",
        bossDamage: "N/A",
        stun: "0",
        slow: "",
        manaRegen: "3",
        isEnabled: "TRUE"
      }).stats,
    ).toMatchObject({
      attack: 0,
      bossDamage: 0,
      armorReduction: 8
    });
  });

  it("allows rows that only provide an explicit imageUrl", () => {
    expect(
      mapCharacterRow({
        id: "url_only",
        nameKo: "외부",
        grade: "hidden",
        damageType: "magical",
        imageKey: "",
        imageUrl: "https://cdn.example.com/url-only.png",
        attack: "0",
        magicAttack: "4",
        armorReduction: "0",
        bossDamage: "1",
        stun: "0",
        slow: "0",
        manaRegen: "0",
        isEnabled: "TRUE"
      }),
    ).toMatchObject({
      id: "url_only",
      imageKey: "",
      imageUrl: "https://cdn.example.com/url-only.png"
    });
  });

  it("uses a placeholder thumbnail when both imageKey and imageUrl are missing", () => {
    expect(
      mapCharacterRow({
        id: "missing_image",
        nameKo: "이미지없음",
        grade: "hidden",
        damageType: "magical",
        imageKey: "",
        imageUrl: "",
        attack: "0",
        magicAttack: "4",
        armorReduction: "0",
        bossDamage: "1",
        stun: "0",
        slow: "0",
        manaRegen: "0",
        isEnabled: "TRUE"
      }),
    ).toMatchObject({
      id: "missing_image",
      imageKey: "placeholder",
      imageUrl: ""
    });
  });

  it("throws when isEnabled has an invalid value", () => {
    expect(() =>
      mapCharacterRow({
        id: "roger_immortal",
        nameKo: "로져",
        grade: "immortal",
        damageType: "physical",
        imageKey: "roger_immortal",
        attack: "35",
        magicAttack: "",
        armorReduction: "8",
        bossDamage: "12",
        stun: "0",
        slow: "",
        manaRegen: "3",
        isEnabled: "maybe"
      }),
    ).toThrow("Invalid boolean value for isEnabled in roger_immortal");
  });
});

describe("loadCharactersFromCsvUrl", () => {
  it("loads and maps public CSV data", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        [
          "id,nameKo,grade,damageType,imageKey,imageUrl,sortName,attack,magicAttack,armorReduction,bossDamage,stun,slow,manaRegen,isEnabled,updatedAt",
          "roger_immortal,로져,immortal,physical,roger_immortal,,로져,35,0,8,12,0,0,3,TRUE,2026-06-16"
        ].join("\n")
    });

    const characters = await loadCharactersFromCsvUrl("https://example.com/sheet.csv", fetchMock);

    expect(fetchMock).toHaveBeenCalledWith("https://example.com/sheet.csv");
    expect(characters).toHaveLength(1);
    expect(characters[0].id).toBe("roger_immortal");
  });

  it("loads character rows when updatedAt and isEnabled are omitted from Sheet1", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        [
          "id,nameKo,grade,damageType,imageKey,imageUrl,sortName,attack,magicAttack,armorReduction,bossDamage,stun,slow,manaRegen",
          "roger_immortal,로져,immortal,physical,roger_immortal,,로져,35,0,8,12,0,0,3"
        ].join("\n")
    });

    const characters = await loadCharactersFromCsvUrl("https://example.com/sheet.csv", fetchMock);

    expect(characters[0]).toMatchObject({
      id: "roger_immortal",
      isEnabled: true,
      updatedAt: ""
    });
  });

  it("ignores Sheet1 helper rows and unsupported grade rows", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        [
          "id,nameKo,grade,damageType,imageKey,imageUrl,sortName,attack",
          "roger_immortal,로져,immortal,physical,roger_immortal,,로져,35",
          ",그린블러드,other,,,,그린블러드,0",
          "other_unit,기타,other,common,other_unit,,기타,0"
        ].join("\n")
    });

    const characters = await loadCharactersFromCsvUrl("https://example.com/sheet.csv", fetchMock);

    expect(characters).toHaveLength(1);
    expect(characters[0].id).toBe("roger_immortal");
  });

  it("loads stat definitions from public CSV data", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        [
          "key,label,order,enabled,includeInTotal,important",
          "attack,공격,1,TRUE,TRUE,TRUE",
          "cooldownReduction,쿨감,8,TRUE,FALSE,FALSE",
          "hiddenStat,숨김,9,FALSE,TRUE,TRUE"
        ].join("\n")
    });

    const statDefinitions = await loadStatDefinitionsFromCsvUrl("https://example.com/stats.csv", fetchMock);

    expect(statDefinitions).toEqual([
      { key: "attack", label: "공격", order: 1, enabled: true, includeInTotal: true, important: true },
      { key: "cooldownReduction", label: "쿨감", order: 2, enabled: true, includeInTotal: false, important: false },
      { key: "hiddenStat", label: "숨김", order: 3, enabled: false, includeInTotal: true, important: true }
    ]);
  });

  it("uses the Sheet2 key row order as the stat display order", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        [
          "key,label,order,enabled,includeInTotal",
          "bossDamage,보딜,99,TRUE,TRUE",
          "armorReduction,방깎,1,TRUE,TRUE",
          "slow,이감,5,TRUE,TRUE"
        ].join("\n")
    });

    const statDefinitions = await loadStatDefinitionsFromCsvUrl("https://example.com/stats.csv", fetchMock);

    expect(statDefinitions.map((definition) => [definition.key, definition.order])).toEqual([
      ["bossDamage", 1],
      ["armorReduction", 2],
      ["slow", 3]
    ]);
  });

  it("loads characters with custom stat definitions", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          [
            "key,label,order,enabled,includeInTotal",
            "attack,공격,1,TRUE,TRUE",
            "cooldownReduction,쿨감,2,TRUE,TRUE"
          ].join("\n")
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          [
            "id,nameKo,grade,damageType,imageKey,imageUrl,sortName,attack,cooldownReduction",
            "roger_immortal,로져,immortal,physical,roger_immortal,,로져,35,4"
          ].join("\n")
      });

    const data = await loadCharacterDataFromCsvUrls(
      "https://example.com/characters.csv",
      "https://example.com/stats.csv",
      fetchMock,
    );

    expect(fetchMock).toHaveBeenNthCalledWith(1, "https://example.com/stats.csv");
    expect(fetchMock).toHaveBeenNthCalledWith(2, "https://example.com/characters.csv");
    expect(data.statDefinitions.map((definition) => definition.key)).toEqual(["attack", "cooldownReduction"]);
    expect(data.characters[0].stats).toEqual({
      attack: 35,
      cooldownReduction: 4
    });
  });

  it("throws a readable error when the request fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => ""
    });

    await expect(loadCharactersFromCsvUrl("https://example.com/missing.csv", fetchMock)).rejects.toThrow(
      "Failed to load Google Sheets CSV: 404",
    );
  });
});
