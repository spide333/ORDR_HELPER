import { describe, expect, it } from "vitest";
import { emptyStats, normalizeStatNumber, sumStats } from "./stats";

describe("normalizeStatNumber", () => {
  it("converts empty and invalid values to zero", () => {
    expect(normalizeStatNumber("")).toBe(0);
    expect(normalizeStatNumber(undefined)).toBe(0);
    expect(normalizeStatNumber("abc")).toBe(0);
  });

  it("converts numeric strings and numbers", () => {
    expect(normalizeStatNumber("12")).toBe(12);
    expect(normalizeStatNumber(" 4.5 ")).toBe(4.5);
    expect(normalizeStatNumber(7)).toBe(7);
  });
});

describe("sumStats", () => {
  it("returns empty stats for no characters", () => {
    expect(sumStats([])).toEqual(emptyStats());
  });

  it("sums every supported stat", () => {
    expect(
      sumStats([
        {
          attack: 10,
          magicAttack: 3,
          armorReduction: 2,
          bossDamage: 5,
          stun: 1,
          slow: 0,
          manaRegen: 4
        },
        {
          attack: 8,
          magicAttack: 1,
          armorReduction: 0,
          bossDamage: 7,
          stun: 2,
          slow: 6,
          manaRegen: 0
        }
      ]),
    ).toEqual({
      attack: 18,
      magicAttack: 4,
      armorReduction: 2,
      bossDamage: 12,
      stun: 3,
      slow: 6,
      manaRegen: 4
    });
  });

  it("sums custom stats from stat definitions", () => {
    const dynamicSumStats = sumStats as unknown as (
      statsList: Array<Record<string, number>>,
      definitions: Array<{ key: string }>,
    ) => Record<string, number>;

    expect(
      dynamicSumStats(
        [
          { attack: 10, cooldownReduction: 3 },
          { attack: 8, cooldownReduction: 2 }
        ],
        [{ key: "attack" }, { key: "cooldownReduction" }],
      ),
    ).toEqual({
      attack: 18,
      cooldownReduction: 5
    });
  });
});
