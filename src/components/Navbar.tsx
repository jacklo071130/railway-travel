import React from 'react';
import { Train, MapPin, Bookmark, Sparkles, ExternalLink, Compass, Key, CheckCircle2 } from 'lucide-react';
import { TRAStation, ApiKeysConfig } from '../types';

interface NavbarProps {
  onOpenSaved: () => void;
  savedCount: number;
  onOpenAssistant: () => void;
  onLocateMe: () => void;
  isLocating: boolean;
  userNearestStation?: TRAStation | null;
  activeTab: 'planner' | 'map' | 'explorer' | 'tra-info';
  setActiveTab: (tab: 'planner' | 'map' | 'explorer' | 'tra-info') => void;
  onOpenApiKeyModal: () => void;
  apiKeys: ApiKeysConfig;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSaved,
  savedCount,
  onOpenAssistant,
  onLocateMe,
  isLocating,
  userNearestStation,
  activeTab,
  setActiveTab,
  onOpenApiKeyModal,
  apiKeys,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#F8F5D6]/95 backdrop-blur-md border-b border-[#E5DEAA] text-[#122B28] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('planner')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1A8F82] via-[#81D8CF] to-[#B6F5EF] flex items-center justify-center shadow-md shadow-[#81D8CF]/30 text-[#0F3A35]">
              <Train className="w-6 h-6 text-[#0F3A35]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-wide text-[#122B28]">台灣鐵道漫遊</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#81D8CF]/30 text-[#146E64] font-bold border border-[#81D8CF]">
                  AI 旅遊規劃
                </span>
              </div>
              <p className="text-xs text-[#546E6A] hidden sm:block">
                台鐵時刻整合 ✕ AI一日遊景點美食 ✕ Google Maps 導航
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-white/80 p-1 rounded-xl border border-[#E5DEAA] shadow-2xs">
            <button
              id="nav-tab-planner"
              onClick={() => setActiveTab('planner')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'planner'
                  ? 'bg-[#1A8F82] text-white shadow-sm'
                  : 'text-[#4E6864] hover:text-[#122B28] hover:bg-[#F8F5D6]'
              }`}
            >
              行程規劃
            </button>
            <button
              id="nav-tab-map"
              onClick={() => setActiveTab('map')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'map'
                  ? 'bg-[#1A8F82] text-white shadow-sm'
                  : 'text-[#4E6864] hover:text-[#122B28] hover:bg-[#F8F5D6]'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>景點周邊地圖</span>
            </button>
            <button
              id="nav-tab-explorer"
              onClick={() => setActiveTab('explorer')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'explorer'
                  ? 'bg-[#1A8F82] text-white shadow-sm'
                  : 'text-[#4E6864] hover:text-[#122B28] hover:bg-[#F8F5D6]'
              }`}
            >
              車站周邊探索
            </button>
            <button
              id="nav-tab-tra-info"
              onClick={() => setActiveTab('tra-info')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'tra-info'
                  ? 'bg-[#1A8F82] text-white shadow-sm'
                  : 'text-[#4E6864] hover:text-[#122B28] hover:bg-[#F8F5D6]'
              }`}
            >
              台鐵乘車指南
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* GPS Nearest Station button */}
            <button
              id="btn-locate-station"
              onClick={onLocateMe}
              disabled={isLocating}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-white hover:bg-[#F8F5D6] border border-[#E5DEAA] text-xs sm:text-sm font-semibold text-[#122B28] flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
              title="定位目前位置並找出最近的火車站"
            >
              <MapPin className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1A8F82] ${isLocating ? 'animate-bounce' : ''}`} />
              <span className="hidden sm:inline">
                {isLocating ? '定位中...' : userNearestStation ? `最近: ${userNearestStation.name}站` : '定位最近車站'}
              </span>
            </button>

            {/* AI Assistant drawer trigger */}
            <button
              id="btn-open-ai-assistant"
              onClick={onOpenAssistant}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#1A8F82] to-[#5EC9BD] hover:from-[#13695F] hover:to-[#4AA89E] text-white text-xs sm:text-sm font-bold flex items-center space-x-1.5 shadow-md shadow-[#81D8CF]/30 transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 animate-pulse" />
              <span>AI 隨身導遊</span>
            </button>

            {/* API Key Settings Button */}
            <button
              id="btn-open-api-keys"
              onClick={onOpenApiKeyModal}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-semibold flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs ${
                apiKeys.isGeminiValid || apiKeys.geminiApiKey
                  ? 'bg-white hover:bg-[#F8F5D6] border-[#E5DEAA] text-[#122B28]'
                  : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900 animate-pulse'
              }`}
              title="驗證並暫存 Gemini AI 金鑰（僅記憶體暫存）"
            >
              <Key className="w-3.5 h-3.5 text-[#1A8F82]" />
              <span className="hidden xl:inline">Gemini API 金鑰</span>
              <span className="flex items-center gap-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    apiKeys.isGeminiValid ? 'bg-[#1A8F82] shadow-[0_0_6px_rgba(26,143,130,0.8)]' : 'bg-slate-300'
                  }`}
                  title={apiKeys.isGeminiValid ? 'Gemini AI 金鑰已啟用' : 'Gemini AI 金鑰待設定'}
                />
              </span>
            </button>

            {/* Saved Trips Bookmark */}
            <button
              id="btn-saved-trips"
              onClick={onOpenSaved}
              className="p-2 rounded-lg bg-white hover:bg-[#F8F5D6] border border-[#E5DEAA] text-[#122B28] relative transition-colors cursor-pointer shadow-2xs"
              title="已儲存的鐵道行程"
            >
              <Bookmark className="w-4 h-4 text-amber-500 fill-amber-500" />
              {savedCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center border-2 border-white">
                  {savedCount}
                </span>
              )}
            </button>

            {/* TRA Official Website Link */}
            <a
              id="link-tra-official"
              href="https://www.railway.gov.tw/tra-tip-web/tip"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center space-x-1 text-xs text-[#546E6A] hover:text-[#1A8F82] transition-colors pl-1 font-semibold"
              title="前往台鐵官方網站時刻表與票價查詢"
            >
              <span>台鐵官網</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-[#E5DEAA] text-xs font-semibold">
          <button
            onClick={() => setActiveTab('planner')}
            className={`py-1 px-2 rounded ${activeTab === 'planner' ? 'text-[#1A8F82] font-bold' : 'text-[#546E6A]'}`}
          >
            行程規劃
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`py-1 px-2 rounded ${activeTab === 'map' ? 'text-[#1A8F82] font-bold' : 'text-[#546E6A]'}`}
          >
            景點周邊地圖
          </button>
          <button
            onClick={() => setActiveTab('explorer')}
            className={`py-1 px-2 rounded ${activeTab === 'explorer' ? 'text-[#1A8F82] font-bold' : 'text-[#546E6A]'}`}
          >
            周邊探索
          </button>
          <button
            onClick={() => setActiveTab('tra-info')}
            className={`py-1 px-2 rounded ${activeTab === 'tra-info' ? 'text-[#1A8F82] font-bold' : 'text-[#546E6A]'}`}
          >
            乘車指南
          </button>
        </div>
      </div>
    </header>
  );
};
