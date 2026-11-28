import styles from './Disclaimer.module.css'
import type { GuestLanguage } from '../i18n/guest'
import { guestCopy } from '../i18n/guest'
export type DisclaimerProps = { className?: string }
export function Disclaimer({ className = '', language = 'ko' }: DisclaimerProps & { language?: GuestLanguage }) {
  return <p className={`${styles.disclaimer} ${className}`}>{guestCopy[language].disclaimer}</p>
}
