import type { Control, Lesson, Move, Snapshot, Values } from './types'

export interface Reading { time:number; values:number[]; labels:string[] }
export interface EventLine { time:number; label:string; note:string }
export interface Run {
  state:Snapshot; goals:number; events:EventLine[]; readings:Reading[]
}
export const inputLabel = (control:Control,value:number) => control.kind==='choice'
  ? control.options?.[value] ?? String(value) : control.kind==='button' ? '触发' : `${value}${control.unit ?? ''}`
export function validValue(control:Control, value:number) {
  if (!Number.isFinite(value)) return false
  if (control.kind==='button') return value===1
  if (control.kind==='choice') return Number.isInteger(value) && value>=0 && value<(control.options?.length ?? 0)
  const lower=control.min ?? 0, upper=control.max ?? 100, step=control.step ?? 1
  return value>=lower-1e-8 && value<=upper+1e-8 && Math.abs((value-lower)/step-Math.round((value-lower)/step))<1e-6
}
export function initialise(lesson:Lesson):Run {
  const input=Object.fromEntries(lesson.controls.map(control=>[control.id,control.initial]))
  const memory={...lesson.initialMemory}
  const frame=lesson.sample(input,memory,0)
  return {state:{input,memory,frame,time:0,action:'init'},goals:0,events:[{time:0,label:'工位就绪',note:frame.note}],readings:[{time:0,values:frame.meters.map(meter=>meter[1]),labels:frame.meters.map(meter=>meter[0])}]}
}
function next(lesson:Lesson, previous:Run, input:Values, action:string, dt:number, label?:string):Run {
  const before=previous.state
  const time=Math.round((before.time+dt)*1e6)/1e6
  const memory=lesson.advance?.({...before.memory},input,before.input,action,dt,time) ?? before.memory
  const frame=lesson.sample(input,memory,time)
  const state={input,memory,frame,time,action}
  let goals=previous.goals
  while (goals<lesson.goals.length && lesson.goals[goals].check(state)) goals++
  const changed=frame.active.join('|')!==before.frame.active.join('|')
  const events=(label || changed || goals!==previous.goals) ? [...previous.events.slice(-79),{time,label:label ?? (goals!==previous.goals?'达成操作目标':'状态改变'),note:frame.note}] : previous.events
  const reading={time,values:frame.meters.map(meter=>meter[1]),labels:frame.meters.map(meter=>meter[0])}
  return {state,goals,events,readings:[...previous.readings.slice(-119),reading]}
}
export function perform(lesson:Lesson, previous:Run, move:Move):Run {
  if(typeof move==='number') {
    if (!Number.isFinite(move) || move<=0 || move>3600) throw Error('仿真时间越界')
    let remaining=Math.round(move*1e6), run=previous
    while(remaining>0) {
      const micros=Math.min(100000,remaining)
      run=next(lesson,run,run.state.input,'tick',micros/1e6)
      remaining-=micros
    }
    return run
  }
  const [key,value]=move
  const control=lesson.controls.find(item=>item.id===key)
  if (!control || !validValue(control,value)) throw Error('无效控件或设定值：'+key+' / '+value)
  const input={...previous.state.input,[key]:value}
  const run=next(lesson,previous,input,key,0,control.label+' · '+inputLabel(control,value))
  if(control.kind==='button') run.state={...run.state,input:{...input,[key]:0}}
  return run
}
export const replay=(lesson:Lesson,moves:Move[])=>moves.reduce<Run>((run,move)=>perform(lesson,run,move),initialise(lesson))
export function appendMove(history:Move[],move:Move):Move[] {
  const previous=history.at(-1)
  if(typeof move==='number' && typeof previous==='number' && Number.isInteger(move*10) && Number.isInteger(previous*10) && move+previous<=3600)
    return [...history.slice(0,-1),Math.round((previous+move)*10)/10]
  return [...history,move]
}
export const formatValue=(value:number) => Number.isFinite(value) ? (Math.abs(value)>0 && Math.abs(value)<0.001 ? value.toExponential(2) : value.toLocaleString('zh-CN',{maximumFractionDigits:3})) : '—'
