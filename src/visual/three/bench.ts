import type { Object3D } from 'three'
import { asPart, faceUp, group, Kit } from './kit'
import { controlPosition } from './signals'

/** Four elastomer feet, a recessed shell joint, and a removable top plate. Deck surface is y=0. */
export function bench(k: Kit) {
  const p=k.root
  for (const x of [-3.36,3.36]) for (const z of [-1.43,1.43]) {
    k.cylinder(p,0.2,0.16,x,-0.393,z,'rubber')
    k.cylinder(p,0.21,0.06,x,-0.295,z,'steel')
  }
  k.box(p,7.77,0.23,3.83,0,-0.227,0,'graphite',true)
  k.box(p,7.83,0.075,3.88,0,-0.138,0,'rubber',true)
  k.box(p,7.88,0.13,3.93,0,-0.068,0,'porcelain',true)
  k.box(p,1.16,0.043,0.018,-2.52,-0.214,1.917,'teal')
  for (const x of [-3.67,3.67]) for (const z of [-1.7,1.7]) {
    k.cylinder(p,0.054,0.012,x,0.004,z,'steel','y',18)
    k.box(p,0.052,0.005,0.011,x,0.013,z,'dark')
  }
  k.box(p,2.23,0.13,2.28,-2.39,0.063,-0.45,'alloy',true)
  k.box(p,2.17,0.058,2.22,-2.39,0.15,-0.45,'graphite',true)
  k.box(p,1.91,0.034,0.35,-2.39,0.025,0.99,'graphite',true)
  faceUp(k.label(p,k.lesson.device.model,1.78,0.23,-2.39,0.044,0.99,'#f3f2e7','#263a3d'))
  return {
    reference:group(p,-2.39,0.18,-0.48),
    application:group(p,1.17,0.004,-0.48),
  }
}

export function operatorPanel(k: Kit) {
  const {lesson}=k
  const width=Math.min(6.9, Math.max(3.7,lesson.parts.length*1.18+0.32))
  const consoleBody=group(k.root,0,0.015,1.48)
  k.box(consoleBody,width,0.14,0.65,0,0.07,0,'graphite',true)
  const pitch=(width-0.2)/Math.max(1,lesson.parts.length)
  lesson.parts.forEach((part,i) => {
    const x=(i-(lesson.parts.length-1)/2)*pitch
    const pod=asPart(group(consoleBody,x,0.145,-0.052),i)
    const control=lesson.controls.find(c=>c.id===part.control)
    const preset=control?.kind==='choice'&&part.value!==undefined&&lesson.parts.some((other,j)=>j!==i&&other.control===part.control)
    const press=control?.kind==='button'||preset
    const bezel=k.cylinder(pod,0.172,0.047,0,0.028,0,'alloy','y',32)
    bezel.userData.mutable=true
    const knob=group(pod,0,0.067,0)
    knob.userData.actuator=true
    if (press) {
      k.cylinder(knob,0.128,0.092,0,0.03,0,'orange','y',28,0.93)
      k.cylinder(knob,0.091,0.012,0,0.081,0,'amber')
    } else {
      k.cylinder(knob,0.125,0.098,0,0.032,0,'graphite','y',20)
      k.box(knob,0.068,0.08,0.213,0,0.104,0,'orange',true)
      k.box(knob,0.029,0.012,0.056,0,0.15,-0.066,'white')
    }
    const pilot=k.cylinder(pod,0.034,0.015,Math.min(0.245,pitch*0.35),0.012,0,'off')
    k.light(pilot,s=>controlPosition(control,part,s,preset)>0)
    const code=String(i+1).padStart(2,'0')
    faceUp(k.label(pod,code,0.22,0.105,-Math.min(0.25,pitch*0.36),0.008,0,'#ebeee8','#29393d'))
    faceUp(k.label(pod,part.label,Math.min(1.03,pitch*0.92),0.143,0,0.009,0.24))
    const marker=group(pod,0,0.24,0)
    k.anchors[i]=marker
    k.respond((s,selected)=>{
      const v=controlPosition(control,part,s,preset)
      if(press) knob.position.y=0.067-v*0.054
      else knob.rotation.y=(v-0.5)*Math.PI*1.36
      bezel.material=k.material(selected===i?'warn':'alloy')
    })
  })
}

export function bindParts(k:Kit, assignment: Record<string,string | number> = {}) {
  for (const [name, objects] of k.partGeometry) {
    const key=assignment[name] ?? name
    const idx=typeof key==='number' ? key : k.lesson.parts.findIndex(p=>p.control===key || p.label===key)
    if (idx<0 || idx>=k.lesson.parts.length) continue
    objects.forEach((object:Object3D)=>asPart(object,idx))
  }
}
