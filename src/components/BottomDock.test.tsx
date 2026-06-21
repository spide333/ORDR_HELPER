import { createElement } from "react";
import type { ComponentType } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BottomDock } from "./BottomDock";

describe("BottomDock", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders stat totals without a grand total block", () => {
    const { container } = render(
      createElement(BottomDock as ComponentType<any>, {
        selectedCharacters: [],
        totalStats: {
          attack: 10,
          cooldownReduction: 5,
          stun: 0,
          hiddenStat: 100
        },
        statDefinitions: [
          { key: "attack", label: "공격", order: 1, enabled: true, important: true, includeInTotal: true },
          { key: "cooldownReduction", label: "쿨감", order: 2, enabled: true, important: true, includeInTotal: false },
          { key: "stun", label: "스턴", order: 3, enabled: true, important: true, includeInTotal: true },
          { key: "hiddenStat", label: "숨김", order: 4, enabled: false, important: true, includeInTotal: true }
        ]
      }),
    );

    expect(screen.queryByText("전체 보유 스탯 합")).not.toBeInTheDocument();
    expect(container).toHaveTextContent("공격10");
    expect(container).toHaveTextContent("쿨감5");
    expect(screen.getByText("스턴").nextSibling).toHaveTextContent("0.0");
    expect(container).not.toHaveTextContent("숨김 100");
  });

  it("shows only important stats first, formats stun, and combines slow totals", () => {
    render(
      createElement(BottomDock as ComponentType<any>, {
        selectedCharacters: [],
        totalStats: {
          stun: 1.26,
          slow: 45,
          triggeredSlow: 20,
          armorReduction: 30,
          hiddenStat: 100
        },
        statDefinitions: [
          { key: "stun", label: "스턴", order: 1, enabled: true, important: true, includeInTotal: true },
          { key: "slow", label: "이감", order: 2, enabled: true, important: true, includeInTotal: true },
          { key: "triggeredSlow", label: "발동이감", order: 3, enabled: true, important: true, includeInTotal: true },
          { key: "armorReduction", label: "방깎", order: 4, enabled: true, important: false, includeInTotal: true },
          { key: "hiddenStat", label: "숨김", order: 5, enabled: false, important: true, includeInTotal: true }
        ]
      }),
    );

    expect(screen.getByText("스턴").nextSibling).toHaveTextContent("1.3");
    expect(screen.getByText("이감").nextSibling).toHaveTextContent("65 (20)");
    expect(screen.queryByText("발동이감")).not.toBeInTheDocument();
    expect(screen.queryByText("방깎")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "더보기" }));

    expect(screen.getByText("방깎").nextSibling).toHaveTextContent("30");
    expect(screen.getByRole("button", { name: "접기" })).toBeInTheDocument();
  });

  it("sorts selected characters by high grade before rendering the horizontal list", () => {
    render(
      createElement(BottomDock as ComponentType<any>, {
        selectedCharacters: [
          { id: "special", nameKo: "나미", grade: "special", imageKey: "nami", imageUrl: "", sortName: "나미", stats: {}, damageType: "common", isEnabled: true },
          { id: "specialUnit", nameKo: "모건", grade: "specialUnit", imageKey: "morgan", imageUrl: "", sortName: "모건", stats: {}, damageType: "common", isEnabled: true },
          { id: "rare", nameKo: "사보", grade: "rare", imageKey: "sabo", imageUrl: "", sortName: "사보", stats: {}, damageType: "common", isEnabled: true },
          { id: "changed", nameKo: "비비", grade: "changed", imageKey: "vivi", imageUrl: "", sortName: "비비", stats: {}, damageType: "common", isEnabled: true },
          { id: "legendary", nameKo: "샹크스", grade: "legendary", imageKey: "shanks", imageUrl: "", sortName: "샹크스", stats: {}, damageType: "common", isEnabled: true },
          { id: "seraphim", nameKo: "S - 샤크", grade: "seraphim", imageKey: "s-shark", imageUrl: "", sortName: "S - 샤크", stats: {}, damageType: "common", isEnabled: true },
          { id: "distortion", nameKo: "에이스", grade: "distortion", imageKey: "ace", imageUrl: "", sortName: "에이스", stats: {}, damageType: "common", isEnabled: true },
          { id: "limited", nameKo: "레베카", grade: "limited", imageKey: "rebecca", imageUrl: "", sortName: "레베카", stats: {}, damageType: "common", isEnabled: true },
          { id: "eternal", nameKo: "니카", grade: "eternal", imageKey: "nika", imageUrl: "", sortName: "니카", stats: {}, damageType: "common", isEnabled: true },
          { id: "transcend", nameKo: "조로", grade: "transcend", imageKey: "zoro", imageUrl: "", sortName: "조로", stats: {}, damageType: "common", isEnabled: true },
          { id: "hidden", nameKo: "킬러", grade: "hidden", imageKey: "killer", imageUrl: "", sortName: "킬러", stats: {}, damageType: "common", isEnabled: true },
          { id: "immortal", nameKo: "로져", grade: "immortal", imageKey: "roger", imageUrl: "", sortName: "로져", stats: {}, damageType: "common", isEnabled: true }
        ],
        totalStats: {},
        statDefinitions: []
      }),
    );

    const selectedList = screen.getAllByRole("list", { name: "선택한 캐릭터" }).find((list) =>
      within(list).queryAllByRole("listitem").length > 0,
    );

    if (!selectedList) {
      throw new Error("selected list missing");
    }

    const selectedItems = within(selectedList).getAllByRole("listitem");

    expect(selectedItems.map((item) => item.getAttribute("aria-label"))).toEqual([
      "로져",
      "니카",
      "조로",
      "레베카",
      "에이스",
      "S - 샤크",
      "샹크스",
      "킬러",
      "비비",
      "사보",
      "모건",
      "나미"
    ]);
    expect(selectedItems.map((item) => item.getAttribute("data-grade"))).toEqual([
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
  });
});
