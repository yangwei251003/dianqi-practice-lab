export type Values = Record<string, number>
export type Form = 'meter' | 'terminal' | 'lamp' | 'contactor' | 'motor' | 'drive' | 'pump' | 'sensor' | 'plc' | 'tank' | 'generator' | 'transformer' | 'relay' | 'board' | 'ups' | 'solar' | 'wind' | 'battery' | 'charger' | 'hvac' | 'signal' | 'conveyor' | 'cabinet'
export interface Device {
  maker: string; model: string; name: string; form: Form; url: string; document: string; locator: string
  features: string[]; dimensions?: [number, number, number]
}
export interface Control {
  id: string; label: string; kind: 'range' | 'choice' | 'button'; initial: number
  min?: number; max?: number; step?: number; unit?: string; options?: string[]
}
export interface Part { label: string; detail: string; control: string; value?: number }
export type Meter = [label: string, value: number, unit: string]
export interface Plot { title: string; x: string; y: string; points: [number, number][] }
export interface Frame { meters: Meter[]; active: number[]; note: string; plots?: Plot[] }
export interface Snapshot { input: Values; memory: Values; frame: Frame; time: number; action: string }
export type Move = [string, number] | number
export interface Trial { name: string; moves: Move[]; verify: (state: Snapshot) => boolean }
export interface Quiz { ask: string; options: string[]; answer: number; why: string }
export interface Panel { speaker: string; line: string; focus: number }
export interface Lesson {
  id: number; title: string; context: string; question: string; task: string; prerequisites: number[]
  device: Device; parts: Part[]; controls: Control[]; initialMemory?: Values
  advance?: (memory: Values, input: Values, before: Values, action: string, dt: number, time: number) => Values
  sample: (input: Values, memory: Values, time: number) => Frame
  diagram: { nodes: string[]; edges: [number, number][] }
  wiring?: {terminals: string[]; leads: {control:string; from:number; to:number}[]}
  ladder?: {rungs: {output:string; slots:{control:string; options:string[]}[]}[]}
  prediction: Quiz; explanation: Quiz; comic: Panel[]
  goals: { text: string; check: (state: Snapshot) => boolean }[]
  assumptions: string; review: boolean; trials: Trial[]; practice?: Move[]
}
export const range = (id: string, label: string, initial: number, min: number, max: number, step: number, unit = ''): Control => ({kind:'range',id,label,initial,min,max,step,unit})
export const choice = (id: string, label: string, initial: number, ...options: string[]): Control => ({kind:'choice',id,label,initial,options})
export const button = (id: string,label: string): Control => ({kind:'button',id,label,initial:0})
export const part = (label: string,detail: string,control: string,value?: number): Part => ({label,detail,control,value})
export const quiz = (ask: string,options: string[],answer: number,why: string): Quiz => ({ask,options,answer,why})
export const strip = (lines: string[], focuses = [0,1,2,0,1,2]): Panel[] => lines.map((line,index)=>({speaker:index % 2 ? '周工' : '小岚',line,focus:focuses[index] ?? 0}))
export const graph = (nodes:string[],edges:[number,number][]):Lesson['diagram']=>({nodes,edges})
export const near = (actual:number, expected:number, tolerance=0.001) => Math.abs(actual-expected)<=tolerance
