import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react'
import type { Space, RouteResult, Zone, Inspection, InspectionStatus, InspectResult } from '../types'
import { sampleSpace, samplePhotoPaths } from '../samples'

type AppState = { screen: 'home' | 'register' | 'route' | 'inspect' | 'report' | 'guest' | 'dev'; space: Space | null; inspection: Inspection | null; sampleMode: boolean }
type Action =
  | { type: 'SET_SCREEN'; screen: AppState['screen'] }
  | { type: 'SET_SPACE'; space: Space }
  | { type: 'ADD_ZONE'; zone: Zone }
  | { type: 'REMOVE_ZONE'; zoneId: string }
  | { type: 'SET_ROUTE'; route: RouteResult }
  | { type: 'START_INSPECTION' }
  | { type: 'FINALIZE_INSPECTION'; at: string }
  | { type: 'SET_TODAY_PHOTO'; zoneId: string; photo: string; sha256: string }
  | { type: 'REMOVE_TODAY_PHOTO'; zoneId: string }
  | { type: 'SET_ZONE_RESULT'; zoneId: string; result: InspectResult }
  | { type: 'SET_SPOT_STATUS'; spotId: string; status: InspectionStatus }
  | { type: 'RESET' }
  | { type: 'LOAD_SAMPLE'; photos: Record<string, string>; todayPhotos: Record<string, string> }
  | { type: 'RESET_SAMPLE' }
const initialState: AppState = { screen: 'home', space: null, inspection: null, sampleMode: false }
function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_SCREEN': return { ...state, screen: action.screen }
    case 'SET_SPACE': return { ...state, space: action.space }
    case 'ADD_ZONE': return { ...state, space: state.space ? { ...state.space, zones: [...state.space.zones, action.zone] } : null }
    case 'REMOVE_ZONE': return { ...state, space: state.space ? { ...state.space, zones: state.space.zones.filter((zone) => zone.id !== action.zoneId) } : null }
    case 'SET_ROUTE': return { ...state, space: state.space ? { ...state.space, route: action.route.route, routeFallback: action.route.fallback } : null }
    case 'START_INSPECTION': return { ...state, screen: 'inspect', inspection: { id: crypto.randomUUID(), spaceId: state.space?.id ?? '', at: new Date().toISOString(), photos: [], results: [], changes: [], coverage: { checked: 0, total: state.space?.route.length ?? 0 } } }
    case 'FINALIZE_INSPECTION': return { ...state, inspection: state.inspection ? { ...state.inspection, at: action.at } : null }
    case 'SET_TODAY_PHOTO': {
      if (!state.inspection) return state
      const photos = state.inspection.photos.filter((photo) => photo.zoneId !== action.zoneId)
      photos.push({ zoneId: action.zoneId, dataUrl: action.photo, sha256: action.sha256 })
      return { ...state, inspection: { ...state.inspection, photos } }
    }
    case 'REMOVE_TODAY_PHOTO': {
      if (!state.inspection) return state
      return { ...state, inspection: { ...state.inspection, photos: state.inspection.photos.filter((photo) => photo.zoneId !== action.zoneId) } }
    }
    case 'SET_ZONE_RESULT': {
      if (!state.inspection) return state
      const zoneSpots = state.space?.route.filter((step) => step.zoneId === action.zoneId) ?? []
      const resultMap = new Map(state.inspection.results.map((result) => [result.spotId, result]))
      for (const covered of action.result.coverage) {
        const previous = resultMap.get(covered.spotId)
        resultMap.set(covered.spotId, { ...covered, status: previous?.status ?? '미확인' })
      }
      const changes = [...state.inspection.changes.filter((change) => change.zoneId !== action.zoneId), ...action.result.changes.map((change) => ({ ...change, zoneId: action.zoneId }))]
      for (const change of changes.filter((item) => item.zoneId === action.zoneId && item.change === '새로 생김')) {
        const key = `change:${action.zoneId}:${change.object}`
        const previous = resultMap.get(key)
        resultMap.set(key, { spotId: key, covered: true, status: previous?.status ?? '미확인' })
      }
      return { ...state, inspection: { ...state.inspection, results: [...resultMap.values()], changes, coverage: { checked: [...resultMap.values()].filter((result) => result.status !== '미확인').length, total: zoneSpots.length + changes.filter((item) => item.change === '새로 생김').length } } }
    }
    case 'SET_SPOT_STATUS': {
      if (!state.inspection) return state
      const existing = state.inspection.results.find((result) => result.spotId === action.spotId)
      const results = existing
        ? state.inspection.results.map((result) => result.spotId === action.spotId ? { ...result, status: action.status } : result)
        : [...state.inspection.results, { spotId: action.spotId, covered: true, status: action.status }]
      return { ...state, inspection: { ...state.inspection, results, coverage: { checked: results.filter((result) => result.status !== '미확인').length, total: state.space?.route.length ?? 0 } } }
    }
    case 'RESET': return initialState
    case 'LOAD_SAMPLE': return { ...state, screen: 'route', sampleMode: true, space: { ...sampleSpace, zones: sampleSpace.zones.map((zone) => ({ ...zone, baselinePhoto: action.photos[zone.id] ?? '' })) }, inspection: { id: 'sample-inspection', spaceId: sampleSpace.id, at: new Date().toISOString(), photos: Object.entries(action.todayPhotos).filter(([, dataUrl]) => Boolean(dataUrl)).map(([zoneId, dataUrl]) => ({ zoneId, dataUrl, sha256: '' })), results: [], changes: [], coverage: { checked: 0, total: sampleSpace.route.length } } }
    case 'RESET_SAMPLE': return { ...initialState, screen: 'home' }
  }
}
const Context = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | null>(null)
function initialScreen(): AppState['screen'] {
  if (location.hash.startsWith('#/g/')) return 'guest'
  if (location.hash === '#/dev') return 'dev'
  return 'home'
}
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    let saved: Partial<AppState> = {}
    try { saved = JSON.parse(localStorage.getItem('jeomgeom:v1') ?? '{}') as Partial<AppState> } catch { console.warn('저장된 앱 상태를 읽지 못했습니다.') }
    return { ...initialState, ...saved, screen: initialScreen() }
  })
  useEffect(() => {
    if (state.sampleMode) return
    try { localStorage.setItem('jeomgeom:v1', JSON.stringify({ space: state.space, inspection: state.inspection })) } catch { console.warn('앱 상태를 저장하지 못했습니다.') }
  }, [state.space, state.inspection, state.sampleMode])
  async function loadSample() {
    const paths = { main: samplePhotoPaths.mainBaseline, bath: samplePhotoPaths.bathBaseline, mainToday: samplePhotoPaths.mainToday, bathToday: samplePhotoPaths.bathToday }
    const photos = Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([id, path]) => [id, await fetchSampleDataUrl(path)])))
    dispatch({ type: 'LOAD_SAMPLE', photos: { main: photos.main ?? '', bath: photos.bath ?? '' }, todayPhotos: { main: photos.mainToday ?? '', bath: photos.bathToday ?? '' } })
  }
  const sampleDispatch = (action: Action) => {
    if (action.type === 'LOAD_SAMPLE') void loadSample()
    else dispatch(action)
  }
  useEffect(() => {
    const onHash = () => dispatch({ type: 'SET_SCREEN', screen: initialScreen() })
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return <Context.Provider value={{ state, dispatch: sampleDispatch }}>{children}</Context.Provider>
}
export async function fetchSampleDataUrl(path: string): Promise<string> {
  try {
    const response = await fetch(path)
    if (!response.ok) throw new Error('샘플 파일을 찾을 수 없습니다')
    const blob = await response.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
  } catch (cause) {
    console.warn('샘플 사진을 불러오지 못했습니다.', path, cause)
    return ''
  }
}
export function useAppState() {
  const value = useContext(Context)
  if (!value) throw new Error('useAppState는 AppProvider 안에서 사용해야 합니다')
  return value
}
export type { AppState, Action as AppAction }
