import { BoxGeometry, CatmullRomCurve3, ConeGeometry, Group, InstancedMesh, Mesh, MeshBasicMaterial, Object3D, TubeGeometry, Vector3 } from 'three'
import type { Snapshot } from '../../core/types'
import { clamp, Kit } from './kit'
import { inks, phenomena } from './phenomena'
import {value} from './signals'

export function fieldLayer(kit:Kit,parent:Group) {
  const root=new Group();parent.add(root)
  const ownedGeometry:TubeGeometry[]=[], paints:MeshBasicMaterial[]=[], batches:InstancedMesh[]=[]
  const dummy=new Object3D(),up=new Vector3(0,1,0),point=new Vector3(),along=new Vector3()
  for(const [index,channel] of phenomena(kit.lesson.id).entries()){
    const curve=new CatmullRomCurve3(channel.points.map(value=>new Vector3(...value)),false,'centripetal')
    const tint=inks[channel.ink], glow=new MeshBasicMaterial({color:tint,toneMapped:false}),glass=new MeshBasicMaterial({color:tint,transparent:true,opacity:.27,depthWrite:false,toneMapped:false})
    paints.push(glow,glass)
    const tube=new TubeGeometry(curve,Math.max(24,channel.points.length*3),.012,6,false);ownedGeometry.push(tube);root.add(new Mesh(tube,glass))
    const isLevel=channel.mode==='level',size=isLevel?16:5
    const markers=new InstancedMesh(isLevel?kit.geometry('field-segment',()=>new BoxGeometry(.073,.050,.054)):kit.geometry('field-tip',()=>new ConeGeometry(.063,.18,7)),glow,size)
    markers.frustumCulled=false;batches.push(markers);root.add(markers)
    const seedPhase=channel.mode==='oscillate'?0:index*.157
    let phase=seedPhase,amplitude=0
    const paint=()=>{
      const magnitude=clamp(Math.abs(amplitude));markers.count=amplitude===0?0:isLevel?Math.ceil(magnitude*size):size
      for(let mark=0;mark<markers.count;mark++){
        const seed=(mark+.45)/size
        let position=seed
        if(channel.mode==='travel')position=((seed+phase)%1+1)%1
        if(channel.mode==='oscillate')position=.5+.49*Math.sin(phase+channel.phase+mark*.10)
        curve.getPointAt(position,point);curve.getTangentAt(position,along)
        if(channel.mode==='oscillate'?Math.cos(phase+channel.phase+mark*.10)<0:amplitude<0)along.negate()
        dummy.position.copy(point);dummy.quaternion.setFromUnitVectors(up,along);dummy.scale.setScalar(isLevel?1:.70+.4*magnitude);dummy.updateMatrix();markers.setMatrixAt(mark,dummy.matrix)
      }
      markers.instanceMatrix.needsUpdate=true
    }
    kit.respond((state,_focus,dt)=>{const value=channel.read(state);const reset=dt<0||state.action==='init';if(reset)phase=seedPhase;const next=Number.isFinite(value)?value:0;if(reset||amplitude!==next){amplitude=next;paint()}else if(!amplitude)markers.count=0})
    kit.motions.push((_state,seconds)=>{if(!root.visible||isLevel||amplitude===0)return;phase+=(channel.mode==='oscillate'?3.15:Math.sign(amplitude)*(.21+.57*clamp(Math.abs(amplitude))))*seconds;paint()})
  }
  return {root,dispose(){batches.forEach(batch=>batch.dispose());ownedGeometry.forEach(geom=>geom.dispose());paints.forEach(material=>material.dispose());root.removeFromParent()}}
}

export function scopeDisplays(kit:Kit,parent:Group) {
  const id=kit.lesson.id
  if(id===23){
    const recorder=kit.tag(new Group(),'replay');recorder.position.set(-.11,1.38,-.62);parent.add(recorder)
    kit.box(recorder,.17,.88,.12,0,-.57,-.03,'steel')
    kit.box(recorder,1.82,.94,.12,0,0,0,'graphite',true)
    kit.label(recorder,'I A    /    −40 … +260 ms',1.49,.13,0,.36,.067,'#a7edd6','#20363a')
    kit.scope(recorder,1.62,.55,0,-.004,.068,0,{x:[-40,260],y:[-6,6],cursor:s=>s.memory.cursor})
    kit.label(recorder,'TRIP',.36,.095,-.41,-.35,.068,'#ebe9d5','#283936')
    kit.label(recorder,'52a',.32,.095,.36,-.35,.068,'#ebe9d5','#283936')
    const trip=kit.ball(recorder,.042,.042,.02,-.68,-.35,.071,'off'),closed=kit.ball(recorder,.042,.042,.02,.1,-.35,.071,'off')
    kit.light(trip,s=>value(s,/^跳闸命令$/)===1,'hot');kit.light(closed,s=>value(s,/^断路器合位$/)===1)
    return
  }
  if(id!==31&&id!==32)return
  const scope=new Group();scope.position.set(.57,1.55,-.88);parent.add(scope)
  kit.box(scope,1.51,.83,.075,0,0,0,'graphite',true)
  kit.label(scope,'P (W)   /   U (V)',1.12,.12,0,.32,.043,'#8cf3d1','#203238')
  kit.scope(scope,1.37,.56,0,-.039,.045,id===31?1:0)
  const marker=kit.ball(scope,.044,.044,.025,0,0,.058,'amber');marker.userData.mutable=true
  kit.respond((state:Snapshot)=>{const points=state.frame.plots?.[id===31?1:0]?.points;if(!points?.length)return;const xx=points.map(pair=>pair[0]),yy=points.map(pair=>pair[1]);const minX=Math.min(...xx),maxX=Math.max(...xx),minY=Math.min(...yy),maxY=Math.max(...yy);const voltage=state.frame.meters[0][1],power=state.frame.meters[id===31?2:1][1];marker.position.x=1.37*((12+376*(voltage-minX)/(maxX-minX||1))/400-.5);marker.position.y=-.039+.56*(.5-(160-140*(power-minY)/(maxY-minY||1))/180)})
}
