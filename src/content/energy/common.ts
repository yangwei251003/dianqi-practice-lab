import type { Plot, Snapshot } from '../../core/types'

export type Point = [number, number]

export const clamp = (x: number, low: number, high: number) => Math.max(low, Math.min(high, x))

export function series(end: number, intervals: number, value: (x: number) => number): Point[] {
  return Array.from({ length: intervals + 1 }, (_, index) => {
    const x = end * index / intervals
    return [x, value(x)]
  })
}

export function plot(title: string, x: string, y: string, points: Point[]): Plot {
  return { title, x, y, points }
}

// Read the displayed quantity by name so changing meter order cannot change an experiment.
export function reading(state: Snapshot, label: string): number {
  return state.frame.meters.find(([name]) => name === label)?.[1] ?? NaN
}
