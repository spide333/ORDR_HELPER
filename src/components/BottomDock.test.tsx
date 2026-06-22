import { createElement } from "react";
import type { ComponentType } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BottomDock } from "./BottomDock";

describe("BottomDock", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders stat totals without a grand total block", () => {
    const { container } = render(
      createElement(BottomDock as ComponentType<any>, {
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

  it("does not render selected characters or selected legendary value", () => {
    render(
      createElement(BottomDock as ComponentType<any>, {
        totalStats: {},
        statDefinitions: []
      }),
    );

    expect(screen.queryByText("선택된 캐릭터")).not.toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "선택한 캐릭터" })).not.toBeInTheDocument();
    expect(screen.queryByText(/전설/)).not.toBeInTheDocument();
  });
});
