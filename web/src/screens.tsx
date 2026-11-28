type ScreenProps = {
  onNext: () => void
}
export { HomeScreen } from './screens/HomeScreen'
export { RegisterScreen } from './screens/RegisterScreen'
export { RouteScreen } from './screens/RouteScreen'
export { InspectScreen } from './screens/InspectScreen'
export { ReportScreen } from './screens/ReportScreen'
export { GuestScreen } from './screens/GuestScreen'

function Screen({ title, onNext }: ScreenProps & { title: string }) {
  return (
    <>
      <h1>{title}</h1>
      <button type="button" onClick={onNext}>다음</button>
    </>
  )
}

export function DevScreen(props: ScreenProps) {
  return <Screen title="개발용 화면" {...props} />
}
