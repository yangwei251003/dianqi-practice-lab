import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { Activity, ArrowDownToLine, BookOpen, BookOpenCheck, BookMarked, Boxes, Compass, FlaskConical, GraduationCap, Grid2X2, HardDrive, House, Menu, PanelLeftClose, Search, ShieldCheck, X } from 'lucide-react'
import { blankBook, readBook, storageKey, type Book, type Entry } from '../core/book'
import { byId, lessons } from '../core/catalog'
import { Home, Library, Roadmap, Devices, Records, Sources, Construction } from './pages'
import { Heading } from './common'

const Lab=lazy(()=>import('./Lab').then(module=>({default:module.Lab})))
const navItems=[
  {id:'home',title:'学习总览',icon:House}, {id:'route',title:'新生路线',icon:Compass},
  {id:'library',title:'实训场景',icon:FlaskConical}, {id:'devices',title:'设备图鉴',icon:Boxes},
  {id:'records',title:'实验记录',icon:BookOpenCheck}
]
const extras=[{id:'sources',title:'资料与安全',icon:ShieldCheck},{id:'build',title:'建设清单',icon:Grid2X2}]
const hashPath=()=>window.location.hash.replace(/^#\/?/,'')||'home'
function initialBook():{book:Book;warning:string} {
  try {const raw=localStorage.getItem(storageKey); return {book:raw?readBook(raw,lessons):blankBook(),warning:''}}
  catch {return {book:blankBook(),warning:'原学习存档无法读取。当前使用临时记录；为避免覆盖，原始存档会保留。可在实验记录中导入备份。'}}
}
export function App() {
  const [initial]=useState(initialBook)
  const [book,setBook]=useState(initial.book)
  const [canWrite,setCanWrite]=useState(!initial.warning)
  const [notice,setNotice]=useState(initial.warning)
  const [path,setPath]=useState(hashPath)
  const [drawer,setDrawer]=useState(false)
  const [target,param]=path.split('/')
  const labId=target==='lab'?Number(param):0
  const lesson=byId(labId)
  const title=target==='lab'?(lesson?.title??'未知实训'):[...navItems,...extras].find(item=>item.id===target)?.title??'未找到页面'
  useEffect(()=>{
    const change=()=>{setPath(hashPath());setDrawer(false);window.scrollTo(0,0)}
    window.addEventListener('hashchange',change)
    const keyboard=(event:KeyboardEvent)=>{if(event.key==='Escape')setDrawer(false)}
    window.addEventListener('keydown',keyboard)
    return ()=>{window.removeEventListener('hashchange',change);window.removeEventListener('keydown',keyboard)}
  },[])
  useEffect(()=>{document.title=title+' · 电气实训台'},[title])
  useLayoutEffect(()=>{
    if (!canWrite) return
    try {localStorage.setItem(storageKey,JSON.stringify(book))}
    catch {setCanWrite(false);setNotice('浏览器无法保存到本机。当前进度仍在本页，请在离开前导出备份。')}
  },[book,canWrite])
  const update=useCallback((id:number,entry:Entry)=>setBook(current=>({...current,last:id,entries:{...current.entries,[id]:entry}})),[])
  const restore=(newBook:Book)=>{setBook(newBook);setCanWrite(true);setNotice('备份已恢复，可以从上次的操作继续。')}
  const done=Object.values(book.entries).filter(entry=>entry.finished).length
  return <div className="shell">
    <a href="#main-content" className="skip" onClick={event=>{event.preventDefault();document.getElementById('main-content')?.focus()}}>跳到主要内容</a>
    {drawer&&<button className="scrim" aria-label="关闭导航" onClick={()=>setDrawer(false)}/>}
    <aside className={'sidebar '+(drawer?'shown':'')}><a className="brand" href="#/home"><span className="brand-mark"><Activity size={29} strokeWidth={2.2}/></span><span><b>电气实训台</b><small>FIELDWORK LAB</small></span></a>
      <button className="drawer-close icon-btn" aria-label="收起导航" onClick={()=>setDrawer(false)}><PanelLeftClose size={18}/></button>
      <div className="nav-cap">学习空间 <span>WORKSPACE</span></div>
      <nav aria-label="学习空间">{navItems.map(item=><a key={item.id} href={'#/'+item.id} aria-current={target===item.id?'page':undefined} className={(target===item.id||(target==='lab'&&item.id==='library'))?'active':''}><item.icon size={18}/>{item.title}{item.id==='library'&&<small>48</small>}</a>)}</nav>
      <div className="nav-cap second">参考 <span>REFERENCE</span></div>
      <nav aria-label="参考资料">{extras.map(item=><a key={item.id} href={'#/'+item.id} aria-current={target===item.id?'page':undefined} className={target===item.id?'active':''}><item.icon size={18}/>{item.title}</a>)}</nav>
      <div className="side-bottom"><div className="side-line"><GraduationCap size={18}/><b>我的学习进度</b><span>{done}/48</span></div><div className="progress-track"><i style={{width:done/48*100+'%'}}/></div><a href="#/records"><HardDrive size={13}/> {canWrite?'仅保存在此浏览器':'临时存档 · 请导出'}<ArrowDownToLine size={13}/></a></div>
    </aside>
    <div className="page"><header className="topbar"><button className="mobile-nav icon-btn" aria-label="展开导航" aria-expanded={drawer} onClick={()=>setDrawer(true)}><Menu size={21}/></button><div className="crumb"><BookMarked size={16}/><a href="#/home">学习空间</a><span>/</span><strong>{title}</strong></div>
      <a href="#/library/search" aria-label="搜索实训与设备" className="search-short"><Search size={15}/><span>查找实训</span></a><span className="local-pill"><i/>个人工作台</span></header>
      {notice&&<div className="notice" role="status">{notice}<button aria-label="关闭提示" onClick={()=>setNotice('')}><X size={15}/></button></div>}
      <main id="main-content" tabIndex={-1} className={'main '+(target==='lab'?'lab-main':'')}>
        {target==='home'?<Home book={book}/>:target==='route'?<Roadmap book={book}/>:target==='library'?<Library key={param} book={book} filter={param}/>:target==='devices'?<Devices/>:target==='records'?<Records book={book} onRestore={restore}/>:target==='sources'?<Sources/>:target==='build'?<Construction/>:target==='lab'&&lesson?<Suspense fallback={<p role="status">正在打开实训工作台…</p>}><Lab key={lesson.id} lesson={lesson} saved={book.entries[lesson.id]} onSave={update}/></Suspense>:<><Heading code="404 / NO STATION" title="没有找到这个工位" sub="地址可能已更改，你的实验记录仍然保存在本机。"/><a className="btn primary" href="#/home">返回学习总览</a></>}
      </main><footer className="footer"><span><BookOpen size={14}/> 电气实训台 · 工程实践手册</span><span>教学仿真 / 无真实设备连接</span></footer>
    </div>
  </div>
}
