import { button, choice, graph, part, quiz, strip } from '../../core/types'
import type { Lesson, Meter, Values } from '../../core/types'
import { active, curve, reads } from './common'

export const workDecision: Lesson = {
  id: 1, title: '开工判断', prerequisites: [],
  context: '交接单写着“主源已隔离”，柜内照明也灭了。图纸角落还有一路备用馈电，桌面工单等你判断。',
  question: '哪些证据能让这张虚拟工单进入复核？',
  task: '核对两路馈电、残压和表具状态，在证据不足时退回工单，随后补齐记录。',
  device: {
    maker: 'Fluke', model: 'PRV240', name: '表具验证电源', form: 'meter',
    url: 'https://www.fluke.com/en-us/product/electrical-testing/basic-testers/prv240-proving-unit',
    document: 'PRV240 Proving Unit', locator: 'Product overview、Product highlights、Specifications，查阅 2026-11-18',
    features: ['电池供电，提供已知交流或直流参考', '高阻负载下标称 240 V', '凹入式接触孔配合单个工作指示灯'],
  },
  controls: [
    choice('main', '主馈电记录', 0, '供电', '已隔离'),
    choice('reserve', '备用馈电记录', 0, '供电', '已隔离'),
    choice('probe', '表具情景', 0, '正常', '测量通道失效'),
    button('verifyLock', '核对两路隔离锁签记录'),
    button('reference', '比对虚拟参考源'), button('readBus', '记录虚拟母线示值'),
    button('defer', '退回工单'), button('submit', '提交桌面复核'),
  ],
  parts: [
    part('参考源接触孔', '点击执行一次比对。正常高阻虚拟表在这里读到 240 V。', 'reference'),
    part('主馈电状态牌', '主源隔离后，备用支路仍可能维持母线电压。', 'main', 1),
    part('备用馈电状态牌', '第二路馈电有独立记录。', 'reserve', 1),
    part('母线测量窗', '记录当时的示值。示值与测量通道的可信程度分别记录。', 'readBus'),
    part('双路锁签记录袋', '核对两路已隔离设备的模拟锁签记录。任一馈电状态改变，记录作废。', 'verifyLock'),
  ],
  initialMemory: { bus: 24, stage: 0, lock: 0, reading: 0, sampled: 0, decision: 0, backfeed: 0, referenceV: 0, refTaken: 0 },
  advance(m, i, old, action, dt) {
    const powered = !i.main || !i.reserve
    m.bus = powered ? 24 : m.bus * Math.exp(-dt)
    if (['main', 'reserve', 'probe'].includes(action) && i[action] !== old[action]) {
      m.stage = 0
      m.sampled = 0
      m.decision = 0
      m.referenceV = 0
      m.refTaken = 0
      m.backfeed = 0
      if (action !== 'probe') m.lock = 0
    }
    if (action === 'verifyLock') {
      m.lock = Number(!!i.main && !!i.reserve)
      m.decision = 0
    }
    if (action === 'reference') {
      m.referenceV = i.probe ? 0 : 240
      m.refTaken = 1
      m.stage = i.probe ? 0 : m.stage === 2 ? 3 : 1
      m.decision = 0
    }
    if (action === 'readBus') {
      m.reading = i.probe ? 0 : Math.round(m.bus * 10) / 10
      m.sampled = 1
      m.backfeed = Number(!!i.main && !i.reserve && m.reading === 24)
      m.stage = m.stage >= 1 && !i.probe && !powered && m.reading === 0 ? 2 : Math.min(m.stage, 1)
      m.decision = 0
    }
    if (action === 'defer') m.decision = -1
    if (action === 'submit') m.decision = m.stage === 3 && m.lock && !powered && !i.probe ? 1 : -2
    return m
  },
  sample(i, m) {
    const next = ['尚缺有效参考比对', '已取得前比对，等候有效母线记录', '母线记录已取得，等候后比对', '前比对、母线记录、后比对均已留存'][m.stage]
    let note = m.decision === 1 ? '桌面证据已进入复核队列。' : m.decision === -1 ? '工单已退回。' : m.decision === -2 ? '证据不足，提交被拒。' : ''
    note += next + '。' + (m.sampled ? '上次母线示值 ' + m.reading + ' V。' : '本次状态下尚未记录母线。')
    const meters: Meter[] = [['母线模型电压', m.bus, 'V'], ['已隔离馈电', i.main + i.reserve, '路'], ['表具证据阶段', m.stage, '/3'], ['双路锁签已核', m.lock, '']]
    if (m.refTaken) meters.push(['参考源比对示值', m.referenceV, 'V'])
    if (m.sampled) meters.push(['母线记录', m.reading, 'V'])
    if (m.stage === 3 && !m.lock) note += '还缺本次双路隔离的锁签记录。'
    return { meters, active: active(!i.main, !i.reserve, m.bus >= 0.05, m.referenceV > 0, m.sampled, m.stage === 3, m.decision === 1, m.lock), note,
      plots: [curve('维持现有馈电状态后的母线电压', '从现在起 / s', '模型电压 / V', 7, t => !i.main || !i.reserve ? 24 : m.bus * Math.exp(-t))] }
  },
  diagram: graph(['主馈电', '备用馈电', '含储能母线', '参考比对', '母线记录', '表具证据核对', '复核队列', '隔离锁签记录'], [[0, 2], [1, 2], [0, 7], [1, 7], [2, 4], [3, 5], [4, 5], [5, 6], [7, 6]]),
  prediction: quiz('主源刚隔离，备用记录仍为供电。健康虚拟表会看到什么？', ['立刻归零', '母线仍为 24 V', '母线变成参考源的 240 V'], 1, '两路馈电汇在同一母线上，任何一路都可维持 24 V。'),
  explanation: quiz('失效的表具在母线上也给出零。哪项证据能揭示它？', ['照明已经熄灭', '隔离记录的张数', '在已知参考源上也读不到预期值'], 2, '参考源的已知输出让仪表失效与被测对象无电压这两个原因可区分。'),
  comic: strip([
    '灯灭了，交接单也勾了主源。我差点就把工单递过去。',
    '看旁边那张小牌，备用馈电的记录和主源各占一格。',
    '我只隔离主源，再记录母线，竟还读到 24 V。我先退回这张单。',
    '现在两路都隔离了，核对各自的锁签记录。看母线，储能还在衰减。',
    '我拿失效的虚拟表再看，母线和已知参考都报零。这个零没法作证。',
    '换回正常通道，把参考比对、母线记录、后比对连成一段。期间改了馈电记录，就要重新取证。',
    '下次看到另一张双电源工单，我会分别找馈电记录、剩余能量和表具证据。',
  ], [1, 2, 3, 3, 0, 0, 2]),
  goals: [
    { text: '只将主馈电设为已隔离，记录备用仍供电时的 24 V，然后点“退回工单”。', check: s => s.memory.backfeed === 1 && s.memory.decision === -1 },
    { text: '再隔离备用，核对两路锁签，推进 7 s。用正常表依次点参考比对、母线记录、参考比对，提交桌面复核。', check: s => s.memory.decision === 1 && s.memory.stage === 3 && !!s.memory.lock },
  ],
  assumptions: '桌面工单仅评价本题证据。两路理想 24 V 源、断源后 1 s 衰减常数、0.1 V 显示分辨率与故障表均为教学设定。现场隔离边界、储能处置与工作许可须由合格人员按实际制度确定。',
  review: true,
  trials: [
    { name: '正常', moves: [['main', 1], ['readBus', 1], ['defer', 1], ['reserve', 1], ['verifyLock', 1], 7, ['reference', 1], ['readBus', 1], ['reference', 1], ['submit', 1]], verify: s => s.memory.decision === 1 && reads(s, '双路锁签已核', 1) && reads(s, '母线模型电压', 0.021885, 0.00001) && reads(s, '母线记录', 0) },
    { name: '误操作', moves: [['main', 1], ['reference', 1], ['readBus', 1], ['submit', 1]], verify: s => s.memory.decision === -2 && reads(s, '母线记录', 24) && reads(s, '表具证据阶段', 1) },
    { name: '故障与恢复', moves: [['main', 1], ['reserve', 1], ['verifyLock', 1], 7, ['probe', 1], ['reference', 1], ['readBus', 1], ['submit', 1], ['probe', 0], ['reference', 1], ['readBus', 1], ['reference', 1], ['submit', 1]], verify: s => reads(s, '参考源比对示值', 240) && reads(s, '表具证据阶段', 3) && s.memory.decision === 1 },
    { name: '迁移｜两路隔离仅 1 s，记录约 8.8 V 并验证工单被拒', moves: [['reserve', 1], ['main', 1], ['verifyLock', 1], 1, ['reference', 1], ['readBus', 1], ['submit', 1]], verify: s => reads(s, '母线记录', 8.8) && s.memory.decision === -2 },
  ],
}

const testPoints = ['A · 插头', 'B · 熔芯入口', 'C · 熔芯出口', 'D · 回线末端']
function meterPath(i: Values) {
  const ends = [i.red, i.black].sort((a, b) => a - b)
  const segments = [0.6, i.fault === 0 ? Infinity : i.fault === 3 ? 330 : 0.4, i.fault === 1 ? Infinity : 0.8]
  return segments.slice(ends[0], ends[1]).reduce((sum, r) => sum + r, 0.2)
}

export const multimeter: Lesson = {
  id: 4, title: '万用表断点', prerequisites: [1, 3],
  context: '一段已脱离所有外部电源的三段线束送到检验台。熔芯两端和回线末端各留有一个虚拟测点。',
  question: '整段没有蜂鸣，究竟是断路、较大阻值，还是测量方式不对？',
  task: '独立选择两支表笔的位置和表挡，用相邻测点缩小故障范围，再辨认一个仍然导通的高阻段。',
  device: {
    maker: 'Fluke', model: '115', name: '真有效值数字万用表', form: 'meter',
    url: 'https://www.fluke.com/en-us/product/electrical-testing/digital-multimeters/fluke-115',
    document: 'Fluke 115 True-RMS Digital Multimeter', locator: 'Specifications → DC volts、Continuity、Ohms，查阅 2026-11-18',
    features: ['旋钮可选直流电压、通断和电阻', '通断蜂鸣保证区为低于 20 Ω 接通、高于 250 Ω 关闭', '600 Ω 电阻量程分辨率为 0.1 Ω'],
  },
  controls: [
    choice('dial', '功能旋钮', 0, '直流电压', '通断', '电阻'),
    choice('red', '红表笔', 3, ...testPoints), choice('black', '黑表笔', 0, ...testPoints),
    choice('fault', '线束样本', 0, '熔芯断开', '回线断开', '三段完好', '熔芯位置换成 330 Ω 标件'),
  ],
  parts: [
    part('功能旋钮', '电压挡观察电势差，通断与电阻挡使用表内测量源。', 'dial'),
    part('红色测量笔', '选择红笔所接的命名测点。', 'red'),
    part('COM 黑表笔', '移动参考端可把跨越范围缩到一段。', 'black'),
    part('线束样本槽', '比较断芯、回线损伤和已知电阻标件。', 'fault'),
  ],
  sample(i) {
    const r = meterPath(i), measuring = i.dial !== 0
    const ol = measuring && !Number.isFinite(r), beep = i.dial === 1 && r < 20
    const meters: Meter[] = [['蜂鸣', Number(beep), ''], ['开路 OL', Number(ol), '']]
    let note = '直流挡显示 0 V。这段已隔离线束的开路与完好样本都可产生此示值。'
    if (!measuring) meters.push(['表显直流电压', 0, 'V'])
    else if (ol) note = '屏幕显示 OL。两笔之间缺少连续电阻通路，可向内移动一支笔缩小范围。'
    else {
      const value = i.dial === 1 ? Math.round(r) : Math.round(r * 10) / 10
      meters.push(['表显电阻', value, 'Ω'])
      note = i.dial === 1 ? (beep ? '蜂鸣，所跨路径落在低阻区。' : '无蜂鸣，但屏幕给出有限电阻。') : '读数含两根虚拟表笔共 0.2 Ω 的电阻。'
    }
    const first = Math.min(i.red, i.black), last = Math.max(i.red, i.black)
    return { meters, active: active(measuring, first < 1 && last >= 1, first < 2 && last >= 2, first < 3 && last >= 3, true, beep, ol), note }
  },
  diagram: graph(['表内测量源', 'A–B 引线', 'B–C 熔芯位', 'C–D 回线', '显示器', '蜂鸣器', 'OL 指示'], [[0, 1], [0, 2], [0, 3], [1, 2], [2, 3], [1, 4], [2, 4], [3, 4], [4, 5], [4, 6]]),
  prediction: quiz('把两支笔放在已隔离线束的断芯两侧，保留直流电压挡，示值是多少？', ['约 24 V', '一直蜂鸣', '0 V'], 2, '该线束没有外部电源。电压挡读零无法判断两点之间是否导通。'),
  explanation: quiz('330 Ω 标件在通断挡没有蜂鸣，换到电阻挡约为 330.2 Ω。原因是什么？', ['表笔方向反了', '阻值超过蜂鸣断开区，通路仍存在', '标件完全断开'], 1, '无蜂鸣同时兼容高阻和开路。有限电阻与 OL 才能区分这两种情况。'),
  comic: strip([
    '整段测出 0 V，我原以为线就通了。',
    '样本没有外部电源。先问清仪表此刻在测电势差，还是在试一条电阻通路。',
    '我转到通断挡，跨 A、D 时屏幕变成 OL。把红笔退到 B，A、B 之间却响了。',
    '把另一支笔移到 C，只跨熔芯位置，再看一次。',
    'B、C 之间 OL，C、D 可以响。断点就夹在中间这一小段。',
    '换成 330 Ω 标件，没听到声音。转到电阻挡，数值却稳定停在 330.2 Ω。',
    '下次验长电缆，我会同时记录挡位、两端编号和示值，沉默本身说明不了断在哪里。',
  ], [0, 0, 1, 2, 3, 0, 2]),
  goals: [
    { text: '保留熔芯断开样本，选通断挡，分别把两笔放在 B 与 C，看到 OL。', check: s => s.input.fault === 0 && s.input.dial === 1 && Math.min(s.input.red, s.input.black) === 1 && Math.max(s.input.red, s.input.black) === 2 && reads(s, '开路 OL', 1) },
    { text: '保持 B、C 两点，换 330 Ω 标件和电阻挡，读出含表笔的 330.2 Ω。', check: s => s.input.dial === 2 && reads(s, '表显电阻', 330.2) },
  ],
  assumptions: '所有测点均属独立无外接电源的虚拟线束。三段完好电阻 0.6、0.4、0.8 Ω，两根表笔合计 0.2 Ω。样本避开厂家未给定确定蜂鸣状态的 20～250 Ω 区，忽略精度误差与显示延迟。',
  review: true,
  trials: [
    { name: '正常', moves: [['dial', 1], ['red', 1], ['black', 2], ['fault', 3], ['dial', 2]], verify: s => reads(s, '蜂鸣', 0) && reads(s, '表显电阻', 330.2) && reads(s, '开路 OL', 0) },
    { name: '误操作', moves: [['red', 1], ['black', 2]], verify: s => reads(s, '表显直流电压', 0) && reads(s, '蜂鸣', 0) && s.input.fault === 0 },
    { name: '故障与恢复', moves: [['dial', 1], ['black', 1], ['red', 2], ['fault', 2], ['dial', 2]], verify: s => reads(s, '表显电阻', 0.6) && reads(s, '开路 OL', 0) },
    { name: '迁移｜回线断开时只跨 A、C，测得完好上游路径 1.2 Ω', moves: [['fault', 1], ['dial', 2], ['red', 2]], verify: s => s.input.fault === 1 && s.input.dial === 2 && Math.min(s.input.red, s.input.black) === 0 && Math.max(s.input.red, s.input.black) === 2 && reads(s, '表显电阻', 1.2) },
  ],
}
