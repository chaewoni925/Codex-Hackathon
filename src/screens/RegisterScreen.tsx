import { useRef, useState } from 'react'
import type { Space, SpaceType, Zone } from '../types'
import { Button, Card, ErrorBox, PageHeader, Spinner } from '../components'
import { getRoute } from '../api'
import { resize } from '../lib/image'
import { useAppState } from '../state'
import styles from './RegisterScreen.module.css'

const types: SpaceType[] = ['숙소', '탈의실', '스터디룸', '화장실']
const suggestions: Partial<Record<SpaceType, string[]>> = { 숙소: ['침실', '욕실', '거실'], 탈의실: ['탈의 공간', '샤워실'] }
const newZone = (index: number): Zone => ({ id: crypto.randomUUID(), name: `구역 ${index}`, baselinePhoto: '' })
export function RegisterScreen() {
  const { state, dispatch } = useAppState()
  const [name, setName] = useState(state.space?.name ?? '')
  const [type, setType] = useState<SpaceType | ''>(state.space?.type ?? '')
  const [zones, setZones] = useState<Zone[]>(state.space?.zones ?? [newZone(1)])
  const [busyZone, setBusyZone] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [person, setPerson] = useState(false)
  const [loading, setLoading] = useState(false)
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const valid = Boolean(name.trim() && type && zones.some((zone) => zone.name.trim() && zone.baselinePhoto))
  const update = (id: string, changes: Partial<Zone>) => setZones((current) => current.map((zone) => zone.id === id ? { ...zone, ...changes } : zone))
  async function upload(zoneId: string, file?: File) {
    if (!file) return
    setBusyZone(zoneId); setError('')
    try { update(zoneId, { baselinePhoto: await resize(file) }); setPerson(false) }
    catch (cause) { setError(cause instanceof Error ? cause.message : '사진을 불러오지 못했어요.') }
    finally { setBusyZone(null) }
  }
  async function submit() {
    if (!valid || !type) return
    const space: Space = { id: state.space?.id ?? crypto.randomUUID(), type, name: name.trim(), zones, route: [] }
    dispatch({ type: 'SET_SPACE', space })
    setLoading(true); setError(''); setPerson(false)
    try {
      const result = await getRoute(type, zones)
      if (result.personVisible) {
        setZones((current) => current.map((zone) => ({ ...zone, baselinePhoto: '' })))
        setPerson(true)
        dispatch({ type: 'SET_SPACE', space: { ...space, zones: space.zones.map((zone) => ({ ...zone, baselinePhoto: '' })) } })
        return
      }
      dispatch({ type: 'SET_ROUTE', route: result })
      dispatch({ type: 'SET_SCREEN', screen: 'route' })
    } catch (cause) { setError(cause instanceof Error ? cause.message : '점검 동선을 만들지 못했어요.') }
    finally { setLoading(false) }
  }
  return <div className={styles.page}>
    <PageHeader title="새 공간 등록" step={1} totalSteps={4} onBack={() => dispatch({ type: 'SET_SCREEN', screen: 'home' })} />
    <div className={styles.content}>
      <label className={styles.field}>공간 이름<input value={name} placeholder="예: 성수 파티룸 A" onChange={(event) => setName(event.target.value)} /></label>
      <fieldset><legend>공간 유형</legend><div className={styles.types}>{types.map((item) => <button type="button" key={item} aria-pressed={type === item} className={type === item ? styles.active : ''} onClick={() => setType(item)}>{item}</button>)}</div></fieldset>
      <section className={styles.zones}><h2>구역 목록</h2>{zones.map((zone, index) => <Card key={zone.id} className={styles.zone}>
        <label className={styles.field}>구역 이름<input value={zone.name} onChange={(event) => update(zone.id, { name: event.target.value })} /></label>
        {zone.baselinePhoto && <img className={styles.thumbnail} src={zone.baselinePhoto} alt={zone.name + ' 기준 사진'} />}
        <input className={styles.file} type="file" accept="image/*" capture="environment" ref={(element) => { fileRefs.current[zone.id] = element }} onChange={(event) => { void upload(zone.id, event.target.files?.[0]); event.currentTarget.value = '' }} />
        <div className={styles.row}><Button variant="secondary" onClick={() => fileRefs.current[zone.id]?.click()}>{zone.baselinePhoto ? '다시 찍기' : '사진 올리기'}</Button>{zones.length > 1 && <Button variant="ghost" onClick={() => setZones((current) => current.filter((item) => item.id !== zone.id))}>삭제</Button>}{busyZone === zone.id && <Spinner label="사진 변환 중" />}</div>
        {index === 0 && suggestions[type as SpaceType]?.length ? <div className={styles.chips}>{suggestions[type as SpaceType]?.map((suggestion) => <button type="button" key={suggestion} onClick={() => update(zone.id, { name: suggestion })}>{suggestion}</button>)}</div> : null}
      </Card>)}<Button variant="secondary" onClick={() => setZones((current) => [...current, newZone(current.length + 1)])}>+ 구역 추가</Button></section>
      <p className={styles.guide}>문 앞에서 구역 전체가 보이게 찍어주세요. 다음 점검 때도 같은 자리에서 찍으면 변화를 더 잘 찾아요</p>
      {person && <p className={styles.person}>사람이 찍힌 사진은 저장하지 않아요. 사람이 없을 때 다시 찍어주세요</p>}
      {error && <ErrorBox message={error} onRetry={() => { setError(''); void submit() }} />}
    </div>
    <footer className={styles.footer}>{loading && <p>사진을 보고 점검 지점을 찾고 있어요</p>}<Button disabled={!valid || loading || Boolean(busyZone)} loading={loading} onClick={() => void submit()}>점검 동선 만들기</Button></footer>
  </div>
}
