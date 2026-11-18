import {useEffect, useId, useRef, useState, type ReactNode} from 'react'
import {flushSync} from 'react-dom'
import {Check, Crosshair, NotebookPen, X} from 'lucide-react'
import type {Lesson, Snapshot} from '../core/types'
import {ProbePlate} from './motion-instruments'
import {formatValue} from '../core/engine'

const key='dianqi.motion.preference.v1'
export function quietMotion(){return document.documentElement.dataset.motion==='quiet'||matchMedia('(prefers-reduced-motion: reduce)').matches}
function readQuiet(){try{return localStorage.getItem(key)==='quiet'}catch{return false}}
export function useMotionSetting(){
  const [quiet,setQuiet]=useState(readQuiet)
  useEffect(()=>{document.documentElement.dataset.motion=quiet?'quiet':'auto';try{localStorage.setItem(key,quiet?'quiet':'auto')}catch{}},[quiet])
  return [quiet,setQuiet] as const
}
export function transition(change:()=>void,station?:string){
  if(station){
    const source=Array.from(document.querySelectorAll<HTMLElement>('[data-card-heading]')).find(title=>title.style.viewTransitionName==='station-title'&&title.closest('a')?.getAttribute('href')==='#/'+station)
    const before=source?.getBoundingClientRect();flushSync(change)
    const heading=document.querySelector<HTMLElement>('.lab-heading h1');if(!before||!heading?.animate||quietMotion()||before.bottom<0||before.top>innerHeight)return
    const after=heading.getBoundingClientRect();if(!after.width||!after.height)return
    heading.animate([{transformOrigin:'left top',transform:`translate(${before.left-after.left}px,${before.top-after.top}px) scale(${Math.min(1,before.height/after.height)})`},{transformOrigin:'left top',transform:'none'}],{duration:290,easing:'cubic-bezier(.2,.72,.18,1)'})
    return
  }
  flushSync(change)
  const entry=document.querySelector<HTMLElement>('#main-content h1')?.closest<HTMLElement>('header')??document.querySelector<HTMLElement>('#main-content h1')
  if(!quietMotion()&&entry?.animate)entry.animate([{opacity:.65,transform:'translateY(5px)'},{opacity:1,transform:'none'}],{duration:190,easing:'cubic-bezier(.2,.72,.18,1)'})
}
export function usePointerEffects(){
  useEffect(()=>{
    const selector='[data-pointer],.course-card',fine=matchMedia('(hover:hover) and (pointer:fine)')
    let frame=0,last:PointerEvent|null=null,active:HTMLElement|null=null,trailTime=0
    const reset=(panel:HTMLElement)=>{for(const name of ['--mx','--my','--tilt-x','--tilt-y','--px','--py','--bearing'])panel.style.removeProperty(name)}
    const paint=()=>{
      frame=0;if(!last||!active||!active.isConnected)return
      const rect=active.getBoundingClientRect(),px=last.clientX-rect.left,py=last.clientY-rect.top,xx=px/Math.max(1,rect.width)-.5,yy=py/Math.max(1,rect.height)-.5
      const values={'--mx':`${xx*12}px`,'--my':`${yy*10}px`,'--tilt-x':`${-yy*7}deg`,'--tilt-y':`${xx*8}deg`,'--px':`${px}px`,'--py':`${py}px`,'--bearing':`${Math.atan2(yy*rect.height,xx*rect.width)}rad`}
      for(const [name,value] of Object.entries(values))active.style.setProperty(name,value)
      if(active.hasAttribute('data-ink-trail')&&performance.now()-trailTime>28){trailTime=performance.now();const dot=document.createElement('i');dot.className='probe-trail';dot.style.left=`${px}px`;dot.style.top=`${py}px`;active.append(dot);dot.animate([{opacity:.85,transform:'scale(1)'},{opacity:0,transform:'scale(.15)'}],{duration:360}).finished.then(()=>dot.remove(),()=>dot.remove())}
    }
    const move=(event:PointerEvent)=>{if(quietMotion()||!fine.matches||event.pointerType!=='mouse')return;const panel=event.target instanceof Element?event.target.closest<HTMLElement>(selector):null;if(panel!==active){if(active)reset(active);active=panel}if(!panel)return;last=event;if(!frame)frame=requestAnimationFrame(paint)}
    const out=(event:PointerEvent)=>{if(active&&!(event.relatedTarget instanceof Node&&active.contains(event.relatedTarget))){reset(active);active=null}}
    const press=(event:PointerEvent)=>{const panel=event.target instanceof Element?event.target.closest<HTMLElement>('[data-ripple]'):null;if(!panel||quietMotion())return;const rect=panel.getBoundingClientRect(),dot=document.createElement('i'),diameter=Math.max(rect.width,rect.height)*2;dot.className='press-wave';dot.style.cssText=`left:${event.clientX-rect.left}px;top:${event.clientY-rect.top}px;width:${diameter}px;height:${diameter}px`;panel.append(dot);dot.animate([{transform:'translate(-50%,-50%) scale(.03)',opacity:.38},{transform:'translate(-50%,-50%) scale(1)',opacity:0}],{duration:440,easing:'ease-out'}).finished.then(()=>dot.remove(),()=>dot.remove())}
    document.addEventListener('pointermove',move,{passive:true});document.addEventListener('pointerout',out);document.addEventListener('pointerdown',press,{passive:true})
    return ()=>{cancelAnimationFrame(frame);if(active)reset(active);document.removeEventListener('pointermove',move);document.removeEventListener('pointerout',out);document.removeEventListener('pointerdown',press)}
  },[])
}
export function MorphPlay({playing}:{playing:boolean}){return <svg className={'morph-play '+(playing?'is-playing':'')} width="17" height="17" viewBox="0 0 24 24" aria-hidden="true"><path d={playing?'M5 4 L10 4 L10 20 L5 20 Z':'M6 3 L12 6.5 L12 17.5 L6 21 Z'}/><path d={playing?'M14 4 L19 4 L19 20 L14 20 Z':'M12 6.5 L21 12 L21 12 L12 17.5 Z'}/></svg>}
export function Roll({value}:{value:number}){const text=String(value);return <span className="number-roll" aria-label={text}>{[...text].map((digit,index)=><span aria-hidden="true" className="roll-window" key={text.length-index}><i key={digit}>{digit}</i></span>)}</span>}
export function Toast({text}:{text:string}){return <div className="mx-toast" role="status"><Check size={15}/>{text}</div>}
export function Sheet({open,onClose,title,drawer=false,children}:{open:boolean;onClose:()=>void;title:string;drawer?:boolean;children:ReactNode}){
  const ref=useRef<HTMLDialogElement>(null),id=useId()
  useEffect(()=>{const dialog=ref.current;if(!dialog||!open)return;const opener=document.activeElement instanceof HTMLElement?document.activeElement:null;dialog.showModal();dialog.querySelector<HTMLButtonElement>('header button')?.focus({preventScroll:true});return ()=>{if(dialog.open)dialog.close();if(opener?.isConnected)opener.focus({preventScroll:true})}},[open])
  return <dialog ref={ref} className={drawer?'mx-dialog mx-drawer':'mx-dialog'} aria-labelledby={id} onCancel={event=>{event.preventDefault();onClose()}} onClick={event=>{if(event.target===ref.current){const rect=ref.current!.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)onClose()}}}><header><div><small>FIELD NOTES / 教学仿真</small><h2 id={id}>{title}</h2></div><button type="button" aria-label="关闭面板" onClick={onClose}><X size={19}/></button></header>{children}</dialog>
}
export function FieldNotes({lesson,state,guided,onAppend}:{lesson:Lesson;state:Snapshot;guided:boolean;onAppend:(text:string)=>boolean}){
  const [sample,setSample]=useState<{time:number;meters:Snapshot['frame']['meters'];guided:boolean}|null>(null),[open,setOpen]=useState(false),[toast,setToast]=useState(''),[error,setError]=useState(false)
  useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),2800);return ()=>clearTimeout(timer)},[toast])
  return <div className="sample-bar"><div><Crosshair size={16}/><span>捕捉证据</span><small>定格此刻读数，不暂停设备</small></div><button data-ripple data-capture onClick={event=>{event.currentTarget.focus({preventScroll:true});setError(false);setSample({time:state.time,meters:state.frame.meters.map(reading=>[...reading]),guided});setOpen(true)}}><NotebookPen size={14}/> 取样手记</button><Sheet open={open} drawer title="这一刻的测量" onClose={()=>setOpen(false)}>{sample&&<><p className="sample-origin">{lesson.title} · {sample.guided?'演示样本':'自主实操'} · {formatValue(sample.time)} s</p><ProbePlate readings={sample.meters}/><dl className="reading-list">{sample.meters.map(([label,value,unit])=><div key={label}><dt>{label}</dt><dd>{formatValue(value)} <small>{unit}</small></dd></div>)}</dl><p className="micro">取样后读数保持不变。演示样本可以写入笔记，不计操作成绩。</p><button className="btn primary" data-ripple onClick={()=>{const line=`[教学仿真 · ${sample.guided?'演示':'实操'} · ${formatValue(sample.time)} s] `+sample.meters.map(([name,value,unit])=>`${name} ${formatValue(value)} ${unit}`).join('；');if(!onAppend(line)){setError(true);return}setOpen(false);setToast('此组读数已写入本课实验笔记')}}>写入本课笔记</button>{error&&<p className="mx-error" role="alert">本课笔记最多 4000 字。本次取样未写入，已有笔记未改变。</p>}</>}</Sheet>{toast&&<Toast text={toast}/>}</div>
}
