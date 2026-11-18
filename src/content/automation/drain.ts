import { button, choice, graph, near, part, quiz, range, strip } from '../../core/types'
import type { Lesson, Move, Values } from '../../core/types'
import { bit, limit, plcClock, recordBit, scanTrace, slot, zelio } from './shared'

const start = slot('start', '第一行 · 启动触点', 0, '空位（断开）', 'I1 上浮子湿', 'I2 下浮子湿')
const feedback = slot('feedback', '第二行 · 保持来源', 0, '空位（断开）', 'Q1 上一扫描输出', '常通')
const lower = slot('lower', '第二行 · 串联触点', 0, 'I2 下浮子湿', '/I2 下浮子干')
const join = slot('join', '第三行 · 请求支路', 0, 'M1 或 M2（并联）', 'M1 且 M2（串联）')

export const drainLadder = {
  rungs: [
    { output: 'M1 高位启动请求', slots: [start.binding] },
    { output: 'M2 区间保持请求', slots: [feedback.binding, lower.binding] },
    { output: 'Q1 排水请求', slots: [join.binding] },
  ],
}

function floats(m: Values, i: Values) {
  return {
    high: m.level >= 70 - 1e-8,
    low: i.floatFault === 0 && m.level >= 30 - 1e-8,
  }
}

function scanDrain(m: Values, i: Values): void {
  const { high, low } = floats(m, i)
  const oldQ = m.q
  m.imageH = bit(high)
  m.imageL = bit(low)
  m.invalid = bit(high && !low)
  m.m1 = bit(m.startProgram === 1 ? high : m.startProgram === 2 && low)
  const contact = m.holdProgram === 1 ? oldQ === 1 : m.holdProgram === 2
  m.m2 = bit(contact && (m.lowerProgram ? !low : low))
  const demand = m.joinProgram ? m.m1 && m.m2 : m.m1 || m.m2
  m.q = bit(Boolean(demand) && !m.invalid)
  m.highTrace = recordBit(m.highTrace, m.imageH)
  m.holdTrace = recordBit(m.holdTrace, m.m2)
  m.pumpTrace = recordBit(m.pumpTrace, m.q)
  if (m.invalid) m.inhibits++
  if (m.q && !oldQ) m.starts++
  if (m.q && !oldQ && high) m.startedHigh = 1
  if (m.q && oldQ && !high && low) m.held = 1
  if (!m.q && oldQ && !low && !m.invalid) m.stoppedLow = 1
}

export const advanceDrain: NonNullable<Lesson['advance']> = (m, i, _old, action, dt) => {
  if (action === 'pour') m.level = limit(m.level + 25, 0, 100)
  if (action === 'load') {
    m.startProgram = i.start; m.holdProgram = i.feedback
    m.lowerProgram = i.lower; m.joinProgram = i.join
    m.running = 1; m.clock = m.scans = m.q = m.m1 = m.m2 = 0
    m.held = m.startedHigh = m.stoppedLow = m.invalid = 0
    m.highTrace = m.holdTrace = m.pumpTrace = 0
  }
  if (action === 'tick' && m.running) plcClock(m, dt, seconds => {
    m.level = limit(m.level + seconds * (i.inflow - 20 * m.q), 0, 100)
  }, () => scanDrain(m, i))
  return m
}

const goodProgram: Move[] = [['start', 1], ['feedback', 1], ['load', 1]]
export const drainControl = {
  id: 16, title: '双液位排水控制逻辑', prerequisites: [15],
  context: '集水井的上、下浮子之间有一段没有新信号的水位。若仅用上浮子驱动泵，水位刚下降，泵就会停。',
  question: '怎样用上一扫描的泵命令，记住水位正在下降的方向？',
  task: '编辑三行梯形图。用 I1 发起、Q1 与 I2 串联保持，将两条支路并联。装载、加水、推进时间，观察扫描和停泵水位。',
  device: zelio, ladder: drainLadder,
  parts: [
    part('上浮子与水面', '倒入 25 个百分点的虚拟水量，让水面越过上浮子。', 'pour'),
    part('下浮子', '模拟下浮子失信，检查高湿低干的矛盾组合。', 'floatFault', 1),
    part('智能继电器屏', '装载当前三行草稿，开始新的扫描周期。', 'load'),
    part('井口回水管', '加入每秒 6 个水位百分点的连续回水。', 'inflow', 6),
  ],
  controls: [start.input, feedback.input, lower.input, join.input, button('load', '装载梯形图并运行'), button('pour', '加一桶水（+25%）'), range('inflow', '运行期间连续来水', 0, 0, 12, 2, '%/s'), choice('floatFault', '下浮子回读', 0, '随水面', '卡在干位')],
  initialMemory: { level: 50, clock: 0, scans: 0, running: 0, q: 0, m1: 0, m2: 0, imageH: 0, imageL: 0, invalid: 0, starts: 0, inhibits: 0, startedHigh: 0, held: 0, stoppedLow: 0, startProgram: 0, holdProgram: 0, lowerProgram: 0, joinProgram: 0, highTrace: 0, holdTrace: 0, pumpTrace: 0 },
  advance: advanceDrain,
  sample(i, m) {
    const { high, low } = floats(m, i)
    const draft = i.start !== m.startProgram || i.feedback !== m.holdProgram || i.lower !== m.lowerProgram || i.join !== m.joinProgram
    return {
      meters: [['井内水位', m.level, '%'], ['上浮子 I1', bit(high), ''], ['下浮子 I2', bit(low), ''], ['启动 M1', m.m1, ''], ['保持 M2', m.m2, ''], ['泵命令 Q1', m.q, ''], ['已执行扫描', m.scans, '次']],
      active: [0, ...(high ? [1] : []), ...(low ? [2] : []), ...(m.m1 ? [3] : []), ...(m.m2 ? [4] : []), ...(m.q ? [5, 6] : []), ...(m.invalid ? [7] : [])],
      note: !m.running ? '草稿等待装载。装载后每 0.1 s 采样一次，前一拍 Q1 在本拍可供保持支路读取。' :
        draft ? '已修改草稿。当前扫描仍执行上次装载的触点组合，重新装载后才换用新梯形图。' :
        m.invalid ? '高浮子湿而低浮子干，同一扫描的读数矛盾。教学监督逻辑抑制排水输出。' :
        m.q ? (m.m1 ? '水面到达上浮子，启动支路导通。' : '上浮子已干，保持支路从上一扫描取得 Q1。') :
        '排水输出为零。可观察来水上升，或加水越过启动点。',
      plots: [scanTrace('上浮子采样 I1', m.scans, m.highTrace), scanTrace('保持支路 M2', m.scans, m.holdTrace), scanTrace('扫描输出 Q1', m.scans, m.pumpTrace)],
    }
  },
  diagram: graph(['井内液位', '上浮子 I1', '下浮子 I2', '启动 M1', '保持 M2', '输出 Q1', '水泵排量', '输入矛盾抑制'], [[0, 1], [0, 2], [1, 3], [2, 4], [5, 4], [3, 5], [4, 5], [5, 6], [6, 0], [1, 7], [2, 7], [7, 5]]),
  prediction: quiz('上浮子刚变干、下浮子仍湿，正确程序的下一拍会怎样？', ['泵保持工作', '泵必停', '两个浮子都必须为干才启动'], 0, 'M1 熄灭，上一扫描 Q1 与仍湿的 I2 使 M2 导通，输出被保持。'),
  explanation: quiz('水从 50% 上升与从 75% 降至 50% 时，浮子读数相同。什么可以区分这两种工况？', ['只读取上浮子', '查看上次扫描的输出', '将水位取整'], 1, '起点和运动方向留在保持支路的状态中，相同输入组合可以对应不同输出。'),
  comic: strip([
    '上下两杆分别标着 70% 和 30%。我写了“上浮子湿→泵转”，应该够了吧？',
    '加一桶到 75%，往前走半秒。水刚过上杆，泵命令已经掉了。',
    '我在第二行串入上一拍的 Q1 和下浮子湿，再把这行与第一行并联。',
    '装载后再加水。盯住 M1 熄灭的那一扫，M2 接住了，泵才继续排。',
    '降到下杆下面，两个请求都灭了。回水经过中间高度时这次泵没动。',
    '同一组浮子值可以出现在上升和下降途中，保持触点把这两段历史分开。',
    '若上杆湿、下杆干，我先看矛盾标志。这个读数组合已经违背井内的几何顺序。',
  ], [0, 2, 2, 3, 1, 2, 1]),
  goals: [
    { text: '第一行选 I1，第二行选 Q1 上一扫描输出并串 I2，第三行并联。装载后加一桶水，推进 0.1 s 或更多，观察高位启动。', check: s => s.memory.startProgram === 1 && s.memory.holdProgram === 1 && !s.memory.lowerProgram && !s.memory.joinProgram && !!s.memory.startedHigh },
    { text: '保持来水为 0，继续推进约 1 s，观察上浮子已干时，M2 仍让泵排水。', check: s => !!s.memory.startedHigh && !!s.memory.held },
    { text: '再推进约 2 s，使水面低过 30%。检查泵命令回零，同时保留先前的保持证据。', check: s => !!s.memory.held && !!s.memory.stoppedLow && !s.memory.q },
  ],
  assumptions: '初始水位 50%，运行时每秒来水 0–12 个百分点、排水 20 个百分点。上／下阈值为 70%／30%，浮子湿对应 1。教学扫描 100 ms，先更新水位，再同时采样、自上而下计算 M1/M2、提交 Q1。装载复位输出并重新计拍，水位保留。输入矛盾抑制是额外的教学监督条件。', review: true,
  practice: [...goodProgram, ['pour', 1], 0.1, 1, 1.4],
  trials: [
    { name: '正常｜保持直到低位', moves: [...goodProgram, ['pour', 1], 2.5], verify: s => s.memory.scans === 25 && near(s.memory.level, 29) && s.memory.held === 1 && s.memory.stoppedLow === 1 && s.memory.q === 0 },
    { name: '误操作｜保持支路留空', moves: [['start', 1], ['load', 1], ['pour', 1], 1], verify: s => near(s.memory.level, 69) && s.memory.q === 0 && s.memory.held === 0 && s.memory.starts === 1 },
    { name: '故障与恢复｜高湿低干', moves: [...goodProgram, ['pour', 1], ['floatFault', 1], 0.3, ['floatFault', 0], 0.2], verify: s => s.memory.inhibits === 3 && near(s.memory.level, 73) && s.memory.q === 1 && s.memory.invalid === 0 },
    { name: '迁移｜井水加至 75% 再清空启动触点草稿，让旧程序排至 73%，重装后首扫停泵', moves: [...goodProgram, ['pour', 1], ['start', 0], 0.2, ['load', 1], 0.1], verify: s => near(s.memory.level, 73) && s.memory.q === 0 && s.memory.startProgram === 0 && s.memory.starts === 1 && s.memory.scans >= 1 },
  ],
} satisfies Lesson
