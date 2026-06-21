import { useEffect } from "react";
import { BottomDock } from "./components/BottomDock";
import { CharacterGrid } from "./components/CharacterGrid";
import { EmptyView, ErrorView, LoadingView } from "./components/StateViews";
import { SubBar } from "./components/SubBar";
import { TopBar } from "./components/TopBar";
import { loadCharacterDataFromCsvUrls } from "./data/googleSheetsRepository";
import { useCharacterStore } from "./store/useCharacterStore";
import styles from "./App.module.css";

const sheetCsvUrl = import.meta.env.VITE_GOOGLE_SHEET_CSV_URL as string | undefined;
const statsCsvUrl = import.meta.env.VITE_GOOGLE_SHEET_STATS_CSV_URL as string | undefined;

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
    selectedLegendaryValue,
    statDefinitions,
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

    void loadCharacters(() => loadCharacterDataFromCsvUrls(sheetCsvUrl, statsCsvUrl));
  }, [loadCharacters]);

  function retryLoad() {
    if (sheetCsvUrl) {
      void loadCharacters(() => loadCharacterDataFromCsvUrls(sheetCsvUrl, statsCsvUrl));
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
        selectedLegendaryValue={selectedLegendaryValue}
        onResetSelection={resetSelection}
      />
      <section className={styles.content}>
        {!sheetCsvUrl ? <ErrorView message="Google Sheets CSV URL이 설정되지 않았습니다." onRetry={retryLoad} /> : null}
        {sheetCsvUrl && loadStatus === "loading" && groupedCharacters.length === 0 ? <LoadingView /> : null}
        {sheetCsvUrl && loadStatus === "error" && groupedCharacters.length === 0 ? (
          <ErrorView message={errorMessage} onRetry={retryLoad} />
        ) : null}
        {sheetCsvUrl && loadStatus === "success" && groupedCharacters.length === 0 ? <EmptyView /> : null}
        {sheetCsvUrl && groupedCharacters.length > 0 ? (
          <CharacterGrid
            groups={groupedCharacters}
            selectedIds={selectedCharacterIds}
            onToggleCharacter={toggleCharacter}
          />
        ) : null}
      </section>
      <BottomDock selectedCharacters={selectedCharacters} totalStats={totalStats} statDefinitions={statDefinitions} />
    </main>
  );
}
