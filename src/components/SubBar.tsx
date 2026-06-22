import type { Character } from "../domain/character";
import { gradeOrder } from "../domain/character";
import { resolveCharacterImageUrl } from "../domain/characterSelectors";
import styles from "./SubBar.module.css";

type SubBarProps = {
  selectedCharacters: Character[];
  selectedCount: number;
  selectedLegendaryValue: number;
  onResetSelection: () => void;
};

const selectedGradeRank = new Map(gradeOrder.map((grade, index) => [grade, index]));
const koreanCollator = new Intl.Collator("ko-KR");

function formatLegendaryValue(value: number): string {
  return (Math.round(value * 10) / 10).toFixed(1);
}

function sortSelectedCharacters(characters: Character[]): Character[] {
  return [...characters].sort((a, b) => {
    const gradeRank = (selectedGradeRank.get(a.grade) ?? gradeOrder.length)
      - (selectedGradeRank.get(b.grade) ?? gradeOrder.length);

    if (gradeRank !== 0) {
      return gradeRank;
    }

    return koreanCollator.compare(a.sortName || a.nameKo, b.sortName || b.nameKo);
  });
}

export function SubBar({
  selectedCharacters,
  selectedCount,
  selectedLegendaryValue,
  onResetSelection
}: SubBarProps) {
  const isResetDisabled = selectedCount === 0;
  const sortedSelectedCharacters = sortSelectedCharacters(selectedCharacters);
  const hasSelection = sortedSelectedCharacters.length > 0;

  function handleReset() {
    if (isResetDisabled) {
      return;
    }

    if (window.confirm("선택된 캐릭터를 모두 초기화할까요?")) {
      onResetSelection();
    }
  }

  return (
    <div className={styles.subBar} data-has-selection={hasSelection} data-testid="selected-summary-bar">
      <div className={styles.selectedInlineRow} data-testid="selected-inline-row">
        {hasSelection ? (
          <div className={styles.selectedGrid} role="list" aria-label="선택한 캐릭터">
            {sortedSelectedCharacters.map((character) => (
              <div
                key={character.id}
                className={styles.mini}
                role="listitem"
                aria-label={character.nameKo}
                data-grade={character.grade}
              >
                <span className={styles.miniThumb}>
                  <span>{character.nameKo.slice(0, 1)}</span>
                  <img
                    src={resolveCharacterImageUrl(character)}
                    alt=""
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                </span>
                <span className={styles.miniName}>{character.nameKo}</span>
                <span className={styles.miniLegendary}>{formatLegendaryValue(character.legendaryValue)}전설</span>
              </div>
            ))}
          </div>
        ) : (
          <span className={styles.emptySelection} aria-hidden="true" />
        )}
        <div className={styles.summaryRow}>
          <span>{formatLegendaryValue(selectedLegendaryValue)} 전설</span>
          <button type="button" aria-label="선택 초기화" disabled={isResetDisabled} onClick={handleReset}>
            ↻
          </button>
        </div>
      </div>
    </div>
  );
}
