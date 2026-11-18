import type { ReactNode } from 'react'

// Material colours stay consistent across the field guide. The page supplies the paper.
export const ink = '#193f42'
export const petrol = '#316b68'
export const sea = '#74a59a'
export const mist = '#b8cec0'
export const paper = '#f2e8cc'
export const cream = '#fffae9'
export const brass = '#e0a451'
export const rust = '#b65d40'
export const blue = '#548797'
export const skin = '#e9ae7c'

export function At({ x = 0, y = 0, s = 1, children }: { x?: number; y?: number; s?: number; children: ReactNode }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}>{children}</g>
}

// The front face is a drawable local plane. Depth recedes along the second axis.
export function Case({ x, y, w, d, h, face = mist, top = paper, side = petrol, children }: {
  x: number; y: number; w: number; d: number; h: number; face?: string; top?: string; side?: string; children?: ReactNode
}) {
  const r = w * .22, u = d * .55
  return <g transform={`translate(${x} ${y - h})`}>
    <path d={`M0 0 ${d} ${-u} ${d + w} ${r - u} ${w} ${r}Z`} fill={top}/>
    <path d={`M${w} ${r} ${w + d} ${r - u}v${h}l${-d} ${u}Z`} fill={side}/>
    <g transform="matrix(1 .22 0 1 0 0)"><rect width={w} height={h} fill={face}/>{children}</g>
  </g>
}

export function Wire({ d, color = ink, weight = 1.45, dash }: { d: string; color?: string; weight?: number; dash?: string }) {
  return <path d={d} fill="none" stroke={color} strokeWidth={weight} strokeDasharray={dash}/>
}

export function Screw({ x, y, r = 1.25 }: { x: number; y: number; r?: number }) {
  return <g transform={`translate(${x} ${y})`} strokeWidth=".7"><circle r={r} fill={paper}/><path d={`M${-.55 * r} ${.5 * r}l${1.1 * r} ${-r}`}/></g>
}

export function Mark({ x, y, children, size = 5.5, color = ink, center = false }: {
  x: number; y: number; children: ReactNode; size?: number; color?: string; center?: boolean
}) {
  return <text x={x} y={y} fill={color} stroke="none" fontFamily="ui-monospace, Consolas, monospace" fontWeight="700" fontSize={size} textAnchor={center ? 'middle' : 'start'}>{children}</text>
}

export function Dial({ x, y, r = 7, angle = 0 }: { x: number; y: number; r?: number; angle?: number }) {
  return <g transform={`translate(${x} ${y})`} strokeWidth=".85">
    <circle r={r} fill={paper}/><path d={`M${-.72*r} 0a${.72*r} ${.72*r} 0 1 1 ${1.44*r} 0`} fill="none"/>
    {[-65,-32,0,32,65].map(a=><path key={a} d={`M0 ${-.72*r}v${.2*r}`} transform={`rotate(${a})`}/>)}
    <path d={`M-1 1 0 ${-.57*r} 1 1Z`} fill={rust} stroke={rust} transform={`rotate(${angle})`}/><circle r="1" fill={ink}/>
  </g>
}

export function Rotor({ x, y, r = 12, guard = true }: { x: number; y: number; r?: number; guard?: boolean }) {
  return <g transform={`translate(${x} ${y}) scale(${r/12})`}>
    <circle r="12" fill={ink}/><circle r="10.7" fill={sea} stroke={paper} strokeWidth=".6"/>
    {[0,90,180,270].map(a=><path key={a} transform={`rotate(${a})`} d="M0-1C-1-6 0-9 4-10Q8-8 9-5C5-6 3-4 2 0Z" fill={paper} strokeWidth=".7"/>)}
    <circle r="2" fill={brass}/>{guard && <g fill="none" strokeWidth=".6"><circle r="7.6"/><path d="M-10.8 0h21.6M0-10.8v21.6"/></g>}
  </g>
}

export function Target({ x, y, r = 6 }: { x: number; y: number; r?: number }) {
  return <g transform={`translate(${x} ${y})`} fill="none"><circle r={r} stroke={cream} strokeWidth="2.8"/><circle r={r} stroke={rust} strokeWidth="1.35" strokeDasharray="5 2"/></g>
}

export function Arrow({ x, y, angle = 0, length = 14, color = rust }: { x: number; y: number; angle?: number; length?: number; color?: string }) {
  return <g transform={`translate(${x} ${y}) rotate(${angle})`} stroke={color} fill="none" strokeWidth="1.65"><path d={`M0 0h${length}m-4-2.8 4 2.8-4 2.8`}/></g>
}
