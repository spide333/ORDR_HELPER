import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";
import { useCharacterStore } from "./store/useCharacterStore";

beforeEach(() => {
  useCharacterStore.setState({
    ...useCharacterStore.getInitialState(),
    loadStatus: "success",
    characters: [],
    filteredCharacters: [],
    groupedCharacters: [],
    selectedCharacters: [],
    selectedLegendaryValue: 0
  }, true);
});

afterEach(() => {
  cleanup();
});

describe("App", () => {
  it("renders the top damage toggle and bottom stats area", () => {
    render(<App />);

    expect(screen.getByText("ORDR")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "물뎀" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "마뎀" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("보유 스탯")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "선택한 캐릭터" })).toBeInTheDocument();
    expect(screen.queryByText("전체 보유 스탯 합")).not.toBeInTheDocument();
  });

  it("renders local character seeds while sheet data is loading", () => {
    useCharacterStore.setState({
      ...useCharacterStore.getInitialState(),
      loadStatus: "loading"
    }, true);

    render(<App />);

    expect(screen.getByRole("button", { name: "로져 불멸" })).toBeInTheDocument();
    expect(screen.queryByText("데이터를 불러오는 중입니다.")).not.toBeInTheDocument();
  });
});
