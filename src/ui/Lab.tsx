import { lazy, Suspense, useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Activity, ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Box, Cable, Check, ChevronRight, Circle, CircleCheck, ClipboardList, ExternalLink, Eye, FastForward, Gauge, Layers, MousePointer2, Pause, Play, Printer, RotateCcw, ScanLine, ShieldAlert, Timer, Workflow } from 'lucide-react'
import { blankEntry, type Entry } from '../core/book'
import { byId, groupIndex, groups, num, status } from '../core/catalog'
import { appendMove, formatValue, initialise, inputLabel, perform, replay, type Run } from '../core/engine'
import type {Lesson, Move, Quiz} from '../core/types'
import {sourceReserve} from '../core/source-reserve'
import {advanceFilm, sequences, startFilm, type Film} from '../core/cinema'
import {FrameNav} from './motion-instruments'
import {FieldNotes, MorphPlay, Sheet} from './motion-tools'
import './studio.css'
import { ComicArt, CourseArt } from '../visual/art'
import { Badge, Eyebrow, theme } from './common'
import { Controls, Diagram, Meters, PlotView } from './instruments'

const Rig=lazy(()=>import('../visual/three').then(module=>({default:module.Rig})))
type Bench={run:Run;entry:Entry;revision:number}
type Action={type:'move';move:Move}|{type:'focus';index:number}|{type:'answer';kind:'prediction'|'explanation';index:number}|{type:'note';text:string}|{type:'mode';mode:Entry['mode']}|{type:'reset'}|{type:'finish'}
function reducer(lesson:Lesson,bench:Bench,action:Action):Bench {
  let {entry,run}=bench
  if(action.type==='reset'){entry=blankEntry();run=initialise(lesson)}
  else if(action.type==='focus'){if(entry.focus===action.index)return bench;entry={...entry,focus:action.index}}
  else if(action.type==='note'){entry={...entry,note:action.text}}
  else if(action.type==='answer'){const quiz=lesson[action.kind];entry={...entry,[action.kind]:action.index,attempts:[...entry.attempts.slice(-249),{kind:action.kind==='prediction'?'预测':'解释',choice:action.index,correct:action.index===quiz.answer}]}}
  else if(action.type==='mode'){
    if(action.mode==='transfer'&&!entry.finished&&(!entry.goalsDone||entry.explanation!==lesson.explanation.answer||entry.prediction===null))return bench
    entry={...entry,mode:action.mode};run=replay(lesson,action.mode==='practice'?entry.moves:entry.transfer)
  } else if(action.type==='move'){
    run=perform(lesson,run,action.move)
    const key=entry.mode==='practice'?'moves':'transfer'
    entry={...entry,[key]:appendMove(entry[key],action.move),goalsDone:entry.goalsDone||(entry.mode==='practice'&&run.goals===lesson.goals.length)}
  } else if(action.type==='finish'){
    if(entry.mode!=='transfer'||!entry.goalsDone||entry.prediction===null||entry.explanation!==lesson.explanation.answer||!entry.transfer.some(Array.isArray)||!lesson.trials[3].verify(run.state))return bench
    entry={...entry,finished:true}
  }
  return {entry:{...entry,updated:new Date().toISOString()},run,revision:bench.revision+1}
}
function Question({quiz,answer,onAnswer,kind}:{quiz:Quiz;answer:number|null;onAnswer:(idx:number)=>void;kind:string}) {
  return <div className="question"><h4>{quiz.ask}</h4><div className="answers">{quiz.options.map((label,index)=><button key={index} data-answer={kind+'-'+index} aria-pressed={answer===index} className={answer===index?'selected':''} onClick={()=>onAnswer(index)}><span>{String.fromCharCode(65+index)}</span>{label}</button>)}</div>{answer!==null&&<p key={answer} className={'quiz-feedback '+(answer===quiz.answer?'correct':'revisit')} role="status">{answer===quiz.answer&&<Check size={16} aria-hidden="true"/>}{answer===quiz.answer?'判断有据。':'再核对一次。'}{quiz.why}</p>}</div>
}
const printAnswer=(quiz:Quiz,answer:number|null)=>answer===null?'未作答':quiz.options[answer]
export function Lab({lesson,saved,onSave}:{lesson:Lesson;saved?:Entry;onSave:(id:number,entry:Entry)=>void}) {
  const [bench,dispatch]=useReducer((prev:Bench,action:Action)=>reducer(lesson,prev,action),null,()=>{const entry=saved??blankEntry();return {entry,run:replay(lesson,entry.mode==='practice'?entry.moves:entry.transfer),revision:0}})
  const {entry,run:practice}=bench
  const [film,setFilm]=useState<Film|null>(()=>!saved&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&document.documentElement.dataset.motion!=='quiet'?startFilm(lesson):null)
  const [filmPlaying,setFilmPlaying]=useState(true),[filmFocus,setFilmFocus]=useState(0)
  const run=film?.run??practice,{state}=run,currentFocus=film?filmFocus:entry.focus
  const cues=sequences[lesson.id],cue=cues[film?.index??0]
  const [view,setView]=useState<'rig'|'diagram'|'data'>('rig')
  const [playing,setPlaying]=useState(false)
  const [resetAsk,setResetAsk]=useState(false)
  const [rigStatus,setRigStatus]=useState<'3d'|'fallback'|''>('')
  const [comicFrame,setComicFrame]=useState<number|null>(null)
  const [assist,setAssist]=useState(false)
  const [historyMeter,setHistoryMeter]=useState(0)
  const [intervalText,setIntervalText]=useState('5')
  const [printing,setPrinting]=useState(()=>window.matchMedia('print').matches)
  useEffect(()=>{
    const begin=()=>flushSync(()=>setPrinting(true)),end=()=>setPrinting(false)
    const media=window.matchMedia('print'),changed=()=>setPrinting(media.matches)
    window.addEventListener('beforeprint',begin);window.addEventListener('afterprint',end);media.addEventListener('change',changed)
    return ()=>{window.removeEventListener('beforeprint',begin);window.removeEventListener('afterprint',end);media.removeEventListener('change',changed)}
  },[])
  const place=useRef<HTMLDivElement>(null)
  useLayoutEffect(()=>{if(bench.revision)onSave(lesson.id,bench.entry)},[bench,lesson.id,onSave])
  useEffect(()=>{
    if(!playing)return
    const timer=window.setInterval(()=>dispatch({type:'move',move:.1}),100)
    const hide=()=>{if(document.hidden)setPlaying(false)}
    document.addEventListener('visibilitychange',hide)
    return ()=>{clearInterval(timer);document.removeEventListener('visibilitychange',hide)}
  },[playing])
  const advancing=!!film&&!film.done&&filmPlaying&&!printing&&(view!=='rig'||!!rigStatus)
  useEffect(()=>{
    if(!advancing)return
    let last=performance.now()
    const tick=()=>{const now=performance.now(),delta=Math.min(.35,(now-last)/1000);last=now;if(!document.hidden)setFilm(current=>current?advanceFilm(lesson,current,delta):null)}
    const timer=window.setInterval(tick,110)
    const visibility=()=>{last=performance.now()}
    document.addEventListener('visibilitychange',visibility)
    return ()=>{clearInterval(timer);document.removeEventListener('visibilitychange',visibility)}
  },[advancing,lesson])
  const leave=()=>{setFilm(null);setFilmPlaying(false)}
  const demo=()=>{setPlaying(false);setFilmFocus(0);setFilm(startFilm(lesson));setFilmPlaying(true)}
  const seek=(index:number)=>{let copy=startFilm(lesson);for(let step=0;step<index;step++)copy=advanceFilm(lesson,copy,cues[step].seconds);setFilm(copy)}
  const focus=(index:number)=>film?setFilmFocus(index):dispatch({type:'focus',index})
  const operate=(move:Move)=>{if(film)leave();dispatch({type:'move',move})}
  const usePart=(index:number)=>{
    const part=lesson.parts[index];if(!part)return
    const control=lesson.controls.find(item=>item.id===part.control)
    if(control)dispatch({type:'focus',index});else focus(index)
    if(!control)return
    let value=part.value
    if(value===undefined){
      if(control.kind==='button')value=1
      else if(control.kind==='choice')value=(practice.state.input[control.id]+1)%(control.options?.length??1)
      else{const step=control.step??1,next=Number((practice.state.input[control.id]+step).toFixed(8));value=next>(control.max??100)?control.min??0:next}
    }
    operate([control.id,value])
  }
  const transfer=lesson.trials[3]
  const ready=entry.goalsDone&&entry.prediction!==null&&entry.explanation===lesson.explanation.answer
  const selected=lesson.parts[currentFocus]??lesson.parts[0]
  const selectedMeter=state.frame.meters[historyMeter]??state.frame.meters[0]
  const nextId=({1:2,2:3,3:4,4:7,7:8,8:10,10:13,13:15,15:16,16:18,18:43,24:45,30:31,36:48,42:46} as Record<number,number>)[lesson.id]??Math.min(48,lesson.id+1)
  const moveMode=(mode:Entry['mode'])=>{leave();setPlaying(false);setAssist(false);dispatch({type:'mode',mode})}
  const goToPart=(idx:number)=>{focus(idx);setView('rig');place.current?.scrollIntoView({block:'start',behavior:'instant'});place.current?.focus({preventScroll:true})}
  return <article className="lab" style={theme(lesson.id)} data-lesson={lesson.id} data-sim-time={state.time} data-goals={practice.goals} data-demonstrating={!!film} data-mode={entry.mode}>
    <div className="lab-breadcrumb"><a href="#/library"><ArrowLeft size={14}/> 实训场景</a><span>/</span>{groups[groupIndex(lesson.id)][0]}</div>
    <header className="lab-heading"><div><Eyebrow>FIELD STATION / {num(lesson.id)}</Eyebrow><h1>{lesson.title}</h1><p>{lesson.context}</p></div><div><Badge lesson={lesson}/><button className="btn secondary" onClick={()=>{setPlaying(false);window.print()}}><Printer size={15}/>实验报告</button></div></header>
    {status(lesson)!=='已开放'&&<div className="review-note"><ShieldAlert size={16}/>{lesson.review?'预习工位 · 涉及安全的内容尚未经相应资质人员签核，不列为正式实训。':'技术验收尚未发布，当前为预习工位。'} 仅用于离线模型推理。</div>}
    <div className="lab-workspace"><section className="apparatus" ref={place} tabIndex={-1}>
      <div className="panel-header"><span><i className="signal-dot"/>{entry.mode==='transfer'?'迁移工况':'虚拟工位'}</span>{entry.finished&&<button className="text-btn" onClick={()=>moveMode(entry.mode==='practice'?'transfer':'practice')}>复习{entry.mode==='practice'?'迁移':'主'}工况</button>}<small>教学仿真 · SIM</small></div>
      <div className="view-tabs" aria-label="工位视图">{([{key:'rig',label:'三维设备',icon:Box},{key:'diagram',label:'原理与状态',icon:Workflow},{key:'data',label:'测量曲线',icon:Activity}] as const).map(tab=><button key={tab.key} data-view={tab.key} aria-pressed={view===tab.key} onClick={()=>setView(tab.key)}><tab.icon size={15}/>{tab.label}</button>)}</div>
      <section className="film-strip" aria-label="原理演示控制"><div className="film-marker"><i/> {film?'原理演示':'自主实操'} <small> / {film?'GUIDED':'MANUAL'}</small></div><div className="film-story">{film?<><strong data-cue={film.index}>{String(film.index+1).padStart(2,'0')} / {String(cues.length).padStart(2,'0')} · {film.done?'演示结束':!filmPlaying?'已暂停':'观察此刻'}</strong><p>{cue.caption}</p></>:<><strong>你的工位，由你操作</strong><p>改变部件或输入，用曲线和事件解释变化。演示不会计入成绩。</p></>}</div><div className="film-buttons">{film?<><button data-demo-play aria-label={film.done?'重播演示':filmPlaying?'暂停演示':'继续演示'} onClick={()=>film.done?demo():setFilmPlaying(!filmPlaying)}><MorphPlay playing={filmPlaying&&!film.done}/></button><button data-demo-next title="下一段演示" aria-label="下一段演示" disabled={film.index===cues.length-1} onClick={()=>seek(film.index+1)}><FastForward size={15}/></button><button data-demo-exit onClick={leave}>自己动手</button></>:<button data-demo-start onClick={demo}><Play size={14}/> 看原理演示</button>}</div>{film&&<div className="film-chapters" aria-label="演示分段">{cues.map((chapter,index)=><button key={index} data-chapter={index} aria-label={'跳到第 '+(index+1)+' 段：'+chapter.caption} aria-current={index===film.index?'step':undefined} onClick={()=>seek(index)}><i style={{width:index<film.index?'100%':index>film.index?'0':(film.elapsed/chapter.seconds*100)+'%'}}/></button>)}</div>}</section>
      <div className="view-body">{view==='rig'?<><Suspense fallback={<div className="rig-loading mx-skeleton">正在载入三维工位…</div>}><Rig lesson={lesson} state={state} running={film?advancing:playing} focus={currentFocus} onFocus={focus} onOperate={usePart} onStatus={setRigStatus}/></Suspense><span className="sr-only" data-rig-status={rigStatus}>{rigStatus==='3d'?'三维已就绪':'二维或正在载入'}</span></>:view==='diagram'?<Diagram lesson={lesson} state={state}/>:<div className="plots"><label className="meter-select">测量记录 <select value={historyMeter} onChange={event=>setHistoryMeter(Number(event.target.value))}>{state.frame.meters.map(([label],index)=><option value={index} key={index}>{label}</option>)}</select></label>{selectedMeter&&<PlotView plot={{title:selectedMeter[0]+' · 最近采样',x:'仿真时间 / s',y:selectedMeter[2],points:run.readings.flatMap(reading=>{const idx=reading.labels.indexOf(selectedMeter[0]);return idx<0?[]:[[reading.time,reading.values[idx]] as [number,number]]})}}/>}{state.frame.plots?.map((plot,index)=><PlotView plot={plot} key={index}/>)}</div>}</div>
      <div className="clock-controls"><span><Timer size={15}/><b data-clock>{formatValue(state.time)}</b> s</span><button data-play onClick={()=>{leave();setPlaying(!playing)}}>{playing?<Pause size={14}/>:<Play size={14}/>} {playing?'暂停':film?'运行我的工况':'运行'}</button><button data-step=".1" onClick={()=>operate(.1)}>+0.1 s</button><button data-step="1" onClick={()=>operate(1)}>+1 s</button><button data-step="10" onClick={()=>operate(10)}>+10 s</button><label className="duration"><input type="number" data-duration aria-label="指定推进秒数" min=".001" max="3600" step=".001" value={intervalText} onChange={event=>setIntervalText(event.target.value)}/> s</label><button data-advance disabled={!(Number(intervalText)>0&&Number(intervalText)<=3600)} onClick={()=>operate(Number(intervalText))}>推进</button></div>
      <Meters run={run}/><FieldNotes lesson={lesson} state={state} guided={!!film} onAppend={text=>{const note=[entry.note,text].filter(Boolean).join('\n');if(note.length>4000)return false;dispatch({type:'note',text:note});return true}}/><p className="model-note" data-feedback><Activity size={16}/>{state.frame.note}</p>
      <details className="event-log"><summary>事件记录 <small>最近 {run.events.length} 条</small></summary><ol>{run.events.slice().reverse().map((event,index)=><li key={index}><time>{formatValue(event.time)} s</time><div><b>{event.label}</b> {event.note}</div></li>)}</ol></details>
    </section>
    <section className="control-panel"><div className="panel-header"><span><SlidersIcon/>操作面板</span><small>INPUTS</small></div><div className="control-inner">
    <section className="mission"><span className="mission-icon"><ClipboardList size={22}/></span><div><small>现场问题 / THE BRIEF</small><h2>{lesson.question}</h2><p>{lesson.task}</p></div></section>
    <details className="prereqs"><summary>先修建议与学习目标</summary><p>目标：{lesson.goals.map(goal=>goal.text).join('；')}</p><div className="lesson-chips">{lesson.prerequisites.length?lesson.prerequisites.map(id=><a key={id} href={'#/lab/'+id}>{num(id)} {byId(id)?.title}</a>):'无需前置知识。'}</div></details>
    <details className="prediction" open={entry.prediction===null?true:undefined}><summary><span className="step-tag">01</span><strong>先预测，再观察</strong><small>{entry.prediction===null?'还未作答':'已记录，点击复习'}</small></summary><Question kind="prediction" quiz={lesson.prediction} answer={entry.prediction} onAnswer={index=>dispatch({type:'answer',kind:'prediction',index})}/></details>
      <h3><span className="step-tag">02</span>{entry.mode==='practice'?'动手任务':'换工况再试'}</h3>
      {entry.mode==='practice'?<ol className="goals">{lesson.goals.map((goal,index)=><li key={goal.text} className={index<practice.goals?'met':''}>{index<practice.goals?<CircleCheck size={15}/>:<Circle size={15}/>}<span>{goal.text}</span></li>)}</ol>:<div className="transfer-target"><strong>{transfer.name}</strong><p>操作独立工况，用结果满足迁移任务。</p><button onClick={()=>setAssist(!assist)}> {assist?'收起':'查看'}工况参照</button>{assist&&<p>{transfer.moves.map(move=>typeof move==='number'?'推进 '+move+' s':(lesson.controls.find(control=>control.id===move[0])?.label??move[0])+'：'+inputLabel(lesson.controls.find(control=>control.id===move[0])!,move[1])).join(' → ')}</p>}</div>}
      <Controls lesson={lesson} state={practice.state} operate={operate}/>
      <details className="part-detail" open><summary>部件与操作热点</summary><div className="part-pills">{lesson.parts.map((part,index)=><button key={index} data-part={index} aria-pressed={currentFocus===index} onClick={()=>focus(index)}>{num(index+1)} {part.label}</button>)}</div>{selected&&<><p><b>{selected.label}</b> · {selected.detail}</p><button data-part-apply className="btn secondary" onClick={()=>usePart(currentFocus)}><MousePointer2 size={14}/>操作此部件</button></>}</details>
    </div></section></div>
    <section className="below-section comic-section"><div className="section-title"><div><Eyebrow>ILLUSTRATED FIELD NOTES</Eyebrow><h2>工位漫画</h2></div><span className="folio">{lesson.comic.length} 格 / {lesson.title}</span></div><p className="section-note">跟小岚和周工追一遍问题。点击分镜的部件标记，回到对应的三维位置。</p><div className="comic-reader"><button aria-pressed={comicFrame!==null} onClick={()=>setComicFrame(comicFrame===null?0:null)}>{comicFrame===null?'逐格读漫画':'查看全部分镜'}</button>{comicFrame!==null&&<FrameNav index={comicFrame} count={lesson.comic.length} onChange={setComicFrame} label="工位漫画分镜"/>}</div><div className={'comic-grid '+(comicFrame===null?'':'comic-solo')}>{lesson.comic.map((panel,index)=>(comicFrame===null||index===comicFrame)&&<figure key={index}><div className="comic-ink"><ComicArt id={lesson.id} panel={index} focus={panel.focus} label={lesson.parts[panel.focus]?.label??lesson.title}/><span>{num(index+1)}</span></div><figcaption><b>{panel.speaker}</b><p>{panel.line}</p><button onClick={()=>goToPart(panel.focus)}><ScanLine size={13}/> {lesson.parts[panel.focus]?.label??'定位部件'}</button></figcaption></figure>)}</div></section>
    <div className="lab-bottom"><section className="reflection"><h2><span className="step-tag">03</span>解释原因，迁移应用</h2><Question quiz={lesson.explanation} kind="explanation" answer={entry.explanation} onAnswer={index=>dispatch({type:'answer',kind:'explanation',index})}/>
      <label className="notebook"><strong>我的实验笔记</strong><textarea placeholder="记录工况、读数，以及哪条证据改变了你的判断…" maxLength={4000} value={entry.note} onChange={event=>dispatch({type:'note',text:event.target.value})}/></label>
      {entry.finished?<div className="complete"><CircleCheck size={20}/>本课学习已完成 · 仍可复习与重新操作。<a href={'#/lab/'+nextId}>下一站 <ArrowRight size={15}/></a></div>:entry.mode==='practice'?<><button className="btn primary" data-transfer disabled={!ready} onClick={()=>moveMode('transfer')}>进入独立迁移工况 <ArrowRight size={15}/></button>{!ready&&<p className="micro">先留下预测、依次达成操作目标，并用正确解释说明原因。</p>}</>:<div className="records-tools"><button className="btn primary" data-finish disabled={!entry.transfer.some(Array.isArray)||!transfer.verify(practice.state)} onClick={()=>dispatch({type:'finish'})}>提交迁移结果</button><button className="btn secondary" onClick={()=>moveMode('practice')}>返回原工况</button></div>}
    </section><aside className="device-paper"><Eyebrow>DEVICE DOSSIER</Eyebrow><h2>主设备档案</h2><h3>{lesson.device.model}</h3><p>{lesson.device.maker} · {lesson.device.name}</p><ul>{lesson.device.features.map(feature=><li key={feature}>{feature}</li>)}</ul><a href={lesson.device.url} target="_blank" rel="noreferrer">{lesson.device.document} <ExternalLink size={13}/></a><p className="micro">{lesson.device.locator}</p>{sourceReserve[lesson.id]&&<a href={sourceReserve[lesson.id].url} target="_blank" rel="noreferrer">备用官方入口：{sourceReserve[lesson.id].title} <ExternalLink size={13}/></a>}<h4>仿真范围与限制</h4><p>{lesson.assumptions}</p><p className="micro">原创外形与系统示意；非厂家 CAD，非实体实测。资料核对：2026-11-18。</p></aside></div>
    <div className="lab-end"><a href="#/records" className="text-btn">查看实验记录 <ArrowRight size={14}/></a><button className="text-btn muted" onClick={event=>{event.currentTarget.focus({preventScroll:true});setPlaying(false);setResetAsk(true)}}><RotateCcw size={14}/>重做本课</button></div>
    <Sheet open={resetAsk} onClose={()=>setResetAsk(false)} title="重置这一课的操作、作答和笔记？"><p>其他工位不受影响。需要保留时，请先到实验记录导出备份。</p><button className="btn secondary" onClick={()=>{leave();dispatch({type:'reset'});setResetAsk(false);setView('rig')}}>确认重做本课</button> <button className="btn secondary" onClick={()=>setResetAsk(false)}>保留记录</button></Sheet>
    {printing&&<section className="print-report"><h1>电气实训台 · 实验报告</h1><h2>{num(lesson.id)} {lesson.title}</h2><p>生成于 {new Date().toLocaleString('zh-CN')} · 教学仿真 · {status(lesson)} · {entry.finished?'学习已完成':'学习中'}</p><p>设备：{lesson.device.maker} {lesson.device.model}</p><p>任务：{lesson.task}</p><p>预测：{printAnswer(lesson.prediction,entry.prediction)}</p><p>解释：{printAnswer(lesson.explanation,entry.explanation)}</p><p>主工况目标：{entry.goalsDone?'达成':'未全部达成'}；迁移任务：{transfer.name}</p>{(['practice','transfer'] as const).map(mode=>{const savedRun=mode===entry.mode?practice:replay(lesson,mode==='practice'?entry.moves:entry.transfer);return <div key={mode}><h3>{mode==='practice'?'主工况':'迁移工况'} · {formatValue(savedRun.state.time)} s</h3><p>{savedRun.state.frame.meters.map(([label,value,unit])=>label+'：'+formatValue(value)+' '+unit).join('　')}</p>{savedRun.events.slice(-5).map((event,index)=><p key={index}>{formatValue(event.time)} s · {event.label}：{event.note}</p>)}</div>})}<h3>实验笔记</h3><p>{entry.note||'未填写'}</p><h3>依据与限制</h3><p>{lesson.device.document} · {lesson.device.locator} · {lesson.device.url}</p><p>{lesson.assumptions}</p><p>仅供模型推理，不能用于现场接线、定值或操作。无真实设备连接。</p></section>}
  </article>
}
function SlidersIcon(){return <Gauge size={16}/>}
