import { button, choice, graph, near, part, quiz, range, strip, type Lesson, type Values } from '../../core/types'
import { devices } from './devices'
import { active, curve, epsilon, history, logSample, reads } from './observation'

export const packaging: Lesson = {
  id: 43, title: '包装输送线堵料', prerequisites: [13, 18], device: devices[43], review: true,
  context: '包装线换成长纸箱后，出料检测点频繁报堵。相同的持续检出，既可能是箱子变长，也可能是下游停止接收。',
  question: '一只畅行的箱子本来会被探头看见多久？什么时候有证据认为出料异常？',
  task: '让单箱通过，再模拟下游暂停接收。观察占位、超时、清空与上游恢复受理的先后。',
  controls: [
    range('length', '下一箱长度', 300, 200, 900, 50, 'mm'),
    range('speed', '输送速度', 300, 100, 600, 50, 'mm/s'),
    range('timeout', '持续检出判定时长', 2, 1, 6, 0.5, 's'),
    choice('outlet', '下游交接记录', 0, '可以接收', '暂停接收'),
    button('insert', '送入一箱虚拟工件'), button('ack', '确认空线记录'),
  ],
  parts: [
    part('光电检测点', '投入一箱，观察箱头到箱尾的连续检出。', 'insert', 1),
    part('输送带驱动轮', '带速改变单箱自然占位时间。', 'speed', 400),
    part('下游交接台', '暂停接收让当前箱子停在检测点上。', 'outlet', 1),
    part('堵料计时窗', '比较报警延时与长纸箱的预计通过时间。', 'timeout', 3),
  ],
  initialMemory: { left: 0, boxLength: 0, cover: 0, lastCover: 0, alarm: 0, trips: 0, passed: 0, denied: 0 },
  advance(m, u, _before, action, dt) {
    if (action === 'insert' && !m.alarm && m.left <= epsilon) {
      m.left = u.length
      m.boxLength = u.length
      m.cover = 0
    }
    if (m.left > epsilon) {
      const visible = u.outlet ? dt : Math.min(dt, m.left / u.speed)
      m.cover += visible
      if (m.cover >= u.timeout - epsilon && !m.alarm) { m.alarm = 1; m.trips++ }
      if (!u.outlet) m.left = Math.max(0, m.left - u.speed * visible)
      if (m.left <= epsilon) {
        m.left = 0
        m.lastCover = m.cover
        m.cover = 0
        m.passed++
      }
    }
    if (action === 'ack' && m.alarm) {
      if (m.left > epsilon) m.denied++
      else m.alarm = 0
    }
    return m
  },
  sample(u, m) {
    return {
      meters: [['光电检出', Number(m.left > 0), '有=1'], ['连续检出', m.cover, 's'], ['占位剩余箱长', m.left, 'mm'], ['堵料锁存', m.alarm, '有=1'], ['已过箱数', m.passed, '箱'], ['上箱占位', m.lastCover, 's'], ['箱位', m.boxLength ? 100 * (1 - m.left / m.boxLength) : 0, '%']],
      active: active(m.left > 0, !u.outlet, m.left > 0, m.cover > 0, m.alarm, !m.alarm && m.left === 0),
      note: m.alarm ? (m.left ? '出料点仍有工件，空线确认不能释放上游暂停。' : '工件已通过，锁存还在，等待虚拟空线确认。') : m.left ? '占位计时中。箱长除以当前带速给出畅行时的理论时长。' : '出料点空闲，可以送入下一箱。',
      plots: [curve('下一箱畅行时的理论占位时间', '带速 / (mm/s)', '时间 / s', [100, 150, 200, 300, 400, 500, 600], v => u.length / v)],
    }
  },
  diagram: graph(['包装箱', '下游可接收', '漫反射检出', '占位计时', '堵料锁存', '上游放箱许可'], [[0, 2], [1, 0], [2, 3], [3, 4], [4, 5], [5, 0]]),
  prediction: quiz('900 mm 箱以 300 mm/s 畅行，延时为 2 s。结果是什么？', ['约 2 s 就报持续检出，约 3 s 箱尾才离开', '只有停带才可能报持续检出', '约 0.33 s 箱尾离开'], 0, '自然经过时间是 900/300 = 3 s，比设定时长长。'),
  explanation: quiz('出料点清空后，上游仍不受理下一箱。先看哪项？', ['下一箱的颜色', '已走完的箱子是否重新遮光', '堵料锁存是否仍待空线确认'], 2, '当前检测与过去已经锁存的异常是两种状态。'),
  comic: strip([
    '短箱换长箱，报警次数翻了。下游是不是真的堵了？', '先用尺和带速算时间。300 mm 的箱子以 300 mm/s 走过，只占一秒。',
    '900 mm 长箱要三秒，原先两秒的判定会先到！', '再看真正的暂停接收。箱尾位置不再前移，连续检出还在增长。',
    '我点了空线确认，灯没有灭，纸箱还在光点下面。', '等模拟的下游恢复接收、箱尾通过，再对比检出灯和锁存灯。',
    '下次换规格，我会先算正常停留时间，再用通过记录区分误报和积料。',
  ], [0, 1, 3, 2, 0, 2, 3]),
  goals: [
    { text: '保留默认箱长与带速，送入一箱并推进 1 s，得到一次约 1 s 的完整通过记录。', check: s => s.memory.passed > 0 && near(s.memory.lastCover, 1) && s.memory.trips === 0 },
    { text: '暂停下游接收，再送一箱并推进 2 s，使持续检出触发锁存。', check: s => s.input.outlet === 1 && s.memory.alarm === 1 && s.memory.left > 0 },
    { text: '恢复“可以接收”，推进 1 s 让箱尾离开，再点“确认空线记录”，解除锁存。', check: s => s.memory.trips > 0 && s.memory.passed >= 2 && s.memory.alarm === 0 && s.memory.left === 0 },
  ],
  practice: [['insert', 1], 1, ['outlet', 1], ['insert', 1], 2, ['outlet', 0], 1, ['ack', 1]],
  assumptions: '单箱、反光充分、窄光斑，检测时长近似箱长/带速。后续箱由上游许可控制，锁存时下游仍可移走本箱。速度、延时与暂停策略均为教学情景。E3Z-D62 只提供物体检出，计时和锁存位于虚拟控制器。',
  trials: [
    { name: '正常 · 短箱通过', moves: [['insert', 1], 1.5], verify: s => reads(s, { 已过箱数: 1, 上箱占位: 1, 堵料锁存: 0 }) },
    { name: '误操作 · 长箱沿用短延时', moves: [['length', 900], ['insert', 1], 2.2], verify: s => reads(s, { 占位剩余箱长: 240, 连续检出: 2.2, 堵料锁存: 1 }) },
    { name: '故障与恢复 · 暂停接收后恢复', moves: [['outlet', 1], ['insert', 1], 2.1, ['ack', 1], ['outlet', 0], 1.2, ['ack', 1]], verify: s => s.memory.denied === 1 && s.memory.trips === 1 && reads(s, { 堵料锁存: 0, 上箱占位: 3.1, 已过箱数: 1 }) },
    { name: '迁移 · 800 mm 箱按 400 mm/s 通过，选 3 s 判定，让占位达到 2 s 并保持零报警', moves: [['length', 800], ['speed', 400], ['timeout', 3], ['insert', 1], 2.1], verify: s => s.input.length === 800 && s.input.speed === 400 && s.input.timeout === 3 && s.memory.trips === 0 && reads(s, { 上箱占位: 2, 已过箱数: 1 }) },
  ],
}

function available(fault: number, pump: number): boolean {
  return fault !== 3 && fault !== pump
}

function selectPumps(m: Values, fault: number): void {
  if (m.stage && m.volume <= 40 + epsilon) {
    m.stage = 0
    m.duty = 0
    m.lead = 3 - m.lead
    m.cycles++
  }
  if (m.volume >= 80 - epsilon && !m.stage) { m.stage = 1; m.duty = m.lead }
  if (m.volume >= 120 - epsilon) m.stage = 2
  if (m.stage && !available(fault, m.duty) && available(fault, 3 - m.duty)) {
    m.duty = 3 - m.duty
    m.swaps++
  }
  m.a = Number(m.stage > 0 && available(fault, 1) && (m.duty === 1 || m.stage === 2))
  m.b = Number(m.stage > 0 && available(fault, 2) && (m.duty === 2 || m.stage === 2))
}

export const duplex: Lesson = {
  id: 44, title: '双泵故障轮换', prerequisites: [12, 16], device: devices[44], review: true,
  context: '集水箱的两台排水泵交替领泵。一号泵有一次运行中失去反馈，后来又恢复，站长想知道那一轮究竟由谁抽完。',
  question: '正常轮值、故障接替、高水位两泵并行，分别由什么条件触发？',
  task: '完成一轮排水，观察下轮首选泵。再在一轮中改变可用性，依据液量和两台运行记录判读接替。',
  controls: [
    button('batch', '加入 20 L 虚拟来水'),
    range('inflow', '持续来水', 0, 0, 16, 1, 'L/s'),
    choice('fault', '泵可用性记录', 0, '两泵可用', 'A 泵不可用', 'B 泵不可用', '两泵不可用'),
  ],
  parts: [
    part('集水箱液位测点', '注入一个已知体积的虚拟来水事件。', 'batch', 1),
    part('A 泵状态窗', '模拟 A 泵不可用，观察接替是否实际抽走水。', 'fault', 1),
    part('B 泵状态窗', '模拟 B 泵不可用，比较轮值和可用性。', 'fault', 2),
    part('进水支路', '让进水率超过一台泵的模型流量，观察液量。', 'inflow', 14),
  ],
  initialMemory: { volume: 60, lead: 1, duty: 0, stage: 0, a: 0, b: 0, swaps: 0, cycles: 0, pumped: 0, spill: 0 },
  advance(m, u, _before, action, dt, time) {
    if (action === 'batch') {
      m.spill += Math.max(0, m.volume + 20 - 180)
      m.volume = Math.min(180, m.volume + 20)
    }
    selectPumps(m, u.fault)
    let remaining = dt
    while (remaining > epsilon) {
      const drain = 10 * (m.a + m.b)
      const rate = u.inflow - drain
      let step = remaining
      const threshold = rate < 0 && m.stage ? 40 : rate > 0 && m.stage < 2 ? (m.stage ? 120 : 80) : undefined
      if (threshold !== undefined) {
        const crossing = (threshold - m.volume) / rate
        if (crossing > epsilon) step = Math.min(step, crossing)
      }
      const next = m.volume + rate * step
      m.spill += Math.max(0, next - 180)
      m.volume = Math.max(0, Math.min(180, next))
      m.pumped += drain * step
      remaining -= step
      selectPumps(m, u.fault)
    }
    logSample(m, 'water', time, m.volume)
    return m
  },
  sample(u, m) {
    return {
      meters: [['集水量', m.volume, 'L'], ['液位', 100 * m.volume / 180, '%'], ['泵A运行', m.a, '是=1'], ['泵B运行', m.b, '是=1'], ['本轮领泵', m.duty, 'A=1/B=2'], ['故障接替', m.swaps, '次'], ['累计排水', m.pumped, 'L'], ['溢出累计', m.spill, 'L']],
      active: active(u.inflow > 0 || m.volume > 0, true, m.stage > 0, m.a, m.b, u.fault > 0),
      note: m.stage ? (!m.a && !m.b ? '已有液位需求，两泵均不可用，排水流量为零。' : m.stage === 2 ? '已达第二起动液位，所有可用泵保持运行至停泵液位。' : '本轮领泵保持运行，换泵后的可用性恢复不会中途抢回领泵。') : '低液位待机。下一轮首选 ' + (m.lead === 1 ? 'A' : 'B') + ' 泵。',
      plots: [history(m, 'water', '集水量随时间变化', '时间 / s', '集水量 / L', 60)],
    }
  },
  diagram: graph(['集水箱', '液位测量', '交替与增泵', 'A 泵流量', 'B 泵流量', '故障反馈'], [[0, 1], [1, 2], [5, 2], [2, 3], [2, 4], [3, 0], [4, 0]]),
  prediction: quiz('A 正在单泵排水时不可用，B 接替。A 恢复而液量仍在起停线之间，本模型怎么做？', ['A 与 B 立即都停', '让 B 抽完本轮', 'A 立刻抢回本轮'], 1, '接替后的领泵在本轮保持，直到达到停泵液位。'),
  explanation: quiz('两泵都可用，哪条记录支持“第二级液位增泵”而非普通轮值？', ['集水量过 120 L 后，两台运行位同时有效', '两轮先后各有一台泵启动', 'A 泵出现过故障'], 0, '增泵由高液位触发；普通轮值是在不同排水周期之间换首选泵。'),
  comic: strip([
    '上一轮 A 抽完了，这次为什么 B 先响？', '看液量，上次回到 40 L 结束了一整轮。首选编号在周期边界翻转。',
    '另一段记录里，液量还有 70 L，A 却变成 B。', '这次可用性变了。查故障接替计数，再看液量是否继续下降。',
    '既然 A 已恢复，为什么还是 B 运行？', '教学轮值让替班者抽完。如果来水涨到 120 L，还会触发另一条增泵逻辑。',
    '下次看到两个运行灯，我先对齐液量、故障和时刻，免得把并泵写成轮换。',
  ], [1, 0, 2, 1, 2, 3, 0]),
  goals: [
    { text: '从 60 L 加入 20 L，看到 A 泵领泵，然后推进 4 s 到 40 L，完成一轮。', check: s => s.memory.cycles === 1 && !s.memory.stage && near(s.memory.volume, 40) },
    { text: '再连续加入两次 20 L，看到 B 单独领泵。', check: s => s.memory.cycles >= 1 && s.memory.a === 0 && s.memory.b === 1 && s.memory.duty === 2 },
    { text: '选择“B 泵不可用”，推进 1 s，观察 A 接替且液量降到 70 L 或以下。', check: s => s.memory.swaps > 0 && s.memory.a === 1 && s.memory.volume <= 70 + epsilon },
  ],
  practice: [['batch', 1], 4, ['batch', 1], ['batch', 1], ['fault', 2], 1],
  assumptions: '等截面教学水箱容量 180 L，40 / 80 / 120 L 对应停泵、首泵和增泵液位，每泵恒定 10 L/s。用体积代替静压测量，忽略止回阀和管阻。接替后保持本轮领泵属于教学调度约定。',
  trials: [
    { name: '正常 · 两轮交替', moves: [['batch', 1], 4, ['batch', 1], ['batch', 1], 1], verify: s => s.memory.cycles === 1 && reads(s, { 集水量: 70, 泵A运行: 0, 泵B运行: 1, 累计排水: 50 }) },
    { name: '误操作 · 有需求却忽略双故障', moves: [['fault', 3], ['batch', 1], ['inflow', 4], 3], verify: s => reads(s, { 集水量: 92, 泵A运行: 0, 泵B运行: 0, 累计排水: 0 }) },
    { name: '故障与恢复 · 本轮接替保持', moves: [['batch', 1], 1, ['fault', 1], 1, ['fault', 0], 1], verify: s => reads(s, { 本轮领泵: 2, 泵B运行: 1, 故障接替: 1, 集水量: 50, 累计排水: 30 }) },
    { name: '迁移 · 连加三批水至 120 L，观察双泵在 3.5 s 内共排出 70 L、剩 50 L', moves: [['batch', 1], ['batch', 1], ['batch', 1], 3.5], verify: s => near(s.time, 3.5) && s.input.inflow === 0 && reads(s, { 泵A运行: 1, 泵B运行: 1, 集水量: 50, 累计排水: 70 }) },
  ],
}

function reservePlan(u: Values) {
  let heater = Boolean(u.heater)
  let motor = Boolean(u.motor)
  const powers = () => {
    const p = u.critical + (heater ? 24 : 0) + (motor ? 18 : 0)
    const q = 0.75 * u.critical + (motor ? 24 : 0)
    return { p, q, s: Math.hypot(p, q) }
  }
  const fits = (load: ReturnType<typeof powers>) => load.p <= u.kw + epsilon && load.s <= u.kva + epsilon
  const request = powers()
  if (u.shed && !fits(request)) heater = false
  if (u.shed && !fits(powers())) motor = false
  const selected = powers()
  return { ...selected, request, fits: fits(selected), heater, motor }
}

export const reserve: Lesson = {
  id: 45, title: '厂房备用容量与关键负荷', prerequisites: [19, 24], device: devices[45], review: true,
  context: '厂房要用一套备用源覆盖关键工艺。排程员拿到稳态负荷表，上面同时写着 kW、kvar 与 kVA。',
  question: '关键工艺、输送机和电加热一起申请时，怎样核对有功与视在两道上限，并保留关键负荷？',
  task: '先保留全部申请暴露容量缺口，再启用分级缓供，核对负荷组合和剩余裕量。',
  controls: [
    range('critical', '关键工艺有功', 48, 24, 72, 4, 'kW'),
    range('kva', '备用源视在上限', 100, 60, 140, 5, 'kVA'),
    range('kw', '原动机有功上限', 80, 40, 100, 4, 'kW'),
    choice('motor', '输送机申请', 0, '无', '请求 18 kW + 24 kvar'),
    choice('heater', '电加热申请', 0, '无', '请求 24 kW'),
    choice('shed', '负荷排程策略', 0, '保留全部申请', '先缓供加热，再缓供输送'),
  ],
  parts: [
    part('关键负荷分支', '改变关键负荷，再检查两种容量裕量。', 'critical', 64),
    part('输送机分支', '增加同时含有功和无功的负荷。', 'motor', 1),
    part('电加热分支', '增加接近纯有功的电阻性负荷。', 'heater', 1),
    part('备用负荷排程面板', '按优先级重新评估负荷表。', 'shed', 1),
  ],
  sample(u) {
    const p = reservePlan(u)
    const domain = [0, 0.25, 0.5, 0.75, 1].map(frac => Math.min(u.kw, u.kva) * frac)
    return {
      meters: [['申请有功', p.request.p, 'kW'], ['申请视在', p.request.s, 'kVA'], ['拟供有功', p.p, 'kW'], ['拟供无功', p.q, 'kvar'], ['拟供视在', p.s, 'kVA'], ['有功裕量', u.kw - p.p, 'kW'], ['视在裕量', u.kva - p.s, 'kVA'], ['关键可供', p.fits ? u.critical : 0, 'kW'], ['缓供有功', p.request.p - p.p, 'kW']],
      active: active(true, true, p.motor, p.heater, true, true, u.shed),
      note: p.fits ? (p.request.p > p.p ? '分级策略已暂缓部分申请，关键工艺有可行组合。' : '当前组合同时满足两项稳态容量约束。') : '当前组合无法整体承诺。负裕量显示受限的量纲，关键可供按整组承诺记零。',
      plots: [curve('给定有功下允许的最大感性无功', '有功 / kW', '最大无功 / kvar', domain, w => Math.sqrt(Math.max(0, u.kva ** 2 - w ** 2)))],
    }
  },
  diagram: graph(['备用源', '关键负荷申请', '拟供输送', '拟供电热', '总线功率表', '双容量核算', '缓供排程'], [[0, 1], [0, 2], [0, 3], [1, 4], [2, 4], [3, 4], [4, 5], [5, 6], [6, 2], [6, 3]]),
  prediction: quiz('关键工艺 48 kW + 36 kvar，另加 24 kW 电热。合计视在功率最接近多少？', ['84 kVA', '72 kVA', '80.5 kVA'], 2, '有功相加为 72 kW，无功仍是 36 kvar，√(72² + 36²) ≈ 80.5 kVA。'),
  explanation: quiz('有功上限降到 60 kW，关键工艺单独需 64 kW，视在需求 80 kVA 仍低于 100 kVA。结论是什么？', ['仍受有功上限约束', '有视在裕量即可保证供电', '可以用减少仪表显示位数解决'], 0, '原动机可提供的有功与电机绕组承受的视在容量要分别核对。'),
  comic: strip([
    '备用源标着 100 kVA，我把负荷表的 kW 相加就够了吧？', '输送机还带 24 kvar。先分列相加，再按功率三角形求视在功率。',
    '三路都要，申请 90 kW、约 108.2 kVA。两项都满了。', '热工序能等，先缓供它。再看输送与关键工艺留下的 P、Q。',
    '现在是 66 kW、60 kvar，约 89.2 kVA。关键工艺有余量。', '再试原动机降额。即使 kVA 表还容得下，有功那一列也可能先越界。',
    '我给下一班的表格会分别写两种裕量，还会说明哪一支可以推迟。',
  ], [0, 1, 2, 3, 1, 0, 3]),
  goals: [
    { text: '保留全部申请，让输送机和电加热同时请求，看到 90 kW 申请与负的两项裕量。', check: s => !s.input.shed && reads(s, { 申请有功: 90 }) && s.frame.meters[6][1] < 0 },
    { text: '选择分级缓供，保留 48 kW 关键负荷和输送机，使约 24 kW 加热申请延后。', check: s => s.input.shed === 1 && reads(s, { 关键可供: 48, 缓供有功: 24, 拟供有功: 66 }) },
  ],
  practice: [['motor', 1], ['heater', 1], ['shed', 1]],
  assumptions: '三相平衡、正弦稳态，关键负荷功率因数 0.8 滞后，P、Q 先分项相加后求 S = √(P² + Q²)。有功和视在上限独立输入。结果是排程承诺，未含启动涌流、瞬态或实际切换。PM5560 只作为总线功率测量参考。',
  trials: [
    { name: '正常 · 工艺和输送可供', moves: [['motor', 1]], verify: s => reads(s, { 拟供有功: 66, 拟供无功: 60, 拟供视在: 89.1964, 有功裕量: 14, 关键可供: 48 }) },
    { name: '误操作 · 全部申请并行', moves: [['motor', 1], ['heater', 1]], verify: s => reads(s, { 申请有功: 90, 有功裕量: -10, 视在裕量: -8.1665, 关键可供: 0 }) },
    { name: '故障与恢复 · 备用容量降至 70 kVA 后重排', moves: [['motor', 1], ['heater', 1], ['kva', 70], ['shed', 1]], verify: s => reads(s, { 关键可供: 48, 拟供视在: 60, 视在裕量: 10, 缓供有功: 42 }) },
    { name: '迁移 · 100 kVA、60 kW 的备用源单独评估 64 kW 关键工艺，查出有功缺 4 kW、视在余 20 kVA', moves: [['critical', 64], ['kw', 60]], verify: s => reads(s, { 有功裕量: -4, 视在裕量: 20, 拟供有功: 64, 关键可供: 0 }) },
  ],
}
