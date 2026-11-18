import { useId } from 'react'
import { At, Target, Wire, brass, cream, ink, mist, paper, petrol, rust, sea } from './ink'
import { Plate, Equipment, getStudy, type Gear, type Site } from './scenes'
import { Actor, ActionHand, type Pose, type Mood } from './people'
import { BenchEdge, Location } from './locations'
import { Evidence } from './evidence'
import { Operation } from './operations'
import { partPoint } from './focus'

export { HeroArt } from './hero'

export function CourseArt({ id }: { id: number }) {
  const scene = getStudy(id)
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 100" width="160" height="100" role="img" aria-label={`${scene.title}，设备轴测图`}>
    <g transform="translate(4 10)"><g fill="none" stroke={petrol} opacity=".20" strokeWidth=".65">
      <path d="m4 66 88 13 54-22m-123 8 58-22 62 12" strokeDasharray="4 3"/>
      <path d="m7 66 6 1m-3-3-1 5m129-17 6 1m-3-3-1 5"/></g>
      <Plate scene={scene}/></g>
  </svg>
}

const fieldSites: Partial<Record<Gear, Site>> = {
  cabinet:'power',stairs:'building',house:'grid',substation:'grid',factory:'machine',grille:'building',
  blower:'building',tank:'water',floats:'water',pump:'water',belt:'line',packer:'line',crate:'store',lightbox:'building',drum:'machine',
  stacker:'store',racks:'store',server:'power',pv:'roof',evse:'road',car:'road',crossing:'road',door:'building',
}
const shotNames = ['小岚在工位上发现问题','周工指出部件位置','小岚对照原理草图','操作台近景','小岚核对测量结果','周工比较复验记录','两人换到应用现场','回看记录与部件']
const arrivalPoses: Pose[] = ['think','show','notes','point']
const reactionMoods: Mood[] = ['curious','intent','startled']

function GearView({ name, x, y, s }: { name: Gear; x: number; y: number; s: number }) {
  return <At x={x} y={y} s={s}><Equipment name={name}/></At>
}

// The UI passes the zero-based story index and the same part index used in its 3D workbench.
export function ComicArt({ id, panel, focus, label }: { id: number; panel: number; focus: number; label: string }) {
  const scene = getStudy(id)
  const stage = Number.isFinite(panel) ? Math.max(0,Math.trunc(panel)) : 0
  const detail = scene.detail[focus] ?? scene.detail[0]
  const secondary = scene.items.find(([gear])=>gear!==detail)?.[0] ?? scene.application
  const [px,py] = partPoint(id,focus)
  const targetX = 65 + 2.35*px, targetY = 1 + 2.35*py
  const reversed = id%3===0
  const site = fieldSites[scene.application] ?? scene.site
  const atBench = ['bench','machine','power','line'].includes(scene.site)
  const clip = `ee-wedge-${useId().replace(/[^\w-]/g,'')}`
  const alt = `${scene.title}，${shotNames[stage] ?? '补充观察'}。${label ? `观察${label}。` : ''}`
  let drawing
  switch (stage) {
    case 0:
      drawing = <><Location site={scene.site}/>
        <Actor who="zhou" x={reversed?21:226} y={25} scale={.70} left={!reversed} pose={reversed?'notes':'point'}/>
        {atBench && <BenchEdge y={104}/>}
        <At x={reversed?12:51} y={24} s={1.18}><Plate scene={scene}/></At>
        <Actor who="lan" x={reversed?253:2} y={42} scale={1.01} left={reversed} pose={arrivalPoses[id%4]} mood="curious"/>
      </>;break
    case 1:
      drawing = <><Location site={scene.site} distant/><path d="M0 116 255 79l18 9v52H0Z" fill={paper}/>
        <Actor who="zhou" x={-40} y={33} scale={1.72} pose="point"/>
        <GearView name={detail} x={65} y={1} s={2.35}/>
        <Target x={targetX} y={targetY} r={9}/><Wire d={`M${targetX+7} ${targetY-7} 173 24h26`} color={rust} weight={.9}/>
        <GearView name={secondary} x={186} y={11} s={.91}/>
        <ActionHand x={targetX+12} y={targetY+6} angle={5} scale={1.46} who="zhou"/>
      </>;break
    case 2:
      drawing = <><path d="M0 0h260v140H0Z" fill={mist}/><path d="M19 12 242 1l13 122-222 18Z" fill={paper} stroke={ink} strokeWidth="1.4"/>
        <path d="m26 18 209-10M39 132l205-16" fill="none" stroke={sea} strokeWidth=".8"/>
        <At x={47} y={17} s={1.52}><Evidence id={id}/></At>
        <Actor who="lan" x={-31} y={63} scale={1.42} pose="notes" mood="curious"/>
        <path d="m200 116 36-8 2 3-36 8-6-.3Z" fill={brass} stroke={ink} strokeWidth=".85"/>
      </>;break
    case 3:
      drawing = <Operation id={id} scene={scene} detail={detail} other={secondary} focus={focus}/>;break
    case 4:
      drawing = <><path d="M0 0h260v140H0Z" fill={paper}/>
        <defs><clipPath id={clip}><path d="M0 0h108L78 140H0Z"/></clipPath></defs>
        <g clipPath={`url(#${clip})`}><path d="M0 0h110v140H0Z" fill="#e8c69e"/>
          <g stroke={rust} opacity=".53"><path d="m6 4 20 20M0 27l20 8M80 0l-8 19m28 4L80 31M0 61l15-7"/></g>
          <Actor who="lan" x={-16} y={28} scale={2.08} pose={id%3===0?'think':'pause'} mood={reactionMoods[id%3]}/></g>
        <path d="m108 0-30 140" fill="none" stroke={ink} strokeWidth="2"/>
        <At x={98} y={14} s={1.27}><Evidence id={id} fault/></At>
        <GearView name={detail} x={158} y={78} s={1.05}/><Wire d="m111 108 18-12 24 4" color={rust} weight={1.2}/>
      </>;break
    case 5:
      drawing = <><Location site={site}/><GearView name={scene.application} x={6} y={25} s={1.69}/>
        <GearView name={id===2?'supply':detail} x={103} y={19} s={1.15}/><Actor who="zhou" x={251} y={14} scale={1.28} left pose="show" mood="pleased"/>
        <g transform="matrix(.85 -.13 .24 .51 15 109)"><path d="M-3-2h129v62H-3Z" fill={cream} stroke={ink}/><Evidence id={id}/></g>
      </>;break
    case 6:
      drawing = <><Location site={site}/><GearView name={scene.application} x={91} y={7} s={2.02}/>
        <GearView name={id===2?'supply':secondary} x={9} y={24} s={1.08}/><GearView name={id===2?'meter':detail} x={194} y={46} s={.93}/>
        <Actor who="lan" x={-12} y={69} scale={1.06} back pose="point"/><Actor who="zhou" x={254} y={77} scale={.95} left back pose="notes"/>
      </>;break
    case 7:
      drawing = <><path d="M0 0h260v140H0Z" fill={petrol}/><path d="m-6 22 143-17 14 114-146 21Z" fill={paper} stroke={ink} strokeWidth="2"/>
        <g transform="translate(4 24) rotate(-7 66 38)"><Evidence id={id}/></g>
        <path d="m13 96 109-13m-108 21 79-10" fill="none" stroke={sea}/><ActionHand x={23} y={105} scale={.93} pencil/>
        <path d="m149 103 59 14 54-21-49-11Z" fill={mist}/><GearView name={detail} x={147} y={13} s={1.86}/>
      </>;break
    default:
      drawing = <><Location site={site}/><Actor who={stage%2?'zhou':'lan'} x={8} y={9} scale={1.40} pose="notes" mood="intent"/>
        <GearView name={stage%2?detail:scene.application} x={114} y={11} s={2.02}/><At x={70} y={78} s={.8}><Evidence id={id} fault={stage%2===0}/></At>
      </>
  }
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 140" width="260" height="140" role="img" aria-label={alt} style={{display:'block',width:'100%',height:'100%'}}>{drawing}</svg>
}
