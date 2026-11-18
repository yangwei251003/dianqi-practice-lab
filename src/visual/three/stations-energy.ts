import type { Group, Object3D } from 'three'
import type { Snapshot } from '../../core/types'
import { breaker, driveUnit, terminals } from './electrical'
import { group, Kit, type Finish } from './kit'
import { battery, board, cabinet, capacitor, inductor, lamp, motor, panel, plaque, skid, trace, turbine } from './machinery'
import { displayValue, spin, value } from './signals'

function scopeHead(k:Kit,p:Group,role:string) {
  const g=k.tag(group(p,0.41,0,-0.72),role)
  for(const x of [-0.58,0.58])k.rod(g,[x,0,0],[x,1.11,0],0.036,'steel')
  k.box(g,1.53,0.68,0.122,0,1.2,0,'graphite',true)
  k.scope(g,1.32,0.5,-0.021,1.2,0.065)
  k.cylinder(g,0.025,0.017,0.699,1,0.071,'alloy','z')
}

function powerDirection(k:Kit,p:Group,x:number,z:number,read:(s:Snapshot)=>number) {
  const indicator=group(p,x,0.047,z)
  const arrow=k.profile(indicator,[[-0.18,-0.036],[0.029,-0.036],[0.029,-0.086],[0.181,0],[0.029,0.086],[0.029,0.036],[-0.18,0.036]],0.014,'orange')
  arrow.rotation.x=-Math.PI/2
  k.respond(s=>{const n=read(s);indicator.visible=Math.abs(n)>0.00001;indicator.rotation.y=n>0?0:Math.PI})
}

export function semiconductor(k:Kit,p:Object3D,x:number,z:number,pins:number,width:number,tab:boolean) {
  const body=group(p,x,0,z)
  const h=width*0.57
  if(tab) {
    k.box(body,width*0.85,h*0.7,0.08,0,0.22+h*1.09,-0.04,'alloy',true)
    k.cylinder(body,0.058,0.01,0,0.22+h*1.26,0.006,'graphite','z')
  }
  k.box(body,width,h,0.19,0,h*0.5+0.24,0,'graphite',true)
  for(let i=0;i<pins;i++) k.box(body,0.035,0.25,0.047,(i-(pins-1)/2)*width*0.81/(pins-1),0.125,0,'silver')
  return body
}

/** Vishay drawing 98731, page 3. Front viewed from +Z, leads down, bevel at upper right. */
export function kbuBridge(k:Kit,p:Object3D,x:number,z:number,width:number) {
  const body=group(p,x,0,z),half=width/2,top=0.24+width*0.57,cut=width*0.12
  k.profile(body,[[-half,0.24],[half,0.24],[half,top-cut],[half-cut,top],[-half,top]],0.19,'graphite')
  for(const [i,mark] of ['−','~','~','+'].entries()){
    const pinX=(i-1.5)*width*0.27
    k.box(body,0.035,0.25,0.047,pinX,0.125,0,'silver')
    k.label(body,mark,width*0.175,width*0.13,pinX,0.24+width*0.14,0.1)
  }
  return body
}

function heatSink(k:Kit,p:Object3D,x:number,z:number,w:number,h:number) {
  const g=group(p,x,0,z)
  k.box(g,w,h,0.07,0,h/2,0,'steel')
  for(let i=0;i<7;i++) k.box(g,0.046,h*0.96,0.31,(i-3)*w*0.14,h/2,-0.16,'alloy')
  return g
}

function rectifier(k:Kit,p:Group) {
  const b=board(k,p,3.72,1.73)
  k.tag(kbuBridge(k,b,-0.44,-0.15,0.77),'open')
  k.tag(capacitor(k,b,0.41,-0.28,0.23,0.84),'cap')
  k.tag(heatSink(k,b,1.18,0.04,0.58,0.52),'load')
  const ac=k.tag(terminals(k,group(b,-1.29,0,0,0.88),2,'blue'),'line')
  ac.rotation.y=Math.PI/2
  trace(k,b,[[-1.24,-0.12],[-0.96,-0.12],[-0.81,-0.29],[-0.56,-0.29]],'copper')
  trace(k,b,[[-0.39,-0.04],[-0.39,0.42],[0.48,0.42],[0.48,-0.28]],'copper')
  trace(k,b,[[0.62,-0.28],[0.86,-0.28],[0.98,0.03],[1.22,0.03]],'copper')
  plaque(k,b,'AC ~',0.49,-1.34,0.014,0.58)
  scopeHead(k,b,'open')
}

function buck(k:Kit,p:Group) {
  const b=board(k,p,3.6,1.72)
  k.tag(terminals(k,group(b,-1.34,0,0.13),2,'teal'),'vin')
  k.tag(semiconductor(k,b,-0.72,-0.19,5,0.54,true),'duty')
  k.tag(inductor(k,b,0.19,-0.1,1.47),'coil')
  capacitor(k,b,1.11,-0.26,0.197,0.71)
  const diode=group(b,-0.57,0.16,0.42)
  k.cylinder(diode,0.085,0.38,0,0,0,'graphite','x')
  k.cylinder(diode,0.086,0.048,0.13,0,0,'alloy','x')
  for(const x of [-1,1]) k.rod(diode,[x*0.19,0,0],[x*0.3,-0.12,0],0.018,'steel')
  trace(k,b,[[-1.19,0.14],[-0.86,0.14],[-0.73,-0.1]],'copper')
  trace(k,b,[[-0.61,-0.19],[-0.24,-0.19],[0.14,0.14],[0.69,0.14],[1.09,-0.2]],'copper')
  scopeHead(k,b,'duty')
}

function boost(k:Kit,p:Group) {
  const b=board(k,p,3.72,1.81)
  k.tag(terminals(k,group(b,-1.38,0,0.04),2,'blue'),'vin')
  const coil=k.tag(group(b,-0.57,0,-0.04),'duty')
  k.cylinder(coil,0.27,0.6,0,0.33,0,'graphite')
  for(let i=0;i<8;i++) k.ring(coil,0.235,0.031,0,0.095+i*0.069,0,'copper','y')
  k.cylinder(coil,0.29,0.07,0,0.64,0,'graphite')
  semiconductor(k,b,0.01,-0.36,5,0.42,true)
  for(const x of [0.58,1.04]) k.tag(capacitor(k,b,x,-0.09,0.197,0.83),'load')
  k.tag(terminals(k,group(b,1.18,0,0.46,0.74),2,'teal'),'load')
  trace(k,b,[[-1.33,0.01],[-1,0.01],[-0.69,0.13],[-0.31,0.13],[0.04,-0.36]],'copper')
  trace(k,b,[[-0.31,0.13],[0.08,0.36],[0.51,0.36],[0.72,-0.07],[1.02,-0.07]],'copper')
  scopeHead(k,b,'duty')
}

function inverter(k:Kit,p:Group) {
  const b=board(k,p,3.87,1.86)
  for(let i=0;i<2;i++) k.tag(capacitor(k,b,-1.28+i*0.39,-0.19,0.174,0.74),'bus')
  const bridge=k.tag(group(b,0,0,-0.09),'phase')
  for(const x of [-0.25,0.27]) {heatSink(k,bridge,x,-0.06,0.41,0.67);semiconductor(k,bridge,x,0.16,3,0.32,true)}
  const cpu=k.tag(group(b,-0.69,0.1,0.41),'mod')
  k.box(cpu,0.63,0.09,0.43,0,0,0,'blue')
  k.box(cpu,0.21,0.043,0.21,0,0.074,0,'graphite')
  for(let i=0;i<7;i++) for(const z of [-1,1]) k.cylinder(cpu,0.014,0.12,(i-3)*0.07,0.05,z*0.163,'silver','y',8)
  k.tag(inductor(k,b,1.06,-0.06,1.32),'frequency')
  trace(k,b,[[-1.46,0.17],[-0.96,0.17],[-0.7,-0.36],[0.31,-0.36],[0.59,0.03],[1.04,0.03]],'copper')
  scopeHead(k,b,'phase')
}

function hBridge(k:Kit,p:Group) {
  const deck=skid(k,p,3.83,1.68)
  const pcb=board(k,group(deck,-0.93,0,0),1.48,1.25)
  const logic=k.tag(group(pcb),'drive')
  for(const x of [-0.27,0.27]) for(const z of [-0.23,0.23]) {
    k.box(logic,0.26,0.13,0.22,x,0.07,z,'graphite',true)
    for(const side of [-1,1]) k.box(logic,0.05,0.044,0.15,x+side*0.15,0.037,z,'silver')
  }
  const m=motor(k,deck,0.65,0,0.86)
  const wheel=k.tag(group(m.shaft,0.13,0,0),'jam')
  k.cylinder(wheel,0.39,0.084,0,0,0,'graphite','x',40)
  for(let i=0;i<12;i++) {
    const a=i*Math.PI/6
    const marker=k.box(wheel,0.014,i%3===0?0.118:0.062,0.023,0.051,Math.cos(a)*0.312,Math.sin(a)*0.312,i===0?'amber':'white')
    marker.rotation.x=a
  }
  const input=k.tag(terminals(k,group(deck,-1.32,0.19,0.53,0.55),2,'teal'),'duty')
  input.rotation.y=Math.PI/2
  spin(k,m.shaft,'x',s=>value(s,/轴转速/,/^r\/min$/))
}

function ups(k:Kit,p:Group) {
  const deck=skid(k,p,3.73,1.69)
  const grid=breaker(k,group(deck,-1.31,0,-0.1,0.69),2)
  k.tag(grid.body,'grid');k.respond(s=>{grid.handle.rotation.x=s.input.grid?0.6:-0.46})
  k.tag(battery(k,deck,-0.39,0,0.81,3).body,'battery')
  const rack=k.tag(cabinet(k,group(deck,0.98,0,-0.04),1.01,1.39,0.71,'graphite'),'load')
  for(let j=0;j<4;j++) {
    const unit=k.tag(group(rack,0,0.35+j*0.24,0.415),'hold')
    k.box(unit,0.84,0.177,0.044,0,0,0,'steel',true)
    k.slats(unit,2,0.48,0.042,-0.11,0,0.029)
    const led=k.cylinder(unit,0.024,0.012,0.29,0,0.032,'off','z')
    k.light(led,s=>value(s,/UPS 输出包络/,/V/)>0)
  }
}

function pv(k:Kit,p:Group) {
  const pvA=panel(k,p,-0.59,-0.02,1.34,4,8);k.tag(pvA.body,'array')
  const shade=k.tag(group(pvA.deck,-0.45,0,0.074),'shade')
  k.box(shade,0.48,0.95,0.027,0,0,0,'graphite',true)
  const c=k.tag(cabinet(k,group(p,1.21,0,-0.02),0.78,0.88,0.58),'load')
  k.display(c,0.53,0.17,0,0.63,0.35,s=>displayValue(value(s,/端电压|组件电压|工作电压/,/V/))+' V')
  k.respond(s=>{shade.visible=Boolean(s.input.shade)})
}

function mppt(k:Kit,p:Group) {
  const a=panel(k,p,-1.04,-0.3,0.94)
  const b=panel(k,p,0.56,-0.3,0.94)
  k.tag(a.body,'array');k.tag(b.body,'track')
  const shade=group(a.deck,-0.46,0,0.065)
  k.box(shade,0.5,0.94,0.037,0,0,0,'graphite')
  k.respond(s=>{shade.visible=Boolean(s.input.shade)})
  const converter=k.tag(group(p,0,0,0.65),'converter')
  k.box(converter,1.5,0.29,0.54,0,0.16,0,'teal',true)
  k.display(converter,0.83,0.15,0,0.18,0.28,s=>displayValue(value(s,/工作功率|输出功率|实取功率|功率/,/^W$/))+' W')
  for(const x of [-1.04,0.56]) k.hose(p,[[x,0.28,0.15],[x,0.1,0.45],[x*0.67,0.09,0.69],[x*0.57,0.17,0.67]],0.026,'rubber')
}

function wind(k:Kit,p:Group) {
  const t=turbine(k,p,-0.66,-0.05,0.96)
  k.tag(t.body,'wind')
  const cabinetBody=k.tag(cabinet(k,group(p,0.99,0,-0.08),0.81,0.92,0.61),'load')
  k.display(cabinetBody,0.51,0.18,0,0.66,0.362,s=>displayValue(value(s,/^实际有功$/,/^kW$/))+' kW')
  spin(k,t.rotor,'z',s=>value(s,/^实际有功$/,/^kW$/))
}

function bms(k:Kit,p:Group) {
  const deck=skid(k,p,3.68,1.67)
  const pack=battery(k,deck,-0.66,0,1.25,4);k.tag(pack.body,'pack')
  const tapBoard=board(k,group(deck,0.99,0,-0.01),1.13,1.11);k.tag(tapBoard,'monitor')
  for(let i=0;i<4;i++) {
    const x=(-0.66)+(i-1.5)*0.362
    k.hose(deck,[[x,1.16,-0.22],[x,1.19,-0.38],[x+0.14,0.92,-0.46],[0.75+i*0.097,0.25,-0.38]],0.014,i%2?'copper':'blue')
    k.box(tapBoard,0.073,0.064,0.24,(i-1.5)*0.17,0.04,-0.14,'graphite')
  }
  const flag=lamp(k,tapBoard,0,0,0.22,0.72)
  k.light(flag.bulb,s=>value(s,/^低余量提示$/)===1,'warn')
  const host=k.tag(group(deck,0.98,0,-0.61),'threshold')
  k.box(host,0.82,0.65,0.14,0,0.34,0,'graphite',true)
  k.display(host,0.68,0.23,0,0.44,0.079,s=>displayValue(value(s,/^估计 SOC$/,/^%$/))+' %')
}

function pcs(k:Kit,p:Group) {
  const deck=skid(k,p,3.94,1.7)
  const pack=battery(k,deck,-1.23,-0.04,0.75,3);k.tag(pack.body,'storage')
  const central=k.tag(driveUnit(k,group(deck,-0.02,0,-0.08,1.06)),'converter')
  const grid=k.tag(group(deck,1.26,0,-0.02),'grid')
  k.box(grid,0.72,0.16,0.79,0,0.09,0,'graphite',true)
  for(let i=0;i<3;i++) {
    const x=(i-1)*0.22
    k.cylinder(grid,0.058,0.78,x,0.54,0,'porcelain')
    for(let j=0;j<4;j++) k.cylinder(grid,0.088,0.045,x,0.57+j*0.12,0,'ice','y',16,0.63)
  }
  for(const x of [-0.69,0.66]) k.box(deck,0.4,0.05,0.094,x,0.039,0.36,'copper')
  k.display(central,0.44,0.124,0,1.1,0.484,s=>displayValue(value(s,/^储能交流功率/,/kW/))+' kW')
  powerDirection(k,deck,-0.69,0.36,s=>-value(s,/^储能交流功率/,/kW/))
  powerDirection(k,deck,0.66,0.36,s=>-value(s,/^网侧功率/,/kW/))
}

export function vehicle(k:Kit,p:Object3D,x:number,z:number,scale=1,finish:Finish='teal') {
  const body=group(p,x,0,z,scale)
  for(const xx of [-0.58,0.57]) for(const zz of [-0.39,0.39]) {
    k.cylinder(body,0.209,0.115,xx,0.219,zz,'rubber','z')
    k.cylinder(body,0.105,0.123,xx,0.219,zz,'alloy','z')
  }
  k.box(body,1.83,0.34,0.78,0,0.36,0,finish,true)
  const roof=k.profile(body,[[-0.56,0.47],[-0.33,0.76],[0.19,0.79],[0.5,0.49]],0.69,'ice')
  roof.position.z=0
  k.box(body,0.52,0.055,0.66,-0.07,0.786,0,finish,true)
  for(const side of [-1,1]) {
    k.box(body,0.066,0.223,0.015,-0.06,0.628,side*0.351,'graphite')
    k.box(body,0.017,0.071,0.168,0.918,0.4,side*0.24,'white')
    k.box(body,0.017,0.072,0.13,-0.918,0.39,side*0.27,'red')
  }
  return body
}

function charging(k:Kit,p:Group) {
  const ev=k.tag(vehicle(k,p,-0.36,0.24,1.23),'vehicle')
  const charge=k.tag(group(p,1.28,0,-0.48),'charge')
  k.box(charge,0.61,0.11,0.48,0,0.06,0,'graphite',true)
  k.box(charge,0.49,1.37,0.34,0,0.81,0,'porcelain',true)
  k.box(charge,0.51,0.2,0.36,0,1.47,0,'teal',true)
  k.display(charge,0.35,0.17,0,1.1,0.179,s=>displayValue(value(s,/^实际充电电流$/,/^A$/))+' A')
  const cable=k.tag(group(p),'plug')
  k.hose(cable,[[1.14,0.86,-0.41],[0.99,0.41,-0.31],[0.9,0.12,0.13],[0.69,0.12,0.49],[0.56,0.4,0.63]],0.037,'rubber')
  k.box(cable,0.128,0.11,0.18,0.56,0.42,0.62,'graphite',true)
  k.respond(s=>{cable.visible=Boolean(s.input.plug??s.input.connected??1)})
  ev.rotation.y=0.03
}

export const energyStations=[rectifier,buck,boost,inverter,hBridge,ups,pv,mppt,wind,bms,pcs,charging]
