import { Button, ErrorBox } from '../components'
import type { Change, ChangeKind, InspectResult, InspectionStatus, RouteStep } from '../types'
import styles from './AnalysisResults.module.css'

export function AnalyzingState() {
  return <div className={styles.analyzing} role="status"><span />기준 사진과 비교하고 있어요</div>
}

export function PersonWarning({ onRetake }: { onRetake: () => void }) {
  return <div className={styles.notice} role="alert"><p>사람이 없는 사진으로 다시 찍어주세요.</p><Button variant="secondary" onClick={onRetake}>다시 찍기</Button></div>
}

export function UncertainNote({ note, onRetake }: { note: string; onRetake: () => void }) {
  return <div className={styles.notice} role="status"><p>{note}</p><Button variant="secondary" onClick={onRetake}>다시 찍기</Button></div>
}

export const findingLabel: Record<ChangeKind, string> = { '새로 생김': '새로 생김', '사라짐': '빠진 곳', '위치 바뀜': '위치 바뀜' }

type ChangeCardProps = { change: Change; spotId: string; number?: number; status?: InspectionStatus; covered?: boolean; enabled: boolean; onStatus: (status: InspectionStatus) => void }

export function ChangeCard({ change, spotId, number = 1, status, covered = true, enabled, onStatus }: ChangeCardProps) {
  return <article id={'finding-' + spotId} className={styles.finding} data-missing={change.change === '사라짐'}>
    <span className={styles.number}>{number}</span>
    <div className={styles.body}>
      <div className={styles.title}><strong>{change.object}</strong><span className={styles.tag}>{findingLabel[change.change]}</span></div>
      <p>{change.where}</p>
      <details className={styles.details}><summary>확인 방법</summary>
        <p>{change.check}</p>
        {!covered && <p>이 지점이 보이도록 다시 찍어주세요.</p>}
        <button type="button" disabled={!enabled} aria-pressed={status === '이상해요'} onClick={() => onStatus('이상해요')}>이상해요</button>
      </details>
    </div>
    <button type="button" className={styles.confirm} aria-label={change.object + ' 확인'} aria-pressed={status === '확인함'} disabled={!enabled} onClick={() => onStatus('확인함')}>{status && status !== '미확인' ? status : '확인'}</button>
  </article>
}

type Props = { result: InspectResult; changes: Change[]; route: RouteStep[]; statuses: Map<string, InspectionStatus>; onStatus: (id: string, status: InspectionStatus) => void; onRetake: () => void }
export function AnalysisResults({ result, changes, route, statuses, onStatus, onRetake }: Props) {
  const uncertainNames = route.filter(spot => result.uncertain.includes(spot.spotId)).map(spot => spot.object)
  const guidance = [uncertainNames.length ? '사진에서 확인하기 어려운 곳: ' + uncertainNames.join(', ') : '', result.note].filter(Boolean).join(' ')
  return <section className={styles.results}>
    <div className={styles.sectionTitle}><h2>확인할 항목</h2>{changes.length > 0 && <span>항목을 눌러 확인 처리</span>}</div>
    {changes.length === 0 && <p className={styles.empty}>기준 사진과 달라진 물건을 찾지 못했어요.</p>}
    {changes.map((change, index) => {
      const id = 'change:' + change.zoneId + ':' + change.object
      return <ChangeCard key={id + index} change={change} spotId={id} number={index + 1} status={statuses.get(id)} enabled onStatus={status => onStatus(id, status)} />
    })}
    {guidance && <UncertainNote note={guidance} onRetake={onRetake} />}
  </section>
}

export function AnalysisError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <ErrorBox message={message} onRetry={onRetry} retryLabel="다시 분석" />
}
