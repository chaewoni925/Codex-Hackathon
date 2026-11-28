import styles from './ProgressBar.module.css'
export type ProgressBarProps = { value: number; max: number; label?: string }
export function ProgressBar({ value, max, label }: ProgressBarProps) {
  const progress = max > 0 ? Math.min(100, Math.max(0, value / max * 100)) : 0
  return <div className={styles.wrapper}><div className={styles.track} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}><div className={styles.fill} style={{ width: `${progress}%` }} /></div><span className={styles.label}>{label ?? `${value}/${max}`}</span></div>
}
