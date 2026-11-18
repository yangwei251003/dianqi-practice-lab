import { button, choice, graph, near, part, quiz, range, strip } from '../../core/types'
import type { Lesson, Values } from '../../core/types'
import { plot, reading, series } from './common'
import type { Point } from './common'

const onBoardLimits = [10, 16, 32]

function pilotState(i: Values, m: Values) {
  if (!i.plug) return { name: 'A', high: 12, pwm: false }
  if (i.fault) return { name: 'E', high: 0, pwm: false }
  if (!i.offer) return { name: 'B1', high: 9, pwm: false }
  if (!m.ready) return { name: 'B2', high: 9, pwm: true }
  return { name: 'C', high: 6, pwm: true }
}
function carCurrent(i: Values, m: Values) {
  return pilotState(i, m).name === 'C' ? Math.min(0.6 * i.pilot, onBoardLimits[i.car]) : 0
}
function cpWave(high: number, pwm: boolean, fraction: number): Point[] {
  if (!pwm) return [[0, high], [2, high]]
  const points: Point[] = []
  for (let start = 0; start < 2; start++) {
    const edge = start + fraction
    points.push([start, high], [edge, high], [edge, -12], [start + 1, -12])
  }
  return points
}

export const charging: Lesson = {
  id: 36, title: '交流充电握手与导引限流', prerequisites: [28],
  context: '车位已识别车辆，电表仍是零。观察桩侧导引的高电平、占空比和车载充电机的取流，重建一次会话的先后顺序。',
  question: '桩能宣告 24 A，车为什么可能只取 16 A，甚至一安培也不取？',
  task: '先建立 B2 等待状态，确认有导引而无取流，再提交车端就绪，比较车辆和场站两侧的电流上限。',
  device: {
    maker: 'Texas Instruments', model: 'TIDA-010939', name: '电动汽车供电设备前端控制器参考板', form: 'board',
    url: 'https://www.ti.com/lit/ug/tidufe6a/tidufe6a.pdf', document: 'Electric Vehicle Supply Equipment Front-End Controller Reference Design',
    locator: 'TIDUFE6A，2025-12 修订，§2.2.1.2 式 (1)、§2.2.1.3 表 2-3 导引状态及 §2.2.1.4 模拟前端。',
    features: ['参考设计采用 IEC 61851 / SAE J1772 导引。微控制器生成 PWM 并检测 CP 电平，可识别 A、B1、B2、C 等状态。', '交流基本导引在 10%–85% 的适用区间按 0.6 A/百分数宣告上限，B2 与 C 的 PWM 频率为 1 kHz。'],
  },
  controls: [choice('plug', '虚拟连接', 0, '未连接', '车辆已连接'), choice('offer', '场站供能条件', 1, '未就绪', '允许宣告'),
    range('pilot', '桩端导引占空比', 20, 10, 50, 5, '%'), choice('car', '车载充电机能力', 1, '10 A', '16 A', '32 A'),
    button('request', '车端提交就绪'), choice('fault', '导引观测', 0, '正常', '异常 E')],
  parts: [part('车辆就绪请求', '向当前会话提交车端就绪。缺少连接或有效导引时无法开始取流。', 'request', 1),
    part('场站 CP 发送器', '设 40% 占空比，车辆可读到 24 A 上限。', 'pilot', 40),
    part('虚拟车辆插接状态', '选择已连接，观察 CP 高电平由 12 V 变为 9 V。', 'plug', 1),
    part('导引采样通道', '模拟 E 状态，观察当前会话撤销取流。', 'fault', 1),
    part('车载充电机', '将车端能力改成 10 A，比较宣告值与实取值。', 'car', 0)],
  diagram: graph(['场站供能条件', '桩端 CP', '车辆识别', '车端就绪', '交流电源', '车载充电机', '动力电池', '车辆能力'], [[0, 1], [1, 2], [2, 3], [3, 1], [1, 5], [3, 5], [4, 5], [7, 5], [5, 6]]),
  initialMemory: { ready: 0, refusals: 0, seenB2: 0, lostSession: 0, wattHours: 0 },
  advance: (m, i, _before, action, dt) => {
    if (!i.plug || !i.offer || i.fault) {
      if (m.ready && i.fault) m.lostSession = 1
      m.ready = 0
    }
    if (action === 'request') {
      if (i.plug && i.offer && !i.fault) m.ready = 1
      else m.refusals++
    }
    if (pilotState(i, m).name === 'B2') m.seenB2 = 1
    m.wattHours += 230 * carCurrent(i, m) * dt / 3600
    return m
  },
  sample: (i, m) => {
    const state = pilotState(i, m)
    const amps = carCurrent(i, m)
    const ceiling = state.pwm ? 0.6 * i.pilot : 0
    const labels: Record<string, string> = {
      A: 'A · 车辆未连接，导引为直流电平。',
      B1: 'B1 · 车辆已连接，场站尚未宣告可用电流。',
      B2: 'B2 · 桩已发出电流上限，仍等待本次会话的车端就绪。',
      C: 'C · 车辆取流受导引上限与车载充电机能力共同约束。',
      E: 'E · 导引异常，本次取流取消。恢复正常后需在新握手中重新提交车端就绪。',
    }
    return {
      meters: [['CP 高电平', state.high, 'V'], ['桩宣告上限', ceiling, 'A'], ['实际充电电流', amps, 'A'],
        ['交流充电功率', 230 * amps / 1000, 'kW'], ['本次练习累计电能', m.wattHours, 'Wh']],
      active: state.name === 'C' ? [0, 1, 2, 3, 4, 5, 6, 7] : state.name === 'B2' ? [0, 1, 2, 7] : state.name === 'B1' ? [1, 2] : [1],
      note: labels[state.name],
      plots: [plot('CP 电平 · 两毫秒窗口', '时间 / ms', '导引电压 / V', cpWave(state.high, state.pwm, i.pilot / 100)),
        plot('保持当前会话时的占空比与车辆取流', '桩端占空比 / %', '交流电流 / A',
          series(40, 80, offset => state.name === 'C' ? Math.min(0.6 * (10 + offset), onBoardLimits[i.car]) : 0).map(([x, y]) => [10 + x, y]))],
    }
  },
  prediction: quiz('车辆已连接，CP 为 +9/−12 V 的 1 kHz PWM，目前处于 B2。表计会如何？', ['车必定按宣告上限取流', '可读到宣告上限，车端还未提交就绪时取流为零', '所有 PWM 都表示导引故障'], 1, 'B2 允许车辆读桩的能力，本课的车载充电机会在本次会话的就绪条件成立后才取流。'),
  explanation: quiz('40% 导引、车端能力 16 A，交流功率因数按 1 计算，230 V 下取多少功率？', ['5.52 kW', '9.20 kW', '3.68 kW'], 2, '桩宣告 0.6×40=24 A，车载充电机限制为 16 A，实际功率为 230×16=3680 W。'),
  comic: strip(['车位显示已连接，桩端也有 PWM，电表为什么还是零？', '看导引高电平。9 V 对应 B 态，桩在宣告能力，车还没提交就绪。',
    '我提交车端就绪，导引高电平变成 6 V，电表开始走。', '把桩端占空比拨到 40%。宣告 24 A，车的表却只到 16 A。',
    '原来还受车载充电机限制。模拟一次导引异常，电流马上归零。', '恢复信号后还在 B2。重新握手才恢复取流，下一次分析“有桩无电流”时，先辨认是哪一方还在等待。'], [2, 1, 0, 4, 3, 0]),
  goals: [
    { text: '保留场站允许宣告，选择“车辆已连接”，在 B2 读到 9 V、12 A 宣告值和零实际电流。', check: s => reading(s, 'CP 高电平') === 9 && reading(s, '桩宣告上限') === 12 && reading(s, '实际充电电流') === 0 },
    { text: '将桩端占空比设为 40%，保留 16 A 车载能力，点“车端提交就绪”，看到 6 V 和 3.68 kW。', check: s => !!s.memory.seenB2 && reading(s, 'CP 高电平') === 6 && reading(s, '桩宣告上限') === 24 && near(reading(s, '交流充电功率'), 3.68) },
  ],
  assumptions: '仅模拟交流基本导引 A/B1/B2/C/E 的电平、车辆取流与理想计量。端口状态是虚拟输入。单相 230 V，功率因数 1，取用占空比 10%–50%。不模拟机械触点时序、数字通信、绝缘测试或车辆电池化学过程。', review: true,
  trials: [
    { name: '正常 · 先识别后取流', moves: [['plug', 1], ['pilot', 40], ['request', 1]], verify: s => reading(s, 'CP 高电平') === 6 && reading(s, '桩宣告上限') === 24 && near(reading(s, '交流充电功率'), 3.68) },
    { name: '误操作 · 未宣告就绪便提交请求', moves: [['offer', 0], ['plug', 1], ['request', 1], 1], verify: s => s.memory.refusals === 1 && reading(s, 'CP 高电平') === 9 && reading(s, '桩宣告上限') === 0 && reading(s, '本次练习累计电能') === 0 },
    { name: '故障与恢复 · 导引故障撤销原会话', moves: [['plug', 1], ['request', 1], ['fault', 1], ['request', 1], ['fault', 0], ['request', 1]], verify: s => !!s.memory.lostSession && s.memory.refusals === 1 && reading(s, '实际充电电流') === 12 && near(reading(s, '交流充电功率'), 2.76) },
    { name: '迁移 · 32 A 车接 30% 导引，持续取流 10 秒，核对 18 A 和 11.5 Wh', moves: [['plug', 1], ['pilot', 30], ['car', 2], ['request', 1], 10], verify: s => reading(s, '实际充电电流') === 18 && near(reading(s, '本次练习累计电能'), 11.5) && near(reading(s, '交流充电功率'), 4.14) },
  ],
}
