import styles from "./SubBar.module.css";

type SubBarProps = {
  visibleCount: number;
  selectedCount: number;
  selectedLegendaryValue: number;
  onResetSelection: () => void;
};

function formatLegendaryValue(value: number): string {
  return (Math.round(value * 10) / 10).toFixed(1);
}

export function SubBar({ visibleCount, selectedCount, selectedLegendaryValue, onResetSelection }: SubBarProps) {
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
      <span>현재 목록 {visibleCount}명 · 선택 {formatLegendaryValue(selectedLegendaryValue)} 전설</span>
      <button type="button" aria-label="선택 초기화" disabled={isResetDisabled} onClick={handleReset}>
        ↻
      </button>
    </div>
  );
}
