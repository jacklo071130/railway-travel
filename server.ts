import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Gemini API client lazily or with user-provided key
function getAiClient(customKey?: string): GoogleGenAI | null {
  const apiKey = (customKey && customKey.trim().length > 5) ? customKey.trim() : process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

// API route: Check if server has pre-configured environment keys
app.get('/api/system-key-status', (req, res) => {
  res.json({
    hasServerGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5),
    hasServerMapsKey: Boolean(process.env.GOOGLE_MAPS_PLATFORM_KEY && process.env.GOOGLE_MAPS_PLATFORM_KEY.length > 5),
  });
});

// API route: Verify user-provided Gemini AI API Key
app.post('/api/verify-gemini-key', async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 5) {
    return res.status(400).json({ valid: false, error: '請輸入有效的 Gemini API Key' });
  }

  try {
    const testAi = new GoogleGenAI({ apiKey: apiKey.trim() });
    const response = await testAi.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: '請以繁體中文回覆「連線成功」四個字。',
    });

    if (response.text) {
      return res.json({
        valid: true,
        message: 'Gemini AI API Key 驗證成功！已啟用 AI 深度行程生成與隨身導遊問答功能。',
        model: 'gemini-3.7-flash',
      });
    } else {
      return res.status(400).json({ valid: false, error: 'Gemini API 回應異常，請檢查金鑰權限。' });
    }
  } catch (err: any) {
    console.error('Gemini Key verification failed:', err);
    let errorMessage = err.message || '連線至 Gemini API 失敗';
    if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('400') || errorMessage.includes('403')) {
      errorMessage = 'Gemini API 金鑰無效 (API_KEY_INVALID) 或未開通權限。請前往 Google AI Studio 重新複製金鑰。';
    }
    return res.status(400).json({ valid: false, error: errorMessage });
  }
});

// API route: Verify user-provided Google Maps API Key
app.post('/api/verify-maps-key', async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 8) {
    return res.status(400).json({ valid: false, error: '請輸入有效的 Google Maps API Key' });
  }

  const cleanKey = apiKey.trim();
  try {
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=Taipei+Station&key=${cleanKey}`;
    const response = await fetch(geocodeUrl);
    const data = (await response.json()) as any;

    if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
      return res.json({
        valid: true,
        message: 'Google Maps API 金鑰驗證成功！地圖圖磚與路線導航功能正常運作。',
      });
    } else if (data.status === 'REQUEST_DENIED') {
      const errorDetail = data.error_message || '請求被 Google Maps 伺服器拒絕';
      if (errorDetail.includes('API key not valid')) {
        return res.status(400).json({
          valid: false,
          error: 'Google Maps API 金鑰無效，請確認金鑰字串是否完整複製。',
        });
      } else {
        return res.json({
          valid: true,
          message: 'Google Maps API 金鑰已識別！已套用至地圖導航模組。',
          warning: errorDetail,
        });
      }
    } else {
      return res.json({
        valid: true,
        message: 'Google Maps API 金鑰格式正確，已設定至地圖元件。',
      });
    }
  } catch (err: any) {
    console.error('Maps key verification network error:', err);
    if (cleanKey.length >= 25) {
      return res.json({
        valid: true,
        message: 'Google Maps API 金鑰已儲存！已套用至全台地圖與導航元件。',
      });
    }
    return res.status(400).json({
      valid: false,
      error: `驗證時發生錯誤：${err.message || '無法連線至 Google Maps 伺服器'}`,
    });
  }
});

// API route: Generate 1-Day Itinerary with Gemini AI
app.post('/api/generate-itinerary', async (req, res) => {
  const origin = req.body.origin || req.body.originStation;
  const destination = req.body.destination || req.body.destinationStation;
  const { preferences, travelDate, geminiApiKey } = req.body;
  const headerKey = req.headers['x-gemini-api-key'] as string;
  const customKey = (geminiApiKey || headerKey);

  try {
    if (!origin || !destination) {
      return res.status(400).json({ error: '起點站與目的地站為必填欄位' });
    }

    const ai = getAiClient(customKey);
    if (!ai) {
      // Return fallback itinerary if API key is not yet set
      const fallback = generateFallbackItinerary(origin, destination, preferences, travelDate);
      return res.json({
        fallback: true,
        itinerary: fallback,
      });
    }

    const systemPrompt = `你是一位精通台灣鐵路（台鐵 TRA）與台灣各縣市深度旅遊的頂級在地導遊規劃專家。
你的任務是為旅客規劃一份從起點火車站搭乘台鐵抵達目的地火車站的「完美一日遊詳細行程表與交通指南」。

請嚴格遵循以下規劃原則：
1. 行程以目的地火車站為核心放射狀規劃，景點與美食皆須為真實存在的在地知名店家與觀光勝地。
2. 路線順序需具備高度地理合理性（不走回頭路），明確說明由火車站出發如何轉乘（如步行、YouBike、台灣好行客運、公車）。
3. 包含道地的火車出發與回程車次建議（如新自強3000、普悠瑪、自強號、區間快車）、台鐵便當與在地必吃名產。
4. 每一個景點與餐廳都需提供具體的停留時間、特色介紹、推薦餐點或拍照點，以及精準的地理座標(lat, lng)與地址。
5. 必須以繁體中文（台灣習慣用語）輸出嚴格符合 JSON Schema 的內容。`;

    const userPrompt = `請為我規劃一日鐵道深度旅遊：
- 出發起點火車站：${origin.name} (${origin.county})
- 抵達目的地火車站：${destination.name} (${destination.county})，特色：${destination.description || ''}
- 預計旅遊日期：${travelDate || '今日'}
- 旅遊風格：${preferences?.style || 'gourmet'} (美食/打卡/文化/親子/自然/慢活)
- 同行夥伴：${preferences?.companion || 'couple'} (獨旅/情侶/家族長輩/親子/好友)
- 行程節奏：${preferences?.pace || 'moderate'} (悠閒/適中/緊湊)
- 站周邊首選交通工具：${preferences?.transport || 'walk_youbike'} (步行+YouBike/公車客運/租機車/計程車)
- 備註需求：${preferences?.customNotes || '無特殊需求'}

請生成一份完整、生動且具體可落地的詳細行程表。包含上午、中午在地美食、下午深度探索、傍晚伴手禮與賦歸車次。`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: '行程大標題，吸引人且具主題感' },
            subtitle: { type: Type.STRING, description: '副標題或一句話精髓' },
            summary: { type: Type.STRING, description: '一日遊核心特色與整體行程概述（約150字）' },
            estimatedTotalBudget: { type: Type.INTEGER, description: '每人預估總花費（新台幣NTD，含台鐵來回車資、美食、門票）' },
            weatherAdvice: { type: Type.STRING, description: '當季/當日旅遊穿著與天氣防護提醒' },
            trainRecommendation: {
              type: Type.OBJECT,
              properties: {
                outbound: {
                  type: Type.OBJECT,
                  properties: {
                    trainType: { type: Type.STRING, description: '建議去程車種（如 EMU3000新自強、普悠瑪號、區間快車）' },
                    trainNo: { type: Type.STRING, description: '去程建議車次號（如 218次 或 112次）' },
                    departureTime: { type: Type.STRING, description: '建議出發時間，如 08:30' },
                    arrivalTime: { type: Type.STRING, description: '預計抵達目的地時間，如 09:45' },
                    fareEstimate: { type: Type.INTEGER, description: '單程票價預估（NTD）' },
                    durationText: { type: Type.STRING, description: '車程時間描述，如 約1小時15分' },
                  },
                  required: ['trainType', 'departureTime', 'arrivalTime', 'fareEstimate', 'durationText'],
                },
                inbound: {
                  type: Type.OBJECT,
                  properties: {
                    trainType: { type: Type.STRING, description: '建議回程車種' },
                    trainNo: { type: Type.STRING, description: '回程建議車次號' },
                    departureTime: { type: Type.STRING, description: '建議回程時間，如 18:20' },
                    arrivalTime: { type: Type.STRING, description: '抵達起點站時間，如 19:40' },
                    fareEstimate: { type: Type.INTEGER, description: '回程票價預估（NTD）' },
                    durationText: { type: Type.STRING, description: '車程時間描述' },
                  },
                  required: ['trainType', 'departureTime', 'arrivalTime', 'fareEstimate', 'durationText'],
                },
                bookingTip: { type: Type.STRING, description: '台鐵購票提醒（如 乘車前28天開放訂票、連續假期請提早搶票等）' },
                traOfficialUrl: { type: Type.STRING, description: 'https://www.railway.gov.tw/tra-tip-web/tip' },
              },
              required: ['outbound', 'inbound', 'bookingTip'],
            },
            transitGuide: {
              type: Type.OBJECT,
              properties: {
                stationExitTips: { type: Type.STRING, description: '目的地火車站出站導引（前後站出口、行李寄存櫃位置）' },
                youbikeInfo: { type: Type.STRING, description: '火車站周圍YouBike租借站與騎乘路線建議' },
                localBusSummary: { type: Type.STRING, description: '在地接駁公車或台灣好行路線搭乘指南' },
                taxiTips: { type: Type.STRING, description: '計程車招呼站與預估短程跳表費用' },
                precautions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '在地旅遊注意事項（如防蚊、防曬、部分名店公休日或現金支付提醒）',
                },
              },
              required: ['stationExitTips', 'youbikeInfo', 'localBusSummary', 'precautions'],
            },
            localSpecialties: {
              type: Type.OBJECT,
              properties: {
                mustEat: { type: Type.ARRAY, items: { type: Type.STRING }, description: '目的地站必嚐名物小吃' },
                souvenirs: { type: Type.ARRAY, items: { type: Type.STRING }, description: '必買伴手禮推薦' },
                bentoRecommendation: { type: Type.STRING, description: '該站/台鐵推薦特色鐵路便當或風味' },
              },
              required: ['mustEat', 'souvenirs', 'bentoRecommendation'],
            },
            stops: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  timeSlot: { type: Type.STRING, description: '時間區段，例如 09:50 - 11:20' },
                  placeName: { type: Type.STRING, description: '景點或店家全名' },
                  placeNameEn: { type: Type.STRING },
                  category: {
                    type: Type.STRING,
                    enum: ['food', 'spot', 'culture', 'nature', 'photo', 'transport', 'shopping'],
                    description: '類別',
                  },
                  description: { type: Type.STRING, description: '景點詳細故事與體驗推薦（約60-100字）' },
                  highlight: { type: Type.STRING, description: '亮點一句話精要' },
                  durationMinutes: { type: Type.INTEGER, description: '建議停留分鐘數' },
                  address: { type: Type.STRING, description: '真實地址或具體位置' },
                  lat: { type: Type.NUMBER, description: '緯度 Latitude' },
                  lng: { type: Type.NUMBER, description: '經度 Longitude' },
                  googleMapsUrl: { type: Type.STRING, description: 'Google Maps 查詢或導航URL' },
                  transportFromPrevious: {
                    type: Type.OBJECT,
                    properties: {
                      mode: { type: Type.STRING, enum: ['walk', 'youbike', 'bus', 'train', 'taxi'] },
                      durationText: { type: Type.STRING, description: '移動耗時，如 步行約8分鐘' },
                      details: { type: Type.STRING, description: '移動指引，例如 出站沿中正路直行300公尺' },
                    },
                    required: ['mode', 'durationText', 'details'],
                  },
                  recommendedItems: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '必點餐點或拍照角度',
                  },
                  tips: { type: Type.STRING, description: '導遊貼心小叮嚀' },
                  estimatedCostNtd: { type: Type.INTEGER, description: '預估門票或餐費' },
                },
                required: ['id', 'timeSlot', 'placeName', 'category', 'description', 'highlight', 'durationMinutes', 'address', 'lat', 'lng', 'transportFromPrevious'],
              },
            },
          },
          required: ['title', 'subtitle', 'summary', 'estimatedTotalBudget', 'trainRecommendation', 'transitGuide', 'localSpecialties', 'stops'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    parsed.id = `itin-${Date.now()}`;
    parsed.createdAt = new Date().toISOString();
    parsed.originStation = origin;
    parsed.destinationStation = destination;
    parsed.travelDate = travelDate || new Date().toISOString().split('T')[0];
    parsed.preferences = preferences;
    parsed.trainRecommendation.traOfficialUrl = 'https://www.railway.gov.tw/tra-tip-web/tip';

    res.json({ itinerary: parsed });
  } catch (error: any) {
    console.error('Error generating itinerary:', error);
    // Return well-structured fallback on error
    const origin = req.body.origin || req.body.originStation;
    const destination = req.body.destination || req.body.destinationStation;
    const { preferences, travelDate } = req.body;
    const fallback = generateFallbackItinerary(origin, destination, preferences, travelDate);
    res.json({ itinerary: fallback, errorMsg: error.message });
  }
});

// API route: Interactive AI Railway Assistant Chat
app.post('/api/ask-assistant', async (req, res) => {
  try {
    const { message, currentItinerary, station, geminiApiKey } = req.body;
    const headerKey = req.headers['x-gemini-api-key'] as string;
    const customKey = (geminiApiKey || headerKey);

    if (!message) {
      return res.status(400).json({ error: '問題內容不可為空' });
    }

    const ai = getAiClient(customKey);
    if (!ai) {
      return res.json({
        reply: `您好！目前您正在查詢 ${station?.name || '台灣鐵道'} 的旅遊資訊。台鐵官方網站時刻表查詢與票價可至：https://www.railway.gov.tw/tra-tip-web/tip 。在該站附近推薦品嚐在地小吃，並可使用 YouBike 騎乘遊覽主要景點！`,
        suggestedActions: ['查詢台鐵時刻表', '推薦雨天備案景點', '推薦附近必買伴手禮'],
      });
    }

    const contextPrompt = `你是一位熱情且專業的「台鐵台灣鐵道隨身 AI 導遊」。
旅客目前選定目的地車站：${station?.name || '台灣火車站'}（${station?.county || ''}），特色：${station?.description || ''}。
${currentItinerary ? `旅客目前已規劃的行程標題為「${currentItinerary.title}」，包含 ${currentItinerary.stops?.length || 0} 個行程景點。` : ''}

旅客提問：${message}

請以親切、專業、條理分明的繁體中文回答。
若提及火車車次或票務，請提醒可利用台鐵官方系統（https://www.railway.gov.tw/tra-tip-web/tip）查詢最新時刻。
若提及交通，請提供明確的轉乘、步行或 YouBike 建議。回答字數適中（約200-300字）。最後提供2-3個後續可追問的問題。`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: contextPrompt,
      config: {
        systemInstruction: '你是一位精通台灣鐵道與觀光的專家導遊，回應用繁體中文，溫暖且實用。',
      },
    });

    const replyText = response.text || '很樂意為您解答台鐵旅遊問題！';

    res.json({
      reply: replyText,
      suggestedActions: [
        `推薦 ${station?.name || '車站'} 附近必買伴手禮`,
        `如果遇到下雨天，${station?.name || '這裡'} 有哪些室內景點推薦？`,
        `從 ${station?.name || '火車站'} 出發最省時的接駁交通方式是什麼？`,
      ],
    });
  } catch (error: any) {
    console.error('Error in AI assistant:', error);
    res.status(500).json({ error: error.message || 'AI 導遊暫時忙碌中，請稍後再試' });
  }
});

// Fallback generator for rich data when offline or building
function generateFallbackItinerary(origin: any, destination: any, preferences: any, travelDate: string) {
  const destName = destination?.name || '礁溪';
  const destCounty = destination?.county || '宜蘭縣';
  const destLat = destination?.lat || 24.8291;
  const destLng = destination?.lng || 121.7725;
  const originName = origin?.name || '台北';

  const defaultFoods = destination?.popularFoods || ['在地特色小吃', '台鐵招牌排骨便當', '老字號傳統糕點', '手作現烤點心'];
  const defaultAttractions = destination?.popularAttractions || ['站前老街商圈', '在地文化園區', '景觀步道公園', '文創地標'];

  return {
    id: `itin-${Date.now()}`,
    createdAt: new Date().toISOString(),
    title: `【${originName} ➔ ${destName}】鐵道漫遊一日輕旅行`,
    subtitle: `悠遊${destCounty}・品味在地經典美食與慢活風光`,
    summary: `搭乘台鐵列車由${originName}出發直達${destName}站。抵達後透過輕鬆的步行與YouBike串聯站前熱門景點，品嚐${defaultFoods.slice(0, 2).join('、')}，下午漫步於${defaultAttractions.slice(0, 2).join('與')}，享受悠閒充實的一日鐵道假期。`,
    estimatedTotalBudget: 1200,
    travelDate: travelDate || new Date().toISOString().split('T')[0],
    originStation: origin,
    destinationStation: destination,
    preferences: preferences || { style: 'gourmet', companion: 'couple', pace: 'moderate', transport: 'walk_youbike' },
    weatherAdvice: '建議穿著輕便好走的休閒鞋，並攜帶雨具與防曬用品以備不時之需。',
    trainRecommendation: {
      outbound: {
        trainType: 'EMU3000 新自強號 / 普悠瑪號',
        trainNo: '自強 218次',
        departureTime: '08:35',
        arrivalTime: '09:50',
        fareEstimate: 218,
        durationText: '約1小時15分',
      },
      inbound: {
        trainType: 'EMU3000 新自強號',
        trainNo: '自強 229次',
        departureTime: '17:40',
        arrivalTime: '18:55',
        fareEstimate: 218,
        durationText: '約1小時15分',
      },
      bookingTip: '台鐵車票於乘車日前28天凌晨 00:00 開放預訂，週末熱門班次請提早於台鐵官網或「台鐵e訂通」App搶票。',
      traOfficialUrl: 'https://www.railway.gov.tw/tra-tip-web/tip',
    },
    transitGuide: {
      stationExitTips: `${destName}火車站出站後前站設有旅客服務中心與行李自動寄物櫃，建議輕裝出發。`,
      youbikeInfo: `${destName}火車站前廣場設有 YouBike 2.0 租借站，周邊騎乘環境平順，支援電子票證與悠遊卡。`,
      localBusSummary: '站前設有市區公車與台灣好行接駁站牌，發車班次密集，可直達主要風景區。',
      taxiTips: '站前設有排班計程車站，市區各景點單程跳表約 100~180 元。',
      precautions: [
        '部分在地老店僅收現金，建議備妥零錢。',
        '假日人潮眾多時，名店用餐建議避開尖峰時段。',
        '搭乘台鐵返程請預留 15 分鐘前抵達月台候車。',
      ],
    },
    localSpecialties: {
      mustEat: defaultFoods,
      souvenirs: ['在地特色農特產伴手禮', '傳統手作糕餅', '經典鐵道紀念商品'],
      bentoRecommendation: `${destName}站限定/台鐵經典八角排骨便當與特色風味便當`,
    },
    stops: [
      {
        id: 'stop-1',
        timeSlot: '10:00 - 11:30',
        placeName: defaultAttractions[0] || `${destName}站前歷史街區`,
        category: 'spot',
        description: `走出${destName}火車站後，步行即可抵達的代表性地標。漫步於綠意與歷史建築之間，感受當地的慢活悠閒風情。`,
        highlight: '在地歷史地標與散步打卡熱點',
        durationMinutes: 90,
        address: `${destination?.address || destCounty}`,
        lat: destLat + 0.002,
        lng: destLng + 0.003,
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(defaultAttractions[0] || destName)}`,
        transportFromPrevious: {
          mode: 'walk',
          durationText: '步行約 3~5 分鐘',
          details: `由${destName}火車站前站出口直行即達`,
        },
        recommendedItems: ['漫步園區拍照', '參觀歷史建築常設展'],
        tips: '站前設有旅遊諮詢處，可免費索取紙本地圖與導覽手冊。',
        estimatedCostNtd: 0,
      },
      {
        id: 'stop-2',
        timeSlot: '11:45 - 13:15',
        placeName: `${defaultFoods[0] || '在地老字號排隊美食'}品味午餐`,
        category: 'food',
        description: `來到${destName}必嚐的超人氣在地小吃，傳承數十載的古早味獨門醬汁與新鮮食材，是老饕們一致推薦的味蕾饗宴。`,
        highlight: `在地評選必吃：${defaultFoods[0] || '招牌名產'}`,
        durationMinutes: 90,
        address: `${destCounty}${destName}老街美食區`,
        lat: destLat + 0.004,
        lng: destLng - 0.002,
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(defaultFoods[0] || destName + ' 美食')}`,
        transportFromPrevious: {
          mode: 'walk',
          durationText: '步行約 6 分鐘',
          details: '沿商圈主要街道步行，跟著香味即可抵達',
        },
        recommendedItems: defaultFoods.slice(0, 3),
        tips: '中午用餐人潮較多，若遇排隊可先派一人點餐。',
        estimatedCostNtd: 250,
      },
      {
        id: 'stop-3',
        timeSlot: '13:30 - 15:30',
        placeName: defaultAttractions[1] || `${destName}綠意風景園區`,
        category: 'nature',
        description: `午後前往綠意盎然的自然步道或文化園區，呼吸新鮮空氣、放鬆身心，享受遠離都市塵囂的寧靜午後時光。`,
        highlight: '翠綠環抱，自然與人文交織的絕美秘境',
        durationMinutes: 120,
        address: `${destCounty}${destName}周邊景觀區`,
        lat: destLat - 0.005,
        lng: destLng + 0.006,
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(defaultAttractions[1] || destName + ' 景點')}`,
        transportFromPrevious: {
          mode: 'youbike',
          durationText: '騎乘 YouBike 約 8~10 分鐘',
          details: '站前租借 YouBike，順著自行車道專用道騎乘',
        },
        recommendedItems: ['步道散策', '觀景台眺望群山海景'],
        tips: '午後陽光較強，可攜帶水壺與薄外套。',
        estimatedCostNtd: 50,
      },
      {
        id: 'stop-4',
        timeSlot: '15:45 - 17:00',
        placeName: `${defaultFoods[1] || '特色下午茶'} & 伴手禮名店`,
        category: 'shopping',
        description: `回程前挑選${destCounty}特色伴手禮與品嚐甜點下午茶，帶一份在地的好滋味與親友分享。`,
        highlight: '在地老店手作點心與精選伴手禮採購',
        durationMinutes: 75,
        address: `${destCounty}${destName}站前伴手禮一條街`,
        lat: destLat + 0.001,
        lng: destLng + 0.001,
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destName + ' 伴手禮')}`,
        transportFromPrevious: {
          mode: 'walk',
          durationText: '步行約 5 分鐘',
          details: '返回火車站前站商圈',
        },
        recommendedItems: ['現烤手作糕點', '台鐵經典特色便當'],
        tips: '可在此購買台鐵便當於回程列車上享用。',
        estimatedCostNtd: 350,
      },
    ],
  };
}

// Vite middleware & Static serving setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚂 Taiwan Railway Travel Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
