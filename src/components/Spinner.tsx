import styles from './Spinner.module.css'
export type SpinnerProps = { label?: string }
export function Spinner({ label = '불러오는 중' }: SpinnerProps) {
  return <span className={styles.spinner} role="status"><span className={styles.ring} /><span className={styles.label}>{label}</span></span>
}
