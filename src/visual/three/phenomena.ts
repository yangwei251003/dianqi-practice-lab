import type { Snapshot } from '../../core/types'
import type { Point } from './kit'

export const inks={ power:'#ffb428',signal:'#55ecd4',fluid:'#5bcfff',field:'#c090ff',heat:'#ff8266' }
type Ink=keyof typeof inks
type Read=(state:Snapshot)=>number
export type Phenomenon={label:string;ink:Ink;mode:'travel'|'oscillate'|'level';points:Point[];read:Read;phase:number}
const meter=(index:number,scale=1):Read=>state=>state.frame.meters[index][1]/scale
const input=(key:string,scale=1):Read=>state=>state.input[key]/scale
const track=(label:string,ink:Ink,points:Point[],read:Read,mode:Phenomenon['mode']='travel',phase=0):Phenomenon=>({label,ink,points,read,mode,phase})
const arc=(label:string,ink:Ink,left:number,right:number,height:number,depth:number,read:Read)=>track(label,ink,[[left,.32,depth],[left,height,depth],[right,height,depth],[right,.38,depth]],read)
const level=(label:string,ink:Ink,x:number,z:number,height:number,read:Read)=>track(label,ink,[[x,.12,z],[x,height,z]],read,'level')
const loop=(label:string,ink:Ink,x:number,y:number,z:number,rx:number,ry:number,read:Read,mode:Phenomenon['mode']='travel',phase=0)=>track(label,ink,Array.from({length:25},(_,idx):Point=>{const angle=idx*Math.PI/12;return [x+rx*Math.cos(angle),y+ry*Math.sin(angle),z+.12*Math.cos(angle)]}),read,mode,phase)
const jet=(label:string,ink:Ink,x:number,y:number,z:number,read:Read):Phenomenon[]=>[-.19,0,.19].map((offset,idx)=>track(label,ink,[[x+offset,y,z],[x+offset*1.1,y+.04,z+.38],[x+offset*1.45,y+.08+idx*.016,z+.8],[x+offset*1.9,y+.14,z+1.12]],read))
const sun=(x:number,read:Read)=>[-.24,.12].map(offset=>track('入射光照','power',[[x+offset-.52,1.96,-.48],[x+offset-.25,1.49,-.29],[x+offset,.87,-.10]],read))
const binary=(index:number):Read=>state=>Number(state.frame.meters[index][1]>0)
const positive=(read:Read):Read=>state=>Math.max(0,read(state))

export function phenomena(id:number):Phenomenon[] {
  switch(id){
    case 1:return [arc('主馈电仍可供压','power',-1.28,.96,1.23,-.33,state=>1-state.input.main),arc('备用馈电仍可供压','signal',-.39,.96,1.05,.19,state=>1-state.input.reserve),level('母线电压','field',1.51,.30,1.12,meter(0,24))]
    case 2:return [-.27,1.03].flatMap((x,idx)=>[-.3,0,.3].map(offset=>track(idx?'B 灯发光':'A 灯发光','power',[[x+offset*.25,.80,.12],[x+offset*.64,1.15,.16],[x+offset,1.45,.22]],meter(3+idx,6))))
    case 3:return [-.39,0,.39].flatMap((z,source)=>[-.39,0,.39].map((end,dest)=>track('选芯测试脉冲','signal',[[-.95,.34,z],[-.52,.49,z],[.47,.49,end],[.94,.34,end]],state=>Number(state.memory.last===source&&state.frame.meters[dest][1]>0))))
    case 4:return [arc('蜂鸣通路','signal',-1.1,1.02,.89,.32,meter(0)),level('有限电阻读数','field',1.32,.30,1.05,state=>(state.frame.meters.find(([name])=>name==='表显电阻')?.[1]??0)/330.2),level('开路 OL','heat',-1.32,.34,.85,meter(1))]
    case 5:return [arc('支路电流 · 可反向','power',-.97,.65,1.06,.19,meter(1,10)),level('电容储压','field',.95,.22,1.24,meter(0,12))]
    case 6:return ['A','B','C'].map((name,idx)=>loop(name+' 相电流','field',-.98+idx*.98,.82,.1,.32,.36,meter(6+idx,4),'oscillate',idx*2*Math.PI/3)).concat(level('中线电流','power',1.53,.21,1.16,meter(0,5)))
    case 7:return [loop('线圈励磁','field',-1.02,.58,.22,.36,.36,meter(1,24),'level'),arc('辅助触点保持','signal',-.99,-.22,1.15,.30,meter(3)),...jet('风机气流','fluid',1.13,.72,.21,meter(4,1450))]
    case 8:return [arc('正转线圈实际吸合','signal',-1.40,.47,1.18,-.28,binary(0)),arc('反转线圈实际吸合','heat',-.61,.47,1.06,.19,binary(1)),loop('主轴方向','power',1.16,.77,.32,.29,.28,meter(2,1500))]
    case 9:return [arc('星形通路','signal',-1.1,.35,1.12,-.26,binary(2)),arc('三角通路','power',-.52,.79,1.04,.32,binary(3)),level('启动电流倍数','heat',1.42,.40,1.19,meter(1,6))]
    case 10:return [loop('同步旋转磁场','field',-.52,.76,.33,.61,.43,meter(0,1500)),loop('转子机械运动','power',-.52,.76,.38,.43,.29,meter(1,1500))]
    case 11:return [arc('变频输出','power',-1.21,.84,1.40,-.25,meter(1,50)),...jet('出风流线','fluid',.91,.83,.32,meter(3,6000))]
    case 12:return [track('末端供水','fluid',[[-.08,1.25,0],[.18,1.54,-.27],[1.40,1.54,-.27],[1.43,.37,-.27]],meter(2,3)),track('旁通回流','signal',[[.18,1.50,-.27],[.22,1.27,.35],[.94,1.27,.35],[1.03,.38,.35]],meter(3,3)),loop('泵内叶轮','power',-.58,.64,.24,.31,.30,state=>state.input.motor?state.frame.meters[5][1]/100:0)]
    case 13:return [track('光束到达接收端','power',[[-.17,.72,-.51],[-.17,.72,.53]],meter(0)),arc('光电开关 Q','signal',-.17,1.15,1.22,-.18,meter(1)),level('程序累计计数','field',1.45,.35,1.22,meter(4,32))]
    case 14:return [loop('感应区示意','field',-.18,.84,.04,.34,.22,()=>1,'oscillate'),arc('检出反馈 Q','signal',-.18,1.13,1.14,.27,meter(3)),level('探头间隙','fluid',.74,.28,1.04,meter(0,18))]
    case 15:return [arc('4–20 mA 信号','signal',-.63,.90,1.48,-.14,meter(1,20)),level('液柱压力','fluid',-.93,.36,1.40,meter(0,25))]
    case 16:return [track('排水方向','fluid',[[-.71,.53,.16],[-.69,.29,.43],[.52,.29,.43],[1.14,.76,.30]],meter(5)),level('井内液位','fluid',-1.14,.32,1.42,meter(0,100)),arc('自保持反馈','signal',.18,.91,1.27,-.23,meter(4))]
    case 17:return [arc('驱动脉冲','signal',-1.38,.04,1.04,-.24,state=>state.frame.meters[5][1]*state.input.rate/400),track('进给方向','power',[[-1.17,.50,.44],[1.14,.50,.44]],state=>state.frame.meters[5][1]*(state.memory.sign||1))]
    case 18:return [track('阀与气缸','fluid',[[-.98,.38,-.31],[-.62,.87,-.30],[.23,.87,-.30],[.23,.60,.32]],meter(1)),level('定时累计','signal',1.29,.28,1.22,meter(3,2)),level('超时锁存','heat',1.55,.26,.94,meter(4))]
    case 19:return [loop('转子励磁强度','field',-.62,.72,.23,.57,.41,meter(3),'level'),loop('旋转磁场','power',-.62,.72,.28,.43,.30,meter(2,1500)),level('机端电压','signal',1.19,.35,1.31,meter(0,400))]
    case 20:return [loop('铁芯交变磁通','field',-.25,.89,.20,.58,.48,meter(0,400),'oscillate'),level('一次线电压','power',-1.21,.22,1.45,meter(0,400)),level('二次线电压','signal',1.12,.22,1.45,meter(1,230))]
    case 21:return [arc('馈线电流有效值','power',-1.55,1.42,.84,.19,input('amps',30)),...jet('接点损耗示意','heat',.47,.57,.20,meter(5,40)),level('整回路压降','field',1.48,.33,1.23,meter(1,20))]
    case 22:return [[-1.43,-.42],[-.42,.89],[-.42,.33],[.33,1.24]].map(([left,right],idx)=>arc(['F0 记录','FA 记录','FB 记录','FC 记录'][idx],'signal',left,right,.86+idx*.13,-.34+idx*.18,binary(idx)))
    case 23:return [level('录波电流有效值','power',-1.1,.32,1.40,meter(1,10)),arc('录波跳闸命令','heat',-.95,.92,1.36,.12,meter(5)),level('记录中的合位','signal',1.32,.39,1.05,meter(6))]
    case 24:return [loop('投入电容组','field',.64,.73,.27,.53,.41,meter(1,3),'oscillate'),arc('馈线电流有效值','power',-1.32,.93,1.31,-.16,meter(6,70)),level('功率因数','signal',1.32,.33,1.17,meter(5))]
    case 25:return [arc('整流补电频次','power',-1.24,.41,1.03,-.24,meter(0,100)),level('滤波后平均电压','signal',.73,.36,1.16,meter(2,30)),level('峰峰纹波','heat',1.15,.34,.99,meter(1,10))]
    case 26:return [arc('平均输出','power',-1.31,1.12,.97,-.19,meter(0,24)),loop('电感电流纹波','field',.11,.60,.26,.36,.25,meter(1,2),'oscillate'),level('电感谷值','signal',1.27,.36,1.16,meter(2,3))]
    case 27:return [arc('输入平均电流','power',-1.32,.03,1.04,-.19,meter(1,6)),arc('负载电流','signal',.02,1.19,.89,.19,meter(2,3)),level('有效占空比','field',.44,.38,1.06,meter(4,100))]
    case 28:return [loop('基波幅值','field',.22,.77,.22,.65,.31,meter(1,300),'oscillate'),level('选定相位脉宽','signal',-.96,.35,1.18,meter(3,100)),level('桥端电平幅值','power',1.18,.34,1.24,state=>Math.abs(state.frame.meters[2][1])/400)]
    case 29:return [arc('绕组平均电流','power',-.99,.75,1.15,-.15,meter(1,5)),loop('机械转向','signal',1.03,.73,.26,.37,.29,meter(0,1500)),level('转矩幅值','field',-.99,.39,1.05,state=>Math.abs(state.frame.meters[2][1]))]
    case 30:return [arc('市电可用','signal',-1.41,.01,1.27,-.28,state=>Number(!state.input.grid)),arc('后备供电','power',-.72,.94,1.13,.23,state=>Number(!!state.input.grid&&state.frame.meters[0][1]>0)),level('输出包络','fluid',1.36,.30,1.18,meter(0,230))]
    case 31:return [...sun(-1.04,state=>state.input.sun/1000*([1,.6,.25][state.input.shade]??1)),...sun(.48,input('sun',1000)),arc('阵列输出功率','signal',-.61,1.04,1.09,.31,meter(2,300)),level('旁路分区数','heat',1.41,.30,1.05,meter(5,3))]
    case 32:return [...sun(-1.04,state=>[1,.6,.25][state.input.shade]??1),...sun(.48,()=>1),track('电池侧充电','signal',[[-.87,.64,-.08],[-.72,.33,.39],[.05,.34,.62],[.75,.63,.62]],meter(4,10))]
    case 33:return [...jet('来流风速','fluid',-.67,1.54,-.78,input('wind',20)),arc('实际输出功率','power',-.67,1.19,.86,.19,meter(0,2000)),level('大风闭锁','heat',1.40,.35,1.23,meter(3))]
    case 34:return [arc('实际放电电流','power',-.74,1.08,1.27,.02,input('current',10)),level('估计 SOC','signal',-.87,.43,1.32,meter(0,100)),level('参考 SOC','field',-.42,.43,1.32,meter(1,100))]
    case 35:return [arc('电池功率 · 正向充电','signal',.05,-1.24,1.32,.09,meter(0,5)),arc('电网交换 · 正向购电','power',1.31,.10,1.12,-.16,meter(1,8)),level('可用电量比例','field',-1.42,.32,1.18,meter(3,100))]
    case 36:return [track('交流充电功率','power',[[1.14,.86,-.41],[1.12,.29,-.23],[.91,.25,.27],[.56,.4,.63]],meter(3,7)),arc('连接导引反馈','signal',1.08,.44,1.25,-.11,state=>state.input.plug?1:0),level('桩宣告电流上限','field',1.44,.26,1.20,meter(1,32))]
    case 37:return [track('照明输出','power',[[-.48,1.31,0],[-.49,.95,.12],[-.56,.29,.35]],meter(2,8)),arc('延时保持','signal',-.99,.83,1.05,-.36,meter(1,60)),level('环境照度','field',1.32,.31,1.14,meter(0,300))]
    case 38:return [...jet('盘管取热','fluid',-.57,.93,.24,meter(2,5)),arc('阀请求','signal',-.95,.53,1.28,-.21,meter(1)),level('室内温度','heat',1.19,.31,1.30,meter(0,40))]
    case 39:return [...jet('实际换气','fluid',.73,.92,.14,meter(3,12)),track('车流排放','heat',[[-1.25,.38,.18],[-.94,.66,.13],[-.70,1.14,.03],[-.34,1.36,-.14]],input('traffic',8)),level('探头示值','signal',-1.33,.32,1.30,meter(1,100))]
    case 40:return [track('光幕受阻记录','heat',[[-.49,.79,.31],[.49,.79,.31]],meter(3)),arc('闭位反馈','signal',-.63,1.13,1.47,-.32,meter(4)),arc('门锁反馈','power',.48,1.13,1.22,.12,meter(5))]
    case 41:return [track('南北通行许可','signal',[[0,.28,-.89],[0,.31,.02],[0,.28,.90]],meter(4)),track('东西通行许可','power',[[-1.49,.25,.12],[.02,.31,.12],[1.46,.25,.12]],meter(7)),level('双红清空','heat',1.24,.44,1.00,meter(2))]
    case 42:return [arc('邻车受能','signal',-.92,1.37,1.16,-.25,meter(0,300)),arc('站旁回收','power',-.92,.53,1.01,.18,meter(1,300)),...jet('车载耗散','heat',-.87,.70,.3,meter(2,300))]
    case 43:return [track('输送方向','power',[[-1.37,.55,.34],[-.27,.55,.34],[1.34,.55,.34]],state=>state.frame.meters[2][1]>0&&!state.input.outlet&&!state.frame.meters[3][1]?state.input.speed/600:0),track('光电检出','signal',[[.03,.65,-.44],[.03,.65,.43]],meter(0)),level('连续占位计时','heat',1.27,.36,1.13,meter(1,5))]
    case 44:return [-.45,.45].map((z,idx)=>track('泵 '+(idx?'B':'A')+' 排水',idx?'signal':'fluid',[[-1.20,.48,z*.4],[-.57,.28,z],[.49,.38,z],[.58,1.05,z],[1.41,1.04,.03]],meter(2+idx))).concat(level('集水井液位','fluid',-1.51,.28,1.34,meter(1,100)))
    case 45:return [arc('拟供关键支路','signal',-1.39,1.1,1.26,-.22,meter(7)),arc('拟供总有功','power',-1.37,.58,1.04,.19,meter(2,100)),level('缓供负荷','heat',1.38,.31,1.15,meter(8,50))]
    case 46:return [level('A 库温度 · 相对 0°C','fluid',-.89,.34,1.28,state=>state.frame.meters[0][1]/10),level('B 库温度 · 相对 0°C','field',.63,.34,1.28,state=>state.frame.meters[1][1]/10),arc('两区瞬时用电','power',-1.28,1.18,1.39,-.29,meter(3,8))]
    case 47:return [track('测距链路','signal',[[-1.36,.87,.28],[1.21,.87,.28]],state=>state.input.link?0:1),level('实际位置比例','power',.88,.37,1.29,meter(2,10)),level('反馈位置比例','field',1.22,.37,1.29,meter(3,10))]
    case 48:return [arc('光伏入母线','power',-1.28,.05,1.19,-.24,input('pv',22)),arc('储能交换 · 正向放电','signal',-.30,.06,.87,.29,meter(1,8)),arc('并网交换 · 正向购电','field',1.36,.06,1.35,-.16,meter(0,12)),arc('车辆充电','fluid',.07,.75,1.02,.39,positive(meter(2,15)))]
    default:throw new Error('未登记的工位：'+id)
  }
}
