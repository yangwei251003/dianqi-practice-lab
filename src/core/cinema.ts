import { initialise, perform, type Run } from './engine'
import type { Lesson } from './types'

export type Cue={caption:string;seconds:number;commands:string;rate:number;pulse?:string}
const cue=(caption:string,commands:string,seconds=3.2,rate=1,pulse?:string):Cue=>({caption,commands,seconds,rate,pulse})
export const sequences:Record<number,Cue[]>={
1:[cue('主路与备用路都能维持母线电压。灯灭不能证明没有能量。','main=0 reserve=0'),cue('隔离主路：备用路仍然供电，观察另一条路径。','main=1'),cue('双路隔离后，储能逐渐释放；消退不是现场许可。','reserve=1',4),cue('观察证据不足时的判断：暂缓开始。','defer')],
2:[cue('两灯串联：追踪同一回路，再比较两端分压。','w02=1 w34=1 w15=1 power=1'),cue('先撤去测试电源，电流与灯光一起消失。','power=0'),cue('改成并联：两支路各跨电源，比较亮度与总电流。','w34=0 w04=1 w13=1 power=1')],
3:[cue('从 X1.1 发追线信号，注意并非同号端子响应。','send=0 ping'),cue('改从第二芯发信，比较交叉走向。','send=1 ping'),cue('修正两芯的连接，再从第一芯验证回响。','w04=0 w13=0 w03=1 w14=1 send=0 ping'),cue('第三芯另测，不能从一次回响推断整排正确。','send=2 ping')],
4:[cue('断电板：在完好的一段两端测通断，观察测试通路。','dial=1 red=0 black=1'),cue('跨过断开的熔芯，测试路径中断。','red=1 black=2'),cue('换成完好的模拟标件，再测同一对端点。','fault=2'),cue('330 Ω 标件改用电阻挡，数值不是电压。','fault=3 dial=2')],
5:[cue('合上充电支路：初始电流大，电容电压逐渐上升。','resistor=2 cap=1 contact=1',4),cue('悬置后，储能仍在，但理想支路电流为零。','contact=0'),cue('改接放电支路：电流反向，电压按指数衰减。','contact=2',4)],
6:[cue('三相分配不均：比较三个相量与中线电流。','a=4 b=1 c=2'),cue('三相均分；各支路仍有电流，中线矢量和接近零。','a=2 b=2 c=2'),cue('在虚拟不平衡工况断开中线，观察星点与灯端电压。','a=4 b=1 neutral=1')],
7:[cue('点动：按住按钮，线圈得电，叶轮从静止加速。','power=1 mode=0 start=1'),cue('松手：接触器释放，叶轮靠惯性减速。','start=0'),cue('自锁：吸合后辅助触点可以维持线圈。','mode=1 start=1',1.8),cue('松开启动键，保持支路仍然导通。','start=0'),cue('断电使保持消失。','power=0',1.8),cue('恢复电源，风机不会自行重新启动。','power=1')],
8:[cue('正转接触器吸合，观察主轴的方向标记。','forward'),cue('在转动中请求反转，比较命令与实际线圈。','reverse'),cue('停止后等待主轴减速到零。','stop',4),cue('零速再请求反转，标记沿相反方向运动。','reverse')],
9:[cue('启动时接入星形，绕组电压和电流受限。','duration=3 start',2.9),cue('放慢转换：星接触器先释放，再接入三角形。','',3,.15),cue('三角支路建立后继续加速，电流随转速变化。','',3),cue('对照开路支路：再次启动，观察切换后果。','stop deltaPath=1 start',4.8)],
10:[cue('轻载时旋转磁场略快于转子；看两圈标记逐渐错开。','frequency=50 load=10'),cue('加载后，转子落后更多，同步转速不变。','load=100',4),cue('降频比较两种转速；光学读数不等于旋转磁场。','frequency=35 marks=1 pulses=1')],
11:[cue('给出低频目标，叶轮按输出频率而非指令瞬间加速。','ramp=4 setpoint=25 run',4),cue('提高目标，比较风量、压差和轴功率。','setpoint=50',4),cue('撤销模型许可，观察实际频率与送风衰减。','permit=1',4)],
12:[cue('泵开始运行，末端流量来自泵与管网曲线交点。','motor=1 valve=100 bypass=0'),cue('关小阀门：系统阻力变大，运行点移动。','valve=40'),cue('打开旁通，两条水流分开；总量不等于末端流量。','bypass=1'),cue('切换独立相似泵台并降速，两条支路都重算。','rig=1 speed=0')],
13:[cue('光束畅通，接收端收光；当前没有箱体。','work=0 trigger=0',1.5),cue('箱体进入并停住，遮光沿只使显示计数增加一次。','work=1'),cue('保持遮挡：错误地按电平计数，每一扫描都累加。','trigger=1'),cue('箱体离开，恢复沿计数并清零。','trigger=0 work=0 zero',1.5),cue('新箱入场。比较箱数、上升沿和显示计数。','work=1')],
14:[cue('钢片靠近传感器，振荡区与输出指示分开观察。','metal=0 gap=2'),cue('将同一钢片移远，留意释放边界。','gap=5'),cue('塑料靠近也不会产生相同检出。','metal=4 gap=1'),cue('换回钢片，与同间隙的塑料对照。','metal=0')],
15:[cue('升高液面：液柱压力经变送器编码为电流。','height=2 fluid=0 open=0'),cue('空罐仍保留活零信号，不是断线。','height=0'),cue('模拟回路中断，显示无效；液面不是由断线决定。','height=1.5 open=1')],
16:[cue('下载虚拟双浮子逻辑，进水抬高水面。','start=1 feedback=1 load pour'),cue('继续注入，上浮子触发泵命令。','pour',3),cue('关闭流入，看保持支路维持排水直到低位。','inflow=0',4,2),cue('比较浮子卡干时的反馈与实际水面。','floatFault=1 pour')],
17:[cue('正向发脉冲，丝杠与独立标尺同步向前。','pulses=400 rate=100 dir=0 move',4.1),cue('改变方向并启用细分，同样脉冲数的位移变小。','dir=1 micro=1 move',4.1),cue('模拟过载，指令位置不再等于独立标尺。','drag=1 rate=400 dir=0 move')],
18:[cue('金属件到站：位置条件成立，阀线圈推出。','presence=1 timing=1 preset=1 load feed'),cue('模拟推杆受阻：看行程停住而等待时间继续累积。','jam=1 feed',3),cue('清除阻碍并确认，再投入新工件。','jam=0 ack feed',3),cue('换塑料件，观察直行而非侧推。','piece=1 feed')],
19:[cue('增加无功负荷，观察端压与励磁反馈。','kvar=150'),cue('提高电压参考量，调节器改变励磁。','reference=408'),cue('冻结励磁后再改变无功，端压不再被拉回。','loop=1 kvar=30')],
20:[cue('额定分接下，一次与二次以共同磁通联系。','primary=480 tap=4'),cue('降低一次电压，线间电压随之变化。','primary=432'),cue('比较另一虚拟分接和相电压读数。','tap=0 probe=1')],
21:[cue('有负载时导体产生压降与损耗，热标记表示功率而非温度。','amps=10 length=50'),cue('增加等效接点电阻，对照局部损耗。','joint=1 amps=18'),cue('卸载后损耗趋零，负载端电压回升。','amps=0')],
22:[cue('读取甲班留存的指示器记录；光标是回读，不是实时故障电流。','log=0 read'),cue('换读另一班次，比较哪些支路曾记录越过。','log=2 read'),cue('远传缺失不是“未越过”，对照本地记录。','link=1 read'),cue('补读本地记录后，再判断影响区段。','local')],
23:[cue('按慢放游标回读：拾取、出口命令、分位是不同事件。','event=0 breaker=0 replay',3),cue('短脉冲结束得早，不一定发出出口命令。','event=1 replay',3),cue('机构未响应时即使命令发出，分位证据仍然缺失。','event=0 breaker=1 replay',3)],
24:[cue('馈线先承担负荷无功，测量其电流。','mode=0 manual=0'),cue('请求投入两级；等待实际有效级数跟随。','manual=2',4),cue('同样命令下使一组失效，看电源侧无功回升。','failed=1',3.5)],
25:[cue('整流峰值周期性给电容补电；对照桥端和电容两条波形。','line=0 cap=0 load=200'),cue('增大滤波电容，相邻峰间的跌落减小。','cap=2'),cue('桥臂开路使补电机会减少，观察纹波。','open=1')],
26:[cue('较小占空比：比较开关节点与电感电流的斜坡。','vin=18 duty=25'),cue('增加占空比，平均输出上升，切换时段也变长。','duty=65'),cue('减小有效电感；同样占空比下电流纹波变大。','coil=1')],
27:[cue('常用负载，观察输入电感储能与输出放能。','vin=12 duty=45 load=1'),cue('提高占空比，实际输出受模型损耗限制。','duty=70'),cue('切换重载，比较有效占空比及负载电压。','load=2')],
28:[cue('观察桥端脉冲与基波，两者不是同一条曲线。','mod=40 phase=1'),cue('提高调制比，在同一参考相位比较中心脉宽。','mod=85'),cue('切换负峰参考，对照正负电平与基波幅值。','phase=2')],
29:[cue('正向驱动，绕组电流产生转矩，轴端出现反电动势。','mode=1 duty=70'),cue('进入制动，观察转速与绕组电流的符号。','mode=3'),cue('反向驱动，转轴换向。','mode=2'),cue('卡滞时电流并不说明转子在转。','jam=1')],
30:[cue('由市电支路供能，负载保持工作。','grid=0 battery=0'),cue('切断模拟市电：慢看切换空档以及输出恢复。','grid=1',3,.25),cue('恢复正常电源并撤去备用支路。','grid=0 battery=1'),cue('再次断源，观察负载掉电记录。','grid=1')],
31:[cue('无阴影时沿曲线定位当前工作点。','shade=0 probe=32'),cue('移动遮阴到子串，比较曲线形状及旁路状态。','shade=2'),cue('沿电压轴移动测点，局部高点未必是全局峰。','probe=19')],
32:[cue('从局部工作点开始。每次模拟扰动后，对照曲线上的工作点和新的功率读数。','shade=2 seed=35 stride=1',5,1,'perturb'),cue('放大扰动步长，观察工作点来回摆动。','stride=3',4,1,'perturb'),cue('扫描整条 P–V 曲线，回到本工况的全局峰附近。','scan',2),cue('换成薄影后用小步继续追踪，比较新的功率。','shade=1 stride=0.5',4,1,'perturb')],
33:[cue('低风速时追踪可发功率和机组实际输出。','wind=6 limit=100'),cue('提高风速并限发，气流与输出不再同步增长。','wind=12 limit=50'),cue('超过切出条件：风还在吹，机组已闭锁。','wind=26'),cue('降低风速至恢复区，比较机组状态。','wind=18')],
34:[cue('负载放电，观察电流方向和累计容量。','current=2 bias=0',3,5),cue('实际电流归零，传感器零偏却使估计继续漂移。','current=0 bias=1',3,8),cue('反向充电并清除零偏，对照估计和参考余量。','current=-2 bias=0',3,5)],
35:[cue('光伏盈余，变流器将有功送入电池。','pv=8 load=2'),cue('光伏不足，储能反向补缺，留下充放电损耗。','pv=1 load=7'),cue('变流器退出，由电网补足缺口。','offline=1')],
36:[cue('插枪后只有连接状态，没有实际充电电流。','plug=1'),cue('宣告供电上限后，车辆发出充电请求。','pilot=40 offer=1 request'),cue('降低桩限流，观察实际功率随较小上限改变。','pilot=15'),cue('引入虚拟异常，控制信号和能量路径分别观察。','fault=1')],
37:[cue('暗环境下有人经过，灯亮并开始延时。','threshold=80 lux=15 hold=5 pass',2),cue('人已离开，余时持续递减，到零才熄灭。','',4),cue('提高环境照度，再经过也不会触发照明。','lux=200 pass')],
38:[cue('有冷水时提高风速，对照阀请求与实际取热。','setpoint=20 fan=2 water=0',3,3),cue('关闭冷源：风机仍动，取热并不成立。','water=1',3,4),cue('恢复供冷、减小房间热负荷，观察净得热变号。','water=0 load=0.4',3,4)],
39:[cue('集中离场使污染物积累，探头示值滞后。','traffic=2',4,5),cue('要求高速通风，观察实际换气。','force=1',3),cue('模拟失风：请求还在，真实模型风量却消失。','fault=1',3),cue('恢复换气并减少交通，浓度逐渐回落。','fault=0 traffic=0',4,4)],
40:[cue('回放正常门循环：门扇闭合后才观察锁反馈。','record=0 replay',6),cue('光幕事件使门重新打开，对照门缝与闭位。','record=1 replay',6),cue('换读缺失锁反馈的片段：闭位不等于锁定。','record=2 replay',6)],
41:[cue('支路提出请求，先观察主路放行。','clear=0 request',3),cue('等待主路黄灯、双红清空，再开放支路。','',5),cue('支路服务结束后经过清空再返回主路。','',6),cue('占用未清除时再请求，比较放行条件。','clear=1 request',5)],
42:[cue('制动能量先被同区有需求的列车吸收。','brake=400 train=400 isolated=0'),cue('邻车需求变小，多出的能量转入站旁支路。','train=80'),cue('接收支路不可用，剩余部分在车载耗散。','isolated=1'),cue('制动结束，三条即时功率流都归零。','brake=0')],
43:[cue('箱子随皮带越过光电工位；观察占位剩余长度。','length=750 speed=250 timeout=4 insert',3.5),cue('出口暂停接收，第二个箱子占据探头并超时。','outlet=1 timeout=2 insert',3.5),cue('恢复出口并确认，跟踪这只箱子清出工位。','outlet=0 ack',4)],
44:[cue('批量来水抬升液位，领泵承担本轮排水。','batch batch',2),cue('增加来水并让 A 泵退出，比较 A、B 的实际通道。','fault=1 batch inflow=8',3),cue('恢复两台泵并停止新增流入，观察集水量下降。','fault=0 inflow=0',4)],
45:[cue('提出关键、输送、加热用电申请，比较两种容量限额。','critical=44 kva=80 kw=60 motor=1 heater=1 shed=0'),cue('按优先级缓供，减少拟供非关键负荷。光路表示计划分配。','shed=1'),cue('改变备用容量，重新比较有功与视在裕量。','kva=120 kw=100')],
46:[cue('A 区启动除霜，热量和功率与 B 区分开观察。','defA',3,2),cue('窗口内让 B 区也除霜，比较叠加负荷。','defB',3,2),cue('压缩机恢复后，检查两区温度再派单。','order',4,3),cue('将订单交给温度合格的区，而不是只看瞬时功耗。','dispatch')],
47:[cue('下发 B 位任务：货叉沿导轨移动，测距示值跟随。','target=1 issue',2),cue('冻结反馈，实物模型仍运动；静止的示值不等于停车。','link=1',3),cue('恢复测距后等待到位，核对当前单号后交接。','link=0',4),cue('收到当前任务回执，查看交接结果。','reply=0 receive')],
48:[cue('日照充足：光伏供基础负荷与车辆，多余功率流入储能。','pv=22 base=8 ev=6 mode=1'),cue('光照降低、车辆集中到站，观察储能与电网分担。','pv=3 ev=18'),cue('选择限购电调节，比较车辆实际获得功率。','mode=2 limit=8'),cue('车辆离开后再算平衡；能量箭头随功率反向或停下。','ev=0 pv=22')],
}

function commands(lesson:Lesson,run:Run,text:string) {
  for(const token of text.split(' ').filter(Boolean)) {const [key,arg]=token.split('=');run=perform(lesson,run,[key,arg===undefined?1:Number(arg)])}
  return run
}
export type Film={run:Run;index:number;elapsed:number;done:boolean}
export function startFilm(lesson:Lesson):Film {return {run:commands(lesson,initialise(lesson),sequences[lesson.id][0].commands),index:0,elapsed:0,done:false}}
export function advanceFilm(lesson:Lesson,film:Film,seconds:number):Film {
  const cues=sequences[lesson.id]
  let {run,index,elapsed,done}=film
  let remaining=Math.round(seconds*1e6)
  while(!done && remaining>0){
    const scene=cues[index],end=Math.round(scene.seconds*1e6),now=Math.round(elapsed*1e6),pulseAt=(Math.floor(now/650000)+1)*650000
    const step=Math.min(remaining,end-now,scene.pulse?pulseAt-now:Infinity)
    run=perform(lesson,run,step*scene.rate/1e6);elapsed=(now+step)/1e6;remaining-=step
    if(now+step===end){if(index+1===cues.length)done=true;else {index++;elapsed=0;run=commands(lesson,run,cues[index].commands)}}
    else if(scene.pulse&&now+step===pulseAt)run=commands(lesson,run,scene.pulse)
  }
  return {run,index,elapsed,done}
}
