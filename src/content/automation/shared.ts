import { choice } from '../../core/types'
import type { Device, Plot, Snapshot, Values } from '../../core/types'

export function reading(state: Snapshot, label: string): number {
  return state.frame.meters.find(([name]) => name === label)?.[1] ?? NaN
}

export const bit = (value: boolean): number => Number(value)
export const limit = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value))

// Keep the process moving under the old output up to each scan boundary.
// A fractional final tick can straddle a subsequent input change.
export function plcClock(
  memory: Values, dt: number, elapse: (seconds: number) => void, scan: () => void,
): void {
  const period = 0.1
  let remaining = dt
  while (remaining > 1e-9) {
    const slice = Math.min(remaining, period - memory.clock)
    elapse(slice)
    remaining -= slice
    memory.clock += slice
    if (memory.clock + 1e-9 >= period) {
      memory.clock = 0
      memory.scans++
      scan()
    }
  }
}

export function slot(control: string, label: string, initial: number, ...options: string[]) {
  return { input: choice(control, label, initial, ...options), binding: { control, options } }
}

// The last 20 samples fit in a numeric Values entry and survive engine copying.
export function recordBit(history: number, input: number): number {
  return ((history << 1) | Number(Boolean(input))) & 0xfffff
}

export function scanTrace(title: string, scans: number, history: number): Plot {
  const count = Math.min(scans, 20)
  const points: [number, number][] = count ? [] : [[0, 0]]
  for (let k = count - 1; k >= 0; k--) {
    const x = (scans - k) / 10, y = (history >>> k) & 1
    if (points.length) points.push([x, points[points.length - 1][1]])
    points.push([x, y])
  }
  return { title, x: '扫描时刻 / s', y: '逻辑值 / 0或1', points }
}

export const zelio: Device = {
  maker: 'Schneider Electric', model: 'Zelio Logic SR2B121BD', name: '可编程智能继电器', form: 'plc',
  url: 'https://www.proface.com/en/product/spec/SR2B121BD',
  document: 'SR2B121BD · 产品技术规格',
  locator: '施耐德 Pro-face 型号页 Main、Complementary，查阅 2026-11-18。编程依据另见 Zelio Logic Programming Guide EIO0000002612（2017-10）中 Auxiliary Relays、Timers 与第 238 页型号表。',
  features: ['该型号配备显示屏和四路继电器输出', '支持梯形图，型号资料列出 6–90 ms 周期范围', 'LD 编程指南支持辅助继电器、输出线圈和 A 型接通延时'],
}
