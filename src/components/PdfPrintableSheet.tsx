import React from 'react';
import { 
  Train, 
  Clock, 
  Calendar, 
  Bus, 
  Route, 
  Utensils, 
  Sparkles,
  Luggage,
  Bike
} from 'lucide-react';
import { DayItinerary, TrainTripOption } from '../types';
import { StaticPdfRouteMap } from './StaticPdfRouteMap';

interface PdfPrintableSheetProps {
  itinerary: DayItinerary;
  selectedOutbound?: TrainTripOption;
  selectedInbound?: TrainTripOption;
}

export const PdfPrintableSheet: React.FC<PdfPrintableSheetProps> = ({
  itinerary,
  selectedOutbound,
  selectedInbound,
}) => {
  const outbound = selectedOutbound || itinerary.trainRecommendation.outbound;
  const inbound = selectedInbound || itinerary.trainRecommendation.inbound;

  const totalStops = itinerary.stops.length;
  // If more than 4 stops, split stops into 2 pages
  const isMultiPageStops = totalStops > 4;
  const page2Stops = isMultiPageStops ? itinerary.stops.slice(0, 3) : itinerary.stops;
  const page3Stops = isMultiPageStops ? itinerary.stops.slice(3) : [];
  const totalPages = isMultiPageStops ? 3 : 2;

  return (
    <div 
      id="pdf-document-printable-sheet"
      className="bg-white text-[#122B28] box-border"
      style={{ 
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang TC", "Microsoft JhengHei", sans-serif',
        lineHeight: 1.45,
        backgroundColor: '#ffffff',
        width: '794px'
      }}
    >
      {/* ==================== PAGE 1: 行程概要、路線圖、車次與接駁 ==================== */}
      <div 
        className="pdf-page bg-white p-7 flex flex-col justify-between box-border border-b border-dashed border-gray-300"
        style={{ 
          width: '794px', 
          height: '1122px', 
          maxHeight: '1122px',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}
      >
        <div className="space-y-3.5">
          {/* 1. Header: Title, Date, Origin & Destination */}
          <div className="border-b-2 border-[#1A8F82] pb-2.5">
            <div className="flex justify-between items-start">
              <div className="flex-1 pr-3">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#E5FAF7] text-[#13695F] text-[11px] font-bold mb-1 border border-[#81D8CF]/50">
                  <Train className="w-3.5 h-3.5 text-[#1A8F82]" />
                  <span>台鐵深度一日遊・AI 智慧旅行指南</span>
                </div>
                <h1 className="text-[20px] font-black text-[#122B28] tracking-tight leading-snug">
                  {itinerary.title}
                </h1>
                <p className="text-[12px] font-medium text-[#546E6A] mt-0.5">
                  {itinerary.subtitle}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-[10px] text-[#78928E] block">出發旅遊日期</span>
                <span className="text-[13px] font-bold text-[#122B28] flex items-center justify-end gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#1A8F82]" />
                  {itinerary.travelDate}
                </span>
                <span className="text-[11px] font-black text-[#13695F] mt-1 block bg-[#FAF8E7] px-2 py-0.5 rounded border border-[#E5DEAA]">
                  {itinerary.originStation.name} ⇄ {itinerary.destinationStation.name}
                </span>
              </div>
            </div>

            {/* Overview Summary & Personalized Profile */}
            <div className="mt-2 p-2.5 bg-[#FAF8E7] rounded-lg border border-[#E5DEAA] text-[11px] text-[#122B28] leading-relaxed">
              {itinerary.preferences && (
                <div className="flex flex-wrap items-center gap-1.5 mb-1.5 pb-1.5 border-b border-[#E5DEAA]/80">
                  <span className="font-bold text-[#0F3A35] text-[10px]">個人化設定:</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#E5FAF7] text-[#13695F] text-[9.5px] font-bold border border-[#81D8CF]/40">
                    {itinerary.preferences.style === 'gourmet' ? '🍜 美食老饕' :
                     itinerary.preferences.style === 'instagram' ? '📸 網美打卡' :
                     itinerary.preferences.style === 'culture' ? '🏛️ 歷史人文' :
                     itinerary.preferences.style === 'family' ? '👨‍👩‍👧 親子同樂' :
                     itinerary.preferences.style === 'nature' ? '🌲 自然步道' : '☕ 慢活悠閒'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-white text-[#546E6A] text-[9.5px] font-medium border border-[#E5DEAA]">
                    {itinerary.preferences.companion === 'solo' ? '一人獨旅' :
                     itinerary.preferences.companion === 'couple' ? '情侶約會' :
                     itinerary.preferences.companion === 'family_elder' ? '長輩同行' :
                     itinerary.preferences.companion === 'family_kids' ? '親子家庭' : '好友同行'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-white text-[#546E6A] text-[9.5px] font-medium border border-[#E5DEAA]">
                    {itinerary.preferences.pace === 'relaxed' ? '慢步調' :
                     itinerary.preferences.pace === 'packed' ? '精實踩點' : '經典適中'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#E5FAF7] text-[#13695F] text-[9.5px] font-bold border border-[#81D8CF]/40">
                    {itinerary.preferences.transport === 'walk_youbike' ? '步行+YouBike' :
                     itinerary.preferences.transport === 'public_bus' ? '公車客運' :
                     itinerary.preferences.transport === 'scooter_rental' ? '租機車' : '計程車'}
                  </span>
                  {itinerary.preferences.customNotes && (
                    <span className="px-1.5 py-0.5 rounded bg-white text-[#665A15] text-[9.5px] font-medium border border-[#E5DEAA]">
                      備註: {itinerary.preferences.customNotes}
                    </span>
                  )}
                </div>
              )}
              <div>
                <span className="font-bold text-[#0F3A35] mr-1">【行程特色摘要】</span>
                {itinerary.summary}
              </div>
            </div>

            {/* Key Metrics Strip */}
            <div className="grid grid-cols-3 gap-2 mt-2 text-[11px]">
              <div className="bg-[#E5FAF7] p-1.5 px-2 rounded border border-[#81D8CF]/50">
                <span className="text-[#546E6A] block text-[9.5px]">預估人均總花費</span>
                <span className="font-black text-[#13695F] text-[13px]">約 NT$ {itinerary.estimatedTotalBudget}</span>
              </div>
              <div className="bg-[#FAF8E7] p-1.5 px-2 rounded border border-[#E5DEAA]">
                <span className="text-[#546E6A] block text-[9.5px]">主要周邊交通</span>
                <span className="font-bold text-[#665A15] text-[11px] truncate block">{itinerary.transitGuide?.recommendedMode || '步行 / YouBike / 接駁'}</span>
              </div>
              <div className="bg-[#FAF8E7] p-1.5 px-2 rounded border border-[#E5DEAA]">
                <span className="text-[#546E6A] block text-[9.5px]">天候穿著建議</span>
                <span className="font-medium text-[#8C7C20] text-[10px] truncate block">{itinerary.weatherAdvice || '輕便休閒服裝與好走步鞋'}</span>
              </div>
            </div>
          </div>

          {/* 2. Visual Route Map Image & Topology */}
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#FAF8E7]/70 via-white to-[#E5FAF7]/40 border border-[#E5DEAA]">
            <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-[#E5DEAA]">
              <div className="flex items-center space-x-1.5">
                <Route className="w-3.5 h-3.5 text-[#1A8F82]" />
                <h2 className="text-[11.5px] font-bold text-[#122B28]">
                  行程路線與景點地圖導覽圖
                </h2>
              </div>
              <span className="text-[9.5px] text-[#546E6A] font-medium">
                真實地理比例・共 {itinerary.stops.length} 個景點停靠站點
              </span>
            </div>

            {/* Embedded Static Map Image */}
            <div className="my-1">
              <StaticPdfRouteMap
                destinationStation={itinerary.destinationStation}
                stops={itinerary.stops}
                width={738}
                height={175}
              />
            </div>

            {/* Compact Route Sequence Badges */}
            <div className="flex flex-wrap items-center gap-1 text-[9px] pt-1 border-t border-[#E5DEAA]/60 text-[#546E6A]">
              <span className="font-bold text-[#0F3A35]">路線動線：</span>
              <span className="font-bold text-[#13695F]">🚉 {itinerary.destinationStation.name}站</span>
              {itinerary.stops.map((stop, idx) => (
                <React.Fragment key={`p1-seq-${idx}`}>
                  <span className="text-[#81D8CF] font-bold">➔</span>
                  <span className="font-semibold text-[#122B28] bg-white px-1 py-0.2 rounded border border-[#E5DEAA]">
                    <strong className="text-[#1A8F82]">{idx + 1}.</strong> {stop.placeName}
                  </span>
                </React.Fragment>
              ))}
              <span className="text-[#81D8CF] font-bold">➔</span>
              <span className="font-bold text-[#0F3A35]">🚉 賦歸返程</span>
            </div>
          </div>

          {/* 3. Section: Selected Train Options & Detailed Transfer Guide */}
          <div className="p-2.5 rounded-xl bg-[#FAF8E7]/60 border border-[#E5DEAA]">
            <div className="flex items-center justify-between mb-1.5 border-b border-[#E5DEAA] pb-1">
              <h2 className="text-[11.5px] font-bold text-[#122B28] flex items-center gap-1">
                <Train className="w-3.5 h-3.5 text-[#1A8F82]" />
                <span>選定台鐵車次及轉乘詳細指引</span>
              </h2>
              <span className="text-[9.5px] text-[#546E6A]">
                台鐵官網時刻：railway.gov.tw
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Outbound Box */}
              <div className="bg-white p-2 rounded-lg border border-[#E5DEAA]">
                <div className="flex items-center justify-between text-[10px] mb-0.5">
                  <span className="font-bold text-[#13695F] bg-[#E5FAF7] px-1.5 py-0.2 rounded border border-[#81D8CF]/40">
                    去程選定・{outbound.optionLabel || '推薦班次'}
                  </span>
                  <span className="text-[#78928E]">{outbound.durationText}</span>
                </div>
                <div className="text-[11px] font-bold text-[#122B28] mt-0.5">
                  {outbound.trainType} <span className="text-[#1A8F82] font-black">{outbound.trainNo}</span>
                </div>
                <div className="flex justify-between items-center text-[10.5px] mt-1 font-bold text-[#122B28]">
                  <span>{itinerary.originStation.name} {outbound.departureTime} 開</span>
                  <span className="text-[#81D8CF]">➔</span>
                  <span>{itinerary.destinationStation.name} {outbound.arrivalTime} 到</span>
                </div>

                {outbound.isDirect === false || (outbound.transferCount && outbound.transferCount > 0) ? (
                  <div className="text-[9px] text-[#8C7C20] bg-[#FAF8E7] p-1 rounded mt-1 border border-[#E5DEAA]">
                    <strong>🔄 需轉乘 {outbound.transferCount || 1} 次：</strong>於【{outbound.transferStations?.join('、') || '轉乘站'}】轉車
                    {outbound.transferSummary && <div className="text-[8.5px] text-[#665A15] mt-0.5">{outbound.transferSummary}</div>}
                    {outbound.legs && outbound.legs.length > 0 && (
                      <div className="mt-0.5 space-y-0.5 text-[8.5px] text-[#546E6A] border-t border-[#E5DEAA] pt-0.5">
                        {outbound.legs.map((l, li) => (
                          <div key={li}>• 第{l.legIndex || li+1}段: {l.fromStation}➔{l.toStation} ({l.trainType} {l.trainNo}, {l.departureTime}開➔{l.arrivalTime}到{l.transferWaitMinutes ? `, 等候${l.transferWaitMinutes}分` : ''})</div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[9px] text-[#13695F] bg-[#E5FAF7] px-1 py-0.2 rounded mt-1 border border-[#81D8CF]/30">
                    🟢 直達列車・免轉乘
                  </div>
                )}

                <div className="text-[9px] text-[#546E6A] mt-1 flex justify-between border-t border-[#E5DEAA]/60 pt-0.5">
                  <span>單程票價約 NT$ {outbound.fareEstimate}</span>
                  <span className="text-[#78928E]">{outbound.features || '對號座/區間'}</span>
                </div>
              </div>

              {/* Inbound Box */}
              <div className="bg-white p-2 rounded-lg border border-[#E5DEAA]">
                <div className="flex items-center justify-between text-[10px] mb-0.5">
                  <span className="font-bold text-[#665A15] bg-[#FAF8E7] px-1.5 py-0.2 rounded border border-[#E5DEAA]">
                    回程選定・{inbound.optionLabel || '推薦班次'}
                  </span>
                  <span className="text-[#78928E]">{inbound.durationText}</span>
                </div>
                <div className="text-[11px] font-bold text-[#122B28] mt-0.5">
                  {inbound.trainType} <span className="text-[#8C7C20] font-black">{inbound.trainNo}</span>
                </div>
                <div className="flex justify-between items-center text-[10.5px] mt-1 font-bold text-[#122B28]">
                  <span>{itinerary.destinationStation.name} {inbound.departureTime} 開</span>
                  <span className="text-[#81D8CF]">➔</span>
                  <span>{itinerary.originStation.name} {inbound.arrivalTime} 到</span>
                </div>

                {inbound.isDirect === false || (inbound.transferCount && inbound.transferCount > 0) ? (
                  <div className="text-[9px] text-[#8C7C20] bg-[#FAF8E7] p-1 rounded mt-1 border border-[#E5DEAA]">
                    <strong>🔄 需轉乘 {inbound.transferCount || 1} 次：</strong>於【{inbound.transferStations?.join('、') || '轉乘站'}】轉車
                    {inbound.transferSummary && <div className="text-[8.5px] text-[#665A15] mt-0.5">{inbound.transferSummary}</div>}
                    {inbound.legs && inbound.legs.length > 0 && (
                      <div className="mt-0.5 space-y-0.5 text-[8.5px] text-[#546E6A] border-t border-[#E5DEAA] pt-0.5">
                        {inbound.legs.map((l, li) => (
                          <div key={li}>• 第{l.legIndex || li+1}段: {l.fromStation}➔{l.toStation} ({l.trainType} {l.trainNo}, {l.departureTime}開➔{l.arrivalTime}到{l.transferWaitMinutes ? `, 等候${l.transferWaitMinutes}分` : ''})</div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[9px] text-[#13695F] bg-[#E5FAF7] px-1 py-0.2 rounded mt-1 border border-[#81D8CF]/30">
                    🟢 直達列車・免轉乘
                  </div>
                )}

                <div className="text-[9px] text-[#546E6A] mt-1 flex justify-between border-t border-[#E5DEAA]/60 pt-0.5">
                  <span>單程票價約 NT$ {inbound.fareEstimate}</span>
                  <span className="text-[#78928E]">{inbound.features || '舒適返程'}</span>
                </div>
              </div>
            </div>

            {itinerary.trainRecommendation?.bookingTip && (
              <p className="text-[9px] text-[#665A15] bg-[#FAF8E7] p-1 rounded mt-1.5 border border-[#E5DEAA]">
                💡 <strong>訂票叮嚀：</strong>{itinerary.trainRecommendation.bookingTip}
              </p>
            )}
          </div>

          {/* 4. Section: Taiwan Tourist Shuttle (台灣好行) Dedicated Highlight Box */}
          {itinerary.transitGuide?.taiwanTripBus && (
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#E5FAF7] via-[#FAF8E7]/50 to-white border-2 border-[#81D8CF]/70">
              <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-[#81D8CF]/40">
                <div className="flex items-center space-x-1.5">
                  <div className="p-0.5 rounded bg-[#1A8F82] text-white">
                    <Bus className="w-3 h-3" />
                  </div>
                  <h2 className="text-[11px] font-bold text-[#122B28]">
                    台灣好行 Taiwan Tourist Shuttle 觀光接駁專車
                  </h2>
                </div>
                <span className="text-[9px] font-bold text-[#13695F]">
                  官方網站：https://www.taiwantrip.com.tw/
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-[9.5px]">
                {/* Route & Boarding */}
                <div className="p-1.5 rounded bg-white border border-[#81D8CF]/30">
                  <span className="font-bold text-[#13695F] block mb-0.5">🚍 推薦接駁路線與站點</span>
                  <p className="font-bold text-[#122B28] text-[10px]">{itinerary.transitGuide.taiwanTripBus.routeName}</p>
                  <p className="text-[#546E6A] mt-0.5 text-[8.5px]">搭乘處：{itinerary.transitGuide.taiwanTripBus.boardingLocation}</p>
                </div>

                {/* Highlights */}
                <div className="p-1.5 rounded bg-white border border-[#81D8CF]/30">
                  <span className="font-bold text-[#13695F] block mb-0.5">✨ 沿線串聯主要景點</span>
                  <p className="text-[#546E6A] text-[8.5px] leading-tight">
                    {(itinerary.transitGuide.taiwanTripBus.highlightSpots || []).join('、')}
                  </p>
                </div>

                {/* Fare & Tips */}
                <div className="p-1.5 rounded bg-white border border-[#81D8CF]/30">
                  <span className="font-bold text-[#13695F] block mb-0.5">💳 票價與 TPASS 優惠</span>
                  <p className="text-[#546E6A] text-[8.5px]">{itinerary.transitGuide.taiwanTripBus.fareOrPassInfo}</p>
                  {itinerary.transitGuide.taiwanTripBus.tips && (
                    <p className="text-[#8C7C20] mt-0.5 font-medium text-[8px]">💡 {itinerary.transitGuide.taiwanTripBus.tips}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Page 1 Footer */}
        <div className="pt-2 border-t border-[#E5DEAA] text-[9px] text-[#78928E] flex justify-between items-center">
          <span>台灣鐵道智慧旅遊指南・AI 一日遊行程規劃 (台鐵時刻與台灣好行整合)</span>
          <span className="font-bold text-[#1A8F82]">第 1 頁 / 共 {totalPages} 頁</span>
        </div>
      </div>

      {/* ==================== PAGE 2: 詳細景點時間表、在地美食與伴手禮 ==================== */}
      <div 
        className="pdf-page bg-white p-7 flex flex-col justify-between box-border"
        style={{ 
          width: '794px', 
          height: '1122px', 
          maxHeight: '1122px',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}
      >
        <div className="space-y-3">
          {/* Top banner strip echoing trip title */}
          <div className="flex items-center justify-between border-b-2 border-[#1A8F82] pb-1.5">
            <div className="flex items-center space-x-1.5">
              <span className="p-1 rounded bg-[#E5FAF7] text-[#13695F]">
                <Clock className="w-3.5 h-3.5 text-[#1A8F82]" />
              </span>
              <h2 className="text-[13px] font-black text-[#122B28]">
                【{itinerary.originStation.name} ➔ {itinerary.destinationStation.name}】詳細一日行程時間表與美食探索
              </h2>
            </div>
            <span className="text-[10px] text-[#546E6A] font-bold">
              出發日期：{itinerary.travelDate}
            </span>
          </div>

          {/* Stops List for Page 2 */}
          <div className="space-y-2.5">
            {page2Stops.map((stop, idx) => (
              <div 
                key={`stop-pdf-p2-${idx}`}
                className="p-2.5 rounded-lg border border-[#E5DEAA] bg-white shadow-2xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#1A8F82] text-white font-black text-[9px] flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-[10px] font-bold text-[#13695F] bg-[#E5FAF7] px-1.5 py-0.2 rounded border border-[#81D8CF]/40">
                      {stop.timeSlot}
                    </span>
                    <h3 className="text-[12px] font-black text-[#122B28]">
                      {stop.placeName}
                    </h3>
                  </div>
                  <span className="text-[9.5px] font-bold text-[#546E6A]">
                    {stop.estimatedCost ? `預估 NT$ ${stop.estimatedCost}` : '免費參觀'}
                  </span>
                </div>

                <p className="text-[10.5px] text-[#546E6A] mb-1 leading-snug">
                  {stop.description}
                </p>

                {/* Highlights & Transport Info */}
                <div className="grid grid-cols-2 gap-1 text-[9px] bg-[#FAF8E7]/70 p-1.5 rounded border border-[#E5DEAA]">
                  <div>
                    <span className="text-[#78928E] block text-[8.5px]">✨ 推薦亮點 / 必點美食</span>
                    <span className="font-bold text-[#122B28]">{stop.highlight}</span>
                  </div>
                  <div>
                    <span className="text-[#78928E] block text-[8.5px]">🚶 前往交通</span>
                    <span className="text-[#546E6A] font-medium">{stop.transportFromPrevious?.durationText}・{stop.transportFromPrevious?.details}</span>
                  </div>
                  {stop.address && (
                    <div className="col-span-2 text-[#78928E] text-[8.5px]">
                      📍 地址：{stop.address}
                    </div>
                  )}
                  {stop.tips && (
                    <div className="col-span-2 text-[#665A15] bg-[#FAF8E7] p-1 rounded border border-[#E5DEAA]/60 text-[8.5px]">
                      💡 導遊貼士：{stop.tips}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* If 2 pages total, render Local specialties & station amenities here */}
          {!isMultiPageStops && (
            <>
              {/* Local Food Specialties & Souvenirs */}
              {itinerary.localSpecialties && (
                <div className="p-2.5 rounded-lg bg-[#FAF8E7]/70 border border-[#E5DEAA]">
                  <h3 className="text-[11px] font-bold text-[#122B28] mb-1.5 flex items-center gap-1">
                    <Utensils className="w-3 h-3 text-[#1A8F82]" />
                    <span>{itinerary.destinationStation.name} 在地必吃名店與推薦伴手禮</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-[9.5px]">
                    <div className="p-1.5 bg-white rounded border border-[#E5DEAA]">
                      <strong className="text-[#13695F] block mb-0.5 text-[9px]">🍜 在地必吃推薦：</strong>
                      <div className="flex flex-wrap gap-1">
                        {itinerary.localSpecialties.mustEat.map((food, i) => (
                          <span key={i} className="px-1.5 py-0.2 rounded bg-[#FAF8E7] text-[#665A15] border border-[#E5DEAA] text-[8.5px]">
                            {food}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="p-1.5 bg-white rounded border border-[#E5DEAA]">
                      <strong className="text-[#8C7C20] block mb-0.5 text-[9px]">🎁 必買伴手禮清單：</strong>
                      <div className="flex flex-wrap gap-1">
                        {itinerary.localSpecialties.souvenirs.map((item, i) => (
                          <span key={i} className="px-1.5 py-0.2 rounded bg-[#E5FAF7] text-[#13695F] border border-[#81D8CF]/40 text-[8.5px]">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Station Amenities & Exit Guide */}
              {itinerary.transitGuide && (
                <div className="p-2 rounded-lg bg-white border border-[#E5DEAA] text-[9.5px]">
                  <div className="grid grid-cols-2 gap-2 text-[#546E6A]">
                    <div className="flex items-start gap-1">
                      <Bike className="w-3 h-3 text-[#1A8F82] flex-shrink-0 mt-0.5" />
                      <div><strong>YouBike 租借：</strong>{itinerary.transitGuide.youbikeInfo}</div>
                    </div>
                    <div className="flex items-start gap-1">
                      <Luggage className="w-3 h-3 text-[#1A8F82] flex-shrink-0 mt-0.5" />
                      <div><strong>出站與寄物：</strong>{itinerary.transitGuide.stationExitTips}</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Page 2 Footer */}
        <div className="pt-2 border-t border-[#E5DEAA] text-[9px] text-[#78928E] flex justify-between items-center">
          <span>台灣鐵道智慧旅遊指南・AI 一日遊行程規劃 (台鐵時刻與台灣好行整合)</span>
          <span className="font-bold text-[#1A8F82]">第 2 頁 / 共 {totalPages} 頁</span>
        </div>
      </div>

      {/* ==================== OPTIONAL PAGE 3 (If stops > 4) ==================== */}
      {isMultiPageStops && (
        <div 
          className="pdf-page bg-white p-7 flex flex-col justify-between box-border"
          style={{ 
            width: '794px', 
            height: '1122px', 
            maxHeight: '1122px',
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}
        >
          <div className="space-y-3">
            {/* Top banner strip */}
            <div className="flex items-center justify-between border-b-2 border-[#1A8F82] pb-1.5">
              <div className="flex items-center space-x-1.5">
                <span className="p-1 rounded bg-[#E5FAF7] text-[#13695F]">
                  <Clock className="w-3.5 h-3.5 text-[#1A8F82]" />
                </span>
                <h2 className="text-[13px] font-black text-[#122B28]">
                  【{itinerary.originStation.name} ➔ {itinerary.destinationStation.name}】午後行程與在地美食名店
                </h2>
              </div>
              <span className="text-[10px] text-[#546E6A] font-bold">
                出發日期：{itinerary.travelDate}
              </span>
            </div>

            {/* Remaining Stops */}
            <div className="space-y-2.5">
              {page3Stops.map((stop, idx) => (
                <div 
                  key={`stop-pdf-p3-${idx}`}
                  className="p-2.5 rounded-lg border border-[#E5DEAA] bg-white shadow-2xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-4 h-4 rounded-full bg-[#1A8F82] text-white font-black text-[9px] flex items-center justify-center flex-shrink-0">
                        {idx + 4}
                      </span>
                      <span className="text-[10px] font-bold text-[#13695F] bg-[#E5FAF7] px-1.5 py-0.2 rounded border border-[#81D8CF]/40">
                        {stop.timeSlot}
                      </span>
                      <h3 className="text-[12px] font-black text-[#122B28]">
                        {stop.placeName}
                      </h3>
                    </div>
                    <span className="text-[9.5px] font-bold text-[#546E6A]">
                      {stop.estimatedCost ? `預估 NT$ ${stop.estimatedCost}` : '免費參觀'}
                    </span>
                  </div>

                  <p className="text-[10.5px] text-[#546E6A] mb-1 leading-snug">
                    {stop.description}
                  </p>

                  <div className="grid grid-cols-2 gap-1 text-[9px] bg-[#FAF8E7]/70 p-1.5 rounded border border-[#E5DEAA]">
                    <div>
                      <span className="text-[#78928E] block text-[8.5px]">✨ 推薦亮點 / 必點美食</span>
                      <span className="font-bold text-[#122B28]">{stop.highlight}</span>
                    </div>
                    <div>
                      <span className="text-[#78928E] block text-[8.5px]">🚶 前往交通</span>
                      <span className="text-[#546E6A] font-medium">{stop.transportFromPrevious?.durationText}・{stop.transportFromPrevious?.details}</span>
                    </div>
                    {stop.address && (
                      <div className="col-span-2 text-[#78928E] text-[8.5px]">
                        📍 地址：{stop.address}
                      </div>
                    )}
                    {stop.tips && (
                      <div className="col-span-2 text-[#665A15] bg-[#FAF8E7] p-1 rounded border border-[#E5DEAA]/60 text-[8.5px]">
                        💡 導遊貼士：{stop.tips}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Local Food Specialties & Souvenirs on Page 3 */}
            {itinerary.localSpecialties && (
              <div className="p-2.5 rounded-lg bg-[#FAF8E7]/70 border border-[#E5DEAA]">
                <h3 className="text-[11px] font-bold text-[#122B28] mb-1.5 flex items-center gap-1">
                  <Utensils className="w-3 h-3 text-[#1A8F82]" />
                  <span>{itinerary.destinationStation.name} 在地必吃名店與推薦伴手禮</span>
                </h3>
                <div className="grid grid-cols-2 gap-2 text-[9.5px]">
                  <div className="p-1.5 bg-white rounded border border-[#E5DEAA]">
                    <strong className="text-[#13695F] block mb-0.5 text-[9px]">🍜 在地必吃推薦：</strong>
                    <div className="flex flex-wrap gap-1">
                      {itinerary.localSpecialties.mustEat.map((food, i) => (
                        <span key={i} className="px-1.5 py-0.2 rounded bg-[#FAF8E7] text-[#665A15] border border-[#E5DEAA] text-[8.5px]">
                          {food}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-1.5 bg-white rounded border border-[#E5DEAA]">
                    <strong className="text-[#8C7C20] block mb-0.5 text-[9px]">🎁 必買伴手禮清單：</strong>
                    <div className="flex flex-wrap gap-1">
                      {itinerary.localSpecialties.souvenirs.map((item, i) => (
                        <span key={i} className="px-1.5 py-0.2 rounded bg-[#E5FAF7] text-[#13695F] border border-[#81D8CF]/40 text-[8.5px]">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Station Amenities & Exit Guide on Page 3 */}
            {itinerary.transitGuide && (
              <div className="p-2 rounded-lg bg-white border border-[#E5DEAA] text-[9.5px]">
                <div className="grid grid-cols-2 gap-2 text-[#546E6A]">
                  <div className="flex items-start gap-1">
                    <Bike className="w-3 h-3 text-[#1A8F82] flex-shrink-0 mt-0.5" />
                    <div><strong>YouBike 租借：</strong>{itinerary.transitGuide.youbikeInfo}</div>
                  </div>
                  <div className="flex items-start gap-1">
                    <Luggage className="w-3 h-3 text-[#1A8F82] flex-shrink-0 mt-0.5" />
                    <div><strong>出站與寄物：</strong>{itinerary.transitGuide.stationExitTips}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Page 3 Footer */}
          <div className="pt-2 border-t border-[#E5DEAA] text-[9px] text-[#78928E] flex justify-between items-center">
            <span>台灣鐵道智慧旅遊指南・AI 一日遊行程規劃 (台鐵時刻與台灣好行整合)</span>
            <span className="font-bold text-[#1A8F82]">第 3 頁 / 共 {totalPages} 頁</span>
          </div>
        </div>
      )}
    </div>
  );
};
