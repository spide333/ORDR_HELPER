import { describe, expect, it } from "vitest";
import type { Character } from "./character";
import {
  filterCharacters,
  groupCharactersByGrade,
  resolveCharacterImageUrl,
  selectedCharacters,
  totalLegendaryValueForSelection,
  totalStatsForSelection
} from "./characterSelectors";

const baseCharacter: Character = {
  id: "base",
  nameKo: "기본",
  grade: "legendary",
  damageType: "physical",
  imageKey: "base",
  imageUrl: "/characters/base.svg",
  sortName: "기본",
  legendaryValue: 0,
  stats: {
    attack: 0,
    magicAttack: 0,
    armorReduction: 0,
    bossDamage: 0,
    stun: 0,
    slow: 0,
    manaRegen: 0
  },
  isEnabled: true,
  updatedAt: "2026-06-16"
};

const characters: Character[] = [
  { ...baseCharacter, id: "roger", nameKo: "로져", sortName: "로져", grade: "immortal", stats: { ...baseCharacter.stats, attack: 10 } },
  { ...baseCharacter, id: "garp", nameKo: "거프", sortName: "거프", grade: "immortal", stats: { ...baseCharacter.stats, armorReduction: 3 } },
  { ...baseCharacter, id: "zoro", nameKo: "조로", sortName: "조로", grade: "transcend", damageType: "physical" },
  { ...baseCharacter, id: "law", nameKo: "로우", sortName: "로우", grade: "hidden", damageType: "common" },
  { ...baseCharacter, id: "nami", nameKo: "나미", sortName: "나미", grade: "transcend", damageType: "magical" },
  { ...baseCharacter, id: "disabled", nameKo: "비활성", sortName: "비활성", grade: "hidden", isEnabled: false }
];

describe("filterCharacters", () => {
  it("filters enabled characters by damage type and search query", () => {
    expect(filterCharacters(characters, "physical", "").map((character) => character.id)).toEqual([
      "roger",
      "garp",
      "zoro",
      "law"
    ]);

    expect(filterCharacters(characters, "magical", "").map((character) => character.id)).toEqual([
      "law",
      "nami"
    ]);

    expect(filterCharacters(characters, "physical", "로").map((character) => character.id)).toEqual([
      "roger",
      "zoro",
      "law"
    ]);
  });
});

describe("groupCharactersByGrade", () => {
  it("uses grade order and Korean name sorting inside groups", () => {
    const groups = groupCharactersByGrade([
      { ...baseCharacter, id: "special", nameKo: "특별", sortName: "특별", grade: "special" },
      ...filterCharacters(characters, "physical", ""),
      { ...baseCharacter, id: "changed", nameKo: "변화", sortName: "변화", grade: "changed" },
      { ...baseCharacter, id: "rare", nameKo: "희귀", sortName: "희귀", grade: "rare" },
      { ...baseCharacter, id: "specialUnit", nameKo: "특수", sortName: "특수", grade: "specialUnit" },
      { ...baseCharacter, id: "legendary", nameKo: "전설", sortName: "전설", grade: "legendary" },
      { ...baseCharacter, id: "distortion", nameKo: "왜곡", sortName: "왜곡", grade: "distortion" },
      { ...baseCharacter, id: "limited", nameKo: "제한", sortName: "제한", grade: "limited" },
      { ...baseCharacter, id: "eternal", nameKo: "영원", sortName: "영원", grade: "eternal" },
      { ...baseCharacter, id: "seraphim", nameKo: "세라핌", sortName: "세라핌", grade: "seraphim" }
    ]);

    expect(groups.map((group) => group.grade)).toEqual([
      "immortal",
      "eternal",
      "transcend",
      "limited",
      "distortion",
      "seraphim",
      "legendary",
      "hidden",
      "changed",
      "rare",
      "specialUnit",
      "special"
    ]);
    expect(groups.find((group) => group.grade === "immortal")?.characters.map((character) => character.nameKo)).toEqual([
      "거프",
      "로져"
    ]);
  });
});

describe("selectedCharacters and totalStatsForSelection", () => {
  it("deduplicates selected ids by character identity and sums stats", () => {
    expect(selectedCharacters(characters, ["roger", "roger", "garp"]).map((character) => character.id)).toEqual([
      "roger",
      "garp"
    ]);

    expect(totalStatsForSelection(characters, ["roger", "garp"])).toMatchObject({
      attack: 10,
      armorReduction: 3
    });
  });

  it("sums legendary values for selected characters", () => {
    const selected = [
      { ...baseCharacter, id: "roger", legendaryValue: 3 },
      { ...baseCharacter, id: "nami", legendaryValue: 2.2222 }
    ];

    expect(totalLegendaryValueForSelection(selected, ["roger", "nami"])).toBeCloseTo(5.2222);
  });
});

describe("resolveCharacterImageUrl", () => {
  it("prefers explicit imageUrl and falls back to imageKey", () => {
    expect(resolveCharacterImageUrl({ ...baseCharacter, imageUrl: "/custom/roger.svg", imageKey: "roger" })).toBe(
      "/custom/roger.svg",
    );

    expect(resolveCharacterImageUrl({ ...baseCharacter, imageUrl: "", imageKey: "zoro" })).toBe(
      `${import.meta.env.BASE_URL}characters/zoro.svg`,
    );
  });
});
