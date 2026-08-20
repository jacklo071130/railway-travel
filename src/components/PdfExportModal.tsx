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
  CheckCircle2
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
      const filename = `${itinerary.title.replace(/[\\/:*?"<>|]/g, '_')}_台鐵一日遊行程表.pdf`;

      const opt = {
        margin: [10, 10, 10, 10], // top, left, bottom, right in mm
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true,
          scrollY: 0
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
    document.title = `${itinerary.title} - 台鐵一日遊行程表`;
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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F3A35]/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto"
      onClick={handleClose}
      id="pdf-export-modal-backdrop"
    >
      <div 
        className="bg-[#FAF8E7] border border-[#E5DEAA] w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-gradient-to-r from-[#0F3A35] via-[#13695F] to-[#1A8F82] border-b border-[#81D8CF]/30 sticky top-0 z-20">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#81D8CF]/25 text-[#F8F5D6] border border-[#81D8CF]/40">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>行程表 PDF 預覽與下載</span>
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-[#81D8CF]/30 text-[#FAF8E7] border border-[#81D8CF]/50">
                  A4 排版最佳化
                </span>
              </h2>
              <p className="text-xs text-[#FAF8E7]/85 hidden sm:block">
                可直接下載高畫質 PDF 文件隨身攜帶，或使用瀏覽器列印
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
                  <span>生成中...</span>
                </>
              ) : generateSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#13695F]" />
                  <span>已下載！</span>
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

            {/* Prominent Close Button */}
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0F3A35]/30 flex justify-center">
          
          {/* Printable Document Paper Card (Pure White A4-like container for pristine PDF output) */}
          <div 
            ref={printContentRef}
            id="pdf-document-printable-sheet"
            className="w-full max-w-[800px] bg-white text-[#122B28] p-6 sm:p-8 rounded-xl shadow-lg border border-[#E5DEAA]"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
          >
            {/* PDF Document Header */}
            <div className="border-b-2 border-[#1A8F82] pb-4 mb-5">
              <div className="flex justify-between items-start">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#E5FAF7] text-[#13695F] text-xs font-bold mb-1.5 border border-[#81D8CF]/40">
                    <Train className="w-3.5 h-3.5 text-[#1A8F82]" />
                    <span>台鐵深度一日遊・行程指南</span>
                  </div>
                  <h1 className="text-2xl font-black text-[#122B28] tracking-tight mb-1">
                    {itinerary.title}
                  </h1>
                  <p className="text-sm font-medium text-[#546E6A]">
                    {itinerary.subtitle}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#78928E] block">出發旅遊日期</span>
                  <span className="text-sm font-bold text-[#122B28] flex items-center justify-end gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#1A8F82]" />
                    {itinerary.travelDate}
                  </span>
                  <span className="text-[11px] text-[#546E6A] mt-1 block">
                    {itinerary.originStation.name} ⇄ {itinerary.destinationStation.name}
                  </span>
                </div>
              </div>

              {/* Overview Summary & Metrics */}
              <div className="mt-3.5 p-3 bg-[#FAF8E7] rounded-lg border border-[#E5DEAA] text-xs text-[#122B28] leading-relaxed">
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
                        需求: {itinerary.preferences.customNotes}
                      </span>
                    )}
                  </div>
                )}
                <span className="font-bold text-[#0F3A35] mr-1">【行程亮點與特色】</span>
                {itinerary.summary}
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                <div className="bg-[#E5FAF7] p-2 rounded border border-[#81D8CF]/40">
                  <span className="text-[#546E6A] block text-[11px]">預估人均總花費</span>
                  <span className="font-extrabold text-[#13695F] text-sm">約 NT$ {itinerary.estimatedTotalBudget}</span>
                </div>
                <div className="bg-[#FAF8E7] p-2 rounded border border-[#E5DEAA]">
                  <span className="text-[#546E6A] block text-[11px]">建議站周邊交通</span>
                  <span className="font-bold text-[#665A15] text-xs">{itinerary.transitGuide?.recommendedMode || '步行 / YouBike'}</span>
                </div>
                <div className="bg-[#FAF8E7] p-2 rounded border border-[#E5DEAA]">
                  <span className="text-[#546E6A] block text-[11px]">天候與穿著提醒</span>
                  <span className="font-medium text-[#8C7C20] text-[11px] line-clamp-1">{itinerary.weatherAdvice || '穿著輕便好走的休閒鞋'}</span>
                </div>
              </div>
            </div>

            {/* Section 1: Taiwan Railway (台鐵) Timetable Section */}
            <div className="mb-6 p-4 rounded-xl bg-[#FAF8E7]/50 border border-[#E5DEAA]">
              <div className="flex items-center justify-between mb-3 border-b border-[#E5DEAA] pb-2">
                <h2 className="text-sm font-bold text-[#122B28] flex items-center gap-1.5">
                  <Train className="w-4 h-4 text-[#1A8F82]" />
                  <span>台鐵去回推薦班次與票價</span>
                </h2>
                <span className="text-[11px] text-[#546E6A]">
                  台鐵官網：railway.gov.tw
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Outbound Box */}
                <div className="bg-white p-3 rounded-lg border border-[#E5DEAA]">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-[#13695F] bg-[#E5FAF7] px-2 py-0.5 rounded border border-[#81D8CF]/40">
                      去程・{outbound.optionLabel || '推薦班次'}
                    </span>
                    <span className="text-[#78928E] text-[11px]">{outbound.durationText}</span>
                  </div>
                  <div className="text-xs font-bold text-[#122B28] mt-1">
                    {outbound.trainType} <span className="text-[#1A8F82] font-extrabold">{outbound.trainNo}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs mt-2 font-bold text-[#122B28]">
                    <span>{itinerary.originStation.name} {outbound.departureTime} 開</span>
                    <span className="text-[#81D8CF]">➔</span>
                    <span>{itinerary.destinationStation.name} {outbound.arrivalTime} 到</span>
                  </div>
                  <div className="text-[11px] text-[#546E6A] mt-1.5 flex justify-between border-t border-[#E5DEAA]/60 pt-1">
                    <span>單程票價約 NT$ {outbound.fareEstimate}</span>
                    <span className="text-[#78928E]">{outbound.features || '對號座/區間'}</span>
                  </div>
                </div>

                {/* Inbound Box */}
                <div className="bg-white p-3 rounded-lg border border-[#E5DEAA]">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-[#665A15] bg-[#FAF8E7] px-2 py-0.5 rounded border border-[#E5DEAA]">
                      回程・{inbound.optionLabel || '推薦班次'}
                    </span>
                    <span className="text-[#78928E] text-[11px]">{inbound.durationText}</span>
                  </div>
                  <div className="text-xs font-bold text-[#122B28] mt-1">
                    {inbound.trainType} <span className="text-[#8C7C20] font-extrabold">{inbound.trainNo}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs mt-2 font-bold text-[#122B28]">
                    <span>{itinerary.destinationStation.name} {inbound.departureTime} 開</span>
                    <span className="text-[#81D8CF]">➔</span>
                    <span>{itinerary.originStation.name} {inbound.arrivalTime} 到</span>
                  </div>
                  <div className="text-[11px] text-[#546E6A] mt-1.5 flex justify-between border-t border-[#E5DEAA]/60 pt-1">
                    <span>單程票價約 NT$ {inbound.fareEstimate}</span>
                    <span className="text-[#78928E]">{inbound.features || '舒適返程'}</span>
                  </div>
                </div>
              </div>

              {itinerary.trainRecommendation?.bookingTip && (
                <p className="text-[11px] text-[#665A15] bg-[#FAF8E7] p-2 rounded mt-2.5 border border-[#E5DEAA]">
                  💡 <strong>訂票提醒：</strong>{itinerary.trainRecommendation.bookingTip}
                </p>
              )}
            </div>

            {/* Section 2: Full Detailed Timeline Stops */}
            <div className="mb-6">
              <h2 className="text-sm font-bold text-[#122B28] flex items-center gap-1.5 mb-3 border-b border-[#E5DEAA] pb-2">
                <Clock className="w-4 h-4 text-[#1A8F82]" />
                <span>一日行程時間表與景點美食探索</span>
              </h2>

              <div className="space-y-3.5">
                {itinerary.stops.map((stop, idx) => (
                  <div 
                    key={`stop-pdf-${idx}`}
                    className="p-3.5 rounded-lg border border-[#E5DEAA] bg-white"
                    style={{ pageBreakInside: 'avoid' }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-[#1A8F82] text-white font-black text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-[#13695F] bg-[#E5FAF7] px-2 py-0.5 rounded border border-[#81D8CF]/30">
                          {stop.timeSlot}
                        </span>
                        <h3 className="text-sm font-extrabold text-[#122B28]">
                          {stop.placeName}
                        </h3>
                      </div>
                      <span className="text-[11px] font-bold text-[#546E6A]">
                        {stop.estimatedCost ? `預估 NT$ ${stop.estimatedCost}` : '免費參觀'}
                      </span>
                    </div>

                    <p className="text-xs text-[#546E6A] mb-2 leading-relaxed">
                      {stop.description}
                    </p>

                    {/* Highlights & Transport */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-[#FAF8E7]/60 p-2.5 rounded border border-[#E5DEAA]">
                      <div>
                        <span className="text-[#78928E] block">✨ 核心亮點 / 必嚐推薦</span>
                        <span className="font-bold text-[#122B28]">{stop.highlight}</span>
                      </div>
                      <div>
                        <span className="text-[#78928E] block">🚶 前往交通</span>
                        <span className="text-[#546E6A] font-medium">{stop.transportFromPrevious?.durationText}・{stop.transportFromPrevious?.details}</span>
                      </div>
                      {stop.address && (
                        <div className="col-span-1 sm:col-span-2 text-[#78928E]">
                          📍 地址：{stop.address}
                        </div>
                      )}
                      {stop.tips && (
                        <div className="col-span-1 sm:col-span-2 text-[#665A15] bg-[#FAF8E7] p-1.5 rounded border border-[#E5DEAA]/60">
                          💡 達人貼士：{stop.tips}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Station Amenities & Luggage Storage */}
            {itinerary.stationAmenities && (
              <div className="mb-4 p-3.5 rounded-lg bg-[#FAF8E7]/60 border border-[#E5DEAA] text-xs" style={{ pageBreakInside: 'avoid' }}>
                <h3 className="font-bold text-[#122B28] mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#1A8F82]" />
                  <span>{itinerary.destinationStation.name} 站周邊設施與行李寄放</span>
                </h3>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#546E6A]">
                  <div>
                    <strong>🧳 行李寄放：</strong>{itinerary.stationAmenities.luggageStorage || '車站置物櫃或行李房'}
                  </div>
                  <div>
                    <strong>🚲 YouBike / 租車：</strong>{itinerary.stationAmenities.bikeRental || '站前設有公共自行車站點'}
                  </div>
                </div>
              </div>
            )}

            {/* Document Footer */}
            <div className="pt-3 border-t border-[#E5DEAA] text-center text-[10px] text-[#78928E] flex justify-between items-center">
              <span>台灣鐵道智慧旅遊指南・AI 一日遊行程規劃</span>
              <span>生成日期：{itinerary.createdAt ? new Date(itinerary.createdAt).toLocaleDateString('zh-TW') : '本日'}</span>
            </div>
          </div>

        </div>

        {/* Modal Bottom Footer Bar */}
        <div className="px-5 py-3 bg-[#FAF8E7] border-t border-[#E5DEAA] flex items-center justify-between">
          <span className="text-xs text-[#546E6A]">
            按鍵盤 <kbd className="px-1.5 py-0.5 bg-white text-[#122B28] rounded border border-[#E5DEAA] text-[11px] font-mono">Esc</kbd> 或點擊視窗外背景亦可關閉
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
              className="px-4 py-2 rounded-xl bg-[#1A8F82] hover:bg-[#13695F] text-white text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
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
