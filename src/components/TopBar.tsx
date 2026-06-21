import type { DamageFilter } from "../domain/character";
import styles from "./TopBar.module.css";

type TopBarProps = {
  damageType: DamageFilter;
  searchQuery: string;
  onDamageTypeChange: (damageType: DamageFilter) => void;
  onSearchQueryChange: (searchQuery: string) => void;
};

export function TopBar({ damageType, searchQuery, onDamageTypeChange, onSearchQueryChange }: TopBarProps) {
  return (
    <header className={styles.topBar}>
      <div className={styles.brand}>ORDR</div>
      <div className={styles.damageToggle} aria-label="데미지 타입">
        <button
          type="button"
          aria-pressed={damageType === "physical"}
          className={damageType === "physical" ? styles.active : undefined}
          onClick={() => onDamageTypeChange("physical")}
        >
          물뎀
        </button>
        <button
          type="button"
          aria-pressed={damageType === "magical"}
          className={damageType === "magical" ? styles.active : undefined}
          onClick={() => onDamageTypeChange("magical")}
        >
          마뎀
        </button>
      </div>
      <input
        className={styles.search}
        aria-label="캐릭터 검색"
        placeholder="검색"
        value={searchQuery}
        onChange={(event) => onSearchQueryChange(event.target.value)}
      />
    </header>
  );
}
