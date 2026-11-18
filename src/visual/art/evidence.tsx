import type { ReactNode } from 'react'
import { Arrow, At, Dial, Mark, Rotor, Wire, brass, blue, cream, ink, mist, paper, petrol, rust, sea } from './ink'
import { Equipment } from './scenes'

function Plot({ unit, axis = 't', line, other, children }: { unit: string; axis?: string; line:string; other?: string; children?: ReactNode }) {
  return <><path d="M13 6v45h104" fill="none"/><path d="M13 22h100m-100 15h100m-75-29v42m25-42v42m25-42v42" stroke={sea} opacity=".5" fill="none" strokeWidth=".7" strokeDasharray="2 2"/>
    {other && <Wire d={other} color={blue} weight={1.45} dash="3 2"/>}<Wire d={line} weight={2.25} color={rust}/>
    <Mark x={2} y={8} size={6.5}>{unit}</Mark><Mark x={115} y={59} size={6.5}>{axis}</Mark>{children}</>
}

function Bulb({ x, y, on = true }: { x:number; y:number; on?:boolean }) {
  return <g transform={`translate(${x} ${y})`}><circle r="6.7" fill={on?brass:paper}/><path d="m-4-4 8 8m-8 0 8-8"/></g>
}
function Node({ x, y, on = true }: { x:number; y:number; on?:boolean }) {
  return <circle cx={x} cy={y} r="2.4" fill={on?ink:paper}/>
}
function Contact({ x, y, closed = false }: { x:number; y:number; closed?:boolean }) {
  return <g transform={`translate(${x} ${y})`}><path d="M-8 0h6m4 0h6m-10-4v8m4-8v8" fill="none"/>{closed&&<path d="m-5 5 10-10" stroke={rust}/>}</g>
}
function TankSection({ level, floats = false, fault = false }: { level:number; floats?:boolean; fault?:boolean }) {
  return <><path d="M15 9v39q0 3 4 3h37q4 0 4-4V9" fill={paper} strokeWidth="1.6"/>
    <path d={`M16 ${level}q6-2 11 0t11 0t11 0t10 0v${49-level}H16Z`} fill={sea} stroke="none"/>
    <path d={`M16 ${level}q6-2 11 0t11 0t11 0t10 0`} fill="none" stroke={blue}/>
    {floats?<><path d="M29 8v11m16-11v28"/><circle cx="29" cy="21" r="3.2" fill={fault?paper:brass}/><circle cx="45" cy="38" r="3.2" fill={brass}/><path d="M60 21h7m-7 17h7" stroke={rust}/></>:<><path d="M34 7v33" strokeWidth="1.7"/><rect x="31.8" y="39" width="4.5" height="7" rx="1.2" fill={petrol}/><path d="M21 12v32m-1-30h3m-3 7h3m-3 7h3m-3 7h3m-3 7h3" strokeWidth=".8"/></>}
  </>
}
function Timing({ rows }: { rows: ReadonlyArray<readonly [label:string, path:string, color?:string]> }) {
  return <>{rows.map(([label,path,color],i)=><g key={label} transform={`translate(24 ${11+i*15})`}>
    <Mark x={-22} y={4} size={6.3}>{label}</Mark><path d="M0 6h92" stroke={sea} strokeWidth=".65"/><Wire d={path} weight={1.9} color={color??petrol}/>
  </g>)}<path d="M23 52h94m-4-2 4 2-4 2" fill="none"/><Mark x={114} y={60}>t</Mark></>
}
function SmallGear({ name, x, y, s = .62 }: { name: Parameters<typeof Equipment>[0]['name']; x:number; y:number; s?:number }) {
  return <At x={x} y={y} s={s}><Equipment name={name}/></At>
}
function FlowBus({ right, solar = false }: { right: boolean; solar?: boolean }) {
  return <><SmallGear name={solar?'pv':'train'} x={0} y={1} s={.79}/><SmallGear name={solar?'evse':'train'} x={77} y={-1} s={.68}/><SmallGear name="battery" x={50} y={28} s={.61}/>
    <path d="M27 37h62m-29 0v8" fill="none" strokeWidth="1.7"/><Node x={60} y={37}/><Arrow x={right?61:49} y={26} angle={right?0:180} length={19}/>
    <Arrow x={69} y={right?30:45} angle={right?90:-90} length={12} color={petrol}/></>
}
function Pulse({ d, second, a = 'U', b = 'I' }: { d: string; second: string; a?:string; b?:string }) {
  return <Timing rows={[[a,d,rust],[b,second,petrol]]}/>
}

// Each plate isolates one relationship the student can see on this particular rig.
// Diagrams occupy a 124 × 62 field. Equations and lesson dialogue live in HTML.
export function Evidence({ id, fault = false }: { id:number; fault?:boolean }) {
  let drawing: ReactNode
  switch (id) {
    case 1: drawing = <><path d="M9 15h15m16 0h24v12h18M9 40h15m16 0h24V27" fill="none"/>
      {[15,40].map((y,i)=><g key={y}><Node x={24} y={y}/><Node x={40} y={y}/><Wire d={`M25 ${y-1}l14 ${i&&!fault?0:-8}`} color={i?rust:ink}/></g>)}
      <circle cx="94" cy="27" r="12" fill={paper}/><Mark x={94} y={31} size={12} center>V</Mark><Node x={64} y={27}/>
      <Mark x={4} y={12}>I</Mark><Mark x={3} y={37}>II</Mark>{fault&&<><path d="M75 48h37" stroke={rust}/><Mark x={85} y={46} color={rust}>0 V ?</Mark></>}</>;break
    case 2: drawing = !fault?<><path d="M12 38V23h96v15" fill="none"/><Bulb x={40} y={23}/><Bulb x={79} y={23}/><Mark x={12} y={48}>+</Mark><Mark x={106} y={48}>−</Mark></>:<><path d="M13 30h14V13H98v17h13M27 30v16h71V30" fill="none"/><Bulb x={63} y={13}/><Bulb x={63} y={46}/><Node x={27} y={30}/><Node x={98} y={30}/><Mark x={7} y={33}>+</Mark><Mark x={113} y={32}>−</Mark></>;break
    case 3: drawing = <>{[0,1,2].map(i=><g key={i}><rect x="13" y={8+i*16} width="14" height="9" fill={mist}/><rect x="97" y={8+i*16} width="14" height="9" fill={paper}/><Mark x={20} y={15+i*16} center>{i+1}</Mark><Mark x={104} y={15+i*16} center>{i+1}</Mark></g>)}
      <Wire d="M27 12h70"/><Wire d={fault?'M27 28h18c13 0 19 16 34 16h18':'M27 28h70'} color={rust}/><Wire d={fault?'M27 44h18c13 0 19-16 34-16h18':'M27 44h70'} color={blue}/>{fault&&<path d="M113 29q8 0 5 9l-5 6" stroke={rust} fill="none"/>}</>;break
    case 4: drawing = <><path d="M13 34h40m11 0h46m-56 0 4-4 3 5" fill="none" strokeWidth="2"/>
      {[16,43,72,105].map((x,i)=><g key={x}><Node x={x} y={34}/><Mark x={x} y={47} size={7} center>{'ABCD'[i]}</Mark></g>)}
      <path d={fault?'M43 30V15l11-5m18 20V15L61 10':'M16 30V15l11-5m16 20V15l-10-5'} fill="none" stroke={rust}/><Mark x={fault?52:24} y={9} color={rust} size={8}>{fault?'OL':'Ω'}</Mark></>;break
    case 5: drawing = <Plot unit="U꜀" line={fault?'M13 11c16 25 31 35 96 38':'M13 49c17-26 29-38 97-40'} other="M13 22h32v28"><Mark x={40} y={59}>τ</Mark><Node x={44} y={fault?38:22}/></Plot>;break
    case 6: drawing = <><g transform="translate(42 30)"><circle r="22" fill="none" stroke={sea} strokeDasharray="2 2"/>
      <Arrow x={0} y={0} angle={-90} length={22}/><Arrow x={0} y={0} angle={30} length={fault?12:22} color={blue}/><Arrow x={0} y={0} angle={150} length={22} color={petrol}/><Node x={0} y={0}/></g>
      <path d="m77 11 16 15 17-12M93 26v21" fill="none" strokeWidth="2"/><Node x={93} y={26}/><Mark x={98} y={43}>N</Mark>{fault&&<><path d="M89 38l8-5" stroke={rust} strokeWidth="2"/><Arrow x={84} y={31} angle={-30} length={11}/></>}</>;break
    case 7: drawing = <><path d="M10 8v45m104-45v45M10 20h12m16 0h12m16 0h21m13 0h14M44 20v23h7m15 0h12V20" fill="none"/><Contact x={30} y={20} closed/><Contact x={58} y={20}/><Contact x={58} y={43}/><Node x={44} y={20}/><Node x={78} y={20}/>
      <path d="M91 14q-8 6 0 12m6-12q8 6 0 12" fill="none"/><Mark x={87} y={35}>K</Mark><Mark x={49} y={55}>13–14</Mark>{fault&&<path d="m70 39 6 8m-6 0 6-8" stroke={rust} strokeWidth="1.7"/>}</>;break
    case 8: drawing = <><SmallGear name="contactor" x={5} y={4} s={.86}/><SmallGear name="contactor" x={67} y={4} s={.86}/><path d="m39 29 9-7 18 4 10-5m-34 11 8-6 17 3 9-4" fill="none" stroke={rust}/>
      <Mark x={18} y={52}>KMF</Mark><Mark x={82} y={52}>KMR</Mark>{fault?<path d="m52 37 11 11m-11 0 11-11" stroke={rust} strokeWidth="2"/>:<Arrow x={50} y={43} length={17}/>}</>;break
    case 9: drawing = <><path d="m17 10 7 7 8-7m-8 7v11m-8 7 14 11H14Z" fill="none" strokeWidth="1.7"/>
      <At x={34} y={6} s={.76}><Timing rows={[["Y","M0-2h31v8h59"],["Δ",fault?'M0 6h34v-8h56':'M0 6h51v-8h39',rust]]}/></At><path d="M44 48h60" stroke={sea}/><Mark x={52} y={56}>Y → Δ</Mark></>;break
    case 10: drawing = <><g transform="translate(42 30)"><circle r="22" fill={mist}/><circle r="15" fill={paper}/><circle r="8" fill={petrol}/><path d="M0-8v-12" stroke={rust} strokeWidth="2.2"/><path d={fault?'m5-5 9-8':'m2-7 4-12'} stroke={blue} strokeWidth="2.2"/>
      <path d="M-19-14q15-17 32-6l-2-5m2 5-5 1" fill="none"/></g><Mark x={73} y={21} size={8}>nₛ</Mark><path d="M73 26h33" stroke={rust} strokeWidth="2.7"/><Mark x={73} y={38} size={8}>n</Mark><path d={fault?'M73 43h17':'M73 43h29'} stroke={blue} strokeWidth="2.7"/></>;break
    case 11: drawing = <><Rotor x={23} y={30} r={15}/><At x={38} y={3} s={.68}><Plot unit="P" axis="n" line="M13 49C43 49 83 41 109 7"><Node x={fault?94:66} y={fault?22:39}/></Plot></At></>;break
    case 12: drawing = <Plot unit="H" axis="Q" line="M14 12C53 13 91 26 111 46" other={fault?'M15 46Q57 40 84 8':'M15 46Q79 41 109 10'}><Node x={fault?68:82} y={fault?24:29.5}/>{fault&&<path d="M15 46Q79 41 109 10" stroke={sea} fill="none"/>}</Plot>;break
    case 13: drawing = <><path d="M11 33h104M20 14v17" fill="none" strokeWidth="2"/><path d="M20 21h80" stroke={rust} strokeDasharray="3 2"/>
      <path d="m39 16 16 2v13l-16-2Z" fill={brass}/>{fault&&<path d="m55 18 16 2v13l-16-2Z" fill={paper}/>}
      <Wire d={fault?'M12 49h23v-9h39v9h35':'M12 49h23v-9h19v9h55'} color={petrol} weight={1.9}/><Arrow x={35} y={56} angle={-90} length={10}/></>;break
    case 14: drawing = <><SmallGear name="inductive" x={0} y={1} s={.97}/><g transform="rotate(-23 62 31)"><path d="M49 21q8 9 0 18m6-22q12 13 0 25m7-29q14 16 0 32" fill="none" stroke={blue}/></g>
      <path d={fault?'m78 15 10-4 23 5v17l-10 5-23-5Z':'m63 18 9-4 21 5v16l-10 5-21-5Z'} fill={fault?paper:mist}/><path d="M36 51h61m-57-3-4 3 4 3m53-6 4 3-4 3" fill="none"/><Mark x={62} y={59}>d</Mark></>;break
    case 15: drawing = <><TankSection level={fault?44:22}/><path d={fault?'M33 7h12m8 0h26v12':'M33 7h46v12'} fill="none"/><Dial x={88} y={32} r={13} angle={fault?-70:9}/><Mark x={87} y={53} center size={8}>{fault?'0 mA':'mA'}</Mark>{fault&&<path d="m45 9 5-6m.5 8 4-6" stroke={rust}/>}</>;break
    case 16: drawing = <><TankSection level={fault?23:34} floats fault={fault}/><path d="M70 20h6m-6 18h6m-2-18v18" fill="none" stroke={rust}/><SmallGear name="pump" x={77} y={17} s={.74}/><Arrow x={79} y={fault?42:31} angle={fault?-90:180} length={10}/></>;break
    case 17: drawing = <><path d="M9 37h101v6H9Z" fill={mist}/>{Array.from({length:17},(_,i)=><path key={i} d={`M${12+i*5.8} 37v${i%4===0?6:3}`} strokeWidth=".85"/>)}
      <path d="M13 28h95m-95 3h95"/><path d="M73 18h14v16H73Z" stroke={petrol} strokeDasharray="2 2" fill="none"/><rect x={fault?49:73} y="19" width="14" height="13" fill={brass}/>
      <Wire d="M13 14h4v-5h3v5h5V9h3v5h5V9h3v5h5V9h3v5h6" color={blue}/>{fault&&<Arrow x={68} y={16} angle={180} length={14}/>}</>;break
    case 18: drawing = <><path d="M13 22h45v17H13Z" fill={mist}/><path d={`M21 24h${fault?12:28}v13H21Z`} fill={sea}/><path d={`M${fault?34:50} 28h29v5h-29Z`} fill={paper}/><path d="M83 14v32m4-32v32" strokeDasharray="2 2" stroke={petrol}/>
      <Dial x={102} y={28} r={12} angle={fault?64:-27}/><path d="M97 13v-3h7v3" fill={brass}/><Arrow x={50} y={47} length={fault?12:28}/></>;break
    case 19: drawing = <><Dial x={32} y={28} r={18} angle={fault?25:6}/><Dial x={89} y={28} r={18} angle={fault?-37:2}/><Mark x={32} y={55} center size={8}>V</Mark><Mark x={89} y={55} center size={8}>Hz</Mark><path d="M53 27h13" stroke={sea} strokeDasharray="2 2"/></>;break
    case 20: drawing = <><path d="m12 35 12-22 13 22Z" fill="none" strokeWidth="1.8"/><path d="M43 12h6c9 0 9 7 0 7 9 0 9 7 0 7 9 0 9 7 0 7 9 0 9 7 0 7h-6m27-28h-3c-8 0-8 7 0 7-8 0-8 7 0 7-8 0-8 7 0 7-8 0-8 7 0 7h3m-11-30v34m3-34v34" fill="none"/>
      <path d="m82 16 12 12 13-12M94 28v17" fill="none" strokeWidth="1.8"/><Mark x={99} y={46}>N</Mark><Arrow x={34} y={fault?18:26} length={10}/></>;break
    case 21: drawing = <><circle cx="25" cy="27" r="18" fill={ink}/>{[[20,21,brass],[32,25,blue],[23,34,sea]].map(([x,y,c])=><g key={x}><circle cx={x} cy={y} r="5" fill={c as string}/><circle cx={x} cy={y} r="2.2" fill={paper}/></g>)}
      <path d="M46 18h63v26H46" fill="none" strokeWidth="1.8"/><path d="M104 24h10v12h-10Z" fill={mist}/><path d="M60 50h38m-34-3-4 3 4 3m30-6 4 3-4 3" fill="none"/>{fault&&<path d="m64 18 3-3 3 6 3-6 3 6 3-3" fill={paper} stroke={rust} strokeWidth="2"/>}</>;break
    case 22: drawing = <><path d="M10 30h32m0 0 20-17h40M42 30l23 16h38m-27-33v13h30" fill="none" strokeWidth="2"/>
      {[[13,30],[42,30],[65,13],[65,46],[103,13],[103,26],[103,46]].map(([x,y])=><Node key={`${x}-${y}`} x={x} y={y} on={x<103}/>)}
      <path d="m88 17 4-6-3 .3 3-6-8 8 4-.5-3 5Z" fill={rust} stroke={rust}/>{fault&&<Mark x={64} y={24} size={11} color={rust}>?</Mark>}</>;break
    case 23: drawing = <Timing rows={[["I>","M0 6h19v-8h51v8h20"],["TRIP",fault?'M0 6h90':'M0 6h45v-8h22v8h23',rust],["52a",fault?'M0-2h90':'M0-2h58v8h32',blue]]}/>;break
    case 24: drawing = <><path d="M14 36h80" fill="none" strokeWidth="2"/><path d={fault?'M14 36 82 49V36Z':'M14 36 82 12v24Z'} fill={fault?'#e8c8aa':mist}/><Arrow x={21} y={36} length={58} color={petrol}/><Arrow x={84} y={35} angle={fault?90:-90} length={fault?14:21}/><Mark x={50} y={45}>P</Mark><Mark x={89} y={fault?48:18}>Q</Mark>
      <path d="M103 11v10m-6 1h12m-12 4h12m-6 1v15" fill="none"/></>;break
    case 25: drawing = <Plot unit="U" line={fault?'M13 16q17 1 37 21 2-17 5-21 17 1 37 21 2-17 5-21l15 5':'M13 16q9 1 17 10 2-7 5-10 9 1 17 10 2-7 5-10 9 1 17 10 2-7 5-10 9 1 17 10 2-7 5-10l9 3'}><path d="M14 34v9m0-4h20m0-5v9" stroke={blue} fill="none"/></Plot>;break
    case 26: drawing = <Pulse d="M0 6h5v-8h18v8h18v-8h18v8h18v-8h14" second={fault?'m0 4 5 2 18-13 18 13 18-13 18 13 14-10':'m0 3 5 2 18-7 18 7 18-7 18 7 14-5'}/>;break
    case 27: drawing = <Plot unit="Iʟ" line={fault?'m13 42 15-19 8 10 10-10 8 10 10-10 8 10 10-10 8 10 10-10 10 13':'m13 44 13-15 9 9 14-16 9 9 14-16 9 9 14-15 10 9'} other="M13 23h96"><Mark x={80} y={19} color={blue}>I max</Mark></Plot>;break
    case 28: drawing = <><path d="M8 30h106" stroke={sea}/><Wire d="M10 30h5v-12h3v12h4V15h7v15h4V13h9v17h4V16h6v14h6V19h3v11h8v11h3V30h5v15h7V30h4v16h8V30h5v11h3V30h8" weight={1.45} color={petrol}/>
      <Wire d="M9 30Q35-3 60 30t52 0" color={rust} weight={1.85}/><path d={fault?'M86 29v18m-3-2 3 2 3-2':'M35 30V14m-3 3 3-3 3 3'} fill="none" stroke={blue}/></>;break
    case 29: drawing = <><path d="M23 7h67M23 49h67M31 7v8m0 6v17m0 6v5M81 7v8m0 6v17m0 6v5M31 28h18m16 0h16" fill="none"/>
      {[[31,16],[31,39],[81,16],[81,39]].map(([x,y],i)=><path key={i} d={`m${x} ${y} ${fault&&i%2===1?0:4} 6`} stroke={i===0||i===3?rust:ink} strokeWidth="1.75"/>)}
      <circle cx="57" cy="28" r="8" fill={paper}/><Mark x={57} y={31} center size={8}>M</Mark><path d="M94 20q14 4 8 17l-2-4m2 4 4-2" fill="none"/>{fault&&<path d="m96 25 12 7m-11 1 10-9" stroke={rust}/>}</>;break
    case 30: drawing = <Timing rows={[["AC","M0-2h22v8h17v-8h51",blue],["UPS","M0-2h22v8h17v-8h51",petrol],["LOAD",fault?'M0-2h30v8h9v-8h51':'M0-2h90',rust]]}/>;break
    case 31: drawing = <><SmallGear name="pv" x={-2} y={8} s={.83}/><path d={fault?'m9 31 7-14 16 3-7 15Z':'m10 29 4-8 9 2-3 8Z'} fill={ink} opacity=".65"/>
      <At x={41} y={4} s={.66}><Plot unit="P" axis="V" line="M13 49q18-12 28-31 6-7 11 8l4 12q18-4 33-20 8-6 12 14l5 17"><Node x={fault?91:43} y={fault?16:16}/></Plot></At></>;break
    case 32: drawing = <Plot unit="P" axis="V" line="M13 49q17-13 29-33 8-10 16 16l4 6q17-4 28-17 7-8 13 14l4 14">
      <path d={fault?'m79 28 7-5-3 3 8-6-2 2':'m27 36 10-14 7-8-3 5 6-5-2 2'} fill="none" stroke={blue} strokeWidth="1.9"/>
      <circle cx={fault?90:46} cy={fault?21:14} r="3" fill={brass}/></Plot>;break
    case 33: drawing = <Plot unit="P" axis="v" line="M13 49h15q14-1 25-21l8-10h27v31h21" other={fault?'M13 49h65V18h10':undefined}><path d="M78 14v35m10-35v35" stroke={sea} fill="none" strokeDasharray="2 2"/>{fault&&<Arrow x={89} y={9} angle={180} length={10}/>}</Plot>;break
    case 34: drawing = <><path d="M7 22h23v20H7Zm7-4h9v4h-9Z" fill={paper}/><path d="M10 30h17v9H10Z" fill={sea}/><At x={31} y={4} s={.72}>
      <Plot unit="Q" line={fault?'M13 17 105 38':'M13 16 106 29'} other={fault?'M13 17h92':'M13 16 106 29'}/></At></>;break
    case 35: drawing = <FlowBus right={!fault} solar/>;break
    case 36: drawing = <><SmallGear name="evse" x={0} y={2} s={.95}/><path d="M42 17h64m-64 21h64" stroke={sea} strokeDasharray="2 2"/>
      <Wire d={fault?'M44 32h18V20h15v12h29':'M44 34h16V23h19V13h27'} color={petrol} weight={1.8}/><Mark x={46} y={49}>A</Mark><Mark x={67} y={49}>B</Mark><Mark x={92} y={49} color={fault?rust:ink}>{fault?'?':'C'}</Mark></>;break
    case 37: drawing = <Timing rows={[["PIR",fault?'M0 6h14V0h3v6h28V0h3v6h42':'M0 6h14V0h3v6h73'],["L",fault?'M0 6h14v-8h58v8h18':'M0 6h14v-8h30v8h46',rust]]}/>;break
    case 38: drawing = <><Rotor x={27} y={27} r={14}/><path d="M57 11v27a6.5 6.5 0 1 0 7 0V11q-3-5-7 0Z" fill={paper}/><path d={`M60.5 ${fault?18:29}v14`} stroke={rust} strokeWidth="2.5"/><circle cx="60.7" cy="43" r="3.4" fill={rust} stroke="none"/>
      <Arrow x={74} y={28} length={fault?12:30} color={blue}/><Arrow x={106} y={39} angle={180} length={21}/><Mark x={83} y={17}>Q</Mark></>;break
    case 39: drawing = <Plot unit="CO" line={fault?'M13 43q22-23 40-24c12-1 29-6 55-9':'M13 42q23-27 42-21c14 6 18 15 48 19'} other="M13 24h96"><path d="M13 38h96" stroke={blue} strokeDasharray="3 2" fill="none"/><Mark x={94} y={47}>ppm</Mark></Plot>;break
    case 40: drawing = <><path d="M10 49V10h39v39m-35-3V14h13v32Zm17 0V14h14v32Z" fill={mist}/><path d="M11 50h39"/><path d="M13 18h33m-33 7h33m-33 7h33" stroke={rust} strokeDasharray="2 2" opacity=".75"/>
      <At x={52} y={10} s={.58}><Timing rows={[["D","M0 6h35v-8h55"],["LOCK",fault?'M0 6h90':'M0 6h46v-8h44',rust]]}/></At></>;break
    case 41: drawing = <><SmallGear name="signal" x={-1} y={2} s={.97}/><SmallGear name="signal" x={91} y={2} s={.9}/><path d="M38 21h53m-53 17h53" stroke={ink}/>
      <path d="M38 21h20" stroke={petrol} strokeWidth="6"/><path d="M59 21h7" stroke={brass} strokeWidth="6"/><path d="M67 21h23M38 38h36" stroke={rust} strokeWidth="6"/><path d="M75 38h15" stroke={fault?rust:petrol} strokeWidth="6"/>
      <path d="M67 14v32m7-32v32" strokeDasharray="2 2"/></>;break
    case 42: drawing = <FlowBus right={!fault}/>;break
    case 43: drawing = <><path d="M7 42h110v5H7Z" fill={sea}/>{[24,59,96].map(x=><g key={x}><path d={`M${x} 16v24`} stroke={rust} strokeDasharray="2 2"/><circle cx={x} cy="15" r="2.6" fill={paper}/></g>)}
      {(fault?[34,49,64]:[15,56,92]).map(x=><path key={x} d={`M${x} 26l12 2v12l-12-2Z`} fill={brass}/>)}<Arrow x={27} y={54} length={fault?12:35}/></>;break
    case 44: drawing = <><TankSection level={fault?18:31} floats/><SmallGear name="pump" x={69} y={-3} s={.60}/><SmallGear name="pump" x={80} y={24} s={.59}/><path d="M60 44h10V23h9m-9 21h21" fill="none"/>
      {fault?<path d="m86 5 13 15m-13 0L99 5" stroke={rust} strokeWidth="2.1"/>:<Arrow x={101} y={13} length={12}/>}</>;break
    case 45: drawing = <><SmallGear name="generator" x={-1} y={10} s={.85}/><path d="M38 31h22V11h16M60 31h16m-16 0v18h16" fill="none" strokeWidth="1.8"/>
      {[11,30,49].map((y,i)=><g key={y}><path d={`M77 ${y}h25`} stroke={i===2&&fault?sea:petrol} strokeWidth="3" strokeDasharray={i===2&&fault?'3 3':undefined}/><Bulb x={106} y={y} on={i!==2||!fault}/></g>)}</>;break
    case 46: drawing = <><SmallGear name="cold" x={-1} y={7} s={.85}/><At x={40} y={7} s={.66}><Plot unit="T" line={fault?'M13 40q16 1 29-11l16-14q13-7 39-5':'M13 35q12 0 25-11l10-7q19 16 47 21'} other="M13 15h95"/></At></>;break
    case 47: drawing = <><path d="M12 48h98M18 47V9m4 37V8m41 39V7m22 40V7m22 40V7M63 14h44M63 28h44m-44 13h44" fill="none" strokeWidth="1.5"/>
      <path d={fault?'M23 37h18v3H23Z':'M52 26h23v3H52Z'} fill={brass}/><path d="M27 42 73 19" stroke={blue} strokeDasharray="3 2"/><rect x="89" y="18" width="14" height="8" fill={brass}/>
      {fault&&<path d="m48 30 7 7m-7 0 7-7" stroke={rust} strokeWidth="1.8"/>}</>;break
    case 48: drawing = <><SmallGear name="pv" x={0} y={2} s={.69}/><SmallGear name="battery" x={1} y={29} s={.53}/><SmallGear name="substation" x={84} y={-2} s={.61}/><SmallGear name="evse" x={87} y={26} s={.64}/>
      <path d="M32 21h21l12 9h15m-53 13h24l14-13m0 0 11-12h11m-10 12 7 12h9" fill="none" strokeWidth="1.7"/><Node x={65} y={30}/><Arrow x={fault?78:56} y={fault?18:29} angle={fault?130:0} length={12}/></>;break
    default: drawing = null
  }
  return <g stroke={ink} strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round">{drawing}</g>
}
