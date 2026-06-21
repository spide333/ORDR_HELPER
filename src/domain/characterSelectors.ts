import type { Character, CharacterStats, DamageFilter, Grade } from "./character";
import { gradeOrder } from "./character";
import { sumStats, type StatDefinition } from "./stats";

export type CharacterGroup = {
  grade: Grade;
  characters: Character[];
};

const koreanCollator = new Intl.Collator("ko-KR");

export function filterCharacters(
  characters: Character[],
  damageType: DamageFilter,
  searchQuery: string,
): Character[] {
  const normalizedQuery = searchQuery.trim();

  return characters.filter((character) => {
    if (!character.isEnabled) {
      return false;
    }

    if (character.damageType !== damageType && character.damageType !== "common") {
      return false;
    }

    if (normalizedQuery.length === 0) {
      return true;
    }

    return character.nameKo.includes(normalizedQuery);
  });
}

export function groupCharactersByGrade(characters: Character[]): CharacterGroup[] {
  return gradeOrder
    .map((grade) => {
      const sortedCharacters = characters
        .filter((character) => character.grade === grade)
        .sort((a, b) => koreanCollator.compare(a.sortName || a.nameKo, b.sortName || b.nameKo));

      return {
        grade,
        characters: sortedCharacters
      };
    })
    .filter((group) => group.characters.length > 0);
}

export function selectedCharacters(characters: Character[], selectedIds: string[]): Character[] {
  const uniqueIds = Array.from(new Set(selectedIds));
  const byId = new Map(characters.map((character) => [character.id, character]));

  return uniqueIds
    .map((id) => byId.get(id))
    .filter((character): character is Character => Boolean(character));
}

export function totalStatsForSelection(
  characters: Character[],
  selectedIds: string[],
  statDefinitions?: StatDefinition[],
): CharacterStats {
  return sumStats(
    selectedCharacters(characters, selectedIds).map((character) => character.stats),
    statDefinitions,
  );
}

export function totalLegendaryValueForSelection(characters: Character[], selectedIds: string[]): number {
  return selectedCharacters(characters, selectedIds).reduce(
    (total, character) => total + character.legendaryValue,
    0,
  );
}

export function resolveCharacterImageUrl(character: Pick<Character, "imageKey" | "imageUrl">): string {
  const explicitUrl = character.imageUrl.trim();
  if (explicitUrl.length > 0) {
    return explicitUrl;
  }

  return `${import.meta.env.BASE_URL}characters/${character.imageKey}.svg`;
}
