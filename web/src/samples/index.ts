import type { InspectResult, Space } from '../types'
import spaceData from './main-space.json'
import mainResult from './inspect-main.json'
import bathResult from './inspect-bath.json'
import personResult from './inspect-person.json'

export const sampleSpace = spaceData as Space
export const sampleResults: Record<string, InspectResult> = {
  main: mainResult as InspectResult,
  bath: bathResult as InspectResult,
  person: personResult as InspectResult,
}
