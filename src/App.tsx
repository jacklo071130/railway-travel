import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { StationSelector } from './components/StationSelector';
import { TravelPreferencesModal } from './components/TravelPreferencesModal';
import { ItineraryView } from './components/ItineraryView';
import { InteractiveMap } from './components/InteractiveMap';
import { NearbyExplorer, NearbyItem } from './components/NearbyExplorer';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';
import { SavedTripsModal } from './components/SavedTripsModal';
import { TRAQuickInfo } from './components/TRAQuickInfo';
import { ApiKeyModal } from './components/ApiKeyModal';
import { TRAStation, TravelPreferences, DayItinerary, ItineraryStop, ApiKeysConfig } from './types';
import { TAIWAN_TRA_STATIONS, findStationById } from './data/taiwanStations';
import { createItineraryWithSelectedItems } from './utils/itineraryBuilder';
import { optimizeItineraryStops, analyzePlaceProfile } from './utils/itineraryOptimizer';
import { Train, Sparkles, MapPin, Compass, AlertCircle, RefreshCw, Key, ShieldCheck, CheckCircle2, Route } from 'lucide-react';

// In-memory session temporary state for API Keys (do not persist to localStorage)
const STORAGE_KEY_SAVED_TRIPS = 'TRA_TRAVEL_SAVED_TRIPS_V1';
const STORAGE_KEY_API_KEYS = 'TRA_API_KEYS_CONFIG_V1';

export default function App() {
  // 0. API Keys State (Temporary In-Memory Session Cache - Not stored in localStorage)
  const [apiKeys, setApiKeys] = useState<ApiKeysConfig>(() => {
    // Clear any previously persisted API keys from localStorage to respect temporary privacy
    try {
      localStorage.removeItem(STORAGE_KEY_API_KEYS);
    } catch {}
    return {
      geminiApiKey: '',
      googleMapsApiKey: '',
      isGeminiValid: false,
      isMapsValid: true,
    };
  });
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // 1. Station State (Default: 台北 -> 礁溪)
  const [originStation, setOriginStation] = useState<TRAStation>(
    findStationById('1008') || TAIWAN_TRA_STATIONS[0]
  );
  const [destinationStation, setDestinationStation] = useState<TRAStation>(
    findStationById('7200') || TAIWAN_TRA_STATIONS[1] // 礁溪
  );

  // 2. Travel Date (Tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const formattedTomorrow = tomorrow.toISOString().split('T')[0];
  const [travelDate, setTravelDate] = useState<string>(formattedTomorrow);

  // 3. Travel Preferences
  const [preferences, setPreferences] = useState<TravelPreferences>({
    style: 'gourmet',
    companion: 'couple',
    pace: 'moderate',
    transport: 'walk_youbike',
    customNotes: '',
  });

  // 4. UI Modals and Tabs State
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'planner' | 'map' | 'explorer' | 'tra-info'>('planner');

  // 5. Itinerary Data & Loading State
  const [itinerary, setItinerary] = useState<DayItinerary | null>(null);
  const [isLoadingItinerary, setIsLoadingItinerary] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 6. Map & GPS Location State
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userNearestStation, setUserNearestStation] = useState<TRAStation | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedStopOnMap, setSelectedStopOnMap] = useState<ItineraryStop | null>(null);

  // 7. Saved Trips (Local Storage)
  const [savedTrips, setSavedTrips] = useState<DayItinerary[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SAVED_TRIPS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [addedToastMessage, setAddedToastMessage] = useState<string | null>(null);
  const itineraryResultRef = useRef<HTMLDivElement>(null);

  // Auto save trips to local storage (API keys are kept strictly temporary in memory only)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_TRIPS, JSON.stringify(savedTrips));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [savedTrips]);

  // Initial Sample Itinerary on load (台北 -> 礁溪)
  useEffect(() => {
    const initialItinerary: DayItinerary = {
      id: 'trip-initial-jiaoxi',
      title: '礁溪溫泉鄉與蘭陽美饌慢活一日遊',
      subtitle: '從台北出發，乘著火車迎風抵達溫泉之鄉，品嚐蔥油餅、泡湯放鬆、探索林美石磐森林步道',
      originStation: originStation,
      destinationStation: destinationStation,
      travelDate: formattedTomorrow,
      createdAt: new Date().toISOString(),
      estimatedTotalBudget: 950,
      summary:
        '本行程精選宜蘭礁溪最受歡迎的溫泉文化、排隊美食與自然綠意步道。搭乘舒適的台鐵自強號出發，上午散步於湯圍溝溫泉公園享受免費溫泉足湯，午餐品嚐在地老字號三星蔥油餅與八寶冬粉，午後漫步綠意盎然的林美石磐步道，傍晚選購宜蘭特色伴手禮與台鐵特色便當，搭乘傍晚自強號悠閒賦歸。',
      trainRecommendation: {
        outbound: {
          optionLabel: '主力推薦',
          trainType: '新自強號 (EMU3000)',
          trainNo: '自強 408次',
          departureTime: '08:35',
          arrivalTime: '09:42',
          durationText: '約1小時07分',
          fareEstimate: 199,
          features: '熱門黃金時段・最省時舒適班次',
          isDirect: true,
          transferCount: 0,
          transferStations: [],
          transferSummary: '直達列車・無須轉乘',
          legs: [
            {
              legIndex: 1,
              trainType: '新自強號 (EMU3000)',
              trainNo: '自強 408次',
              fromStation: '台北',
              toStation: '礁溪',
              departureTime: '08:35',
              arrivalTime: '09:42',
              durationText: '約1小時07分',
              transferWaitMinutes: 0,
              note: '直達列車，一車直達礁溪火車站',
            },
          ],
        },
        inbound: {
          optionLabel: '主力推薦',
          trainType: '自強號',
          trainNo: '自強 235次',
          departureTime: '17:50',
          arrivalTime: '19:05',
          durationText: '約1小時15分',
          fareEstimate: 199,
          features: '完美一日遊收尾・車上享用鐵路便當',
          isDirect: true,
          transferCount: 0,
          transferStations: [],
          transferSummary: '直達列車・無須轉乘',
          legs: [
            {
              legIndex: 1,
              trainType: '自強號',
              trainNo: '自強 235次',
              fromStation: '礁溪',
              toStation: '台北',
              departureTime: '17:50',
              arrivalTime: '19:05',
              durationText: '約1小時15分',
              transferWaitMinutes: 0,
              note: '直達返程列車，推薦車上享用台鐵便當',
            },
          ],
        },
        outboundList: [
          {
            optionLabel: '早鳥首選',
            trainType: '新自強號 (EMU3000)',
            trainNo: '自強 204次',
            departureTime: '07:35',
            arrivalTime: '08:44',
            durationText: '約1小時09分',
            fareEstimate: 199,
            features: '全車對號座・晨間抵達充實探索',
            isDirect: true,
            transferCount: 0,
            transferStations: [],
            transferSummary: '直達列車・無須轉乘',
            legs: [
              {
                legIndex: 1,
                trainType: '新自強號 (EMU3000)',
                trainNo: '自強 204次',
                fromStation: '台北',
                toStation: '礁溪',
                departureTime: '07:35',
                arrivalTime: '08:44',
                durationText: '約1小時09分',
                transferWaitMinutes: 0,
                note: '直達列車，晨光美景',
              },
            ],
          },
          {
            optionLabel: '主力推薦',
            trainType: '新自強號 (EMU3000)',
            trainNo: '自強 408次',
            departureTime: '08:35',
            arrivalTime: '09:42',
            durationText: '約1小時07分',
            fareEstimate: 199,
            features: '熱門黃金時段・最省時舒適班次',
            isDirect: true,
            transferCount: 0,
            transferStations: [],
            transferSummary: '直達列車・無須轉乘',
            legs: [
              {
                legIndex: 1,
                trainType: '新自強號 (EMU3000)',
                trainNo: '自強 408次',
                fromStation: '台北',
                toStation: '礁溪',
                departureTime: '08:35',
                arrivalTime: '09:42',
                durationText: '約1小時07分',
                transferWaitMinutes: 0,
                note: '直達列車，一車直達礁溪火車站',
              },
            ],
          },
          {
            optionLabel: '悠閒出發',
            trainType: '區間快車 (EMU900)',
            trainNo: '區快 4018次',
            departureTime: '09:20',
            arrivalTime: '10:42',
            durationText: '約1小時22分',
            fareEstimate: 128,
            features: '免劃位・可刷 TPASS 與悠遊卡乘車',
            isDirect: true,
            transferCount: 0,
            transferStations: [],
            transferSummary: '直達列車・無須轉乘',
            legs: [
              {
                legIndex: 1,
                trainType: '區間快車 (EMU900)',
                trainNo: '區快 4018次',
                fromStation: '台北',
                toStation: '礁溪',
                departureTime: '09:20',
                arrivalTime: '10:42',
                durationText: '約1小時22分',
                transferWaitMinutes: 0,
                note: '直達列車，自由入座免劃位',
              },
            ],
          },
        ],
        inboundList: [
          {
            optionLabel: '提早賦歸',
            trainType: '自強號',
            trainNo: '自強 223次',
            departureTime: '16:50',
            arrivalTime: '18:05',
            durationText: '約1小時15分',
            fareEstimate: 199,
            features: '避開尖峰人潮・輕鬆返家享用晚餐',
            isDirect: true,
            transferCount: 0,
            transferStations: [],
            transferSummary: '直達列車・無須轉乘',
            legs: [
              {
                legIndex: 1,
                trainType: '自強號',
                trainNo: '自強 223次',
                fromStation: '礁溪',
                toStation: '台北',
                departureTime: '16:50',
                arrivalTime: '18:05',
                durationText: '約1小時15分',
                transferWaitMinutes: 0,
                note: '直達返程列車',
              },
            ],
          },
          {
            optionLabel: '主力推薦',
            trainType: '自強號',
            trainNo: '自強 235次',
            departureTime: '17:50',
            arrivalTime: '19:05',
            durationText: '約1小時15分',
            fareEstimate: 199,
            features: '完美一日遊收尾・車上享用鐵路便當',
            isDirect: true,
            transferCount: 0,
            transferStations: [],
            transferSummary: '直達列車・無須轉乘',
            legs: [
              {
                legIndex: 1,
                trainType: '自強號',
                trainNo: '自強 235次',
                fromStation: '礁溪',
                toStation: '台北',
                departureTime: '17:50',
                arrivalTime: '19:05',
                durationText: '約1小時15分',
                transferWaitMinutes: 0,
                note: '直達返程列車，推薦車上享用台鐵便當',
              },
            ],
          },
          {
            optionLabel: '晚間漫遊',
            trainType: '新自強號 (EMU3000)',
            trainNo: '自強 285次',
            departureTime: '19:15',
            arrivalTime: '20:25',
            durationText: '約1小時10分',
            fareEstimate: 199,
            features: '夜市商圈逛好逛滿・享受在地夜景',
            isDirect: true,
            transferCount: 0,
            transferStations: [],
            transferSummary: '直達列車・無須轉乘',
            legs: [
              {
                legIndex: 1,
                trainType: '新自強號 (EMU3000)',
                trainNo: '自強 285次',
                fromStation: '礁溪',
                toStation: '台北',
                departureTime: '19:15',
                arrivalTime: '20:25',
                durationText: '約1小時10分',
                transferWaitMinutes: 0,
                note: '直達返程列車',
              },
            ],
          },
        ],
        bookingTip:
          '週末前往宜蘭車票較熱門，建議於乘車前28天至台鐵官網或「台鐵e訂通」App提前訂票，或搭乘班次密集的區間快車刷悠遊卡進站。',
        traOfficialUrl: 'https://www.railway.gov.tw/tra-tip-web/tip',
      },
      stops: [
        {
          id: 'stop-1',
          timeSlot: '09:50 - 10:40',
          placeName: '礁溪火車站 ＆ 站前溫泉泡腳池',
          category: 'photo',
          highlight: '抵達礁溪出站即見溫泉地景，感受宜蘭熱情地熱蒸氣',
          description:
            '出火車站即可看到站前廣場的露天溫泉泡腳池，周邊有許多溫泉旅館與熱鬧商圈。建議在此領取觀光地圖，並於站前租借 YouBike 2.0 展開旅程。',
          address: '宜蘭縣礁溪鄉溫泉路1號',
          lat: 24.8291,
          lng: 121.7749,
          durationMinutes: 50,
          transportFromPrevious: {
            mode: 'train',
            durationText: '出站即達',
            details: '抵達礁溪車站剪票口出站',
          },
          recommendedItems: ['站前地熱足湯', 'YouBike租借站', '遊客服務中心'],
          tips: '站內設有電子行李寄物櫃，可先將大件行李寄放輕裝出遊。',
          estimatedCostNtd: 0,
        },
        {
          id: 'stop-2',
          timeSlot: '10:50 - 12:00',
          placeName: '湯圍溝溫泉公園 ＆ 柯氏蔥油餅',
          category: 'food',
          highlight: '濃郁日式檜木風呂造景、水岸溫泉溪流與人氣排隊名店',
          description:
            '礁溪最代表性的溫泉公園，擁有自然的溫泉出海口湧泉溪流。園區設有日式涼亭與溫泉魚咬腳體驗。步行3分鐘可至超人氣「柯氏蔥油餅」，外酥內嫩滿滿三星蔥香！',
          address: '宜蘭縣礁溪鄉德陽路99-11號',
          lat: 24.8276,
          lng: 121.7708,
          durationMinutes: 70,
          transportFromPrevious: {
            mode: 'walk',
            durationText: '步行約 8 分鐘',
            details: '由中山路直行右轉德陽路即可抵達公園綠帶',
          },
          recommendedItems: ['柯氏蔥油餅 (加蛋)', '吳記花生捲冰淇淋', '溫泉魚泡腳體驗'],
          tips: '蔥油餅排隊人潮多但動作快，推薦加辣醬與甜辣醬雙醬更對味。',
          estimatedCostNtd: 120,
        },
        {
          id: 'stop-3',
          timeSlot: '12:15 - 13:30',
          placeName: '礁溪八寶冬粉 ＆ 正常鮮肉小籠湯包',
          category: 'food',
          highlight: '在地傳承數十年古早味，清甜高湯與爆汁鮮甜湯包',
          description:
            '中午品嚐礁溪最具代表性的古早味美食。「八寶冬粉」以肉羹、花枝羹、蝦球、金針等八種鮮美食材熬煮，湯頭清甜鮮美；搭配皮薄餡多、滿滿三星蔥湯汁的現包現蒸小籠湯包。',
          address: '宜蘭縣礁溪鄉中山路二段131號',
          lat: 24.8285,
          lng: 121.7735,
          durationMinutes: 75,
          transportFromPrevious: {
            mode: 'walk',
            durationText: '步行約 5 分鐘',
            details: '沿中山路二段美食街漫步',
          },
          recommendedItems: ['綜合八寶冬粉', '正常鮮肉小籠湯包', '現燙溫泉空心菜'],
          tips: '小籠湯包剛出籠非常燙口，請先咬開小口啜飲鮮甜肉汁。',
          estimatedCostNtd: 180,
        },
        {
          id: 'stop-4',
          timeSlot: '13:50 - 15:45',
          placeName: '林美石磐步道 (或 五峰旗瀑布)',
          category: 'nature',
          highlight: '宜蘭小太魯閣美譽，綠意盎然森林、清澈溪流與瀑布景觀',
          description:
            '位於礁溪林美村，步道平緩好走全長僅約1.7公里。沿途綠蔭蔽天、負離子充沛，有壯觀的石磐瀑布與木造階梯棧道，是慢活森呼吸與拍照打卡的絕佳自然秘境。',
          address: '宜蘭縣礁溪鄉林尾路 (淡江大學蘭陽校區下方)',
          lat: 24.8398,
          lng: 121.7342,
          durationMinutes: 115,
          transportFromPrevious: {
            mode: 'bus',
            durationText: '台灣好行公車 15 分鐘',
            details: '於礁溪轉運站或火車站搭乘台灣好行礁溪線 (綠11) 直達林美石磐步道站',
          },
          recommendedItems: ['石磐瀑布觀景台', '木造峽谷棧道', '綠意溪谷攝影'],
          tips: '步道多有水氣稍滑，請穿著防滑好走之健行鞋，並攜帶水壺與防蚊液。',
          estimatedCostNtd: 40,
        },
        {
          id: 'stop-5',
          timeSlot: '16:15 - 17:30',
          placeName: '礁溪站前伴手禮街 ＆ 奕順軒',
          category: 'shopping',
          highlight: '採購宜蘭必買伴手禮奶凍捲、三星蔥蛋捲與溫泉拉麵',
          description:
            '回程前回到礁溪火車站周邊商圈，走進「奕順軒」選購超人氣草莓/芋頭純芋奶凍捲、切達乳酪狀元餅與香脆三星蔥蛋捲，並可外帶一份熱騰騰的台鐵風味便當在火車上享用。',
          address: '宜蘭縣礁溪鄉礁溪路五段96號',
          lat: 24.8272,
          lng: 121.7725,
          durationMinutes: 75,
          transportFromPrevious: {
            mode: 'bus',
            durationText: '搭乘公車 15 分鐘返回站前',
            details: '搭乘綠11公車返回礁溪火車站商圈',
          },
          recommendedItems: ['純芋奶凍捲', '切達乳酪餅', '三星蔥牛軋餅', '宜蘭牛舌餅'],
          tips: '奶凍捲常溫可存放約3小時，建議購買保冷袋或返家後盡快冷藏。',
          estimatedCostNtd: 250,
        },
      ],
      transitGuide: {
        stationExitTips:
          '礁溪站為地面車站，主要出口為前站溫泉路方向。出站即為計程車排班區、YouBike 2.0 租借站與溫泉商圈。站內候車大廳設有自動行李寄物櫃與台鐵便當販售處。',
        youbikeInfo:
          '火車站前廣場設有 YouBike 2.0 租借站點，騎乘至湯圍溝公園約 3 分鐘，至礁溪溫泉公園約 4 分鐘，道路平坦好騎。',
        localBusSummary:
          '站前可搭乘「台灣好行 礁溪線 (綠11)」巡迴公車，串聯火車站、湯圍溝、五峰旗風景區與林美石磐步道，刷電子票證乘車享優惠。',
        taxiTips:
          '站前排班計程車至湯圍溝公園約跳表 NT$ 100~120 元，至五峰旗/林美石磐步道約 NT$ 250~300 元。',
        precautions: [
          '泡湯或足湯前請注意水溫，建議單次浸泡不超過 15 分鐘並多補充水分。',
          '週末假日北返台北之自強號車票較滿，若未購得座票可搭乘區間快車。',
          '宜蘭山區午後偶有短暫陣雨，建議隨身攜帶輕便摺疊傘。',
        ],
      },
      localSpecialties: {
        mustEat: ['柯氏蔥油餅', '八寶冬粉', '正常鮮肉小籠湯包', '溫泉番茄', '溫泉拉麵', '花生捲冰淇淋'],
        souvenirs: ['奕順軒奶凍捲', '宜蘭薄脆牛舌餅', '三星蔥蛋捲', '金棗蜜餞', '鴨賞'],
        bentoRecommendation:
          '推薦於礁溪車站或宜蘭車站購買「台鐵宜蘭風味特製便當」或經典「八角排骨便當」，搭配在地三星蔥與滷蛋，香氣撲鼻。',
      },
      weatherAdvice: '宜蘭氣候溫潤多雨，建議穿著舒適透氣服裝與防滑健走鞋，隨身備妥小雨具或防曬外套。',
      preferences,
    };

    setItinerary(initialItinerary);
  }, []);

  // Handle Swap
  const handleSwapStations = () => {
    const temp = originStation;
    setOriginStation(destinationStation);
    setDestinationStation(temp);
  };

  // Handle GPS Geolocation to find nearest station
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('您的瀏覽器不支援 GPS 定位功能。');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        setUserLocation({ lat: userLat, lng: userLng });

        // Find nearest station
        let nearest = TAIWAN_TRA_STATIONS[0];
        let minDistance = Infinity;

        TAIWAN_TRA_STATIONS.forEach((st) => {
          const dLat = (st.lat - userLat) * (Math.PI / 180);
          const dLng = (st.lng - userLng) * (Math.PI / 180);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(userLat * (Math.PI / 180)) *
              Math.cos(st.lat * (Math.PI / 180)) *
              Math.sin(dLng / 2) *
              Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const d = 6371 * c; // Earth radius in KM

          if (d < minDistance) {
            minDistance = d;
            nearest = st;
          }
        });

        setUserNearestStation(nearest);
        setOriginStation(nearest);
        setIsLocating(false);
      },
      (error) => {
        console.warn('Geolocation failed:', error);
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  };

  // Generate Itinerary via Backend AI API
  const handleGenerateItinerary = async () => {
    // If user hasn't configured and verified Gemini API key and there's no server key, guide them to API Key modal
    if (!apiKeys.isGeminiValid && !apiKeys.geminiApiKey) {
      setIsApiKeyModalOpen(true);
      setErrorMsg('請先輸入並驗證 Gemini AI API Key，即可啟動 AI 智能行程生成！');
      return;
    }

    setIsLoadingItinerary(true);
    setErrorMsg(null);
    setLoadingStep('正在查詢台鐵路線與列車時刻...');

    try {
      const stepTimer1 = setTimeout(() => {
        setLoadingStep(`正在分析 ${destinationStation.name}站 周邊熱門美食榜與景點...`);
      }, 1500);

      const stepTimer2 = setTimeout(() => {
        setLoadingStep('正在以 Google Maps 路線演算法串聯順路行程與交通指南...');
      }, 3500);

      const response = await fetch('/api/generate-itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKeys.geminiApiKey ? { 'x-gemini-api-key': apiKeys.geminiApiKey } : {}),
        },
        body: JSON.stringify({
          origin: originStation,
          destination: destinationStation,
          originStation,
          destinationStation,
          travelDate,
          preferences,
          geminiApiKey: apiKeys.geminiApiKey,
        }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (!response.ok) {
        throw new Error(`伺服器回應異常: ${response.status}`);
      }

      const data = await response.json();
      if (!data.itinerary) {
        throw new Error('未能取得行程資料');
      }

      setItinerary(data.itinerary);
      setActiveTab('planner');

      setTimeout(() => {
        itineraryResultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('行程生成過程遭遇微小延遲，已為您載入推薦範本。您可再次點擊「一鍵生成」重試！');
    } finally {
      setIsLoadingItinerary(false);
      setLoadingStep('');
    }
  };

  // Save Trip to LocalStorage
  const handleSaveTrip = (tripToSave: DayItinerary) => {
    if (savedTrips.some((t) => t.id === tripToSave.id)) return;
    setSavedTrips((prev) => [tripToSave, ...prev]);
  };

  // Delete Trip from LocalStorage
  const handleDeleteTrip = (id: string) => {
    setSavedTrips((prev) => prev.filter((t) => t.id !== id));
  };

  // State for AI Itinerary Re-optimization loading
  const [isOptimizingItinerary, setIsOptimizingItinerary] = useState(false);

  // Manual Trigger: Re-optimize current itinerary stops by optimal path and business hours
  const handleOptimizeCurrentItinerary = async () => {
    if (!itinerary || !itinerary.stops || itinerary.stops.length <= 1) return;

    setIsOptimizingItinerary(true);
    const targetStation = itinerary.destinationStation;

    // Filter only activity stops (excluding station arrival and return ends)
    const rawActivityStops = itinerary.stops.filter((s) => {
      const isArr = s.id.startsWith('stop-arrival') || s.placeName.includes('出站') || s.placeName.includes('抵達');
      const isRet = s.id.startsWith('stop-return') || s.placeName.includes('返程') || s.placeName.includes('搭乘自強');
      return !isArr && !isRet && s.category !== 'transport';
    });

    try {
      // 1. Try AI-powered re-optimization if Gemini API key exists
      if (apiKeys.geminiApiKey) {
        const response = await fetch('/api/optimize-itinerary', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-gemini-api-key': apiKeys.geminiApiKey,
          },
          body: JSON.stringify({
            destinationStation: targetStation,
            stops: rawActivityStops,
            preferences,
            travelDate,
            geminiApiKey: apiKeys.geminiApiKey,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.stops && data.stops.length > 0) {
            setItinerary((prev) => (prev ? { ...prev, stops: data.stops } : prev));
            setAddedToastMessage(`✨ AI 智慧最佳化完成！已依各景點店家真實營業時間與最短步行/YouBike動線重新編排。`);
            setTimeout(() => setAddedToastMessage(null), 4500);
            setIsOptimizingItinerary(false);
            return;
          }
        }
      }

      // 2. High-precision Algorithmic Nearest-Neighbor & Business-Hour Optimization
      const optimizedStops = optimizeItineraryStops(targetStation, rawActivityStops, '09:30');
      setItinerary((prev) => (prev ? { ...prev, stops: optimizedStops } : prev));
      setAddedToastMessage(`🧭 最佳動線編排完成！已按【晨間戶外 ➔ 午餐正餐 ➔ 午後休閒 ➔ 傍晚伴手禮 ➔ 晚間夜市】與地理最短路徑重排。`);
      setTimeout(() => setAddedToastMessage(null), 4500);
    } catch (e) {
      console.error('Failed to optimize itinerary:', e);
      const optimizedStops = optimizeItineraryStops(targetStation, rawActivityStops, '09:30');
      setItinerary((prev) => (prev ? { ...prev, stops: optimizedStops } : prev));
      setAddedToastMessage(`🧭 已依地理最短路徑與營業時間區間完成行程重新排序。`);
      setTimeout(() => setAddedToastMessage(null), 4000);
    } finally {
      setIsOptimizingItinerary(false);
    }
  };

  // Remove a stop from the current itinerary and re-optimize order
  const handleRemoveStop = (stopId: string) => {
    if (!itinerary) return;
    const targetStop = itinerary.stops.find((s) => s.id === stopId);
    if (!targetStop) return;

    if (itinerary.stops.length <= 2) {
      setAddedToastMessage('⚠️ 一日行程中至少需保留一個景點或美食項目。');
      setTimeout(() => setAddedToastMessage(null), 3000);
      return;
    }

    // Filter remaining activity stops
    const remainingActivityStops = itinerary.stops.filter((s) => {
      if (s.id === stopId) return false;
      const isArr = s.id.startsWith('stop-arrival') || s.placeName.includes('出站') || s.placeName.includes('抵達');
      const isRet = s.id.startsWith('stop-return') || s.placeName.includes('返程') || s.placeName.includes('搭乘自強');
      return !isArr && !isRet && s.category !== 'transport';
    });

    // Re-run optimization on remaining stops
    const finalStops = optimizeItineraryStops(
      itinerary.destinationStation,
      remainingActivityStops,
      '09:30'
    );

    const costDiff = targetStop.estimatedCostNtd || 100;
    const updatedBudget = Math.max(200, itinerary.estimatedTotalBudget - costDiff);

    setItinerary({
      ...itinerary,
      stops: finalStops,
      estimatedTotalBudget: updatedBudget,
    });

    setAddedToastMessage(`🗑️ 已成功移除【${targetStop.placeName}】${targetStop.category === 'food' ? '美食' : '景點'}，並自動重新銜接最佳動線與時間表。`);
    setTimeout(() => {
      setAddedToastMessage(null);
    }, 4000);
  };

  // Remove a specific recommended tag inside a stop
  const handleRemoveRecommendedItem = (stopIndex: number, itemIndex: number) => {
    if (!itinerary || !itinerary.stops[stopIndex]) return;
    const stop = itinerary.stops[stopIndex];
    const currentItems = stop.recommendedItems || [];
    const removedItem = currentItems[itemIndex];
    const updatedItems = currentItems.filter((_, idx) => idx !== itemIndex);

    const updatedStops = itinerary.stops.map((s, idx) => {
      if (idx === stopIndex) {
        return {
          ...s,
          recommendedItems: updatedItems,
        };
      }
      return s;
    });

    setItinerary({
      ...itinerary,
      stops: updatedStops,
    });

    if (removedItem) {
      setAddedToastMessage(`🗑️ 已自【${stop.placeName}】移除推薦標籤「${removedItem}」。`);
      setTimeout(() => setAddedToastMessage(null), 3000);
    }
  };

  // Remove a food item from mustEat list
  const handleRemoveMustEatFood = (foodName: string) => {
    if (!itinerary) return;
    const updatedMustEat = itinerary.localSpecialties.mustEat.filter((f) => f !== foodName);
    setItinerary({
      ...itinerary,
      localSpecialties: {
        ...itinerary.localSpecialties,
        mustEat: updatedMustEat,
      },
    });
    setAddedToastMessage(`🗑️ 已將美食【${foodName}】自在地老饕推薦清單中移除。`);
    setTimeout(() => setAddedToastMessage(null), 3000);
  };

  // Remove a souvenir from souvenirs list
  const handleRemoveSouvenir = (souvenirName: string) => {
    if (!itinerary) return;
    const updatedSouvenirs = itinerary.localSpecialties.souvenirs.filter((s) => s !== souvenirName);
    setItinerary({
      ...itinerary,
      localSpecialties: {
        ...itinerary.localSpecialties,
        souvenirs: updatedSouvenirs,
      },
    });
    setAddedToastMessage(`🗑️ 已將伴手禮【${souvenirName}】自推薦清單中移除。`);
    setTimeout(() => setAddedToastMessage(null), 3000);
  };

  // Handle adding selected items from Station Explorer into the Itinerary
  const handleAddExplorerItemsToItinerary = (itemsToAdd: NearbyItem[], targetStation: TRAStation) => {
    if (!itemsToAdd || itemsToAdd.length === 0) return;

    // Ensure destination station is set to target station
    setDestinationStation(targetStation);

    // Update preferences custom notes
    const itemNames = itemsToAdd.map((i) => i.name);
    const updatedNotes = preferences.customNotes
      ? `${preferences.customNotes}，指定包含：${itemNames.join('、')}`
      : `指定包含：${itemNames.join('、')}`;

    setPreferences((prev) => ({
      ...prev,
      customNotes: updatedNotes,
    }));

    if (itinerary && itinerary.destinationStation.id === targetStation.id) {
      // 1. Gather all existing activity stops (non-transport)
      const existingActivityStops = itinerary.stops.filter((s) => {
        const isArr = s.id.startsWith('stop-arrival') || s.placeName.includes('出站') || s.placeName.includes('抵達');
        const isRet = s.id.startsWith('stop-return') || s.placeName.includes('返程') || s.placeName.includes('搭乘自強');
        return !isArr && !isRet && s.category !== 'transport';
      });

      const existingNames = new Set(existingActivityStops.map((s) => s.placeName.trim()));

      // 2. Convert newly selected items into ItineraryStop objects
      const newConvertedStops: ItineraryStop[] = [];
      itemsToAdd.forEach((item, idx) => {
        if (!existingNames.has(item.name.trim())) {
          const isFood = item.category === 'food';
          const isSouvenir = item.category === 'souvenir';
          const angle = (idx + existingActivityStops.length) * 1.3;
          const radius = 0.003 + (idx % 3) * 0.002;
          const lat = targetStation.lat + Math.sin(angle) * radius;
          const lng = targetStation.lng + Math.cos(angle) * radius;

          newConvertedStops.push({
            id: `stop-user-added-${Date.now()}-${idx}`,
            timeSlot: '12:00 - 13:00',
            placeName: item.name,
            placeNameEn: item.name,
            category: isFood ? 'food' : isSouvenir ? 'shopping' : 'spot',
            highlight: `${item.categoryName}・老饕熱門推薦 (${item.rating.toFixed(1)}★)`,
            description: item.description,
            address: `${targetStation.county}${targetStation.name}站周邊 (${item.distance})`,
            lat,
            lng,
            durationMinutes: isFood ? 50 : isSouvenir ? 35 : 60,
            transportFromPrevious: {
              mode: 'walk',
              durationText: item.distance,
              details: `由上一站點前往 (${item.distance})`,
            },
            recommendedItems: [item.name],
            tips: `${item.name}為在地推薦名店，營業時間與人潮眾多時建議提早入座。`,
            estimatedCostNtd: isFood ? 150 : isSouvenir ? 250 : 50,
          });
        }
      });

      // 3. Combined raw stops to optimize
      const combinedRawStops = [...existingActivityStops, ...newConvertedStops];

      // 4. Run Smart Optimization Algorithm (Nearest-Neighbor + Business Hours Windows)
      const optimizedStops = optimizeItineraryStops(targetStation, combinedRawStops, '09:30');

      const updatedMustEat = [
        ...itinerary.localSpecialties.mustEat,
        ...itemsToAdd.filter((i) => i.category === 'food' && !itinerary.localSpecialties.mustEat.includes(i.name)).map((i) => i.name),
      ];

      const updatedSouvenirs = [
        ...itinerary.localSpecialties.souvenirs,
        ...itemsToAdd.filter((i) => i.category === 'souvenir' && !itinerary.localSpecialties.souvenirs.includes(i.name)).map((i) => i.name),
      ];

      setItinerary({
        ...itinerary,
        stops: optimizedStops,
        localSpecialties: {
          ...itinerary.localSpecialties,
          mustEat: updatedMustEat,
          souvenirs: updatedSouvenirs,
        },
        estimatedTotalBudget: itinerary.estimatedTotalBudget + newConvertedStops.length * 150,
      });
    } else {
      // Build a fresh customized itinerary incorporating the selected items via optimized builder
      const newItinerary = createItineraryWithSelectedItems(
        originStation,
        targetStation,
        travelDate,
        itemsToAdd,
        preferences
      );
      setItinerary(newItinerary);
    }

    setAddedToastMessage(`🧭 已加入【${itemNames.join('、')}】，並已依【營業時間】與【最短路徑不走回頭路】智慧重排全日行程順序！`);
    setActiveTab('planner');

    setTimeout(() => {
      setAddedToastMessage(null);
    }, 5500);

    setTimeout(() => {
      itineraryResultRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  const isCurrentTripSaved = Boolean(
    itinerary && savedTrips.some((t) => t.id === itinerary.id)
  );

  return (
    <div className="min-h-screen bg-[#FAF8E7] text-[#122B28] flex flex-col selection:bg-[#81D8CF] selection:text-[#0F3A35]">
      {/* Top Navigation */}
      <Navbar
        onOpenSaved={() => setIsSavedModalOpen(true)}
        savedCount={savedTrips.length}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        onLocateMe={handleLocateMe}
        isLocating={isLocating}
        userNearestStation={userNearestStation}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        apiKeys={apiKeys}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Added Items Success Toast Banner */}
        {addedToastMessage && (
          <div className="p-4 bg-gradient-to-r from-[#1A8F82] to-[#13695F] text-white rounded-2xl shadow-lg border border-[#81D8CF]/40 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-white/20 text-[#81D8CF] border border-white/30">
                <CheckCircle2 className="w-5 h-5 text-[#81D8CF]" />
              </div>
              <div>
                <p className="font-bold text-sm text-white">{addedToastMessage}</p>
                <p className="text-xs text-[#FAF8E7]/80 mt-0.5">
                  已自動更新行程時間軸、景點停留與地圖路線。
                </p>
              </div>
            </div>
            <button
              onClick={() => setAddedToastMessage(null)}
              className="text-[#FAF8E7] hover:text-white text-xs font-bold px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
        {/* API Key Status Notice Bar (if unconfigured) */}
        {!apiKeys.isGeminiValid && (
          <div className="p-3.5 bg-[#F8F5D6] rounded-2xl border-2 border-[#81D8CF] flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-[#81D8CF]/30 text-[#146E64] border border-[#81D8CF]">
                <Key className="w-4 h-4 text-[#166E64] animate-pulse" />
              </div>
              <div>
                <p className="font-bold text-[#122B28] flex items-center gap-2">
                  <span>Gemini AI API 金鑰授權</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-[#166E64] font-bold border border-[#81D8CF]">
                    {apiKeys.isGeminiValid ? 'Gemini AI 已啟用' : 'Gemini AI 待設定'}
                  </span>
                </p>
                <p className="text-[#4E6864] mt-0.5">
                  輸入並驗證 Gemini AI API 金鑰，即可享受客製化智能一日遊行程與隨身 AI 導遊（互動地圖無需金鑰即可使用）。
                </p>
              </div>
            </div>

            <button
              id="btn-banner-open-api-keys"
              onClick={() => setIsApiKeyModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#1A8F82] hover:bg-[#13695F] text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              <span>設定 Gemini API 金鑰</span>
            </button>
          </div>
        )}
        {/* Top Error Banner if any */}
        {errorMsg && (
          <div className="p-4 bg-[#FFF9E6] border border-amber-400 rounded-2xl flex items-center justify-between text-amber-900 text-xs sm:text-sm shadow-sm">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-amber-800 hover:text-black text-xs font-bold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab 1: Planner Mode (Core Experience) */}
        {activeTab === 'planner' && (
          <div className="space-y-6">
            {/* Station Selector & One-Click Generate */}
            <StationSelector
              origin={originStation}
              destination={destinationStation}
              onSelectOrigin={setOriginStation}
              onSelectDestination={setDestinationStation}
              onSwap={handleSwapStations}
              travelDate={travelDate}
              onChangeDate={setTravelDate}
              preferences={preferences}
              onOpenPreferences={() => setIsPreferencesOpen(true)}
              onGenerateItinerary={handleGenerateItinerary}
              isLoading={isLoadingItinerary}
            />

            {/* Loading Indicator with Animated Steps */}
            {isLoadingItinerary && (
              <div className="p-8 rounded-3xl bg-white border-2 border-[#81D8CF] shadow-2xl text-center space-y-4 animate-in fade-in zoom-in duration-200">
                <div className="w-16 h-16 rounded-full bg-[#81D8CF]/20 border-2 border-[#81D8CF] flex items-center justify-center mx-auto text-[#1A8F82] animate-spin">
                  <Train className="w-8 h-8 text-[#1A8F82]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#122B28] flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                    <span>AI 正在規劃【{originStation.name} ➔ {destinationStation.name}】一日遊行程</span>
                  </h3>
                  <p className="text-sm text-[#1A8F82] mt-2 font-bold">
                    {loadingStep || '正在計算最佳台鐵班次與順路景點...'}
                  </p>
                </div>
              </div>
            )}

            {/* Generated Itinerary & Map View */}
            {itinerary && !isLoadingItinerary && (
              <div ref={itineraryResultRef} className="space-y-6 animate-in fade-in duration-300">
                {/* Map Section */}
                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E5DEAA] shadow-lg space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center space-x-2">
                      <Compass className="w-5 h-5 text-[#1A8F82]" />
                      <h3 className="font-bold text-sm sm:text-base text-[#122B28]">
                        {itinerary.destinationStation.name}站 行程路線與景點地圖
                      </h3>
                    </div>
                    <span className="text-xs text-[#546E6A] hidden sm:inline">
                      點擊標記可查看詳細資訊並啟動 Google Maps 導航
                    </span>
                  </div>

                  <InteractiveMap
                    originStation={itinerary.originStation}
                    destinationStation={itinerary.destinationStation}
                    stops={itinerary.stops}
                    userLocation={userLocation}
                    selectedStop={selectedStopOnMap}
                    className="w-full"
                    googleMapsApiKey={apiKeys.googleMapsApiKey}
                    onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
                  />
                </div>

                {/* Itinerary Timeline, Timetable & Transit Cards */}
                <ItineraryView
                  itinerary={itinerary}
                  onSaveTrip={handleSaveTrip}
                  isSaved={isCurrentTripSaved}
                  onSelectStopOnMap={(stop) => {
                    setSelectedStopOnMap(stop);
                    window.scrollTo({ top: 320, behavior: 'smooth' });
                  }}
                  onRemoveStop={handleRemoveStop}
                  onRemoveRecommendedItem={handleRemoveRecommendedItem}
                  onRemoveMustEatFood={handleRemoveMustEatFood}
                  onRemoveSouvenir={handleRemoveSouvenir}
                  onReorderOptimalRoute={handleOptimizeCurrentItinerary}
                  isOptimizing={isOptimizingItinerary}
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Full Interactive Map */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E5DEAA] shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-[#81D8CF]/20 text-[#1A8F82] border border-[#81D8CF]/50">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-base text-[#122B28]">全台鐵道路網與觀光地圖</h2>
                  <p className="text-xs text-[#546E6A]">
                    目前選定主要核心：{destinationStation.name}火車站 ({destinationStation.county})
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab('planner')}
                  className="px-3.5 py-1.5 rounded-xl bg-[#1A8F82] hover:bg-[#13695F] text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  前往行程規劃
                </button>
              </div>
            </div>

            <InteractiveMap
              originStation={originStation}
              destinationStation={destinationStation}
              stops={itinerary ? itinerary.stops : []}
              userLocation={userLocation}
              selectedStop={selectedStopOnMap}
              className="h-[600px] w-full"
              googleMapsApiKey={apiKeys.googleMapsApiKey}
              onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
            />
          </div>
        )}

        {/* Tab 3: Station Surrounding Explorer */}
        {activeTab === 'explorer' && (
          <NearbyExplorer
            station={destinationStation}
            onPlanTripToStation={(st) => {
              setDestinationStation(st);
              setActiveTab('planner');
            }}
            onAddItemsToItinerary={handleAddExplorerItemsToItinerary}
            currentItineraryItemNames={
              itinerary && itinerary.destinationStation.id === destinationStation.id
                ? [
                    ...itinerary.stops.map((s) => s.placeName),
                    ...itinerary.localSpecialties.mustEat,
                    ...itinerary.localSpecialties.souvenirs,
                  ]
                : []
            }
          />
        )}

        {/* Tab 4: TRA Quick Guide & Official Rules */}
        {activeTab === 'tra-info' && <TRAQuickInfo />}
      </main>

      {/* Footer */}
      <footer className="bg-[#F8F5D6] border-t border-[#E5DEAA] py-6 text-center text-xs text-[#546E6A] mt-12">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="text-[#647C78]">© {new Date().getFullYear()} 台灣鐵道漫遊 Taiwan Railway Travel Planner • 整合 AI 智能行程與 Google Maps 導航</p>
        </div>
      </footer>

      {/* Preferences Modal */}
      <TravelPreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
        preferences={preferences}
        onSave={(newPref) => {
          setPreferences(newPref);
          setIsPreferencesOpen(false);
        }}
      />

      {/* Saved Trips Drawer / Modal */}
      <SavedTripsModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        savedTrips={savedTrips}
        onSelectTrip={(trip) => {
          setItinerary(trip);
          setOriginStation(trip.originStation);
          setDestinationStation(trip.destinationStation);
          setActiveTab('planner');
        }}
        onDeleteTrip={handleDeleteTrip}
      />

      {/* AI Assistant Chat Drawer */}
      <AIAssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        station={destinationStation}
        itinerary={itinerary}
        geminiApiKey={apiKeys.geminiApiKey}
      />

      {/* API Key Input & Validation Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKeys={apiKeys}
        onSaveKeys={(newKeys) => {
          // Temporary in-memory cache only
          setApiKeys(newKeys);
        }}
      />
    </div>
  );
}
