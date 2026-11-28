import { useMemo, useState } from 'react'
import { AlertModal, Card, Disclaimer, EmptyState, ProgressBar, Button } from '../components'
import { decodeSummary } from '../lib/share'
import { formatDateTime } from '../lib/format'
import styles from './GuestScreen.module.css'
import { guestCopy, type GuestLanguage } from '../i18n/guest'

export function GuestScreen() {
  const data = location.hash.startsWith('#/g/') ? location.hash.slice(4).split(/[?&]/, 1)[0] : ''
  const summary = useMemo(() => decodeSummary(data), [data])
  const [checked, setChecked] = useState<string[]>([])
  const [alertOpen, setAlertOpen] = useState(false)
  const [language, setLanguage] = useState<GuestLanguage>('ko')
  const copy = guestCopy[language]

  if (!summary || !Array.isArray(summary.spots) || typeof summary.spaceName !== 'string') {
    return <main className={styles.page}><LanguageToggle language={language} onChange={setLanguage} /><EmptyState message={copy.invalid} actionLabel={language === 'ko' ? '다시 확인하기' : 'Try again'} onAction={() => window.location.reload()} /></main>
  }

  const total = summary.spots.length
  const finished = checked.length
  function toggle(index: number) {
    setChecked((current) => current.includes(String(index)) ? current.filter((item) => item !== String(index)) : [...current, String(index)])
  }

  return <div className={styles.page}>
    <LanguageToggle language={language} onChange={setLanguage} />
    <div className={styles.sticky}><strong>{copy.progress(finished, total)}</strong><ProgressBar value={finished} max={total} /></div>
    <main className={styles.content}>
      <Card className={styles.summary}>
        <h1>{copy.summaryTitle(summary.spaceName)}</h1>
        <p>{copy.lastInspection(formatDateTime(summary.at))}</p>
        <p>{copy.checkedSummary(summary.coverage.checked, summary.coverage.total)}</p>
        <p>{copy.changedSummary(summary.changesCount)}</p>
      </Card>
      <section className={styles.section}>
        <h2>{copy.selfCheck}</h2>
        <p>{copy.routeHint}</p>
        {summary.spots.map((spot, index) => <Card key={`${spot.order}-${index}`} className={styles.spot}>
          <div className={styles.spotHead}><span>{spot.order}</span><strong>{spot.object}</strong></div>
          <p>{spot.where}</p><p>{spot.check}</p>
          <label className={styles.check}><input type="checkbox" checked={checked.includes(String(index))} onChange={() => toggle(index)} />{copy.checkbox}</label>
        </Card>)}
        {finished === total && <p className={styles.complete}>{copy.allDone}</p>}
      </section>
      <div className={styles.footer}><Button variant="secondary" onClick={() => setAlertOpen(true)}>{copy.alert}</Button><Disclaimer language={language} /></div>
    </main>
    {alertOpen && <AlertModal audience="guest" language={language} onClose={() => setAlertOpen(false)} />}
  </div>
}

function LanguageToggle({ language, onChange }: { language: GuestLanguage; onChange: (language: GuestLanguage) => void }) {
  return <div className={styles.languageToggle} role="group" aria-label="Language"><button type="button" aria-pressed={language === 'ko'} onClick={() => onChange('ko')}>한</button><span>/</span><button type="button" aria-pressed={language === 'en'} onClick={() => onChange('en')}>EN</button></div>
}
