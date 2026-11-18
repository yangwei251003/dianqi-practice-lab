import { lessons as foundation } from '../content/foundation'
import { lessons as automation } from '../content/automation'
import { lessons as energy } from '../content/energy'
import { lessons as systems } from '../content/systems'
import checked from '../data/verified.json'
import type {Lesson} from './types'

export const lessons:Lesson[]=[...foundation,...automation,...energy,...systems].sort((left,right)=>left.id-right.id)
export const byId=(id:number)=>lessons.find(lesson=>lesson.id===id)
const verified=new Set<number>(checked)
export const status=(lesson:Lesson)=>!verified.has(lesson.id)?'开发验证中':lesson.review?'待专业复核':'已开放'
export const groups=[
  ['电工基础与测量','FOUNDATIONS','从端子、仪表和一盏灯开始。','#e9e8d4','#556642'],
  ['电机与传动','DRIVES','让轴转起来，再解释它为什么转。','#dce9e4','#386756'],
  ['传感器与 PLC','AUTOMATION','把工件、液位与位置变成程序信号。','#e0e9ee','#3c6577'],
  ['发输变配与保护','POWER SYSTEMS','沿单线图追踪电能和事件。','#efe5d0','#806232'],
  ['电力电子与电源','CONVERSION','用开关、波形和测量理解变换。','#dfe5ed','#4e6080'],
  ['新能源、储能与充电','NEW ENERGY','用功率与能量账本看供需。','#e7e8cf','#686c3c'],
  ['建筑与交通设施','INFRASTRUCTURE','在身边的设施中找到控制逻辑。','#efe0d5','#86614a'],
  ['综合应用实训','INTEGRATION','让多台设备一起对一个结果负责。','#dce8e3','#4c6e62']
] as const
export const groupIndex=(id:number)=>Math.floor((id-1)/6)
export const num=(value:number)=>String(value).padStart(2,'0')
export const paths=[
  {title:'从现场认识电气',tag:'起点 · 无前置',goal:'辨认能源、隔离与保护；面对不充分的信息能做出停止判断。',pass:'向同学解释为什么“指示灯灭”不是可开工证据。',ids:[1],next:'下一站：从图纸找到实物'},
  {title:'从图纸找到实物',tag:'基础 · 建议先学 01',goal:'追踪线号、改变电路、选择测点，用读数找出异常。',pass:'找到断点，并用两个测点的结果支持判断。',ids:[2,3,4,5,6],next:'下一站：让设备按预期动作'},
  {title:'让设备按预期动作',tag:'控制 · 建议先学 02–04',goal:'区分指令、触点状态和机械结果，认识电机与负载的关系。',pass:'解释为什么松开按钮可能继续运行，而恢复供电不能等同于启动。',ids:[7,8,10,9,11,12],next:'下一站：把物理变化送入程序'},
  {title:'把物理变化送入程序',tag:'自动化 · 建议先学 07、08',goal:'用沿、阈值、记忆与定时组织控制，根据记录定位超时。',pass:'让一个停住的箱子只计一次，并找到分拣未完成的原因。',ids:[13,14,15,16,17,18],next:'下一站：选择兴趣方向'},
  {title:'选一条专业支线',tag:'拓展 · 按兴趣选修',goal:'沿电网、变换、新能源或楼宇交通进入真实行业问题，而非按编号刷课。',pass:'向同学解释两个相邻设备之间怎样传递能量或信号。',ids:[19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42],next:'下一站：综合任务'},
  {title:'独立完成一个系统任务',tag:'综合 · 按场景补课',goal:'在产能、温度、液位、备用容量或功率约束中作出取舍。',pass:'提交一份包含预测、实际读数、异常原因与迁移结论的实验报告。',ids:[43,44,45,46,47,48],next:'回到记录，复习错因或尝试另一条支线'}
]
export const references=[
  ['专业培养','西昌学院 · 电气工程及其自动化专业人才培养方案','本科 2025 版；用来确定课程之间的联系，而非代替实验设备手册。','https://www.xcc.edu.cn/jxydqgc/366154/jxgl88/716833/index.html'],
  ['实验实训','上海海事大学 · 电工电子实验中心','实际开设项目包括继电接触器、星三角、交通信号、分段输送及电梯控制。','https://jcsysx.shmtu.edu.cn/12481/list.htm'],
  ['综合实训','上海海事大学 · 中心实验室、实验课程与实验项目','工位设计参考：光机电集成、仓储、气动与传感。','https://plc.shmtu.edu.cn/2018/1015/c6811a54819/page.htm'],
  ['型号对照','西门子 · SIMATIC S7-1200 G2 系统手册','V4.1，2025-12，附录 A.5，表 A-25：1214C DC/DC/DC 的订货号 6ES7214-1AH50-0XB0。仅作 PLC 型号识读对照；16、18 的主设备为 Zelio，不宣称实现博途工程下载。','https://cache.industry.siemens.com/dl/files/791/109997791/att_1350879/v1/S71200_G2_system_manual_en-US_en-US.pdf'],
  ['行业应用','美国能源部 · Improving Pumping System Performance','第 2 版，Figure 1 及系统曲线章节：区分泵特性曲线与系统运行点。','https://www.energy.gov/sites/prod/files/2014/05/f16/pump.pdf'],
  ['行业应用','巴塞罗那交通运营方 TMB · MetroCHARGE','现实中的再生能量利用案例；不据此推定中国铁路现场规则。','https://www.tmb.cat/en/get-to-know-tmb/innovation-and-projects/next-generation-eu-subsidies/singular-projects-and-electric-mobility'],
  ['安全边界','国家标准信息公共服务平台 · GB/T 13869–2017','用电安全导则：请按适用日期复核；新版 GB/T 13869–2026 将于 2027-02-01 实施。','https://std.samr.gov.cn/gb/search/gbDetailed?id=N1sPm%2FYzMfc%3D&mode=p'],
  ['充电边界','国家标准全文公开系统 · GB/T 18487.1–2023','电动汽车传导充电系统 第 1 部分：通用要求；条目含第 1 号修改单。','https://openstd.samr.gov.cn/bzgk/std/newGbInfo?hcno=AEF144D5381E9FDBD265AFA5A87595A3']
]
