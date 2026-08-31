import { TRAStation, TrainTripOption, TrainLeg } from '../types';
import { calculateHaversineDistanceKm } from './itineraryOptimizer';

export const TRA_OFFICIAL_TIMETABLE_URL = 'https://www.railway.gov.tw/tra-tip-web/tip/tip001/tip112/gobytime';

/**
 * Checks if a station cannot be stopped by Tze-Chiang (自強/普悠瑪/EMU3000)
 * Flag stations (招呼站) and most Simple stations (簡易站) only allow Local Trains (區間車/部分區間快)
 */
export function isLocalTrainOnlyStation(station: TRAStation): boolean {
  if (station.grade === 'flag' || station.gradeLabel === '招呼站') {
    return true;
  }
  // List of famous local-only stations
  const localOnlyNames = [
    '崎頂', '三坑', '百福', '浮洲', '南樹林', '北新竹', '千甲', '新莊', '香山', 
    '談文', '大山', '新埔', '日南', '龍井', '造橋', '南勢', '泰安', '頭家厝', 
    '松竹', '精武', '五權', '大慶', '花壇', '永靖', '石榴', '石龜', '大林', 
    '嘉北', '水上', '南靖', '後壁', '柳營', '林鳳營', '拔林', '南科', '大橋', 
    '保安', '仁德', '中洲', '大湖', '路竹', '橋頭', '左營', '內惟', '美術館', 
    '鼓山', '三塊厝', '民族', '科工館', '正義', '後庄', '六塊厝', '歸來', 
    '麟洛', '西勢', '竹田', '佳冬', '東海', '枋山', '加祿', '內獅', 
    '望古', '嶺腳', '暖暖', '頂埔', '外澳', '頂雙溪', '石城', '大里', 
    '大溪', '龜山', '中里', '新馬', '東澳', '武塔', '漢本', '平和', 
    '豐田', '溪口', '南平', '大富', '三民', '東里', '東竹', '富南', 
    '海端', '月美', '瑞和', '瑞源', '山里', '康樂', '知本', '太麻里'
  ];
  return localOnlyNames.includes(station.name);
}

/**
 * Detect branch line transfer hub
 */
export function detectBranchLineInfo(station: TRAStation): { isBranch: boolean; hubStation: string; lineName: string; branchCodePrefix: string } {
  const name = station.name;
  const line = station.line || '';

  if (['十分', '平溪', '菁桐', '望古', '嶺腳', '猴硐', '海科館', '八斗子'].includes(name) || line.includes('平溪') || line.includes('深澳')) {
    return { isBranch: true, hubStation: '瑞芳', lineName: '平溪深澳線', branchCodePrefix: '47' };
  }
  if (['車埕', '集集', '水里', '濁水', '龍泉', '源泉'].includes(name) || line.includes('集集')) {
    return { isBranch: true, hubStation: '二水', lineName: '集集線', branchCodePrefix: '27' };
  }
  if (['內灣', '合興', '竹東', '九讚頭', '橫山', '上員', '榮華'].includes(name) || line.includes('內灣')) {
    return { isBranch: true, hubStation: '新竹', lineName: '內灣線', branchCodePrefix: '18' };
  }
  if (['奮起湖', '阿里山', '十字路', '樟腦寮', '獨立山'].includes(name)) {
    return { isBranch: true, hubStation: '嘉義', lineName: '阿里山林鐵', branchCodePrefix: '1' };
  }
  return { isBranch: false, hubStation: '', lineName: '', branchCodePrefix: '' };
}

/**
 * Determine best transfer hub between two stations on Taiwan Railway network
 */
export function findTransferHub(origin: TRAStation, destination: TRAStation): string | null {
  const destBranch = detectBranchLineInfo(destination);
  if (destBranch.isBranch && origin.name !== destBranch.hubStation) {
    return destBranch.hubStation;
  }

  const origBranch = detectBranchLineInfo(origin);
  if (origBranch.isBranch && destination.name !== origBranch.hubStation) {
    return origBranch.hubStation;
  }

  // Coast Line small stations coming from North/South main lines
  const coastLineSmallStations = ['談文', '大山', '新埔', '日南', '龍井', '大肚', '追分'];
  if (coastLineSmallStations.includes(destination.name)) {
    return origin.lat > destination.lat ? '竹南' : '彰化';
  }

  // Mountain Line flag stations like 崎頂, 造橋, 南勢
  if (destination.name === '崎頂' && origin.name !== '新竹' && origin.name !== '竹南') {
    // Coming from north (Taipei/Taoyuan/Zhongli) -> Transfer at Hsinchu or Zhunan
    return origin.lat > destination.lat ? '新竹' : '竹南';
  }
  if (['造橋', '南勢', '泰安'].includes(destination.name) && origin.name !== '苗栗' && origin.name !== '竹南') {
    return '竹南';
  }

  return null;
}

interface GenerateScheduleParams {
  origin: TRAStation;
  destination: TRAStation;
  direction: 'outbound' | 'inbound';
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

/**
 * Generate 3 realistic Taiwan Railway train options for Outbound or Inbound based on official rules
 */
export function generateTRAOptions(params: GenerateScheduleParams): TrainTripOption[] {
  const { origin, destination, direction } = params;
  const isOutbound = direction === 'outbound';

  const originName = origin.name;
  const destName = destination.name;

  const distanceKm = Math.max(8, calculateHaversineDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng) * 1.25);
  const destIsLocalOnly = isLocalTrainOnlyStation(destination);
  const origIsLocalOnly = isLocalTrainOnlyStation(origin);

  const transferHub = isOutbound ? findTransferHub(origin, destination) : findTransferHub(destination, origin);
  const requiresTransfer = !!transferHub && originName !== transferHub && destName !== transferHub;

  // Real TRA train fare calculation according to official rate
  // Local (區間): 1.46 NTD/km (Min 15 NTD)
  // Tze-chiang (自強): 2.27 NTD/km (Min 23 NTD)
  const localFare = Math.max(15, Math.round(distanceKm * 1.46));
  const tzeChiangFare = Math.max(23, Math.round(distanceKm * 2.27));

  // Determine train corridor & direction
  const isNorthToSouth = isOutbound ? (origin.lat > destination.lat) : (destination.lat > origin.lat);
  const isEasternLine = origin.region === 'east' || destination.region === 'east' || origin.county === '宜蘭縣' || destination.county === '宜蘭縣';

  // Base departure times
  // Outbound: Early (07:40), Prime (08:30), Casual (09:15)
  // Inbound: Early (16:45), Prime (17:35), Night (18:40)
  const timeSlots = isOutbound 
    ? [
        { label: '早鳥首選', depH: 7, depM: 40 },
        { label: '主力推薦', depH: 8, depM: 30 },
        { label: '悠閒出發', depH: 9, depM: 15 },
      ]
    : [
        { label: '提早賦歸', depH: 16, depM: 45 },
        { label: '主力推薦', depH: 17, depM: 35 },
        { label: '晚間漫遊', depH: 18, depM: 40 },
      ];

  const options: TrainTripOption[] = [];

  // Scenario 1: Destination or Origin is a Flag/Local-only station (e.g. 崎頂)
  if (destIsLocalOnly || origIsLocalOnly || requiresTransfer) {
    const hub = transferHub || (isNorthToSouth ? '新竹' : '竹南');
    const branchInfo = detectBranchLineInfo(isOutbound ? destination : origin);
    const lineLabel = branchInfo.isBranch ? branchInfo.lineName : (destIsLocalOnly ? '區間接駁車' : '台鐵幹線');

    // Option 1: Direct Local Train (直達區間車)
    const opt1DepH = timeSlots[0].depH;
    const opt1DepM = timeSlots[0].depM;
    const localSpeedKmH = 55; // Avg including all stops
    const localTripMinutes = Math.max(25, Math.round((distanceKm / localSpeedKmH) * 60));
    const opt1ArrM_total = opt1DepH * 60 + opt1DepM + localTripMinutes;
    const opt1ArrH = Math.floor(opt1ArrM_total / 60);
    const opt1ArrM = opt1ArrM_total % 60;

    const opt1TrainNo = isEasternLine 
      ? (isNorthToSouth ? '4154次' : '4183次')
      : (isNorthToSouth ? '2143次' : '2234次');

    options.push({
      optionLabel: timeSlots[0].label,
      trainType: '台鐵 區間車 (EMU900/800)',
      trainNo: `區間 ${opt1TrainNo}`,
      departureTime: `${pad(opt1DepH)}:${pad(opt1DepM)}`,
      arrivalTime: `${pad(opt1ArrH)}:${pad(opt1ArrM)}`,
      fareEstimate: localFare,
      durationText: `約${Math.floor(localTripMinutes / 60) > 0 ? `${Math.floor(localTripMinutes / 60)}小時` : ''}${localTripMinutes % 60}分`,
      features: '直達免換乘・自由座可刷悠遊卡/一卡通/TPASS',
      isDirect: true,
      transferCount: 0,
      transferStations: [],
      transferSummary: '直達列車・一車直達無須轉乘',
      legs: [
        {
          legIndex: 1,
          trainType: '台鐵 區間車 (EMU900/EMU800型)',
          trainNo: `區間 ${opt1TrainNo}`,
          fromStation: originName,
          toStation: destName,
          departureTime: `${pad(opt1DepH)}:${pad(opt1DepM)}`,
          arrivalTime: `${pad(opt1ArrH)}:${pad(opt1ArrM)}`,
          durationText: `約${localTripMinutes}分鐘`,
          transferWaitMinutes: 0,
          note: `${destName}為招呼/風景小站，本車次全站停靠直達，上車刷卡即可乘車。`,
        },
      ],
    });

    // Option 2: Prime Express + Fast Transfer (自強快線 ➔ 樞紐轉乘區間車)
    const opt2DepH = timeSlots[1].depH;
    const opt2DepM = timeSlots[1].depM;
    const expressMinutes = Math.max(20, Math.round(((distanceKm * 0.7) / 85) * 60));
    const transferWait = 10;
    const localLegMinutes = Math.max(12, Math.round(((distanceKm * 0.3) / 50) * 60));
    const totalOpt2Minutes = expressMinutes + transferWait + localLegMinutes;

    const opt2ExpressArrTotal = opt2DepH * 60 + opt2DepM + expressMinutes;
    const opt2ExpressArrH = Math.floor(opt2ExpressArrTotal / 60);
    const opt2ExpressArrM = opt2ExpressArrTotal % 60;

    const opt2LocalDepTotal = opt2ExpressArrTotal + transferWait;
    const opt2LocalDepH = Math.floor(opt2LocalDepTotal / 60);
    const opt2LocalDepM = opt2LocalDepTotal % 60;

    const opt2LocalArrTotal = opt2LocalDepTotal + localLegMinutes;
    const opt2LocalArrH = Math.floor(opt2LocalArrTotal / 60);
    const opt2LocalArrM = opt2LocalArrTotal % 60;

    const expressNo = isEasternLine
      ? (isNorthToSouth ? '自強 218次' : '自強 229次')
      : (isNorthToSouth ? '自強 105次' : '自強 142次');

    const transferTrainNo = branchInfo.isBranch 
      ? `區間 ${branchInfo.branchCodePrefix}${isNorthToSouth ? '14' : '33'}次`
      : `區間 ${isNorthToSouth ? '2153' : '2244'}次`;

    const mixedFare = Math.round(tzeChiangFare * 0.75 + localFare * 0.35);

    options.push({
      optionLabel: timeSlots[1].label,
      trainType: `新自強/自強號 ➔ ${lineLabel}`,
      trainNo: `${expressNo} ➔ ${transferTrainNo}`,
      departureTime: `${pad(opt2DepH)}:${pad(opt2DepM)}`,
      arrivalTime: `${pad(opt2LocalArrH)}:${pad(opt2LocalArrM)}`,
      fareEstimate: mixedFare,
      durationText: `約${Math.floor(totalOpt2Minutes / 60) > 0 ? `${Math.floor(totalOpt2Minutes / 60)}小時` : ''}${totalOpt2Minutes % 60}分 (含轉乘${transferWait}分)`,
      features: `於【${hub}站】同站換乘・幹線快速省時`,
      isDirect: false,
      transferCount: 1,
      transferStations: [hub],
      transferSummary: `於【${hub}站】轉乘 ${lineLabel}（同站跨月台等候約 ${transferWait} 分鐘）`,
      legs: [
        {
          legIndex: 1,
          trainType: '台鐵 自強號 (EMU3000/PP車型)',
          trainNo: expressNo,
          fromStation: isOutbound ? originName : hub,
          toStation: isOutbound ? hub : destName,
          departureTime: `${pad(opt2DepH)}:${pad(opt2DepM)}`,
          arrivalTime: `${pad(opt2ExpressArrH)}:${pad(opt2ExpressArrM)}`,
          durationText: `約${expressMinutes}分鐘`,
          transferWaitMinutes: transferWait,
          note: isOutbound 
            ? `搭乘自強號快速抵達【${hub}站】，抵達後請依照月台電子看板前往轉乘月台` 
            : `於【${hub}站】轉乘幹線自強號舒適返程`,
        },
        {
          legIndex: 2,
          trainType: `${lineLabel} (冷氣區間車)`,
          trainNo: transferTrainNo,
          fromStation: isOutbound ? hub : originName,
          toStation: isOutbound ? destName : hub,
          departureTime: `${pad(opt2LocalDepH)}:${pad(opt2LocalDepM)}`,
          arrivalTime: `${pad(opt2LocalArrH)}:${pad(opt2LocalArrM)}`,
          durationText: `約${localLegMinutes}分鐘`,
          transferWaitMinutes: 0,
          note: `平穩抵達${destName}，出站展開美好遊程`,
        },
      ],
    });

    // Option 3: Casual Departure Local Train (悠閒班次)
    const opt3DepH = timeSlots[2].depH;
    const opt3DepM = timeSlots[2].depM;
    const opt3ArrM_total = opt3DepH * 60 + opt3DepM + localTripMinutes;
    const opt3ArrH = Math.floor(opt3ArrM_total / 60);
    const opt3ArrM = opt3ArrM_total % 60;

    const opt3TrainNo = isEasternLine 
      ? (isNorthToSouth ? '4172次' : '4205次')
      : (isNorthToSouth ? '2163次' : '2254次');

    options.push({
      optionLabel: timeSlots[2].label,
      trainType: '台鐵 區間車 / 區間快',
      trainNo: `區間 ${opt3TrainNo}`,
      departureTime: `${pad(opt3DepH)}:${pad(opt3DepM)}`,
      arrivalTime: `${pad(opt3ArrH)}:${pad(opt3ArrM)}`,
      fareEstimate: localFare,
      durationText: `約${Math.floor(localTripMinutes / 60) > 0 ? `${Math.floor(localTripMinutes / 60)}小時` : ''}${localTripMinutes % 60}分`,
      features: '免趕車・彈性出行可刷卡自由座',
      isDirect: true,
      transferCount: 0,
      transferStations: [],
      transferSummary: '直達列車・無須轉乘',
      legs: [
        {
          legIndex: 1,
          trainType: '台鐵 區間車 (EMU900型)',
          trainNo: `區間 ${opt3TrainNo}`,
          fromStation: originName,
          toStation: destName,
          departureTime: `${pad(opt3DepH)}:${pad(opt3DepM)}`,
          arrivalTime: `${pad(opt3ArrH)}:${pad(opt3ArrM)}`,
          durationText: `約${localTripMinutes}分鐘`,
          transferWaitMinutes: 0,
          note: '直達列車，車廂寬敞明亮配備無障礙設施與自行車架。',
        },
      ],
    });

  } else {
    // Scenario 2: Main Trunk Line Stations (特等站 / 一等站 / 二等站 / 三等站 如 台北 ➔ 礁溪 / 台中 / 高雄 / 花蓮)
    const expressSpeedKmH = 85;
    const tripMinutes = Math.max(30, Math.round((distanceKm / expressSpeedKmH) * 60));

    // Option 1: Early Bird EMU3000 / Puyuma
    const opt1DepH = timeSlots[0].depH;
    const opt1DepM = timeSlots[0].depM;
    const opt1ArrM_total = opt1DepH * 60 + opt1DepM + tripMinutes;
    const opt1ArrH = Math.floor(opt1ArrM_total / 60);
    const opt1ArrM = opt1ArrM_total % 60;

    const opt1TrainNo = isEasternLine 
      ? (isNorthToSouth ? '自強 408次 (新自強)' : '自強 223次')
      : (isNorthToSouth ? '自強 103次 (EMU3000)' : '自強 134次');

    options.push({
      optionLabel: timeSlots[0].label,
      trainType: '新自強號 (EMU3000) / 普悠瑪',
      trainNo: opt1TrainNo,
      departureTime: `${pad(opt1DepH)}:${pad(opt1DepM)}`,
      arrivalTime: `${pad(opt1ArrH)}:${pad(opt1ArrM)}`,
      fareEstimate: tzeChiangFare,
      durationText: `約${Math.floor(tripMinutes / 60) > 0 ? `${Math.floor(tripMinutes / 60)}小時` : ''}${tripMinutes % 60}分`,
      features: '全車對號座・晨光出發充實玩滿一整天',
      isDirect: true,
      transferCount: 0,
      transferStations: [],
      transferSummary: '直達列車・無須轉乘',
      legs: [
        {
          legIndex: 1,
          trainType: '新自強號 (EMU3000)',
          trainNo: opt1TrainNo,
          fromStation: originName,
          toStation: destName,
          departureTime: `${pad(opt1DepH)}:${pad(opt1DepM)}`,
          arrivalTime: `${pad(opt1ArrH)}:${pad(opt1ArrM)}`,
          durationText: `約${tripMinutes}分鐘`,
          transferWaitMinutes: 0,
          note: '直達列車，一車直達目的地，車廂靜音舒適配備 Type-C 充電座。',
        },
      ],
    });

    // Option 2: Prime Golden Choice
    const opt2DepH = timeSlots[1].depH;
    const opt2DepM = timeSlots[1].depM;
    const opt2ArrM_total = opt2DepH * 60 + opt2DepM + tripMinutes;
    const opt2ArrH = Math.floor(opt2ArrM_total / 60);
    const opt2ArrM = opt2ArrM_total % 60;

    const opt2TrainNo = isEasternLine 
      ? (isNorthToSouth ? '自強 218次' : '自強 229次 (新自強)')
      : (isNorthToSouth ? '自強 113次' : '自強 142次');

    options.push({
      optionLabel: timeSlots[1].label,
      trainType: '自強號 / EMU3000',
      trainNo: opt2TrainNo,
      departureTime: `${pad(opt2DepH)}:${pad(opt2DepM)}`,
      arrivalTime: `${pad(opt2ArrH)}:${pad(opt2ArrM)}`,
      fareEstimate: tzeChiangFare,
      durationText: `約${Math.floor(tripMinutes / 60) > 0 ? `${Math.floor(tripMinutes / 60)}小時` : ''}${tripMinutes % 60}分`,
      features: '熱門黃金時段・最省時舒適班次',
      isDirect: true,
      transferCount: 0,
      transferStations: [],
      transferSummary: '直達列車・無須轉乘',
      legs: [
        {
          legIndex: 1,
          trainType: '台鐵 自強號',
          trainNo: opt2TrainNo,
          fromStation: originName,
          toStation: destName,
          departureTime: `${pad(opt2DepH)}:${pad(opt2DepM)}`,
          arrivalTime: `${pad(opt2ArrH)}:${pad(opt2ArrM)}`,
          durationText: `約${tripMinutes}分鐘`,
          transferWaitMinutes: 0,
          note: '熱門主力直達班次，乘車體驗舒適平穩。',
        },
      ],
    });

    // Option 3: Fast Local / Flexible (區間快車)
    const opt3DepH = timeSlots[2].depH;
    const opt3DepM = timeSlots[2].depM;
    const fastLocalMinutes = Math.round(tripMinutes * 1.15);
    const opt3ArrM_total = opt3DepH * 60 + opt3DepM + fastLocalMinutes;
    const opt3ArrH = Math.floor(opt3ArrM_total / 60);
    const opt3ArrM = opt3ArrM_total % 60;

    const opt3TrainNo = isEasternLine 
      ? (isNorthToSouth ? '區快 4018次' : '區快 4039次')
      : (isNorthToSouth ? '區快 2011次' : '區快 2032次');

    options.push({
      optionLabel: timeSlots[2].label,
      trainType: '台鐵 區間快車 (EMU900)',
      trainNo: opt3TrainNo,
      departureTime: `${pad(opt3DepH)}:${pad(opt3DepM)}`,
      arrivalTime: `${pad(opt3ArrH)}:${pad(opt3ArrM)}`,
      fareEstimate: localFare,
      durationText: `約${Math.floor(fastLocalMinutes / 60) > 0 ? `${Math.floor(fastLocalMinutes / 60)}小時` : ''}${fastLocalMinutes % 60}分`,
      features: '免劃位自由入座・可刷 TPASS 與電子票證',
      isDirect: true,
      transferCount: 0,
      transferStations: [],
      transferSummary: '直達列車・無須轉乘',
      legs: [
        {
          legIndex: 1,
          trainType: '台鐵 區間快車',
          trainNo: opt3TrainNo,
          fromStation: originName,
          toStation: destName,
          departureTime: `${pad(opt3DepH)}:${pad(opt3DepM)}`,
          arrivalTime: `${pad(opt3ArrH)}:${pad(opt3ArrM)}`,
          durationText: `約${fastLocalMinutes}分鐘`,
          transferWaitMinutes: 0,
          note: '直達區間快車，停靠主要城鎮大站，兼具速度與刷卡便利性。',
        },
      ],
    });
  }

  return options;
}

/**
 * Generate full Realistic Train Recommendation payload
 */
export function buildRealisticTrainRecommendation(origin: TRAStation, destination: TRAStation) {
  const outboundList = generateTRAOptions({ origin, destination, direction: 'outbound' });
  const inboundList = generateTRAOptions({ origin, destination, direction: 'inbound' });

  return {
    outbound: outboundList[1] || outboundList[0],
    inbound: inboundList[1] || inboundList[0],
    outboundList,
    inboundList,
    bookingTip: '台鐵車票於乘車日前 28 天凌晨 00:00 開放預訂，週末或連假熱門時段請及早於台鐵官網或「台鐵 e 訂通」App 購票。',
    traOfficialUrl: TRA_OFFICIAL_TIMETABLE_URL,
  };
}
