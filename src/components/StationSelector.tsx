import React, { useState, useMemo } from 'react';
import { ArrowLeftRight, Train, Sparkles, SlidersHorizontal, Calendar, Search, MapPin, ExternalLink } from 'lucide-react';
import { TRAStation, TravelPreferences } from '../types';
import { TAIWAN_TRA_STATIONS, REGIONS, POPULAR_ROUTE_SHORTCUTS } from '../data/taiwanStations';

interface StationSelectorProps {
  origin: TRAStation;
  destination: TRAStation;
  onSelectOrigin: (station: TRAStation) => void;
  onSelectDestination: (station: TRAStation) => void;
  onSwap: () => void;
  travelDate: string;
  onChangeDate: (date: string) => void;
  preferences: TravelPreferences;
  onOpenPreferences: () => void;
  onGenerateItinerary: () => void;
  isLoading: boolean;
}

export const StationSelector: React.FC<StationSelectorProps> = ({
  origin,
  destination,
  onSelectOrigin,
  onSelectDestination,
  onSwap,
  travelDate,
  onChangeDate,
  preferences,
  onOpenPreferences,
  onGenerateItinerary,
  isLoading,
}) => {
  const [activeModal, setActiveModal] = useState<'origin' | 'destination' | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredStations = useMemo(() => {
    return TAIWAN_TRA_STATIONS.filter((station) => {
      const matchRegion = selectedRegion === 'all' || station.region === selectedRegion;
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        station.name.toLowerCase().includes(query) ||
        station.nameEn.toLowerCase().includes(query) ||
        station.county.toLowerCase().includes(query) ||
        station.popularFoods.some((f) => f.toLowerCase().includes(query)) ||
        station.popularAttractions.some((a) => a.toLowerCase().includes(query));
      return matchRegion && matchSearch;
    });
  }, [selectedRegion, searchQuery]);

  const handleSelectModalStation = (station: TRAStation) => {
    if (activeModal === 'origin') {
      onSelectOrigin(station);
    } else if (activeModal === 'destination') {
      onSelectDestination(station);
    }
    setActiveModal(null);
    setSearchQuery('');
  };

  const handleApplyShortcut = (fromId: string, toId: string) => {
    const fromStation = TAIWAN_TRA_STATIONS.find((s) => s.id === fromId);
    const toStation = TAIWAN_TRA_STATIONS.find((s) => s.id === toId);
    if (fromStation) onSelectOrigin(fromStation);
    if (toStation) onSelectDestination(toStation);
  };

  const getStyleLabel = (style: string) => {
    switch (style) {
      case 'gourmet': return '🍜 美食老饕';
      case 'instagram': return '📸 網美打卡';
      case 'culture': return '🏛️ 歷史人文';
      case 'family': return '👨‍👩‍👧 親子同樂';
      case 'nature': return '🌲 自然景觀';
      case 'slow_life': return '☕ 慢活悠閒';
      default: return '🍜 美食景點';
    }
  };

  const getCompanionLabel = (companion: string) => {
    switch (companion) {
      case 'solo': return '獨旅';
      case 'couple': return '情侶約會';
      case 'family_elder': return '長輩同行';
      case 'family_kids': return '親子育兒';
      case 'friends': return '好友同行';
      default: return '雙人';
    }
  };

  const getTransportLabel = (transport: string) => {
    switch (transport) {
      case 'walk_youbike': return '🚶 步行 + YouBike';
      case 'public_bus': return '🚌 在地公車/台灣好行';
      case 'scooter_rental': return '🛵 租機車漫遊';
      case 'taxi_car': return '🚕 計程車/包車';
      default: return '步行+YouBike';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-5 sm:p-7 relative overflow-hidden">
      {/* Decorative subtle background train track line */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-50/60 via-indigo-50/30 to-transparent rounded-full pointer-events-none -mr-20 -mt-20" />

      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 relative z-10">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Train className="w-6 h-6 text-blue-600" />
            <span>選擇火車站起訖站 ✕ AI 一日遊規劃</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            選定起訖火車站，AI 將自動串聯台鐵最佳班次、在地美食必吃榜、景點交通路線與地圖導航。
          </p>
        </div>

        <a
          href="https://www.railway.gov.tw/tra-tip-web/tip"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 transition-colors"
        >
          <span>台鐵官方時刻表查詢</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Popular Shortcuts */}
      <div className="mb-6 relative z-10">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
          熱門鐵道一日遊路線捷徑
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {POPULAR_ROUTE_SHORTCUTS.map((sc) => {
            const isCurrent = origin.id === sc.from && destination.id === sc.to;
            return (
              <button
                key={`${sc.from}-${sc.to}`}
                id={`shortcut-${sc.from}-${sc.to}`}
                onClick={() => handleApplyShortcut(sc.from, sc.to)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  isCurrent
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border-slate-200'
                }`}
              >
                <span className="font-bold">{sc.title}</span>
                <span className={`ml-1.5 text-[11px] ${isCurrent ? 'text-blue-100' : 'text-slate-400'}`}>
                  ({sc.tag})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Selection Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center relative z-10 mb-6">
        {/* Origin Station */}
        <div className="lg:col-span-4 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl p-4 transition-all focus-within:ring-2 focus-within:ring-blue-500">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              出發火車站 (起點)
            </span>
            <span className="text-xs text-slate-400">{origin.county}</span>
          </div>
          <button
            id="btn-select-origin"
            onClick={() => setActiveModal('origin')}
            className="w-full text-left flex items-center justify-between group"
          >
            <div>
              <div className="text-2xl font-black text-slate-800 group-hover:text-blue-600 transition-colors">
                {origin.name} <span className="text-sm font-normal text-slate-400">站</span>
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5 max-w-[220px]">
                {origin.line} • {origin.nameEn}
              </p>
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-100/60 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
              更換
            </span>
          </button>
        </div>

        {/* Swap Button */}
        <div className="lg:col-span-1 flex justify-center">
          <button
            id="btn-swap-stations"
            onClick={onSwap}
            className="p-3 rounded-full bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 border border-slate-300 shadow-sm transition-all active:scale-95"
            title="對調起點與目的地火車站"
          >
            <ArrowLeftRight className="w-5 h-5" />
          </button>
        </div>

        {/* Destination Station */}
        <div className="lg:col-span-4 bg-blue-50/40 hover:bg-blue-50/70 border-2 border-blue-300/80 rounded-xl p-4 transition-all focus-within:ring-2 focus-within:ring-blue-500">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-blue-700 flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              旅遊目的地火車站 (一日遊核心)
            </span>
            <span className="text-xs text-blue-600 font-medium">{destination.county}</span>
          </div>
          <button
            id="btn-select-destination"
            onClick={() => setActiveModal('destination')}
            className="w-full text-left flex items-center justify-between group"
          >
            <div>
              <div className="text-2xl font-black text-blue-900 group-hover:text-blue-600 transition-colors">
                {destination.name} <span className="text-sm font-normal text-slate-500">站</span>
              </div>
              <p className="text-xs text-slate-600 truncate mt-0.5 max-w-[220px]">
                {destination.popularFoods[0] ? `必吃: ${destination.popularFoods[0]}` : destination.line}
              </p>
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-white border border-blue-200 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
              更換
            </span>
          </button>
        </div>

        {/* Date & Quick Config */}
        <div className="lg:col-span-3 bg-slate-50/80 border border-slate-200 rounded-xl p-4">
          <div className="mb-2">
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1 mb-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              旅遊出發日期
            </label>
            <input
              id="input-travel-date"
              type="date"
              value={travelDate}
              onChange={(e) => onChangeDate(e.target.value)}
              className="w-full text-sm font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>預設行程: 08:30出發~18:30回程</span>
          </div>
        </div>
      </div>

      {/* Preferences & AI Generate Button Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 relative z-10">
        {/* Preference Tags summary */}
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-xs text-slate-500 font-medium">個人化偏好:</span>
          <button
            id="btn-open-preferences"
            onClick={onOpenPreferences}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
            <span>{getStyleLabel(preferences.style)}</span>
            <span className="text-slate-400">|</span>
            <span>{getCompanionLabel(preferences.companion)}</span>
            <span className="text-slate-400">|</span>
            <span>{getTransportLabel(preferences.transport)}</span>
            <span className="text-blue-600 text-[11px] underline ml-1">修改</span>
          </button>
        </div>

        {/* Generate Button */}
        <button
          id="btn-generate-itinerary"
          onClick={onGenerateItinerary}
          disabled={isLoading}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm sm:text-base flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/25 transition-all transform active:scale-98 disabled:opacity-70 cursor-pointer"
        >
          <Sparkles className={`w-5 h-5 text-amber-300 ${isLoading ? 'animate-spin' : 'animate-pulse'}`} />
          <span>{isLoading ? 'AI 正在規劃完美一日遊行程中...' : `一鍵生成【${origin.name} ➔ ${destination.name}】一日遊詳細行程`}</span>
        </button>
      </div>

      {/* Station Picker Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Train className="w-5 h-5 text-blue-600" />
                  <span>選擇{activeModal === 'origin' ? '出發起點' : '旅遊目的地'}火車站</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  涵蓋台鐵縱貫線、宜蘭線、北迴線、臺東線、南迴線及平溪/內灣/集集/深澳等支線
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveModal(null);
                  setSearchQuery('');
                }}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Search and Filters */}
            <div className="p-4 border-b border-slate-200 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="modal-station-search-input"
                  type="text"
                  placeholder="搜尋車站名稱、縣市或美食 (例如: 礁溪、台南牛肉湯、十分、勝興)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-100 rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              {/* Region Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {REGIONS.map((region) => (
                  <button
                    key={region.id}
                    onClick={() => setSelectedRegion(region.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      selectedRegion === region.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {region.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Station List */}
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[50vh]">
              {filteredStations.length === 0 ? (
                <div className="col-span-2 py-10 text-center text-slate-400 text-sm">
                  找不到符合條件的火車站，請嘗試不同關鍵字。
                </div>
              ) : (
                filteredStations.map((station) => {
                  const isCurrent =
                    activeModal === 'origin' ? origin.id === station.id : destination.id === station.id;
                  return (
                    <button
                      key={station.id}
                      onClick={() => handleSelectModalStation(station)}
                      className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between ${
                        isCurrent
                          ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                          : 'bg-slate-50/60 hover:bg-blue-50/50 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-slate-800">{station.name}站</span>
                          <span className="text-xs text-slate-400 font-normal">({station.nameEn})</span>
                        </div>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-200/70 text-slate-600">
                          {station.county}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-1 mt-1">{station.description}</p>

                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {station.popularFoods.slice(0, 2).map((food, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200"
                          >
                            🍜 {food}
                          </span>
                        ))}
                        {station.hasYouBike && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            🚲 YouBike
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 text-center">
              點擊車站立即設定為{activeModal === 'origin' ? '起點站' : '目的地站'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
