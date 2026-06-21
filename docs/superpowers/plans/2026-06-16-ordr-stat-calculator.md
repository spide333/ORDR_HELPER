# ORDR Stat Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the ORDR PWA that reads public Google Sheets character data, filters by physical/magical damage mode, lets users select owned characters, and shows total owned stats.

**Architecture:** Use a small clean frontend architecture: domain logic in `src/domain`, Google Sheets loading/parsing in `src/data`, shared app state in `src/store`, and React UI in `src/components`. The UI is a single-screen PWA with a top damage toggle, grouped character grid, selected mini-grid, and bottom fixed stat summary.

**Tech Stack:** Vite, React, TypeScript, Zustand, Papa Parse, Vitest, Testing Library, CSS Modules, vite-plugin-pwa.

---

## Commit Rule

This repository's instructions require user confirmation before every commit and push. Every task includes a commit step, but the implementer must stop and ask the user before running `git commit`.

## File Structure

- Create `package.json`: npm scripts and dependencies.
- Create `index.html`: Vite entry document.
- Create `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`: TypeScript configuration.
- Create `vite.config.ts`: React, Vitest, and PWA configuration.
- Create `vitest.setup.ts`: Testing Library matcher setup.
- Create `.env.example`: documents the public Google Sheets CSV URL env var.
- Create `public/characters/.gitkeep`: keeps the local thumbnail directory.
- Create `public/icons/app.svg`: simple PWA icon source.
- Create `src/main.tsx`: React entrypoint.
- Create `src/App.tsx`, `src/App.module.css`: main screen composition.
- Create `src/vite-env.d.ts`: Vite type references.
- Create `src/styles/global.css`: global reset and app background.
- Create `src/domain/character.ts`: shared domain types and grade metadata.
- Create `src/domain/stats.ts`: stat normalization and summing.
- Create `src/domain/stats.test.ts`: stat behavior tests.
- Create `src/domain/characterSelectors.ts`: filtering, grouping, sorting, and image URL helpers.
- Create `src/domain/characterSelectors.test.ts`: selector tests.
- Create `src/data/characterMapper.ts`: Google Sheets row to domain mapper.
- Create `src/data/googleSheetsRepository.ts`: public CSV loading.
- Create `src/data/googleSheetsRepository.test.ts`: parser/repository tests.
- Create `src/store/useCharacterStore.ts`: app state and actions.
- Create `src/store/useCharacterStore.test.ts`: state behavior tests.
- Create `src/components/TopBar.tsx`, `src/components/TopBar.module.css`: title, damage toggle, search.
- Create `src/components/SubBar.tsx`, `src/components/SubBar.module.css`: counts and reset button.
- Create `src/components/CharacterGrid.tsx`, `src/components/CharacterGrid.module.css`: grouped list.
- Create `src/components/CharacterCard.tsx`, `src/components/CharacterCard.module.css`: thumbnail card.
- Create `src/components/BottomDock.tsx`, `src/components/BottomDock.module.css`: selected mini-grid and total stats.
- Create `src/components/StateViews.tsx`, `src/components/StateViews.module.css`: loading, error, empty states.

---

### Task 1: Project Foundation

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `vitest.setup.ts`
- Create: `.env.example`
- Create: `public/characters/.gitkeep`
- Create: `public/icons/app.svg`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/vite-env.d.ts`
- Create: `src/styles/global.css`

- [ ] **Step 1: Create package configuration**

```json
{
  "name": "ordr-stat-calculator",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "tsc -b && vite build",
    "preview": "vite preview --host 0.0.0.0",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "papaparse": "^5.5.3",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.3.0",
    "@types/papaparse": "^5.3.16",
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "jsdom": "^26.1.0",
    "typescript": "^5.8.0",
    "vite": "^7.0.0",
    "vite-plugin-pwa": "^1.0.0",
    "vitest": "^3.2.0"
  }
}
```

- [ ] **Step 2: Create TypeScript and Vite configuration**

`tsconfig.json`:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

`tsconfig.app.json`:

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

`tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noEmit": true
  },
  "include": ["vite.config.ts"]
}
```

`vite.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "ORDR 보유 스탯 계산기",
        short_name: "ORDR",
        description: "원랜디 캐릭터 보유 스탯 합계 계산기",
        theme_color: "#161b24",
        background_color: "#eef1f5",
        display: "standalone",
        icons: [
          {
            src: "/icons/app.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      }
    })
  ],
  test: {
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts"
  }
});
```

`vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: Create static entry files**

`index.html`:

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#161b24" />
    <title>ORDR 보유 스탯 계산기</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`.env.example`:

```bash
VITE_GOOGLE_SHEET_CSV_URL=/sample-characters.csv
```

`public/icons/app.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#161b24"/>
  <text x="256" y="298" text-anchor="middle" font-family="Arial, sans-serif" font-size="124" font-weight="800" fill="#ffffff">ORDR</text>
</svg>
```

`public/characters/.gitkeep`:

```text
```

- [ ] **Step 4: Create minimal React entry**

`src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
```

`src/styles/global.css`:

```css
:root {
  color: #161b24;
  background: #eef1f5;
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

button,
input {
  font: inherit;
}
```

`src/App.tsx`:

```tsx
export function App() {
  return <main>ORDR</main>;
}
```

`src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 5: Install dependencies and verify foundation**

Run:

```bash
npm install
npm run test
npm run build
```

Expected:

```text
Test Files  no tests
vite build completes successfully
```

- [ ] **Step 6: Commit after user confirmation**

Ask the user: `프로젝트 기반 설정을 커밋할까요?`

After approval, run:

```bash
git add package.json package-lock.json index.html tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts vitest.setup.ts .env.example public src
git commit -m "프로젝트 기반 설정"
```

---

### Task 2: Domain Types and Stat Math

**Files:**
- Create: `src/domain/character.ts`
- Create: `src/domain/stats.ts`
- Create: `src/domain/stats.test.ts`

- [ ] **Step 1: Write failing stat tests**

`src/domain/stats.test.ts`:

```ts
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
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
npm run test -- src/domain/stats.test.ts
```

Expected:

```text
FAIL src/domain/stats.test.ts
Cannot find module './stats'
```

- [ ] **Step 3: Implement domain types**

`src/domain/character.ts`:

```ts
export type Grade =
  | "legendary"
  | "hidden"
  | "transcend"
  | "immortal"
  | "limited"
  | "eternal"
  | "distortion";

export type DamageType = "physical" | "magical";

export type CharacterStats = {
  attack: number;
  magicAttack: number;
  armorReduction: number;
  bossDamage: number;
  stun: number;
  slow: number;
  manaRegen: number;
};

export type Character = {
  id: string;
  nameKo: string;
  grade: Grade;
  damageType: DamageType;
  imageKey: string;
  imageUrl: string;
  sortName: string;
  stats: CharacterStats;
  isEnabled: boolean;
  updatedAt: string;
};

export const gradeOrder: Grade[] = [
  "legendary",
  "hidden",
  "transcend",
  "immortal",
  "limited",
  "eternal",
  "distortion"
];

export const gradeLabels: Record<Grade, string> = {
  legendary: "전설",
  hidden: "히든",
  transcend: "초월",
  immortal: "불멸",
  limited: "제한",
  eternal: "영원",
  distortion: "왜곡"
};
```

`src/domain/stats.ts`:

```ts
import type { CharacterStats } from "./character";

export function emptyStats(): CharacterStats {
  return {
    attack: 0,
    magicAttack: 0,
    armorReduction: 0,
    bossDamage: 0,
    stun: 0,
    slow: 0,
    manaRegen: 0
  };
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

export function sumStats(statsList: CharacterStats[]): CharacterStats {
  return statsList.reduce<CharacterStats>(
    (total, stats) => ({
      attack: total.attack + stats.attack,
      magicAttack: total.magicAttack + stats.magicAttack,
      armorReduction: total.armorReduction + stats.armorReduction,
      bossDamage: total.bossDamage + stats.bossDamage,
      stun: total.stun + stats.stun,
      slow: total.slow + stats.slow,
      manaRegen: total.manaRegen + stats.manaRegen
    }),
    emptyStats(),
  );
}
```

- [ ] **Step 4: Run tests to verify pass**

Run:

```bash
npm run test -- src/domain/stats.test.ts
```

Expected:

```text
PASS src/domain/stats.test.ts
```

- [ ] **Step 5: Commit after user confirmation**

Ask the user: `도메인 타입과 스탯 계산 로직을 커밋할까요?`

After approval, run:

```bash
git add src/domain
git commit -m "도메인 타입과 스탯 계산 추가"
```

---

### Task 3: Filtering, Grouping, Sorting, and Image Resolution

**Files:**
- Create: `src/domain/characterSelectors.ts`
- Create: `src/domain/characterSelectors.test.ts`

- [ ] **Step 1: Write failing selector tests**

`src/domain/characterSelectors.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Character } from "./character";
import {
  filterCharacters,
  groupCharactersByGrade,
  resolveCharacterImageUrl,
  selectedCharacters,
  totalStatsForSelection
} from "./characterSelectors";

const baseCharacter: Character = {
  id: "base",
  nameKo: "기본",
  grade: "legendary",
  damageType: "physical",
  imageKey: "base",
  imageUrl: "/characters/base.webp",
  sortName: "기본",
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
  { ...baseCharacter, id: "nami", nameKo: "나미", sortName: "나미", grade: "transcend", damageType: "magical" },
  { ...baseCharacter, id: "disabled", nameKo: "비활성", sortName: "비활성", grade: "hidden", isEnabled: false }
];

describe("filterCharacters", () => {
  it("filters enabled characters by damage type and search query", () => {
    expect(filterCharacters(characters, "physical", "").map((character) => character.id)).toEqual([
      "roger",
      "garp",
      "zoro"
    ]);

    expect(filterCharacters(characters, "physical", "로").map((character) => character.id)).toEqual([
      "roger",
      "zoro"
    ]);
  });
});

describe("groupCharactersByGrade", () => {
  it("uses grade order and Korean name sorting inside groups", () => {
    const groups = groupCharactersByGrade(filterCharacters(characters, "physical", ""));

    expect(groups.map((group) => group.grade)).toEqual(["transcend", "immortal"]);
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
});

describe("resolveCharacterImageUrl", () => {
  it("prefers explicit imageUrl and falls back to imageKey", () => {
    expect(resolveCharacterImageUrl({ ...baseCharacter, imageUrl: "/custom/roger.webp", imageKey: "roger" })).toBe(
      "/custom/roger.webp",
    );

    expect(resolveCharacterImageUrl({ ...baseCharacter, imageUrl: "", imageKey: "zoro" })).toBe(
      "/characters/zoro.webp",
    );
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
npm run test -- src/domain/characterSelectors.test.ts
```

Expected:

```text
FAIL src/domain/characterSelectors.test.ts
Cannot find module './characterSelectors'
```

- [ ] **Step 3: Implement selectors**

`src/domain/characterSelectors.ts`:

```ts
import type { Character, CharacterStats, DamageType, Grade } from "./character";
import { gradeOrder } from "./character";
import { sumStats } from "./stats";

export type CharacterGroup = {
  grade: Grade;
  characters: Character[];
};

const koreanCollator = new Intl.Collator("ko-KR");

export function filterCharacters(
  characters: Character[],
  damageType: DamageType,
  searchQuery: string,
): Character[] {
  const normalizedQuery = searchQuery.trim();

  return characters.filter((character) => {
    if (!character.isEnabled) {
      return false;
    }

    if (character.damageType !== damageType) {
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

export function totalStatsForSelection(characters: Character[], selectedIds: string[]): CharacterStats {
  return sumStats(selectedCharacters(characters, selectedIds).map((character) => character.stats));
}

export function resolveCharacterImageUrl(character: Pick<Character, "imageKey" | "imageUrl">): string {
  const explicitUrl = character.imageUrl.trim();
  if (explicitUrl.length > 0) {
    return explicitUrl;
  }

  return `/characters/${character.imageKey}.webp`;
}
```

- [ ] **Step 4: Run tests to verify pass**

Run:

```bash
npm run test -- src/domain/characterSelectors.test.ts
```

Expected:

```text
PASS src/domain/characterSelectors.test.ts
```

- [ ] **Step 5: Commit after user confirmation**

Ask the user: `필터링과 정렬 로직을 커밋할까요?`

After approval, run:

```bash
git add src/domain/characterSelectors.ts src/domain/characterSelectors.test.ts
git commit -m "캐릭터 필터링과 정렬 추가"
```

---

### Task 4: Google Sheets CSV Data Layer

**Files:**
- Create: `src/data/characterMapper.ts`
- Create: `src/data/googleSheetsRepository.ts`
- Create: `src/data/googleSheetsRepository.test.ts`

- [ ] **Step 1: Write failing data tests**

`src/data/googleSheetsRepository.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { mapCharacterRow } from "./characterMapper";
import { loadCharactersFromCsvUrl } from "./googleSheetsRepository";

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
        grade: "rare",
        damageType: "physical",
        imageKey: "bad",
        isEnabled: "TRUE"
      }),
    ).toThrow("Invalid grade");
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
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
npm run test -- src/data/googleSheetsRepository.test.ts
```

Expected:

```text
FAIL src/data/googleSheetsRepository.test.ts
Cannot find module './characterMapper'
```

- [ ] **Step 3: Implement row mapper**

`src/data/characterMapper.ts`:

```ts
import type { Character, DamageType, Grade } from "../domain/character";
import { normalizeStatNumber } from "../domain/stats";

type CharacterRow = Record<string, unknown>;

const validGrades: Grade[] = [
  "legendary",
  "hidden",
  "transcend",
  "immortal",
  "limited",
  "eternal",
  "distortion"
];

const validDamageTypes: DamageType[] = ["physical", "magical"];

function stringValue(row: CharacterRow, key: string): string {
  const value = row[key];
  return typeof value === "string" ? value.trim() : "";
}

function booleanValue(row: CharacterRow, key: string): boolean {
  const normalized = stringValue(row, key).toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "y" || normalized === "yes";
}

function gradeValue(value: string): Grade {
  if (validGrades.includes(value as Grade)) {
    return value as Grade;
  }

  throw new Error(`Invalid grade: ${value}`);
}

function damageTypeValue(value: string): DamageType {
  if (validDamageTypes.includes(value as DamageType)) {
    return value as DamageType;
  }

  throw new Error(`Invalid damageType: ${value}`);
}

export function mapCharacterRow(row: CharacterRow): Character {
  const id = stringValue(row, "id");
  const nameKo = stringValue(row, "nameKo");
  const imageKey = stringValue(row, "imageKey");
  const sortName = stringValue(row, "sortName") || nameKo;

  if (!id) {
    throw new Error("Missing id");
  }

  if (!nameKo) {
    throw new Error(`Missing nameKo for ${id}`);
  }

  if (!imageKey) {
    throw new Error(`Missing imageKey for ${id}`);
  }

  return {
    id,
    nameKo,
    grade: gradeValue(stringValue(row, "grade")),
    damageType: damageTypeValue(stringValue(row, "damageType")),
    imageKey,
    imageUrl: stringValue(row, "imageUrl"),
    sortName,
    stats: {
      attack: normalizeStatNumber(row.attack),
      magicAttack: normalizeStatNumber(row.magicAttack),
      armorReduction: normalizeStatNumber(row.armorReduction),
      bossDamage: normalizeStatNumber(row.bossDamage),
      stun: normalizeStatNumber(row.stun),
      slow: normalizeStatNumber(row.slow),
      manaRegen: normalizeStatNumber(row.manaRegen)
    },
    isEnabled: booleanValue(row, "isEnabled"),
    updatedAt: stringValue(row, "updatedAt")
  };
}
```

- [ ] **Step 4: Implement CSV repository**

`src/data/googleSheetsRepository.ts`:

```ts
import Papa from "papaparse";
import type { Character } from "../domain/character";
import { mapCharacterRow } from "./characterMapper";

type FetchLike = (input: string) => Promise<Pick<Response, "ok" | "status" | "text">>;

export async function loadCharactersFromCsvUrl(
  csvUrl: string,
  fetcher: FetchLike = fetch,
): Promise<Character[]> {
  const response = await fetcher(csvUrl);

  if (!response.ok) {
    throw new Error(`Failed to load Google Sheets CSV: ${response.status}`);
  }

  const csv = await response.text();
  const parsed = Papa.parse<Record<string, unknown>>(csv, {
    header: true,
    skipEmptyLines: true
  });

  if (parsed.errors.length > 0) {
    throw new Error(`Failed to parse Google Sheets CSV: ${parsed.errors[0].message}`);
  }

  return parsed.data.map(mapCharacterRow);
}
```

- [ ] **Step 5: Run tests to verify pass**

Run:

```bash
npm run test -- src/data/googleSheetsRepository.test.ts
```

Expected:

```text
PASS src/data/googleSheetsRepository.test.ts
```

- [ ] **Step 6: Commit after user confirmation**

Ask the user: `Google Sheets 데이터 로딩 로직을 커밋할까요?`

After approval, run:

```bash
git add src/data
git commit -m "구글 시트 데이터 로딩 추가"
```

---

### Task 5: Zustand App Store

**Files:**
- Create: `src/store/useCharacterStore.ts`
- Create: `src/store/useCharacterStore.test.ts`

- [ ] **Step 1: Write failing store tests**

`src/store/useCharacterStore.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Character } from "../domain/character";
import { useCharacterStore } from "./useCharacterStore";

const character: Character = {
  id: "roger",
  nameKo: "로져",
  grade: "immortal",
  damageType: "physical",
  imageKey: "roger",
  imageUrl: "",
  sortName: "로져",
  stats: {
    attack: 10,
    magicAttack: 0,
    armorReduction: 2,
    bossDamage: 5,
    stun: 0,
    slow: 0,
    manaRegen: 0
  },
  isEnabled: true,
  updatedAt: "2026-06-16"
};

beforeEach(() => {
  useCharacterStore.setState(useCharacterStore.getInitialState(), true);
});

describe("useCharacterStore", () => {
  it("loads characters and computes selected totals", async () => {
    await useCharacterStore.getState().loadCharacters(async () => [character]);

    useCharacterStore.getState().toggleCharacter("roger");

    expect(useCharacterStore.getState().selectedCharacterIds).toEqual(["roger"]);
    expect(useCharacterStore.getState().totalStats.attack).toBe(10);
  });

  it("clears selection when damage type changes", async () => {
    await useCharacterStore.getState().loadCharacters(async () => [character]);

    useCharacterStore.getState().toggleCharacter("roger");
    useCharacterStore.getState().setDamageType("magical");

    expect(useCharacterStore.getState().damageType).toBe("magical");
    expect(useCharacterStore.getState().selectedCharacterIds).toEqual([]);
    expect(useCharacterStore.getState().totalStats.attack).toBe(0);
  });

  it("keeps selection when the same damage type is selected again", async () => {
    await useCharacterStore.getState().loadCharacters(async () => [character]);

    useCharacterStore.getState().toggleCharacter("roger");
    useCharacterStore.getState().setDamageType("physical");

    expect(useCharacterStore.getState().damageType).toBe("physical");
    expect(useCharacterStore.getState().selectedCharacterIds).toEqual(["roger"]);
  });

  it("resets selection manually", async () => {
    await useCharacterStore.getState().loadCharacters(async () => [character]);

    useCharacterStore.getState().toggleCharacter("roger");
    useCharacterStore.getState().resetSelection();

    expect(useCharacterStore.getState().selectedCharacterIds).toEqual([]);
  });

  it("records load errors", async () => {
    const load = vi.fn().mockRejectedValue(new Error("network"));

    await useCharacterStore.getState().loadCharacters(load);

    expect(useCharacterStore.getState().loadStatus).toBe("error");
    expect(useCharacterStore.getState().errorMessage).toBe("network");
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
npm run test -- src/store/useCharacterStore.test.ts
```

Expected:

```text
FAIL src/store/useCharacterStore.test.ts
Cannot find module './useCharacterStore'
```

- [ ] **Step 3: Implement store**

`src/store/useCharacterStore.ts`:

```ts
import { create } from "zustand";
import type { Character, CharacterStats, DamageType } from "../domain/character";
import {
  filterCharacters,
  groupCharactersByGrade,
  selectedCharacters,
  totalStatsForSelection,
  type CharacterGroup
} from "../domain/characterSelectors";
import { emptyStats } from "../domain/stats";

type LoadStatus = "idle" | "loading" | "success" | "error";

type CharacterState = {
  characters: Character[];
  damageType: DamageType;
  searchQuery: string;
  selectedCharacterIds: string[];
  loadStatus: LoadStatus;
  errorMessage: string;
  filteredCharacters: Character[];
  groupedCharacters: CharacterGroup[];
  selectedCharacters: Character[];
  totalStats: CharacterStats;
  loadCharacters: (loader: () => Promise<Character[]>) => Promise<void>;
  setDamageType: (damageType: DamageType) => void;
  setSearchQuery: (searchQuery: string) => void;
  toggleCharacter: (characterId: string) => void;
  resetSelection: () => void;
};

function deriveState(state: Pick<CharacterState, "characters" | "damageType" | "searchQuery" | "selectedCharacterIds">) {
  const filtered = filterCharacters(state.characters, state.damageType, state.searchQuery);
  const selected = selectedCharacters(state.characters, state.selectedCharacterIds);

  return {
    filteredCharacters: filtered,
    groupedCharacters: groupCharactersByGrade(filtered),
    selectedCharacters: selected,
    totalStats: totalStatsForSelection(state.characters, state.selectedCharacterIds)
  };
}

const initialCoreState = {
  characters: [],
  damageType: "physical" as DamageType,
  searchQuery: "",
  selectedCharacterIds: [],
  loadStatus: "idle" as LoadStatus,
  errorMessage: ""
};

export const useCharacterStore = create<CharacterState>((set, get) => ({
  ...initialCoreState,
  filteredCharacters: [],
  groupedCharacters: [],
  selectedCharacters: [],
  totalStats: emptyStats(),

  async loadCharacters(loader) {
    set({ loadStatus: "loading", errorMessage: "" });

    try {
      const characters = await loader();
      const nextCore = {
        ...get(),
        characters,
        selectedCharacterIds: [],
        loadStatus: "success" as LoadStatus,
        errorMessage: ""
      };

      set({
        characters,
        selectedCharacterIds: [],
        loadStatus: "success",
        errorMessage: "",
        ...deriveState(nextCore)
      });
    } catch (error) {
      set({
        loadStatus: "error",
        errorMessage: error instanceof Error ? error.message : "Unknown error"
      });
    }
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
    const selectedCharacterIds = current.includes(characterId)
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
```

- [ ] **Step 4: Run tests to verify pass**

Run:

```bash
npm run test -- src/store/useCharacterStore.test.ts
```

Expected:

```text
PASS src/store/useCharacterStore.test.ts
```

- [ ] **Step 5: Commit after user confirmation**

Ask the user: `앱 상태 관리 로직을 커밋할까요?`

After approval, run:

```bash
git add src/store
git commit -m "캐릭터 선택 상태 관리 추가"
```

---

### Task 6: UI Components

**Files:**
- Modify: `src/App.tsx`
- Create: `src/App.module.css`
- Create: `src/components/TopBar.tsx`
- Create: `src/components/TopBar.module.css`
- Create: `src/components/SubBar.tsx`
- Create: `src/components/SubBar.module.css`
- Create: `src/components/CharacterCard.tsx`
- Create: `src/components/CharacterCard.module.css`
- Create: `src/components/CharacterGrid.tsx`
- Create: `src/components/CharacterGrid.module.css`
- Create: `src/components/BottomDock.tsx`
- Create: `src/components/BottomDock.module.css`
- Create: `src/components/StateViews.tsx`
- Create: `src/components/StateViews.module.css`

- [ ] **Step 1: Write component smoke test**

Create `src/App.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";
import { useCharacterStore } from "./store/useCharacterStore";

beforeEach(() => {
  useCharacterStore.setState({
    ...useCharacterStore.getInitialState(),
    loadStatus: "success",
    characters: [],
    filteredCharacters: [],
    groupedCharacters: [],
    selectedCharacters: []
  }, true);
});

describe("App", () => {
  it("renders the top damage toggle and bottom total area", () => {
    render(<App />);

    expect(screen.getByText("ORDR")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "물뎀" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "마뎀" })).toBeInTheDocument();
    expect(screen.getByText("전체 보유 스탯 합")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
npm run test -- src/App.test.tsx
```

Expected:

```text
FAIL src/App.test.tsx
Unable to find an element with the text: 전체 보유 스탯 합
```

- [ ] **Step 3: Implement UI components**

`src/components/TopBar.tsx`:

```tsx
import type { DamageType } from "../domain/character";
import styles from "./TopBar.module.css";

type TopBarProps = {
  damageType: DamageType;
  searchQuery: string;
  onDamageTypeChange: (damageType: DamageType) => void;
  onSearchQueryChange: (searchQuery: string) => void;
};

export function TopBar({ damageType, searchQuery, onDamageTypeChange, onSearchQueryChange }: TopBarProps) {
  return (
    <header className={styles.topBar}>
      <div className={styles.brand}>ORDR</div>
      <div className={styles.damageToggle} aria-label="데미지 타입">
        <button
          type="button"
          className={damageType === "physical" ? styles.active : undefined}
          onClick={() => onDamageTypeChange("physical")}
        >
          물뎀
        </button>
        <button
          type="button"
          className={damageType === "magical" ? styles.active : undefined}
          onClick={() => onDamageTypeChange("magical")}
        >
          마뎀
        </button>
      </div>
      <input
        className={styles.search}
        aria-label="캐릭터 검색"
        placeholder="검색"
        value={searchQuery}
        onChange={(event) => onSearchQueryChange(event.target.value)}
      />
    </header>
  );
}
```

`src/components/SubBar.tsx`:

```tsx
import styles from "./SubBar.module.css";

type SubBarProps = {
  visibleCount: number;
  selectedCount: number;
  onResetSelection: () => void;
};

export function SubBar({ visibleCount, selectedCount, onResetSelection }: SubBarProps) {
  const isResetDisabled = selectedCount === 0;

  function handleReset() {
    if (isResetDisabled) {
      return;
    }

    if (window.confirm("선택된 캐릭터를 모두 초기화할까요?")) {
      onResetSelection();
    }
  }

  return (
    <div className={styles.subBar}>
      <span>현재 목록 {visibleCount}명 · 선택 {selectedCount}명</span>
      <button type="button" aria-label="선택 초기화" disabled={isResetDisabled} onClick={handleReset}>
        ↻
      </button>
    </div>
  );
}
```

`src/components/CharacterCard.tsx`:

```tsx
import type { Character } from "../domain/character";
import { gradeLabels } from "../domain/character";
import { resolveCharacterImageUrl } from "../domain/characterSelectors";
import styles from "./CharacterCard.module.css";

type CharacterCardProps = {
  character: Character;
  selected: boolean;
  onToggle: (characterId: string) => void;
};

export function CharacterCard({ character, selected, onToggle }: CharacterCardProps) {
  const initial = character.nameKo.slice(0, 1);

  return (
    <button
      type="button"
      className={`${styles.card} ${styles[character.grade]}`}
      aria-pressed={selected}
      onClick={() => onToggle(character.id)}
    >
      {selected ? <span className={styles.check}>✓</span> : null}
      <span className={styles.thumbnailWrap}>
        <img
          className={styles.thumbnail}
          src={resolveCharacterImageUrl(character)}
          alt=""
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
        <span className={styles.fallback}>{initial}</span>
      </span>
      <span className={styles.body}>
        <span className={styles.name}>{character.nameKo}</span>
        <span className={styles.grade}>{gradeLabels[character.grade]}</span>
      </span>
    </button>
  );
}
```

`src/components/CharacterGrid.tsx`:

```tsx
import { gradeLabels } from "../domain/character";
import type { CharacterGroup } from "../domain/characterSelectors";
import { CharacterCard } from "./CharacterCard";
import styles from "./CharacterGrid.module.css";

type CharacterGridProps = {
  groups: CharacterGroup[];
  selectedIds: string[];
  onToggleCharacter: (characterId: string) => void;
};

export function CharacterGrid({ groups, selectedIds, onToggleCharacter }: CharacterGridProps) {
  return (
    <div className={styles.groups}>
      {groups.map((group) => (
        <section key={group.grade} className={styles.group}>
          <header className={styles.groupHeader}>
            <strong>{gradeLabels[group.grade]}</strong>
            <span>가나다순</span>
          </header>
          <div className={styles.grid}>
            {group.characters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                selected={selectedIds.includes(character.id)}
                onToggle={onToggleCharacter}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
```

`src/components/BottomDock.tsx`:

```tsx
import type { Character, CharacterStats } from "../domain/character";
import { resolveCharacterImageUrl } from "../domain/characterSelectors";
import styles from "./BottomDock.module.css";

type BottomDockProps = {
  selectedCharacters: Character[];
  totalStats: CharacterStats;
};

export function BottomDock({ selectedCharacters, totalStats }: BottomDockProps) {
  return (
    <aside className={styles.dock}>
      <div className={styles.selectedStrip}>
        <div className={styles.stripHeader}>
          <span>선택된 캐릭터</span>
          <span>{selectedCharacters.length}명</span>
        </div>
        <div className={styles.selectedGrid}>
          {selectedCharacters.map((character) => (
            <div key={character.id} className={styles.mini}>
              <img
                src={resolveCharacterImageUrl(character)}
                alt=""
                onError={(event) => {
                  event.currentTarget.style.visibility = "hidden";
                }}
              />
              <span>{character.nameKo}</span>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.stats}>
        <div>
          <div className={styles.label}>전체 보유 스탯 합</div>
          <div className={styles.total}>
            {totalStats.attack + totalStats.magicAttack + totalStats.armorReduction + totalStats.bossDamage + totalStats.stun + totalStats.slow + totalStats.manaRegen}
          </div>
        </div>
        <div className={styles.statsGrid}>
          <span>공격 {totalStats.attack}</span>
          <span>마공 {totalStats.magicAttack}</span>
          <span>방깎 {totalStats.armorReduction}</span>
          <span>보딜 {totalStats.bossDamage}</span>
          <span>스턴 {totalStats.stun}</span>
          <span>이감 {totalStats.slow}</span>
          <span>마젠 {totalStats.manaRegen}</span>
        </div>
      </div>
    </aside>
  );
}
```

`src/components/StateViews.tsx`:

```tsx
import styles from "./StateViews.module.css";

export function LoadingView() {
  return <div className={styles.state}>데이터를 불러오는 중입니다.</div>;
}

export function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className={styles.state}>
      <p>{message}</p>
      <button type="button" onClick={onRetry}>다시 시도</button>
    </div>
  );
}

export function EmptyView() {
  return <div className={styles.state}>조건에 맞는 캐릭터가 없습니다.</div>;
}
```

`src/App.tsx`:

```tsx
import { useEffect } from "react";
import { BottomDock } from "./components/BottomDock";
import { CharacterGrid } from "./components/CharacterGrid";
import { EmptyView, ErrorView, LoadingView } from "./components/StateViews";
import { SubBar } from "./components/SubBar";
import { TopBar } from "./components/TopBar";
import { loadCharactersFromCsvUrl } from "./data/googleSheetsRepository";
import { useCharacterStore } from "./store/useCharacterStore";
import styles from "./App.module.css";

const sheetCsvUrl = import.meta.env.VITE_GOOGLE_SHEET_CSV_URL as string | undefined;

export function App() {
  const {
    damageType,
    searchQuery,
    selectedCharacterIds,
    loadStatus,
    errorMessage,
    filteredCharacters,
    groupedCharacters,
    selectedCharacters,
    totalStats,
    loadCharacters,
    setDamageType,
    setSearchQuery,
    toggleCharacter,
    resetSelection
  } = useCharacterStore();

  useEffect(() => {
    if (!sheetCsvUrl) {
      return;
    }

    void loadCharacters(() => loadCharactersFromCsvUrl(sheetCsvUrl));
  }, [loadCharacters]);

  function retryLoad() {
    if (sheetCsvUrl) {
      void loadCharacters(() => loadCharactersFromCsvUrl(sheetCsvUrl));
    }
  }

  return (
    <main className={styles.appShell}>
      <TopBar
        damageType={damageType}
        searchQuery={searchQuery}
        onDamageTypeChange={setDamageType}
        onSearchQueryChange={setSearchQuery}
      />
      <SubBar
        visibleCount={filteredCharacters.length}
        selectedCount={selectedCharacterIds.length}
        onResetSelection={resetSelection}
      />
      <section className={styles.content}>
        {!sheetCsvUrl ? <ErrorView message="Google Sheets CSV URL이 설정되지 않았습니다." onRetry={retryLoad} /> : null}
        {sheetCsvUrl && loadStatus === "loading" ? <LoadingView /> : null}
        {sheetCsvUrl && loadStatus === "error" ? <ErrorView message={errorMessage} onRetry={retryLoad} /> : null}
        {sheetCsvUrl && loadStatus === "success" && groupedCharacters.length === 0 ? <EmptyView /> : null}
        {sheetCsvUrl && loadStatus === "success" && groupedCharacters.length > 0 ? (
          <CharacterGrid
            groups={groupedCharacters}
            selectedIds={selectedCharacterIds}
            onToggleCharacter={toggleCharacter}
          />
        ) : null}
      </section>
      <BottomDock selectedCharacters={selectedCharacters} totalStats={totalStats} />
    </main>
  );
}
```

- [ ] **Step 4: Implement CSS Modules**

Create CSS Modules matching the class names used above. Keep the layout close to the approved wireframe:

`src/App.module.css`:

```css
.appShell {
  min-height: 100vh;
  background: #eef1f5;
  padding-bottom: 176px;
}

.content {
  max-width: 720px;
  margin: 0 auto;
  padding: 12px;
}
```

`src/components/TopBar.module.css`:

```css
.topBar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  height: 60px;
  padding: 0 12px;
  background: #ffffff;
  border-bottom: 1px solid #dde3ed;
}

.brand {
  font-size: 19px;
  font-weight: 850;
}

.damageToggle {
  justify-self: center;
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-width: 128px;
  height: 36px;
  padding: 3px;
  gap: 3px;
  border: 1px solid #d4dbe6;
  border-radius: 10px;
  background: #eef2f7;
}

.damageToggle button {
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #687386;
  font-weight: 850;
}

.damageToggle .active {
  background: #161b24;
  color: #ffffff;
}

.search {
  width: 112px;
  height: 34px;
  border: 1px solid #ccd4df;
  border-radius: 8px;
  padding: 0 10px;
  background: #f8fafc;
}
```

`src/components/SubBar.module.css`:

```css
.subBar {
  position: sticky;
  top: 60px;
  z-index: 9;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 40px;
  padding: 0 14px;
  background: #ffffff;
  border-bottom: 1px solid #dde3ed;
  color: #687386;
  font-size: 12px;
}

.subBar button {
  margin-left: auto;
  width: 32px;
  height: 32px;
  border: 1px solid #c9d1df;
  border-radius: 8px;
  background: #ffffff;
  color: #303846;
}

.subBar button:disabled {
  opacity: 0.35;
}
```

`src/components/CharacterGrid.module.css`:

```css
.groups {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.groupHeader {
  display: flex;
  justify-content: space-between;
  margin-bottom: 9px;
  color: #161b24;
}

.groupHeader span {
  color: #7a8495;
  font-size: 11px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
```

`src/components/CharacterCard.module.css`:

```css
.card {
  position: relative;
  display: block;
  min-width: 0;
  min-height: 126px;
  padding: 4px;
  border: 1px solid #dce2ea;
  border-radius: 9px;
  background: #ffffff;
  text-align: left;
  overflow: hidden;
}

.card[aria-pressed="true"] {
  border-color: #161b24;
  border-width: 2px;
}

.thumbnailWrap {
  position: relative;
  display: block;
  height: 84px;
  border-radius: 6px;
  overflow: hidden;
  background: currentColor;
}

.thumbnail {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fallback {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #ffffff;
  font-size: 28px;
  font-weight: 900;
}

.body {
  display: block;
  padding: 7px 5px 5px;
}

.name,
.grade {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.name {
  font-size: 13px;
  font-weight: 800;
}

.grade {
  margin-top: 2px;
  font-size: 11px;
  font-weight: 700;
}

.check {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #161b24;
  color: #ffffff;
  text-align: center;
  line-height: 22px;
}

.legendary { color: #d4a734; }
.hidden { color: #8f63d8; }
.transcend { color: #3676d6; }
.immortal { color: #e17d2d; }
.limited { color: #d85265; }
.eternal { color: #20a66a; }
.distortion { color: #b645c8; }
```

`src/components/BottomDock.module.css`:

```css
.dock {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  background: #ffffff;
  border-top: 1px solid #dce2ea;
  box-shadow: 0 -14px 32px rgba(19, 29, 45, 0.16);
}

.selectedStrip {
  max-width: 720px;
  margin: 0 auto;
  padding: 9px 12px 8px;
  border-bottom: 1px solid #edf1f6;
}

.stripHeader {
  display: flex;
  justify-content: space-between;
  margin-bottom: 7px;
  color: #687386;
  font-size: 11px;
  font-weight: 750;
}

.selectedGrid {
  display: flex;
  gap: 7px;
  overflow-x: auto;
}

.mini {
  width: 48px;
  flex: 0 0 auto;
  text-align: center;
}

.mini img {
  width: 42px;
  height: 42px;
  border-radius: 7px;
  object-fit: cover;
  background: #cfd6e2;
}

.mini span {
  display: block;
  margin-top: 3px;
  overflow: hidden;
  color: #303846;
  font-size: 10px;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stats {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  max-width: 720px;
  margin: 0 auto;
  padding: 11px 13px 13px;
  background: #161b24;
  color: #ffffff;
}

.label {
  color: #b7c1d1;
  font-size: 11px;
}

.total {
  font-size: 27px;
  font-weight: 900;
}

.statsGrid {
  display: grid;
  grid-template-columns: repeat(2, auto);
  gap: 6px 10px;
  color: #f5f7fb;
  font-size: 11px;
  text-align: right;
}
```

`src/components/StateViews.module.css`:

```css
.state {
  display: grid;
  place-items: center;
  min-height: 220px;
  border: 1px solid #dce2ea;
  border-radius: 8px;
  background: #ffffff;
  color: #687386;
  text-align: center;
}

.state button {
  margin-top: 10px;
  border: 1px solid #c9d1df;
  border-radius: 8px;
  background: #ffffff;
  padding: 8px 12px;
}
```

- [ ] **Step 5: Run UI smoke test**

Run:

```bash
npm run test -- src/App.test.tsx
```

Expected:

```text
PASS src/App.test.tsx
```

- [ ] **Step 6: Run full test and build**

Run:

```bash
npm run test
npm run build
```

Expected:

```text
All test files pass
vite build completes successfully
```

- [ ] **Step 7: Commit after user confirmation**

Ask the user: `UI 컴포넌트 구현을 커밋할까요?`

After approval, run:

```bash
git add src
git commit -m "메인 계산기 화면 구현"
```

---

### Task 7: Runtime Configuration and Sample Data

**Files:**
- Create: `public/sample-characters.csv`
- Modify: `.env.example`

- [ ] **Step 1: Add local sample CSV**

`public/sample-characters.csv`:

```csv
id,nameKo,grade,damageType,imageKey,imageUrl,sortName,attack,magicAttack,armorReduction,bossDamage,stun,slow,manaRegen,isEnabled,updatedAt
garp_immortal,거프,immortal,physical,garp_immortal,,거프,28,0,5,9,1,0,0,TRUE,2026-06-16
roger_immortal,로져,immortal,physical,roger_immortal,,로져,35,0,8,12,0,0,0,TRUE,2026-06-16
shanks_transcend,샹크스,transcend,physical,shanks_transcend,,샹크스,24,0,4,7,2,0,0,TRUE,2026-06-16
black_maria_distortion,블랙마리아,distortion,physical,black_maria_distortion,,블랙마리아,16,0,3,5,0,2,0,TRUE,2026-06-16
nami_transcend,나미,transcend,magical,nami_transcend,,나미,0,24,0,7,0,3,4,TRUE,2026-06-16
```

- [ ] **Step 2: Update env example with local fallback note**

`.env.example`:

```bash
# For local development without Google Sheets publishing:
VITE_GOOGLE_SHEET_CSV_URL=/sample-characters.csv

# For production, replace the value with the public published Google Sheets CSV URL.
```

- [ ] **Step 3: Create local `.env` only after user approval**

Ask the user: `로컬 개발용 .env 파일을 만들까요?`

After approval, create `.env`:

```bash
VITE_GOOGLE_SHEET_CSV_URL=/sample-characters.csv
```

- [ ] **Step 4: Run app with sample data**

Run:

```bash
npm run dev
```

Expected:

```text
Local: http://localhost:5173/
```

Open `http://localhost:5173/` in the in-app browser. Verify:

- `ORDR` appears in the top bar.
- `물뎀` is active by default.
- Physical sample characters appear grouped by grade.
- Clicking a character adds it to the bottom selected grid.
- Bottom total updates.
- Clicking `마뎀` clears selected characters and shows magical sample characters.
- Reset button clears selected characters after confirmation.

- [ ] **Step 5: Commit after user confirmation**

Ask the user: `샘플 데이터와 로컬 설정 안내를 커밋할까요?`

After approval, run:

```bash
git add public/sample-characters.csv .env.example
git commit -m "샘플 캐릭터 데이터 추가"
```

---

### Task 8: Final Verification

**Files:**
- Modify only files required by failures discovered during verification.

- [ ] **Step 1: Run full automated verification**

Run:

```bash
npm run test
npm run build
```

Expected:

```text
All test files pass
vite build completes successfully
```

- [ ] **Step 2: Run browser verification**

Run:

```bash
npm run dev
```

Open the local URL in the in-app browser and test these interactions:

- Type `로` in search and confirm matching physical characters remain.
- Clear search and select at least two characters.
- Confirm selected mini-grid shows both characters.
- Confirm stat totals equal the selected sample rows.
- Switch to `마뎀` and confirm selected mini-grid is empty.
- Select `나미` and confirm magical stats update.
- Click reset and confirm the selected mini-grid is empty after approval.

- [ ] **Step 3: Fix verification failures with focused patches**

For each failure:

1. Write or update a test that reproduces the failure.
2. Run the test and confirm it fails.
3. Patch the smallest relevant file.
4. Run the failing test and confirm it passes.
5. Run `npm run test` and `npm run build`.

- [ ] **Step 4: Final commit after user confirmation**

Ask the user: `검증 완료 상태를 커밋할까요?`

After approval, run:

```bash
git status --short
git add .
git commit -m "ORDR 보유 스탯 계산기 구현"
```

---

## Self-Review

- Spec coverage: The plan covers PWA setup, public Google Sheets CSV, local thumbnails via `imageKey`, top damage toggle, reset behavior, grouped grid, selected mini-grid, bottom stats, parsing, filtering, sorting, selection, and verification.
- Marker scan: No unresolved marker steps remain. The Google Sheets URL is documented through `.env.example` and sample CSV for local development.
- Type consistency: `Grade`, `DamageType`, `Character`, `CharacterStats`, `CharacterGroup`, and store action names are consistent across tasks.
