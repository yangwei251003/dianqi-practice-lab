import type { Object3D } from 'three'
import { clamp, faceUp, group, Kit, type Finish } from './kit'

export function skid(k: Kit, p: Object3D, w: number, d: number) {
  for (const side of [-1,1]) {
    k.box(p,w,0.105,0.15,0,0.08,side*(d/2-0.1),'graphite',true)
    for (const end of [-1,1]) k.box(p,0.19,0.05,0.21,end*(w/2-0.16),0.026,side*(d/2-0.1),'rubber',true)
  }
  k.box(p,w,0.08,d,0,0.15,0,'alloy',true)
  return group(p,0,0.19,0)
}

export function motor(k: Kit, parent: Object3D, x=0, z=0, scale=1, finish: Finish='teal') {
  const body = group(parent,x,0,z,scale)
  for (const side of [-1,1]) {
    k.box(body,1.05,0.11,0.16,0,0.065,side*0.3,'graphite',true)
    k.box(body,0.78,0.16,0.09,-0.05,0.17,side*0.26,finish)
  }
  const y=0.52
  k.cylinder(body,0.35,1.05,0,y,0,finish,'x',36)
  for (let i=0;i<15;i++) {
    const a=i*Math.PI*2/15
    const fin=k.box(body,0.78,0.075,0.05,-0.02,y+Math.cos(a)*0.35,Math.sin(a)*0.35,finish)
    fin.rotation.x=a
  }
  k.cylinder(body,0.375,0.19,-0.6,y,0,'graphite','x',32,0.9)
  k.cylinder(body,0.35,0.12,0.55,y,0,'alloy','x',32,0.84)
  k.cylinder(body,0.12,0.34,0.75,y,0,'silver','x')
  k.box(body,0.44,0.24,0.38,-0.11,0.96,-0.012,finish,true)
  k.box(body,0.49,0.045,0.42,-0.11,1.1,-0.012,'graphite',true)
  k.box(body,0.13,0.16,0.13,-0.43,0.95,0,'rubber',true)
  k.label(body,'3~',0.24,0.12,-0.11,0.96,0.183)
  const shaft=group(body,0.84,y,0)
  k.cylinder(shaft,0.18,0.11,0,0,0,'steel','x')
  k.box(shaft,0.015,0.045,0.14,0.064,0,0.085,'amber')
  return {body,shaft}
}

export function impeller(k: Kit, parent: Object3D, radius: number, finish: Finish, blades=6) {
  const rotor = group(parent)
  const blade: [number,number][] = [[0.06,0.08],[0.1,0.34],[-0.02,0.76],[-0.26,0.95],[-0.39,0.86],[-0.24,0.55],[-0.13,0.16]]
  for (let i=0;i<blades;i++) {
    const b=k.profile(rotor,blade,0.06,finish)
    b.scale.setScalar(radius)
    b.rotation.z=i*2*Math.PI/blades
  }
  k.cylinder(rotor,radius*0.22,radius*0.19,0,0,0.02,'alloy','z')
  k.cylinder(rotor,radius*0.085,radius*0.24,0,0,0.03,'graphite','z',6)
  return rotor
}

export function fan(k: Kit, parent: Object3D, x=0, z=0, scale=1) {
  const body=group(parent,x,0,z,scale), y=0.88
  k.box(body,1.4,0.095,0.73,0,0.055,0,'graphite',true)
  for (const i of [-1,1]) k.rod(body,[i*0.59,0.1,0],[i*0.44,0.5,0],0.064,'steel')
  k.cylinder(body,0.78,0.33,0,y,-0.14,'teal','z',48)
  k.cylinder(body,0.71,0.018,0,y,0.033,'dark','z',44)
  const rotor=impeller(k,group(body,0,y,0.11),0.655,'porcelain',7)
  k.ring(body,0.755,0.04,0,y,0.25,'alloy')
  for (const r of [0.28,0.46,0.64]) k.ring(body,r,0.011,0,y,0.24,'steel')
  for (let i=0;i<6;i++) {
    const a=Math.PI*2*i/6
    k.rod(body,[0,y,0.25],[Math.cos(a)*0.73,y+Math.sin(a)*0.73,0.25],0.013,'steel',8)
  }
  return {body,rotor}
}

export function valve(k: Kit, parent: Object3D, x: number, y: number, z: number, scale=1) {
  const body=group(parent,x,y,z,scale)
  k.ball(body,0.15,0.16,0.14,0,0,0,'steel')
  for (const side of [-1,1]) k.cylinder(body,0.145,0.055,side*0.18,0,0,'alloy','x')
  k.cylinder(body,0.043,0.21,0,0.17,0,'silver')
  const wheel=group(body,0,0.28,0)
  k.ring(wheel,0.17,0.029,0,0,0,'orange','y')
  for (let i=0;i<3;i++) k.rod(wheel,[0,0,0],[0.16*Math.cos(2*i*Math.PI/3),0,0.16*Math.sin(2*i*Math.PI/3)],0.018,'orange')
  return {body,wheel}
}

export function pump(k: Kit, parent: Object3D, x=0, z=0, scale=1) {
  const body=group(parent,x,0,z,scale)
  const drive=motor(k,body,-0.42,0,0.85,'teal')
  const y=0.448
  k.box(body,0.52,0.1,0.51,0.58,0.07,0,'graphite',true)
  k.cylinder(body,0.34,0.42,0.57,y,0,'blue','x',32)
  k.cylinder(body,0.3,0.09,0.82,y,0,'alloy','x')
  k.cylinder(body,0.125,0.32,1.01,y,0,'blue','x')
  k.cylinder(body,0.215,0.07,1.17,y,0,'steel','x')
  k.cylinder(body,0.12,0.39,0.49,0.76,0,'blue')
  k.cylinder(body,0.19,0.075,0.49,0.965,0,'alloy')
  for (let i=0;i<6;i++) {
    const a=i*Math.PI/3
    k.cylinder(body,0.025,0.025,0.877,y+0.24*Math.cos(a),0.24*Math.sin(a),'graphite','x',6)
  }
  return {body,shaft:drive.shaft}
}

export function vessel(k: Kit, parent: Object3D, x: number, z: number, radius: number, height: number, clear=true) {
  const body=group(parent,x,0,z)
  k.cylinder(body,radius*1.06,0.1,0,0.065,0,'graphite')
  k.cylinder(body,radius,0.09,0,0.15,0,'steel')
  const water=group(body,0,0.19,0)
  k.cylinder(water,radius*0.92,height,0,height/2,0,clear?'water':'teal','y',36)
  water.scale.y=0.45
  if (clear) k.cylinder(body,radius,height,0,0.19+height/2,0,'glass','y',40)
  else k.cylinder(body,radius,height,0,0.19+height/2,0,'porcelain','y',40)
  for (const level of [0.2,0.19+height]) k.ring(body,radius,0.035,0,level,0,'steel','y')
  for (const side of [-1,1]) k.rod(body,[side*radius,0.2,0],[side*radius,0.22+height,0],0.03,'steel')
  if (!clear) k.ball(body,radius,height*0.11,radius,0,0.19+height,0,'alloy')
  else {
    k.box(body,0.105,height,0.025,0,0.19+height/2,radius*1.015,'graphite')
    for (let j=0;j<9;j++) k.box(body,j%2 ? 0.052:0.084,0.012,0.012,-0.004,0.2+j*height/8,radius*1.015+0.017,'white')
  }
  return {body,water,setLevel:(v:number)=>{water.visible=v>0; water.scale.y=clamp(v,0.001,1)}}
}

export function transformer(k: Kit, parent: Object3D, x=0, z=0, scale=1) {
  const body=group(parent,x,0,z,scale)
  k.box(body,1.7,0.15,0.97,0,0.09,0,'graphite',true)
  k.box(body,1.48,0.94,0.81,0,0.64,0,'teal',true)
  for (let i=0;i<12;i++) {
    const xx=(i-5.5)*0.113
    k.box(body,0.047,0.72,1.02,xx,0.64,0,'green',true)
  }
  k.box(body,1.68,0.11,1.02,0,1.15,0,'alloy',true)
  for (let i=0;i<3;i++) {
    const xx=(i-1)*0.48
    k.cylinder(body,0.074,0.3,xx,1.35,0,'porcelain')
    for(let j=0;j<3;j++) k.cylinder(body,0.128,0.04,xx,1.23+j*0.082,0,'white','y',20,0.67)
    k.cylinder(body,0.048,0.075,xx,1.535,0,'copper')
  }
  return body
}

export function cabinet(k: Kit, parent: Object3D, w: number, h: number, d: number, finish: Finish='porcelain') {
  const body=group(parent)
  k.box(body,w*0.94,0.11,d*0.92,0,0.055,0,'graphite',true)
  k.box(body,w,h-0.11,d,0,(h+0.11)/2,0,finish,true)
  k.box(body,w*0.94,h*0.89,0.025,0,h*0.53,d/2+0.008,'graphite',true)
  k.box(body,w*0.91,h*0.87,0.035,0,h*0.53,d/2+0.027,finish,true)
  k.box(body,0.038,h*0.13,0.047,w*0.34,h*0.57,d/2+0.06,'graphite',true)
  k.slats(body,4,w*0.55,Math.min(0.075,h*0.039),0,h*0.23,d/2+0.052)
  return body
}

export function lamp(k: Kit, parent: Object3D, x: number, y: number, z: number, scale=1, lens: Finish='mint') {
  const body=group(parent,x,y,z,scale)
  k.cylinder(body,0.18,0.095,0,0.048,0,'graphite')
  k.cylinder(body,0.153,0.11,0,0.13,0,'alloy')
  const bulb=k.ball(body,0.146,0.19,0.146,0,0.235,0,lens)
  return {body,bulb}
}

export function panel(k: Kit, parent: Object3D, x: number, z: number, scale=1, rows=3, cols=6) {
  const body=group(parent,x,0,z,scale)
  k.box(body,1.3,0.075,0.93,0,0.045,0,'graphite',true)
  for (const side of [-1,1]) k.rod(body,[side*0.48,0.08,-0.28],[side*0.48,0.63,-0.28],0.04,'steel')
  const deck=group(body,0,0.53,0)
  deck.rotation.x=-Math.PI*0.35
  k.box(deck,1.72,1.02,0.07,0,0,-0.02,'alloy',true)
  k.box(deck,1.65,0.95,0.02,0,0,0.03,'solar')
  for (let i=1;i<cols;i++) k.box(deck,0.012,0.94,0.009,-0.825+i*1.65/cols,0,0.045,'ice')
  for (let i=1;i<rows;i++) k.box(deck,1.64,0.012,0.009,0,-0.475+i*0.95/rows,0.045,'ice')
  for (let i=0;i<cols;i++) for (const t of [-0.23,0.23]) {
    k.box(deck,0.004,0.91,0.006,-0.825+(i+0.5+t)*1.65/cols,0,0.046,'steel')
  }
  return {body,deck}
}

export function turbine(k: Kit, parent: Object3D, x=0, z=0, scale=1) {
  const body=group(parent,x,0,z,scale)
  k.cylinder(body,0.37,0.13,0,0.075,0,'alloy')
  k.cylinder(body,0.12,1.94,0,1.1,0,'white','y',24,0.62)
  k.box(body,0.3,0.25,0.53,0,2.08,-0.08,'porcelain',true)
  const rotor=group(body,0,2.08,0.25)
  const outline:[number,number][]=[[0,0.02],[0.11,0.21],[0.115,0.51],[0.045,0.98],[-0.015,1.02],[-0.064,0.34],[-0.05,0.12]]
  for (let i=0;i<3;i++) {
    const b=k.profile(rotor,outline,0.045,'white')
    b.rotation.z=2*Math.PI*i/3+0.22
  }
  k.ball(rotor,0.14,0.14,0.17,0,0,0.035,'teal')
  return {body,rotor}
}

export function battery(k: Kit, parent: Object3D, x=0, z=0, scale=1, count=4) {
  const body=group(parent,x,0,z,scale)
  const w=0.29*count+0.22
  k.box(body,w,0.1,0.82,0,0.055,0,'graphite',true)
  const cells=[]
  for (let i=0;i<count;i++) {
    const xx=(i-(count-1)/2)*0.29
    const cell=group(body,xx,0,0)
    k.box(cell,0.267,0.75,0.63,0,0.48,0,i%2 ? 'teal':'green',true)
    k.box(cell,0.267,0.08,0.64,0,0.86,0,'graphite',true)
    for (const side of [-1,1]) k.cylinder(cell,0.049,0.06,0,0.93,side*0.18,side*(i%2?1:-1)>0?'copper':'steel','y',12)
    if(i<count-1) k.box(cell,0.3,0.028,0.075,0.145,0.97,i%2?0.18:-0.18,'copper',true)
    cells.push(cell)
  }
  for (const zSide of [-1,1]) k.box(body,w,0.07,0.035,0,0.47,zSide*0.33,'alloy')
  return {body,cells}
}

export function conveyor(k: Kit, parent: Object3D, x: number, z: number, length: number, width=0.69) {
  const body=group(parent,x,0,z)
  for (const sx of [-1,1]) for (const sz of [-1,1]) {
    k.box(body,0.106,0.45,0.106,sx*(length/2-0.23),0.24,sz*(width/2-0.065),'alloy')
    k.box(body,0.19,0.055,0.17,sx*(length/2-0.23),0.03,sz*(width/2-0.065),'graphite',true)
  }
  k.box(body,length,0.19,width,0,0.51,0,'graphite',true)
  for (const side of [-1,1]) k.box(body,length,0.12,0.05,0,0.48,side*width/2,'teal',true)
  const n=Math.max(5, Math.floor(length/0.215))
  for (let i=0;i<n;i++) k.cylinder(body,0.051,width*0.92,-length/2+0.13+i*(length-0.26)/(n-1),0.605,0,'steel','z',16)
  return body
}

export function insulator(k: Kit, parent: Object3D, x: number, y: number, z: number, h=0.34) {
  k.cylinder(parent,h*0.1,h,x,y+h/2,z,'steel')
  for (let j=0;j<4;j++) k.cylinder(parent,h*0.27,h*0.12,x,y+h*(0.19+j*0.19),z,'ice','y',16,0.7)
}

export function gauge(k: Kit, parent: Object3D, radius: number, x: number, y: number, z: number) {
  const face=group(parent,x,y,z)
  k.cylinder(face,radius,0.09,0,0,0,'graphite','z',36)
  k.cylinder(face,radius*0.91,0.018,0,0,0.056,'white','z',36)
  for (let i=0;i<9;i++) {
    const a=(i-4)*Math.PI/6
    const m=k.box(face,0.014,radius*0.12,0.008,Math.sin(a)*radius*0.76,Math.cos(a)*radius*0.76,0.072,'ink')
    m.rotation.z=-a
  }
  const needle=group(face,0,0,0.085)
  k.box(needle,radius*0.052,radius*0.68,0.012,0,radius*0.32,0,'orange')
  k.cylinder(face,radius*0.09,0.018,0,0,0.1,'graphite','z')
  return {body:face,needle}
}

export function board(k: Kit, parent: Object3D, w: number, d: number) {
  const body=group(parent)
  for (const x of [-1,1]) for (const z of [-1,1]) {
    k.cylinder(body,0.06,0.13,x*(w/2-0.13),0.08,z*(d/2-0.13),'copper','y',6)
    k.cylinder(body,0.049,0.025,x*(w/2-0.13),0.188,z*(d/2-0.13),'silver','y',6)
  }
  k.box(body,w,0.065,d,0,0.14,0,'pcb',true)
  return group(body,0,0.18,0)
}

export function trace(k: Kit,p: Object3D, coords: [number,number][], color: Finish='mint', width=0.022) {
  for (let i=1;i<coords.length;i++) k.rod(p,[coords[i-1][0],0.009,coords[i-1][1]],[coords[i][0],0.009,coords[i][1]],width,color,8)
}

export function capacitor(k: Kit, parent: Object3D, x: number, z: number, r=0.17, h=0.61) {
  const body=group(parent,x,0,z)
  k.cylinder(body,r,h,0,h/2,0,'blue','y',28)
  k.cylinder(body,r*0.91,0.022,0,h+0.011,0,'silver')
  k.box(body,r*1.25,0.009,0.017,0,h+0.025,0,'graphite')
  k.box(body,0.017,0.009,r*1.25,0,h+0.025,0,'graphite')
  k.box(body,0.047,h*0.76,0.01,0,h/2,r,'ice')
  return body
}

export function inductor(k: Kit,p: Object3D,x: number,z: number,scale=1) {
  const body=group(p,x,0,z,scale)
  k.ring(body,0.265,0.087,0,0.32,0,'graphite')
  const pts: [number,number,number][]=[]
  for (let i=0;i<=128;i++) {
    const a=2*Math.PI*i/128, b=15*a
    pts.push([(0.266+0.097*Math.cos(b))*Math.cos(a),0.32+(0.266+0.097*Math.cos(b))*Math.sin(a),0.096*Math.sin(b)])
  }
  k.hose(body,pts,0.025,'copper')
  return body
}

export function plaque(k: Kit,p:Object3D,text:string,w:number,x:number,y:number,z:number) {
  return faceUp(k.label(p,text,w,0.17,x,y,z,'#eaf0e7','#354749'))
}
