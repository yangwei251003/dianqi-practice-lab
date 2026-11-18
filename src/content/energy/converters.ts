import { choice, graph, near, part, quiz, range, strip } from '../../core/types'
import type { Lesson, Values } from '../../core/types'
import { plot, reading, series } from './common'
import type { Point } from './common'

const capacitances = [470, 1000, 2200]

function rectified(input: Values) {
  const frequency = input.line ? 60 : 50
  const pulseHz = input.open ? frequency : 2 * frequency
  const peak = 12 * Math.SQRT2
  const omega = 2 * Math.PI * frequency
  const slope = 1000 * input.load / capacitances[input.cap] // (mA / µF) to V/s
  const release = Math.asin(slope / (peak * omega)) / omega
  const source = (t: number) => {
    const ac = peak * Math.cos(omega * t)
    return Math.max(0, (input.open ? ac : Math.abs(ac)) - 1.4)
  }
  const bus = (t: number) => {
    const period = 1 / pulseHz
    const elapsed = ((t - release) % period + period) % period
    return Math.max(source(t), source(release) - slope * elapsed, 0)
  }
  const duration = 1000 / frequency
  const points = series(duration, 240, ms => bus(ms / 1000))
  // The diode begins to replenish the capacitor when the rising source catches its linear ramp.
  let low = 0.5 / pulseHz
  let high = 1 / pulseHz
  for (let step = 0; step < 24; step++) {
    const t = (low + high) / 2
    if (source(t) < source(release) - slope * (t - release)) low = t
    else high = t
  }
  const valley = bus((low + high) / 2)
  const mean = points.slice(0, -1).reduce((sum, [, v]) => sum + v, 0) / (points.length - 1)
  return { pulseHz, ripple: peak - 1.4 - valley, mean, valley, points, duration, source }
}

export const rectifier: Lesson = {
  id: 25, title: '单相整流滤波与纹波', prerequisites: [],
  context: '记录仪的低压电源出现条纹。虚拟示波器能冻结一个工频周期，分别观察桥后脉动电压和带储能电容的负载端。',
  question: '都是谷底变深，怎样从相邻谷底的间距分辨电容变小和桥臂缺失？',
  task: '先让一条桥臂开路并数补电次数，再恢复全桥，用电容把峰峰纹波压到 0.5 V 以下。',
  device: {
    maker: 'Vishay General Semiconductor', model: 'KBU4G', name: '单相玻璃钝化整流桥', form: 'board',
    url: 'https://www.vishay.com/docs/98731/kbu4.pdf', document: 'KBU4A–KBU4M · Glass Passivated Single-Phase Bridge Rectifier',
    locator: '文档 98731，2025-01-24，第 1 页 KBU4G 额定值列，第 3 页 Case Style KBU 封装正视图。',
    features: ['原厂第 3 页图示方向为右上角带切角、引脚朝下。标记从左至右为 −、～、～、＋。', 'KBU4G 列给出 400 V 重复峰值反向电压，系列平均整流电流按表列散热条件为 4 A。'],
  },
  controls: [choice('line', '虚拟交流频率', 0, '50 Hz', '60 Hz'), choice('open', '桥臂状态', 0, '完整全桥', '一条桥臂开路'),
    choice('cap', '滤波电容', 1, '470 µF', '1000 µF', '2200 µF'), range('load', '恒流负载', 100, 50, 300, 25, 'mA')],
  parts: [part('KBU 整流桥', '让一个半周的整流通路失效，可以看见两次补电之间的间隔加倍。', 'open', 1),
    part('储能电容', '同一负载下提高容量，观察电压下降斜率。', 'cap', 2),
    part('电子负载', '增加直流取流，让电容在两次补电间释放更多电荷。', 'load', 250),
    part('低压正弦源', '切到 60 Hz，对照半周期长度。', 'line', 1)],
  diagram: graph(['交流源', '正半周桥路', '负半周桥路', '直流母线', '储能电容', '恒流负载'], [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [4, 3], [3, 5]]),
  initialMemory: { missedHalf: 0 },
  advance: (m, i) => { if (i.open) m.missedHalf = 1; return m },
  sample: i => {
    const r = rectified(i)
    return {
      meters: [['补电频率', r.pulseHz, 'Hz'], ['峰峰纹波', r.ripple, 'V'], ['负载平均电压', r.mean, 'V'], ['谷底电压', r.valley, 'V']],
      active: i.open ? [0, 1, 3, 4, 5] : [0, 1, 2, 3, 4, 5],
      note: i.open ? '负半周通路缺失。电容独自供电的时间接近一个工频周期。' : '两个半周轮流补电。桥臂截止时，电容按 I/C 的斜率向负载放电。',
      plots: [plot('桥后脉动电压（移除电容作对照）', '时间 / ms', '电压 / V', series(r.duration, 240, ms => r.source(ms / 1000))),
        plot('带电容时的负载端电压', '时间 / ms', '电压 / V', r.points)],
    }
  },
  prediction: quiz('50 Hz 全桥中一条桥臂开路，哪个变化能直接看出少了一个半周？', ['谷底间隔变为 20 ms', '峰顶电压翻倍', '负载电流自动归零'], 0, '完整全桥每 10 ms 有一次补电机会。失去一路后每 20 ms 才遇到可用峰顶。'),
  explanation: quiz('同一补电间隔、同一负载下，增大电容为何抬高谷底？', ['正弦源的峰值提高', '每伏压降可释放的电荷增多', '二极管开始双向导通'], 1, '电容释放的电荷约为 IΔt，压降为 ΔQ/C。增容减缓截止区的下降斜率。'),
  comic: strip(['记录仪画出一道道浅沟。我先量沟距，怎么刚好是 10 ms？', '电源为 50 Hz。沿桥的两条通路各走一次，一个周期里电容能补两次电。',
    '我让一条桥臂开路。峰还差不多高，下一座峰却晚了整整 10 ms。', '看谷底。多出来的这一段，电子负载的电荷全由电容提供。',
    '恢复全桥再换 2200 µF，沟距回到 10 ms，沟也浅了。', '把负载拨到 250 mA，沟又深了。这次间距没变，可以把排查方向放在取流和储能上。'], [0, 0, 0, 2, 1, 2]),
  goals: [
    { text: '在 50 Hz 选择“一条桥臂开路”，看到补电频率降到 50 Hz。', check: s => s.input.open === 1 && reading(s, '补电频率') === 50 },
    { text: '恢复完整全桥，保留 100 mA，改用 2200 µF，让纹波小于 0.5 V。', check: s => !!s.memory.missedHalf && !s.input.open && s.input.load === 100 && reading(s, '峰峰纹波') < 0.5 },
  ],
  practice: [['open', 1], ['open', 0], ['cap', 2]],
  assumptions: '稳态 12 V RMS 理想正弦源，导通路径固定压降 1.4 V。负载 50–300 mA 恒流，忽略绕组内阻、电容 ESR、充电浪涌与启动过程。曲线起点取正峰。', review: true,
  trials: [
    { name: '正常 · 大电容抬高谷底', moves: [['cap', 2]], verify: s => near(reading(s, '补电频率'), 100) && near(reading(s, '峰峰纹波'), 0.42, 0.02) },
    { name: '误操作 · 小电容承担重负载', moves: [['cap', 0], ['load', 300]], verify: s => near(reading(s, '峰峰纹波'), 4.71, 0.02) && near(reading(s, '谷底电压'), 10.86, 0.02) },
    { name: '故障与恢复 · 找回缺失的半周', moves: [['open', 1], ['open', 0], ['cap', 2]], verify: s => !!s.memory.missedHalf && near(reading(s, '补电频率'), 100) && near(reading(s, '谷底电压'), 15.15, 0.03) },
    { name: '迁移 · 60 Hz、1000 µF、100 mA 单桥臂开路，找到约 1.55 V 纹波', moves: [['line', 1], ['open', 1]], verify: s => s.input.cap === 1 && s.input.load === 100 && near(reading(s, '补电频率'), 60) && near(reading(s, '峰峰纹波'), 1.55, 0.02) },
  ],
}

const inductors = [220, 100, 470]
function buckPoint(i: Values) {
  const duty = i.duty / 100
  const on = i.vin - 1
  const off = -0.4
  const voltage = on * duty + off * (1 - duty)
  const ripple = (on - voltage) * duty / (0.15 * inductors[i.coil])
  return { duty, on, off, voltage, ripple }
}

function switchingWave(period: number, duty: number, on: number, off: number): Point[] {
  const points: Point[] = []
  for (let cycle = 0; cycle < 2; cycle++) {
    const start = cycle * period
    const edge = start + duty * period
    points.push([start, on], [edge, on], [edge, off], [start + period, off])
  }
  return points
}

export const buck: Lesson = {
  id: 26, title: 'Buck 降压与周期平均', prerequisites: [25],
  context: '仪表有一个低压供电支路。切换输入电源时，需要解释开关节点上的方波、线圈里的三角波和输出端的平均值。',
  question: '开关每次接通都是十几伏，为什么负载读数能维持在五伏附近？',
  task: '先在 12 V 输入下得到约 5.3 V，再把输入翻倍，重新选取占空比保持近似输出。',
  device: {
    maker: 'Texas Instruments', model: 'LM2596T-ADJ/NOPB', name: '可调型降压稳压器', form: 'board',
    url: 'https://www.ti.com/lit/ds/symlink/lm2596.pdf', document: 'LM2596 SIMPLE SWITCHER 150-kHz 3-A Step-Down Voltage Regulator',
    locator: 'SNVS124G，2023-03 修订，第 6 节引脚、第 7 节振荡频率、第 9 节降压应用。',
    features: ['150 kHz 振荡器与内部功率开关。', '可调版本用反馈端采样输出，典型应用包含外部续流二极管、电感和输出电容。'],
  },
  controls: [range('vin', '输入母线', 12, 12, 24, 2, 'V'), range('duty', '观察占空比', 40, 20, 75, 5, '%'),
    choice('coil', '电感状态', 0, '标称 220 µH', '有效电感降至 100 µH', '替代线圈 470 µH')],
  parts: [part('内部开关', '冻结占空比为 50%，比较接通与续流两段面积。', 'duty', 50), part('外接储能电感', '把有效电感改为 100 µH，检查电流摆幅。', 'coil', 1),
    part('输入储能端', '选择 24 V 母线测试线电压变化。', 'vin', 24)],
  diagram: graph(['直流源', '内部开关', '续流二极管', '储能电感', '输出电容', '负载回路', '反馈比较器'], [[0, 1], [1, 3], [2, 3], [3, 4], [3, 5], [4, 5], [5, 2], [5, 6], [6, 1]]),
  initialMemory: { reference: 0, lowL: 0 },
  advance: (m, i) => { if (i.vin === 12 && i.duty === 50) m.reference = 1; if (i.coil === 1) m.lowL = 1; return m },
  sample: i => {
    const b = buckPoint(i)
    const period = 1 / 0.15
    const bottom = 0.8 - b.ripple / 2
    const top = 0.8 + b.ripple / 2
    const triangle: Point[] = [[0, bottom], [period * b.duty, top], [period, bottom], [period * (1 + b.duty), top], [2 * period, bottom]]
    return {
      meters: [['输出平均电压', b.voltage, 'V'], ['电感峰峰电流', b.ripple, 'A'], ['电感谷值', bottom, 'A'], ['理想无损电压', b.duty * i.vin, 'V']],
      active: [0, 1, 2, 3, 4, 5],
      note: '冻结控制器的工作占空比。电感在接通段升流、续流段降流。稳态一个周期的电感伏秒代数和为零。',
      plots: [plot('开关节点的两个周期', '时间 / µs', '电压 / V', switchingWave(period, b.duty, b.on, b.off)),
        plot('电感电流围绕 0.8 A 摆动', '时间 / µs', '电流 / A', triangle)],
    }
  },
  prediction: quiz('固定占空比和输入，电感由 220 µH 降至 100 µH，哪项最先显著增大？', ['输出平均电压', '电感电流的峰峰差', '开关频率'], 1, '接通时间和电感电压相同，ΔI=VᴸΔt/L。降低 L 会增大三角波摆幅。'),
  explanation: quiz('12 V、50% 占空比的算例为何只有 5.3 V？', ['接通段约 11 V，续流段约 −0.4 V，两段各占一半', '负载拿走一半的电流', '开关频率低于工频'], 0, '连续导通的电感满足伏秒平衡，输出平均电压接近开关节点的加权平均。'),
  comic: strip(['方波顶是 11 V，仪表却读 5.3 V。我的探头选错地方了？', '一只看开关节点，一只看输出。把时间停在一个周期，两个读数都能解释。',
    '接通的半周期里线圈电流往上爬。断开后，电流为什么还能往前走？', '续流二极管承接同方向电流。此时节点略低于零，电流开始回落。',
    '我换成小电感，三角波变高，平均输出还在原处。', '现在让母线升到 24 V。缩短接通时间到约四分之一，仪表支路才回到原来的电压范围。'], [0, 0, 1, 1, 1, 2]),
  goals: [
    { text: '保留 12 V，把占空比调到 50%，在输出表找到 5.3 V。', check: s => s.input.vin === 12 && near(reading(s, '输出平均电压'), 5.3) },
    { text: '把输入改成 24 V，尝试 25% 占空比，把输出拉回 5.0–5.5 V。', check: s => !!s.memory.reference && s.input.vin === 24 && Math.abs(reading(s, '输出平均电压') - 5.25) <= 0.25 },
  ],
  practice: [['duty', 50], ['vin', 24], ['duty', 25]],
  assumptions: '连续导通稳态、恒流负载 0.8 A。开关、电感续流通路的恒压降分别取 1.0 V、0.4 V，忽略 ESR 和反馈动态。占空比为教学冻结量，实物由闭环调节。', review: false,
  trials: [
    { name: '正常 · 半周期平均', moves: [['duty', 50]], verify: s => near(reading(s, '输出平均电压'), 5.3) && near(reading(s, '电感峰峰电流'), 0.08636, 0.0001) },
    { name: '误操作 · 翻倍母线仍用半占空', moves: [['duty', 50], ['vin', 24]], verify: s => near(reading(s, '输出平均电压'), 11.3) && near(reading(s, '理想无损电压'), 12) },
    { name: '故障与恢复 · 恢复标称电感', moves: [['duty', 50], ['coil', 1], ['coil', 0]], verify: s => !!s.memory.lowL && near(reading(s, '电感谷值'), 0.75682, 0.0001) },
    { name: '迁移 · 从 12 V、50% 换到 24 V，调回约 5.45 V 输出', moves: [['duty', 50], ['vin', 24], ['duty', 25]], verify: s => !!s.memory.reference && near(reading(s, '输出平均电压'), 5.45) && near(reading(s, '电感峰峰电流'), 0.13295, 0.0001) },
  ],
}

function boostAt(vin: number, resistance: number, duty: number) {
  const off = 1 - duty
  const current = (vin - 0.6 * duty - 0.4 * off) / (resistance * off * off + 0.45)
  const ripple = (vin - 0.45 * current - 0.6) * duty / (52000 * 0.00047)
  return { voltage: current * off * resistance, current, peak: current + ripple / 2, duty }
}
const resistances = [120, 60, 24]
function boostPoint(i: Values, resistance = resistances[i.load]) {
  let low = 0
  let high = i.duty / 100
  const requested = boostAt(i.vin, resistance, high)
  if (requested.peak <= 2.2) return { ...requested, limited: false }
  for (let step = 0; step < 28; step++) {
    const mid = (low + high) / 2
    if (boostAt(i.vin, resistance, mid).peak > 2.2) high = mid
    else low = mid
  }
  return { ...boostAt(i.vin, resistance, low), limited: true }
}

export const boost: Lesson = {
  id: 27, title: 'Boost 有载升压与峰值限流', prerequisites: [26],
  context: '移动仪表的恒阻耗能支路接入后，升压母线低于空载公式给出的数值。观察电感峰值，区分导通损耗与限流缩短脉冲。',
  question: '要求更高占空比时，为什么输出会停在某个电压，重负载得到的电流却更大？',
  task: '让 60 Ω 负载升到约 22 V，再接入 24 Ω 并提高请求占空比，观察有效占空比受到约束。',
  device: {
    maker: 'Texas Instruments', model: 'LM2577T-ADJ/NOPB', name: '可调升压稳压器', form: 'board',
    url: 'https://www.ti.com/lit/ds/symlink/lm2577.pdf', document: 'LM1577/LM2577 SIMPLE SWITCHER Step-Up Voltage Regulator',
    locator: 'SNOS658D，2013-04 修订，第 14 页图 32 和 Step-Up (Boost) Regulator 段。',
    features: ['52 kHz 振荡器、集成 3 A NPN 开关与电流限制。', '图 32 的外部电感在接通时储能，关断后经二极管向输出电容与负载供能。'],
  },
  controls: [range('vin', '电源电压', 12, 9, 15, 3, 'V'), range('duty', '请求占空比', 35, 20, 70, 5, '%'),
    choice('load', '等效负载', 1, '轻载 120 Ω', '常用 60 Ω', '重载 24 Ω')],
  parts: [part('输入电源端', '比较电源降至 9 V 时的输出。', 'vin', 9), part('开关与电感支路', '请求更长的储能脉冲，看峰值是否顶到上限。', 'duty', 65),
    part('整流后的负载端', '接入 24 Ω 等效负载，要求更大的输出电流。', 'load', 2)],
  diagram: graph(['输入源', '储能电感', '开关至回路', '输出二极管', '输出电容', '负载', '峰值比较器'], [[0, 1], [1, 2], [1, 3], [3, 4], [3, 5], [4, 5], [1, 6], [6, 2]]),
  initialMemory: { boosted: 0, hitLimit: 0 },
  advance: (m, i) => {
    const b = boostPoint(i)
    if (i.vin === 12 && i.load === 1 && near(b.voltage, 22.33, 0.1)) m.boosted = 1
    if (b.limited) m.hitLimit = 1
    return m
  },
  sample: i => {
    const b = boostPoint(i)
    return {
      meters: [['负载电压', b.voltage, 'V'], ['输入平均电流', b.current, 'A'], ['负载电流', b.voltage / resistances[i.load], 'A'],
        ['电感峰值', b.peak, 'A'], ['有效占空比', b.duty * 100, '%']],
      active: b.limited ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4, 5],
      note: b.limited ? '峰值触及教学上限，实际储能脉冲缩短。输出同时受到导通损耗和占空比约束。' : '开关闭合时电感储能，输出电容维持负载。关断时输入与电感一起向负载送能。',
      plots: [plot('同一请求下的负载特性', '负载电阻 / Ω', '输出电压 / V', series(96, 64, x => boostPoint(i, x + 24).voltage).map(([x, y]) => [x + 24, y])),
        plot('一个周期中的电感电流', '时间 / µs', '电流 / A', [[0, 2 * b.current - b.peak], [1e6 * b.duty / 52000, b.peak], [1e6 / 52000, 2 * b.current - b.peak]])],
    }
  },
  prediction: quiz('同一输入与请求占空比，负载由 60 Ω 变为 24 Ω，哪个量更可能先碰到上限？', ['输入频率', '输出电容的容量', '电感峰值电流'], 2, '重负载在给定电压下需要更多功率。电源与电感承担的电流增大，峰值比较器可能提前结束接通段。'),
  explanation: quiz('进入限流后，用公式 Vᵢₙ/(1−D) 直接代入面板的请求 D 会怎样？', ['高估输出，因为实际 D 缩短，还有通路压降', '准确，因为所有电流都流向输出', '低估，因为电感只在关断时吸收能量'], 0, '无损稳态关系需要实际占空比。这里还要考虑串联电阻和半导体压降。'),
  comic: strip(['12 V 仪表电源想给较高电压的支路送能，我先把请求调到一半。', '看开关接通的那段，电感电流上升，输出电容暂时单独供电。',
    '关断时电感通过二极管送出能量。60 Ω 的表读到约 22 V，比理想 24 V 少。', '现在换成 24 Ω 并请求 65%。盯住电流峰，比只看电压更容易找到原因。',
    '峰顶停在 2.2 A，请求还在 65%，实际脉冲已经缩短了。', '再切回 60 Ω。若限流消退而电压上升，下次遇到母线下陷，就知道该同时看负载和波形。'], [0, 1, 2, 2, 1, 2]),
  goals: [
    { text: '保留 12 V、60 Ω，把请求调到 50%，观察约 22.3 V。', check: s => s.input.load === 1 && near(reading(s, '负载电压'), 22.33, 0.1) },
    { text: '保持 12 V，选 24 Ω、请求 65%，让峰值到 2.2 A 并看到有效占空比低于请求。', check: s => !!s.memory.boosted && s.input.load === 2 && s.input.duty === 65 && near(reading(s, '电感峰值'), 2.2) && reading(s, '有效占空比') < 65 },
  ],
  practice: [['duty', 50], ['load', 2], ['duty', 65]],
  assumptions: '冻结控制器占空比，取连续导通准稳态。L=470 µH，总串联电阻 0.45 Ω，开关/二极管压降 0.6/0.4 V。电感伏秒平衡及 Iout=(1−D)IL 决定负载线。2.2 A 峰值约束为教学设定，跳过真实环路补偿、热及启动。', review: true,
  trials: [
    { name: '正常 · 有载升压', moves: [['duty', 50]], verify: s => near(reading(s, '负载电压'), 22.33, 0.01) && near(reading(s, '负载电流'), 0.372, 0.002) },
    { name: '误操作 · 重载继续加占空', moves: [['load', 2], ['duty', 70]], verify: s => near(reading(s, '电感峰值'), 2.2) && reading(s, '有效占空比') < 60 && reading(s, '负载电压') < 25 },
    { name: '故障与恢复 · 移除过重支路', moves: [['duty', 50], ['load', 2], ['duty', 65], ['load', 1]], verify: s => !!s.memory.hitLimit && near(reading(s, '有效占空比'), 65) && near(reading(s, '负载电压'), 30.88, 0.05) },
    { name: '迁移 · 9 V、120 Ω 轻载下调至约 16.75 V，核对输入约 0.279 A', moves: [['vin', 9], ['load', 0], ['duty', 50]], verify: s => near(reading(s, '负载电压'), 16.75, 0.02) && near(reading(s, '输入平均电流'), 0.279, 0.002) },
  ],
}
