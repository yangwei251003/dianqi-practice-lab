import { button, choice, graph, part, quiz, strip } from '../../core/types'
import type { Lesson } from '../../core/types'
import { active, curve, reads } from './common'

export const fanLatch: Lesson = {
  id: 7, title: '风机点动与自锁', prerequisites: [1, 3],
  context: '风机试转时要求松手即停，连续通风时却要松手后保持。两种要求共用一只接触器。',
  question: '启动钮已经松开，是哪条支路仍给线圈供电？掉电又恢复后会怎样？',
  task: '在点动和自锁两种虚拟控制回路间比较，验证释放启动钮时的差异，再检查掉电恢复。',
  device: {
    maker: 'Schneider Electric', model: 'TeSys D LC1D09BD', name: '直流线圈三极接触器', form: 'contactor',
    url: 'https://shop.se.com/pro/us/en/product/iec-contactor-tesys-deca-nonreversing-9a-5hp-at-480vac-up-to-100ka-sccr-3-phase-3-no-24vdc-coil-open-style/',
    document: 'LC1D09BD · TeSys Deca IEC contactor', locator: '型号页 Technical Specifications，查阅 2026-11-18。外形据原厂 LC1D09BD Product data sheet（2017-09-08）中 Height、Width、Depth。',
    features: ['24 V DC 线圈', '3 个常开主极，AC-3 为 9 A（不超过 440 V）', '内置 1 常开、1 常闭辅助触点'], dimensions: [45, 77, 95],
  },
  controls: [
    choice('mode', '虚拟控制回路', 0, '点动', '自锁'),
    choice('start', '瞬时启动钮位置', 0, '松开', '按住'), button('stop', '按一下停止钮'),
    choice('power', '控制电源', 1, '失电', '有电'), choice('aux', '辅助常开支路', 0, '完好', '开路'),
  ],
  parts: [
    part('A1/A2 线圈', '切换虚拟控制电源，观察线圈掉电与主极释放。', 'power'),
    part('常开辅助触点 13–14', '连续回路中给线圈提供保持路径，点此可模拟开路。', 'aux'),
    part('启动按钮帽', '按住或松开，读出点动与自锁的不同结果。', 'start'),
    part('停止按钮帽', '常闭停止支路被瞬时打断，线圈和辅助触点随即释放。', 'stop'),
  ],
  initialMemory: { coil: 0, rpm: 0, jogReleased: 0, lost: 0, noRestart: 0, stoppedRunning: 0 },
  advance(m, i, old, action, dt) {
    const wasOn = !!m.coil
    const seal = wasOn && !!i.mode && !i.aux
    m.coil = Number(!!i.power && !i.stop && (!!i.start || seal))
    if (action === 'start' && old.start && !i.start && !i.mode && wasOn && !m.coil) m.jogReleased = 1
    if (action === 'power' && old.power && !i.power) {
      m.lost = Number(wasOn && !!i.mode && !i.start)
      m.noRestart = 0
    }
    if (action === 'power' && !old.power && i.power) m.noRestart = Number(!!m.lost && !i.start && !m.coil)
    if (m.coil) m.noRestart = 0
    if (action === 'stop') m.stoppedRunning = Number(wasOn && !m.coil)
    const target = m.coil ? 900 : 0
    m.rpm = target + (m.rpm - target) * Math.exp(-dt / (m.coil ? 0.8 : 2))
    return m
  },
  sample(i, m) {
    const seal = !!(m.coil && i.mode && !i.aux)
    const note = !i.power ? '控制电源失去，线圈、保持触点和主触点均释放。' :
      m.noRestart ? '控制电源已恢复。启动钮松开，保持触点也已释放，线圈没有再次吸合。' :
      m.coil ? (i.start ? '启动支路正在给线圈供电。松开启动钮可检验保持路径。' : '启动支路已开，线圈靠辅助常开触点保持。') :
      '线圈释放。要重新运行，需要一个有效启动请求。'
    return { meters: [['控制电源电压', 24 * i.power, 'V'], ['线圈电压', 24 * m.coil, 'V'], ['闭合主极', 3 * m.coil, '极'], ['保持支路导通', Number(seal), ''], ['风机转速', m.rpm, 'r/min']],
      active: active(i.power, i.power && !i.stop, i.power && i.start && !i.stop, seal, m.coil, m.coil, m.rpm > 0.01, true), note }
  },
  diagram: graph(['控制电源', '停止常闭', '启动常开', '辅助保持', 'KM 线圈', '三极主触点', '风机旋转', '动力源'], [[0, 1], [1, 2], [1, 3], [2, 4], [3, 4], [4, 3], [4, 5], [7, 5], [5, 6]]),
  prediction: quiz('自锁已建立、启动钮已释放，此时控制电源消失后恢复，线圈会怎样？', ['继续吸合', '保持释放，须重新提出启动请求', '只闭合一个主极'], 1, '失电会使提供保持的常开辅助触点释放，复电时两条启动路径均断开。'),
  explanation: quiz('回路已选自锁。按住能运行，松钮立即失去供电。哪个故障与现象相符？', ['辅助常开支路开路', '所有主触点同时熔焊', '线圈永远没有供电'], 0, '按住期间启动支路可用，释放后唯有辅助支路应当保持线圈。'),
  comic: strip([
    '试转时我一松手，风机供电灯就灭了，是不是接触器坏了？',
    '现在选的是点动。你的手一松，给线圈供电的唯一通路就开了。',
    '切到自锁，按住再松开，线圈窗仍有 24 V。谁替我按着按钮？',
    '看 13–14。线圈吸合时带动这对常开触点闭合，电流多了一条路。',
    '我让控制源失电，保持触点也弹开。松钮时复电，风机果然静止。',
    '再试一次辅助支路开路。按住能转、松开就停，这和最初的点动表现很像。',
    '下回接到“松手就停”的故障描述，我会先问试的是哪种回路，再核对保持支路。',
  ], [2, 0, 2, 1, 0, 1, 3]),
  goals: [
    { text: '在默认点动回路按住再松开启动钮，确认线圈回到 0 V。', check: s => !!s.memory.jogReleased && !s.memory.coil },
    { text: '切到自锁、按住再松开启动钮，看到线圈仍为 24 V。', check: s => !!s.input.mode && !s.input.start && reads(s, '保持支路导通', 1) && reads(s, '线圈电压', 24) },
    { text: '保持启动钮松开，将控制电源切到失电再恢复，验证线圈仍为 0 V。', check: s => !!s.memory.noRestart && reads(s, '线圈电压', 0) },
  ],
  assumptions: '理想辅助触点瞬时跟随线圈。启动钮有按住与松开两态，停止钮为单次脉冲。失电不自启的条件为启动钮已释放，持续的外部启动请求可使普通三线回路再次吸合。教学风机目标 900 r/min，加速、滑行时间常数分别为 0.8、2 s。忽略接点弹跳与保护配合。',
  review: true,
  trials: [
    { name: '正常', moves: [['start', 1], ['start', 0], ['mode', 1], ['start', 1], ['start', 0], ['power', 0], ['power', 1]], verify: s => s.memory.jogReleased === 1 && s.memory.noRestart === 1 && reads(s, '控制电源电压', 24) && reads(s, '线圈电压', 0) },
    { name: '误操作', moves: [['start', 1], ['start', 0]], verify: s => !s.input.mode && s.memory.jogReleased === 1 && reads(s, '闭合主极', 0) },
    { name: '故障与恢复', moves: [['mode', 1], ['aux', 1], ['start', 1], ['start', 0], ['aux', 0], ['start', 1], ['start', 0]], verify: s => reads(s, '保持支路导通', 1) && reads(s, '闭合主极', 3) && reads(s, '线圈电压', 24) },
    { name: '迁移｜自锁运行 0.8 s 后按停止，验证线圈为 0 V 而叶轮仍快于 500 r/min', moves: [['mode', 1], ['start', 1], ['start', 0], 0.8, ['stop', 1]], verify: s => s.memory.stoppedRunning === 1 && !!s.input.mode && !s.input.start && reads(s, '控制电源电压', 24) && reads(s, '线圈电压', 0) && s.memory.rpm > 500 },
  ],
}

export const spindle: Lesson = {
  id: 8, title: '主轴正反互锁', prerequisites: [7],
  context: '主轴需要正反转，但接触器释放的瞬间，惯性仍让夹盘向前转。方向互锁和零速许可分别起什么作用？',
  question: '正向线圈已失电，为什么反向请求有时仍被拒绝？',
  task: '发出方向脉冲，观察对向辅助反馈和主轴转速。停机滑行到零后，再发出新的反向请求。',
  device: {
    maker: 'Schneider Electric', model: 'TeSys D LC2D09BD', name: '机械联锁可逆接触器组', form: 'contactor',
    url: 'https://eshop.se.com/in/lc2d09bd.html', document: 'LC2D09BD · TeSys reversing contactor',
    locator: 'Product presentation、Interlocking type、Auxiliary contact composition、Control circuit voltage，查阅 2026-11-18',
    features: ['成组预装换向主回路母排', '两接触器间有机械互锁', '24 V DC 线圈，带常开与常闭辅助触点'],
  },
  controls: [button('forward', '请求正向'), button('reverse', '请求反向'), button('stop', '停止并滑行'),
    button('both', '同时请求两向'), choice('feedback', '正向释放反馈', 0, '正常', '常闭反馈断线')],
  parts: [
    part('正向接触器 KMF', '给正向通道一个请求，观察反向线圈的对向闭锁。', 'forward'),
    part('反向接触器 KMR', '反向通道同时需要正向释放反馈和外部零速许可。', 'reverse'),
    part('互锁连杆', '测试双请求，机械互锁的两组主触点始终保持互斥。', 'both'),
    part('主轴测速盘', '释放线圈后主轴继续滑行，推进仿真时间可观察测速读数。', 'stop'),
    part('释放反馈窗', '在教学回路中模拟正向常闭反馈断线，反向支路会失去许可。', 'feedback'),
  ],
  initialMemory: { direction: 0, rpm: 0, denied: 0, dualFromRest: 0 },
  advance(m, i, _before, action, dt) {
    if (action === 'stop') { m.direction = 0; m.denied = 0 }
    if (i.feedback && m.direction < 0) { m.direction = 0; m.denied = 3 }
    if (action === 'both') { m.denied = 4; m.dualFromRest = Number(!m.direction && Math.abs(m.rpm) <= 0.001) }
    if (action === 'forward' || action === 'reverse') {
      const requested = action === 'forward' ? 1 : -1
      if (m.direction === -requested) m.denied = 1
      else if (requested < 0 && i.feedback) m.denied = 3
      else if (!m.direction && Math.abs(m.rpm) > 0.001) m.denied = 2
      else { m.direction = requested; m.denied = 0 }
    }
    const target = m.direction * 1200, step = dt * (m.direction ? 600 : 400)
    m.rpm += Math.sign(target - m.rpm) * Math.min(step, Math.abs(target - m.rpm))
    return m
  },
  sample(i, m) {
    const f = m.direction > 0, r = m.direction < 0, zero = Math.abs(m.rpm) <= 0.001
    const reasons = ['方向通道就绪。', '对向接触器仍吸合，请求被电气互锁拒绝。', '线圈已释放，但主轴还在滑行。零速后须重新请求。', '正向释放反馈缺失，反向许可断开。', '同时提出两向请求，外部命令仲裁拒绝本次双请求。']
    const target = m.direction * 1200
    return { meters: [['正向线圈', f ? 24 : 0, 'V'], ['反向线圈', r ? 24 : 0, 'V'], ['主轴转速', m.rpm, 'r/min'], ['零速确认', Number(zero), '']],
      active: active(true, zero, !r, !f && !i.feedback, f, r, f || r, !zero, true),
      note: reasons[m.denied] + (m.denied === 0 && !m.direction && !zero ? '供电已解除，测速仍显示惯性转动。' : ''),
      plots: [curve('维持当前命令的主轴速度', '从现在起 / s', '有向转速 / (r/min)', 3,
        t => m.rpm + Math.sign(target - m.rpm) * Math.min(Math.abs(target - m.rpm), (m.direction ? 600 : 400) * t))],
    }
  },
  diagram: graph(['方向请求', '零速许可', '反向释放反馈', '正向释放反馈', 'KMF 正向', 'KMR 反向', '互斥主极', '主轴测速', '三相动力源'], [[0, 4], [0, 5], [1, 4], [1, 5], [2, 4], [3, 5], [4, 3], [5, 2], [4, 6], [5, 6], [8, 6], [6, 7], [7, 1]]),
  prediction: quiz('主轴正向运行中按反向，模型会发生什么？', ['两向线圈同时得电', '立即反向制动', '正向继续，对向请求被拒'], 2, '正向吸合时反向通道得不到所需的对向释放反馈。'),
  explanation: quiz('停止后两线圈均为零，测速还有 +800 r/min。为什么还不能启动反向？', ['外加的零速许可尚未成立', '机械互锁靠转速动作', '相序永久无法改变'], 0, '机械互锁约束接触器位置。这个教学控制器另取测速反馈，决定何时接受下一个方向请求。'),
  comic: strip([
    '主轴还在正转，我试了反向请求，另一只线圈始终没有电。',
    '正向接触器占住位置，也打断反向许可。看两只线圈窗，你能同时点亮它们吗？',
    '我按停止，两窗都暗了。测速盘却还显示正数。',
    '这次拒绝原因变了。外加的零速检测在看主轴，它不跟着接触器一起停。',
    '等到零，重新请求反向，测速开始出现负数。先前那一下也没被偷偷排队。',
    '让正向释放反馈断线，再从静止请求反向。这次堵在另一条许可上。',
    '以后排查换向等待，我会分别找对向接点、转速和新请求，三项证据能区分原因。',
  ], [0, 2, 3, 3, 1, 4, 1]),
  goals: [
    { text: '请求正向并推进 2 s，到 +1200 r/min 后请求反向，确认反向线圈为 0 V 且请求被拒。', check: s => s.memory.direction === 1 && s.memory.denied === 1 && reads(s, '主轴转速', 1200) },
    { text: '按停止，推进 3 s 等到零速，再请求反向、推进 2 s，读到 −1200 r/min。', check: s => s.memory.direction === -1 && reads(s, '主轴转速', -1200) },
  ],
  assumptions: '产品自带机械互锁，外部教学回路加入对向常闭反馈、自保持、双请求仲裁与零速启动许可。拒绝的脉冲不排队，简化加速 600、滑行减速 400 r/min 每秒，不用于真实主轴停机时间或制动设计。',
  review: true,
  trials: [
    { name: '正常', moves: [['forward', 1], 2, ['reverse', 1], ['stop', 1], 3, ['reverse', 1], 2], verify: s => reads(s, '主轴转速', -1200) && reads(s, '反向线圈', 24) && reads(s, '正向线圈', 0) },
    { name: '误操作', moves: [['forward', 1], 2, ['stop', 1], 1, ['reverse', 1]], verify: s => s.memory.denied === 2 && reads(s, '主轴转速', 800) && reads(s, '反向线圈', 0) },
    { name: '故障与恢复', moves: [['feedback', 1], ['reverse', 1], ['feedback', 0], ['reverse', 1], 1], verify: s => !s.memory.denied && reads(s, '反向线圈', 24) && reads(s, '主轴转速', -600) },
    { name: '迁移｜静止时双请求被拒后，单发反向并推进 1 s，达到 −600 r/min', moves: [['both', 1], ['reverse', 1], 1], verify: s => s.memory.dualFromRest === 1 && reads(s, '正向线圈', 0) && reads(s, '反向线圈', 24) && reads(s, '主轴转速', -600) },
  ],
}
