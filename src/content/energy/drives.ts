import { choice, graph, near, part, quiz, range, strip } from '../../core/types'
import type { Lesson, Values } from '../../core/types'
import { clamp, plot, reading, series } from './common'
import type { Point } from './common'

const carrier = 20000
const probePhases = [30, 90, 270]

function bridgeWindow(i: Values, hz: number) {
  const center = probePhases[i.phase] / (360 * hz)
  const period = 1 / carrier
  const points: Point[] = []
  // Symmetric, regular-sampled modified unipolar PWM. Positive and negative half-waves use different diagonals.
  for (let k = 0; k < 5; k++) {
    const start = k * period
    const reference = i.mod / 100 * Math.sin(2 * Math.PI * hz * (center + (k - 2) * period))
    const halfWidth = Math.abs(reference) * period / 2
    const mid = start + period / 2
    const level = Math.sign(reference) * i.bus
    points.push([1e6 * start, 0], [1e6 * (mid - halfWidth), 0], [1e6 * (mid - halfWidth), level],
      [1e6 * (mid + halfWidth), level], [1e6 * (mid + halfWidth), 0], [1e6 * (start + period), 0])
  }
  return points
}

export const inverter: Lesson = {
  id: 28, title: '单相逆变 PWM 与基波', prerequisites: [26],
  context: '应急交流源的桥前是一条直流母线。一个探头看五个载波周期，另一个看完整工频周期，帮助判断负载真正需要的基波。',
  question: '宽度会变的等高脉冲，怎样在两个半周合成幅值可调的交流基波？',
  task: '在 48 V 虚拟母线上得到约 27 V 基波有效值，再到负半周观察同一设定下的开关脉冲。',
  device: {
    maker: 'Texas Instruments', model: 'TIDM-HV-1PH-DCAC', name: '单相电压源逆变参考设计', form: 'drive',
    url: 'https://www.ti.com/lit/ug/tiduay6e/tiduay6e.pdf', document: 'Voltage Source Inverter Reference Design',
    locator: 'TIDUAY6E，2020-03 修订，首页特性、第 2.2.1 节及表 2 的四种开关状态。',
    features: ['一个桥臂按 20 kHz 开关，另一桥臂按输出基频换向。', '电压源模式采用全桥和 LC 输出滤波，桥端的有效电平为正母线、零、负母线。'],
  },
  controls: [range('bus', '缩比直流母线', 48, 24, 48, 6, 'V'), range('mod', '调制比', 50, 20, 100, 5, '%'),
    choice('phase', '载波窗口中心相位', 0, '正半周 30°', '正峰 90°', '负峰 270°'), choice('frequency', '基波频率', 0, '50 Hz', '60 Hz')],
  parts: [part('直流母线电容', '模拟母线跌至 24 V，观察基波可达范围。', 'bus', 24),
    part('C2000 调制器', '将调制比改为 80%，比较脉冲宽度与高度。', 'mod', 80),
    part('全桥差分探头', '把载波放大窗口移到负半周峰值。', 'phase', 2),
    part('输出滤波端', '切换到 60 Hz，观察基波周期。', 'frequency', 1)],
  diagram: graph(['直流母线', '高频桥臂', '工频桥臂', '桥差分输出', 'LC 滤波', '交流负载', '正弦调制器'], [[0, 1], [0, 2], [6, 1], [6, 2], [1, 3], [2, 3], [3, 4], [4, 5]]),
  initialMemory: { positive: 0, sag: 0 },
  advance: (m, i) => { if (i.phase === 1 && i.bus === 48 && i.mod === 80) m.positive = 1; if (i.bus === 24) m.sag = 1; return m },
  sample: i => {
    const hz = i.frequency ? 60 : 50
    const peak = i.bus * i.mod / 100
    const phase = probePhases[i.phase] * Math.PI / 180
    return {
      meters: [['基波有效值', peak / Math.SQRT2, 'V'], ['基波峰值', peak, 'V'], ['桥端脉冲电平', Math.sign(Math.sin(phase)) * i.bus, 'V'],
        ['中心脉宽占比', Math.abs(Math.sin(phase)) * i.mod, '%'], ['基波周期', 1000 / hz, 'ms']],
      active: [0, 1, 2, 3, 4, 5, 6],
      note: i.phase === 2 ? '负半周在 −Vdc 与零之间切换。在滤波后的基波图上，对应负峰附近。' : '正半周在 +Vdc 与零之间切换。脉宽随正弦参考变化，局部平均值描出基波。',
      plots: [plot('桥差分电压 · 相位窗口五个载波周期', '窗口时间 / µs', '电压 / V', bridgeWindow(i, hz)),
        plot('输出的理想基波分量', '一个基波周期 / ms', '电压 / V', series(1000 / hz, 96, ms => peak * Math.sin(2 * Math.PI * hz * ms / 1000)))],
    }
  },
  prediction: quiz('母线固定，正峰处调制比从 50% 提至 80%，哪项变化？', ['载波频率升高', '高电平变为原来的 1.6 倍', '脉冲变宽，基波幅值增大'], 2, '正峰处有效脉宽占比等于调制比。母线电压决定脉冲高度，周期内面积决定局部平均。'),
  explanation: quiz('调制比 80%、母线 48 V 时，为什么交流基波表读约 27.2 V？', ['全桥对半分压后乘以 0.8', '峰值为 38.4 V，正弦有效值还需除以 √2', '载波把所有脉冲都衰减一半'], 1, '在线性区 V₁,pk=mVdc，基波有效值与整段开关波形的总有效值含义不同。'),
  comic: strip(['我把输出调大，桥上的方块怎么还是那么高？', '冻结正峰。母线固定在 48 V，高度由母线决定。把调制比从 50% 拨到 80%。',
    '方块变宽了。回到 30°，它只占载波周期的约四成。', '相位走到 270° 时再看桥的另一条对角通路，脉冲会朝下。',
    '负峰一样能改变面积。基波两个峰的绝对值都是 38.4 V。', '应急负载标的是交流有效值，得用 27.2 V 比对。若母线跌到一半，同样的调制比也只能给一半基波。'], [2, 1, 2, 2, 3, 0]),
  goals: [
    { text: '在 48 V 把调制比调到 80%，选“正峰 90°”，找到约 27.2 V 基波有效值。', check: s => s.input.phase === 1 && near(reading(s, '基波有效值'), 27.15, 0.05) },
    { text: '其他设置不动，选“负峰 270°”，观察 −48 V 脉冲和仍为 80% 的中心脉宽。', check: s => !!s.memory.positive && reading(s, '桥端脉冲电平') === -48 && near(reading(s, '中心脉宽占比'), 80) },
  ],
  practice: [['mod', 80], ['phase', 1], ['phase', 2]],
  assumptions: '只模拟电压源模式的调制，虚拟母线缩为 24–48 V。调制在线性区 0.2–1.0，忽略死区、损耗及 LC 自身的幅相响应。第二幅图为理想基波分量，载波图以所选相位为中心取样。', review: true,
  trials: [
    { name: '正常 · 正峰调宽', moves: [['mod', 80], ['phase', 1]], verify: s => near(reading(s, '基波有效值'), 27.1529, 0.001) && near(reading(s, '中心脉宽占比'), 80) },
    { name: '误操作 · 母线跌落后只提调制比', moves: [['bus', 24], ['mod', 100]], verify: s => near(reading(s, '基波有效值'), 16.9706, 0.001) && near(reading(s, '基波峰值'), 24) },
    { name: '故障与恢复 · 母线恢复后检查正负峰', moves: [['bus', 24], ['bus', 48], ['mod', 80], ['phase', 1], ['phase', 2]], verify: s => !!s.memory.sag && reading(s, '桥端脉冲电平') === -48 && near(reading(s, '基波峰值'), 38.4) },
    { name: '迁移 · 48 V 母线改为 60 Hz，合成峰值 28.8 V 的基波并在 30° 观察脉宽', moves: [['frequency', 1], ['mod', 60]], verify: s => near(reading(s, '基波周期'), 16.6667, 0.001) && near(reading(s, '中心脉宽占比'), 30) && near(reading(s, '基波峰值'), 28.8) },
  ],
}

function motorCurrent(i: Values, omega: number) {
  if (i.mode === 0) return 0
  if (i.mode === 3) return -0.06 * omega / 4
  const applied = (i.mode === 1 ? 12 : -12) * i.duty / 100
  return clamp((applied - 0.06 * omega) / 4, -1.8, 1.8)
}
function motorSpeed(i: Values, start: number, dt: number) {
  if (i.jam) return 0
  let w = start
  const acceleration = (speed: number) => (0.06 * motorCurrent(i, speed) - 0.00018 * speed) / 0.0008
  const count = Math.ceil(dt / 0.01)
  if (!count) return w
  const h = dt / count
  for (let step = 0; step < count; step++) w += h * acceleration(w + h * acceleration(w) / 2)
  return w
}
const rpm = (omega: number) => omega * 30 / Math.PI

export const motor: Lesson = {
  id: 29, title: 'H 桥电机的驱动、滑行与制动', prerequisites: [26, 28],
  context: '分页轮送出标签后要迅速收住。屏幕能保存相同初速度，比较撤掉驱动和电气制动时的轮速与绕组电流。',
  question: '两个输入都低与两个输入都高，看起来都“停机”，为何留下的走纸距离不同？',
  task: '先建立正转速度，再从同一工况观察制动电流和减速，再用卡滞工况识别堵转限流。',
  device: {
    maker: 'Texas Instruments', model: 'DRV8871DDAR', name: '集成限流的有刷直流电机 H 桥芯片', form: 'board',
    url: 'https://www.ti.com/lit/ds/symlink/drv8871.pdf', document: 'DRV8871 Brushed DC Motor Driver With Internal Current Sense',
    locator: 'SLVSCY9B，2016-07 修订，§7.3.1 表 1 H-Bridge Control 及电流路径图，§7.3.3 电流调节。',
    features: ['IN1/IN2 控制四个 MOSFET，可正转、反转、高阻滑行或低侧制动。', '芯片内部检测电流，ILIM 外设电阻决定调节阈值。'],
  },
  controls: [choice('mode', '桥逻辑 IN1 / IN2', 0, '00 滑行', '10 正转', '01 反转', '11 制动'),
    range('duty', '驱动段占空比', 60, 20, 100, 10, '%'), choice('jam', '分页轮状态', 0, '自由转动', '机械卡滞')],
  parts: [part('IN1/IN2 逻辑端', '选择正转，对照转速符号与电流方向。', 'mode', 1), part('低侧续流桥臂', '选 11 制动，旋转电机产生反向绕组电流。', 'mode', 3),
    part('分页轮与轴', '冻结轴模拟卡滞，检查电流是否受限。', 'jam', 1), part('PWM 指令端', '提高驱动占空比，观察起动电流。', 'duty', 100)],
  diagram: graph(['直流源', '逻辑译码', '驱动对角臂', '低侧制动通路', '电枢绕组', '分页轮惯量', '反电动势', '限流检测'], [[0, 2], [1, 2], [1, 3], [2, 4], [3, 4], [4, 3], [4, 5], [5, 6], [6, 4], [4, 7], [7, 2]]),
  initialMemory: { omega: 0, spun: 0, stalled: 0 },
  advance: (m, i, _before, _action, dt) => {
    m.omega = motorSpeed(i, m.omega, dt)
    if (i.mode === 1 && rpm(m.omega) > 800) m.spun = 1
    if (i.jam && Math.abs(motorCurrent(i, 0)) >= 1.79) m.stalled = 1
    return m
  },
  sample: (i, m) => {
    const amps = motorCurrent(i, m.omega)
    let forecast = m.omega
    const points: Point[] = [[0, rpm(forecast)]]
    for (let k = 1; k <= 40; k++) {
      forecast = motorSpeed(i, forecast, 0.05)
      points.push([k * 0.05, rpm(forecast)])
    }
    return {
      meters: [['轴转速', rpm(m.omega), 'r/min'], ['绕组平均电流', amps, 'A'], ['电磁转矩', amps * 60, 'mN·m'], ['反电动势', m.omega * 0.06, 'V']],
      active: i.mode === 0 ? (Math.abs(m.omega) > 0.01 ? [1, 5, 6] : [1]) : i.mode === 3 ? [1, 3, 4, 5, 6] : [0, 1, 2, 4, 5, 6, 7],
      note: i.jam ? '轴被约束在零速，反电动势消失。驱动电流和零转速需要一起解读。' : ['输出高阻，轮轴只受机械黏滞阻力。', '正向平均电压驱动。轮速升高时，反电动势增大，绕组电流下降。', '驱动电压已反向，惯量决定轮轴何时真正反向。', '低侧桥臂形成制动回路，反电动势驱动与原转向相反的转矩。'][i.mode],
      plots: [plot('维持当前指令后的两秒轮速预测', '未来时间 / s', '转速 / r·min⁻¹', points)],
    }
  },
  prediction: quiz('同一初始正转速度，从正转切换到 11 后，绕组电流最先怎样变？', ['反向，产生阻碍原转向的转矩', '立即变成永久零电流', '升到分页轮卡滞时的正向限流值'], 0, '在平均模型中，低侧回路承接由正向反电动势驱动的制动电流，机械转速随后下降。'),
  explanation: quiz('卡滞时看到转速为零却还有 1.8 A，原因是什么？', ['电枢正在向电源发电', '轮速传感器总会失灵', '反电动势为零，驱动受到设定的电流限制'], 2, '驱动电压仍存在，机械约束使轴不转。该工况同时具有电磁转矩和绕组损耗。'),
  comic: strip(['掉标签了！我选了 00，轮子还多走了一截。', '看看电流。00 使输出高阻，断掉驱动力，轮子的动能仍在。',
    '我让它回到同样的正转速度，这次选 11。电流符号为什么反了？', '转动绕组有反电动势，两个低侧器件给它闭合通路，转矩就阻碍原来的转向。',
    '那零转速一定代表电流也为零？我把模拟轮轴卡住，电流竟到 1.8 A。', '用轮速和电流一起判断。标签机要停得准，先比较滑行和制动。诊断卡纸时再去看限流。'], [2, 0, 1, 1, 2, 3]),
  goals: [
    { text: '保持 60% 并选“10 正转”，推进约 2 秒，让转速超过 800 r/min。', check: s => s.input.mode === 1 && reading(s, '轴转速') > 800 },
    { text: '切换到“11 制动”，再推进约 1 秒，看到转速降至 350 r/min 以下且电流为负。', check: s => !!s.memory.spun && s.input.mode === 3 && reading(s, '轴转速') < 350 && reading(s, '绕组平均电流') < 0 },
  ],
  assumptions: '12 V 教学电机，绕组回路 4 Ω，Kt=Ke=0.06（SI），J=0.0008 kg·m²，黏滞系数 0.00018 N·m·s/rad。驱动态平均限流 1.8 A，忽略电枢电感瞬态、齿轮间隙与热，卡滞为理想瞬时约束。', review: true,
  trials: [
    { name: '正常 · 正转后二次制动', moves: [['mode', 1], 2, ['mode', 3], 1], verify: s => !!s.memory.spun && near(reading(s, '轴转速'), 231, 1) && near(reading(s, '绕组平均电流'), -0.363, 0.003) },
    { name: '误操作 · 把滑行当成制动', moves: [['mode', 1], 2, ['mode', 0], 1], verify: s => near(reading(s, '轴转速'), 711, 2) && reading(s, '绕组平均电流') === 0 },
    { name: '故障与恢复 · 卡滞限流后释放', moves: [['jam', 1], ['mode', 1], ['duty', 100], 1, ['duty', 60], ['jam', 0], 2], verify: s => !!s.memory.stalled && near(reading(s, '轴转速'), 891, 2) && near(reading(s, '绕组平均电流'), 0.401, 0.003) },
    { name: '迁移 · 从静止以 60% 反向送料 2 秒，得到约 −891 r/min', moves: [['mode', 2], 2], verify: s => near(reading(s, '轴转速'), -891, 2) && near(reading(s, '反电动势'), -5.597, 0.01) },
  ],
}
