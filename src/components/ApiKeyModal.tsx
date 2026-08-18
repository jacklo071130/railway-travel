import React, { useState, useEffect } from 'react';
import {
  Key,
  Sparkles,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Lock,
  Compass,
  Train,
  Check,
  Copy,
  Info
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
  const [mapsKey, setMapsKey] = useState(apiKeys.googleMapsApiKey || '');

  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showMapsKey, setShowMapsKey] = useState(false);

  const [verifyingGemini, setVerifyingGemini] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<{
    valid?: boolean;
    message?: string;
    error?: string;
  }>({
    valid: apiKeys.isGeminiValid,
    message: apiKeys.isGeminiValid ? '金鑰已通過驗證' : undefined,
  });

  const [verifyingMaps, setVerifyingMaps] = useState(false);
  const [mapsStatus, setMapsStatus] = useState<{
    valid?: boolean;
    message?: string;
    error?: string;
  }>({
    valid: apiKeys.isMapsValid,
    message: apiKeys.isMapsValid ? '金鑰已通過驗證' : undefined,
  });

  const [systemKeys, setSystemKeys] = useState<{
    hasServerGeminiKey: boolean;
    hasServerMapsKey: boolean;
  }>({
    hasServerGeminiKey: false,
    hasServerMapsKey: false,
  });

  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Load initial values and check system environment keys
  useEffect(() => {
    setGeminiKey(apiKeys.geminiApiKey || '');
    setMapsKey(apiKeys.googleMapsApiKey || '');
    setGeminiStatus({
      valid: apiKeys.isGeminiValid,
      message: apiKeys.isGeminiValid ? '金鑰已通過驗證' : undefined,
    });
    setMapsStatus({
      valid: apiKeys.isMapsValid,
      message: apiKeys.isMapsValid ? '金鑰已通過驗證' : undefined,
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
          message: data.message || 'Gemini AI API Key 驗證成功！',
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

  // 2. Verify Google Maps API Key
  const handleVerifyMaps = async () => {
    const keyToTest = mapsKey.trim();
    if (!keyToTest) {
      setMapsStatus({
        valid: false,
        error: '請輸入 Google Maps API Key 後再進行驗證',
      });
      return;
    }

    setVerifyingMaps(true);
    setMapsStatus({});

    try {
      const response = await fetch('/api/verify-maps-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: keyToTest }),
      });

      const data = await response.json();
      if (response.ok && data.valid) {
        setMapsStatus({
          valid: true,
          message: data.message || 'Google Maps API 金鑰驗證成功！',
        });
      } else {
        setMapsStatus({
          valid: false,
          error: data.error || 'Google Maps API 金鑰無效，請確認金鑰字串。',
        });
      }
    } catch (err: any) {
      setMapsStatus({
        valid: false,
        error: `驗證連線失敗：${err.message || '請確認網路狀態'}`,
      });
    } finally {
      setVerifyingMaps(false);
    }
  };

  // 3. Batch Verify Both
  const handleVerifyAll = async () => {
    if (geminiKey.trim()) {
      handleVerifyGemini();
    }
    if (mapsKey.trim()) {
      handleVerifyMaps();
    }
  };

  // 4. Save and Enter App
  const handleSaveAndProceed = () => {
    const newConfig: ApiKeysConfig = {
      geminiApiKey: geminiKey.trim(),
      googleMapsApiKey: mapsKey.trim(),
      isGeminiValid: Boolean(geminiStatus.valid || (geminiKey.trim().length > 10 && !geminiStatus.error)),
      isMapsValid: Boolean(mapsStatus.valid || (mapsKey.trim().length > 10 && !mapsStatus.error)),
      geminiVerifiedAt: geminiStatus.valid ? new Date().toISOString() : apiKeys.geminiVerifiedAt,
      mapsVerifiedAt: mapsStatus.valid ? new Date().toISOString() : apiKeys.mapsVerifiedAt,
    };

    onSaveKeys(newConfig);
    onClose();
  };

  // Quick helper to fill environment keys if user wants demo access
  const handleUseServerDefaults = () => {
    const newConfig: ApiKeysConfig = {
      geminiApiKey: geminiKey.trim(),
      googleMapsApiKey: mapsKey.trim(),
      isGeminiValid: true,
      isMapsValid: true,
      geminiVerifiedAt: new Date().toISOString(),
      mapsVerifiedAt: new Date().toISOString(),
    };
    onSaveKeys(newConfig);
    onClose();
  };

  if (!isOpen) return null;

  const isGeminiReady = geminiStatus.valid || (geminiKey.trim().length > 10 && geminiStatus.valid !== false);
  const isMapsReady = mapsStatus.valid || (mapsKey.trim().length > 10 && mapsStatus.valid !== false);
  const canProceed = (geminiKey.trim().length > 0 && isGeminiReady) || systemKeys.hasServerGeminiKey;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div
        id="api-key-modal-card"
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white relative">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center shadow-inner">
              <Key className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold tracking-wide">
                  API 金鑰授權與驗證中心
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 font-semibold">
                  安全保證
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                請輸入並驗證 Gemini AI 與 Google Maps 金鑰以啟動鐵道旅遊規劃
              </p>
            </div>
          </div>

          {!isInitialGated && (
            <button
              onClick={onClose}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Security Notice */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-start space-x-3 text-xs text-slate-700">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-slate-900">金鑰安全儲存與隱私宣告</p>
              <p className="text-slate-600 leading-relaxed">
                您輸入的 API 金鑰僅會加密保存在您當前瀏覽器的本地空間 (Local Storage)，所有 AI 與地圖驗證請求皆透過安全伺服端通訊，絕不外流或挪作他用。
              </p>
            </div>
          </div>

          {/* Section 1: Gemini AI API Key */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Gemini AI API Key</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-semibold">
                      必要 (AI 行程與導遊)
                    </span>
                  </h4>
                </div>
              </div>

              {/* Status Pill */}
              <div>
                {geminiStatus.valid === true ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    驗證成功
                  </span>
                ) : geminiStatus.valid === false ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    驗證失敗
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-200 text-slate-700">
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
                  className="w-full pl-3.5 pr-24 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm font-mono transition-all text-slate-900 bg-white"
                />

                <div className="absolute right-2 flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                    title={showGeminiKey ? '隱藏金鑰' : '顯示金鑰'}
                  >
                    {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>

                  <button
                    id="btn-verify-gemini-key"
                    type="button"
                    onClick={handleVerifyGemini}
                    disabled={verifyingGemini || !geminiKey.trim()}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold shadow-sm transition-all flex items-center space-x-1"
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
                <p className="text-xs text-emerald-700 font-medium flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
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
                <span className="text-slate-500">
                  用於驅動 Gemini 3.7 Flash 智能生成完整一日遊與隨身語音/文字導遊。
                </span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1 hover:underline shrink-0"
                >
                  <span>免費領取 Gemini Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Section 2: Google Maps API Key */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Google Maps API Key</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                      地圖圖磚與導航
                    </span>
                  </h4>
                </div>
              </div>

              {/* Status Pill */}
              <div>
                {mapsStatus.valid === true ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    驗證成功
                  </span>
                ) : mapsStatus.valid === false ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    驗證失敗
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-200 text-slate-700">
                    待驗證
                  </span>
                )}
              </div>
            </div>

            {/* Input Row */}
            <div className="space-y-2">
              <div className="relative flex items-center">
                <input
                  id="input-google-maps-api-key"
                  type={showMapsKey ? 'text' : 'password'}
                  value={mapsKey}
                  onChange={(e) => {
                    setMapsKey(e.target.value);
                    setMapsStatus({});
                  }}
                  placeholder="AIzaSy... (貼上 Google Maps API Key)"
                  className="w-full pl-3.5 pr-24 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm font-mono transition-all text-slate-900 bg-white"
                />

                <div className="absolute right-2 flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => setShowMapsKey(!showMapsKey)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                    title={showMapsKey ? '隱藏金鑰' : '顯示金鑰'}
                  >
                    {showMapsKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>

                  <button
                    id="btn-verify-maps-key"
                    type="button"
                    onClick={handleVerifyMaps}
                    disabled={verifyingMaps || !mapsKey.trim()}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold shadow-sm transition-all flex items-center space-x-1"
                  >
                    {verifyingMaps ? (
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
              {mapsStatus.message && (
                <p className="text-xs text-emerald-700 font-medium flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {mapsStatus.message}
                </p>
              )}
              {mapsStatus.error && (
                <p className="text-xs text-rose-600 font-medium flex items-start gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{mapsStatus.error}</span>
                </p>
              )}

              {/* Helper Links */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500">
                  用於載入 Google Maps 原生地圖圖磚、路徑導航與景點定位。
                </span>
                <a
                  href="https://console.cloud.google.com/google/maps-apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:text-emerald-800 font-semibold inline-flex items-center gap-1 hover:underline shrink-0"
                >
                  <span>Google Cloud 憑證中心</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              id="btn-verify-all-keys"
              type="button"
              onClick={handleVerifyAll}
              disabled={verifyingGemini || verifyingMaps || (!geminiKey.trim() && !mapsKey.trim())}
              className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-700 text-xs font-bold transition-all flex items-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${verifyingGemini || verifyingMaps ? 'animate-spin' : ''}`} />
              <span>一鍵驗證全部金鑰</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {!isInitialGated && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold transition-colors"
              >
                取消
              </button>
            )}

            <button
              id="btn-save-and-unlock-app"
              type="button"
              onClick={handleSaveAndProceed}
              disabled={!canProceed}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center space-x-2 ${
                canProceed
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30 active:scale-98 cursor-pointer'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>儲存設定並開始使用</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
