import type { Character, DamageType, Grade } from "../domain/character";
import { emptyStats } from "../domain/stats";
import localCharacterSeeds from "./localCharacterSeeds.json";

type LocalCharacterSeed = {
  id: string;
  nameKo: string;
  grade: Grade;
  damageType: DamageType;
  sortName: string;
  legendaryValue: number;
};

export const localCharacters: Character[] = (localCharacterSeeds as LocalCharacterSeed[]).map((seed) => ({
  id: seed.id,
  nameKo: seed.nameKo,
  grade: seed.grade,
  damageType: seed.damageType,
  imageKey: "placeholder",
  imageUrl: "",
  sortName: seed.sortName,
  legendaryValue: seed.legendaryValue,
  stats: emptyStats(),
  isEnabled: true,
  updatedAt: ""
}));
