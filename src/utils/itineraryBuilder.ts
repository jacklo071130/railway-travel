import { TRAStation, TravelPreferences, DayItinerary, ItineraryStop } from '../types';
import { NearbyItem } from '../components/NearbyExplorer';

export function createItineraryWithSelectedItems(
  originStation: TRAStation,
  destinationStation: TRAStation,
  travelDate: string,
  selectedItems: NearbyItem[],
  preferences: TravelPreferences
): DayItinerary {
  const itemNames = selectedItems.map((i) => i.name);
  const title = `${destinationStation.name}鐵道美食景點深度一日遊`;
  const subtitle = `探訪${destinationStation.county}${destinationStation.name}，精選【${itemNames.slice(0, 3).join('、')}】等熱門在地名物`;

  const stops: ItineraryStop[] = [
    // Initial arrival stop
    {
      id: `stop-arrival-${Date.now()}`,
      timeSlot: '09:30 - 10:15',
      placeName: `${destinationStation.name}火車站 ＆ 站前商圈`,
      category: 'transport',
      highlight: `抵達${destinationStation.name}出站，領取地圖並租借 YouBike 開啟旅程`,
      description: `搭乘台鐵抵達${destinationStation.name}站，站前廣場設有觀光導覽地圖與公共接駁公車，感受在地車站風情。`,
      address: destinationStation.address || `${destinationStation.county}${destinationStation.name}火車站`,
      lat: destinationStation.lat,
      lng: destinationStation.lng,
      durationMinutes: 45,
      transportFromPrevious: {
        mode: 'train',
        durationText: '台鐵直達出站',
        details: `由${originStation.name}搭乘台鐵班次抵達${destinationStation.name}站`,
      },
      recommendedItems: ['站前打卡點', 'YouBike 2.0', '旅遊諮詢台'],
      tips: destinationStation.hasLuggageLocker ? '站內設有行李寄物櫃可寄放隨身行李。' : '可先至服務台詢問站前旅遊動線。',
      estimatedCostNtd: 0,
    },
    // Map selected items to itinerary stops
    ...selectedItems.map((item, idx) => {
      const isFood = item.category === 'food';
      const isSouvenir = item.category === 'souvenir';
      
      const angle = (idx + 1) * 1.25;
      const radius = 0.003 + (idx % 3) * 0.0025;
      const lat = destinationStation.lat + Math.sin(angle) * radius;
      const lng = destinationStation.lng + Math.cos(angle) * radius;

      const startH = 10 + Math.floor((idx + 1) * 1.4);
      const startM = ((idx + 1) * 20) % 60;
      const duration = isFood ? 50 : isSouvenir ? 40 : 70;
      const endM = (startM + duration) % 60;
      const endH = startH + Math.floor((startM + duration) / 60);

      const pad = (n: number) => n.toString().padStart(2, '0');
      const timeSlot = `${pad(startH)}:${pad(startM)} - ${pad(endH)}:${pad(endM)}`;

      return {
        id: `stop-item-${Date.now()}-${idx}`,
        timeSlot,
        placeName: item.name,
        category: isFood ? ('food' as const) : isSouvenir ? ('shopping' as const) : ('spot' as const),
        highlight: `${item.categoryName}・老饕熱門推薦 (${item.rating.toFixed(1)}★)`,
        description: item.description,
        address: `${destinationStation.county}${destinationStation.name}站周邊 (${item.distance})`,
        lat,
        lng,
        durationMinutes: duration,
        transportFromPrevious: {
          mode: 'walk' as const,
          durationText: item.distance,
          details: `從前一站點步行或騎乘 YouBike 前往 (${item.distance})`,
        },
        recommendedItems: [item.name, `${destinationStation.county}在地名物`],
        tips: `${item.name}為老饕好評推薦名單，建議依現場排隊人潮彈性調整時間。`,
        estimatedCostNtd: isFood ? 120 : isSouvenir ? 200 : 50,
      };
    }),
    // Return journey stop
    {
      id: `stop-return-${Date.now()}`,
      timeSlot: '17:30 - 18:15',
      placeName: `${destinationStation.name}火車站 (準備返程賦歸)`,
      category: 'transport',
      highlight: `選購${destinationStation.name}特色鐵路便當或伴手禮，乘車返程`,
      description: `返回${destinationStation.name}火車站月台候車，在車廂內品嚐熱騰騰的台鐵風味便當，為充實的一日遊劃下完美句點。`,
      address: `${destinationStation.county}${destinationStation.name}火車站`,
      lat: destinationStation.lat,
      lng: destinationStation.lng,
      durationMinutes: 45,
      transportFromPrevious: {
        mode: 'walk',
        durationText: '步行約 8 分鐘',
        details: '漫步返回車站大廳檢票進站',
      },
      recommendedItems: ['台鐵便當', '在地特色伴手禮'],
      tips: '建議發車前 15 分鐘至月台候車。',
      estimatedCostNtd: 100,
    },
  ];

  return {
    id: `trip-custom-${destinationStation.id}-${Date.now()}`,
    title,
    subtitle,
    originStation,
    destinationStation,
    travelDate,
    createdAt: new Date().toISOString(),
    estimatedTotalBudget: 600 + selectedItems.length * 150,
    summary: `本行程為您整合【${destinationStation.name}站】周邊嚴選的美食名店與人氣景點，包含${itemNames.join('、')}。動線由車站出發以放射狀慢活散策，兼具在地人文、打卡地標與必嚐美味。`,
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
        departureTime: '18:20',
        arrivalTime: '19:15',
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
            departureTime: '18:20',
            arrivalTime: '19:15',
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
