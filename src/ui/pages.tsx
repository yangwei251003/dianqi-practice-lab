import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Activity, ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Boxes, Check, ChevronDown, CircleHelp, ClipboardList, Compass, Database, FileUp, FlaskConical, FolderOpen, HardDrive, Layers3, ListChecks, Map, MoveUpRight, Printer, Route, Search, ShieldAlert, SlidersHorizontal, Sparkles, Waypoints } from 'lucide-react'
import { byId, groupIndex, groups, lessons, num, paths, references, status } from '../core/catalog'
import { downloadJson, readBook, type Book } from '../core/book'
import { CourseArt, HeroArt } from '../visual/art'
import { Badge, Card, Eyebrow, groupIcons, Heading, theme } from './common'

import {quietMotion,Roll} from './motion-tools'

export function Home({book}:{book:Book}) {
  const resumed=book.last?byId(book.last):undefined
  const recommendation=[2,7,13,48].map(id=>byId(id)!).filter(Boolean)
  const started=Object.keys(book.entries).length
  const completed=Object.values(book.entries).filter(entry=>entry.finished).length
  return <>
    <header className="home-head"><div><Eyebrow>WORKSPACE / 01</Eyebrow><h1>学习总览<span className="head-dot">.</span></h1><p>从认识第一台设备，到解释一个系统为什么这样运行。</p></div><div className="edition"><i/> PRACTICE SERIES <b>VOL. 01</b></div></header>
    <section className="hero" data-pointer><div className="hero-grid"/><div className="hero-copy"><span className="hero-tag"><i/> VIRTUAL ENGINEERING LAB</span><h2>让电气原理，<br/>在你手中运转<span>。</span></h2><p>从点亮一盏灯，到调度一座光储充园区。<br className="hero-break"/>在虚拟工位里接线、测量、调试，用结果检验预测。</p><div className="hero-actions"><a data-pointer className="btn amber magnetic-link" href={'#/lab/'+(resumed?.id??1)}><span>{resumed?'继续上次实训':'开始第一课'}</span><ArrowRight size={16}/></a><a className="text-btn light" href="#/route"><Map size={16}/> 查看学习路线</a><a className="text-btn light" href="#/motion"><Sparkles size={15}/> 动效观察室</a></div></div><div className="hero-art"><HeroArt/></div><span className="figure-caption">FIG. 01 / 电机控制实训台</span></section>
    <div className="stat-row">{[{label:'专业方向',value:'08',icon:Waypoints},{label:'建设范围 · 实训',value:'48',icon:Boxes},{label:'已开始',value:num(started),icon:FlaskConical},{label:'已完成',value:num(completed),icon:ListChecks}].map(item=><div className="stat" key={item.label}><span className="stat-icon"><item.icon size={21}/></span><div><b>{item.value}</b><span>{item.label}</span></div></div>)}</div>
    <div className="section-title"><div><Eyebrow>EDITOR’S BENCH</Eyebrow><h2>精选工位</h2></div><a className="text-btn" href="#/library">全部实训 <ArrowRight size={15}/></a></div>
    <p className="section-note">从入门电路到系统调度，选一个问题开始。标有“待专业复核”的工位仅供仿真预习。</p>
    <div className="cards featured">{recommendation.map(lesson=><Card key={lesson.id} lesson={lesson} entry={book.entries[lesson.id]}/>)}</div>
    <div className="section-title"><div><Eyebrow>FIELD INDEX</Eyebrow><h2>按专业方向探索</h2></div><a className="text-btn" href="#/build">查看建设状态 <ArrowRight size={15}/></a></div>
    <div className="group-grid">{groups.map((group,index)=>{const Icon=groupIcons[index];return <a href={'#/library/'+index} key={group[0]} style={theme(index*6+1)}><span className="group-icon"><Icon size={21}/></span><div><small>{num(index+1)} / {group[1]}</small><b>{group[0]}</b></div><ArrowUpRight size={16}/></a>})}</div>
  </>
}
export function Library({book,filter}:{book:Book;filter?:string}) {
  const parsed=filter===undefined||filter==='search'?-1:Number(filter)
  const [active,setActive]=useState(Number.isInteger(parsed)&&parsed>=0&&parsed<8?parsed:-1)
  const [query,setQuery]=useState('')
  const [includeReview,setIncludeReview]=useState(false)
  const list=useRef<HTMLDivElement>(null),oldTops=useRef(new globalThis.Map<string,DOMRect>())
  const recordPositions=()=>{oldTops.current=new globalThis.Map(Array.from(list.current?.querySelectorAll<HTMLElement>('[data-station-card]')??[],node=>[node.dataset.stationCard!,node.getBoundingClientRect()] as const))}
  useLayoutEffect(()=>{if(!quietMotion())list.current?.querySelectorAll<HTMLElement>('[data-station-card]').forEach(node=>{const before=oldTops.current.get(node.dataset.stationCard!);if(!before)return;const after=node.getBoundingClientRect(),dx=before.left-after.left,dy=before.top-after.top;if(dx||dy)node.animate([{translate:`${dx}px ${dy}px`},{translate:'0px 0px'}],{duration:230,easing:'ease-out'})});oldTops.current.clear()},[active,query,includeReview])
  const search=useRef<HTMLInputElement>(null)
  const quick=useRef<HTMLDetailsElement>(null)
  useEffect(()=>{const esc=(event:KeyboardEvent)=>{if(event.key==='Escape'&&quick.current?.open){quick.current.open=false;quick.current.querySelector('summary')?.focus()}};const away=(event:PointerEvent)=>{if(quick.current?.open&&event.target instanceof Node&&!quick.current.contains(event.target))quick.current.open=false};document.addEventListener('keydown',esc);document.addEventListener('pointerdown',away);return ()=>{document.removeEventListener('keydown',esc);document.removeEventListener('pointerdown',away)}},[])
  useEffect(()=>{if(filter==='search')search.current?.focus()},[filter])
  const searched=lessons.filter(lesson=>(active<0||groupIndex(lesson.id)===active)&&(`${num(lesson.id)} ${lesson.title} ${lesson.context} ${lesson.task} ${lesson.device.maker} ${lesson.device.model} ${lesson.device.name}`).toLowerCase().includes(query.trim().toLowerCase()))
  const matched=searched.filter(lesson=>includeReview||status(lesson)==='已开放')
  return <><Heading code="SCENE LIBRARY / 02" title="实训场景" sub="从要解决的问题出发，寻找设备、工作条件和可以亲手改变的结果。"/>
    <div className="filter-bar"><label className="search-box"><Search size={17}/><input ref={search} value={query} onChange={event=>{recordPositions();setQuery(event.target.value)}} placeholder="搜索场景、设备型号或关键词…" aria-label="搜索场景、设备型号"/></label><label className="switch-label"><input type="checkbox" checked={includeReview} onChange={event=>{recordPositions();setIncludeReview(event.target.checked)}}/>包含预习工位</label></div>
    <div className="filter-chips" aria-label="方向筛选">{['全部方向',...groups.map(group=>group[0])].map((label,index)=><button key={label} aria-pressed={active===index-1} onClick={()=>{recordPositions();setActive(index-1)}}>{label}</button>)}</div>
    <div className="list-count"><span><SlidersHorizontal size={14}/> <Roll value={matched.length}/> 个{includeReview?'匹配工位':'已开放实训'}</span><details className="quick-stations" ref={quick}><summary>快速跳站 ▾</summary><div>{[4,7,12,32,48].map(id=><a key={id} href={'#/lab/'+id}>{num(id)} · {byId(id)?.title}</a>)}</div></details></div>
    {matched.length?<div ref={list} className="cards library">{matched.map(lesson=><Card key={lesson.id} lesson={lesson} entry={book.entries[lesson.id]}/>)}</div>:<div className="empty"><Search/><h3>没有符合条件的已选工位</h3><p>试试“泵”“PLC”或具体型号；尚未签核的工位可在预习模式查看。</p><button className="btn secondary" onClick={()=>{setActive(-1);setQuery('');setIncludeReview(true)}}>查看所有建设工位</button></div>}
  </>
}
export function Roadmap({book}:{book:Book}) {
  return <><Heading code="LEARNING PATH / 03" title="新生学习路线" sub="先学会判断和测量，再学会控制。每一站都能返回复习；选修支线不强制按编号完成。"/>
    <div className="route-banner"><Compass size={28}/><div><b>一条基础主线，四个兴趣出口</b><p>电力系统 → 45　／　自动化 → 43、44、47　／　建筑交通 → 46　／　新能源 → 48</p></div></div>
    <div className="path-list">{paths.map((path,index)=><section key={path.title} className="path-step"><span className="path-num">{num(index+1)}</span><div><small>{path.tag}</small><h2>{path.title}</h2><p>{path.goal}</p><p className="exit-test"><ListChecks size={15}/><strong>过关证据</strong> {path.pass}</p><div className="lesson-chips">{path.ids.map(id=>{const lesson=byId(id);return lesson&&<a href={'#/lab/'+id} key={id}>{book.entries[id]?.finished?<Check size={13}/>:<span>{num(id)}</span>}{lesson.title}</a>})}</div><div className="next-hint"><ArrowRight size={13}/>{path.next}</div></div></section>)}</div>
  </>
}
export function Devices() {
  const [query,setQuery]=useState('')
  const devices=Array.from(new globalThis.Map(lessons.map(lesson=>[lesson.device.maker+lesson.device.model,lesson.device] as const)).values()).filter(device=>(device.model+device.maker+device.name).toLowerCase().includes(query.toLowerCase()))
  return <><Heading code="DEVICE ATLAS / 04" title="设备图鉴" sub="从真实型号出发，分清能由资料证实的功能，以及为了教学而做的简化。"/>
    <label className="search-box"><Search size={17}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="搜索厂家、型号或设备名称" aria-label="搜索设备"/></label><div className="list-count"><span><Boxes size={15}/>{devices.length} 个匹配型号</span></div>
    <div className="device-list">{devices.map(device=>{const linked=lessons.filter(lesson=>lesson.device.maker===device.maker&&lesson.device.model===device.model)
      return <article key={device.model+device.maker}><div className="device-art" style={theme(linked[0].id)}><CourseArt id={linked[0].id}/></div><div><small>{device.maker}</small><h3>{device.model} <span>{device.name}</span></h3><p>{device.features.join('；')}</p><div className="lesson-chips">{linked.map(lesson=><a key={lesson.id} href={'#/lab/'+lesson.id}>{num(lesson.id)} {lesson.title}</a>)}</div></div><a className="icon-btn" title={device.document} aria-label={device.model+' 厂家资料'} href={device.url} target="_blank" rel="noreferrer"><ArrowUpRight size={18}/></a></article>})}</div>{!devices.length&&<p>没有匹配型号，请调整关键词。</p>}
  </>
}
export function Records({book,onRestore}:{book:Book;onRestore:(book:Book)=>void}) {
  const file=useRef<HTMLInputElement>(null)
  const [incoming,setIncoming]=useState<Book|null>(null)
  const [error,setError]=useState('')
  const entries=Object.entries(book.entries).sort(([,left],[,right])=>right.updated.localeCompare(left.updated))
  return <><Heading code="FIELD NOTES / 05" title="实验记录" sub="在同一浏览器接着做，也可以导出备份换一台设备。不上传接线、作答或实验笔记。"/>
    <div className="records-tools"><button className="btn primary" onClick={()=>downloadJson(book)}><ArrowDownToLine size={16}/>导出进度备份</button><button className="btn secondary" onClick={()=>file.current?.click()}><FileUp size={16}/>导入备份</button><button className="btn secondary" onClick={()=>window.print()}><Printer size={16}/>打印记录</button>
      <input ref={file} type="file" accept=".json,application/json" hidden onChange={async event=>{const input=event.currentTarget;const selected=input.files?.[0];if(!selected)return;try{if(selected.size>5_000_000)throw Error('文件超过 5 MB');setIncoming(readBook(await selected.text(),lessons));setError('')}catch(reason){setError('没有更改当前记录：'+(reason as Error).message);setIncoming(null)}input.value=''}}/></div>
    {error&&<div className="callout amber-alert" role="alert">{error}</div>}
    {incoming&&<div className="callout"><b>导入 {Object.keys(incoming.entries).length} 个工位的备份？</b><p>这将替换当前浏览器的学习记录。你可以先导出当前备份。</p><button className="btn primary" onClick={()=>{onRestore(incoming);setIncoming(null)}}>替换并恢复</button> <button className="btn secondary" onClick={()=>setIncoming(null)}>保留当前记录</button></div>}
    {!entries.length?<div className="empty"><FolderOpen size={35}/><h3>这里还没有实验记录</h3><p>第一次预测、接线或选测点后，工位状态将自动出现在这里。</p><a href="#/lab/1" className="btn primary">去第一课 <ArrowRight size={15}/></a></div>:<div className="record-list">{entries.map(([id,entry])=>{const lesson=byId(Number(id))!;const errors=entry.attempts.filter(item=>!item.correct)
      return <article key={id}><span className="record-id">{num(Number(id))}</span><div><small>{entry.finished?'已完成':entry.mode==='transfer'?'迁移实训中':'学习中'} · {new Date(entry.updated).toLocaleString('zh-CN')}</small><h3>{lesson.title}</h3><p>操作记录 {entry.moves.length+entry.transfer.length} 项 · 作答 {entry.attempts.length} 次 · 需复习 {errors.length} 次</p>{errors.length>0&&<details><summary>查看错因</summary>{errors.map((error,index)=>{const quiz=error.kind==='预测'?lesson.prediction:lesson.explanation;return <p key={index}>{error.kind}：{quiz.options[error.choice]}。{quiz.why}</p>})}</details>}{entry.note&&<blockquote>{entry.note}</blockquote>}</div><a className="text-btn" href={'#/lab/'+id}>打开记录 <ArrowRight size={15}/></a></article>})}</div>}
  </>
}
export function Sources() {
  return <><Heading code="REFERENCE DESK / 06" title="资料与安全" sub="每个工位明确区分：哪些是型号资料，哪些是场景建模假设，哪些尚待专业复核。"/>
    <section className="callout"><ShieldAlert/><div><h3>这里只连接模型，不连接设备。</h3><p>所有曲线、仪表和事件都属于教学仿真。不得将模型、控制逻辑或参数直接移植到现场。现场操作须由有资质人员按适用规程组织；本站不是数字孪生、实时监控或培训资质证明。</p></div></section>
    <div className="section-title"><h2>建设与行业依据</h2><small>资料核对日期：2026-11-18</small></div><div className="source-list">{references.map(([tag,title,description,url])=><article key={title}><span className="source-tag">{tag}</span><div><a href={url} target="_blank" rel="noreferrer"><h3>{title} <ArrowUpRight size={15}/></h3></a><p>{description}</p></div></article>)}</div>
    <div className="section-title"><h2>模型与素材说明</h2></div><p className="prose">设备图、教学漫画和三维模型为本项目原创示意，不将可下载的厂家 CAD、照片或手册视为可再分发素材。外形和接口以各工位列出的资料为参考，未验证的内部结构不做精确还原声明。主设备外的管线、支架、场地、相对布局和教学参数不代表厂方整机规格。</p><a className="btn secondary" href="#/devices">查看型号与厂家原件 <ArrowRight size={15}/></a>
  </>
}
export function Construction() {
  return <><Heading code="BUILD REGISTER / 07" title="建设清单" sub="48 项是建设范围，不是专业签核数量。浏览器与模型通过技术检查，不等于设备现场验证。"/>
    <div className="status-strip">{['已开放','待专业复核','开发验证中'].map(label=><span key={label}><b>{lessons.filter(lesson=>status(lesson)===label).length}</b>{label}</span>)}</div>
    {groups.map((group,index)=><section className="build-group" key={group[0]}><h2><span>{num(index+1)}</span> {group[0]}</h2>{lessons.filter(lesson=>groupIndex(lesson.id)===index).map(lesson=><a href={'#/lab/'+lesson.id} key={lesson.id}><span className="mono">{num(lesson.id)}</span><strong>{lesson.title}</strong><span className="build-device">{lesson.device.model}</span><Badge lesson={lesson}/><ArrowUpRight size={15}/></a>)}</section>)}
  </>
}
