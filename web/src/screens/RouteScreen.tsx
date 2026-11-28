import { useMemo, useState } from 'react'
import { Badge, Button, Card, PageHeader } from '../components'
import { useAppState } from '../state'
import type { RouteStep, Zone } from '../types'
import styles from './RouteScreen.module.css'

export function RouteScreen() {
  const { state, dispatch } = useAppState()
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
  const grouped = useMemo(() => {
    const groups = new Map<string, RouteStep[]>()
    for (const step of [...(state.space?.route ?? [])].sort((a, b) => a.order - b.order)) {
      groups.set(step.zoneId, [...(groups.get(step.zoneId) ?? []), step])
    }
    return [...groups.entries()]
  }, [state.space?.route])
  const route = state.space?.route ?? []
  const highCount = route.filter((step) => step.priority === '높음').length
  const zonePhoto = (zoneId: string) => state.space?.zones.find((zone) => zone.id === zoneId) ?? null

  return <div className={styles.page}>
    <PageHeader title="점검 동선" step={2} totalSteps={4} onBack={() => dispatch({ type: 'SET_SCREEN', screen: 'register' })} />
    <main className={styles.content}>
      {state.space?.routeFallback && <p className={styles.fallback}>샘플 동선을 보여주고 있어요</p>}
      <p className={styles.intro}>이 공간의 점검 동선이에요. 누가 점검해도 이 순서대로 확인하면 돼요</p>
      <p className={styles.summary}>점검 지점 {route.length}개 · 우선 확인 {highCount}개</p>
      <div className={styles.groups}>{grouped.map(([zoneId, steps]) => <section key={zoneId} className={styles.group}>
        <h2>{state.space?.zones.find((zone) => zone.id === zoneId)?.name ?? '구역'}</h2>
        <ol className={styles.timeline}>{steps.map((step) => <li key={step.spotId}>
          <span className={styles.number}>{step.order}</span>
          <button type="button" className={styles.cardButton} onClick={() => setSelectedZone(zonePhoto(zoneId))} aria-label={step.object + ' 기준 사진 보기'}>
            <Card className={styles.stepCard}><div className={styles.title}><strong>{step.object}</strong><Badge tone={step.priority === '높음' ? 'warning' : 'neutral'}>{step.priority}</Badge></div><p>{step.where}</p><p className={styles.reason}>{step.reason}</p><p className={styles.check}>{step.check}</p></Card>
          </button>
        </li>)}</ol>
      </section>)}</div>
      <Button variant="secondary" onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'register' })}>동선 다시 만들기</Button>
    </main>
    <footer className={styles.footer}><Button onClick={() => dispatch({ type: 'START_INSPECTION' })}>이 동선으로 점검 시작</Button></footer>
    {selectedZone && <div className={styles.overlay} role="presentation" onClick={() => setSelectedZone(null)}><section className={styles.sheet} role="dialog" aria-modal="true" aria-label={selectedZone.name + ' 기준 사진'} onClick={(event) => event.stopPropagation()}><div className={styles.sheetHead}><h2>{selectedZone.name}</h2><button type="button" onClick={() => setSelectedZone(null)} aria-label="닫기">닫기</button></div>{selectedZone.baselinePhoto ? <img src={selectedZone.baselinePhoto} alt={selectedZone.name + ' 기준 사진'} /> : <p>등록된 기준 사진이 없습니다</p>}</section></div>}
  </div>
}
