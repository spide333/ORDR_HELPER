import styles from "./StateViews.module.css";

export function LoadingView() {
  return <div className={styles.state}>데이터를 불러오는 중입니다.</div>;
}

export function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className={styles.state}>
      <p>{message}</p>
      <button type="button" onClick={onRetry}>다시 시도</button>
    </div>
  );
}

export function EmptyView() {
  return <div className={styles.state}>조건에 맞는 캐릭터가 없습니다.</div>;
}
