import { At, Case, Mark, Rotor, Wire, brass, blue, cream, ink, mist, paper, petrol, rust, sea } from './ink'

export function Pylon() {
  return <><path d="m10 43 15-40 3 1 12 38-4-1-9-30-13 32Z" fill={mist}/>
    <g fill="none"><path d="m16 30 18 1-15-9 12 1-10-7 9 .5-12 12 17 11-21-1 14-14"/><path d="m9 14 17-9 15 8-15-3Zm-5 9 21-10 21 9-20-4Z" fill={sea}/>
    {[9,40,5,46].map((x,i)=><g key={x} transform={`translate(${x} ${i<2?14:23})`}><path d="M0 0v5m-1.8-3h3.6m-3.6 2h3.6" strokeWidth=".9"/></g>)}</g>
    <path d="m9 42 9 1m15-2 10 1" strokeWidth="2"/></>
}

export function Substation() {
  return <><Case x={4} y={38} w={36} d={12} h={3}/><path d="M9 34V11l3-2 3 2v24m20 4V15l3-2 3 2v24" fill={mist}/>
    <path d="m8 10 5-2 30 6-4 3Z" fill={petrol}/>{[0,1,2].map(i=><g key={i} transform={`translate(${18+i*7} ${13+i*1.5})`}>
      <path d="M0 0v9m-2-7h4m-4 2h4m-4 2h4" strokeWidth="1.3"/><path d="M0 9q0 5 4 6" fill="none"/></g>)}
    <Case x={18} y={35} w={10} d={4} h={12} face={brass}/></>
}

export function Factory() {
  return <><path d="m36 27 1-22 4 .5 2 23Z" fill={rust}/><path d="m37 9 4 1m-4 3 4 1" stroke={paper}/>
    <Case x={3} y={38} w={36} d={12} h={15} face={mist} top={sea}><rect x="24" y="5" width="8" height="10" fill={petrol}/>
      {[4,11,18].map(x=><rect key={x} x={x} y="4" width="4" height="5" fill={blue}/>)}</Case>
    {[0,1,2].map(i=><g key={i} transform={`translate(${3+12*i} ${23+2.64*i})`}><path d="m0 0 11-7 1 9.6Z" fill={paper}/><path d="m11-7 11-5 2 9-12 5.6Z" fill={petrol}/></g>)}</>
}

export function House() {
  return <><Case x={9} y={38} w={25} d={13} h={17} face={paper}><rect x="4" y="6" width="6" height="7" fill={sea}/><path d="M16 17V7h6v10" fill={petrol}/></Case>
    <path d="m6 21 13-15 18 22Z" fill={mist}/><path d="m19 6 13-5 18 22-13 5Z" fill={petrol}/><path d="m26 10 10 12m-7-13 11 13" stroke={sea}/></>
}

export function Solar() {
  return <><path d="m9 34 1 7 3 1v-8m24-3 2 10 3-1-2-11" fill={petrol}/>
    <path d="m5 32 12-23 33 7-12 23Z" fill={blue}/><path d="m8 30 10-18 29 6-10 18Z" fill={petrol} stroke={paper} strokeWidth=".8"/>
    {[0,1,2,3].map(i=><path key={i} d={`m${14+i*6} ${31+i*1.26} 9.7-18`} stroke={mist} strokeWidth=".7"/>)}
    <path d="m11 24 29 6m-26-12 29 6" stroke={mist} strokeWidth=".8"/><path d="m5 32 1 2 32 7 12-23" fill="none"/></>
}

export function Turbine() {
  return <><ellipse cx="27" cy="43" rx="8" ry="2.3" fill={mist}/><path d="M23 42 25 18l2-1 2 26Z" fill={paper}/>
    <path d="m23 18 6-4 5 1 1 3-9 4Z" fill={sea}/>
    <g transform="translate(24.8 18.5)">{[-5,115,235].map(a=><path key={a} d="M0 0c-1-2-2-5-1.8-8L.8-17 1-7l1 5Z" transform={`rotate(${a})`} fill={paper}/>)}<circle r="2.2" fill={brass}/></g></>
}

export function Charger() {
  return <><path d="m8 41 14-6 13 3-13 7Z" fill={mist}/><Case x={14} y={39} w={14} d={9} h={30} face={paper}>
    <rect x="2.5" y="4" width="9" height="8" rx="1" fill={petrol}/><path d="M4 16h6m-6 2h4" fill="none"/><circle cx="7" cy="22" r="2" fill={brass}/>
  </Case><path d="M33 18q9 0 7 9l-2 9q-1 6-5 4-2-2 1-9l1-5" fill="none" strokeWidth="2.3"/><path d="m34 28-1-5 2-2 3 2-1 5Z" fill={ink}/></>
}

export function Car() {
  return <><path d="m4 29 9-6 10-2 7-8 10 2 8 9 4 4v6l-11 6-34-7Z" fill={sea}/>
    <path d="m14 24 10-2 7-8 8 2-7 10Z" fill={paper}/><path d="m32 26 8-10 6 8-6 4Z" fill={blue}/><path d="m4 29 34 7 12-6m-12 6v4" fill="none"/>
    <path d="m28 30 7 1m9-3 5-2" stroke={brass} strokeWidth="2"/>
    {[11,31].map((x,i)=><g key={x} transform={`translate(${x} ${33+i*4.3})`}><ellipse rx="4" ry="5" fill={ink}/><ellipse rx="1.9" ry="2.7" fill={paper}/></g>)}</>
}

export function Stairs() {
  return <><path d="m4 37 27-14 17 4-27 15Z" fill={mist}/>
    {[3,2,1,0].map(i=><Case key={i} x={5+i*7} y={37-i*3.6} w={16} d={8} h={4+i*3} face={sea} top={paper}/>)}
    <path d="M6 33V21l23-21m0 0v12m-13 12V13" fill="none" strokeWidth="1.4"/></>
}

export function Pir() {
  return <><path d="m13 13 16-6 10 3v13l-16 7-10-4Z" fill={mist}/><path d="m13 13 10 3 16-6m-16 6v14" fill="none"/>
    <path d="M19 24q8 4 17-3c-1 14-12 20-17 3Z" fill={paper}/><path d="M21 27q7 3 13-2m-11 6q5 1 9-3m-6-2 1 8" fill="none" strokeWidth=".75"/></>
}

export function Landing() {
  return <><Case x={7} y={40} w={27} d={8} h={35} face={paper}/>
    <g transform="matrix(1 .22 0 1 10 10)"><rect width="20" height="28" fill={petrol}/><path d="M1 1h8v26H1Zm10 0h8v26h-8Z" fill={mist}/><path d="M2 2h16" stroke={brass} strokeWidth="1.6"/></g>
    <path d="m32 18 3 .7v6l-3-.7Z" fill={ink}/><path d="m5 40 30 7 10-5-30-7Z" fill={paper}/></>
}

export function Signal() {
  return <><path d="m17 41 9-4 8 2-9 5Z" fill={mist}/><path d="M23 39V17l3 1v22Z" fill={petrol}/>
    <Case x={20} y={27} w={10} d={4} h={24} face={ink} side={petrol}>
      {[rust,brass,sea].map((c,i)=><g key={c}><circle cx="5" cy={5+i*7} r="2.7" fill={c}/><path d={`M2 ${4+i*7}q3-4 6 0`} fill="none" stroke={mist} strokeWidth=".7"/></g>)}
    </Case></>
}

export function Crossing() {
  return <><path d="m1 30 17-9-9-3 9-5 12 3 12-7 12 3-15 8 12 3-9 6-14-3-15 8Z" fill={petrol}/>
    <path d="m6 30 15-8m10-5 15-8m-35 7 10 2m14 5 11 3" stroke={paper} strokeWidth=".9" strokeDasharray="3 2"/>
    {[0,1,2,3].map(i=><path key={i} d={`m${18+i*2.6} ${23+i*.6} 2-1.2`} stroke={paper} strokeWidth="1.25"/>)}</>
}

export function Train() {
  return <><path d="m2 36 34 8 18-9M5 40l32 7 17-8" fill="none" stroke={petrol}/>
    <path d="m4 30 1-15 8-5 32 7 6 7v10l-10 7-34-7Z" fill={paper}/><path d="m5 15 33 7 7-5M37 21l4 5 10-2" fill="none"/>
    {[0,1,2,3].map(i=><path key={i} d={`m${8+i*7} ${18+i*1.5} 4.7 1-.4 6-4.7-1Z`} fill={blue}/>)}
    <path d="m41 26 8-3v6l-8 5Z" fill={ink}/><path d="m5 28 32 7 1 3-33-7Z" fill={rust}/><path d="m40 37 3-2m3-1 3-2" stroke={brass} strokeWidth="1.5"/>
    <path d="m17 11 4-5 5 1-3 6m-2-7 6-2" fill="none" strokeWidth="1.3"/><path d="m9 35 1 3 4 1 2-3m12 4 1 3 4 1 2-3" fill={ink}/></>
}

export function ColdStore() {
  return <><Case x={4} y={38} w={34} d={13} h={24} face={paper} top={mist}>
    <rect x="4" y="4" width="15" height="20" fill={sea}/><path d="M7 7h9v16H7Z" fill={mist}/><path d="M14 13v4" strokeWidth="1.5"/>
    <Rotor x={26} y={8} r={4.5}/><path d="M22 17h8m-8 3h8"/>
  </Case><path d="m42 20 5-2m-5 6 5-2m-5 6 5-2" stroke={mist}/></>
}

export function Crate() {
  return <><Case x={8} y={37} w={26} d={13} h={18} face={brass} top={paper} side={rust}>
    <path d="m2 2 22 14m-22 0L24 2" stroke={rust}/><path d="M2 1v16m22-16v16" strokeWidth="1.4"/>
  </Case><path d="m16 16 23 5" strokeWidth="2" stroke={brass}/></>
}

export function Racks() {
  return <><path d="m9 37 11-6 24 5-11 6Z" fill={mist}/>
    {[0,1].map(j=><g key={j} transform={`translate(0 ${j*-12})`}>
      <Case x={12} y={32} w={8} d={6} h={6} face={brass}/><Case x={25} y={35} w={10} d={6} h={7} face={paper}/><path d="m8 32 26 6 8-4" fill="none" strokeWidth="1.7"/>
    </g>)}<path d="M8 38V8m26 36V13m8 25V9M8 8l26 6 8-5-25-5Z" fill="none" strokeWidth="1.8"/></>
}

export function Stacker() {
  return <><Case x={4} y={40} w={34} d={10} h={3} face={petrol}/>
    <path d="m11 36 1-31 4-2 4 1-1 34Z" fill={sea}/><path d="m15 35 1-29" stroke={paper}/>
    <path d="m16 22 8-3 9 2v4l-10 4-8-3Z" fill={petrol}/><path d="m21 26 18 4 8-4m-24 2 14 3 8-4" fill="none" strokeWidth="1.5"/>
    <Case x={23} y={24} w={10} d={7} h={8} face={brass}/><circle cx="11" cy="41" r="1.9" fill={ink}/><circle cx="34" cy="46" r="1.9" fill={ink}/></>
}

export function InsulatorPole() {
  return <><path d="m22 43 2-31 3-1 1 33Z" fill={brass}/><path d="m9 13 4-2 30 6-4 2Z" fill={petrol}/>
    {[12,25,38].map((x,i)=><g key={x} transform={`translate(${x} ${10+i*2.8})`}><path d="M0 3v-6m-2 1h4m-4 2h4"/></g>)}</>
}

export function Sun() {
  return <g transform="translate(25 21)"><circle r="7" fill={brass}/>{[0,45,90,135,180,225,270,315].map(a=><path key={a} d="M0-10v-4" transform={`rotate(${a})`} stroke={rust} strokeWidth="1.4"/>)}</g>
}

export function Cloud() {
  return <><path d="M8 29c-7-7 0-17 8-15 5-12 19-9 19 0 11-2 15 12 5 15Z" fill={mist}/><path d="m17 33-4 5m12-5-4 5m12-5-4 5" stroke={blue}/></>
}

export function LightBank() {
  return <><path d="m5 17 12-6 32 7-13 6Z" fill={mist}/><path d="m5 17 31 7v4L5 21Zm31 7 13-6v4l-13 6Z" fill={petrol}/>
    {[0,1,2].map(i=><g key={i} transform={`translate(${11+i*10} ${23+i*2.2})`}><path d="m-2 0 5 1 1 4-7-1Z" fill={brass}/><path d="m-2 6-3 5m6-4 2 5" fill="none" stroke={rust} strokeWidth=".7"/></g>)}</>
}

export function GroundTag() {
  return <><path d="m9 35 18-9 16 3-18 10Z" fill={mist}/><path d="m19 32 1-20 3-3 5 1-1 23Z" fill={brass}/><path d="m22 13-8 4 1 9 10 2 8-5-2-9Z" fill={paper}/>
    <circle cx="22" cy="16" r="1.2" fill={ink}/><path d="m22 20-2 3h3l-2 3" fill="none" stroke={rust}/></>
}

export function PackGate() {
  return <><Case x={5} y={38} w={36} d={12} h={5}/><path d="M10 33V14l7-4 24 5v21l-5 3V20l-21-4v18Z" fill={sea}/>
    <path d="m17 11 1-5 8 2v6Z" fill={brass}/><path d="m12 28 19 4m-13-7 18 4" stroke={petrol}/><Case x={20} y={31} w={9} d={7} h={7} face={paper}/></>
}
