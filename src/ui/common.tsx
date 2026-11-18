import type { CSSProperties, ReactNode } from 'react'
import { ArrowUpRight, Check, Route, Layers3, Cable, CircuitBoard, Wind, Building2, Network, BatteryCharging, Activity, Waypoints } from 'lucide-react'
import { CourseArt } from '../visual/art'
import { groupIndex,groups,num,status } from '../core/catalog'
import type {Lesson} from '../core/types'
import type {Entry} from '../core/book'

export const groupIcons=[Cable,Wind,CircuitBoard,Network,Activity,BatteryCharging,Building2,Waypoints]
export function theme(id:number):CSSProperties {
  const group=groups[groupIndex(id)]
  return {'--tint':group[3],'--ink':group[4]} as CSSProperties
}
export function Eyebrow({children}:{children:ReactNode}) {return <div className="eyebrow"><i/>{children}</div>}
export function Heading({code,title,sub}:{code:string;title:string;sub:string}) {return <header className="page-head"><Eyebrow>{code}</Eyebrow><h1>{title}</h1><p>{sub}</p></header>}
export function Badge({lesson}:{lesson:Lesson}) {
  const label=status(lesson)
  return <span className={'status '+(label==='已开放'?'open':'review')}><i/>{label}</span>
}
export function Card({lesson,entry}:{lesson:Lesson;entry?:Entry}) {
  const group=groups[groupIndex(lesson.id)]
  return <a href={'#/lab/'+lesson.id} className="course-card" data-station-card={lesson.id} onClick={event=>{document.querySelectorAll<HTMLElement>('[data-card-heading]').forEach(title=>title.style.removeProperty('view-transition-name'));const title=event.currentTarget.querySelector<HTMLElement>('h3');if(title)title.style.viewTransitionName='station-title'}} style={theme(lesson.id)}>
    <div className="card-art"><span className="figure">FIG. {num(lesson.id)}</span><CourseArt id={lesson.id}/><span className="card-reveal">观察此工位 ↗</span><span className="card-spatial"><Layers3 size={13}/> 3D</span></div>
    <div className="card-copy"><div className="card-meta"><span>{group[0]}</span><Badge lesson={lesson}/></div><h3 data-card-heading>{lesson.title}</h3><p>{lesson.question}</p><div className="card-foot"><span>{entry?.finished?<><Check size={14}/>已完成 · 可复习</>:entry?<><Route size={14}/>继续上次实训</>:<>进入{status(lesson)==='已开放'?'实训':'预习'}</>}</span><ArrowUpRight size={16}/></div></div>
  </a>
}
