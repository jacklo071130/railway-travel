import React, { useState } from 'react';
import { SlidersHorizontal, Check, Utensils, Camera, Landmark, Users, Trees, Coffee, Footprints, Bus, Bike, Car } from 'lucide-react';
import { TravelPreferences, TravelStyle, CompanionType, TravelPace, LocalTransport } from '../types';

interface TravelPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: TravelPreferences;
  onSave: (newPreferences: TravelPreferences) => void;
}

export const TravelPreferencesModal: React.FC<TravelPreferencesModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onSave,
}) => {
  const [style, setStyle] = useState<TravelStyle>(preferences.style);
  const [companion, setCompanion] = useState<CompanionType>(preferences.companion);
  const [pace, setPace] = useState<TravelPace>(preferences.pace);
  const [transport, setTransport] = useState<LocalTransport>(preferences.transport);
  const [customNotes, setCustomNotes] = useState<string>(preferences.customNotes || '');

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      style,
      companion,
      pace,
      transport,
      customNotes,
    });
    onClose();
  };

  const styleOptions: { id: TravelStyle; label: string; desc: string; icon: React.ReactNode }[] = [
    { id: 'gourmet', label: '美食老饕', desc: '在地排隊老店、必吃小吃、台鐵特色便當', icon: <Utensils className="w-4 h-4 text-amber-500" /> },
    { id: 'instagram', label: '網美打卡', desc: '絕美景觀、文青咖啡廳、人氣地標攝影', icon: <Camera className="w-4 h-4 text-rose-500" /> },
    { id: 'culture', label: '歷史人文', desc: '百年老街、古蹟建築、鐵道文物館、故事聚落', icon: <Landmark className="w-4 h-4 text-indigo-500" /> },
    { id: 'family', label: '親子同樂', desc: '安全平緩步道、手作體驗、平易近人景點', icon: <Users className="w-4 h-4 text-emerald-500" /> },
    { id: 'nature', label: '自然步道', desc: '山海綠意、森林森呼吸、瀑布湖泊景觀', icon: <Trees className="w-4 h-4 text-teal-500" /> },
    { id: 'slow_life', label: '慢活悠閒', desc: '輕鬆不趕路、找間好茶屋享受寧靜午後', icon: <Coffee className="w-4 h-4 text-amber-600" /> },
  ];

  const companionOptions: { id: CompanionType; label: string; desc: string }[] = [
    { id: 'solo', label: '一人獨旅', desc: '自由彈性、深度探索自我' },
    { id: 'couple', label: '情侶約會', desc: '浪漫氛圍、特色餐廳與合影點' },
    { id: 'friends', label: '好友同遊', desc: '拍照分享、歡樂打卡聚餐' },
    { id: 'family_kids', label: '親子家庭', desc: '小朋友放電、親子友善設施' },
    { id: 'family_elder', label: '長輩同行', desc: '平緩好走、避免過多階梯爬坡' },
  ];

  const paceOptions: { id: TravelPace; label: string; desc: string }[] = [
    { id: 'relaxed', label: '慢步調 (3~4個點)', desc: '每個點停留充足時間，愜意無壓力' },
    { id: 'moderate', label: '經典適中 (4~5個點)', desc: '精選代表性景點，節奏勻稱充實' },
    { id: 'packed', label: '精實踩點 (5~6個點)', desc: '充分利用一日時間，一次解鎖精華' },
  ];

  const transportOptions: { id: LocalTransport; label: string; desc: string; icon: React.ReactNode }[] = [
    { id: 'walk_youbike', label: '步行 + YouBike', desc: '最道地低碳，穿梭火車站周圍巷弄', icon: <Bike className="w-4 h-4 text-emerald-600" /> },
    { id: 'public_bus', label: '市區公車 / 台灣好行', desc: '轉乘接駁客運，免除自駕負擔', icon: <Bus className="w-4 h-4 text-blue-600" /> },
    { id: 'scooter_rental', label: '站前租機車', desc: '行動半徑廣，自由探訪山海秘境', icon: <Footprints className="w-4 h-4 text-purple-600" /> },
    { id: 'taxi_car', label: '計程車 / 包車', desc: '快速舒適直達，多人分攤划算', icon: <Car className="w-4 h-4 text-amber-600" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">自訂一日遊旅遊偏好</h3>
              <p className="text-xs text-slate-500">AI 將根據您的喜好量身打造最合適的鐵道旅遊路線</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Section 1: Style */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2.5">
              1. 旅遊主題風格
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {styleOptions.map((opt) => {
                const selected = style === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setStyle(opt.id)}
                    className={`p-3 rounded-xl border text-left flex items-start space-x-3 transition-all ${
                      selected
                        ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20'
                        : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-white shadow-sm">{opt.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-800">{opt.label}</span>
                        {selected && <Check className="w-4 h-4 text-blue-600" />}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Companions */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2.5">
              2. 同行夥伴組合
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {companionOptions.map((opt) => {
                const selected = companion === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setCompanion(opt.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selected
                        ? 'bg-blue-50 border-blue-500 font-bold text-blue-700 ring-1 ring-blue-500'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-tight line-clamp-1">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Pace */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2.5">
              3. 行程緊湊度與節奏
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {paceOptions.map((opt) => {
                const selected = pace === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPace(opt.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selected
                        ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-800">{opt.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Local Transport */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2.5">
              4. 目的地車站周邊交通方式
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {transportOptions.map((opt) => {
                const selected = transport === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTransport(opt.id)}
                    className={`p-3 rounded-xl border text-left flex items-center space-x-3 transition-all ${
                      selected
                        ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-white shadow-sm">{opt.icon}</div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-800">{opt.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 5: Custom Notes */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              5. 額外需求備註 (選填)
            </label>
            <input
              type="text"
              placeholder="例如: 希望有素食餐點選擇、喜愛日式老屋咖啡廳、避免長階梯..."
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-500/20 transition-all"
          >
            儲存偏好設定
          </button>
        </div>
      </div>
    </div>
  );
};
