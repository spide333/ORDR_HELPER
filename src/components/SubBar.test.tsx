import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SubBar } from "./SubBar";

describe("SubBar", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows selected legendary value rounded to one decimal place", () => {
    render(
      <SubBar
        selectedCharacters={[]}
        selectedCount={2}
        selectedLegendaryValue={1.66}
        onResetSelection={vi.fn()}
      />,
    );

    expect(screen.getByText("선택 1.7 전설")).toBeInTheDocument();
    expect(screen.queryByText(/명/)).not.toBeInTheDocument();
  });

  it("shows selected characters in high grade order in the sticky top summary", () => {
    render(
      <SubBar
        selectedCharacters={[
          {
            id: "special",
            nameKo: "나미",
            grade: "special",
            imageKey: "nami",
            imageUrl: "",
            sortName: "나미",
            stats: {},
            damageType: "common",
            isEnabled: true,
            legendaryValue: 0.1111,
            updatedAt: ""
          },
          {
            id: "legendary",
            nameKo: "샹크스",
            grade: "legendary",
            imageKey: "shanks",
            imageUrl: "",
            sortName: "샹크스",
            stats: {},
            damageType: "common",
            isEnabled: true,
            legendaryValue: 1,
            updatedAt: ""
          },
          {
            id: "immortal",
            nameKo: "로져",
            grade: "immortal",
            imageKey: "roger",
            imageUrl: "",
            sortName: "로져",
            stats: {},
            damageType: "common",
            isEnabled: true,
            legendaryValue: 3,
            updatedAt: ""
          }
        ]}
        selectedCount={3}
        selectedLegendaryValue={4.1111}
        onResetSelection={vi.fn()}
      />,
    );

    const selectedList = screen.getByRole("list", { name: "선택한 캐릭터" });
    const selectedItems = within(selectedList).getAllByRole("listitem");

    expect(screen.getByTestId("selected-summary-bar")).toHaveAttribute("data-has-selection", "true");
    expect(screen.getByText("선택 4.1 전설")).toBeInTheDocument();
    expect(selectedItems.map((item) => item.getAttribute("aria-label"))).toEqual(["로져", "샹크스", "나미"]);
    expect(selectedItems.map((item) => item.getAttribute("data-grade"))).toEqual([
      "immortal",
      "legendary",
      "special"
    ]);
    expect(screen.getByText("3.0전설")).toBeInTheDocument();
    expect(screen.getByText("1.0전설")).toBeInTheDocument();
  });
});
