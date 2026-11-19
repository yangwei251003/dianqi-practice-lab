import {useEffect, useId, useRef, useState, type ReactNode} from 'react'
import {Check, ChevronLeft, ChevronRight, Crosshair, NotebookPen, X} from 'lucide-react'
import type {Lesson, Snapshot} from '../core/types'
import {formatValue} from '../core/engine'

export function Sheet({open,onClose,title,drawer=false,children}:{
  open:boolean; onClose:()=>void; title:string; drawer?:boolean; children:ReactNode
}) {
  const ref=useRef<HTMLDialogElement>(null)
  const id=useId()
  useEffect(()=>{
    const dialog=ref.current
    if(!dialog||!open)return
    const opener=document.activeElement instanceof HTMLElement?document.activeElement:null
    dialog.showModal()
    dialog.querySelector<HTMLButtonElement>('header button')?.focus({preventScroll:true})
    return ()=>{
      if(dialog.open)dialog.close()
      if(opener?.isConnected)opener.focus({preventScroll:true})
    }
  },[open])
  return <dialog ref={ref} className={drawer?'bench-dialog bench-drawer':'bench-dialog'} aria-labelledby={id}
    onCancel={event=>{event.preventDefault();onClose()}}
    onClick={event=>{
      if(event.target!==event.currentTarget)return
      const rect=event.currentTarget.getBoundingClientRect()
      if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)onClose()
    }}>
    <header><div><small>FIELD NOTES / 教学仿真</small><h2 id={id}>{title}</h2></div>
      <button type="button" aria-label="关闭面板" onClick={onClose}><X size={19}/></button></header>
    {children}
  </dialog>
}

export function FrameNav({index,count,onChange,label}:{
  index:number; count:number; onChange:(index:number)=>void; label:string
}) {
  return <div className="frame-nav" aria-label={label}>
    <button aria-label="上一格" disabled={index===0} onClick={()=>onChange(index-1)}><ChevronLeft size={15}/></button>
    <span aria-live="polite">{String(index+1).padStart(2,'0')} / {String(count).padStart(2,'0')}</span>
    <button aria-label="下一格" disabled={index===count-1} onClick={()=>onChange(index+1)}><ChevronRight size={15}/></button>
  </div>
}

export function FieldNotes({lesson,state,guided,onAppend}:{
  lesson:Lesson; state:Snapshot; guided:boolean; onAppend:(text:string)=>boolean
}) {
  const [sample,setSample]=useState<{time:number;meters:Snapshot['frame']['meters'];guided:boolean}|null>(null)
  const [open,setOpen]=useState(false)
  const [saved,setSaved]=useState(false)
  const [error,setError]=useState(false)
  useEffect(()=>{
    if(!saved)return
    const timer=window.setTimeout(()=>setSaved(false),2800)
    return ()=>window.clearTimeout(timer)
  },[saved])
  function append() {
    if(!sample)return
    const line=`[教学仿真 · ${sample.guided?'演示':'实操'} · ${formatValue(sample.time)} s] `+
      sample.meters.map(([name,value,unit])=>`${name} ${formatValue(value)} ${unit}`).join('；')
    if(!onAppend(line)){setError(true);return}
    setOpen(false)
    setSaved(true)
  }
  return <div className="sample-bar">
    <div><Crosshair size={16}/><span>捕捉证据</span><small>定格此刻读数，不暂停设备</small></div>
    <button type="button" data-capture onClick={event=>{
      event.currentTarget.focus({preventScroll:true})
      setError(false)
      setSaved(false)
      setSample({time:state.time,meters:state.frame.meters.map(reading=>[...reading]),guided})
      setOpen(true)
    }}><NotebookPen size={14}/> 取样手记</button>
    <Sheet open={open} drawer title="这一刻的测量" onClose={()=>setOpen(false)}>
      {sample&&<>
        <p className="sample-origin">{lesson.title} · {sample.guided?'演示样本':'自主实操'} · {formatValue(sample.time)} s</p>
        <dl className="reading-list">{sample.meters.map(([label,value,unit])=><div key={label}><dt>{label}</dt><dd>{formatValue(value)} <small>{unit}</small></dd></div>)}</dl>
        <p className="micro">取样后读数保持不变。演示样本可以写入笔记，不计操作成绩。</p>
        <button type="button" className="btn primary" onClick={append}>写入本课笔记</button>
        {error&&<p className="bench-error" role="alert">本课笔记最多 4000 字，已有笔记已保留。</p>}
      </>}
    </Sheet>
    {saved&&<p className="bench-saved" role="status"><Check size={15}/>此组读数已写入本课实验笔记</p>}
  </div>
}
