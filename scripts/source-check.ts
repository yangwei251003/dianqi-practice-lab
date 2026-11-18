import {mkdir,writeFile} from 'node:fs/promises'
import {lessons} from '../src/core/catalog'

const sources=Array.from(new Map(lessons.map(lesson=>[lesson.device.url,lesson.device.model])).entries())
const results:{url:string;model:string;http:number|null;type:string;status:string}[]=[]
let cursor=0
async function worker(){
  while(cursor<sources.length){
    const [url,model]=sources[cursor++]
    try{
      const response=await fetch(url,{headers:{range:'bytes=0-4095',accept:'application/pdf,text/html;q=.9,*/*;q=.8'},signal:AbortSignal.timeout(14000)})
      const reader=response.body?.getReader()
      const first=await reader?.read()
      const content=first?.value?new TextDecoder().decode(first.value.subarray(0,4096)):''
      await reader?.cancel()
      const blocked=/captcha|just a moment\.\.\.|<title>access denied|<title>request rejected/i.test(content)
      results.push({url,model,http:response.status,type:response.headers.get('content-type')?.split(';')[0]??'',status:response.ok&&!blocked?'公共链接可读':'自动读回受限，见原件'})
    }catch{results.push({url,model,http:null,type:'',status:'本次本机读回超时或不可达，不据此判断型号真伪'})}
  }
}
await Promise.all(Array.from({length:4},worker))
results.sort((left,right)=>left.url.localeCompare(right.url))
await mkdir('evidence',{recursive:true})
await writeFile('evidence/source-links.json',JSON.stringify({checkedAt:new Date().toISOString(),method:'仅请求厂家链接的初始内容；HTTP 可达性不构成技术核验或素材授权。',results},null,2)+'\n')
console.log({links:results.length,reachable:results.filter(item=>item.status==='公共链接可读').length,restricted:results.filter(item=>item.status!=='公共链接可读').map(item=>[item.model,item.http])})
