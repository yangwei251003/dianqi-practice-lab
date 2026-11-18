import { At, Wire, brass, cream, ink, mist, paper, petrol, rust, sea, skin } from './ink'

export type Person = 'lan'|'zhou'
export type Pose = 'point'|'notes'|'think'|'show'|'pause'|'reach'|'rest'
export type Mood = 'curious'|'intent'|'pleased'|'startled'

export function Notebook({ x = 0, y = 0, scale = 1 }: { x?: number; y?: number; scale?: number }) {
  return <At x={x} y={y} s={scale}><g transform="rotate(9 10 10)" stroke={ink} strokeWidth="1" strokeLinejoin="round">
    <path d="M1 1h16l2 2v21H1Z" fill={petrol}/><path d="M2 0h15v22H2Z" fill={paper}/><path d="M5-1v3m4-3v3m4-3v3M5 7h8m-8 3h6m-6 4 2 2 4-5" fill="none" strokeWidth=".9"/>
  </g></At>
}

function Head({ who, mood, back }: { who: Person; mood: Mood; back: boolean }) {
  const lan = who==='lan'
  return <g>
    {lan && <><path d="M18 12C15 4 7 3 4 8c-3 5 2 9 5 11-4 1-6 4-6 7 5 1 10-3 12-8Z" fill={ink}/><path d="M5.5 9q2-3 5-2m-4 7 4 3" stroke={sea} fill="none" strokeWidth=".9"/><path d="m12 12 3-2 3 4-4 3Z" fill={brass}/></>}
    <path d="m21 28-1 10 9 4 5-4-4-8Z" fill={skin}/><path d="m23 30 9-2-2 7-7 1Z" fill="#bc805e" stroke="none"/>
    <path d={lan?'M14 16C14 7 22 4 29 5c8 1 10 8 9 14l3 4-4 2c-1 6-4 9-9 9-6-1-11-5-12-10-5 0-6-7-2-8Z':'M13 15c0-9 8-13 16-12 9 1 12 6 11 14l3 5-4 2-1 6-8 4-9-3-5-8c-6 2-7-7-3-8Z'} fill={skin}/>
    {lan?<><path d="M14 23c-2-3-4-8-2-13C15-1 30-2 36 5l4 5c-2 2-5 1-8-2-1 5-8 8-14 9v5l-2-2Z" fill={ink}/>
      <path d="M14 11c4-6 10-8 16-7m-13 9c5-1 10-4 12-6" fill="none" stroke={sea} strokeWidth=".85"/></>:<><path d="M13 19 9 14l2-6-2-1 6-4-1-2 7 1c7-4 13-1 17 2l3 4-2 4-5-3-13 1-4 5v7Z" fill={ink}/>
      <path d="M13 14q4-6 10-6l-6 7-1 6-3-2Z" fill={mist} stroke="none"/><path d="M17 6q9-4 16-1" fill="none" stroke={sea} strokeWidth=".85"/></>}
    {back ? <path d={lan?'M14 15q9 1 18-8 5 7 3 15l-4 8c-6 2-14-3-17-7Z':'M12 11q12-9 23-2c2 8 2 14-2 20l-9 2-8-7Z'} fill={ink}/> : <>
      <path d="M15 19q-3-2-2 2l2 2M33 21l-.5 2 1.5.5" fill="none" strokeWidth=".8"/>
      <path d={mood==='curious'?'m23 15 5-1.5m6 .4 3 1.2':mood==='startled'?'m22.5 14 5-2m6 .5 3 1':'m23 15 5 .4m6-.1 3-.4'} strokeWidth="1.45"/>
      {mood==='pleased'?<path d="M24 18q2-2.5 4 0m6-1q1.5-2 3 0" fill="none"/>:<g fill={ink}><ellipse cx="27" cy="18" rx={mood==='startled'?1.3:.95} ry="1.45"/><ellipse cx="36.2" cy="17.5" rx=".8" ry="1.25"/></g>}
      {!lan && <g strokeWidth="1" fill="none"><path d="m16 16 6 1m.2-1.1 8-1 .6 4.3c-2 3-7 2-7.8.3Zm9-.3 2.5-.3m.2-1 5.6-.7-.2 3.6q-2.3 2-4.6.6Z"/></g>}
      {mood==='startled'?<ellipse cx="33.6" cy="28" rx="1.7" ry="2.1" fill={ink}/>:<path d={mood==='pleased'?'M27.5 26.5q4.5 5 8.7-.2':mood==='curious'?'M30 28q3-1.7 5.4-.3':'M29.5 27.5q3 1 6-.6'} fill="none" strokeWidth="1.15"/>}
      {!lan && <path d="m22.2 27.5.5 1.6m2 .3.7 1.5m2 .1.6 1.1" stroke="#a56b52" strokeWidth=".7"/>}
    </>}
  </g>
}

// All the figures are drawn facing their subject. Mirroring a person never mirrors equipment markings.
export function Actor({ who, pose = 'rest', mood = 'intent', x = 0, y = 0, scale = 1, left = false, back = false }: {
  who: Person; pose?: Pose; mood?: Mood; x?: number; y?: number; scale?: number; left?: boolean; back?: boolean
}) {
  const lan = who==='lan', jacket=lan?brass:petrol, cuff=lan?rust:sea
  return <g transform={`translate(${x} ${y}) scale(${left?-scale:scale} ${scale})`} stroke={ink} strokeWidth="1.15" strokeLinejoin="round" strokeLinecap="round">
    <path d="m13 66 20 1 6 23-5 2-10-18-2 18h-7l-3-16Z" fill={lan?petrol:'#556e65'}/>
    <path d="m15 89 7 .1 2 3 5 1v3l-15-1Zm18 0 6-1 4 3 4 .6v2.8l-13 .5Z" fill={ink}/><path d="m15 94 12 .8m8-1.4 10-.3" stroke={mist} strokeWidth=".7"/>
    <path d={lan?'M19 35 9 40c-3 8-2 16 1 24l-2 5q14 6 28 2l2-14-3-17-6-5Z':'m19 34-12 5c-4 3-5 16-4 22l6 3-2 6q16 6 32 1l-1-20-4-12-6-4Z'} fill={jacket}/>
    <path d="m18 35 6 6 6-5 4 3-6 8-4-4-4 5-5-10Z" fill={lan?paper:mist}/>
    {back?<path d="m9 43 13 3 9-3m-8 5v17" fill="none" stroke={cuff}/>:<><path d="m24 43 2 25m-14-12 7 1-1 6-6-1Zm16-6 6 1v6l-5 1Z" fill="none" strokeWidth=".8"/>
      <path d="m31 47 .5 4m-1.7-3v3" stroke={lan?petrol:brass}/><path d="m11.5 66 10 2m6 .6 8-.6" fill="none" stroke={cuff}/></>}
    <Head who={who} mood={mood} back={back}/>
    {pose==='point' || pose==='reach' ? <g>
      <path d={pose==='point'?'M12 42q-6 2-4 8l10 10 9-1 13-9-3-6-15 7Z':'M12 42q-6 2-4 8l12 10 11-1 11-2-.5-6-16 .5Z'} fill={jacket}/>
      <path d={pose==='point'?'m35 45 4-2 4 6-4 3Z':'m38 51 4-.5 1 6-4 1Z'} fill={cuff}/>
      <path d={pose==='point'?'m41 44 5-4 8-2.6q2-.3 1.4 1.2L49 42l6-.6q2 0 1 1.4l-4 1.2q2 .5-.5 2-3 2-9 1Z':'m42 52 6-2.5 6 1.3q2 .7 1 1.4l-5-.2 5 2q1 .7.1 1.3l-5-.7 3 1.6q1 .8-.2 1-5 .5-10-1Z'} fill={skin}/>
    </g>:pose==='notes'||pose==='show'?<g>
      <Notebook x={pose==='show'?30:26} y={pose==='show'?41:48} scale={pose==='show'?.85:.75}/>
      <path d="M10 43q-6 4-3 11l10 10q3 2 7-.2l10-8-3-5-11 5-5-10" fill={jacket}/><path d="m28.5 52 3.8-2.6 3.5 5.8-3.7 2.6Z" fill={cuff}/>
      <path d="m33 50 3.4-2.5 2 .6 4-1q2-.2 1.4 1.1l-3 1.5 2 .4q1 .8-.4 1.7L36 55Z" fill={skin}/>
      {pose==='notes'&&<path d="m37 51 10-10 .9 1-9 10Z" fill={ink}/>}
    </g>:pose==='think'?<g><path d="M11 42q-6 1-6 7l6 11q2 4 7 2l11-14-5-4-9 9Z" fill={jacket}/>
      <path d="m23 45 2-4 6 4-3 4Z" fill={cuff}/><path d="m25.5 41 1-6 3-5 2 1-1.5 4 4-2 2 1-3.5 3-.5 4-2.5 3Z" fill={skin}/></g>:pose==='pause'?<g>
      <path d="M12 44q-7 1-6 8l9 9 7 .5 15-12-4-5-14 8Z" fill={jacket}/><path d="m31 45 4-3 5 5-4 4Z" fill={cuff}/>
      <path d="m35 42 2-3-2-5 1-1.2 3 3.3-1-7 1.4-.3 2.2 5.7-.2-6.7 1.4-.4 1.4 7 .8-5.7 1.4.2-.2 7-2.2 7-4 2Z" fill={skin}/>
    </g>:<><path d="M10 43q-5 2-4 10l4 12 5-1-1-14" fill={jacket}/><path d="m10 64 5-1 1 5-2 4-2-.4 0-3-2-1Z" fill={skin}/></>}
  </g>
}

// A close-up forearm enters from the lower right; the extended index ends near (0, 0).
export function ActionHand({ x, y, angle = 0, scale = 1, pencil = false, grip = false, who = 'lan' }: {
  x: number; y: number; angle?: number; scale?: number; pencil?: boolean; grip?: boolean; who?: Person
}) {
  return <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`} stroke={ink} strokeWidth="1.25" strokeLinejoin="round" strokeLinecap="round">
    {pencil && <><path d="m-13-7 3.5.2 17 11-1.6 2.7-16.9-11.1Z" fill={brass}/><path d="m-13-7 2.6 2.8 1.1-2.3Z" fill={ink}/></>}
    <path d={grip?'M33 13c-7-2-11-7-15-8L9 1 3 2-1 8q-.6 2.4 1.8 2.2l4.5-4.3 5.3.7 3.6 4.4-5.4 3.2-5.5-2.5q-2.6-.2-1.9 2.2l4.9 5.6 6 2.7 10.4 3.6 10.5-.6 8.2 2.5 4.6-8.7Z':'M29 12c-4-.2-8-4.7-11-5.6L3 .5C.2-.6-1.4 1.1 1 3l11 6.5-5.6-.2c-2.3-.1-3.6 1.3-2 3l2 1.5c-1.5.7-1.2 2.3.6 3.6l3 1.9q-1.5 1.7 3.8 4.5l8.7 2.6 10.8-1.1 7 2 4.6-8.6Z'} fill={skin}/>
    <path d="m6.5 13.9 7.4 1.8m-4.6 3.5 5.2 1.4m1.5-9.2 6.2 3.2" fill="none" stroke="#ac7354" strokeWidth=".8"/>
    <path d="m34 13 9 3.8-6.1 13.3-9-4Z" fill={who==='lan'?paper:mist}/>
    <path d="m41 14 42 15-5 19-44-17Z" fill={who==='lan'?brass:petrol}/><path d="m43 18 31 11m-35 0 12 4" fill="none" stroke={who==='lan'?rust:sea}/>
  </g>
}
