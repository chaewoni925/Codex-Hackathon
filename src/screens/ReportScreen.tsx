import { useMemo, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Badge, Button, Card, Disclaimer, ErrorBox, PageHeader, ProgressBar, ToastProvider, useToast } from '../components'
import { getNotice } from '../api'
import { calcCoverage } from '../lib/coverage'
import { formatDateTime } from '../lib/format'
import { encodeSummary, guestUrl } from '../lib/share'
import { shortHash } from '../lib/hash'
import { useAppState } from '../state'
import type { GuestSummary } from '../types'
import styles from './ReportScreen.module.css'

function ReportContent() {
  const { state, dispatch } = useAppState()
  const toast = useToast()
  const [notice, setNotice] = useState<{ listing: string; checkin: string } | null>(null)
  const [noticeLoading, setNoticeLoading] = useState(false)
  const [error, setError] = useState('')
  const linkRef = useRef<HTMLInputElement>(null)
  const space = state.space
  const inspection = state.inspection
  const route = space?.route ?? []
  const coverage = calcCoverage(route, inspection?.results ?? [], inspection?.changes ?? [])
  const summary: GuestSummary = useMemo(() => ({
    spaceName: space?.name ?? '',
    at: inspection?.at ?? new Date().toISOString(),
    coverage: { checked: coverage.checked, total: coverage.total },
    spots: route.map((spot) => ({ order: spot.order, object: spot.object, where: spot.where, check: spot.check })),
    changesCount: inspection?.changes.length ?? 0,
  }), [space?.name, inspection?.at, inspection?.changes.length, coverage.checked, coverage.total, route])
  const guestLink = guestUrl(encodeSummary(summary))
  const lastFinalizedId = useRef('')
  if (inspection && inspection.at !== lastFinalizedId.current && state.screen === 'report') {
    const finalizedAt = new Date().toISOString()
    lastFinalizedId.current = inspection.at
    dispatch({ type: 'FINALIZE_INSPECTION', at: finalizedAt })
  }
  const unconfirmed = coverage.missing.map((id) => {
    const routeSpot = route.find((spot) => spot.spotId === id)
    if (routeSpot) return { id, label: routeSpot.object, where: routeSpot.where }
    const change = inspection?.changes.find((item) => `change:${item.zoneId}:${item.object}` === id)
    return { id, label: change?.object ?? id, where: change?.where ?? '' }
  })
  const alerts = inspection?.results.filter((item) => item.status === '이상해요') ?? []

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const input = linkRef.current
      if (!input) return
      input.value = text
      input.focus()
      input.select()
      document.execCommand('copy')
    }
    toast('링크를 복사했어요')
  }

  async function makeNotice() {
    setNoticeLoading(true)
    setError('')
    try { setNotice(await getNotice(JSON.stringify(summary))) }
    catch (cause) { setError(cause instanceof Error ? cause.message : '안내 문구를 만들지 못했어요.') }
    finally { setNoticeLoading(false) }
  }

  function startNewInspection() {
    dispatch({ type: 'START_INSPECTION' })
  }

  return <div className={styles.page}>
    <PageHeader title="점검 리포트" step={4} totalSteps={4} onBack={() => dispatch({ type: 'SET_SCREEN', screen: 'inspect' })} />
    <main className={styles.content}>
      <Card className={styles.overview}>
        <h2>{space?.name ?? '공간'}</h2><p>{inspection ? formatDateTime(inspection.at) : '점검 기록 없음'}</p>
        <div className={styles.coverage}><strong>{coverage.checked} / {coverage.total}</strong><ProgressBar value={coverage.checked} max={coverage.total} /></div>
      </Card>

      <section className={styles.section}><h2>바뀐 물건</h2>{inspection?.changes.length ? inspection.changes.map((change, index) => {
        const id = `change:${change.zoneId}:${change.object}`
        const status = inspection.results.find((result) => result.spotId === id)?.status
        return <Card key={id + index} className={styles.item}><div><strong>{change.object}</strong><Badge tone={change.change === '새로 생김' ? 'warning' : 'neutral'}>{change.change}</Badge></div><p>{change.where}</p><p>{change.check}</p><small>{status ?? '미확인'}</small></Card>
      }) : <p className={styles.muted}>표시할 변화가 없습니다</p>}</section>

      <section className={styles.section}><h2>확인하지 못한 지점</h2>{unconfirmed.length ? unconfirmed.map((item) => <Card key={item.id} className={styles.warning}><Badge tone="warning">미확인</Badge><strong>{item.label}</strong><p>{item.where}</p></Card>) : <p className={styles.muted}>확인하지 못한 지점이 없습니다</p>}</section>

      {alerts.length > 0 && <section className={styles.section}><h2>이상해요로 표시한 지점</h2>{alerts.map((alert) => {
        const spot = route.find((item) => item.spotId === alert.spotId)
        const change = inspection?.changes.find((item) => `change:${item.zoneId}:${item.object}` === alert.spotId)
        return <Card key={alert.spotId} className={styles.warning}><strong>{spot?.object ?? change?.object ?? alert.spotId}</strong><p>{spot?.where ?? change?.where ?? ''}</p></Card>
      })}</section>}

      <Card className={styles.share}>
        <h2>손님과 공유</h2>
        <QRCodeSVG value={guestLink} size={200} />
        <input ref={linkRef} className={styles.link} readOnly value={guestLink} aria-label="공유 링크" />
        <div className={styles.actions}><Button variant="secondary" onClick={() => void copyText(guestLink)}>링크 복사</Button><Button variant="ghost" onClick={() => window.open(guestLink, '_blank', 'noopener,noreferrer')}>미리보기</Button></div>
      </Card>

      {inspection?.photos.some((photo) => photo.sha256) && <section className={styles.section}><h2>사진 지문</h2>{inspection.photos.filter((photo) => photo.sha256).map((photo) => <p key={photo.zoneId}>{space?.zones.find((zone) => zone.id === photo.zoneId)?.name ?? '구역'} · 사진 지문 {shortHash(photo.sha256)}</p>)}<small>사진이 바뀌면 지문도 달라져요</small></section>}

      <section className={styles.section}><h2>안내 문구</h2>{!notice && <Button variant="secondary" loading={noticeLoading} onClick={() => void makeNotice()}>안내 문구 만들기</Button>}{notice && <><Card><h3>숙소 소개용</h3><p>{notice.listing}</p><Button variant="secondary" onClick={() => void copyText(notice.listing)}>복사</Button></Card><Card><h3>체크인 메시지용</h3><p>{notice.checkin}</p><Button variant="secondary" onClick={() => void copyText(notice.checkin)}>복사</Button></Card></>}</section>
      {error && <ErrorBox message={error} onRetry={() => void makeNotice()} />}
      <Disclaimer />
      <div className={styles.bottomActions}><Button onClick={startNewInspection}>새 점검 시작</Button><Button variant="secondary" onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'home' })}>홈으로</Button></div>
    </main>
  </div>
}

export function ReportScreen() {
  return <ToastProvider><ReportContent /></ToastProvider>
}
