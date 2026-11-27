import type { ReactNode } from 'react'
import styles from './PageHeader.module.css'
export type PageHeaderProps = { title: string; step?: number; totalSteps?: number; onBack?: () => void; backLabel?: string; trailing?: ReactNode }
export function PageHeader({ title, step, totalSteps, onBack, backLabel = '뒤로가기', trailing }: PageHeaderProps) {
  return <header className={styles.header}><button type="button" className={styles.back} onClick={onBack} aria-label={backLabel} disabled={!onBack}>‹</button><div className={styles.titleBlock}><h1>{title}</h1>{step !== undefined && totalSteps !== undefined && <span>{step}/{totalSteps}</span>}</div><div className={styles.trailing}>{trailing}</div></header>
}
