import {useId,useState} from 'react'
import {ChevronLeft,ChevronRight,Crosshair} from 'lucide-react'
import type {Meter} from '../core/types'
import {formatValue} from '../core/engine'

export function ProbePlate({readings}:{readings:Meter[]}){
  const [index,setIndex]=useState(0),[pinned,setPinned]=useState(false),[armed,setArmed]=useState(false),tip=useId()
  const reading=readings[index]??readings[0]
  return <div className="probe-wrap"><div className="probe-caption"><span>INSPECTION LENS / 测量镜</span><button aria-describedby={tip} aria-expanded={pinned} className="help-tip" onClick={()=>setPinned(!pinned)}>测点说明 <b>?</b><span id={tip} role="tooltip" data-pinned={pinned}>这是已捕捉的读数。准星和短余迹标记观察位置，不代表电流。</span></button></div><div data-pointer data-ink-trail className={'probe-map mx-reactive mx-spot mx-reticle '+(armed?'probe-key':'')} onKeyDown={()=>setArmed(true)} onPointerMove={()=>{if(armed)setArmed(false)}}><svg viewBox="0 0 440 80" preserveAspectRatio="none" aria-hidden="true"><path d="M0 44 H66 L78 25 H136 L148 48 H204 L216 31 H260 L277 50 H360 L373 32 H440"/></svg><i className="probe-bearing" aria-hidden="true"/>{readings.map(([label],slot)=><button key={slot} data-probe={slot} aria-label={'观察：'+label} aria-pressed={index===slot} onClick={()=>setIndex(slot)} style={{left:`${12+slot*76/Math.max(1,readings.length-1)}%`,top:`${slot%2===0?58:39}%`}}>{String(slot+1).padStart(2,'0')}</button>)}</div><div className="probe-output"><Crosshair size={15}/>{reading&&<><strong>{reading[0]}</strong><output>{formatValue(reading[1])} {reading[2]}</output></>}</div></div>
}
export function FrameNav({index,count,onChange,label}:{index:number;count:number;onChange:(index:number)=>void;label:string}){return <div className="frame-nav" aria-label={label}><button aria-label="上一格" disabled={index===0} onClick={()=>onChange(index-1)}><ChevronLeft size={15}/></button><span aria-live="polite">{String(index+1).padStart(2,'0')} / {String(count).padStart(2,'0')}</span><button aria-label="下一格" disabled={index===count-1} onClick={()=>onChange(index+1)}><ChevronRight size={15}/></button></div>}
