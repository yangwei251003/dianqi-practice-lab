import { button, choice, graph, near, part, quiz, range, strip } from '../../core/types'
import type { Lesson, Plot, Values } from '../../core/types'
import { bit, plcClock, reading, recordBit, scanTrace, slot } from './shared'

function photoOutput(i: Values): number {
  const dark = Boolean(i.work || i.optics)
  return bit(i.polarity === 0 ? dark : !dark)
}

const counterTrigger = slot('trigger', '计数程序触点', 0, 'Q 上升沿加一', 'Q 为真时每扫描加一')
export const photoLadder = { rungs: [{ output: 'INC · 箱数加一', slots: [counterTrigger.binding] }] }

export const photoCounter: Lesson = {
  id: 13, title: '光电计数', prerequisites: [],
  context: '纸箱停在码垛线光束中，账面却多出四箱。把收光状态、输出电平和计数事件摊在同一条时间线上。',
  question: '一个箱子挡光半秒，控制器会看见几次有效到件？',
  task: '在遮光动作与上升沿程序下放入一箱并推进时间。移出、让控制器扫到空隙，再放入下一箱。对照逐扫累加程序。',
  device: {
    maker: 'OMRON', model: 'E3Z-T61 2M', name: '对射式光电开关', form: 'sensor',
    url: 'https://industrial.omron.co.uk/en/products/E3Z-T61-2M',
    document: 'E3Z-T61 2M · Specifications', locator: '型号页 Specifications 的 Sensing method、Operation mode、Product Width/Height/Depth (unpacked)，查阅 2026-11-18。尺寸为单个传感器本体。',
    dimensions: [10.8, 31, 20],
    features: ['分离的发射器与接收器沿同一光轴工作', '红外 LED，对射，标称检测距离 15 m', '受光／遮光动作可选，型号输出为 NPN'],
  },
  parts: [
    part('红外发射窗', '让光轴发生偏移，检查空带时的计数。', 'optics', 1),
    part('纸箱挡光面', '把虚拟箱子移到光束中，接收窗失光。', 'work', 1),
    part('接收器动作选择器', '切换到受光动作，观察哪一侧边沿对应离开。', 'polarity', 1),
    part('计数器显示窗', '在空带且对准时清零，以上一电平为新基线。', 'zero'),
  ],
  controls: [
    choice('work', '光束中的纸箱', 0, '空隙', '箱体遮挡'),
    choice('polarity', '接收器动作', 0, 'D-ON 遮光动作', 'L-ON 受光动作'),
    counterTrigger.input,
    choice('optics', '光轴状态', 0, '对准', '偏移失光'),
    button('zero', '清零并同步当前 Q'),
  ],
  ladder: photoLadder,
  initialMemory: { clock: 0, scans: 0, previous: 0, count: 0, boxes: 0, edges: 0, highScans: 0, falseEdge: 0, qTrace: 0, addTrace: 0 },
  advance(m, i, old, action, dt) {
    const q = photoOutput(i)
    if (action === 'work' && !old.work && i.work) m.boxes++
    if (action === 'zero') {
      m.count = m.edges = m.boxes = m.highScans = m.falseEdge = 0
      m.previous = q
    }
    if (action === 'tick') plcClock(m, dt, () => {}, () => {
      const rise = q === 1 && m.previous === 0
      if (rise) m.edges++
      if (rise && i.optics && !i.work) m.falseEdge++
      if (q) m.highScans++
      const add = i.trigger ? q : bit(rise)
      m.count += add
      m.qTrace = recordBit(m.qTrace, q)
      m.addTrace = recordBit(m.addTrace, add)
      m.previous = q
    })
    return m
  },
  sample(i, m) {
    const light = !i.work && !i.optics
    const q = photoOutput(i)
    return {
      meters: [['收光', bit(light), ''], ['输出 Q', q, ''], ['入场箱数', m.boxes, '箱'], ['采样上升沿', m.edges, '次'], ['显示计数', m.count, '箱'], ['高电平扫描', m.highScans, '次']],
      active: [0, ...(i.work ? [1] : []), ...(light ? [2] : []), ...(q ? [3] : []), ...(m.previous ? [4] : []), 5, ...(m.count ? [6] : [])],
      note: i.optics ? '接收窗持续失光。比较入场箱数与上升沿，可辨认空带的虚假到件。' :
        i.trigger ? '每次扫描都执行 Q 为真时的加一。延长同一箱子的停留时间，观察显示计数。' :
        '扫描只记相邻两次采样的 0→1。两个箱子之间需要让控制器采到一次空隙。',
      plots: [scanTrace('近二十扫 · 采样 Q', m.scans, m.qTrace), scanTrace('近二十扫 · 本扫加一请求', m.scans, m.addTrace)],
    }
  },
  diagram: graph(['发射器', '箱体遮挡', '接收光量', '动作选择 Q', '上一拍记忆', '本拍判据', '累加寄存器'], [[0, 2], [1, 2], [2, 3], [3, 5], [5, 4], [4, 5], [5, 6]]),
  prediction: quiz('遮光动作下放入一箱，保持 0.5 s。0.1 s 扫描、上升沿计数的读数是多少？', ['1 箱', '5 箱', '0 箱'], 0, '五次采样都能看到高电平，只有第一次从 0 变为 1。'),
  explanation: quiz('紧挨的两箱只计一次。哪条证据能解释？', ['两箱颜色一致', '两箱之间没有采到 Q=0', '红外光一直完全穿透纸箱'], 1, '两次上升沿之间必须出现低电平采样，机械间隙短于扫描周期时也可能被漏掉。'),
  comic: strip([
    '这箱卡住半秒，屏上从零跳到五。我数来数去还是一个箱子。',
    '看看程序。遮光动作让输出保持为 1，每一扫描都在执行加一。',
    '我换成上升沿，同一箱不动。显示终于只跳了一次。',
    '把箱子移开再多走一拍。寄存器得记住中间那次 0。',
    '两箱贴紧推过来，收光窗一直暗。第二箱根本没有自己的边沿！',
    '再试空带偏移光轴。失光也会造一个边沿，箱数与输入变沿要分开看。',
    '换到受光动作后，我先在空带同步，再用离开光束那一刻报数。',
  ], [1, 2, 3, 1, 0, 0, 2]),
  goals: [
    { text: '保持“遮光动作”和“上升沿”，放入一箱并推进至少 0.5 s，使五次以上高电平扫描只计一箱。', check: s => !s.input.trigger && !s.input.polarity && s.memory.boxes === 1 && s.memory.count === 1 && s.memory.highScans >= 5 },
    { text: '切到“空隙”并推进至少 0.1 s，再次遮挡并推进 0.1 s，让两只箱子各产生一个上升沿。', check: s => !s.input.trigger && s.memory.boxes === 2 && s.memory.count === 2 && s.memory.edges === 2 },
  ],
  assumptions: '虚拟纸箱完全不透光。光轴偏移等同持续失光。100 ms 是为观察计数而设置的控制扫描周期。逻辑 Q=1 表示输出动作。', review: false,
  practice: [['work', 1], 0.5, ['work', 0], 0.1, ['work', 1], 0.1],
  trials: [
    { name: '正常｜一箱停留五扫', moves: [['work', 1], 0.5], verify: s => s.memory.count === 1 && s.memory.highScans === 5 && s.memory.boxes === 1 },
    { name: '误操作｜用电平逐扫累加', moves: [['trigger', 1], ['work', 1], 0.5], verify: s => s.memory.count === 5 && s.memory.edges === 1 && s.memory.boxes === 1 },
    { name: '故障与恢复｜空带失光后重新对准', moves: [['optics', 1], 0.2, ['optics', 0], 0.1, ['work', 1], 0.1], verify: s => s.memory.falseEdge === 1 && s.memory.boxes === 1 && s.memory.count === 2 && s.memory.edges === 2 },
    { name: '迁移｜受光动作下先同步空带，再让一箱进出，按离箱上升沿只计一次', moves: [['polarity', 1], ['zero', 1], ['work', 1], 0.1, ['work', 0], 0.1], verify: s => s.input.polarity === 1 && !s.input.trigger && s.memory.edges === 1 && s.memory.count === 1 && reading(s, '收光') === 1 && s.memory.boxes === 1 },
  ],
}

const materialFactors = [1, 0.7, 0.4, 0.3, 0]
function tripGap(i: Values): number { return 4 * materialFactors[i.metal] }

function switchCurve(title: string, threshold: number): Plot {
  return { title, x: '有效间隙 / mm', y: 'Q / 0或1', points: threshold > 0 ?
    [[0, 1], [threshold, 1], [threshold, 0], [7, 0]] : [[0, 0], [7, 0]] }
}

export const inductiveDetector: Lesson = {
  id: 14, title: '金属工件检出', prerequisites: [13],
  context: '送料盘把钢垫片换成铝垫片。同一夹具、同一探头，合格件突然全被报成缺料。',
  question: '探头能看见铝件吗？移动方向又会怎样改变边界附近的读数？',
  task: '先用钢片找到检出区，再在同一间隙换成铝片。靠近后慢慢退出，找出动作与释放之间的回差。',
  device: {
    maker: 'ifm electronic', model: 'IFS204 (IFB3004BBPKG/US-104)', name: '电感式接近开关', form: 'sensor',
    url: 'https://www.ifm.cn/cn/zh/product/IFS204',
    document: 'IFS204 电感式接近开关 · 技术数据', locator: '型号页“技术细节”与数据表 IFS204-02，2025-06-26。检测范围、修正系数和回差见 Detection zone、Accuracy/deviations。',
    features: ['M12 螺纹外壳，PNP 常开输出', '额定距离 4 mm，钢／不锈钢／铝／铜的修正系数为 1／0.7／0.4／0.3', '资料给出的回差为实际动作距离的 3%–15%'],
  },
  parts: [
    part('探头感应面', '将靶件靠近到 1.5 mm，观察材料对输出的影响。', 'gap', 1.5),
    part('可换靶片夹', '换入标准尺寸铝靶，与钢靶在同一位置比较。', 'metal', 2),
    part('支架定位槽', '模拟支架后移 1 mm，有效间隙随之增加。', 'bracket', 1),
    part('输出指示窗', '在当前位置留下一笔开关状态与有效间隙读数。', 'mark'),
  ],
  controls: [choice('metal', '靶片材料', 0, '钢', '不锈钢', '铝', '铜', '塑料'), range('gap', '夹具标尺间隙', 5, 0, 6, 0.1, 'mm'), choice('bracket', '探头支架', 0, '定位', '后移 1 mm'), button('mark', '记录当前间隙与输出')],
  initialMemory: { q: 0, markQ: -1, markGap: -1, markMetal: -1, switched: 0 },
  advance(m, i, old, action) {
    const previous = m.q
    const gap = i.gap + i.bracket
    const threshold = tripGap(i)
    const retained = previous && !(action === 'metal' && old.metal !== i.metal)
    m.q = bit(threshold > 0 && gap <= threshold * (retained ? 1.1 : 1) + 1e-9)
    if (previous !== m.q) m.switched++
    if (action === 'mark') { m.markQ = m.q; m.markGap = gap; m.markMetal = i.metal }
    return m
  },
  sample(i, m) {
    const threshold = tripGap(i)
    return {
      meters: [['有效间隙', i.gap + i.bracket, 'mm'], ['模型动作距离', threshold, 'mm'], ['模型释放边界', threshold * 1.1, 'mm'], ['输出 Q', m.q, ''], ['记录输出', m.markQ, '']],
      active: [0, 1, ...(threshold ? [2] : []), 3, ...(m.q ? [4, 5] : [])],
      note: !threshold ? '塑料靶没有本模型需要的金属涡流。' : m.q ? '输出已动作。向外退出时，超过释放边界才会熄灭。' : '输出未动作。比较有效间隙与该材料的模型动作距离。',
      plots: [switchCurve('靠近支（从大间隙向小间隙读）', threshold), switchCurve('退出支（从小间隙向大间隙读）', threshold * 1.1)],
    }
  },
  diagram: graph(['线圈交变场', '靶材与间隙', '靶中涡流', '振荡幅度比较', '回差记忆', 'PNP 输出'], [[0, 2], [1, 2], [0, 3], [2, 3], [3, 4], [4, 3], [3, 5]]),
  prediction: quiz('探头从远处靠近到 3.0 mm，钢靶和铝靶各会怎样？', ['两者都动作', '只有钢靶动作', '只有铝靶动作'], 1, '示例动作距离取 4×材料系数，钢为 4.0 mm，铝为 1.6 mm。'),
  explanation: quiz('铝片在 1.7 mm，刚才靠近时不亮，退出时却亮，原因是什么？', ['传感器把铝变成钢', '支架必须坏了', '当前间隙落在两个切换边界之间'], 2, '本例采用 10% 回差。铝片靠近至 1.6 mm 后动作，退出超过 1.76 mm 才释放。'),
  comic: strip([
    '昨天钢垫片在三毫米处亮，今天铝垫片过来却没亮。',
    '先看感应面。交变场遇到导电靶会产生涡流，靶材会改变振荡衰减。',
    '表上铝的系数是 0.4。我把标尺移到一点五毫米，灯亮了。',
    '从这里往外走到一点七，先别猜结果，记下它刚刚处在哪个状态。',
    '退出时还亮！我从两毫米再靠到一点七，灯又是灭的。',
    '开和关各有一个边界，小振动落在它们中间时，输出能守住原状态。',
    '换铜件的工装，我会重算动作距离，也会检查支架偏移和退回余量。',
  ], [1, 0, 0, 3, 3, 0, 2]),
  goals: [
    { text: '选钢，间隙设成 3.0 mm，定位支架后点击“记录当前间隙与输出”，留下动作读数。', check: s => s.memory.markMetal === 0 && near(s.memory.markGap, 3) && s.memory.markQ === 1 },
    { text: '换铝靶，在 3.0 mm 看灯熄灭，靠近到 1.5 mm 后再退到 1.7 mm，观察回差带内的亮灯。', check: s => s.memory.markQ === 1 && s.input.metal === 2 && near(s.input.gap + s.input.bracket, 1.7) && s.memory.q === 1 && s.memory.switched >= 3 },
  ],
  assumptions: '采用标准尺寸靶片、正对探头，令钢的动作点恰为额定 4 mm，并选用 10% 回差。换靶视为旧靶先移出。厂商另列保证工作距离 0–3.24 mm。记录输出 −1 表示尚未记录。', review: false,
  practice: [['gap', 3], ['mark', 1], ['metal', 2], ['gap', 1.5], ['gap', 1.7]],
  trials: [
    { name: '正常｜钢靶靠近', moves: [['gap', 3]], verify: s => s.memory.q === 1 && near(reading(s, '模型释放边界'), 4.4) },
    { name: '误操作｜照搬钢件间隙', moves: [['gap', 3], ['metal', 2]], verify: s => s.memory.q === 0 && near(reading(s, '模型动作距离'), 1.6) && s.memory.switched === 2 },
    { name: '故障与恢复｜支架位移', moves: [['metal', 2], ['gap', 1.5], ['bracket', 1], ['mark', 1], ['bracket', 0]], verify: s => s.memory.markQ === 0 && near(s.memory.markGap, 2.5) && s.memory.q === 1 },
    { name: '迁移｜铜靶靠近到 1.1 mm，再退出；记录 1.3 mm 的亮灯并在 1.4 mm 释放', moves: [['metal', 3], ['gap', 1.1], ['gap', 1.3], ['mark', 1], ['gap', 1.4]], verify: s => s.memory.markQ === 1 && s.memory.markMetal === 3 && near(s.memory.markGap, 1.3) && near(s.input.gap + s.input.bracket, 1.4) && s.memory.q === 0 && near(reading(s, '模型释放边界'), 1.32) },
  ],
}

const densities = [1000, 800]
function hydrostat(i: Values) {
  const pressure = densities[i.fluid] * 9.81 * i.height / 1000
  const milliamps = i.open ? 0 : 4 + 16 * pressure / 25
  const assumedDensity = densities[i.scale]
  const indicated = i.open ? 0 : (milliamps - 4) / 16 * 25000 / (assumedDensity * 9.81)
  return { pressure, milliamps, indicated }
}

export const hydrostaticLevel: Lesson = {
  id: 15, title: '4–20 mA 液位', prerequisites: [],
  context: '调配罐换了液体，液位尺没动，控制室显示却下降。沿液柱、膜片、电流、显示四处去找改变。',
  question: '变送器测到的是高度还是压力？空罐和信号中断能分辨吗？',
  task: '将水深调到 1 m，记录电流。保持液面换入轻液，按实际密度修改显示换算，再模拟信号中断。',
  device: {
    maker: 'ifm electronic', model: 'PS3208', name: '投入式静压变送器', form: 'sensor',
    url: 'https://www.ifm.cn/cn/zh/product/PS3208',
    document: 'PS3208 静压式潜水式压力变送器 · 技术数据', locator: '型号页“技术细节”与数据表 PS3208-02，2015-02-02。Application、Analogue current output、Measuring range 及外形图。',
    features: ['测量相对压力 0–25 kPa', '模拟电流输出 4–20 mA', '电缆内的毛细管提供大气压力补偿，随附 5 m 电缆'],
  },
  parts: [part('罐体液面标尺', '把膜片上方的液柱设为 1 m。', 'height', 1), part('投入式膜片', '保持液柱高度，换为密度 800 kg/m³ 的示例液体。', 'fluid', 1), part('电流回路显示窗', '在控制室记录当前的回路电流与换算高度。', 'mark'), part('输入卡比例尺', '让显示端按轻液的密度解释压力。', 'scale', 1)],
  controls: [range('height', '膜片上方液深', 0, 0, 2.5, 0.05, 'm'), choice('fluid', '实际介质', 0, '水 1000 kg/m³', '轻液 800 kg/m³'), choice('scale', '显示端采用的密度', 0, '1000 kg/m³', '800 kg/m³'), choice('open', '虚拟回路', 0, '连续', '信号中断'), button('mark', '锁存一次有效读数')],
  initialMemory: { savedCurrent: 0, savedHeight: 0, marked: 0, sawOpen: 0, lastValidHeight: 0 },
  advance(m, i, _old, action) {
    const h = hydrostat(i)
    if (i.open) m.sawOpen = 1
    else m.lastValidHeight = h.indicated
    if (action === 'mark' && !i.open) {
      m.savedCurrent = h.milliamps; m.savedHeight = h.indicated; m.marked = 1
    }
    return m
  },
  sample(i, m) {
    const h = hydrostat(i)
    return {
      meters: [['液柱压力', h.pressure, 'kPa'], ['回路电流', h.milliamps, 'mA'], ['显示有效', bit(!i.open), ''], ['换算液深', i.open ? m.lastValidHeight : h.indicated, 'm'], ['锁存电流', m.savedCurrent, 'mA']],
      active: [0, 1, 2, ...(i.open ? [5] : [3, 4])],
      note: i.open ? '回路电流为 0 mA，显示有效位已清零。换算液深保留末次有效值，无法据此获知当前液深。' : '静压 p=ρgh，I=4+16p/25（p 取 kPa）。显示高度还取决于输入卡使用的密度。',
      plots: [{ title: '所选介质的理想液深—电流特性', x: '液深 / m', y: '电流 / mA', points: [[0, 4], [2.5, 4 + 16 * densities[i.fluid] * 9.81 * 2.5 / 25000]] }],
    }
  },
  diagram: graph(['密度与液柱', '静压力', '膜片变送', '电流回路', '密度换算', '失信诊断'], [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5]]),
  prediction: quiz('水深 1 m 时约 10.28 mA。等高换为密度 800 kg/m³ 的液体，电流将如何？', ['降至约 9.02 mA', '保持 10.28 mA', '精确减为原电流的 80%'], 0, '随密度成比例的是高于 4 mA 活零点的那部分电流。'),
  explanation: quiz('同一只罐，什么时候应把液位标为无效？', ['空罐且收到 4 mA', '本场景回路中断读到 0 mA', '满度压力为 25 kPa'], 1, '4 mA 是零压力的有效编码。模拟断路时任何真实液深都可对应 0 mA。'),
  comic: strip([
    '罐壁刻度在一米，控制室却从一米变成八十厘米。液体去哪里了？',
    '先看膜片，换料让同高液柱变轻，压在膜片上的表压小了。',
    '水给我 9.81 kPa，轻液只有 7.848 kPa。中间的电流也跟着降。',
    '控制室还按水的密度除。改成每立方米八百公斤，再读同一股电流。',
    '高度对上了。我把液柱降为零，还有 4 mA；让回路中断才是零电流。',
    '把信号质量和液位分开。把断路报成空罐，值班员会追错原因。',
    '另一座罐换液时，我先问密度和参考压力，再核对变送器的压力量程。',
  ], [0, 1, 2, 3, 2, 2, 1]),
  goals: [
    { text: '保持水和水刻度，将液深设为 1.00 m，锁存一次有效读数（约 10.28 mA）。', check: s => s.memory.marked === 1 && near(s.memory.savedCurrent, 10.2784) && near(s.memory.savedHeight, 1) },
    { text: '保持 1.00 m，实际介质和显示密度都改为 800；确认约 9.02 mA 仍被换算成 1.00 m。', check: s => s.memory.marked === 1 && s.input.fluid === 1 && s.input.scale === 1 && near(reading(s, '换算液深'), 1) && near(reading(s, '回路电流'), 9.02272) },
  ],
  assumptions: '开口罐、静止液体、g=9.81 m/s²，液深 0–2.5 m，密度固定为示例值。忽略动态误差与温漂，虚拟断路设为 0 mA；电流曲线展示健康回路。', review: true,
  practice: [['height', 1], ['mark', 1], ['fluid', 1], ['scale', 1]],
  trials: [
    { name: '正常｜一米水柱', moves: [['height', 1]], verify: s => near(reading(s, '液柱压力'), 9.81) && near(reading(s, '回路电流'), 10.2784) && near(reading(s, '换算液深'), 1) },
    { name: '误操作｜换液沿用水刻度', moves: [['height', 1.5], ['fluid', 1]], verify: s => near(reading(s, '换算液深'), 1.2) && near(reading(s, '回路电流'), 11.53408) },
    { name: '故障与恢复｜读数中断再恢复', moves: [['height', 2], ['mark', 1], ['open', 1], ['open', 0]], verify: s => s.memory.sawOpen === 1 && near(s.memory.savedCurrent, 16.5568) && near(reading(s, '换算液深'), 2) && reading(s, '显示有效') === 1 },
    { name: '迁移｜2 m 轻液按 800 kg/m³ 重标定，使约 14.05 mA 对应显示 2.00 m', moves: [['fluid', 1], ['height', 2], ['scale', 1]], verify: s => s.input.fluid === 1 && s.input.scale === 1 && near(reading(s, '液柱压力'), 15.696) && near(reading(s, '回路电流'), 14.04544) && near(reading(s, '换算液深'), 2) },
  ],
}
