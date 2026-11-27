import { Button, Card } from '../components'
import { formatDateTime } from '../lib/format'
import { useAppState } from '../state'
import styles from './HomeScreen.module.css'
export function HomeScreen() {
  const { state, dispatch } = useAppState()
  const space = state.space
  return <main className={styles.home}>
    <header><h1>점검노트</h1><p>빠진 곳과 바뀐 물건을 짚어주는 공간 점검 기록</p></header>
    <div className={styles.actions}><Button onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'register' })}>새 공간 등록하기</Button><Button variant="secondary" onClick={() => dispatch({ type: 'LOAD_SAMPLE', photos: {}, todayPhotos: {} })}>샘플로 체험하기</Button></div>
    <Button variant="ghost" onClick={() => dispatch({ type: 'RESET_SAMPLE' })}>샘플 초기화</Button>
    {space && <Card className={styles.space}><h2>{space.name}</h2><p>구역 {space.zones.length}개</p><p>마지막 점검 {state.inspection ? formatDateTime(state.inspection.at) : '기록 없음'}</p><Button onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'inspect' })}>점검 시작</Button></Card>}
  </main>
}
