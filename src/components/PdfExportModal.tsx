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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto"
      onClick={handleClose}
      id="pdf-export-modal-backdrop"
    >
      <div 
        className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-800/95 border-b border-slate-700 sticky top-0 z-20">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>行程表 PDF 預覽與下載</span>
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  A4 排版最佳化
                </span>
              </h2>
              <p className="text-xs text-slate-400 hidden sm:block">
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
              className="px-3.5 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs sm:text-sm font-bold flex items-center space-x-1.5 sm:space-x-2 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>生成中...</span>
                </>
              ) : generateSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
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
              className="hidden sm:flex px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs sm:text-sm font-semibold items-center space-x-1.5 transition-colors border border-slate-600 cursor-pointer"
              title="使用瀏覽器列印或另存為 PDF"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>列印 / 另存</span>
            </button>

            {/* Prominent Close Button */}
            <button
              id="btn-close-pdf-modal"
              type="button"
              onClick={handleClose}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-700/80 hover:bg-rose-600 text-slate-200 hover:text-white border border-slate-600 hover:border-rose-500 flex items-center space-x-1 transition-all cursor-pointer shadow-sm active:scale-95"
              title="關閉預覽視窗 (Esc)"
              aria-label="關閉預覽視窗"
            >
              <X className="w-5 h-5" />
              <span className="hidden sm:inline text-xs font-semibold">關閉</span>
            </button>
          </div>
        </div>

        {/* Modal Body - PDF Sheet Preview Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/70 flex justify-center">
          
          {/* Printable Document Paper Card (Pure White A4-like container for pristine PDF output) */}
          <div 
            ref={printContentRef}
            id="pdf-document-printable-sheet"
            className="w-full max-w-[800px] bg-white text-slate-900 p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
          >
            {/* PDF Document Header */}
            <div className="border-b-2 border-blue-600 pb-4 mb-5">
              <div className="flex justify-between items-start">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-bold mb-1.5">
                    <Train className="w-3.5 h-3.5" />
                    <span>台鐵深度一日遊・行程指南</span>
                  </div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
                    {itinerary.title}
                  </h1>
                  <p className="text-sm font-medium text-slate-600">
                    {itinerary.subtitle}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">出發旅遊日期</span>
                  <span className="text-sm font-bold text-slate-800 flex items-center justify-end gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    {itinerary.travelDate}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {itinerary.originStation.name} ⇄ {itinerary.destinationStation.name}
                  </span>
                </div>
              </div>

              {/* Overview Summary & Metrics */}
              <div className="mt-3.5 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-700 leading-relaxed">
                {itinerary.preferences && (
                  <div className="flex flex-wrap items-center gap-1.5 mb-2 pb-2 border-b border-slate-200/80">
                    <span className="font-bold text-blue-900 text-[11px]">個人化設定:</span>
                    <span className="px-2 py-0.5 rounded bg-blue-100/80 text-blue-800 text-[10px] font-semibold">
                      {itinerary.preferences.style === 'gourmet' ? '🍜 美食老饕' :
                       itinerary.preferences.style === 'instagram' ? '📸 網美打卡' :
                       itinerary.preferences.style === 'culture' ? '🏛️ 歷史人文' :
                       itinerary.preferences.style === 'family' ? '👨‍👩‍👧 親子同樂' :
                       itinerary.preferences.style === 'nature' ? '🌲 自然步道' : '☕ 慢活悠閒'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-200/80 text-slate-800 text-[10px] font-medium">
                      {itinerary.preferences.companion === 'solo' ? '一人獨旅' :
                       itinerary.preferences.companion === 'couple' ? '情侶約會' :
                       itinerary.preferences.companion === 'family_elder' ? '長輩同行' :
                       itinerary.preferences.companion === 'family_kids' ? '親子家庭' : '好友同行'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-200/80 text-slate-800 text-[10px] font-medium">
                      {itinerary.preferences.pace === 'relaxed' ? '慢步調' :
                       itinerary.preferences.pace === 'packed' ? '精實踩點' : '經典適中'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100/80 text-emerald-800 text-[10px] font-semibold">
                      {itinerary.preferences.transport === 'walk_youbike' ? '步行+YouBike' :
                       itinerary.preferences.transport === 'public_bus' ? '公車客運' :
                       itinerary.preferences.transport === 'scooter_rental' ? '租機車' : '計程車'}
                    </span>
                    {itinerary.preferences.customNotes && (
                      <span className="px-2 py-0.5 rounded bg-amber-100/80 text-amber-900 text-[10px] font-medium">
                        需求: {itinerary.preferences.customNotes}
                      </span>
                    )}
                  </div>
                )}
                <span className="font-bold text-blue-900 mr-1">【行程亮點與特色】</span>
                {itinerary.summary}
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                <div className="bg-blue-50/60 p-2 rounded border border-blue-100/80">
                  <span className="text-slate-500 block text-[11px]">預估人均總花費</span>
                  <span className="font-extrabold text-blue-700 text-sm">約 NT$ {itinerary.estimatedTotalBudget}</span>
                </div>
                <div className="bg-emerald-50/60 p-2 rounded border border-emerald-100/80">
                  <span className="text-slate-500 block text-[11px]">建議站周邊交通</span>
                  <span className="font-bold text-emerald-800 text-xs">{itinerary.transitGuide?.recommendedMode || '步行 / YouBike'}</span>
                </div>
                <div className="bg-amber-50/60 p-2 rounded border border-amber-100/80">
                  <span className="text-slate-500 block text-[11px]">天候與穿著提醒</span>
                  <span className="font-medium text-amber-900 text-[11px] line-clamp-1">{itinerary.weatherAdvice || '穿著輕便好走的休閒鞋'}</span>
                </div>
              </div>
            </div>

            {/* Section 1: Taiwan Railway (台鐵) Timetable Section */}
            <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Train className="w-4 h-4 text-blue-600" />
                  <span>台鐵去回推薦班次與票價</span>
                </h2>
                <span className="text-[11px] text-slate-500">
                  台鐵官網：railway.gov.tw
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Outbound Box */}
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      去程・{outbound.optionLabel || '推薦班次'}
                    </span>
                    <span className="text-slate-500 text-[11px]">{outbound.durationText}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-1">
                    {outbound.trainType} <span className="text-blue-600 font-extrabold">{outbound.trainNo}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs mt-2 font-bold">
                    <span>{itinerary.originStation.name} {outbound.departureTime} 開</span>
                    <span className="text-slate-300">➔</span>
                    <span>{itinerary.destinationStation.name} {outbound.arrivalTime} 到</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1.5 flex justify-between border-t border-slate-100 pt-1">
                    <span>單程票價約 NT$ {outbound.fareEstimate}</span>
                    <span className="text-slate-400">{outbound.features || '對號座/區間'}</span>
                  </div>
                </div>

                {/* Inbound Box */}
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      回程・{inbound.optionLabel || '推薦班次'}
                    </span>
                    <span className="text-slate-500 text-[11px]">{inbound.durationText}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-1">
                    {inbound.trainType} <span className="text-indigo-600 font-extrabold">{inbound.trainNo}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs mt-2 font-bold">
                    <span>{itinerary.destinationStation.name} {inbound.departureTime} 開</span>
                    <span className="text-slate-300">➔</span>
                    <span>{itinerary.originStation.name} {inbound.arrivalTime} 到</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1.5 flex justify-between border-t border-slate-100 pt-1">
                    <span>單程票價約 NT$ {inbound.fareEstimate}</span>
                    <span className="text-slate-400">{inbound.features || '舒適返程'}</span>
                  </div>
                </div>
              </div>

              {itinerary.trainRecommendation?.bookingTip && (
                <p className="text-[11px] text-amber-800 bg-amber-50/80 p-2 rounded mt-2.5 border border-amber-200/60">
                  💡 <strong>訂票提醒：</strong>{itinerary.trainRecommendation.bookingTip}
                </p>
              )}
            </div>

            {/* Section 2: Full Detailed Timeline Stops */}
            <div className="mb-6">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-3 border-b pb-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>一日行程時間表與景點美食探索</span>
              </h2>

              <div className="space-y-3.5">
                {itinerary.stops.map((stop, idx) => (
                  <div 
                    key={`stop-pdf-${idx}`}
                    className="p-3.5 rounded-lg border border-slate-200 bg-white"
                    style={{ pageBreakInside: 'avoid' }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
                          {stop.timeSlot}
                        </span>
                        <h3 className="text-sm font-extrabold text-slate-900">
                          {stop.placeName}
                        </h3>
                      </div>
                      <span className="text-[11px] font-bold text-slate-500">
                        {stop.estimatedCost ? `預估 NT$ ${stop.estimatedCost}` : '免費參觀'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                      {stop.description}
                    </p>

                    {/* Highlights & Transport */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded border border-slate-100">
                      <div>
                        <span className="text-slate-400 block">✨ 核心亮點 / 必嚐推薦</span>
                        <span className="font-bold text-slate-800">{stop.highlight}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">🚶 前往交通</span>
                        <span className="text-slate-700 font-medium">{stop.transportFromPrevious?.durationText}・{stop.transportFromPrevious?.details}</span>
                      </div>
                      {stop.address && (
                        <div className="col-span-1 sm:col-span-2 text-slate-500">
                          📍 地址：{stop.address}
                        </div>
                      )}
                      {stop.tips && (
                        <div className="col-span-1 sm:col-span-2 text-amber-800 bg-amber-50 p-1.5 rounded">
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
              <div className="mb-4 p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs" style={{ pageBreakInside: 'avoid' }}>
                <h3 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>{itinerary.destinationStation.name} 站周邊設施與行李寄放</span>
                </h3>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
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
            <div className="pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400 flex justify-between items-center">
              <span>台灣鐵道智慧旅遊指南・AI 一日遊行程規劃</span>
              <span>生成日期：{itinerary.createdAt ? new Date(itinerary.createdAt).toLocaleDateString('zh-TW') : '本日'}</span>
            </div>
          </div>

        </div>

        {/* Modal Bottom Footer Bar */}
        <div className="px-5 py-3 bg-slate-800/90 border-t border-slate-700/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            按鍵盤 <kbd className="px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded border border-slate-600 text-[11px] font-mono">Esc</kbd> 或點擊視窗外背景亦可關閉
          </span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs sm:text-sm font-semibold transition-colors border border-slate-600 cursor-pointer"
            >
              關閉預覽
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
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
