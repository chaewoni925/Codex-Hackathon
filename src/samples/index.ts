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
export const samplePhotoPaths = {
  mainBaseline: '/samples/main-before.jpg',
  mainToday: '/samples/main-after.jpg',
  bathBaseline: '/samples/bath.jpg',
  bathToday: '/samples/bath.jpg',
} as const
export const sampleImageUrl = (key: keyof typeof samplePhotoPaths) => samplePhotoPaths[key]
