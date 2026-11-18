import { button, choice, graph, near, part, quiz, range, strip } from '../../core/types'
import type { Lesson, Values } from '../../core/types'
import { clamp, plot, reading } from './common'
import type { Point } from './common'

const transmittance = [1, 0.6, 0.25]
const shadows = () => choice('shade', '第三分区的透光率', 0, '100% 无阴影', '60% 薄影', '25% 深影')

function pvModule(sun: number, shade: number) {
  const zones = [sun, sun, sun * shade].map(g => {
    const imp = 9.24 * g
    const isc = 9.83 * g
    const knee = (32.5 + 1.6 * Math.log(g)) / 3
    const open = (39.7 + 1.6 * Math.log(g)) / 3
    const bypass = isc + 0.5 * (isc - imp) / knee
    return { imp, isc, knee, open, bypass }
  })
  const zoneVoltage = (i: number, z: typeof zones[number]) => i <= z.imp
    ? z.open + (z.knee - z.open) * i / z.imp
    : Math.max(-0.5, z.knee * (z.isc - i) / (z.isc - z.imp))
  // Series zones have the same current. Their knee and bypass currents partition the exact piecewise curve.
  const currents = [...new Set([0, ...zones.flatMap(z => [z.imp, z.bypass])])].sort((a, b) => a - b)
  const iv: Point[] = []
  for (const amps of currents) {
    const v = zones.reduce((sum, z) => sum + zoneVoltage(amps, z), 0)
    if (v <= 0) {
      const [lastV, lastI] = iv[iv.length - 1]
      iv.push([0, lastI + (amps - lastI) * lastV / (lastV - v)])
      break
    }
    iv.push([v, amps])
  }
  iv.reverse()
  const voc = iv[iv.length - 1][0]
  const at = (setting: number) => {
    const v = clamp(setting, 0, voc)
    const end = iv.findIndex(([volts], index) => index > 0 && volts >= v)
    const [v0, i0] = iv[end - 1]
    const [v1, i1] = iv[end]
    const amps = i0 + (i1 - i0) * (v - v0) / (v1 - v0)
    return { v, amps, watts: v * amps, bypass: zones.filter(z => amps >= z.bypass - 1e-9).length }
  }
  // Power is quadratic on each linear I–V interval. Include the stationary points as well as each knee.
  const voltages = iv.map(([v]) => v)
  for (let k = 1; k < iv.length; k++) {
    const [v0, i0] = iv[k - 1]
    const [v1, i1] = iv[k]
    if (i0 <= i1) continue
    const vertex = (v0 + i0 * (v1 - v0) / (i0 - i1)) / 2
    if (vertex > v0 && vertex < v1) voltages.push(vertex)
  }
  const best = voltages.map(at).reduce((a, b) => a.watts > b.watts ? a : b)
  const plotVoltages = [...new Set([...voltages, ...Array.from({ length: 81 }, (_, k) => k * voc / 80)])].sort((a, b) => a - b)
  const powerCurve: Point[] = plotVoltages.map(v => [v, at(v).watts])
  return { at, iv, voc, best, powerCurve }
}

export const solarCurve: Lesson = {
  id: 31, title: '光伏局部遮阴的 I–V 与 P–V 曲线', prerequisites: [],
  context: '屋顶栏杆的影子只落在组件的一条分区上。电子负载沿曲线取点，能同时读到端电压、电流、功率和旁路状态。',
  question: '同一片阴影不动，为什么降低工作电压反而能取得更多功率？',
  task: '先复现标准测试条件下的铭牌工作点，再遮住一个分区，找到电流恢复的低电压峰。',
  device: {
    maker: 'Canadian Solar', model: 'CS6K-300MS', name: '单晶硅光伏组件', form: 'solar',
    url: 'https://www.canadiansolar.com/na/wp-content/uploads/sites/3/2020/08/Installation_Manual_of_Standard_Solar_Modules_en.pdf',
    document: 'Installation Manual of Standard Solar Modules · Annex C',
    locator: 'IM/GN-AM-EN/2.2，2020-07，附录 C 中 CS6K-300MS 一行和 Avoid Shading 段。取 35 mm 边框款，另见原厂 SuperPower CS6K-MS v5.562 第 2 页机械参数。', dimensions: [992, 1650, 35],
    features: ['标准测试条件下额定功率 300 W，最大功率点为 32.5 V、9.24 A。', '开路电压 39.7 V、短路电流 9.83 A。35 mm SuperPower 款采用 6×10 电池排布和三个旁路二极管。'],
  },
  controls: [range('sun', '未遮区辐照度', 1000, 500, 1000, 100, 'W/m²'), shadows(), range('probe', '电子负载取样电压', 25, 0, 40, 0.5, 'V')],
  parts: [part('受光电池分区', '将未遮处辐照度改为 600 W/m²，全板电流基准随之改变。', 'sun', 600),
    part('窄条阴影', '让一个分区仅透过 25% 日光，观察曲线多出的拐点。', 'shade', 2),
    part('接线盒与工作点探头', '把取样点放到 21 V，在深影下检查旁路分区数。', 'probe', 21)],
  diagram: graph(['辐照度', '两段明区', '第三分区', '旁路二极管', '串联端口', '电子负载', '阴影'], [[0, 1], [0, 2], [6, 2], [1, 2], [2, 4], [1, 3], [3, 4], [4, 5]]),
  initialMemory: { nameplate: 0, shaded: 0 },
  advance: (m, i) => {
    if (!i.shade && i.sun === 1000 && i.probe === 32.5) m.nameplate = 1
    if (i.shade === 2 && i.probe === 32.5) m.shaded = 1
    return m
  },
  sample: i => {
    const curve = pvModule(i.sun / 1000, transmittance[i.shade])
    const p = curve.at(i.probe)
    const active = [0, 1, 4, 5]
    if (p.bypass) active.push(3)
    else active.push(2)
    if (i.shade) active.push(6)
    return {
      meters: [['工作电压', p.v, 'V'], ['工作电流', p.amps, 'A'], ['工作功率', p.watts, 'W'],
        ['全局峰电压', curve.best.v, 'V'], ['全局峰功率', curve.best.watts, 'W'], ['已旁路分区', p.bypass, '段']],
      active, note: i.probe > curve.voc ? '负载设定超过当前开路电压，端口停在开路点，输出电流为零。' : p.bypass ? '当前串电流已让阴影分区的旁路导通。明区仍可供大电流，端电压少了一段。' : '三个分区串联承担相同电流。改变取样电压，可沿同一条曲线比较各个工作点。',
      plots: [plot('组件 I–V · 取样电压由电子负载设定', '端电压 / V', '电流 / A', curve.iv),
        plot('同一组 I–V 点计算的 P–V', '端电压 / V', '功率 / W', curve.powerCurve)],
    }
  },
  prediction: quiz('一个分区降到 25% 透光率后，仍维持 32.5 V，首先能看到什么？', ['组件所有分区电流分别独立输出', '串电流下降，该电压已偏离全局峰', '组件功率仍等于铭牌'], 1, '串联各段传递同一电流。较高端电压下阴影段仍在通路中，限制工作电流。'),
  explanation: quiz('深影时把取样电压降到约 21 V，为什么功率反而上升？', ['旁路支路承接串电流，明区高电流带来的增益超过电压损失', '阴影使三个分区的开路电压都翻倍', '二极管额外制造了电能'], 0, '比较的是端口乘积 P=VI。旁路时失去弱分区的正电压贡献，剩下两个明区仍可接近各自的大电流工作点。'),
  comic: strip(['我把电子负载指到铭牌的 32.5 V，读到约 300 W。', '现在只给最右边一条分区投影子，其他两条保持原来的日照。',
    '电压还在 32.5 V，功率竟只有约 76 W。是不是剩下的光完全没法用了？', '顺着 I–V 台阶向左移，把工作点放到 21 V，观察接线盒的旁路。',
    '旁路一段后，九安多的电流回来了。21 V 竟能拿到约 194 W。', '屋顶的阴影位置可能一天都在变。先找当时曲线的峰，再判断损失，铭牌电压只能作为一个起点。'], [2, 1, 1, 2, 2, 0]),
  goals: [
    { text: '保留无阴影、1000 W/m²，调取样电压到 32.5 V，重现约 300 W。', check: s => !s.input.shade && near(reading(s, '工作功率'), 300.3, 0.05) },
    { text: '保持 32.5 V 先选 25% 深影，再把取样移到 21 V，找回超过 190 W 并看到一段旁路。', check: s => !!s.memory.nameplate && !!s.memory.shaded && s.input.shade === 2 && reading(s, '工作功率') > 190 && reading(s, '已旁路分区') === 1 },
  ],
  practice: [['probe', 32.5], ['shade', 2], ['probe', 21]],
  assumptions: '以 25°C 铭牌四点建立三等分串联分区的分段线性模型。电流随辐照度比例变化，每分区电压平移 (1.6/3)ln(G/Gref)，旁路压降 0.5 V。仅覆盖 500–1000 W/m² 基准辐照和列出的三档透光率。额定工作点用铭牌圆整数字相乘得到 300.3 W。', review: false,
  trials: [
    { name: '正常 · 复现铭牌折点', moves: [['probe', 32.5]], verify: s => near(reading(s, '工作电流'), 9.24) && near(reading(s, '工作功率'), 300.3) },
    { name: '误操作 · 深影仍守铭牌电压', moves: [['probe', 32.5], ['shade', 2]], verify: s => near(reading(s, '工作功率'), 76.43, 0.12) && reading(s, '已旁路分区') === 0 },
    { name: '故障与恢复 · 绕过受遮支路再恢复日照', moves: [['probe', 32.5], ['shade', 2], ['probe', 21], ['shade', 0], ['probe', 32.5]], verify: s => !!s.memory.shaded && near(reading(s, '全局峰功率'), 300.3) && reading(s, '已旁路分区') === 0 },
    { name: '迁移 · 600 W/m² 无影时取 32 V，查到约 170 W 并定位约 31.68 V 的峰', moves: [['sun', 600], ['probe', 32]], verify: s => near(reading(s, '全局峰电压'), 31.683, 0.003) && near(reading(s, '工作功率'), 169.6, 0.15) },
  ],
}

function trackerCurve(i: Values) { return pvModule(1, transmittance[i.shade]) }

export const tracker: Lesson = {
  id: 32, title: '光伏 MPPT 的扰动观察与全曲线扫描', prerequisites: [26, 31],
  context: '独立照明系统的控制器面对两座功率峰。每点一次扰动，观察它如何比较相邻功率、决定下一步向哪边走。',
  question: '跟踪器在峰顶附近来回走动，凭什么判断它找到了整条曲线上最高的峰？',
  task: '在深影下从高电压一侧起步，重现局部寻峰，再扫过整个可用电压范围，比较两次收获。',
  device: {
    maker: 'Victron Energy', model: 'BlueSolar MPPT 100/20', name: '降压型光伏充电控制器', form: 'charger',
    url: 'https://www.victronenergy.com/media/pg/Manual_BlueSolar_MPPT_75-10_up_to_100-20/en/technical-specifications.html',
    document: 'BlueSolar MPPT solar charger manual', locator: '在线手册 §9.1 的 100/20 列与外形表，§3.2 遮阴下的最大功率检测。查阅 2026-11-18。',
    dimensions: [131, 100, 60],
    features: ['PV 最大开路电压 100 V，最大电池充电电流 20 A。', '手册说明局部遮阴会产生多个功率峰，产品具有相应的最大功率检测。'],
  },
  controls: [shadows(), range('seed', '重设起点电压', 30, 18, 38, 0.5, 'V'), range('stride', '每次扰动步长', 1, 0.5, 3, 0.5, 'V'),
    button('perturb', '取样并扰动一步'), button('scan', '扫过可用电压并选峰')],
  parts: [part('PV 输入', '投下深影，制造两个不同的功率峰。', 'shade', 2),
    part('控制器电压采样', '执行一次扰动观察，对比上次的输入功率。', 'perturb', 1),
    part('跟踪调节器', '以 0.5 V 间隔扫描可用窗口，转到实测样点中的最高点。', 'scan', 1),
    part('工作点设定端', '从 35 V 开始寻找峰值，观察初始位置的影响。', 'seed', 35)],
  diagram: graph(['光伏组件', '电压电流采样', '功率比较', '电压工作点', '降压功率级', '蓄电池'], [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [0, 4], [4, 5]]),
  initialMemory: { volts: 30, dir: 1, previous: 0, paired: 0, steps: 0, scans: 0, local: 0 },
  advance: (m, i, _before, action) => {
    if (action === 'tick') return m
    const curve = trackerCurve(i)
    const ceiling = curve.voc
    if (action === 'seed' || action === 'shade') {
      m.volts = clamp(action === 'seed' ? i.seed : m.volts, 15, ceiling)
      m.paired = 0; m.dir = 1; m.steps = 0
    }
    if (action === 'perturb') {
      const current = curve.at(m.volts).watts
      if (m.paired && current < m.previous - 1e-8) m.dir *= -1
      let next = m.volts + m.dir * i.stride
      if (next > ceiling || next < 15) { m.dir *= -1; next = m.volts + m.dir * i.stride }
      m.volts = clamp(next, 15, ceiling)
      m.previous = current; m.paired = 1; m.steps++
      if (i.shade === 2 && m.steps >= 2 && m.volts > 30 && curve.at(m.volts).watts < 0.6 * curve.best.watts) m.local = 1
    }
    if (action === 'scan') {
      let selected = curve.at(15)
      for (let v = 15.5; v <= ceiling; v += 0.5) {
        const candidate = curve.at(v)
        if (candidate.watts > selected.watts) selected = candidate
      }
      m.volts = selected.v; m.scans++; m.dir = 1; m.paired = 0
    }
    return m
  },
  sample: (i, m) => {
    const curve = trackerCurve(i)
    const p = curve.at(m.volts)
    return {
      meters: [['跟踪电压', p.v, 'V'], ['PV 功率', p.watts, 'W'], ['曲线最高功率', curve.best.watts, 'W'],
        ['取能比例', 100 * p.watts / curve.best.watts, '%'], ['电池侧电流', Math.min(20, 0.95 * p.watts / 14.4), 'A']],
      active: [0, 1, 2, 3, 4, 5],
      note: m.paired ? '当前取样比上一步' + (p.watts >= m.previous ? '高，下一步沿原方向走。' : '低，下一步将反向。') :
        m.scans ? '工作点已由扫描选出。可继续逐步扰动观察峰旁的往返。' : '设定起点后逐步采样。每次只在相邻两个点比较功率，扫描键则跨越整条可用曲线。',
      plots: [plot('当前 P–V 全貌 · 对照表内跟踪电压', '组件电压 / V', 'PV 功率 / W', curve.powerCurve),
        plot('当前点附近的功率', '局部电压 / V', 'PV 功率 / W',
          Array.from({ length: 33 }, (_, k) => { const q = curve.at(clamp(m.volts - 2 * i.stride + k * i.stride / 8, 15, curve.voc)); return [q.v, q.watts] }))],
    }
  },
  prediction: quiz('深影下从 35 V 附近只做小幅扰动，可能发生什么？', ['自动一次跳到 21 V', '停在高电压侧局部峰附近往返', '蓄电池电压升到 35 V'], 1, '相邻功率比较只能判断局部坡度。两个峰之间有低谷，连续的小步爬升不会主动跨过它。'),
  explanation: quiz('广域扫描选了约 21 V 而舍弃约 35 V，依据是什么？', ['低电压点的输出电流足够大，使 VI 乘积更大', '光伏只要电压最低就能发最多电', '蓄电池直接把电池端电压定在 21 V'], 0, '扫描在多个电压实测功率。降压级把组件工作点与电池电压解耦。'),
  comic: strip(['控制器在 35 V 左右走来走去，像是已经摸到山顶了。', '给第三分区投深影，从 35 V 出发，点两次扰动，把每步的功率记在心里。',
    '往 36 V 走时功率降，下次就退回来。可灯箱得到的功率还是很小。', '按扫描，让探头也越过中间的低谷。看 21 V 附近的读数。',
    '两座峰都在，低电压那座约有 194 W。原来“再走一步会下降”只说明附近到了顶。', '下次比较两台跟踪器，要在同一片阴影下看实际取能，还要区分组件端功率和电池侧电流。'], [3, 1, 1, 2, 0, 2]),
  goals: [
    { text: '选 25% 深影，把起点设成 35 V，保留 1 V 步长，点两次“扰动一步”，找到取能不足六成的局部峰。', check: s => s.input.shade === 2 && s.memory.steps >= 2 && reading(s, '跟踪电压') >= 33 && reading(s, '取能比例') < 60 },
    { text: '在同一深影下点“扫过可用电压并选峰”，让取能超过 97%。', check: s => !!s.memory.local && s.memory.scans > 0 && s.input.shade === 2 && reading(s, '取能比例') > 97 },
  ],
  practice: [['shade', 2], ['seed', 35], ['perturb', 1], ['perturb', 1], ['scan', 1]],
  assumptions: '课例沿用第 31 课组件模型。按钮逐次演示 P&O 和 0.5 V 网格扫描，均为公开原理的教学实现。电池母线恒为 14.4 V，变换效率取 95%，可用跟踪范围 15 V 至开路电压，未复刻原厂固件。', review: false,
  trials: [
    { name: '正常 · 无影连续两次上坡取样', moves: [['perturb', 1], ['perturb', 1]], verify: s => reading(s, '跟踪电压') === 32 && near(reading(s, 'PV 功率'), 295.97, 0.12) },
    { name: '误操作 · 将局部峰认作全局峰', moves: [['shade', 2], ['seed', 35], ['perturb', 1], ['perturb', 1]], verify: s => !!s.memory.local && reading(s, '跟踪电压') === 35 && near(reading(s, 'PV 功率'), 81.04, 0.12) },
    { name: '故障与恢复 · 阴影导致失跟后广域选峰', moves: [['shade', 2], ['seed', 35], ['perturb', 1], ['perturb', 1], ['scan', 1]], verify: s => !!s.memory.local && near(reading(s, '跟踪电压'), 21) && near(reading(s, 'PV 功率'), 194.14, 0.12) },
    { name: '迁移 · 无影从 38 V 全窗扫描，找到 32.5 V 并向 14.4 V 电池供约 19.81 A', moves: [['seed', 38], ['scan', 1]], verify: s => s.input.seed === 38 && !s.input.shade && s.memory.scans > 0 && near(reading(s, '跟踪电压'), 32.5) && near(reading(s, '电池侧电流'), 19.8115, 0.003) },
  ],
}
