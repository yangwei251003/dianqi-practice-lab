import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium, webkit, type Page } from 'playwright'
import { launch as launchGecko } from 'puppeteer-core'
import { lessons, num } from '../src/core/catalog'
import { initialise, perform, replay, type Run } from '../src/core/engine'
import type {Lesson, Move} from '../src/core/types'

const base=(process.env.LAB_URL??'http://127.0.0.1:4187/').replace(/\/?$/,'/')
const selection=(process.env.LAB_ENGINES??'chrome,edge,firefox,webkit').split(',')
const full=process.env.LAB_QUICK!=='1'
const screenshots=process.env.LAB_SCREENSHOTS!== '0'
const destination=process.env.LAB_RESULTS??'evidence'
await mkdir(destination,{recursive:true})
if(screenshots)await mkdir(destination+'/screens',{recursive:true})
type SceneEvidence={id:number;mode:string;meters:number;goals:number;panels:number;transfer:boolean;surface:boolean}
type Result={engine:string;version?:string;scenes:SceneEvidence[];checks:string[];failures:string[]}
const results:Result[]=[]
const chromeFlags=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-background-timer-throttling']
const row=(engine:string):Result=>{const result:Result={engine,scenes:[],checks:[],failures:[]};results.push(result);return result}
async function moveInPage(page:Page,lesson:Lesson,move:Move){
  if(typeof move==='number'){
    const quick=move===.1?'.1':move===1?'1':move===10?'10':''
    if(quick)await page.locator('[data-step="'+quick+'"]').click()
    else {await page.locator('[data-duration]').fill(String(move));await page.locator('[data-advance]').click()}
  }else{
    const control=lesson.controls.find(item=>item.id===move[0])!
    const element=page.locator('[data-control="'+control.id+'"]').first()
    if(await element.count()===0)throw Error('控件未呈现：'+control.id)
    const type=await element.evaluate(node=>node.tagName==='INPUT'?(node as HTMLInputElement).type:node.tagName)
    if(type==='checkbox'){
      const details=element.locator('xpath=ancestor::details[1]')
      if(await details.count()&&!await details.evaluate(node=>(node as HTMLDetailsElement).open))await details.locator('summary').click()
      await element.setChecked(!!move[1])
    }else if(type==='SELECT')await element.selectOption(String(move[1]))
    else if(type==='range'){
      const numeric=page.getByRole('spinbutton',{name:control.label+' 数值',exact:true}).first()
      await numeric.fill(String(move[1]))
      await numeric.press('Tab')
    }else await element.click()
  }
}
async function compare(page:Page,run:Run) {
  const readings=await page.locator('[data-meter]').evaluateAll(elements=>elements.map(element=>Number(element.getAttribute('data-value'))))
  assert.equal(readings.length,run.state.frame.meters.length)
  readings.forEach((reading,index)=>assert(Math.abs(reading-run.state.frame.meters[index][1])<=1e-7*Math.max(1,Math.abs(reading)),'仪表不一致 '+run.state.frame.meters[index][0]+'：'+reading+' / '+run.state.frame.meters[index][1]))
  assert.equal(Number(await page.locator('[data-lesson]').getAttribute('data-sim-time')),run.state.time)
}
const openLesson=async(page:Page,id:number)=>{
  await page.goto(base+'#/lab/'+id,{waitUntil:'domcontentloaded'})
  await page.locator('[data-lesson="'+id+'"]').waitFor()
}
async function engineSuite(name:string){
  const result=row(name)
  const browser=await (name==='webkit'?webkit.launch():chromium.launch({channel:name==='edge'?'msedge':'chrome',args:chromeFlags}))
  try{
    result.version=browser.version()
    const context=await browser.newContext({viewport:{width:1480,height:1000},reducedMotion:'reduce',locale:'zh-CN'})
    const page=await context.newPage()
    page.setDefaultTimeout(name==='webkit'?30000:15000)
    page.setDefaultNavigationTimeout(45000)
    const runtime:string[]=[];page.on('pageerror',error=>runtime.push(error.message))
    await page.goto(base)
    await page.getByRole('heading',{name:/学习总览/}).waitFor()
    if(name==='chrome'&&process.env.LAB_REQUIRE_RELEASE==='1'){
      await page.goto(base+'#/build')
      await page.locator('.build-group a').first().waitFor()
      assert.equal(await page.locator('.build-group a').count(),48)
      const open=await page.locator('.build-group .status.open').count()
      assert.equal(open,lessons.filter(lesson=>!lesson.review).length)
      await page.goto(base+'#/library')
      await page.locator('.cards.library .course-card').first().waitFor()
      assert.equal(await page.locator('.cards.library .course-card').count(),open)
      await page.getByLabel('包含预习工位').check()
      assert.equal(await page.locator('.cards.library .course-card').count(),48)
      result.checks.push('发布版目录只列正式开放工位，勾选预习才展示全部 48 项')
      await page.goto(base+'#/home');await page.getByRole('heading',{name:/学习总览/}).waitFor()
    }
    if(screenshots&&name==='chrome')await page.screenshot({path:destination+'/screens/home.png'})
    result.checks.push('首页与首屏加载')
    const ids=name==='chrome'&&full?lessons.map(lesson=>lesson.id):name==='chrome'?[2,7,13,23,48]:[2,7,16,48]
    for(const id of ids){
      try{
        const lesson=lessons.find(item=>item.id===id)!
        await openLesson(page,id)
        await page.waitForFunction(()=>Boolean(document.querySelector('[data-rig-status]')?.getAttribute('data-rig-status')))
        const mode=(await page.locator('[data-rig-status]').getAttribute('data-rig-status'))!
        if(name==='chrome')assert.equal(mode,'3d','Chrome 主验收不得降级')
        const surface=mode==='3d'&&await page.locator('canvas').count()>0
        if(name==='chrome'&&id===21){
          const canvas=page.locator('canvas').first()
          await canvas.scrollIntoViewIfNeeded()
          const jacket=await canvas.screenshot()
          await page.locator('[data-cutaway]').click()
          await page.locator('.cutaway-label').waitFor()
          assert(!(await canvas.screenshot()).equals(jacket),'剖视应露出内部线芯')
          await page.locator('[data-cutaway]').click()
          result.checks.push('三芯教学剖视切换真实三维几何，非切换静态图片')
        }
        assert.equal(await page.locator('.comic-grid figure').count(),lesson.comic.length)
        await page.locator('[data-answer="prediction-'+lesson.prediction.answer+'"]').click()
        if(mode==='3d'){
          const display=page.locator('[data-rig-reading]')
          if(await display.count()){
            const label=await display.getAttribute('data-rig-reading')
            assert(initialise(lesson).state.frame.meters.some(meter=>meter[0]===label),'三维窗应使用实际仪表通道')
          }
        }
        let run=initialise(lesson)
        for(const move of lesson.practice??lesson.trials[0].moves){await moveInPage(page,lesson,move);run=perform(lesson,run,move)}
        await compare(page,run)
        assert.equal(Number(await page.locator('[data-lesson]').getAttribute('data-goals')),lesson.goals.length)
        await page.locator('[data-view=diagram]').click()
        const active=await page.locator('[data-node][data-active=true]').evaluateAll(nodes=>nodes.map(node=>Number(node.getAttribute('data-node'))))
        assert.deepEqual(active,[...new Set(run.state.frame.active)].sort((left,right)=>left-right))
        await page.locator('[data-view=data]').click()
        assert(await page.locator('.plot svg').count()>0)
        await page.locator('[data-answer="explanation-'+lesson.explanation.answer+'"]').click()
        await page.locator('[data-transfer]').click()
        let transferRun=initialise(lesson)
        for(const move of lesson.trials[3].moves){await moveInPage(page,lesson,move);transferRun=perform(lesson,transferRun,move)}
        await compare(page,transferRun)
        await page.locator('[data-finish]').click()
        await page.locator('.complete').waitFor()
        if(name==='chrome'&&[2,7,16,23,31,48].includes(id)){
          await page.waitForFunction(stationId=>JSON.parse(localStorage.getItem('dianqi.fieldbook.v1')??'{}').entries?.[stationId]?.finished===true,id)
          await page.reload()
          await page.locator('.complete').waitFor();await compare(page,transferRun)
          if(screenshots&&[7,48].includes(id)){await page.locator('[data-view=rig]').click();await page.locator('canvas').first().waitFor();await page.locator('.apparatus').scrollIntoViewIfNeeded();await page.locator('.apparatus').screenshot({path:destination+'/screens/station-'+num(id)+'.png'})}
        }
        result.scenes.push({id,mode,meters:run.state.frame.meters.length,goals:run.goals,panels:lesson.comic.length,transfer:true,surface})
        console.log(name,num(id),'OK',mode)
      }catch(reason){result.failures.push('工位 '+num(id)+'：'+(reason as Error).message.split('\n').slice(0,3).join(' '));console.error(name,'FAIL',id,result.failures.at(-1))}
    }
    await page.goto(base+'#/route')
    await page.locator('.path-step').first().waitFor()
    assert.equal(await page.locator('.path-step').count(),6)
    await page.goto(base+'#/devices')
    await page.locator('.device-list article').first().waitFor()
    assert(await page.locator('.device-list article').count()>0)
    result.checks.push('六阶段路线、型号索引')
    await page.goto(base+'#/records')
    await page.locator('.record-list article').first().waitFor()
    assert(await page.locator('.record-list article').count()>0)
    if(name==='chrome'){
      const exported=page.waitForEvent('download')
      await page.getByRole('button',{name:'导出进度备份'}).click()
      const backup=await exported
      const temp=await backup.path();assert(temp)
      await page.locator('input[type=file]').setInputFiles(temp)
      await page.getByRole('button',{name:'替换并恢复'}).click()
      await page.getByText('备份已恢复，可以从上次的操作继续。').waitFor()
      await page.locator('input[type=file]').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"version":99}')})
      await page.getByRole('alert').waitFor()
      assert(await page.locator('.record-list article').count()>0)
      result.checks.push('JSON 下载导入、确认替换、损坏备份保护')
      await openLesson(page,7)
      await page.emulateMedia({media:'print'})
      await page.locator('.print-report').waitFor()
      assert(await page.locator('.print-report').isVisible())
      const pdf=await page.pdf({format:'A4'});assert(pdf.byteLength>8000)
      await page.emulateMedia({media:'screen'})
      result.checks.push('打印样式与真实 PDF 导出')
      const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'})
      const tab=await mobile.newPage();await tab.goto(base);await tab.getByRole('button',{name:'展开导航'}).tap();await tab.getByRole('link',{name:'新生路线',exact:true}).tap()
      await tab.locator('.path-list').waitFor()
      await openLesson(tab,2);await tab.locator('[data-view=diagram]').tap()
      assert(await tab.locator('.diagram-view').isVisible())
      assert(await tab.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'窄屏横向溢出')
      await tab.goto(base+'#/home');if(screenshots)await tab.screenshot({path:destination+'/screens/mobile.png'})
      const other=await mobile.newPage();await other.goto(base+'#/records')
      await other.locator('input[type=file]').setInputFiles(temp)
      await other.getByRole('button',{name:'替换并恢复'}).click()
      await openLesson(other,7);await other.locator('.complete').waitFor()
      await compare(other,replay(lessons.find(item=>item.id===7)!,lessons.find(item=>item.id===7)!.trials[3].moves))
      await mobile.close()
      result.checks.push('390px 触控导航、窄屏布局、在独立移动配置导入桌面备份并还原时间与读数')
      const limited=await browser.newContext()
      await limited.addInitScript(()=>{const native=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(this:HTMLCanvasElement,type:string,...args:unknown[]){if(type.includes('webgl'))return null;return Reflect.apply(native,this,[type,...args])} as typeof native})
      const fallback=await limited.newPage();await openLesson(fallback,2)
      await fallback.locator('[data-rig-status=fallback]').waitFor({state:'attached'})
      await fallback.locator('[data-part-apply]').click();await fallback.locator('[data-view=diagram]').click()
      assert(await fallback.locator('.diagram-view').isVisible());await limited.close()
      result.checks.push('图形能力不足时明确二维降级，仍可操作')
      const hands=await browser.newContext({viewport:{width:1350,height:930},reducedMotion:'reduce'})
      const station=await hands.newPage();await openLesson(station,2)
      await station.locator('[data-rig-status="3d"]').waitFor({state:'attached'})
      await station.locator('canvas').first().focus()
      await station.keyboard.press('2');await station.keyboard.press('Enter')
      await station.waitForFunction(()=>(document.querySelector('[data-control=w02]') as HTMLInputElement|null)?.checked===true)
      await station.keyboard.press('Enter')
      await station.waitForFunction(()=>(document.querySelector('[data-control=w02]') as HTMLInputElement|null)?.checked===false)
      for(const [from,to] of [[0,2],[3,4],[1,5]]){
        await station.locator('[data-terminal="'+from+'"]').click()
        await station.locator('[data-terminal="'+to+'"]').click()
      }
      await station.locator('[data-control=power]').selectOption('1')
      const reading=await station.locator('[data-meter]').evaluateAll(elements=>elements.map(element=>Number(element.getAttribute('data-value'))))
      assert(reading.filter(value=>Math.abs(value-12)<1e-7).length>=2,'两盏串联灯均应为 12 V')
      await station.locator('[data-view=diagram]').focus()
      await station.keyboard.press('Enter')
      assert(await station.locator('.diagram-view').isVisible())
      await station.locator('.comic-grid figure').first().getByRole('button').click()
      await station.locator('canvas').waitFor()
      assert.equal(await station.locator('[data-part][aria-pressed=true]').count(),1)
      await hands.close()
      result.checks.push('三维画布选中并操作热点实际插拔导线；逐对点击六端子搭成串联实测两灯各 12 V、键盘视图切换、漫画定位部件')
      const diagnostic=await browser.newContext({viewport:{width:1360,height:940},reducedMotion:'reduce'})
      const testPage=await diagnostic.newPage(),lessonFive=lessons.find(lesson=>lesson.id===5)!
      await openLesson(testPage,5)
      for(const idx of [1,2]){
        if(idx===2){await testPage.getByRole('button',{name:'重做本课',exact:true}).click();await testPage.getByRole('button',{name:'确认重做本课'}).click()}
        for(const move of lessonFive.trials[idx].moves)await moveInPage(testPage,lessonFive,move)
        await compare(testPage,replay(lessonFive,lessonFive.trials[idx].moves))
      }
      await openLesson(testPage,7);await testPage.locator('canvas').first().waitFor()
      const canvas=testPage.locator('canvas').first();await canvas.scrollIntoViewIfNeeded();const box=await canvas.boundingBox();assert(box)
      const first=await canvas.screenshot()
      await testPage.mouse.move(box.x+box.width*.58,box.y+box.height*.45);await testPage.mouse.down()
      await testPage.mouse.move(box.x+box.width*.72,box.y+box.height*.5,{steps:8});await testPage.mouse.up()
      const rotated=await canvas.screenshot();assert(!rotated.equals(first),'轨道拖动应改变真实三维画面')
      await testPage.getByRole('button',{name:'放大模型'}).click()
      assert(!(await canvas.screenshot()).equals(rotated),'缩放应该改变设备画面')
      await testPage.getByRole('button',{name:'复位视角'}).click()
      if(screenshots){await testPage.locator('.comic-section').screenshot({path:destination+'/screens/comic-07.png'})}
      await diagnostic.close()
      result.checks.push('RC 误操作与开路恢复真实控件读数、三维拖动与缩放改变像素画面、相机复位')
    }
    if(runtime.length)result.failures.push(...[...new Set(runtime)].map(message=>'运行时：'+message))
    await context.close()
  }catch(reason){result.failures.push((reason as Error).message)}finally{await browser.close()}
}
async function installedFirefox(){
  const result=row('firefox')
  const browser=await launchGecko({browser:'firefox',executablePath:process.env.FIREFOX_PATH??'C:/Program Files/Mozilla Firefox/firefox.exe',headless:true,protocol:'webDriverBiDi'})
  try{
    result.version=await browser.version()
    const page=await browser.newPage()
    const errors:string[]=[];page.on('pageerror',error=>errors.push(String(error)))
    for(const id of [2,7,16,48]){
      const lesson=lessons.find(item=>item.id===id)!
      await page.goto(base+'#/lab/'+id)
      await page.waitForFunction(()=>document.querySelector('[data-rig-status]')?.getAttribute('data-rig-status'),{timeout:20000})
      const mode=await page.$eval('[data-rig-status]',element=>element.getAttribute('data-rig-status')!)
      await page.click('[data-part-apply]')
      await page.click('[data-view=diagram]');await page.waitForSelector('.diagram-view')
      await page.click('[data-view=data]');await page.waitForSelector('.plot svg')
      const panels=await page.$$eval('.comic-grid figure',items=>items.length);assert.equal(panels,lesson.comic.length)
      result.scenes.push({id,mode,meters:await page.$$eval('[data-meter]',items=>items.length),goals:0,panels,transfer:false,surface:mode==='3d'})
    }
    result.checks.push('本机 Firefox 正式版：部件操作、原理图、数据曲线、分镜；非完整过关回归')
    if(errors.length)result.failures.push(...new Set(errors))
  }catch(reason){result.failures.push((reason as Error).message)}finally{await browser.close()}
}
for(const engine of selection){
  try {if(engine==='firefox')await installedFirefox();else await engineSuite(engine)}
  catch(reason){const result=results.find(item=>item.engine===engine)??row(engine);result.failures.push(String(reason))}
  await writeFile(destination+'/browser-'+engine+'.json',JSON.stringify({testedAt:new Date().toISOString(),target:new URL(base).host.includes('127.0.0.1')?'local-production-build':base,full, ...results.find(item=>item.engine===engine)},null,2))
}
console.log(results.map(result=>({engine:result.engine,scenes:result.scenes.length,failures:result.failures})))
if(results.some(result=>result.failures.length))process.exitCode=1
