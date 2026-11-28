import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react'
import type { Space, RouteResult, Zone, Inspection, InspectionStatus, InspectResult } from '../types'

type AppState = { screen: 'home' | 'preview' | 'newSpace' | 'register' | 'route' | 'inspect' | 'report' | 'record' | 'guest' | 'dev'; space: Space | null; inspection: Inspection | null; record: { space: Space; inspection: Inspection } | null }
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
const initialState: AppState = { screen: 'home', space: null, inspection: null, record: null }
function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_SCREEN': return { ...state, screen: action.screen }
    case 'SET_SPACE': return { ...state, space: action.space, inspection: state.space?.id === action.space.id ? state.inspection : null }
    case 'ADD_ZONE': return { ...state, space: state.space ? { ...state.space, zones: [...state.space.zones, action.zone] } : null }
    case 'REMOVE_ZONE': return { ...state, space: state.space ? { ...state.space, zones: state.space.zones.filter((zone) => zone.id !== action.zoneId) } : null }
    case 'SET_ROUTE': return { ...state, space: state.space ? { ...state.space, route: action.route.route, routeFallback: action.route.fallback } : null }
    case 'START_INSPECTION':
      if (state.space?.routeFallback) return { ...state, screen: 'register' }
      return { ...state, screen: 'inspect', inspection: { id: crypto.randomUUID(), spaceId: state.space?.id ?? '', at: new Date().toISOString(), photos: [], results: [], changes: [], coverage: { checked: 0, total: state.space?.route.length ?? 0 } } }
    case 'FINALIZE_INSPECTION': {
      if (!state.space || !state.inspection) return state
      const inspection = { ...state.inspection, at: action.at }
      return { ...state, inspection, record: { space: state.space, inspection }, screen: 'report' }
    }
    case 'SET_TODAY_PHOTO':
    case 'REMOVE_TODAY_PHOTO': {
      const inspection = state.inspection
      if (!inspection) return state
      const zoneId = action.zoneId
      const photos = inspection.photos.filter(photo => photo.zoneId !== zoneId)
      if (action.type === 'SET_TODAY_PHOTO') photos.push({ zoneId, dataUrl: action.photo, sha256: action.sha256 })
      const analysis = { ...inspection.analysis }
      delete analysis[zoneId]
      const ids = new Set(state.space?.route.filter(step => step.zoneId === zoneId).map(step => step.spotId))
      const results = inspection.results.filter(item => !ids.has(item.spotId) && !item.spotId.startsWith('change:' + zoneId + ':'))
      const changes = inspection.changes.filter(change => change.zoneId !== zoneId)
      return { ...state, inspection: { ...inspection, photos, results, changes, analysis } }
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
      return { ...state, inspection: { ...state.inspection, results: [...resultMap.values()], analysis: { ...state.inspection.analysis, [action.zoneId]: action.result }, changes, coverage: { checked: [...resultMap.values()].filter((result) => result.status !== '미확인').length, total: zoneSpots.length + changes.filter((item) => item.change === '새로 생김').length } } }
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
    const snapshot = saved as Partial<AppState> & { currentIsRecord?: boolean }
    const record = snapshot.currentIsRecord && saved.space && saved.inspection
      ? { space: saved.space, inspection: saved.inspection  } : saved.record ?? (saved.record === undefined && saved.space && saved.inspection?.spaceId === saved.space.id && saved.inspection.photos.length
        ? { space: saved.space, inspection: saved.inspection } : null)
    return { ...initialState, ...saved, record, screen: initialScreen() }
  })
  useEffect(() => {
    try { localStorage.setItem('jeomgeom:v1', JSON.stringify({ space: state.space, inspection: state.inspection, record: state.record?.inspection === state.inspection && state.record.space === state.space ? null : state.record, currentIsRecord: Boolean(state.record && state.record.inspection === state.inspection && state.record.space === state.space) })) } catch { console.warn('앱 상태를 저장하지 못했습니다.') }
  }, [state.space, state.inspection, state.record])
  useEffect(() => {
    const onHash = () => dispatch({ type: 'SET_SCREEN', screen: initialScreen() })
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return <Context.Provider value={{ state, dispatch }}>{children}</Context.Provider>
}
export function useAppState() {
  const value = useContext(Context)
  if (!value) throw new Error('useAppState는 AppProvider 안에서 사용해야 합니다')
  return value
}
export type { AppState, Action as AppAction }
