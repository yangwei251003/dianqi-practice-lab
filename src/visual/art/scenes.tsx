import { At, Wire, ink, petrol, rust } from './ink'
import * as D from './devices'
import * as M from './machines'
import * as F from './field'
import * as I from './instruments'
import { Notebook } from './people'

const equipment = {
  isolator:D.Isolator, lamp:D.Lamp, terminals:D.Terminals, meter:D.Meter, scope:D.Scope, breakers:D.Breakers,
  contactor:D.Contactor, plc:D.Plc, buttons:D.Buttons, drive:D.Drive, relay:D.Relay, cabinet:D.TallCabinet,
  supply:D.Supply, ups:D.Ups, battery:D.Battery, cells:D.CellBank, transformer:D.Transformer, caps:D.CapBank,
  laptop:D.Laptop, server:D.Server, beacon:D.Beacon,
  rc:()=> <D.Board kind="rc"/>, bridge:()=> <D.Board kind="bridge"/>, buck:()=> <D.Board kind="buck"/>,
  boost:()=> <D.Board kind="boost"/>, inverter:()=> <D.Board kind="inverter"/>, hbridge:()=> <D.Board kind="hbridge"/>, continuity:()=> <D.Board kind="continuity"/>,
  motor:M.Motor, generator:()=> <M.Motor generator/>, fan:M.Fan, lathe:M.Lathe, brake:M.Brake,
  pump:M.Pump, valve:M.Valve, tank:M.Tank, floats:()=> <M.Tank floating/>, belt:M.Conveyor,
  queue:()=> <M.Conveyor boxes={2}/>, rollers:()=> <M.Conveyor boxes={0}/>, eye:M.Photoeye, inductive:M.Inductive,
  samples:M.Tags, slide:M.Slide, ram:M.Ram, blower:M.Blower, grille:M.Grille, thermostat:M.Thermostat, gauge:M.PressureGauge,
  pylon:F.Pylon, substation:F.Substation, factory:F.Factory, house:F.House, pv:F.Solar, turbine:F.Turbine,
  evse:F.Charger, car:F.Car, stairs:F.Stairs, pir:F.Pir, door:F.Landing, signal:F.Signal, crossing:F.Crossing,
  train:F.Train, cold:F.ColdStore, crate:F.Crate, racks:F.Racks, stacker:F.Stacker, pole:F.InsulatorPole,
  sun:F.Sun, cloud:F.Cloud, lamps:F.LightBank, tag:F.GroundTag, packer:F.PackGate,
  prover:I.Prover, energyMeter:I.EnergyMeter, timeRelay:I.TimeRelay, smartRelay:I.SmartRelay, pair:I.Pair,
  drum:I.Drum, immersion:I.Immersion, stepper:I.Stepper, dcRoll:I.DcRoll, dryTransformer:I.DryTransformer,
  gas:I.GasSensor, laser:I.Laser, monitor:I.Monitor, lightbox:I.Lightbox, logbook:()=> <Notebook x={14} y={7} scale={1.42}/>,
}
export type Gear = keyof typeof equipment
export type Site = 'bench'|'machine'|'water'|'line'|'grid'|'roof'|'road'|'building'|'rail'|'store'|'power'
export type Gesture = 'log'|'probe'|'turn'|'press'|'move'|'code'|'trace'|'compare'|'select'
type Item = readonly [gear: Gear, x: number, y: number, scale: number]
export interface Study {
  title: string; site: Site; gesture: Gesture; application: Gear; detail: readonly Gear[]; items: readonly Item[]; wiring: string
}

function study(title: string, site: Site, gesture: Gesture, application: Gear, detail: Gear[], items: Item[], wiring = ''): Study {
  return { title,site,gesture,application,detail,items,wiring }
}

// Coordinates are composed in the 152 × 82 plate. Draw rear equipment first.
const studies: Study[] = [
  study('实训台开工判断','bench','log','cabinet',['prover','isolator','tag','meter','logbook'],[
    ['tag',91,1,.66],['isolator',49,4,1.33],['prover',11,24,.96],['meter',100,32,.81]],'M40 61q9 11 21 5l12-5m15-5q16-10 28 0'),
  study('24 V 照明板','bench','probe','lightbox',['supply','lamp','lamp','supply'],[
    ['supply',6,10,1.12],['lamp',86,0,1.17],['lamp',49,28,1.03]],'M21 43c-4 8 5 15 14 17l25 6m-29-22c11-12 41-12 70-4m13 5c8 9-1 16-10 20l-12 5'),
  study('控制柜端子排','bench','trace','cabinet',['terminals','terminals','terminals','terminals'],[
    ['cabinet',3,8,1.07],['terminals',57,13,1.38],['terminals',66,40,.83]],'M38 48c18-3 25-10 37-5m-35 9c17 2 20-9 35-6m-34 9c13 4 20-5 33-5'),
  study('万用表查断点','bench','probe','drum',['meter','meter','meter','continuity'],[
    ['continuity',61,13,1.42],['meter',13,11,1.41]],'M46 65c8 9 28 10 37-5m22-16 10-2'),
  study('RC 实验板','bench','turn','scope',['rc','rc','buttons','scope'],[
    ['scope',80,4,1.06],['supply',8,8,.72],['rc',30,24,1.29]],'M27 33q-8 14 4 22l16 5m32-7c13 2 18-6 20-12'),
  study('三相照明配电','building','move','factory',['energyMeter','energyMeter','energyMeter','terminals'],[
    ['lamps',56,1,.85],['lamps',91,12,.9],['energyMeter',8,16,1.17],['lamps',56,40,.86]],'M48 44l12-6V24m-11 25 28 3 28-15m-57 17 13 5'),
  study('风机点动与自锁','machine','press','blower',['contactor','contactor','buttons','buttons'],[
    ['contactor',11,11,1.12],['fan',71,1,1.40],['buttons',48,40,.81]],'M40 49q1 11 19 13m15 1c14-1 21-7 23-12'),
  study('机床主轴正反转','machine','press','lathe',['pair','pair','pair','lathe','relay'],[
    ['contactor',5,10,.71],['contactor',30,16,.71],['lathe',60,4,1.50],['buttons',39,43,.67]],'M23 41q0 13 31 18m-7-12 37 8'),
  study('星三角启动台','machine','select','pump',['timeRelay','timeRelay','timeRelay','buttons'],[
    ['contactor',16,2,.73],['contactor',40,6,.73],['contactor',64,11,.73],['motor',79,25,1.13],['timeRelay',14,32,.88]],'M31 33l2 12m20-9 2 6 37 8m-14-9 16 5'),
  study('异步电机负载台','machine','turn','belt',['motor','motor','brake','meter'],[
    ['gauge',93,0,.84],['brake',53,11,1.30],['motor',8,23,1.24]],'M51 52l18-8m-18 10 18-8m35-12 4-7'),
  study('变频风机','machine','turn','grille',['drive','drive','buttons','drive','contactor'],[
    ['drive',8,13,1.13],['grille',99,5,.78],['fan',57,11,1.43]],'M41 59c6 14 30 13 45-1'),
  study('离心水泵','water','turn','tank',['pump','valve','valve','grille','pump','drive'],[
    ['gauge',73,-1,.82],['valve',98,14,.87],['pump',15,12,1.48]],'M51 27v-8l27 5v8m3 1 31 6m15 4 9 3v8'),
  study('光电计数','line','code','packer',['eye','belt','eye','smartRelay'],[
    ['eye',87,-2,.70],['plc',106,10,.65],['eye',17,3,1.00],['belt',45,20,1.35]],'M41 42l13-6m44-6-10 10'),
  study('金属工件检测','line','move','stacker',['inductive','samples','slide','relay'],[
    ['inductive',65,-1,1.37],['samples',18,27,1.38],['relay',98,37,.70]],'M126 49c8-12 1-18-8-20'),
  study('储罐液位变送器','water','compare','tank',['tank','immersion','meter','plc'],[
    ['tank',15,5,1.39],['plc',88,18,.95],['immersion',57,29,.93]],'M69 21q4-7 12 0m3 19 7-6 11 2'),
  study('双液位排水','water','code','pump',['floats','floats','smartRelay','tank'],[
    ['smartRelay',88,8,.84],['floats',13,3,1.51],['pump',73,35,.98]],'M70 52h8v11h10m23-26v12'),
  study('步进定位台','machine','move','slide',['drive','stepper','slide','slide'],[
    ['drive',5,1,.77],['stepper',10,26,.82],['slide',47,9,1.55]],'M38 31q13 2 9 15m-7 12 17-7'),
  study('气动分拣','line','code','crate',['belt','ram','ram','smartRelay','buttons'],[
    ['eye',12,7,.82],['ram',66,-3,1.07],['rollers',26,22,1.31],['crate',103,34,.75]],'M98 27l-8 10-5 4'),
  study('教学发电机','machine','turn','substation',['generator','generator','energyMeter','relay'],[
    ['supply',9,4,.88],['gauge',91,0,.83],['generator',43,16,1.38]],'M25 38q4 20 32 20m32-17 12-13'),
  study('配电变压器','grid','compare','house',['dryTransformer','dryTransformer','dryTransformer','meter'],[
    ['pole',105,-1,.92],['meter',6,17,.79],['dryTransformer',39,9,1.50]],'M30 54c13 5 19-5 28-6m29-22q16 1 27-12'),
  study('配电线路','grid','move','factory',['drum','drum','meter','terminals'],[
    ['house',89,0,1.00],['meter',86,34,.77],['drum',11,7,1.47]],'M70 59q14 9 28 2m-8-8c5-10 9-9 12-21'),
  study('放射式馈线','grid','trace','house',['relay','relay','relay','logbook'],[
    ['house',88,-1,.71],['substation',12,12,1.16],['factory',77,25,1.05]],'M46 40l16 3 1-17 29-7m-29 24 20 4m-20-4v18l13 3'),
  study('馈线保护','grid','trace','substation',['scope','relay','breakers','timeRelay'],[
    ['pylon',84,0,1.08],['breakers',99,29,.83],['relay',10,10,1.48]],'M58 59q20 6 31-3l16-7m1-32q10 4 21 1'),
  study('无功补偿柜','power','press','factory',['relay','caps','caps','energyMeter'],[
    ['relay',91,2,.88],['caps',24,3,1.44],['breakers',88,32,.81]],'M69 57l11 3 25-8m5-18v8'),
  study('单相整流','bench','compare','supply',['bridge','bridge','supply','scope'],[
    ['scope',90,4,.96],['supply',9,1,.75],['bridge',27,24,1.39]],'M23 30q-6 21 16 23m49-5q11 1 21-12'),
  study('Buck 降压','bench','turn','plc',['buck','buck','supply'],[
    ['supply',13,2,1],['buck',48,18,1.31],['meter',111,27,.74]],'M42 40q7 11 22 13m39 0 11 5'),
  study('Boost 升压','bench','turn','battery',['supply','boost','boost'],[
    ['scope',83,3,1.02],['boost',15,15,1.45],['cells',88,40,.72]],'M72 54l12 3 14-8m-17 5-2-9 17-6'),
  study('单相逆变','power','turn','lamps',['inverter','inverter','scope','inverter'],[
    ['scope',13,1,1.04],['inverter',61,14,1.40],['lamp',12,41,.68]],'M34 38c-1 14 14 21 34 15m-37 7 24 5 19-8'),
  study('直流电机 H 桥','line','press','packer',['hbridge','hbridge','dcRoll','hbridge'],[
    ['dcRoll',77,-1,1.21],['hbridge',21,19,1.30],['buttons',97,40,.72]],'M71 48q13 6 20-8m-20 13q14 4 24-8'),
  study('UPS 供电连续性','power','press','server',['ups','battery','server','scope'],[
    ['server',86,-1,1.27],['ups',15,14,1.16],['battery',67,38,.78]],'M56 48l17 3 19-9m-38 11 15 8'),
  study('屋顶光伏阵列','roof','move','house',['pv','pv','meter'],[
    ['cloud',11,-1,.84],['pv',65,0,1.18],['pv',23,20,1.22]],'M66 61q13 11 33-3'),
  study('光伏最大功率跟踪','roof','code','evse',['pv','drive','drive','laptop'],[
    ['pv',11,3,1.41],['drive',77,5,.85],['laptop',86,35,.88]],'M63 55q14 5 24-9m11-8 10 13'),
  study('风力发电机','roof','compare','substation',['turbine','turbine','turbine'],[
    ['turbine',74,6,.97],['substation',96,32,.72],['turbine',11,-1,1.68]],'M17 21q14-6 21-4m-17 11 11-3m38 32q8-3 18-1'),
  study('电池管理系统','power','log','car',['cells','meter','relay','energyMeter'],[
    ['relay',82,4,1.02],['cells',15,17,1.52]],'M42 52l8-9 21 4 19-9m-36 19 19-9 16-7'),
  study('双向储能变流器','power','turn','pv',['pv','energyMeter','battery','cabinet'],[
    ['cabinet',57,0,1.04],['substation',100,10,.72],['battery',10,30,1.08]],'M48 55q11 3 26-8m15-10 17-6m-57 26q15 3 24-5'),
  study('交流充电设施','road','press','car',['car','evse','evse','scope','car'],[
    ['evse',13,2,1.40],['car',69,11,1.31]],'M60 45c12 15 17 5 31 2'),
  study('楼道感应灯','building','move','stairs',['pir','pir','pir','stairs'],[
    ['lamps',72,-1,.87],['pir',18,0,.82],['stairs',51,24,1.26]],'M43 26l19 24m-21-23 4 20'),
  study('风机盘管','building','turn','grille',['thermostat','thermostat','blower','laptop'],[
    ['thermostat',92,3,.81],['blower',12,10,1.48],['valve',82,32,.87]],'M70 49l15 2 3 6m24-25v9'),
  study('地库分级排风','building','compare','car',['gas','relay','blower'],[
    ['gas',85,0,.89],['blower',13,3,1.08],['car',57,25,1.27]],'M44 14l5-6 37 8m-7-1 6 2'),
  study('电梯门系统','building','trace','door',['door','door','relay','logbook'],[
    ['door',22,0,1.44],['monitor',85,21,.97]],'M69 46l21 4 9 3m-7-22-16 8'),
  study('道路信号机','road','code','crossing',['crossing','crossing','relay'],[
    ['signal',83,-7,1],['crossing',33,15,1.45],['signal',10,11,1.36],['car',95,42,.68]],'M19 62l14 4 23-10'),
  study('轨道再生制动','rail','compare','substation',['train','train','battery','meter'],[
    ['substation',86,1,.94],['train',7,10,1.52]],'M18 17l19-7 79 16m-69-10 1 8'),
  study('包装输送线','line','trace','crate',['eye','belt','packer','timeRelay'],[
    ['eye',20,-3,.77],['packer',76,0,1.07],['queue',15,20,1.33],['beacon',105,28,.68]],'M79 57l26-13'),
  study('污水双泵站','water','press','floats',['floats','pump','pump','tank'],[
    ['floats',17,0,1.16],['pump',79,8,.96],['pump',59,34,.97]],'M61 42l7 3 18-9m-18 9-5 13m43-29 12-5v-7'),
  study('厂房配电','grid','select','factory',['factory','belt','rc','energyMeter'],[
    ['substation',10,-1,.89],['factory',73,4,1.22],['generator',21,32,.88]],'M48 33l14 3 18 4m-19-4v15L53 57'),
  study('冷链仓','store','turn','crate',['cold','cold','crate','monitor','relay','timeRelay'],[
    ['thermostat',8,8,.79],['cold',48,0,1.37],['crate',24,34,1.0]],'M34 40q9 5 22-2'),
  study('物流堆垛机','store','move','racks',['racks','laser','stacker','monitor'],[
    ['racks',82,-2,1.17],['stacker',32,6,1.40],['rollers',9,39,.77],['laser',102,42,.57]],'M56 68l47-19m-39 22 47-19'),
  study('园区光储充','roof','log','factory',['pv','battery','evse','energyMeter','factory'],[
    ['pv',5,4,1.00],['substation',86,-1,.76],['battery',14,36,.88],['evse',61,20,1.02],['car',99,36,.77]],'M41 41l12 2 20-8 23 4m-45 4v14l-8 3m12-16 22 6'),
]

export function getStudy(id: number): Study { return studies[id-1] ?? studies[0] }

export function Equipment({ name }: { name: Gear }) {
  const Drawing = equipment[name]
  return <g data-equipment={name} fill="none" stroke={ink} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"><Drawing/></g>
}

export function Plate({ scene }: { scene: Study }) {
  return <g>
    {scene.items.map(([name,x,y,s],i)=><g key={`${name}-${i}`} transform={`translate(${x} ${y}) scale(${s})`}>
      {name!=='cloud' && name!=='sun' && <ellipse cx="27" cy="40" rx="21" ry="3.1" transform="rotate(-5 27 40)" fill={ink} opacity=".13"/>}
    </g>)}
    {scene.wiring && <Wire d={scene.wiring} color={petrol} weight={1.55}/>}
    {scene.items.map(([name,x,y,s],i)=><At key={`${name}-${i}`} x={x} y={y} s={s}><Equipment name={name}/></At>)}
    {scene.title==='光电计数' && <Wire d="m39 19 36 20" color={rust} weight={1} dash="2 2"/>}
  </g>
}
