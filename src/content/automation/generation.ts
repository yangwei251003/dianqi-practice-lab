import { button, choice, graph, near, part, quiz, range, strip } from '../../core/types'
import type { Lesson, Plot, Values } from '../../core/types'
import { limit, reading } from './shared'

function loadDrop(i: Values): number { return (0.03 * i.kw + 0.12 * i.kvar) / 450 }
function volts(i: Values, field: number): number { return 400 * (field - loadDrop(i)) }
function targetField(i: Values): number { return limit(i.reference / 400 + loadDrop(i), 0.85, 1.15) }
function frequencyTarget(i: Values): number { return i.governor ? 50 : 50 - 2 * i.kw / 360 }
function response(now: number, target: number, elapsed: number, tau: number): number {
  return target + (now - target) * Math.exp(-elapsed / tau)
}

export const islandGenerator: Lesson = {
  id: 19, title: '孤网教学发电机励磁负荷', prerequisites: [],
  context: '独立供电的训练机组带上一组感性负荷，端电压出现凹口。再增加有功负荷，转速表也发生变化。',
  question: '孤网中，谁感受端电压误差？谁为新增有功负荷补足机械功率？',
  task: '冻结教学励磁量并加入 150 kvar，再闭合调压回路追踪电压恢复。改变有功负荷，对照调速模式与稳态频率。',
  device: {
    maker: 'STAMFORD | AvK', model: 'S4L1D-G4 Wdg.311 / AS440', name: '四极无刷发电机与自动电压调节器', form: 'generator',
    url: 'https://www.stamford-avk.com/sites/stamfordavk/files/ESA056E881_Rev_F.pdf',
    document: 'S4L1D-G4 Wdg.311 · Technical Data Sheet', locator: 'A056E881 Rev.F，2019-06-10。第 1–2 页 Excitation and Voltage Regulators、Electrical Data；400 V/50 Hz Operating Chart。',
    features: ['四极，311 号绕组，50 Hz 对应 1500 r/min', '在 400 V、50 Hz 图中使用 450 kVA 基值', '所列 AS440 方案由机端自励供电并调节励磁'],
  },
  parts: [part('原动机与主轴', '给模型增加 180 kW 有功负荷，比较调速后的频率。', 'kw', 180), part('励磁机', '冻结当前教学励磁量以观察开环响应。', 'loop', 1), part('定子出线与负荷表', '接入模型中 150 kvar 的感性负荷阶跃。', 'kvar', 150), part('AS440 电压取样', '恢复自动反馈，让端电压向参考值收敛。', 'loop', 0)],
  controls: [range('kw', '有功负荷', 0, 0, 240, 30, 'kW'), range('kvar', '感性无功负荷', 0, 0, 180, 15, 'kvar'), range('reference', '教学电压参考', 400, 380, 420, 4, 'V'), choice('loop', '励磁反馈实验', 0, '自动电压反馈', '冻结当前励磁量'), choice('governor', '独立原动机调速', 0, '有功下垂', '等频调节')],
  initialMemory: { field: 1, hz: 50, holdVoltage: 400 },
  advance(m, i, _old, action, dt) {
    if (action === 'tick') {
      if (!i.loop) m.field = response(m.field, targetField(i), dt, 0.5)
      m.hz = response(m.hz, frequencyTarget(i), dt, 1)
      if (i.loop) m.holdVoltage = volts(i, m.field)
    }
    return m
  },
  sample(i, m) {
    const voltage = volts(i, m.field)
    const future = (sec: number) => volts(i, i.loop ? m.field : response(m.field, targetField(i), sec, 0.5))
    return {
      meters: [['机端线电压', voltage, 'V'], ['频率', m.hz, 'Hz'], ['同步转速', 30 * m.hz, 'r/min'], ['归一励磁量', m.field, 'pu'], ['输出有功', i.kw, 'kW'], ['输出无功', i.kvar, 'kvar']],
      active: [0, 1, 2, ...(i.kw || i.kvar ? [3] : []), 4, ...(i.loop ? [] : [5]), 6],
      note: i.loop ? '励磁量停在冻结时的值。增加感性无功，端电压会立即降低。' :
        '电压取样反馈到励磁回路。有功下垂调速下，带载后的频率可以稳定在低于 50 Hz 的值。',
      plots: [{ title: '保持当前负荷时的端电压预测', x: '从此刻起 / s', y: '线电压 / V', points: Array.from({ length: 21 }, (_, k): [number, number] => [k / 10, future(k / 10)]) }],
    }
  },
  diagram: graph(['调速器', '原动机与轴', '主发电机', '有功／无功负荷', '机端电压取样', 'AVR', '励磁机'], [[0, 1], [1, 2], [2, 3], [3, 1], [3, 2], [1, 0], [2, 4], [4, 5], [5, 6], [6, 2]]),
  prediction: quiz('冻结初始励磁量，只增加 150 kvar 感性无功，模型的第一笔读数是什么？', ['约 384 V，50 Hz', '400 V，48 Hz', '约 416 V，52 Hz'], 0, '教学静态压降为 400×0.12×150/450=16 V，此次没有增加有功负荷。'),
  explanation: quiz('增加有功后下垂调速使频率下降。仅调高电压参考为什么难以恢复频率？', ['电压表出现量程错误', '频率由轴速决定，原动机调速负责有功平衡', '无功会直接决定转速'], 1, '四极同步机 f=4n/120。电压参考进入励磁通道，调速器才改变机械输入。'),
  comic: strip([
    '孤网里没有大电网帮我们定频。这只转速表的 1500 转和 50 Hz 正好对应。',
    '先冻结励磁。加一组感性负荷，电压表刚掉到 384 V，转速表几乎没动。',
    '恢复反馈后，励磁量在涨。电压先走一半，再慢慢靠近 400 V。',
    '把视线移到轴上。现在加 180 kW，有功下垂调速让频率趋近 49 Hz。',
    '我把电压参考抬高，电压回路跟上了，频率却还在 49 Hz 附近。',
    '试试独立的等频调速模型。原动机多给机械功率，转速才能回到同步值。',
    '下一次看到压降和频降同时出现，我会把有功、无功、励磁、轴速一起读。',
  ], [0, 2, 3, 0, 1, 0, 2]),
  goals: [
    { text: '冻结初始励磁，保持有功为 0，加入 150 kvar 并推进 0.1 s，看到机端 384 V、频率 50 Hz。', check: s => s.input.loop === 1 && s.input.kvar === 150 && near(s.memory.holdVoltage, 384) && near(s.memory.hz, 50) },
    { text: '保留该负荷，恢复自动电压反馈并推进 2 s，使机端回到 399.5 V 以上且励磁量超过 1.03 pu。', check: s => !s.input.loop && near(s.memory.holdVoltage, 384) && s.input.kvar === 150 && reading(s, '机端线电压') > 399.5 && s.memory.field > 1.03 },
  ],
  assumptions: '已建压、独立且平衡的三相教学机组，基准 400 V/50 Hz、450 kVA。取 U/400=E−(0.03P+0.12Q)/450，P 用 kW、Q 用 kvar。AVR 与调速一阶时间常数取 0.5/1 s，4% 有功下垂按 360 kW 基值；E 是无量纲等效量。省略绕组瞬态、弱磁限制与欠频滚降。', review: true,
  practice: [['loop', 1], ['kvar', 150], 0.1, ['loop', 0], 2],
  trials: [
    { name: '正常｜无功阶跃后的半秒恢复', moves: [['kvar', 150], 0.5], verify: s => near(reading(s, '机端线电压'), 394.11393) && near(s.memory.hz, 50) && near(s.memory.field, 1.025285) },
    { name: '误操作｜用电压参考追频率', moves: [['kw', 180], ['reference', 416], 4], verify: s => near(reading(s, '机端线电压'), 415.9930, 0.002) && near(s.memory.hz, 49.018316) },
    { name: '故障与恢复｜励磁冻结后恢复反馈', moves: [['loop', 1], ['kvar', 150], 1, ['loop', 0], 2], verify: s => near(s.memory.holdVoltage, 384) && near(reading(s, '机端线电压'), 399.70695) && near(s.memory.hz, 50) },
    { name: '迁移｜90 kW、75 kvar 下使用等频调速与 408 V 参考，4 s 后恢复至约 408 V、50 Hz', moves: [['kw', 90], ['kvar', 75], ['reference', 408], ['governor', 1], 4], verify: s => s.input.kw === 90 && s.input.kvar === 75 && s.input.governor === 1 && near(reading(s, '机端线电压'), 407.9938, 0.002) && near(reading(s, '同步转速'), 1500) },
  ],
}

const primaryTaps = [432, 444, 456, 468, 480, 492, 504]
function secondary(linePrimary: number, tap: number): number { return linePrimary * 208 / primaryTaps[tap] }
function secondaryProbe(i: Values): number { return secondary(i.primary, i.tap) / (i.probe ? Math.sqrt(3) : 1) }

export const distributionTransformer: Lesson = {
  id: 20, title: '配变变比', prerequisites: [],
  context: '同一份配变检验单写着“208 V”和“120 V”。两位学生读的是同一副绕组，表笔位置却不同。',
  question: '一次接成三角形、二次接成星形时，哪些电压能直接拿来比较匝比？',
  task: '从 480 V 名义档记录二次线间电压，改读线对中性点，再用 456 V 电源和相应的虚拟分接重建 208 V。',
  device: {
    maker: 'Schneider Electric · Square D', model: 'EXN75T3H', name: '三相干式配电变压器', form: 'transformer',
    url: 'https://www.proface.com/en/product/spec/EXN75T3H',
    document: 'EXN75T3H · 产品技术规格', locator: '施耐德 Pro-face 型号页 Complementary 中的 Primary voltage、Number of tap-offs、Secondary voltage、Width/Height/Depth，查阅 2026-11-18。另核对 2020-02-04 型号数据表。',
    dimensions: [764, 851, 697],
    features: ['75 kVA、60 Hz，低压三相铝绕组干式配变', '一次 480 V 三角形，二次 208Y/120 V', '一次分接为额定以上两档、以下四档，每档 2.5%'],
  },
  parts: [part('一次三角形绕组', '把虚拟一次线电压设为 456 V。', 'primary', 456), part('一次分接模型', '把比较用的绕组模型改成 −5% 的 456 V 档。', 'tap', 2), part('二次星形中性点', '改读二次线对中性点电压。', 'probe', 1), part('比较表记忆窗', '冻结一次当前测点的虚拟读数。', 'save')],
  controls: [range('primary', '一次线电压', 480, 432, 504, 12, 'V'), choice('tap', '比较用一次分接模型', 4, '432 V (−10%)', '444 V (−7.5%)', '456 V (−5%)', '468 V (−2.5%)', '480 V (0%)', '492 V (+2.5%)', '504 V (+5%)'), choice('probe', '二次测点', 0, '线间 Uab', '线对中性点 UaN'), button('save', '记录当前测点')],
  initialMemory: { saved: 0, savedProbe: -1, savedTap: -1, savedPrimary: 0 },
  advance(m, i, _old, action) {
    if (action === 'save') { m.saved = secondaryProbe(i); m.savedProbe = i.probe; m.savedTap = i.tap; m.savedPrimary = i.primary }
    return m
  },
  sample(i, m) {
    const line = secondary(i.primary, i.tap)
    const lineRatio = primaryTaps[i.tap] / 208
    const curve: Plot = { title: '所选分接和测点的空载电压特性', x: '一次线电压 / V', y: '二次测点 / V', points: primaryTaps.map(v => [v, secondary(v, i.tap) / (i.probe ? Math.sqrt(3) : 1)]) }
    return {
      meters: [['一次线电压', i.primary, 'V'], ['二次线间', line, 'V'], ['二次相电压', line / Math.sqrt(3), 'V'], ['当前表计', secondaryProbe(i), 'V'], ['线电压比', lineRatio, ''], ['每相匝比', lineRatio * Math.sqrt(3), ''], ['冻结读数', m.saved, 'V']],
      active: [0, 1, 2, 3, ...(i.probe ? [5] : [4]), 6],
      note: i.probe ? '二次星形相电压等于线间电压除以 √3。一次三角形每相承受一次线电压。' :
        '理想空载二次线电压=一次线电压×208/分接标称电压。改变分接就改变一次每相的有效匝数。',
      plots: [curve],
    }
  },
  diagram: graph(['一次线电压', 'Δ 一次分接', '磁通耦合', 'Y 二次绕组', '线间比较', '相对中性点', '测点表计'], [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5], [4, 6], [5, 6]]),
  prediction: quiz('480 V 电源配 504 V 一次分接时，空载二次线电压接近多少？', ['218.4 V', '198.1 V', '208 V'], 1, '一次有效匝数增多，二次线电压变为 480×208/504≈198.10 V。'),
  explanation: quiz('为何每相匝比与铭牌 480/208 的线电压比相差 √3？', ['因为铁损有三倍', '因为二次使用铝绕组', '一次相压等于线压，而二次相压等于线压除以 √3'], 2, '理想匝比比较两侧每一相的绕组电压，三角形和星形的线量关系不同。'),
  comic: strip([
    '记录 A 是 208 V，记录 B 只有约 120 V。有人以为少了一相。',
    '看一下测点，A 横跨两条相线，B 从一条线量到星点。都在二次侧。',
    '把 A 除以根号三，正好是 B。那铭牌比 480/208 也不是每相匝比了。',
    '一次为三角形，每个绕组承受 480 V。拿它和二次单个绕组的约 120 V 比。',
    '把供电模型改为 456 V 而分接仍选 480 V，二次线间跌到了 197.6 V。',
    '比较 456 V 分接的离线模型。两者匹配时，二次又回到 208 V。',
    '下次读变比记录，我先抄清接法、分接标称值和两端测点。',
  ], [3, 2, 2, 0, 0, 1, 3]),
  goals: [
    { text: '一次与分接保持 480 V，二次选线间并点击“记录当前测点”，保存 208 V。', check: s => near(s.memory.saved, 208) && s.memory.savedProbe === 0 && s.memory.savedPrimary === 480 && s.memory.savedTap === 4 },
    { text: '切换到线对中性点，让当前表计变为约 120.09 V，对照保存的 208 V。', check: s => s.input.probe === 1 && near(s.memory.saved, 208) && near(reading(s, '当前表计'), 120.0889) },
    { text: '回到线间，把一次电压和分接都设为 456 V，使线间读数重新达到 208 V。', check: s => s.input.primary === 456 && s.input.tap === 2 && !s.input.probe && near(reading(s, '当前表计'), 208) },
  ],
  assumptions: '离线比较独立的理想空载分接模型，平衡正弦 60 Hz。名牌 208Y/120 的 120 V 为圆整值，计算使用 208/√3 V。省略负载压降和损耗。外形尺寸按厂家机壳 W/H/D。', review: true,
  practice: [['save', 1], ['probe', 1], ['probe', 0], ['primary', 456], ['tap', 2]],
  trials: [
    { name: '正常｜核对二次两种线量', moves: [['save', 1], ['probe', 1]], verify: s => near(s.memory.saved, 208) && near(reading(s, '当前表计'), 120.08886) && near(reading(s, '每相匝比'), 3.99704) },
    { name: '误操作｜一次分接误选偏高', moves: [['tap', 6]], verify: s => near(reading(s, '二次线间'), 198.095238) && near(reading(s, '线电压比'), 2.423077) },
    { name: '故障与恢复｜低供电与名义分接失配', moves: [['primary', 456], ['save', 1], ['tap', 2]], verify: s => near(s.memory.saved, 197.6) && near(reading(s, '二次线间'), 208) && near(reading(s, '线电压比'), 2.192308) },
    { name: '迁移｜一次 492 V 配 +2.5% 分接，记录 208 V 线间值，再读约 120.09 V 相电压', moves: [['primary', 492], ['tap', 5], ['save', 1], ['probe', 1]], verify: s => s.input.primary === 492 && s.input.tap === 5 && s.memory.savedProbe === 0 && s.memory.savedPrimary === 492 && near(s.memory.saved, 208) && near(reading(s, '当前表计'), 120.08886) },
  ],
}
