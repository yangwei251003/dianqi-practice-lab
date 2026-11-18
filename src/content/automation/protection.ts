import { button, choice, graph, near, part, quiz, range, strip } from '../../core/types'
import type { Lesson, Plot, Values } from '../../core/types'
import { bit, reading } from './shared'

const cases = [
  { rms: 4, duration: 200 },
  { rms: 4, duration: 40 },
  { rms: 2, duration: 200 },
]
const delays = [20, 60, 100]
const pretrigger = -40, recordEnd = 260, sampleMs = 20 / 32

function planned(m: Values) {
  const event = cases[m.which]
  const pickup = event.rms >= m.setting
  // At equal timestamps the external pulse ends first.
  const trip = pickup && event.duration > m.delay ? m.delay : -1
  const open = trip >= 0 && !m.stuck ? trip + 20 : -1
  return { event, pickup, trip, open }
}

function rmsAt(timeMs: number, plan: ReturnType<typeof planned>): number {
  if (plan.open >= 0 && timeMs >= plan.open) return 0
  return timeMs >= 0 && timeMs < plan.event.duration ? plan.event.rms : 1
}

function exposed(stamp: number, cursor: number): number {
  return stamp >= 0 && stamp <= cursor + 1e-8 ? stamp : -1
}

function traces(m: Values): Plot[] {
  const plan = planned(m)
  const wave: Plot = { title: '虚拟录波 · A 相瞬时电流', x: '相对扰动起点 / ms', y: '瞬时电流 / A', points: [] }
  const digital: Plot = { title: '数字通道 · 跳闸命令锁存', x: '相对扰动起点 / ms', y: 'TRIP / 0或1', points: [] }
  const contact: Plot = { title: '数字通道 · 断路器合位回读', x: '相对扰动起点 / ms', y: '52a / 0或1', points: [] }
  const last = Math.floor((m.cursor - pretrigger) / sampleMs + 1e-8)
  for (let n = 0; n <= last; n++) {
    const x = pretrigger + n * sampleMs
    wave.points.push([x, Math.SQRT2 * rmsAt(x, plan) * Math.sin(2 * Math.PI * x / 20)])
  }
  // Duplicate a switching timestamp to draw a vertical edge at the recorded instant.
  function step(plot: Plot, at: number, initial: number) {
    plot.points.push([pretrigger, initial])
    if (at >= 0 && at <= m.cursor + 1e-8) plot.points.push([at, initial], [at, 1 - initial])
    plot.points.push([m.cursor, at >= 0 && at <= m.cursor + 1e-8 ? 1 - initial : initial])
  }
  step(digital, plan.trip, 0); step(contact, plan.open, 1)
  return [wave, digital, contact]
}

export const advanceRecorder: NonNullable<Lesson['advance']> = (m, i, _old, action, dt) => {
  if (action === 'replay') {
    if (m.recorded) {
      const prior = planned(m)
      m.previousTrip = exposed(prior.trip, m.cursor); m.previousOpen = exposed(prior.open, m.cursor)
    }
    m.which = i.event; m.setting = i.pickup; m.delay = delays[i.delay]; m.stuck = i.breaker
    m.cursor = pretrigger; m.recorded++; m.playing = 1
  }
  if (action === 'tick' && m.playing) {
    m.cursor = Math.min(recordEnd, Math.round((m.cursor + dt * 50) * 1e6) / 1e6)
    if (m.cursor >= recordEnd) m.playing = 0
  }
  return m
}

export const feederRecorder: Lesson = {
  id: 23, title: '馈线保护录波事件', prerequisites: [22],
  context: '保护报告记了一次跳闸，断路器辅助触点稍后才改变。把模拟量、元件启动、命令和回读放到同一个时间轴。',
  question: '电流超过定值、发出跳闸命令、负荷电流归零，分别发生在何时？',
  task: '启动预置事件回放。沿录波游标读出三个时间戳，并用短扰动、门槛过高和机构未响应做反证。',
  device: {
    maker: 'Schweitzer Engineering Laboratories', model: 'SEL-751', name: '馈线保护继电器', form: 'relay',
    url: 'https://selinc.com/api/download/10734/?lang=en',
    document: 'SEL-751 Feeder Protection Relay · Data Sheet', locator: 'Date Code 20260910，第 19 页 Event Reporting and SER、第 38 页 Oscillography 与 Sequential Events Recorder。',
    features: ['具备相过流保护以及事件顺序记录', '非滤波录波支持每周波 32 个采样点', '支持 15 周波事件记录和包含模拟量、数字状态的报告'],
  },
  parts: [part('电流采样窗口', '将教学二次电流门槛设为 3 A，下一份回放使用此值。', 'pickup', 3), part('保护面板事件键', '创建一份新记录，从扰动前 40 ms 开始。', 'replay'), part('断路器位置接点', '选择机构未响应样例，保留命令与合位两个独立数字量。', 'breaker', 1), part('定时元件', '把教学定时限改为 20 ms，比较短扰动是否来得及消退。', 'delay', 0)],
  controls: [choice('event', '单相二次电流事件', 0, '持续 4 A / 200 ms', '短时 4 A / 40 ms', '低倍 2 A / 200 ms'), range('pickup', '教学启动门槛', 3, 1.5, 5, 0.5, 'A'), choice('delay', '教学定时限', 1, '20 ms', '60 ms', '100 ms'), choice('breaker', '机构回读样例', 0, '命令后 20 ms 分位', '机构未响应'), button('replay', '按当前设置生成并回放')],
  initialMemory: { which: 0, setting: 3, delay: 60, stuck: 0, cursor: pretrigger, recorded: 0, playing: 0, previousTrip: -1, previousOpen: -1 },
  advance: advanceRecorder,
  sample(_i, m) {
    const plan = planned(m), cursor = m.cursor
    const pickup = exposed(plan.pickup ? 0 : -1, cursor), trip = exposed(plan.trip, cursor), open = exposed(plan.open, cursor)
    const amps = rmsAt(cursor, plan)
    const tripped = trip >= 0, opened = open >= 0
    return {
      meters: [['录波游标', cursor, 'ms'], ['电流有效值', amps, 'A'], ['启动时刻', pickup, 'ms'], ['命令时刻', trip, 'ms'], ['分位时刻', open, 'ms'], ['跳闸命令', bit(tripped), ''], ['断路器合位', bit(!opened), '']],
      active: [0, 1, ...(amps >= m.setting ? [2, 3] : []), ...(tripped ? [4] : []), ...(opened ? [5] : []), ...(m.recorded ? [6] : [])],
      note: !m.recorded ? '生成回放后推进时间。显示的 −1 ms 表示截至游标仍未记录该事件。' :
        opened ? '合位回读已经撤销，负荷电流消失。可用分位时刻减命令时刻计算机构响应时间。' :
        tripped ? '跳闸命令已发出，合位回读仍为 1。查看后续录波是否出现分位与电流消失。' :
        pickup >= 0 ? '已记录元件首次启动。短过流可在定时到达前消退，启动记录会保留。' : '先看扰动前的额定 1 A 正弦波，再找持续越过门槛的区段。',
      plots: traces(m),
    }
  },
  diagram: graph(['一次扰动', '虚拟 CT 电流', '过流启动', '定时限', '跳闸命令', '断路器分位', '事件录波'], [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 1], [1, 6], [2, 6], [4, 6], [5, 6]]),
  prediction: quiz('持续 4 A，门槛 3 A、定时 60 ms，机构在命令后 20 ms 响应。何时首次出现分位？', ['0 ms', '60 ms', '80 ms'], 2, '扰动起点记为零，先满足定时，再等机构动作，分位时刻为 60+20=80 ms。'),
  explanation: quiz('短时 4 A 持续 40 ms，启动时间戳存在，却没有 60 ms 跳闸命令，为什么？', ['元件只看波峰每次过零都复位', '有效值在定时完成前已回落', '说明断路器拒动'], 1, '未持续满足过流条件时，定时限元件复归。判断机构拒动还需要已经发出的命令证据。'),
  comic: strip([
    '我找到电流第一次冲高的波峰，想把那一点写成跳闸时间。',
    '先把相对零点对齐。有效值越过门槛时元件启动，单个瞬时波峰只是一条模拟采样。',
    '游标走到 60 ms，TRIP 从零变一，电流竟然还在流。',
    '看看 52a。再过 20 ms 它才从合位掉下，电流曲线也归了零。',
    '换 40 ms 短扰动，启动有记录，定时没走完，根本没有命令。',
    '再看机构不响应的回放。这里命令有了，但合位还在，和刚才的短扰动原因不同。',
    '写事件报告时，我会并列记录启动、命令和位置时刻，再算各段延时。',
  ], [0, 0, 1, 2, 3, 2, 1]),
  goals: [
    { text: '保持持续 4 A、门槛 3 A、60 ms 和正常机构；生成并推进 2 s，在游标 60 ms 看到命令已出、合位仍在。', check: s => !!s.memory.recorded && s.memory.which === 0 && reading(s, '命令时刻') === 60 && reading(s, '启动时刻') === 0 && reading(s, '断路器合位') === 1 },
    { text: '再推进至少 0.4 s，使游标越过 80 ms；确认分位比命令晚 20 ms、电流有效值归零。', check: s => reading(s, '分位时刻') === 80 && reading(s, '命令时刻') === 60 && reading(s, '电流有效值') === 0 },
  ],
  assumptions: '仅做离线合成录波，基频 50 Hz、32 点/周波、窗口 −40 至 +260 ms。仿真推进 1 s 对应 50 ms 记录时间。理想正弦有效值包络用于判据，非厂家滤波算法；无直流偏移、CT 饱和或实际保护定值。持续扰动在样例给定时刻自行消退，正常开断可提前切断电流。', review: true,
  practice: [['replay', 1], 2, 0.4],
  trials: [
    { name: '正常｜命令与分位相差 20 ms', moves: [['replay', 1], 2.4], verify: s => reading(s, '启动时刻') === 0 && reading(s, '命令时刻') === 60 && reading(s, '分位时刻') === 80 && reading(s, '电流有效值') === 0 },
    { name: '误操作｜门槛高于事件有效值', moves: [['pickup', 4.5], ['replay', 1], 3], verify: s => reading(s, '电流有效值') === 4 && reading(s, '启动时刻') === -1 && reading(s, '命令时刻') === -1 && reading(s, '断路器合位') === 1 },
    { name: '故障与恢复｜保留未响应记录并重放正常机构', moves: [['breaker', 1], ['replay', 1], 3, ['breaker', 0], ['replay', 1], 2.4], verify: s => s.memory.previousTrip === 60 && s.memory.previousOpen === -1 && reading(s, '分位时刻') === 80 && near(reading(s, '电流有效值'), 0) },
    { name: '迁移｜40 ms 短扰动、3 A 门槛、60 ms 定时，回放到 110 ms，确认已启动且无命令、合位保留', moves: [['event', 1], ['replay', 1], 3], verify: s => s.memory.which === 1 && s.memory.setting === 3 && s.memory.delay === 60 && s.memory.cursor >= 110 && reading(s, '启动时刻') === 0 && reading(s, '命令时刻') === -1 && reading(s, '电流有效值') === 1 && reading(s, '断路器合位') === 1 },
  ],
}
