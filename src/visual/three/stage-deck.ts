import {CanvasTexture, Group, Mesh, MeshStandardMaterial, PlaneGeometry, SRGBColorSpace} from 'three'
import type {Kit} from './kit'

export function stageDeck(kit:Kit,parent:Group){
  const root=new Group(),canvas=document.createElement('canvas')
  parent.add(root);canvas.width=1024;canvas.height=620
  const ctx=canvas.getContext('2d')
  if(ctx){
    ctx.fillStyle='#34484d';ctx.fillRect(0,0,1024,620)
    for(let column=0;column<=32;column++){const offset=column*32;ctx.fillStyle=column%4?'#3c5156':'#486066';ctx.fillRect(offset,0,1,604);ctx.fillRect(0,offset,1024,1)}
    ctx.strokeStyle='#7f9698';ctx.lineWidth=2;ctx.strokeRect(16,16,992,588)
    ctx.fillStyle='#a4b7b3';ctx.font='14px monospace'
    for(let tick=0;tick<49;tick++){const left=32+tick*20;ctx.fillRect(left,581,1,tick%4?6:14);if(tick%8===0)ctx.fillText(String(tick/8).padStart(2,'0'),left+4,594)}
    ctx.fillStyle='#23363a';ctx.fillRect(30,30,270,47);ctx.fillStyle='#ffc475';ctx.fillRect(30,30,5,47)
    ctx.font='bold 18px monospace';ctx.fillText('FIELD LAB   /   '+String(kit.lesson.id).padStart(2,'0'),49,61)
    for(const left of [36,977])for(const top of [95,545]){ctx.fillStyle='#87a7a1';ctx.fillRect(left-6,top,12,2);ctx.fillRect(left,top-5,2,12)}
  }
  const texture=new CanvasTexture(canvas);texture.colorSpace=SRGBColorSpace;texture.anisotropy=4
  const surface=new MeshStandardMaterial({map:texture,roughness:.9,metalness:.03}),plane=new PlaneGeometry(4.16,2.52)
  const face=new Mesh(plane,surface);face.receiveShadow=true;face.rotation.x=-Math.PI/2;face.position.set(0,-.003,.15);root.add(face)
  kit.box(root,4.19,.086,2.55,0,-.051,.15,'graphite',true)
  for(const side of [-1,1])for(const end of [-1,1]){kit.cylinder(root,.035,.012,side*2.015,.004,.15+end*1.185,'steel','y',12);kit.box(root,.036,.005,.007,side*2.015,.012,.15+end*1.185,'dark')}
  return {root,dispose(){texture.dispose();surface.dispose();plane.dispose();root.removeFromParent()}}
}
