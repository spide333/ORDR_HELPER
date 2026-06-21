import { gradeLabels } from "../domain/character";
import type { CharacterGroup } from "../domain/characterSelectors";
import { CharacterCard } from "./CharacterCard";
import styles from "./CharacterGrid.module.css";

type CharacterGridProps = {
  groups: CharacterGroup[];
  selectedIds: string[];
  onToggleCharacter: (characterId: string) => void;
};

export function CharacterGrid({ groups, selectedIds, onToggleCharacter }: CharacterGridProps) {
  return (
    <div className={styles.groups}>
      {groups.map((group) => (
        <section key={group.grade} className={styles.group}>
          <header className={styles.groupHeader}>
            <strong>{gradeLabels[group.grade]}</strong>
            <span>가나다순</span>
          </header>
          <div className={styles.grid}>
            {group.characters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                selected={selectedIds.includes(character.id)}
                onToggle={onToggleCharacter}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
