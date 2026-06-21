export type Grade =
  | "special"
  | "rare"
  | "legendary"
  | "hidden"
  | "changed"
  | "transcend"
  | "immortal"
  | "limited"
  | "eternal"
  | "distortion"
  | "specialUnit"
  | "seraphim";

export type DamageType = "physical" | "magical" | "common";
export type DamageFilter = Exclude<DamageType, "common">;

export type CharacterStats = Record<string, number>;

export type Character = {
  id: string;
  nameKo: string;
  grade: Grade;
  damageType: DamageType;
  imageKey: string;
  imageUrl: string;
  sortName: string;
  legendaryValue: number;
  stats: CharacterStats;
  isEnabled: boolean;
  updatedAt: string;
};

export const gradeOrder: Grade[] = [
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
];

export const gradeLabels: Record<Grade, string> = {
  special: "특별",
  rare: "희귀",
  legendary: "전설",
  hidden: "히든",
  changed: "변화",
  transcend: "초월",
  immortal: "불멸",
  limited: "제한",
  eternal: "영원",
  distortion: "왜곡",
  specialUnit: "특수",
  seraphim: "세라핌"
};
