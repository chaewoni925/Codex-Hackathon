import { useEffect, useMemo, useState } from 'react'
import { AlertModal, Button, Card, ErrorBox, PageHeader, ProgressBar, Spinner } from '../components'
import { inspectZone } from '../api'
import { resize } from '../lib/image'
import { calcCoverage } from '../lib/coverage'
import { useAppState } from '../state'
import type { InspectionStatus, RouteStep, Zone } from '../types'
import styles from './InspectScreen.module.css'
import { AnalysisError, AnalysisResults, AnalyzingState, PersonWarning, UncertainNote } from './AnalysisResults'
import { sha256 } from '../lib/hash'
import { sampleImageUrl, sampleResults } from '../samples'
import { fetchSampleDataUrl } from '../state'

const statusOptions: InspectionStatus[] = ['확인함', '이상해요']

export function InspectScreen() {
  const { state, dispatch } = useAppState()
  const [openZone, setOpenZone] = useState<string | null>(null)
  const [photoBusy, setPhotoBusy] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [analysisErrors, setAnalysisErrors] = useState<Record<string, string>>({})
  const [personZones, setPersonZones] = useState<string[]>([])
  const [resultsByZone, setResultsByZone] = useState<Record<string, import('../types').InspectResult>>({})
  const [reportDialog, setReportDialog] = useState(false)
  const [alertSpot, setAlertSpot] = useState<RouteStep | undefined>()
  const space = state.space
  const inspection = state.inspection
  const zones = space?.zones ?? []
  const progress = calcCoverage(space?.route ?? [], inspection?.results ?? [], inspection?.changes ?? [])

  useEffect(() => {
    if (openZone || zones.length === 0) return
    const firstIncomplete = zones.find((zone) => {
      const zoneRoute = space?.route.filter((step) => step.zoneId === zone.id) ?? []
      return zoneRoute.some((step) => !inspection?.results.some((result) => result.spotId === step.spotId && result.status !== '미확인'))
    })
    setOpenZone(firstIncomplete?.id ?? zones[0].id)
  }, [zones, space?.route, inspection?.results, openZone])

  const routeByZone = useMemo(() => {
    const grouped = new Map<string, RouteStep[]>()
    for (const step of [...(space?.route ?? [])].sort((a, b) => a.order - b.order)) grouped.set(step.zoneId, [...(grouped.get(step.zoneId) ?? []), step])
    return grouped
  }, [space?.route])

  async function handlePhoto(zone: Zone, file?: File) {
    if (!file) return
    setPhotoBusy(zone.id); setError(''); setAnalysisErrors((current) => ({ ...current, [zone.id]: '' }))
    try {
      const today = await resize(file)
      const sha256 = await hashPhotoIfAvailable(today)
      dispatch({ type: 'SET_TODAY_PHOTO', zoneId: zone.id, photo: today, sha256 })
      setAnalyzing(zone.id)
      const result = await inspectZone({ zoneId: zone.id, baseline: zone.baselinePhoto, today, spots: routeByZone.get(zone.id) ?? [] })
      if (result.personVisible) {
        dispatch({ type: 'REMOVE_TODAY_PHOTO', zoneId: zone.id })
        setPersonZones((current) => current.includes(zone.id) ? current : [...current, zone.id])
        setResultsByZone((current) => { const next = { ...current }; delete next[zone.id]; return next })
      } else {
        setPersonZones((current) => current.filter((id) => id !== zone.id))
        setResultsByZone((current) => ({ ...current, [zone.id]: result }))
        dispatch({ type: 'SET_ZONE_RESULT', zoneId: zone.id, result })
      }
    } catch (cause) { setAnalysisErrors((current) => ({ ...current, [zone.id]: cause instanceof Error ? cause.message : '사진을 분석하지 못했어요.' })) }
    finally { setPhotoBusy(null); setAnalyzing(null) }
  }

  async function useSamplePhoto(zone: Zone, personExample = false) {
    setPhotoBusy(zone.id)
    setAnalyzing(zone.id)
    setError('')
    setAnalysisErrors((current) => ({ ...current, [zone.id]: '' }))
    await new Promise((resolve) => window.setTimeout(resolve, 600))
    try {
      if (personExample) {
        dispatch({ type: 'REMOVE_TODAY_PHOTO', zoneId: zone.id })
        setPersonZones((current) => [...new Set([...current, zone.id])])
        setResultsByZone((current) => ({ ...current, [zone.id]: sampleResults.person }))
        return
      }
      const photoKey = zone.id === 'main' ? 'mainToday' : 'bathToday'
      const today = await fetchSampleDataUrl(sampleImageUrl(photoKey))
      if (!today) {
        setError('샘플 사진이 없어 회색 미리보기를 표시합니다.')
        dispatch({ type: 'SET_TODAY_PHOTO', zoneId: zone.id, photo: '', sha256: '' })
      } else dispatch({ type: 'SET_TODAY_PHOTO', zoneId: zone.id, photo: today, sha256: await sha256(today) })
      const result = sampleResults[zone.id === 'main' ? 'main' : 'bath']
      setPersonZones((current) => current.filter((id) => id !== zone.id))
      setResultsByZone((current) => ({ ...current, [zone.id]: result }))
      dispatch({ type: 'SET_ZONE_RESULT', zoneId: zone.id, result })
    } finally {
      setPhotoBusy(null)
      setAnalyzing(null)
    }
  }

  async function reanalyze(zone: Zone) {
    const today = inspection?.photos.find((photo) => photo.zoneId === zone.id)?.dataUrl
    if (!today) return
    setAnalyzing(zone.id); setAnalysisErrors((current) => ({ ...current, [zone.id]: '' }))
    try {
      const result = await inspectZone({ zoneId: zone.id, baseline: zone.baselinePhoto, today, spots: routeByZone.get(zone.id) ?? [] })
      if (result.personVisible) {
        dispatch({ type: 'REMOVE_TODAY_PHOTO', zoneId: zone.id })
        setPersonZones((current) => [...new Set([...current, zone.id])])
      } else {
        setPersonZones((current) => current.filter((id) => id !== zone.id))
        setResultsByZone((current) => ({ ...current, [zone.id]: result }))
        dispatch({ type: 'SET_ZONE_RESULT', zoneId: zone.id, result })
      }
    } catch (cause) { setAnalysisErrors((current) => ({ ...current, [zone.id]: cause instanceof Error ? cause.message : '사진을 분석하지 못했어요.' })) }
    finally { setAnalyzing(null) }
  }

  function onAlert(spot: RouteStep) {
    setAlertSpot(spot)
  }

  function changeStatus(spot: RouteStep, status: InspectionStatus) {
    dispatch({ type: 'SET_SPOT_STATUS', spotId: spot.spotId, status })
    if (status === '이상해요') onAlert(spot)
  }

  function createReport() {
    setReportDialog(false)
    dispatch({ type: 'SET_SCREEN', screen: 'report' })
  }

  return <div className={styles.page}>
    <div className={styles.sticky}>
      <PageHeader title="점검" step={3} totalSteps={4} onBack={() => dispatch({ type: 'SET_SCREEN', screen: 'route' })} />
      {state.sampleMode && <span className={styles.sampleBadge}>샘플 모드</span>}
      <div className={styles.progress}><strong>{space?.name ?? '공간'}</strong><ProgressBar value={progress.checked} max={progress.total} /><span>미확인 {progress.missing.length}곳</span></div>
    </div>
    <main className={styles.content}>
      {!space && <ErrorBox message="점검할 공간을 찾을 수 없습니다" onRetry={() => dispatch({ type: 'SET_SCREEN', screen: 'home' })} />}
      {error && <ErrorBox message={error} onRetry={() => setError('')} />}
      {zones.map((zone, index) => {
        const route = routeByZone.get(zone.id) ?? []
        const completed = route.filter((step) => inspection?.results.some((result) => result.spotId === step.spotId && result.status !== '미확인')).length
        const today = inspection?.photos.find((photo) => photo.zoneId === zone.id)?.dataUrl
        const expanded = openZone === zone.id
        return <section key={zone.id} className={styles.zone}>
          <button className={styles.accordion} type="button" aria-expanded={expanded} onClick={() => setOpenZone(expanded ? null : zone.id)}><strong>{zone.name}</strong><span>완료 {completed}/{route.length}</span></button>
          {expanded && <div className={styles.zoneBody}>
            <div className={styles.photos}>
              <figure><figcaption>기준 사진</figcaption>{zone.baselinePhoto ? <img src={zone.baselinePhoto} alt={zone.name + ' 기준 사진'} /> : <div className={styles.noPhoto}>사진 없음</div>}</figure>
              <figure><figcaption>오늘 사진</figcaption>{today ? <img src={today} alt={zone.name + ' 오늘 사진'} /> : <label className={styles.upload}>{photoBusy === zone.id ? <Spinner label="사진 변환 중" /> : '오늘 사진 찍기'}<input id={`photo-${zone.id}`} type="file" accept="image/*" capture="environment" disabled={photoBusy === zone.id} onChange={(event) => { void handlePhoto(zone, event.target.files?.[0]); event.currentTarget.value = '' }} /></label>}</figure>
            </div>
            {state.sampleMode && <div className={styles.sampleActions}><Button variant="secondary" disabled={Boolean(photoBusy)} onClick={() => void useSamplePhoto(zone)}>샘플 사진 사용</Button><Button variant="ghost" disabled={Boolean(photoBusy)} onClick={() => void useSamplePhoto(zone, true)}>사람 찍힌 사진 예시</Button></div>}
            <div className={styles.analysis} aria-label="분석 결과 영역">
              {personZones.includes(zone.id) && <PersonWarning onRetake={() => document.getElementById(`photo-${zone.id}`)?.click()} />}
              {analyzing === zone.id && <AnalyzingState />}
              {analysisErrors[zone.id] && <AnalysisError message={analysisErrors[zone.id]} onRetry={() => void reanalyze(zone)} />}
              {resultsByZone[zone.id] && resultsByZone[zone.id].uncertain.length > 0 && <UncertainNote note={resultsByZone[zone.id].uncertain.join(' · ')} onRetake={() => document.getElementById(`photo-${zone.id}`)?.click()} />}
              {resultsByZone[zone.id] && <AnalysisResults result={resultsByZone[zone.id]} changes={inspection?.changes.filter((change) => change.zoneId === zone.id) ?? []} route={route} statuses={new Map((inspection?.results ?? []).map((item) => [item.spotId, item.status]))} onStatus={(spotId, status) => {
                const match = route.find((item) => item.spotId === spotId)
                if (match) changeStatus(match, status)
                else { dispatch({ type: 'SET_SPOT_STATUS', spotId, status }); if (status === '이상해요') console.log('점검 변화 항목에 확인이 필요합니다', spotId) }
              }} onRetake={() => document.getElementById(`photo-${zone.id}`)?.click()} />}
            </div>
            {route.map((spot) => {
              const current = inspection?.results.find((result) => result.spotId === spot.spotId)?.status
              return <Card key={spot.spotId} className={`${styles.spot} ${current === '이상해요' ? styles.alert : ''}`}>
                <div className={styles.spotTitle}><span className={styles.order}>{spot.order}</span><strong>{spot.object}</strong></div>
                <p>{spot.where}</p><p>{spot.check}</p>
                {!today && <small>사진을 먼저 찍어주세요</small>}
                <div className={styles.toggles}>{statusOptions.map((option) => <Button key={option} variant={current === option ? 'primary' : 'secondary'} disabled={!today || Boolean(resultsByZone[zone.id]?.coverage.some((item) => item.spotId === spot.spotId && !item.covered))} aria-pressed={current === option} onClick={() => changeStatus(spot, option)}>{option}</Button>)}</div>
              </Card>
            })}
          </div>}
        </section>
      })}
    </main>
    <footer className={styles.footer}><Button onClick={() => progress.missing.length ? setReportDialog(true) : createReport()}>리포트 만들기</Button></footer>
    {reportDialog && <div className={styles.modalOverlay} role="presentation"><section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="report-title"><h2 id="report-title">미확인 지점이 있어요</h2><p>아직 확인하지 않은 지점이 {progress.missing.length}곳 있어요. 그대로 리포트를 만들까요?</p><div><Button variant="secondary" onClick={() => setReportDialog(false)}>계속 확인하기</Button><Button onClick={createReport}>리포트 만들기</Button></div></section></div>}
    {alertSpot && <AlertModal audience="owner" spot={alertSpot} onClose={() => setAlertSpot(undefined)} />}
  </div>
}

async function hashPhotoIfAvailable(photo: string): Promise<string> {
  return sha256(photo)
}
