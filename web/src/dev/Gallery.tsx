import { useState } from 'react'
import { Badge, Button, Card, Disclaimer, EmptyState, ErrorBox, PageHeader, ProgressBar, Spinner, ToastProvider, useToast } from '../components'
import styles from './Gallery.module.css'

function ToastExample() {
  const toast = useToast()
  return <Button variant="secondary" onClick={() => toast('복사 완료')}>토스트 보기</Button>
}

function GalleryContent() {
  const [loading, setLoading] = useState(false)
  const demoLoading = () => {
    setLoading(true)
    window.setTimeout(() => setLoading(false), 1200)
  }
  return <main className={styles.gallery}>
    <PageHeader title="컴포넌트 갤러리" step={2} totalSteps={4} onBack={() => { window.location.hash = '' }} />
    <section className={styles.section}><h2>버튼</h2><div className={styles.row}><Button onClick={demoLoading}>Primary</Button><Button variant="secondary">Secondary</Button><Button variant="ghost">Ghost</Button></div><div className={styles.row}><Button disabled>비활성화</Button><Button loading={loading} onClick={demoLoading}>로딩</Button></div></section>
    <section className={styles.section}><h2>카드와 배지</h2><Card>기본 카드</Card><Card selected>선택된 카드</Card><div className={styles.row}><Badge>Neutral</Badge><Badge tone="point">Point</Badge><Badge tone="warning">Warning</Badge><Badge tone="danger">Danger</Badge></div></section>
    <section className={styles.section}><h2>진행 상태</h2><ProgressBar value={2} max={4} /><Spinner /></section>
    <section className={styles.section}><h2>빈 화면과 오류</h2><EmptyState message="표시할 항목이 없습니다" actionLabel="다시 불러오기" onAction={() => {}} /><ErrorBox message="요청을 처리하지 못했습니다" onRetry={() => {}} /></section>
    <section className={styles.section}><h2>알림과 안내</h2><ToastExample /><Disclaimer /></section>
  </main>
}

export function Gallery() {
  return <ToastProvider><GalleryContent /></ToastProvider>
}
