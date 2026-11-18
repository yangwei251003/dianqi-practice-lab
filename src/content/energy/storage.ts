import { button, choice, graph, near, part, quiz, range, strip } from '../../core/types'
import type { Lesson, Values } from '../../core/types'
import { clamp, plot, reading, series } from './common'

const capacity = 2000 // mAh
const biasCurrent = (i: Values) => i.bias ? 0.3 : 0
const tripCapacity = (i: Values) => capacity * i.threshold / 100
const lowCapacity = (i: Values, m: Values) => m.estimate < tripCapacity(i) - 1e-7

function gaugeAt(i: Values, m: Values, minutes: number) {
  const real = clamp(m.real - i.current * minutes * 1000 / 60, 0, capacity)
  // Real current ceases at the reservoir boundaries. Sensor offset can still accrue during apparent rest.
  const estimate = clamp(m.estimate + (real - m.real) - biasCurrent(i) * minutes * 1000 / 60, 0, capacity)
  return { real, estimate }
}

export const bms: Lesson = {
  id: 34, title: '电池 BMS 的 SOC 估算与余量告警', prerequisites: [],
  context: '移动检测仪换班时电池只余三成。值班员能同时查看教学参考电量与 BMS 估值，判断报警究竟来自真实耗电还是电流采样偏移。',
  question: '电流表只偏一点，为什么停一段时间后，面板上的剩余电量仍会走偏？',
  task: '按正常放电进入低余量，再模拟补能脱离阈值。用静置偏置工况检查累计误差。',
  device: {
    maker: 'Texas Instruments', model: 'BQ40Z50-R2', name: '锂电池包管理与电量计芯片', form: 'board',
    url: 'https://www.ti.com/lit/ug/sluubk0b/sluubk0b.pdf', document: 'bq40z50-R2 Technical Reference Manual',
    locator: 'SLUUBK0B，2018-10 修订，§14.2 RemainingCapacityAlarm、§14.14 RelativeStateOfCharge、§14.23 BatteryStatus。',
    features: ['SMBus 提供剩余容量、相对 SOC 和容量告警门槛。', '容量告警与单体欠压保护有独立的寄存器和判定逻辑，实际电量计使用 Impedance Track 算法。'],
  },
  controls: [range('current', '电池电流（正放、负充）', 0, -2, 2, 0.5, 'A'),
    range('threshold', '低余量门槛', 20, 10, 30, 5, '%'), choice('bias', '电流表偏置', 0, '零偏正常', '虚增放电 0.30 A'),
    button('sync', '用静置参考重新对齐估值')],
  parts: [part('电池包与电子负载', '选择正 2 A 放电，观察容量随累计电荷下降。', 'current', 2),
    part('电流采样通道', '引入 +0.30 A 偏置，看静置时估值是否仍然漂移。', 'bias', 1),
    part('主机容量告警窗', '改动告警门槛，比较 SOC 与实际剩余毫安时。', 'threshold', 25),
    part('课堂参考电量表', '在零电流、零偏置时使用独立参考对齐估算初值。', 'sync', 1)],
  diagram: graph(['电池包', '负载/补能器', '电流采样', '电荷积分', '满充容量', '相对 SOC', '余量告警', '门槛'], [[0, 1], [1, 0], [1, 2], [2, 3], [3, 5], [4, 5], [3, 6], [7, 6]]),
  initialMemory: { real: 600, estimate: 600, alarmSeen: 0, biasSeen: 0, syncs: 0, syncAttempt: 0 },
  advance: (m, i, _before, action, dt) => {
    const next = gaugeAt(i, m, dt)
    m.real = next.real; m.estimate = next.estimate
    if (action === 'sync') {
      m.syncAttempt = i.current === 0 && i.bias === 0 ? 1 : -1
      if (m.syncAttempt === 1) { m.estimate = m.real; m.syncs++ }
    } else if (action !== 'tick') m.syncAttempt = 0
    if (lowCapacity(i, m)) m.alarmSeen = 1
    if (Math.abs(m.real - m.estimate) >= 10) m.biasSeen = 1
    return m
  },
  sample: (i, m) => {
    const depleted = i.current > 0 && m.real < 1e-8
    const full = i.current < 0 && m.real >= capacity - 1e-8
    const actual = depleted || full ? 0 : i.current
    const alarm = lowCapacity(i, m)
    const active = [0, 2, 3, 4, 5, 7]
    if (actual !== 0) active.push(1)
    if (alarm) active.push(6)
    return {
      meters: [['估计 SOC', 100 * m.estimate / capacity, '%'], ['参考 SOC', 100 * m.real / capacity, '%'], ['估计余量', m.estimate, 'mAh'],
        ['采样电流', actual + biasCurrent(i), 'A'], ['告警门槛', tripCapacity(i), 'mAh'], ['低余量提示', Number(alarm), '位']],
      active, note: m.syncAttempt < 0 ? '当前工况未满足课堂参考对齐条件。先选零电流并消除采样偏置。' : m.syncAttempt > 0 ? '已用静置参考对齐估值。后续误差仍取决于采样质量。' :
        alarm ? '估计剩余容量已低于门槛。主机点亮低余量提示，实际负载电流可继续存在。' :
          '1 秒课堂时间对应 1 分钟电池时间。正号表示放电，SOC 等于估计余量和满充容量的比值。',
      plots: [plot('保持当前电流十分钟 · 估计 SOC', '未来电池时间 / min', 'SOC / %', series(10, 40, t => gaugeAt(i, m, t).estimate / 20)),
        plot('同一工况 · 独立参考 SOC', '未来电池时间 / min', 'SOC / %', series(10, 40, t => gaugeAt(i, m, t).real / 20))],
    }
  },
  prediction: quiz('初始 600 mAh，按 2 A 放电 7 分钟，接近哪个结果？', ['剩余 366.7 mAh，低于 400 mAh 门槛', '剩余 586 mAh，远离门槛', '刚好等于零'], 0, '放出的电荷是 2000×7/60≈233.3 mAh，剩余 366.7 mAh，约为 2000 mAh 满充容量的 18.3%。'),
  explanation: quiz('在零真实电流时消除采样偏置，为什么历史 SOC 误差还在？', ['偏置能立刻改变电池化学容量', '过去累积的错误电荷已改变估计初值', 'SMBus 每次读取都会放掉电荷'], 1, '消除偏置会纠正未来的积分斜率。要纠正旧的累计误差，还需要可信的参考或模型校正。'),
  comic: strip(['屏幕上还有 30%，今天的巡检够走多久？', '先看实际任务电流。按 2 A 放电 7 分钟，容量账本扣掉约 233 mAh。',
    '提示亮了，负载却还在工作。低余量告警原来可以先于保护动作出现。', '现在把真实电流设成零，给采样表加 0.30 A 的偏置，盯住两份电量读数。',
    '参考读数没动，估值却每分钟少 5 mAh。我把偏置消掉，旧差值仍在。', '现在采样正确了。把估值和独立参考对齐，以后按新起点累计，就能分清这两种误差。'], [0, 0, 2, 1, 1, 3]),
  goals: [
    { text: '保留 20% 门槛和正常零偏，选 +2 A 并推进 7 秒，看到约 18.3% 与低余量提示。', check: s => !s.input.bias && s.input.current === 2 && s.input.threshold === 20 && reading(s, '低余量提示') === 1 && reading(s, '估计 SOC') > 0 },
    { text: '改成 −2 A 补能，再推进约 4 秒，让 SOC 回到 24% 以上且告警熄灭。', check: s => !!s.memory.alarmSeen && s.input.current === -2 && reading(s, '估计 SOC') >= 24 && reading(s, '低余量提示') === 0 },
  ],
  practice: [['current', 2], 7, ['current', -2], 4],
  assumptions: '教学包满充 2000 mAh，从 600 mAh 开始，1 s 对应 1 min。以库仑积分演示传感误差，正号约定为放电。面板直接比较毫安时门槛。真实芯片的阻抗建模、温度修正、RCA 状态时序、单体与开关保护均单独处理。静置参考只在仿真可见。', review: true,
  trials: [
    { name: '正常 · 取出电荷到低容量门槛以下', moves: [['current', 2], 7], verify: s => near(reading(s, '估计余量'), 366.6667, 0.001) && reading(s, '低余量提示') === 1 && reading(s, '告警门槛') === 400 },
    { name: '误操作 · 有偏置时尝试对齐', moves: [['bias', 1], 10, ['sync', 1]], verify: s => s.memory.syncs === 0 && near(reading(s, '估计 SOC'), 27.5) && near(reading(s, '参考 SOC'), 30) },
    { name: '故障与恢复 · 移除偏置再对齐', moves: [['bias', 1], 10, ['bias', 0], ['sync', 1]], verify: s => !!s.memory.biasSeen && s.memory.syncs === 1 && near(reading(s, '估计余量'), 600) && reading(s, '采样电流') === 0 },
    { name: '迁移 · 25% 门槛下用 1.5 A 放电 5 分钟，得到 475 mAh 并触发提示', moves: [['threshold', 25], ['current', 1.5], 5], verify: s => near(reading(s, '估计余量'), 475) && reading(s, '告警门槛') === 500 && reading(s, '低余量提示') === 1 },
  ],
}

const energyCapacity = 13.5
const oneWay = 0.95
const reserveEnergy = (i: Values) => i.reserve / 100 * energyCapacity
function batteryPower(i: Values, energy: number) {
  if (i.offline) return 0
  const surplus = i.pv - i.load
  if (surplus > 0 && energy < energyCapacity - 1e-9) return Math.min(5, surplus)
  if (surplus < 0 && energy > reserveEnergy(i) + 1e-9) return Math.max(-5, surplus)
  return 0
}
function nextEnergy(i: Values, energy: number, hours: number) {
  const power = batteryPower(i, energy)
  if (power > 0) return Math.min(energyCapacity, energy + power * hours * oneWay)
  if (power < 0) return Math.max(reserveEnergy(i), energy + power * hours / oneWay)
  return energy
}

export const storage: Lesson = {
  id: 35, title: '并网储能充放与能量平衡', prerequisites: [32, 34],
  context: '楼宇午间光伏发电过剩，傍晚设备启动。并网点电表、储能变流器和电池余量可以分别读取，检验一整段时间的能量账。',
  question: '午间送进储能的 1 kWh，傍晚能给交流负载交付多少？功率上限和备用保留量各在哪个环节起作用？',
  task: '让午间剩余光伏进入电池，再进入傍晚缺电工况。比较变流器功率、购售电和电池能量变化。',
  device: {
    maker: 'Tesla', model: 'Powerwall 2 AC', name: '交流耦合储能单元（北美版）', form: 'battery',
    url: 'https://www.tesla.com/sites/default/files/pdfs/powerwall/Powerwall_2_AC_GW2_NA_EN_Installation_Manual.pdf',
    document: 'Powerwall 2 AC with Backup Gateway 2 · Installation Manual (North America)',
    locator: 'Specifications 的 Powerwall 2 AC Electrical/Mechanical Specifications、图 1 和 Energy Metering 章节。查阅 2026-11-18。图 1 所示外壳版本。', dimensions: [753, 1150, 147],
    features: ['可用能量 13.5 kWh，连续充放电有功上限 5 kW。', '交流耦合，通过站点与光伏计量区分电网、发电和用电。原厂给出特定测试条件下约 90% 的往返效率。'],
  },
  controls: [range('pv', '现场光伏', 2, 0, 10, 0.5, 'kW'), range('load', '楼宇交流负荷', 2, 0.5, 8, 0.5, 'kW'),
    range('reserve', '并网备用保留量', 20, 10, 80, 10, '%'), choice('offline', '储能变流支路', 0, '可用', '故障退出')],
  parts: [part('储能余量管理', '提高保留量可阻止进一步放电，观察电池当前实际可用电量。', 'reserve', 50),
    part('双向变流器', '模拟储能支路退出，看电网接手缺口或吸收盈余。', 'offline', 1),
    part('并网点计量通道', '把楼宇负荷改为 4 kW，查看与电网的净交换。', 'load', 4),
    part('光伏计量通道', '切换到 6 kW 的午间发电，观察剩余功率流向。', 'pv', 6)],
  diagram: graph(['光伏', '交流母线', '楼宇负荷', '双向变流器', '电池', '并网电表', '自用调度'], [[0, 1], [1, 2], [1, 3], [3, 1], [3, 4], [4, 3], [1, 5], [5, 1], [5, 6], [4, 6], [6, 3]]),
  initialMemory: { energy: 6.75, charged: 0, discharged: 0, imported: 0, exported: 0, lostBranch: 0 },
  advance: (m, i, _before, _action, dt) => {
    const hours = dt / 6
    const next = nextEnergy(i, m.energy, hours)
    const delta = next - m.energy
    const charge = Math.max(delta, 0) / oneWay
    const discharge = Math.max(-delta, 0) * oneWay
    const netGrid = (i.load - i.pv) * hours + charge - discharge
    m.energy = next; m.charged += charge; m.discharged += discharge
    m.imported += Math.max(0, netGrid); m.exported += Math.max(0, -netGrid)
    if (i.offline && i.pv !== i.load) m.lostBranch = 1
    return m
  },
  sample: (i, m) => {
    const batt = batteryPower(i, m.energy)
    const gridPower = i.load + batt - i.pv
    const active = [1, 2, 6]
    if (i.pv) active.push(0)
    if (batt) active.push(3, 4)
    if (Math.abs(gridPower) > 1e-9) active.push(5)
    return {
      meters: [['储能交流有功功率（正充）', batt, 'kW'], ['网侧功率（正购）', gridPower, 'kW'], ['可用电量', m.energy, 'kWh'],
        ['储能 SOC', 100 * m.energy / energyCapacity, '%'], ['累计购电', m.imported, 'kWh'], ['累计上网', m.exported, 'kWh']],
      active, note: i.offline ? '变流支路退出，光伏盈余和负荷缺口都由并网点平衡。' : batt > 0 ? '光伏先供应楼宇，余量送入储能。交流侧吸收量乘以充电效率后进入电池。' :
        batt < 0 ? '电池经变流器补足部分或全部负荷缺口。交付相同交流电量会消耗更多电池能量。' :
          i.load > i.pv ? '已到保留量或低于新设保留量，楼宇缺口由电网供应。' : '储能待机，查看光伏与负荷平衡或电池容量边界。',
      plots: [plot('保持当前工况一小时 · 电池能源预测', '未来时间 / min', '可用电量 / kWh', series(60, 60, min => nextEnergy(i, m.energy, min / 60))),
        plot('同一小时 · 网侧功率预测', '未来时间 / min', '购正售负 / kW', series(60, 60, min => i.load + batteryPower(i, nextEnergy(i, m.energy, min / 60)) - i.pv))],
    }
  },
  prediction: quiz('光伏 8 kW、楼宇用 1 kW，电池尚有空间时，网侧出现什么？', ['购电 5 kW', '向电网送 2 kW', '储能以 7 kW 充电'], 1, '现场剩 7 kW，变流器最多吸收 5 kW，其余 2 kW 经网侧送出。'),
  explanation: quiz('储能从 6.75 kWh 降至 2.70 kWh，按本课效率可交付多少交流电量？', ['4.05 kWh', '4.26 kWh', '约 3.85 kWh'], 2, '电池减少了 4.05 kWh，放电单程效率为 0.95，送到交流侧约为 3.8475 kWh。'),
  comic: strip(['午间发了 6 kW，楼里只用 2 kW，为什么网表没有马上向外转？', '看变流器。4 kW 盈余正在充电，每小时只能在电池账上增加 3.8 kWh。',
    '再加阳光后，上网读数出现了。变流器停在 5 kW 上限。', '换到傍晚，把光伏降为零。现在是电池放电，让楼内负荷先少购电。',
    '到了保留量，电池还有电，为什么网表开始购电？', '并网策略把这部分留作备用。核对日电量时，把限功率、保留量和双程损耗分别算进账。'], [3, 1, 2, 3, 0, 2]),
  goals: [
    { text: '保留负荷 2 kW，把光伏升至 6 kW，推进 2 秒，看到 4 kW 充电且可用电量超过 7.5 kWh。', check: s => reading(s, '储能交流有功功率（正充）') === 4 && s.memory.energy > 7.5 && s.memory.charged > 0.8 },
    { text: '改为光伏 0 kW、负荷 4 kW，推进 2 秒，看到储能放电 4 kW、网侧近零且已有放电量。', check: s => s.memory.charged > 0.8 && s.memory.discharged > 0.8 && s.input.pv === 0 && reading(s, '储能交流有功功率（正充）') === -4 && near(reading(s, '网侧功率（正购）'), 0) },
  ],
  practice: [['pv', 6], 2, ['pv', 0], ['load', 4], 2],
  assumptions: '仅并网自用，初始 50%，1 s 仿真代表 10 min。两方向各取 95% 效率，往返 90.25%。交流功率上限 5 kW，触及保留量或充满时在时间步内按实际转移电量结算，忽略自耗、温度及电价。', review: true,
  trials: [
    { name: '正常 · 午间充电一小时', moves: [['pv', 6], 6], verify: s => near(reading(s, '可用电量'), 10.55) && near(s.memory.charged, 4) && near(s.memory.exported, 0) },
    { name: '误操作 · 把全部盈余都算作充电', moves: [['load', 1], ['pv', 8], 6], verify: s => near(reading(s, '可用电量'), 11.5) && near(reading(s, '累计上网'), 2) && near(s.memory.charged, 5) },
    { name: '故障与恢复 · 变流器退出半小时再恢复', moves: [['pv', 0], ['load', 4], ['offline', 1], 3, ['offline', 0], 3], verify: s => !!s.memory.lostBranch && near(reading(s, '累计购电'), 2) && near(reading(s, '可用电量'), 4.64474, 0.001) },
    { name: '迁移 · 无光伏、8 kW 负荷持续一小时，保留 20% 并核对购电约 4.15 kWh', moves: [['pv', 0], ['load', 8], 6], verify: s => near(reading(s, '储能 SOC'), 20) && near(reading(s, '累计购电'), 4.1525) && near(reading(s, '网侧功率（正购）'), 8) },
  ],
}
