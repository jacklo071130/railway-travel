import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  Loader2,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { DayItinerary, TrainTripOption } from '../types';
import { PdfPrintableSheet } from './PdfPrintableSheet';
import { exportElementToPdf } from '../utils/exportPdf';
import confetti from 'canvas-confetti';

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

  const handleDownloadPdf = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!printContentRef.current || isGenerating) return;

    try {
      setIsGenerating(true);
      setGenerateSuccess(false);

      await exportElementToPdf(printContentRef.current, itinerary);

      setGenerateSuccess(true);
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#1A8F82', '#5EC9BD', '#FAF8E7', '#F8F5D6']
        });
      } catch {
        // ignore
      }
      setTimeout(() => {
        setGenerateSuccess(false);
      }, 3500);
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
        <div className="modal-no-print flex items-center justify-between px-4 sm:px-6 py-3.5 bg-gradient-to-r from-[#0F3A35] via-[#13695F] to-[#1A8F82] border-b border-[#81D8CF]/30 sticky top-0 z-20">
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
                已整合選定車次轉乘指引、景點路線地圖、美食推薦與台灣好行觀光公車資訊（分頁保證不切字）
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

        {/* Modal Body - PDF Sheet Preview */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-[#0F3A35]/35 flex justify-center">
          <div 
            ref={printContentRef}
            className="w-full max-w-[794px] bg-white rounded-xl shadow-2xl overflow-hidden border border-[#E5DEAA]"
          >
            <PdfPrintableSheet
              itinerary={itinerary}
              selectedOutbound={selectedOutbound}
              selectedInbound={selectedInbound}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
