import { choice, graph, near, part, quiz, range, strip } from '../../core/types'
import type { Lesson, Values } from '../../core/types'
import { plot, reading } from './common'
import type { Point } from './common'

const windPower = (wind: number, thinAir: number) => {
  const densityRatio = thinAir ? 1 / 1.225 : 1
  return Math.max(0, 2000 * (wind ** 3 - 4 ** 3) / (12 ** 3 - 4 ** 3) * densityRatio)
}
const dispatch = (speed: number, i: Values) => Math.min(windPower(speed, i.air), 2000, 20 * i.limit)

function operatingCurve(i: Values, returnFromStorm: boolean): Point[] {
  const threshold = returnFromStorm ? 23 : 25
  const points: Point[] = []
  for (let v = 0; v < threshold; v += 0.25) points.push([v, dispatch(v, i)])
  points.push([threshold, dispatch(threshold, i)], [threshold, 0], [30, 0])
  return points
}

export const wind: Lesson = {
  id: 33, title: '风机功率曲线、限幅与再切入', prerequisites: [],
  context: '同一台风机两次报告 24 m/s，一次发电，一次停机。调度记录还附有风速来向和场站有功功率上限。',
  question: '为什么单看当前风速，既不能断定风机是否在发电，也不能确定实际输出多少？',
  task: '逐次输入风速，保留停机记忆。分清风况可发、额定平台、调度限幅和大风停机。',
  device: {
    maker: 'Vestas', model: 'V90-2.0 MW IEC IIA / IEC S', name: '变速变桨距风力发电机组', form: 'wind',
    url: 'https://www.vestas.com/content/dam/vestas-com/cn/product-/2MWfinal.pdf.coredownload.inline.pdf',
    document: '维斯塔斯《业精于风》2 MW 平台产品资料', locator: 'V90-2.0 MW IEC IIA/IEC S 技术参数页，“运行数据”“风轮”“电气参数”。查阅 2026-11-18。',
    features: ['额定功率 2000 kW，切入 4 m/s、切出 25 m/s、再切入 23 m/s。', '90 m 风轮，变速变桨距调节，双馈发电机。'],
  },
  controls: [range('wind', '轮毂等效风速', 6, 0, 30, 1, 'm/s'), range('limit', '调度有功上限', 100, 25, 100, 5, '%'),
    choice('air', '空气密度', 0, '标准 1.225 kg/m³', '稀薄 1.000 kg/m³')],
  parts: [part('机舱风速取样', '送入 25 m/s 风况，观察大风停机判定。', 'wind', 25),
    part('风轮扫掠面', '切换空气密度，比较低于额定区的风况可发功率。', 'air', 1),
    part('桨距与功率调节器', '把场站功率指令降至 60%，观察平顶高度。', 'limit', 60)],
  diagram: graph(['来流', '风轮', '双馈发电机', '输出功率', '风速监督', '桨距控制', '调度上限'], [[0, 1], [1, 2], [2, 3], [0, 4], [4, 5], [3, 5], [6, 5], [5, 1]]),
  initialMemory: { storm: 0, heldAt24: 0, cutouts: 0 },
  advance: (m, i) => {
    if (i.wind >= 25 && !m.storm) { m.storm = 1; m.cutouts++ }
    if (m.storm && i.wind === 24) m.heldAt24 = 1
    if (i.wind <= 23) m.storm = 0
    return m
  },
  sample: (i, m) => {
    const available = Math.min(2000, windPower(i.wind, i.air))
    const out = m.storm ? 0 : dispatch(i.wind, i)
    return {
      meters: [['实际输出功率', out, 'kW'], ['忽略停机与调度时可发', available, 'kW'], ['调度上限', 20 * i.limit, 'kW'],
        ['大风闭锁', m.storm, '位'], ['切出记录', m.cutouts, '次']],
      active: out > 0 ? [0, 1, 2, 3, 4, 5, 6] : [0, 4, 5, 6],
      note: m.storm ? '大风停机记忆仍有效，等效风速回落至 23 m/s 方可再切入。' : i.wind < 4 ? '来流低于切入门槛，输出为零。' :
        out < available ? '调度给出的有功上限低于可发功率，控制器压低输出。' : available >= 2000 ? '进入额定平台，继续增风时由变桨等控制维持功率上限。' : '部分负荷区内，风能随空气密度和风速立方变化。',
      plots: [plot('逐步升风 · 25 m/s 切出', '等效风速 / m·s⁻¹', '有功 / kW', operatingCurve(i, false)),
        plot('从大风逐步降风 · 23 m/s 再切入', '等效风速 / m·s⁻¹', '有功 / kW', operatingCurve(i, true))],
    }
  },
  prediction: quiz('从 26 m/s 降到 24 m/s，与从 20 m/s 升到 24 m/s 相比，哪个会发电？', ['都保持零', '从 20 m/s 升上的一台', '从 26 m/s 降下的一台'], 1, '升风尚未切出。降风途中虽低于切出值，但仍高于再切入值，停机记忆保持。'),
  explanation: quiz('风速处在额定平台时将调度上限改为 60%，实际有功停在哪里？', ['1200 kW', '风速的六成', '恒定 2000 kW'], 0, '调度上限按额定容量计。设备的当前可发和调度允许两者中较小者决定输出，大风闭锁另外优先。'),
  comic: strip(['昨天 24 m/s 时发了两兆瓦，今天相同风速却是零，风速计坏了吗？', '先回放来流。昨天从 20 升到 24，还没有碰到 25 的切出点。',
    '今天先冲到 26，再退到 24，停机标记一直亮。', '继续降到 23，再切入信号出现。两条曲线在这段风速间分开了。',
    '我把调度改到 60%，恢复运行后只有 1200 kW。', '读日志要连起来看。先前的风速决定闭锁是否保持，当前的风况和调度共同决定能送多少。'], [0, 0, 0, 0, 2, 1]),
  goals: [
    { text: '将风速升到 25 m/s 触发切出，再降至 24 m/s，确认仍闭锁、输出为 0。', check: s => s.input.wind === 24 && s.memory.storm === 1 && reading(s, '实际输出功率') === 0 },
    { text: '先把调度上限设为 60%，再降至 23 m/s，让机组再切入并输出 1200 kW。', check: s => !!s.memory.heldAt24 && s.input.wind === 23 && !s.memory.storm && near(reading(s, '实际输出功率'), 1200) },
  ],
  practice: [['wind', 25], ['wind', 24], ['limit', 60], ['wind', 23]],
  assumptions: '4/25/23 m/s 和 2000 kW 为该版本原厂数据。4–12 m/s 取平移立方曲线，12 m/s 是课堂选定的平台起点。风速代表已处理的轮毂等效量，立即切换状态，忽略真实平均窗口、延时、湍流和传动暂态。', review: true,
  trials: [
    { name: '正常 · 标准空气部分负荷', moves: [['wind', 10]], verify: s => near(reading(s, '实际输出功率'), 1125) && s.memory.storm === 0 },
    { name: '误操作 · 大风后只退一档就期待发电', moves: [['wind', 26], ['wind', 24]], verify: s => reading(s, '实际输出功率') === 0 && reading(s, '忽略停机与调度时可发') === 2000 && s.memory.cutouts === 1 },
    { name: '故障与恢复 · 闭锁后受限再切入', moves: [['wind', 25], ['wind', 24], ['limit', 60], ['wind', 23]], verify: s => !!s.memory.heldAt24 && !s.memory.storm && near(reading(s, '实际输出功率'), 1200) },
    { name: '迁移 · 10 m/s 稀薄空气、调度上限 75%，取得约 918 kW', moves: [['wind', 10], ['air', 1], ['limit', 75]], verify: s => near(reading(s, '实际输出功率'), 918.367, 0.01) && reading(s, '调度上限') === 1500 },
  ],
}
