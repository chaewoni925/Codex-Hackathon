import type { ReactNode } from 'react'
import { Button, Card } from '../components'
import { formatDateTime } from '../lib/format'
import { useAppState } from '../state'
import styles from './HomeScreen.module.css'

const icons = {
  note: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M6.5 8h5m-5 4h3m3 1 2.2 2.2 3.8-4.4" /></>,
  scan: <><path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m8 0h3a2 2 0 0 0 2-2v-3" /><circle cx="12" cy="12" r="4" /></>,
  qr: <><path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zm6 0h1m-1 4v3h-3m-3-1v1" /></>,
  camera: <><path d="M14 6h-3l-2 2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h15a1 1 0 0 0 1-1v-6m-1-6V3m-2 2h4" /><circle cx="11.5" cy="13.5" r="3.4" /></>,
  play: <><circle cx="12" cy="12" r="9" /><path d="m10 8 6 4-6 4z" fill="currentColor" stroke="none" /></>,
} satisfies Record<string, ReactNode>

function Icon({ name }: { name: keyof typeof icons }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[name]}</svg>
}

export function HomeScreen() {
  const { state, dispatch } = useAppState()
  const space = state.space
  const record = state.record?.space.id === space?.id ? state.record : null

  return <main className={styles.home}>
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.mark}><Icon name="note" /></span>
        <span className={styles.tag}>AI 공간 점검 · QR 기록</span>
      </div>
      <h1>점검노트</h1>
      <p>빠진 곳과 바뀐 물건을 짚어주는 공간 점검 기록</p>
    </header>

    <section className={styles.features} aria-label="점검노트 주요 기능">
      <img className={styles.illustration} src="/illustrations/inspection-home.png" alt="" />
      <div className={styles.feature}>
        <span className={styles.featureIcon}><Icon name="scan" /></span>
        <div><h2>AI 비교 점검</h2><p>폰으로 찍으면 빠진 곳과 바뀐 물건을 짚어줘요.</p></div>
      </div>
      <div className={styles.feature}>
        <span className={styles.featureIcon}><Icon name="qr" /></span>
        <div><h2>손님용 QR 공유</h2><p>숙소·스튜디오·매장 점검 기록을 QR로 투명하게 보여줘요.</p></div>
      </div>
    </section>

    {space && <Card className={styles.space}>
      <h2>{space.name}</h2>
      <p>구역 {space.zones.length}개 · 마지막 점검 {record ? formatDateTime(record.inspection.at) : '기록 없음'}</p>
      <Button onClick={() => dispatch({ type: 'START_INSPECTION' })}>{space.routeFallback ? '기준 사진으로 동선 다시 만들기' : '점검 시작'}</Button>
      {record && <Button variant="secondary" onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'record' })}>최근 점검 기록 보기</Button>}
    </Card>}
    {state.record && !record && <Button variant="secondary" onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'record' })}>{state.record.space.name} 점검 기록 보기</Button>}

    <div className={styles.actions}>
      <Button className={styles.primary} onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'newSpace' })}><Icon name="camera" />새 공간 등록하기</Button>
      <Button className={styles.secondary} variant="secondary" onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'preview' })}><Icon name="play" />샘플로 체험하기</Button>
    </div>
  </main>
}
