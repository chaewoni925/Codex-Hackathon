import { useEffect, useState } from 'react'
import {
  HomeScreen,
  InspectScreen,
  RegisterScreen,
  ReportScreen,
  RouteScreen,
} from './screens'
import { Gallery } from './dev/Gallery'
import { useAppState } from './state'
import { GuestScreen } from './screens/GuestScreen'
import type { ComponentType } from 'react'
type OnNextScreen = { onNext: () => void }

const screens: ComponentType<OnNextScreen>[] = [HomeScreen, RegisterScreen, RouteScreen, InspectScreen, ReportScreen]

function getHashScreen() {
  const { hash } = window.location
  if (hash.startsWith('#/g/')) return GuestScreen
  return null
}

export function App() {
  const { state, dispatch } = useAppState()
  const [hashGuest, setHashGuest] = useState(window.location.hash.startsWith('#/g/'))
  const [step, setStep] = useState(0)
  const [, setHashScreen] = useState(getHashScreen)

  useEffect(() => {
    function syncHash() {
      setHashScreen(() => getHashScreen())
      setHashGuest(window.location.hash.startsWith('#/g/'))
      setStep(0)
    }

    window.addEventListener('hashchange', syncHash)
    return () => window.removeEventListener('hashchange', syncHash)
  }, [])

  if (state.screen === 'dev' || window.location.hash === '#/dev') return <Gallery />
  if (state.screen === 'home') return <HomeScreen />
  if (state.screen === 'register') return <RegisterScreen />
  if (hashGuest) return <GuestScreen />
  const CurrentScreen = screens[step]

  return (
    <main>
      <CurrentScreen onNext={() => dispatch({ type: 'SET_SCREEN', screen: (['home','register','route','inspect','report'][(['home','register','route','inspect','report'].indexOf(state.screen) + 1) % 5]) as 'home' | 'register' | 'route' | 'inspect' | 'report' })} />
    </main>
  )
}
