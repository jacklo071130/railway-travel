import React, { useState } from 'react';
import { Utensils, MapPin, Navigation, ExternalLink, Sparkles, Coffee, ShoppingBag, Star, Bike, Search } from 'lucide-react';
import { TRAStation } from '../types';

interface NearbyExplorerProps {
  station: TRAStation;
  onPlanTripToStation?: (station: TRAStation) => void;
}

export const NearbyExplorer: React.FC<NearbyExplorerProps> = ({ station, onPlanTripToStation }) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'food' | 'spot' | 'souvenir'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Sample curated station items based on station dataset
  const items = [
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
  ];

  const filteredItems = items.filter((item) => {
    const matchCat = activeCategory === 'all' || item.category === activeCategory;
    const matchSearch =
      !searchTerm ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Station Overview Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-300 text-xs font-semibold border border-blue-400/30">
                {station.line}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-400/30">
                {station.gradeLabel}
              </span>
              <span className="text-xs text-slate-300">
                {station.county} • 站碼: {station.id}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {station.name}火車站 周邊美食景點探索
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              {station.description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {onPlanTripToStation && (
              <button
                onClick={() => onPlanTripToStation(station)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center space-x-1.5 transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>以{station.name}站規劃一日遊</span>
              </button>
            )}

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(station.name + '火車站')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold border border-white/20 flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Navigation className="w-4 h-4 text-emerald-400" />
              <span>Google Maps 地圖定位</span>
            </a>
          </div>
        </div>

        {/* Station Facilities */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>YouBike 2.0: {station.hasYouBike ? '站前設有站點' : '周邊轉乘公車'}</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>自動寄物櫃: {station.hasLuggageLocker ? '站內提供' : '站內服務台洽詢'}</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>台鐵便當: 站內/周邊老店供應</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span>公車接駁: 站前客運總站</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeCategory === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            全部推薦 ({items.length})
          </button>
          <button
            onClick={() => setActiveCategory('food')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 transition-colors ${
              activeCategory === 'food'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>在地美食榜</span>
          </button>
          <button
            onClick={() => setActiveCategory('spot')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 transition-colors ${
              activeCategory === 'spot'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>必訪景點</span>
          </button>
          <button
            onClick={() => setActiveCategory('souvenir')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 transition-colors ${
              activeCategory === 'souvenir'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>伴手禮名店</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜尋站周邊美食或景點..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Grid of Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const isFood = item.category === 'food';
          const isSpot = item.category === 'spot';
          const badgeClass = isFood
            ? 'bg-amber-50 text-amber-700 border-amber-200'
            : isSpot
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-purple-50 text-purple-700 border-purple-200';

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md border border-slate-200 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${badgeClass}`}>
                    {item.categoryName}
                  </span>
                  <div className="flex items-center space-x-1 text-amber-500 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{item.rating.toFixed(1)}</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1">{item.name}</h3>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">{item.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {item.distance}
                </span>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.googleQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 text-xs font-bold flex items-center space-x-1 transition-all active:scale-95"
                >
                  <Navigation className="w-3 h-3" />
                  <span>Google 導航</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
