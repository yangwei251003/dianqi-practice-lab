import assert from 'node:assert/strict'
import {test} from 'node:test'
import {byId} from '../src/core/catalog'
import {replay} from '../src/core/engine'
import type {Move} from '../src/core/types'

const close=(actual:number,expected:number,tolerance=1e-7)=>assert(Math.abs(actual-expected)<=tolerance,'读到 '+actual+'，应为 '+expected)
const readings=(id:number,actions:Move[])=>Object.fromEntries(replay(byId(id)!,actions).state.frame.meters.map(([name,value])=>[name,value]))
test('独立物理对照：1 kΩ × 1000 µF，在 τ 时达到 12 V 的 63.212%',()=>{
  const record=readings(5,[['contact',1],1])
  close(record['电容电压'],12*(1-Math.exp(-1)))
  close(record['支路电流'],12*Math.exp(-1))
})
test('独立物理对照：中线电流取相量和，而不是三相电流的算术和',()=>{
  close(readings(6,[['a',2],['b',2],['c',2]])['中线电流'],0)
  close(readings(6,[['a',3],['b',0],['c',0]])['中线电流'],3)
})
test('独立扫描对照：一个纸箱停留 2 秒，边沿计数为 1，电平程序为 20',()=>{
  const once=readings(13,[['work',1],2]),repeated=readings(13,[['trigger',1],['work',1],2])
  close(once['显示计数'],1);close(repeated['显示计数'],20)
})
test('独立物理对照：Buck 的负载表不冒充理想占空比输出',()=>{
  const record=readings(26,[['vin',12],['duty',50]])
  close(record['理想无损电压'],6)
  close(record['输出平均电压'],.5*(12-1)+.5*(-.4))
})
test('泵的教学交点同时满足管网阻力和水力功率守恒',()=>{
  const record=readings(12,[['motor',1],['valve',100]])
  const flow=record['总流量'],head=record['泵扬程']
  assert(flow>0&&head>0)
  close(head,(.12+.12)*flow**2)
  close(record['水力功率'],1000*9.81*head*flow/3600)
})
test('同一并网点的交流功率账可由四个独立仪表闭合',()=>{
  const record=readings(48,[['base',11],['pv',4],['ev',13],1])
  close(record['并网有功']+record['储能交流功率']+4,11+record['实际充电'])
})
