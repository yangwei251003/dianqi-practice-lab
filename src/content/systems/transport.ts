import { button, choice, graph, near, part, quiz, range, strip, type Lesson, type Values } from '../../core/types'
import { devices } from './devices'
import { active, curve, epsilon, reads } from './observation'

function doorEvidence(record: number, t: number) {
  const reopening = record === 1
  const gap = reopening && t >= 2 ? Math.min(1000, 500 + 250 * (t - 2)) : Math.max(0, 1000 - 250 * t)
  return { gap, blocked: reopening && t >= 2 && t < 3, closed: gap <= epsilon, locked: record === 0 && t >= 5 }
}

export const lift: Lesson = {
  id: 40, title: '电梯门系统只做虚拟诊断', prerequisites: [13, 18], device: devices[40], review: true,
  context: '三段教学记录都从相同门缝开始。回放只提供门位、光幕事件和锁反馈，学生以观察员身份填写诊断。',
  question: '怎样从时间先后区分门口遮挡后的重开、闭位后缺少锁证据，以及一次正常闭合？',
  task: '选一段记录，播放并推进 6 s，读完三条证据再提交判读。更换片段可复核另一种结果。',
  controls: [
    choice('record', '只读事件记录', 0, '片段甲', '片段乙', '片段丙'),
    button('replay', '从头播放此记录'),
    choice('diagnosis', '我的判读', 0, '未选择', '闭位后出现锁反馈', '光幕事件后门重开', '已闭位但缺锁反馈'),
    button('submit', '提交本段判读'),
  ],
  parts: [
    part('光幕发射与接收条', '打开片段乙，查阅门口光束受阻的发生时刻。', 'record', 1),
    part('门扇开度标尺', '从头播放当前记录，用毫米读数追踪开度变化。', 'replay', 1),
    part('闭位与锁反馈窗', '打开片段丙，比对门缝归零和锁反馈出现的先后。', 'record', 2),
    part('观察员记录板', '提交已选判读。只有完整回放才会计入有效证据。', 'submit', 1),
  ],
  initialMemory: { cursor: 0, playing: 0, correct: 0, mistakes: 0, early: 0, sawBlock: 0, last: 0 },
  advance(m, u, before, action, dt) {
    if ((action === 'record' && u.record !== before.record) || action === 'replay') {
      m.cursor = 0
      m.sawBlock = 0
      m.playing = Number(action === 'replay')
      m.last = 0
    }
    if (m.playing) {
      m.cursor = Math.min(6, Math.round((m.cursor + dt) * 1e6) / 1e6)
      if (m.cursor >= 6 - epsilon) { m.cursor = 6; m.playing = 0 }
      if (doorEvidence(u.record, m.cursor).blocked) m.sawBlock = 1
    }
    if (action === 'submit') {
      if (m.cursor < 6 || !u.diagnosis) { m.early++; m.last = -1 }
      else if (u.diagnosis === u.record + 1) { m.correct |= 1 << u.record; m.last = 1 }
      else { m.mistakes++; m.last = -2 }
    }
    return m
  },
  sample(u, m) {
    const e = doorEvidence(u.record, m.cursor)
    const times = [...new Set([0, 2, 3, 4, 5, 6].filter(t => t < m.cursor).concat(m.cursor))].sort((a, b) => a - b)
    return {
      meters: [['记录游标', m.cursor, 's'], ['门缝', e.gap, 'mm'], ['门开度', e.gap / 10, '%'], ['光幕受阻', Number(e.blocked), '是=1'], ['闭位反馈', Number(e.closed), '有=1'], ['锁反馈', Number(e.locked), '有=1'], ['本段曾受阻', m.sawBlock, '是=1']],
      active: active(true, e.blocked, true, e.closed, e.locked, m.cursor >= 6),
      note: m.last === 1 ? '本次判读与整段证据相符。' : m.last === -2 ? '判读与记录不符。重看门缝归零、光幕事件和锁反馈的先后。' : m.last === -1 ? '请先完整播放 6 s，并选定一个判读。' : m.cursor === 6 ? '记录已结束。结合全过程作答。' : '只读教学记录，光幕、门位和锁反馈各自独立显示。',
      plots: [curve('已回放的门缝轨迹', '片段时间 / s', '开度 / mm', times, t => doorEvidence(u.record, t).gap)],
    }
  },
  diagram: graph(['事件记录时钟', '光幕受阻', '门位轨迹', '闭位证据', '锁反馈通道', '整段判读'], [[0, 1], [0, 2], [0, 4], [1, 5], [2, 3], [3, 5], [4, 5]]),
  prediction: quiz('片段在第 4 s 显示门缝为零。此刻仅凭这一项可以判定什么？', ['门在记录的闭合位置', '锁反馈一定有效', '轿厢已经运行'], 0, '闭位与锁反馈分别记录，需要时间戳和另一通道才能判断后者。'),
  explanation: quiz('片段末尾光幕已经畅通，整段记录仍可能是因遮挡重开。哪组证据能支持？', ['最后一帧门缝较宽', '门先闭合到零，再出现锁反馈', '光幕受阻时门缝先变小后变大'], 2, '短暂事件可能在最后一帧消失，事件与轨迹反向的时序才有诊断价值。'),
  comic: strip([
    '我截到一张门缝为零的图，可以把“已锁”写进报告吗？', '再翻后一秒。闭位尺和锁反馈是两条时间线，甲片里它们也有先后。',
    '乙片停在最后，门是开的，光幕栏却为零。', '把游标带回两秒。光幕先记下遮挡，之后门缝从 500 mm 往上长。',
    '丙片的门缝一直为零，我等到六秒也没看见锁反馈。', '把结论写成“本段缺少锁反馈”。仅凭这几条记录还定位不到哪个零件损坏。',
    '以后碰到一张静态截图，我会先要事件顺序，尤其是看不到起因的最后一帧。',
  ], [2, 1, 0, 0, 2, 3, 1]),
  goals: [
    { text: '选片段丙，从头播放并推进 6 s。选择“已闭位但缺锁反馈”，再提交。', check: s => Boolean(s.memory.correct & 4) },
    { text: '再选片段甲，完整播放 6 s，比较闭位与锁反馈。选择对应判读并提交。', check: s => (s.memory.correct & 5) === 5 },
  ],
  practice: [['record', 2], ['replay', 1], 6, ['diagnosis', 3], ['submit', 1], ['record', 0], ['replay', 1], 6, ['diagnosis', 1], ['submit', 1]],
  assumptions: '全部为合成的只读记录。门缝 1000 mm、运动斜率与秒级事件顺序为教学设定。CEDES 光幕仅作为门口检测参考，闭位和锁反馈来自独立的虚拟通道。诊断范围限于记录所见。',
  trials: [
    { name: '正常 · 闭位后取得锁反馈', moves: [['replay', 1], 6, ['diagnosis', 1], ['submit', 1]], verify: s => s.memory.correct === 1 && reads(s, { 门缝: 0, 闭位反馈: 1, 锁反馈: 1 }) },
    { name: '误操作 · 凭闭位截图早判', moves: [['replay', 1], 4, ['diagnosis', 1], ['submit', 1]], verify: s => s.memory.correct === 0 && s.memory.early === 1 && reads(s, { 闭位反馈: 1, 锁反馈: 0 }) },
    { name: '故障与恢复 · 复核缺锁与正常两份记录', moves: [['record', 2], ['replay', 1], 6, ['diagnosis', 3], ['submit', 1], ['record', 0], ['replay', 1], 6, ['diagnosis', 1], ['submit', 1]], verify: s => s.memory.correct === 5 && s.memory.mistakes === 0 && reads(s, { 闭位反馈: 1, 锁反馈: 1 }) },
    { name: '迁移 · 完整回放乙片，凭 500 mm 处的反向轨迹判出光幕触发重开并提交', moves: [['record', 1], ['replay', 1], 6, ['diagnosis', 2], ['submit', 1]], verify: s => s.input.record === 1 && s.memory.last === 1 && (s.memory.correct & 2) !== 0 && reads(s, { 门缝: 1000, 本段曾受阻: 1, 锁反馈: 0 }) },
  ],
}

const phaseNames = ['主路绿', '主路黄', '双红待支路', '支路绿', '支路黄', '双红待主路']

function advancePhases(m: Values, u: Values, dt: number): void {
  let remaining = dt
  for (;;) {
    const stage = m.phase
    const duration = stage === 0 ? 4 : stage === 3 ? u.sideTime : 2
    const clearance = stage === 2 || stage === 5
    const mayEnd = (stage !== 0 || m.call === 1) && (!clearance || u.clear === 0)
    if (!mayEnd || m.age + remaining < duration - epsilon) {
      m.age += remaining
      if (clearance && u.clear !== 0 && m.age > duration + epsilon) m.held = 1
      return
    }
    remaining = Math.max(0, remaining - Math.max(0, duration - m.age))
    m.age = 0
    m.phase = (stage + 1) % 6
    if (m.phase === 3) { m.call = 0; m.served++ }
    if (m.phase === 0) m.cycles++
    if (remaining < epsilon) return
  }
}

export const signals: Lesson = {
  id: 41, title: '道路信号相位', prerequisites: [8, 13], device: devices[41], review: true,
  context: '支路来了第一辆车，主路绿灯仍然维持。控制器记下请求，要等当前相位与清空阶段结束。',
  question: '支路请求、主路黄灯、双红和清空证据怎样一起决定第一次支路绿灯？',
  task: '在抽象路口生成支路需求，追踪互斥放行。保留请求并让清空证据暂缺，再观察支路何时获准。',
  controls: [
    button('request', '记录一辆支路来车'),
    choice('clear', '冲突区清空记录', 0, '已清空', '仍占用', '数据缺失'),
    range('sideTime', '支路绿灯教学时长', 3, 3, 8, 1, 's'),
  ],
  parts: [
    part('支路车辆检测面', '将一次来车存为待服务请求。', 'request', 1),
    part('冲突区占用窗', '回放仍占用的记录，观察双红保持。', 'clear', 1),
    part('控制器相位时钟', '改变支路服务时长，观察返回主路的时刻。', 'sideTime', 5),
  ],
  initialMemory: { phase: 0, age: 0, call: 0, served: 0, cycles: 0, held: 0 },
  advance(m, u, _before, action, dt) {
    if (action === 'request' && m.phase !== 3) m.call = 1
    advancePhases(m, u, dt)
    return m
  },
  sample(u, m) {
    const bothRed = m.phase === 2 || m.phase === 5
    return {
      meters: [['待服务请求', m.call, '有=1'], ['本阶段已过', m.age, 's'], ['双红', Number(bothRed), '是=1'], ['已返回主路', m.cycles, '次'],
        ['南北主路绿', Number(m.phase === 0), '亮=1'], ['南北主路黄', Number(m.phase === 1), '亮=1'], ['南北主路红', Number(m.phase > 1), '亮=1'],
        ['东西支路绿', Number(m.phase === 3), '亮=1'], ['东西支路黄', Number(m.phase === 4), '亮=1'], ['东西支路红', Number(m.phase !== 3 && m.phase !== 4), '亮=1']],
      active: active(m.call, u.clear === 0, true, m.phase === 0 || m.phase === 1, bothRed, m.phase === 3 || m.phase === 4),
      note: phaseNames[m.phase] + '。' + (bothRed && u.clear ? '清空记录尚未成立，互斥方向保持红灯。' : m.call ? '支路请求已保存。重复来车合并到本次服务。' : '相位时钟与请求记录可分别读取。'),
    }
  },
  diagram: graph(['支路来车记忆', '清空记录', '相位状态机', '主路灯组', '双红间隔', '支路灯组'], [[0, 2], [1, 2], [2, 3], [2, 4], [2, 5], [4, 2]]),
  prediction: quiz('在主路绿灯刚开始就记录支路来车。冲突区已清空，支路最快何时转绿？', ['立刻', '第 8 s', '第 4 s'], 1, '需先满足 4 s 主路最短绿，再经过 2 s 黄灯和 2 s 双红。'),
  explanation: quiz('双红已持续 4 s，请求仍为 1。哪项证据能解释继续等待？', ['请求必须一直按着', '支路时长设成了 3 s', '冲突区清空记录仍然缺失'], 2, '本模型要求最低双红时长和清空信息同时满足。'),
  comic: strip([
    '支路来车了，主路为何还绿着？我再点一次会快一点吗？', '看请求位，第一次已经被记住。主路刚开始的四秒仍然要走完。',
    '四秒一到，亮的是主路黄灯。支路继续等。', '黄灯结束还要双红。看那两个绿灯位，在这段时间都为零。',
    '我把清空记录换成“数据缺失”。双红满两秒了，还停在那里。', '你保留了需求，却少了放行所需的证据。恢复清空记录后再看相位。',
    '换成较长的支路绿灯，首个放行时刻相同，受影响的是主路何时重新转绿。',
  ], [0, 2, 2, 1, 1, 0, 2]),
  goals: [
    { text: '保持清空记录正常，点一次支路来车，推进到第 8 s，使支路首次转绿。', check: s => s.memory.served === 1 && s.memory.phase === 3 },
    { text: '保持默认 3 s 支路绿，再推进 7 s，观察经过支路黄灯和双红后返回主路。', check: s => s.memory.cycles > 0 && s.memory.phase === 0 },
  ],
  practice: [['request', 1], 8, 7],
  assumptions: '抽象为一个主路和一个支路，不含行人、转向、协调控制或设备实际配置。4 s、2 s、2 s 以及附加清空条件均属教学状态机。事件不接入道路设备，数值不可用于道路配时。',
  trials: [
    { name: '正常 · 一次请求取得通行', moves: [['request', 1], 8.5], verify: s => reads(s, { 南北主路红: 1, 东西支路绿: 1, 本阶段已过: 0.5, 待服务请求: 0 }) },
    { name: '误操作 · 重复请求催绿', moves: [['request', 1], 2, ['request', 1], 3], verify: s => reads(s, { 南北主路黄: 1, 本阶段已过: 1, 待服务请求: 1, 东西支路红: 1 }) },
    { name: '故障与恢复 · 清空记录缺失后恢复', moves: [['clear', 2], ['request', 1], 10, ['clear', 0]], verify: s => s.memory.held === 1 && reads(s, { 东西支路绿: 1, 南北主路红: 1, 本阶段已过: 0 }) },
    { name: '迁移 · 把支路绿延到 5 s，首车请求后在第 17 s 完成一轮并返回主路', moves: [['sideTime', 5], ['request', 1], 17], verify: s => s.input.sideTime === 5 && near(s.time, 17) && reads(s, { 南北主路绿: 1, 东西支路红: 1, 已返回主路: 1, 本阶段已过: 0 }) },
  ],
}

function brakingFlow(u: Values, storedWh: number) {
  const train = Math.min(u.brake, u.train)
  const surplus = u.brake - train
  const canStore = !u.isolated && storedWh < 300 - epsilon
  const store = canStore ? Math.min(surplus, 180) : 0
  const dissipated = surplus - store
  const voltage = surplus === 0 ? 750 : canStore ? 750 + 100 * Math.min(1, surplus / 180) : 850
  return { train, store, dissipated, voltage }
}

export const regeneration: Lesson = {
  id: 42, title: '轨道再生制动接收度', prerequisites: [29, 35], device: devices[42], review: true,
  context: '同一列车进站时，有时恰逢邻车加速，有时线路很空。电压表读到相近电压，真正被利用的能量却可能不同。',
  question: '附近列车、站旁缓冲储能和车载耗散分别分到多少功率？储能窗口装满的那一刻会怎样？',
  task: '先制造超过邻车需求的制动，再用累计能量和电压信号查清剩余能量的去向。',
  controls: [
    range('brake', '制动可供电功率', 0, 0, 800, 20, 'kW'),
    range('train', '邻车牵引需求', 200, 0, 600, 20, 'kW'),
    choice('isolated', '站旁接收支路工况', 0, '窗口可用', '支路不可用'),
  ],
  parts: [
    part('制动车功率口', '改变这列车能向直流侧提供的功率。', 'brake', 600),
    part('邻车受电端', '增减同时段的牵引需求。', 'train', 400),
    part('站旁储能接收口', '支路不可用时，余量进入车载耗散。', 'isolated', 1),
    part('DVL 1000 测量窗', '调入 200 kW 制动对照工况，读取一次电压和二次电流。', 'brake', 200),
  ],
  initialMemory: { stored: 100, trainWh: 0, heatWh: 0, brakeWh: 0 },
  advance(m, u, _before, _action, dt) {
    const f = brakingFlow(u, m.stored)
    const factor = dt / 3.6
    const added = Math.min(300 - m.stored, f.store * factor)
    m.stored = Math.min(300, m.stored + added)
    m.trainWh += f.train * factor
    m.brakeWh += u.brake * factor
    m.heatWh += (u.brake - f.train) * factor - added
    return m
  },
  sample(u, m) {
    const f = brakingFlow(u, m.stored)
    const accepted = f.train + f.store
    const cap = u.train + (!u.isolated && m.stored < 300 - epsilon ? 180 : 0)
    return {
      meters: [['邻车吸收', f.train, 'kW'], ['站旁吸收', f.store, 'kW'], ['车载耗散', f.dissipated, 'kW'], ['接收比例', u.brake ? 100 * accepted / u.brake : 0, '%'], ['直流电压', f.voltage, 'V'], ['二次电流', f.voltage * 0.05, 'mA'], ['窗口已存', m.stored, 'Wh'], ['邻车累计', m.trainWh, 'Wh'], ['耗散累计', m.heatWh, 'Wh']],
      active: active(u.brake > 0, true, f.train > 0, f.store > 0, f.dissipated > 0, true),
      note: m.stored >= 300 - epsilon ? '接收窗口已满。此后制动功率中超过邻车需求的部分全部计入耗散。' : f.dissipated > 0 ? '邻车需求和可用接收功率均有限，剩余功率由车载耗散平衡。' : '对照二次电流和功率分配。电压变送器只反映电压。',
      plots: [curve('保持当前接收条件时的制动功率利用曲线', '可供制动功率 / kW', '线路接收 / kW', [...new Set([0, cap, 800])].sort((a, b) => a - b), p => Math.min(p, cap))],
    }
  },
  diagram: graph(['制动车直流侧', '线路母线', '邻车牵引', '站旁缓冲储能', '车载耗散', '隔离电压测量'], [[0, 1], [1, 2], [1, 3], [0, 4], [1, 5]]),
  prediction: quiz('制动 600 kW、邻车需 200 kW，站旁可收 180 kW。窗口尚有空间时，有多少功率需要耗散？', ['420 kW', '220 kW', '400 kW'], 1, '600 − 200 − 180 = 220 kW。'),
  explanation: quiz('DVL 都读到 42.5 mA，两次耗散功率却不同，怎样解释？', ['二次电流代表制动电流', '读数一样说明吸收能量一样', '变送器给出电压，功率分流和持续时间还要另查'], 2, '电压到达教学钳位值后，多个吸收组合可以有相同的电压。'),
  comic: strip([
    '刹车表上有 600 kW，我能把这 600 都记成节电吗？', '先找受电者。邻车只要 200 kW，站旁缓冲口此刻最多再收 180。',
    '那剩下 220 kW 落在哪？我看到耗散表增长了。', '看储能窗口，它从 100 Wh 涨到 300 Wh 后装满。随后耗散还会再增。',
    '两个时刻的二次电流都是 42.5 mA。表怎么没动？', '这只 LEM 测电压，850 V 对应 42.5 mA。要比较能量，得看各条功率支路再乘时间。',
    '换到另一站，我会先查旁边有没有正在加速的车。一列车能制动多少，与线路能收多少要分别记账。',
  ], [0, 1, 2, 2, 3, 3, 1]),
  goals: [
    { text: '保持邻车 200 kW、站旁可用，调制动至 600 kW，推进 1 s，使站旁吸收 180 kW 且已有储能增量。', check: s => s.memory.stored > 100 && reads(s, { 邻车吸收: 200, 站旁吸收: 180, 车载耗散: 220 }) },
    { text: '继续保持上述制动，推进至少 3 s，等窗口达到 300 Wh，观察车载耗散升到 400 kW。', check: s => reads(s, { 窗口已存: 300, 站旁吸收: 0, 车载耗散: 400 }) },
  ],
  practice: [['brake', 600], 1, 3],
  assumptions: '功率先供邻车，再供站旁，余量由车载耗散承担。课堂窗口 100–300 Wh，吸收上限 180 kW，忽略损耗。邻车吸收段按 750 V，剩余功率在可用缓冲段按线性斜率升至 850 V 钳位。制动机械过程及保护定值未建模；LEM 只提供电压测量参考。',
  trials: [
    { name: '正常 · 邻车全收', moves: [['train', 400], ['brake', 300], 3], verify: s => reads(s, { 邻车累计: 250, 耗散累计: 0, 二次电流: 37.5, 接收比例: 100 }) },
    { name: '误操作 · 将可制动功率当作回收量', moves: [['isolated', 1], ['train', 100], ['brake', 500], 2], verify: s => reads(s, { 接收比例: 20, 耗散累计: 222.2222, 车载耗散: 400 }) },
    { name: '故障与恢复 · 站旁恢复接收', moves: [['train', 220], ['brake', 400], ['isolated', 1], 2, ['isolated', 0], 1], verify: s => reads(s, { 窗口已存: 150, 耗散累计: 100, 站旁吸收: 180, 车载耗散: 0 }) },
    { name: '迁移 · 邻车 100 kW、制动 400 kW 持续 5 s，让窗口满至 300 Wh 并核出耗散约 216.67 Wh', moves: [['train', 100], ['brake', 400], 5], verify: s => s.input.train === 100 && s.input.brake === 400 && near(s.time, 5) && reads(s, { 窗口已存: 300, 耗散累计: 216.6667, 邻车累计: 138.8889, 车载耗散: 300 }) },
  ],
}
