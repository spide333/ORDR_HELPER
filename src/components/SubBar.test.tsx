import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SubBar } from "./SubBar";

describe("SubBar", () => {
  it("shows selected legendary value rounded to one decimal place", () => {
    render(
      <SubBar
        selectedCount={2}
        selectedLegendaryValue={1.66}
        onResetSelection={vi.fn()}
      />,
    );

    expect(screen.getByText("선택 1.7 전설")).toBeInTheDocument();
    expect(screen.queryByText(/명/)).not.toBeInTheDocument();
  });
});
