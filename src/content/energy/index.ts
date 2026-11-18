import type { Lesson } from '../../core/types'
import { rectifier, buck, boost } from './converters'
import { inverter, motor } from './drives'
import { ups } from './continuity'
import { solarCurve, tracker } from './solar'
import { wind } from './wind'
import { bms, storage } from './storage'
import { charging } from './charging'

export const lessons: Lesson[] = [
  rectifier, buck, boost, inverter, motor, ups,
  solarCurve, tracker, wind, bms, storage, charging,
]
