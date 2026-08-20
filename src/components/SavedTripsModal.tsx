import React from 'react';
import { Bookmark, Trash2, Calendar, MapPin, ArrowRight, Train } from 'lucide-react';
import { DayItinerary } from '../types';

interface SavedTripsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedTrips: DayItinerary[];
  onSelectTrip: (trip: DayItinerary) => void;
  onDeleteTrip: (id: string) => void;
}

export const SavedTripsModal: React.FC<SavedTripsModalProps> = ({
  isOpen,
  onClose,
  savedTrips,
  onSelectTrip,
  onDeleteTrip,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0F3A35]/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] shadow-2xl border border-[#E5DEAA] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5DEAA] flex items-center justify-between bg-[#FAF8E7]">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-[#81D8CF]/25 text-[#13695F] border border-[#81D8CF]/40">
              <Bookmark className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#122B28]">已儲存的鐵道行程清單</h3>
              <p className="text-xs text-[#546E6A]">共收藏 {savedTrips.length} 個精彩一日遊計劃</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF8E7] hover:bg-[#F8F5D6] border border-[#E5DEAA] text-[#122B28] flex items-center justify-center font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* List of trips */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF8E7]/30">
          {savedTrips.length === 0 ? (
            <div className="py-12 text-center text-[#78928E] text-sm space-y-2">
              <Train className="w-10 h-10 text-[#81D8CF] mx-auto" />
              <p className="font-semibold text-[#122B28]">尚未收藏任何行程</p>
              <p className="text-xs text-[#78928E]">
                在行程規劃頁面生成行程後，點擊「收藏行程」即可隨時在此查看。
              </p>
            </div>
          ) : (
            savedTrips.map((trip) => (
              <div
                key={trip.id}
                className="bg-[#FAF8E7]/60 hover:bg-[#E5FAF7]/60 rounded-2xl p-4 border border-[#E5DEAA] hover:border-[#81D8CF] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#E5FAF7] text-[#13695F] border border-[#81D8CF]/30">
                      {trip.originStation.name} ➔ {trip.destinationStation.name}
                    </span>
                    <span className="text-xs text-[#78928E] flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {trip.travelDate}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-[#122B28] group-hover:text-[#1A8F82] transition-colors">
                    {trip.title}
                  </h4>
                  <p className="text-xs text-[#546E6A] line-clamp-1 mt-0.5">{trip.subtitle}</p>

                  <div className="flex items-center gap-3 text-xs text-[#546E6A] mt-2">
                    <span className="text-[#8C7C20] font-semibold">
                      預估 NT$ {trip.estimatedTotalBudget}
                    </span>
                    <span>•</span>
                    <span>{trip.stops.length} 個景點美食</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-center">
                  <button
                    onClick={() => {
                      onSelectTrip(trip);
                      onClose();
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#1A8F82] hover:bg-[#13695F] text-white text-xs font-bold flex items-center space-x-1 shadow-sm transition-all cursor-pointer"
                  >
                    <span>開啟行程</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteTrip(trip.id)}
                    className="p-2 rounded-xl bg-white hover:bg-rose-50 hover:text-rose-600 text-[#78928E] border border-[#E5DEAA] text-xs transition-colors cursor-pointer"
                    title="刪除此收藏"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#FAF8E7] border-t border-[#E5DEAA] text-xs text-[#546E6A] text-right">
          行程資料儲存於瀏覽器本機端，離線亦可瀏覽
        </div>
      </div>
    </div>
  );
};
