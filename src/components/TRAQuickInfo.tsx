import React from 'react';
import { Train, CreditCard, Luggage, Bike, ExternalLink, Sparkles, ShieldAlert, Compass } from 'lucide-react';

export const TRAQuickInfo: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Official Banner */}
      <div className="bg-gradient-to-r from-[#0F3A35] via-[#13695F] to-[#1A8F82] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-wrap items-center justify-between gap-4 border border-[#81D8CF]/30">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#81D8CF]/30 text-[#FAF8E7] text-xs font-semibold border border-[#81D8CF]/40">
              國營臺灣鐵路股份有限公司
            </span>
            <span className="text-xs text-[#FAF8E7]/80">Taiwan Railway Corporation</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            台鐵乘車指南與實用旅遊小常識
          </h2>
          <p className="text-xs sm:text-sm text-[#FAF8E7]/90 mt-2 max-w-2xl leading-relaxed">
            掌握車票預訂秘訣、電子票證/TPASS乘車限制、行李寄放與自行車上火車規範，讓您的全台鐵道漫遊更加順暢無阻！
          </p>
        </div>

        <a
          href="https://www.railway.gov.tw/tra-tip-web/tip/tip001/tip112/gobytime"
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-3 rounded-xl bg-[#5EC9BD] hover:bg-[#81D8CF] text-[#0F3A35] text-xs sm:text-sm font-bold shadow-lg flex items-center space-x-2 transition-all active:scale-95 cursor-pointer"
        >
          <Train className="w-4 h-4" />
          <span>台鐵官方即時時刻表查詢 (gobytime)</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Grid of Key Topics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ticket booking rules */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5DEAA] space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-[#E5DEAA]/60">
            <div className="p-2.5 rounded-xl bg-[#E5FAF7] text-[#13695F] border border-[#81D8CF]/40">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#122B28]">車票預訂與電子票證規範</h3>
              <p className="text-xs text-[#546E6A]">預售期程、TPASS 與悠遊卡乘車注意事項</p>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-[#546E6A]">
            <div className="p-3 bg-[#FAF8E7] rounded-xl border border-[#E5DEAA]">
              <strong className="text-[#122B28] block mb-1">🎫 訂票開放時間：</strong>
              乘車日前 28 天凌晨 00:00 起開放預訂（逢週五可預訂至週日之車票）。連續假期依台鐵公告提早開放。
            </div>

            <div className="p-3 bg-rose-50/80 rounded-xl border border-rose-200 text-rose-950">
              <strong className="text-rose-900 flex items-center gap-1 mb-1">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                ⚠️ 不得使用電子票證/TPASS之不發售無座票列車：
              </strong>
              <span>
                <strong>EMU3000型新自強號、普悠瑪號、太魯閣號、觀光列車</strong>為全車對號座，<strong>嚴禁使用悠遊卡、一卡通或TPASS刷卡乘車</strong>，違者需加收50%票價！
              </span>
            </div>

            <div className="p-3 bg-[#FAF8E7] rounded-xl border border-[#E5DEAA]">
              <strong className="text-[#122B28] block mb-1">💳 電子票證可搭乘車種：</strong>
              區間車、區間快車、莒光號及一般自強號（非新自強/普悠瑪/太魯閣）。
            </div>
          </div>
        </div>

        {/* Luggage & Bicycle rules */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5DEAA] space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-[#E5DEAA]/60">
            <div className="p-2.5 rounded-xl bg-[#E5FAF7] text-[#13695F] border border-[#81D8CF]/40">
              <Luggage className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#122B28]">行李寄放與自行車攜帶</h3>
              <p className="text-xs text-[#546E6A]">減輕行李負擔，暢騎 YouBike 與鐵馬</p>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-[#546E6A]">
            <div className="p-3 bg-[#FAF8E7] rounded-xl border border-[#E5DEAA]">
              <strong className="text-[#122B28] block mb-1">🧳 車站行李寄放服務：</strong>
              各大車站（如台北、台中、台南、高雄、花蓮、宜蘭等）站內均設有電子投幣式行李置物櫃（按小時或次計費），部分車站設有台鐵行李房提供人工寄物。
            </div>

            <div className="p-3 bg-[#FAF8E7] rounded-xl border border-[#E5DEAA]">
              <strong className="text-[#122B28] block mb-1">🚲 攜帶自行車乘車（兩鐵列車）：</strong>
              攜帶折疊式自行車並裝入車袋者，可免費攜帶搭乘各級列車；非折疊式自行車需預訂專屬「兩鐵列車」（自行車需購買半票）。
            </div>

            <div className="p-3 bg-[#FAF8E7] rounded-xl border border-[#E5DEAA]">
              <strong className="text-[#122B28] block mb-1">📍 YouBike 2.0 站點：</strong>
              全台近 80% 主要火車站站前廣場皆設有 YouBike 租借站，可使用悠遊卡或手機 App 掃碼租借。
            </div>
          </div>
        </div>

        {/* Taiwan Tourist Shuttle */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5DEAA] space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-[#E5DEAA]/60">
            <div className="p-2.5 rounded-xl bg-[#E5FAF7] text-[#13695F] border border-[#81D8CF]/40">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#122B28]">台灣好行 觀光景點接駁</h3>
              <p className="text-xs text-[#546E6A]">專為無車族設計的景點接駁巴士</p>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-[#546E6A]">
            <div className="p-3 bg-[#FAF8E7] rounded-xl border border-[#E5DEAA]">
              <strong className="text-[#122B28] block mb-1">🚍 什麼是台灣好行？</strong>
              交通部觀光署專為自由行旅客規劃的觀光公車，從各主要火車站出發直達各大著名風景區（如九份、北海岸、日月潭、阿里山、太魯閣等）。
            </div>

            <div className="p-3 bg-[#FAF8E7] rounded-xl border border-[#E5DEAA]">
              <strong className="text-[#122B28] block mb-1">💳 票價與 TPASS 優惠：</strong>
              支援多卡通（悠遊卡、一卡通）、行政院 TPASS 通勤月票，多數路線享持電子票證搭乘優惠或一日無限搭乘套票。
            </div>

            <div className="p-3 bg-[#E5FAF7] rounded-xl border border-[#81D8CF]/40">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#13695F] text-xs">🌐 官方網站即時動態查詢：</span>
                <a
                  href="https://www.taiwantrip.com.tw/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[#1A8F82] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>訪問官網</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-[11px] text-[#4E6864] mt-1">
                出發前可至台灣好行官網查詢各路線最新動態公車到站時間與站牌位置。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tourism Trains Spotlight */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5DEAA]">
        <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-[#E5DEAA]/60">
          <Sparkles className="w-5 h-5 text-[#8C7C20]" />
          <h3 className="text-base font-bold text-[#122B28]">台鐵特色觀光列車專區</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
          <div className="p-4 rounded-xl bg-[#0F3A35] text-white space-y-1.5 border border-[#81D8CF]/20">
            <span className="text-[#81D8CF] font-bold text-xs">鳴日號 The Future</span>
            <h4 className="font-bold text-base">美學旗艦觀光列車</h4>
            <p className="text-[#FAF8E7]/80 text-xs leading-relaxed">
              黑橘塗裝的台灣鐵道美學先鋒，榮獲日本 Good Design 大獎，提供五星級列車管家與鳴日廚房移動饗宴。
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#13695F] text-white space-y-1.5 border border-[#81D8CF]/20">
            <span className="text-[#FAF8E7] font-bold text-xs">藍皮解憂號 Breezy Blue</span>
            <h4 className="font-bold text-base">南迴復古懷舊列車</h4>
            <p className="text-[#FAF8E7]/80 text-xs leading-relaxed">
              行駛於枋寮至台東的南迴鐵路，保留復古可開窗綠皮座椅與阿公級旋轉吊扇，吹著太平洋海風遠眺蔚藍海景。
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#1A8F82] text-white space-y-1.5 border border-[#81D8CF]/20">
            <span className="text-[#F8F5D6] font-bold text-xs">山嵐號 / 海風號</span>
            <h4 className="font-bold text-base">全新景觀微醺輕旅</h4>
            <p className="text-[#FAF8E7]/80 text-xs leading-relaxed">
              以花東縱谷的山嵐綠意與台灣西部海岸的蔚藍微風為設計靈感，搭配在地星級甜點的奢華景觀列車。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
