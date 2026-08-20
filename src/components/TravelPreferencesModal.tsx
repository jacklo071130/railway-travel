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
    { id: 'gourmet', label: '美食老饕', desc: '在地排隊老店、必吃小吃、台鐵特色便當', icon: <Utensils className="w-4 h-4 text-[#8C7C20]" /> },
    { id: 'instagram', label: '網美打卡', desc: '絕美景觀、文青咖啡廳、人氣地標攝影', icon: <Camera className="w-4 h-4 text-[#1A8F82]" /> },
    { id: 'culture', label: '歷史人文', desc: '百年老街、古蹟建築、鐵道文物館、故事聚落', icon: <Landmark className="w-4 h-4 text-[#13695F]" /> },
    { id: 'family', label: '親子同樂', desc: '安全平緩步道、手作體驗、平易近人景點', icon: <Users className="w-4 h-4 text-[#1A8F82]" /> },
    { id: 'nature', label: '自然步道', desc: '山海綠意、森林森呼吸、瀑布湖泊景觀', icon: <Trees className="w-4 h-4 text-[#13695F]" /> },
    { id: 'slow_life', label: '慢活悠閒', desc: '輕鬆不趕路、找間好茶屋享受寧靜午後', icon: <Coffee className="w-4 h-4 text-[#8C7C20]" /> },
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
    { id: 'walk_youbike', label: '步行 + YouBike', desc: '最道地低碳，穿梭火車站周圍巷弄', icon: <Bike className="w-4 h-4 text-[#1A8F82]" /> },
    { id: 'public_bus', label: '市區公車 / 台灣好行', desc: '轉乘接駁客運，免除自駕負擔', icon: <Bus className="w-4 h-4 text-[#13695F]" /> },
    { id: 'scooter_rental', label: '站前租機車', desc: '行動半徑廣，自由探訪山海秘境', icon: <Footprints className="w-4 h-4 text-[#1A8F82]" /> },
    { id: 'taxi_car', label: '計程車 / 包車', desc: '快速舒適直達，多人分攤划算', icon: <Car className="w-4 h-4 text-[#8C7C20]" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#0F3A35]/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-[#E5DEAA] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5DEAA] flex items-center justify-between bg-[#FAF8E7]">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-[#81D8CF]/25 text-[#13695F] border border-[#81D8CF]/40">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#122B28]">自訂一日遊旅遊偏好</h3>
              <p className="text-xs text-[#546E6A]">AI 將根據您的喜好量身打造最合適的鐵道旅遊路線</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF8E7] hover:bg-[#F8F5D6] border border-[#E5DEAA] text-[#122B28] flex items-center justify-center font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-[#FAF8E7]/30">
          {/* Section 1: Style */}
          <div>
            <label className="text-xs font-bold text-[#122B28] uppercase tracking-wider block mb-2.5">
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
                    className={`p-3 rounded-xl border text-left flex items-start space-x-3 transition-all cursor-pointer ${
                      selected
                        ? 'bg-[#E5FAF7] border-[#1A8F82] ring-2 ring-[#81D8CF]/40'
                        : 'bg-[#FAF8E7]/60 hover:bg-[#FAF8E7] border-[#E5DEAA]'
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-white shadow-2xs border border-[#E5DEAA]/60">{opt.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[#122B28]">{opt.label}</span>
                        {selected && <Check className="w-4 h-4 text-[#1A8F82]" />}
                      </div>
                      <p className="text-xs text-[#546E6A] mt-0.5">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Companions */}
          <div>
            <label className="text-xs font-bold text-[#122B28] uppercase tracking-wider block mb-2.5">
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
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selected
                        ? 'bg-[#E5FAF7] border-[#1A8F82] font-bold text-[#13695F] ring-1 ring-[#1A8F82]'
                        : 'bg-[#FAF8E7]/60 hover:bg-[#FAF8E7] border-[#E5DEAA] text-[#122B28]'
                    }`}
                  >
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className="text-[11px] text-[#546E6A] mt-0.5 leading-tight line-clamp-1">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Pace */}
          <div>
            <label className="text-xs font-bold text-[#122B28] uppercase tracking-wider block mb-2.5">
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
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selected
                        ? 'bg-[#E5FAF7] border-[#1A8F82] ring-1 ring-[#1A8F82]'
                        : 'bg-[#FAF8E7]/60 hover:bg-[#FAF8E7] border-[#E5DEAA]'
                    }`}
                  >
                    <div className="text-xs font-bold text-[#122B28]">{opt.label}</div>
                    <div className="text-[11px] text-[#546E6A] mt-0.5">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Local Transport */}
          <div>
            <label className="text-xs font-bold text-[#122B28] uppercase tracking-wider block mb-2.5">
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
                    className={`p-3 rounded-xl border text-left flex items-center space-x-3 transition-all cursor-pointer ${
                      selected
                        ? 'bg-[#E5FAF7] border-[#1A8F82] ring-2 ring-[#81D8CF]/40'
                        : 'bg-[#FAF8E7]/60 hover:bg-[#FAF8E7] border-[#E5DEAA]'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-white shadow-2xs border border-[#E5DEAA]/60">{opt.icon}</div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-[#122B28]">{opt.label}</div>
                      <div className="text-[11px] text-[#546E6A] mt-0.5">{opt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 5: Custom Notes */}
          <div>
            <label className="text-xs font-bold text-[#122B28] uppercase tracking-wider block mb-1.5">
              5. 額外需求備註 (選填)
            </label>
            <input
              type="text"
              placeholder="例如: 希望有素食餐點選擇、喜愛日式老屋咖啡廳、避免長階梯..."
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              className="w-full text-xs sm:text-sm bg-[#FAF8E7] border border-[#E5DEAA] rounded-xl px-3 py-2.5 text-[#122B28] placeholder-[#78928E] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#81D8CF]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#FAF8E7] border-t border-[#E5DEAA] flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-[#546E6A] hover:text-[#122B28] hover:bg-[#F8F5D6] rounded-xl transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-[#1A8F82] hover:bg-[#13695F] rounded-xl shadow-md shadow-[#81D8CF]/30 transition-all cursor-pointer"
          >
            儲存偏好設定
          </button>
        </div>
      </div>
    </div>
  );
};
