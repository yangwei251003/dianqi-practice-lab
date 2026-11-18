import { Box3, Group, Vector3 } from 'three'
import type { Device, Snapshot } from '../../core/types'
import { breaker, contactor, controller, driveUnit, terminals } from './electrical'
import { asPart, faceUp, group, Kit, type Finish } from './kit'
import { battery, board, cabinet, capacitor, inductor, motor, panel, pump, turbine } from './machinery'
import { kbuBridge, semiconductor } from './stations-energy'
import { displayValue, meterText, spin, value } from './signals'

const frontRead=(k:Kit)=>(s:Snapshot)=>meterText(k.lesson.id,s)

function screws(k:Kit,p:Group,w:number,h:number,z:number) {
  for(const x of [-1,1]) for(const y of [-1,1]) {
    k.cylinder(p,0.025,0.018,x*w*0.44,h*(0.5+y*0.43),z,'steel','z',12)
  }
}

function handheld(k:Kit,p:Group,proving:boolean) {
  const g=group(p);g.rotation.x=-0.19
  const w=proving?0.93:0.95,h=proving?1.62:1.75
  k.box(g,w,h,0.43,0,h/2,0,'yellow',true)
  k.box(g,w*0.845,h*0.91,0.104,0,h/2,0.217,'graphite',true)
  const face=0.274
  if(proving) {
    k.label(g,'FLUKE',0.46,0.14,0,1.38,face+0.002,'#263033','#e8bc55')
    k.label(g,'PRV240',0.49,0.11,0,1.21,face+0.002)
    for(const y of [0.46,0.99]) {
      k.cylinder(g,0.127,0.035,0,y,face+0.013,'rubber','z')
      k.cylinder(g,0.079,0.014,0,y,face+0.036,'dark','z')
      k.ring(g,0.084,0.014,0,y,face+0.045,'alloy')
    }
    const led=k.cylinder(g,0.036,0.011,0.16,0.76,face+0.014,'off','z')
    k.light(led,s=>(s.memory.referenceV??0)>0)
    k.box(g,0.19,0.057,0.038,-0.083,0.758,face+0.018,'alloy',true)
    k.tag(g,'reference')
  } else {
    k.label(g,'FLUKE  115',0.66,0.109,0,1.61,face+0.002,'#fff1ce','#29393d')
    k.box(g,0.72,0.34,0.026,0,1.34,face+0.013,'alloy',true)
    k.display(g,0.63,0.25,0,1.34,face+0.035,s=>{
      if(value(s,/开路 OL/)>0) return 'OL'
      const m=s.frame.meters.find(a=>/表显|电阻读数/.test(a[0]))
      return m?displayValue(m[1])+' '+m[2]:'—'
    })
    for(let i=0;i<4;i++) k.box(g,0.109,0.066,0.034,(i-1.5)*0.162,1.071,face+0.02,'alloy',true)
    const dial=k.tag(group(g,0,0.76,face+0.038),'dial')
    k.cylinder(dial,0.222,0.09,0,0,0,'graphite','z',32)
    k.box(dial,0.102,0.32,0.083,0,0,0.058,'alloy',true)
    k.box(dial,0.063,0.056,0.016,0,0.117,0.107,'yellow')
    k.respond(s=>{dial.rotation.z=0.77-(s.input.dial??0)*0.79})
    for(let i=0;i<3;i++) k.cylinder(g,0.071,0.042,(i-1)*0.23,0.28,face+0.016,i===1?'rubber':'red','z')
    k.label(g,'A      COM      VΩ',0.72,0.107,0,0.43,face+0.009)
  }
}

function bulb(k:Kit,p:Group) {
  k.cylinder(p,0.32,0.44,0,0.29,0,'silver')
  for(const s of [-1,1]) k.cylinder(p,0.061,0.083,s*0.329,0.34,0,'steel','x')
  k.cylinder(p,0.21,0.055,0,0.042,0,'graphite')
  const glass=k.ball(p,0.42,0.55,0.42,0,0.9,0,'glass')
  glass.renderOrder=2
  for(const s of [-1,1]) k.rod(p,[s*0.07,0.51,0],[s*0.127,0.98,0],0.018,'steel')
  const filament=k.rod(p,[-0.127,0.98,0],[0.127,0.98,0],0.022,'copper')
  k.light(filament,s=>value(s,/A 灯功率/,/W/)>0,'warn','copper')
}

function screenUnit(k:Kit,p:Group,w:number,h:number,d:number,finish:Finish='graphite',keyCount=4) {
  k.box(p,w,h,d,0,h/2,0,finish,true)
  k.box(p,w*0.91,h*0.8,0.055,0,h*0.52,d/2+0.017,'dark',true)
  k.display(p,w*0.72,h*0.29,0,h*0.6,d/2+0.05,frontRead(k))
  for(let i=0;i<keyCount;i++) k.box(p,w*0.58/keyCount,h*0.09,0.04,(i-(keyCount-1)/2)*w*0.72/keyCount,h*0.29,d/2+0.063,'alloy',true)
}

function dinMeter(k:Kit,p:Group,poles:number) {
  k.box(p,1.23,1.13,0.69,0,0.565,0,'porcelain',true)
  for(const y of [0.16,0.995]) {
    for(let i=0;i<poles;i++) {
      const x=(i-(poles-1)/2)*1.1/poles
      k.box(p,0.87/poles,0.18,0.057,x,y,0.366,'alloy',true)
      k.cylinder(p,0.046,0.015,x,y,0.404,'graphite','z')
    }
  }
  k.box(p,1.01,0.59,0.15,0,0.57,0.365,'porcelain',true)
  k.display(p,0.68,0.215,-0.1,0.623,0.447,frontRead(k))
  for(let i=0;i<2;i++) k.box(p,0.091,0.058,0.025,0.38,0.616-i*0.112,0.449,'teal',true)
}

function lightSensor(k:Kit,p:Group,pair:boolean) {
  for(const x of pair?[-0.37,0.37]:[0]) {
    const g=group(p,x,0,0)
    k.box(g,0.48,0.83,0.33,0,0.48,0,'graphite',true)
    k.box(g,0.355,0.61,0.044,0,0.51,0.184,'dark',true)
    if(!pair || x>0) k.cylinder(g,0.096,0.019,0,0.41,0.218,'ice','z')
    k.cylinder(g,0.102,0.021,0,0.62,0.218,'red','z')
    for(const y of [0.18,0.79]) k.cylinder(g,0.035,0.012,-0.15,y,0.192,'steel','z')
    k.hose(g,[[0,0.15,-0.11],[0.07,0.054,-0.22],[0.21,0.047,-0.27],[0.3,0.052,-0.18]],0.029,'rubber')
    if(pair) k.tag(g,x<0?'optics':'polarity')
  }
}

function threadedProbe(k:Kit,p:Group) {
  const axis=group(p,0,0.34,0)
  k.cylinder(axis,0.17,1.14,0,0,0,'steel','x')
  for(let i=0;i<16;i++) k.ring(axis,0.17,0.013,-0.51+i*0.059,0,0,'silver','x')
  for(const x of [-0.27,0.13]) k.cylinder(axis,0.24,0.103,x,0,0,'alloy','x',6)
  k.cylinder(axis,0.173,0.052,0.589,0,0,'orange','x')
  k.cylinder(axis,0.132,0.25,-0.655,0,0,'graphite','x')
  k.box(p,0.29,0.19,0.39,-0.22,0.11,0,'graphite',true)
}

function pressureProbe(k:Kit,p:Group) {
  k.cylinder(p,0.17,0.81,0,0.47,0,'silver')
  k.cylinder(p,0.17,0.18,0,0.084,0,'graphite')
  for(const s of [-1,1]) k.box(p,0.051,0.073,0.012,s*0.065,0.11,0.158,'dark')
  k.cylinder(p,0.12,0.13,0,0.92,0,'rubber')
  k.hose(p,[[0,0.97,0],[0.01,1.13,-0.02],[0.21,1.29,-0.02],[0.41,1.14,-0.03],[0.51,0.81,0]],0.034,'rubber')
}

function stepMotor(k:Kit,p:Group) {
  k.box(p,0.85,0.85,0.69,0,0.44,0,'graphite',true)
  for(const z of [-0.367,0.367]) k.box(p,0.85,0.85,0.077,0,0.44,z,'alloy',true)
  k.cylinder(p,0.228,0.1,0,0.44,0.445,'steel','z')
  const shaft=group(p,0,0.44,0.55)
  k.cylinder(shaft,0.077,0.22,0,0,0.014,'silver','z')
  k.box(shaft,0.091,0.013,0.15,0,0.073,0.021,'steel')
  screws(k,p,0.81,0.84,0.411)
  k.respond(s=>{shaft.rotation.z=value(s,/累计轴角/,/°/)*Math.PI/180})
}

function cableSample(k:Kit,p:Group) {
  const jacket=k.cylinder(p,0.24,1.04,-0.33,0.35,0,'rubber','x',36)
  jacket.name='insulation-jacket';jacket.userData.mutable=true
  for(const [j,f] of (['copper','blue','yellow'] as const).entries()) {
    const y=0.35+0.139*Math.cos(j*Math.PI*2/3),z=0.139*Math.sin(j*Math.PI*2/3)
    const tip=0.64+j*0.078
    k.cylinder(p,0.092,tip+0.85,(tip-0.85)/2,y,z,f,'x')
    k.cylinder(p,0.059,0.137,tip+0.069,y,z,'copper','x')
    if(j===2) for(let i=0;i<3;i++) k.cylinder(p,0.093,0.038,0.27+i*0.15,y,z,'green','x')
  }
}

function chip(k:Kit,p:Group) {
  k.box(p,0.7,0.21,0.92,0,0.205,0,'graphite',true)
  for(let i=0;i<4;i++) for(const sign of [-1,1]) {
    const z=(i-1.5)*0.206
    k.hose(p,[[sign*0.35,0.19,z],[sign*0.408,0.168,z],[sign*0.455,0.066,z],[sign*0.55,0.051,z]],0.031,'alloy')
  }
  k.cylinder(p,0.037,0.008,-0.23,0.315,-0.31,'alloy')
  faceUp(k.label(p,'DRV8871',0.5,0.16,0,0.316,0.04))
}

function optics(k:Kit,p:Group,model:string) {
  if(/IS 180/.test(model)) {
    k.box(p,0.69,0.98,0.36,0,0.49,0,'graphite',true)
    k.ball(p,0.303,0.205,0.267,0,0.35,0.129,'porcelain')
    for(let i=0;i<4;i++) k.box(p,0.48-i*0.025,0.012,0.018,0,0.27+i*0.055,0.386,'alloy')
  } else if(/E3Point/.test(model)) {
    k.box(p,0.85,1.17,0.34,0,0.59,0,'alloy',true)
    k.box(p,0.73,0.99,0.046,0,0.6,0.184,'porcelain',true)
    k.display(p,0.54,0.16,0,0.81,0.213,frontRead(k))
    k.slats(p,5,0.39,0.052,0,0.4,0.218)
    screws(k,p,0.79,1.14,0.199)
  } else if(/cegard/.test(model)) {
    for(const x of [-0.36,0.36]) {
      k.box(p,0.089,1.62,0.095,x,0.81,0,'graphite')
      for(let i=0;i<36;i++) k.cylinder(p,0.015,0.011,x,0.07+i*0.042,0.052,'ice','z',8)
    }
  } else {
    k.box(p,0.66,1.16,0.92,0,0.59,0,'red',true)
    k.box(p,0.58,0.79,0.055,0,0.68,0.477,'graphite',true)
    k.cylinder(p,0.175,0.045,0,0.8,0.527,'solar','z',32)
    k.display(p,0.39,0.124,0,0.46,0.513,frontRead(k))
    for(const x of [-0.17,0.17]) k.cylinder(p,0.069,0.12,x,0.11,0.46,'steel','z',12)
  }
}

function specific(k:Kit,p:Group,d:Device) {
  const m=d.model
  if(/PRV240/.test(m)) return handheld(k,p,true)
  if(/Fluke/i.test(d.maker)&&/115/.test(m)) return handheld(k,p,false)
  if(/DL1CE024/.test(m)) return bulb(k,p)
  if(/^UT 2/.test(m)) {
    const g=terminals(k,p,3)
    for(let i=0;i<3;i++) faceUp(k.label(g,String(i+1),0.1,0.061,(i-1)*0.164,0.42,0,'#253334','#f1efe3'))
    return
  }
  if(/EEU-FR/.test(m)) {
    const can=capacitor(k,group(p,0,0.29,0),0,0,0.26,1.04)
    k.label(can,'1000 µF',0.38,0.112,0,0.64,0.263)
    for(const x of [-0.13,0.13]) k.cylinder(p,0.016,0.295,x,0.147,0,'silver')
    return
  }
  if(/iEM3155|TS 65A/.test(m)) return dinMeter(k,p,/TS/.test(m)?3:4)
  if(/LC[12]D09/.test(m)) {
    const twin=/LC2D/.test(m)
    for(let i=0;i<(twin?2:1);i++) {
      const x=twin?(i-0.5)*0.87:0
      const c=contactor(k,group(p,x,0,0))
      k.tag(c.body,twin?(i?'reverse':'forward'):'aux')
      const flag=k.box(c.body,0.115,0.064,0.015,0.223,0.54,0.444,'off')
      const channel=twin?(i?/^反向线圈$/:/^正向线圈$/):/^线圈电压$/
      k.light(flag,s=>value(s,channel,/V/)>0,'on','off')
      k.respond(s=>{c.armature.position.z=value(s,channel,/V/)>0?0.37:0.44})
    }
    if(twin) {
      k.box(p,0.22,0.235,0.2,0,0.48,0.265,'graphite',true)
      for(let j=0;j<3;j++)k.hose(p,[[-0.65+j*0.224,0.91,0],[-0.65+j*0.224,1.043+j*0.05,-0.08],[0.22+j*0.224,1.043+j*0.05,-0.08],[0.22+j*0.224,0.91,0]],0.022,'rubber')
    }
    return
  }
  if(/CT-SDS/.test(m)) {
    k.box(p,0.47,1.16,0.83,0,0.59,0,'porcelain',true)
    k.box(p,0.392,0.79,0.031,0,0.59,0.431,'graphite')
    for(const y of [0.12,1.055])for(const x of [-0.123,0.123])k.cylinder(p,0.047,0.023,x,y,0.421,'steel','z')
    const dial=k.tag(group(p,0,0.695,0.46),'duration')
    k.cylinder(dial,0.119,0.058,0,0,0,'alloy','z')
    k.box(dial,0.039,0.098,0.012,0,0.039,0.035,'graphite')
    k.respond(s=>{dial.rotation.z=1.9-0.59*(s.input.duration??0)})
    for(let i=0;i<2;i++) {
      const led=k.cylinder(p,0.028,0.016,-0.069+i*0.13,0.391,0.453,'off','z')
      k.light(led,s=>value(s,i?/^三角接触器$/:/^星接触器$/)===1)
    }
    return
  }
  if(/M3AA/.test(m)) {const mtr=motor(k,p,0,0,1,'blue');spin(k,mtr.shaft,'x',s=>value(s,/^转子转速$/,/r\/min/));return}
  if(/ATV320/.test(m)) {
    const g=driveUnit(k,p)
    k.display(g,0.45,0.127,0,1.095,0.481,s=>displayValue(value(s,/^输出频率$/,/Hz/))+' Hz');return
  }
  if(/007-F5/.test(m)) {
    k.ball(p,0.39,0.38,0.29,0,0.47,0,'green')
    k.cylinder(p,0.143,1.04,0,0.46,0,'green','x')
    for(const side of [-1,1]) {
      k.cylinder(p,0.254,0.083,side*0.55,0.46,0,'green','x')
      for(const y of [-0.17,0.17])k.cylinder(p,0.035,0.087,side*0.551,0.46+y,0,'graphite','x')
    }
    k.cylinder(p,0.268,0.51,0,0.47,0.37,'green','z',32)
    k.cylinder(p,0.239,0.04,0,0.47,0.644,'steel','z')
    k.box(p,0.42,0.24,0.39,0,0.83,0.29,'green',true)
    k.label(p,'TACO  007',0.37,0.101,0,0.49,0.669)
    return
  }
  if(/S4L1D/.test(m)) {
    const g=motor(k,p,0,0,1,'graphite')
    k.box(g.body,0.72,0.36,0.58,0,1.14,0,'graphite',true)
    k.label(g.body,'STAMFORD',0.55,0.101,0,1.16,0.295)
    k.cylinder(g.body,0.394,0.115,0.59,0.52,0,'alloy','x',36)
    spin(k,g.shaft,'x',s=>value(s,/同步转速/,/r\/min/));return
  }
  if(/E3Z/.test(m)) return lightSensor(k,p,/-T/.test(m))
  if(/IFS204/.test(m)) return threadedProbe(k,p)
  if(/PS3208/.test(m)) return pressureProbe(k,p)
  if(/PKP244/.test(m)) return stepMotor(k,p)
  if(/Zelio/.test(m)) {
    const g=controller(k,p,'monitor')
    for(let i=0;i<6;i++) for(const y of [0.065,0.825]) k.cylinder(g,0.027,0.015,(i-2.5)*0.135,y,0.337,'alloy','z')
    k.tag(g,'load')
    return
  }
  if(/U-1000/.test(m)) return cableSample(k,p)
  if(/EXN75/.test(m)) {
    const g=cabinet(k,p,1.15,1.3,1,'steel')
    k.slats(g,5,0.91,0.052,0,1.02,0.557)
    k.label(g,'Square D',0.45,0.11,-0.17,0.71,0.558)
    return
  }
  if(/Flair/.test(m)) {
    screenUnit(k,p,0.8,0.74,0.53,'porcelain',2)
    const l=k.cylinder(p,0.048,0.017,0.25,0.55,0.324,'off','z')
    k.light(l,s=>s.frame.meters.some(a=>/^F[0ABC]/.test(a[0])&&a[1]===1),'hot')
    return
  }
  if(/SEL-751/.test(m)) {
    screenUnit(k,p,1.3,1.02,0.7,'graphite',6)
    for(let i=0;i<6;i++) k.cylinder(p,0.024,0.012,-0.52+i*0.207,0.141,0.401,'green','z')
    return
  }
  if(/VPL06/.test(m)){screenUnit(k,p,1,1,0.4,'porcelain',4);return}
  if(/KBU4G|LM2596|LM2577/.test(m)) {
    const bridge=/KBU4G/.test(m)
    const g=bridge?kbuBridge(k,p,0,0,1.1):semiconductor(k,p,0,0,5,0.78,true)
    k.label(g,m.split(/[ /]/)[0].replace(/T-ADJ.*/,''),bridge?0.72:0.59,0.13,0,bridge?0.63:0.47,0.101)
    return
  }
  if(/TIDM-HV/.test(m)) {
    const b=board(k,p,1.42,1.21)
    for(const x of [-0.48,-0.15]) capacitor(k,b,x,-0.28,0.14,0.52)
    inductor(k,b,0.31,0.19,0.66)
    for(const x of [-0.43,-0.09]) semiconductor(k,b,x,0.29,3,0.24,true)
    return
  }
  if(/DRV8871/.test(m)) return chip(k,p)
  if(/BQ40Z50/.test(m)) {
    k.box(p,0.95,0.21,0.95,0,0.12,0,'graphite',true)
    for(let i=0;i<8;i++) for(const sign of [-1,1]) {
      k.box(p,0.065,0.047,0.107,(i-3.5)*0.109,0.038,sign*0.453,'alloy')
      k.box(p,0.107,0.047,0.065,sign*0.453,0.038,(i-3.5)*0.109,'alloy')
    }
    faceUp(k.label(p,'BQ40Z50',0.59,0.16,0,0.228,0.044))
    k.cylinder(p,0.032,0.008,-0.342,0.229,-0.353,'alloy')
    return
  }
  if(/Powerwall 2/.test(m)) {
    k.box(p,0.94,1.45,0.19,0,0.736,0,'graphite',true)
    k.box(p,0.937,1.437,0.075,0,0.739,0.112,'porcelain',true)
    k.label(p,'T E S L A',0.38,0.068,0,1.09,0.151,'#718180','#e6ebe7')
    const led=k.box(p,0.011,0.29,0.031,0.475,1.16,0.049,'off')
    k.light(led,s=>!s.input.offline)
    return
  }
  if(/TIDA-010939/.test(m)) {
    const pcb=board(k,p,1.52,1.24)
    const terminalsAt=group(pcb,-0.45,0,-0.2,0.75)
    terminals(k,terminalsAt,3,'green')
    for(const x of [0.15,0.43]) k.box(pcb,0.22,0.18,0.30,x,0.1,-0.23,'graphite',true)
    k.box(pcb,0.27,0.046,0.27,-0.05,0.032,0.18,'graphite')
    for(let i=0;i<8;i++) k.cylinder(pcb,0.016,0.13,0.49,0.08,-0.15+i*0.07,'copper','y',8)
    for(let j=0;j<5;j++) k.box(pcb,0.077,0.032,0.043,-0.46+j*0.075,0.026,0.39,'alloy')
    return
  }
  if(/CP1500/.test(m)) {
    const w=0.54,h=1.46,depth=1.65
    k.box(p,w,h,depth,0,h/2,0,'graphite',true)
    k.box(p,w*0.89,h*0.92,0.035,0,h/2,depth/2+0.012,'rubber',true)
    k.display(p,0.39,0.26,0,1.04,depth/2+0.033,frontRead(k))
    k.cylinder(p,0.048,0.019,0,1.29,depth/2+0.041,'alloy','z')
    k.slats(p,8,0.34,0.052,0,0.38,depth/2+0.04)
    return
  }
  if(/CS6K/.test(m)) {panel(k,p,0,0,1,6,10);return}
  if(/BlueSolar/.test(m)) {
    k.box(p,1.2,0.82,0.53,0,0.47,0,'blue',true)
    k.box(p,1.18,0.18,0.48,0,0.1,0.005,'graphite',true)
    k.label(p,'BlueSolar MPPT',0.85,0.115,0,0.64,0.268,'#f1efe7','#316b82')
    for(let i=0;i<6;i++) k.cylinder(p,0.049,0.018,(i-2.5)*0.156,0.187,0.268,'graphite','z')
    for(let i=0;i<3;i++) k.cylinder(p,0.026,0.019,-0.39,0.49-i*0.073,0.272,'mint','z')
    return
  }
  if(/IS 180|E3Point|cegard|AMS 304/.test(m)) return optics(k,p,m)
  if(/RDF302/.test(m)) {screenUnit(k,p,1.04,1.04,0.29,'porcelain',4);return}
  if(/Cobalt/.test(m)) {
    screenUnit(k,p,1.71,0.62,0.79,'blue',6)
    for(const x of [-0.92,0.92]) {k.box(p,0.11,0.62,0.058,x,0.31,0.4,'steel');k.cylinder(p,0.024,0.016,x,0.54,0.439,'graphite','z')}
    return
  }
  if(/DVL/.test(m)) {
    k.box(p,1.03,0.8,0.57,0,0.47,0,'blue',true)
    k.box(p,1.32,0.09,0.68,0,0.06,0,'steel',true)
    k.box(p,0.47,0.13,0.16,0.15,0.93,-0.08,'green')
    k.cylinder(p,0.074,0.15,-0.27,0.91,0,'copper')
    k.label(p,'LEM   DVL',0.64,0.16,0,0.51,0.292)
    return
  }
  if(/LC 221/.test(m)) {const g=cabinet(k,p,1.13,1.16,0.48);k.display(g,0.46,0.19,-0.12,0.85,0.296,frontRead(k));return}
  if(/PM5560/.test(m)) {screenUnit(k,p,1.03,1.03,0.54);return}
  if(/AK-CC55/.test(m)) {
    const g=controller(k,p,'modular')
    k.box(g,1.25,0.41,0.047,0,0.45,0.388,'porcelain',true)
    k.label(g,'AK-CC55',0.66,0.118,-0.19,0.44,0.419,'#28373a','#e6ebe7');return
  }
  family(k,p,d)
}

function family(k:Kit,p:Group,d:Device) {
  switch(d.form) {
    case 'motor':case 'generator':{motor(k,p,0,0,1,d.form==='generator'?'graphite':'teal');break}
    case 'contactor':{const c=contactor(k,p);k.respond(s=>{c.armature.position.z=value(s,/线圈|正转接触器|主接触器|自保持/) ? 0.36:0.44});break}
    case 'drive':driveUnit(k,p);break
    case 'pump':pump(k,p);break
    case 'wind':{const t=turbine(k,p);spin(k,t.rotor,'z',s=>value(s,/^实际有功$/,/kW/));break}
    case 'battery':battery(k,p);break
    case 'solar':panel(k,p,0,0);break
    case 'terminal':terminals(k,p,4);break
    case 'lamp':bulb(k,p);break
    case 'board':board(k,p,1.32,1);break
    case 'plc':controller(k,p);break
    case 'relay':case 'meter':screenUnit(k,p,1,1,0.58);break
    case 'sensor':lightSensor(k,p,false);break
    case 'charger':case 'cabinet':case 'hvac':case 'ups':case 'transformer':{
      const g=cabinet(k,p,0.82,1.33,0.64)
      k.display(g,0.51,0.177,0,0.97,0.381,frontRead(k));break
    }
    default:breaker(k,p)
  }
}

/** Separate exhibits are fitted independently. Only supplied W/H/D controls the envelope ratio. */
export function referenceDevice(k:Kit,parent:Group) {
  const body=new Group(),d=k.lesson.device
  specific(k,body,d)
  asPart(body,Math.min(k.lesson.parts.length-1,referencePart[k.lesson.id]??0))
  const b=new Box3().setFromObject(body),s=b.getSize(new Vector3()),center=b.getCenter(new Vector3())
  const measured=d.dimensions
  const raw=measured && measured.every(n=>Number.isFinite(n)&&n>0) ? new Vector3(...measured):s
  const fit=Math.min(1.93/raw.x,1.84/raw.y,1.84/raw.z)
  body.scale.set(raw.x*fit/s.x,raw.y*fit/s.y,raw.z*fit/s.z)
  body.position.set(-center.x*body.scale.x,-b.min.y*body.scale.y,-center.z*body.scale.z)
  parent.add(body)
}

const referencePart:Record<number,number>={7:1,11:0,15:1,16:2,18:3,20:0,22:0,32:1,35:2,38:0,40:0,43:0,47:1,48:3}
