import { useId } from 'react'

const outline = '#12383b'
const ivory = '#f5e9c8'
const gold = '#edb66c'

function Bolt({ x, y, size = 1 }: { x: number; y: number; size?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${size})`} strokeWidth=".8"><path d="m-2-.6 1.2-1.7 2 .4.9 1.8-1.3 1.6-2-.4Z" fill={ivory}/><path d="m-.9.5 1.7-1"/></g>
}

function HeroMotor({ body }: { body: string }) {
  return <g stroke={outline} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
    <path d="m59 186 73 14 96-37-66-15Z" fill="#082f32" opacity=".5" stroke="none"/>
    <path d="m114 176 0 8 17 4 14-5v-7l-8-4Zm67-24 0 8 15 3 16-6v-6l-9-3Z" fill="#56867c"/>
    <path d="m108 183 18 4 22-8 1 5-21 9-20-4Zm67-25 19 4 21-8 1 5-22 9-20-5Z" fill="#8cb2a1"/>
    <path d="m112 183 16 4 16-6m36-23 13 3 17-6" fill="none" stroke={ivory} strokeWidth="1.05"/>
    <Bolt x={116} y={185}/><Bolt x={139} y={182}/><Bolt x={183} y={160}/><Bolt x={207} y={156}/>
    <path d="m187 95 13-5c12-5 28 1 36 15 10 18 8 36-4 43l-19 8Z" fill="#608f82"/>
    <path d="M210 91c16 1 31 22 30 39m-25-38c13 4 24 18 26 31" fill="none" stroke="#b5ccb3" strokeWidth="1.1"/>
    {[0,1,2,3,4].map(i=><path key={i} d={`M${223+i*2.3} ${101+i*6.2}l7-2`} stroke={outline} strokeWidth="2.2"/>)}
    <path d="m109 122 82-30c14-4 33 8 39 26 6 17 2 32-8 37l-85 33Z" fill={`url(#${body})`}/>
    <path d="M191 92c16-3 34 17 37 34 3 14 0 24-8 29m-23-63c14 1 31 20 34 36 2 12-1 21-6 25" fill="none" stroke={outline} strokeWidth="2.3"/>
    {[[115,122,188,95],[125,124,195,98],[133,128,202,101],[138,133,207,106],[142,139,211,112],[146,145,215,118],[148,152,219,125],[149,159,221,132],[149,166,221,139],[146,174,220,146],[142,181,217,153]].map(([x,y,xx,yy])=><g key={y}>
      <path d={`M${x} ${y} ${xx} ${yy}l2 1.8-.4 1.6-1.7-.6-71 27Z`} fill="#487d73" strokeWidth=".7"/>
      <path d={`M${x+.7} ${y-.3} ${xx} ${yy-.2}`} fill="none" stroke="#dbe0bf" strokeWidth="1.1"/>
    </g>)}
    <path d="M113 121c12-4 29 11 35 28 6 19 3 32-8 38l-8 3-25-67Z" fill="#366a64"/>
    <ellipse cx="119" cy="155" rx="26" ry="36" transform="rotate(-22 119 155)" fill="#9ab9a6"/>
    <ellipse cx="119" cy="155" rx="21.2" ry="30.8" transform="rotate(-22 119 155)" fill="#719e90"/>
    <g fill="#b5c8ac" strokeWidth=".95"><path d="m102 136 11 10 2-2-8-12Z"/><path d="m121 127 0 16 3 1 1-13Z"/>
      <path d="m132 141-5 8 2 4 7-6Z"/><path d="m139 164-9-6-1 4 10 7Z"/><path d="m133 180-9-14-3 1 8 15Z"/>
      <path d="m113 181 2-14-4-2-2 12Z"/><path d="m99 165 11-5-1-4-13 3Z"/></g>
    <ellipse cx="117" cy="155" rx="11.5" ry="16.5" transform="rotate(-22 117 155)" fill="#c1ceb0"/>
    <ellipse cx="115.5" cy="155.5" rx="7.4" ry="10.8" transform="rotate(-22 115.5 155.5)" fill={outline}/>
    <path d="m113.5 149.7-26 9.9c-5 2-1 15 4 13.1l26.5-10.1c3.6-1.8.2-13.2-4.5-12.9Z" fill="#d6dcc6"/>
    <path d="m92 161 21-7.8 2 1.6-21 8.2Z" fill="#668a81" strokeWidth=".8"/><ellipse cx="90" cy="166.2" rx="3.8" ry="7" transform="rotate(-19 90 166.2)" fill="#9fb5a4"/>
    <Bolt x={104} y={131} size={1.15}/><Bolt x={136} y={147} size={1.15}/><Bolt x={131} y={180} size={1.15}/><Bolt x={99} y={164} size={1.05}/>
    <path d="m143 116 3-12 19-7 11 2 5 8-24 10Z" fill="#376961"/>
    <path d="m139 96 23 5 24-9v14l-24 9-23-5Z" fill="#79a090"/><path d="m139 96 23 5 24-9-23-5Z" fill="#c8d3b4"/>
    <path d="m137 94 24-9 26 5-25 10Z" fill="#d6dcc1"/><path d="m137 94 25 6 25-10v3l-25 10-25-6Z" fill="#83a394"/>
    <path d="M162 103v10"/><Bolt x={143} y={94} size={.62}/><Bolt x={180} y={90.5} size={.62}/>
    <path d="m182 100 5-3 5 1 2 4-6 3-5-1Z" fill={gold}/><path d="m188 98 3 5"/>
    <g transform="matrix(.91 -.35 .2 .9 177 136)"><rect width="24" height="10" rx="1" fill={ivory}/><path d="M4 3h16M4 5h9m2 0h5M4 7h12" strokeWidth=".65"/></g>
  </g>
}

function Cabinet() {
  return <g stroke={outline} strokeLinejoin="round" strokeLinecap="round" strokeWidth="1.35">
    <path d="m247 145 112 24 68-22-112-24Z" fill="#0e3436" opacity=".55" stroke="none"/>
    <path d="m250 45 28-11 109 22-26 12Z" fill="#d7d7ba"/><path d="m361 68 26-12v88l-26 11Z" fill="#577d73"/>
    <g transform="matrix(1 .205 0 1 250 45)">
      <rect width="111" height="88" rx="1.2" fill="#b0bda0"/><rect x="4" y="4" width="103" height="79.5" fill="#486f66"/>
      <rect x="7" y="7" width="96.5" height="73" fill="#a5bba6"/>
      <path d="M8 24h95m-95 4h95m-95 30h95m-95 4h95" stroke="#416e69" strokeWidth="2.1"/>
      <path d="M16 19v6h17v8m9-15v10h9v6m11-17v8h12v8m13-15v9h8v8m-68 17v6h9v8m16-12v8h9v7m10-15v7h14v7" fill="none" stroke={outline} strokeWidth="1.2"/>
      <path d="M18 17v5h22v8m30-12v5h8v7M33 50v7h17v6m28-11v8h13v5" fill="none" stroke="#d49c55" strokeWidth="1.25"/>
      <rect x="8" y="7" width="95" height="14" fill="#355e59"/>
      {[0,1,2].map(i=><g key={i} transform={`translate(${17+i*12} 13.8)`}><circle r="4.1" fill={outline}/><circle r="2.9" fill={['#b4d39c',gold,'#bf7860'][i]}/><path d="M-1.7-.5q.3-1.2 1.5-1.3" fill="none" stroke={ivory} strokeWidth=".65"/></g>)}
      <rect x="61" y="11" width="34" height="6" fill="#c1c7a9"/><path d="M65 14h19m2 0h5" strokeWidth=".8"/>
      <rect x="11" y="31" width="55" height="23" rx="1.2" fill="#2d5855"/>
      <path d="M12 31 16 28h54l-4 3Z" fill="#ced4b8"/><path d="m66 31 4-3v23l-4 3Z" fill="#244b49"/>
      <rect x="14" y="33" width="29" height="11" rx=".6" fill="#bacab1"/><rect x="16" y="35" width="16" height="5" fill="#3c615a"/>
      <path d="M18 37.5h8m8 0h5" stroke="#d3d5af" strokeWidth=".7"/><path d="M45 31v22m8-22v22m7-22v22" stroke="#92ad98" strokeWidth=".75"/>
      {[48,56,63].map(x=><path key={x} d={`M${x} 35v1m0 2v1m0 2v1`} stroke={gold} strokeWidth="1.5"/>)}
      <rect x="14" y="47" width="49" height="4.5" fill="#bfc9ac"/>{Array.from({length:12},(_,i)=><circle key={i} cx={16+i*4} cy="49.2" r=".62" fill={outline}/>)}
      <rect x="76" y="30" width="19" height="24" fill="#d3d5b9"/><path d="M80 31v4m5-4v4m5-4v4m-10 13v4m5-4v4m5-4v4" strokeWidth="2"/>
      <rect x="79" y="37" width="13" height="8" fill="#6a8a7c"/><rect x="81" y="39" width="6" height="4" fill={outline}/>
      <rect x="10" y="65" width="88" height="3" fill={ivory}/>{Array.from({length:13},(_,i)=><g key={i} transform={`translate(${14+i*6.1} 63)`}>
        <rect width="5.7" height="10" fill={i>9?gold:'#d9d9ba'}/><circle cx="2.9" cy="3" r="1.05"/><path d="M1.8 7h2.2"/>
      </g>)}
      <path d="M18 74v5m12-5v6m18-6v5m12-5v6m12-6v5m11-5v6" fill="none" strokeWidth="1.4"/>
      {[[2.4,2.5],[108.5,2.5],[2.4,85],[108.5,85]].map(([x,y])=><Bolt key={`${x}-${y}`} x={x} y={y} size={.6}/>)}
    </g>
    <g transform="matrix(.87 -.35 0 .99 364 69)">
      <path d="m0 0 58-1 3 2v85l-4 2-57-1Z" fill="#7e9b89"/><rect x="3" y="3" width="53" height="80" fill="#a9bca5"/>
      <path d="M10 10h35l2 42-37 1Z" fill={ivory}/><path d="m15 16 23-1m-22 6h11m-12 4v18m23-18v18m-22-15h7m6 0h8m-14-2v4m4-4v4m-11 5h9l4-3m-2 3h9m-21 6h22" fill="none" stroke="#628072" strokeWidth=".85"/>
      <path d="M49 57v9h3v-9Z" fill={outline}/><path d="M9 65h25m-25 4h25m-25 4h25" fill="none" stroke="#6f8e7e"/>
      <path d="M1 11v7m0 43v8" stroke={outline} strokeWidth="2.7"/>
    </g>
    <path d="m255 135 0 6 6 2 5-2v-5m85 18v6l6 1 6-3v-5" fill="#416760"/>
  </g>
}

function Figure({ x, y, n, d }: { x: number; y: number; n: string; d: string }) {
  return <g fill="none" stroke={gold} strokeWidth=".85"><path d={d} opacity=".8"/><circle cx={x} cy={y} r="7.1" fill="#19494a"/>
    <text x={x} y={y+2.5} textAnchor="middle" fill={gold} stroke="none" fontFamily="ui-monospace, Consolas, monospace" fontSize="6.9">{n}</text></g>
}

export function HeroArt() {
  const id = `ee-hero-${useId().replace(/[^\w-]/g,'')}`
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 260" width="480" height="260" style={{display:'block',width:'100%',height:'100%'}} role="img" aria-label="轴测实训台。带接线盒、散热筋和输出轴的卧式电机位于前方，后方控制柜装有 PLC、接触器、端子排及三盏指示灯。">
    <defs><radialGradient id={`${id}-bg`}><stop stopColor="#16494a" stopOpacity=".65"/><stop offset=".64" stopColor="#16494a" stopOpacity=".31"/><stop offset="1" stopColor="#16494a" stopOpacity="0"/></radialGradient>
      <linearGradient id={`${id}-motor`} x1=".2" y1="0" x2=".75" y2="1"><stop stopColor="#cdd9b9"/><stop offset=".42" stopColor="#92b3a0"/><stop offset="1" stopColor="#56877b"/></linearGradient>
    </defs>
    <ellipse cx="245" cy="132" rx="231" ry="125" fill={`url(#${id}-bg)`}/>
    <g fill="none" stroke="#b6d2bb" strokeWidth=".7" opacity=".24"><path d="m9 185 258-99 190 39M47 213l254-100 155 32M78 239l298-118M24 116l410 86m-363-111 385 81" strokeDasharray="6 5"/>
      <path d="M57 100V65h73m306 42h15v95h-25M30 160h20m-10-10v20M183 57h12m-6-6v12"/>
      <ellipse cx="118" cy="155" rx="34" ry="44" transform="rotate(-22 118 155)" strokeDasharray="4 4"/>
      <path d="m46 185 192-74m-61 91 87 18 77-30" strokeDasharray="10 3 2 3"/></g>
    <g stroke="#082f32" strokeWidth="1.5" strokeLinejoin="round"><path d="m44 208 226 49 177-70-233-45Z" fill="#0c3437" opacity=".55" stroke="none"/>
      <path d="M48 176v38l9 2 6-3v-36m198 41v35l10 2 6-4v-36m154-62v38l9 2 5-4v-37" fill="#47706a"/>
      <path d="m55 201 210 45 173-68v5l-173 69-210-46Z" fill="#39665f"/>
      <path d="m28 169 236 49 189-74-233-48Z" fill="#75998a"/><path d="m28 169 236 49v10L28 179Z" fill="#4d776e"/>
      <path d="m264 218 189-74v10l-189 74Z" fill="#305c57"/><path d="m29 170 235 49 188-74" fill="none" stroke="#b2c3a7" strokeWidth="1.35"/>
      <path d="m60 167 171 35m59-80 126 26M72 163l33 7m266-13 21 4" fill="none" stroke="#527b71" strokeWidth=".75"/>
    </g>
    <Cabinet/>
    <g fill="none" stroke={outline} strokeLinecap="round"><path d="M285 141c-1 16-21 17-31 10s-7-33-23-43c-14-10-25-10-43-7" strokeWidth="4"/>
      <path d="M285 141c-1 16-21 17-31 10s-7-33-23-43c-14-10-25-10-43-7" stroke="#9bb7a0" strokeWidth="1.05"/>
      <path d="M250 180c18 8 75 7 86-5s2-15 4-23" strokeWidth="2.6"/></g>
    <HeroMotor body={`${id}-motor`}/>
    <g stroke={outline} strokeWidth="1.25" strokeLinejoin="round"><path d="m211 183 19-8 31 6-17 8Z" fill={ivory}/><path d="m211 183 33 6v7l-33-7Z" fill="#c59b61"/><path d="m244 189 17-8v7l-17 8Z" fill="#846f50"/>
      <ellipse cx="228" cy="182" rx="4.6" ry="2.5" fill={outline}/><ellipse cx="228" cy="180.5" rx="3.7" ry="2.2" fill="#a5c392"/>
      <ellipse cx="245" cy="184.8" rx="5" ry="2.8" fill={outline}/><path d="M240 183q5 3 10 0v2q-5 3-10 0Z" fill="#a05840"/><ellipse cx="245" cy="182.8" rx="5" ry="2.4" fill="#db9470"/></g>
    <Figure x={56} y={100} n="01" d="M63 100h22l18 19"/><Figure x={327} y={20} n="02" d="M320 20h-22l-13 15"/>
    <Figure x={375} y={212} n="03" d="M368 212h-35l-63-18"/>
  </svg>
}
