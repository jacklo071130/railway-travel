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
  AlertCircle,
  GitMerge,
  ArrowRight,
  Route,
  Layers,
  ArrowDown,
  FileDown
} from 'lucide-react';
import { DayItinerary, ItineraryStop, TrainTripOption } from '../types';
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
    const formatOption = (t: TrainTripOption, i: number, isSelected: boolean) => {
      const transitText = t.isDirect === false || (t.transferCount && t.transferCount > 0)
        ? ` [🔄需轉乘${t.transferCount || 1}次: 於${t.transferStations?.join('、') || '轉乘站'}換車 | ${t.transferSummary || ''}]`
        : ' [🟢直達車・無須轉乘]';
      
      const legsText = t.legs && t.legs.length > 0
        ? `\n     各區間明細: ` + t.legs.map(l => `第${l.legIndex}段: ${l.fromStation}➔${l.toStation} (${l.trainType} ${l.trainNo}, ${l.departureTime}開➔${l.arrivalTime}到${l.transferWaitMinutes ? `, 轉乘等候${l.transferWaitMinutes}分` : ''})`).join(' ➔ ')
        : '';

      return `  [${t.optionLabel || `時段${i+1}`}] ${t.trainType} ${t.trainNo} (${t.departureTime}➔${t.arrivalTime}, 約NT$${t.fareEstimate})${transitText}${isSelected ? ' ★已選定' : ''}${legsText}`;
    };

    const outboundSummary = outboundList
      .map((t, i) => formatOption(t, i, i === selectedOutboundIdx))
      .join('\n');
    const inboundSummary = inboundList
      .map((t, i) => formatOption(t, i, i === selectedInboundIdx))
      .join('\n');

    const text = `🚂【${itinerary.title}】\n📅 旅遊日期：${itinerary.travelDate}\n💰 預估人均花費：約 NT$ ${itinerary.estimatedTotalBudget}\n\n🚆【台鐵去程推薦班次與轉乘指引 (3班時段)】\n${outboundSummary}\n\n🚆【台鐵回程推薦班次與轉乘指引 (3班時段)】\n${inboundSummary}\n\n🚌【台灣好行觀光公車接駁】\n${itinerary.transitGuide.taiwanTripBus ? `路線：${itinerary.transitGuide.taiwanTripBus.routeName}\n乘車處：${itinerary.transitGuide.taiwanTripBus.boardingLocation}\n票價優惠：${itinerary.transitGuide.taiwanTripBus.fareOrPassInfo}\n即時動態查詢：${itinerary.transitGuide.taiwanTripBus.officialUrl || 'https://www.taiwantrip.com.tw/'}` : '台灣好行官網時刻：https://www.taiwantrip.com.tw/'}\n\n🗺️【一日遊行程時間表】\n${itinerary.stops
      .map(
        (s, idx) =>
          `${idx + 1}. [${s.timeSlot}] ${s.placeName} (${s.highlight})\n   📍 地址：${s.address}\n   🚶 交通：${s.transportFromPrevious.durationText} - ${s.transportFromPrevious.details}\n   💡 導遊貼士：${s.tips || ''}`
      )
      .join('\n\n')}\n\n🍜 必吃美食：${itinerary.localSpecialties.mustEat.join('、')}\n🎁 必買伴手禮：${itinerary.localSpecialties.souvenirs.join('、')}\n\n台鐵官網時刻查詢：https://www.railway.gov.tw/tra-tip-web/tip\n台灣好行官網：https://www.taiwantrip.com.tw/`;

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
          bg: 'bg-[#FAF8E7] text-[#665A15] border-[#E5DEAA]',
          icon: <Utensils className="w-3.5 h-3.5" />,
        };
      case 'photo':
        return {
          label: '打卡拍照',
          bg: 'bg-[#E5FAF7] text-[#13695F] border-[#81D8CF]/50',
          icon: <Camera className="w-3.5 h-3.5" />,
        };
      case 'culture':
        return {
          label: '歷史人文',
          bg: 'bg-[#FAF8E7] text-[#8C7C20] border-[#E5DEAA]',
          icon: <Landmark className="w-3.5 h-3.5" />,
        };
      case 'nature':
        return {
          label: '自然步道',
          bg: 'bg-[#E5FAF7] text-[#1A8F82] border-[#81D8CF]/50',
          icon: <Trees className="w-3.5 h-3.5" />,
        };
      case 'shopping':
        return {
          label: '伴手禮名店',
          bg: 'bg-[#FAF8E7] text-[#665A15] border-[#E5DEAA]',
          icon: <ShoppingBag className="w-3.5 h-3.5" />,
        };
      default:
        return {
          label: '熱門景點',
          bg: 'bg-[#E5FAF7] text-[#13695F] border-[#81D8CF]/40',
          icon: <MapPin className="w-3.5 h-3.5" />,
        };
    }
  };

  const getTransportIcon = (mode: string) => {
    switch (mode) {
      case 'walk':
        return <Footprints className="w-3.5 h-3.5 text-[#1A8F82]" />;
      case 'youbike':
        return <Bike className="w-3.5 h-3.5 text-[#1A8F82]" />;
      case 'bus':
        return <Bus className="w-3.5 h-3.5 text-[#13695F]" />;
      case 'train':
        return <Train className="w-3.5 h-3.5 text-[#1A8F82]" />;
      case 'taxi':
        return <Car className="w-3.5 h-3.5 text-[#8C7C20]" />;
      default:
        return <Navigation className="w-3.5 h-3.5 text-[#546E6A]" />;
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
      <div className="bg-gradient-to-br from-[#0F3A35] via-[#13695F] to-[#1A8F82] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-[#81D8CF]/30">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#81D8CF]/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full bg-[#81D8CF]/25 text-[#E5FAF7] text-xs font-semibold border border-[#81D8CF]/40 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#F8F5D6]" />
                AI 專屬量身規劃一日行程
              </span>
              <span className="text-xs text-[#FAF8E7] bg-white/15 px-2.5 py-1 rounded-full">
                📅 {itinerary.travelDate}
              </span>
            </div>

            {/* Action Bar */}
            <div className="flex items-center space-x-2">
              <button
                id="btn-save-itinerary"
                onClick={handleSaveWithCelebration}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer ${
                  isSaved
                    ? 'bg-[#F8F5D6] text-[#0F3A35] shadow-md font-bold'
                    : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                <span>{isSaved ? '已收藏此行程' : '收藏行程'}</span>
              </button>

              <button
                id="btn-copy-itinerary"
                onClick={handleCopyText}
                className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold border border-white/20 flex items-center space-x-1.5 transition-colors cursor-pointer"
                title="複製完整行程文字"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#81D8CF]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '已複製' : '複製文字'}</span>
              </button>

              <button
                id="btn-export-ai-pdf"
                onClick={() => setIsPdfModalOpen(true)}
                className="flex px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#5EC9BD] to-[#81D8CF] hover:from-[#81D8CF] hover:to-[#5EC9BD] text-[#0F3A35] text-xs font-black border border-[#81D8CF] items-center space-x-1.5 transition-all shadow-md active:scale-95 cursor-pointer hover:shadow-[#81D8CF]/40"
                title="使用 AI 整合匯出完整行程 PDF（含路線地圖、選定車次指引、景點美食與台灣好行接駁）"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#0F3A35]" />
                <span>AI 整合匯出 PDF</span>
              </button>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
            {itinerary.title}
          </h1>
          <p className="text-sm sm:text-base text-[#FAF8E7]/90 font-medium mb-4 max-w-3xl">
            {itinerary.subtitle}
          </p>

          {/* Active Personalized Settings Ribbon */}
          {itinerary.preferences && (
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-4">
              <span className="text-[11px] text-[#E5FAF7] font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#F8F5D6]" />
                個人化依據:
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-white/15 text-white border border-white/20">
                {itinerary.preferences.style === 'gourmet' ? '🍜 美食老饕' :
                 itinerary.preferences.style === 'instagram' ? '📸 網美打卡' :
                 itinerary.preferences.style === 'culture' ? '🏛️ 歷史人文' :
                 itinerary.preferences.style === 'family' ? '👨‍👩‍👧 親子同樂' :
                 itinerary.preferences.style === 'nature' ? '🌲 自然步道' : '☕ 慢活悠閒'}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-white/15 text-white border border-white/20">
                {itinerary.preferences.companion === 'solo' ? '一人獨旅' :
                 itinerary.preferences.companion === 'couple' ? '情侶約會' :
                 itinerary.preferences.companion === 'family_elder' ? '長輩同行' :
                 itinerary.preferences.companion === 'family_kids' ? '親子家庭' : '好友同行'}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-white/15 text-white border border-white/20">
                {itinerary.preferences.pace === 'relaxed' ? '⏳ 慢步調(3~4點)' :
                 itinerary.preferences.pace === 'packed' ? '🔥 精實踩點(5~6點)' : '⚡ 經典適中'}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-white/15 text-white border border-white/20">
                {itinerary.preferences.transport === 'walk_youbike' ? '🚶 步行+YouBike' :
                 itinerary.preferences.transport === 'public_bus' ? '🚌 在地公車/客運' :
                 itinerary.preferences.transport === 'scooter_rental' ? '🛵 站前租機車' : '🚕 計程車包車'}
              </span>
              {itinerary.preferences.customNotes && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#F8F5D6]/20 text-[#FAF8E7] border border-[#F8F5D6]/30 max-w-xs truncate">
                  📝 「{itinerary.preferences.customNotes}」
                </span>
              )}
            </div>
          )}

          <p className="text-xs sm:text-sm text-[#FAF8E7]/90 leading-relaxed max-w-4xl bg-white/10 p-3.5 rounded-2xl border border-white/10 mb-5">
            {itinerary.summary}
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/10 rounded-xl p-3 border border-white/10">
              <span className="text-[11px] text-[#81D8CF] block">鐵道路線</span>
              <span className="text-sm font-bold text-white mt-0.5 block">
                {itinerary.originStation.name} ➔ {itinerary.destinationStation.name}
              </span>
            </div>

            <div className="bg-white/10 rounded-xl p-3 border border-white/10">
              <span className="text-[11px] text-[#81D8CF] block">預估每人總花費</span>
              <span className="text-sm font-bold text-[#F8F5D6] mt-0.5 block">
                約 NT$ {itinerary.estimatedTotalBudget}
              </span>
            </div>

            <div className="bg-white/10 rounded-xl p-3 border border-white/10">
              <span className="text-[11px] text-[#81D8CF] block">精選行程站點</span>
              <span className="text-sm font-bold text-white mt-0.5 block">
                {itinerary.stops.length} 個景點美食
              </span>
            </div>

            <div className="bg-white/10 rounded-xl p-3 border border-white/10">
              <span className="text-[11px] text-[#81D8CF] block">站周邊移動方式</span>
              <span className="text-sm font-bold text-[#E5FAF7] mt-0.5 block">
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
      <div className="bg-white rounded-2xl shadow-md border border-[#E5DEAA] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-[#FAF8E7]">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-[#E5FAF7] text-[#13695F] border border-[#81D8CF]/40">
              <Train className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#122B28] flex items-center gap-2">
                <span>台鐵乘車時刻推薦</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#E5FAF7] text-[#13695F] border border-[#81D8CF]/30">
                  去回各 3 個時段班次
                </span>
              </h3>
              <p className="text-xs text-[#546E6A]">
                提供早鳥、主力推薦與彈性時段 3 種乘車方案，點擊可切換選取！
              </p>
            </div>
          </div>

          <a
            id="btn-tra-booking-link"
            href="https://www.railway.gov.tw/tra-tip-web/tip"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#1A8F82] hover:bg-[#13695F] text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <span>台鐵官網線上訂票 / 時刻表</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Train Directions: Outbound (去程) & Inbound (回程) */}
        <div className="space-y-6 mb-5">
          {/* 1. Outbound Trains (3 Options) */}
          <div className="bg-[#FAF8E7]/60 rounded-2xl p-4 sm:p-5 border border-[#E5DEAA]">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-[#13695F] bg-[#E5FAF7] border border-[#81D8CF]/50 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  <Train className="w-3.5 h-3.5 text-[#1A8F82]" />
                  <span>去程推薦列車</span>
                </span>
                <span className="text-xs text-[#546E6A] font-medium">
                  {itinerary.originStation.name} ➔ {itinerary.destinationStation.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {activeOutbound.isDirect === false || (activeOutbound.transferCount && activeOutbound.transferCount > 0) ? (
                  <span className="text-[11px] text-[#8C7C20] font-bold bg-[#FAF8E7] px-2 py-0.5 rounded-md border border-[#E5DEAA] flex items-center gap-1">
                    <GitMerge className="w-3 h-3 text-[#8C7C20]" />
                    <span>需轉乘 {activeOutbound.transferCount || 1} 次 ({activeOutbound.transferStations?.join('、') || '轉乘站'})</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-[#13695F] font-semibold bg-[#E5FAF7] px-2 py-0.5 rounded-md border border-[#81D8CF]/40">
                    🟢 直達車・免轉乘
                  </span>
                )}
                <span className="text-xs text-[#13695F] font-semibold bg-[#E5FAF7] px-2 py-0.5 rounded-md border border-[#81D8CF]/30">
                  目前選定：{activeOutbound.optionLabel || `方案 ${selectedOutboundIdx + 1}`} ({activeOutbound.departureTime} 開)
                </span>
              </div>
            </div>

            {/* 3 Outbound Option Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {outboundList.map((train, idx) => {
                const isSelected = idx === selectedOutboundIdx;
                const isTransfer = train.isDirect === false || (train.transferCount && train.transferCount > 0);
                return (
                  <button
                    key={`outbound-${idx}`}
                    id={`btn-select-outbound-${idx}`}
                    type="button"
                    onClick={() => setSelectedOutboundIdx(idx)}
                    className={`text-left rounded-xl p-3.5 transition-all relative border flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#E5FAF7] border-[#1A8F82] shadow-sm ring-2 ring-[#81D8CF]/40'
                        : 'bg-white hover:bg-[#FAF8E7] border-[#E5DEAA] text-[#122B28]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            isSelected
                              ? 'bg-[#1A8F82] text-white'
                              : 'bg-[#FAF8E7] text-[#4E6864] border border-[#E5DEAA]'
                          }`}
                        >
                          {train.optionLabel || `時段 ${idx + 1}`}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-[#13695F] flex items-center gap-0.5">
                            <Check className="w-3 h-3 text-[#1A8F82] stroke-[3]" />
                            已選定
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-bold text-[#122B28] mt-1 line-clamp-1">
                        {train.trainType}
                      </div>
                      <div className="text-xs font-extrabold text-[#1A8F82]">
                        {train.trainNo}
                      </div>

                      {/* Transit indicator tag */}
                      <div className="mt-1">
                        {isTransfer ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#8C7C20] bg-[#FAF8E7] px-1.5 py-0.5 rounded border border-[#E5DEAA]">
                            <GitMerge className="w-2.5 h-2.5" />
                            <span>轉乘 {train.transferCount || 1} 次 ({train.transferStations?.join('、') || '轉乘站'})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#13695F] bg-[#E5FAF7] px-1.5 py-0.5 rounded border border-[#81D8CF]/40">
                            <span>直達列車</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2.5 text-xs">
                        <div>
                          <span className="text-[10px] text-[#78928E] block">{itinerary.originStation.name} 開</span>
                          <span className="text-sm font-black text-[#122B28]">{train.departureTime}</span>
                        </div>
                        <div className="text-center px-1">
                          <span className="text-[10px] text-[#78928E] block">{train.durationText}</span>
                          <span className="text-[#81D8CF] text-xs">➔</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-[#78928E] block">{itinerary.destinationStation.name} 到</span>
                          <span className="text-sm font-black text-[#122B28]">{train.arrivalTime}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#E5DEAA]/60 flex items-center justify-between text-[11px]">
                      <span className="text-[#546E6A] font-medium">預估單程</span>
                      <span className="font-bold text-[#13695F]">NT$ {train.fareEstimate}</span>
                    </div>

                    {(train.transferSummary || train.features) && (
                      <div className="mt-1.5 text-[10px] text-[#4E6864] bg-[#FAF8E7] rounded px-1.5 py-0.5 truncate border border-[#E5DEAA]/50">
                        {train.transferSummary || train.features}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Inbound Trains (3 Options) */}
          <div className="bg-[#FAF8E7]/60 rounded-2xl p-4 sm:p-5 border border-[#E5DEAA]">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-[#13695F] bg-[#E5FAF7] border border-[#81D8CF]/50 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  <Train className="w-3.5 h-3.5 text-[#1A8F82]" />
                  <span>回程建議班次 (賦歸)</span>
                </span>
                <span className="text-xs text-[#546E6A] font-medium">
                  {itinerary.destinationStation.name} ➔ {itinerary.originStation.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {activeInbound.isDirect === false || (activeInbound.transferCount && activeInbound.transferCount > 0) ? (
                  <span className="text-[11px] text-[#8C7C20] font-bold bg-[#FAF8E7] px-2 py-0.5 rounded-md border border-[#E5DEAA] flex items-center gap-1">
                    <GitMerge className="w-3 h-3 text-[#8C7C20]" />
                    <span>需轉乘 {activeInbound.transferCount || 1} 次 ({activeInbound.transferStations?.join('、') || '轉乘站'})</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-[#13695F] font-semibold bg-[#E5FAF7] px-2 py-0.5 rounded-md border border-[#81D8CF]/40">
                    🟢 直達車・免轉乘
                  </span>
                )}
                <span className="text-xs text-[#13695F] font-semibold bg-[#E5FAF7] px-2 py-0.5 rounded-md border border-[#81D8CF]/30">
                  目前選定：{activeInbound.optionLabel || `方案 ${selectedInboundIdx + 1}`} ({activeInbound.departureTime} 開)
                </span>
              </div>
            </div>

            {/* 3 Inbound Option Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {inboundList.map((train, idx) => {
                const isSelected = idx === selectedInboundIdx;
                const isTransfer = train.isDirect === false || (train.transferCount && train.transferCount > 0);
                return (
                  <button
                    key={`inbound-${idx}`}
                    id={`btn-select-inbound-${idx}`}
                    type="button"
                    onClick={() => setSelectedInboundIdx(idx)}
                    className={`text-left rounded-xl p-3.5 transition-all relative border flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#E5FAF7] border-[#1A8F82] shadow-sm ring-2 ring-[#81D8CF]/40'
                        : 'bg-white hover:bg-[#FAF8E7] border-[#E5DEAA] text-[#122B28]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            isSelected
                              ? 'bg-[#1A8F82] text-white'
                              : 'bg-[#FAF8E7] text-[#4E6864] border border-[#E5DEAA]'
                          }`}
                        >
                          {train.optionLabel || `時段 ${idx + 1}`}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-[#13695F] flex items-center gap-0.5">
                            <Check className="w-3 h-3 text-[#1A8F82] stroke-[3]" />
                            已選定
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-bold text-[#122B28] mt-1 line-clamp-1">
                        {train.trainType}
                      </div>
                      <div className="text-xs font-extrabold text-[#1A8F82]">
                        {train.trainNo}
                      </div>

                      {/* Transit indicator tag */}
                      <div className="mt-1">
                        {isTransfer ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#8C7C20] bg-[#FAF8E7] px-1.5 py-0.5 rounded border border-[#E5DEAA]">
                            <GitMerge className="w-2.5 h-2.5" />
                            <span>轉乘 {train.transferCount || 1} 次 ({train.transferStations?.join('、') || '轉乘站'})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#13695F] bg-[#E5FAF7] px-1.5 py-0.5 rounded border border-[#81D8CF]/40">
                            <span>直達列車</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2.5 text-xs">
                        <div>
                          <span className="text-[10px] text-[#78928E] block">{itinerary.destinationStation.name} 開</span>
                          <span className="text-sm font-black text-[#122B28]">{train.departureTime}</span>
                        </div>
                        <div className="text-center px-1">
                          <span className="text-[10px] text-[#78928E] block">{train.durationText}</span>
                          <span className="text-[#81D8CF] text-xs">➔</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-[#78928E] block">{itinerary.originStation.name} 到</span>
                          <span className="text-sm font-black text-[#122B28]">{train.arrivalTime}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#E5DEAA]/60 flex items-center justify-between text-[11px]">
                      <span className="text-[#546E6A] font-medium">預估單程</span>
                      <span className="font-bold text-[#13695F]">NT$ {train.fareEstimate}</span>
                    </div>

                    {(train.transferSummary || train.features) && (
                      <div className="mt-1.5 text-[10px] text-[#4E6864] bg-[#FAF8E7] rounded px-1.5 py-0.5 truncate border border-[#E5DEAA]/50">
                        {train.transferSummary || train.features}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Detailed Leg-by-Leg & Transfer Connection Timeline for Selected Trains */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#81D8CF]/60 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#FAF8E7]">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-[#E5FAF7] text-[#13695F]">
                  <Route className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#122B28]">
                    當前選定車次・各段搭乘與轉乘詳細指引
                  </h4>
                  <p className="text-[11px] text-[#546E6A]">
                    詳細標註出發站、抵達站、班次號碼與中途轉乘站點等候資訊
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-[#13695F] bg-[#E5FAF7] px-2 py-0.5 rounded border border-[#81D8CF]/30 hidden sm:inline-block">
                即時換乘指南
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Outbound Leg Breakdown */}
              <div className="bg-[#FAF8E7]/50 rounded-xl p-3.5 border border-[#E5DEAA]">
                <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[#E5DEAA]/60">
                  <span className="text-xs font-bold text-[#13695F] flex items-center gap-1.5">
                    <Train className="w-3.5 h-3.5 text-[#1A8F82]" />
                    <span>【去程】{itinerary.originStation.name} ➔ {itinerary.destinationStation.name}</span>
                  </span>
                  <span className="text-[11px] font-semibold text-[#546E6A]">
                    總車程 {activeOutbound.durationText}
                  </span>
                </div>

                {/* Render Outbound Legs */}
                {activeOutbound.legs && activeOutbound.legs.length > 0 ? (
                  <div className="space-y-2.5">
                    {activeOutbound.legs.map((leg, lIdx) => (
                      <React.Fragment key={`out-leg-${lIdx}`}>
                        <div className="bg-white rounded-lg p-3 border border-[#E5DEAA] shadow-2xs">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-bold text-[#122B28] flex items-center gap-1">
                              <span className="w-4 h-4 rounded-full bg-[#1A8F82] text-white text-[10px] font-black inline-flex items-center justify-center">
                                {leg.legIndex || lIdx + 1}
                              </span>
                              <span>第 {leg.legIndex || lIdx + 1} 段列車</span>
                            </span>
                            <span className="text-[11px] font-bold text-[#1A8F82] bg-[#E5FAF7] px-2 py-0.5 rounded">
                              {leg.trainType} {leg.trainNo}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs font-bold text-[#122B28] mt-2">
                            <div className="flex items-center gap-1">
                              <span className="text-[#13695F] font-black">{leg.fromStation}</span>
                              <span className="text-[#546E6A] font-medium text-[11px]">({leg.departureTime} 開)</span>
                            </div>
                            <div className="flex items-center gap-1 text-[#81D8CF] text-[11px] font-medium">
                              <ArrowRight className="w-3.5 h-3.5 text-[#1A8F82]" />
                              <span>{leg.durationText || ''}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[#13695F] font-black">{leg.toStation}</span>
                              <span className="text-[#546E6A] font-medium text-[11px]">({leg.arrivalTime} 到)</span>
                            </div>
                          </div>

                          {leg.note && (
                            <p className="mt-1.5 text-[11px] text-[#546E6A] bg-[#FAF8E7] p-1.5 rounded border border-[#E5DEAA]/60">
                              💡 {leg.note}
                            </p>
                          )}
                        </div>

                        {/* If followed by another leg, show transfer callout */}
                        {lIdx < activeOutbound.legs.length - 1 && (
                          <div className="my-1.5 p-2 bg-[#E5FAF7] rounded-lg border border-[#81D8CF]/50 text-xs flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-bold text-[#13695F]">
                              <GitMerge className="w-3.5 h-3.5 text-[#1A8F82]" />
                              <span>於【{leg.toStation} 站】轉乘接駁</span>
                            </div>
                            <span className="text-[11px] font-extrabold text-[#1A8F82] bg-white px-2 py-0.5 rounded border border-[#81D8CF]/40">
                              等候約 {leg.transferWaitMinutes || 12} 分鐘
                            </span>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                ) : (
                  // Direct / single leg fallback
                  <div className="bg-white rounded-lg p-3 border border-[#E5DEAA]">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-[#122B28] flex items-center gap-1">
                        <span className="w-4 h-4 rounded-full bg-[#1A8F82] text-white text-[10px] font-black inline-flex items-center justify-center">1</span>
                        <span>直達列車（免轉乘）</span>
                      </span>
                      <span className="text-[11px] font-bold text-[#1A8F82] bg-[#E5FAF7] px-2 py-0.5 rounded">
                        {activeOutbound.trainType} {activeOutbound.trainNo}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-[#122B28] mt-2">
                      <span className="text-[#13695F]">{itinerary.originStation.name} ({activeOutbound.departureTime} 開)</span>
                      <span className="text-[#81D8CF] text-xs">➔➔➔</span>
                      <span className="text-[#13695F]">{itinerary.destinationStation.name} ({activeOutbound.arrivalTime} 到)</span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-[#546E6A] bg-[#FAF8E7] p-1.5 rounded border border-[#E5DEAA]/60">
                      💡 {activeOutbound.features || '一車直達目的地，請依票面車廂座位入座。'}
                    </p>
                  </div>
                )}
              </div>

              {/* Inbound Leg Breakdown */}
              <div className="bg-[#FAF8E7]/50 rounded-xl p-3.5 border border-[#E5DEAA]">
                <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[#E5DEAA]/60">
                  <span className="text-xs font-bold text-[#13695F] flex items-center gap-1.5">
                    <Train className="w-3.5 h-3.5 text-[#1A8F82]" />
                    <span>【回程】{itinerary.destinationStation.name} ➔ {itinerary.originStation.name}</span>
                  </span>
                  <span className="text-[11px] font-semibold text-[#546E6A]">
                    總車程 {activeInbound.durationText}
                  </span>
                </div>

                {/* Render Inbound Legs */}
                {activeInbound.legs && activeInbound.legs.length > 0 ? (
                  <div className="space-y-2.5">
                    {activeInbound.legs.map((leg, lIdx) => (
                      <React.Fragment key={`in-leg-${lIdx}`}>
                        <div className="bg-white rounded-lg p-3 border border-[#E5DEAA] shadow-2xs">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-bold text-[#122B28] flex items-center gap-1">
                              <span className="w-4 h-4 rounded-full bg-[#1A8F82] text-white text-[10px] font-black inline-flex items-center justify-center">
                                {leg.legIndex || lIdx + 1}
                              </span>
                              <span>第 {leg.legIndex || lIdx + 1} 段列車</span>
                            </span>
                            <span className="text-[11px] font-bold text-[#1A8F82] bg-[#E5FAF7] px-2 py-0.5 rounded">
                              {leg.trainType} {leg.trainNo}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs font-bold text-[#122B28] mt-2">
                            <div className="flex items-center gap-1">
                              <span className="text-[#13695F] font-black">{leg.fromStation}</span>
                              <span className="text-[#546E6A] font-medium text-[11px]">({leg.departureTime} 開)</span>
                            </div>
                            <div className="flex items-center gap-1 text-[#81D8CF] text-[11px] font-medium">
                              <ArrowRight className="w-3.5 h-3.5 text-[#1A8F82]" />
                              <span>{leg.durationText || ''}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[#13695F] font-black">{leg.toStation}</span>
                              <span className="text-[#546E6A] font-medium text-[11px]">({leg.arrivalTime} 到)</span>
                            </div>
                          </div>

                          {leg.note && (
                            <p className="mt-1.5 text-[11px] text-[#546E6A] bg-[#FAF8E7] p-1.5 rounded border border-[#E5DEAA]/60">
                              💡 {leg.note}
                            </p>
                          )}
                        </div>

                        {/* If followed by another leg, show transfer callout */}
                        {lIdx < activeInbound.legs.length - 1 && (
                          <div className="my-1.5 p-2 bg-[#E5FAF7] rounded-lg border border-[#81D8CF]/50 text-xs flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-bold text-[#13695F]">
                              <GitMerge className="w-3.5 h-3.5 text-[#1A8F82]" />
                              <span>於【{leg.toStation} 站】轉乘接駁</span>
                            </div>
                            <span className="text-[11px] font-extrabold text-[#1A8F82] bg-white px-2 py-0.5 rounded border border-[#81D8CF]/40">
                              等候約 {leg.transferWaitMinutes || 12} 分鐘
                            </span>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                ) : (
                  // Direct / single leg fallback
                  <div className="bg-white rounded-lg p-3 border border-[#E5DEAA]">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-[#122B28] flex items-center gap-1">
                        <span className="w-4 h-4 rounded-full bg-[#1A8F82] text-white text-[10px] font-black inline-flex items-center justify-center">1</span>
                        <span>直達列車（免轉乘）</span>
                      </span>
                      <span className="text-[11px] font-bold text-[#1A8F82] bg-[#E5FAF7] px-2 py-0.5 rounded">
                        {activeInbound.trainType} {activeInbound.trainNo}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-[#122B28] mt-2">
                      <span className="text-[#13695F]">{itinerary.destinationStation.name} ({activeInbound.departureTime} 開)</span>
                      <span className="text-[#81D8CF] text-xs">➔➔➔</span>
                      <span className="text-[#13695F]">{itinerary.originStation.name} ({activeInbound.arrivalTime} 到)</span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-[#546E6A] bg-[#FAF8E7] p-1.5 rounded border border-[#E5DEAA]/60">
                      💡 {activeInbound.features || '一車直達返程站，安心就座休息。'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Booking tip */}
        <div className="flex items-start space-x-2 bg-[#FAF8E7] border border-[#E5DEAA] rounded-xl p-3 text-xs text-[#665A15]">
          <Info className="w-4 h-4 text-[#8C7C20] flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">購票貼心提醒：</span>
            <span>{itinerary.trainRecommendation.bookingTip}</span>
          </div>
        </div>
      </div>

      {/* Step-by-Step Itinerary Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#122B28] flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#1A8F82]" />
            <span>詳細一日行程時間表與景點美食推薦</span>
          </h3>
          <span className="text-xs text-[#546E6A]">
            點擊「地圖查看」於地圖中定位景點
          </span>
        </div>

        <div className="relative border-l-2 border-[#81D8CF] ml-4 sm:ml-6 pl-4 sm:pl-6 space-y-6">
          {itinerary.stops.map((stop, index) => {
            const badge = getCategoryBadge(stop.category);
            return (
              <div
                key={stop.id || index}
                id={`itinerary-stop-${index}`}
                className="relative bg-white rounded-2xl p-5 shadow-sm hover:shadow-md border border-[#E5DEAA] transition-all group"
              >
                {/* Node circle on timeline */}
                <div className="absolute -left-[27px] sm:-left-[35px] top-6 w-6 h-6 rounded-full bg-[#1A8F82] text-white text-xs font-black flex items-center justify-center shadow-md ring-4 ring-white">
                  {index + 1}
                </div>

                {/* Transit info from previous */}
                <div className="flex items-center space-x-2 text-xs text-[#546E6A] bg-[#FAF8E7] px-3 py-1.5 rounded-lg border border-[#E5DEAA] mb-3">
                  <div className="flex items-center space-x-1 font-semibold text-[#122B28]">
                    {getTransportIcon(stop.transportFromPrevious.mode)}
                    <span>{stop.transportFromPrevious.durationText}</span>
                  </div>
                  <span className="text-[#81D8CF]">•</span>
                  <span className="text-[#546E6A] truncate">{stop.transportFromPrevious.details}</span>
                </div>

                {/* Stop Header */}
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-[#13695F] bg-[#E5FAF7] px-2 py-0.5 rounded-md border border-[#81D8CF]/40">
                        {stop.timeSlot}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${badge.bg}`}>
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>
                      <span className="text-xs text-[#78928E]">
                        (停留約 {stop.durationMinutes} 分鐘)
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-[#122B28] mt-1.5 group-hover:text-[#1A8F82] transition-colors">
                      {stop.placeName}
                    </h4>
                    <p className="text-xs font-medium text-[#13695F] mt-0.5">
                      ✨ {stop.highlight}
                    </p>
                  </div>

                  {/* Map trigger */}
                  {onSelectStopOnMap && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onSelectStopOnMap(stop)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#FAF8E7] hover:bg-[#F8F5D6] text-[#122B28] text-xs font-semibold flex items-center space-x-1 border border-[#E5DEAA] transition-colors cursor-pointer"
                        title="在地圖中檢視位置"
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#1A8F82]" />
                        <span>地圖查看</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-[#4E6864] leading-relaxed mb-3">
                  {stop.description}
                </p>

                {/* Recommended Items & Dishes */}
                {stop.recommendedItems && stop.recommendedItems.length > 0 && (
                  <div className="mb-3">
                    <span className="text-xs font-bold text-[#122B28] block mb-1">
                      {stop.category === 'food' ? '🍜 推薦必點招牌：' : '📸 推薦體驗與拍照亮點：'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {stop.recommendedItems.map((item, i) => (
                        <span
                          key={i}
                          className="text-xs px-2.5 py-0.5 rounded-full bg-[#FAF8E7] text-[#122B28] border border-[#E5DEAA]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stop Footer (Address, Tips, Cost) */}
                <div className="pt-3 border-t border-[#FAF8E7] flex flex-wrap items-center justify-between gap-2 text-xs text-[#546E6A]">
                  <div className="flex items-center space-x-1 max-w-md truncate">
                    <MapPin className="w-3.5 h-3.5 text-[#81D8CF] flex-shrink-0" />
                    <span className="truncate">{stop.address}</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    {stop.tips && (
                      <span className="text-[#665A15] bg-[#FAF8E7] px-2 py-0.5 rounded border border-[#E5DEAA]">
                        💡 {stop.tips}
                      </span>
                    )}
                    {stop.estimatedCostNtd !== undefined && stop.estimatedCostNtd > 0 && (
                      <span className="font-semibold text-[#13695F]">
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

      {/* Taiwan Tourist Shuttle (台灣好行) Dedicated Highlight Card */}
      {itinerary.transitGuide.taiwanTripBus && (
        <div className="bg-gradient-to-br from-[#E5FAF7] via-[#FAF8E7]/40 to-white rounded-2xl shadow-md border-2 border-[#81D8CF]/70 p-5 sm:p-6 transition-all">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#81D8CF]/30 mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-[#1A8F82] text-white shadow-sm flex items-center justify-center">
                <Bus className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-[#122B28]">
                    台灣好行 Taiwan Tourist Shuttle 觀光接駁專車
                  </h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#1A8F82] text-white shadow-xs">
                    官方觀光接駁
                  </span>
                </div>
                <p className="text-xs text-[#546E6A] mt-0.5">
                  精選景點直達免自駕，無縫串聯 {itinerary.destinationStation.name}火車站 與在地知名景區
                </p>
              </div>
            </div>

            {/* Link to Taiwan Tourist Shuttle Official Website */}
            <a
              href={itinerary.transitGuide.taiwanTripBus.officialUrl || 'https://www.taiwantrip.com.tw/'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#1A8F82] text-[#13695F] hover:text-white border border-[#81D8CF] text-xs font-bold shadow-sm transition-all cursor-pointer group"
              title="前往台灣好行官方網站查詢即時公車動態、最新時刻表與套票優惠"
            >
              <span>台灣好行官網時刻與動態</span>
              <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Route Name & Boarding Location */}
            <div className="p-3.5 rounded-xl bg-white/95 border border-[#81D8CF]/40 space-y-1.5">
              <span className="text-xs font-bold text-[#13695F] flex items-center gap-1.5">
                <Route className="w-4 h-4 text-[#1A8F82]" />
                推薦接駁路線與站點
              </span>
              <p className="font-bold text-sm text-[#122B28]">
                {itinerary.transitGuide.taiwanTripBus.routeName}
              </p>
              <div className="text-xs text-[#4E6864] flex items-start gap-1 pt-1">
                <MapPin className="w-3.5 h-3.5 text-[#1A8F82] flex-shrink-0 mt-0.5" />
                <span>搭乘地點：{itinerary.transitGuide.taiwanTripBus.boardingLocation}</span>
              </div>
            </div>

            {/* Key Spots on Route */}
            <div className="p-3.5 rounded-xl bg-white/95 border border-[#81D8CF]/40 space-y-1.5">
              <span className="text-xs font-bold text-[#13695F] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#8C7C20]" />
                沿線串聯主要景點
              </span>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {(itinerary.transitGuide.taiwanTripBus.highlightSpots || []).map((spot, i) => (
                  <span
                    key={i}
                    className="text-xs font-medium px-2 py-0.5 rounded-md bg-[#FAF8E7] text-[#665A15] border border-[#E5DEAA]"
                  >
                    {spot}
                  </span>
                ))}
              </div>
            </div>

            {/* Fare, TPASS & Travel Tips */}
            <div className="p-3.5 rounded-xl bg-white/95 border border-[#81D8CF]/40 space-y-1.5">
              <span className="text-xs font-bold text-[#13695F] flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-[#1A8F82]" />
                票價乘車優惠與貼士
              </span>
              <p className="text-xs text-[#4E6864] leading-relaxed">
                💳 {itinerary.transitGuide.taiwanTripBus.fareOrPassInfo}
              </p>
              {itinerary.transitGuide.taiwanTripBus.tips && (
                <p className="text-xs text-[#665A15] bg-[#FAF8E7] p-2 rounded-lg border border-[#E5DEAA]/60 leading-relaxed">
                  💡 {itinerary.transitGuide.taiwanTripBus.tips}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transit Guide & Local Specialties Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Transit Guide */}
        <div className="bg-white rounded-2xl shadow-md border border-[#E5DEAA] p-5 sm:p-6">
          <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-[#FAF8E7]">
            <div className="p-2 rounded-xl bg-[#E5FAF7] text-[#13695F] border border-[#81D8CF]/40">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#122B28]">
                {itinerary.destinationStation.name}站 周邊交通轉乘指南
              </h3>
              <p className="text-xs text-[#546E6A]">
                出站指引、YouBike站點、在地公車與計程車資訊
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-[#4E6864]">
            <div className="p-3 bg-[#FAF8E7] rounded-xl border border-[#E5DEAA]">
              <span className="font-bold text-[#122B28] block mb-1">
                🚉 車站出站與行李寄放
              </span>
              <p className="text-[#4E6864]">{itinerary.transitGuide.stationExitTips}</p>
            </div>

            <div className="p-3 bg-[#FAF8E7] rounded-xl border border-[#E5DEAA]">
              <span className="font-bold text-[#122B28] block mb-1">
                🚲 YouBike 租借與騎乘指引
              </span>
              <p className="text-[#4E6864]">{itinerary.transitGuide.youbikeInfo}</p>
            </div>

            <div className="p-3 bg-[#FAF8E7] rounded-xl border border-[#E5DEAA]">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[#122B28]">
                  🚌 在地公車 / 台灣好行客運
                </span>
                <a
                  href="https://www.taiwantrip.com.tw/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#1A8F82] hover:underline flex items-center gap-0.5 font-medium cursor-pointer"
                >
                  <span>台灣好行官網</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-[#4E6864]">{itinerary.transitGuide.localBusSummary}</p>
            </div>

            {itinerary.transitGuide.precautions && itinerary.transitGuide.precautions.length > 0 && (
              <div className="p-3 bg-[#FAF8E7] rounded-xl border border-[#E5DEAA]">
                <span className="font-bold text-[#665A15] flex items-center gap-1 mb-1">
                  <AlertCircle className="w-3.5 h-3.5 text-[#8C7C20]" />
                  在地旅遊叮嚀與注意事項
                </span>
                <ul className="list-disc list-inside space-y-1 text-[#665A15] text-xs">
                  {itinerary.transitGuide.precautions.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Local Specialties & Bento */}
        <div className="bg-white rounded-2xl shadow-md border border-[#E5DEAA] p-5 sm:p-6">
          <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-[#FAF8E7]">
            <div className="p-2 rounded-xl bg-[#FAF8E7] text-[#8C7C20] border border-[#E5DEAA]">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#122B28]">
                {itinerary.destinationStation.name}站 在地美食名榜與便當推薦
              </h3>
              <p className="text-xs text-[#546E6A]">
                經典小吃、台鐵限定便當與必買伴手禮清單
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Bento Recommendation */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#FAF8E7] to-[#F8F5D6] border border-[#E5DEAA]">
              <div className="flex items-center space-x-2 mb-1">
                <Train className="w-4 h-4 text-[#8C7C20]" />
                <span className="font-bold text-sm text-[#122B28]">
                  🍱 台鐵鐵路便當推薦
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#4E6864] leading-relaxed">
                {itinerary.localSpecialties.bentoRecommendation}
              </p>
            </div>

            {/* Must Eat List */}
            <div>
              <span className="text-xs font-bold text-[#122B28] uppercase tracking-wider block mb-2">
                🍜 在地老饕必吃名產
              </span>
              <div className="flex flex-wrap gap-2">
                {itinerary.localSpecialties.mustEat.map((food, i) => (
                  <span
                    key={i}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#FAF8E7] text-[#665A15] border border-[#E5DEAA]"
                  >
                    {food}
                  </span>
                ))}
              </div>
            </div>

            {/* Souvenirs */}
            <div>
              <span className="text-xs font-bold text-[#122B28] uppercase tracking-wider block mb-2">
                🎁 必買人氣伴手禮
              </span>
              <div className="flex flex-wrap gap-2">
                {itinerary.localSpecialties.souvenirs.map((item, i) => (
                  <span
                    key={i}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#E5FAF7] text-[#13695F] border border-[#81D8CF]/40"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Weather & Dressing advice */}
            {itinerary.weatherAdvice && (
              <div className="p-3 bg-[#E5FAF7] rounded-xl border border-[#81D8CF]/40 text-xs text-[#13695F]">
                <span className="font-bold block mb-0.5">☀️ 旅遊裝備與穿著建議</span>
                <span>{itinerary.weatherAdvice}</span>
              </div>
            )}

            {/* Bottom PDF Export Action Banner */}
            <div className="p-4 bg-gradient-to-r from-[#0F3A35] via-[#13695F] to-[#1A8F82] rounded-2xl text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md border border-[#81D8CF]/30">
              <div className="flex items-center space-x-3 text-center sm:text-left">
                <div className="p-2.5 rounded-xl bg-white/15 text-[#81D8CF] border border-white/20">
                  <Sparkles className="w-5 h-5 text-[#F8F5D6]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">準備出發？匯出高畫質行程表</h4>
                  <p className="text-xs text-[#FAF8E7]/85 mt-0.5">
                    一鍵將路線地圖、選定火車車次、一日行程表與台灣好行接駁公車匯出為 PDF 隨身攜帶
                  </p>
                </div>
              </div>
              <button
                id="btn-bottom-export-ai-pdf"
                onClick={() => setIsPdfModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#5EC9BD] hover:bg-[#81D8CF] active:scale-95 text-[#0F3A35] text-xs font-extrabold flex items-center justify-center space-x-2 shadow-lg transition-all cursor-pointer flex-shrink-0"
              >
                <FileDown className="w-4 h-4 text-[#0F3A35]" />
                <span>AI 整合匯出 PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Export Modal */}
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
