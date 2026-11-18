import type { Group } from 'three'
import { breaker } from './electrical'
import { clamp, group, Kit } from './kit'
import { battery, cabinet, conveyor, fan, lamp, panel, pump, skid, transformer, vessel } from './machinery'
import { genset, photocell } from './stations-automation'
import { vehicle } from './stations-energy'
import { spin, value } from './signals'

function buildingSlab(k:Kit,p:Group,w=3.84,d=1.95) {
  k.box(p,w,0.12,d,0,0.06,0,'alloy',true)
  return group(p,0,0.12,0)
}

function corridor(k:Kit,p:Group) {
  const g=buildingSlab(k,p)
  k.box(g,3.68,1.41,0.12,0,0.71,-0.81,'porcelain')
  k.box(g,0.12,1.39,1.37,-1.78,0.71,-0.17,'white')
  const glazing=k.tag(group(g,0,0,-0.73),'lux')
  for(let i=0;i<3;i++) {
    const x=-1.06+i*1.02
    k.box(glazing,0.79,0.69,0.037,x,0.86,0,'graphite')
    k.box(glazing,0.72,0.62,0.035,x,0.86,0.033,'ice')
    k.box(glazing,0.028,0.62,0.02,x,0.86,0.062,'alloy')
  }
  for(let j=0;j<4;j++) k.box(g,0.89,(4-j)*0.107,0.29,-1.18,(4-j)*0.0535,0.01+j*0.225,'steel',true)
  const rail=k.tag(group(g),'pass')
  k.rod(rail,[-0.62,0.8,-0.06],[-0.62,0.51,0.71],0.031,'teal')
  for(const [y,z] of [[0.8,-0.06],[0.51,0.71]]) k.rod(rail,[-0.62,0,z],[-0.62,y,z],0.023,'steel')
  const fit=k.tag(group(g,0.13,1.29,-0.57),'hold')
  k.box(fit,0.99,0.14,0.25,0,0,0,'graphite',true)
  const lens=k.box(fit,0.89,0.075,0.19,0,-0.079,0.026,'ice',true)
  k.light(lens,s=>value(s,/灯具功率/,/W/)>0,'warn','ice')
}

function airHandler(k:Kit,p:Group) {
  const g=skid(k,p,3.78,1.67)
  const wheel=fan(k,g,-0.74,0,0.92);k.tag(wheel.body,'fan')
  const coil=k.tag(group(g,0.71,0,-0.04),'water')
  k.box(coil,1.31,0.13,0.75,0,0.08,0,'graphite',true)
  for(let i=0;i<14;i++) k.box(coil,0.039,0.87,0.51,(i-6.5)*0.079,0.61,0,'alloy')
  for(let j=0;j<4;j++) k.rod(coil,[-0.66,0.29+j*0.185,0.14],[0.66,0.29+j*0.185,0.14],0.045,'copper')
  for(let j=0;j<3;j++) {
    const sign=j%2?1:-1, y=0.29+j*0.185
    k.hose(coil,[[sign*0.61,y,0.14],[sign*0.71,y+0.04,0.14],[sign*0.71,y+0.15,0.14],[sign*0.61,y+0.185,0.14]],0.044,'copper')
  }
  k.box(g,3.03,0.09,0.68,0,1.53,-0.12,'porcelain',true)
  for(const side of [-1,1]) k.rod(g,[side*1.46,0,-0.4],[side*1.46,1.5,-0.4],0.037,'steel')
  spin(k,wheel.rotor,'z',s=>s.memory.valve ? s.input.fan+1:0)
}

function garage(k:Kit,p:Group) {
  const g=buildingSlab(k,p)
  k.box(g,3.72,0.96,0.11,0,0.48,-0.87,'porcelain')
  for(const x of [-1.6,0.42]) {
    k.box(g,0.16,1.37,0.19,x,0.69,-0.55,'alloy')
    k.box(g,0.169,0.22,0.2,x,0.34,-0.55,'yellow')
  }
  k.box(g,2.85,0.1,0.34,-0.33,1.39,-0.54,'graphite',true)
  const car=vehicle(k,g,-0.66,0.13,0.93);k.tag(car,'traffic')
  for(const x of [-1.68,0.36]) k.box(g,0.037,0.012,1.39,x,0.009,0.1,'white')
  const exhaust=fan(k,g,1.13,-0.15,0.72);k.tag(exhaust.body,'fault')
  spin(k,exhaust.rotor,'z',s=>value(s,/实际换气/,/次\/h/))
}

function lift(k:Kit,p:Group) {
  const g=buildingSlab(k,p,3.51,1.87)
  const car=k.tag(group(g),'car')
  k.box(car,2.36,0.09,1.26,0,0.07,-0.01,'graphite',true)
  k.box(car,2.35,1.84,0.08,0,0.99,-0.58,'alloy')
  for(const x of [-1.13,1.13]) {
    k.box(car,0.11,1.98,1.18,x,1.01,0,'porcelain')
    k.box(car,0.14,2.04,0.13,x,1.02,0.61,'graphite')
  }
  k.box(car,2.4,0.21,1.25,0,2.07,0,'teal',true)
  const doors:Group[]=[]
  for(const side of [-1,1]) {
    const leaf=k.tag(group(car,side*0.53,0,0.51),'door')
    k.box(leaf,1.043,1.87,0.074,0,1.024,0,'steel',true)
    k.box(leaf,0.07,1.69,0.018,-side*0.48,1.03,0.048,'graphite')
    doors.push(leaf)
  }
  const barrier=k.tag(group(car),'beam')
  for(let j=0;j<6;j++) k.rod(barrier,[-1.06,0.31+j*0.255,0.65],[1.06,0.31+j*0.255,0.65],0.008,'warn',6)
  const obstruction=k.tag(group(g,0.18,0,0.69),'obstruction')
  k.box(obstruction,0.43,0.57,0.46,0,0.29,0,'copper',true)
  k.respond(s=>{
    const open=clamp(value(s,/^门缝$/,/^mm$/)/1000)
    doors.forEach((d,j)=>{d.position.x=(j?1:-1)*(0.53+0.71*open);d.scale.x=1-0.48*open})
    obstruction.visible=Boolean(value(s,/^光幕受阻$/))
    barrier.visible=obstruction.visible
  })
}

function signalPost(k:Kit,p:Group,x:number,z:number,side:string) {
  const g=k.tag(group(p,x,0,z),side)
  k.cylinder(g,0.14,0.09,0,0.05,0,'alloy')
  k.cylinder(g,0.047,0.98,0,0.58,0,'graphite')
  k.box(g,0.34,0.77,0.2,0,1.31,0,'graphite',true)
  return [0,1,2].map((j)=>{
    const y=1.54-j*0.225
    k.cylinder(g,0.104,0.045,0,y,0.12,'rubber','z')
    k.box(g,0.22,0.027,0.14,0,y+0.107,0.15,'graphite',true)
    return k.cylinder(g,0.079,0.023,0,y,0.153,'off','z')
  })
}

function crossing(k:Kit,p:Group) {
  const g=buildingSlab(k,p)
  k.box(g,3.82,0.027,0.79,0,0.019,0,'graphite')
  k.box(g,0.95,0.03,1.86,0,0.024,0,'graphite')
  for(const side of [-1,1]) for(let i=0;i<5;i++) {
    k.box(g,0.21,0.012,0.057,side*0.72,0.042,(i-2)*0.134,'white')
    k.box(g,0.078,0.012,0.17,(i-2)*0.145,0.044,side*0.62,'white')
  }
  const ns=signalPost(k,g,-1.05,-0.56,'north'),ew=signalPost(k,g,1.05,0.56,'east')
  for(const [rig,start] of [[ns,0],[ew,3]] as const) {
    for(const [j,color] of (['hot','warn','on'] as const).entries()) {
      k.light(rig[j],s=>{
        const phase=s.memory.phase
        return j===2 ? phase===start : j===1 ? phase===start+1 : phase!==start && phase!==start+1
      },color,'rubber')
    }
  }
}

function rail(k:Kit,p:Group) {
  const g=buildingSlab(k,p,3.92,1.66)
  for(let i=0;i<13;i++) k.box(g,0.12,0.07,0.92,-1.79+i*0.296,0.042,0,'graphite')
  for(const z of [-0.31,0.31]) k.box(g,3.84,0.07,0.052,0,0.104,z,'steel')
  const train=k.tag(group(g,0,0,0),'train')
  for(const x of [-0.66,0.66]) for(const z of [-0.29,0.29]) k.cylinder(train,0.125,0.074,x,0.249,z,'graphite','z')
  k.box(train,1.93,0.49,0.77,0,0.57,0,'porcelain',true)
  k.box(train,1.87,0.087,0.786,0,0.42,0,'teal',true)
  for(let i=0;i<5;i++) {
    k.box(train,0.251,0.18,0.016,-0.64+i*0.32,0.642,0.391,'solar',true)
  }
  k.box(train,0.041,0.22,0.59,0.967,0.65,0,'solar',true)
  k.rod(train,[-0.37,0.83,0],[-0.07,1.08,0],0.023,'steel')
  k.rod(train,[-0.07,1.08,0],[-0.37,1.27,0],0.023,'steel')
  k.rod(train,[-0.37,1.27,-0.23],[-0.37,1.27,0.23],0.025,'graphite')
  for(const x of [-1.61,1.61]) {
    k.rod(g,[x,0,-0.62],[x,1.45,-0.62],0.048,'steel');k.rod(g,[x,1.43,-0.62],[x,1.28,0],0.035,'alloy')
  }
  k.rod(g,[-1.78,1.28,0],[1.78,1.28,0],0.009,'copper',8)
  const resistor=k.tag(group(train,0.46,0.82,-0.06),'isolated')
  for(let j=0;j<5;j++){
    const fin=k.box(resistor,0.043,0.114,0.34,(j-2)*0.072,0.059,0,'steel')
    k.intensity(fin,s=>value(s,/^车载耗散$/,/kW/)/150,'warn','steel')
  }
}

function packing(k:Kit,p:Group) {
  const belt=k.tag(conveyor(k,p,0,0.02,3.86,0.81),'belt')
  const arch=k.tag(group(p,0.48,0,0.02),'sealer')
  for(const z of [-0.61,0.61]) {
    k.box(arch,0.27,1.52,0.16,0,0.78,z,'alloy',true)
    k.box(arch,0.41,0.09,0.29,0,0.05,z,'graphite',true)
  }
  k.box(arch,0.39,0.25,1.4,0,1.54,0,'teal',true)
  const ram=group(arch,0,1.33,0)
  k.cylinder(ram,0.065,0.27,0,0,0,'steel')
  k.box(ram,0.43,0.09,0.55,0,-0.14,0,'graphite',true)
  const box=k.tag(group(belt,-0.68,0.66,0),'box')
  k.box(box,0.51,0.37,0.48,0,0.185,0,'copper',true)
  k.box(box,0.095,0.015,0.478,0,0.379,0,'yellow')
  k.tag(photocell(k,p,0.19,-0.62),'sensor')
  const alarm=lamp(k,arch,0,1.68,-0.41,0.59)
  k.light(alarm.bulb,s=>value(s,/^堵料锁存$/)>0,'hot')
  k.respond(s=>{
    box.visible=(s.memory.left??0)>0
    const length=(s.memory.boxLength??0)/500
    box.scale.x=clamp(length,0.45,2)
    box.position.x=0.19+0.51*box.scale.x*(clamp(value(s,/^箱位$/,/^%$/)/100)-0.5)
  })
}

function dualPump(k:Kit,p:Group) {
  const g=skid(k,p,3.96,1.86)
  const tank=vessel(k,g,-1.27,-0.01,0.41,1.13);k.tag(tank.body,'tank')
  const a=pump(k,g,0.49,-0.45,0.72),b=pump(k,g,0.49,0.43,0.72)
  k.tag(a.body,'pumpA');k.tag(b.body,'pumpB')
  for(const [i,z] of [-0.45,0.43].entries()) {
    k.hose(g,[[0.845,0.7,z],[0.845,0.88,z],[1.01,0.95,z],[1.42,0.95,z]],0.055,'teal')
    const l=lamp(k,g,-0.13,0.29,z+0.05,0.56)
    k.light(l.bulb,s=>Boolean(i?s.memory.b:s.memory.a))
  }
  k.rod(g,[1.42,0.95,-0.55],[1.42,0.95,0.53],0.077,'alloy')
  k.respond(s=>tank.setLevel(value(s,/水位|液位/,/%/)/100))
  spin(k,a.shaft,'x',s=>s.memory.a??0)
  spin(k,b.shaft,'x',s=>s.memory.b??0)
}

function reserve(k:Kit,p:Group) {
  const g=buildingSlab(k,p,3.94,1.84)
  k.tag(genset(k,g,-0.92,0.05,0.67).body,'reserve')
  const ats=k.tag(cabinet(k,group(g,0.6,0,-0.08),0.76,1.27,0.61),'transfer')
  const b=breaker(k,group(ats,0,0.42,0.39,0.55),2)
  const loads=k.tag(group(g,1.44,0,0),'load')
  for(const [i,z] of [-0.37,0.03,0.43].entries()) {
    const l=lamp(k,loads,0,0,z,0.95)
    k.tag(l.body,['critical','motor','heater'][i])
    k.light(l.bulb,s=>i===0?value(s,/^关键可供$/,/kW/)>0:s.frame.active.includes(i+1),'warn')
  }
  k.respond(s=>{b.handle.rotation.x=s.input.shed?-0.4:0.48})
}

function coldroom(k:Kit,p:Group) {
  const g=buildingSlab(k,p)
  for(const [i,zone] of (['a','b'] as const).entries()) {
    const room=k.tag(group(g,-1.04+i*1.41,0,-0.03),i?'defB':'defA')
    k.box(room,1.38,1.43,0.1,0,0.72,-0.68,'ice')
    k.box(room,0.078,1.43,1.4,-0.65,0.72,0,'porcelain')
    k.box(room,1.39,0.088,0.47,0,1.47,-0.47,'white',true)
    for(let j=0;j<4;j++) k.box(room,0.017,1.3,0.012,-0.51+j*0.33,0.71,-0.621,'alloy')
    const cooler=fan(k,room,-0.13,-0.38,0.58)
    cooler.body.position.y=0.54
    const mark=lamp(k,room,0.43,0.81,-0.44,0.57)
    k.light(mark.bulb,s=>(s.memory['clock'+zone]??0)>1,'warn')
    k.label(room,i?'B':'A',0.21,0.133,0.44,1.24,-0.617)
    for(let j=0;j<3;j++) {
      const crate=k.tag(group(room,-0.31+0.32*(j%2),0,0.13+Math.floor(j/2)*0.39),'order')
      k.box(crate,0.285,0.29,0.32,0,0.157,0,'copper',true)
      k.box(crate,0.061,0.013,0.326,0,0.311,0,'yellow')
      k.respond(s=>{crate.visible=(s.memory['stock'+zone]??0)>j})
    }
    spin(k,cooler.rotor,'z',s=>(s.memory['clock'+zone]??0)===0&&!s.input.coast?1:0)
  }
  const desk=k.tag(cabinet(k,group(g,1.48,0,0),0.55,0.95,0.57,'teal'),'dispatch')
  k.display(desk,0.39,0.159,0,0.67,0.346,s=>String(s.memory.queue??0))
}

function stacker(k:Kit,p:Group) {
  const g=buildingSlab(k,p,3.91,1.87)
  const rack=k.tag(group(g,0,0,-0.31),'rack')
  for(let i=0;i<4;i++) for(const z of [-0.39,0.26]) k.box(rack,0.063,1.72,0.063,-1.49+i*0.99,0.86,z,'teal')
  for(let j=0;j<3;j++) {
    const y=0.17+j*0.57
    k.box(rack,3.06,0.071,0.76,0,y,-0.06,'alloy')
    for(let i=0;i<3;i++) if((i+j)%3!==1) {
      k.box(rack,0.55,0.36,0.42,-0.99+i*0.99,y+0.22,-0.04,'copper',true)
      k.box(rack,0.08,0.015,0.43,-0.99+i*0.99,y+0.407,-0.04,'yellow')
    }
  }
  k.box(g,3.54,0.075,0.133,0,0.04,0.63,'steel')
  const mast=k.tag(group(g,0,0,0.6),'axis')
  k.box(mast,0.62,0.17,0.37,0,0.16,0,'graphite',true)
  for(const x of [-0.16,0.16]) k.box(mast,0.073,1.83,0.104,x,1,0,'orange')
  k.box(mast,0.48,0.09,0.17,0,1.94,0,'alloy')
  const fork=k.tag(group(mast,0,0.41,0),'fork')
  k.box(fork,0.53,0.19,0.15,0,0,0,'graphite')
  for(const x of [-0.17,0.17]) k.box(fork,0.079,0.058,0.48,x,-0.07,-0.18,'steel')
  k.respond(s=>{
    mast.position.x=-1.32+2.64*clamp(value(s,/^实际位置$/,/^m$/)/10)
  })
}

function microgrid(k:Kit,p:Group) {
  const g=buildingSlab(k,p,3.96,1.98)
  const a=panel(k,g,-1.25,-0.16,0.69);k.tag(a.body,'pv')
  const store=battery(k,g,-0.26,0.35,0.57,3);k.tag(store.body,'battery')
  const plant=k.tag(group(g,0.49,0,-0.35),'load')
  k.box(plant,1.05,0.54,0.68,0,0.29,0,'porcelain',true)
  for(let i=0;i<3;i++) {
    const xx=(i-1)*0.33
    const roof=k.profile(plant,[[-0.18,0],[0.17,0.19],[0.17,0]],0.72,'teal')
    roof.position.set(xx,0.56,0)
    k.box(plant,0.21,0.16,0.017,xx,0.34,0.351,'solar')
  }
  k.tag(transformer(k,g,1.37,0.32,0.47),'grid')
  const ev=k.tag(vehicle(k,g,0.61,0.49,0.48,'blue'),'ev')
  ev.rotation.y=0.05
  for(const x of [-1.25,-0.26,0.49,1.37]) k.rod(g,[x,0.052,0.48],[x,0.052,0.72],0.024,'copper')
  k.box(g,2.69,0.052,0.069,0.06,0.052,0.72,'copper')
  const arrow=group(g,1.37,0.108,0.72)
  const tri=k.profile(arrow,[[-0.09,-0.051],[0.11,0],[-0.09,0.051]],0.026,'orange')
  tri.rotation.x=-Math.PI/2
  k.respond(s=>{const flow=value(s,/^并网有功$/,/^kW$/);arrow.visible=Math.abs(flow)>1e-6;arrow.rotation.y=flow>0?Math.PI:0})
}

export const systemsStations=[corridor,airHandler,garage,lift,crossing,rail,packing,dualPump,reserve,coldroom,stacker,microgrid]
