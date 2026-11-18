import {
  ACESFilmicToneMapping, Box3, CanvasTexture, Color, DirectionalLight, Group, HemisphereLight,
  InstancedMesh, Mesh, MeshBasicMaterial, MeshStandardMaterial, OrthographicCamera,
  PCFShadowMap, PlaneGeometry, Raycaster, Scene, SRGBColorSpace, Vector2, Vector3, WebGLRenderer,
} from 'three'
import type { Object3D } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { Lesson, Snapshot } from '../../core/types'
import { bench, bindParts, operatorPanel } from './bench'
import { clamp, Kit } from './kit'
import { referenceDevice } from './reference'
import { buildStation } from './stations'
import { fieldLayer, scopeDisplays } from './field-layer'
import { stageDeck } from './stage-deck'

const direction = new Vector3(5.3,5.45,9.8).normalize()
const horizontal = new Vector3().crossVectors(new Vector3(0,1,0),direction).normalize()
const vertical = new Vector3().crossVectors(direction,horizontal).normalize()

function shadowMat() {
  const canvas=document.createElement('canvas')
  canvas.width=canvas.height=128
  const ctx=canvas.getContext('2d')
  if (ctx) {
    const gradient=ctx.createRadialGradient(64,64,6,64,64,63)
    gradient.addColorStop(0,'rgba(37,55,52,0.37)')
    gradient.addColorStop(0.62,'rgba(37,55,52,0.22)')
    gradient.addColorStop(1,'rgba(37,55,52,0)')
    ctx.fillStyle=gradient
    ctx.fillRect(0,0,128,128)
  }
  const map=new CanvasTexture(canvas)
  map.colorSpace=SRGBColorSpace
  return new MeshBasicMaterial({map,transparent:true,depthWrite:false})
}

/** Bounds in the catalogue camera's screen axes, using each visible assembly's own bounds. */
function framedBounds(root: Group) {
  root.updateMatrixWorld(true)
  const screen=new Box3(), v=new Vector3()
  root.traverse(obj=>{
    if (!(obj instanceof Mesh) || !obj.visible) return
    let b:Box3|null
    if(obj instanceof InstancedMesh) { obj.computeBoundingBox(); b=obj.boundingBox }
    else { if(!obj.geometry.boundingBox) obj.geometry.computeBoundingBox(); b=obj.geometry.boundingBox }
    if(!b) return
    for(const x of [b.min.x,b.max.x]) for(const y of [b.min.y,b.max.y]) for(const z of [b.min.z,b.max.z]) {
      v.set(x,y,z).applyMatrix4(obj.matrixWorld)
      screen.expandByPoint(new Vector3(v.dot(horizontal),v.dot(vertical),v.dot(direction)))
    }
  })
  const c=screen.getCenter(new Vector3()), size=screen.getSize(new Vector3())
  return { target:horizontal.clone().multiplyScalar(c.x).addScaledVector(vertical,c.y).addScaledVector(direction,c.z),
    w:size.x*1.14,h:size.y*1.24 }
}

export class Viewer {
  private readonly scene=new Scene()
  private readonly camera=new OrthographicCamera(-5,5,3,-3,0.1,90)
  private readonly renderer:WebGLRenderer
  private readonly orbit:OrbitControls
  private readonly key=new DirectionalLight(0xfff2dd,2.65)
  private readonly floor=new Mesh(new PlaneGeometry(120,120),new MeshStandardMaterial({color:0xdce4df,roughness:1}))
  private readonly contact=new Mesh(new PlaneGeometry(10.15,5.85),shadowMat())
  private readonly ray=new Raycaster()
  private readonly cursor=new Vector2()
  private readonly pinAt=new Vector3()
  private readonly pinBox=new Box3()
  private readonly owners=new Map<number,Object3D>()
  private picked?:Object3D
  private readonly resize:ResizeObserver
  private readonly reduced=window.matchMedia('(prefers-reduced-motion: reduce)')
  private get quiet(){return this.reduced.matches||document.documentElement.dataset.motion==='quiet'}
  private kit?:Kit
  private current?:Snapshot
  private layer?:ReturnType<typeof fieldLayer>
  private deck?:ReturnType<typeof stageDeck>
  private application?:Group
  private wide?:ReturnType<typeof framedBounds>
  private close?:ReturnType<typeof framedBounds>
  private detailed=true
  private running=false
  private lastFrame=0
  private focus=-1
  private frame=0
  private painted=false
  private gone=false
  private drag?:{x:number;y:number;id:number;multiple:boolean}
  private readonly fingers=new Set<number>()
  private lastPick={index:-1,time:0}
  private bounds={target:new Vector3(0,0.65,0),w:8.7,h:4.9}

  constructor(private readonly canvas:HTMLCanvasElement,private readonly pin:HTMLButtonElement,private readonly pick:(index:number,operate:boolean)=>void,private readonly fail:()=>void,private readonly ready:()=>void) {
    this.renderer=new WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power',preserveDrawingBuffer:false})
    this.renderer.outputColorSpace=SRGBColorSpace
    this.renderer.toneMapping=ACESFilmicToneMapping
    this.renderer.toneMappingExposure=1
    this.renderer.shadowMap.enabled=true
    this.renderer.shadowMap.type=PCFShadowMap
    this.renderer.shadowMap.autoUpdate=false
    this.scene.background=new Color('#e4e9e5')
    this.scene.add(new HemisphereLight(0xf4faf8,0x919e9b,2.05))
    this.key.position.set(-4,8,5)
    this.key.castShadow=true
    this.key.shadow.mapSize.set(1024,1024)
    Object.assign(this.key.shadow.camera,{left:-6,right:6,top:5.8,bottom:-5.8,near:0.5,far:22})
    this.key.shadow.bias=-0.00045
    this.key.shadow.normalBias=0.015
    this.scene.add(this.key)
    const rim=new DirectionalLight(0xe3f1ff,1.3)
    rim.position.set(4.5,3,-4)
    this.scene.add(rim)
    this.floor.rotation.x=this.contact.rotation.x=-Math.PI/2
    this.floor.position.y=-0.477
    this.contact.position.y=-0.473
    this.floor.receiveShadow=true
    this.scene.add(this.floor,this.contact)
    this.orbit=new OrbitControls(this.camera,canvas)
    this.orbit.enablePan=false
    this.orbit.enableDamping=false
    this.orbit.minPolarAngle=0.16
    this.orbit.maxPolarAngle=Math.PI*0.47
    this.orbit.minZoom=0.66
    this.orbit.maxZoom=4
    this.orbit.addEventListener('change',this.queue)
    this.resize=new ResizeObserver(this.layout)
    this.resize.observe(canvas)
    canvas.addEventListener('pointerdown',this.down)
    canvas.addEventListener('pointerup',this.up)
    canvas.addEventListener('pointercancel',this.cancel)
    canvas.addEventListener('pointermove',this.move)
    canvas.addEventListener('webglcontextlost',this.lost)
    document.addEventListener('visibilitychange',this.visibility)
    this.reduced.addEventListener('change',this.visibility)
    this.layout()
  }

  load(lesson:Lesson) {
    if(this.kit?.lesson===lesson) return
    if(this.kit) { this.layer?.dispose();this.deck?.dispose();this.scene.remove(this.kit.root); this.kit.dispose() }
    const kit=new Kit(lesson)
    this.kit=kit
    this.current=undefined
    this.focus=-1
    this.lastPick.index=-1
    this.owners.clear()
    this.picked=undefined
    const {reference,application}=bench(kit)
    referenceDevice(kit,reference)
    const mapping=buildStation(kit,application)
    scopeDisplays(kit,application)
    operatorPanel(kit)
    bindParts(kit,mapping)
    kit.batch()
    for(const subject of [application,reference]) subject.traverse(o=>{
      const i=o.userData.part
      if(typeof i==='number'&&!this.owners.has(i)) this.owners.set(i,o)
    })
    this.scene.add(kit.root)
    this.wide=framedBounds(kit.root);this.close=framedBounds(application)
    this.deck=stageDeck(kit,application)
    this.layer=fieldLayer(kit,application);this.application=application
    this.studio(this.detailed)
    this.renderer.shadowMap.needsUpdate=true
    this.home()
    this.layout()
  }

  apply(s:Snapshot,focus:number) {
    if(!this.kit || (this.current===s && this.focus===focus)) return
    const previous=this.current
    const dt=previous ? s.time-previous.time : 0
    if(this.picked?.userData.part!==focus) this.picked=undefined
    this.current=s; this.focus=focus
    this.kit.actions.forEach(apply=>apply(s,focus,dt,this.quiet))
    if(!this.running&&!this.quiet&&dt>0)this.kit.motions.forEach(move=>move(s,Math.min(dt,1)))
    this.renderer.shadowMap.needsUpdate=true
    this.queue()
  }

  studio(detailed:boolean) {
    this.detailed=detailed
    if(!this.kit||!this.application||!this.close||!this.wide)return
    for(const child of this.kit.root.children)child.visible=!detailed||child===this.application
    this.bounds=detailed?this.close:this.wide;this.floor.material.color.set(detailed?'#617b81':'#dce4df');this.contact.visible=!detailed
    if(this.deck)this.deck.root.visible=detailed
    this.floor.position.y=detailed?-.10:-.477;this.renderer.shadowMap.needsUpdate=true;this.home();this.layout()
  }
  fields(show:boolean){if(this.layer)this.layer.root.visible=show;this.queue()}
  setRunning(running:boolean){if(this.running!==running){this.running=running;this.lastFrame=0;this.queue()}}
  private visibility=()=>{this.lastFrame=0;if(!document.hidden)this.queue()}
  cutaway(enabled:boolean) {
    const jacket=this.kit?.root.getObjectByName('insulation-jacket')
    if(!jacket)return
    jacket.visible=!enabled
    this.renderer.shadowMap.needsUpdate=true
    this.queue()
  }
  home() {
    this.camera.zoom=1
    this.orbit.target.copy(this.bounds.target)
    this.camera.position.copy(this.bounds.target).addScaledVector(direction,14)
    this.camera.updateProjectionMatrix()
    this.orbit.update()
    this.queue()
  }

  zoom(factor:number) {
    this.camera.zoom=clamp(this.camera.zoom*factor,this.orbit.minZoom,this.orbit.maxZoom)
    this.camera.updateProjectionMatrix()
    this.orbit.update()
    this.queue()
  }

  private layout=()=>{
    if(this.gone) return
    const w=this.canvas.clientWidth,h=this.canvas.clientHeight
    if(w<2 || h<2) return
    const aspect=w/h, height=Math.max(this.bounds.h,this.bounds.w/aspect)
    this.camera.top=height/2; this.camera.bottom=-height/2
    this.camera.left=-height*aspect/2; this.camera.right=height*aspect/2
    this.camera.updateProjectionMatrix()
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75,Math.sqrt(1900000/(w*h))))
    this.renderer.setSize(w,h,false)
    this.queue()
  }
  private queue=()=>{
    if(this.gone || this.frame) return
    this.frame=requestAnimationFrame(stamp=>{
      this.frame=0
      if(this.gone) return
      try {
        const animate=this.running&&!document.hidden&&!this.quiet
        if(animate&&this.current&&this.lastFrame){const delta=Math.min(.15,(stamp-this.lastFrame)/1000);for(const move of this.kit?.motions??[])move(this.current,delta)}
        this.lastFrame=animate?stamp:0
        this.renderer.render(this.scene,this.camera)
        this.placePin()
        if(!this.painted&&this.kit){this.painted=true;this.ready()}
        if(animate)this.queue()
      }
      catch { this.fail() }
    })
  }
  private placePin() {
    const owner=this.picked??this.owners.get(this.focus)
    for(let branch:Object3D|null|undefined=owner??this.kit?.anchors[this.focus];branch;branch=branch.parent){if(!branch.visible){this.pin.hidden=true;return}}
    if(owner && owner.visible) {
      this.pinBox.setFromObject(owner)
      this.pinBox.getCenter(this.pinAt)
      this.pinAt.y=this.pinBox.max.y+0.037
    } else {
      const anchor=this.kit?.anchors[this.focus]
      if(!anchor){this.pin.hidden=true;return}
      anchor.getWorldPosition(this.pinAt)
    }
    this.pinAt.project(this.camera)
    const x=(this.pinAt.x+1)/2,y=(1-this.pinAt.y)/2
    this.pin.hidden=x<0.04||x>0.975||y<0.085||y>0.92
    this.pin.style.left=(x*100)+'%'
    this.pin.style.top=(y*100)+'%'
  }
  private hit(event:PointerEvent) {
    if(!this.kit) return
    const r=this.canvas.getBoundingClientRect()
    if(!r.width || !r.height) return
    this.cursor.set(2*(event.clientX-r.left)/r.width-1,1-2*(event.clientY-r.top)/r.height)
    this.ray.setFromCamera(this.cursor,this.camera)
    const hit=this.ray.intersectObject(this.kit.root,true).find(h=>{
      let obj:Object3D|null=h.object
      while(obj){if(!obj.visible||obj===this.layer?.root)return false;obj=obj.parent}
      return true
    })
    let node:Object3D|null=hit?.object ?? null,actuator=false
    while(node) {
      if(node.userData.actuator) actuator=true
      if(typeof node.userData.part==='number') return {index:node.userData.part as number,actuator,owner:node}
      node=node.parent
    }
  }
  private down=(e:PointerEvent)=>{
    if(e.button!==0) return
    this.fingers.add(e.pointerId)
    if(this.fingers.size>1) { if(this.drag) this.drag.multiple=true; return }
    this.drag={x:e.clientX,y:e.clientY,id:e.pointerId,multiple:false}
  }
  private up=(e:PointerEvent)=>{
    this.fingers.delete(e.pointerId)
    const drag=this.drag
    if(!drag || drag.id!==e.pointerId) return
    this.drag=undefined
    if(drag.multiple || Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>5) return
    const hit=this.hit(e)
    if(!hit) return
    this.picked=hit.owner
    this.queue()
    const second=hit.index===this.lastPick.index && e.timeStamp-this.lastPick.time<420
    this.lastPick={index:second?-1:hit.index,time:e.timeStamp}
    if(hit.actuator && second) return
    this.pick(hit.index,hit.actuator||second)
  }
  private cancel=(e:PointerEvent)=>{this.fingers.delete(e.pointerId); this.drag=undefined}
  private move=(e:PointerEvent)=>{
    if(e.pointerType!=='mouse' || e.buttons) return
    this.canvas.style.cursor=this.hit(e)?'pointer':'grab'
  }
  private lost=(e:Event)=>{ e.preventDefault(); if(!this.gone) this.fail() }
  dispose() {
    if(this.gone) return
    this.gone=true
    cancelAnimationFrame(this.frame)
    this.resize.disconnect()
    document.removeEventListener('visibilitychange',this.visibility);this.reduced.removeEventListener('change',this.visibility)
    this.canvas.removeEventListener('pointerdown',this.down)
    this.canvas.removeEventListener('pointerup',this.up)
    this.canvas.removeEventListener('pointercancel',this.cancel)
    this.canvas.removeEventListener('pointermove',this.move)
    this.canvas.removeEventListener('webglcontextlost',this.lost)
    this.orbit.removeEventListener('change',this.queue)
    this.orbit.dispose()
    this.layer?.dispose();this.deck?.dispose();this.kit?.dispose()
    this.key.shadow.dispose()
    this.floor.material.dispose(); this.floor.geometry.dispose()
    this.contact.material.map?.dispose(); this.contact.material.dispose(); this.contact.geometry.dispose()
    this.scene.clear()
    this.renderer.dispose()
    queueMicrotask(()=>{if(!this.canvas.isConnected)this.renderer.forceContextLoss()})
  }
}
