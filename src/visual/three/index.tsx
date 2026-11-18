import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Box, ChevronDown, Focus, Layers2, Maximize, Minus, MousePointer2, Plus, RotateCcw } from 'lucide-react'
import type { Lesson, Snapshot } from '../../core/types'
import { displayValue, mainReading } from './signals'
import { Viewer } from './viewer'
import { inks, phenomena } from './phenomena'
import './rig.css'

export interface RigProps {
  lesson:Lesson
  state:Snapshot
  running:boolean
  focus:number
  onFocus:(index:number)=>void
  onOperate:(index:number)=>void
  onStatus?:(status:'3d'|'fallback')=>void
}
type Mode='loading'|'3d'|'fallback'
const num=(i:number)=>String(i+1).padStart(2,'0')
function requestedFlat() {
  if(typeof window==='undefined') return false
  const q=new URLSearchParams(window.location.search)
  return q.get('rig')==='2d'||q.get('fallback')==='1'||q.get('forceFallback')==='1'
}

function Diagram({lesson,state}:{lesson:Lesson;state:Snapshot}) {
  const {nodes,edges}=lesson.diagram
  const columns=Math.min(3,Math.max(1,nodes.length)),rows=Math.ceil(nodes.length/columns)
  const w=459,h=rows*57+12
  const pos=(i:number)=>{
    const row=Math.floor(i/columns),col=i%columns
    return {x:(row%2?columns-col-0.5:col+0.5)*w/columns,y:row*57+32}
  }
  return <svg className="el-rig-diagram" viewBox={'0 0 '+w+' '+h} role="img" aria-label={lesson.title+'二维状态图'}>
    {edges.map(([a,b],i)=>{
      if(!nodes[a]||!nodes[b])return null
      const start=pos(a),end=pos(b)
      return <path key={i} d={'M'+start.x+' '+start.y+' V'+(start.y+end.y)/2+' H'+end.x+' V'+end.y} fill="none" stroke={state.frame.active.includes(a)&&state.frame.active.includes(b)?'#38836e':'#aab8ae'} strokeWidth="2"/>
    })}
    {nodes.map((name,i)=>{
      const {x,y}=pos(i),active=state.frame.active.includes(i)
      return <g key={i} transform={'translate('+x+' '+y+')'}><rect x="-61" y="-16" width="122" height="32" rx="5" fill={active?'#286452':'#fafbf6'} stroke={active?'#286452':'#9aada1'}/><text x="0" y="5" textAnchor="middle" fill={active?'#fff':'#30483f'} fontSize="12" textLength={name.length>9?106:undefined} lengthAdjust="spacingAndGlyphs">{name}</text></g>
    })}
  </svg>
}

export function Rig(props:RigProps) {
  const {lesson,state,focus,onFocus,onOperate}=props
  const [flat,setFlat]=useState(requestedFlat),[failed,setFailed]=useState(false)
  const [mode,setMode]=useState<Mode>('loading')
  const [cutaway,setCutaway]=useState(false)
  const [detail,setDetail]=useState(true),[fields,setFields]=useState(true),[expanded,setExpanded]=useState(false)
  const stage=useRef<HTMLElement>(null)
  const canvas=useRef<HTMLCanvasElement>(null),pin=useRef<HTMLButtonElement>(null),viewer=useRef<Viewer|null>(null)
  const latest=useRef(props)
  const helpId=useId()
  const isFlat=flat||failed
  useEffect(()=>{latest.current=props},[props])

  useEffect(()=>{
    if(isFlat) {setMode('fallback');return}
    if(!canvas.current||!pin.current) return
    let alive=true
    let instance:Viewer|undefined
    const fail=()=>{if(alive){setMode('fallback');setFailed(true)}}
    try {
      instance=new Viewer(canvas.current,pin.current,(index,operate)=>{
        latest.current.onFocus(index)
        if(operate) latest.current.onOperate(index)
      },fail,()=>{if(alive)setMode('3d')})
      viewer.current=instance
      const now=latest.current
      instance.load(now.lesson);instance.apply(now.state,now.focus)
    } catch {fail()}
    return ()=>{alive=false;viewer.current=null;instance?.dispose()}
  },[isFlat])

  useEffect(()=>{
    try {viewer.current?.load(lesson);viewer.current?.apply(state,focus)}
    catch {setMode('fallback');setFailed(true)}
  },[lesson,state,focus])
  useEffect(()=>{if(mode!=='loading') latest.current.onStatus?.(mode)},[mode])

  useEffect(()=>{if(mode==='3d')viewer.current?.cutaway(cutaway)},[cutaway,mode,lesson])
  useEffect(()=>{viewer.current?.studio(detail)},[detail,mode,lesson])
  useEffect(()=>{viewer.current?.fields(fields)},[fields,mode,lesson])
  useEffect(()=>{viewer.current?.setRunning(props.running)},[mode,props.running])
  useEffect(()=>{const escape=(event:globalThis.KeyboardEvent)=>{if(event.key==='Escape')setExpanded(false)};if(expanded)window.addEventListener('keydown',escape);return ()=>window.removeEventListener('keydown',escape)},[expanded])
  const physical=Array.from(new Map(phenomena(lesson.id).map(channel=>[channel.label,channel])).values())
  const part=lesson.parts[focus]
  const meter=mainReading(lesson.id,state)
  const key=(e:KeyboardEvent<HTMLCanvasElement>)=>{
    if(e.altKey||e.ctrlKey||e.metaKey) return
    const n=lesson.parts.length
    if(e.key==='Enter'||e.key===' ') {e.preventDefault();if(part && !e.repeat) onOperate(focus)}
    else if(e.key==='ArrowRight'||e.key==='ArrowLeft') {e.preventDefault();if(n)onFocus((focus+(e.key==='ArrowRight'?1:-1)+n)%n)}
    else if(/^[1-9]$/.test(e.key)&&Number(e.key)<=n) {e.preventDefault();onFocus(Number(e.key)-1)}
    else if(e.key==='Home') {e.preventDefault();viewer.current?.home()}
    else if(['+','=','-'].includes(e.key)) {e.preventDefault();viewer.current?.zoom(e.key==='-'?0.82:1.22)}
  }
  return <section ref={stage} className={'el-rig'+(expanded?' stage-expanded':'')} aria-label="交互实训模型" data-rig-view={mode} data-station={lesson.id}>
    <div className="el-rig-stage">
      {isFlat?<div className="el-rig-flat">
        <Diagram lesson={lesson} state={state}/>
        {failed&&<span className="el-rig-error">三维渲染不可用，已显示二维状态图</span>}
      </div>:<canvas ref={canvas} className="el-rig-canvas" aria-label={lesson.title+'可操作三维模型'} aria-describedby={helpId} tabIndex={0} onKeyDown={key}/>}
      {!isFlat&&<button ref={pin} type="button" className="el-rig-pin" data-rig-hotspot={focus} aria-label={'操作模型热点 · '+(part?.label??'')} title={part?.label} onClick={()=>part&&onOperate(focus)}>{num(focus)}</button>}
      <div className="el-rig-mode"><i className={mode==='3d'?'is-on':''}/>{mode==='3d'?'实时 3D':mode==='loading'?'载入模型':'二维状态图'}</div>
      <div className="el-rig-tools" role="group" aria-label="模型视角">
        <button type="button" title="放大或还原演示屏（Esc 退出）" aria-label="放大演示屏" aria-pressed={expanded} onClick={()=>setExpanded(value=>!value)}><Maximize/></button>
        {!isFlat&&<>
          {lesson.id===21&&<button type="button" title="教学剖视：隐藏外护套" aria-label="三芯电缆教学剖视" aria-pressed={cutaway} data-cutaway onClick={()=>setCutaway(current=>!current)}><Layers2 size={15}/></button>}
          <button type="button" title="缩小" aria-label="缩小模型" onClick={()=>viewer.current?.zoom(0.82)}><Minus/></button>
          <button type="button" title="放大" aria-label="放大模型" onClick={()=>viewer.current?.zoom(1.22)}><Plus/></button>
          <button type="button" title="复位视角" aria-label="复位视角" onClick={()=>viewer.current?.home()}><Focus/></button>
        </>}
        <button type="button" title={isFlat?'打开三维模型':'切换二维状态图'} aria-label={isFlat?'打开三维模型':'切换二维状态图'} onClick={()=>{setMode('loading');setFailed(false);setFlat(!isFlat)}}>{isFlat?(failed?<RotateCcw/>:<Box/>):<Layers2/>}</button>
      </div>
      {meter&&<div className="el-rig-readout" data-rig-reading={meter[0]}><span>{meter[0]}</span><strong>{displayValue(meter[1])}</strong><small>{meter[2]}</small></div>}
      {lesson.id===21&&cutaway&&!isFlat&&<div className="cutaway-label">护套已隐藏 · 三根绝缘导体为结构示意</div>}
    </div>
    <div className="el-rig-bar">
      {!isFlat&&<div className="field-toggles"><button type="button" data-studio-detail aria-pressed={detail} onClick={()=>setDetail(value=>!value)}>{detail?'设备特写':'整台全景'}</button><button type="button" data-field-layer aria-pressed={fields} onClick={()=>setFields(value=>!value)}>原理透视</button></div>}
      <div className="el-rig-pick"><span className="el-rig-no">{num(focus)}</span><select aria-label="选中模型部件" value={part?focus:''} onChange={e=>onFocus(Number(e.target.value))}>
        {lesson.parts.map((p,i)=><option key={i} value={i}>{p.label}</option>)}
      </select><ChevronDown size={13} aria-hidden="true"/></div>
      <button className="el-rig-operate" type="button" data-rig-operate={focus} disabled={!part} title={part?.detail} onClick={()=>part&&onOperate(focus)}><MousePointer2 size={14}/> 操作部件</button>
    </div>
    {!isFlat&&fields&&<div className="field-legend">{physical.map(channel=><span key={channel.label}><i style={{background:inks[channel.ink]}}/>{channel.label}</span>)}<small>示意轨迹与慢动作，不按实际速度或尺寸绘制。</small></div>}
    <p className="el-rig-help" id={helpId}>{isFlat?'绿色节点表示当前有效状态。':'拖动旋转，滚轮缩放。单击选中，双击部件或点橙色手柄操作。'}<span className="el-rig-sr">模型获得键盘焦点后，方向键或数字键选择部件，回车或空格操作，Home 复位视角。</span></p>
  </section>
}
