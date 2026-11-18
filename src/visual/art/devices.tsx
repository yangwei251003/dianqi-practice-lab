import { At, Case, Dial, Mark, Screw, Wire, brass, blue, cream, ink, mist, paper, petrol, rust, sea } from './ink'

export function Isolator() {
  return <><Case x={8} y={38} w={31} d={10} h={29} face={paper}>
    <Screw x={3} y={3}/><Screw x={28} y={26}/><rect x="7" y="5" width="19" height="18" rx="2" fill={brass}/>
    <circle cx="16.5" cy="14" r="6.5" fill={rust}/><path d="m13 16 2-7 5 1-2 8Z" fill={ink}/>
    <path d="M21 20v-3c0-4 5-4 5 0v3" fill="none"/><rect x="20" y="20" width="7" height="6" rx="1" fill={brass}/>
  </Case><path d="m16 40 1 5 4 1 1-4m9 1 1 4 4 1 1-4" fill={petrol}/></>
}

export function Lamp() {
  return <><ellipse cx="27" cy="40" rx="17" ry="5" fill={mist}/><path d="M13 34q14 6 28 0v5q-14 7-28 0Z" fill={petrol}/>
    <ellipse cx="27" cy="34" rx="14" ry="4" fill={paper}/><path d="M22 28v6q5 3 10 0v-6" fill={ink}/>
    <path d="M22 29c0-6-6-8-6-15a11 11 0 0 1 22 0c0 7-6 10-6 15q-5 3-10 0Z" fill={brass}/>
    <path d="m24 26-2-10 4 3 2-3 4 1-3 10M19 13q1-6 6-7" fill="none" strokeWidth="1"/>
    <path d="m22 30 10 1" stroke={paper}/><circle cx="21.9" cy="32" r=".9" fill={brass}/><circle cx="32.1" cy="32" r=".9" fill={brass}/><Screw x={16} y={34}/><Screw x={38} y={34}/></>
}

export function Terminals() {
  return <><Case x={2} y={33} w={38} d={13} h={3} face={paper}/>
    {[0,1,2,3,4,5].map((i)=><At key={i} x={5+i*5.5} y={i*1.21}><Case x={0} y={29} w={5.2} d={12} h={12} face={i===5?brass:mist} top={i===5?brass:paper}>
      <rect x=".8" y="5.5" width="3.5" height="3" fill={ink}/>
    </Case><Screw x={8.5} y={14.6} r={1.45}/></At>)}
    <path d="M7 25v10q0 4-5 5m16-12v9q0 4-5 5m16-11v8l5 5" fill="none" stroke={petrol} strokeWidth="1.6"/></>
}

export function Meter() {
  return <g transform="rotate(-9 26 25)"><rect x="11" y="4" width="28" height="39" rx="4" fill={brass}/>
    <path d="M15 6h20v15l-2 3H17l-2-3Z" fill={ink}/><rect x="17" y="9" width="16" height="9" rx="1" fill={mist}/>
    <path d="M19 14h4m2 0h4"/><circle cx="25" cy="29" r="6.3" fill={paper}/><path d="m23 32 3-8 2 1-3 8Z" fill={petrol}/>
    <circle cx="20" cy="39" r="1.7" fill={ink}/><circle cx="30" cy="39" r="1.7" fill={rust}/>
    <Wire d="M20 40c-9 7-18 3-14-6l3-7"/><Wire d="M30 40c5 9 17 9 18-4l1-10" color={rust}/>
    <path d="m6 28 4-10 2 1-3 11Z" fill={ink}/><path d="m47 28 2-12 3 1-2 12Z" fill={rust}/><path d="m11 18 2-5m38 3 1-5"/></g>
}

export function Scope() {
  return <><path d="M12 14V8l18-3 7 4v4" fill="none" strokeWidth="2"/><Case x={4} y={37} w={37} d={10} h={23} face={paper}>
    <rect x="3" y="3" width="23" height="15" rx="1" fill={ink}/><g stroke={sea} strokeWidth=".5"><path d="M6 8h17M6 13h17m-13-8v11m5-11v11m5-11v11"/></g>
    <Wire d="M4.5 14h4l2-7 3 6 2-4 2 2h6" color={brass} weight={1}/>
    <circle cx="31" cy="7" r="3" fill={sea}/><circle cx="31" cy="15" r="2" fill={brass}/><path d="M6 20h17"/>
  </Case><path d="m8 38-1 3 5 1 1-3m23 2-1 3 4 1 1-3" fill={ink}/></>
}

export function Breakers() {
  return <><Case x={5} y={38} w={35} d={10} h={28} face={paper}>
    {[0,1,2].map(i=><g key={i} transform={`translate(${i*11} 0)`}><path d="M11 0v28" fill="none"/><Screw x={6} y={4} r={1.8}/>
      <rect x="2" y="9" width="8" height="10" rx="1" fill={petrol}/><rect x="3" y="11" width="7" height="4" fill={ink}/>
      <path d="M3 21h6" stroke={rust}/><Screw x={6} y={25} r={1.5}/></g>)}
  </Case><path d="m8 6 5 1m6 1 5 1m6 1 5 1"/></>
}

export function Contactor() {
  return <><Case x={10} y={39} w={27} d={11} h={28} face={mist}>
    {[5,13,21].map(i=><g key={i}><rect x={i-2} y="1.5" width="4.5" height="4" fill={ink}/><rect x={i-2} y="22" width="4.5" height="4" fill={ink}/></g>)}
    <rect x="2" y="7" width="23" height="13" fill={paper}/><rect x="5" y="10" width="10" height="6" fill={petrol}/><path d="M18 10h5m-5 3h4"/>
  </Case><path d="m12 10 1-6m7 7 1-6m7 8 1-6" fill="none" stroke={petrol} strokeWidth="1.8"/></>
}

export function Plc() {
  return <><Case x={2} y={36} w={43} d={9} h={24} face={petrol}>
    <rect x="2" y="2" width="24" height="12" rx="1" fill={mist}/><rect x="4" y="4" width="14" height="6" fill={ink}/>
    <path d="M5 7h7" stroke={brass}/><path d="M29 0v24m7-24v24" stroke={ink}/>
    {[30.5,37.5].map(x=><g key={x} fill={brass} stroke="none"><circle cx={x+1} cy="5" r="1"/><circle cx={x+1} cy="9" r="1"/></g>)}
    <rect x="2" y="17" width="39" height="5" fill={paper}/>{[5,10,15,20,25,30,35,39].map(x=><circle key={x} cx={x} cy="19.5" r=".75" fill={ink}/>)}
  </Case><path d="m12 7 27 6m-22-8 27 6" strokeWidth=".85"/></>
}

export function Buttons() {
  return <><Case x={6} y={36} w={31} d={16} h={8} face={brass} top={paper}/>
    <g transform="matrix(1 .22 .38 .67 16 26)"><circle r="5" fill={ink}/><circle cy="-2" r="4" fill={sea}/></g>
    <g transform="matrix(1 .22 .38 .67 31 29)"><circle r="5" fill={ink}/><circle cy="-3" r="4.5" fill={rust}/></g>
    <Wire d="M44 37q9 2 7 7" weight={2.1}/></>
}

export function Drive() {
  return <><Case x={12} y={40} w={23} d={12} h={35} face={mist} side={ink}>
    <rect x="2" y="3" width="19" height="17" rx="1" fill={paper}/><rect x="4" y="5" width="15" height="7" fill={ink}/>
    <path d="M6 10h5l2-2h3" fill="none" stroke={brass}/><circle cx="8" cy="16" r="2" fill={sea}/><circle cx="15" cy="16" r="2" fill={rust}/>
    {[23,26,29,32].map(y=><path key={y} d={`M4 ${y}h15`} strokeWidth="1.6"/>)}
  </Case><path d="m39 13 4-2m-4 6 4-2m-4 6 4-2m-4 6 4-2m-4 6 4-2" stroke={sea}/></>
}

export function Relay() {
  return <Case x={4} y={36} w={35} d={12} h={27} face={petrol}>
    <rect x="2.5" y="3" width="22" height="13" rx=".8" fill={ink}/><Wire d="M5 11h4l2-5 2 7 2-4 2 1h5" color={brass} weight={.8}/>
    {[5,9,13].map(y=><circle key={y} cx="29" cy={y} r="1.2" fill={y===5?brass:mist}/>)}
    <path d="M4 20h9m-9 3h9" stroke={paper}/><path d="m21 21 3-3 3 3-3 3Z" fill={sea}/></Case>
}

export function TallCabinet() {
  return <><Case x={9} y={41} w={24} d={14} h={36} face={sea}>
    <path d="M2 2h20v32H2Z" fill={mist}/><rect x="5" y="6" width="9" height="6" fill={ink}/>
    <circle cx="17" cy="9" r="1.7" fill={brass}/><path d="M18 17v5" strokeWidth="1.8"/>
    <path d="M5 26h10m-10 2.5h10m-10 2.5h10" strokeWidth=".8"/>
  </Case><path d="m11 42 0 2 4 1v-2m15 2v2l3 1v-3" fill={ink}/></>
}

export function Supply() {
  return <Case x={5} y={37} w={35} d={11} h={23} face={paper}>
    <rect x="3" y="3" width="19" height="9" fill={ink}/><Mark x={6} y={10} size={6} color={brass}>DC</Mark>
    <Dial x={29} y={8} r={4.6} angle={25}/><circle cx="7" cy="18" r="2" fill={rust}/><circle cx="15" cy="18" r="2" fill={ink}/><path d="M25 17h7m-7 3h7"/>
  </Case>
}

export function Ups() {
  return <><Case x={6} y={39} w={30} d={16} h={31} face={petrol}>
    <rect x="4" y="3" width="22" height="12" fill={ink}/><rect x="7" y="5" width="13" height="6" fill={sea}/><circle cx="23" cy="9" r="1" fill={brass}/>
    {[19,22,25,28].map(y=><path key={y} d={`M4 ${y}h22`} stroke={mist} strokeWidth=".9"/>)}
  </Case><path d="m44 14 4-2m-4 5 4-2m-4 5 4-2m-4 5 4-2" stroke={sea}/></>
}

export function Battery() {
  return <><Case x={4} y={38} w={34} d={11} h={22} face={sea}>
    <path d="M0 3h34m-34 1h34"/><path d="M6 9v7m-3-3.5h6m16-.5h6" stroke={paper} strokeWidth="1.6"/>
    <path d="M12 21v-8m4 9v-8m4 8v-8" stroke={petrol}/>
  </Case><path d="m10 14 1-4 5 1v4" fill={rust}/><path d="M34 15v-4l5 1v4" fill={ink}/><path d="M19 13V9l8 2v4" fill="none" strokeWidth="1.7"/></>
}

export function CellBank() {
  return <><Case x={4} y={37} w={34} d={13} h={8} face={petrol}/>
    {[1,0].map(row=><g key={row} transform={`translate(${row*6} ${row*-6})`}>
      {[0,1,2,3].map(i=><g key={i} transform={`translate(${9+i*7.4} ${17+i*1.6})`}>
        <path d="M-3.4 0q3.4 3 6.8 0v13q-3.4 3-6.8 0Z" fill={i===3?brass:sea}/><ellipse rx="3.4" ry="1.6" fill={paper}/><ellipse rx="1.1" ry=".6" fill={ink}/>
      </g>)}
    </g>)}<Wire d="m9 18 7 1.7 6-5 8 1.7" color={rust} weight={1.3}/></>
}

function Capacitor({ x, y, h = 12 }: { x: number; y: number; h?: number }) {
  return <g transform={`translate(${x} ${y})`}><path d={`M-3 0q3 2 6 0v${h}q-3 2-6 0Z`} fill={petrol}/><ellipse rx="3" ry="1.5" fill={paper}/><path d={`M1 2v${h-3}`} stroke={mist} strokeWidth=".8"/></g>
}

function Choke({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`}><ellipse rx="7" ry="5" fill={brass}/><ellipse rx="2.6" ry="1.8" fill={ink}/>
    {[0,45,90,135,180,225,270,315].map(a=><path key={a} d="M3 0h3.5" transform={`scale(1 .73) rotate(${a})`} stroke={rust} strokeWidth="1.5"/>)}</g>
}

function Sink({ x, y, count = 4 }: { x: number; y: number; count?: number }) {
  return <g transform={`translate(${x} ${y})`}>{Array.from({length:count},(_,i)=><path key={i} d={`M${i*3} 0v-9l6-3v9Z`} fill={i%2?mist:sea} strokeWidth=".9"/>)}</g>
}

export type BoardType = 'rc'|'bridge'|'buck'|'boost'|'inverter'|'hbridge'|'continuity'
export function Board({ kind }: { kind: BoardType }) {
  return <><Case x={2} y={35} w={37} d={15} h={2.8} face={ink} top={sea}/>
    <path d="m8 32 5-3 13 3 7-4m-14 6 5-3m3 5 8-4 7 1" fill="none" stroke={mist} strokeWidth=".85"/>
    <Screw x={5.8} y={32.3}/><Screw x={38.3} y={39}/><Screw x={50.8} y={32.5}/>
    {kind==='rc' && <><Capacitor x={32} y={14} h={17}/><path d="m9 27 4-2 3 1 2-2 9 1-1 3-4 .5-4-1-4 1" fill={brass}/><path d="m20 24-1 4m4-3-1 3" stroke={rust}/></>}
    {kind==='continuity' && <><path d="m9 30 8-4 9 2m8 3 5 1 6-4" fill="none" stroke={paper} strokeWidth="2.4"/>{[0,1,2,3].map((i)=><circle key={i} cx={10+i*10} cy={30+(i%2)*2} r="2.2" fill={i===3?rust:brass}/>)}<path d="m25 27 4 2-1-3 5 3" fill="none"/></>}
    {kind==='bridge' && <><Capacitor x={37} y={15} h={15}/><g transform="matrix(1 .22 0 1 10 16)"><path d="M0 0h15v9H0Z" fill={ink}/><circle cx="7.5" cy="2.5" r="1.3" fill={paper}/><path d="M2 9v3m3.6-3v3m3.8-3v3M13 9v3" strokeWidth="1.1"/></g></>}
    {kind==='buck' && <><Sink x={11} y={26}/><Choke x={29} y={29}/><Capacitor x={39} y={23} h={9}/></>}
    {kind==='boost' && <><Choke x={15} y={28}/><Sink x={24} y={27} count={3}/><Capacitor x={40} y={12} h={20}/></>}
    {kind==='inverter' && <><Sink x={10} y={27} count={6}/><Capacitor x={33} y={21}/><Capacitor x={40} y={18}/></>}
    {kind==='hbridge' && <>{[[11,28],[19,23],[29,32],[37,27]].map(([x,y])=><g key={x} transform={`translate(${x} ${y})`}><path d="M-2 0v-8l5 1v8Z" fill={ink}/><circle cx=".4" cy="-5" r=".75" fill={paper}/></g>)}</>}
  </>
}

export function Transformer() {
  return <><Case x={3} y={39} w={36} d={13} h={22} face={sea}/>
    {[0,1,2,3,4,5,6].map(i=><path key={i} d={`m${7+i*4.4} ${20+i*.96} -1 1v15l2 .7 1-1V${19+i*.96}Z`} fill={mist} strokeWidth=".8"/>)}
    {[0,1,2].map(i=><g key={i} transform={`translate(${14+11*i} ${12+2.4*i})`}><path d="M-1 4V-4h2v8Z" fill={brass}/><path d="m-2.5-2 5 1m-5 1 5 1m-5 1 5 1" strokeWidth="1.65"/></g>)}
    <path d="m7 40-1 3 6 1 1-3m21 5-1 2 5 .8 1-3" fill={ink}/></>
}

export function CapBank() {
  return <><Case x={4} y={40} w={33} d={12} h={28} face={ink}/>
    {[0,1,2].map(i=><At key={i} x={10+i*10} y={22+i*2.2}><Capacitor x={0} y={0} h={15}/><path d="M-1.5-1v-3m3 3v-3" stroke={brass}/></At>)}
    <path d="m9 16 24 5" stroke={brass} strokeWidth="1.7"/></>
}

export function Laptop() {
  return <><path d="m10 11 29 6 2 21-29-6Z" fill={ink}/><path d="m13 14 23 5 1 14-23-5Z" fill={mist}/>
    <path d="m15 19 4 1m3 0 9 2m-16 1 11 2m3 1 5 1" stroke={petrol}/><path d="m12 32 29 6 10-5 1 3-12 6-31-7Z" fill={paper}/>
    <path d="m19 33 20 4" stroke={sea}/></>
}

export function Server() {
  return <Case x={11} y={41} w={24} d={13} h={33} face={ink}>
    {[3,12,21].map(y=><g key={y} transform={`translate(2 ${y})`}><rect width="20" height="7.5" rx=".7" fill={sea}/><circle cx="3.5" cy="3.7" r="1" fill={brass}/><path d="M7 3h10m-10 2h8" strokeWidth=".7"/></g>)}
  </Case>
}

export function Beacon() {
  return <><path d="m15 41 12-5 10 2-12 6Z" fill={mist}/><path d="M24 38V24h3v15Z" fill={ink}/>
    {[{y:21,c:sea},{y:15,c:brass},{y:9,c:rust}].map(({y,c})=><g key={y} transform={`translate(25.5 ${y})`}><path d="M-4-4q4-2 8 0v6q-4 2-8 0Z" fill={c}/><path d="M-2-2v3" stroke={paper} strokeWidth=".8"/></g>)}
    <ellipse cx="25.5" cy="5" rx="4" ry="1.3" fill={ink}/></>
}
