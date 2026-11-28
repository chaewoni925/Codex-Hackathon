import { HomeScreen, InspectScreen, RegisterScreen, ReportScreen, RouteScreen } from './screens'
import { PreviewScreen } from './screens/PreviewScreen'
import { Gallery } from './dev/Gallery'
import { GuestScreen } from './screens/GuestScreen'
import { useAppState } from './state'

export function App() {
  const { state } = useAppState()
  switch (state.screen) {
    case 'preview': return <PreviewScreen />
    case 'newSpace': return <RegisterScreen fresh />
    case 'register': return <RegisterScreen />
    case 'route': return <RouteScreen />
    case 'inspect': return <InspectScreen />
    case 'report':
    case 'record': return <ReportScreen />
    case 'guest': return <GuestScreen />
    case 'dev': return <Gallery />
    default: return <HomeScreen />
  }
}
