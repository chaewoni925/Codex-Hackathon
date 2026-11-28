import { useRef, useState } from 'react'
import { AlertModal, Button, ErrorBox } from '../components'
import { inspectZone } from '../api'
import { resize } from '../lib/image'
import { calcCoverage } from '../lib/coverage'
import { useAppState } from '../state'
import type { InspectionStatus, RouteStep, Zone } from '../types'
import styles from './InspectScreen.module.css'
import { AnalysisError, AnalysisResults, AnalyzingState, findingLabel, PersonWarning } from './AnalysisResults'
import { sha256 } from '../lib/hash'

import { ActionIcon } from '../components/ActionIcon'

export function InspectScreen() {
  const { state, dispatch } = useAppState()
  const space = state.space
  const inspection = state.inspection
  const zones = space?.zones ?? []
  const [zoneId, setZoneId] = useState(() => (zones.find(item => !inspection?.analysis?.[item.id]) ?? zones[0])?.id)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [analysisErrors, setAnalysisErrors] = useState<Record<string, string>>({})
  const [personZones, setPersonZones] = useState<string[]>([])
  const [reportDialog, setReportDialog] = useState(false)
  const [alertSpot, setAlertSpot] = useState<Pick<RouteStep, 'object' | 'where'>>()
  const fileInput = useRef<HTMLInputElement>(null)
  const zone = zones.find(item => item.id === zoneId) ?? zones[0]
  const route = space?.route.filter(spot => spot.zoneId === zone?.id) ?? []
  const result = zone && inspection?.analysis?.[zone.id]
  const today = inspection?.photos.find(photo => photo.zoneId === zone?.id)?.dataUrl
  const changes = inspection?.changes.filter(change => change.zoneId === zone?.id) ?? []
  const statuses = new Map(inspection?.results.map(item => [item.spotId, item.status]))
  const progress = calcCoverage(space?.route ?? [], inspection?.results ?? [], inspection?.changes ?? [])
  const time = inspection && new Date(inspection.at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
  const coveredCount = result?.coverage.filter(item => item.covered).length ?? 0

  async function compare(target: Zone, loadPhoto: () => Promise<string>) {
    setPhotoBusy(true)
    setAnalysisErrors(current => ({ ...current, [target.id]: '' }))
    setPersonZones(current => current.filter(id => id !== target.id))
    try {
      const data = await loadPhoto()
      if (!data) throw new Error('사진을 불러오지 못했어요.')
      dispatch({ type: 'SET_TODAY_PHOTO', zoneId: target.id, photo: data, sha256: await sha256(data) })
      const outcome = await inspectZone({ zoneId: target.id, baseline: target.baselinePhoto, today: data, spots: route })
      if (outcome.personVisible) {
        dispatch({ type: 'REMOVE_TODAY_PHOTO', zoneId: target.id })
        setPersonZones(current => [...current, target.id])
      } else {
        dispatch({ type: 'SET_ZONE_RESULT', zoneId: target.id, result: outcome })
      }
    } catch (cause) {
      setAnalysisErrors(current => ({ ...current, [target.id]: cause instanceof Error ? cause.message : '사진을 비교하지 못했어요.' }))
    } finally { setPhotoBusy(false) }
  }

  function mark(id: string, status: InspectionStatus) {
    dispatch({ type: 'SET_SPOT_STATUS', spotId: id, status })
    if (status === '이상해요') {
      const item = route.find(spot => spot.spotId === id) ?? changes.find(change => 'change:' + change.zoneId + ':' + change.object === id)
      if (item) setAlertSpot(item)
    }
  }
  function createReport() {
    setReportDialog(false)
    dispatch({ type: 'FINALIZE_INSPECTION', at: new Date().toISOString() })
  }
  const retake = () => fileInput.current?.click()

  return <div className={styles.page}>
    <header className={styles.header}>
      <button type="button" className={styles.back} disabled={photoBusy} onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'route' })} aria-label="점검 동선으로 돌아가기"><ActionIcon name="back" /></button>
      <div className={styles.heading}><h1>{result ? 'AI 점검 결과' : '공간 점검'}</h1><p>{space?.name}{time && ' · ' + time + ' 점검'}</p></div>
      {result && <span className={styles.count}><ActionIcon name="change" />변동 {changes.length}건</span>}
    </header>
    <main className={styles.content}>
      {!space && <ErrorBox message="점검할 공간을 찾을 수 없습니다" onRetry={() => dispatch({ type: 'SET_SCREEN', screen: 'home' })} />}
      {space?.routeFallback && <Button variant="secondary" onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'register' })}>저장된 기준 사진으로 동선 다시 만들기</Button>}
      {zones.length > 1 && <nav className={styles.zones} aria-label="점검 구역">{zones.map(item => <button type="button" key={item.id} disabled={photoBusy} aria-pressed={item.id === zone?.id} onClick={() => setZoneId(item.id)}>{item.name}</button>)}</nav>}
      {zone && <>
        <section className={styles.photoCard} aria-label={zone.name + ' 사진'}>
          <div className={styles.frame}>
            {today || zone.baselinePhoto ? <img src={today || zone.baselinePhoto} alt={zone.name + (today ? ' 오늘 사진' : ' 기준 사진')} /> : <span>등록된 사진 없음</span>}
            {result && changes.length > 0 && <div className={styles.legend} aria-label="사진 변화 목록">{changes.map((change, index) => <button type="button" key={index} data-missing={change.change === '사라짐'} aria-label={(index + 1) + '번 ' + change.object + ' 항목으로 이동'} onClick={() => document.getElementById('finding-change:' + change.zoneId + ':' + change.object)?.scrollIntoView({ block: 'center' })}>{index + 1} {findingLabel[change.change]}</button>)}</div>}
          </div>
          <div className={styles.caption}><span>{result ? (changes.length ? '기준 사진 대비 변화가 감지된 구역' : '기준 사진과 비교한 구역') : zone.name + (today ? ' · 오늘 사진' : ' · 기준 사진')}</span>{result && <span>지점 {coveredCount}/{route.length}</span>}</div>
          {today && zone.baselinePhoto && <details key={zone.id} className={styles.comparison}><summary>기준 사진과 나란히 보기</summary><div>{[zone.baselinePhoto, today].map((src, index) => <figure key={index}><img src={src} alt={zone.name + (index ? ' 오늘 사진 비교' : ' 기준 사진 비교')} /><figcaption>{index ? '오늘 사진' : '기준 사진'}</figcaption></figure>)}</div></details>}
        </section>
        <input ref={fileInput} type="file" accept="image/*" capture="environment" className={styles.file} disabled={photoBusy} onChange={event => {
          const file = event.currentTarget.files?.[0]
          event.currentTarget.value = ''
          if (file) void compare(zone, () => resize(file))
        }} />
        {photoBusy && <AnalyzingState />}
        {personZones.includes(zone.id) && <PersonWarning onRetake={retake} />}
        {analysisErrors[zone.id] && <AnalysisError message={analysisErrors[zone.id]} onRetry={() => today ? void compare(zone, async () => today) : retake()} />}
        {result && <AnalysisResults result={result} changes={changes} route={route} statuses={statuses} onStatus={mark} onRetake={retake} />}
        {route.length > 0 && <details key={'route-' + zone.id + Boolean(result)} className={styles.route} open={result ? undefined : true}>
          <summary>동선 점검 지점 <span>직접 확인 {route.filter(spot => statuses.get(spot.spotId) && statuses.get(spot.spotId) !== '미확인').length}/{route.length}</span></summary>
          {route.map(spot => <article key={spot.spotId}>
            <strong>{spot.object}</strong><p>{spot.where}</p><p>{spot.check}</p>
            {result?.coverage.some(item => item.spotId === spot.spotId && !item.covered) && <small>오늘 사진에서 보이지 않는 지점이에요.</small>}
            <div>{(['확인함','이상해요'] as const).map(option => <button key={option} type="button" aria-pressed={statuses.get(spot.spotId) === option} disabled={!today || photoBusy} onClick={() => mark(spot.spotId, option)}>{option}</button>)}</div>
          </article>)}
        </details>}
      </>}
    </main>
    <footer className={styles.footer}>
      {zone && <button className={today && result ? styles.secondary : styles.primary} type="button" disabled={photoBusy} onClick={retake}><ActionIcon name="camera" />{today ? '다시 촬영해 점검하기' : '오늘 사진 찍기'}</button>}
      <button className={today && result ? styles.save : styles.secondary} type="button" disabled={photoBusy || !inspection} onClick={() => progress.missing.length ? setReportDialog(true) : createReport()}><ActionIcon name="check" />점검 완료 저장하기</button>
    </footer>
    {reportDialog && <div className={styles.modalOverlay}><section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="report-title"><h2 id="report-title">미확인 지점이 있어요</h2><p>아직 확인하지 않은 지점이 {progress.missing.length}곳 있어요. 그대로 저장할까요?</p><Button onClick={createReport}>점검 완료 저장하기</Button><Button variant="secondary" onClick={() => setReportDialog(false)}>계속 확인하기</Button></section></div>}
    {alertSpot && <AlertModal audience="owner" spot={alertSpot} onClose={() => setAlertSpot(undefined)} />}
  </div>
}
