import { near, type Plot, type Snapshot, type Values } from '../../core/types'

export const epsilon = 1e-8

export function active(...enabled: (number | boolean)[]): number[] {
  return enabled.flatMap((on, index) => on ? [index] : [])
}

export function reads(state: Snapshot, expected: Record<string, number>, tolerance = 0.001): boolean {
  return Object.entries(expected).every(([name, value]) => {
    const reading = state.frame.meters.find(([label]) => label === name)
    return reading !== undefined && near(reading[1], value, tolerance)
  })
}

export function curve(title: string, x: string, y: string, domain: number[], evaluate: (value: number) => number): Plot {
  return { title, x, y, points: domain.map(value => [value, evaluate(value)]) }
}

// Numeric-keyed ring buffer keeps the course's memory serializable under the common engine.
export function logSample(memory: Values, channel: string, time: number, value: number): void {
  const second = Math.floor(time + epsilon)
  const slot = second % 32
  memory[channel + 'Time' + slot] = time
  memory[channel + 'Value' + slot] = value
}

export function history(memory: Values, channel: string, title: string, x: string, y: string, initial: number): Plot {
  const points: [number, number][] = []
  for (let slot = 0; slot < 32; slot++) {
    const time = memory[channel + 'Time' + slot]
    if (time !== undefined) points.push([time, memory[channel + 'Value' + slot]])
  }
  points.sort((a, b) => a[0] - b[0])
  if (points.length < 32 && (points[0]?.[0] ?? 1) > epsilon) points.unshift([0, initial])
  return { title, x, y, points }
}
