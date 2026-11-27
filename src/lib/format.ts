export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) throw new RangeError('유효하지 않은 날짜입니다')
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = new Intl.DateTimeFormat('ko-KR', { weekday: 'short' }).format(date)
  const hour = date.getHours()
  const minute = String(date.getMinutes()).padStart(2, '0')
  const period = hour < 12 ? '오전' : '오후'
  const displayHour = hour % 12 || 12
  return `${month}월 ${day}일 (${weekday}) ${period} ${displayHour}:${minute}`
}
