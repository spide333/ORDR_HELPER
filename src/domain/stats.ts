import type { CharacterStats } from "./character";

export type StatDefinition = {
  key: string;
  label: string;
  order: number;
  enabled: boolean;
  important: boolean;
  includeInTotal: boolean;
};

export const defaultStatDefinitions: StatDefinition[] = [
  { key: "attack", label: "공격", order: 1, enabled: true, important: true, includeInTotal: true },
  { key: "magicAttack", label: "마공", order: 2, enabled: true, important: true, includeInTotal: true },
  { key: "armorReduction", label: "방깎", order: 3, enabled: true, important: true, includeInTotal: true },
  { key: "bossDamage", label: "보딜", order: 4, enabled: true, important: true, includeInTotal: true },
  { key: "stun", label: "스턴", order: 5, enabled: true, important: true, includeInTotal: true },
  { key: "slow", label: "이감", order: 6, enabled: true, important: true, includeInTotal: true },
  { key: "manaRegen", label: "마젠", order: 7, enabled: true, important: true, includeInTotal: true }
];

export function visibleStatDefinitions(statDefinitions: StatDefinition[]): StatDefinition[] {
  return [...statDefinitions]
    .filter((definition) => definition.enabled)
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label, "ko-KR"));
}

export function emptyStats(statDefinitions: Array<Pick<StatDefinition, "key">> = defaultStatDefinitions): CharacterStats {
  return Object.fromEntries(statDefinitions.map((definition) => [definition.key, 0]));
}

export function normalizeStatNumber(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value !== "string") {
    return 0;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return 0;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function sumStats(
  statsList: CharacterStats[],
  statDefinitions: Array<Pick<StatDefinition, "key">> = defaultStatDefinitions,
): CharacterStats {
  return statsList.reduce<CharacterStats>(
    (total, stats) =>
      Object.fromEntries(
        statDefinitions.map((definition) => [
          definition.key,
          normalizeStatNumber(total[definition.key]) + normalizeStatNumber(stats[definition.key])
        ]),
      ),
    emptyStats(statDefinitions),
  );
}

export function statGrandTotal(totalStats: CharacterStats, statDefinitions: StatDefinition[] = defaultStatDefinitions): number {
  return visibleStatDefinitions(statDefinitions)
    .filter((definition) => definition.includeInTotal)
    .reduce((total, definition) => total + normalizeStatNumber(totalStats[definition.key]), 0);
}
