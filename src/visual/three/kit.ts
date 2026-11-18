import {
  BoxGeometry, BufferGeometry, CanvasTexture, CatmullRomCurve3, Color, CylinderGeometry,
  DoubleSide, ExtrudeGeometry, Group, InstancedMesh, Mesh, MeshBasicMaterial,
  MeshStandardMaterial, Object3D, PlaneGeometry, Quaternion, Shape, SphereGeometry,
  SRGBColorSpace, TorusGeometry, TubeGeometry, Vector3,
} from 'three'
import type { Material } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import type { Lesson, Snapshot } from '../../core/types'

export const palette = {
  porcelain: '#e6ebe7', white: '#f5f4e9', alloy: '#a6b7b9', steel: '#819498',
  silver: '#d4dbd9', graphite: '#29393d', rubber: '#263033', dark: '#14272b',
  teal: '#087675', blue: '#316b82', green: '#4d9079', mint: '#89c7b7',
  copper: '#bb794c', amber: '#ef843e', orange: '#ef692b', yellow: '#e4bd57',
  red: '#ac5148', ice: '#b6d5d7', water: '#549dba', glass: '#c8e4df',
  pcb: '#256758', solar: '#274957', ink: '#304346', off: '#536565',
  on: '#64e2b6', warn: '#ffab4c', hot: '#ef705c',
} as const
export type Finish = keyof typeof palette
export type Point = [number, number, number]
type Axis = 'x' | 'y' | 'z'
type Response = (snapshot: Snapshot, focused: number, dt: number, reduced: boolean) => void
const up = new Vector3(0, 1, 0)
const quarter = Math.PI / 2
export const clamp = (n: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n))

export function group(parent: Object3D, x = 0, y = 0, z = 0, scale = 1) {
  const g = new Group()
  g.position.set(x, y, z)
  g.scale.setScalar(scale)
  parent.add(g)
  return g
}

export function asPart<T extends Object3D>(object: T, index: number) {
  if (index >= 0) object.userData.part = index
  return object
}

export class Kit {
  readonly root = new Group()
  readonly actions: Response[] = []
  readonly motions: ((state:Snapshot,seconds:number)=>void)[]=[]
  readonly anchors: Object3D[] = []
  readonly partGeometry = new Map<string, Object3D[]>()
  private readonly geos = new Map<string, BufferGeometry>()
  private readonly finishes = new Map<Finish, MeshStandardMaterial>()
  private readonly signalPaint = new Set<MeshStandardMaterial>()
  private readonly printed = new Set<MeshBasicMaterial>()
  private readonly textures = new Set<CanvasTexture>()
  private readonly instances: InstancedMesh[] = []
  private readonly labels = new Map<string, MeshBasicMaterial>()
  constructor(readonly lesson: Lesson) {}

  material(name: Finish) {
    const existing = this.finishes.get(name)
    if (existing) return existing
    const metal = ['alloy','steel','silver','copper'].includes(name)
    const lit = name === 'on' || name === 'warn' || name === 'hot'
    const mat = new MeshStandardMaterial({
      color: palette[name], metalness: metal ? 0.48 : 0.04,
      roughness: metal ? 0.34 : name === 'solar' || name === 'water' ? 0.3 : 0.55,
      transparent: name === 'glass', opacity: name === 'glass' ? 0.22 : 1,
      depthWrite: name !== 'glass', ...(name === 'glass' ? { side: DoubleSide } : {}),
      emissive: lit ? new Color(palette[name]) : 0x000000, emissiveIntensity: lit ? 0.52 : 0,
    })
    this.finishes.set(name, mat)
    return mat
  }

  geometry(key: string, create: () => BufferGeometry) {
    let geo = this.geos.get(key)
    if (!geo) { geo = create(); this.geos.set(key, geo) }
    return geo
  }

  mesh(parent: Object3D, geometry: BufferGeometry, finish: Finish, x = 0, y = 0, z = 0) {
    const m = new Mesh(geometry, this.material(finish))
    m.position.set(x, y, z)
    m.castShadow = finish !== 'glass'
    m.receiveShadow = true
    parent.add(m)
    return m
  }

  box(p: Object3D, w: number, h: number, d: number, x: number, y: number, z: number, f: Finish, rounded = false) {
    const geo = rounded
      ? this.geometry('rounded', () => new RoundedBoxGeometry(1, 1, 1, 1, 0.055))
      : this.geometry('box', () => new BoxGeometry(1, 1, 1))
    const m = this.mesh(p, geo, f, x, y, z)
    m.scale.set(w, h, d)
    return m
  }

  cylinder(p: Object3D, radius: number, length: number, x: number, y: number, z: number, f: Finish, axis: Axis = 'y', segments = 24, topRatio = 1) {
    const geo = this.geometry('cyl/' + segments + '/' + topRatio, () => new CylinderGeometry(topRatio, 1, 1, segments))
    const m = this.mesh(p, geo, f, x, y, z)
    m.scale.set(radius, length, radius)
    if (axis === 'x') m.rotation.z = -quarter
    if (axis === 'z') m.rotation.x = quarter
    return m
  }

  ball(p: Object3D, rx: number, ry: number, rz: number, x: number, y: number, z: number, f: Finish) {
    const m = this.mesh(p, this.geometry('sphere', () => new SphereGeometry(1, 20, 12)), f, x, y, z)
    m.scale.set(rx, ry, rz)
    return m
  }

  ring(p: Object3D, radius: number, tube: number, x: number, y: number, z: number, f: Finish, axis: Axis = 'z') {
    const ratio = Number((tube / radius).toFixed(3))
    const geo = this.geometry('ring/' + ratio, () => new TorusGeometry(1, ratio, 8, 36))
    const m = this.mesh(p, geo, f, x, y, z)
    m.scale.setScalar(radius)
    if (axis === 'y') m.rotation.x = quarter
    if (axis === 'x') m.rotation.y = quarter
    return m
  }

  rod(p: Object3D, a: Point, b: Point, radius: number, f: Finish, segments = 12) {
    const direction = new Vector3(b[0]-a[0], b[1]-a[1], b[2]-a[2])
    const m = this.cylinder(p, radius, direction.length(), (a[0]+b[0])/2, (a[1]+b[1])/2, (a[2]+b[2])/2, f, 'y', segments)
    m.quaternion.setFromUnitVectors(up, direction.normalize())
    return m
  }

  hose(p: Object3D, points: Point[], radius: number, f: Finish) {
    const key = 'hose/' + radius + '/' + points.join('|')
    const geo = this.geometry(key, () => new TubeGeometry(new CatmullRomCurve3(points.map(pt => new Vector3(...pt))), Math.max(12, points.length * 5), radius, 8, false))
    return this.mesh(p, geo, f)
  }

  profile(p: Object3D, contour: [number,number][], depth: number, f: Finish) {
    const key = 'profile/' + depth + '/' + contour.join('|')
    return this.mesh(p, this.geometry(key, () => {
      const shape = new Shape()
      contour.forEach(([x,y],i) => i ? shape.lineTo(x,y) : shape.moveTo(x,y))
      shape.closePath()
      const geo = new ExtrudeGeometry(shape, { depth, bevelEnabled: false })
      geo.translate(0,0,-depth/2)
      return geo
    }), f)
  }

  /** Print on a physical face. Size is in model space, never a screen-space billboard. */
  label(p: Object3D, value: string, width: number, height: number, x: number, y: number, z: number, color = '#eaf1eb', ground = '#263a3d') {
    const key = [value,width/height,color,ground].join('|')
    let mat = this.labels.get(key)
    if (!mat) {
      const canvas = document.createElement('canvas')
      canvas.height = 72
      canvas.width = Math.max(64, Math.min(1024, Math.round(72 * width / height)))
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = ground
        ctx.fillRect(0,0,canvas.width,72)
        ctx.fillStyle = color
        ctx.font = '600 46px "Segoe UI", "Microsoft YaHei", sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(value, canvas.width/2, 38, canvas.width * 0.92)
      }
      const texture = new CanvasTexture(canvas)
      texture.colorSpace = SRGBColorSpace
      texture.anisotropy = 4
      this.textures.add(texture)
      mat = new MeshBasicMaterial({map: texture, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -1})
      this.printed.add(mat)
      this.labels.set(key,mat)
    }
    const print = new Mesh(this.geometry('plane',() => new PlaneGeometry(1,1)),mat)
    print.scale.set(width,height,1)
    print.position.set(x,y,z)
    p.add(print)
    return print
  }

  slats(p: Object3D, count: number, w: number, spacing: number, x: number, y: number, z: number, f: Finish = 'dark') {
    for (let i=0; i<count; i++) this.box(p, w, spacing*0.36, 0.018, x, y + (i-(count-1)/2)*spacing, z, f)
  }

  display(p:Object3D,w:number,h:number,x:number,y:number,z:number,read:(s:Snapshot)=>string) {
    const canvas=document.createElement('canvas')
    canvas.width=360; canvas.height=Math.max(64,Math.round(360*h/w))
    const context=canvas.getContext('2d')
    const map=new CanvasTexture(canvas)
    map.colorSpace=SRGBColorSpace
    this.textures.add(map)
    const mat=new MeshBasicMaterial({map,toneMapped:false})
    this.printed.add(mat)
    const face=new Mesh(this.geometry('plane',()=>new PlaneGeometry(1,1)),mat)
    face.scale.set(w,h,1); face.position.set(x,y,z)
    p.add(face)
    let last:string|undefined
    this.respond(s=>{
      const next=read(s)
      if(!context || next===last) return
      last=next
      context.fillStyle='#183236';context.fillRect(0,0,canvas.width,canvas.height)
      context.fillStyle='#b5f3d4';context.font='600 '+Math.floor(canvas.height*0.67)+'px Consolas, "Microsoft YaHei", monospace'
      context.textAlign='center';context.textBaseline='middle'
      context.fillText(next,180,canvas.height*0.53,335)
      map.needsUpdate=true
    })
    return face
  }

  tag<T extends Object3D>(object: T, role: string) {
    const roles = this.partGeometry.get(role) ?? []
    roles.push(object)
    this.partGeometry.set(role, roles)
    return object
  }

  respond(fn: Response) { this.actions.push(fn) }

  light(mesh: Mesh, test: (s: Snapshot) => boolean, lit: Finish = 'on', off: Finish = 'off') {
    mesh.userData.mutable = true
    const a = this.material(lit), b = this.material(off)
    this.respond(s => { mesh.material = test(s) ? a : b })
    return mesh
  }

  intensity(mesh:Mesh,read:(s:Snapshot)=>number,lit:Finish,off:Finish) {
    const paint=this.material(off).clone(), from=new Color(palette[off]), to=new Color(palette[lit])
    this.signalPaint.add(paint); mesh.userData.mutable=true; mesh.material=paint
    this.respond(s=>{
      const t=clamp(read(s))
      paint.color.copy(from).lerp(to,t)
      paint.emissive.copy(to);paint.emissiveIntensity=t*0.7
    })
  }

  scope(p:Object3D,w:number,h:number,x:number,y:number,z:number,index=0,axes?:{x:[number,number];y:[number,number];cursor:(state:Snapshot)=>number}) {
    const canvas=document.createElement('canvas')
    canvas.width=400;canvas.height=180
    const ctx=canvas.getContext('2d'), map=new CanvasTexture(canvas)
    map.colorSpace=SRGBColorSpace
    const material=new MeshBasicMaterial({map,toneMapped:false})
    this.printed.add(material);this.textures.add(map)
    const face=new Mesh(this.geometry('plane',()=>new PlaneGeometry(1,1)),material)
    face.scale.set(w,h,1);face.position.set(x,y,z);p.add(face)
    let previous:Snapshot|undefined
    this.respond(s=>{
      if(!ctx || previous===s) return
      previous=s
      ctx.fillStyle='#183234';ctx.fillRect(0,0,400,180)
      ctx.lineWidth=1;ctx.strokeStyle='#355557';ctx.beginPath()
      for(let j=0;j<9;j++){ctx.moveTo(10+j*47.5,10);ctx.lineTo(10+j*47.5,165)}
      for(let j=0;j<5;j++){ctx.moveTo(10,10+j*38.75);ctx.lineTo(390,10+j*38.75)}
      ctx.stroke()
      const points=s.frame.plots?.[index]?.points.filter(([xx,yy])=>Number.isFinite(xx)&&Number.isFinite(yy))
      if(points?.length) {
        let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity
        for(const [xx,yy] of points){minX=Math.min(minX,xx);maxX=Math.max(maxX,xx);minY=Math.min(minY,yy);maxY=Math.max(maxY,yy)}
        if(axes){[minX,maxX]=axes.x;[minY,maxY]=axes.y}
        if(maxY===minY){minY-=1;maxY+=1}
        ctx.strokeStyle='#a9efd0';ctx.lineWidth=4;ctx.beginPath()
        points.forEach(([xx,yy],j)=>{
          const px=12+376*(xx-minX)/(maxX-minX||1),py=160-140*(yy-minY)/(maxY-minY)
          if(j)ctx.lineTo(px,py);else ctx.moveTo(px,py)
        })
        ctx.stroke()
        if(axes){const cursor=12+376*clamp((axes.cursor(s)-minX)/(maxX-minX));ctx.beginPath();ctx.strokeStyle='#ffc75d';ctx.lineWidth=4;ctx.moveTo(cursor,12);ctx.lineTo(cursor,162);ctx.stroke()}
      }
      map.needsUpdate=true
    })
  }

  /** Batch repeated static hardware within its parent so pick owners and moving assemblies survive. */
  batch() {
    const parents: Object3D[] = []
    this.root.traverse(p => { if (p.children.length >= 3) parents.push(p) })
    for (const p of parents) {
      const sets = new Map<string, Mesh<BufferGeometry,Material>[]>()
      for (const child of p.children) {
        if (!(child instanceof Mesh) || Array.isArray(child.material) || child.children.length || child.material.transparent || child.userData.mutable || child.userData.part !== undefined) continue
        const key = child.geometry.uuid + child.material.uuid
        const set = sets.get(key) ?? []
        set.push(child as Mesh<BufferGeometry,Material>)
        sets.set(key,set)
      }
      for (const set of sets.values()) {
        if (set.length < 3) continue
        const first = set[0]
        const batch = new InstancedMesh(first.geometry,first.material,set.length)
        set.forEach((child,i) => { child.updateMatrix(); batch.setMatrixAt(i,child.matrix); p.remove(child) })
        batch.castShadow = first.castShadow
        batch.receiveShadow = first.receiveShadow
        batch.computeBoundingSphere()
        p.add(batch)
        this.instances.push(batch)
      }
    }
  }

  dispose() {
    this.instances.forEach(i => i.dispose())
    this.geos.forEach(g => g.dispose())
    this.finishes.forEach(m => m.dispose())
    this.signalPaint.forEach(m => m.dispose())
    this.printed.forEach(m => m.dispose())
    this.textures.forEach(t => t.dispose())
    this.root.clear()
    this.actions.length = 0
    this.motions.length=0
    this.anchors.length = 0
    this.partGeometry.clear()
  }
}

export const faceUp = (object: Object3D) => { object.quaternion.copy(new Quaternion().setFromAxisAngle(new Vector3(1,0,0), -quarter)); return object }
