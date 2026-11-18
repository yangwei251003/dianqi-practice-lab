import { At, Case, Dial, Mark, Screw, Wire, brass, blue, ink, mist, paper, petrol, rust, sea } from './ink'
import { Contactor } from './devices'

export function Prover() {
  return <g transform="rotate(-9 25 25)"><rect x="13" y="4" width="24" height="38" rx="4" fill={brass}/>
    <rect x="15" y="7" width="20" height="31" rx="2.7" fill={ink}/><rect x="18" y="10" width="14" height="5" rx="1" fill={mist}/>
    <circle cx="25" cy="20" r="1.6" fill={brass}/><circle cx="20" cy="29" r="3.2" fill={petrol} stroke={paper}/><circle cx="30" cy="29" r="3.2" fill={rust} stroke={paper}/>
    <circle cx="20" cy="29" r="1.25" fill={ink}/><circle cx="30" cy="29" r="1.25" fill={ink}/></g>
}

export function EnergyMeter() {
  return <Case x={5} y={39} w={35} d={9} h={27} face={paper}>
    <rect x="3" y="4" width="24" height="10" fill={ink}/><path d="M6 6h17v6H6Z" fill={mist}/><path d="M8 10h4m2 0h4" strokeWidth=".7"/>
    <circle cx="31" cy="7" r="1.4" fill={brass}/><circle cx="31" cy="12" r="1.4" fill={sea}/>
    <path d="M1 17h33"/>{[5,13,21,29].map(x=><g key={x}><Screw x={x} y={22} r={1.85}/></g>)}
  </Case>
}

export function TimeRelay() {
  return <Case x={15} y={39} w={17} d={14} h={34} face={paper}>
    <path d="M1 6h15m-15 21h15"/><Dial x={8.5} y={14} r={5.3} angle={35}/><circle cx="5" cy="23" r="1.25" fill={brass}/><circle cx="12" cy="23" r="1.25" fill={sea}/>
    <Screw x={5} y={3}/><Screw x={12} y={3}/><Screw x={5} y={30}/><Screw x={12} y={30}/>
  </Case>
}

export function SmartRelay() {
  return <Case x={6} y={38} w={32} d={10} h={27} face={paper}>
    <rect x="2" y="5" width="27" height="15" rx="1.2" fill={petrol}/><rect x="4" y="7" width="15" height="9" fill={mist}/>
    <path d="M5.5 10h4m2 0h4m-10 3h8" strokeWidth=".75"/><path d="m22 12 2.5-3 2.5 3-2.5 3Z" fill={brass}/>
    {[4,10,16,22,28].map(x=><g key={x}><circle cx={x} cy="2.3" r=".85" fill={ink}/><Screw x={x} y={24} r={1.25}/></g>)}
  </Case>
}

export function Pair() {
  return <><At x={0} y={6} s={.72}><Contactor/></At><At x={23} y={10.8} s={.72}><Contactor/></At>
    <path d="m24 27 8 2 5-2v3l-5 2-8-2Z" fill={brass}/></>
}

export function Drum() {
  return <><path d="m4 38 27-13 17 4-27 14Z" fill={mist}/>
    <ellipse cx="37" cy="20" rx="10" ry="15.5" transform="rotate(-19 37 20)" fill={brass}/>
    <path d="m15 18 19-8c10-3 19 18 9 22l-20 8Z" fill={ink}/>{[0,1,2,3,4,5].map(i=><path key={i} d={`M${17+i*3.1} ${16.5-i*1.25}q12 2 11 20`} fill="none" stroke={sea} strokeWidth=".95"/>)}
    <ellipse cx="18" cy="29" rx="11" ry="16.4" transform="rotate(-19 18 29)" fill={brass}/><ellipse cx="18" cy="29" rx="3" ry="4.2" fill={ink}/>
    <path d="m14 15 3 7m-5 3 1 6m6 5 2 7m3-18 2 6" stroke={rust}/><Wire d="M33 35q9 9 16 5l4-4" weight={2.4}/></>
}

export function Immersion() {
  return <g transform="rotate(20 25 27)"><Wire d="M25 16V8q0-7 10-7" weight={2.1}/><path d="m22 16 2-3h3l1 4v19l-1 5h-4l-2-5Z" fill={mist}/>
    <path d="M22 18h6m-6 14h5m-5 3h5m-5 3h4"/><path d="M24 20v10" stroke={paper}/></g>
}

export function Stepper() {
  return <><Case x={8} y={34} w={23} d={14} h={23} face={mist} side={petrol}><circle cx="12" cy="11.5" r="7.6" fill={sea}/>
    {[[3,3],[20,3],[3,20],[20,20]].map(([x,y])=><Screw key={`${x}-${y}`} x={x} y={y}/>)}</Case>
    <path d="m18 23-11 4c-2 1-.7 5 2 4l11-4c2-.6 1.2-4.7-2-4Z" fill={paper}/><path d="m29 12 9-4m-5 5 9-4" fill="none"/>
    <path d="m38 17 8 2 6-5m-15 6 9 2 7-5" fill="none" stroke={rust} strokeWidth="1.3"/></>
}

export function DcRoll() {
  return <><path d="m8 38 24-11 16 4-25 12Z" fill={mist}/><path d="m17 32-2 5 8 2 6-6Z" fill={petrol}/>
    <path d="m17 20 16-7c12-4 20 14 11 18l-18 8Z" fill={paper}/><ellipse cx="22" cy="29" rx="6.7" ry="10.5" transform="rotate(-22 22 29)" fill={mist}/>
    <path d="m21 26-9 4 2 5 10-4Z" fill={ink}/><ellipse cx="11" cy="31" rx="4.8" ry="10" transform="rotate(-19 11 31)" fill={brass}/>
    <path d="m9 24 1.2 4" stroke={paper} strokeWidth="2"/><path d="M39 14q5-6 12-5m-11 7q8-4 13-1" stroke={rust} fill="none"/></>
}

export function DryTransformer() {
  return <><Case x={4} y={38} w={34} d={13} h={3}/><path d="m7 13 9-4 30 6-9 4Z" fill={sea}/><path d="m7 13 30 6v4L7 17Z" fill={petrol}/>
    {[0,1,2].map(i=><g key={i} transform={`translate(${13+i*10} ${17+i*2.2})`}>
      <path d="M-3 0v18l5 1 4-2V-1Z" fill={ink}/><path d="M-4 4q5 2 10-1v12q-5 3-10 0Z" fill={brass}/><path d="M-4 6q5 2 10-1m-10 4q5 2 10-1m-10 4q5 2 10-1" fill="none" stroke={rust} strokeWidth="1"/>
      <path d="M-1 4V0l-3-1" stroke={paper}/></g>)}
    <path d="m7 34 31 6 8-4" strokeWidth="2.3" fill="none"/></>
}

export function GasSensor() {
  return <Case x={9} y={39} w={26} d={9} h={27} face={paper}><rect x="4" y="4" width="17" height="6" fill={mist}/>
    <Mark x={7} y={9} size={4.6}>CO</Mark><circle cx="8" cy="17" r="3" fill={ink}/><circle cx="8" cy="17" r="1.4" fill={sea}/>
    <path d="M15 15h7m-7 3h7m-7 3h7"/></Case>
}

export function Laser() {
  return <><Case x={6} y={35} w={22} d={13} h={18} face={brass}><rect x="2" y="3" width="18" height="11" rx="1" fill={ink}/>
    <circle cx="8" cy="8.5" r="3.1" fill={blue}/><circle cx="15.5" cy="8" r="1.8" fill={rust}/></Case>
    <path d="m9 23-6 3m9-2-7 3" stroke={rust} strokeDasharray="1.5 1.5"/><path d="m41 23 6-2v10l-6 2Z" fill={paper}/></>
}

export function Monitor() {
  return <><Case x={6} y={34} w={31} d={5} h={22} face={ink}>
    <rect x="2.5" y="2.5" width="26" height="16" fill={mist}/><path d="M5 5v10m20-10v10M5 8h4m3 0h6m3 0h4M9 6v4m3-4v4m6-4q-2 2 0 4m3-4q2 2 0 4" fill="none" strokeWidth=".7"/>
  </Case><path d="m20 37-1 4-6 2 13 3 6-3-6-2 1-3Z" fill={petrol}/></>
}

export function Lightbox() {
  return <Case x={5} y={37} w={34} d={10} h={18} face={paper}>
    {[10,24].map(x=><g key={x}><circle cx={x} cy="9" r="5.5" fill={petrol}/><circle cx={x} cy="8.4" r="4" fill={brass}/><path d={`m${x-1.8} 9.6 1-3 1.4 2 1-1.6`} fill="none" strokeWidth=".7"/></g>)}
  </Case>
}
