import { button, choice, graph, near, part, quiz, range, strip } from '../../core/types'
import type { Lesson } from '../../core/types'
import { bit } from './shared'

const microsteps = [1, 2, 4]
const pitch = [4, 8]

export const advancePosition: NonNullable<Lesson['advance']> = (m, i, _old, action, dt) => {
  if (action === 'home' && !m.running) {
    m.actual = m.command = m.angle = m.sent = m.missed = 0
    m.homes++
  }
  if (action === 'move' && !m.running) {
    m.count = i.pulses; m.rate = i.rate; m.divisor = microsteps[i.micro]
    m.pitch = pitch[i.pitch]; m.sign = i.dir ? -1 : 1
    m.sent = m.missed = m.carry = 0; m.running = 1
  }
  if (action === 'tick' && m.running) {
    const budget = m.carry + m.rate * dt
    const pulses = Math.min(m.count - m.sent, Math.floor(budget + 1e-8))
    m.carry = Math.max(0, budget - pulses)
    const missed = i.drag && m.rate >= 300 ? Math.floor((m.sent + pulses) / 4) - Math.floor(m.sent / 4) : 0
    const increment = m.sign * m.pitch / (200 * m.divisor)
    m.sent += pulses; m.missed += missed
    m.command += pulses * increment
    m.actual += (pulses - missed) * increment
    m.angle += (pulses - missed) * m.sign * 1.8 / m.divisor
    m.worstError = Math.max(m.worstError, Math.abs(m.command - m.actual))
    if (m.sent === m.count) { m.running = 0; m.completed++ }
  }
  return m
}

export const stepperPosition: Lesson = {
  id: 17, title: '步进定位', prerequisites: [13],
  context: '贴标机换丝杆后，控制器报“脉冲发送完毕”，标签却偏离中心。用独立标尺验证开环定位。',
  question: '同样 200 个脉冲，为何会得到 4 mm、1 mm，甚至少于指令的位移？',
  task: '发出一段有限脉冲，逐段观察指令、轴角和标尺。改变细分、导程、运动方向，最后比较模拟失步后的两种位置。',
  device: {
    maker: 'Oriental Motor', model: 'PKP244D15A2', name: '两相双极步进电机', form: 'motor',
    url: 'https://catalog.orientalmotor.com/en-us/item/ll-categories-shop-online-stepper-motor-components/e-bipolar-stepper-motors-for-cvd-multi-axis-driver/pkp244d15a2',
    document: 'PKP244D15A2 · Specifications and Dimensions', locator: 'Specifications 表的 Basic Step Angle、Connection Type、Shaft/Gear Type、Motor Length，查阅 2026-11-18。',
    features: ['基本步距角 1.8°，两相双极绕组', '单平面圆轴，无内置减速器', '本体框号 42 mm，机身长 39 mm'],
  },
  parts: [part('步进驱动脉冲口', '发出草稿中的脉冲段，运行中保持本段参数。', 'move'), part('电机输出轴', '为下一段行程选反转，观察角度符号。', 'dir', 1), part('丝杆和滑块', '切换为每转 8 mm 的虚拟丝杆。', 'pitch', 1), part('独立直线标尺', '轴静止时将模型对齐到参考原点，指令与标尺同时归零。', 'home')],
  controls: [range('pulses', '本段脉冲数', 200, 20, 400, 20, '个'), range('rate', '脉冲频率', 200, 50, 400, 50, 'Hz'), choice('micro', '外部驱动细分', 0, '整步', '二细分', '四细分'), choice('dir', '本段方向', 0, '正向', '反向'), choice('pitch', '虚拟丝杆导程', 0, '4 mm/转', '8 mm/转'), choice('drag', '模型负载', 0, '正常', '重载失步示例'), button('move', '执行本段定位'), button('home', '静止时回到虚拟参考原点')],
  initialMemory: { running: 0, count: 200, sent: 0, rate: 200, divisor: 1, pitch: 4, sign: 1, missed: 0, carry: 0, command: 0, actual: 0, angle: 0, completed: 0, homes: 0, worstError: 0 },
  advance: advancePosition,
  sample(i, m) {
    const perPulse = pitch[i.pitch] / (200 * microsteps[i.micro]) * (i.dir ? -1 : 1)
    const travel = perPulse * i.pulses
    return {
      meters: [['段内已发脉冲', m.sent, '个'], ['指令位置', m.command, 'mm'], ['独立标尺', m.actual, 'mm'], ['累计轴角', m.angle, '°'], ['段内漏步', m.missed, '个'], ['本段运行', bit(!!m.running), '']],
      active: [0, 1, ...(m.sent || m.running ? [2, 3, 4, 5] : []), ...(i.drag ? [6] : [])],
      note: m.running ? '本段的方向、细分、导程和频率已锁存。系统按经过的时间发送整脉冲。' : m.missed ? '脉冲段已经结束，独立标尺留下了位置误差。消除负载后还需要重新建立参考坐标。' : '下一段理论位移等于方向 × 脉冲数 × 导程 ÷（200 × 细分数）。标尺是模型附加的独立观察量。',
      plots: [{ title: '下一段理论位移（相对本段起点）', x: '指令脉冲 / 个', y: '位移 / mm', points: [[0, 0], [i.pulses / 2, travel / 2], [i.pulses, travel]] }],
    }
  },
  diagram: graph(['脉冲规划', '指令位置', '外部驱动细分', '电机轴角', '丝杆滑块', '独立标尺', '负载扰动'], [[0, 1], [0, 2], [2, 3], [6, 3], [3, 4], [4, 5]]),
  prediction: quiz('200 脉冲、四细分、导程 4 mm，正常负载下走多远？', ['4 mm', '1 mm', '16 mm'], 1, '每转需 200×4=800 脉冲，200 个脉冲只走四分之一转。'),
  explanation: quiz('失步后把负载改回正常，再走一段无失步行程，已有的绝对位置误差会怎样？', ['由总脉冲数自动消失', '必然翻倍', '仍会保留，除非重建参考或纠偏'], 2, '开环指令记录已发的脉冲，后续相同增量会叠加在两种不同的起始位置上。'),
  comic: strip([
    '脉冲计数正好两百，台面只走了一毫米。电机是不是总漏三步？',
    '先看细分。这个轴的基本步距是一点八度，四细分时两百脉冲只转九十度。',
    '刻线转了四分之一圈，四毫米导程正好走一毫米。两处读数都对。',
    '换回整步，用重载样例对着独立标尺看。这回是真的发出二百、只跟上一百五十。',
    '我把负载降回去继续发脉冲，两条位置曲线之间的缺口还在。',
    '之前漏的位移没被控制器测到。回虚拟参考点后再跑，两条读数才重新重合。',
    '换八毫米导程时，即使电机和驱动都没变，我也要重新算每脉冲的直线距离。',
  ], [3, 1, 2, 0, 3, 3, 2]),
  goals: [
    { text: '保持整步、4 mm 导程、正向、200 脉冲，执行并推进 1 s，让标尺走到 4 mm。', check: s => s.memory.completed >= 1 && !s.memory.running && near(s.memory.actual, 4) && near(s.memory.angle, 360) },
    { text: '把方向改为反向、脉冲数改为 100，执行并推进 0.5 s，使标尺从 4 mm 回到 2 mm。', check: s => s.memory.completed >= 2 && s.memory.sign === -1 && s.memory.sent === 100 && near(s.memory.actual, 2) && near(s.memory.angle, 180) },
  ],
  assumptions: '外部驱动、导程 4/8 mm 丝杆与标尺均为课堂附件。匀速脉冲不含加减速。重载案例在 ≥300 Hz 时每四个脉冲漏跟一个，此规则只用于观察开环误差。虚拟回零瞬时完成。', review: true,
  practice: [['move', 1], 1, ['dir', 1], ['pulses', 100], ['move', 1], 0.5],
  trials: [
    { name: '正常｜一圈行程', moves: [['move', 1], 0.5, 0.5], verify: s => s.memory.sent === 200 && near(s.memory.actual, 4) && near(s.memory.angle, 360) && s.memory.completed === 1 },
    { name: '误操作｜四细分沿用整步脉冲数', moves: [['micro', 2], ['move', 1], 1], verify: s => near(s.memory.actual, 1) && near(s.memory.angle, 90) && s.memory.missed === 0 },
    { name: '故障与恢复｜失步后重新找参考', moves: [['drag', 1], ['rate', 400], ['move', 1], 0.5, ['drag', 0], ['home', 1], ['pulses', 100], ['move', 1], 0.3], verify: s => near(s.memory.worstError, 1) && s.memory.homes === 1 && near(s.memory.actual, 2) && near(s.memory.command, 2) },
    { name: '迁移｜8 mm 导程、反向二细分发 100 脉冲，标尺到 −2 mm、轴角到 −90°', moves: [['dir', 1], ['micro', 1], ['pitch', 1], ['pulses', 100], ['move', 1], 0.5], verify: s => s.memory.divisor === 2 && s.memory.pitch === 8 && near(s.memory.actual, -2) && near(s.memory.angle, -90) && s.memory.sent === 100 },
  ],
}
