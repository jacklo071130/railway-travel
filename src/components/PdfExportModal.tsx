import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  Train, 
  Clock, 
  MapPin, 
  Calendar, 
  Loader2,
  CheckCircle2,
  Bus,
  Sparkles,
  Route,
  Utensils,
  ShoppingBag,
  DollarSign,
  Info,
  Footprints,
  Bike,
  Navigation,
  ExternalLink,
  GitMerge
} from 'lucide-react';
import { DayItinerary, TrainTripOption } from '../types';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  itinerary: DayItinerary;
  selectedOutbound?: TrainTripOption;
  selectedInbound?: TrainTripOption;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  itinerary,
  selectedOutbound,
  selectedInbound,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateSuccess, setGenerateSuccess] = useState(false);
  const printContentRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press & prevent background scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const outbound = selectedOutbound || itinerary.trainRecommendation.outbound;
  const inbound = selectedInbound || itinerary.trainRecommendation.inbound;

  const handleDownloadPdf = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!printContentRef.current || isGenerating) return;

    try {
      setIsGenerating(true);
      setGenerateSuccess(false);

      // Dynamically load html2pdf.js
      const html2pdfModule = await import('html2pdf.js');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const html2pdf = (html2pdfModule.default || html2pdfModule) as any;

      const element = printContentRef.current;
      const cleanTitle = itinerary.title.replace(/[\\/:*?"<>|]/g, '_');
      const filename = `${cleanTitle}_AI台鐵一日遊行程表_${itinerary.travelDate}.pdf`;

      const opt = {
        margin: [8, 8, 8, 8], // top, left, bottom, right in mm
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true,
          scrollY: 0,
          logging: false
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait' 
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await html2pdf().set(opt).from(element).save();

      setGenerateSuccess(true);
      setTimeout(() => {
        setGenerateSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('PDF generation error, falling back to window.print():', err);
      window.print();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBrowserPrint = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const originalTitle = document.title;
    document.title = `${itinerary.title} - AI台鐵一日遊行程表 (${itinerary.travelDate})`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1500);
  };

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F3A35]/85 backdrop-blur-md p-2 sm:p-5 overflow-y-auto"
      onClick={handleClose}
      id="pdf-export-modal-backdrop"
    >
      <div 
        className="bg-[#FAF8E7] border border-[#E5DEAA] w-full max-w-4xl max-h-[94vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-gradient-to-r from-[#0F3A35] via-[#13695F] to-[#1A8F82] border-b border-[#81D8CF]/30 sticky top-0 z-20">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#81D8CF]/25 text-[#F8F5D6] border border-[#81D8CF]/40">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>AI 整合行程 PDF 匯出預覽</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#81D8CF] text-[#0F3A35]">
                  含路線地圖・車次・台灣好行
                </span>
              </h2>
              <p className="text-xs text-[#FAF8E7]/85 hidden sm:block">
                已整合選定車次轉乘指引、景點路線地圖、美食推薦與台灣好行觀光公車資訊
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              id="btn-modal-download-pdf"
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="px-3.5 sm:px-4 py-2 rounded-xl bg-[#5EC9BD] hover:bg-[#81D8CF] active:scale-95 text-[#0F3A35] text-xs sm:text-sm font-bold flex items-center space-x-1.5 sm:space-x-2 shadow-lg shadow-[#81D8CF]/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#0F3A35]" />
                  <span>生成 PDF 中...</span>
                </>
              ) : generateSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#13695F]" />
                  <span>已成功下載！</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>下載 PDF 檔案</span>
                </>
              )}
            </button>

            <button
              id="btn-modal-print-pdf"
              type="button"
              onClick={handleBrowserPrint}
              className="hidden sm:flex px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-semibold items-center space-x-1.5 transition-colors border border-white/20 cursor-pointer"
              title="使用瀏覽器列印或另存為 PDF"
            >
              <Printer className="w-4 h-4 text-[#F8F5D6]" />
              <span>列印 / 另存</span>
            </button>

            {/* Close Button */}
            <button
              id="btn-close-pdf-modal"
              type="button"
              onClick={handleClose}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/15 hover:bg-rose-600 text-white border border-white/20 hover:border-rose-500 flex items-center space-x-1 transition-all cursor-pointer shadow-sm active:scale-95"
              title="關閉預覽視窗 (Esc)"
              aria-label="關閉預覽視窗"
            >
              <X className="w-5 h-5" />
              <span className="hidden sm:inline text-xs font-semibold">關閉</span>
            </button>
          </div>
        </div>

        {/* Modal Body - PDF Sheet Preview Container */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-[#0F3A35]/35 flex justify-center">
          
          {/* Printable Document Paper Card (Pure White A4-like container for pristine PDF output) */}
          <div 
            ref={printContentRef}
            id="pdf-document-printable-sheet"
            className="w-full max-w-[800px] bg-white text-[#122B28] p-6 sm:p-8 rounded-xl shadow-lg border border-[#E5DEAA]"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
          >
            {/* 1. PDF Header: Title, Date, Origin & Destination */}
            <div className="border-b-2 border-[#1A8F82] pb-4 mb-4">
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-4">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#E5FAF7] text-[#13695F] text-xs font-bold mb-1.5 border border-[#81D8CF]/40">
                    <Train className="w-3.5 h-3.5 text-[#1A8F82]" />
                    <span>台鐵深度一日遊・AI 智慧旅行指南</span>
                  </div>
                  <h1 className="text-2xl font-black text-[#122B28] tracking-tight mb-1">
                    {itinerary.title}
                  </h1>
                  <p className="text-sm font-medium text-[#546E6A]">
                    {itinerary.subtitle}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-[11px] text-[#78928E] block">出發旅遊日期</span>
                  <span className="text-sm font-bold text-[#122B28] flex items-center justify-end gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#1A8F82]" />
                    {itinerary.travelDate}
                  </span>
                  <span className="text-xs font-extrabold text-[#13695F] mt-0.5 block bg-[#FAF8E7] px-2 py-0.5 rounded border border-[#E5DEAA]">
                    {itinerary.originStation.name} ⇄ {itinerary.destinationStation.name}
                  </span>
                </div>
              </div>

              {/* Overview Summary & Personalized Profile */}
              <div className="mt-3 p-3 bg-[#FAF8E7] rounded-lg border border-[#E5DEAA] text-xs text-[#122B28] leading-relaxed">
                {itinerary.preferences && (
                  <div className="flex flex-wrap items-center gap-1.5 mb-2 pb-2 border-b border-[#E5DEAA]">
                    <span className="font-bold text-[#0F3A35] text-[11px]">個人化設定:</span>
                    <span className="px-2 py-0.5 rounded bg-[#E5FAF7] text-[#13695F] text-[10px] font-semibold border border-[#81D8CF]/40">
                      {itinerary.preferences.style === 'gourmet' ? '🍜 美食老饕' :
                       itinerary.preferences.style === 'instagram' ? '📸 網美打卡' :
                       itinerary.preferences.style === 'culture' ? '🏛️ 歷史人文' :
                       itinerary.preferences.style === 'family' ? '👨‍👩‍👧 親子同樂' :
                       itinerary.preferences.style === 'nature' ? '🌲 自然步道' : '☕ 慢活悠閒'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white text-[#546E6A] text-[10px] font-medium border border-[#E5DEAA]">
                      {itinerary.preferences.companion === 'solo' ? '一人獨旅' :
                       itinerary.preferences.companion === 'couple' ? '情侶約會' :
                       itinerary.preferences.companion === 'family_elder' ? '長輩同行' :
                       itinerary.preferences.companion === 'family_kids' ? '親子家庭' : '好友同行'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white text-[#546E6A] text-[10px] font-medium border border-[#E5DEAA]">
                      {itinerary.preferences.pace === 'relaxed' ? '慢步調' :
                       itinerary.preferences.pace === 'packed' ? '精實踩點' : '經典適中'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#E5FAF7] text-[#13695F] text-[10px] font-semibold border border-[#81D8CF]/40">
                      {itinerary.preferences.transport === 'walk_youbike' ? '步行+YouBike' :
                       itinerary.preferences.transport === 'public_bus' ? '公車客運' :
                       itinerary.preferences.transport === 'scooter_rental' ? '租機車' : '計程車'}
                    </span>
                    {itinerary.preferences.customNotes && (
                      <span className="px-2 py-0.5 rounded bg-[#FAF8E7] text-[#665A15] text-[10px] font-medium border border-[#E5DEAA]">
                        備註: {itinerary.preferences.customNotes}
                      </span>
                    )}
                  </div>
                )}
                <span className="font-bold text-[#0F3A35] mr-1">【行程特色摘要】</span>
                {itinerary.summary}
              </div>

              {/* Key Metrics Strip */}
              <div className="grid grid-cols-3 gap-2 mt-2.5 text-xs">
                <div className="bg-[#E5FAF7] p-2 rounded border border-[#81D8CF]/40">
                  <span className="text-[#546E6A] block text-[10px]">預估人均總花費</span>
                  <span className="font-extrabold text-[#13695F] text-sm">約 NT$ {itinerary.estimatedTotalBudget}</span>
                </div>
                <div className="bg-[#FAF8E7] p-2 rounded border border-[#E5DEAA]">
                  <span className="text-[#546E6A] block text-[10px]">主要周邊交通方式</span>
                  <span className="font-bold text-[#665A15] text-xs">{itinerary.transitGuide?.recommendedMode || '步行 / YouBike / 接駁'}</span>
                </div>
                <div className="bg-[#FAF8E7] p-2 rounded border border-[#E5DEAA]">
                  <span className="text-[#546E6A] block text-[10px]">天候穿著建議</span>
                  <span className="font-medium text-[#8C7C20] text-[11px] truncate block">{itinerary.weatherAdvice || '輕便休閒服裝與好走步鞋'}</span>
                </div>
              </div>
            </div>

            {/* 2. Visual Route Map & Spots Topology Diagram */}
            <div className="mb-5 p-3.5 rounded-xl bg-gradient-to-br from-[#FAF8E7]/60 via-white to-[#E5FAF7]/40 border border-[#E5DEAA]" style={{ pageBreakInside: 'avoid' }}>
              <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[#E5DEAA]">
                <div className="flex items-center space-x-2">
                  <Route className="w-4 h-4 text-[#1A8F82]" />
                  <h2 className="text-xs font-bold text-[#122B28]">
                    行程路線與景點地圖導覽圖
                  </h2>
                </div>
                <span className="text-[10px] text-[#546E6A]">
                  共 {itinerary.stops.length} 個景點停靠站點
                </span>
              </div>

              {/* Route Sequence Flow Diagram */}
              <div className="relative pt-1 pb-2">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {/* Origin Station Badge */}
                  <div className="inline-flex items-center px-2 py-1 rounded-md bg-[#13695F] text-white text-[11px] font-bold shadow-xs">
                    <Train className="w-3 h-3 mr-1 text-[#81D8CF]" />
                    <span>起點：{itinerary.originStation.name}站</span>
                  </div>

                  <span className="text-[#81D8CF] text-xs font-bold">➔</span>

                  {/* Destination Station Badge */}
                  <div className="inline-flex items-center px-2 py-1 rounded-md bg-[#1A8F82] text-white text-[11px] font-bold shadow-xs">
                    <MapPin className="w-3 h-3 mr-1 text-[#FAF8E7]" />
                    <span>抵達：{itinerary.destinationStation.name}站</span>
                  </div>

                  {/* Stops Sequence Badges */}
                  {itinerary.stops.map((stop, idx) => (
                    <React.Fragment key={`map-flow-${idx}`}>
                      <span className="text-[#81D8CF] text-xs font-bold">➔</span>
                      <div className="inline-flex items-center px-2 py-1 rounded-md bg-white text-[#122B28] text-[11px] font-bold border border-[#81D8CF]/60 shadow-xs">
                        <span className="w-3.5 h-3.5 rounded-full bg-[#1A8F82] text-white text-[9px] flex items-center justify-center mr-1 font-black">
                          {idx + 1}
                        </span>
                        <span className="truncate max-w-[120px]">{stop.placeName}</span>
                      </div>
                    </React.Fragment>
                  ))}

                  <span className="text-[#81D8CF] text-xs font-bold">➔</span>

                  {/* Return Station Badge */}
                  <div className="inline-flex items-center px-2 py-1 rounded-md bg-[#0F3A35] text-white text-[11px] font-bold shadow-xs">
                    <Train className="w-3 h-3 mr-1 text-[#F8F5D6]" />
                    <span>賦歸：{itinerary.originStation.name}站</span>
                  </div>
                </div>

                {/* Spot GPS & Location Overview Grid */}
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] text-[#546E6A]">
                  {itinerary.stops.map((stop, idx) => (
                    <div key={`stop-loc-${idx}`} className="p-2 rounded bg-white border border-[#E5DEAA] flex flex-col justify-between">
                      <div className="flex items-center gap-1 font-bold text-[#122B28]">
                        <span className="text-[#1A8F82] font-black">{idx + 1}.</span>
                        <span className="truncate">{stop.placeName}</span>
                      </div>
                      <div className="text-[9px] text-[#78928E] mt-0.5 flex items-center gap-1">
                        <Navigation className="w-2.5 h-2.5 text-[#1A8F82]" />
                        <span>{stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}</span>
                      </div>
                      <div className="text-[9px] text-[#546E6A] truncate mt-0.5">
                        📍 {stop.address}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Section: Selected Train Options & Detailed Transfer Guide */}
            <div className="mb-5 p-3.5 rounded-xl bg-[#FAF8E7]/50 border border-[#E5DEAA]" style={{ pageBreakInside: 'avoid' }}>
              <div className="flex items-center justify-between mb-2.5 border-b border-[#E5DEAA] pb-1.5">
                <h2 className="text-xs font-bold text-[#122B28] flex items-center gap-1.5">
                  <Train className="w-4 h-4 text-[#1A8F82]" />
                  <span>選定台鐵車次及轉乘詳細指引</span>
                </h2>
                <span className="text-[10px] text-[#546E6A]">
                  台鐵官網時刻：railway.gov.tw
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Outbound Box */}
                <div className="bg-white p-3 rounded-lg border border-[#E5DEAA]">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-[#13695F] bg-[#E5FAF7] px-2 py-0.5 rounded border border-[#81D8CF]/40 text-[11px]">
                      去程選定・{outbound.optionLabel || '推薦班次'}
                    </span>
                    <span className="text-[#78928E] text-[11px]">{outbound.durationText}</span>
                  </div>
                  <div className="text-xs font-bold text-[#122B28] mt-1">
                    {outbound.trainType} <span className="text-[#1A8F82] font-extrabold">{outbound.trainNo}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs mt-1.5 font-bold text-[#122B28]">
                    <span>{itinerary.originStation.name} {outbound.departureTime} 開</span>
                    <span className="text-[#81D8CF]">➔</span>
                    <span>{itinerary.destinationStation.name} {outbound.arrivalTime} 到</span>
                  </div>

                  {outbound.isDirect === false || (outbound.transferCount && outbound.transferCount > 0) ? (
                    <div className="text-[10px] text-[#8C7C20] bg-[#FAF8E7] p-1.5 rounded mt-2 border border-[#E5DEAA]">
                      <strong>🔄 需轉乘 {outbound.transferCount || 1} 次：</strong>於【{outbound.transferStations?.join('、') || '轉乘站'}】轉車
                      {outbound.transferSummary && <div className="text-[9px] text-[#665A15] mt-0.5">{outbound.transferSummary}</div>}
                      {outbound.legs && outbound.legs.length > 0 && (
                        <div className="mt-1 space-y-0.5 text-[9px] text-[#546E6A] border-t border-[#E5DEAA] pt-1">
                          {outbound.legs.map((l, li) => (
                            <div key={li}>• 第{l.legIndex || li+1}段: {l.fromStation}➔{l.toStation} ({l.trainType} {l.trainNo}, {l.departureTime}開➔{l.arrivalTime}到{l.transferWaitMinutes ? `, 等候${l.transferWaitMinutes}分` : ''})</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-[10px] text-[#13695F] bg-[#E5FAF7] px-1.5 py-0.5 rounded mt-1.5 border border-[#81D8CF]/30">
                      🟢 直達列車・免轉乘
                    </div>
                  )}

                  <div className="text-[10px] text-[#546E6A] mt-1.5 flex justify-between border-t border-[#E5DEAA]/60 pt-1">
                    <span>單程票價約 NT$ {outbound.fareEstimate}</span>
                    <span className="text-[#78928E]">{outbound.features || '對號座/區間'}</span>
                  </div>
                </div>

                {/* Inbound Box */}
                <div className="bg-white p-3 rounded-lg border border-[#E5DEAA]">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-[#665A15] bg-[#FAF8E7] px-2 py-0.5 rounded border border-[#E5DEAA] text-[11px]">
                      回程選定・{inbound.optionLabel || '推薦班次'}
                    </span>
                    <span className="text-[#78928E] text-[11px]">{inbound.durationText}</span>
                  </div>
                  <div className="text-xs font-bold text-[#122B28] mt-1">
                    {inbound.trainType} <span className="text-[#8C7C20] font-extrabold">{inbound.trainNo}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs mt-1.5 font-bold text-[#122B28]">
                    <span>{itinerary.destinationStation.name} {inbound.departureTime} 開</span>
                    <span className="text-[#81D8CF]">➔</span>
                    <span>{itinerary.originStation.name} {inbound.arrivalTime} 到</span>
                  </div>

                  {inbound.isDirect === false || (inbound.transferCount && inbound.transferCount > 0) ? (
                    <div className="text-[10px] text-[#8C7C20] bg-[#FAF8E7] p-1.5 rounded mt-2 border border-[#E5DEAA]">
                      <strong>🔄 需轉乘 {inbound.transferCount || 1} 次：</strong>於【{inbound.transferStations?.join('、') || '轉乘站'}】轉車
                      {inbound.transferSummary && <div className="text-[9px] text-[#665A15] mt-0.5">{inbound.transferSummary}</div>}
                      {inbound.legs && inbound.legs.length > 0 && (
                        <div className="mt-1 space-y-0.5 text-[9px] text-[#546E6A] border-t border-[#E5DEAA] pt-1">
                          {inbound.legs.map((l, li) => (
                            <div key={li}>• 第{l.legIndex || li+1}段: {l.fromStation}➔{l.toStation} ({l.trainType} {l.trainNo}, {l.departureTime}開➔{l.arrivalTime}到{l.transferWaitMinutes ? `, 等候${l.transferWaitMinutes}分` : ''})</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-[10px] text-[#13695F] bg-[#E5FAF7] px-1.5 py-0.5 rounded mt-1.5 border border-[#81D8CF]/30">
                      🟢 直達列車・免轉乘
                    </div>
                  )}

                  <div className="text-[10px] text-[#546E6A] mt-1.5 flex justify-between border-t border-[#E5DEAA]/60 pt-1">
                    <span>單程票價約 NT$ {inbound.fareEstimate}</span>
                    <span className="text-[#78928E]">{inbound.features || '舒適返程'}</span>
                  </div>
                </div>
              </div>

              {itinerary.trainRecommendation?.bookingTip && (
                <p className="text-[10px] text-[#665A15] bg-[#FAF8E7] p-1.5 rounded mt-2 border border-[#E5DEAA]">
                  💡 <strong>訂票叮嚀：</strong>{itinerary.trainRecommendation.bookingTip}
                </p>
              )}
            </div>

            {/* 4. Section: Taiwan Tourist Shuttle (台灣好行) Dedicated Highlight Box */}
            {itinerary.transitGuide?.taiwanTripBus && (
              <div className="mb-5 p-3.5 rounded-xl bg-gradient-to-br from-[#E5FAF7] via-[#FAF8E7]/50 to-white border-2 border-[#81D8CF]/70" style={{ pageBreakInside: 'avoid' }}>
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#81D8CF]/40">
                  <div className="flex items-center space-x-2">
                    <div className="p-1 rounded-md bg-[#1A8F82] text-white">
                      <Bus className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h2 className="text-xs font-bold text-[#122B28]">
                        台灣好行 Taiwan Tourist Shuttle 觀光接駁專車
                      </h2>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#13695F]">
                    官方網站：https://www.taiwantrip.com.tw/
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
                  {/* Route & Boarding */}
                  <div className="p-2 rounded bg-white border border-[#81D8CF]/30">
                    <span className="font-bold text-[#13695F] block mb-0.5">🚍 推薦接駁路線與站點</span>
                    <p className="font-bold text-[#122B28] text-[11px]">{itinerary.transitGuide.taiwanTripBus.routeName}</p>
                    <p className="text-[#546E6A] mt-0.5">搭乘處：{itinerary.transitGuide.taiwanTripBus.boardingLocation}</p>
                  </div>

                  {/* Highlights */}
                  <div className="p-2 rounded bg-white border border-[#81D8CF]/30">
                    <span className="font-bold text-[#13695F] block mb-0.5">✨ 沿線串聯主要景點</span>
                    <p className="text-[#546E6A] leading-relaxed">
                      {(itinerary.transitGuide.taiwanTripBus.highlightSpots || []).join('、')}
                    </p>
                  </div>

                  {/* Fare & Tips */}
                  <div className="p-2 rounded bg-white border border-[#81D8CF]/30">
                    <span className="font-bold text-[#13695F] block mb-0.5">💳 票價與 TPASS 優惠</span>
                    <p className="text-[#546E6A]">{itinerary.transitGuide.taiwanTripBus.fareOrPassInfo}</p>
                    {itinerary.transitGuide.taiwanTripBus.tips && (
                      <p className="text-[#8C7C20] mt-0.5 font-medium">💡 {itinerary.transitGuide.taiwanTripBus.tips}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 5. Section: Detailed Day Timeline Stops & Food Highlights */}
            <div className="mb-5">
              <h2 className="text-xs font-bold text-[#122B28] flex items-center gap-1.5 mb-2.5 border-b border-[#E5DEAA] pb-1.5">
                <Clock className="w-4 h-4 text-[#1A8F82]" />
                <span>詳細一日行程時間表與景點美食探索</span>
              </h2>

              <div className="space-y-3">
                {itinerary.stops.map((stop, idx) => (
                  <div 
                    key={`stop-pdf-${idx}`}
                    className="p-3 rounded-lg border border-[#E5DEAA] bg-white"
                    style={{ pageBreakInside: 'avoid' }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="w-4 h-4 rounded-full bg-[#1A8F82] text-white font-black text-[10px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-[11px] font-bold text-[#13695F] bg-[#E5FAF7] px-1.5 py-0.2 rounded border border-[#81D8CF]/30">
                          {stop.timeSlot}
                        </span>
                        <h3 className="text-xs font-extrabold text-[#122B28]">
                          {stop.placeName}
                        </h3>
                      </div>
                      <span className="text-[10px] font-bold text-[#546E6A]">
                        {stop.estimatedCost ? `預估 NT$ ${stop.estimatedCost}` : '免費參觀'}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#546E6A] mb-1.5 leading-relaxed">
                      {stop.description}
                    </p>

                    {/* Highlights & Transport Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px] bg-[#FAF8E7]/60 p-2 rounded border border-[#E5DEAA]">
                      <div>
                        <span className="text-[#78928E] block">✨ 推薦亮點 / 必點美食</span>
                        <span className="font-bold text-[#122B28]">{stop.highlight}</span>
                      </div>
                      <div>
                        <span className="text-[#78928E] block">🚶 前往交通</span>
                        <span className="text-[#546E6A] font-medium">{stop.transportFromPrevious?.durationText}・{stop.transportFromPrevious?.details}</span>
                      </div>
                      {stop.address && (
                        <div className="col-span-1 sm:col-span-2 text-[#78928E] text-[9.5px]">
                          📍 地址：{stop.address}
                        </div>
                      )}
                      {stop.tips && (
                        <div className="col-span-1 sm:col-span-2 text-[#665A15] bg-[#FAF8E7] p-1 rounded border border-[#E5DEAA]/60 text-[9.5px]">
                          💡 導遊貼士：{stop.tips}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. Section: Local Food Specialties & Souvenirs */}
            {itinerary.localSpecialties && (
              <div className="mb-4 p-3 rounded-lg bg-[#FAF8E7]/70 border border-[#E5DEAA]" style={{ pageBreakInside: 'avoid' }}>
                <h3 className="text-xs font-bold text-[#122B28] mb-2 flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-[#1A8F82]" />
                  <span>{itinerary.destinationStation.name} 在地必吃名店與推薦伴手禮</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2 bg-white rounded border border-[#E5DEAA]">
                    <strong className="text-[#13695F] block mb-1">🍜 在地必吃推薦：</strong>
                    <div className="flex flex-wrap gap-1">
                      {itinerary.localSpecialties.mustEat.map((food, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-[#FAF8E7] text-[#665A15] border border-[#E5DEAA]">
                          {food}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-2 bg-white rounded border border-[#E5DEAA]">
                    <strong className="text-[#8C7C20] block mb-1">🎁 必買伴手禮清單：</strong>
                    <div className="flex flex-wrap gap-1">
                      {itinerary.localSpecialties.souvenirs.map((item, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-[#E5FAF7] text-[#13695F] border border-[#81D8CF]/40">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 7. Section: Station Amenities & Exit Guide */}
            {itinerary.transitGuide && (
              <div className="mb-3 p-3 rounded-lg bg-white border border-[#E5DEAA] text-[10px]" style={{ pageBreakInside: 'avoid' }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#546E6A]">
                  <div><strong>🚲 YouBike / 租借站：</strong>{itinerary.transitGuide.youbikeInfo}</div>
                  <div><strong>🚉 車站出站與行李寄放：</strong>{itinerary.transitGuide.stationExitTips}</div>
                </div>
              </div>
            )}

            {/* Document Footer */}
            <div className="pt-2.5 border-t border-[#E5DEAA] text-center text-[9px] text-[#78928E] flex justify-between items-center">
              <span>台灣鐵道智慧旅遊指南・AI 一日遊行程規劃 (支援台鐵時刻與台灣好行)</span>
              <span>生成日期：{itinerary.createdAt ? new Date(itinerary.createdAt).toLocaleDateString('zh-TW') : '本日'}</span>
            </div>
          </div>

        </div>

        {/* Modal Bottom Footer Bar */}
        <div className="px-4 sm:px-6 py-3 bg-[#FAF8E7] border-t border-[#E5DEAA] flex items-center justify-between">
          <span className="text-xs text-[#546E6A]">
            按鍵盤 <kbd className="px-1.5 py-0.5 bg-white text-[#122B28] rounded border border-[#E5DEAA] text-[11px] font-mono">Esc</kbd> 即可關閉預覽
          </span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-[#F8F5D6] text-[#546E6A] hover:text-[#122B28] text-xs sm:text-sm font-semibold transition-colors border border-[#E5DEAA] cursor-pointer"
            >
              關閉預覽
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl bg-[#1A8F82] hover:bg-[#13695F] text-white text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>下載 PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
