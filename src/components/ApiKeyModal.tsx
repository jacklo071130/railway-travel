import React, { useState, useEffect } from 'react';
import {
  Key,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Check,
  Zap
} from 'lucide-react';
import { ApiKeysConfig } from '../types';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeys: ApiKeysConfig;
  onSaveKeys: (keys: ApiKeysConfig) => void;
  isInitialGated?: boolean;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKeys,
  onSaveKeys,
  isInitialGated = false,
}) => {
  const [geminiKey, setGeminiKey] = useState(apiKeys.geminiApiKey || '');
  const [showGeminiKey, setShowGeminiKey] = useState(false);

  const [verifyingGemini, setVerifyingGemini] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<{
    valid?: boolean;
    message?: string;
    error?: string;
  }>({
    valid: apiKeys.isGeminiValid,
    message: apiKeys.isGeminiValid ? '金鑰已通過驗證並已暫存' : undefined,
  });

  const [systemKeys, setSystemKeys] = useState<{
    hasServerGeminiKey: boolean;
    hasServerMapsKey: boolean;
  }>({
    hasServerGeminiKey: false,
    hasServerMapsKey: false,
  });

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isInitialGated) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isInitialGated]);

  // Load initial values and check system environment keys
  useEffect(() => {
    setGeminiKey(apiKeys.geminiApiKey || '');
    setGeminiStatus({
      valid: apiKeys.isGeminiValid,
      message: apiKeys.isGeminiValid ? '金鑰已通過驗證並已暫存' : undefined,
    });

    fetch('/api/system-key-status')
      .then((res) => res.json())
      .then((data) => {
        setSystemKeys(data);
      })
      .catch(() => {});
  }, [apiKeys, isOpen]);

  // 1. Verify Gemini API Key
  const handleVerifyGemini = async () => {
    const keyToTest = geminiKey.trim();
    if (!keyToTest) {
      setGeminiStatus({
        valid: false,
        error: '請輸入 Gemini API Key 後再進行驗證',
      });
      return;
    }

    setVerifyingGemini(true);
    setGeminiStatus({});

    try {
      const response = await fetch('/api/verify-gemini-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: keyToTest }),
      });

      const data = await response.json();
      if (response.ok && data.valid) {
        setGeminiStatus({
          valid: true,
          message: data.message || 'Gemini AI API Key 驗證成功！已暫存於記憶體，可立即開始使用。',
        });
      } else {
        setGeminiStatus({
          valid: false,
          error: data.error || 'Gemini API 金鑰驗證未通過，請檢查金鑰。',
        });
      }
    } catch (err: any) {
      setGeminiStatus({
        valid: false,
        error: `驗證連線失敗：${err.message || '請確認網路狀態'}`,
      });
    } finally {
      setVerifyingGemini(false);
    }
  };

  // Temporary In-Memory Cache and Proceed
  const handleTemporarySaveAndProceed = () => {
    const newConfig: ApiKeysConfig = {
      geminiApiKey: geminiKey.trim(),
      googleMapsApiKey: '',
      isGeminiValid: Boolean(geminiStatus.valid || (geminiKey.trim().length > 10 && !geminiStatus.error)),
      isMapsValid: true,
      geminiVerifiedAt: geminiStatus.valid ? new Date().toISOString() : apiKeys.geminiVerifiedAt,
      mapsVerifiedAt: new Date().toISOString(),
    };

    // Stored in in-memory state only (not saved in localStorage)
    onSaveKeys(newConfig);
    onClose();
  };

  if (!isOpen) return null;

  const isGeminiReady = geminiStatus.valid || (geminiKey.trim().length > 10 && geminiStatus.valid !== false);
  const canProceed = (geminiKey.trim().length > 0 && isGeminiReady) || systemKeys.hasServerGeminiKey;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F3A35]/80 backdrop-blur-md overflow-y-auto"
      onClick={() => {
        if (!isInitialGated) onClose();
      }}
    >
      <div
        id="api-key-modal-card"
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#E5DEAA] overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#0F3A35] via-[#13695F] to-[#1A8F82] text-white relative border-b border-[#81D8CF]/30">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-[#81D8CF]/25 border border-[#81D8CF]/40 flex items-center justify-center shadow-inner">
              <Key className="w-6 h-6 text-[#F8F5D6]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold tracking-wide">
                  Gemini AI API 金鑰設定
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#81D8CF]/30 text-[#FAF8E7] border border-[#81D8CF]/50 font-semibold">
                  僅記憶體暫存・不存硬碟
                </span>
              </div>
              <p className="text-xs text-[#FAF8E7]/85 mt-1">
                驗證通過後僅於當前記憶體暫存，關閉分頁即自動釋放，安全無虞
              </p>
            </div>
          </div>

          {!isInitialGated && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="關閉 (Esc)"
            >
              ✕
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto bg-[#FAF8E7]/30">
          {/* Security & In-Memory Privacy Notice */}
          <div className="p-3.5 rounded-xl bg-[#E5FAF7] border border-[#81D8CF]/50 flex items-start space-x-3 text-xs text-[#122B28]">
            <ShieldCheck className="w-5 h-5 text-[#1A8F82] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-[#0F3A35]">金鑰安全暫存與隱私宣告（不永久儲存）</p>
              <p className="text-[#13695F] leading-relaxed">
                您輸入與驗證的 Gemini API 金鑰<strong>僅會在當前工作階段中進行記憶體暫存</strong>，絕不會儲存至瀏覽器本地硬碟（Local Storage）。互動地圖已全數採用免金鑰之 OpenStreetMap 與即時定位，無需輸入 Google Maps API Key。
              </p>
            </div>
          </div>

          {/* Section 1: Gemini AI API Key */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8E7]/60 border border-[#E5DEAA] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-[#E5FAF7] text-[#13695F] border border-[#81D8CF]/40 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4 text-[#1A8F82]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#122B28] flex items-center gap-2">
                    <span>Gemini AI API Key</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#E5FAF7] text-[#13695F] border border-[#81D8CF]/30 font-semibold">
                      必要 (AI 行程與隨身導遊)
                    </span>
                  </h4>
                </div>
              </div>

              {/* Status Pill */}
              <div>
                {geminiStatus.valid === true ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E5FAF7] text-[#13695F] border border-[#81D8CF]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1A8F82]" />
                    驗證成功 (已暫存)
                  </span>
                ) : geminiStatus.valid === false ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    驗證失敗
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-[#FAF8E7] text-[#546E6A] border border-[#E5DEAA]">
                    待驗證
                  </span>
                )}
              </div>
            </div>

            {/* Input Row */}
            <div className="space-y-2">
              <div className="relative flex items-center">
                <input
                  id="input-gemini-api-key"
                  type={showGeminiKey ? 'text' : 'password'}
                  value={geminiKey}
                  onChange={(e) => {
                    setGeminiKey(e.target.value);
                    setGeminiStatus({});
                  }}
                  placeholder="AIzaSy... (貼上 Google Gemini API Key)"
                  className="w-full pl-3.5 pr-24 py-2.5 rounded-xl border border-[#E5DEAA] focus:border-[#1A8F82] focus:ring-2 focus:ring-[#81D8CF]/30 outline-none text-sm font-mono transition-all text-[#122B28] bg-white placeholder-[#78928E]"
                />

                <div className="absolute right-2 flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="p-1.5 text-[#546E6A] hover:text-[#122B28] rounded-lg hover:bg-[#FAF8E7] transition-colors cursor-pointer"
                    title={showGeminiKey ? '隱藏金鑰' : '顯示金鑰'}
                  >
                    {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>

                  <button
                    id="btn-verify-gemini-key"
                    type="button"
                    onClick={handleVerifyGemini}
                    disabled={verifyingGemini || !geminiKey.trim()}
                    className="px-3 py-1.5 rounded-lg bg-[#1A8F82] hover:bg-[#13695F] disabled:bg-[#E5DEAA] disabled:text-[#78928E] text-white text-xs font-bold shadow-sm transition-all flex items-center space-x-1 cursor-pointer"
                  >
                    {verifyingGemini ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>驗證中</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>驗證金鑰</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Feedback messages */}
              {geminiStatus.message && (
                <p className="text-xs text-[#13695F] font-medium flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1A8F82]" />
                  {geminiStatus.message}
                </p>
              )}
              {geminiStatus.error && (
                <p className="text-xs text-rose-600 font-medium flex items-start gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{geminiStatus.error}</span>
                </p>
              )}

              {/* Helper Links */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[#546E6A]">
                  用於驅動 Gemini 3.7 Flash 智能生成完整一日遊與隨身導遊。
                </span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#13695F] hover:text-[#0F3A35] font-semibold inline-flex items-center gap-1 hover:underline shrink-0"
                >
                  <span>免費領取 Gemini Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 bg-[#FAF8E7] border-t border-[#E5DEAA] flex flex-col sm:flex-row items-center justify-end gap-3">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {!isInitialGated && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-[#E5DEAA] hover:bg-[#F8F5D6] text-[#546E6A] hover:text-[#122B28] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                取消
              </button>
            )}

            <button
              id="btn-save-and-unlock-app"
              type="button"
              onClick={handleTemporarySaveAndProceed}
              disabled={!canProceed}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center space-x-2 ${
                canProceed
                  ? 'bg-gradient-to-r from-[#13695F] via-[#1A8F82] to-[#5EC9BD] hover:from-[#0F3A35] hover:to-[#1A8F82] text-white shadow-[#81D8CF]/40 active:scale-98 cursor-pointer'
                  : 'bg-[#E5DEAA] text-[#78928E] cursor-not-allowed'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>暫存金鑰並開始使用</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
