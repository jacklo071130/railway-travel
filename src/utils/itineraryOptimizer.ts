import { DayItinerary, ItineraryStop, TRAStation, TravelPreferences, TrainTripOption } from '../types';
import { NearbyItem } from '../components/NearbyExplorer';

// Helper: Calculate distance between two coordinates in km (Haversine formula)
export function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Business hour & optimal time-slot profiles for Taiwan spots and shops
export interface TimeProfile {
  category: 'morning_spot' | 'lunch_food' | 'afternoon_tea' | 'souvenir' | 'night_market' | 'dinner_food' | 'general_spot';
  timePriority: number; // 1 (morning) to 6 (night)
  preferredStartMinutes: number; // minutes from 00:00 (e.g. 570 = 09:30, 690 = 11:30)
  businessHoursText: string;
  bestVisitingText: string;
  defaultDurationMinutes: number;
}

// Identify spot/store profile by name and category
export function analyzePlaceProfile(placeName: string, category?: string, description?: string): TimeProfile {
  const name = (placeName + ' ' + (description || '')).toLowerCase();

  // 1. Night markets, evening snacks, skewer bars, dinner spots
  if (
    name.includes('夜市') ||
    name.includes('當歸羊肉') ||
    name.includes('羊肉湯') ||
    name.includes('糕渣') ||
    name.includes('卜肉') ||
    name.includes('碳烤') ||
    name.includes('居酒屋') ||
    name.includes('燒烤') ||
    name.includes('熱炒') ||
    name.includes('宵夜') ||
    name.includes('串燒') ||
    name.includes('東大門') ||
    name.includes('廟口') ||
    name.includes('六合') ||
    name.includes('花園夜市')
  ) {
    return {
      category: 'night_market',
      timePriority: 5,
      preferredStartMinutes: 1050, // 17:30
      businessHoursText: '16:30 - 23:30 (傍晚至深夜營業)',
      bestVisitingText: '🌙 晚間夜市與晚餐時段 (17:30 - 20:30)',
      defaultDurationMinutes: 80,
    };
  }

  // 2. Souvenirs, cakes, bakery boxes, packed local specialties (Best before return departure!)
  if (
    category === 'souvenir' ||
    category === 'shopping' ||
    name.includes('伴手禮') ||
    name.includes('奶凍捲') ||
    name.includes('諾貝爾') ||
    name.includes('奕順軒') ||
    name.includes('牛舌餅') ||
    name.includes('太陽餅') ||
    name.includes('鳳梨酥') ||
    name.includes('名產') ||
    name.includes('麻糬') ||
    name.includes('蜜餞') ||
    name.includes('肉乾') ||
    name.includes('蛋黃酥') ||
    name.includes('奶油酥餅') ||
    name.includes('糕餅') ||
    name.includes('鴨賞')
  ) {
    return {
      category: 'souvenir',
      timePriority: 4,
      preferredStartMinutes: 990, // 16:30
      businessHoursText: '09:00 - 21:00 (全日營業)',
      bestVisitingText: '🛍️ 傍晚返程前夕採買 (免提重物冷藏保鮮)',
      defaultDurationMinutes: 35,
    };
  }

  // 3. Lunch foods, hot meals, noodle/rice eateries, traditional savory meals
  if (
    category === 'food' &&
    (name.includes('牛肉麵') ||
      name.includes('蔥油派') ||
      name.includes('肉圓') ||
      name.includes('排骨') ||
      name.includes('爌肉') ||
      name.includes('意麵') ||
      name.includes('扁食') ||
      name.includes('米粉') ||
      name.includes('小籠包') ||
      name.includes('雞肉飯') ||
      name.includes('鵝肉') ||
      name.includes('甕仔雞') ||
      name.includes('羹') ||
      name.includes('碗粿') ||
      name.includes('便當') ||
      name.includes('海鮮') ||
      name.includes('合菜') ||
      name.includes('麵') ||
      name.includes('小吃') ||
      name.includes('飯'))
  ) {
    return {
      category: 'lunch_food',
      timePriority: 2,
      preferredStartMinutes: 690, // 11:30
      businessHoursText: '11:00 - 14:00 / 17:00 - 20:30',
      bestVisitingText: '🍲 午餐尖峰時段 (11:30 - 13:30)',
      defaultDurationMinutes: 55,
    };
  }

  // 4. Afternoon desserts, cafes, ice shops, tea houses, indoor galleries
  if (
    name.includes('湯圓') ||
    name.includes('豆花') ||
    name.includes('冰') ||
    name.includes('冰淇淋') ||
    name.includes('咖啡') ||
    name.includes('下午茶') ||
    name.includes('甜品') ||
    name.includes('茶飲') ||
    name.includes('文創') ||
    name.includes('文化園區') ||
    name.includes('糖廠') ||
    name.includes('美術館') ||
    name.includes('故事館') ||
    name.includes('工廠') ||
    name.includes('泡湯') ||
    name.includes('溫泉')
  ) {
    return {
      category: 'afternoon_tea',
      timePriority: 3,
      preferredStartMinutes: 810, // 13:30
      businessHoursText: '10:00 - 18:00',
      bestVisitingText: '☕ 午後悠閒漫活時段 (13:30 - 16:30)',
      defaultDurationMinutes: 65,
    };
  }

  // 5. Morning nature spots, parks, forest culture, hiking trails, heritage temples
  if (
    name.includes('林業') ||
    name.includes('森林') ||
    name.includes('公園') ||
    name.includes('步道') ||
    name.includes('瀑布') ||
    name.includes('綠色隧道') ||
    name.includes('老街') ||
    name.includes('廟') ||
    name.includes('宮') ||
    name.includes('寺') ||
    name.includes('湖') ||
    name.includes('埤') ||
    name.includes('自然') ||
    name.includes('觀景') ||
    name.includes('園區')
  ) {
    return {
      category: 'morning_spot',
      timePriority: 1,
      preferredStartMinutes: 585, // 09:45
      businessHoursText: '08:00 - 17:00 (戶外全日開放)',
      bestVisitingText: '🌅 晨間戶外活力漫步 (09:30 - 11:30)',
      defaultDurationMinutes: 75,
    };
  }

  // Default general spot
  return {
    category: 'general_spot',
    timePriority: 2.5,
    preferredStartMinutes: 750, // 12:30
    businessHoursText: '09:00 - 18:00',
    bestVisitingText: '📍 日間悠閒造訪',
    defaultDurationMinutes: 55,
  };
}

/**
 * Intelligent Route & Business Hours Optimizer Engine:
 * 1. Segregates and classifies stops by time-window priority (Morning -> Lunch -> Afternoon -> Souvenirs -> Night Market).
 * 2. Within and across buckets, solves Traveling Salesperson / Nearest Neighbor from Station to eliminate backtracking.
 * 3. Builds seamless, realistic time intervals starting from Train arrival time (e.g. 09:25 -> 09:30).
 * 4. Computes precise geographic transit directions, distance (km), travel duration, and mode (Walk, YouBike, Bus).
 */
export function optimizeItineraryStops(
  station: TRAStation,
  rawStops: ItineraryStop[],
  startHourTime: string = '09:30'
): ItineraryStop[] {
  if (!rawStops || rawStops.length === 0) return [];

  // Filter out transport wrapper stops if present so we optimize the real activity stops
  const nonTransportStops = rawStops.filter(
    (s) => !s.id.startsWith('stop-arrival') && !s.id.startsWith('stop-return') && s.category !== 'transport'
  );

  if (nonTransportStops.length === 0) return rawStops;

  // Enrich stops with place profiles & coordinates if missing
  const enriched = nonTransportStops.map((stop, idx) => {
    const profile = analyzePlaceProfile(stop.placeName, stop.category, stop.description);
    
    // Ensure realistic coordinates relative to station if not set
    let lat = stop.lat || station.lat;
    let lng = stop.lng || station.lng;
    if (lat === station.lat && lng === station.lng) {
      const angle = (idx + 1) * 1.25;
      const radius = 0.0035 + (idx % 3) * 0.002;
      lat = station.lat + Math.sin(angle) * radius;
      lng = station.lng + Math.cos(angle) * radius;
    }

    return {
      ...stop,
      lat,
      lng,
      profile,
      durationMinutes: stop.durationMinutes || profile.defaultDurationMinutes,
    };
  });

  // Step 1: Bucket into logical time-window phases
  // Phase 1: Morning spots & sights (Priority 1)
  // Phase 2: Lunch dining & local foods (Priority 2)
  // Phase 3: Afternoon attractions & cafes (Priority 3)
  // Phase 4: Souvenirs & Bakeries (Priority 4)
  // Phase 5: Night market & dinner (Priority 5)
  const phases = [
    enriched.filter((s) => s.profile.timePriority === 1),
    enriched.filter((s) => s.profile.timePriority === 2),
    enriched.filter((s) => s.profile.timePriority >= 2.5 && s.profile.timePriority <= 3),
    enriched.filter((s) => s.profile.timePriority === 4),
    enriched.filter((s) => s.profile.timePriority === 5),
  ];

  // Step 2: Route optimization (Nearest Neighbor within and connecting phases)
  const orderedStops: typeof enriched = [];
  let currentLat = station.lat;
  let currentLng = station.lng;

  for (const phaseStops of phases) {
    if (phaseStops.length === 0) continue;

    // Route optimize within this phase using nearest-neighbor from current position
    const unvisited = [...phaseStops];
    while (unvisited.length > 0) {
      let nearestIdx = 0;
      let minDistance = calculateHaversineDistanceKm(currentLat, currentLng, unvisited[0].lat, unvisited[0].lng);

      for (let i = 1; i < unvisited.length; i++) {
        const d = calculateHaversineDistanceKm(currentLat, currentLng, unvisited[i].lat, unvisited[i].lng);
        if (d < minDistance) {
          minDistance = d;
          nearestIdx = i;
        }
      }

      const nextStop = unvisited.splice(nearestIdx, 1)[0];
      orderedStops.push(nextStop);
      currentLat = nextStop.lat;
      currentLng = nextStop.lng;
    }
  }

  // Step 3: Compute continuous chronological timeline & transit info
  const [initialH, initialM] = startHourTime.split(':').map((n) => parseInt(n, 10) || 0);
  let currentMinutes = (initialH || 9) * 60 + (initialM || 30);

  // Arrival Stop at Station
  const finalStops: ItineraryStop[] = [
    {
      id: `stop-arrival-${Date.now()}`,
      timeSlot: `${pad(Math.floor(currentMinutes / 60))}:${pad(currentMinutes % 60)} - ${pad(
        Math.floor((currentMinutes + 35) / 60)
      )}:${pad((currentMinutes + 35) % 60)}`,
      placeName: `${station.name}火車站 ＆ 站前商圈`,
      placeNameEn: `${station.nameEn} Station & Plaza`,
      category: 'transport',
      highlight: `抵達${station.name}出站，領取地圖導覽並租借 YouBike 2.0 開啟最佳路徑遊程`,
      description: `搭乘台鐵抵達${station.name}站，站前廣場設有觀光公車站牌與 YouBike 租借站，已為您依店家營業時間與最短路徑規劃順暢動線。`,
      address: station.address || `${station.county}${station.name}火車站`,
      lat: station.lat,
      lng: station.lng,
      durationMinutes: 35,
      transportFromPrevious: {
        mode: 'train',
        durationText: '台鐵列車直達抵達',
        details: `抵達${station.name}火車站月台，驗票出站至站前廣場`,
      },
      recommendedItems: ['站前打卡地標', 'YouBike 2.0', '旅遊諮詢服務台'],
      tips: station.hasLuggageLocker ? '站內設有電子行李寄物櫃，建議先行寄放大件隨身行李輕鬆遊玩。' : '可於站前旅客服務中心索取在地導覽手冊。',
      estimatedCostNtd: 0,
    },
  ];

  currentMinutes += 35;
  let prevLat = station.lat;
  let prevLng = station.lng;
  let prevPlaceName = `${station.name}火車站`;

  // Process all ordered activity stops
  orderedStops.forEach((stop, idx) => {
    const distanceKm = calculateHaversineDistanceKm(prevLat, prevLng, stop.lat, stop.lng);
    
    // Determine transit mode and duration based on distance
    let transitMode: 'walk' | 'youbike' | 'bus' | 'taxi' = 'walk';
    let transitDurationMin = 5;
    let durationText = '步行約 5 分鐘';
    let transitDetails = `由【${prevPlaceName}】步行前往 (${(distanceKm * 1000).toFixed(0)}m)`;

    if (distanceKm < 0.6) {
      transitMode = 'walk';
      transitDurationMin = Math.max(3, Math.round(distanceKm * 12));
      durationText = `步行約 ${transitDurationMin} 分鐘`;
      transitDetails = `沿站前平坦動線漫步前往 (${(distanceKm * 1000).toFixed(0)} 公尺)`;
    } else if (distanceKm < 2.0) {
      transitMode = 'youbike';
      transitDurationMin = Math.max(5, Math.round(distanceKm * 4) + 3);
      durationText = `騎乘 YouBike 約 ${transitDurationMin} 分鐘`;
      transitDetails = `租借 YouBike 沿市區單車道騎行約 ${(distanceKm).toFixed(1)} 公里`;
    } else {
      transitMode = 'bus';
      transitDurationMin = Math.max(10, Math.round(distanceKm * 3) + 8);
      durationText = `搭乘公車/好行約 ${transitDurationMin} 分鐘`;
      transitDetails = `搭乘在地接駁公車或台灣好行前往約 ${(distanceKm).toFixed(1)} 公里`;
    }

    currentMinutes += transitDurationMin;

    const startH = Math.floor(currentMinutes / 60);
    const startM = currentMinutes % 60;
    const duration = stop.durationMinutes || stop.profile.defaultDurationMinutes;
    const endMinutes = currentMinutes + duration;
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;

    const timeSlot = `${pad(startH)}:${pad(startM)} - ${pad(endH)}:${pad(endM)}`;

    finalStops.push({
      id: stop.id || `stop-${Date.now()}-${idx}`,
      timeSlot,
      placeName: stop.placeName,
      placeNameEn: stop.placeNameEn,
      category: stop.category,
      highlight: stop.highlight || `${stop.profile.bestVisitingText}・在地推薦`,
      description: stop.description || `${stop.placeName}為${station.county}代表性在地名店，排入今日最佳順序路線。`,
      address: stop.address || `${station.county}${station.name}站周邊`,
      lat: stop.lat,
      lng: stop.lng,
      durationMinutes: duration,
      transportFromPrevious: {
        mode: transitMode,
        durationText,
        details: transitDetails,
      },
      recommendedItems: stop.recommendedItems && stop.recommendedItems.length > 0 ? stop.recommendedItems : [stop.placeName, `${station.name}在地名物`],
      tips: stop.tips || `【${stop.profile.businessHoursText}】建議依現場排隊動線彈性調配時間。`,
      estimatedCostNtd: stop.estimatedCostNtd !== undefined ? stop.estimatedCostNtd : stop.category === 'food' ? 120 : stop.category === 'shopping' ? 220 : 50,
    });

    currentMinutes = endMinutes;
    prevLat = stop.lat;
    prevLng = stop.lng;
    prevPlaceName = stop.placeName;
  });

  // Step 4: Add Return Departure Stop at Station
  const returnDistanceKm = calculateHaversineDistanceKm(prevLat, prevLng, station.lat, station.lng);
  const returnTransitMin = Math.max(5, Math.round(returnDistanceKm * 8) + 4);
  currentMinutes += returnTransitMin;

  const returnStartH = Math.floor(currentMinutes / 60);
  const returnStartM = currentMinutes % 60;
  const returnEndMinutes = currentMinutes + 45;
  const returnEndH = Math.floor(returnEndMinutes / 60);
  const returnEndM = returnEndMinutes % 60;

  finalStops.push({
    id: `stop-return-${Date.now()}`,
    timeSlot: `${pad(returnStartH)}:${pad(returnStartM)} - ${pad(returnEndH)}:${pad(returnEndM)}`,
    placeName: `${station.name}火車站 (準備搭車賦歸)`,
    placeNameEn: `${station.nameEn} Station Return`,
    category: 'transport',
    highlight: `選購${station.name}特色鐵路便當或伴手禮，乘車返程`,
    description: `返回${station.name}火車站月台候車，在車廂內品嚐熱騰騰的台鐵風味便當，回顧一整天充實且順暢的最佳路徑鐵道之旅。`,
    address: station.address || `${station.county}${station.name}火車站`,
    lat: station.lat,
    lng: station.lng,
    durationMinutes: 45,
    transportFromPrevious: {
      mode: returnDistanceKm < 1.0 ? 'walk' : 'youbike',
      durationText: returnDistanceKm < 1.0 ? `步行約 ${returnTransitMin} 分鐘` : `騎乘 YouBike 約 ${returnTransitMin} 分鐘`,
      details: `由最後一站【${prevPlaceName}】順路漫步返回${station.name}火車站月台`,
    },
    recommendedItems: ['台鐵熱便當', '車上享用在地名產', '台鐵紀念品'],
    tips: '建議發車前 15 分鐘抵達月台候車，若持有對號座車票請留意車廂號碼。',
    estimatedCostNtd: 100,
  });

  return finalStops;
}

// Re-calculate and generate optimized itinerary with selected items
export function createOptimizedItineraryWithSelectedItems(
  originStation: TRAStation,
  destinationStation: TRAStation,
  travelDate: string,
  selectedItems: NearbyItem[],
  preferences: TravelPreferences
): DayItinerary {
  const itemNames = selectedItems.map((i) => i.name);
  const title = `${destinationStation.name}鐵道美食景點深度一日遊`;
  const subtitle = `探訪${destinationStation.county}${destinationStation.name}，精選【${itemNames.slice(0, 3).join('、')}】等熱門在地名物`;

  // Build raw stops from selected items
  const rawItemStops: ItineraryStop[] = selectedItems.map((item, idx) => {
    const isFood = item.category === 'food';
    const isSouvenir = item.category === 'souvenir';
    const angle = (idx + 1) * 1.25;
    const radius = 0.003 + (idx % 3) * 0.0025;
    const lat = destinationStation.lat + Math.sin(angle) * radius;
    const lng = destinationStation.lng + Math.cos(angle) * radius;
    const profile = analyzePlaceProfile(item.name, item.category, item.description);

    return {
      id: `stop-item-${Date.now()}-${idx}`,
      timeSlot: '00:00 - 00:00', // Will be re-computed by optimizer
      placeName: item.name,
      category: isFood ? 'food' : isSouvenir ? 'shopping' : 'spot',
      highlight: `${item.categoryName}・老饕熱門推薦 (${item.rating.toFixed(1)}★)`,
      description: item.description,
      address: `${destinationStation.county}${destinationStation.name}站周邊 (${item.distance})`,
      lat,
      lng,
      durationMinutes: profile.defaultDurationMinutes,
      transportFromPrevious: {
        mode: 'walk',
        durationText: item.distance,
        details: `從前一站點前往 (${item.distance})`,
      },
      recommendedItems: [item.name, `${destinationStation.county}在地名物`],
      tips: `【${profile.businessHoursText}】${profile.bestVisitingText}`,
      estimatedCostNtd: isFood ? 120 : isSouvenir ? 200 : 50,
    };
  });

  // Optimize with optimal path and business hours
  const stops = optimizeItineraryStops(destinationStation, rawItemStops, '09:30');

  // Calculate return time from final stop to adjust inbound train recommendation
  const lastStop = stops[stops.length - 1];
  const departureH = lastStop ? lastStop.timeSlot.split(' - ')[0].split(':')[0] : '18';
  const departureM = lastStop ? lastStop.timeSlot.split(' - ')[0].split(':')[1] : '20';

  const estimatedTotalBudget = Math.max(500, 450 + selectedItems.length * 140);

  return {
    id: `trip-custom-${destinationStation.id}-${Date.now()}`,
    title,
    subtitle,
    originStation,
    destinationStation,
    travelDate,
    createdAt: new Date().toISOString(),
    estimatedTotalBudget,
    summary: `本行程為您整合【${destinationStation.name}站】周邊嚴選的美食名店與人氣景點（包含${itemNames.join('、')}）。已全面依照【各店家營業時間】與【最短不走回頭路最佳路徑】自動智慧編排順序，兼具早晨漫步、午間名吃、午後漫活與傍晚名產/夜市最佳體驗！`,
    trainRecommendation: {
      outbound: {
        optionLabel: '主力推薦',
        trainType: '自強號 / 新自強號',
        trainNo: '自強 112次',
        departureTime: '08:30',
        arrivalTime: '09:25',
        durationText: '約55分',
        fareEstimate: 165,
        features: '早晨舒適出發・全日時間充足',
        isDirect: true,
        transferCount: 0,
        transferStations: [],
        transferSummary: '直達列車・無須轉乘',
        legs: [
          {
            legIndex: 1,
            trainType: '自強號',
            trainNo: '自強 112次',
            fromStation: originStation.name,
            toStation: destinationStation.name,
            departureTime: '08:30',
            arrivalTime: '09:25',
            durationText: '約55分',
            transferWaitMinutes: 0,
            note: '直達列車',
          },
        ],
      },
      inbound: {
        optionLabel: '主力推薦',
        trainType: '自強號',
        trainNo: '自強 145次',
        departureTime: `${departureH}:${departureM}`,
        arrivalTime: `${pad(parseInt(departureH) + 1)}:${departureM}`,
        durationText: '約55分',
        fareEstimate: 165,
        features: '晚間悠閒返程・車上享用便當',
        isDirect: true,
        transferCount: 0,
        transferStations: [],
        transferSummary: '直達列車・無須轉乘',
        legs: [
          {
            legIndex: 1,
            trainType: '自強號',
            trainNo: '自強 145次',
            fromStation: destinationStation.name,
            toStation: originStation.name,
            departureTime: `${departureH}:${departureM}`,
            arrivalTime: `${pad(parseInt(departureH) + 1)}:${departureM}`,
            durationText: '約55分',
            transferWaitMinutes: 0,
            note: '直達返程列車',
          },
        ],
      },
      bookingTip: '週末或連假期間人潮較多，建議預先至台鐵官網或「台鐵e訂通」App提前訂票。',
      traOfficialUrl: 'https://www.railway.gov.tw/tra-tip-web/tip',
    },
    stops,
    transitGuide: {
      stationExitTips: `${destinationStation.name}站為${destinationStation.gradeLabel}，出站即為站前商圈與大眾運輸搭乘處。`,
      youbikeInfo: destinationStation.hasYouBike
        ? `${destinationStation.name}火車站前設有 YouBike 2.0 租借站，便於短程代步。`
        : '站前設有客運公車與計程車排班區。',
      localBusSummary: '站前設有市區公車與台灣好行接駁公車，可直達各大熱門景點。',
      taxiTips: '站前排班計程車跳表起跳，周邊景點車程約 5~15 分鐘。',
      precautions: [
        '行程順序已依各店家營業時間（如夜市傍晚開、正餐午間吃、伴手禮回程前買）與最短路徑規劃。',
        '若遇週末用餐尖峰，熱門名店建議提早前往或耐心等候。',
        '建議隨身攜帶防曬用品、薄外套與輕便雨具。',
      ],
    },
    localSpecialties: {
      mustEat: [
        ...selectedItems.filter((i) => i.category === 'food').map((i) => i.name),
        ...destinationStation.popularFoods,
      ].filter((v, i, a) => a.indexOf(v) === i),
      souvenirs: [
        ...selectedItems.filter((i) => i.category === 'souvenir').map((i) => i.name),
        `${destinationStation.county}在地特產伴手禮`,
      ].filter((v, i, a) => a.indexOf(v) === i),
      bentoRecommendation: `推薦於${destinationStation.name}站或車上購買「台鐵排骨便當」或在地限定風味便當。`,
    },
    weatherAdvice: `${destinationStation.county}氣候舒適，建議穿著便於行走的休閒健步鞋與透氣服裝。`,
    preferences,
  };
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}
