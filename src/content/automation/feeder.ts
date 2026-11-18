import { button, choice, graph, near, part, quiz, range, strip } from '../../core/types'
import type { Lesson, Values } from '../../core/types'
import { bit, reading } from './shared'

function cable(i: Values) {
  const perKm = 7.41 * (1 + 0.00393 * (i.temp - 20))
  const one = perKm * i.length / 1000
  const joint = i.joint ? 0.2 : 0
  const resistance = 2 * one + joint
  const drop = i.amps * resistance
  return { perKm, one, joint, resistance, drop, end: 230 - drop, watts: i.amps * drop, jointWatts: i.amps ** 2 * joint }
}

export const lineVoltageDrop: Lesson = {
  id: 21, title: '线路压降', prerequisites: [20],
  context: '同一个 230 V 电源，短线终端正常，长线终端却少了好几伏。工单上写的是路线长度，工人量的是回路压降。',
  question: '电流从哪条线返回？线路损耗和电压降会按同一倍数增长吗？',
  task: '在 50 m、10 A 下比较单根导体和完整回路，冻结压降与损耗，再将电流加倍。最后查找集中在接点上的附加损耗。',
  device: {
    maker: 'Nexans · La Triveneta Cavi', model: 'U-1000 R2V 3G2,5 · 084123001', name: '三芯铜电缆', form: 'terminal',
    url: 'https://latrivenetacavi.nexans.com/en/products/residential-and-commercial/residential-commercial-Eca-class/U-1000-R2V38500/product~084123001~.html',
    document: 'U-1000 R2V – 3G2,5 · Electrical characteristics', locator: 'Nexans ref. 084123001，Constructional characteristics 和 Max. DC resistance of the conductor at 20°C，查阅 2026-11-18。',
    features: ['3G2.5，三根 2.5 mm² 导体，含黄绿保护芯', '单根导体 20°C 最大直流电阻 7.41 Ω/km', '电缆额定电压 U₀/U 为 0.6/1 kV'],
  },
  parts: [part('盘边长度标尺', '把单程路线设为 50 m。', 'length', 50), part('出线与回线剖面', '改读一根回线的压降，比较完整回路。', 'probe', 1), part('负载端电表', '记录本工况的整回路压降和线路总损耗。', 'save'), part('接点等效电阻', '在模型去线接点加入 0.20 Ω，观察接点发热功率。', 'joint', 1)],
  controls: [range('length', '单程长度', 20, 10, 100, 10, 'm'), range('amps', '负载电流', 5, 0, 20, 1, 'A'), range('temp', '导体温度', 20, 20, 70, 10, '°C'), choice('joint', '去线接点模型', 0, '理想接点', '额外 0.20 Ω'), choice('probe', '压差表测点', 0, '完整回路压降', '仅一根回线', '负载端线间电压'), button('save', '冻结压降与总损耗')],
  initialMemory: { marked: 0, savedDrop: 0, savedWatts: 0, savedJoint: 0 },
  advance(m, i, _old, action) {
    if (action === 'save') {
      const c = cable(i)
      m.marked = 1; m.savedDrop = c.drop; m.savedWatts = c.watts; m.savedJoint = c.jointWatts
    }
    return m
  },
  sample(i, m) {
    const c = cable(i)
    return {
      meters: [['回路电阻', c.resistance, 'Ω'], ['整回路压降', c.drop, 'V'], ['负载端电压', c.end, 'V'], ['压差表', [c.drop, i.amps * c.one, c.end][i.probe], 'V'], ['总损耗', c.watts, 'W'], ['接点损耗', c.jointWatts, 'W'], ['冻结总损耗', m.savedWatts, 'W']],
      active: [0, ...(i.amps > 0 ? [1, 2, 3, 4] : []), 5, ...(i.joint && i.amps ? [6] : [])],
      note: i.joint ? '附加接点电阻只在去线上。该点损耗为 I²×0.20，回线单根压差不会包含它。' : '单相电流经去、回两芯，保护芯不承载正常负荷。ΔU=I×2Lr，P损=I²×2Lr。',
      plots: [{ title: '保持温度与电流时的负载端电压', x: '单程长度 / m', y: '电压 / V', points: [0, 20, 40, 60, 80, 100].map((l): [number, number] => [l, 230 - i.amps * (2 * l * c.perKm / 1000 + c.joint)]) }],
    }
  },
  diagram: graph(['230 V 电源', '去线电阻', '去线接点', '负载', '回线电阻', '终端电压表', '接点损耗'], [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [2, 5], [3, 5], [2, 6]]),
  prediction: quiz('保持 20°C 和长度不动，电流从 10 A 加到 20 A。压降和损耗怎样变？', ['都乘二', '压降乘四、损耗乘二', '压降乘二、损耗乘四'], 2, '固定电阻时，压降与 I 成正比，发热功率与 I² 成正比。'),
  explanation: quiz('为什么 50 m 单程配线在模型中要用 100 m 导体计算正常负载的回路电阻？', ['去线与回线串入相同电流路径', '三芯直径是长度的两倍', '保护芯同时返回一半负荷电流'], 0, '相线与回线各长 50 m，保护芯在本课健康回路中无负荷电流。'),
  comic: strip([
    '单程五十米、十安培，我按一根线算出 3.705 V，终端却少了 7.41 V。',
    '顺着电流走一圈。它经过负载，还要沿另一根五十米的导体回来。',
    '整回路表跟我的新结果一致。第三根黄绿芯没有分走正常电流。',
    '冻结现在的损耗，再把电流加倍。压降翻番，热功率已经变成四倍。',
    '我往去线接点加了 0.20 Ω，在回线上量仍是原先的压差。',
    '集中电阻的压降和损耗都在那个接点上，比较两个测点就能看见差别。',
    '将来看到线路长度和截面积，我还要注明工作温度、供电制式和测点。',
  ], [0, 1, 2, 2, 3, 1, 0]),
  goals: [
    { text: '设 50 m、10 A、20°C 和理想接点，冻结一笔整回路 7.41 V、74.1 W 的读数。', check: s => s.memory.marked === 1 && near(s.memory.savedDrop, 7.41) && near(s.memory.savedWatts, 74.1) },
    { text: '保持线路不变，把电流改为 20 A，验证压降 14.82 V、损耗 296.4 W。', check: s => near(s.memory.savedWatts, 74.1) && s.input.amps === 20 && near(reading(s, '整回路压降'), 14.82) && near(reading(s, '总损耗'), 296.4) },
  ],
  assumptions: '模型使用单相 230 V、给定电流、功率因数 1。将 7.41 Ω/km 的最大值当作 20°C 计算值，取铜温度系数 0.00393/°C，忽略电抗及集肤效应。温度、异常接点为独立变量，损耗不反算温升。本例用于比较电压与损耗。', review: true,
  practice: [['length', 50], ['amps', 10], ['save', 1], ['amps', 20]],
  trials: [
    { name: '正常｜五十米单程', moves: [['length', 50], ['amps', 10]], verify: s => near(reading(s, '回路电阻'), 0.741) && near(reading(s, '负载端电压'), 222.59) && near(reading(s, '总损耗'), 74.1) },
    { name: '误操作｜单根压差当作整路', moves: [['length', 50], ['amps', 10], ['probe', 1]], verify: s => near(reading(s, '压差表'), 3.705) && near(reading(s, '整回路压降'), 7.41) },
    { name: '故障与恢复｜接点集中损耗', moves: [['length', 50], ['amps', 10], ['joint', 1], ['save', 1], ['joint', 0]], verify: s => near(s.memory.savedDrop, 9.41) && near(s.memory.savedJoint, 20) && near(reading(s, '负载端电压'), 222.59) },
    { name: '迁移｜100 m、5 A、60°C 的健康回路，终端约 221.43 V、线损约 42.87 W', moves: [['length', 100], ['temp', 60], ['probe', 2]], verify: s => s.input.length === 100 && s.input.temp === 60 && s.input.probe === 2 && near(reading(s, '压差表'), 221.425148) && near(reading(s, '总损耗'), 42.87426) },
  ],
}

// The same parent table supplies the displayed topology and every indicator footprint.
const nodes = ['电源', 'F0 干线', '分岔点', 'FA 甲入口', '甲末端', 'FB 乙入口', '乙前段', 'FC 乙中点', '乙末端']
const parent = [-1, 0, 1, 2, 3, 2, 5, 6, 7]
const indicators = [1, 3, 5, 7]
const sections = [2, 4, 6, 8]
const logs = [8, 4, 6, 2]
const names = ['公共干线', '甲支', '乙前段', '乙后段']
function footprint(fault: number): number[] {
  const ancestors = new Set<number>()
  for (let node = fault; node >= 0; node = parent[node]) ancestors.add(node)
  return indicators.map(node => bit(ancestors.has(node)))
}
function evidence(i: Values, m: Values): number[] {
  if (!m.loaded) return [-1, -1, -1, -1]
  const values = footprint(m.faultNode)
  if (i.link && !m.local) values[3] = -1
  return values
}
function candidates(i: Values, m: Values): number[] {
  if (!m.loaded) return []
  const observed = evidence(i, m)
  return sections.filter(node => footprint(node).every((on, j) => observed[j] < 0 || observed[j] === on))
}

export const radialLocation: Lesson = {
  id: 22, title: '放射馈线拓扑定位', prerequisites: [21],
  context: '同一条干线在柜后分成甲、乙支路。调度台收到了几处故障通过标记，有一个通信点偶尔只返回空白。',
  question: '怎样从源侧到末端缩小故障区间？哪一条缺失记录真的会使结论不唯一？',
  task: '读取同一事件的四点记录，按干线、支路与乙中点排列。提交可支持的区间；遇失联时先说明候选数，再查独立的就地记录。',
  device: {
    maker: 'Schneider Electric', model: 'Easergy Flair 22D', name: '故障电流通过指示器', form: 'relay',
    url: 'https://download.se.com/files?p_Doc_Ref=AMTED310010EN&p_File_Name=PremSet_AMTED310010EN_0320.pdf&p_enDocType=Catalog',
    document: 'PremSet Catalog · Fault passage indicators', locator: 'AMTED310010EN，2020-03，第 104–105 页 Detection、Signaling、Indication reset，含 Flair 22D。',
    features: ['识别相间和接地故障通过', '故障确认后前面板红色指示灯显示', '可经接点上传 SCADA，面板也可独立查看'],
  },
  parts: [part('F0 干线指示窗', '调出当前选中事件的四点同期记录。', 'read'), part('乙中点 FC 远传接点', '令 FC 的远传值缺失，比较还能排除哪些区间。', 'link', 1), part('FC 就地面板', '读出同一历史事件留下的就地标记，补全远传证据。', 'local'), part('区段研判牌', '提交当前对区段或信息不足的判断。', 'submit')],
  controls: [choice('log', '历史记录', 0, '甲班记录', '乙班记录', '丙班记录', '丁班记录'), button('read', '载入所选事件'), choice('link', 'FC 记录通道', 0, '远传完整', 'FC 远传缺失'), button('local', '读回 FC 同期就地记录'), choice('answer', '我的故障区段判断', 0, '尚未判断', ...names, '信息不足，暂不能唯一定位'), button('submit', '核验区段判断')],
  initialMemory: { loaded: 0, faultNode: -1, local: 0, verdict: 0, report: 0, acceptedAmbiguous: 0, checks: 0 },
  advance(m, i, _old, action) {
    if (action === 'read') {
      m.loaded = 1; m.faultNode = logs[i.log]; m.local = m.verdict = m.report = m.acceptedAmbiguous = 0
    }
    if (action === 'link' || action === 'answer') m.verdict = 0
    if (action === 'local' && m.loaded) { m.local = 1; m.verdict = 0 }
    if (action === 'submit' && m.loaded && i.answer) {
      const possible = candidates(i, m)
      const right = possible.length === 1 ? sections[i.answer - 1] === possible[0] : i.answer === 5
      m.verdict = right ? 1 : -1; m.report = i.answer; m.checks++
      if (right && possible.length > 1) m.acceptedAmbiguous = 1
    }
    return m
  },
  sample(i, m) {
    const values = evidence(i, m), possible = candidates(i, m)
    const illuminated = indicators.filter((_node, j) => values[j] === 1)
    const evidenceNote = values.map((v, j) => ['F0', 'FA', 'FB', 'FC'][j] + (v < 0 ? '缺失' : v ? '通过' : '未通过')).join('、')
    return {
      meters: [['F0 干线', values[0], ''], ['FA 甲入口', values[1], ''], ['FB 乙入口', values[2], ''], ['FC 乙中点', values[3], ''], ['候选区段', possible.length, '个'], ['研判结果', m.verdict, '']],
      active: illuminated,
      note: !m.loaded ? '载入一份历史记录开始定位。−1 为未取得数据，0 为明确未通过，1 为锁存通过。' :
        evidenceNote + '。' + (m.verdict === 1 ? '提交的判断与现有证据吻合。' : m.verdict === -1 ? '沿分岔点分别追到甲、乙末端，重新排除与已知标记冲突的区段。' : '只把已读到的通过或未通过值用于排除候选。'),
    }
  },
  diagram: graph(nodes, parent.flatMap((up, node): [number, number][] => up < 0 ? [] : [[up, node]])),
  prediction: quiz('F0、FB 均通过，FA 未通过，FC 的远传丢失。此时还剩哪些区段？', ['公共干线一个', '只有乙末端', '乙前段和乙后段两个'], 2, '电流经过乙入口就排除了甲支及公共干线，是否越过 FC 仍未知。'),
  explanation: quiz('同一事件的 FC 就地值确为 0，F0 和 FB 都为 1。结论应如何收紧？', ['定位到 FB 后、FC 前的乙前段', '选择所有灯灭的支路', '定位到 FC 后方'], 0, '单电源放射网中，通往故障的唯一路径经过 FB 却没有经过 FC。'),
  comic: strip([
    '干线 F0 亮了，我就在干线上画一个故障点？',
    '先沿线走到分岔。下游任何一条支路故障，故障电流都要经过 F0。',
    'FA 没亮、FB 亮，能把甲支排除了。乙支上还有一个中点 FC。',
    'FC 传回空白。把空白当成“没通过”，会把乙后段错误地排除。',
    '我提交两个可能区段，再调出 FC 同期就地记录。它确实亮过。',
    '这次可以收紧到 FC 后面。指示器记录了电流走过它，故障可以在它下游。',
    '换另一条分支多的馈线，我会先画出树，并核对每个标记的事件时间。',
  ], [0, 0, 3, 1, 2, 2, 3]),
  goals: [
    { text: '选“甲班记录”，令 FC 远传缺失并载入事件，选“信息不足”提交，保留两个候选。', check: s => s.memory.acceptedAmbiguous === 1 && s.memory.faultNode === 8 && reading(s, '候选区段') === 2 },
    { text: '读回 FC 同期就地记录，见 F0/FB/FC 均通过、FA 未通过；选“乙后段”提交，使候选收敛到一个。', check: s => s.memory.acceptedAmbiguous === 1 && s.memory.local === 1 && s.memory.verdict === 1 && s.memory.report === 4 && reading(s, '候选区段') === 1 },
  ],
  assumptions: '四台同型号指示器分布在单电源树网上，回放虚构的已确认相间故障事件。无分布式反送或多重故障。健康指示器在受流路径上锁存通过。分析限于同期记录，省略故障电流幅值与确认延时。', review: true,
  practice: [['link', 1], ['read', 1], ['answer', 5], ['submit', 1], ['local', 1], ['answer', 4], ['submit', 1]],
  trials: [
    { name: '正常｜甲班完整记录', moves: [['read', 1], ['answer', 4], ['submit', 1]], verify: s => s.memory.verdict === 1 && reading(s, 'FA 甲入口') === 0 && reading(s, 'FB 乙入口') === 1 && reading(s, 'FC 乙中点') === 1 },
    { name: '误操作｜把失联误认作未通过', moves: [['link', 1], ['read', 1], ['answer', 3], ['submit', 1]], verify: s => s.memory.verdict === -1 && reading(s, '候选区段') === 2 && reading(s, 'FC 乙中点') === -1 },
    { name: '故障与恢复｜就地记录补齐远传', moves: [['link', 1], ['read', 1], ['answer', 5], ['submit', 1], ['local', 1], ['answer', 4], ['submit', 1]], verify: s => s.memory.checks === 2 && s.memory.acceptedAmbiguous === 1 && s.memory.verdict === 1 && reading(s, '候选区段') === 1 },
    { name: '迁移｜载入丙班记录，依据 F0、FB 通过而 FC 未通过，提交唯一的乙前段', moves: [['log', 2], ['read', 1], ['answer', 3], ['submit', 1]], verify: s => s.memory.faultNode === 6 && s.memory.report === 3 && s.memory.verdict === 1 && reading(s, 'FC 乙中点') === 0 && reading(s, '候选区段') === 1 },
  ],
}
