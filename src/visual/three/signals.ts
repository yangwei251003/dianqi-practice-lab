import type { Control, Meter, Part, Snapshot } from '../../core/types'
import type { Object3D } from 'three'
import { clamp, type Kit } from './kit'

/** A positional fallback is only valid when its unit belongs to this physical quantity. */
export function reading(s: Snapshot, label: RegExp, unit?: RegExp, index?: number): Meter | undefined {
  const byName = s.frame.meters.find(m => label.test(m[0]) && (!unit || unit.test(m[2])))
  if (byName) return byName
  if (index !== undefined && unit) {
    const candidate = s.frame.meters[index]
    if (candidate && unit.test(candidate[2])) return candidate
  }
}

export const value = (s: Snapshot, label: RegExp, unit?: RegExp, index?: number) => reading(s,label,unit,index)?.[1] ?? 0

export function controlPosition(control: Control | undefined, part: Part, s: Snapshot, presetButton=false) {
  if (!control) return 0
  const v = s.input[control.id] ?? control.initial
  if (control.kind === 'button') return Number(s.action === control.id)
  if (presetButton && part.value !== undefined) return Number(v === part.value)
  if (control.kind === 'choice') return clamp(v / Math.max(1,(control.options?.length ?? 2)-1))
  if (control.kind === 'range') return clamp((v-(control.min ?? 0)) / Math.max(0.000001,(control.max ?? 1)-(control.min ?? 0)))
  return 0
}

export function displayValue(n: number): string {
  if (!Number.isFinite(n)) return '—'
  const a = Math.abs(n)
  if (a >= 1e6) return n.toExponential(2)
  return n.toLocaleString('zh-CN', { maximumFractionDigits: a > 999 ? 0 : a >= 10 ? 1 : a >= 1 ? 2 : 3, useGrouping: false })
}

const mainChannel:Record<number,[RegExp,RegExp?,number?]>={
  1:[/^母线模型电压$/,/^V$/,0],2:[/电源电流/,/mA/],3:[/已核合格芯线/],4:[/表显/],5:[/^电容电压$/,/V/],
  6:[/中线电流/,/^A$/],7:[/^线圈电压$/,/^V$/],8:[/^主轴转速$/,/r\/min/],9:[/线电流倍数/],
  10:[/^转子转速$/,/r\/min/],11:[/^风量$/],12:[/^总流量$/],13:[/^显示计数$/,/箱/],
  14:[/有效间隙/,/mm/],15:[/回路电流/,/mA/],16:[/井内水位/,/^%$/],17:[/独立标尺/,/mm/],
  18:[/推杆行程/,/^%$/],19:[/机端线电压/,/V/],20:[/当前表计/,/V/],21:[/整回路压降/,/V/],
  22:[/候选区段/],23:[/电流/,/A/],24:[/功率因数/],25:[/峰峰纹波/,/V/],26:[/输出平均电压/,/V/],
  27:[/负载电压/,/^V$/],28:[/基波有效值/,/V/],29:[/轴转速/,/r\/min/],30:[/UPS 输出包络/,/V/],
  31:[/工作功率/,/^W$/],32:[/^PV 功率$/,/^W$/],33:[/^实际有功$/,/kW/],
  34:[/^估计 SOC$/,/^%$/],35:[/^储能交流功率/,/kW/],36:[/^实际充电电流$/,/^A$/],
  37:[/剩余保持/,/s/],38:[/^室温$/,/°C/],39:[/探头示值/,/ppm/],40:[/^门缝$/,/mm/],
  41:[/本阶段已过/,/s/],42:[/^直流电压$/,/V/],43:[/^已过箱数$/,/箱/],44:[/^液位$/,/^%$/],
  45:[/^拟供视在$/,/kVA/],46:[/^A 区模型气温$/,/°C/],47:[/^实际位置$/,/^m$/],48:[/^并网有功$/,/kW/],
}
export function mainReading(id:number,s:Snapshot) {
  const spec=mainChannel[id]
  return (spec && reading(s,...spec)) || s.frame.meters[0]
}
export function meterText(id:number,s:Snapshot) {
  const m=mainReading(id,s)
  return m?displayValue(m[1])+(m[2]?' '+m[2]:''):'—'
}

export function spin(k: Kit, rotor: Object3D, axis: 'x'|'y'|'z', speed: (s: Snapshot) => number) {
  const initial=rotor.rotation[axis]
  k.respond((state,_focus,dt)=>{if(dt<0||state.action==='init')rotor.rotation[axis]=initial})
  k.motions.push((state,seconds)=>{
    const rate=speed(state)
    if(Number.isFinite(rate)&&rate!==0)rotor.rotation[axis]=(rotor.rotation[axis]+Math.sign(rate)*Math.min(8,Math.log1p(Math.abs(rate))*.95)*seconds)%(Math.PI*2)
  })
}
