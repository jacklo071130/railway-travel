import React, { useState } from 'react';
import {
  Train,
  Clock,
  MapPin,
  Navigation,
  ExternalLink,
  Bookmark,
  Check,
  Copy,
  FileDown,
  Utensils,
  Camera,
  Landmark,
  Trees,
  ShoppingBag,
  Info,
  Footprints,
  Bike,
  Bus,
  Car,
  DollarSign,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { DayItinerary, ItineraryStop } from '../types';
import confetti from 'canvas-confetti';
import { PdfExportModal } from './PdfExportModal';

interface ItineraryViewProps {
  itinerary: DayItinerary;
  onSaveTrip: (itinerary: DayItinerary) => void;
  isSaved: boolean;
  onSelectStopOnMap?: (stop: ItineraryStop) => void;
}

export const ItineraryView: React.FC<ItineraryViewProps> = ({
  itinerary,
  onSaveTrip,
  isSaved,
  onSelectStopOnMap,
}) => {
  const [copied, setCopied] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Normalize 3 Outbound Train Options
  const outboundList = itinerary.trainRecommendation.outboundList && itinerary.trainRecommendation.outboundList.length > 0
    ? itinerary.trainRecommendation.outboundList
    : [
        {
          optionLabel: '早鳥首選',
          trainType: '新自強號 (EMU3000)',
          trainNo: '自強 408次',
          departureTime: '07:40',
          arrivalTime: '08:52',
          fareEstimate: itinerary.trainRecommendation.outbound.fareEstimate || 218,
          durationText: '約1小時12分',
          features: '全車對號座・晨間抵達探索',
        },
        {
          optionLabel: '主力推薦',
          ...itinerary.trainRecommendation.outbound,
          features: itinerary.trainRecommendation.outbound.features || '黃金黃金時段・最省時班次',
        },
        {
          optionLabel: '悠閒出發',
          trainType: '區間快車 / 自強號',
          trainNo: '區快 4018次',
          departureTime: '09:20',
          arrivalTime: '10:45',
          fareEstimate: Math.max(100, (itinerary.trainRecommendation.outbound.fareEstimate || 218) - 50),
          durationText: '約1小時25分',
          features: '免劃位・可刷 TPASS 悠遊卡',
        },
      ];

  // Normalize 3 Inbound Train Options
  const inboundList = itinerary.trainRecommendation.inboundList && itinerary.trainRecommendation.inboundList.length > 0
    ? itinerary.trainRecommendation.inboundList
    : [
        {
          optionLabel: '提早賦歸',
          trainType: '自強號',
          trainNo: '自強 223次',
          departureTime: '16:50',
          arrivalTime: '18:10',
          fareEstimate: itinerary.trainRecommendation.inbound.fareEstimate || 218,
          durationText: '約1小時20分',
          features: '避開尖峰人潮・輕鬆返家',
        },
        {
          optionLabel: '主力推薦',
          ...itinerary.trainRecommendation.inbound,
          features: itinerary.trainRecommendation.inbound.features || '完美一日遊收尾・車上享便當',
        },
        {
          optionLabel: '晚間漫遊',
          trainType: '自強號 / 區間快',
          trainNo: '自強 285次',
          departureTime: '19:15',
          arrivalTime: '20:38',
          fareEstimate: itinerary.trainRecommendation.inbound.fareEstimate || 218,
          durationText: '約1小時23分',
          features: '夜市商圈逛足・盡享夜景',
        },
      ];

  // Initialize selected indices
  const initialOutboundIdx = outboundList.findIndex(t => t.optionLabel?.includes('主力')) !== -1
    ? outboundList.findIndex(t => t.optionLabel?.includes('主力'))
    : 0;
  const initialInboundIdx = inboundList.findIndex(t => t.optionLabel?.includes('主力')) !== -1
    ? inboundList.findIndex(t => t.optionLabel?.includes('主力'))
    : 0;

  const [selectedOutboundIdx, setSelectedOutboundIdx] = useState(initialOutboundIdx);
  const [selectedInboundIdx, setSelectedInboundIdx] = useState(initialInboundIdx);

  const activeOutbound = outboundList[selectedOutboundIdx] || outboundList[0];
  const activeInbound = inboundList[selectedInboundIdx] || inboundList[0];

  const handleCopyText = () => {
    const outboundSummary = outboundList
      .map((t, i) => `  [${t.optionLabel || `時段${i+1}`}] ${t.trainType} ${t.trainNo} (${t.departureTime}➔${t.arrivalTime}, 約NT$${t.fareEstimate})${i === selectedOutboundIdx ? ' ★已選' : ''}`)
      .join('\n');
    const inboundSummary = inboundList
      .map((t, i) => `  [${t.optionLabel || `時段${i+1}`}] ${t.trainType} ${t.trainNo} (${t.departureTime}➔${t.arrivalTime}, 約NT$${t.fareEstimate})${i === selectedInboundIdx ? ' ★已選' : ''}`)
      .join('\n');

    const text = `🚂【${itinerary.title}】\n📅 旅遊日期：${itinerary.travelDate}\n💰 預估人均花費：約 NT$ ${itinerary.estimatedTotalBudget}\n\n🚆【台鐵去程推薦班次 (3班時段)】\n${outboundSummary}\n\n🚆【台鐵回程推薦班次 (3班時段)】\n${inboundSummary}\n\n🗺️【一日遊行程時間表】\n${itinerary.stops
      .map(
        (s, idx) =>
          `${idx + 1}. [${s.timeSlot}] ${s.placeName} (${s.highlight})\n   📍 地址：${s.address}\n   🚶 交通：${s.transportFromPrevious.durationText} - ${s.transportFromPrevious.details}\n   💡 導遊貼士：${s.tips || ''}`
      )
      .join('\n\n')}\n\n🍜 必吃美食：${itinerary.localSpecialties.mustEat.join('、')}\n🎁 必買伴手禮：${itinerary.localSpecialties.souvenirs.join('、')}\n\n台鐵官網時刻查詢：https://www.railway.gov.tw/tra-tip-web/tip`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSaveWithCelebration = () => {
    onSaveTrip(itinerary);
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {
      // ignore
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'food':
        return {
          label: '在地美食',
          bg: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: <Utensils className="w-3.5 h-3.5" />,
        };
      case 'photo':
        return {
          label: '打卡拍照',
          bg: 'bg-rose-100 text-rose-800 border-rose-300',
          icon: <Camera className="w-3.5 h-3.5" />,
        };
      case 'culture':
        return {
          label: '歷史人文',
          bg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
          icon: <Landmark className="w-3.5 h-3.5" />,
        };
      case 'nature':
        return {
          label: '自然步道',
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: <Trees className="w-3.5 h-3.5" />,
        };
      case 'shopping':
        return {
          label: '伴手禮名店',
          bg: 'bg-purple-100 text-purple-800 border-purple-300',
          icon: <ShoppingBag className="w-3.5 h-3.5" />,
        };
      default:
        return {
          label: '熱門景點',
          bg: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: <MapPin className="w-3.5 h-3.5" />,
        };
    }
  };

  const getTransportIcon = (mode: string) => {
    switch (mode) {
      case 'walk':
        return <Footprints className="w-3.5 h-3.5 text-emerald-600" />;
      case 'youbike':
        return <Bike className="w-3.5 h-3.5 text-emerald-600" />;
      case 'bus':
        return <Bus className="w-3.5 h-3.5 text-blue-600" />;
      case 'train':
        return <Train className="w-3.5 h-3.5 text-indigo-600" />;
      case 'taxi':
        return <Car className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <Navigation className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const openGoogleMapsDirection = (stop: ItineraryStop) => {
    const destinationQuery = encodeURIComponent(`${stop.placeName} ${stop.address || ''}`);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destinationQuery}&travelmode=walking`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-700/60">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                AI 專屬量身規劃一日行程
              </span>
              <span className="text-xs text-slate-300 bg-white/10 px-2.5 py-1 rounded-full">
                📅 {itinerary.travelDate}
              </span>
            </div>

            {/* Action Bar */}
            <div className="flex items-center space-x-2">
              <button
                id="btn-save-itinerary"
                onClick={handleSaveWithCelebration}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all active:scale-95 ${
                  isSaved
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                <span>{isSaved ? '已收藏此行程' : '收藏行程'}</span>
              </button>

              <button
                id="btn-copy-itinerary"
                onClick={handleCopyText}
                className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold border border-white/20 flex items-center space-x-1.5 transition-colors"
                title="複製完整行程文字"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '已複製' : '複製文字'}</span>
              </button>

              <button
                id="btn-export-pdf"
                onClick={() => setIsPdfModalOpen(true)}
                className="flex px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold border border-blue-400/40 items-center space-x-1.5 transition-all shadow-sm active:scale-95"
                title="預覽並匯出成 PDF 文件"
              >
                <FileDown className="w-3.5 h-3.5 text-blue-100" />
                <span>匯出成PDF</span>
              </button>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
            {itinerary.title}
          </h1>
          <p className="text-sm sm:text-base text-blue-200/90 font-medium mb-4 max-w-3xl">
            {itinerary.subtitle}
          </p>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl bg-white/5 p-3.5 rounded-2xl border border-white/10 mb-5">
            {itinerary.summary}
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/10 rounded-xl p-3 border border-white/10">
              <span className="text-[11px] text-blue-300 block">鐵道路線</span>
              <span className="text-sm font-bold text-white mt-0.5 block">
                {itinerary.originStation.name} ➔ {itinerary.destinationStation.name}
              </span>
            </div>

            <div className="bg-white/10 rounded-xl p-3 border border-white/10">
              <span className="text-[11px] text-blue-300 block">預估每人總花費</span>
              <span className="text-sm font-bold text-amber-300 mt-0.5 block">
                約 NT$ {itinerary.estimatedTotalBudget}
              </span>
            </div>

            <div className="bg-white/10 rounded-xl p-3 border border-white/10">
              <span className="text-[11px] text-blue-300 block">精選行程站點</span>
              <span className="text-sm font-bold text-white mt-0.5 block">
                {itinerary.stops.length} 個景點美食
              </span>
            </div>

            <div className="bg-white/10 rounded-xl p-3 border border-white/10">
              <span className="text-[11px] text-blue-300 block">站周邊移動方式</span>
              <span className="text-sm font-bold text-emerald-300 mt-0.5 block">
                {itinerary.preferences?.transport === 'walk_youbike'
                  ? '步行 + YouBike'
                  : itinerary.preferences?.transport === 'public_bus'
                  ? '在地公車/客運'
                  : itinerary.preferences?.transport === 'scooter_rental'
                  ? '站前租機車'
                  : '計程車包車'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Taiwan Railway (台鐵) Timetable Recommendation Card - 3 Options for Outbound & Inbound */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <Train className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span>台鐵乘車時刻推薦</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  去回各 3 個時段班次
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                提供早鳥、主力推薦與彈性時段 3 種乘車方案，點擊可切換選取！
              </p>
            </div>
          </div>

          <a
            id="btn-tra-booking-link"
            href="https://www.railway.gov.tw/tra-tip-web/tip"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <span>台鐵官網線上訂票 / 時刻表</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Train Directions: Outbound (去程) & Inbound (回程) */}
        <div className="space-y-6 mb-5">
          {/* 1. Outbound Trains (3 Options) */}
          <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  <Train className="w-3.5 h-3.5" />
                  <span>去程推薦列車</span>
                </span>
                <span className="text-xs text-slate-600 font-medium">
                  {itinerary.originStation.name} ➔ {itinerary.destinationStation.name}
                </span>
              </div>
              <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                目前選定：{activeOutbound.optionLabel || `方案 ${selectedOutboundIdx + 1}`} ({activeOutbound.departureTime} 開)
              </span>
            </div>

            {/* 3 Outbound Option Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {outboundList.map((train, idx) => {
                const isSelected = idx === selectedOutboundIdx;
                return (
                  <button
                    key={`outbound-${idx}`}
                    id={`btn-select-outbound-${idx}`}
                    type="button"
                    onClick={() => setSelectedOutboundIdx(idx)}
                    className={`text-left rounded-xl p-3.5 transition-all relative border flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                        : 'bg-white hover:bg-slate-100/80 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {train.optionLabel || `時段 ${idx + 1}`}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-0.5">
                            <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                            已選定
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-bold text-slate-800 mt-1 line-clamp-1">
                        {train.trainType}
                      </div>
                      <div className="text-xs font-extrabold text-blue-600">
                        {train.trainNo}
                      </div>

                      <div className="flex items-center justify-between mt-2.5 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block">{itinerary.originStation.name} 開</span>
                          <span className="text-sm font-black text-slate-800">{train.departureTime}</span>
                        </div>
                        <div className="text-center px-1">
                          <span className="text-[10px] text-slate-400 block">{train.durationText}</span>
                          <span className="text-slate-300 text-xs">➔</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">{itinerary.destinationStation.name} 到</span>
                          <span className="text-sm font-black text-slate-800">{train.arrivalTime}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">預估單程</span>
                      <span className="font-bold text-emerald-700">NT$ {train.fareEstimate}</span>
                    </div>

                    {train.features && (
                      <div className="mt-1.5 text-[10px] text-slate-500 bg-slate-100/90 rounded px-1.5 py-0.5 truncate">
                        {train.features}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Inbound Trains (3 Options) */}
          <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-indigo-700 bg-indigo-100 border border-indigo-300 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  <Train className="w-3.5 h-3.5" />
                  <span>回程建議班次 (賦歸)</span>
                </span>
                <span className="text-xs text-slate-600 font-medium">
                  {itinerary.destinationStation.name} ➔ {itinerary.originStation.name}
                </span>
              </div>
              <span className="text-xs text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md">
                目前選定：{activeInbound.optionLabel || `方案 ${selectedInboundIdx + 1}`} ({activeInbound.departureTime} 開)
              </span>
            </div>

            {/* 3 Inbound Option Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {inboundList.map((train, idx) => {
                const isSelected = idx === selectedInboundIdx;
                return (
                  <button
                    key={`inbound-${idx}`}
                    id={`btn-select-inbound-${idx}`}
                    type="button"
                    onClick={() => setSelectedInboundIdx(idx)}
                    className={`text-left rounded-xl p-3.5 transition-all relative border flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-500 shadow-sm ring-2 ring-indigo-500/20'
                        : 'bg-white hover:bg-slate-100/80 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {train.optionLabel || `時段 ${idx + 1}`}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-indigo-700 flex items-center gap-0.5">
                            <Check className="w-3 h-3 text-indigo-600 stroke-[3]" />
                            已選定
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-bold text-slate-800 mt-1 line-clamp-1">
                        {train.trainType}
                      </div>
                      <div className="text-xs font-extrabold text-indigo-600">
                        {train.trainNo}
                      </div>

                      <div className="flex items-center justify-between mt-2.5 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block">{itinerary.destinationStation.name} 開</span>
                          <span className="text-sm font-black text-slate-800">{train.departureTime}</span>
                        </div>
                        <div className="text-center px-1">
                          <span className="text-[10px] text-slate-400 block">{train.durationText}</span>
                          <span className="text-slate-300 text-xs">➔</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">{itinerary.originStation.name} 到</span>
                          <span className="text-sm font-black text-slate-800">{train.arrivalTime}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">預估單程</span>
                      <span className="font-bold text-indigo-700">NT$ {train.fareEstimate}</span>
                    </div>

                    {train.features && (
                      <div className="mt-1.5 text-[10px] text-slate-500 bg-slate-100/90 rounded px-1.5 py-0.5 truncate">
                        {train.features}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Booking tip */}
        <div className="flex items-start space-x-2 bg-amber-50/80 border border-amber-200/90 rounded-xl p-3 text-xs text-amber-900">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">購票貼心提醒：</span>
            <span>{itinerary.trainRecommendation.bookingTip}</span>
          </div>
        </div>
      </div>

      {/* Step-by-Step Itinerary Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span>詳細一日行程時間表與景點美食推薦</span>
          </h3>
          <span className="text-xs text-slate-500">
            點擊「Google Maps 導航」立即開啟路線
          </span>
        </div>

        <div className="relative border-l-2 border-blue-200 ml-4 sm:ml-6 pl-4 sm:pl-6 space-y-6">
          {itinerary.stops.map((stop, index) => {
            const badge = getCategoryBadge(stop.category);
            return (
              <div
                key={stop.id || index}
                id={`itinerary-stop-${index}`}
                className="relative bg-white rounded-2xl p-5 shadow-sm hover:shadow-md border border-slate-200/80 transition-all group"
              >
                {/* Node circle on timeline */}
                <div className="absolute -left-[27px] sm:-left-[35px] top-6 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shadow-md ring-4 ring-white">
                  {index + 1}
                </div>

                {/* Transit info from previous */}
                <div className="flex items-center space-x-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 mb-3">
                  <div className="flex items-center space-x-1 font-semibold text-slate-700">
                    {getTransportIcon(stop.transportFromPrevious.mode)}
                    <span>{stop.transportFromPrevious.durationText}</span>
                  </div>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500 truncate">{stop.transportFromPrevious.details}</span>
                </div>

                {/* Stop Header */}
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        {stop.timeSlot}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${badge.bg}`}>
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>
                      <span className="text-xs text-slate-400">
                        (停留約 {stop.durationMinutes} 分鐘)
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-slate-900 mt-1.5 group-hover:text-blue-600 transition-colors">
                      {stop.placeName}
                    </h4>
                    <p className="text-xs font-medium text-blue-700 mt-0.5">
                      ✨ {stop.highlight}
                    </p>
                  </div>

                  {/* Navigation and map trigger */}
                  <div className="flex items-center space-x-2">
                    {onSelectStopOnMap && (
                      <button
                        onClick={() => onSelectStopOnMap(stop)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1 transition-colors"
                        title="在地圖中檢視位置"
                      >
                        <MapPin className="w-3.5 h-3.5 text-slate-600" />
                        <span>地圖查看</span>
                      </button>
                    )}

                    <button
                      id={`btn-navigate-stop-${index}`}
                      onClick={() => openGoogleMapsDirection(stop)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                      title="在 Google Maps 中開啟精準導航與步行指南"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Google Maps 導航</span>
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-slate-600 leading-relaxed mb-3">
                  {stop.description}
                </p>

                {/* Recommended Items & Dishes */}
                {stop.recommendedItems && stop.recommendedItems.length > 0 && (
                  <div className="mb-3">
                    <span className="text-xs font-bold text-slate-700 block mb-1">
                      {stop.category === 'food' ? '🍜 推薦必點招牌：' : '📸 推薦體驗與拍照亮點：'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {stop.recommendedItems.map((item, i) => (
                        <span
                          key={i}
                          className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stop Footer (Address, Tips, Cost) */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center space-x-1 max-w-md truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{stop.address}</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    {stop.tips && (
                      <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        💡 {stop.tips}
                      </span>
                    )}
                    {stop.estimatedCostNtd !== undefined && stop.estimatedCostNtd > 0 && (
                      <span className="font-semibold text-slate-700">
                        預估 NT$ {stop.estimatedCostNtd}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transit Guide & Local Specialties Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Transit Guide */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-5 sm:p-6">
          <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {itinerary.destinationStation.name}站 周邊交通轉乘指南
              </h3>
              <p className="text-xs text-slate-500">
                出站指引、YouBike站點、在地公車與計程車資訊
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-slate-700">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900 block mb-1">
                🚉 車站出站與行李寄放
              </span>
              <p className="text-slate-600">{itinerary.transitGuide.stationExitTips}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900 block mb-1">
                🚲 YouBike 租借與騎乘指引
              </span>
              <p className="text-slate-600">{itinerary.transitGuide.youbikeInfo}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900 block mb-1">
                🚌 在地公車 / 台灣好行客運
              </span>
              <p className="text-slate-600">{itinerary.transitGuide.localBusSummary}</p>
            </div>

            {itinerary.transitGuide.precautions && itinerary.transitGuide.precautions.length > 0 && (
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200">
                <span className="font-bold text-amber-900 flex items-center gap-1 mb-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  在地旅遊叮嚀與注意事項
                </span>
                <ul className="list-disc list-inside space-y-1 text-amber-800 text-xs">
                  {itinerary.transitGuide.precautions.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Local Specialties & Bento */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-5 sm:p-6">
          <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {itinerary.destinationStation.name}站 在地美食名榜與便當推薦
              </h3>
              <p className="text-xs text-slate-500">
                經典小吃、台鐵限定便當與必買伴手禮清單
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Bento Recommendation */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
              <div className="flex items-center space-x-2 mb-1">
                <Train className="w-4 h-4 text-amber-700" />
                <span className="font-bold text-sm text-amber-950">
                  🍱 台鐵鐵路便當推薦
                </span>
              </div>
              <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
                {itinerary.localSpecialties.bentoRecommendation}
              </p>
            </div>

            {/* Must Eat List */}
            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                🍜 在地老饕必吃名產
              </span>
              <div className="flex flex-wrap gap-2">
                {itinerary.localSpecialties.mustEat.map((food, i) => (
                  <span
                    key={i}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-100/70 text-amber-900 border border-amber-300"
                  >
                    {food}
                  </span>
                ))}
              </div>
            </div>

            {/* Souvenirs */}
            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                🎁 必買人氣伴手禮
              </span>
              <div className="flex flex-wrap gap-2">
                {itinerary.localSpecialties.souvenirs.map((item, i) => (
                  <span
                    key={i}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-purple-100/70 text-purple-900 border border-purple-300"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Weather & Dressing advice */}
            {itinerary.weatherAdvice && (
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-blue-900">
                <span className="font-bold block mb-0.5">☀️ 旅遊裝備與穿著建議</span>
                <span>{itinerary.weatherAdvice}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PDF Export & Preview Modal */}
      <PdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        itinerary={itinerary}
        selectedOutbound={activeOutbound}
        selectedInbound={activeInbound}
      />
    </div>
  );
};
