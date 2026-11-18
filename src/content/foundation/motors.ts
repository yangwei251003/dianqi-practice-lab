import { button, choice, graph, part, quiz, range, strip } from '../../core/types'
import type { Lesson } from '../../core/types'
import { active, curve, reads } from './common'

const transferGap = 0.05
function windingStage(running: number, age: number, starTime: number) {
  if (!running) return 0
  if (age < starTime - 1e-9) return 1
  return age < starTime + transferGap - 1e-9 ? 2 : 3
}
const approach = (initial: number, target: number, seconds: number, tau: number) =>
  target + (initial - target) * Math.exp(-seconds / tau)

export const starDelta: Lesson = {
  id: 9, title: '星三角启动', prerequisites: [7, 8],
  context: '一台按 400 V 三角额定的虚拟电机要降压启动。交接记录里，星接触器释放和三角接触器吸合之间夹着一小段空白。',
  question: '这段 50 ms 空白为何必要？同一台电机静止时，星接的绕组电压和线电流各变为多少？',
  task: '观察星形、开路间隔和三角形三个阶段，读绕组电压和两只接触器状态。检查三角支路缺失时的结果。',
  device: {
    maker: 'ABB', model: 'CT-SDS.23S · 1SVR730211R2300', name: '星三角时间继电器', form: 'relay',
    url: 'https://library.e.abb.com/public/99b013420be196edc12578d300226c23/2CDC111128D0201.pdf',
    document: 'Electronic timer CT-SDS.23 — Data sheet 2CDC111128D0201',
    locator: '第 1 页 Order data，第 4 页 Function diagram / Electrical connection，第 5 页 Timing circuit，第 6 页 General data，查阅 2026-11-18',
    features: ['S 型螺钉接线，提供两组常开功能输出', '星形运行时间可调，固定转换间隔 50 ms', '星形输出 17–18，三角输出 17–28'], dimensions: [22.5, 85.6, 103.7],
  },
  controls: [range('duration', '下次启动的星形时间', 3, 1, 8, 0.5, 's'),
    button('start', '启动计时'), button('stop', '停止／复归'),
    choice('deltaPath', '三角执行支路', 0, '完好', '支路断开')],
  parts: [
    part('星形调时盘', '启动时锁定本轮设置，观察星形输出在哪一刻释放。', 'duration'),
    part('计时启动端', '发出新的虚拟启动请求并触发星形输出。', 'start'),
    part('三角输出观察窗', '即使时间继电器发出三角指令，执行支路断开也无法激磁。', 'deltaPath'),
    part('复归按钮', '使两路均释放，本轮计时归零。', 'stop'),
  ],
  initialMemory: { running: 0, age: 0, setting: 3, speed: 0, gap: 0 },
  advance(m, i, _old, action, dt) {
    if (action === 'start' && !m.running) {
      m.running = 1; m.age = 0; m.gap = 0; m.setting = i.duration
    }
    if (action === 'stop') { m.running = 0; m.age = 0; m.gap = 0 }
    if (!m.running) {
      m.speed = approach(m.speed, 0, dt, 8)
      return m
    }
    const end = m.age + dt, deltaAt = m.setting + transferGap
    const inStar = Math.max(0, Math.min(end, m.setting) - Math.min(m.age, m.setting))
    const inGap = Math.max(0, Math.min(end, deltaAt) - Math.max(m.age, m.setting))
    const inDelta = Math.max(0, end - Math.max(m.age, deltaAt))
    // Integrate both switching boundaries even when a single 0.1 s tick spans the whole gap.
    m.speed = approach(m.speed, 0.94, inStar, 1.5)
    m.speed = approach(m.speed, 0, inGap, 8)
    m.speed = approach(m.speed, i.deltaPath ? 0 : 0.98, inDelta, i.deltaPath ? 8 : 1)
    m.gap = Math.min(transferGap, m.gap + inGap)
    m.age = end
    return m
  },
  sample(i, m) {
    const stage = windingStage(m.running, m.age, m.setting)
    const star = stage === 1, delta = stage === 3 && !i.deltaPath
    const phaseV = star ? 400 / Math.sqrt(3) : delta ? 400 : 0
    const ratio = (6 - 5 * m.speed) * (star ? 1 / 3 : Number(delta))
    const t = m.running ? m.setting : i.duration, vStar = 400 / Math.sqrt(3), vDelta = i.deltaPath ? 0 : 400
    const note = ['启动器待命。', '星形输出闭合，绕组承受线电压的 1/√3。', '转换空档，两只接触器都已释放。', delta ? '三角接触器已吸合，绕组获得完整线电压。' : '定时器已发三角指令，但执行支路断开，绕组电流为零。'][stage]
    return { meters: [['绕组电压', phaseV, 'V'], ['线电流倍数', ratio, '×In'], ['星接触器', Number(star), ''], ['三角接触器', Number(delta), ''], ['已历转换空档', m.gap * 1000, 'ms'], ['模型转速', m.speed * 1500, 'r/min']],
      active: active(m.running, m.running, star, stage === 2, stage === 3, delta, star || delta),
      note,
      plots: [{ title: '本轮绕组电压时序（含固定空档）', x: '启动后 / s', y: '绕组电压 / V',
        points: [[0, vStar], [t, vStar], [t, 0], [t + transferGap, 0], [t + transferGap, vDelta], [t + transferGap + 1, vDelta]] }],
    }
  },
  diagram: graph(['运行许可', '星三角定时器', '星接触器', '双断空档', '三角输出', '三角接触器', '三相绕组'], [[0, 1], [1, 2], [2, 6], [1, 3], [3, 4], [4, 5], [5, 6]]),
  prediction: quiz('同一线电压、同一绕组阻抗，星接堵转线电流约为直接三角启动的多少？', ['1/√3', '1/3', '3 倍'], 1, '星接相电压比线电压低一个 √3 因子，三角接线电流又是其相电流的 √3 倍，两因素合成 1/3。'),
  explanation: quiz('三角输出已发出，但绕组仍为 0 V。哪项最能区分执行支路断线与转换空档？', ['只看转子有没有转', '只看星接触器是否释放', '对照三角指令、三角接触器与已历空档'], 2, '空档内两个输出都关闭。空档已满且有三角指令时，执行支路仍可能断开。'),
  comic: strip([
    '400 V 的虚拟电源没调低，绕组窗在启动时怎么只到 231 V？',
    '现在三绕组共一个星点，每相只得到 400/√3。线电流还要考虑接法。',
    '星形调到 3 s，到时星灯熄灭，三角灯竟没立刻亮。',
    '看空档计数。原厂定时器给两输出留了 50 ms，这时转子靠惯性继续转。',
    '空档过去，三角指令亮起。若执行支路断开，绕组电压还是零。',
    '把星输出、三角输出和绕组电压三份记录对齐。同一时刻，转子滑行和绕组得电可以区分开。',
    '换到另一种调时值，我也要分开读星形持续时间和固定转换间隔。',
  ], [1, 0, 0, 2, 2, 3, 0]),
  goals: [
    { text: '保留星形 3 s，点击启动，找到星接触器吸合、绕组约 231 V 的读数。', check: s => s.memory.setting === 3 && reads(s, '星接触器', 1) && reads(s, '绕组电压', 230.94, 0.01) },
    { text: '推进到启动后至少 3.1 s，确认空档累计 50 ms，只有三角接触器吸合且绕组为 400 V。', check: s => reads(s, '已历转换空档', 50) && reads(s, '星接触器', 0) && reads(s, '三角接触器', 1) && reads(s, '绕组电压', 400) },
  ],
  assumptions: '示例电机按 400 V 三角运行、六引出端，转换时间取所引 ABB 型号。模型假定直接三角堵转 6×In，同一转速下星线电流为三角的 1/3。速度采用分段一阶近似，未模拟开路转换冲击、电弧和机械接触器公差。',
  review: true,
  trials: [
    { name: '正常', moves: [['start', 1], 3.1], verify: s => reads(s, '已历转换空档', 50) && reads(s, '绕组电压', 400) && reads(s, '三角接触器', 1) && reads(s, '星接触器', 0) },
    { name: '误操作', moves: [['duration', 6], ['start', 1], 3, ['duration', 1]], verify: s => s.memory.setting === 6 && reads(s, '绕组电压', 230.9401) && reads(s, '三角接触器', 0) && reads(s, '已历转换空档', 0) },
    { name: '故障与恢复', moves: [['deltaPath', 1], ['start', 1], 3.2, ['stop', 1], ['deltaPath', 0], ['start', 1], 3.2], verify: s => reads(s, '绕组电压', 400) && reads(s, '三角接触器', 1) && reads(s, '已历转换空档', 50) },
    { name: '迁移｜星形改 1 s，在启动后 1.000 s 暂停，找到两接触器均释放、绕组 0 V 的空档', moves: [['duration', 1], ['start', 1], 1], verify: s => s.memory.setting === 1 && s.memory.running === 1 && s.memory.age >= 1 - 1e-9 && s.memory.age < 1.05 && reads(s, '绕组电压', 0) && reads(s, '星接触器', 0) && reads(s, '三角接触器', 0) },
  ],
}

const abbCatalogue = 'https://library.e.abb.com/public/067b20899fab40d29e7cad8d3a15aa86/9AAU00000000058%20Process%20performance%20Aluminum%20motors%20EN%2011-2023_NEW-1_lowres.pdf'
export const inductionSlip: Lesson = {
  id: 10, title: '异步电机转差', prerequisites: [6],
  context: '样本台上，四极电机的铭牌工况是 1435 r/min。同学按 50 Hz 算出 1500 r/min，怀疑转速表误差很大。',
  question: '哪个数字属于旋转磁场，哪个属于转子？怎样分清真实转差与测速倍率错误？',
  task: '在稳态数据台调节频率与负载，计算转差率和转子电流频率，再改变光学标记数检验读数可信度。',
  device: {
    maker: 'ABB', model: 'M3AA 90LB 4 · 3GAA092520-ASE', name: '四极三相异步电机', form: 'motor',
    url: abbCatalogue, document: 'Process performance aluminum motors · 9AAU00000000058 EN 11-2023',
    locator: '2023-11，第 25 页 Technical data, 400 V 50 Hz，IE2 四极，M3AA 90LB 4／3GAA092520-••E 行',
    features: ['四极铝机座，基准工况 400 V、50 Hz', 'IE2 表列额定输出 1.1 kW，转速 1435 r/min', '同一行列出额定转矩 7.3 N·m、额定电流 2.4 A'],
  },
  controls: [
    range('frequency', '样本定子频率', 50, 30, 50, 5, 'Hz'), range('load', '样本轴负载', 25, 0, 100, 5, '%'),
    choice('marks', '测速盘每转标记数', 0, '1 个', '2 个'), choice('pulses', '虚拟转速表每转脉冲', 0, '1 个', '2 个'),
  ],
  parts: [
    part('定子极带', '电机极数固定为四极，改变频率会改变磁场同步转速。', 'frequency'),
    part('转子轴端', '调整样本负载，同步转速与轴速的差会改变。', 'load'),
    part('反光标记盘', '每转有几处反光，就给外部读头几个脉冲。', 'marks'),
    part('光学表计数窗', '每转脉冲设错会产生整数倍误读。', 'pulses'),
  ],
  sample(i) {
    const sync = 120 * i.frequency / 4, difference = 5 + 0.6 * i.load
    const rpm = sync - difference, slip = difference / sync
    const shown = rpm * (i.marks + 1) / (i.pulses + 1)
    const note = i.marks !== i.pulses ? '标记数与表的每转脉冲设置不符。光学表读数含倍率误差。' :
      '同步速由频率和极数决定。对照真实轴速，s=(nₛ−n)/nₛ，转子电流频率 f₂=s·f₁。'
    return { meters: [['同步转速', sync, 'r/min'], ['转子转速', rpm, 'r/min'], ['光学表转速', shown, 'r/min'], ['物理转差率', slip * 100, '%'], ['转子电流频率', slip * i.frequency, 'Hz']],
      active: active(true, true, true, true, true, true, i.marks !== i.pulses), note,
      plots: [curve('当前频率下的稳态轴速样本', '额定轴负载 / %', '转子转速 / (r/min)', 100, load => sync - (5 + 0.6 * load))],
    }
  },
  diagram: graph(['定子频率', '旋转磁场', '轴负载', '转子速度', '转差与 f₂', '光学计数', '倍率误差'], [[0, 1], [1, 3], [2, 3], [1, 4], [3, 4], [3, 5], [5, 6]]),
  prediction: quiz('四极、50 Hz，在此台电机额定点，哪个转速属于同步磁场？', ['1435 r/min', '1500 r/min', '3000 r/min'], 1, 'nₛ=120f/P=1500 r/min。1435 r/min 是该额定负载下的转子机械速度。'),
  explanation: quiz('光学表突然显示 2870 r/min，物理模型仍为 1435 r/min。哪个现象足以解释？', ['增加一个反光标记，表仍按每转一个脉冲换算', '四极电机在额定负载自然变成二极', '转差突然归零'], 0, '同一转内采到两个脉冲，沿用一个脉冲每转的系数会把机械速度放大两倍。'),
  comic: strip([
    '磁场每分钟绕 1500 圈，轴上却只看到 1435。到底漏算在哪里？',
    '这 65 圈的相对运动正是转差。用同步速作分母，满载约为 4.33%。',
    '我减轻负载，轴速上去了，磁场那一栏还钉在 1500。',
    '外接测速盘多贴一枚虚拟标记，再读光学表。先别急着说主轴跑过了磁场。',
    '表竟翻倍了！把每转脉冲改成两个，显示就和模型轴速重合。',
    '换 40 Hz 的满载样本。此近似里仍差 65 r/min，分母变小，百分比变大。',
    '以后核查铭牌与测速记录，我会一并写下频率、极数、负载条件和测速换算。',
  ], [0, 1, 1, 2, 3, 0, 3]),
  goals: [
    { text: '保持 50 Hz，把负载设为 100%，读取额定轴速 1435 r/min、转差率约 4.33%。', check: s => s.input.frequency === 50 && reads(s, '转子转速', 1435) && reads(s, '物理转差率', 4.33333) },
    { text: '保持满载，切换 40 Hz 样本，找到同步 1200、转子 1135 r/min 和约 5.42% 转差。', check: s => s.input.frequency === 40 && reads(s, '转子转速', 1135) && reads(s, '物理转差率', 5.41667) },
  ],
  assumptions: '只比较稳态样本。以原厂额定转速为基准，取空载差速 5 r/min、满载差速 65 r/min，按负载线性插值。30～50 Hz 假定恒磁通且同一转矩的差速近似不变。未建模堵转、失速或变频器限流。光学码盘为外部教学量具。',
  review: false,
  trials: [
    { name: '正常', moves: [['load', 100], ['frequency', 40]], verify: s => reads(s, '同步转速', 1200) && reads(s, '转子转速', 1135) && reads(s, '转子电流频率', 2.16667) },
    { name: '误操作', moves: [['load', 100], ['marks', 1]], verify: s => reads(s, '光学表转速', 2870) && reads(s, '转子转速', 1435) && reads(s, '物理转差率', 4.33333) },
    { name: '故障与恢复', moves: [['marks', 1], ['pulses', 1]], verify: s => reads(s, '光学表转速', 1480) && reads(s, '物理转差率', 1.33333) },
    { name: '迁移｜30 Hz、半载，求 865 r/min 轴速及约 1.17 Hz 的转子电流频率', moves: [['frequency', 30], ['load', 50]], verify: s => reads(s, '转子转速', 865) && reads(s, '物理转差率', 3.88889) && reads(s, '转子电流频率', 1.16667) },
  ],
}
