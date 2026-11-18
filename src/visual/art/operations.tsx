import { Actor, ActionHand } from './people'
import { Arrow, At, Mark, Target, Wire, brass, cream, ink, mist, paper, petrol, rust, sea } from './ink'
import { Equipment, type Gear, type Study } from './scenes'
import { Evidence } from './evidence'
import { partPoint } from './focus'

function ObjectView({ name, x, y, s }: { name: Gear; x:number; y:number; s:number }) {
  return <At x={x} y={y} s={s}><Equipment name={name}/></At>
}

function PenProbe({ x, y, angle, color }: { x:number; y:number; angle:number; color:string }) {
  return <g transform={`translate(${x} ${y}) rotate(${angle})`} stroke={ink} strokeLinejoin="round" strokeWidth="1.15">
    <path d="M0 0 9-1v2Z" fill={paper}/><path d="M9-2h4v-2h3v1h16l6 3-6 3H16v1h-3V2H9Z" fill={color}/>
    <path d="M36 0q11 2 18 11t25 12" fill="none" stroke={color} strokeWidth="2.4"/></g>
}

function Knob() {
  return <g stroke={ink} strokeWidth="1.25" strokeLinejoin="round"><path d="m0 20 27-12 37 8-25 13Z" fill={mist}/><path d="m0 20 39 9 25-13v6L39 35 0 26Z" fill={sea}/>
    <ellipse cx="29" cy="19" rx="11" ry="4" fill={ink}/><path d="M20 16q8-6 18 0v4q-9 5-18 0Z" fill={petrol}/><ellipse cx="29" cy="16" rx="9" ry="3.5" fill={brass}/>
    <path d="m29 16 7-1.5m-21 4-3 .3m4-6-2-1.7m10-1.5-.6-2m11 3 1-2" fill="none"/>
  </g>
}

export function Operation({ id, scene, detail, other, focus }: { id:number; scene:Study; detail:Gear; other:Gear; focus:number }) {
  const [px,py] = partPoint(id,focus)
  const base = <><path d="M0 0h260v140H0Z" fill="#e2e6d5"/><path d="m0 23 91-14 169 31v100H0Z" fill={paper}/>
    <path d="m0 23 91-14 169 31m-253 77 86 16 130-26" fill="none" stroke={petrol} strokeWidth=".8"/></>
  if (id===2) return <>{base}<ObjectView name="supply" x={-2} y={0} s={1.38}/><ObjectView name="lamp" x={117} y={-1} s={1.8}/><ObjectView name="lamp" x={40} y={38} s={1.75}/>
    <Wire d="M18 50q-8 21 9 29l39 14m-39-40q35-19 117 6" color={petrol} weight={2}/><PenProbe x={100} y={98} angle={13} color={ink}/><PenProbe x={145} y={65} angle={-8} color={rust}/><ActionHand x={169} y={59} angle={2} scale={1.3} grip/></>
  if (scene.gesture==='code') return <>{base}<Actor who="zhou" x={-23} y={63} scale={1.43} back/>
    <g transform="translate(46 11) rotate(-3 64 35)" stroke={ink} strokeWidth="1.6"><path d="M0 1h133l-2 74H2Z" fill={petrol}/><rect x="5" y="6" width="122" height="62" fill="#e1ebd6"/>
      <At x={7} y={7} s={.93}><Evidence id={id}/></At><path d="m2 75 129-1 13 11-153 3Z" fill={mist}/><path d="m9 78 101-1m-97 5 98-1" stroke={petrol}/></g>
    <ObjectView name={detail} x={170} y={13} s={1.40}/><ActionHand x={121} y={91} scale={1.73} angle={3}/></>
  if (scene.gesture==='log'||scene.gesture==='trace') return <>{base}<ObjectView name={detail} x={5} y={8} s={2.1}/>
    <g transform="rotate(5 178 64)"><path d="M109 18h131v92H109Z" fill={mist} stroke={ink}/><path d="M108 14h127v92H108Z" fill={cream} stroke={ink}/>
      <At x={109} y={27} s={.97}><Evidence id={id}/></At><path d="M117 88h78m-78 6h60" stroke={sea}/></g>
    <ActionHand x={159} y={86} scale={1.56} pencil angle={-3} who="zhou"/>
    {scene.gesture==='trace'&&<Wire d={`M${5+2.1*px} ${8+2.1*py}q7 14 21 13l29-8`} color={rust} weight={1.2} dash="3 2"/>}</>
  if (scene.gesture==='probe') return <>{base}<ObjectView name="meter" x={5} y={2} s={1.58}/><ObjectView name="continuity" x={82} y={12} s={2.04}/>
    <PenProbe x={129} y={72} angle={150} color={ink}/><PenProbe x={152} y={78} angle={12} color={rust}/><ActionHand x={174} y={77} angle={2} scale={1.46} grip/></>
  if (scene.gesture==='move') return <>{base}<ObjectView name={other} x={161} y={-2} s={1.02}/><ObjectView name={detail} x={19} y={2} s={2.13}/>
    <g transform="rotate(-8 124 105)" stroke={ink}><path d="M26 96h133v12H26Z" fill={brass}/>{Array.from({length:24},(_,i)=><path key={i} d={`M${31+i*5.3} 97v${i%5===0?7:3}`} strokeWidth=".75"/>)}</g>
    <Arrow x={125} y={58} length={29} angle={-13}/><ActionHand x={112} y={78} angle={5} scale={1.8} grip/></>
  if (scene.gesture==='turn'||scene.gesture==='select') return <>{base}<ObjectView name={detail} x={5} y={5} s={2.23}/><ObjectView name={other} x={137} y={4} s={1.05}/>
    <At x={117} y={68} s={1.24}><Knob/></At><path d="M139 80q8-14 28-12l-4-3m4 3-3 4" fill="none" stroke={rust} strokeWidth="1.5"/>
    <ActionHand x={150} y={80} scale={1.7} grip angle={4}/></>
  if (scene.gesture==='press') return <>{base}<ObjectView name={detail==='buttons'?other:detail} x={6} y={0} s={2.02}/>
    <ObjectView name="buttons" x={98} y={27} s={1.86}/><ActionHand x={132} y={69} angle={-6} scale={1.72}/><Arrow x={127} y={53} angle={68} length={9}/></>
  return <>{base}<ObjectView name={detail} x={7} y={4} s={2.03}/><path d="m111 19 130 5-4 76-131-6Z" fill={cream} stroke={ink}/>
    <At x={114} y={29} s={1.01}><Evidence id={id}/></At><Target x={7+px*2.03} y={4+py*2.03} r={8}/><ActionHand x={137} y={88} scale={1.55} pencil who="zhou"/></>
}
