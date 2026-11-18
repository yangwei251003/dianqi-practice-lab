import { button, choice, graph, near, part, quiz, range, strip } from '../../core/types'
import type { Lesson, Values } from '../../core/types'
import { reading } from './shared'

const stageSize = [10, 5]
const targets = [0.9, 0.95, 0.98]
function balance(i: Values, commanded: number) {
  const healthy = commanded - (i.failed && commanded >= 2 ? 1 : 0)
  const qc = healthy * stageSize[i.size]
  const residual = i.q - qc
  const kva = Math.hypot(i.p, residual)
  return { healthy, qc, residual, kva, pf: i.p / kva, amps: 1000 * kva / (Math.sqrt(3) * 400) }
}

function request(i: Values, m: Values): number {
  if (!i.mode) return Math.sign(i.manual - m.stages)
  const q = balance(i, m.stages).residual
  const step = stageSize[i.size]
  const allowed = i.p * Math.tan(Math.acos(targets[i.target]))
  if (m.stages < 6 && q > allowed + 1e-8 && q >= step) return 1
  if (m.stages > 0 && (q < 0 || q + step <= allowed)) return -1
  return 0
}

export const advanceCapacitors: NonNullable<Lesson['advance']> = (m, i, _old, action, dt) => {
  const demand = request(i, m)
  if (demand !== m.direction || !demand) { m.direction = demand; m.elapsed = 0 }
  if (action === 'tick' && demand) {
    m.elapsed += dt
    if (m.elapsed + 1e-8 >= 5) {
      m.stages += demand; m.elapsed = Math.max(0, m.elapsed - 5); m.switches++
      m.direction = request(i, m)
      if (m.direction !== demand) m.elapsed = 0
    }
  }
  if (action === 'save') {
    const b = balance(i, m.stages)
    m.savedStage = m.stages; m.savedQ = b.residual; m.savedA = b.amps
  }
  return m
}

export const reactiveCompensation: Lesson = {
  id: 24, title: '无功补偿', prerequisites: [21],
  context: '车间的负荷表为 40 kW、30 kvar。电容柜投了两级后电流下降，生产线停机时同样的级数却可能引起超前。',
  question: '功率因数的绝对值相同，能说明负荷的无功方向也相同吗？',
  task: '在给定有功、感性无功下观察六级控制器如何按反馈逐级投切。冻结合适的工况，随后降低感性负荷，检查它如何退级。',
  device: {
    maker: 'Schneider Electric', model: 'VPL06N', name: '六级功率因数控制器', form: 'relay',
    url: 'https://www.proface.com/en/product/spec/VPL06N',
    document: 'VPL06N · 产品技术规格', locator: '施耐德 Pro-face 型号页 Complementary 的 Number of step output contacts、Operating mode、Metering type，查阅 2026-11-18。另核对 2020-03-29 VarPlus Logic 数据表。',
    features: ['六个级输出触点，支持手动和自动控制', '带背光 LCD，可显示有功、无功、视在功率及功率因数', '支持带方向的四象限功率因数测量'],
  },
  parts: [part('控制器液晶面板', '转入自动，读取残余无功并开始计算投切方向。', 'mode', 1), part('六级电容柜', '在手动模式请求四级，观察过补后的无功方向。', 'manual', 4), part('第二级反馈支路', '模拟第二级有命令却不产生补偿无功。', 'failed', 1), part('馈线电流表', '冻结级数、供电侧残余无功与线电流。', 'save')],
  controls: [range('p', '负荷有功 P', 40, 10, 80, 5, 'kW'), range('q', '负荷感性无功 QL', 30, 0, 60, 5, 'kvar'), choice('size', '每级额定补偿', 0, '10 kvar', '5 kvar'), choice('mode', '控制方式', 0, '手动请求', '自动反馈'), range('manual', '手动请求级数', 0, 0, 6, 1, '级'), choice('target', '自动目标 cosφ（滞后）', 1, '0.90', '0.95', '0.98'), choice('failed', '第二级健康状态', 0, '正常', '该级失效'), button('save', '冻结当前级数、Q 和线电流')],
  initialMemory: { stages: 0, elapsed: 0, direction: 0, switches: 0, savedStage: -1, savedQ: 0, savedA: 0 },
  advance: advanceCapacitors,
  sample(i, m) {
    const b = balance(i, m.stages)
    return {
      meters: [['闭合命令级数', m.stages, '级'], ['有效电容级', b.healthy, '级'], ['电容补偿量', b.qc, 'kvar'], ['电源侧无功', b.residual, 'kvar'], ['视在功率', b.kva, 'kVA'], ['功率因数绝对值', b.pf, ''], ['馈线电流', b.amps, 'A'], ['冻结馈线电流', m.savedA, 'A']],
      active: [0, 1, 2, ...(i.mode ? [3] : []), ...(m.stages ? [4] : []), ...(b.healthy ? [5] : []), 6],
      note: (b.residual < 0 ? '容性超前' : b.residual > 0 ? '感性滞后' : '无功平衡') + '。电源侧 Q=QL−QC；S=√(P²+Q²)。' +
        (m.direction ? '当前请求' + (m.direction > 0 ? '增加' : '减少') + '一级，延时已累计 ' + m.elapsed.toFixed(1) + ' s。' : '当前没有新的投切请求。'),
      plots: [{ title: '当前负荷下逐级补偿的馈线电流', x: '命令级数', y: '线电流 / A', points: Array.from({ length: 7 }, (_, n): [number, number] => [n, balance(i, n).amps]) }],
    }
  },
  diagram: graph(['三相电源', '感性负荷', '功率取样', '控制器比较', '级输出触点', '电容支路', '残余无功与线流'], [[0, 1], [0, 5], [1, 6], [5, 6], [6, 2], [2, 3], [3, 4], [4, 5]]),
  prediction: quiz('40 kW、30 kvar，投入两级各 10 kvar 的健康电容，电源看到什么？', ['10 kvar 滞后，约 0.970', '50 kvar 滞后，约 0.625', '10 kvar 超前，约 0.970'], 0, '供电侧仍需 30−20=10 kvar 感性无功，功率因数为 40/√1700。'),
  explanation: quiz('两级与四级时，功率因数绝对值在本例中相同。怎样识别过补？', ['只看有功是否降低', '查看无功符号或超前／滞后指示', '只比较线电流大小'], 1, 'Q=+10 和 −10 得出相同的视在功率和电流幅值，方向信息来自 Q 的符号。'),
  comic: strip([
    '40 kW、30 kvar，合起来正好 50 kVA。电源要送的电流比光供有功大。',
    '试两级，每级十千乏。负荷仍需要三十千乏，电容在负荷旁边承担了二十。',
    '电源侧只剩十千乏，因数约 0.970。那我多投两级是不是更好？',
    '看无功符号，四级时是负十。因数大小恰好一样，潮流方向已反过来。',
    '如果二级坏了，面板命令写着两级，电流表却只给出一级应有的改善。',
    '看反馈再决定下一步。负荷骤减后还要退级，否则空出来的电容会把系统带到超前。',
    '另一组每级五千乏的柜子，我会用目标和级差重算，再读总电流验证。',
  ], [3, 1, 0, 3, 2, 0, 1]),
  goals: [
    { text: '保持 40 kW、30 kvar、每级 10 kvar、目标 0.95，选自动并推进 10 s。确认两级有效、剩余 10 kvar，再冻结读数。', check: s => s.input.mode === 1 && s.memory.savedStage === 2 && near(s.memory.savedQ, 10) && near(s.memory.savedA, 59.512, 0.005) },
    { text: '将感性无功降到 10 kvar，继续推进 10 s，使控制器退至 0 级，电源侧仍为 +10 kvar。', check: s => s.input.mode === 1 && s.input.q === 10 && s.memory.savedStage === 2 && s.memory.stages === 0 && s.memory.switches >= 4 && near(reading(s, '电源侧无功'), 10) },
  ],
  assumptions: '平衡三相、400 V 线电压、基波正弦，负荷有功固定。六级均取 5 或 10 kvar，改变容量代表比较另一个柜组。课堂反馈每持续请求 5 s 改一级，倾向维持目标范围内的滞后侧；该策略为教学简化。忽略谐波、放电和接触器暂态，未提供现场投切参数。', review: true,
  practice: [['mode', 1], 10, ['save', 1], ['q', 10], 10],
  trials: [
    { name: '正常｜自动两级进入目标范围', moves: [['mode', 1], 10], verify: s => s.memory.stages === 2 && near(reading(s, '电源侧无功'), 10) && near(reading(s, '功率因数绝对值'), 0.970143) && near(reading(s, '馈线电流'), 59.512, 0.005) },
    { name: '误操作｜手动四级过补', moves: [['manual', 4], 20], verify: s => s.memory.stages === 4 && near(reading(s, '电源侧无功'), -10) && near(reading(s, '功率因数绝对值'), 0.970143) && s.memory.switches === 4 },
    { name: '故障与恢复｜第二级失效、代偿与退级', moves: [['failed', 1], ['mode', 1], 10, ['save', 1], 5, ['failed', 0], 5], verify: s => s.memory.savedStage === 2 && near(s.memory.savedQ, 20) && near(s.memory.savedA, 64.550, 0.005) && s.memory.stages === 2 && s.memory.switches === 4 && near(reading(s, '电源侧无功'), 10) },
    { name: '迁移｜60 kW、45 kvar、每级 5 kvar，自动目标 0.95，达到六级、剩余 +15 kvar', moves: [['p', 60], ['q', 45], ['size', 1], ['mode', 1], 30], verify: s => s.input.mode === 1 && s.input.size === 1 && s.input.p === 60 && s.input.q === 45 && s.input.target === 1 && s.memory.stages === 6 && near(reading(s, '电源侧无功'), 15) && near(reading(s, '功率因数绝对值'), 0.970143) },
  ],
}
