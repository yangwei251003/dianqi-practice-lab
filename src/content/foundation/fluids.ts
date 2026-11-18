import { button, choice, graph, part, quiz, range, strip } from '../../core/types'
import type { Lesson, Values } from '../../core/types'
import { active, curve, reads } from './common'

export const variableFan: Lesson = {
  id: 11, title: '变频风机', prerequisites: [7, 10],
  context: '展厅夜间只需一半风量。值班记录员把频率给定从 50 改成 25 Hz，想知道风量何时到位、轴功率还剩多少。',
  question: '频率给定、斜坡中的输出频率和风量哪个先变？半风量是否等于半功率？',
  task: '使模型达到基准工况，再减速到半风量。用实际输出频率解释压差和轴功率的变化。',
  device: {
    maker: 'Schneider Electric', model: 'Altivar Machine ATV320U15N4C', name: '紧凑型交流变频器', form: 'drive',
    url: 'https://shop.se.com/pro/us/en/product/variable-speed-drive-altivar-machine-atv320-1-5kw-380-to-500v-3-phases-compact/',
    document: 'ATV320U15N4C · Altivar Machine variable speed drive', locator: '型号页 Main 和 Motor power。外形据同型号 Product datasheet 的 Width / Height / Depth，斜坡据 NVE41295 的 ACC / dEC，查阅 2026-11-18。',
    features: ['三相 380～500 V，重载额定功率 1.5 kW', '紧凑型控制单元，适配异步电机', '机体高 142 mm，装 EMC 板后为 188 mm'], dimensions: [105, 142, 158],
  },
  controls: [range('setpoint', '频率给定', 50, 0, 50, 5, 'Hz'), range('limit', '输出频率上限', 50, 20, 50, 5, 'Hz'),
    range('ramp', '零至 50 Hz 的斜坡时间', 4, 2, 10, 1, 's'),
    button('run', '发出运行请求'), button('stop', '斜坡停止'),
    choice('permit', '外部工艺许可', 0, '允许', '撤销许可')],
  parts: [
    part('频率给定旋钮', '选择操作者期望的频率，观察驱动输出追随设定。', 'setpoint'),
    part('斜坡时间窗', '按从零到额定频率的时间换算加减速度。', 'ramp'),
    part('运行命令端', '工艺许可有效时才接受新的脉冲命令。', 'run'),
    part('上限设置窗', '实际目标取给定频率与上限两者中较低者。', 'limit'),
    part('工艺许可触点', '撤销外部运行许可，进入本场景的受控减速过程。', 'permit'),
  ],
  initialMemory: { run: 0, hz: 0 },
  advance(m, i, _old, action, dt) {
    if (action === 'run' && !i.permit) m.run = 1
    if (action === 'stop' || i.permit) m.run = 0
    const target = m.run ? Math.min(i.setpoint, i.limit) : 0
    m.hz += Math.sign(target - m.hz) * Math.min(Math.abs(target - m.hz), dt * 50 / i.ramp)
    return m
  },
  sample(i, m) {
    const ratio = m.hz / 50, target = m.run ? Math.min(i.setpoint, i.limit) : 0
    const tracking = Math.abs(target - m.hz) > 0.001
    const note = i.permit ? '工艺许可撤销，运行命令清除。许可恢复后需新的运行请求。' :
      !m.run ? (m.hz > 0 ? '停止已受理，输出频率正在下降。' : '等待运行请求。') :
      tracking ? '输出正沿斜坡接近有效目标，风量按实际输出计算。' :
      i.limit < i.setpoint ? '已到输出上限。提高给定不会越过该上限。' : '风量与转速成正比，压差随转速平方变化，轴功率随立方变化。'
    return { meters: [['有效目标', target, 'Hz'], ['输出频率', m.hz, 'Hz'], ['风机转速', 1470 * ratio, 'r/min'], ['风量', 6000 * ratio, 'm³/h'], ['风机压差', 400 * ratio ** 2, 'Pa'], ['风机轴功率', 1.2 * ratio ** 3, 'kW']],
      active: active(!i.permit, m.run, m.run, tracking, m.hz > 0, m.hz > 0, m.hz > 0),
      note, plots: [curve('同一管网的风机轴功率', '输出频率 / Hz', '轴功率 / kW', 50, f => 1.2 * (f / 50) ** 3)],
    }
  },
  diagram: graph(['工艺许可', '运行命令', '限幅后目标', '加减速斜坡', '电机频率', '叶轮风量', '压差与轴功率'], [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [4, 6], [5, 6]]),
  prediction: quiz('管网特性不变，实际频率稳定在 25 Hz。相对 50 Hz，轴功率约剩多少？', ['1/2', '1/4', '1/8'], 2, '同一相似工况下 P/P₀=(n/n₀)³，转速减半后轴功率为八分之一。'),
  explanation: quiz('给定 50 Hz、输出稳定 35 Hz、上限也是 35 Hz。哪项解释符合现象？', ['输出受到限幅', '风机把频率倒送回去了', '只要再等就必到 50 Hz'], 0, '斜坡趋近有效目标，限幅已经把目标约束在 35 Hz。'),
  comic: strip([
    '我把给定拨到 50，风量窗怎么还停在零？',
    '命令和给定各管一件事。接受运行请求后，输出还得沿斜坡爬升。',
    '四秒后到了 6000 m³/h。现在把目标减半，我猜轴功率也减半。',
    '等输出真的到 25 Hz 再读，压差 100 Pa、轴功率只有 0.15 kW。',
    '风量变一半、压差变四分之一，乘起来就是八分之一！',
    '再给 50 Hz、把上限设在 35 Hz。现在等得再久，输出也会守在上限。',
    '核对一张节能报表时，我会找轴功率和实际运行频率，再看电网输入还包含哪些损耗。',
  ], [0, 2, 1, 0, 1, 3, 4]),
  goals: [
    { text: '默认给定、上限 50 Hz，发运行请求并推进 4 s，读到基准风量 6000 m³/h。', check: s => !!s.memory.run && reads(s, '风量', 6000) },
    { text: '保持运行，将给定调为 25 Hz，推进 2 s，得到半风量 3000 m³/h、轴功率 0.15 kW。', check: s => s.input.setpoint === 25 && reads(s, '输出频率', 25) && reads(s, '风机轴功率', 0.15) },
  ],
  assumptions: '教学风机在 50 Hz 时为 1470 r/min、6000 m³/h、400 Pa、轴功率 1.2 kW。气体密度、叶轮与纯阻型管网保持一致，近似转速正比于输出频率，忽略额外转动惯性、变频器和电机损耗。上/下坡等时，工艺许可触发普通受控减速。',
  review: true,
  trials: [
    { name: '正常', moves: [['run', 1], 4, ['setpoint', 25], 2], verify: s => reads(s, '输出频率', 25) && reads(s, '风量', 3000) && reads(s, '风机压差', 100) && reads(s, '风机轴功率', 0.15) },
    { name: '误操作', moves: [['ramp', 10], ['run', 1], 1], verify: s => reads(s, '有效目标', 50) && reads(s, '输出频率', 5) && reads(s, '风量', 600) && reads(s, '风机轴功率', 0.0012, 0.00001) },
    { name: '故障与恢复', moves: [['run', 1], 4, ['permit', 1], 4, ['permit', 0], 1, ['run', 1], 1], verify: s => reads(s, '输出频率', 12.5) && reads(s, '风量', 1500) && reads(s, '风机压差', 25) },
    { name: '迁移｜给定 50 Hz、上限 35 Hz，得到 4200 m³/h、约 0.412 kW', moves: [['limit', 35], ['run', 1], 4], verify: s => s.input.setpoint === 50 && s.input.limit === 35 && reads(s, '风量', 4200) && reads(s, '风机轴功率', 0.4116) },
  ],
}

// Read from Taco's 60 Hz chart, curve 5. Digitization resolution is roughly 0.1 ft.
const chartPoints = [[0, 9.8], [4, 9.1], [8, 8.0], [12, 6.5], [16, 4.6], [20, 2.2], [23, 0]]
const pumpCurve: [number, number][] = chartPoints.map(([gpm, ft]) => [gpm * 0.22712470704, ft * 0.3048])
const maxFlow = pumpCurve[pumpCurve.length - 1][0]
function pumpHead(flow: number) {
  for (let index = 1; index < pumpCurve.length; index++) {
    const [q, h] = pumpCurve[index], [q0, h0] = pumpCurve[index - 1]
    if (flow <= q) return h0 + (h - h0) * (flow - q0) / (q - q0)
  }
  return 0
}

function operatingPoint(i: Values) {
  const speedRatio = i.rig === 1 ? [0.70, 0.85, 1][i.speed] : 1
  const mainK = 0.12 + 0.12 / (i.valve / 100) ** 2 + 0.55 * i.clog
  const bypassK = 0.8
  const conductance = 1 / Math.sqrt(mainK) + i.bypass / Math.sqrt(bypassK)
  const systemK = 1 / conductance ** 2
  const headAt = (q: number) => speedRatio ** 2 * pumpHead(q / speedRatio)
  let low = 0, high = maxFlow * speedRatio
  // One decreasing pump curve, one increasing system curve, exactly one intersection.
  for (let n = 0; n < 38; n++) {
    const q = (low + high) / 2
    if (headAt(q) > systemK * q ** 2) low = q
    else high = q
  }
  const flow = i.motor ? (low + high) / 2 : 0
  const head = systemK * flow ** 2
  return { flow, head, main: Math.sqrt(head / mainK), bypass: i.bypass * Math.sqrt(head / bypassK), systemK, speedRatio, headAt }
}

export const centrifugalPump: Lesson = {
  id: 12, title: '离心水泵运行点', prerequisites: [10],
  context: '采暖盘管只需约 1.98 m³/h。原厂定速泵用节流达到目标，旁边的独立虚拟相似泵台可以降速。两份记录的流量相近，扬程却很不一样。',
  question: '同样送出约 1.98 m³/h，节流改变哪条曲线，降速又改变哪条曲线？',
  task: '比较定速泵节流与独立相似泵台减速的运行点，再开旁通，核对总流量和末端得到的份额。',
  device: {
    maker: 'Taco Comfort Solutions', model: '007-F5', name: '湿转子单级离心循环泵', form: 'pump',
    url: 'https://www.tacocomfort.com/documents/FileLibrary/100-1.8.pdf',
    document: 'Model 007 Cartridge Circulator · Submittal Data #101-029',
    locator: '2024-12-10，第 2 页 007-F5、Materials of Construction、Performance Field – 60Hz 曲线 ⑤（007）',
    features: ['铸铁法兰泵体，湿转子直联单级结构', '非金属叶轮、陶瓷轴和碳轴承', '60 Hz 图给出 007 专用曲线，标注最大流量 23 US gpm、最大扬程 10 ft'],
  },
  controls: [choice('rig', '试验对象', 0, '007-F5 定速参考泵', '独立虚拟相似泵台'),
    choice('speed', '仅相似泵台的转速比', 2, '70%', '85%', '100%'),
    choice('motor', '计算工况', 0, '停泵', '运行'),
    range('valve', '末端阀虚拟开度', 100, 20, 100, 5, '%'),
    choice('bypass', '并联旁通', 0, '关闭', '打开'), choice('clog', '末端滤网', 0, '洁净', '模拟积垢')],
  parts: [
    part('循环泵叶轮', '在所选对象的泵曲线与管网曲线之间寻找平衡点。', 'motor'),
    part('盘管支路阀', '改变末端支路的水力阻力，使运行点沿泵曲线移动。', 'valve'),
    part('并联旁通节点', '旁通与盘管承受相同压差，流量分配由各支路阻力决定。', 'bypass'),
    part('末端滤网窗', '模拟滤网积垢，在同一开度下比较额外阻力的影响。', 'clog'),
    part('独立相似泵台', '切换到单独的教学泵台。007-F5 参考泵始终采用 60 Hz 原曲线。', 'rig', 1),
    part('教学转速选择器', '仅作用于相似泵台。流量轴按转速比 r、扬程轴按 r² 缩放。', 'speed'),
  ],
  sample(i) {
    const p = operatingPoint(i)
    const identity = i.rig === 0 ? '007-F5 定速参考泵，采用原厂 60 Hz 曲线。' : '独立虚拟相似泵台，转速比 ' + Math.round(p.speedRatio * 100) + '%。'
    const note = !i.motor ? '停泵静止，图线给出所选对象启动后的预计交点。' :
      i.bypass ? '旁通和末端分担总流量。泵扬程等于两支路各自的压降。' :
      i.clog ? '滤网积垢增加末端阻力，运行点移向小流量、较高扬程。' : '闭环没有净静扬程，运行点满足 H泵(Q)=KQ²。'
    return { meters: [['总流量', p.flow, 'm³/h'], ['泵扬程', p.head, 'm'], ['末端流量', p.main, 'm³/h'], ['旁通流量', p.bypass, 'm³/h'], ['水力功率', 1000 * 9.81 * p.head * p.flow / 3600, 'W'], ['曲线转速比', p.speedRatio * 100, '%']],
      active: active(i.motor, i.motor, p.flow > 0, p.main > 0, p.bypass > 0, i.motor, i.clog, i.rig),
      note: identity + note, plots: [
        curve('运行点在扬程差为零处', '总流量 / (m³/h)', '泵扬程减管网压降 / m', maxFlow * p.speedRatio, q => p.headAt(q) - p.systemK * q ** 2),
        { title: i.rig ? '虚拟相似泵台泵曲线 · ' + Math.round(p.speedRatio * 100) + '%' : '007-F5 曲线 ⑤ 近似读点（60 Hz）', x: '总流量 / (m³/h)', y: '泵扬程 / m', points: pumpCurve.map(([q, h]) => [q * p.speedRatio, h * p.speedRatio ** 2]) },
      ],
    }
  },
  diagram: graph(['电机', '叶轮增压', '供水总管', '末端盘管', '旁通', '回水总管', '滤网附加阻力', '相似泵台转速比'], [[0, 1], [1, 2], [2, 3], [2, 4], [3, 5], [4, 5], [5, 1], [6, 3], [7, 1]]),
  prediction: quiz('同转速下打开并联旁通，预计总流量和原末端流量怎么变？', ['都增大', '总流量上升，末端流量下降', '都不变'], 1, '并联降低总阻力，使总流量上升。泵曲线对应的扬程下降，原末端支路的流量因而减少。'),
  explanation: quiz('达到相同流量时，相似泵台全开阀降速比原泵节流所需扬程更小，原因是什么？', ['两次管网损失相同', '额外阀阻已移除，降速又下移了泵曲线', '目录上的最大扬程已经变成静扬程'], 1, '节流抬高系统阻力曲线。全开阀降低阻力，虚拟降速又使泵曲线变为 Hᵣ(Q)=r²H₁(Q/r)，须重新求交。'),
  comic: strip([
    '供暖记录只要求约 1.98 m³/h。定速泵、全开阀，流量却有 2.83。',
    '把这个模型阀调到 50%。管路阻力升高，交点沿原泵曲线向左上移动。',
    '现在流量约 1.98，扬程却升到 2.36 m。我把这对数一起记下。',
    '换到另一台虚拟相似泵，阀全开、转速比 70%。把泵曲线的横坐标乘 0.7、纵坐标乘 0.49。',
    '交点也在约 1.98，但扬程仅 0.94 m。同样送水量，节流的额外压降能从两份记录里读出来。',
    '回到定速原泵、开阀，再开旁通。总管约 3.69，末端仅 2.38，余下的 1.30 走了旁通。',
    '下次核对“流量足够”的报表，我会找运行点、阀位和支路分量，还要记下当时究竟是哪台泵。',
  ], [0, 1, 1, 5, 4, 2, 0]),
  goals: [
    { text: '保持 007-F5 定速参考泵、洁净、末端全开、旁通关闭，选运行，读约 2.83 m³/h、1.92 m。', check: s => !s.input.rig && !s.input.bypass && reads(s, '总流量', 2.82621, 0.002) && reads(s, '泵扬程', 1.917, 0.002) },
    { text: '定速参考泵保持运行，将末端阀设为 50%，读出约 1.98 m³/h、2.36 m。', check: s => !s.input.rig && s.input.valve === 50 && reads(s, '总流量', 1.98143, 0.002) && reads(s, '泵扬程', 2.35565, 0.002) },
    { text: '换独立虚拟相似泵台，阀调回 100%，转速比调到 70%。比较同为约 1.98 m³/h 时的 0.94 m 扬程。', check: s => s.input.rig === 1 && reads(s, '曲线转速比', 70) && reads(s, '总流量', 1.97835, 0.002) && reads(s, '泵扬程', 0.93933, 0.002) },
    { text: '切回 007-F5 定速参考泵，保持阀全开并打开旁通，核对总管约 3.69、末端约 2.38 m³/h。', check: s => !s.input.rig && !!s.input.bypass && reads(s, '总流量', 3.68533, 0.002) && reads(s, '末端流量', 2.38113, 0.002) },
  ],
  assumptions: '007-F5 仅按原厂 60 Hz 曲线 ⑤ 读点并分段插值，零流量扬程约 2.99 m。独立虚拟相似泵台借用该参考曲线，按 Hydraulic Institute《Pump Curves》中的 Affinity Rules，以 Hᵣ(Q)=r²H₁(Q/r) 重新求交。转速比只属于该教学泵台。闭环水密度 1000 kg/m³，净静扬程为零。Q 取 m³/h、H 取 m，末端 K=0.12+0.12/开度比例²，积垢加 0.55，旁通 K=0.8。水力功率为 ρgQH，忽略瞬态与汽蚀。',
  review: true,
  trials: [
    { name: '正常', moves: [['motor', 1], ['valve', 50], ['rig', 1], ['valve', 100], ['speed', 0], ['rig', 0], ['bypass', 1]], verify: s => reads(s, '曲线转速比', 100) && reads(s, '总流量', 3.68533) && reads(s, '泵扬程', 1.36075) && reads(s, '末端流量', 2.38113) && reads(s, '旁通流量', 1.30420) },
    { name: '误操作', moves: [['speed', 0], ['valve', 50], ['motor', 1]], verify: s => reads(s, '曲线转速比', 100) && reads(s, '总流量', 1.98143) && reads(s, '泵扬程', 2.35565) && reads(s, '水力功率', 12.71910) },
    { name: '故障与恢复', moves: [['rig', 1], ['speed', 0], ['motor', 1], ['clog', 1], ['clog', 0]], verify: s => reads(s, '曲线转速比', 70) && reads(s, '末端流量', 1.97835) && reads(s, '泵扬程', 0.93933) && reads(s, '水力功率', 5.06393) },
    { name: '迁移｜相似泵台 85%、末端阀 50%、开旁通，求末端约 1.44、旁通约 1.24 m³/h', moves: [['rig', 1], ['speed', 1], ['valve', 50], ['bypass', 1], ['motor', 1]], verify: s => reads(s, '曲线转速比', 85) && reads(s, '总流量', 2.67791) && reads(s, '末端流量', 1.43509) && reads(s, '旁通流量', 1.24282) && reads(s, '泵扬程', 1.23569) },
  ],
}
