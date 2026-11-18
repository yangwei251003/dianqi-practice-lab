import type { Lesson } from '../../core/types'
import { corridor, fanCoil, garage } from './buildings'
import { lift, regeneration, signals } from './transport'
import { duplex, packaging, reserve } from './factory'
import { campus, coldChain, stacker } from './logistics'

export const lessons: Lesson[] = [
  corridor, fanCoil, garage, lift, signals, regeneration,
  packaging, duplex, reserve, coldChain, stacker, campus,
]
