import { button, choice, graph, near, part, quiz, strip } from '../../core/types'
import type { Lesson, Move, Values } from '../../core/types'
import { bit, limit, plcClock, recordBit, scanTrace, slot, zelio } from './shared'

const presence = slot('presence', '置位行 · 到件触点', 0, '空位（断开）', 'I1 到件', 'I3 前到位')
const material = slot('material', '置位行 · 材质触点', 0, 'I2 金属', '/I2 非金属', '常通')
const timing = slot('timing', '监视行 · 定时使能', 0, '空位（断开）', 'M1 串 /I3（等待到位）', 'M1 串 I3（已经到位）')
const preset = slot('preset', '监视行 · TON 预置', 0, '0.4 s', '1.2 s', '2.0 s')
const finish = slot('finish', '复位行 · 完成触点', 0, 'I3 前到位', 'I4 原位', '空位（断开）')
const delays = [0.4, 1.2, 2]

export const sorterLadder = {
  rungs: [
    { output: '置位 M1 · 分拣周期', slots: [presence.binding, material.binding] },
    { output: 'T1 · A 型接通延时', slots: [timing.binding, preset.binding] },
    { output: '复位 M1 · 完成支路', slots: [finish.binding] },
  ],
}

function home(m: Values): boolean { return m.travel <= 1e-8 }
function end(m: Values): boolean { return m.travel >= 1 - 1e-8 }

function scanSorter(m: Values, i: Values): void {
  // Read inputs together. M1 latches a one-scan arrival while the cylinder moves.
  const atEnd = end(m), atHome = home(m)
  if (m.ackRequest && atHome && !i.jam) m.alarm = 0
  m.ackRequest = 0
  const arrived = m.pending > 0
  const metal = m.pending === 1
  const start = m.startProgram === 1 ? arrived : m.startProgram === 2 && atEnd
  const accept = m.materialProgram === 2 || (m.materialProgram === 0 ? metal : !metal)
  if (!m.alarm && !m.busy && atHome && start && accept) {
    m.busy = 1; m.work = m.pending
  } else if (arrived) {
    m.straight++
    if (metal) m.wrongBin++
  }
  m.pending = 0

  const timerEnabled = !!m.busy && (m.timerProgram === 1 ? !atEnd : m.timerProgram === 2 && atEnd)
  // The enabling scan starts at ET=0. Only full following enabled intervals accrue.
  m.et = timerEnabled && m.wasTiming ? Math.min(m.pt, m.et + 0.1) : 0
  m.wasTiming = bit(timerEnabled)
  const done = m.finishProgram === 0 ? atEnd : m.finishProgram === 1 && atHome
  if (m.busy && timerEnabled && m.et + 1e-8 >= m.pt) {
    m.alarm = 1; m.timeouts++; m.tripET = m.et; m.tripTravel = m.travel
    m.busy = 0; m.work = 0
  } else if (m.busy && done) {
    if (atEnd && m.work) {
      m.diverted++
      if (m.work === 2) m.wrongBin++
    } else m.shortStrokes++
    m.busy = 0; m.work = 0
  }
  m.valve = bit(!!m.busy && !m.alarm)
  m.valveTrace = recordBit(m.valveTrace, m.valve)
  m.endTrace = recordBit(m.endTrace, bit(atEnd))
  m.alarmTrace = recordBit(m.alarmTrace, m.alarm)
}

export const advanceSorter: NonNullable<Lesson['advance']> = (m, i, _old, action, dt) => {
  if (action === 'load' && home(m) && !m.busy && !m.alarm) {
    m.startProgram = i.presence; m.materialProgram = i.material; m.timerProgram = i.timing
    m.pt = delays[i.preset]; m.finishProgram = i.finish; m.run = 1
    m.clock = m.scans = m.et = m.wasTiming = m.valve = m.pending = 0
    m.valveTrace = m.endTrace = m.alarmTrace = 0
  }
  if (action === 'feed' && m.run) {
    if (home(m) && !m.busy && !m.alarm && !m.pending) m.pending = i.piece + 1
    else m.rejected++
  }
  if (action === 'ack') m.ackRequest = 1
  if (action === 'tick' && m.run) plcClock(m, dt, seconds => {
    // A spring returns the virtual rod after the output is released.
    if (m.valve && !i.jam) m.travel = limit(m.travel + seconds / (i.slow ? 1.6 : 0.8), 0, 1)
    if (!m.valve) m.travel = limit(m.travel - seconds / 0.5, 0, 1)
  }, () => scanSorter(m, i))
  return m
}

const correct: Move[] = [['presence', 1], ['timing', 1], ['preset', 1], ['load', 1]]

export const pneumaticSorter = {
  id: 18, title: '气动分拣梯形图与到位超时', prerequisites: [14, 16],
  context: '金属件从传送带侧推出，塑料件直行。一次气缸受阻后，阀线圈一直亮，下一个工件已经到了。',
  question: '如何让一次短到件信号启动完整行程，又能在未到位时限时退出？',
  task: '编写到件与金属串联置位、等待前到位接通延时、前到位复位三行。装载后送件，分别回放正常行程与受阻行程。',
  device: zelio, ladder: sorterLadder,
  parts: [part('输送带到件舌', '暂存一只所选工件，在下一扫描产生一次到件信号。', 'feed'), part('气缸推杆', '模拟推杆伸出受阻；撤销输出后弹簧仍可回程。', 'jam', 1), part('流量节流部位', '让模型完整伸出时间由 0.8 s 改为 1.6 s。', 'slow', 1), part('智能继电器屏', '在原位、无报警时装载草稿。', 'load'), part('报警确认键', '排除受阻、等推杆回到原位，再把确认送入下一扫描。', 'ack')],
  controls: [presence.input, material.input, timing.input, preset.input, finish.input, button('load', '原位装载并运行'), choice('piece', '待送工件', 0, '金属', '塑料'), button('feed', '送一件'), choice('jam', '伸出状态', 0, '畅通', '推杆受阻'), choice('slow', '节流速度', 0, '正常 0.8 s/程', '慢速 1.6 s/程'), button('ack', '排障后确认报警')],
  initialMemory: { clock: 0, scans: 0, run: 0, pending: 0, work: 0, busy: 0, travel: 0, valve: 0, et: 0, wasTiming: 0, alarm: 0, ackRequest: 0, timeouts: 0, tripET: 0, tripTravel: 0, diverted: 0, straight: 0, wrongBin: 0, shortStrokes: 0, rejected: 0, startProgram: 0, materialProgram: 0, timerProgram: 0, finishProgram: 0, pt: 0.4, valveTrace: 0, endTrace: 0, alarmTrace: 0 },
  advance: advanceSorter,
  sample(i, m) {
    const draft = i.presence !== m.startProgram || i.material !== m.materialProgram || i.timing !== m.timerProgram || delays[i.preset] !== m.pt || i.finish !== m.finishProgram
    return {
      meters: [['推杆行程', 100 * m.travel, '%'], ['阀线圈 Q1', m.valve, ''], ['前到位 I3', bit(end(m)), ''], ['定时累计 ET', m.et, 's'], ['报警锁存', m.alarm, ''], ['侧推', m.diverted, '件'], ['直行', m.straight, '件'], ['误入料箱', m.wrongBin, '件'], ['末次超时 ET', m.tripET, 's']],
      active: [...(m.pending ? [0] : []), ...(m.work === 1 || m.pending === 1 ? [1] : []), ...(m.busy ? [2] : []), ...(m.valve ? [3] : []), ...(m.travel > 0 ? [4] : []), ...(end(m) ? [5] : []), ...(m.wasTiming ? [6] : []), ...(m.alarm ? [7] : []), ...(m.straight ? [8] : [])],
      note: !m.run ? '先装载梯形图，再送件。I1 只在下一扫描出现，M1 跨扫描保持。' :
        m.alarm ? 'T1 已到预置且未收到完成条件，报警锁存、阀输出撤销。解除受阻并回原位后确认。' :
        draft ? '屏上有未装载的修改。原位、空闲和无报警时可装载草稿。' :
        m.busy ? '推杆正在伸出。用 ET 和 I3 比较到位与超时的先后。' :
        !home(m) ? '阀已释放，弹簧回程。回到原位才能接收下件。' :
        '工位在原位。金属条件成立的工件进入分拣周期，其余直行。',
      plots: [scanTrace('阀线圈 Q1', m.scans, m.valveTrace), scanTrace('前到位 I3', m.scans, m.endTrace), scanTrace('锁存报警', m.scans, m.alarmTrace)],
    }
  },
  diagram: graph(['到件 I1', '金属 I2', '记忆 M1', '阀线圈 Q1', '气缸运动', '前到位 I3', '定时 T1', '锁存报警', '直行料箱'], [[0, 2], [1, 2], [0, 8], [1, 8], [2, 3], [3, 4], [4, 5], [5, 2], [2, 6], [5, 6], [6, 7], [7, 2], [7, 3]]),
  prediction: quiz('正常伸出需要 0.8 s，将等待到位定时设为 0.4 s 会怎样？', ['更快完成分拣', '中途超时，阀释放并回程', '只影响回程速度'], 1, '从伸出开始计时，0.4 s 时推杆只有半程，尚无到位回读。'),
  explanation: quiz('受阻时 T1 的 ET 永远为零，哪项程序修改切中原因？', ['把 M1 与 /I3 串联作为定时使能', '只在 I3 已经到位时开始监视', '增加纸箱数'], 0, '等待条件是周期已启动且到位信号仍为零。ENABLE 持续成立才累计接通延时。'),
  comic: strip([
    '金属片一闪就离开到件舌，我直接用 I1 驱阀，推杆只动了一下。',
    '把 I1 和金属 I2 串联置位 M1。到件离开后，让记忆继续给阀供命令。',
    '我把定时使能写成“已经到位”。卡住时 ET 却一直停在零！',
    '监视的是等待过程，用 M1 串未到位。留心启用的第一扫描，ET 从零起算。',
    '预置四百毫秒时，推杆只到一半就回去了。改一点二秒，正常件先到终点。',
    '再让推杆受阻。报警锁住后，连续送件也进不了工位；先恢复原位并确认。',
    '换慢速节流后要重测行程窗口，同时保留塑料件直行这条支路。',
  ], [0, 3, 1, 3, 2, 4, 0]),
  goals: [
    { text: '置位选 I1 到件、I2 金属；定时选 M1 串 /I3、1.2 s；完成选 I3。装载后送一个金属件并推进 1.5 s，使侧推计数为 1。', check: s => s.memory.startProgram === 1 && s.memory.materialProgram === 0 && s.memory.timerProgram === 1 && near(s.memory.pt, 1.2) && s.memory.diverted >= 1 && !s.memory.alarm },
    { text: '保持正确程序，原位时打开“推杆受阻”，再送件并推进 1.5 s，使报警锁存且阀已释放。', check: s => s.memory.diverted >= 1 && s.memory.alarm === 1 && s.memory.valve === 0 && near(s.memory.tripET, 1.2) },
    { text: '改回“畅通”，在原位确认并推进 0.1 s；再送金属件并推进 1.5 s，让侧推计数增至 2，仍能查看上次超时。', check: s => s.memory.timeouts > 0 && s.memory.diverted >= 2 && !s.memory.alarm },
  ],
  assumptions: '智能继电器运行课堂 LD 子集。教学扫描 100 ms，先按旧阀输出移动，再采样、置位、执行 TON、判完成／超时、提交新输出。启用首扫 ET=0。固定规则为超时锁存报警并复位 M1，Q1=M1 且无报警。虚拟气缸单作用、回程 0.5 s，运动中不接收新件。', review: true,
  practice: [...correct, ['feed', 1], 1.5, ['jam', 1], ['feed', 1], 1.5, ['jam', 0], ['ack', 1], 0.1, ['feed', 1], 1.5],
  trials: [
    { name: '正常｜前到位早于定时', moves: [...correct, ['feed', 1], 1.5], verify: s => s.memory.diverted === 1 && s.memory.timeouts === 0 && near(s.memory.travel, 0) && s.memory.scans === 15 },
    { name: '误操作｜定时预置过短', moves: [['presence', 1], ['timing', 1], ['load', 1], ['feed', 1], 0.5], verify: s => s.memory.alarm === 1 && s.memory.valve === 0 && near(s.memory.tripET, 0.4) && near(s.memory.tripTravel, 0.5) && s.memory.diverted === 0 },
    { name: '故障与恢复｜卡住、超时、确认、重试', moves: [...correct, ['jam', 1], ['feed', 1], 1.3, ['ack', 1], 0.1, ['jam', 0], ['ack', 1], 0.1, ['feed', 1], 1.5], verify: s => s.memory.timeouts === 1 && near(s.memory.tripET, 1.2) && near(s.memory.tripTravel, 0) && !s.memory.alarm && s.memory.diverted === 1 },
    { name: '迁移｜慢速 1.6 s 工位用 2.0 s 监视，让一件塑料直行、一件金属侧推并回原位', moves: [['presence', 1], ['timing', 1], ['preset', 2], ['load', 1], ['slow', 1], ['piece', 1], ['feed', 1], 0.1, ['piece', 0], ['feed', 1], 2.3], verify: s => s.input.slow === 1 && near(s.memory.pt, 2) && s.memory.straight === 1 && s.memory.diverted === 1 && s.memory.wrongBin === 0 && s.memory.timeouts === 0 && near(s.memory.travel, 0) },
  ],
} satisfies Lesson
