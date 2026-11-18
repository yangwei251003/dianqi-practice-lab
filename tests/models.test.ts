import assert from 'node:assert/strict'
import {test} from 'node:test'
import {lessons} from '../src/core/catalog'
import {initialise, perform, replay, validValue} from '../src/core/engine'
import {blankBook, blankEntry, readBook} from '../src/core/book'
import type {Lesson, Snapshot} from '../src/core/types'

test('八个方向恰好包含 48 个不同的实训，前置图无循环',()=>{
  assert.deepEqual(lessons.map(lesson=>lesson.id),Array.from({length:48},(_,index)=>index+1))
  function visit(lesson:Lesson,seen:number[]) {
    assert(!seen.includes(lesson.id),'循环：'+[...seen,lesson.id].join('→'))
    for(const id of lesson.prerequisites){const prerequisite=lessons.find(item=>item.id===id);assert(prerequisite,'未知先修 '+id);visit(prerequisite,[...seen,lesson.id])}
  }
  lessons.forEach(lesson=>visit(lesson,[]))
})
function finite(state:Snapshot,lesson:Lesson) {
  assert(state.frame.meters.length>=1)
  for(const [label,value] of state.frame.meters){assert(label);assert(Number.isFinite(value),label+' 非有限读数')}
  for(const index of state.frame.active)assert(lesson.diagram.nodes[index]!==undefined,'状态图指向未知节点 '+index)
  for(const plot of state.frame.plots??[]) {assert(plot.title&&plot.x&&plot.y);assert(plot.points.length);assert(plot.points.every(pair=>pair.length===2&&pair.every(Number.isFinite)))}
}
for(const lesson of lessons){
  const prefix=String(lesson.id).padStart(2,'0')+' '+lesson.title
  test(prefix+' / 资料、空间热点、六格漫画与状态图契约',()=>{
    assert.equal(new URL(lesson.device.url).protocol,'https:')
    for(const text of [lesson.device.maker,lesson.device.model,lesson.device.document,lesson.device.locator,lesson.assumptions,lesson.task])assert(text.trim().length>0)
    assert(lesson.device.features.length>=1)
    assert(lesson.parts.length>=3);assert(lesson.comic.length>=6);assert.equal(new Set(lesson.comic.map(panel=>panel.line)).size,lesson.comic.length)
    assert.equal(new Set(lesson.controls.map(control=>control.id)).size,lesson.controls.length)
    lesson.parts.forEach(part=>{const control=lesson.controls.find(item=>item.id===part.control);assert(control,'无操作绑定：'+part.label);if(part.value!==undefined)assert(validValue(control,part.value),part.label+' 热点值不合法')})
    lesson.comic.forEach(panel=>assert(lesson.parts[panel.focus],panel.line+' 部件定位无效'))
    lesson.diagram.edges.forEach(edge=>edge.forEach(idx=>assert(lesson.diagram.nodes[idx]!==undefined)))
    assert(lesson.diagram.edges.length);assert(lesson.goals.length>=2)
    assert(lesson.trials.length>=4)
    for(const quiz of [lesson.prediction,lesson.explanation]){assert(quiz.options.length>=2&&quiz.options[quiz.answer]&&quiz.why.trim())}
    finite(initialise(lesson).state,lesson)
  })
  for(const [index,trial] of lesson.trials.entries())test(prefix+' / 路径 '+(index+1)+' '+trial.name,()=>{
    let run=initialise(lesson)
    assert(trial.moves.length,'应包含学生动作或推进')
    for(const move of trial.moves){run=perform(lesson,run,move);finite(run.state,lesson)}
    assert(trial.verify(run.state),JSON.stringify(run.state.frame.meters)+' / '+run.state.frame.note)
  })
  test(prefix+' / 主任务可达、迁移独立运行、备份重放一致',()=>{
    const moves=lesson.practice??lesson.trials[0].moves
    const run=replay(lesson,moves)
    assert.equal(run.goals,lesson.goals.length,'尚未达到：'+lesson.goals.slice(run.goals).map(goal=>goal.text).join(' → '))
    assert(lesson.trials[3].moves.some(Array.isArray),'迁移检查需学生操作')
    const backup=blankBook()
    backup.last=lesson.id;backup.entries[lesson.id]={...blankEntry(),moves,updated:new Date().toISOString()}
    const restored=readBook(JSON.stringify(backup),lessons)
    assert.deepEqual(replay(lesson,restored.entries[lesson.id].moves),run)
    const changed=lesson.parts.some(part=>{
      const control=lesson.controls.find(item=>item.id===part.control)!
      const value=part.value??(control.kind==='button'?1:control.kind==='choice'?(control.initial+1)%(control.options?.length??1):control.initial+(control.step??1)>(control.max??100)?control.min??0:Number((control.initial+(control.step??1)).toFixed(8)))
      const before=initialise(lesson),after=perform(lesson,before,[control.id,value]).state
      return JSON.stringify([after.input,after.memory,after.frame])!==JSON.stringify([before.state.input,before.state.memory,before.state.frame])
    })
    assert(changed,'三维操作不可全部为空操作')
  })
}
test('备份拒绝未知版本、异常操作、错误类型、超长笔记，不吞掉原始存档',()=>{
  assert.throws(()=>readBook('{"version":2,"entries":{}}',lessons))
  const book=blankBook(),lesson=lessons[1]
  book.entries[2]={...blankEntry(),updated:new Date().toISOString(),moves:[['not-a-control',1]]}
  assert.throws(()=>readBook(JSON.stringify(book),lessons))
  book.entries[2].moves=[-2];assert.throws(()=>readBook(JSON.stringify(book),lessons))
  book.entries[2].moves=[];book.entries[2].note='字'.repeat(4001);assert.throws(()=>readBook(JSON.stringify(book),lessons))
  assert.throws(()=>perform(lesson,initialise(lesson),Infinity))
})
