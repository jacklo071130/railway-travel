import React, { useState, useMemo } from 'react';
import { 
  Utensils, 
  MapPin, 
  Navigation, 
  Sparkles, 
  ShoppingBag, 
  Star, 
  Search, 
  Check, 
  Plus, 
  CheckSquare, 
  Square, 
  CheckCircle2,
  BookmarkCheck,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { TRAStation } from '../types';
import confetti from 'canvas-confetti';

export interface NearbyItem {
  id: string;
  name: string;
  category: 'food' | 'spot' | 'souvenir';
  categoryName: string;
  description: string;
  distance: string;
  rating: number;
  googleQuery: string;
}

interface NearbyExplorerProps {
  station: TRAStation;
  onPlanTripToStation?: (station: TRAStation) => void;
  onAddItemsToItinerary?: (items: NearbyItem[], station: TRAStation) => void;
  currentItineraryItemNames?: string[];
}

export const NearbyExplorer: React.FC<NearbyExplorerProps> = ({ 
  station, 
  onPlanTripToStation,
  onAddItemsToItinerary,
  currentItineraryItemNames = []
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'food' | 'spot' | 'souvenir'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [justAddedIds, setJustAddedIds] = useState<string[]>([]);

  // Curated station items based on station dataset
  const items: NearbyItem[] = useMemo(() => [
    ...station.popularFoods.map((food, idx) => ({
      id: `food-${idx}`,
      name: food,
      category: 'food' as const,
      categoryName: '必吃在地美食',
      description: `位於${station.name}站周邊老饕推薦的在地名店與經典古早味，傳承道地風味。`,
      distance: '出站步行約 3~8 分鐘',
      rating: 4.6 + (idx % 4) * 0.1,
      googleQuery: `${station.name} ${food}`,
    })),
    ...station.popularAttractions.map((spot, idx) => ({
      id: `spot-${idx}`,
      name: spot,
      category: 'spot' as const,
      categoryName: '熱門必訪景點',
      description: `${station.county}${station.name}站代表性觀光地標，拍照打卡與散步悠遊首選。`,
      distance: '步行或騎乘 YouBike 約 5~15 分鐘',
      rating: 4.7 + (idx % 3) * 0.1,
      googleQuery: `${station.county} ${spot}`,
    })),
    {
      id: 'bento',
      name: `${station.name}站特色台鐵便當`,
      category: 'food' as const,
      categoryName: '台鐵經典風味',
      description: '台鐵傳奇排骨便當與在地限定風味便當，乘車旅行不可錯過的美味記憶。',
      distance: `${station.name}火車站站內台鐵便當本舖`,
      rating: 4.8,
      googleQuery: `${station.name}火車站 台鐵便當`,
    },
    {
      id: 'souvenir-1',
      name: `${station.county} 特產伴手禮名店`,
      category: 'souvenir' as const,
      categoryName: '必買伴手禮',
      description: `嚴選${station.county}在地農特產與老字號糕餅，送禮自用皆適宜。`,
      distance: '站前商圈伴手禮街',
      rating: 4.7,
      googleQuery: `${station.name} 伴手禮名產`,
    },
  ], [station]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchCat = activeCategory === 'all' || item.category === activeCategory;
      const matchSearch =
        !searchTerm ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [items, activeCategory, searchTerm]);

  // Toggle single item selection
  const handleToggleSelect = (itemId: string) => {
    setSelectedItemIds((prev) => 
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  // Select all currently visible items
  const handleSelectAllVisible = () => {
    const visibleIds = filteredItems.map((i) => i.id);
    const allSelected = visibleIds.every((id) => selectedItemIds.includes(id));
    if (allSelected) {
      setSelectedItemIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedItemIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  // Clear all selections
  const handleClearSelection = () => {
    setSelectedItemIds([]);
  };

  // Add multiple selected items to itinerary
  const handleAddSelectedToItinerary = () => {
    if (!onAddItemsToItinerary) return;
    const selectedItems = items.filter((item) => selectedItemIds.includes(item.id));
    if (selectedItems.length === 0) return;

    try {
      confetti({
        particleCount: 45,
        spread: 65,
        origin: { y: 0.8 },
        colors: ['#1A8F82', '#5EC9BD', '#FAF8E7', '#F8F5D6']
      });
    } catch {}

    setJustAddedIds(selectedItems.map((i) => i.id));
    onAddItemsToItinerary(selectedItems, station);

    setTimeout(() => {
      setSelectedItemIds([]);
    }, 400);
  };

  // Quick add single item to itinerary
  const handleAddSingleItem = (item: NearbyItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onAddItemsToItinerary) return;

    try {
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.85 },
        colors: ['#1A8F82', '#5EC9BD', '#FAF8E7']
      });
    } catch {}

    setJustAddedIds((prev) => [...prev, item.id]);
    onAddItemsToItinerary([item], station);
  };

  const isAllVisibleSelected = 
    filteredItems.length > 0 && 
    filteredItems.every((item) => selectedItemIds.includes(item.id));

  return (
    <div className="space-y-6 pb-20">
      {/* Station Overview Banner */}
      <div className="bg-gradient-to-r from-[#0F3A35] via-[#13695F] to-[#1A8F82] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-[#81D8CF]/30 relative overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#81D8CF]/30 text-[#FAF8E7] text-xs font-semibold border border-[#81D8CF]/40">
                {station.line}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#FAF8E7]/20 text-[#FAF8E7] text-xs font-semibold border border-[#E5DEAA]/50">
                {station.gradeLabel}
              </span>
              <span className="text-xs text-[#FAF8E7]/80">
                {station.county} • 站碼: {station.id}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {station.name}火車站 周邊美食景點探索
            </h2>
            <p className="text-xs sm:text-sm text-[#FAF8E7]/90 mt-2 max-w-2xl leading-relaxed">
              {station.description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {onPlanTripToStation && (
              <button
                id="btn-plan-trip-to-station"
                onClick={() => onPlanTripToStation(station)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#5EC9BD] to-[#81D8CF] hover:brightness-105 text-[#0F3A35] font-bold text-xs sm:text-sm shadow-md flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#8C7C20]" />
                <span>以{station.name}站規劃一日遊</span>
              </button>
            )}

            <a
              id="link-station-google-maps"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(station.name + '火車站')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold border border-white/20 flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Navigation className="w-4 h-4 text-[#81D8CF]" />
              <span>Google Maps 地圖定位</span>
            </a>
          </div>
        </div>

        {/* Station Facilities */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/15 text-xs relative z-10">
          <div className="flex items-center space-x-2 text-[#FAF8E7]">
            <span className="w-2 h-2 rounded-full bg-[#81D8CF]" />
            <span>YouBike 2.0: {station.hasYouBike ? '站前設有站點' : '周邊轉乘公車'}</span>
          </div>
          <div className="flex items-center space-x-2 text-[#FAF8E7]">
            <span className="w-2 h-2 rounded-full bg-[#81D8CF]" />
            <span>自動寄物櫃: {station.hasLuggageLocker ? '站內提供' : '站內服務台洽詢'}</span>
          </div>
          <div className="flex items-center space-x-2 text-[#FAF8E7]">
            <span className="w-2 h-2 rounded-full bg-[#F8F5D6]" />
            <span>台鐵便當: 站內/周邊老店供應</span>
          </div>
          <div className="flex items-center space-x-2 text-[#FAF8E7]">
            <span className="w-2 h-2 rounded-full bg-[#5EC9BD]" />
            <span>公車接駁: 站前客運總站</span>
          </div>
        </div>
      </div>

      {/* Filter and Selection Control Toolbar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E5DEAA] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Categories */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              id="filter-category-all"
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-[#1A8F82] text-white shadow-sm'
                  : 'bg-[#FAF8E7] hover:bg-[#F8F5D6] text-[#122B28] border border-[#E5DEAA]'
              }`}
            >
              全部推薦 ({items.length})
            </button>
            <button
              id="filter-category-food"
              onClick={() => setActiveCategory('food')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 transition-colors cursor-pointer ${
                activeCategory === 'food'
                  ? 'bg-[#8C7C20] text-white shadow-sm'
                  : 'bg-[#FAF8E7] hover:bg-[#F8F5D6] text-[#122B28] border border-[#E5DEAA]'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>在地美食榜</span>
            </button>
            <button
              id="filter-category-spot"
              onClick={() => setActiveCategory('spot')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 transition-colors cursor-pointer ${
                activeCategory === 'spot'
                  ? 'bg-[#13695F] text-white shadow-sm'
                  : 'bg-[#FAF8E7] hover:bg-[#F8F5D6] text-[#122B28] border border-[#E5DEAA]'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>必訪景點</span>
            </button>
            <button
              id="filter-category-souvenir"
              onClick={() => setActiveCategory('souvenir')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 transition-colors cursor-pointer ${
                activeCategory === 'souvenir'
                  ? 'bg-[#1A8F82] text-white shadow-sm'
                  : 'bg-[#FAF8E7] hover:bg-[#F8F5D6] text-[#122B28] border border-[#E5DEAA]'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>伴手禮名店</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#78928E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-nearby"
              type="text"
              placeholder="搜尋站周邊美食或景點..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAF8E7] border border-[#E5DEAA] rounded-xl text-[#122B28] placeholder-[#78928E] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#81D8CF]"
            />
          </div>
        </div>

        {/* Selection Bar Actions */}
        <div className="pt-3 border-t border-[#E5DEAA]/70 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2">
            <button
              id="btn-select-all-visible"
              type="button"
              onClick={handleSelectAllVisible}
              className="px-3 py-1.5 rounded-xl bg-[#FAF8E7] hover:bg-[#F8F5D6] border border-[#E5DEAA] text-[#122B28] text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              {isAllVisibleSelected ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-[#1A8F82]" />
                  <span>取消全選</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5 text-[#546E6A]" />
                  <span>全選目前項目 ({filteredItems.length})</span>
                </>
              )}
            </button>

            {selectedItemIds.length > 0 && (
              <button
                id="btn-clear-selection"
                type="button"
                onClick={handleClearSelection}
                className="px-2.5 py-1.5 text-xs text-[#546E6A] hover:text-[#0F3A35] font-semibold underline flex items-center space-x-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>清空勾選</span>
              </button>
            )}

            <span className="text-xs text-[#546E6A] font-medium ml-1">
              已選取 <strong className="text-[#1A8F82] font-black text-sm">{selectedItemIds.length}</strong> / {items.length} 項
            </span>
          </div>

          {/* Top batch add button if items are selected */}
          {selectedItemIds.length > 0 && onAddItemsToItinerary && (
            <button
              id="btn-add-selected-top"
              type="button"
              onClick={handleAddSelectedToItinerary}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#1A8F82] to-[#13695F] hover:brightness-110 active:scale-95 text-white text-xs font-bold shadow-md shadow-[#1A8F82]/20 flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#81D8CF]" />
              <span>將選取的 {selectedItemIds.length} 個項目加入行程規劃</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const isSelected = selectedItemIds.includes(item.id);
          const isAlreadyInItinerary = currentItineraryItemNames.some(
            (name) => name.toLowerCase().includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(name.toLowerCase())
          );
          const isJustAdded = justAddedIds.includes(item.id);

          const isFood = item.category === 'food';
          const isSpot = item.category === 'spot';
          const badgeClass = isFood
            ? 'bg-[#FAF8E7] text-[#665A15] border-[#E5DEAA]'
            : isSpot
            ? 'bg-[#E5FAF7] text-[#13695F] border-[#81D8CF]/50'
            : 'bg-[#FAF8E7] text-[#8C7C20] border-[#E5DEAA]';

          return (
            <div
              key={item.id}
              id={`item-card-${item.id}`}
              onClick={() => handleToggleSelect(item.id)}
              className={`rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer relative select-none border-2 ${
                isSelected
                  ? 'bg-[#FAF8E7]/40 border-[#1A8F82] ring-2 ring-[#81D8CF]/50 shadow-md'
                  : 'bg-white border-[#E5DEAA] hover:border-[#81D8CF]/70'
              }`}
            >
              {/* Top Row: Category Badge, Rating & Checkbox */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${badgeClass}`}>
                      {item.categoryName}
                    </span>
                    {isAlreadyInItinerary && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#81D8CF]/20 text-[#0F3A35] border border-[#81D8CF]/40 flex items-center space-x-0.5">
                        <BookmarkCheck className="w-3 h-3 text-[#13695F]" />
                        <span>已在行程中</span>
                      </span>
                    )}
                  </div>

                  {/* Selection Checkbox */}
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 text-[#8C7C20] text-xs font-bold mr-1">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{item.rating.toFixed(1)}</span>
                    </div>

                    <div 
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'bg-[#1A8F82] text-white shadow-sm' 
                          : 'bg-[#FAF8E7] border border-[#E5DEAA] text-transparent hover:border-[#1A8F82]'
                      }`}
                      title={isSelected ? '點擊取消選取' : '點擊選取加入行程'}
                    >
                      <Check className={`w-4 h-4 stroke-[3] ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                    </div>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-[#122B28] mb-1 leading-snug">
                    {item.name}
                  </h3>
                </div>

                <p className="text-xs text-[#546E6A] mb-3 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Bottom Actions Row */}
              <div className="pt-3 border-t border-[#E5DEAA]/60 flex items-center justify-between gap-2">
                <span className="text-xs text-[#78928E] flex items-center gap-1 truncate max-w-[140px]">
                  <MapPin className="w-3 h-3 text-[#1A8F82] flex-shrink-0" />
                  <span className="truncate">{item.distance}</span>
                </span>

                <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                  {/* Single Item Add to Itinerary Button */}
                  {onAddItemsToItinerary && (
                    <button
                      id={`btn-add-item-${item.id}`}
                      type="button"
                      onClick={(e) => handleAddSingleItem(item, e)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 transition-all active:scale-95 cursor-pointer shadow-xs ${
                        isJustAdded
                          ? 'bg-[#81D8CF] text-[#0F3A35]'
                          : 'bg-[#1A8F82] hover:bg-[#13695F] text-white'
                      }`}
                      title="直接將此項目加入行程規劃"
                    >
                      {isJustAdded ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0F3A35]" />
                          <span>已加入！</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>加入行程</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Google Maps Navigation */}
                  <a
                    id={`link-nav-item-${item.id}`}
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.googleQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-xl bg-[#FAF8E7] hover:bg-[#F8F5D6] text-[#122B28] border border-[#E5DEAA] text-xs font-bold flex items-center space-x-1 transition-all active:scale-95"
                    title="於 Google 地圖中開啟並導航"
                  >
                    <Navigation className="w-3 h-3 text-[#1A8F82]" />
                    <span>導航</span>
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Action Bar for Multi-Selection */}
      {selectedItemIds.length > 0 && onAddItemsToItinerary && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-2xl bg-[#0F3A35]/95 backdrop-blur-md text-white px-5 py-3.5 rounded-2xl shadow-2xl border-2 border-[#81D8CF]/80 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-xl bg-[#81D8CF] text-[#0F3A35] flex items-center justify-center font-black text-xs shadow-sm">
              {selectedItemIds.length}
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <span>已勾選 {selectedItemIds.length} 個【{station.name}站】項目</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/20 text-[#FAF8E7]">準備加入</span>
              </p>
              <p className="text-[11px] text-[#FAF8E7]/80 hidden sm:block">
                點擊按鈕將選取的美食與景點直接排入一日遊行程與地圖路線中
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="btn-floating-clear"
              type="button"
              onClick={handleClearSelection}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#FAF8E7] text-xs font-semibold transition-colors cursor-pointer border border-white/15"
            >
              取消
            </button>

            <button
              id="btn-floating-add-to-itinerary"
              type="button"
              onClick={handleAddSelectedToItinerary}
              className="px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-[#5EC9BD] to-[#81D8CF] hover:brightness-105 active:scale-95 text-[#0F3A35] text-xs sm:text-sm font-black flex items-center space-x-1.5 shadow-lg shadow-[#81D8CF]/30 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#8C7C20]" />
              <span>加入行程規劃 ({selectedItemIds.length})</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
