import {useId} from 'react'
import type {Lesson,Snapshot} from '../core/types'
import {formatValue} from '../core/engine'

export function CircuitSheet({lesson,state}:{lesson:Lesson;state:Snapshot}){
  const tag=useId()
  const get=(pattern:RegExp)=>state.frame.meters.find(([label])=>pattern.test(label))
  if(lesson.wiring){
    const board=lesson.wiring,columns=Math.ceil(board.terminals.length/2),wide=560
    const pin=(idx:number)=>({x:46+(idx%columns)*(wide-92)/Math.max(1,columns-1),y:idx<columns?42:141})
    return <figure className="circuit-sheet"><figcaption><strong>端子连接实况</strong><span>弧线 = 当前插入的导线</span></figcaption>
      <svg viewBox="0 0 560 176" role="img" aria-label="当前接线拓扑。灯座内的固定元件不是跳线。">
        {board.leads.filter(lead=>state.input[lead.control]).map((lead,index)=>{const from=pin(lead.from),to=pin(lead.to);return <path key={lead.control} d={`M${from.x} ${from.y} Q${(from.x+to.x)/2+8*(index%3)} ${(from.y+to.y)/2+(from.y===to.y?-29:19)} ${to.x} ${to.y}`} fill="none" stroke={['#287357','#ae7237','#476c88'][index%3]} strokeWidth="2.7"/>})}
        {lesson.id===2&&[[2,3],[4,5]].map(([from,to],index)=>{const left=pin(from),right=pin(to),xx=left.x*.5+right.x*.5,yy=(left.y+right.y)/2+(left.y===right.y?-24:0);return <g key={index}><path d={`M${left.x} ${left.y} L${xx} ${yy} L${right.x} ${right.y}`} stroke="#85816c" strokeDasharray="3 3" fill="none"/><circle cx={xx} cy={yy} r="9" fill="#faf4dd" stroke="#766837"/><path d={`M${xx-5} ${yy-5}l10 10m0 -10l-10 10`} stroke="#766837"/><text x={xx+13} y={yy-4}>{index?'灯 B':'灯 A'}</text></g>})}
        {board.terminals.map((label,idx)=>{const at=pin(idx);return <g key={idx}><circle cx={at.x} cy={at.y} r="4.3" fill="#fff9ed" stroke="#324e39" strokeWidth="2"/><text x={at.x} y={idx<columns?at.y-10:at.y+16} textAnchor="middle">{label}</text></g>})}
      </svg></figure>
  }
  if(lesson.id===5){
    const volts=get(/电容电压/)?.[1]??0,open=!state.input.contact||!!state.input.fault
    return <figure className="circuit-sheet"><figcaption><strong>RC 一阶电路</strong><span>当前电容电压：{formatValue(volts)} V</span></figcaption><svg viewBox="0 0 560 142" role="img" aria-label="电阻电容回路和电压参考方向。开关和电压读数对应当前工况。">
      <g stroke="#3e5b49" strokeWidth="2.5" fill="none"><path d="M88 39h63m35 0h35m60 0h87v31m0 10v33H88V86m0-13V39"/><path d="M224 31h56v16h-56z"/><path d="M349 70h38m-38 10h38M74 73h28m-22 13h16"/><path d={open?'M151 39l31-20':'M151 39h34'}/><circle cx="151" cy="39" r="2.4"/><circle cx="185" cy="39" r="2.4"/></g>
      <g textAnchor="middle"><text x="87" y="18">{state.input.contact===2?'0 V 参考':'12 V 源'}</text><text x="252" y="21">R = {state.input.resistor} kΩ</text><text x="432" y="79">C：{[800,1000,1200][state.input.cap]} µF</text><text x="167" y="65">{open?'支路断开':'支路闭合'}</text><text x="240" y="133">τ = R × C</text></g></svg></figure>
  }
  if(lesson.id!==7)return null
  const coil=(get(/线圈|接触器/)?.[1]??0)>0
  const hold=(get(/保持支路导通/)?.[1]??0)>0
  return <figure className="circuit-sheet"><figcaption><strong>点动 / 自锁控制原理</strong><span>功能符号，不是现场接线图</span></figcaption><svg viewBox="0 0 560 128" role="img" aria-labelledby={tag}><title id={tag}>常开启动触点与辅助常开触点并联，线圈状态：{coil?'吸合':'释放'}</title><g fill="none" stroke="#516b56" strokeWidth="2.5"><path d="M32 40h57m26 0h60m0 0h43m16 0h69m0 0h93m44 0h86M175 40v51h43m16 0h69V40M89 28v24m26-24v24m-29-1 33-24M218 28v24m16-24v24"/><path d="M218 79v24m16-24v24" stroke={hold&&coil?'#167243':'#849488'}/><path d="M396 27h44v26h-44z" fill={coil?'#acd0ac':'#ecefe4'}/></g><g textAnchor="middle"><text x="99" y="18">停止条件</text><text x="226" y="18">启动触点</text><text x="235" y="120">KM 辅助常开</text><text x="418" y="18">KM 线圈</text><text x="418" y="45">{coil?'吸合':'释放'}</text><text x="46" y="66">模型源</text><text x="490" y="66">回路返回</text></g></svg></figure>
}
