import type { Group } from 'three'
import { contactor, disconnect, terminals } from './electrical'
import { clamp, group, Kit, type Finish, type Point } from './kit'
import { board, capacitor, fan, gauge, lamp, motor, plaque, pump, skid, trace, valve } from './machinery'
import { spin, value } from './signals'

function patchCords(k:Kit,p:Group,sockets:Point[]) {
  for(const lead of k.lesson.wiring?.leads??[]) {
    const a=sockets[lead.from],b=sockets[lead.to]
    if(!a||!b)continue
    const mid:Point=[(a[0]+b[0])/2,Math.max(a[1],b[1])+0.13+0.055*((lead.from+lead.to)%3),(a[2]+b[2])/2+0.086*((lead.to%3)-1)]
    const wire=k.tag(group(p),lead.control)
    k.hose(wire,[a,mid,b],0.028,(['blue','copper','teal'] as const)[lead.from%3])
    k.respond(s=>{wire.visible=Boolean(s.input[lead.control])})
  }
}

function safety(k:Kit,p:Group) {
  const deck=skid(k,p,3.7,1.78)
  for(const [i,feed] of (['main','reserve'] as const).entries()) {
    const x=-1.28+i*0.89
    const iso=disconnect(k,group(deck,x,0,-0.14,0.88))
    k.tag(iso.body,feed)
    iso.handle.userData.actuator=true
    k.label(iso.body,i?'备用':'主源',0.43,0.11,0,0.867,0.351,'#393e31','#e3ba55')
    k.respond(s=>{iso.handle.rotation.z=s.input[feed]?Math.PI/2:0})
    k.hose(deck,[[x,0.12,0.14],[x,0.059,0.47+i*0.09],[0.16,0.059,0.47+i*0.09],[0.57,0.14,0.17]],0.029,i?'blue':'rubber')
  }
  const test=k.tag(group(deck,0.99,0,0.02),'readBus')
  k.box(test,1.29,0.57,0.86,0,0.29,0,'teal',true)
  k.box(test,1.15,0.47,0.034,0,0.30,0.446,'porcelain',true)
  for(const x of [-0.32,0,0.32]) {
    k.cylinder(test,0.086,0.051,x,0.28,0.477,'graphite','z')
    k.cylinder(test,0.036,0.012,x,0.28,0.509,'copper','z')
  }
  k.label(test,'L1     L2     L3',0.82,0.1,0,0.44,0.468,'#35494a','#e6ebe7')
  const pilot=lamp(k,test,0.32,0.575,-0.05,0.9)
  k.light(pilot.bulb,s=>value(s,/电压|带电/,/^V$|^$/)>0,'warn')
  k.display(test,0.53,0.16,-0.17,0.518,0.476,s=>s.memory.sampled?String(s.memory.reading)+' V':'—')
}

function lamps(k:Kit,p:Group) {
  const deck=skid(k,p,3.6,1.62)
  const pads:Point[]=[[-1.36,0.16,-0.31],[-1.36,0.16,0.42]]
  const supply=k.tag(group(deck,-1.36,0,0.05),'power')
  k.box(supply,0.43,0.17,1.05,0,0.096,0,'teal',true)
  for(const pos of pads) k.cylinder(deck,0.079,0.036,pos[0],0.199,pos[2],'alloy')
  for(let i=0;i<2;i++) {
    const x=-0.27+i*1.3
    const g=k.tag(group(deck,x,0,-0.14),'lamp'+i)
    k.cylinder(g,0.35,0.09,0,0.06,0,'alloy')
    k.cylinder(g,0.23,0.16,0,0.18,0,'porcelain')
    for(let j=0;j<3;j++) k.ring(g,0.157,0.019,0,0.29+j*0.047,0,'steel','y')
    const bulb=k.ball(g,0.291,0.378,0.291,0,0.69,0,'ice')
    k.intensity(bulb,s=>Math.sqrt(Math.max(0,value(s,i?/^B 灯功率$/:/^A 灯功率$/, /^W$/))/2.6),'warn','ice')
    for(const side of [-1,1]) {
      k.cylinder(g,0.075,0.072,side*0.247,0.069,0.37,'steel')
      pads.push([x+side*0.247,0.115,0.23])
    }
  }
  patchCords(k,deck,pads)
  plaque(k,deck,'A1   A2',0.7,-0.27,0.014,0.63)
  plaque(k,deck,'B1   B2',0.7,1.03,0.014,0.63)
}

function terminalBench(k:Kit,p:Group) {
  const deck=skid(k,p,3.7,1.7)
  const pads:Point[]=[]
  for(let bank=0;bank<2;bank++) {
    const x=bank?0.91:-0.91
    const rail=k.tag(group(deck,x,0,0),bank?'ping':'send')
    k.box(rail,0.9,0.065,1.37,0,0.035,0,'alloy')
    for(let i=0;i<3;i++) {
      const z=(i-1)*0.39
      const block=terminals(k,group(rail,0,0.059,z,0.9),1)
      block.rotation.y=Math.PI/2
      const pilot=k.cylinder(rail,0.056,0.034,bank?0.34:-0.34,0.106,z,'off')
      k.light(pilot,s=>bank?Boolean((s.memory.remote??0)&(1<<i)):s.input.send===i)
      pads.push([x+(bank?-0.135:0.135),0.441,z])
    }
    plaque(k,deck,bank?'X2':'X1',0.48,x,0.015,0.73)
  }
  patchCords(k,deck,pads)
}

function meterBench(k:Kit,p:Group) {
  const deck=skid(k,p,3.72,1.76)
  const load=k.tag(group(deck,0,0,-0.21),'fault')
  k.box(load,3.03,0.205,0.71,0,0.105,0,'teal',true)
  k.cylinder(load,0.108,0.58,0,0.31,0,'glass','x')
  for(const sign of [-1,1]) k.cylinder(load,0.115,0.13,sign*0.31,0.31,0,'alloy','x')
  const core=k.box(load,0.54,0.025,0.043,0,0.31,0,'copper')
  core.userData.mutable=true
  k.respond(s=>{core.visible=s.input.fault!==0})
  for(let j=0;j<4;j++){
    const x=(j-1.5)*0.84
    k.cylinder(load,0.081,0.064,x,0.237,0.22,'steel')
    plaque(k,deck,'ABCD'[j],0.24,x,0.014,0.68)
  }
  for(const i of [-1,1]) {
    const key=i>0?'red':'black'
    const tip=k.tag(group(deck,0,0.28,0.01),key)
    k.rod(tip,[i*0.07,0.11,0.08],[i*0.29,0.38,0.32],0.051,i>0?'red':'graphite')
    k.rod(tip,[0,0,0],[i*0.077,0.125,0.09],0.019,'silver')
    k.hose(tip,[[i*0.29,0.38,0.32],[i*0.36,0.27,0.36],[i*0.38,-0.13,0.38],[i*0.25,-0.2,0.48],[i*0.08,-0.2,0.49]],0.022,i>0?'red':'rubber')
    k.respond(s=>{tip.position.x=((s.input[key]??0)-1.5)*0.84})
  }
}

function rc(k:Kit,p:Group) {
  const pcb=board(k,p,3.66,1.78)
  const cap=k.tag(capacitor(k,pcb,0.62,-0.1,0.33,0.96),'cap')
  k.label(cap,'C',0.18,0.14,0,0.5,0.334)
  const r=k.tag(group(pcb,-0.65,0,-0.11),'resistor')
  k.cylinder(r,0.185,0.99,0,0.28,0,'white','x')
  for(let i=0;i<4;i++) k.cylinder(r,0.188,0.061,(i-1.5)*0.16,0.28,0,(['copper','graphite','red','yellow'] as const)[i],'x')
  for(const side of [-1,1]) k.hose(r,[[side*0.5,0.28,0],[side*0.59,0.25,0],[side*0.64,0.06,0]],0.03,'silver')
  trace(k,pcb,[[-1.4,0.56],[-1.4,-0.11],[-1.28,-0.11]],'copper')
  trace(k,pcb,[[-0.02,-0.11],[0.51,-0.11],[0.51,0.49],[1.35,0.49]],'copper')
  const dial=gauge(k,pcb,0.25,1.33,0.45,-0.08)
  k.rod(pcb,[1.33,0,-0.08],[1.33,0.41,-0.08],0.045,'steel')
  k.tag(dial.body,'contact')
  k.respond(s=>{dial.needle.rotation.z=2.08-4.16*clamp(value(s,/^电容电压$/,/^V$/)/12)})
}

function phases(k:Kit,p:Group) {
  const deck=skid(k,p,3.62,1.8)
  for(let i=0;i<3;i++) {
    const x=(i-1)*0.98, f:Finish=(['amber','teal','red'] as const)[i]
    const phase=k.tag(group(deck,x,0,-0.13),'phase'+i)
    k.cylinder(phase,0.26,0.11,0,0.065,0,'graphite')
    k.cylinder(phase,0.13,0.4,0,0.31,0,'porcelain')
    for(let j=0;j<3;j++) k.cylinder(phase,0.185,0.05,0,0.22+j*0.1,0,'white','y',20,0.8)
    k.box(phase,0.185,0.08,0.71,0,0.57,0,f,true)
    k.cylinder(phase,0.067,0.04,0,0.63,0.22,'steel','y',6)
    const light=lamp(k,phase,0,0.59,-0.14,0.62)
    const letter='ABC'[i]
    k.intensity(light.bulb,s=>value(s,new RegExp(letter+' 相电流'),/^A$/)/4,'warn','ice')
    plaque(k,deck,'L'+(i+1),0.48,x,0.013,0.58)
  }
  const neutral=k.tag(group(deck),'neutral')
  k.hose(neutral,[[-1.24,0.16,-0.31],[-0.82,0.12,-0.56],[0.51,0.12,-0.56],[1.21,0.17,-0.32]],0.035,'blue')
  k.respond(s=>{neutral.visible=!s.input.neutral})
}

function motorStarter(k:Kit,p:Group,count:number) {
  const deck=skid(k,p,3.95,1.76)
  const motorUnit=motor(k,deck,0.97,-0.02,0.95)
  k.tag(motorUnit.body,'motor')
  const tags=count===1?['hold']:count===2?['forward','reverse']:['main','star','delta']
  const pitch=count===3?0.53:0.66
  for(let i=0;i<count;i++) {
    const x=-0.98+(i-(count-1)/2)*pitch
    const c=contactor(k,group(deck,x,0.04,-0.08,count===1?1.0:count===2?0.8:0.61))
    k.tag(c.body,tags[i])
    k.respond(s=>{
      const active=count===3&&i===0?value(s,/绕组电压/):value(s,count===1?/^线圈电压$/:count===2?(i===0?/^正向线圈$/ : /^反向线圈$/):i===1?/^星接触器$/:/^三角接触器$/)
      c.armature.position.z=0.44-(active>0?0.065:0)
    })
    for(let j=0;j<3;j++) k.hose(deck,[[x+(j-1)*0.11,0.16,0.24],[x+(j-1)*0.11,0.09,0.49+j*0.052],[-0.14,0.085,0.49+j*0.052],[0.41,0.23,0.18]],0.019,(['steel','teal','copper'] as const)[j])
  }
  if(count===2) {
    k.tag(k.box(deck,0.38,0.12,0.18,-0.98,0.46,0.24,'amber',true),'both')
    plaque(k,deck,'KM1   /   KM2',1.15,-0.97,0.016,-0.58)
  }
  if(count===3) {
    const junc=k.tag(terminals(k,group(deck,0.73,0.04,0.56,0.56),6),'delta')
    junc.rotation.y=0
  }
  spin(k,motorUnit.shaft,'x',s=>{
    const speed=value(s,/转速|速度/,/rpm|r\/min|转\/分/i)
    if(speed) return speed
    return count===1?value(s,/闭合主极/):0
  })
}

function slip(k:Kit,p:Group) {
  const deck=skid(k,p,3.82,1.68)
  const m=motor(k,deck,-0.67,0,1.22)
  k.tag(m.body,'motor')
  const brake=k.tag(group(deck,0.89,0,0),'load')
  k.box(brake,1.12,0.12,0.77,0,0.07,0,'graphite',true)
  for(const x of [-0.28,0.4]) k.box(brake,0.15,0.57,0.52,x,0.34,0,'teal',true)
  const wheel=group(brake,0.02,0.635,0)
  k.cylinder(wheel,0.49,0.23,0,0,0,'alloy','x',40)
  k.ring(wheel,0.375,0.03,0.125,0,0,'graphite','x')
  k.box(wheel,0.022,0.24,0.083,0.137,0.24,0,'orange')
  k.cylinder(brake,0.079,1.15,-0.05,0.635,0,'silver','x')
  k.tag(wheel,'marks')
  spin(k,wheel,'x',s=>value(s,/^转子转速$/,/^r\/min$/))
}

function duct(k:Kit,p:Group) {
  const deck=skid(k,p,3.86,1.72)
  const f=fan(k,deck,-0.67,-0.005,1.13)
  k.tag(f.body,'fan')
  const elbow=k.tag(group(deck,0.92,0,-0.15),'duct')
  k.box(elbow,1.25,0.9,0.82,0,0.64,0,'alloy',true)
  k.box(elbow,1.35,0.99,0.06,0,0.64,0.44,'steel',true)
  k.box(elbow,1.17,0.81,0.02,0,0.64,0.483,'dark')
  const louvers:Group[]=[]
  for(let i=0;i<5;i++) {
    const g=group(elbow,0,0.36+i*0.14,0.51)
    k.box(g,1.09,0.055,0.127,0,0,0,'porcelain',true);louvers.push(g)
  }
  spin(k,f.rotor,'z',s=>value(s,/风机转速/,/^r\/min$/))
  k.respond(s=>{ for(const l of louvers) l.rotation.x=0.15+0.75*clamp(value(s,/风量/,/m³\/h/)/6000) })
}

function pumpCurve(k:Kit,p:Group) {
  const deck=skid(k,p,3.94,1.74)
  const a=pump(k,deck,-0.62,0,1.12)
  k.tag(a.body,'pump')
  k.hose(deck,[[-0.07,1.10,0],[-0.07,1.3,-0.1],[0.13,1.37,-0.28],[0.78,1.37,-0.28],[1.27,1.34,-0.28],[1.43,1.08,-0.28],[1.43,0.34,-0.28]],0.08,'teal')
  const v=valve(k,deck,0.71,1.37,-0.28,0.94)
  k.tag(v.body,'valve')
  k.hose(deck,[[0.17,1.36,-0.27],[0.24,1.29,0.11],[0.56,1.07,0.36],[1.09,1.07,0.36],[1.4,0.83,0.21],[1.43,0.63,-0.28]],0.041,'alloy')
  const bypass=valve(k,deck,0.83,1.07,0.36,0.58)
  k.tag(bypass.body,'bypass')
  const dial=gauge(k,deck,0.245,1.38,0.7,0)
  k.tag(dial.body,'meter')
  k.rod(deck,[1.37,0.35,-0.28],[1.37,0.58,0],0.04,'steel')
  k.respond(s=>{
    dial.needle.rotation.z=2.1-4.2*clamp(value(s,/泵扬程/,/^m$/)/3.1)
    v.wheel.rotation.y=2.6*clamp((s.input.valve??s.input.opening??100)/100)
    bypass.wheel.rotation.y=s.input.bypass?1.1:0
  })
  spin(k,a.shaft,'x',s=>value(s,/流量|转速/))
}

export const foundationStations=[safety,lamps,terminalBench,meterBench,rc,phases,
  (k:Kit,p:Group)=>motorStarter(k,p,1),(k:Kit,p:Group)=>motorStarter(k,p,2),(k:Kit,p:Group)=>motorStarter(k,p,3),slip,duct,pumpCurve]
