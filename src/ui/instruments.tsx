import { useId, useState } from 'react'
import { Cable, Check, Circle, ListTree, Minus, MousePointer2, Plus, X } from 'lucide-react'
import type { Control, Lesson, Move, Plot, Snapshot } from '../core/types'
import { formatValue, type Run } from '../core/engine'
import {CircuitSheet} from './circuit-sheet'

export function Controls({lesson,state,operate}:{lesson:Lesson;state:Snapshot;operate:(move:Move)=>void}) {
  const specialized=new Set([...(lesson.wiring?.leads.map(lead=>lead.control)??[]),...(lesson.ladder?.rungs.flatMap(rung=>rung.slots.map(slot=>slot.control))??[])])
  const general=lesson.controls.filter(control=>!specialized.has(control.id))
  return <div className="controls-stack">
    {lesson.wiring&&<WireBoard lesson={lesson} state={state} operate={operate}/>}
    {lesson.ladder&&<div className="ladder-panel"><h4><ListTree size={16}/>可编辑梯形图</h4><p>选择触点、指令或时间设置，观察下一次扫描的结果。不是可下载到 PLC 的工程。</p>{lesson.ladder.rungs.map((rung,index)=><div className="rung" key={index}><span className="rung-no">{String(index+1).padStart(2,'0')}</span><div className="rung-body">{rung.slots.map((slot,position)=><label key={slot.control+'-'+position}><span>─┤ ├─</span><select aria-label={lesson.controls.find(control=>control.id===slot.control)?.label??slot.control} data-control={slot.control} value={state.input[slot.control]} onChange={event=>operate([slot.control,Number(event.target.value)])}>{slot.options.map((label,idx)=><option value={idx} key={idx}>{label}</option>)}</select></label>)}<b>─( {rung.output} )</b></div></div>)}</div>}
    {general.map(control=><ControlField key={control.id} control={control} value={state.input[control.id]} operate={operate}/>)}
  </div>
}
function ControlField({control,value,operate}:{control:Control;value:number;operate:(move:Move)=>void}) {
  const id=useId()
  if(control.kind==='button')return <button className="operation-button" data-control={control.id} onClick={()=>operate([control.id,1])}><MousePointer2 size={15}/>{control.label}</button>
  return <div className="control-field"><label htmlFor={id}>{control.label}</label>{control.kind==='choice'
    ?<select id={id} data-control={control.id} value={value} onChange={event=>operate([control.id,Number(event.target.value)])}>{control.options?.map((option,index)=><option key={index} value={index}>{option}</option>)}</select>
    :<div className="slider-field"><input id={id} type="range" data-control={control.id} min={control.min} max={control.max} step={control.step} value={value} onChange={event=>operate([control.id,Number(event.target.value)])}/><div className="range-row"><small>{control.min} – {control.max} {control.unit}</small><label><input aria-label={control.label+' 数值'} type="number" min={control.min} max={control.max} step={control.step} value={value} onChange={event=>{const next=event.currentTarget.valueAsNumber;if(event.currentTarget.validity.valid&&Number.isFinite(next))operate([control.id,next])}}/>{control.unit}</label></div></div>}</div>
}
function WireBoard({lesson,state,operate}:{lesson:Lesson;state:Snapshot;operate:(move:Move)=>void}) {
  const wiring=lesson.wiring!
  const [start,setStart]=useState<number|null>(null)
  const [hint,setHint]=useState('选两个端子插入导线；再选同一对可拔下。')
  const columns=Math.max(2,Math.ceil(wiring.terminals.length/2))
  const point=(index:number)=>({x:10+(index%columns)*80/Math.max(columns-1,1),y:index<columns?23:76})
  const choose=(idx:number)=>{
    if(start===null){setStart(idx);setHint('已选 '+wiring.terminals[idx]+'，请选择另一端。');return}
    const lead=wiring.leads.find(item=>(start===item.from&&idx===item.to)||(start===item.to&&idx===item.from))
    if(lead){const add=!state.input[lead.control];operate([lead.control,add?1:0]);setHint((add?'已接入：':'已拔下：')+wiring.terminals[start]+' ↔ '+wiring.terminals[idx])}
    else setHint(start===idx?'已取消端子选择。':'该对端子不在本教学板可插接范围内，未改变现有线路。')
    setStart(null)
  }
  return <div className="wire-panel"><h4><Cable size={16}/>虚拟接线板</h4><p role="status">{hint}</p><div className="wireboard"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{wiring.leads.filter(lead=>state.input[lead.control]).map((lead,index)=>{const from=point(lead.from),to=point(lead.to);return <path key={lead.control} d={`M${from.x} ${from.y} Q${(from.x+to.x)/2} ${Math.min(96,(from.y+to.y)/2+20+index%4*4)} ${to.x} ${to.y}`} stroke={['#b4652d','#267a68','#486a90','#8b6469'][index%4]} fill="none" strokeWidth="2.4" vectorEffect="non-scaling-stroke"/>})}</svg>
    {wiring.terminals.map((label,index)=><button key={index} data-terminal={index} aria-pressed={start===index} style={{left:point(index).x+'%',top:point(index).y+'%'}} onClick={()=>choose(index)}><i/>{label}</button>)}</div><details><summary>可选导线列表（键盘操作）</summary>{wiring.leads.map(lead=><label className="wire-choice" key={lead.control}><input type="checkbox" data-control={lead.control} checked={!!state.input[lead.control]} onChange={event=>operate([lead.control,event.target.checked?1:0])}/>{wiring.terminals[lead.from]} ↔ {wiring.terminals[lead.to]}</label>)}</details></div>
}
export function Diagram({lesson,state}:{lesson:Lesson;state:Snapshot}) {
  const id=useId().replaceAll(':','')
  const count=lesson.diagram.nodes.length,cols=count<=4?count:Math.ceil(count/2),rows=Math.ceil(count/cols),width=720
  const offset=26,cell=(width-offset*2)/cols,height=rows*100+26
  const point=(idx:number)=>({x:offset+cell*(idx%cols+.5),y:40+Math.floor(idx/cols)*100})
  return <><CircuitSheet lesson={lesson} state={state}/><figure className="diagram-view"><figcaption><strong>功能原理与状态图</strong><span><i/> 高亮为模型当前有效节点</span></figcaption><svg viewBox={'0 0 '+width+' '+height} role="img" aria-label={lesson.title+' 功能关系图，不是现场接线图'}><defs><marker id={id+'arr'} viewBox="0 0 6 6" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 6 3 0 6" fill="#81968d"/></marker></defs>
    {lesson.diagram.edges.map(([from,to],index)=>{const a=point(from),b=point(to),active=state.frame.active.includes(from)&&state.frame.active.includes(to),delta=b.x-a.x,radius=Math.min(54,cell*.38)
      let path:string
      if(from===to){path=`M${a.x+radius*.5} ${a.y+18} C${a.x+radius+20} ${a.y+55},${a.x+radius+25} ${a.y},${a.x+radius+2} ${a.y}`}
      else if(a.y===b.y&&Math.abs(to-from)===1){const sign=Math.sign(delta);path=`M${a.x+sign*radius} ${a.y} H${b.x-sign*(radius+3)}`}
      else if(a.y===b.y){path=`M${a.x} ${a.y+18} Q${(a.x+b.x)/2} ${a.y+65} ${b.x} ${b.y+20}`}
      else {const sign=Math.sign(b.y-a.y),mid=(a.y+b.y)/2+(index%3-1)*6;path=`M${a.x} ${a.y+sign*18} V${mid} H${b.x} V${b.y-sign*20}`}
      return <path key={index} d={path} fill="none" stroke={active?'#287862':'#9daea6'} strokeWidth={active?3.2:1.8} strokeDasharray={active?undefined:'4 3'} markerEnd={'url(#'+id+'arr)'}/>})}
    {lesson.diagram.nodes.map((label,index)=>{const at=point(index),active=state.frame.active.includes(index),radius=Math.min(54,cell*.38)
      return <g key={index} data-node={index} data-active={active}><title>{label+'：'+(active?'有效':'未激活')}</title><rect x={at.x-radius} y={at.y-18} width={radius*2} height="36" rx="6" fill={active?'#d6eee1':'#f5f6ef'} stroke={active?'#347961':'#b4c0b7'}/><text textAnchor="middle" x={at.x} y={at.y+4} fontSize={Math.min(13,radius*1.88/Math.max(1,label.length))} fill="#243e33">{label}</text><text textAnchor="middle" x={at.x} y={at.y+33} fontSize="9" fill="#62786e">{active?'● 有效':'○ 待机'}</text></g>})}</svg></figure></>
}
export function PlotView({plot}:{plot:Plot}) {
  const points=plot.points.filter(point=>point.every(Number.isFinite))
  if(!points.length)return <p>{plot.title}：尚无可绘制数据。</p>
  const xs=points.map(point=>point[0]),ys=points.map(point=>point[1])
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys)
  const lowerY=maxY===minY?minY-Math.max(1,Math.abs(minY)*.1):minY
  const upperY=maxY===minY?maxY+Math.max(1,Math.abs(maxY)*.1):maxY
  const convert=([xx,yy]:[number,number])=>[50+(xx-minX)/Math.max(maxX-minX,1e-12)*438,114-(yy-lowerY)/(upperY-lowerY)*83]
  const compact=(value:number)=>Math.abs(value)>=10000||Math.abs(value)>0&&Math.abs(value)<.01?value.toExponential(1):String(Number(value.toFixed(2)))
  return <figure className="plot"><figcaption><strong>{plot.title}</strong><span>{plot.y}</span></figcaption><svg viewBox="0 0 510 146" role="img" aria-label={plot.title+'，横轴 '+plot.x+'，纵轴 '+plot.y}><title>{points.length} 个模型采样点</title>
    {[0,.5,1].map(frac=><g key={frac}><path d={`M50 ${114-frac*83}H489`} stroke="#cdd8cf" strokeDasharray="3 4"/><text x="44" y={118-frac*83} textAnchor="end">{compact(lowerY+frac*(upperY-lowerY))}</text></g>)}<path d="M50 26V114H490" stroke="#9eafa3" fill="none"/><polyline points={points.map(point=>convert(point).join(',')).join(' ')} fill="none" stroke="#15725a" strokeWidth="2.5"/><circle cx={convert(points.at(-1)!)[0]} cy={convert(points.at(-1)!)[1]} r="3" fill="#bc782b"/>
    <text x="50" y="132">{compact(minX)}</text><text x="489" y="132" textAnchor="end">{compact(maxX)}</text><text x="270" y="138" textAnchor="middle">{plot.x}</text></svg><details><summary>读取数据点</summary><div className="table-scroll"><table><thead><tr><th>{plot.x}</th><th>{plot.y}</th></tr></thead><tbody>{points.map(([xx,yy],index)=><tr key={index}><td>{formatValue(xx)}</td><td>{formatValue(yy)}</td></tr>)}</tbody></table></div></details></figure>
}
export function Meters({run}:{run:Run}) {
  return <div className="meters">{run.state.frame.meters.map(([label,value,unit],index)=><div key={index}><small>{label}</small><strong data-meter={index} data-value={value}>{formatValue(value)} <em>{unit}</em></strong></div>)}</div>
}
