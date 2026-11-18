import {validValue} from './engine'
import type { Lesson, Move } from './types'

export interface Attempt {kind:'预测'|'解释'; choice:number; correct:boolean}
export interface Entry {
  moves:Move[]; transfer:Move[]; mode:'practice'|'transfer'; prediction:number|null; explanation:number|null
  attempts:Attempt[]; note:string; finished:boolean; goalsDone:boolean; updated:string; focus:number
}
export interface Book {version:1; last:number|null; entries:Record<string,Entry>}
export const storageKey='dianqi.fieldbook.v1'
export const blankBook=():Book=>({version:1,last:null,entries:{}})
export const blankEntry=():Entry=>({moves:[],transfer:[],mode:'practice',prediction:null,explanation:null,attempts:[],note:'',finished:false,goalsDone:false,updated:'',focus:0})
const record=(value:unknown):value is Record<string,unknown>=>typeof value==='object'&&value!==null&&!Array.isArray(value)
function parseMoves(value:unknown,lesson:Lesson):Move[] {
  if(!Array.isArray(value)||value.length>10000) throw Error('操作记录长度不正确')
  let elapsed=0
  return value.map((move:unknown)=>{
    if(typeof move==='number'&&Number.isFinite(move)&&move>0&&move<=3600) {
      elapsed+=move
      if(elapsed>21600) throw Error('单次实验记录超出六个仿真小时')
      return move
    }
    if(!Array.isArray(move)||move.length!==2||typeof move[0]!=='string'||typeof move[1]!=='number') throw Error('无效操作')
    const control=lesson.controls.find(item=>item.id===move[0])
    if(!control||!validValue(control,move[1])) throw Error('记录与课程的控件不匹配')
    return [move[0],move[1]]
  })
}
export function readBook(text:string,lessons:Lesson[]):Book {
  if(text.length>5_000_000) throw Error('备份过大')
  const data:unknown=JSON.parse(text)
  if(!record(data)||data.version!==1||!record(data.entries)) throw Error('不是受支持的电气实训台备份')
  const book=blankBook()
  for(const [key,raw] of Object.entries(data.entries)) {
    const lesson=lessons.find(item=>String(item.id)===key)
    if(!lesson||!record(raw)) throw Error('备份含有未知实训')
    const answer=(value:unknown,count:number)=>value===null?null:typeof value==='number'&&Number.isInteger(value)&&value>=0&&value<count?value:(()=>{throw Error('无效作答')})()
    const prediction=answer(raw.prediction,lesson.prediction.options.length), explanation=answer(raw.explanation,lesson.explanation.options.length)
    if(!Array.isArray(raw.attempts)||raw.attempts.length>250||typeof raw.note!=='string'||raw.note.length>4000||typeof raw.updated!=='string'||!Number.isFinite(Date.parse(raw.updated))||!['practice','transfer'].includes(String(raw.mode)) || typeof raw.finished!=='boolean'||typeof raw.goalsDone!=='boolean') throw Error('学习记录格式有误')
    const attempts:Attempt[]=raw.attempts.map((value:unknown)=>{
      if(!record(value)||(value.kind!=='预测'&&value.kind!=='解释')) throw Error('题目记录格式有误')
      const quiz=value.kind==='预测'?lesson.prediction:lesson.explanation
      const choice=answer(value.choice,quiz.options.length)
      if(choice===null) throw Error('缺少作答')
      return {kind:value.kind,choice,correct:choice===quiz.answer}
    })
    book.entries[key]={moves:parseMoves(raw.moves,lesson),transfer:parseMoves(raw.transfer,lesson),mode:raw.mode==='transfer'?'transfer':'practice',prediction,explanation,attempts,note:raw.note,finished:raw.finished,goalsDone:raw.goalsDone,updated:new Date(raw.updated).toISOString(),focus:typeof raw.focus==='number'&&Number.isInteger(raw.focus)&&raw.focus>=0&&raw.focus<lesson.parts.length?raw.focus:0}
  }
  book.last=typeof data.last==='number'&&book.entries[data.last]?data.last:null
  return book
}
export function downloadJson(book:Book) {
  const url=URL.createObjectURL(new Blob([JSON.stringify(book,null,2)],{type:'application/json'}))
  const link=document.createElement('a');link.href=url;link.download='电气实训台-学习备份-'+new Date().toISOString().slice(0,10)+'.json'
  link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
}
