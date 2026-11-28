import { useState } from 'react'
import { ActionIcon } from '../components/ActionIcon'
import { useAppState } from '../state'
import type { Change, InspectResult, InspectionStatus } from '../types'
import { AnalysisResults, findingLabel } from './AnalysisResults'
import styles from './InspectScreen.module.css'
import preview from './PreviewScreen.module.css'

const changes: Change[] = [
  { zoneId: 'studio', object: '테이블 위 리모컨', change: '사라짐', where: '기준 사진에 있던 TV 리모컨이 보이지 않아요.', check: '테이블 주변에 리모컨이 있는지 확인하세요.', priority: '높음' },
  { zoneId: 'studio', object: '창가 스탠드 조명', change: '위치 바뀜', where: '소파 옆에 있던 조명이 창가로 이동했어요.', check: '창가에 있는 조명의 위치를 확인하세요.', priority: '보통' },
]
const example: InspectResult = { personVisible: false, changes, coverage: [], uncertain: [], note: '' }

export function PreviewScreen() {
  const { dispatch } = useAppState()
  const [statuses, setStatuses] = useState(new Map<string, InspectionStatus>())
  const checked = Array.from(statuses.values()).filter(status => status !== '미확인').length
  const home = () => dispatch({ type: 'SET_SCREEN', screen: 'home' })

  return <div className={styles.page}>
    <header className={styles.header}>
      <button type="button" className={styles.back} aria-label="홈으로 돌아가기" onClick={home}><ActionIcon name="back" /></button>
      <div className={styles.heading}><h1>AI 점검 결과</h1><p>스튜디오 201호 · 샘플 체험</p></div>
      <span className={styles.count}><ActionIcon name="change" />변동 2건</span>
    </header>
    <main className={styles.content}>
      <section className={styles.photoCard} aria-label="샘플 거실">
        <div className={styles.frame}>
          <img src="/illustrations/studio-preview.png" alt="회색 소파 앞 원목 테이블과 창가 스탠드 조명이 있는 예시 거실" />
          {changes.map((item, index) => <button key={item.object} className={preview.pin} data-index={index} aria-label={item.object + ' 항목 보기'}
            onClick={() => document.getElementById('finding-change:studio:' + item.object)?.scrollIntoView({ block: 'center' })}>
            {index + 1} {findingLabel[item.change]}
          </button>)}
        </div>
        <div className={styles.caption}><span>기준 사진 대비 변화가 감지된 구역</span><span>확인 {checked}/2</span></div>
      </section>
      <AnalysisResults result={example} changes={changes} route={[]} statuses={statuses}
        onStatus={(id, status) => setStatuses(current => new Map(current).set(id, status))} onRetake={() => dispatch({ type: 'SET_SCREEN', screen: 'newSpace' })} />
    </main>
    <footer className={styles.footer}>
      <button className={styles.primary} onClick={home}><ActionIcon name="check" />체험 완료하기</button>
      <button className={styles.secondary} onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'newSpace' })}><ActionIcon name="camera" />내 공간 사진으로 점검하기</button>
    </footer>
  </div>
}
