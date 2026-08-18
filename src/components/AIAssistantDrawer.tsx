import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Bot, User, Train, ExternalLink, RefreshCw } from 'lucide-react';
import { ChatMessage, TRAStation, DayItinerary } from '../types';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  station: TRAStation;
  itinerary?: DayItinerary | null;
  geminiApiKey?: string;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  station,
  itinerary,
  geminiApiKey,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `您好！我是您的「台鐵台灣鐵道隨身 AI 導遊」🚂。\n\n目前您選定的目的地是【${station.name}站 (${station.county})】。\n您可以隨時向我詢問：\n• 車站周邊隱藏版美食與素食選擇\n• 雨天室內備案景點\n• 車站行李寄物櫃與 YouBike 借還指南\n• 台鐵購票、車次轉乘與票價建議\n\n請問今天想了解什麼呢？`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        `推薦 ${station.name}站 附近必吃隱藏版老店`,
        `如果下雨天，${station.name}站 有哪些室內景點？`,
        `從 ${station.name}火車站 如何轉乘公車或騎 YouBike？`,
        `台鐵車票預訂與購票規則說明`,
      ],
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage.trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ask-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          station,
          currentItinerary: itinerary,
          geminiApiKey,
        }),
      });

      const data = await response.json();

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply || '很樂意為您解答台鐵旅遊問題！',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: data.suggestedActions,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'assistant',
          content: `抱歉，伺服器連線稍有延遲。建議您可直接參考台鐵官方網站（https://www.railway.gov.tw/tra-tip-web/tip）查詢最新班次與票價，或稍後再次提問！`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-amber-300">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base">台鐵隨身 AI 導遊</h3>
            <p className="text-xs text-blue-200/80">
              {station.name}站 旅遊即時問答
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg) => {
          const isAI = msg.role === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-2.5 ${isAI ? '' : 'flex-row-reverse space-x-reverse'}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                  isAI
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-white'
                }`}
              >
                {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div className={`max-w-[85%] space-y-2`}>
                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                    isAI
                      ? 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-sm'
                      : 'bg-blue-600 text-white rounded-tr-sm'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>
                </div>

                {/* Suggested Follow-up chips */}
                {isAI && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 block">推薦追問：</span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggestedActions.map((action, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(action)}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-left transition-colors"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <span className="text-[10px] text-slate-400 block px-1">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center space-x-2 text-slate-500 text-xs p-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>AI 導遊正在為您查詢整理中...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            placeholder={`詢問 ${station.name}站 景點、美食或台鐵指南...`}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="flex-1 text-xs sm:text-sm bg-slate-100 rounded-xl px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold disabled:opacity-50 transition-all shadow-md shadow-blue-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 px-1">
          <span>支援即時推薦與行程微調</span>
          <a
            href="https://www.railway.gov.tw/tra-tip-web/tip"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline flex items-center gap-0.5"
          >
            <span>台鐵官網</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
