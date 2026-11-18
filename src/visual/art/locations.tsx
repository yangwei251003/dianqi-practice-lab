import { brass, ink, mist, paper, petrol, sea } from './ink'
import type { Site } from './scenes'

function Windows({ x, y, wide = 52 }: { x: number; y: number; wide?: number }) {
  return <g transform={`translate(${x} ${y})`} fill="none"><path d={`M0 0h${wide}v21H0Z`} fill={mist}/><path d={`M1 11h${wide-2}m${-wide*.72} -10v19m${wide*.43} -19v19`} strokeWidth="1.3"/></g>
}

function Tree({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}><path d="M-7 0q-7-3-3-9-2-5 4-8 6-4 10 1 8 0 7 7 4 6-4 9Z" fill={mist}/><path d="M0-10v22m0-16-4-4m4 6 5-6" fill="none"/></g>
}

function WarehouseBay({ x }: { x: number }) {
  return <g transform={`translate(${x} 0)`}><path d="M0 17v61m48-57v62M0 25l48 6M0 46l48 6M0 66l48 6" fill="none" strokeWidth="2"/>
    {[0,1,2].map(i=><path key={i} d={`m${4+i*13} ${43+i*1.6}v-10l10 1v10Z m0 20v-11l10 1.5v11Z`} fill={mist}/>)}</g>
}

// Backgrounds are drawn as places, with an open foreground for figures and equipment.
export function Location({ site, distant = false }: { site: Site; distant?: boolean }) {
  const outside = ['grid','roof','road','rail'].includes(site)
  return <g strokeLinecap="round" strokeLinejoin="round">
    <path d="M0 0h260v140H0Z" fill={outside?'#e5ecdc':'#eee9d7'}/>
    <g stroke={petrol} strokeWidth=".95" fill="none" opacity={distant?.45:.57}>
      {site==='bench' && <><path d="M0 12h260M0 51h142V14M146 13v40h114"/><Windows x={161} y={19} wide={71}/>
        <path d="M10 26h99m-87 0v8l-3 5m7-13v8l3 4m10-12v12m10-12v13m2-14v13m17-13v8l-4 5m9-12v7l4 4"/><path d="m-8 67 97-13 178 15m-258 2 80-11 171 15" fill={mist}/></>}
      {site==='machine' && <><path d="M0 17 54 1v17L110 1v17l58-17v17l60-17v17h32M0 24h260M14 27v48m5-47v47m174-48v50m4-49v50"/>
        <Windows x={45} y={30}/><Windows x={113} y={30}/><path d="M0 65h260M22 15l24-7m64 7 44-12m21 12 39-12"/></>}
      {site==='water' && <><path d="M0 22h64q8 0 8 8v23h32m-104-25h59q7 0 7 7v23h34M137 5v16q0 12 12 12h111m-117-28v15q0 7 8 7h109"/>
        <path d="M24 20v10m5-10v10m126-5v10m6-10v10M0 77l75-16 185 19"/><path d="M187 66V33c0-8 29-8 29 0v36m-29-33q13 8 29 1" fill={mist}/><path d="M228 67V29m5 38V28m-5 8h5m-5 7h5m-5 7h5m-5 7h5"/></>}
      {site==='line' && <><path d="M0 14h260M0 18h260m-239 0v42m13-41 18 18 17-18 20 18 15-18 20 18 15-18 20 18 15-18 20 18 16-18 18 18 12-18"/>
        <path d="m0 67 61-12 198 19M5 72l55-11 202 18m-226-16v15m173-3v12"/><path d="M119 1v6l-14 8h29l-12-8V1" fill={mist}/></>}
      {site==='grid' && <><path d="M0 58q27-12 45-8 29-16 54-2 27-14 51-7 25-14 46-4 30-17 64-12v48H0Z" fill={mist}/>
        <path d="m17 57 13-39 13 36m-22-11 18-1-14-11 10 .2m-18-3 13-7 15 6-15-2Zm76 21 8-28 9 28m-17-18 10-6 10 5-11-2Z"/>
        <path d="M0 27q10 2 17 0m28-1q20 13 49 4m16-1q41 14 84-4"/><Tree x={233} y={42} s={.9}/></>}
      {site==='roof' && <><circle cx="211" cy="23" r="10" fill={brass} stroke="none"/><path d="M0 55h15V41h20v13h13V33h19v20h14V40h23v13h30V31h16v20h23V40h21v14h15V38h23v15h28v15H0Z" fill={mist}/>
        <path d="M0 61 120 42l140 22M0 66l120-18 140 22m-152-14 47 6m-6-9 41 6"/><path d="M10 23q-4-6 3-8 3-6 9-2 7-1 8 5h10"/></>}
      {site==='road' && <><path d="M0 64V29h27v34m6-1V20h35v42m8-2V31h25v29m49 0V23h47v40m22 0V34h41v28" fill={mist}/>
        {[5,14,39,51,82,159,171,183,229,243].map(x=><path key={x} d={`M${x} 37v5m0 5v4`} strokeWidth="2.5"/>)}<Tree x={120} y={50} s={.9}/><Tree x={209} y={53} s={.7}/>
        <path d="M0 70h260M0 74h260"/></>}
      {site==='building' && <><path d="m0 0 72 27h151l37-19M72 27v40M0 82l72-15h150l38 10m-38-50v40"/>
        <path d="M93 65V34h24v31M96 64V37h18v27m-3-13v4"/><Windows x={147} y={33} wide={48}/><path d="m8 54 40-7v-9L8 43Z" fill={mist}/><path d="m16 45 25-4m-25 7 25-4m-25 7 25-4"/></>}
      {site==='rail' && <><path d="M0 13 260 1M0 25 260 12m-237 44V18l14-1m-11 4 12-2m155 30V9l15 3m-12 2 13-2"/>
        <path d="m0 77 127-27 133 14m-260 17 127-27 133 14m-220 8 88-18 86 9"/><path d="m13 72 52-12 18 .5m51-9 47-10 54 5" strokeWidth="2.4"/>
        <path d="M62 51V31l27-3 18 4v16m-45-17 19 4 27-4m-22 5v13" fill={mist}/></>}
      {site==='store' && <><WarehouseBay x={4}/><WarehouseBay x={57}/><WarehouseBay x={156}/><WarehouseBay x={210}/>
        <path d="M0 7h260M0 12h260m111-1 16 13 18-13"/></>}
      {site==='power' && <><path d="M0 16h260m0-5H0m0 55h260"/>{[8,53,150,195].map(x=><g key={x} transform={`translate(${x} 22)`}><path d="M0 40V0h34v40Z" fill={mist}/><path d="M4 32h16m-16 3h16m6-17v8"/><rect x="4" y="5" width="13" height="6" fill={sea}/></g>)}</>}
    </g>
    <path d="M0 92 174 52l86 15v73H0Z" fill={outside?'#e8e5ce':'#ebe1c9'} opacity=".77"/>
    <g stroke={ink} strokeWidth=".7" opacity=".22" fill="none"><path d="m0 102 128-30m-98 64 149-54m44-18 37 8m-121 37 121 16"/>
      <path d="m12 109 11-2m-7 5 10-2m174-23 11 2m-7 1 8 1.5"/></g>
  </g>
}

export function BenchEdge({ y = 101 }: { y?: number }) {
  return <g transform={`translate(0 ${y})`} fill="none" stroke={ink} strokeWidth="1.15" strokeLinejoin="round">
    <path d="m-5-4 180-27 92 18v9L83 28-5 9Z" fill={mist}/><path d="m-5-4 180-27 92 18L83 20Z" fill={paper}/><path d="M83 20v8m-56-15v23l8 2V15m190-22v25l6 2V-8" fill={sea}/>
    <path d="m8-3 19 4m157-17 18 3" stroke={petrol} opacity=".45"/></g>
}
