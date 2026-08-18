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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
              <Bookmark className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">已儲存的鐵道行程清單</h3>
              <p className="text-xs text-slate-500">共收藏 {savedTrips.length} 個精彩一日遊計劃</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* List of trips */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {savedTrips.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm space-y-2">
              <Train className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-600">尚未收藏任何行程</p>
              <p className="text-xs text-slate-400">
                在行程規劃頁面生成行程後，點擊「收藏行程」即可隨時在此查看。
              </p>
            </div>
          ) : (
            savedTrips.map((trip) => (
              <div
                key={trip.id}
                className="bg-slate-50 hover:bg-blue-50/50 rounded-2xl p-4 border border-slate-200 hover:border-blue-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                      {trip.originStation.name} ➔ {trip.destinationStation.name}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {trip.travelDate}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {trip.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{trip.subtitle}</p>

                  <div className="flex items-center gap-3 text-xs text-slate-600 mt-2">
                    <span className="text-amber-600 font-semibold">
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
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-1 shadow-sm transition-all"
                  >
                    <span>開啟行程</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteTrip(trip.id)}
                    className="p-2 rounded-xl bg-slate-200 hover:bg-rose-100 hover:text-rose-600 text-slate-500 text-xs transition-colors"
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
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 text-right">
          行程資料儲存於瀏覽器本機端，離線亦可瀏覽
        </div>
      </div>
    </div>
  );
};
