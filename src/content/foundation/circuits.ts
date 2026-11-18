import { choice, graph, part, quiz, range, strip } from '../../core/types'
import type { Lesson, Meter, Values } from '../../core/types'
import { active, curve, reads } from './common'

const capacitance = (sample: number) => [0.0008, 0.001, 0.0012][sample]
const timeConstant = (i: Values) => i.resistor * 1000 * capacitance(i.cap)
const rcTarget = (i: Values, voltage: number) => !i.contact || i.fault ? voltage : i.contact === 1 ? 12 : 0

export const rc: Lesson = {
  id: 5, title: 'RC 时间常数', prerequisites: [2],
  context: '一只带极性的电容在记录纸上留下上升曲线。学生需要解释同一电源下，换样品或调电阻为何改变到达时间。',
  question: '1 个时间常数过去，电容到底走完了这次电压变化的多少？',
  task: '在虚拟曲线台捕捉一倍时间常数的充电读数，再从该电压换向放电。观察电流符号和剩余比例。',
  device: {
    maker: 'Panasonic Industry', model: 'EEU-FR1E102', name: 'FR 系列径向铝电解电容', form: 'board',
    url: 'https://na.industrial.panasonic.com/products/capacitors/aluminum-electrolytic-capacitors/lineup/aluminum-electrolytic-capacitors-radial-lead-type/series/83367/model/83683',
    document: 'EEUFR1E102 · Panasonic Industrial Devices', locator: '型号规格表 Polarity Type、Rated Voltage、Capacitance Tolerance、Body Diameter、Lead Pitch，查阅 2026-11-18',
    features: ['有极性，径向引脚', '标称 1000 µF、额定 25 V、容量容差 ±20%', '圆柱本体直径 10 mm、长度 20 mm，引脚间距 5 mm'],
  },
  controls: [
    choice('contact', '曲线台换向', 0, '悬置', '向 12 V 充电', '经同一电阻放电'),
    range('resistor', '串联电阻', 1, 0.5, 3, 0.5, 'kΩ'),
    choice('cap', '独立未充电样品', 1, '800 µF', '1000 µF', '1200 µF'),
    choice('fault', '公共支路', 0, '完整', '断路'),
  ],
  parts: [
    part('电容样品座', '选另一个容差样品会从该样品的零初压开始。', 'cap'),
    part('串联电阻盘', '改变电阻后电容电压连续，初始斜率与时间常数改变。', 'resistor'),
    part('充放电换向器', '在悬置、充电和经电阻放电之间切换。', 'contact'),
    part('电流观察支路', '模拟公共支路断开，检查电压与电流是否同时归零。', 'fault'),
  ],
  initialMemory: { voltage: 0, origin: 0, elapsed: 0 },
  advance(m, i, before, action, dt) {
    if (action === 'cap' && i.cap !== before.cap) m.voltage = 0
    if (action !== 'tick' && i[action] !== before[action]) {
      m.origin = m.voltage
      m.elapsed = 0
    }
    const target = rcTarget(i, m.voltage)
    m.voltage = target + (m.voltage - target) * Math.exp(-dt / timeConstant(i))
    m.elapsed += dt
    return m
  },
  sample(i, m) {
    const tau = timeConstant(i), target = rcTarget(i, m.voltage)
    const milliamps = (target - m.voltage) / i.resistor
    const note = i.fault || !i.contact ? '公共回路没有电流，理想电容保持原电压。' :
      '本段从 ' + m.origin.toFixed(2) + ' V 向 ' + target + ' V 演变。经过 τ = RC，剩余电压差缩为原来的 1/e。'
    return {
      meters: [['电容电压', m.voltage, 'V'], ['支路电流', milliamps, 'mA'], ['元件时间常数', tau, 's'], ['本段时间', m.elapsed, 's']],
      active: active(i.contact === 1 && !i.fault, !!i.contact && !i.fault, m.voltage > 0, i.contact === 2 && !i.fault, true),
      note,
      plots: [curve('本段电压轨迹（起点为最近一次切换）', '相对时间 / s', '电容电压 / V', 5 * tau,
        t => target + (m.origin - target) * Math.exp(-t / tau))],
    }
  },
  diagram: graph(['12 V 源', '限流电阻', '电容储能', '放电返回', '电压记录'], [[0, 1], [1, 2], [2, 1], [1, 3], [2, 4]]),
  prediction: quiz('1000 µF、1 kΩ 从零向 12 V 充电，1 s 后最接近多少？', ['6.00 V', '7.59 V', '12.00 V'], 1, 'τ 为 1 s，此时电压为 12(1−e⁻¹)≈7.585 V。'),
  explanation: quiz('从 7.59 V 开始放电一个 τ，为何只剩约 2.79 V？', ['每秒总会减去 4.8 V', '电容只存一半电压', '衰减看本次起点，剩余比例为 e⁻¹'], 2, '放电终点为零，电压差每个 τ 保留上段起点的 36.8%。'),
  comic: strip([
    '我在曲线纸上画了条直线，一秒应该刚好走到中点吧？',
    '先看电阻两端。刚开始差了整整 12 V，初始电流最大。',
    '随着电容升压，推动电流的差变小。1 s 时笔尖已经到了 7.59 V。',
    '就从这里切到放电，先看电压，再看电流的正负号。',
    '电压没跳，电流先变负。又过 1 s，只剩约 2.79 V。',
    '把电阻调成两倍，或换一个容量偏大的样品。你能用 RC 预报新的横轴刻度。',
    '下次读传感器滤波曲线，我要先找这次变化的起点和终点，再去量 63.2%。',
  ], [2, 1, 0, 2, 3, 1, 0]),
  goals: [
    { text: '用默认 1 kΩ、1000 µF 选择充电，推进 1 s，跨过 7.58 V。', check: s => s.input.contact === 1 && s.input.resistor === 1 && s.input.cap === 1 && s.memory.voltage >= 7.58 && !s.input.fault },
    { text: '直接切换放电，继续推进至少 1 s，使电压降到切换前的 37% 以下。', check: s => s.input.contact === 2 && !s.input.fault && s.memory.origin >= 7.58 && s.memory.voltage <= s.memory.origin * 0.37 },
  ],
  assumptions: '曲线台采用 12 V 理想源、0.5～3 kΩ 电阻、800～1200 µF 理想电容。忽略漏电、ESR 和量具负载。调电阻或换向时电压连续，换独立样品从零开始。只研究数值响应。',
  review: false,
  trials: [
    { name: '正常', moves: [['contact', 1], 1, ['contact', 2], 1], verify: s => reads(s, '电容电压', 2.79053) && reads(s, '支路电流', -2.79053) && reads(s, '元件时间常数', 1) },
    { name: '误操作', moves: [['contact', 1], 1, ['contact', 0], 2], verify: s => reads(s, '电容电压', 7.58545) && reads(s, '支路电流', 0) },
    { name: '故障与恢复', moves: [['fault', 1], ['contact', 1], 2, ['fault', 0], 0.5], verify: s => reads(s, '电容电压', 4.72163) && reads(s, '支路电流', 7.27837) },
    { name: '迁移｜换 1200 µF、2 kΩ，充电 2.4 s 到约 7.59 V', moves: [['cap', 2], ['resistor', 2], ['contact', 1], 2.4], verify: s => reads(s, '元件时间常数', 2.4) && reads(s, '电容电压', 7.58545) && reads(s, '支路电流', 2.20728) },
  ],
}

const phaseRe = [230, -115, -115]
const phaseIm = [0, -115 * Math.sqrt(3), 115 * Math.sqrt(3)]
function lightingLoad(i: Values) {
  const banks = [i.a, i.b, i.c], total = i.a + i.b + i.c
  const weighted = (v: number[]) => v.reduce((sum, e, phase) => sum + e * banks[phase], 0)
  const neutralRe = i.neutral && total ? weighted(phaseRe) / total : 0
  const neutralIm = i.neutral && total ? weighted(phaseIm) / total : 0
  const volts = banks.map((_, k) => Math.hypot(phaseRe[k] - neutralRe, phaseIm[k] - neutralIm))
  const amps = volts.map((v, k) => v * banks[k] / 230)
  const currentRe = i.neutral ? 0 : weighted(phaseRe) / 230
  const currentIm = i.neutral ? 0 : weighted(phaseIm) / 230
  return { volts, amps, currentRe, currentIm, displacement: Math.hypot(neutralRe, neutralIm),
    neutralA: Math.hypot(currentRe, currentIm), watts: volts.reduce((sum, v, k) => sum + v * amps[k], 0), floating: !!i.neutral && !total }
}

export const threePhase: Lesson = {
  id: 6, title: '三相照明负荷', prerequisites: [2],
  context: '三个楼层的灯组分挂 A、B、C 相。测量台要查清夜班减灯以后，中线为何有电流，以及中线断开时哪层会过压。',
  question: '不平衡时切断中线，中线电流归零，灯组端电压会回到额定值吗？',
  task: '先平衡三相灯组，再改变一相的组数，比较中线连通和断开时的星点与支路读数。',
  device: {
    maker: 'Schneider Electric', model: 'Acti9 iEM3155 · A9MEM3155', name: '三相导轨式电能表', form: 'meter',
    url: 'https://shop.se.com/pro/ae/en/product/a9mem3155-iem3155-energy-meter-63-a-modbus-1-digital-i-1-digital-o-multi-tariff-mid/', document: 'A9MEM3155 · iEM3155 energy meter',
    locator: '型号页 Description（外形尺寸）、Poles description、Type of measurement、Direct input，查阅 2026-11-18',
    features: ['支持三相四线，直接输入 63 A', 'LCD 显示，测量电流、电压与有功功率', 'DIN 导轨安装，螺钉端子'], dimensions: [90, 95, 69],
  },
  controls: [range('a', 'A 相灯组', 3, 0, 4, 1, '组'), range('b', 'B 相灯组', 1, 0, 4, 1, '组'),
    range('c', 'C 相灯组', 2, 0, 4, 1, '组'), choice('neutral', '虚拟中线', 0, '连通', '模拟断线')],
  parts: [
    part('A 相测量通道', '调节 A 相并联支路组数，观察相电流。', 'a'),
    part('B 相测量通道', 'B 相灯组减少后等效电阻升高。', 'b'),
    part('C 相测量通道', '改变第三相，比较中线电流的幅值。', 'c'),
    part('星点观察窗', '改变外部虚拟中线连接，显示负载星点位移。', 'neutral'),
  ],
  sample(i) {
    const v = lightingLoad(i)
    const meters: Meter[] = [['中线电流', v.neutralA, 'A'], ['总有功功率', v.watts, 'W']]
    if (!v.floating) {
      meters.push(['星点位移', v.displacement, 'V'])
      v.volts.forEach((voltage, k) => meters.push([['A', 'B', 'C'][k] + ' 支路端电压', voltage, 'V']))
    }
    v.amps.forEach((amps, k) => meters.push([['A', 'B', 'C'][k] + ' 相电流', amps, 'A']))
    return { meters, active: active(true, i.a > 0, i.b > 0, i.c > 0, !v.floating, !i.neutral, v.watts > 0),
      note: v.floating ? '三相灯组和中线全部断开，星点悬浮，端电压无确定值。' :
        i.neutral ? '中线开路，星点由三支路导纳加权决定。检查各相端电压。' : '中线固定负载星点。返回电流由三个相差 120° 的电流相加得到。',
      plots: [curve('中线返回电流的一个周期', '时间 / ms', '瞬时电流 / A', 20,
        ms => Math.SQRT2 * (v.currentRe * Math.cos(Math.PI * ms / 10) - v.currentIm * Math.sin(Math.PI * ms / 10)))],
    }
  },
  diagram: graph(['三相源', 'A 灯组', 'B 灯组', 'C 灯组', '公共星点', '中线回源', '功率求和'], [[0, 1], [0, 2], [0, 3], [1, 4], [2, 4], [3, 4], [4, 5], [5, 0], [1, 6], [2, 6], [3, 6]]),
  prediction: quiz('三相各有两组灯，中线完好，每相流过 2 A。中线电流是多少？', ['6 A', '2 A', '0 A'], 2, '三个等幅基波电流相差 120°，相量闭合。'),
  explanation: quiz('A、B、C 为 2、1、2 组，虚拟中线开路后 B 相升到 276 V，原因是什么？', ['负载星点向较重负荷一侧偏移', '变压器自动升压', '三只电流可以直接加算术和'], 0, 'B 相导纳小，星点不再受中线固定，B 相到公共星点的电势差随之增大。'),
  comic: strip([
    '三个表窗各是 2 A，我给中线估了 6 A。',
    '看三根相量的方向。长度相同，尾首相接刚好回到原点。',
    'B 层少开一组，三角形合不上了，中线多出 1 A。',
    '在模型里让中线断开，先猜灯组端电压，再看星点观察窗。',
    '中线读数回零，B 层却到了 276 V。原来公共星点走了 46 V。',
    '只剩两相各一组时，两个等阻灯组会串在线电压之间，每组约 199 V。',
    '以后看楼层分配图，我会同时标灯组数和中线状态，单看中线读数会漏掉故障。',
  ], [0, 2, 1, 3, 1, 2, 3]),
  goals: [
    { text: '中线保持连通，把三相调到各 2 组，确认中线约 0 A、总功率 1380 W。', check: s => !s.input.neutral && s.input.a === 2 && s.input.b === 2 && s.input.c === 2 && reads(s, '中线电流', 0) },
    { text: 'A、C 各留 2 组，B 减到 1 组，再模拟中线断开，找到 B 相 276 V。', check: s => !!s.input.neutral && s.input.a === 2 && s.input.b === 1 && s.input.c === 2 && reads(s, 'B 支路端电压', 276) },
  ],
  assumptions: '理想 230 V 相电压、50 Hz 对称正弦源，每组为 230 Ω 纯阻负荷，无谐波或电源阻抗。中线电流与星点位移由教学模型推算。现场非线性照明还涉及三次谐波等因素。',
  review: true,
  trials: [
    { name: '正常', moves: [['a', 2], ['b', 2], ['b', 1], ['neutral', 1]], verify: s => reads(s, 'B 支路端电压', 276) && reads(s, '星点位移', 46) && reads(s, '总有功功率', 1104) },
    { name: '误操作', moves: [['c', 0]], verify: s => reads(s, '中线电流', 2.64575) && reads(s, '总有功功率', 920) },
    { name: '故障与恢复', moves: [['a', 2], ['neutral', 1], ['neutral', 0]], verify: s => reads(s, '中线电流', 1) && reads(s, 'B 支路端电压', 230) && reads(s, '总有功功率', 1150) },
    { name: '迁移｜断中线、A 与 B 各一组、C 为零，求两组各约 199.2 V 的工况', moves: [['a', 1], ['c', 0], ['neutral', 1]], verify: s => !!s.input.neutral && s.input.a === 1 && s.input.b === 1 && s.input.c === 0 && reads(s, 'A 支路端电压', 199.18584) && reads(s, '总有功功率', 345) },
  ],
}
