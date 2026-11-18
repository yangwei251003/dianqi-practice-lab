import type { Object3D } from 'three'
import { group, Kit, type Finish } from './kit'

export function disconnect(k:Kit,p:Object3D) {
  const body=group(p)
  k.box(body,0.91,0.92,0.57,0,0.49,0,'porcelain',true)
  k.box(body,0.87,0.87,0.08,0,0.51,0.306,'yellow',true)
  for(const x of [-0.365,0.365]) for(const y of [0.17,0.85]) k.cylinder(body,0.027,0.018,x,y,0.356,'steel','z',10)
  k.cylinder(body,0.287,0.065,0,0.51,0.371,'red','z',32)
  const handle=group(body,0,0.51,0.425)
  k.box(handle,0.129,0.52,0.135,0,-0.039,0,'red',true)
  k.box(handle,0.045,0.092,0.012,0,0.126,0.071,'white')
  return {body,handle}
}

export function terminals(k:Kit,p:Object3D,count:number,finish:Finish='porcelain',spring=false) {
  const body=group(p),width=count*0.164
  k.box(body,width+0.18,0.054,0.5,0,0.035,0,'steel')
  for(let i=0;i<count;i++) {
    const x=(i-(count-1)/2)*0.164
    k.box(body,0.155,0.36,0.46,x,0.23,0,finish,true)
    for(const z of [-0.133,0.133]) {
      k.cylinder(body,0.048,0.013,x,0.416,z,'dark')
      if(spring) k.box(body,0.071,0.027,0.053,x,0.423,z*0.45,'orange',true)
      else k.box(body,0.062,0.013,0.012,x,0.427,z,'steel')
    }
    k.box(body,0.078,0.086,0.01,x,0.205,0.235,'dark',true)
  }
  return body
}

export function contactor(k:Kit,p:Object3D,coils=3) {
  const body=group(p)
  k.box(body,0.79,0.98,0.57,0,0.49,0,'graphite',true)
  k.box(body,0.78,0.66,0.31,0,0.51,0.25,'porcelain',true)
  for(const row of [-1,1]) for(let i=0;i<coils;i++) {
    const x=(i-(coils-1)/2)*0.72/coils
    k.box(body,0.69/coils,0.18,0.39,x,0.51+row*0.375,0.15,'porcelain',true)
    k.cylinder(body,0.06,0.014,x,0.51+row*0.369,0.351,'graphite','z',16)
    k.box(body,0.07,0.012,0.013,x,0.51+row*0.369,0.362,'steel')
  }
  k.box(body,0.66,0.21,0.032,0,0.54,0.422,'graphite')
  const armature=group(body,0,0.55,0.44)
  k.box(armature,0.245,0.13,0.067,0,0,0,'teal',true)
  k.box(body,0.51,0.053,0.018,-0.03,0.715,0.417,'mint')
  return {body,armature}
}

export function breaker(k:Kit,p:Object3D,poles=3) {
  const body=group(p)
  const pitch=0.255,w=pitch*poles
  k.box(body,w+0.03,0.83,0.47,0,0.43,0,'graphite',true)
  for(let i=0;i<poles;i++) {
    const x=(i-(poles-1)/2)*pitch
    k.box(body,pitch-0.013,0.86,0.45,x,0.44,0.10,'porcelain',true)
    for(const y of [0.12,0.75]) {
      k.cylinder(body,0.057,0.015,x,y,0.331,'dark','z',18)
      k.box(body,0.065,0.012,0.01,x,y,0.343,'steel')
    }
    k.box(body,pitch*0.78,0.27,0.04,x,0.45,0.336,'dark')
  }
  const handle=group(body,0,0.47,0.356)
  k.box(handle,w*0.86,0.092,0.16,0,0,0.046,'graphite',true)
  return {body,handle}
}

export function controller(k:Kit,p:Object3D,style:'modular'|'compact'|'monitor'='compact') {
  const body=group(p), light=style==='modular'
  const w=style==='monitor'?0.99:1.53,h=0.88,d=0.6
  k.box(body,w,h,d,0,h/2,0,light?'porcelain':'graphite',true)
  if(style==='monitor') {
    k.box(body,w*0.88,0.74,0.06,0,0.45,0.322,'dark',true)
    k.box(body,0.66,0.25,0.03,-0.018,0.57,0.365,'ice',true)
    for(let i=0;i<4;i++) k.cylinder(body,0.051,0.025,(i-1.5)*0.15,0.29,0.37,'alloy','z')
  } else {
    const slices=light?5:2
    for(let j=0;j<slices;j++) {
      const sw=w/slices,x=(j-(slices-1)/2)*sw
      k.box(body,sw-0.017,h*0.77,0.064,x,h/2,0.325,light?'porcelain':'steel',true)
      k.box(body,sw-0.024,0.12,0.013,x,0.7,0.364,light?'teal':'graphite')
    }
    for(let i=0;i<12;i++) {
      const x=(i-5.5)*0.111
      for(const y of [0.09,0.8]) k.cylinder(body,0.024,0.018,x,y,0.309,'dark','z',12)
    }
    for(let i=0;i<3;i++) k.cylinder(body,0.021,0.013,-0.62,0.54-i*0.072,0.368,'green','z',12)
  }
  return body
}

export function driveUnit(k:Kit,p:Object3D,finish:Finish='porcelain') {
  const body=group(p)
  k.box(body,0.82,1.32,0.56,0,0.69,0,'graphite',true)
  for(let i=0;i<8;i++) k.box(body,0.075,1.14,0.68,(i-3.5)*0.103,0.67,-0.06,'steel')
  k.box(body,0.87,1.38,0.49,0,0.71,0.18,finish,true)
  k.box(body,0.64,0.64,0.04,0,0.9,0.44,'graphite',true)
  k.box(body,0.45,0.145,0.018,0,1.095,0.468,'ice',true)
  for(const [x,y] of [[0,0.94],[-0.085,0.865],[0.085,0.865],[0,0.79]]) k.cylinder(body,0.041,0.019,x,y,0.47,'alloy','z',16)
  for(const i of [-1,1]) k.cylinder(body,0.037,0.015,i*0.18,0.69,0.467,i===1?'red':'green','z')
  k.slats(body,4,0.55,0.066,0,0.33,0.435)
  return body
}
