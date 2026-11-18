import type { Device } from '../../core/types'

// Each entry identifies the referenced instrument. Other equipment in a scene belongs to the teaching model.
export const devices = {
  37: {
    maker: 'STEINEL', model: 'IS 180-2（034580，炭灰色）', name: '壁装被动红外移动探测器', form: 'sensor',
    url: 'https://www.steinel.com.au/products/is-180-2?variant=47130508558510',
    document: 'STEINEL IS 180-2 Anthracite · Article 034580',
    locator: '型号页 Technical Specifications、Detection angle、Time setting，查阅 2026-11-18。另核对德国原厂同货号 2026-10 数据表第 1–2 页。',
    features: ['红外检测水平角 180°', '环境光门限可调 2–2000 lx', '延时范围 5 s–15 min'], dimensions: [76, 120, 56],
  },
  38: {
    maker: 'Siemens 西门子', model: 'RDF302（S55770-T238）', name: '风机盘管室内温控器', form: 'hvac',
    url: 'https://cache.industry.siemens.com/dl/files/179/109789179/att_1045936/v3/A6V10350338.pdf',
    document: 'RDF302 Basic documentation · CE1P3079en',
    locator: '2022-06-17，第 6–8 页 Types / Functions，第 24 页 2-pipe fan coil unit',
    features: ['可控制二管制风机盘管', '支持一速或三速风机', '支持开关阀控制，可用内置温度传感器反馈'],
  },
  39: {
    maker: 'Honeywell 霍尼韦尔', model: 'E3Point E3SA（独立式，CO 配置）', name: '地库排风需求的 CO 测量端', form: 'sensor',
    url: 'https://prod-edam.honeywell.com/content/dam/honeywell-edam/sps/his/en-us/products/gas-and-flame-detection/documents/ss01018stand_e3point_spec_sheet_standalone_flr_11_26_12.pdf?download=false',
    document: 'E3Point Standalone Platform · SS01018STAND_v7',
    locator: 'v7，2012-11，第 1 页 General Specifications、Detection Ranges and Alarm Levels',
    features: ['CO 配置采用电化学传感元件', 'CO 量程 0–250 ppm', '独立机提供两个继电器输出和 4–20 mA 信号'], dimensions: [149, 205.6, 67.2],
  },
  40: {
    maker: 'CEDES', model: 'cegard/Mini-MOD（2000 mm，36 光学元件型）', name: '电梯门口保护光幕', form: 'sensor',
    url: 'https://media.cedes.com/filer_public/7c/9c/7c9c368b-99f0-4763-b04c-3d662edb6887/001208en_db_cegardmini_mod_v24.pdf',
    document: 'cegard/Mini-MOD · 001 208 en',
    locator: 'V2.4，第 1 页 Optical / Electrical，第 2 页 36 elements、z = 2000 mm 列',
    features: ['36 元件型形成 174 条光束', '发射条与接收条之间工作距离 0–5 m', '光幕控制单元提供继电器输出，光条带状态指示'],
  },
  41: {
    maker: 'Econolite', model: 'Cobalt Rackmount ATC（TS2 Type-1 型）', name: '机架式路口信号控制器', form: 'plc',
    url: 'https://www.econolite.com/wp-content/uploads/2026/09/Cobalt_Rackmount_datasheet_2026.pdf',
    document: 'Cobalt Rackmount Controllers · Datasheet',
    locator: '2026 年版，第 1 页 Key features、第 2 页 Hardware options 与 Hardware description，查阅 2026-11-18',
    features: ['机架式 ATC 控制器，可运行 EOS 信号控制软件', '采用 Linux 实时多任务平台', '本课选用 TS2 Type-1 连接器版本'],
  },
  42: {
    maker: 'LEM 莱姆', model: 'DVL 1000', name: '牵引直流侧电压变送器', form: 'meter',
    url: 'https://www.lem.com/sites/default/files/products_datasheets/dvl_1000_v7.pdf',
    document: 'Voltage transducer DVL 1000 · Public datasheet',
    locator: 'Version 7，2026-02-17，第 1 页 Applications，第 4 页 Electrical data、Sensitivity',
    features: ['可测量隔离侧对应的牵引电压', '一次额定 1000 V 对应二次 50 mA', '数据表测量范围 −1500 至 +1500 V'],
  },
  43: {
    maker: 'OMRON 欧姆龙', model: 'E3Z-D62 2M', name: '包装箱经过检测用漫反射光电开关', form: 'sensor',
    url: 'https://files.omron.eu/downloads/latest/datasheet/en/e3z_compact_photoelectric_sensor_with_built-in_amplifier_datasheet_en.pdf',
    document: 'E3Z Compact Photoelectric Sensor with Built-in Amplifier · Datasheet',
    locator: 'CSM_E3Z_DS_E_18_10，第 2 页 Ordering Information 的 E3Z-D62 2M，第 5 页 Ratings and Specifications 的 D62 列',
    features: ['漫反射型，物体自身反射光线', '预接线 NPN 输出', '白纸 300 × 300 mm 条件下标称检测距离 1 m'],
  },
  44: {
    maker: 'Grundfos 格兰富', model: 'LC 221.2.230.1.10.30', name: '双泵排水液位控制器', form: 'cabinet',
    url: 'https://api.grundfos.com/literature/Grundfosliterature-5269431.pdf',
    document: 'LC 221 · Installation and operating instructions',
    locator: '英文版第 6 页 §4 Functions、Double pump operation 与 Type key；资料 5269431，查阅 2026-11-18',
    features: ['型谱中的 .2 表示双泵控制', '按起停液位交替启动，故障时可由另一台接替', '第二起动液位可投入第二台泵'],
  },
  45: {
    maker: 'Schneider Electric 施耐德电气', model: 'PowerLogic PM5560（METSEPM5560）', name: '备用母线功率核算的测量参考', form: 'meter',
    url: 'https://download.se.com/files?p_Doc_Ref=HRB1684301&p_File_Name=HRB1684301-18.pdf&p_enDocType=User+guide',
    document: 'PowerLogic PM5500 / PM5600 / PM5700 series · User manual',
    locator: 'HRB1684301-18，2025-12，Meter models 中的 PM5560 行，第 188 页 Instantaneous measurements',
    features: ['面板式三相电力仪表，带显示屏', '分别报告有功、无功与视在功率', '支持总功率与功率因数测量'],
  },
  46: {
    maker: 'Danfoss 丹佛斯', model: 'AK-CC55 Single Coil（084B4082）', name: '单蒸发器冷库控制器', form: 'plc',
    url: 'https://assets.danfoss.com/documents/latest/198797/BC364229688105en-000201.pdf',
    document: 'AK-CC55 Single Coil and Single Coil UI · User guide',
    locator: 'BC364229688105en-000201，2022-03，第 6、16–19 页温度与除霜，第 74 页表 55 订货号',
    features: ['单线圈款控制一个 AKV 阀', '可用 S5 蒸发器温度探头终止除霜', '支持由系统管理器发起排程除霜'],
  },
  47: {
    maker: 'Leuze 劳易测', model: 'AMS 304i 200 H（50113683）', name: '巷道堆垛机行走轴激光测距仪', form: 'sensor',
    url: 'https://www.leuze.com.cn/zh-cn/ams-304i-200-h/50113683',
    document: 'AMS 304i 200 H · 光学测距传感器，产品编号 50113683',
    locator: '中国产品页的应用、测量数据、接口与机械数据，查阅 2026-11-18',
    features: ['原厂列有堆垛机定位用途，使用反射目标', '量程 200–200000 mm，标称精度 3 mm', '支持 PROFIBUS DP 与 SSI'], dimensions: [84, 166.5, 159],
  },
  48: {
    maker: 'Fronius 伏能士', model: 'Smart Meter TS 65A-3', name: '园区支路并网点双向电表', form: 'meter',
    url: 'https://www.fronius.com/en-gb/uk/solar-energy/installers-partners/technical-data/all-products/system-monitoring/hardware/fronius-smart-meter/fronius-smart-meter-ts-65a-3',
    document: 'Fronius Smart Meter TS 65A-3 · Technical Data',
    locator: '产品页 Smart Meter、TS 65A-3 / General Data，查阅 2026-11-18',
    features: ['双向计量，可观察购电与馈网', '所示型号最大电流 65 A', '标称线电压 208–400 V'], dimensions: [53.8, 91.5, 63],
  },
} satisfies Record<number, Device>
