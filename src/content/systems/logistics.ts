import { button, choice, graph, near, part, quiz, range, strip, type Lesson, type Values } from '../../core/types'
import { devices } from './devices'
import { active, curve, epsilon, history, logSample, reads } from './observation'

type Room = 'a' | 'b'

function advanceRoom(m: Values, u: Values, room: Room, dt: number): void {
  const clock = 'clock' + room
  const temperature = 'air' + room
  // Remaining cycle minutes count down from 4: three for defrost, one for drip.
  const defrost = Math.min(dt, Math.max(0, m[clock] - 1))
  const drip = Math.min(dt - defrost, Math.min(1, m[clock]))
  const normal = Math.max(0, dt - defrost - drip)
  const warm = m[temperature] + 0.8 * defrost + 0.2 * drip
  m.peak = Math.max(m.peak, warm)
  m.defrostWh += 3000 * defrost / 60
  if (u.coast) {
    m[temperature] = warm + 0.2 * normal
  } else {
    // Resolve the exact part of this interval spent reaching the target.
    // Below it: passive heat gain. Above it: full cooling. At it: mean holding duty.
    const cooling = Math.min(normal, Math.max(0, warm - u.setpoint) / 0.4)
    const warming = Math.min(normal, Math.max(0, u.setpoint - warm) / 0.2)
    const holding = Math.max(0, normal - cooling - warming)
    m[temperature] = warm - 0.4 * cooling + 0.2 * warming
    m.compressorWh += (900 * cooling + 300 * holding) / 60
  }
  m[clock] = Math.max(0, m[clock] - dt)
  if (m[clock] < epsilon) m[clock] = 0
}

function coldPower(m: Values, u: Values, room: Room): number {
  const clock = m['clock' + room]
  if (clock > 1 + epsilon) return 3
  if (clock > 0 || u.coast) return 0
  const difference = m['air' + room] - u.setpoint
  return difference > epsilon ? 0.9 : difference < -epsilon ? 0 : 0.3
}

function canShip(m: Values, u: Values, room: Room): boolean {
  return m['clock' + room] === 0 && m['air' + room] <= 4 + epsilon
    && m['stock' + room] > 0 && (room === 'b' || u.link === 0)
}

function chooseRoom(m: Values, u: Values): Room | undefined {
  const order: Room[] = u.route === 1 ? ['a'] : u.route === 2 ? ['b'] : m.aira <= m.airb + epsilon ? ['a', 'b'] : ['b', 'a']
  return order.find(room => canShip(m, u, room))
}

function roomPhase(clock: number): string {
  return clock > 1 + epsilon ? '除霜' : clock > 0 ? '滴水' : '正常温控'
}

export const coldChain: Lesson = {
  id: 46, title: '冷链仓调度', prerequisites: [11, 38], device: devices[46], review: true,
  context: '两个库区有可替代的同批货。调度员既要错开除霜与提货，也要为高峰时段准备一张满足库温上界的用电计划。',
  question: '前几个模型分钟能移走多少制冷用电，又能留下多少温度余量？',
  task: '比较除霜与压缩机电量，按库温和回执派单，再用短时停冷与恢复温控制定一个六分钟计划。',
  controls: [
    range('setpoint', '两区温控排程目标', 2, 1.5, 4, 0.5, '°C'),
    choice('coast', '本时段制冷排程', 0, '按目标温控', '短时停冷移峰'),
    button('defA', '启动 A 区教学除霜周期'), button('defB', '启动 B 区教学除霜周期'),
    button('order', '添加一笔待发订单'),
    choice('route', '订单选区', 0, '合格区中优先较冷者', '指定 A 区', '指定 B 区'),
    choice('link', 'A 区温度数据', 0, '有效', '数据缺失'),
    button('dispatch', '评估并派出一单'),
  ],
  parts: [
    part('A 区蒸发器', '从 A 区开始一个包含加热和滴水的除霜周期。', 'defA', 1),
    part('B 区蒸发器', '给独立的 B 区安排除霜，比较同时和错开时的履约能力。', 'defB', 1),
    part('出库作业台', '向队列提交一个可由任一区域履约的订单。', 'order', 1),
    part('库区调度终端', '按当前温度、阶段和库存选择库区并派一单。', 'dispatch', 1),
    part('A 区数据回执', '丢失读数时，该区退出可派集合。', 'link', 1),
    part('制冷排程时钟', '进入停冷时段，比较用电累计值和逐渐升高的库温。', 'coast', 1),
  ],
  initialMemory: { aira: 2, airb: 3, clocka: 0, clockb: 0, stocka: 3, stockb: 3, queue: 0, senta: 0, sentb: 0, blocked: 0, fallback: 0, last: 0, peak: 3, compressorWh: 0, defrostWh: 0, firstFourOff: 0 },
  advance(m, u, _before, action, dt, time) {
    if (action === 'defA' && m.clocka === 0) m.clocka = 4
    if (action === 'defB' && m.clockb === 0) m.clockb = 4
    if (action === 'order') m.queue++
    if (u.coast && dt > 0) m.firstFourOff += Math.max(0, Math.min(time, 4) - Math.min(time - dt, 4))
    advanceRoom(m, u, 'a', dt)
    advanceRoom(m, u, 'b', dt)
    if (action === 'dispatch' && m.queue > 0) {
      const room = chooseRoom(m, u)
      if (room) {
        m.queue--
        m['stock' + room]--
        m['sent' + room]++
        m['air' + room] += 0.4
        if (room === 'b' && m.clocka > 0) m.fallback++
        m.last = room === 'a' ? 1 : 2
      } else { m.blocked++; m.last = -1 }
    }
    m.peak = Math.max(m.peak, m.aira, m.airb)
    logSample(m, 'warmer', time, Math.max(m.aira, m.airb))
    logSample(m, 'energy', time, m.compressorWh + m.defrostWh)
    return m
  },
  sample(u, m) {
    const powerA = coldPower(m, u, 'a')
    const powerB = coldPower(m, u, 'b')
    const compressing = (m.clocka === 0 && powerA > 0) || (m.clockb === 0 && powerB > 0)
    return {
      meters: [['A 区模型气温', m.aira, '°C'], ['B 区模型气温', m.airb, '°C'], ['两区全程最高温', m.peak, '°C'], ['两区瞬时总功率', powerA + powerB, 'kW'], ['压缩机电量', m.compressorWh, 'Wh'], ['除霜电量', m.defrostWh, 'Wh'], ['合计用电', m.compressorWh + m.defrostWh, 'Wh'], ['A 区周期剩余', m.clocka, 'min'], ['B 区周期剩余', m.clockb, 'min'], ['待派单', m.queue, '笔'], ['A 区已发', m.senta, '笔'], ['B 区已发', m.sentb, '笔']],
      active: active(true, m.clocka > 1 + epsilon || m.clockb > 1 + epsilon, compressing, true, canShip(m, u, 'a') || canShip(m, u, 'b'), m.queue > 0, m.last > 0, m.compressorWh + m.defrostWh > 0),
      note: 'A 区' + roomPhase(m.clocka) + '，B 区' + roomPhase(m.clockb) + '。余货分别 ' + m.stocka + '、' + m.stockb + ' 箱。' + (u.link ? 'A 区数据缺失，调度端不可采用其模型真值。' : u.coast ? '移峰期间继续吸热，留意 4 °C 课堂上界与全程最高温。' : '根据当前阶段与气温派单，电量分别积分。'),
      plots: [history(m, 'warmer', '两区中较暖者与派单上界 4 °C', '模型时间 / min', '空气温度 / °C', 3), history(m, 'energy', '两区累计电量', '模型时间 / min', '压缩机与除霜合计 / Wh', 0)],
    }
  },
  diagram: graph(['时段排程', '除霜加热', '压缩机制冷', '库温与阶段', '可用库存筛选', '订单队列', '派单与开门', '用电累计'], [[0, 1], [0, 2], [1, 3], [2, 3], [3, 2], [3, 4], [5, 6], [4, 6], [6, 3], [1, 7], [2, 7]]),
  prediction: quiz('B 区起始 3 °C，房门未开，无除霜。停冷 6 个模型分钟后可以按 4 °C 上界从 B 派货吗？', ['可以，因为没有除霜', '不能，气温会升到 4.2 °C', '可以，因为总电量为零'], 1, '停冷时每分钟升 0.2 °C。省下的电量不能替代气温证据。'),
  explanation: quiz('A 区除霜 3 min 时，压缩机未启动却用了 150 Wh。哪种解释符合电表？', ['压缩机停转后仍以 3 kW 运行', '这是取货导致的货芯温升', '3 kW 电加热器运行了 3/60 小时'], 2, '除霜与制冷是独立用电项。比较排程应看两项的积分以及全程温度峰值。'),
  comic: strip([
    'A 刚开始除霜，压缩机没开，为什么总电表还在走？', '看看分项。3 kW 加热三分钟用 150 Wh，另一间的压缩机也有独立的账。',
    '第一单从 B 发，A 还在滴水。现在 A 的温度已经到 4.6 °C。', '除霜结束后要等空气降回来。温度、设备阶段和回执都合格，A 才能接单。',
    '下一班要避开头四分钟的用电高峰。我干脆一直停冷？', 'B 从 3 °C 起步，停六分钟就到 4.2 °C。第四分钟恢复温控，比较温度峰值和电量。',
    '我把恢复目标改成 3.5 °C。订单完成、温度峰值和电量三项都有记录，这样才能比较两种排程。',
  ], [0, 1, 2, 4, 5, 5, 3]),
  goals: [
    { text: '让 A 区开始除霜，添加一单并使用默认选区派单，使 B 区先发一箱。', check: s => s.memory.fallback > 0 && s.memory.sentb > 0 },
    { text: '保留默认 2 °C 温控，推进 7 s。核出除霜用电 150 Wh，并看到 A 区回落至 3.5 °C 以下。', check: s => s.memory.fallback > 0 && near(s.memory.defrostWh, 150) && s.memory.clocka === 0 && s.memory.aira < 3.5 && s.memory.compressorWh > 0 },
    { text: '把排程目标调到 3.5 °C，指定 A 区，添加并派一单。推进 2 s，观察 A 稳定在新目标且队列清空。', check: s => s.input.setpoint === 3.5 && s.memory.senta > 0 && s.memory.sentb > 0 && near(s.memory.aira, 3.5) && s.memory.queue === 0 },
  ],
  practice: [['defA', 1], ['order', 1], ['dispatch', 1], 7, ['setpoint', 3.5], ['route', 1], ['order', 1], ['dispatch', 1], 2],
  assumptions: '每仿真秒为 1 min。各区等效热容量 0.05 kWh/K、漏热 0.6 kW。压缩机满载 0.9 kW、COP=2，维持目标用平均 0.3 kW。除霜加热 3 kW × 3 min，60% 进入等效热容，其后滴水 1 min。取货造成空气升 0.4 °C。电量按各阶段功率与实际持续时间积分，忽略辅助用电。两台 AK-CC55 各管一组蒸发器，调度与上述数值是教学模型。4 °C 是本题的空气上界，商品放行另需货芯温度和相应规范。',
  trials: [
    { name: '正常 · 默认 2 °C 持温，先发一单再统计六分钟能耗', moves: [['order', 1], ['dispatch', 1], 6], verify: s => reads(s, { 'A 区已发': 1, 'A 区模型气温': 2, 'B 区模型气温': 2, 两区全程最高温: 3, 合计用电: 95, 除霜电量: 0 }) },
    { name: '误操作 · 一直停冷虽零用电，指定 B 区已经超温', moves: [['coast', 1], ['route', 2], 6, ['order', 1], ['dispatch', 1]], verify: s => s.memory.blocked === 1 && reads(s, { 待派单: 1, 两区全程最高温: 4.2, 'B 区模型气温': 4.2, 合计用电: 0 }) },
    { name: '故障与恢复 · A 区除霜后降温，等待缺失回执恢复派单', moves: [['route', 1], ['link', 1], ['defA', 1], ['order', 1], 6, ['dispatch', 1], ['link', 0], ['dispatch', 1]], verify: s => s.memory.blocked === 1 && reads(s, { 'A 区已发': 1, 待派单: 0, 两区全程最高温: 4.6, 压缩机电量: 85, 除霜电量: 150, 合计用电: 235 }) },
    { name: '迁移 · 先发一箱，前 4 min 停冷、后 2 min 按 3.5 °C 恢复，使最高温 ≤4 °C、总电量 ≤20 Wh', moves: [['order', 1], ['dispatch', 1], ['setpoint', 3.5], ['coast', 1], 4, ['coast', 0], 2], verify: s => near(s.time, 6) && near(s.memory.firstFourOff, 4) && s.input.coast === 0 && s.input.setpoint === 3.5 && s.memory.peak <= 4 + epsilon && s.memory.compressorWh + s.memory.defrostWh <= 20 + epsilon && s.memory.senta + s.memory.sentb === 1 && s.memory.queue === 0 && reads(s, { 'A 区模型气温': 3.5, 'B 区模型气温': 3.5 }) },
  ],
}

export const stacker: Lesson = {
  id: 47, title: '物流堆垛联调诊断', prerequisites: [17, 18, 43], device: devices[47], review: true,
  context: '堆垛机已经走到货位，但仓储系统迟迟不把任务记成完成。一条过期回执和一条冻结测距记录会造成不同的证据组合。',
  question: '位置到达、当前有效测距、同单号的接收回执，哪一项缺失都能解释“到了却未交接”吗？',
  task: '给两个货位生成独立任务，核对测距与流水号。找出旧回执被拒原因，再用当前回执完成交接。',
  controls: [
    choice('target', '下一张任务单的货位', 0, 'A 位 · 6 m', 'B 位 · 10 m'),
    button('issue', '生成一张虚拟任务单'),
    choice('link', '测距数据流', 0, '状态有效', '数据冻结'),
    choice('reply', '回执所带流水号', 0, '当前任务', '上一任务'),
    button('receive', '重放一次工位回执'),
  ],
  parts: [
    part('货架目标格', '为下一单选择巷道深处的 B 位。已发任务保留原目标。', 'target', 1),
    part('激光测距与反射目标', '模拟数据冻结，比较上次读数、龄期和任务状态。', 'link', 1),
    part('行走轴任务窗', '给所选货位生成新流水号。', 'issue', 1),
    part('交接回执窗', '让工位回复所选流水号，观察任务能否完成。', 'receive', 1),
  ],
  initialMemory: { position: 2, read: 2, age: 0, oldest: 0, goal: 2, seq: 0, busy: 0, done: 0, rejected: 0, packet: 0, reason: 0, firstDelivery: 0, oldReplyFor: 0 },
  advance(m, u, _before, action, dt) {
    if (action === 'issue' && !m.busy) {
      m.seq++
      m.goal = u.target ? 10 : 6
      m.busy = 1
      m.reason = 0
    }
    if (u.link) {
      m.age += dt
      m.oldest = Math.max(m.oldest, m.age)
    } else {
      const error = m.goal - m.position
      if (m.busy) m.position += Math.sign(error) * Math.min(Math.abs(error), 2 * dt)
      m.read = m.position
      m.age = 0
    }
    if (action === 'receive' && m.busy) {
      m.packet = m.seq - u.reply
      if (u.link) m.reason = 1
      else if (Math.abs(m.read - m.goal) > 0.02 + epsilon) m.reason = 2
      else if (m.packet !== m.seq) { m.reason = 3; m.oldReplyFor = m.seq }
      else {
        if (m.done === 0) m.firstDelivery = m.goal
        m.reason = 4
        m.busy = 0
        m.done++
      }
      if (m.reason !== 4) m.rejected++
    }
    return m
  },
  sample(u, m) {
    const aligned = !u.link && Math.abs(m.read - m.goal) <= 0.02 + epsilon
    const notes = ['可回放工位回执。回执的流水号必须与当前单号相同。', '这次回执未获受理，测距数据无效。', '这次回执发生在位置进入目标窗之前。', '位置符合，但回执流水号属于上一任务。', '位置、数据有效性与流水号均匹配，交接已记账。']
    return {
      meters: [['当前单号', m.seq, '号'], ['任务目标', m.goal, 'm'], ['实际位置', m.position, 'm'], ['测距示值', m.read, 'm'], ['读数龄期', m.age, 's'], ['最近回执号', m.packet, '号'], ['已完成交接', m.done, '单'], ['已拒回执', m.rejected, '次']],
      active: active(m.seq > 0, m.busy && !u.link && !aligned, !u.link, m.seq > 0 && aligned, m.seq > 0 && m.packet === m.seq, m.reason === 4),
      note: u.link ? '数据流冻结，轴在教学模型中保持静止，龄期增长。上次位置只代表过去。' : notes[m.reason],
    }
  },
  diagram: graph(['任务单与目标', '行走轴', '激光测距', '目标窗比较', '回执号比较', '交接确认'], [[0, 1], [1, 2], [2, 1], [2, 3], [0, 3], [0, 4], [3, 5], [4, 5]]),
  prediction: quiz('任务 2 已到目标，回执携带任务 1 的号。位置数据有效，本次能完成交接吗？', ['能，位置足够', '不能，回执不能归到任务 2', '等一秒旧号自动变成新号'], 1, '位置证据解答“在哪里”，流水号解答“对应哪一单”。'),
  explanation: quiz('位置连续几秒不动。要区分“已经停在货位”和“数据冻结”，还要查看什么？', ['位置数据的有效状态和龄期', '画面颜色', '货位离起点远近'], 0, '读数不变既可能是物体静止，也可能是旧数据被重复展示。'),
  comic: strip([
    '货叉前的距离显示 6 m，是不是现在就能勾掉这张单？', '先核对目标本身。选择框可以翻到 B 位，已经生成的这张单仍指向 A 位。',
    '测距刚才没变化。我怎样判断是到位了，还是只看到昨天的数？', '看读数龄期和有效状态。冻结时旧数留在屏上，龄期每秒增长。',
    '到 10 m 了，可这次回执还是红的。原来单号是 1，这张是 2。', '重放当前单号的回执。三个条件同时满足，完成计数才会增加。',
    '换到另一条巷道联调，我会把目标、有效测距与同单回执写在同一条时间线上。',
  ], [1, 0, 1, 1, 3, 3, 2]),
  goals: [
    { text: '生成默认 A 位任务，从 2 m 推进 2 s 到 6 m。在“当前任务”下重放回执，完成第 1 单。', check: s => s.memory.done === 1 && near(s.memory.position, 6) },
    { text: '选择 B 位并生成第 2 单，再推进 2 s 到 10 m。用“上一任务”重放回执，看到拒收。', check: s => s.memory.seq === 2 && s.memory.reason === 3 && s.memory.busy === 1 },
    { text: '改回“当前任务”并重放回执，完成第 2 单。', check: s => s.memory.done >= 2 && s.memory.rejected >= 1 && s.memory.reason === 4 },
  ],
  practice: [['issue', 1], 2, ['receive', 1], ['target', 1], ['issue', 1], 2, ['reply', 1], ['receive', 1], ['reply', 0], ['receive', 1]],
  assumptions: '只模拟水平轴，初始位置 2 m，理想匀速 2 m/s，教学到位窗 ±0.02 m。冻结时教学模型立即暂停，忽略机械制动距离。Leuze 仪表提供测距参考，流水号、回执和取货许可属于独立的虚拟仓储逻辑。',
  trials: [
    { name: '正常 · 当前回执匹配 A 位', moves: [['issue', 1], 2, ['receive', 1]], verify: s => reads(s, { 已完成交接: 1, 实际位置: 6, 最近回执号: 1, 已拒回执: 0 }) },
    { name: '误操作 · 到位之前确认', moves: [['issue', 1], 1, ['receive', 1]], verify: s => s.memory.reason === 2 && reads(s, { 实际位置: 4, 已拒回执: 1, 已完成交接: 0 }) },
    { name: '故障与恢复 · 测距冻结一秒后恢复', moves: [['target', 1], ['issue', 1], 1, ['link', 1], 1, ['receive', 1], ['link', 0], 3, ['receive', 1]], verify: s => near(s.memory.oldest, 1) && reads(s, { 测距示值: 10, 已拒回执: 1, 已完成交接: 1, 读数龄期: 0 }) },
    { name: '迁移 · 依次完成 6 m 的第 1 单和 10 m 的第 2 单，在 B 位先拒绝旧号再接收当前号', moves: [['issue', 1], 2, ['receive', 1], ['target', 1], ['issue', 1], 2, ['reply', 1], ['receive', 1], ['reply', 0], ['receive', 1]], verify: s => s.memory.seq === 2 && s.memory.oldReplyFor === 2 && s.memory.firstDelivery === 6 && reads(s, { 任务目标: 10, 已完成交接: 2, 已拒回执: 1, 最近回执号: 2 }) },
  ],
}

const batteryMin = 2
const batteryMax = 12
const batteryLimit = 6
const efficiency = 0.9

function dispatchPower(u: Values, stored: number) {
  let ev = u.meterLoss ? 0 : u.ev
  const raw = u.base + ev - u.pv
  let battery = 0
  if (!u.meterLoss && u.mode) {
    const target = u.mode === 1 || raw < 0 ? raw : Math.max(0, raw - u.limit)
    if (target > 0 && stored > batteryMin + epsilon) battery = Math.min(target, batteryLimit)
    if (target < 0 && stored < batteryMax - epsilon) battery = Math.max(target, -batteryLimit)
  }
  if (u.mode === 2 && !u.meterLoss) ev = Math.max(0, ev - Math.max(0, raw - battery - u.limit))
  return { ev, battery, grid: u.base + ev - u.pv - battery }
}

export const campus: Lesson = {
  id: 48, title: '园区光储充功率平衡', prerequisites: [24, 32, 35, 36, 45], device: devices[48], review: true,
  context: '园区小型三相支路有屋顶光伏、储能和可调充电负荷。晴天可能反送，阴天要在充电需求与购电上限之间调度。',
  question: '当电池降到保留能量时，要维持同一个购电上限，哪一股功率必须变化？',
  task: '先比较光伏盈余的去向，再切换到阴天高充电需求，观察储能触底前后充电功率的变化。',
  controls: [
    range('pv', '光伏交流侧出力', 8, 0, 24, 1, 'kW'),
    range('base', '固定用电', 8, 4, 16, 1, 'kW'),
    range('ev', '车辆请求充电', 6, 0, 18, 1, 'kW'),
    range('limit', '购电目标上限', 12, 6, 24, 1, 'kW'),
    choice('mode', '园区调度策略', 0, '储能待机', '优先自用', '限购电并调节充电'),
    choice('meterLoss', '并网计量数据', 0, '有效', '数据中断'),
  ],
  parts: [
    part('光伏逆变交流口', '改变可用光伏出力，查看并网有功的正负。', 'pv', 20),
    part('储能变流器', '用优先自用策略吸收光伏盈余或供应缺口。', 'mode', 1),
    part('可调充电负荷', '提出较大的充电需求，比较请求和实际分配。', 'ev', 18),
    part('并网双向计量点', '模拟计量信息中断，观察课堂调度退化策略。', 'meterLoss', 1),
    part('园区负荷支路', '改变固定需求，考察柔性负荷能否独立守住购电上限。', 'base', 16),
  ],
  initialMemory: { stored: 6, bought: 0, sold: 0, evEnergy: 0, lost: 0 },
  advance(m, u, _before, _action, dt, time) {
    let hours = dt / 4
    while (hours > epsilon) {
      const f = dispatchPower(u, m.stored)
      let step = hours
      if (f.battery > 0) step = Math.min(step, (m.stored - batteryMin) * efficiency / f.battery)
      if (f.battery < 0) step = Math.min(step, (batteryMax - m.stored) / (-f.battery * efficiency))
      const storageRate = f.battery < 0 ? -f.battery * efficiency : -f.battery / efficiency
      m.stored = Math.max(batteryMin, Math.min(batteryMax, m.stored + storageRate * step))
      m.bought += Math.max(f.grid, 0) * step
      m.sold += Math.max(-f.grid, 0) * step
      m.evEnergy += f.ev * step
      m.lost += Math.abs(storageRate + f.battery) * step
      hours -= step
    }
    logSample(m, 'battery', time, m.stored)
    return m
  },
  sample(u, m) {
    const f = dispatchPower(u, m.stored)
    return {
      meters: [['并网有功', f.grid, 'kW'], ['储能交流功率', f.battery, 'kW'], ['实际充电', f.ev, 'kW'], ['电池能量', m.stored, 'kWh'], ['购电超额', Math.max(0, f.grid - u.limit), 'kW'], ['累计购电', m.bought, 'kWh'], ['累计馈网', m.sold, 'kWh'], ['车端交流电量', m.evEnergy, 'kWh'], ['储能损耗', m.lost, 'kWh']],
      active: active(u.pv > 0, f.battery < 0, f.battery > 0, true, f.ev > 0, Math.abs(f.grid) > epsilon, !u.meterLoss),
      note: u.meterLoss ? '计量数据已中断，虚拟调度暂停可调充电与储能。并网有功显示模型真值。' : f.grid < 0 ? '并网点正在馈网。储能充电记负、放电记正。' : f.grid > u.limit + epsilon ? '当前策略或不可调固定需求仍造成超额。' : '功率平衡成立。并网有功为正表示购电，负值表示馈网。',
      plots: [history(m, 'battery', '储能可用能量记录', '仿真时间 / s（每秒 15 min）', '能量 / kWh', 6),
        curve('固定当前策略与电池状态，改变光伏后的并网功率', '光伏 / kW', '并网有功 / kW', Array.from({length: 25}, (_, i) => i), pv => dispatchPower({...u, pv}, m.stored).grid)],
    }
  },
  diagram: graph(['光伏交流侧', '电池充电', '电池放电', '园区交流母线', '车辆充电', '并网交换', '计量调度'], [[0, 3], [3, 1], [2, 3], [3, 4], [3, 5], [5, 3], [5, 6], [6, 1], [6, 2], [6, 4]]),
  prediction: quiz('固定用电 8 kW，车辆请求 18 kW，光伏为零，购电上限 12 kW。电池可放 6 kW，峰值策略分给车辆多少？', ['18 kW', '10 kW', '4 kW'], 1, '可用的 12 + 6 kW 先满足固定负荷 8 kW，余下 10 kW 可用于充电。'),
  explanation: quiz('同样的需求下，电池到达保留能量后车辆只分到 4 kW。缺掉的 6 kW 去哪里了？', ['电池停止放电，调度同步减少车辆取电', '双向电表消耗了这些电', 'kWh 数值自动变成 kW'], 0, '功率平衡逐时成立。达到能量下限后，储能不再提供 6 kW。'),
  comic: strip([
    '中午光伏有 20 kW，楼里与车合计用 14，多出的六个千瓦怎么办？', '看看并网点。待机会馈网，切优先自用后，储能交流功率变成负值。',
    '一刻钟吸收 1.5 kWh，电池怎么只涨 1.35？', '教学充电效率是九成。再把太阳遮住，把车的请求提到 18 kW。',
    '限购 12 kW，先动用电池后车还能取 10 kW。电池快到 2 kWh 了！', '下限到了，放电归零。固定用电占去 8 kW，车只分到余下的 4。',
    '下班车队的排班表要同时记 kW 和能撑多久。一张瞬时功率图算不出整晚能充多少电。',
  ], [0, 1, 1, 0, 2, 4, 3]),
  goals: [
    { text: '调光伏到 20 kW，选优先自用并推进 1 s，看到储能吸收 6 kW，电池从 6 升到 7.35 kWh。', check: s => near(s.memory.stored, 7.35, 0.002) && reads(s, { 并网有功: 0, 储能交流功率: -6 }) },
    { text: '改光伏为零、车辆请求 18 kW，并选“限购电并调节充电”，使并网 12 kW、车端 10 kW。', check: s => s.input.mode === 2 && reads(s, { 并网有功: 12, 实际充电: 10, 储能交流功率: 6 }) },
    { text: '保持当前配置并推进 4 s，等电池降到 2 kWh，观察并网仍为 12 kW、车端降为 4 kW。', check: s => reads(s, { 电池能量: 2, 并网有功: 12, 实际充电: 4, 储能交流功率: 0 }) },
  ],
  practice: [['pv', 20], ['mode', 1], 1, ['pv', 0], ['ev', 18], ['mode', 2], 4],
  assumptions: '模型为园区一条小型三相支路，1 仿真秒 = 15 min，理想平衡 400 V、功率因数 1。电池 2–12 kWh 窗口，充放电各限 6 kW，单程效率 90%。P网 = P固定 + P车 − P光伏 − P储放。计量失联时暂停柔性负荷与储能是课堂策略。Fronius 仪表只承担并网点计量。',
  trials: [
    { name: '正常 · 午间盈余转充电', moves: [['pv', 20], ['mode', 1], 1], verify: s => reads(s, { 并网有功: 0, 储能交流功率: -6, 电池能量: 7.35, 储能损耗: 0.15 }) },
    { name: '误操作 · 高请求仍让储能待机', moves: [['pv', 0], ['ev', 18], 1], verify: s => reads(s, { 并网有功: 26, 购电超额: 14, 累计购电: 6.5, 电池能量: 6 }) },
    { name: '故障与恢复 · 并网计量恢复', moves: [['mode', 2], ['pv', 0], ['ev', 18], ['meterLoss', 1], 1, ['meterLoss', 0], 1], verify: s => reads(s, { 并网有功: 12, 累计购电: 5, 电池能量: 4.3333, 车端交流电量: 2.5 }) },
    { name: '迁移 · 零光伏、车要 18 kW，按 12 kW 限购运行 45 个模型分钟，电池守住 2 kWh、车获 6.6 kWh', moves: [['pv', 0], ['ev', 18], ['mode', 2], 3], verify: s => near(s.time, 3) && s.input.pv === 0 && s.input.ev === 18 && s.input.mode === 2 && reads(s, { 电池能量: 2, 实际充电: 4, 累计购电: 9, 车端交流电量: 6.6, 储能交流功率: 0 }) },
  ],
}
