import type { Character } from "../domain/character";
import { gradeLabels } from "../domain/character";
import { resolveCharacterImageUrl } from "../domain/characterSelectors";
import styles from "./CharacterCard.module.css";

type CharacterCardProps = {
  character: Character;
  selected: boolean;
  onToggle: (characterId: string) => void;
};

export function CharacterCard({ character, selected, onToggle }: CharacterCardProps) {
  const initial = character.nameKo.slice(0, 1);

  return (
    <button
      type="button"
      className={`${styles.card} ${styles[character.grade]}`}
      aria-label={`${character.nameKo} ${gradeLabels[character.grade]}`}
      aria-pressed={selected}
      onClick={() => onToggle(character.id)}
    >
      {selected ? (
        <span className={styles.check} aria-hidden="true">
          ✓
        </span>
      ) : null}
      <span className={styles.thumbnailWrap}>
        <span className={styles.fallback} aria-hidden="true">
          {initial}
        </span>
        <img
          className={styles.thumbnail}
          src={resolveCharacterImageUrl(character)}
          alt=""
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      </span>
      <span className={styles.body}>
        <span className={styles.name}>{character.nameKo}</span>
        <span className={styles.grade}>{gradeLabels[character.grade]}</span>
      </span>
    </button>
  );
}
