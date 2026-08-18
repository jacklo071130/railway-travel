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
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('planner')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Train className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-wide text-white">台灣鐵道漫遊</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-medium border border-blue-400/30">
                  AI 旅遊規劃
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                台鐵時刻整合 ✕ AI一日遊景點美食 ✕ Google Maps 導航
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              id="nav-tab-planner"
              onClick={() => setActiveTab('planner')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'planner'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              行程規劃
            </button>
            <button
              id="nav-tab-map"
              onClick={() => setActiveTab('map')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'map'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>全台地圖</span>
            </button>
            <button
              id="nav-tab-explorer"
              onClick={() => setActiveTab('explorer')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'explorer'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              車站周邊探索
            </button>
            <button
              id="nav-tab-tra-info"
              onClick={() => setActiveTab('tra-info')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'tra-info'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
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
              className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs sm:text-sm font-medium text-slate-200 flex items-center space-x-1.5 transition-colors"
              title="定位目前位置並找出最近的火車站"
            >
              <MapPin className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 ${isLocating ? 'animate-bounce' : ''}`} />
              <span className="hidden sm:inline">
                {isLocating ? '定位中...' : userNearestStation ? `最近: ${userNearestStation.name}站` : '定位最近車站'}
              </span>
            </button>

            {/* AI Assistant drawer trigger */}
            <button
              id="btn-open-ai-assistant"
              onClick={onOpenAssistant}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs sm:text-sm font-medium flex items-center space-x-1.5 shadow-md shadow-indigo-600/20 transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 animate-pulse" />
              <span>AI 隨身導遊</span>
            </button>

            {/* API Key Settings Button */}
            <button
              id="btn-open-api-keys"
              onClick={onOpenApiKeyModal}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-medium flex items-center space-x-1.5 transition-all ${
                apiKeys.isGeminiValid || apiKeys.geminiApiKey
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/50 text-amber-300 animate-pulse'
              }`}
              title="設定並驗證 Gemini AI 與 Google Maps API 金鑰"
            >
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden xl:inline">API 金鑰</span>
              <span className="flex items-center gap-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    apiKeys.isGeminiValid ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-slate-500'
                  }`}
                  title={apiKeys.isGeminiValid ? 'AI 金鑰已驗證' : 'AI 金鑰待設定'}
                />
                <span
                  className={`w-2 h-2 rounded-full ${
                    apiKeys.isMapsValid ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-slate-500'
                  }`}
                  title={apiKeys.isMapsValid ? '地圖金鑰已驗證' : '地圖金鑰待設定'}
                />
              </span>
            </button>

            {/* Saved Trips Bookmark */}
            <button
              id="btn-saved-trips"
              onClick={onOpenSaved}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 relative transition-colors"
              title="已儲存的鐵道行程"
            >
              <Bookmark className="w-4 h-4 text-amber-400" />
              {savedCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center border-2 border-slate-900">
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
              className="hidden lg:flex items-center space-x-1 text-xs text-slate-400 hover:text-blue-400 transition-colors pl-1"
              title="前往台鐵官方網站時刻表與票價查詢"
            >
              <span>台鐵官網</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/80 text-xs font-medium">
          <button
            onClick={() => setActiveTab('planner')}
            className={`py-1 px-2 rounded ${activeTab === 'planner' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}
          >
            行程規劃
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`py-1 px-2 rounded ${activeTab === 'map' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}
          >
            全台地圖
          </button>
          <button
            onClick={() => setActiveTab('explorer')}
            className={`py-1 px-2 rounded ${activeTab === 'explorer' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}
          >
            周邊探索
          </button>
          <button
            onClick={() => setActiveTab('tra-info')}
            className={`py-1 px-2 rounded ${activeTab === 'tra-info' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}
          >
            乘車指南
          </button>
        </div>
      </div>
    </header>
  );
};
