import { create } from "zustand";
import type { Character, CharacterStats, DamageFilter } from "../domain/character";
import {
  filterCharacters,
  groupCharactersByGrade,
  selectedCharacters,
  totalLegendaryValueForSelection,
  totalStatsForSelection,
  type CharacterGroup
} from "../domain/characterSelectors";
import { defaultStatDefinitions, type StatDefinition } from "../domain/stats";
import { localCharacters } from "../data/localCharacters";

type LoadStatus = "idle" | "loading" | "success" | "error";
type CharacterLoadResult =
  | Character[]
  | {
      characters: Character[];
      statDefinitions?: StatDefinition[];
    };

type CharacterState = {
  characters: Character[];
  damageType: DamageFilter;
  searchQuery: string;
  selectedCharacterIds: string[];
  loadStatus: LoadStatus;
  loadRequestId: number;
  errorMessage: string;
  statDefinitions: StatDefinition[];
  filteredCharacters: Character[];
  groupedCharacters: CharacterGroup[];
  selectedCharacters: Character[];
  totalStats: CharacterStats;
  selectedLegendaryValue: number;
  loadCharacters: (loader: () => Promise<CharacterLoadResult>) => Promise<void>;
  setLocalCharacters: (characters: Character[]) => void;
  setDamageType: (damageType: DamageFilter) => void;
  setSearchQuery: (searchQuery: string) => void;
  toggleCharacter: (characterId: string) => void;
  resetSelection: () => void;
};

function deriveState(
  state: Pick<CharacterState, "characters" | "damageType" | "searchQuery" | "selectedCharacterIds" | "statDefinitions">,
) {
  const filtered = filterCharacters(state.characters, state.damageType, state.searchQuery);
  const selected = selectedCharacters(state.characters, state.selectedCharacterIds);

  return {
    filteredCharacters: filtered,
    groupedCharacters: groupCharactersByGrade(filtered),
    selectedCharacters: selected,
    totalStats: totalStatsForSelection(state.characters, state.selectedCharacterIds, state.statDefinitions),
    selectedLegendaryValue: totalLegendaryValueForSelection(state.characters, state.selectedCharacterIds)
  };
}

const initialCoreState = {
  characters: localCharacters,
  damageType: "physical" as DamageFilter,
  searchQuery: "",
  selectedCharacterIds: [],
  loadStatus: "idle" as LoadStatus,
  loadRequestId: 0,
  errorMessage: "",
  statDefinitions: defaultStatDefinitions
};
const initialDerivedState = deriveState(initialCoreState);

export const useCharacterStore = create<CharacterState>((set, get) => ({
  ...initialCoreState,
  ...initialDerivedState,

  async loadCharacters(loader) {
    const requestId = get().loadRequestId + 1;
    set({ loadStatus: "loading", errorMessage: "", loadRequestId: requestId });

    try {
      const result = await loader();
      if (get().loadRequestId !== requestId) {
        return;
      }

      const characters = Array.isArray(result) ? result : result.characters;
      const statDefinitions = Array.isArray(result)
        ? defaultStatDefinitions
        : (result.statDefinitions ?? defaultStatDefinitions);
      const availableIds = new Set(characters.map((character) => character.id));
      const selectedCharacterIds = get().selectedCharacterIds.filter((id) => availableIds.has(id));
      const nextCore = {
        ...get(),
        characters,
        statDefinitions,
        selectedCharacterIds,
        loadStatus: "success" as LoadStatus,
        errorMessage: ""
      };

      set({
        characters,
        statDefinitions,
        selectedCharacterIds,
        loadStatus: "success",
        errorMessage: "",
        ...deriveState(nextCore)
      });
    } catch (error) {
      if (get().loadRequestId !== requestId) {
        return;
      }

      set({
        loadStatus: "error",
        errorMessage: error instanceof Error ? error.message : "Unknown error"
      });
    }
  },

  setLocalCharacters(characters) {
    const availableIds = new Set(characters.map((character) => character.id));
    const selectedCharacterIds = get().selectedCharacterIds.filter((id) => availableIds.has(id));
    const nextCore = {
      ...get(),
      characters,
      selectedCharacterIds
    };

    set({
      characters,
      selectedCharacterIds,
      ...deriveState(nextCore)
    });
  },

  setDamageType(damageType) {
    if (get().damageType === damageType) {
      return;
    }

    const nextCore = {
      ...get(),
      damageType,
      selectedCharacterIds: []
    };

    set({
      damageType,
      selectedCharacterIds: [],
      ...deriveState(nextCore)
    });
  },

  setSearchQuery(searchQuery) {
    const nextCore = {
      ...get(),
      searchQuery
    };

    set({
      searchQuery,
      ...deriveState(nextCore)
    });
  },

  toggleCharacter(characterId) {
    const current = get().selectedCharacterIds;
    const isSelected = current.includes(characterId);

    if (!isSelected && !get().filteredCharacters.some((character) => character.id === characterId)) {
      return;
    }

    const selectedCharacterIds = isSelected
      ? current.filter((id) => id !== characterId)
      : [...current, characterId];
    const nextCore = {
      ...get(),
      selectedCharacterIds
    };

    set({
      selectedCharacterIds,
      ...deriveState(nextCore)
    });
  },

  resetSelection() {
    const nextCore = {
      ...get(),
      selectedCharacterIds: []
    };

    set({
      selectedCharacterIds: [],
      ...deriveState(nextCore)
    });
  }
}));
