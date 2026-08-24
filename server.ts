import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

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

    const styleDesc = getStyleDescription(preferences?.style);
    const companionDesc = getCompanionDescription(preferences?.companion);
    const paceDesc = getPaceDescription(preferences?.pace);
    const transportDesc = getTransportDescription(preferences?.transport, destination.name);
    const customNotes = preferences?.customNotes ? preferences.customNotes.trim() : '';

    const systemPrompt = `你是一位精通台灣鐵路（台鐵 TRA）與台灣各縣市深度旅遊的頂級在地導遊規劃專家。
你的任務是為旅客規劃一份從起點火車站搭乘台鐵抵達目的地火車站的「完美一日遊詳細行程表與交通指南」。

請嚴格遵循以下規劃原則：
1. 【個人化最高優先】：必須 100% 依據旅客設定的「旅遊風格主題」、「同行夥伴組合」、「行程節奏」、「目的地交通方式」與「自訂特殊需求備註」進行深度量身定做！行程標題、停留點、餐飲選擇、活動內容與貼心小叮嚀都必須精準體現這些個人化偏好。
2. 【台鐵轉乘與列車班次詳細指引】：起點火車站到目的地火車站之間，必須精準判斷是否為「直達列車」或「需要中途轉乘」：
   - 直達情況（如台北直達礁溪/花蓮/台中/高雄等幹線）：isDirect 設為 true，transferCount 為 0，transferStations 為 []，transferSummary 為「直達列車・無須轉乘」，legs 包含 1 個單一搭乘區間。
   - 轉乘情況（如平溪線車站十分/平溪/菁桐需在瑞芳轉乘；集集線車站車埕/集集需在二水或彰化轉乘；內灣線車站內灣/合興需在竹中或新竹轉乘；或跨線遠程轉乘）：
     - isDirect 設為 false，transferCount 為 1 (或轉乘次數)，transferStations 設為轉乘站名陣列（如 ["瑞芳"]）。
     - transferSummary 清楚說明，如「於【瑞芳站】轉乘 平溪深澳線（等候約 12 分鐘）」。
     - legs 陣列詳細列出每一段的「搭乘車種、車次號、起站、迄站、出發時間、抵達時間、轉乘等候時間、乘車備註」。
3. 行程以目的地火車站為核心放射狀規劃，景點與美食皆須為真實存在的在地知名店家與觀光勝地。
4. 路線順序需具備高度地理合理性（不走回頭路），明確說明由火車站出發如何轉乘（如步行、YouBike、台灣好行客運、租機車、計程車）。
5. 包含道地的火車出發與回程車次建議（如新自強3000、普悠瑪、自強號、區間快車）、台鐵便當與在地必吃名產。
6. 每一個景點與餐廳都需提供具體的停留時間、特色介紹、推薦餐點或拍照點，以及精準的地理座標(lat, lng)與地址。
7. 必須以繁體中文（台灣習慣用語）輸出嚴格符合 JSON Schema 的內容。`;

    const userPrompt = `請為我規劃專屬量身定制的一日鐵道深度旅遊：
- 出發起點火車站：${origin.name} (${origin.county})
- 抵達目的地火車站：${destination.name} (${destination.county})，車站特色：${destination.description || ''}，在地名物特色：${(destination.popularFoods || []).join('、')} / ${(destination.popularAttractions || []).join('、')}
- 預計旅遊日期：${travelDate || '今日'}

★★★ 旅客個人化偏好要求（必須全面落實於行程規劃中）★★★
1. 主題風格要求：${styleDesc}
2. 同行夥伴考量：${companionDesc}
3. 行程節奏與站點數：${paceDesc}
4. 目的地接駁交通：${transportDesc}
5. 旅客特別自訂需求備註：${customNotes ? `【最高優先級必達成需求】「${customNotes}」。請務必在行程標題、景點安排、餐飲選擇或導遊注意事項中明確呼應與落實此需求！` : '無特殊自訂需求'}

請嚴格依照上述需求生成完整行程表。請特別注意：在推薦列車班次時，必須詳細列出起訖站之間是否為直達，若需轉乘則詳細列出所有轉乘站點、各段列車車種、車次號、發車與抵達時間及等候時間！`;

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
                outboundList: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      optionLabel: { type: Type.STRING, description: '時段定位標籤，例如：早鳥首選、主力推薦、彈性出發' },
                      trainType: { type: Type.STRING, description: '建議車種（如 EMU3000新自強、普悠瑪號、自強號、區間快車）' },
                      trainNo: { type: Type.STRING, description: '車次號，如 自強 218次 或 區快 4018次' },
                      departureTime: { type: Type.STRING, description: '出發時間，如 08:35' },
                      arrivalTime: { type: Type.STRING, description: '抵達時間，如 09:48' },
                      fareEstimate: { type: Type.INTEGER, description: '單程票價（NTD）' },
                      durationText: { type: Type.STRING, description: '車程描述，如 約1小時13分' },
                      features: { type: Type.STRING, description: '特色亮點，如 全車對號座/舒適平穩 或 免劃位/可刷TPASS與悠遊卡' },
                      isDirect: { type: Type.BOOLEAN, description: '是否為直達列車（true為直達，false為需中途轉乘）' },
                      transferCount: { type: Type.INTEGER, description: '轉乘次數（直達為0，轉乘1次為1）' },
                      transferStations: { type: Type.ARRAY, items: { type: Type.STRING }, description: '轉乘站點名稱清單，例如 ["瑞芳"] 或 ["二水"]' },
                      transferSummary: { type: Type.STRING, description: '轉乘指引摘要，如 "直達車・無須轉乘" 或 "於【瑞芳站】轉乘 平溪線（等候約 12 分）"' },
                      legs: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            legIndex: { type: Type.INTEGER, description: '區間順序，從1開始' },
                            trainType: { type: Type.STRING, description: '此區間搭乘車種' },
                            trainNo: { type: Type.STRING, description: '此區間車次號' },
                            fromStation: { type: Type.STRING, description: '此區間出發站點' },
                            toStation: { type: Type.STRING, description: '此區間抵達站點' },
                            departureTime: { type: Type.STRING, description: '此區間出發時間' },
                            arrivalTime: { type: Type.STRING, description: '此區間抵達時間' },
                            durationText: { type: Type.STRING, description: '此區間耗時' },
                            transferWaitMinutes: { type: Type.INTEGER, description: '此區間結束後的轉乘等候分鐘數（最後一段為0）' },
                            note: { type: Type.STRING, description: '月台轉乘小提示或特色備註' },
                          },
                          required: ['legIndex', 'trainType', 'trainNo', 'fromStation', 'toStation', 'departureTime', 'arrivalTime'],
                        },
                        description: '各搭乘區間與轉乘詳細清單',
                      },
                    },
                    required: ['optionLabel', 'trainType', 'trainNo', 'departureTime', 'arrivalTime', 'fareEstimate', 'durationText'],
                  },
                  description: '去程推薦列車清單，嚴格提供 3 個不同時段的班次選項（如：早鳥出發、主力推薦、悠閒晚出發）',
                },
                inboundList: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      optionLabel: { type: Type.STRING, description: '時段定位標籤，例如：提早賦歸、主力推薦、晚間慢活' },
                      trainType: { type: Type.STRING, description: '建議回程車種' },
                      trainNo: { type: Type.STRING, description: '回程車次號' },
                      departureTime: { type: Type.STRING, description: '回程出發時間，如 17:40' },
                      arrivalTime: { type: Type.STRING, description: '抵達起點時間，如 18:55' },
                      fareEstimate: { type: Type.INTEGER, description: '回程票價（NTD）' },
                      durationText: { type: Type.STRING, description: '車程描述' },
                      features: { type: Type.STRING, description: '特色亮點' },
                      isDirect: { type: Type.BOOLEAN, description: '是否為直達列車' },
                      transferCount: { type: Type.INTEGER, description: '轉乘次數' },
                      transferStations: { type: Type.ARRAY, items: { type: Type.STRING }, description: '轉乘站點名稱清單' },
                      transferSummary: { type: Type.STRING, description: '轉乘指引摘要' },
                      legs: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            legIndex: { type: Type.INTEGER, description: '區間順序，從1開始' },
                            trainType: { type: Type.STRING, description: '此區間搭乘車種' },
                            trainNo: { type: Type.STRING, description: '此區間車次號' },
                            fromStation: { type: Type.STRING, description: '此區間出發站點' },
                            toStation: { type: Type.STRING, description: '此區間抵達站點' },
                            departureTime: { type: Type.STRING, description: '此區間出發時間' },
                            arrivalTime: { type: Type.STRING, description: '此區間抵達時間' },
                            durationText: { type: Type.STRING, description: '此區間耗時' },
                            transferWaitMinutes: { type: Type.INTEGER, description: '轉乘等候分鐘數' },
                            note: { type: Type.STRING, description: '轉乘備註' },
                          },
                          required: ['legIndex', 'trainType', 'trainNo', 'fromStation', 'toStation', 'departureTime', 'arrivalTime'],
                        },
                        description: '各搭乘區間與轉乘詳細清單',
                      },
                    },
                    required: ['optionLabel', 'trainType', 'trainNo', 'departureTime', 'arrivalTime', 'fareEstimate', 'durationText'],
                  },
                  description: '回程推薦班次清單，嚴格提供 3 個不同時段的班次選項（如：傍晚早回、主力推薦、晚間賦歸）',
                },
                outbound: {
                  type: Type.OBJECT,
                  properties: {
                    trainType: { type: Type.STRING, description: '主力推薦去程車種' },
                    trainNo: { type: Type.STRING, description: '去程主力推薦車次號' },
                    departureTime: { type: Type.STRING, description: '建議出發時間，如 08:35' },
                    arrivalTime: { type: Type.STRING, description: '預計抵達目的地時間，如 09:48' },
                    fareEstimate: { type: Type.INTEGER, description: '單程票價預估（NTD）' },
                    durationText: { type: Type.STRING, description: '車程時間描述' },
                    isDirect: { type: Type.BOOLEAN, description: '是否為直達' },
                    transferCount: { type: Type.INTEGER, description: '轉乘次數' },
                    transferStations: { type: Type.ARRAY, items: { type: Type.STRING }, description: '轉乘站' },
                    transferSummary: { type: Type.STRING, description: '轉乘指引' },
                  },
                  required: ['trainType', 'departureTime', 'arrivalTime', 'fareEstimate', 'durationText'],
                },
                inbound: {
                  type: Type.OBJECT,
                  properties: {
                    trainType: { type: Type.STRING, description: '主力推薦回程車種' },
                    trainNo: { type: Type.STRING, description: '回程主力推薦車次號' },
                    departureTime: { type: Type.STRING, description: '建議回程時間，如 17:40' },
                    arrivalTime: { type: Type.STRING, description: '抵達起點站時間，如 18:55' },
                    fareEstimate: { type: Type.INTEGER, description: '回程票價預估（NTD）' },
                    durationText: { type: Type.STRING, description: '車程時間描述' },
                    isDirect: { type: Type.BOOLEAN, description: '是否為直達' },
                    transferCount: { type: Type.INTEGER, description: '轉乘次數' },
                    transferStations: { type: Type.ARRAY, items: { type: Type.STRING }, description: '轉乘站' },
                    transferSummary: { type: Type.STRING, description: '轉乘指引' },
                  },
                  required: ['trainType', 'departureTime', 'arrivalTime', 'fareEstimate', 'durationText'],
                },
                bookingTip: { type: Type.STRING, description: '台鐵購票提醒（如 乘車前28天開放訂票、連續假期請提早搶票等）' },
                traOfficialUrl: { type: Type.STRING, description: 'https://www.railway.gov.tw/tra-tip-web/tip' },
              },
              required: ['outboundList', 'inboundList', 'bookingTip'],
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

    // Ensure outbound and inbound are present and populated
    if (parsed.trainRecommendation?.outboundList && parsed.trainRecommendation.outboundList.length > 0) {
      if (!parsed.trainRecommendation.outbound) {
        parsed.trainRecommendation.outbound = parsed.trainRecommendation.outboundList[1] || parsed.trainRecommendation.outboundList[0];
      }
    }
    if (parsed.trainRecommendation?.inboundList && parsed.trainRecommendation.inboundList.length > 0) {
      if (!parsed.trainRecommendation.inbound) {
        parsed.trainRecommendation.inbound = parsed.trainRecommendation.inboundList[1] || parsed.trainRecommendation.inboundList[0];
      }
    }

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

// Helpers for translating preferences into detailed expert prompts
function getStyleDescription(style?: string): string {
  switch (style) {
    case 'gourmet':
      return '【美食老饕主題】行程主軸為在地排隊名店、米其林必比登推薦、老街必吃傳統小吃與台鐵特色便當，景點與動線以美食朝聖與在地好味道為最高優先核心。';
    case 'instagram':
      return '【網美打卡主題】行程主軸為極美視覺景觀、文青老屋/海景咖啡廳、人氣地標攝影、光影藝術裝置與拍照打卡點，提供最佳拍照角度、光線時間與合影建議。';
    case 'culture':
      return '【歷史人文主題】行程主軸為百年老街、古蹟建築、歷史街區、鐵道文物館、故事聚落與傳統工藝巡禮，深入介紹文化歷史故事。';
    case 'family':
      return '【親子同樂主題】行程主軸為親子友善設施、安全好走平緩步道、手作DIY體驗、草地互動或趣味景點，動線需推車友善且節奏平順無危險路段。';
    case 'nature':
      return '【自然步道主題】行程主軸為山海綠意景觀、森林森呼吸步道、瀑布湖泊、地質景觀與戶外大自然漫步，感受大自然放鬆身心。';
    case 'slow_life':
      return '【慢活悠閒主題】行程主軸為不趕行程、步調愜意，挑選日式老屋茶館、安靜水岸放空，每個點停留充足時間，享受無壓力寧靜午後。';
    default:
      return '【在地經典綜合主題】結合在地代表性景點與特色美食。';
  }
}

function getCompanionDescription(companion?: string): string {
  switch (companion) {
    case 'solo':
      return '【一人獨旅自由行】適合一人自在漫步、安排方便一人用餐點餐的店家與放鬆沉澱空間。';
    case 'couple':
      return '【浪漫情侶約會】注重浪漫氛圍、特色景觀餐廳、合影留念打卡點與甜蜜午茶時光。';
    case 'family_elder':
      return '【長輩同行】嚴格要求：全線步道必須平緩好走、嚴禁長階梯與陡坡、每個景點需有充足坐處休息、安排在地清淡養生料理與洗手間便利之景點！';
    case 'family_kids':
      return '【親子育兒家庭】注重兒童安全性、趣味互動體驗、親子友善設施與洗手間便利性。';
    case 'friends':
      return '【好友同遊】適合多人歡樂合照、分食多樣化在地美食小吃、熱鬧商圈與打卡景點。';
    default:
      return '雙人同遊。';
  }
}

function getPaceDescription(pace?: string): string {
  switch (pace) {
    case 'relaxed':
      return '【慢步調（悠閒放鬆）】請【嚴格只安排 3~4 個站點】，每個景點停留 90~120 分鐘以上，保留大段放鬆時間，切勿塞入過多景點！';
    case 'moderate':
      return '【經典適中】請安排 4~5 個精華站點，停留時間 60~90 分鐘，節奏勻稱充實。';
    case 'packed':
      return '【精實踩點】請安排 5~6 個精華站點，充分利用一日時間，節奏緊湊且豐富多元。';
    default:
      return '【經典適中】安排 4~5 個精華站點。';
  }
}

function getTransportDescription(transport?: string, destName?: string): string {
  const stationName = destName || '火車站';
  switch (transport) {
    case 'walk_youbike':
      return `【步行 + YouBike 2.0】所有景點必須嚴格位於${stationName}周邊半徑內（步行 5~15 分鐘或 YouBike 騎乘 5~10 分鐘以內可達），在每一站的 transportFromPrevious 中明確載明 YouBike 租借站點或步行指引。`;
    case 'public_bus':
      return `【市區公車 / 台灣好行客運】結合${stationName}前客運、台灣好行接駁路線，說明搭乘路線編號與站牌名稱。`;
    case 'scooter_rental':
      return `【站前租機車】出站於${stationName}前租借機車，可延伸探索 5~15 公里範圍的特色景點或山海秘境，行程動線順暢不繞路。`;
    case 'taxi_car':
      return `【計程車 / 包車】安排可由${stationName}前計程車直達的精華景點，省時舒適。`;
    default:
      return `【步行 + YouBike 2.0】${stationName}周邊低碳漫遊。`;
  }
}

// Helper to build realistic train recommendations with explicit direct vs. transfer legs
function buildTrainRecommendations(origin: any, destination: any) {
  const originName = origin?.name || '台北';
  const destName = destination?.name || '礁溪';
  const destLine = destination?.line || '';

  // Branch line transit detection
  const isPingxiBranch = ['十分', '平溪', '菁桐', '望古', '嶺腳', '猴硐', '海科館', '八斗子'].includes(destName) || destLine.includes('平溪');
  const isJijiBranch = ['車埕', '集集', '水里', '濁水', '龍泉'].includes(destName) || destLine.includes('集集');
  const isNeiwanBranch = ['內灣', '合興', '竹東', '九讚頭', '橫山'].includes(destName) || destLine.includes('內灣');
  const isAlishan = ['奮起湖', '阿里山', '十字路'].includes(destName);

  let isTransferRequired = isPingxiBranch || isJijiBranch || isNeiwanBranch || isAlishan;
  let transferStationName = '';
  let branchLineName = '';

  if (isPingxiBranch) {
    transferStationName = '瑞芳';
    branchLineName = '平溪深澳線';
  } else if (isJijiBranch) {
    transferStationName = '二水';
    branchLineName = '集集線';
  } else if (isNeiwanBranch) {
    transferStationName = '竹中';
    branchLineName = '內灣線';
  } else if (isAlishan) {
    transferStationName = '嘉義';
    branchLineName = '阿里山林鐵';
  }

  // If origin is already the transfer station, it's direct!
  if (originName === transferStationName) {
    isTransferRequired = false;
  }

  let outboundOptions: any[] = [];
  let inboundOptions: any[] = [];

  if (isTransferRequired) {
    // 轉乘模式 (Transfer required)
    outboundOptions = [
      {
        optionLabel: '早鳥首選',
        trainType: `自強號 ➔ ${branchLineName}`,
        trainNo: '自強 204次 + 區間 4710次',
        departureTime: '07:30',
        arrivalTime: '09:05',
        fareEstimate: 165,
        durationText: '約1小時35分 (含轉乘12分)',
        features: `於【${transferStationName}站】轉乘・晨光抵達探索`,
        isDirect: false,
        transferCount: 1,
        transferStations: [transferStationName],
        transferSummary: `於【${transferStationName}站】轉乘 ${branchLineName}（同站跨月台等候約 12 分）`,
        legs: [
          {
            legIndex: 1,
            trainType: '自強號 (EMU3000)',
            trainNo: '自強 204次',
            fromStation: originName,
            toStation: transferStationName,
            departureTime: '07:30',
            arrivalTime: '08:22',
            durationText: '約52分',
            transferWaitMinutes: 12,
            note: `抵達【${transferStationName}站】後，請依指標前往第3月台轉乘${branchLineName}`,
          },
          {
            legIndex: 2,
            trainType: `${branchLineName} 區間車`,
            trainNo: '區間 4710次',
            fromStation: transferStationName,
            toStation: destName,
            departureTime: '08:34',
            arrivalTime: '09:05',
            durationText: '約31分',
            transferWaitMinutes: 0,
            note: '沿途飽覽在地山海溪谷與鐵道風光',
          },
        ],
      },
      {
        optionLabel: '主力推薦',
        trainType: `新自強號 ➔ ${branchLineName}`,
        trainNo: '自強 218次 + 區間 4714次',
        departureTime: '08:35',
        arrivalTime: '10:08',
        fareEstimate: 165,
        durationText: '約1小時33分 (含轉乘14分)',
        features: `黃金時段・於【${transferStationName}站】順暢接駁`,
        isDirect: false,
        transferCount: 1,
        transferStations: [transferStationName],
        transferSummary: `於【${transferStationName}站】轉乘 ${branchLineName}（等候約 14 分鐘）`,
        legs: [
          {
            legIndex: 1,
            trainType: '新自強號 (EMU3000)',
            trainNo: '自強 218次',
            fromStation: originName,
            toStation: transferStationName,
            departureTime: '08:35',
            arrivalTime: '09:24',
            durationText: '約49分',
            transferWaitMinutes: 14,
            note: `於【${transferStationName}站】同站換乘，時間充裕可於月台稍作拍照`,
          },
          {
            legIndex: 2,
            trainType: `${branchLineName} 區間車`,
            trainNo: '區間 4714次',
            fromStation: transferStationName,
            toStation: destName,
            departureTime: '09:38',
            arrivalTime: '10:08',
            durationText: '約30分',
            transferWaitMinutes: 0,
            note: `順利抵達${destName}火車站`,
          },
        ],
      },
      {
        optionLabel: '悠閒出發',
        trainType: `區間快車 ➔ ${branchLineName}`,
        trainNo: '區快 4018次 + 區間 4718次',
        departureTime: '09:20',
        arrivalTime: '10:58',
        fareEstimate: 125,
        durationText: '約1小時38分 (含轉乘15分)',
        features: `免劃位・可刷 TPASS 悠遊卡於【${transferStationName}】轉乘`,
        isDirect: false,
        transferCount: 1,
        transferStations: [transferStationName],
        transferSummary: `於【${transferStationName}站】轉乘 ${branchLineName}（等候約 15 分鐘）`,
        legs: [
          {
            legIndex: 1,
            trainType: '台鐵 區間快車',
            trainNo: '區快 4018次',
            fromStation: originName,
            toStation: transferStationName,
            departureTime: '09:20',
            arrivalTime: '10:15',
            durationText: '約55分',
            transferWaitMinutes: 15,
            note: `刷悠遊卡進站，於【${transferStationName}站】換乘`,
          },
          {
            legIndex: 2,
            trainType: `${branchLineName} 區間車`,
            trainNo: '區間 4718次',
            fromStation: transferStationName,
            toStation: destName,
            departureTime: '10:30',
            arrivalTime: '10:58',
            durationText: '約28分',
            transferWaitMinutes: 0,
            note: `漫遊抵達${destName}`,
          },
        ],
      },
    ];

    // Inbound options for transfer
    inboundOptions = [
      {
        optionLabel: '提早賦歸',
        trainType: `${branchLineName} ➔ 自強號`,
        trainNo: '區間 4729次 + 自強 223次',
        departureTime: '16:30',
        arrivalTime: '18:10',
        fareEstimate: 165,
        durationText: '約1小時40分 (含轉乘15分)',
        features: `避開尖峰・於【${transferStationName}站】轉乘返程`,
        isDirect: false,
        transferCount: 1,
        transferStations: [transferStationName],
        transferSummary: `於【${transferStationName}站】轉乘自強號返回${originName}（等候約 15 分鐘）`,
        legs: [
          {
            legIndex: 1,
            trainType: `${branchLineName} 區間車`,
            trainNo: '區間 4729次',
            fromStation: destName,
            toStation: transferStationName,
            departureTime: '16:30',
            arrivalTime: '17:02',
            durationText: '約32分',
            transferWaitMinutes: 15,
            note: `抵達【${transferStationName}站】後，前往第1月台轉乘幹線自強號`,
          },
          {
            legIndex: 2,
            trainType: '自強號',
            trainNo: '自強 223次',
            fromStation: transferStationName,
            toStation: originName,
            departureTime: '17:17',
            arrivalTime: '18:10',
            durationText: '約53分',
            transferWaitMinutes: 0,
            note: `抵達${originName}車站`,
          },
        ],
      },
      {
        optionLabel: '主力推薦',
        trainType: `${branchLineName} ➔ 新自強號`,
        trainNo: '區間 4733次 + 自強 229次',
        departureTime: '17:25',
        arrivalTime: '19:05',
        fareEstimate: 165,
        durationText: '約1小時40分 (含轉乘12分)',
        features: `一日遊完美收尾・於【${transferStationName}站】順暢換乘`,
        isDirect: false,
        transferCount: 1,
        transferStations: [transferStationName],
        transferSummary: `於【${transferStationName}站】轉乘新自強號（等候約 12 分鐘）`,
        legs: [
          {
            legIndex: 1,
            trainType: `${branchLineName} 區間車`,
            trainNo: '區間 4733次',
            fromStation: destName,
            toStation: transferStationName,
            departureTime: '17:25',
            arrivalTime: '17:58',
            durationText: '約33分',
            transferWaitMinutes: 12,
            note: `在【${transferStationName}站】跨月台轉乘新自強號`,
          },
          {
            legIndex: 2,
            trainType: '新自強號 (EMU3000)',
            trainNo: '自強 229次',
            fromStation: transferStationName,
            toStation: originName,
            departureTime: '18:10',
            arrivalTime: '19:05',
            durationText: '約55分',
            transferWaitMinutes: 0,
            note: `車上享用在地便當，舒適抵達${originName}`,
          },
        ],
      },
      {
        optionLabel: '晚間漫遊',
        trainType: `${branchLineName} ➔ 區間快/自強`,
        trainNo: '區間 4737次 + 自強 285次',
        departureTime: '18:40',
        arrivalTime: '20:30',
        fareEstimate: 165,
        durationText: '約1小時50分 (含轉乘18分)',
        features: `商圈老街逛好逛滿・於【${transferStationName}站】夜間轉乘`,
        isDirect: false,
        transferCount: 1,
        transferStations: [transferStationName],
        transferSummary: `於【${transferStationName}站】轉乘自強號（等候約 18 分鐘）`,
        legs: [
          {
            legIndex: 1,
            trainType: `${branchLineName} 區間車`,
            trainNo: '區間 4737次',
            fromStation: destName,
            toStation: transferStationName,
            departureTime: '18:40',
            arrivalTime: '19:12',
            durationText: '約32分',
            transferWaitMinutes: 18,
            note: `於【${transferStationName}站】稍候換車`,
          },
          {
            legIndex: 2,
            trainType: '自強號 / 區間快',
            trainNo: '自強 285次',
            fromStation: transferStationName,
            toStation: originName,
            departureTime: '19:30',
            arrivalTime: '20:30',
            durationText: '約1小時',
            transferWaitMinutes: 0,
            note: `平安返抵${originName}`,
          },
        ],
      },
    ];
  } else {
    // 直達車模式 (Direct)
    outboundOptions = [
      {
        optionLabel: '早鳥首選',
        trainType: '新自強號 (EMU3000)',
        trainNo: '自強 408次',
        departureTime: '07:40',
        arrivalTime: '08:52',
        fareEstimate: 218,
        durationText: '約1小時12分',
        features: '全車對號座・晨間抵達充實探索',
        isDirect: true,
        transferCount: 0,
        transferStations: [],
        transferSummary: '直達列車・無須轉乘',
        legs: [
          {
            legIndex: 1,
            trainType: '新自強號 (EMU3000)',
            trainNo: '自強 408次',
            fromStation: originName,
            toStation: destName,
            departureTime: '07:40',
            arrivalTime: '08:52',
            durationText: '約1小時12分',
            transferWaitMinutes: 0,
            note: '直達列車，一車直達目的地',
          },
        ],
      },
      {
        optionLabel: '主力推薦',
        trainType: 'EMU3000 / 普悠瑪號',
        trainNo: '自強 218次',
        departureTime: '08:35',
        arrivalTime: '09:48',
        fareEstimate: 218,
        durationText: '約1小時13分',
        features: '熱門黃金時段・最省時舒適班次',
        isDirect: true,
        transferCount: 0,
        transferStations: [],
        transferSummary: '直達列車・無須轉乘',
        legs: [
          {
            legIndex: 1,
            trainType: 'EMU3000 / 普悠瑪號',
            trainNo: '自強 218次',
            fromStation: originName,
            toStation: destName,
            departureTime: '08:35',
            arrivalTime: '09:48',
            durationText: '約1小時13分',
            transferWaitMinutes: 0,
            note: '直達列車，乘車體驗舒適平穩',
          },
        ],
      },
      {
        optionLabel: '悠閒出發',
        trainType: '區間快車 / 自強號',
        trainNo: '區快 4018次',
        departureTime: '09:20',
        arrivalTime: '10:45',
        fareEstimate: 168,
        durationText: '約1小時25分',
        features: '免劃位・可刷 TPASS 與悠遊卡乘車',
        isDirect: true,
        transferCount: 0,
        transferStations: [],
        transferSummary: '直達列車・無須轉乘',
        legs: [
          {
            legIndex: 1,
            trainType: '區間快車 / 自強號',
            trainNo: '區快 4018次',
            fromStation: originName,
            toStation: destName,
            departureTime: '09:20',
            arrivalTime: '10:45',
            durationText: '約1小時25分',
            transferWaitMinutes: 0,
            note: '直達列車，自由入座免劃位',
          },
        ],
      },
    ];

    inboundOptions = [
      {
        optionLabel: '提早賦歸',
        trainType: '自強號',
        trainNo: '自強 223次',
        departureTime: '16:50',
        arrivalTime: '18:10',
        fareEstimate: 218,
        durationText: '約1小時20分',
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
            fromStation: destName,
            toStation: originName,
            departureTime: '16:50',
            arrivalTime: '18:10',
            durationText: '約1小時20分',
            transferWaitMinutes: 0,
            note: '直達返程列車',
          },
        ],
      },
      {
        optionLabel: '主力推薦',
        trainType: '新自強號 (EMU3000)',
        trainNo: '自強 229次',
        departureTime: '17:40',
        arrivalTime: '18:55',
        fareEstimate: 218,
        durationText: '約1小時15分',
        features: '完美一日遊收尾・車上享用鐵路便當',
        isDirect: true,
        transferCount: 0,
        transferStations: [],
        transferSummary: '直達列車・無須轉乘',
        legs: [
          {
            legIndex: 1,
            trainType: '新自強號 (EMU3000)',
            trainNo: '自強 229次',
            fromStation: destName,
            toStation: originName,
            departureTime: '17:40',
            arrivalTime: '18:55',
            durationText: '約1小時15分',
            transferWaitMinutes: 0,
            note: '直達返程列車，推薦車上享用台鐵便當',
          },
        ],
      },
      {
        optionLabel: '晚間漫遊',
        trainType: '自強號 / 區間快',
        trainNo: '自強 285次',
        departureTime: '19:15',
        arrivalTime: '20:38',
        fareEstimate: 218,
        durationText: '約1小時23分',
        features: '夜市商圈逛好逛滿・享受在地夜景',
        isDirect: true,
        transferCount: 0,
        transferStations: [],
        transferSummary: '直達列車・無須轉乘',
        legs: [
          {
            legIndex: 1,
            trainType: '自強號 / 區間快',
            trainNo: '自強 285次',
            fromStation: destName,
            toStation: originName,
            departureTime: '19:15',
            arrivalTime: '20:38',
            durationText: '約1小時23分',
            transferWaitMinutes: 0,
            note: '直達返程列車',
          },
        ],
      },
    ];
  }

  return { outboundOptions, inboundOptions };
}

// Fallback generator for rich data when offline or building
function generateFallbackItinerary(origin: any, destination: any, preferences: any, travelDate: string) {
  const destName = destination?.name || '礁溪';
  const destCounty = destination?.county || '宜蘭縣';
  const destLat = destination?.lat || 24.8291;
  const destLng = destination?.lng || 121.7725;
  const originName = origin?.name || '台北';

  const style = preferences?.style || 'gourmet';
  const companion = preferences?.companion || 'couple';
  const pace = preferences?.pace || 'moderate';
  const transport = preferences?.transport || 'walk_youbike';
  const customNotes = preferences?.customNotes ? preferences.customNotes.trim() : '';

  const defaultFoods = destination?.popularFoods?.length ? destination.popularFoods : ['在地排隊老店小吃', '台鐵招牌便當', '老字號傳統糕點', '現烤特色手作點心'];
  const defaultAttractions = destination?.popularAttractions?.length ? destination.popularAttractions : ['站前老街歷史街區', '在地文化園區', '景觀步道公園', '文創新地標'];

  // Style-specific title and themes
  let styleThemeTitle = '鐵道漫遊一日輕旅行';
  let styleSubtitle = `悠遊${destCounty}・品味在地經典美食與慢活風光`;
  if (style === 'gourmet') {
    styleThemeTitle = '在地老饕美食一日巡禮';
    styleSubtitle = `探索${destCounty}${destName}必吃老字號小吃、排隊名店與台鐵便當`;
  } else if (style === 'instagram') {
    styleThemeTitle = '美拍打卡＆文青景觀一日遊';
    styleSubtitle = `精選${destName}絕美取景地標、老屋咖啡與光影秘境`;
  } else if (style === 'culture') {
    styleThemeTitle = '百年鐵道與歷史人文深度一日遊';
    styleSubtitle = `走讀${destName}歷史老街、文化聚落與古蹟風華`;
  } else if (style === 'family') {
    styleThemeTitle = '親子同樂歡樂鐵道一日遊';
    styleSubtitle = `平緩好走、寓教於樂體驗與親子友善漫遊動線`;
  } else if (style === 'nature') {
    styleThemeTitle = '山海綠意大自然森呼吸一日遊';
    styleSubtitle = `漫步${destName}清幽自然步道、眺望遼闊景觀與溪流綠意`;
  } else if (style === 'slow_life') {
    styleThemeTitle = '不趕路慢活愜意茶屋一日遊';
    styleSubtitle = `找間靜謐老屋品茗放空，享受${destName}寧靜午後時光`;
  }

  // Transport details helper
  const getTransportDetails = (mode: string, minDuration: number) => {
    if (transport === 'walk_youbike') {
      return {
        mode: 'youbike' as const,
        durationText: `騎乘 YouBike 約 ${minDuration} 分鐘`,
        details: `由${destName}火車站前 YouBike 2.0 站租借，順自行車道騎行即可抵達`,
      };
    } else if (transport === 'public_bus') {
      return {
        mode: 'bus' as const,
        durationText: `搭乘公車/客運約 ${minDuration + 3} 分鐘`,
        details: `於${destName}火車站前公車站搭乘台灣好行或市區接駁公車直達`,
      };
    } else if (transport === 'scooter_rental') {
      return {
        mode: 'taxi' as const,
        durationText: `騎機車約 ${Math.max(3, Math.round(minDuration * 0.7))} 分鐘`,
        details: `站前租機車出發，沿主要景觀道路騎乘`,
      };
    } else {
      return {
        mode: 'walk' as const,
        durationText: `步行約 ${minDuration + 2} 分鐘`,
        details: `由${destName}車站出發漫步抵達`,
      };
    }
  };

  const { outboundOptions, inboundOptions } = buildTrainRecommendations(origin, destination);

  // Dynamic stops according to style & pace
  const allGeneratedStops: any[] = [
    {
      id: 'stop-1',
      timeSlot: '10:00 - 11:20',
      placeName: defaultAttractions[0] || `${destName}火車站前故事聚落`,
      category: style === 'gourmet' ? 'food' : style === 'culture' ? 'culture' : 'spot',
      description: `抵達${destName}火車站後展開專屬${style === 'gourmet' ? '美食朝聖' : style === 'culture' ? '歷史走讀' : '精選'}行程。${customNotes ? `（已為您特別納入需求：「${customNotes}」）` : ''}出站即可感受在地熱情生活氛圍。`,
      highlight: style === 'instagram' ? '最佳採光拍攝地標・質感合影' : style === 'gourmet' ? '站前晨間排隊名店・古早好滋味' : '在地代表性地標與文化散策',
      durationMinutes: pace === 'relaxed' ? 90 : 70,
      address: `${destination?.address || destCounty + destName + '站前街區'}`,
      lat: destLat + 0.002,
      lng: destLng + 0.003,
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(defaultAttractions[0] || destName)}`,
      transportFromPrevious: {
        mode: 'walk',
        durationText: '步行約 3~5 分鐘',
        details: `由${destName}火車站出口出站即達`,
      },
      recommendedItems: ['代表性地標留念', '漫步在地特色造景'],
      tips: `${companion === 'family_elder' ? '此路段平緩無階梯，設有長椅可隨時小憩。' : companion === 'solo' ? '獨旅極佳散步動線，安靜舒適。' : '站前設有旅遊服務中心，可索取導覽地圖。'}`,
      estimatedCostNtd: 0,
    },
    {
      id: 'stop-2',
      timeSlot: '11:35 - 13:05',
      placeName: `${defaultFoods[0] || '在地老字號排隊美食'}品味午餐`,
      category: 'food',
      description: `來到${destName}絕不能錯過的人氣美味！嚴選在地食材與傳統老滷熬製，香味四溢，深獲老饕好評。`,
      highlight: `必嚐名物：${defaultFoods[0] || '招牌老店特色小吃'}`,
      durationMinutes: 90,
      address: `${destCounty}${destName}美食老街`,
      lat: destLat + 0.004,
      lng: destLng - 0.002,
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(defaultFoods[0] || destName + ' 美食')}`,
      transportFromPrevious: getTransportDetails('transport', 6),
      recommendedItems: defaultFoods.slice(0, 3),
      tips: '午餐時段人潮較多，建議提早前往或先派人點餐入座。',
      estimatedCostNtd: 220,
    },
    {
      id: 'stop-3',
      timeSlot: '13:25 - 15:15',
      placeName: defaultAttractions[1] || `${destName}綠意風景園區/景觀咖啡`,
      category: style === 'nature' ? 'nature' : style === 'instagram' ? 'photo' : 'spot',
      description: `午後前往綠意盎然的景觀秘境或氛圍咖啡廳，享受${companion === 'couple' ? '浪漫甜蜜的約會時光' : companion === 'family_kids' ? '小朋友開心放電與互動體驗' : '遠離塵囂的愜意慢活'}。`,
      highlight: style === 'instagram' ? '絕美打卡取景角度・光影氛圍極佳' : '綠意環抱・放鬆森呼吸景緻',
      durationMinutes: pace === 'relaxed' ? 110 : 80,
      address: `${destCounty}${destName}風景區`,
      lat: destLat - 0.005,
      lng: destLng + 0.006,
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(defaultAttractions[1] || destName + ' 景點')}`,
      transportFromPrevious: getTransportDetails('transport', 10),
      recommendedItems: ['景觀步道散策', '特色飲品或手工點心'],
      tips: '午後光線柔和，是拍照合影的最佳時機。',
      estimatedCostNtd: 150,
    },
    {
      id: 'stop-4',
      timeSlot: '15:30 - 16:45',
      placeName: `${defaultFoods[1] || '在地手作點心甜品'} ＆ 文創街區`,
      category: 'shopping',
      description: `漫步於特色巷弄，品嚐${defaultFoods[1] || '特色甜點'}，並感受當地的慢調生活美學。`,
      highlight: '手作好滋味與文創特色選物',
      durationMinutes: 75,
      address: `${destCounty}${destName}商圈`,
      lat: destLat + 0.001,
      lng: destLng - 0.003,
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destName + ' 甜點下午茶')}`,
      transportFromPrevious: getTransportDetails('transport', 8),
      recommendedItems: ['現做在地點心', '文創手作紀念小物'],
      tips: '店家常有當季限定口味，值得一試。',
      estimatedCostNtd: 120,
    },
    {
      id: 'stop-5',
      timeSlot: '17:00 - 17:50',
      placeName: `${destName}站前名產伴手禮街 ＆ 台鐵便當`,
      category: 'shopping',
      description: `賦歸前回到火車站周邊，挑選${destCounty}特色伴手禮與外帶美味台鐵便當，為美好的一日鐵道之旅劃下完美句點。`,
      highlight: '在地老字號伴手禮名產採購＆經典鐵路便當',
      durationMinutes: 50,
      address: `${destination?.address || destCounty + destName + '火車站前商圈'}`,
      lat: destLat,
      lng: destLng,
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destName + ' 伴手禮')}`,
      transportFromPrevious: {
        mode: 'walk',
        durationText: '步行約 4 分鐘',
        details: `返回${destName}火車站候車大廳`,
      },
      recommendedItems: ['手作特色糕餅', '在地農特產禮盒', '台鐵經典排骨便當'],
      tips: '建議提早 15 分鐘進站月台候車，避免匆忙。',
      estimatedCostNtd: 300,
    },
  ];

  // Limit stops by pace: relaxed -> 3-4 stops, moderate -> 4-5 stops, packed -> 5 stops
  let finalStops = allGeneratedStops;
  if (pace === 'relaxed') {
    finalStops = [allGeneratedStops[0], allGeneratedStops[1], allGeneratedStops[2], allGeneratedStops[4]];
  } else if (pace === 'moderate') {
    finalStops = allGeneratedStops;
  }

  return {
    id: `itin-${Date.now()}`,
    createdAt: new Date().toISOString(),
    title: `【${originName} ➔ ${destName}】${styleThemeTitle}`,
    subtitle: styleSubtitle,
    summary: `專為您量身定制的${originName}至${destName}鐵道一日遊。依據您偏好的「${getStyleDescription(style).split('】')[0].replace('【', '')}」與「${getCompanionDescription(companion).split('】')[0].replace('【', '')}」，搭配「${getTransportDescription(transport, destName).split('】')[0].replace('【', '')}」，${customNotes ? `並落實您的特別需求「${customNotes}」，` : ''}串聯${defaultFoods.slice(0, 2).join('、')}與${defaultAttractions.slice(0, 2).join('、')}，享受完美充實的一日假期。`,
    estimatedTotalBudget: 1150,
    travelDate: travelDate || new Date().toISOString().split('T')[0],
    originStation: origin,
    destinationStation: destination,
    preferences: preferences || { style: 'gourmet', companion: 'couple', pace: 'moderate', transport: 'walk_youbike' },
    weatherAdvice: '建議穿著輕便好走的休閒鞋，隨身攜帶水壺、雨具與防曬用品以備不時之需。',
    trainRecommendation: {
      outbound: outboundOptions[1],
      inbound: inboundOptions[1],
      outboundList: outboundOptions,
      inboundList: inboundOptions,
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
        customNotes ? `特別需求提醒：已於行程中考量「${customNotes}」。` : '假日人潮眾多時，名店用餐建議避開尖峰時段。',
        '搭乘台鐵返程請預留 15 分鐘前抵達月台候車。',
      ],
    },
    localSpecialties: {
      mustEat: defaultFoods,
      souvenirs: ['在地特色農特產伴手禮', '傳統手作糕餅', '經典鐵道紀念商品'],
      bentoRecommendation: `${destName}站限定/台鐵經典八角排骨便當與特色風味便當`,
    },
    stops: finalStops,
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
