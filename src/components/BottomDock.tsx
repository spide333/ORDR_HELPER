import { useState } from "react";
import type { CharacterStats } from "../domain/character";
import { defaultStatDefinitions, normalizeStatNumber, visibleStatDefinitions, type StatDefinition } from "../domain/stats";
import styles from "./BottomDock.module.css";

type BottomDockProps = {
  totalStats: CharacterStats;
  statDefinitions?: StatDefinition[];
};

function isStunDefinition(definition: StatDefinition): boolean {
  return definition.key === "stun" || definition.label === "스턴";
}

function isSlowDefinition(definition: StatDefinition): boolean {
  return definition.key === "slow" || definition.label === "이감";
}

function isTriggeredSlowDefinition(definition: StatDefinition): boolean {
  return definition.key === "baldongSlow" || definition.key === "triggeredSlow" || definition.label === "발동이감";
}

function formatStatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(3)));
}

function formatStunValue(value: number): string {
  return (Math.round(value * 10) / 10).toFixed(1);
}

function formatStatValue(
  definition: StatDefinition,
  totalStats: CharacterStats,
  statDefinitions: StatDefinition[],
): string {
  const value = normalizeStatNumber(totalStats[definition.key]);

  if (isStunDefinition(definition)) {
    return formatStunValue(value);
  }

  if (isSlowDefinition(definition)) {
    const triggeredSlowDefinition = statDefinitions.find(isTriggeredSlowDefinition);
    if (!triggeredSlowDefinition) {
      return formatStatNumber(value);
    }

    const triggeredSlow = normalizeStatNumber(totalStats[triggeredSlowDefinition.key]);
    return `${formatStatNumber(value + triggeredSlow)} (${formatStatNumber(triggeredSlow)})`;
  }

  return formatStatNumber(value);
}

export function BottomDock({
  totalStats,
  statDefinitions = defaultStatDefinitions
}: BottomDockProps) {
  const [showAllStats, setShowAllStats] = useState(false);
  const visibleStats = visibleStatDefinitions(statDefinitions);
  const importantStats = visibleStats.filter((definition) => definition.important && !isTriggeredSlowDefinition(definition));
  const displayedStats = showAllStats ? visibleStats : importantStats;
  const canToggleStats = visibleStats.length > importantStats.length;

  return (
    <aside className={styles.dock}>
      <div className={styles.dockInner}>
        <div className={styles.stats}>
          <div className={styles.statsHeader}>
            <div className={styles.label}>보유 스탯</div>
            {canToggleStats ? (
              <button
                className={styles.moreButton}
                type="button"
                onClick={() => setShowAllStats((current) => !current)}
              >
                {showAllStats ? "접기" : "더보기"}
              </button>
            ) : null}
          </div>
          <div className={styles.statsGrid}>
            {displayedStats.map((definition) => (
              <span key={definition.key} className={styles.statChip}>
                <span className={styles.statLabel}>{definition.label}</span>
                <span className={styles.statValue}>{formatStatValue(definition, totalStats, statDefinitions)}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
