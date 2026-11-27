import { Button, Card, ErrorBox, Badge } from '../components'
import type { Change, InspectResult, InspectionStatus, RouteStep } from '../types'
import styles from './AnalysisResults.module.css'

export function AnalyzingState() {
  return <div className={styles.analyzing}><p>기준 사진과 비교하고 있어요</p><div className={styles.skeleton} /><div className={styles.skeleton} /></div>
}

export function PersonWarning({ onRetake }: { onRetake: () => void }) {
  return <div className={styles.person} role="alert"><p>사람이 찍힌 사진은 저장하지 않아요. 사람이 없을 때 다시 찍어주세요</p><Button variant="secondary" onClick={onRetake}>다시 찍기</Button></div>
}

export function UncertainNote({ note, onRetake }: { note: string; onRetake: () => void }) {
  return <div className={styles.uncertain} role="status"><p>{note}</p><Button variant="secondary" onClick={onRetake}>다시 찍기</Button></div>
}

type ChangeCardProps = { change: Change; spotId: string; status?: InspectionStatus; covered?: boolean; enabled: boolean; onStatus: (status: InspectionStatus) => void }
export function ChangeCard({ change, spotId, status, covered = true, enabled, onStatus }: ChangeCardProps) {
  const isNew = change.change === '새로 생김'
  return <Card className={`${styles.changeCard} ${isNew ? styles.newChange : ''} ${status === '이상해요' ? styles.alert : ''}`}>
    {isNew && <Badge tone="warning">새로 생김 · 우선 확인</Badge>}
    <strong>{change.object}</strong><p>{change.where}</p><p className={styles.check}>{change.check}</p>
    {!covered && <><Badge tone="warning">사진에 안 보여요 · 미확인</Badge><p>이 지점이 보이게 한 장 더 찍어주세요</p></>}
    {!enabled && <small>사진을 먼저 찍어주세요</small>}
    <div className={styles.actions}><Button variant={status === '확인함' ? 'primary' : 'secondary'} disabled={!enabled} aria-pressed={status === '확인함'} onClick={() => onStatus('확인함')}>확인함</Button><Button variant={status === '이상해요' ? 'primary' : 'secondary'} disabled={!enabled} aria-pressed={status === '이상해요'} onClick={() => onStatus('이상해요')}>이상해요</Button></div>
  </Card>
}

type Props = { result: InspectResult; changes: Change[]; route: RouteStep[]; statuses: Map<string, InspectionStatus>; onStatus: (id: string, status: InspectionStatus) => void; onRetake: () => void }
export function AnalysisResults({ result, changes, route, statuses, onStatus, onRetake }: Props) {
  const resultCoverage = new Map(result.coverage.map((item) => [item.spotId, item.covered]))
  const records = [
    ...changes.filter((change) => change.change === '새로 생김').map((change) => ({ change, id: `change:${change.zoneId}:${change.object}`, covered: true })),
    ...changes.filter((change) => change.change !== '새로 생김').map((change) => ({ change, id: `change:${change.zoneId}:${change.object}`, covered: true })),
  ]
  return <div className={styles.results}>
    {result.note && <UncertainNote note={result.note} onRetake={onRetake} />}
    <h3>지난 기준 사진과 달라진 것 {changes.length}개</h3>
    {changes.length === 0 ? <p className={styles.empty}>기준 사진과 달라진 물건을 찾지 못했어요. 동선대로 확인해주세요</p> : records.map(({ change, id, covered }) => <ChangeCard key={id} change={change} spotId={id} covered={covered} status={statuses.get(id)} enabled onStatus={(status) => onStatus(id, status)} />)}
    {route.filter((spot) => resultCoverage.get(spot.spotId) === false).map((spot) => <Card key={spot.spotId} className={styles.missing}><Badge tone="warning">사진에 안 보여요 · 미확인</Badge><strong>{spot.object}</strong><p>이 지점이 보이게 한 장 더 찍어주세요</p><div className={styles.actions}><Button variant={statuses.get(spot.spotId) === '확인함' ? 'primary' : 'secondary'} onClick={() => onStatus(spot.spotId, '확인함')}>확인함</Button><Button variant={statuses.get(spot.spotId) === '이상해요' ? 'primary' : 'secondary'} onClick={() => onStatus(spot.spotId, '이상해요')}>이상해요</Button></div></Card>)}
  </div>
}

export function AnalysisError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <ErrorBox message={message} onRetry={onRetry} retryLabel="다시 분석" />
}
