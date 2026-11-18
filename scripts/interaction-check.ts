import assert from 'node:assert/strict'
import {mkdir,writeFile} from 'node:fs/promises'
import {join} from 'node:path'
import {chromium,webkit,type Page} from 'playwright'
import {effects} from '../src/ui/motion-catalog'

const base=process.env.LAB_URL??'http://127.0.0.1:4192/',out=process.env.MOTION_OUT??'.work/animation',engine=process.env.MOTION_ENGINE??'chrome'
const browser=engine==='webkit'?await webkit.launch():await chromium.launch({channel:engine==='edge'?'msedge':'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']})
const context=await browser.newContext({viewport:{width:1230,height:850},deviceScaleFactor:1}),page=await context.newPage()
const results:{id:string|number;passed:boolean;error?:string}[]=[],errors:string[]=[]
page.setDefaultTimeout(engine==='webkit'?18000:10000);page.setDefaultNavigationTimeout(30000);page.on('pageerror',error=>errors.push(String(error)));page.on('crash',()=>errors.push('Browser page crashed'))
async function test(id:string|number,action:()=>Promise<void>){try{await action();results.push({id,passed:true})}catch(error){results.push({id,passed:false,error:String(error)});console.error(id,String(error))}}
async function pointer(target:string,prop:string){const panel=page.locator(target);await panel.hover({position:{x:9,y:13}});await page.waitForFunction(([selector,key])=>Boolean(document.querySelector<HTMLElement>(selector)?.style.getPropertyValue(key)),[target,prop])}
async function until(page:Page,selector:string){await page.locator(selector).first().waitFor()}

try{
 await page.goto(base+'#/motion');await until(page,'[data-effect="26"]');assert.equal(await page.locator('[data-effect]').count(),26)
 for(const effect of effects)await test(effect.id,async()=>{
   await page.locator(`[data-effect="${effect.id}"]`).click();const sample=page.locator(`[data-sample="${effect.id}"]`),buttons=sample.getByRole('button');await sample.waitFor()
   assert.equal(await page.locator('.spec-title h2').textContent(),effect.zh);assert.equal(await page.locator('.spec-foot a').getAttribute('href'),`#/${effect.href}?effect=${effect.id}`)
   switch(effect.id){
    case 1:await buttons.first().focus();await page.keyboard.press('Enter');assert.equal(await buttons.first().getAttribute('aria-pressed'),'true');break
    case 2:await buttons.first().click();await sample.getByRole('button',{name:'传动',exact:true}).click();assert.match(await buttons.first().innerText(),/传动/);break
    case 3:await pointer('.magnetic-zone','--mx');await buttons.first().click();assert.equal(await buttons.first().getAttribute('aria-pressed'),'true');break
    case 4:await pointer('.probe-map','--bearing');assert.notEqual(await sample.locator('.probe-bearing').evaluate(el=>getComputedStyle(el).transform),'none');break
    case 5:await pointer('.probe-map','--px');assert.match(await sample.locator('.probe-map').evaluate(el=>getComputedStyle(el).cursor),/url\(/);await sample.locator('[data-probe="1"]').click();assert.match(await sample.locator('output').innerText(),/0.18/);break
    case 6:await pointer('.reactive-screen','--py');await buttons.first().click();await until(page,'.reactive-screen.alt-origin');break
    case 7:await pointer('.probe-map','--px');await until(page,'.probe-trail');break
    case 8:await pointer('.tilt-example','--tilt-x');await buttons.first().click();await until(page,'.touch-tilt');break
    case 9:await buttons.first().click();assert.equal(await buttons.first().getAttribute('aria-expanded'),'true');break
    case 10:await sample.locator('.help-tip').click();await until(page,'[role="tooltip"][data-pinned="true"]');break
    case 11:await pointer('.spot-board','--px');await buttons.first().click();await until(page,'.spot-board.alt-origin');break
    case 12:await buttons.first().click();await until(page,'.shared-stage.magnified');break
    case 13:await sample.getByRole('button',{name:'下一格'}).click();assert.match(await sample.innerText(),/衔铁吸合/);break
    case 14:await sample.getByRole('tab').first().focus();await page.keyboard.press('ArrowRight');assert.match(await sample.getByRole('tabpanel').innerText(),/动触点/);break
    case 15:await buttons.first().click();await until(page,'.morph-play.is-playing');break
    case 16:await sample.locator('.ripple-pad').hover();await page.mouse.down();try{await until(page,'.press-wave')}finally{await page.mouse.up()}assert.match(await sample.innerText(),/1 次/);break
    case 17:assert(await buttons.first().isDisabled());await sample.getByRole('checkbox').check();await buttons.first().click();await until(page,'.success-mark');break
    case 18:await buttons.first().click();assert.equal(await sample.locator('.number-roll').getAttribute('aria-label'),'1');break
    case 19:await buttons.first().click();await until(page,'.mx-toast');break
    case 20:case 24:await buttons.first().click();await sample.getByRole('dialog').waitFor();assert.equal(await sample.locator('dialog').evaluate(el=>el.matches('.mx-drawer')),effect.id===20);await page.keyboard.press('Escape');await sample.getByRole('dialog').waitFor({state:'hidden'});assert(await buttons.first().evaluate(el=>el===document.activeElement));break
    case 21:{const last=await sample.locator('[data-row]').last().getAttribute('data-row');await buttons.first().click();assert.equal(await sample.locator('[data-row]').first().getAttribute('data-row'),last);break}
    case 22:await buttons.first().click();await until(page,'.fold-grid[aria-hidden="false"]');break
    case 23:await buttons.first().click();await until(page,'.label-result[aria-busy="true"]');await until(page,'.label-result[aria-busy="false"]');assert.match(await sample.locator('.label-result').innerText(),/LC1D09BD/);break
    case 25:await sample.getByRole('button',{name:'导通',exact:true}).click();await until(page,'.mx-error');await sample.getByRole('button',{name:'开路',exact:true}).click();await until(page,'.success-mark');break
    case 26:await buttons.first().click();assert.match(await sample.locator('h3').innerText(),/复盘/);break
   }
 })
 await test('术语描述可选取，应用链接定位真实取样按钮',async()=>{
   await page.locator('[data-effect="11"]').click();const phrase=page.locator('.phrase-card');await phrase.locator('summary').click();assert.match(await phrase.locator('textarea').inputValue(),/Cursor spotlight.*带电/);await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined}));await phrase.getByRole('button',{name:'复制这句描述'}).click();assert.match(await phrase.getByRole('status').innerText(),/已选中/);assert(await phrase.locator('textarea').evaluate(el=>el instanceof HTMLTextAreaElement&&el.selectionStart===0&&el.selectionEnd===el.value.length));await page.locator('.spec-foot a').click();await until(page,'[data-lesson="7"] [data-capture].mx-jump-target');const capture=page.locator('[data-capture]');assert(await capture.evaluate(el=>el===document.activeElement));await page.keyboard.press('Enter');await page.getByRole('dialog',{name:'这一刻的测量'}).waitFor();await page.keyboard.press('Escape');assert(await capture.evaluate(el=>el===document.activeElement))
 })
 await test('从场景库倾斜卡片和下拉导航进入实际工位',async()=>{
   await page.goto(base+'#/library');const card=page.locator('[data-station-card]').first();await card.hover({position:{x:18,y:15}});await page.waitForFunction(()=>{const card=document.querySelector<HTMLElement>('[data-station-card]');return !!card?.style.getPropertyValue('--tilt-y')&&getComputedStyle(card).transform.startsWith('matrix3d')});const quick=page.locator('.quick-stations');await quick.locator('summary').click();await quick.locator('a[href="#/lab/7"]').click();await until(page,'[data-lesson="7"] [data-rig-view="3d"]')
 })
 await test('取样冻结、手记保存、不代做实操',async()=>{
   await page.goto(base+'#/lab/7');await until(page,'[data-lesson="7"] [data-rig-view="3d"]');const play=page.locator('[data-demo-play]');if(!await play.count())await page.locator('[data-demo-start]').click();await page.locator('[data-chapter="0"]').click();const goals=await page.locator('.lab').getAttribute('data-goals');await page.locator('[data-capture]').click();const drawer=page.getByRole('dialog',{name:'这一刻的测量'});await drawer.waitFor();const frozen=await drawer.locator('.reading-list').innerText();await page.waitForTimeout(500);assert.equal(await drawer.locator('.reading-list').innerText(),frozen);await drawer.getByRole('button',{name:'写入本课笔记'}).click();await until(page,'.mx-toast');await page.locator('[data-demo-exit]').click();assert.equal(await page.locator('.lab').getAttribute('data-goals'),goals);await page.reload();await until(page,'[data-demo-start]');assert.match(await page.locator('textarea').inputValue(),/教学仿真 · 演示/)
 })
 for(const effect of effects)await test(`实际位置 ${effect.id} · ${effect.zh}`,async()=>{
   await page.goto(base+'#/motion');await page.locator(`[data-effect="${effect.id}"]`).click();await page.locator('.spec-foot a').click()
   const target=`#/${effect.href}?effect=${effect.id}`;await page.waitForFunction(hash=>location.hash===hash&&document.activeElement?.matches('#main-content .mx-jump-target'),target)
 })
 await test('减少动效与窄屏',async()=>{await page.setViewportSize({width:390,height:800});await page.goto(base+'#/motion');await page.getByRole('button',{name:'减少动效',exact:true}).click();await page.reload();await until(page,'html[data-motion="quiet"] .atlas-hero');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.goto(base+'#/lab/32');await until(page,'[data-lesson="32"] [data-demo-start]');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)})
}finally{await browser.close();await mkdir(out,{recursive:true});await writeFile(join(out,`interactions-${engine}.json`),JSON.stringify({engine,version:browser.version(),testedAt:new Date().toISOString(),target:new URL(base).origin,scope:'Pointer, keyboard, touch alternatives via button, focus restoration, reduced motion, persisted sample and narrow layout; not a physical-phone test.',results,errors},null,2)+'\n')}
console.log(engine,results.filter(test=>test.passed).length,'/',results.length);if(errors.length||results.some(result=>!result.passed))process.exitCode=1
