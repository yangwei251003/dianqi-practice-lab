import { choice, graph, near, part, quiz, range, strip } from '../../core/types'
import type { Lesson, Values } from '../../core/types'
import { plot, reading, series } from './common'

const transferMs = 4
const backupAvailable = (i: Values, m: Values) => i.grid === 1 && i.battery === 0 && m.outage >= transferMs - 1e-9

export const ups: Lesson = {
  id: 30, title: 'UPS 掉电切换与负载连续性', prerequisites: [25, 28],
  context: '机房日志记录了一次市电中断。将转换窗口放慢，分开观察 UPS 输出间隙与服务器电源内部还能维持多久。',
  question: '同一台 UPS 切换了 4 ms，为什么一台负载能跨过去，另一台会留下重新上电记录？',
  task: '让备用支路接手一次市电中断，再用短保持时间的负载重演，对照最长间隙和掉电次数。',
  device: {
    maker: 'CyberPower', model: 'CP1500EPFCLCD', name: '交互式正弦波 UPS（欧版）', form: 'ups',
    url: 'https://www.cyberpower.com/eu/en/product/sku/CP1500EPFCLCD', document: 'CP1500EPFCLCD · Specification',
    locator: '原厂欧洲产品页，Output、Battery、Physical 三栏，查阅 2026-11-18。', dimensions: [100, 265, 370],
    features: ['交互式拓扑，1500 VA / 900 W，备用输出为正弦波。', '原厂列典型转换时间 4 ms，并分别给出半载与满载续航。'],
  },
  controls: [choice('grid', '市电事件', 0, '市电可用', '市电中断'), choice('battery', '备用支路', 0, '可用', '不可用'),
    range('hold', '负载在 450 W 时的保持时间', 8, 2, 12, 2, 'ms'), range('load', '服务器负载', 450, 225, 900, 75, 'W')],
  parts: [part('市电检测端', '触发一次虚拟中断，开始计量转换间隙。', 'grid', 1),
    part('电池与逆变支路', '将备用支路设为不可用，对照电源间隙。', 'battery', 1),
    part('服务器输入储能', '选择 2 ms 的基准保持时间，比较服务器掉电记录。', 'hold', 2),
    part('负载功率面板', '提高负载，同一份储能会更快耗尽。', 'load', 900)],
  diagram: graph(['市电', '市电支路', '备用电池', '逆变器', '转换开关', '服务器储能', '服务器负载', '市电检测'], [[0, 1], [0, 7], [7, 4], [1, 4], [2, 3], [3, 4], [4, 5], [5, 6]]),
  initialMemory: { outage: 0, gap: 0, maxGap: 0, spent: 0, failed: 0, resets: 0, sawBattery: 0, returned: 0 },
  advance: (m, i, before, action, dt) => {
    const elapsed = dt * 10 // display magnification: 1 simulated second spans 10 electrical milliseconds
    if (action === 'grid' && i.grid !== before.grid) {
      m.outage = 0
      if (!i.grid && m.sawBattery) m.returned = 1
    }
    let missing = 0
    if (i.grid) {
      missing = i.battery ? elapsed : Math.min(elapsed, Math.max(0, transferMs - m.outage))
      m.outage += elapsed
    }
    m.gap += missing
    m.spent += missing * i.load
    m.maxGap = Math.max(m.gap, m.maxGap)
    if (!m.failed && m.spent > 450 * i.hold + 1e-7) { m.failed = 1; m.resets++ }
    if (backupAvailable(i, m)) m.sawBattery = 1
    if (!i.grid || backupAvailable(i, m)) { m.gap = 0; m.spent = 0; m.failed = 0 }
    return m
  },
  sample: (i, m) => {
    const backup = backupAvailable(i, m)
    const powered = !i.grid || backup
    const hold = 450 * i.hold / i.load
    const gap = i.battery ? Infinity : transferMs
    const active = [7]
    if (!i.grid) active.push(0, 1, 4)
    if (backup) active.push(2, 3, 4)
    if (powered || !m.failed) active.push(5, 6)
    return {
      meters: [['UPS 输出包络', powered ? 230 : 0, 'V RMS'], ['负载可保持', hold, 'ms'], ['最长输出间隙', m.maxGap, 'ms'],
        ['服务器掉电记录', m.resets, '次'], ['剩余保持时间', Math.max(0, 450 * i.hold - m.spent) / i.load, 'ms']],
      active, note: !i.grid ? '市电供能，服务器储能就绪。1 秒课堂时间放大显示 10 ms 电气时间。' : backup ? '备用逆变器已接手。掉电记录保留，便于区分输出恢复与负载是否曾中断。' : m.failed ? '负载储能已耗尽，这次间隙留下了掉电记录。' : '转换中，UPS 输出暂缺，服务器输入储能正在维持负载。',
      plots: [plot('当前配置的持续掉电情景 · UPS 输出包络', '距市电失去 / ms', '有效值包络 / V',
        i.battery ? [[0, 0], [12, 0]] : [[0, 0], [4, 0], [4, 230], [12, 230]]),
        plot('同一情景 · 负载电源剩余保持时间', '距市电失去 / ms', '余量 / ms', series(12, 96, ms => ms < gap ? Math.max(0, hold - ms) : hold))],
    }
  },
  prediction: quiz('450 W 负载的保持时间为 8 ms，模拟 4 ms 转换间隙时会怎样？', ['市电不会消失', '服务器可连续供电，但 UPS 输出有短缺口', '服务器一定重新启动'], 1, '服务器内部储能可以覆盖缺口。UPS 供电连续性要结合负载容许的间断时间判断。'),
  explanation: quiz('为什么相同的服务器储能在 900 W 时能保持的时间只有 450 W 时的一半？', ['备用电池的额定电压减半', '市电频率翻倍', '可用能量一定时，t=E/P'], 2, '提高恒功率负载会按比例加快储能消耗，使跨越转换间隙的余量变小。'),
  comic: strip(['UPS 日志说已经切到电池。我还需要查服务器有没有掉电吗？', '把 4 ms 放慢。切换期间看第一只表，逆变支路还没成为输出源。',
    '第二只表还有余量，原来是服务器自己撑着。450 W、8 ms 足够。', '恢复市电，让储能回满。将这台服务器换成仅有 2 ms 储备的同功率负载。',
    '又是同样的 4 ms，这次掉电记录加了一，即使后来输出也恢复到 230 V。', '换成另一种负载前，既看 UPS 转换指标，也看负载的保持时间和当时功率。'], [0, 1, 2, 2, 0, 3]),
  goals: [
    { text: '保留 450 W、8 ms，选“市电中断”并推进 1 秒，看到备用供电且掉电记录为零。', check: s => backupAvailable(s.input, s.memory) && near(reading(s, '最长输出间隙'), 4) && reading(s, '服务器掉电记录') === 0 },
    { text: '先恢复市电，把保持时间调成 2 ms，然后再中断并推进 1 秒，观察掉电记录加一。', check: s => !!s.memory.returned && s.input.hold === 2 && reading(s, '服务器掉电记录') > 0 && backupAvailable(s.input, s.memory) },
  ],
  practice: [['grid', 1], 1, ['grid', 0], ['hold', 2], ['grid', 1], 1],
  assumptions: '只放大转换窗口。1 s 仿真推进 10 ms 电气时间。4 ms 取产品典型值。负载按恒功率等效，储能预算为 450 W×基准保持时间。有源恢复时立即补满，记供电丢失次数。忽略启动耗时、回切延迟与长时电池耗尽。', review: true,
  trials: [
    { name: '正常 · 储能跨过切换间隙', moves: [['grid', 1], 0.7], verify: s => near(reading(s, '最长输出间隙'), 4) && reading(s, 'UPS 输出包络') === 230 && s.memory.resets === 0 },
    { name: '误操作 · 忽略负载保持时间', moves: [['grid', 1], 1, ['grid', 0], ['hold', 2], ['grid', 1], 1], verify: s => s.memory.resets === 1 && near(reading(s, '最长输出间隙'), 4) && !!s.memory.returned },
    { name: '故障与恢复 · 后备不可用后市电返回', moves: [['battery', 1], ['grid', 1], 1.2, ['grid', 0]], verify: s => near(reading(s, '最长输出间隙'), 12) && reading(s, 'UPS 输出包络') === 230 && s.memory.resets === 1 },
    { name: '迁移 · 900 W 负载、8 ms 基准储能，在掉电后恰好跨过 4 ms 间隙', moves: [['load', 900], ['grid', 1], 0.4], verify: s => s.input.grid === 1 && s.input.load === 900 && s.input.hold === 8 && near(reading(s, '负载可保持'), 4) && near(reading(s, '最长输出间隙'), 4) && s.memory.resets === 0 },
  ],
}
