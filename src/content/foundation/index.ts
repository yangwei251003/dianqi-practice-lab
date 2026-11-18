import type { Lesson } from '../../core/types'
import { workDecision, multimeter } from './inspection'
import { lampBoard, terminalTracing } from './wiring'
import { rc, threePhase } from './circuits'
import { fanLatch, spindle } from './contactors'
import { starDelta, inductionSlip } from './motors'
import { variableFan, centrifugalPump } from './fluids'

export const lessons: Lesson[] = [
  workDecision, lampBoard, terminalTracing, multimeter, rc, threePhase,
  fanLatch, spindle, starDelta, inductionSlip, variableFan, centrifugalPump,
]
