import { At, Case, Dial, Rotor, Screw, Wire, brass, blue, ink, mist, paper, petrol, rust, sea } from './ink'

export function Motor({ generator = false }: { generator?: boolean }) {
  return <><path d="m9 36 29-12 10 3v5L18 44 8 41Z" fill={ink}/><path d="m13 35 1 5 7 1 1-5m11-10 1 5 7 1 1-5" fill={sea}/>
    <ellipse cx="40" cy="23" rx="8.4" ry="11.3" transform="rotate(-15 40 23)" fill={petrol}/>
    <path d="M14 20 36 11c11-4 19 17 9 23l-23 9Z" fill={generator?brass:sea}/>
    <path d="m15 21 22-8m-18 10 22-8m-19 11 22-8m-20 12 22-8m-21 11 22-8m-22 12 21-8m-21 11 19-7" fill="none" strokeWidth="1.25"/>
    <path d="M37 12c9 0 15 16 8 22" fill="none" strokeWidth="2.1"/>
    <ellipse cx="18" cy="31" rx="8.9" ry="12" transform="rotate(-18 18 31)" fill={mist}/><ellipse cx="18" cy="31" rx="6.1" ry="8.8" transform="rotate(-18 18 31)" fill={petrol}/>
    <path d="m16 29-9 3c-2 1 0 6 2 5l10-4Z" fill={paper}/><path d="m6.5 33 2 4"/>
    <Screw x={14} y={22.5} r={.9}/><Screw x={22.5} y={38} r={.9}/>
    <Case x={21} y={19} w={10} d={8} h={5} face={generator?paper:sea}/><path d="m24 12 7 1" strokeWidth=".75"/></>
}

export function Fan() {
  return <><path d="m9 40 12-6 19 4-12 6Z" fill={mist}/><path d="m17 36 4-10 5 1-1 11Z" fill={petrol}/>
    <path d="M13 10 24 6c13-4 25 12 20 22l-11 6Z" fill={sea}/><path d="M28 7c9 1 15 10 14 17" fill="none"/>
    <g transform="matrix(.94 .18 0 1 21 22)"><Rotor x={0} y={0} r={15}/></g><path d="m36 12 3 1m-2 2 4 2" stroke={paper}/></>
}

export function Lathe() {
  return <><Case x={3} y={32} w={42} d={11} h={4} face={petrol}/>
    <path d="M7 34v8l6 2 2-2v-7m21 5v5l5 1 3-2v-6" fill={sea}/>
    <Case x={4} y={28} w={12} d={8} h={14} face={sea}><circle cx="5" cy="7" r="2.4" fill={paper}/></Case>
    <path d="m18 20 4-2 3 2v8l-4 2-3-2Z" fill={ink}/><path d="m23 23 12 3v3l-12-3Z" fill={paper}/>
    <Case x={32} y={32} w={8} d={7} h={8}/><path d="m32 24-5 2 5 2Z" fill={brass}/><path d="m12 30 29 6m-29-4 29 6" stroke={paper} strokeWidth=".85"/>
    <circle cx="28" cy="33" r="3" fill={brass}/><path d="M28 31v4m-2-2h4"/></>
}

export function Brake() {
  return <><Case x={4} y={36} w={36} d={12} h={4}/><path d="M16 33V20l8-3 6 2v16Z" fill={petrol}/>
    <ellipse cx="23" cy="23" rx="11" ry="14" transform="rotate(-15 23 23)" fill={mist}/><ellipse cx="23" cy="23" rx="7.5" ry="10.5" fill={ink}/>
    <ellipse cx="23" cy="23" rx="2.5" ry="3.8" fill={brass}/><path d="m24 11 16-6 2 3-16 8" fill={brass}/>
    <path d="M40 8v13m-3 1h6l2 5-9-2Z" fill={paper}/></>
}

export function Pump() {
  return <><Case x={4} y={39} w={33} d={13} h={3}/><At x={20} y={3} s={.58}><Motor/></At>
    <path d="M15 35v4l9 2 2-5" fill={ink}/><path d="M12 17c7-5 15-3 17 3 4 8 0 16-9 18-6 1-13-4-14-10-1-5 1-8 6-11Z" fill={sea}/>
    <ellipse cx="16" cy="26" rx="8.8" ry="9.8" fill={mist}/><ellipse cx="16" cy="26" rx="5" ry="6" fill={petrol}/>
    <path d="m14 24-7 2v6l8-4Z" fill={paper}/><ellipse cx="7" cy="29" rx="2.2" ry="4" fill={ink}/>
    <path d="M18 17V9l6-2 4 2v8l-7 3Z" fill={sea}/><ellipse cx="23" cy="8.5" rx="6" ry="2.2" fill={paper}/><ellipse cx="23" cy="8.5" rx="3.1" ry="1.1" fill={ink}/></>
}

export function Valve() {
  return <><path d="m5 28 11-4 8 3 15-6 8 2v8l-19 8-8-3-9 3-6-3Z" fill={sea}/>
    <path d="m8 28 7 2v8m21-14 7 2v6" fill="none"/><path d="m20 28 2-8 7-2 5 4-4 8Z" fill={brass}/><path d="M25 22v-9l3-1v10Z" fill={ink}/>
    <ellipse cx="26" cy="12" rx="10" ry="4.2" fill={paper} stroke={rust} strokeWidth="2.3"/><path d="m17 11 17 2m-13 2 10-6" stroke={rust}/></>
}

export function Tank({ floating = false }: { floating?: boolean }) {
  return <><path d="m11 37 1 6 3 1 1-6m17 1 1 4 3 1 1-7" fill={ink}/>
    <path d="M9 10q15-8 30 0v25q-15 9-30 0Z" fill={mist}/><path d="M9.5 24q14 7 29 0v10.5q-14 8-29 0Z" fill={sea} stroke="none"/>
    <ellipse cx="24" cy="10" rx="15" ry="5.1" fill={paper}/><path d="M9 23q15 7 30 0" fill="none" stroke={blue}/>
    <path d="M14 16v16m22-18v17m-3-13h3m-3 4h3m-3 4h3" fill="none" strokeWidth=".8"/>
    {floating?<><path d="M21 8v20m7-19v8" fill="none"/><circle cx="21" cy="29" r="2.2" fill={brass}/><circle cx="28" cy="18" r="2.2" fill={brass}/></>:<><path d="M21 9V5l6-2 5 2v3Z" fill={petrol}/><path d="m26 5 1-3 5 1" fill="none"/></>}
    <path d="M38 33h6v-5h4v9h-9" fill={paper}/></>
}

export function Conveyor({ boxes = 1 }: { boxes?: number }) {
  return <><path d="M8 33v8l3 1 3-2v-6m23 5v6l3 1 3-2v-6" fill={petrol}/>
    <path d="m4 26 10-6 36 8c5 1 6 6 3 8l-11 6Z" fill={mist}/><path d="m8 25 33 7c6 2 6 10 0 10L7 35c-6-1-5-11 1-10Z" fill={ink}/>
    <path d="m8 27 32 7c3 1 3 5 0 6L8 33c-4-1-3-7 0-6Z" fill={sea}/><circle cx="8" cy="30" r="1.7" fill={paper}/><circle cx="40.5" cy="36.7" r="1.7" fill={paper}/>
    {[0,1,2,3,4,5].map(i=><path key={i} d={`m${12+i*5.4} ${25+i*1.2} 6-3`} strokeWidth=".7"/>)}
    {boxes>=1 && <Case x={24} y={27} w={10} d={7} h={10} face={brass}><path d="M5 0v4"/></Case>}
    {boxes>=2 && <Case x={8} y={23} w={9} d={6} h={8} face={paper}/>}
  </>
}

export function Photoeye() {
  return <><Case x={10} y={40} w={17} d={9} h={3}/><path d="M17 38V14l4-2 3 1v25Z" fill={petrol}/>
    <Case x={14} y={23} w={12} d={7} h={14} face={brass}><circle cx="6" cy="5" r="2.7" fill={ink}/><circle cx="6" cy="11" r="1.7" fill={rust}/></Case>
    <Wire d="M29 21q9 0 7 8l-1 7q-1 6 6 6"/></>
}

export function Inductive() {
  return <><path d="m8 35 27-14c7-3 12 6 7 10L14 44Z" fill={mist}/>
    {[0,1,2,3,4,5].map(i=><path key={i} d={`m${16+i*3.2} ${31.2-i*1.63}q4 1 5.8 6.7`} fill="none" strokeWidth=".85"/>)}
    <path d="m25 25 5-3 5 1 4 6-2 4-5 2-5-3Z" fill={paper}/><ellipse cx="11" cy="39" rx="5" ry="6.4" transform="rotate(-25 11 39)" fill={brass}/>
    <Wire d="M40 23q12-5 8-14l-1-4" weight={2.6}/></>
}

export function Tags() {
  return <><Case x={3} y={33} w={16} d={9} h={4} face={mist} top={paper}/><Case x={25} y={35} w={17} d={10} h={7} face={rust} top={brass}/><path d="m28 29 11 2m-8-4 9 2" stroke={rust} strokeWidth=".7"/></>
}

export function Slide() {
  return <><Case x={2} y={35} w={40} d={12} h={4}/><path d="m6 29 32 7m-26-10 32 7" stroke={ink} strokeWidth="2"/>
    <path d="m7 29 30 6m-23-9 30 6" stroke={paper} strokeWidth=".8"/><Case x={18} y={32} w={12} d={10} h={7} face={brass}/>
    <Case x={0} y={29} w={7} d={8} h={10} face={petrol}/><path d="m5 18 8-3 6 1" fill="none" stroke={rust}/>
    <path d="m34 31 1-8 4 1 1 8" fill={sea}/></>
}

export function Ram() {
  return <><path d="m3 34 28-13 12 3-29 14Z" fill={mist}/><path d="m5 24 22-10 8 3v9L14 36l-9-4Z" fill={sea}/>
    <path d="m7 23 6 2 22-9m-22 9v10" fill="none"/><path d="m32 17 13-6 3 2v3l-14 7Z" fill={paper}/>
    <path d="m43 10 7-4 4 2v12l-8 3-3-2Z" fill={brass}/><path d="M12 21v-4q0-4-5-3m18 2v-5q0-3 5-6" fill="none" stroke={blue} strokeWidth="1.6"/></>
}

export function Blower() {
  return <><Case x={6} y={38} w={30} d={14} h={19} face={mist}><Rotor x={14} y={9.8} r={8}/></Case>
    <path d="m13 15 0-7 18 4 1 8Z" fill={sea}/><path d="m13 8 8-4 19 4-9 4Z" fill={paper}/><path d="m31 12 9-4v9l-8 3Z" fill={petrol}/><path d="m16 8 13 3m-9-5 13 3"/></>
}

export function Grille() {
  return <Case x={4} y={37} w={34} d={11} h={16} face={mist}>
    <rect x="2" y="2" width="30" height="12" fill={ink}/>{[4,7,10,13].map(y=><path key={y} d={`M4 ${y}h26`} stroke={paper}/>)}</Case>
}

export function Thermostat() {
  return <Case x={14} y={37} w={22} d={5} h={27} face={paper}>
    <rect x="3.5" y="4" width="15" height="10" rx="1" fill={mist}/><path d="m6 11 2-3 2 1 3-3m0 6h3" fill="none"/>
    <path d="m5 20 2.5-3 2.5 3Zm7-2h5l-2.5 3Z" fill={petrol}/></Case>
}

export function PressureGauge() {
  return <><path d="M23 30v8l-4 2 8 2 6-3-6-1v-9Z" fill={brass}/><circle cx="26" cy="19" r="13" fill={petrol}/><Dial x={25} y={19} r={11} angle={30}/></>
}
