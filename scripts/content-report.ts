import assert from 'node:assert/strict'
import {access, appendFile, mkdir, readFile, writeFile} from 'node:fs/promises'
import {lessons, num, groups, groupIndex} from '../src/core/catalog'
import {replay} from '../src/core/engine'

interface BrowserRow {id:number;mode:string;meters:number;goals:number;panels:number;transfer:boolean;surface:boolean}
interface Evidence {engine:string;version:string;testedAt:string;target:string;scenes:BrowserRow[];checks:string[];failures:string[]}
const engines:Evidence[]=[]
for(const engine of ['chrome','edge','firefox','webkit']){
  const file='evidence/browser-'+engine+'.json'
  try{await access(file)}catch{continue}
  engines.push(JSON.parse(await readFile(file,'utf8')) as Evidence)
}
const chrome=engines.find(item=>item.engine==='chrome')
const rows:string[]=[]
const sources:string[]=[]
const verified:number[]=[]
const matrix:Record<string,unknown>[]=[]
const escape=(value:string)=>value.replaceAll('|','／').replaceAll('\n',' ')
for(const lesson of lessons){
  const final=replay(lesson,lesson.practice??lesson.trials[0].moves)
  const canPass=final.goals===lesson.goals.length
  const cases=lesson.trials.map(trial=>({name:trial.name,passed:trial.verify(replay(lesson,trial.moves).state)}))
  const row=chrome?.scenes.find(row=>row.id===lesson.id)
  const tech=canPass&&cases.every(item=>item.passed)&&row?.mode==='3d'&&row.surface&&row.transfer&&row.panels>=6
  if(tech)verified.push(lesson.id)
  const stage=!tech?'开发验证中':lesson.review?'待专业复核':'已开放'
  rows.push('| '+[num(lesson.id),escape(lesson.title),groups[groupIndex(lesson.id)][0],escape(lesson.device.model),cases.filter(item=>item.passed).length+'/'+cases.length,canPass?'通过':'未通过',row?row.mode+' / '+(row.transfer?'迁移通过':'未验迁移'):'未验',lesson.comic.length,stage].join(' | ')+' |')
  sources.push('### '+num(lesson.id)+' · '+lesson.title+'\n\n'+lesson.context+'\n\n- 任务：'+lesson.task+'\n- 主设备：'+lesson.device.maker+' / '+lesson.device.model+' / '+lesson.device.name+'。'+lesson.device.features.join('；')+'\n- 原件：['+lesson.device.document+']('+lesson.device.url+')；'+lesson.device.locator+'\n- 模型边界：'+lesson.assumptions+'\n- 迁移：'+lesson.trials[3].name+'\n- 状态：'+stage+'。'+(lesson.review?' 尚无资质人员签核；仅供虚拟预习。':' 非现场技术操作认证。'))
  matrix.push({id:lesson.id,title:lesson.title,model:lesson.device.model,source:lesson.device.url,goals:final.goals,comic:lesson.comic.length,trials:cases,technical:!!tech,status:stage})
}
await mkdir('docs',{recursive:true});await mkdir('evidence',{recursive:true})
await writeFile('evidence/cases.json',JSON.stringify(matrix,null,2)+'\n')
await writeFile('docs/COURSES.md','# 逐项建设与验收矩阵\n\n按实训源码和本次浏览器证据生成。主设备不等于整套生产装置均按原厂一比一建模。课目涉及现场风险时技术检查与教学签核分列。\n\n| 编号 | 工位 | 方向 | 主设备型号 | 模型路径 | 主目标 | Chrome 工作台 | 漫画格 | 学生状态 |\n|---|---|---|---|---:|---|---|---:|---|\n'+rows.join('\n')+'\n\n## 来源、适用范围与迁移任务\n\n'+sources.join('\n\n')+'\n')
await writeFile('docs/VALIDATION.md','# 软件验证与未验证边界\n\n## 当前证据\n\n- 课程：'+lessons.length+'；型号：'+new Set(lessons.map(lesson=>lesson.device.maker+' '+lesson.device.model)).size+'；逐课分镜：'+lessons.reduce((sum,lesson)=>sum+lesson.comic.length,0)+' 格。\n- 通过三维浏览器、主目标及迁移联合门槛：'+verified.length+'；其中可正式开放低风险教学仿真 '+lessons.filter(lesson=>verified.includes(lesson.id)&&!lesson.review).length+'，另有 '+lessons.filter(lesson=>verified.includes(lesson.id)&&lesson.review).length+' 项待专业签核。\n- [逐课原件、四类模型路径和工况](COURSES.md)；[机器可读矩阵](../evidence/cases.json)。\n\n| 浏览器 | 版本 | 实测工位数 | 三维工位 | 完成主任务及迁移 | 运行错误/失败 |\n|---|---|---:|---:|---:|---:|\n'+engines.map(engine=>'| '+[engine.engine,engine.version,engine.scenes.length,engine.scenes.filter(scene=>scene.mode==='3d').length,engine.scenes.filter(scene=>scene.transfer).length,engine.failures.length].join(' | ')+' |').join('\n')+'\n\n'+engines.map(engine=>'- '+engine.engine+'：'+engine.checks.join('；')+'。[原始结果](../evidence/browser-'+engine.engine+'.json)。').join('\n')+'\n\n## 验收口径\n\n四类模型检验与浏览器实操独立记录，不拿播放动画、构建成功或加载页面代替课程完成。模型检验对照固定参考值、解析解或事件时序；浏览器在真实控件上操作、检查读数/节点与模型是否一致，再进入独立迁移工况。浏览器结果只覆盖所列平台；WebKit 不等于 Safari 真机，桌面触控模拟不等于手机实机。软件渲染验证可交互性，不承诺真机 GPU 帧率。\n\n## 待专业复核\n\n本项目未获得电气现场安全、保护、机械或交通专业人员签核；表中“待专业复核”仅供仿真预习。未做实物对照测绘、现场接线、PLC 下载、电网/充电机连接、校准或厂方认证。资料链接/厂家页面可能更新，维护时复查对应版本及适用条件。\n')
await appendFile('docs/VALIDATION.md','\n## 平台与网络限制\n\nWindows WebKit 在多个图形浏览器并行启动的测试里曾发生页面或三维初始化超时；单独重新运行后，四个代表工位的主任务及迁移通过。较慢设备可切换工位内的二维视图；不把软件渲染结果当真机性能承诺。见[厂家链接读回与备用入口](ATTRIBUTION.md)。\n')
await appendFile('docs/VALIDATION.md','\n另见[48 个三维工位的动画专项验证](MOTION-VALIDATION.md)，记录运行与暂停时的画面对照。\n')
if(process.argv.includes('--verified')){
  assert.equal(verified.length,48,'未达到全量联合技术验证，不能一次性启用正式课程清单')
  assert(chrome&&!chrome.failures.length)
  await writeFile('src/data/verified.json',JSON.stringify(verified)+'\n')
}
console.log({scenes:lessons.length,browserVerified:verified.length,cases:lessons.reduce((sum,lesson)=>sum+lesson.trials.length,0)})
