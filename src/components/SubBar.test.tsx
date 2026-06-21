import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SubBar } from "./SubBar";

describe("SubBar", () => {
  it("shows selected legendary value rounded to one decimal place", () => {
    render(
      <SubBar
        visibleCount={12}
        selectedCount={2}
        selectedLegendaryValue={1.66}
        onResetSelection={vi.fn()}
      />,
    );

    expect(screen.getByText("현재 목록 12명 · 선택 1.7 전설")).toBeInTheDocument();
  });
});
