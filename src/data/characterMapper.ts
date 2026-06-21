import type { Character, CharacterStats, DamageType, Grade } from "../domain/character";
import { defaultStatDefinitions, normalizeStatNumber, type StatDefinition } from "../domain/stats";

type CharacterRow = Record<string, unknown>;

const validGrades: Grade[] = [
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
];

const validDamageTypes: DamageType[] = ["physical", "magical", "common"];

function hasColumn(row: CharacterRow, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(row, key);
}

function requireColumn(row: CharacterRow, key: string): void {
  if (!hasColumn(row, key)) {
    throw new Error(`Missing required column: ${key}`);
  }
}

function stringValue(row: CharacterRow, key: string): string {
  const value = row[key];
  return typeof value === "string" ? value.trim() : "";
}

function optionalBooleanValue(row: CharacterRow, key: string, id: string, fallback: boolean): boolean {
  if (!hasColumn(row, key)) {
    return fallback;
  }

  const normalized = stringValue(row, key).toLowerCase();
  if (normalized.length === 0) {
    return fallback;
  }

  if (normalized === "true" || normalized === "1" || normalized === "y" || normalized === "yes") {
    return true;
  }

  if (normalized === "false" || normalized === "0" || normalized === "n" || normalized === "no") {
    return false;
  }

  throw new Error(`Invalid boolean value for ${key} in ${id}`);
}

function statValue(row: CharacterRow, definition: StatDefinition): number {
  if (hasColumn(row, definition.key)) {
    return normalizeStatNumber(row[definition.key]);
  }

  return normalizeStatNumber(row[definition.label]);
}

function legendaryValue(row: CharacterRow): number {
  if (hasColumn(row, "legendaryValue")) {
    return normalizeStatNumber(row.legendaryValue);
  }

  return normalizeStatNumber(row["몇전설"]);
}

function statsValue(row: CharacterRow, statDefinitions: StatDefinition[]): CharacterStats {
  return statDefinitions.reduce<CharacterStats>(
    (stats, key) => ({
      ...stats,
      [key.key]: statValue(row, key)
    }),
    {} as CharacterStats,
  );
}

function gradeValue(value: string): Grade {
  if (validGrades.includes(value as Grade)) {
    return value as Grade;
  }

  throw new Error(`Invalid grade: ${value}`);
}

function damageTypeValue(value: string): DamageType {
  if (value.length === 0) {
    return "common";
  }

  if (validDamageTypes.includes(value as DamageType)) {
    return value as DamageType;
  }

  throw new Error(`Invalid damageType: ${value}`);
}

export function mapCharacterRow(
  row: CharacterRow,
  statDefinitions: StatDefinition[] = defaultStatDefinitions,
): Character {
  const id = stringValue(row, "id");
  const nameKo = stringValue(row, "nameKo");
  const rawImageKey = stringValue(row, "imageKey");
  const imageUrl = stringValue(row, "imageUrl");
  const imageKey = rawImageKey || (imageUrl ? "" : "placeholder");
  const sortName = stringValue(row, "sortName") || nameKo;

  if (!id) {
    throw new Error("Missing id");
  }

  if (!nameKo) {
    throw new Error(`Missing nameKo for ${id}`);
  }

  return {
    id,
    nameKo,
    grade: gradeValue(stringValue(row, "grade")),
    damageType: damageTypeValue(stringValue(row, "damageType")),
    imageKey,
    imageUrl,
    sortName,
    legendaryValue: legendaryValue(row),
    stats: statsValue(row, statDefinitions),
    isEnabled: optionalBooleanValue(row, "isEnabled", id, true),
    updatedAt: stringValue(row, "updatedAt")
  };
}
