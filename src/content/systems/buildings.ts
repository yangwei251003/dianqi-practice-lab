import { button, choice, graph, near, part, quiz, range, strip, type Lesson, type Values } from '../../core/types'
import { devices } from './devices'
import { active, curve, epsilon, history, logSample, reads } from './observation'

export const corridor: Lesson = {
  id: 37, title: '楼道感应照明', prerequisites: [2, 13], device: devices[37], review: false,
  context: '傍晚，两位住户相隔几秒走过同一层楼梯。第二位经过时，第一位触发的灯还亮着。',
  question: '灯从谁经过的那一刻开始倒数？楼道变暗本身能点亮灯吗？',
  task: '先制造一次有效经过，再让第二个人在倒计时中经过，观察熄灯时刻与累计亮灯时间。',
  controls: [
    range('lux', '楼道环境照度', 150, 0, 300, 5, 'lx'),
    range('threshold', '起灯照度门限', 50, 5, 200, 5, 'lx'),
    range('hold', '每次保持时长', 10, 5, 30, 1, 's'),
    choice('lens', '探测视野', 0, '可见经过', '视野遮挡'),
    button('pass', '行人横过探测区'),
  ],
  parts: [
    part('菲涅耳透镜', '一次横向经过产生一次红外运动事件。', 'pass', 1),
    part('感光门限旋钮', '将门限调至 100 lx，比较当前照度能否允许起灯。', 'threshold', 100),
    part('延时旋钮', '下次有效经过用这个时长重装倒计时。', 'hold', 15),
    part('楼道采光面', '调暗窗边照度，观察灯在下一次经过前的状态。', 'lux', 20),
  ],
  initialMemory: { left: 0, lit: 0, fires: 0, renewals: 0, missed: 0, bright: 0 },
  advance(m, u, _before, action, dt) {
    m.lit += Math.min(dt, m.left)
    m.left = Math.max(0, m.left - dt)
    if (m.left < epsilon) m.left = 0
    if (action === 'pass') {
      if (u.lens) m.missed++
      else if (m.left === 0 && u.lux > u.threshold) m.bright++
      else {
        if (m.left > 0 && m.left < u.hold - epsilon) m.renewals++
        m.left = u.hold
        m.fires++
      }
    }
    return m
  },
  sample(u, m) {
    const on = m.left > 0
    return {
      meters: [['环境照度', u.lux, 'lx'], ['剩余保持', m.left, 's'], ['灯具功率', on ? 18 : 0, 'W'], ['累计亮灯', m.lit, 's'], ['有效经过', m.fires, '次']],
      active: active(true, !u.lens, u.lux <= u.threshold, on, on),
      note: on ? '灯已点亮。再次探测到经过会重装延时。' : u.lens ? '视野遮挡，经过事件到不了计时器。' : u.lux <= u.threshold ? '照度条件已满足，正在等候运动事件。' : '当前照度高于起灯门限。',
      plots: [{ title: '若此后无人经过的灯具功率', x: '从现在起 / s', y: '功率 / W',
        points: on ? [[0, 18], [m.left, 18], [m.left, 0], [m.left + 5, 0]] : [[0, 0], [5, 0]] }],
    }
  },
  diagram: graph(['环境与行人', '红外探测通道', '起灯照度许可', '可重触发计时器', '楼道灯'], [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4]]),
  prediction: quiz('照度 20 lx、门限 50 lx。两人相隔 6 s 经过，保持值为 10 s。末次经过后还能亮多久？', ['4 s', '10 s', '16 s'], 1, '第二次经过把剩余保持重装为 10 s。两次经过之间没有熄灯。'),
  explanation: quiz('把楼道从 150 lx 调暗到 20 lx，灯仍灭着。接下来观察哪个量最能解释？', ['光源额定功率', '已经过去的白昼时长', '经过事件是否进入计时器'], 2, '低照度提供起灯许可，运动事件启动计时。两个条件承担不同作用。'),
  comic: strip([
    '我把窗边调暗了，台阶还是黑的。感光旋钮失灵了吗？', '先看“有效经过”。它还是零，走廊里还没出现移动的热目标。',
    '我点一下行人经过，18 W 亮了。倒数到 4 s 时，第二个人来了！', '盯住剩余保持。它又回到 10 s，已经亮过的 6 s 仍记在累计表里。',
    '那我在亮着的时候把环境调亮，正在走的人会突然摸黑吗？', '这段保持会走完。趁灯灭后再走一次，比较亮处与暗处的起灯条件。',
    '换成有转角的楼梯，我会分别试“看得到人”和“够不够暗”，再判断漏检原因。',
  ], [3, 0, 0, 2, 3, 1, 0]),
  goals: [
    { text: '把楼道调到 20 lx，再点“行人横过探测区”，使灯达到 18 W。', check: s => s.memory.fires > 0 && reads(s, { 灯具功率: 18 }) },
    { text: '保持灯亮，推进 2 s，再点一次经过，让倒计时重新装满。', check: s => s.memory.renewals > 0 && near(s.memory.left, s.input.hold) },
    { text: '停止添加行人，推进至少一个保持时长，观察灯熄灭。', check: s => s.memory.renewals > 0 && s.memory.left === 0 },
  ],
  practice: [['lux', 20], ['pass', 1], 2, ['pass', 1], 10],
  assumptions: '普通照明的虚拟事件逻辑。灯按 18 W 恒功率处理，照度不含本灯反射。起灯采用 ≤ 门限，亮灯期间的有效运动可续时。教学延时取原厂范围中的 5–30 s。',
  trials: [
    { name: '正常 · 暗处首人', moves: [['lux', 20], ['pass', 1], 2], verify: s => reads(s, { 剩余保持: 8, 灯具功率: 18, 累计亮灯: 2, 有效经过: 1 }) },
    { name: '误操作 · 亮处反复走过', moves: [['pass', 1], 1, ['pass', 1]], verify: s => s.memory.bright === 2 && reads(s, { 灯具功率: 0, 有效经过: 0 }) },
    { name: '故障与恢复 · 视野恢复', moves: [['lux', 20], ['lens', 1], ['pass', 1], ['lens', 0], ['pass', 1], 1], verify: s => s.memory.missed === 1 && reads(s, { 剩余保持: 9, 有效经过: 1 }) },
    { name: '迁移 · 20 lx、保持 5 s，两人相隔 3 s 经过，使累计亮灯 8 s 后熄灭', moves: [['lux', 20], ['hold', 5], ['pass', 1], 3, ['pass', 1], 5], verify: s => s.memory.renewals === 1 && s.input.hold === 5 && reads(s, { 环境照度: 20, 累计亮灯: 8, 剩余保持: 0, 有效经过: 2 }) },
  ],
}

const fanCapacity = [1.2, 2.4, 3.6]

function updateValve(m: Values, setpoint: number): void {
  if (m.room >= setpoint + 0.5 - epsilon) m.valve = 1
  if (m.room <= setpoint - 0.5 + epsilon) m.valve = 0
}

export const fanCoil: Lesson = {
  id: 38, title: '风机盘管', prerequisites: [7, 11], device: devices[38], review: false,
  context: '小会议室开会后越来越热。风机有声音，温控器也有开阀请求，室温却没有下降。',
  question: '怎样用房间的温度斜率区分“风档太低”和“盘管没有冷量”？',
  task: '给二管制末端一个制冷需求，比较风档、水侧可用性以及关阀后房间的温度变化。',
  controls: [
    range('setpoint', '室温设定', 24, 20, 28, 0.5, '°C'),
    choice('fan', '需求期间的风档', 1, '低', '中', '高'),
    choice('water', '冷水侧工况', 0, '冷量可用', '无冷量'),
    range('load', '房间得热', 1.2, 0.4, 2.4, 0.2, 'kW'),
  ],
  parts: [
    part('室温设定面板', '设定值两侧各 0.5 °C 形成教学回差。', 'setpoint', 26),
    part('风档选择面', '有冷量且阀开时，风档决定盘管带走的热量。', 'fan', 2),
    part('二管制冷水盘管', '切换可用冷量，对照阀指令和实际取热。', 'water', 1),
    part('会议桌热源', '人员与设备作为可变的显热输入。', 'load', 2.4),
  ],
  initialMemory: { room: 26, valve: 1, cold: 0 },
  advance(m, u, _before, _action, dt, time) {
    updateValve(m, u.setpoint)
    const removal = m.valve && !u.water ? fanCapacity[u.fan] : 0
    m.cold += removal * 60 * dt
    m.room += (u.load - removal) * 60 * dt / 600
    updateValve(m, u.setpoint)
    logSample(m, 'room', time, m.room)
    return m
  },
  sample(u, m) {
    const removal = m.valve && !u.water ? fanCapacity[u.fan] : 0
    return {
      meters: [['室温', m.room, '°C'], ['阀请求', m.valve, '开=1'], ['实际取热', removal, 'kW'], ['房间净得热', u.load - removal, 'kW'], ['累计取热', m.cold, 'kJ']],
      active: active(true, true, m.valve, m.valve, m.valve && !u.water, true),
      note: u.water && m.valve ? '阀已有请求，水侧无法提供冷量。温度斜率只剩房间得热一项。' : m.valve ? '制冷中。净得热小于零时室温下降，等于零时室温保持。' : '已越过关阀边界，房间得热会使温度回升。',
      plots: [history(m, 'room', '会议室温度记录', '模型时间 / min', '室温 / °C', 26)],
    }
  },
  diagram: graph(['房间得热', '室温反馈', '温控器阀请求', '风机档位', '盘管取热', '房间热容量'], [[0, 5], [5, 1], [1, 2], [2, 3], [2, 4], [3, 4], [4, 5]]),
  prediction: quiz('阀开、水侧可用、得热 1.2 kW。低档也恰好取热 1.2 kW。室温曲线会怎样？', ['持续下降', '保持水平', '持续升高'], 1, '进出热量相抵，房间储热量不变。'),
  explanation: quiz('高档时阀请求为 1，实际取热却为 0。为什么继续调低设定温度收效甚微？', ['水侧无冷量，风量无法单独带走热量', '设定越低，热容量越大', '温控器只能制热'], 0, '已有开阀请求，换热还需要可用的冷源。'),
  comic: strip([
    '风机听着很响，为什么投影仪旁边还在升温？', '先比两块表。阀请求记录温控器的意图，实际取热告诉你盘管带走了多少热。',
    '冷水可用，低档取热正好 1.2 kW。温度线居然是平的。', '桌边设备也在释放 1.2 kW。切到高档，看看这次谁大。',
    '取热变成 3.6 kW，五分钟降了 1.2 °C。要是水侧无冷量呢？', '保留高档，切换水侧工况。阀仍开着，室温斜率已经翻转。',
    '明天换到人更多的培训室，我会先估房间得热，再比较风档。能听见风声只是第一条线索。',
  ], [1, 2, 1, 3, 2, 0, 3]),
  goals: [
    { text: '保持冷量可用、得热 1.2 kW，切高档并推进 5 s（模型 5 min），使室温降到 24.8 °C 或以下。', check: s => s.input.fan === 2 && s.memory.room <= 24.8 + epsilon && s.memory.cold > 0 },
    { text: '将设定升至 26 °C，观察阀请求降到 0，房间净得热变正。', check: s => s.input.setpoint === 26 && s.memory.cold > 0 && s.memory.valve === 0 && s.frame.meters[3][1] > 0 },
  ],
  practice: [['fan', 2], 5, ['setpoint', 26]],
  assumptions: '1 仿真秒代表 1 min。取热能力按风档取 1.2 / 2.4 / 3.6 kW，房间等效热容量 600 kJ/K。ΔT =（得热 − 取热）× Δt / 热容量。忽略潜热、墙体动态和水阀行程。这些数值用于课堂热平衡。',
  trials: [
    { name: '正常 · 中档五分钟', moves: [5], verify: s => reads(s, { 室温: 25.4, 阀请求: 1, 累计取热: 720 }) },
    { name: '误操作 · 缺冷量时加大风档', moves: [['water', 1], ['fan', 2], 5], verify: s => reads(s, { 室温: 26.6, 阀请求: 1, 实际取热: 0, 累计取热: 0 }) },
    { name: '故障与恢复 · 冷水重新可用', moves: [['water', 1], 2, ['fan', 2], ['water', 0], 4], verify: s => reads(s, { 室温: 25.28, 实际取热: 3.6, 累计取热: 864 }) },
    { name: '迁移 · 满员得热 2.4 kW，用高档运行 3 个模型分钟，使室温降到 25.64 °C', moves: [['load', 2.4], ['fan', 2], 3], verify: s => near(s.time, 3) && s.input.fan === 2 && near(s.input.load, 2.4) && reads(s, { 室温: 25.64, 房间净得热: -1.2, 累计取热: 648 }) },
  ],
}

const generation = [0, 3, 6]

function mixedConcentration(start: number, emission: number, changes: number, minutes: number): number {
  if (changes === 0) return start + emission * minutes
  const k = changes / 60
  const equilibrium = 2 + emission / k
  return equilibrium + (start - equilibrium) * Math.exp(-k * minutes)
}

function airChanges(u: Values, m: Values): number {
  return u.fault ? 0 : u.force || m.high ? 12 : 3
}

export const garage: Lesson = {
  id: 39, title: '地库排风', prerequisites: [11, 15], device: devices[39], review: true,
  context: '高峰时段，值班屏显示高速请求。管理员看到 CO 仍在上升，要分清是车流增大还是风机没有送出风量。',
  question: '为什么排风请求、实际换气和浓度读数要分开观察？',
  task: '让车流推高虚拟 CO 读数，再观察排风投入及离峰后的回落。对照故障时的浓度斜率。',
  controls: [
    choice('traffic', '尾气释放情景', 0, '无车', '间歇车流', '集中离场'),
    choice('force', '需求逻辑', 0, '带回差的自动需求', '虚拟持续高速'),
    choice('fault', '风机实际反馈', 0, '风量可建立', '失风'),
  ],
  parts: [
    part('CO 采样区', '模拟车辆集中离场，改变单位时间污染增量。', 'traffic', 2),
    part('排风需求继电器', '比较持续高速与浓度回差逻辑。', 'force', 1),
    part('排风机与回风道', '切换失风反馈，比较请求与实际换气次数。', 'fault', 1),
  ],
  initialMemory: { co: 10, high: 0, peak: 10 },
  advance(m, u, _before, _action, dt) {
    m.co = mixedConcentration(m.co, generation[u.traffic], airChanges(u, m), dt)
    m.peak = Math.max(m.peak, m.co)
    if (m.co >= 20 - epsilon) m.high = 1
    if (m.co <= 12 + epsilon) m.high = 0
    return m
  },
  sample(u, m) {
    const actual = airChanges(u, m)
    const measured = Math.min(250, Math.round(m.co))
    return {
      meters: [['区内模型浓度', m.co, 'ppm'], ['探头示值', measured, 'ppm'], ['高速请求', Number(Boolean(u.force || m.high)), '有=1'], ['实际换气', actual, '次/h'], ['累计峰值', m.peak, 'ppm']],
      active: active(u.traffic !== 0, true, true, u.force || m.high, actual > 0, u.fault, !u.force && !m.high),
      note: u.fault ? '失风反馈已出现。请求灯仍可点亮，模型中的实际换气量为零。' : m.high ? '已进入高速区，回落到 12 ppm 才释放自动高速请求。' : '自动需求的教学上沿为 20 ppm。下方曲线固定当前风量，便于比较趋势。',
      plots: [curve('固定此刻风量与车流的五分钟推演', '经过 / min', '浓度 / ppm', [0, 1, 2, 3, 4, 5], t => mixedConcentration(m.co, generation[u.traffic], actual, t))],
    }
  },
  diagram: graph(['车辆排放', '地库空气', 'CO 探测', '高速请求', '实际换气', '失风反馈', '基础通风请求'], [[0, 1], [1, 2], [2, 3], [2, 6], [6, 4], [3, 4], [4, 1], [4, 5]]),
  prediction: quiz('无车时风机高速运行，室内从 10 ppm 开始下降。浓度会向什么值靠近？', ['持续降为负数', '始终是 10 ppm', '补入空气的 2 ppm'], 2, '在完全混合模型中，通风不断以室外空气替换室内空气。'),
  explanation: quiz('高速请求已经亮起，实际换气为零，车流还在。最能解释读数继续上升的因素是什么？', ['高速档会制造 CO', '只有排放项，稀释项已消失', '回差使传感器停止测量'], 1, '浓度由排放和换气共同决定，继电器请求本身不会移动空气。'),
  comic: strip([
    '值班屏亮了高速灯。为什么 CO 曲线还向上？', '把高速请求和实际换气并排看。第一项来自控制逻辑，第二项代表空气有没有流动。',
    '集中离场时，自动档升高速了，曲线开始弯。', '来车仍在补充 CO，换气也在稀释。斜率由两项相减决定。',
    '我把车流切到无车，读数跌过 20 ppm，高速灯怎么还亮？', '回落到 12 ppm 才退回低档。两条边界给自动调节留出回差。',
    '下一次看到“请求有、风量无”，我会把它和“有风但排放很大”分成两种记录。',
  ], [1, 2, 0, 2, 0, 1, 2]),
  goals: [
    { text: '用自动档与正常风机，选择集中离场并推进 2–3 s，看到高速请求和 12 次/h 的换气。', check: s => s.input.force === 0 && s.memory.high === 1 && reads(s, { 实际换气: 12 }) },
    { text: '将车流切到无车并继续推进，直至浓度低于 12 ppm，自动档回到 3 次/h。', check: s => s.memory.peak >= 20 && s.input.traffic === 0 && s.memory.co <= 12 && reads(s, { 实际换气: 3 }) },
  ],
  practice: [['traffic', 2], 3, ['traffic', 0], 8],
  assumptions: '1 仿真秒代表 1 min。假设完全混合，补风 2 ppm，排放等效为 0 / 3 / 6 ppm/min，换气 0 / 3 / 12 次/h。探头显示取整且上限 250 ppm，回差比较使用区内连续模型值，忽略仪表响应时间。20 / 12 ppm 仅为课堂切档值，职业暴露、报警及消防排烟另需专业设计。',
  trials: [
    { name: '正常 · 无车基础通风', moves: [5], verify: s => reads(s, { 区内模型浓度: 8.2304, 探头示值: 8, 实际换气: 3 }) },
    { name: '误操作 · 把高速请求当风量', moves: [['traffic', 2], ['force', 1], ['fault', 1], 3], verify: s => reads(s, { 区内模型浓度: 28, 高速请求: 1, 实际换气: 0 }) },
    { name: '故障与恢复 · 来车后风量恢复', moves: [['traffic', 2], ['fault', 1], 2, ['traffic', 0], ['fault', 0], 1], verify: s => reads(s, { 区内模型浓度: 18.3746, 累计峰值: 22, 实际换气: 12 }) },
    { name: '迁移 · 间歇车流持续高速换气 5 个模型分钟，使探头示值达到 14 ppm', moves: [['traffic', 1], ['force', 1], 5], verify: s => s.input.traffic === 1 && s.input.force === 1 && near(s.time, 5) && reads(s, { 区内模型浓度: 14.4248, 实际换气: 12, 探头示值: 14 }) },
  ],
}
