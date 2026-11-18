import type { Group, Object3D } from 'three'
import { breaker } from './electrical'
import { clamp, group, Kit, type Finish } from './kit'
import { cabinet, capacitor, conveyor, gauge, insulator, lamp, motor, pump, skid, vessel } from './machinery'
import { displayValue, spin, value } from './signals'

export function photocell(k:Kit,p:Object3D,x=0,z=0) {
  const body=group(p,x,0,z)
  k.box(body,0.34,0.07,0.31,0,0.04,0,'alloy',true)
  k.box(body,0.09,0.56,0.11,0,0.34,0,'steel')
  k.box(body,0.25,0.38,0.24,0,0.67,0,'graphite',true)
  k.cylinder(body,0.067,0.023,0,0.72,0.125,'red','z')
  k.cylinder(body,0.047,0.02,0,0.61,0.126,'ice','z')
  return body
}

function photo(k:Kit,p:Group) {
  const belt=k.tag(conveyor(k,p,0,0,3.63,0.82),'work')
  const e=k.tag(photocell(k,p,-0.17,-0.63),'optics')
  const r=k.tag(photocell(k,p,-0.17,0.67),'polarity');r.rotation.y=Math.PI
  const beam=k.rod(p,[-0.17,0.72,-0.5],[-0.17,0.72,0.53],0.015,'warn')
  beam.userData.mutable=true
  const box=k.tag(group(belt,0,0.66,0),'work')
  k.box(box,0.53,0.47,0.47,0,0.24,0,'copper',true)
  k.box(box,0.103,0.015,0.478,0,0.483,0,'yellow')
  const counter=k.tag(group(p,1.31,0,-0.65),'zero')
  k.box(counter,0.69,0.76,0.26,0,0.39,0,'teal',true)
  k.display(counter,0.51,0.19,0,0.54,0.136,s=>String(s.memory.count??0))
  k.respond(s=>{
    box.position.x=s.input.work?-0.17:-1.23
    e.rotation.y=s.input.optics?0.35:0
    beam.visible=Boolean(value(s,/^收光$/))
  })
}

function metal(k:Kit,p:Group) {
  const deck=skid(k,p,3.64,1.6)
  const rail=k.tag(group(deck),'bracket')
  for(const z of [-0.31,0.31]) k.box(rail,3.27,0.1,0.07,0,0.12,z,'silver')
  const sensor=k.tag(group(deck,-0.64,0,0),'gap')
  k.box(sensor,0.36,0.65,0.56,-0.36,0.35,0,'teal',true)
  k.cylinder(sensor,0.142,0.93,0,0.65,0,'alloy','x')
  for(let j=0;j<13;j++) k.ring(sensor,0.141,0.013,-0.36+0.052*j,0.65,0,'steel','x')
  k.cylinder(sensor,0.142,0.035,0.47,0.65,0,'orange','x')
  const target=k.tag(group(deck,0,0,0),'metal')
  k.box(target,0.51,0.1,0.79,0.12,0.22,0,'graphite',true)
  const plate=k.box(target,0.09,0.72,0.55,0,0.63,0,'steel')
  plate.userData.mutable=true
  k.cylinder(target,0.095,0.41,0.32,0.58,0,'alloy','x')
  const led=lamp(k,k.tag(group(deck,1.24,0,-0.24),'mark'),0,0,0)
  k.light(led.bulb,s=>Boolean(s.memory.q))
  k.respond(s=>{
    const material:Finish=(['steel','alloy','silver','copper','porcelain'] as const)[s.input.metal]??'steel'
    plate.material=k.material(material)
    target.position.x=-0.11+clamp(s.input.gap/6)*0.92
    sensor.position.x=-0.64-(s.input.bracket??0)*0.15
  })
}

function level(k:Kit,p:Group) {
  const deck=skid(k,p,3.61,1.86)
  const tank=vessel(k,deck,-0.67,0,0.63,1.53)
  k.tag(tank.body,'height')
  const probe=k.tag(group(deck,-0.54,0.32,-0.05),'fluid')
  k.cylinder(probe,0.082,0.39,0,0.195,0,'silver')
  k.hose(probe,[[0,0.4,0],[0,1.29,0],[0.15,1.57,0],[0.66,1.58,-0.05],[0.9,1.18,-0.14],[1.23,0.63,-0.14]],0.029,'rubber')
  const panel=k.tag(cabinet(k,group(deck,0.89,0,-0.1),0.83,1.08,0.52),'scale')
  const read=k.tag(group(panel,0,0.74,0.32),'mark')
  k.display(read,0.61,0.21,0,0,0,s=>displayValue(value(s,/^回路电流$/,/mA/))+' mA')
  k.respond(s=>tank.setLevel(clamp((s.input.height??0)/2.5)))
}

function drainage(k:Kit,p:Group) {
  const deck=skid(k,p,3.81,1.8)
  const tank=vessel(k,deck,-0.79,0,0.67,1.37)
  k.tag(tank.body,'pour')
  const upper=lamp(k,deck,-0.45,1.16,0.44,0.56), lower=lamp(k,deck,-0.47,0.52,0.45,0.56)
  k.tag(lower.body,'floatFault')
  k.light(upper.bulb,s=>value(s,/上浮子/)===1)
  k.light(lower.bulb,s=>value(s,/下浮子/)===1)
  const m=pump(k,deck,0.92,-0.12,0.69)
  k.tag(m.body,'load')
  const pipe=k.tag(group(deck),'inflow')
  k.hose(pipe,[[1.26,0.66,-0.12],[1.26,1.45,-0.25],[1.03,1.7,-0.36],[-0.37,1.7,-0.36],[-0.55,1.55,-0.36]],0.064,'teal')
  k.respond(s=>tank.setLevel(value(s,/井内水位/,/^%$/)/100))
  spin(k,m.shaft,'x',s=>s.memory.q??0)
}

function stepper(k:Kit,p:Group) {
  const deck=skid(k,p,3.9,1.55)
  const motorBase=k.tag(group(deck,-1.45,0,0),'move')
  k.box(motorBase,0.52,0.65,0.66,0,0.37,0,'graphite',true)
  for(const x of [-0.27,0.27]) k.box(motorBase,0.083,0.66,0.67,x,0.37,0,'alloy',true)
  const shaft=k.tag(group(deck,0.11,0.4,0),'dir')
  k.cylinder(shaft,0.082,2.57,0,0,0,'steel','x')
  // Interrupted helical line makes angular displacement observable on the screw.
  const helix:[number,number,number][]=[]
  for(let i=0;i<=168;i++) {const a=i*Math.PI/6;helix.push([-1.21+i*2.42/168,0.087*Math.sin(a),0.087*Math.cos(a)])}
  k.hose(shaft,helix,0.016,'silver')
  for(const z of [-0.35,0.35]) k.rod(deck,[-1.13,0.29,z],[1.53,0.29,z],0.045,'alloy')
  k.box(deck,0.17,0.52,0.78,1.54,0.27,0,'teal',true)
  const slide=k.tag(group(deck),'pitch')
  k.box(slide,0.47,0.28,0.87,0,0.45,0,'teal',true)
  k.box(slide,0.52,0.09,0.92,0,0.64,0,'alloy',true)
  const ruler=k.tag(group(deck,0.18,0,0.59),'home')
  k.box(ruler,2.7,0.034,0.14,0,0.033,0,'graphite')
  for(let i=0;i<31;i++) k.box(ruler,0.013,0.008,i%5?0.057:0.11,-1.26+i*0.084,0.055,0,'white')
  k.respond(s=>{
    slide.position.x=0.17+1.05*Math.tanh(value(s,/^独立标尺$/,/mm/)/12)
    shaft.rotation.x=value(s,/累计轴角/,/°/)*Math.PI/180
  })
}

function sorter(k:Kit,p:Group) {
  const belt=k.tag(conveyor(k,p,0,0.16,3.71),'feed')
  const piston=k.tag(group(p,0.02,0,-0.67),'jam')
  k.box(piston,0.64,0.12,0.47,0,0.09,0,'alloy',true)
  k.box(piston,0.39,0.58,0.31,0,0.44,0,'teal',true)
  k.cylinder(piston,0.145,0.62,0,0.82,-0.01,'alloy','z')
  const ram=group(piston,0,0.82,0.3)
  k.cylinder(ram,0.068,0.66,0,0,-0.21,'silver','z')
  k.box(ram,0.41,0.25,0.068,0,0,0.13,'graphite',true)
  const work=k.tag(group(belt),'feed')
  const item=k.cylinder(work,0.17,0.2,0,0.77,0,'steel');item.userData.mutable=true
  const bin=k.tag(group(p,0.02,0,0.95),'slow')
  k.box(bin,0.94,0.06,0.56,0,0.13,0,'blue')
  for(const side of [-1,1]) k.box(bin,0.06,0.26,0.56,side*0.45,0.24,0,'teal')
  k.box(bin,0.94,0.26,0.061,0,0.24,0.28,'teal')
  const alarm=lamp(k,k.tag(group(p,1.32,0,-0.52),'ack'),0,0,0,1)
  k.light(alarm.bulb,s=>Boolean(s.memory.alarm),'hot')
  k.respond(s=>{
    const t=clamp(s.memory.travel??0)
    ram.position.z=0.21+t*0.72
    work.visible=Boolean(s.memory.pending||s.memory.busy||s.memory.work)
    work.position.x=s.memory.pending?-1.12:0.02; work.position.z=t*0.68
    item.material=k.material(s.input.piece?'porcelain':'steel')
  })
}

export function genset(k:Kit,parent:Object3D,x=0,z=0,scale=1) {
  const body=group(parent,x,0,z,scale)
  const deck=skid(k,body,2.89,1.16)
  const alt=motor(k,deck,-0.82,0,0.67,'teal')
  k.box(deck,1.14,0.57,0.59,0.33,0.42,0,'graphite',true)
  for(let i=0;i<4;i++) {
    const xx=-0.06+i*0.255
    k.box(deck,0.18,0.24,0.62,xx,0.81,0,'teal',true)
    k.hose(deck,[[xx,0.78,0.25],[xx,0.88,0.42],[xx+0.08,0.94,0.44]],0.034,'copper')
  }
  k.box(deck,0.23,1.04,0.86,1.14,0.54,0,'graphite',true)
  for(let i=0;i<9;i++) k.box(deck,0.021,0.042,0.71,1.272,0.2+i*0.084,0,'alloy')
  k.hose(deck,[[0.24,0.71,-0.22],[0.24,1.12,-0.32],[0.42,1.21,-0.32],[0.87,1.21,-0.32]],0.062,'steel')
  k.cylinder(deck,0.125,0.54,0.47,1.2,-0.32,'graphite','x')
  return {body,shaft:alt.shaft}
}

function generating(k:Kit,p:Group) {
  const g=genset(k,p,-0.2,0,1.13);k.tag(g.body,'generator')
  const gov=gauge(k,p,0.23,1.56,1.03,-0.13)
  k.tag(gov.body,'governor');k.rod(p,[1.56,0,-0.13],[1.56,0.9,-0.13],0.056,'steel')
  spin(k,g.shaft,'x',s=>value(s,/转速|频率/,/r\/min|Hz|rpm/i))
  k.respond(s=>{gov.needle.rotation.z=2.1-4.2*clamp(value(s,/频率/,/Hz/)/65)})
}

function transforming(k:Kit,p:Group) {
  const deck=skid(k,p,3.82,1.72)
  const t=k.tag(group(deck,-0.59,0,-0.03),'primary')
  for(const y of [0.14,1.19]) k.box(t,1.71,0.19,0.44,0,y,0,'graphite',true)
  for(const i of [-1,0,1]) {
    const x=i*0.55
    k.box(t,0.21,1.07,0.22,x,0.66,0,'steel')
    k.cylinder(t,0.226,0.81,x,0.64,0,'copper')
    for(let j=0;j<11;j++) k.ring(t,0.227,0.014,x,0.28+j*0.069,0,'amber','y')
    k.cylinder(t,0.057,0.2,x,1.37,0,'copper')
  }
  const tap=k.tag(group(deck,1.12,0,0.02),'tap')
  k.box(tap,0.73,0.67,0.54,0,0.35,0,'porcelain',true)
  const dial=group(tap,0,0.4,0.29)
  k.cylinder(dial,0.19,0.071,0,0,0,'graphite','z')
  k.box(dial,0.05,0.15,0.027,0,0.057,0.052,'amber')
  k.respond(s=>{dial.rotation.z=(s.input.tap??0)*0.42})
  for(const i of [-1,0,1]) k.hose(deck,[[-0.59+i*0.55,1.47,-0.03],[-0.51+i*0.43,1.48,-0.34],[0.44+i*0.18,1.01,-0.42],[1.1+i*0.16,0.68,-0.15]],0.019,'rubber')
}

function line(k:Kit,p:Group) {
  const deck=skid(k,p,3.7,1.76)
  const reel=k.tag(group(deck,-0.62,0.77,-0.04),'length')
  k.cylinder(reel,0.337,1.12,0,0,0,'copper','x')
  for(const sign of [-1,1]) {
    k.cylinder(reel,0.69,0.092,sign*0.61,0,0,'teal','x',44)
    k.cylinder(reel,0.119,0.12,sign*0.655,0,0,'alloy','x')
    for(let i=0;i<5;i++){
      const a=i*2*Math.PI/5
      k.cylinder(reel,0.085,0.01,sign*0.663,0.46*Math.cos(a),0.46*Math.sin(a),'graphite','x')
    }
    k.rod(deck,[-0.62+sign*0.74,0.03,0.33],[-0.62+sign*0.74,0.77,-0.04],0.05,'steel')
    k.rod(deck,[-0.62+sign*0.74,0.03,-0.41],[-0.62+sign*0.74,0.77,-0.04],0.05,'steel')
  }
  for(let j=0;j<11;j++){
    const turn=group(reel,(j-5)*0.101,0,0)
    k.ring(turn,0.489,0.052,0,0,0,'rubber','x')
    k.respond(s=>{const r=0.72+0.28*clamp((s.input.length??20)/100);turn.scale.set(1,r,r)})
  }
  const lead=k.tag(group(deck),'joint')
  k.hose(lead,[[-0.09,0.75,0.42],[0.04,0.31,0.56],[0.37,0.11,0.49],[0.77,0.14,0.22]],0.049,'rubber')
  const meter=k.tag(cabinet(k,group(deck,1.07,0,-0.06),0.76,0.91,0.61),'save')
  k.display(meter,0.51,0.179,0,0.64,0.364,s=>displayValue(value(s,/^压差表$/,/^V$/))+' V')
}

function feeder(k:Kit,p:Group) {
  const deck=skid(k,p,3.85,1.85)
  const sites=[[-1.32,0],[-0.12,-0.46],[-0.12,0.43],[1.19,0.43]]
  for(const [i,[x,z]] of sites.entries()) {
    const code=['F0','FA','FB','FC'][i],g=k.tag(group(deck,x,0,z),i===3?'local':'read')
    k.box(g,0.57,0.48,0.34,0,0.26,0,'porcelain',true)
    k.label(g,code,0.3,0.095,0,0.374,0.179)
    const l=k.cylinder(g,0.065,0.031,0,0.2,0.194,'off','z')
    l.userData.mutable=true
    k.respond(s=>{const n=value(s,new RegExp('^'+code+' '));l.material=k.material(n===1?'hot':n===0?'mint':'off')})
  }
  for(const [a,b] of [[0,1],[0,2],[2,3]]) {
    const [x,z]=sites[a],[xx,zz]=sites[b]
    k.hose(deck,[[x,0.16,z],[x+0.32,0.09,z],[xx-0.25,0.09,zz],[xx,0.16,zz]],0.036,'blue')
  }
}

function protection(k:Kit,p:Group) {
  const deck=skid(k,p,3.76,1.7)
  const ring=k.tag(group(deck,-0.85,0.66,0),'pickup')
  k.ring(ring,0.39,0.155,0,0,0,'teal')
  k.cylinder(ring,0.096,1.34,0,0,0,'copper','z')
  k.box(deck,0.47,0.22,0.54,-0.85,0.12,0,'graphite',true)
  const mechanism=breaker(k,group(deck,0.75,0,-0.04,1.2));k.tag(mechanism.body,'trip')
  mechanism.handle.name='52a'
  const l=lamp(k,deck,1.39,0,0.28,0.86);k.tag(l.body,'reset')
  l.bulb.name='TRIP'
  k.light(l.bulb,s=>value(s,/^跳闸命令$/)===1,'hot')
  k.respond(s=>{mechanism.handle.rotation.x=value(s,/^断路器合位$/)===1?-0.55:0.68})
}

function powerFactor(k:Kit,p:Group) {
  const deck=skid(k,p,3.84,1.75)
  const bank=k.tag(group(deck,-0.34,0,-0.12),'bank')
  for(let i=0;i<6;i++) {
    const g=capacitor(k,bank,((i%3)-1)*0.54,(Math.floor(i/3)-0.5)*0.63,0.205,0.78)
    if(i===1)k.tag(g,'failed')
    for(const side of [-1,1]) {insulator(k,g,side*0.078,0.8,0,0.11);k.cylinder(g,0.027,0.04,side*0.078,0.926,0,'copper')}
    const l=k.cylinder(g,0.043,0.019,0,0.43,0.215,'off','z')
    k.light(l,s=>(s.memory.stages??0)>i && !(i===1&&s.input.failed))
  }
  const dial=gauge(k,deck,0.31,1.22,0.67,0)
  k.tag(dial.body,'meter');k.rod(deck,[1.22,0,0],[1.22,0.49,0],0.06,'steel')
  k.respond(s=>{dial.needle.rotation.z=2.1-4.2*clamp(value(s,/功率因数|cos/i))})
}

export const automationStations=[photo,metal,level,drainage,stepper,sorter,generating,transforming,line,feeder,protection,powerFactor]
