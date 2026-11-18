import type { Group } from 'three'
import type { Kit } from './kit'
import { foundationStations } from './stations-foundation'
import { automationStations } from './stations-automation'
import { energyStations } from './stations-energy'
import { systemsStations } from './stations-systems'

const stations = [...foundationStations,...automationStations,...energyStations,...systemsStations]
const partBindings:Record<number,Record<string,string|number>>={
  2:{lamp0:'w02',lamp1:'w34'},6:{phase0:'a',phase1:'b',phase2:'c'},
  7:{hold:'aux',motor:'start'}, 8:{motor:'stop'}, 9:{main:'start',star:'duration',delta:'deltaPath',motor:'stop'},
  10:{motor:'frequency',load:'load'},11:{fan:'run',duct:'permit'},12:{pump:'motor',meter:'clog'},
  19:{generator:'kw',governor:'AS440 电压取样'},
  23:{trip:'breaker',reset:'replay'},24:{bank:'manual',meter:'save'},29:{drive:'IN1/IN2 逻辑端'},
  31:{array:'sun',shade:'shade',load:'probe'},32:{array:'shade',track:'seed',converter:'perturb'},
  33:{load:'limit'},34:{pack:'current',monitor:'bias'},35:{storage:'reserve',converter:'offline',grid:'load'},36:{vehicle:'request',charge:'pilot'},
  40:{beam:0,car:'replay',door:'replay',obstruction:0},41:{north:'clear',east:'request'},42:{train:'brake'},
  43:{belt:'speed',box:'insert',sensor:'insert',sealer:'outlet'},44:{tank:'batch',pumpA:'A 泵状态窗',pumpB:'B 泵状态窗'},
  45:{reserve:'critical',transfer:'shed'},47:{axis:'issue',rack:'target',fork:'receive'},48:{battery:'mode',load:'base',grid:'meterLoss'},
}

export function buildStation(k:Kit,application:Group) {
  const build=stations[k.lesson.id-1]
  if(!build) throw new Error('No station model for lesson '+k.lesson.id)
  build(k,application)
  return partBindings[k.lesson.id]??{}
}
