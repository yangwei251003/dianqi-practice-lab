import assert from 'node:assert/strict'
import {mkdir,writeFile} from 'node:fs/promises'
import {join} from 'node:path'
import {chromium,type Page} from 'playwright'
import {sequences} from '../src/core/cinema'

const base=process.env.LAB_URL??'http://127.0.0.1:4192/',out=process.env.MOTION_OUT??'.work/animation',ids=process.env.MOTION_COURSES?.split(',').map(Number)??Array.from({length:48},(_,index)=>index+1)
const browser=await chromium.launch({channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}),context=await browser.newContext({viewport:{width:1160,height:820},deviceScaleFactor:1,reducedMotion:'no-preference'})
await mkdir(out,{recursive:true});const results:Record<string,unknown>[]=[],errors:string[]=[]
let page:Page
const settle=()=>page.evaluate(()=>new Promise<void>(resolve=>{requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))}))
async function capture(){await settle();return page.locator('.el-rig-canvas').screenshot({animations:'allow'})}
async function difference(before:Buffer,after:Buffer){return page.evaluate(async([first,second])=>{
  const [left,right]=await Promise.all([first,second].map(async encoded=>{const bytes=Uint8Array.from(atob(encoded),value=>value.charCodeAt(0)),bitmap=await createImageBitmap(new Blob([bytes],{type:'image/png'}));const context=new OffscreenCanvas(bitmap.width,bitmap.height).getContext('2d')!;context.drawImage(bitmap,0,0);bitmap.close();return context.getImageData(0,0,context.canvas.width,context.canvas.height)}));let pixels=0
  for(let row=Math.round(left.height*.14);row<left.height*.83;row++)for(let col=Math.round(left.width*.12);col<left.width*.88;col++){const offset=(row*left.width+col)*4;if(Math.max(...[0,1,2].map(slot=>Math.abs(left.data[offset+slot]-right.data[offset+slot])))>=15)pixels++}
  return pixels
},[before.toString('base64'),after.toString('base64')])}

try{
  for(const [slot,id] of ids.entries()){
    if(slot%8===0){if(slot)await page!.close();page=await context.newPage();page.setDefaultTimeout(12000);page.on('pageerror',error=>errors.push(String(error)))}
    try{
      await page!.goto(`${base}#/lab/${id}`);await page!.locator(`[data-station="${id}"][data-rig-view="3d"]`).waitFor()
      const control=page!.locator('[data-demo-play]');if(!await control.count())await page!.locator('[data-demo-start]').click();if(await control.getAttribute('aria-label')==='暂停演示')await control.click()
      await page!.locator('[data-chapter="0"]').click();const initial=await capture();let changed=0,chapter=1
      for(;chapter<sequences[id].length;chapter++){
        await page!.locator(`[data-chapter="${chapter}"]`).click();const start=Number(await page!.locator('.lab').getAttribute('data-sim-time'));await control.click();await page!.waitForFunction(target=>Number(document.querySelector('.lab')?.getAttribute('data-sim-time'))>=target,start+(id===23?2.4:.28));await control.click();const next=await capture();changed=await difference(initial,next);if(changed>=50)break
      }
      assert(changed>=50,`中央画面只有 ${changed} 个明显变化像素`)
      await page!.locator('[data-chapter="0"]').click();const still=await capture();await page!.waitForTimeout(200);const pausedPixels=await difference(still,await capture());assert.equal(pausedPixels,0,'暂停后设备及可见原理应一起冻结')
      let movingPixels=0,movingChapter=0
      for(const index of sequences[id].keys()){
        await page!.locator(`[data-chapter="${index}"]`).click();await control.click();const first=await capture();await page!.waitForTimeout(460);const second=await capture();const same=await page!.locator('[data-cue]').getAttribute('data-cue')===String(index);if(await control.getAttribute('aria-label')==='暂停演示')await control.click();if(!same)continue
        movingPixels=await difference(first,second);if(movingPixels>=50){movingChapter=index+1;break}
      }
      assert(movingChapter,`所有分段均未观察到同一运行阶段的连续变化（末次 ${movingPixels} 像素）`)
      const goals=await page!.locator('[data-goals]').getAttribute('data-goals');await page!.locator('[data-demo-exit]').click();assert.equal(await page!.locator('[data-goals]').getAttribute('data-goals'),goals)
      results.push({id,chapter:chapter+1,changedPixels:changed,movingChapter,movingPixels,pausedPixels,passed:true});console.log('3D',id,chapter+1,changed,movingPixels)
    }catch(error){results.push({id,passed:false,error:String(error)});console.error(id,String(error))}
  }
}finally{await browser.close();await writeFile(join(out,'animated-rigs.json'),JSON.stringify({version:browser.version(),testedAt:new Date().toISOString(),target:new URL(base).origin,browser:'Installed Chrome / headless + SwiftShader',scope:'Three-dimensional canvas center crop only, counting pixels changing by at least 15/255. Each station compares two conditions, two frames in one running chapter, and two frozen frames. Not a hardware measurement or frame-rate benchmark.',results,errors},null,2)+'\n')}
if(errors.length||results.some(result=>!result.passed))process.exitCode=1
