import { button, choice, graph, part, quiz, strip } from '../../core/types'
import type { Lesson, Move, Values } from '../../core/types'
import { active, curve, patchBoard, reads } from './common'

const lamps = patchBoard(['源＋', '源－', 'A1', 'A2', 'B1', 'B2'])
const series: Move[] = [['w02', 1], ['w34', 1], ['w15', 1]]
const toParallel: Move[] = [['power', 0], ['w34', 0], ['w04', 1], ['w13', 1], ['power', 1]]
const lampResistance = 24 ** 2 / 2.6

function lampPaths(input: Values) {
  const [positive, negative, a1, a2, b1, b2] = lamps.nets(input)
  const short = positive === negative
  const paths: number[][] = []
  const filaments = [[a1, a2], [b1, b2]]
  function follow(at: number, visited: number[], path: number[]) {
    if (at === negative) { paths.push(path); return }
    filaments.forEach(([left, right], index) => {
      const next = at === left ? right : at === right ? left : undefined
      if (next !== undefined && !visited.includes(next)) follow(next, [...visited, next], [...path, index])
    })
  }
  if (!short) follow(positive, [positive], [])
  return { paths, short }
}

export const lampBoard: Lesson = {
  id: 2, title: '24 V 照明板串并联', prerequisites: [1],
  context: '检修箱内有两只相同的 24 V 灯，拆下来的跳线堆在一旁。箱盖上只留下六个端子名。',
  question: '同样两只灯，怎样只靠改变导线端点，让每灯从约 12 V 变到 24 V？',
  task: '在接线板上逐条搭线，比较串联与并联的灯端电压、功率和电源电流。',
  device: {
    maker: 'Schneider Electric', model: 'Harmony DL1CE024', name: 'BA9s 白炽指示灯泡', form: 'lamp',
    url: 'https://shop.se.com/pro/us/en/product/incandescent-bulb-harmony-xb4-ba-9s-clear-24v-ac-dc/',
    document: 'DL1CE024 — Incandescent bulb, Harmony XB4, BA 9s', locator: 'Technical Specifications → Rated supply voltage、Power dissipation in W、Bulb base，查阅 2026-11-18',
    features: ['BA9s 灯头的透明白炽灯泡', '额定供电 24 V', '额定耗散 2.6 W，灯丝可交换两个端点'],
  },
  wiring: lamps.wiring,
  controls: [choice('power', '虚拟测试电源', 0, '关闭／复位保护', '测试'), ...lamps.controls],
  parts: [
    part('电源测试键', '给现有端子网络施加虚拟供电。直接并接两电源节点会触发模型保护。', 'power'),
    part('A 灯端子 A1', '切换源＋与 A1 之间的单根跳线。A1、A2 之间为第一根灯丝。', 'w02'),
    part('B 灯端子 B1', '切换 A2 与 B1 的跨灯跳线。B1、B2 之间为第二根灯丝。', 'w34'),
    part('回线插孔', '切换 B2 与源－之间的回线。接线板还支持交换灯丝方向。', 'w15'),
  ],
  initialMemory: { trip: 0 },
  advance(m, i) {
    if (!i.power) m.trip = 0
    else if (lampPaths(i).short) m.trip = 1
    return m
  },
  sample(i, m) {
    const { paths, short } = lampPaths(i)
    const on = !!i.power && !m.trip && !short
    const current = [0, 0]
    let total = 0
    // With only two resistive elements, independent source-to-return paths cannot share a filament.
    for (const path of paths) {
      const amps = on ? 24 / (path.length * lampResistance) : 0
      total += amps
      for (const index of path) current[index] += amps
    }
    const [va, vb] = current.map(amps => amps * lampResistance)
    const topology = short ? '电源两端同节点' : paths.length === 2 ? '两灯并联' : paths[0]?.length === 2 ? '两灯串联' : paths.length ? '只有一只灯形成回路' : '没有完整回路'
    const supply = !i.power ? '电源关闭，可修改跳线。' : m.trip ? '虚拟保护已断开。关闭测试电源，移除错误跨接，再测试。' : '测试电源已接入。'
    return {
      meters: [['A 灯电压', va, 'V'], ['B 灯电压', vb, 'V'], ['电源电流', total * 1000, 'mA'], ['A 灯功率', va * current[0], 'W'], ['B 灯功率', vb * current[1], 'W']],
      active: active(on, va > 0, vb > 0, on && paths.length > 0, total > 0, m.trip),
      note: supply + '按导线等电位关系识别为“' + topology + '”。',
      plots: [curve('单灯固定热态电阻下的功率特性', '灯端电压 / V', '单灯功率 / W', 24, volts => volts ** 2 / lampResistance)],
    }
  },
  diagram: graph(['测试源', 'A 灯丝压降', 'B 灯丝压降', '端子网络', '源端电流', '短接保护'], [[0, 3], [3, 1], [3, 2], [1, 4], [2, 4], [3, 5], [5, 0]]),
  prediction: quiz('两根相同的热态等效灯丝串在 24 V 源上，每盏功率约为多少？', ['0.65 W', '1.3 W', '2.6 W'], 0, '每盏承担 12 V。固定电阻时 P=U²/R，半压对应四分之一额定功率。'),
  explanation: quiz('并联接成后，交换 B1、B2 的两根外部导线，亮度会怎样？', ['B 熄灭', '两灯串联', '两灯仍各承担 24 V'], 2, '白炽灯丝没有整流方向。它的两个端点仍各接在电源的一个节点上。'),
  comic: strip([
    '两只都写着 24 V。我把它们排成一排，为什么还一盏也不亮？',
    '从源＋沿跳线走到 A1，经过灯丝到 A2。接下来，你能一路走到源－吗？',
    '把 A2 接 B1，再把 B2 接回源－。两只都亮了，每只却只有 12 V。',
    '单路电流要经过两根相同灯丝。每盏 0.65 W，箱里为什么偏暗就有解释了。',
    '关掉虚拟测试，保留两端的线。我拆开中间桥，把两灯分别跨在源＋与源－之间。',
    '现在每盏 2.6 W，源端要给两条支路供电。试试反过来接 B 灯的两个端点。',
    '灯依然一样亮。以后看灯箱图，我会圈出同节点，不靠灯泡在图纸上排成几排。',
  ], [1, 1, 2, 0, 2, 3, 1]),
  goals: [
    { text: '接源＋—A1、A2—B1、B2—源－后开启测试，观察两灯各 12 V。', check: s => reads(s, 'A 灯电压', 12) && reads(s, 'B 灯电压', 12) },
    { text: '关测试，拆 A2—B1，增加源＋—B1、源－—A2，再测试，两灯各 24 V。', check: s => reads(s, 'A 灯电压', 24) && reads(s, 'B 灯电压', 24) },
  ],
  assumptions: '每灯采用额定点的恒定热态等效电阻 24²/2.6≈221.54 Ω。低压工作时真实灯丝会变冷，本课功率用于比较拓扑。导线理想、保护为瞬时锁定的虚拟源，未模拟冷态涌流或光通量。',
  review: true,
  trials: [
    { name: '正常', moves: [...series, ['power', 1], ...toParallel], verify: s => reads(s, '电源电流', 216.6667) && reads(s, 'A 灯功率', 2.6) && reads(s, 'B 灯电压', 24) },
    { name: '误操作', moves: [['w02', 1], ['w34', 1], ['power', 1]], verify: s => reads(s, '电源电流', 0) && reads(s, 'B 灯电压', 0) && s.memory.trip === 0 },
    { name: '故障与恢复', moves: [...series, ['w01', 1], ['power', 1], ['w01', 0], ['power', 0], ['power', 1]], verify: s => s.memory.trip === 0 && reads(s, 'A 灯电压', 12) && reads(s, 'B 灯功率', 0.65) && reads(s, '电源电流', 54.1667) },
    { name: '迁移｜把 A2、B2 接正极，两灯倒向并联，各耗 2.6 W', moves: [['w03', 1], ['w12', 1], ['w05', 1], ['w14', 1], ['power', 1]], verify: s => !!(s.input.w03 && s.input.w05) && reads(s, 'A 灯功率', 2.6) && reads(s, 'B 灯功率', 2.6) && reads(s, '电源电流', 216.6667) },
  ],
}

const terminalNames = ['X1.1', 'X1.2', 'X1.3', 'X2.1', 'X2.2', 'X2.3']
const harness = patchBoard(terminalNames, ['w04', 'w13', 'w25'])
const correctCrossing: Move[] = [['w04', 0], ['w13', 0], ['w03', 1], ['w14', 1]]
const scanAll: Move[] = [['send', 0], ['ping', 1], ['send', 1], ['ping', 1], ['send', 2], ['ping', 1]]

function mapCore(i: Values, origin: number) {
  const net = harness.nets(i)
  const reached = net.map(id => id === net[origin])
  const remote = [0, 1, 2].reduce((bits, k) => bits | (Number(reached[3 + k]) << k), 0)
  const otherOrigins = reached.slice(0, 3).some((found, k) => found && k !== origin)
  return { remote, otherOrigins, matches: remote === (1 << origin) && !otherOrigins }
}

export const terminalTracing: Lesson = {
  id: 3, title: '端子追线改错', prerequisites: [2],
  context: '一束三芯线缆要把 X1.1～3 分别送到 X2 的同号端。上次换过套管，线号和真实去向可能不同。',
  question: '只看一只回响灯，能发现芯线互换和隐蔽的跨接吗？',
  task: '给命名出发端发送虚拟追线脉冲，根据回响调整独立导线，逐芯复核一一对应与隔离。',
  device: {
    maker: 'Phoenix Contact', model: 'UT 2,5 · 3044076', name: '导轨直通端子', form: 'terminal',
    url: 'https://www.phoenixcontact.com/en-gb/products/feed-through-terminal-block-ut-25-3044076',
    document: 'UT 2,5 — Feed-through terminal block, item 3044076', locator: 'Product details → Electrical properties、Connection data、Mounting，查阅 2026-11-18',
    features: ['每只直通端子有两个螺钉接线位置', '标称截面 2.5 mm²', '灰色端子可装在 NS 35 导轨上'],
  },
  wiring: harness.wiring,
  controls: [choice('send', '发码端', 0, 'X1.1', 'X1.2', 'X1.3'), button('ping', '发送追线脉冲'), ...harness.controls],
  parts: [
    part('X1 排编号槽', '选择这次发码的芯线，编号随三个独立端子排列。', 'send'),
    part('X2 回响窗', '发出虚拟脉冲，再读本端以外所有同节点的回响。', 'ping'),
    part('一号出线端', '切换 X1.1 到 X2.2 的跨号导线。', 'w04'),
    part('同排跨接位', '切换 X2.1 与 X2.2 的虚拟跨接，可观察两路同时响应。', 'w34'),
  ],
  initialMemory: { tested: 0, remote: 0, shared: 0, last: -1 },
  advance(m, i, before, action) {
    if (action.startsWith('w') && i[action] !== before[action]) {
      m.tested = 0; m.remote = 0; m.shared = 0; m.last = -1
    }
    if (action === 'ping') {
      const trace = mapCore(i, i.send)
      m.remote = trace.remote
      m.shared = Number(trace.otherOrigins)
      m.last = i.send
      if (trace.matches) m.tested |= 1 << i.send
    }
    return m
  },
  sample(_i, m) {
    const hits = [0, 1, 2].filter(k => !!(m.remote & (1 << k)))
    const count = [1, 2, 4].filter(bit => !!(m.tested & bit)).length
    const report = m.last < 0 ? '接线已就绪，选择 X1 发码端并发送脉冲。' :
      '上次 X1.' + (m.last + 1) + ' 发码，' + (hits.length ? '远端 ' + hits.map(k => 'X2.' + (k + 1)).join('、') + ' 响应。' : '远端无响应。') + (m.shared ? '另有本排端子共通。' : '')
    return { meters: [['X2.1 回响', Number(hits.includes(0)), ''], ['X2.2 回响', Number(hits.includes(1)), ''], ['X2.3 回响', Number(hits.includes(2)), ''], ['已核合格芯线', count, '/3']],
      active: active(m.last >= 0, m.last === 0, m.last === 1, m.last === 2, ...[0, 1, 2].map(k => hits.includes(k)), count === 3), note: report }
  },
  diagram: graph(['追线脉冲', 'X1.1', 'X1.2', 'X1.3', 'X2.1', 'X2.2', 'X2.3', '逐芯核对'], [
    [0, 1], [0, 2], [0, 3], [1, 4], [1, 5], [1, 6], [2, 4], [2, 5], [2, 6], [3, 4], [3, 5], [3, 6], [4, 7], [5, 7], [6, 7],
  ]),
  prediction: quiz('初始线束从 X1.1 发码，只见 X2.2 响应。能确定什么？', ['一号芯断开', '一号端目前通向二号远端', '另外两芯都正确'], 1, '这个脉冲只确认本次起点的实际去向，仍需分别核对其他起点。'),
  explanation: quiz('同号远端响应，另一个远端却也响应。该芯如何判定？', ['线号相同就通过', '重复三次可通过', '存在额外通路，不能通过一一映射检查'], 2, '独立芯线需要预期远端唯一响应，并与其他源端隔离。'),
  comic: strip([
    '线套上的“1”很清楚，我猜另一头也是 1。',
    '从 X1.1 发一个追线脉冲，先读回响窗再看套管。',
    '亮的是 X2.2！我换发 X1.2，这回却是 X2.1。两次记录拼起来正好交叉。',
    '若只在远端补一根桥，看似同号的灯会亮，你猜另一盏呢？',
    '两盏一起亮了，连发码这侧也多通一芯。我拆掉桥，把两条错线各自改回去。',
    '改动会让旧记录失效。从三个起点各发一次，确认每次只有对应灯响应。',
    '换到另一束多芯线，即使颜色相同，我也能画出起点、落点和额外通路。',
  ], [0, 1, 1, 3, 2, 0, 1]),
  goals: [
    { text: '保持初始线束，从 X1.1 发脉冲，观察只有 X2.2 回响。', check: s => s.memory.last === 0 && s.memory.remote === 2 && !s.memory.shared },
    { text: '拆 X1.1—X2.2 和 X1.2—X2.1，接回同号两对。轮选三个 X1 端各发一次，取得 3/3。', check: s => s.memory.tested === 7 },
  ],
  assumptions: '六个接线点各代表一只独立直通端子的等电位侧。独立虚拟追线器只求连通集合，导轨不参与导通。回响灯与合格计数是教学夹具功能。接线改变后既有核验清零。',
  review: false,
  trials: [
    { name: '正常', moves: [['ping', 1], ...correctCrossing, ...scanAll], verify: s => reads(s, '已核合格芯线', 3) && reads(s, 'X2.3 回响', 1) && s.memory.remote === 4 },
    { name: '误操作', moves: [['w34', 1], ['ping', 1]], verify: s => reads(s, 'X2.1 回响', 1) && reads(s, 'X2.2 回响', 1) && s.memory.shared === 1 && reads(s, '已核合格芯线', 0) },
    { name: '故障与恢复', moves: [['w25', 0], ['send', 2], ['ping', 1], ['w25', 1], ['ping', 1]], verify: s => s.memory.remote === 4 && reads(s, '已核合格芯线', 1) && !s.memory.shared },
    { name: '迁移｜让 X1.2 只在 X2.1、X2.3 同时回响', moves: [['w25', 0], ['w15', 1], ['send', 1], ['ping', 1]], verify: s => s.memory.last === 1 && !s.memory.shared && s.memory.remote === 5 && reads(s, 'X2.2 回响', 0) && reads(s, '已核合格芯线', 0) },
  ],
}
