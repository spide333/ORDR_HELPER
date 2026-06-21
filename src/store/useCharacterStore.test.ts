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
  legendaryValue: 3,
  isEnabled: true,
  updatedAt: "2026-06-16"
};

function createCharacter(overrides: Partial<Character>): Character {
  return {
    ...character,
    ...overrides,
    stats: {
      ...character.stats,
      ...overrides.stats
    }
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
}

beforeEach(() => {
  useCharacterStore.setState(useCharacterStore.getInitialState(), true);
  useCharacterStore.getState().setLocalCharacters([]);
});

describe("useCharacterStore", () => {
  it("loads characters and computes selected totals", async () => {
    await useCharacterStore.getState().loadCharacters(async () => [character]);

    useCharacterStore.getState().toggleCharacter("roger");

    expect(useCharacterStore.getState().selectedCharacterIds).toEqual(["roger"]);
    expect(useCharacterStore.getState().totalStats.attack).toBe(10);
  });

  it("keeps selected local characters when sheet data hydrates them", async () => {
    const localRoger = createCharacter({
      id: "roger",
      imageUrl: "",
      stats: {
        attack: 0,
        armorReduction: 0
      }
    });
    const sheetRoger = createCharacter({
      id: "roger",
      imageUrl: "https://example.com/roger.png",
      stats: {
        attack: 10,
        armorReduction: 2
      }
    });

    useCharacterStore.getState().setLocalCharacters([localRoger]);
    useCharacterStore.getState().toggleCharacter("roger");
    await useCharacterStore.getState().loadCharacters(async () => [sheetRoger]);

    expect(useCharacterStore.getState().selectedCharacterIds).toEqual(["roger"]);
    expect(useCharacterStore.getState().selectedCharacters[0]).toMatchObject({
      id: "roger",
      imageUrl: "https://example.com/roger.png"
    });
    expect(useCharacterStore.getState().totalStats.attack).toBe(10);
  });

  it("computes selected legendary value from selected characters", async () => {
    const roger = createCharacter({ id: "roger", legendaryValue: 3 });
    const luffy = createCharacter({
      id: "luffy",
      nameKo: "루피",
      sortName: "루피",
      legendaryValue: 2.2222
    });

    await useCharacterStore.getState().loadCharacters(async () => [roger, luffy]);

    useCharacterStore.getState().toggleCharacter("roger");
    useCharacterStore.getState().toggleCharacter("luffy");

    expect(useCharacterStore.getState().selectedLegendaryValue).toBeCloseTo(5.2222);
  });

  it("loads stat definitions and computes custom selected totals", async () => {
    await useCharacterStore.getState().loadCharacters(async () => ({
      characters: [
        createCharacter({
          stats: {
            attack: 10,
            cooldownReduction: 4
          }
        } as Partial<Character>)
      ],
      statDefinitions: [
        { key: "attack", label: "공격", order: 1, enabled: true, includeInTotal: true },
        { key: "cooldownReduction", label: "쿨감", order: 2, enabled: true, includeInTotal: true }
      ]
    }) as never);

    useCharacterStore.getState().toggleCharacter("roger");

    expect(
      (useCharacterStore.getState() as never as { statDefinitions: Array<{ key: string }> }).statDefinitions.map(
        (definition) => definition.key,
      ),
    ).toEqual([
      "attack",
      "cooldownReduction"
    ]);
    expect(useCharacterStore.getState().totalStats).toMatchObject({
      attack: 10,
      cooldownReduction: 4
    });
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

  it("ignores stale load results", async () => {
    const firstLoad = deferred<Character[]>();
    const secondLoad = deferred<Character[]>();
    const firstRequest = useCharacterStore.getState().loadCharacters(() => firstLoad.promise);
    const secondRequest = useCharacterStore.getState().loadCharacters(() => secondLoad.promise);

    secondLoad.resolve([createCharacter({ id: "nami", nameKo: "나미", sortName: "나미" })]);
    await secondRequest;
    firstLoad.resolve([createCharacter({ id: "roger", nameKo: "로져", sortName: "로져" })]);
    await firstRequest;

    expect(useCharacterStore.getState().characters).toEqual([
      expect.objectContaining({ id: "nami", nameKo: "나미" })
    ]);
    expect(useCharacterStore.getState().loadStatus).toBe("success");
  });

  it("ignores stale load errors after newer success", async () => {
    const firstLoad = deferred<Character[]>();
    const secondLoad = deferred<Character[]>();
    const firstRequest = useCharacterStore.getState().loadCharacters(() => firstLoad.promise);
    const secondRequest = useCharacterStore.getState().loadCharacters(() => secondLoad.promise);

    secondLoad.resolve([createCharacter({ id: "nami", nameKo: "나미", sortName: "나미" })]);
    await secondRequest;
    firstLoad.reject(new Error("old network"));
    await firstRequest;

    expect(useCharacterStore.getState().loadStatus).toBe("success");
    expect(useCharacterStore.getState().errorMessage).toBe("");
  });

  it("does not add characters outside the current filtered list", async () => {
    const roger = createCharacter({ id: "roger", damageType: "physical" });
    const nami = createCharacter({ id: "nami", nameKo: "나미", sortName: "나미", damageType: "magical" });
    const disabledPhysical = createCharacter({
      id: "disabled-roger",
      damageType: "physical",
      isEnabled: false
    });

    await useCharacterStore.getState().loadCharacters(async () => [roger, nami, disabledPhysical]);

    useCharacterStore.getState().toggleCharacter("nami");
    useCharacterStore.getState().toggleCharacter("missing");
    useCharacterStore.getState().toggleCharacter("disabled-roger");

    expect(useCharacterStore.getState().selectedCharacterIds).toEqual([]);

    useCharacterStore.getState().toggleCharacter("roger");

    expect(useCharacterStore.getState().selectedCharacterIds).toEqual(["roger"]);
  });
});
