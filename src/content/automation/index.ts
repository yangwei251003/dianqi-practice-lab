import type { Lesson } from '../../core/types'
import { reactiveCompensation } from './compensation'
import { drainControl } from './drain'
import { lineVoltageDrop, radialLocation } from './feeder'
import { distributionTransformer, islandGenerator } from './generation'
import { stepperPosition } from './positioning'
import { feederRecorder } from './protection'
import { hydrostaticLevel, inductiveDetector, photoCounter } from './sensing'
import { pneumaticSorter } from './sorter'

export const lessons: Lesson[] = [
  photoCounter, inductiveDetector, hydrostaticLevel, drainControl, stepperPosition, pneumaticSorter,
  islandGenerator, distributionTransformer, lineVoltageDrop, radialLocation, feederRecorder, reactiveCompensation,
]

export { advanceDrain, drainLadder } from './drain'
export { advancePosition } from './positioning'
export { advanceRecorder } from './protection'
export { photoLadder } from './sensing'
export { advanceSorter, sorterLadder } from './sorter'
export { advanceCapacitors } from './compensation'
