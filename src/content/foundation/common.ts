import { choice, near } from '../../core/types'
import type { Lesson, Plot, Snapshot, Values } from '../../core/types'

export function active(...states: (boolean | number)[]): number[] {
  return states.flatMap((enabled, index) => enabled ? [index] : [])
}

export function reads(state: Snapshot, label: string, expected: number, tolerance = 0.001) {
  const meter = state.frame.meters.find(([name]) => name === label)
  return !!meter && near(meter[1], expected, tolerance)
}

export function curve(title: string, x: string, y: string, end: number, fn: (at: number) => number): Plot {
  return { title, x, y, points: Array.from({ length: 41 }, (_, index) => {
    const at = end * index / 40
    return [at, fn(at)]
  }) }
}

// Every pair has its own switch. Banks on the same side can also be bridged.
export function patchBoard(terminals: string[], connected: string[] = []) {
  const leads: NonNullable<Lesson['wiring']>['leads'] = []
  for (let from = 0; from < terminals.length; from++) {
    for (let to = from + 1; to < terminals.length; to++) {
      leads.push({ from, to, control: 'w' + from + to })
    }
  }
  const wiring = { terminals, leads }
  const controls = leads.map(({ from, to, control }) =>
    choice(control, terminals[from] + ' ↔ ' + terminals[to], Number(connected.includes(control)), '断开', '连接'))
  function nets(input: Values) {
    const group = terminals.map((_, index) => index)
    for (const { control, from, to } of leads) {
      if (!input[control]) continue
      const previous = group[to], next = group[from]
      for (let i = 0; i < group.length; i++) if (group[i] === previous) group[i] = next
    }
    return group
  }
  return { wiring, controls, nets }
}
