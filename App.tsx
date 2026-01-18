import React, { useState, useEffect, useRef } from 'react';
import { Camera, Shield, AlertTriangle, MessageSquare, Trash2, EyeOff, Search, ChevronRight, Bell, Zap, Info, RefreshCcw } from 'lucide-react';
import { ScannedPhoto, AppNotification, RiskLevel, AnalysisResult } from './types';
import { analyzePhoto } from './services/geminiService';

const App: React.FC = () => {
  const [photos, setPhotos] = useState<ScannedPhoto[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [lastErrorMsg, setLastErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addNotification = (msg: string, photoId: string) => {
    const newNotif = { id: Math.random().toString(36).substr(2, 9), message: msg, photoId };
    setNotifications(prev => [newNotif, ...prev]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
    }, 5000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setLastErrorMsg(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const newPhoto: ScannedPhoto = {
          id: Math.random().toString(36).substr(2, 9),
          url: base64,
          timestamp: Date.now(),
          analyzing: true
        };
        setPhotos(prev => [newPhoto, ...prev]);

        try {
          const result = await analyzePhoto(base64);
          setPhotos(prev => prev.map(p => p.id === newPhoto.id ? { ...p, analyzing: false, analysis: result } : p));
          
          if (result.riskLevel === RiskLevel.HIGH || result.riskLevel === RiskLevel.CRITICAL) {
            addNotification("兄弟，有嘢搞", newPhoto.id);
          }
        } catch (err: any) {
          console.error("Failed to analyze", err);
          const errorMsg = err.message || "分析失敗";
          setLastErrorMsg(errorMsg);
          setPhotos(prev => prev.map(p => p.id === newPhoto.id ? { ...p, analyzing: false } : p));
          addNotification(errorMsg.split(':')[0], newPhoto.id);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const selectedPhoto = photos.find(p => p.id === selectedPhotoId);

  return (
    <div className="flex h-screen overflow-hidden bg-black text-white font-sans">
      {/* Onboarding Welcome Modal */}
      {showWelcome && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl text-center space-y-6 relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-600/10 blur-[80px] rounded-full" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-red-600/10 blur-[80px] rounded-full" />
            
            <div className="flex justify-center relative">
              <div className="w-24 h-24 bg-red-600/20 rounded-full flex items-center justify-center border border-red-500/30 ring-8 ring-red-500/5">
                <Shield className="w-12 h-12 text-red-500" />
              </div>
            </div>

            <div className="space-y-3 relative">
              <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic">生存協定已啟動</h2>
              <div className="h-1 w-12 bg-red-600 mx-auto rounded-full" />
              <p className="text-xl font-bold text-zinc-100 leading-tight">
                解決你喺感情上婚姻上嘅所有危機!!
              </p>
              <p className="text-sm text-zinc-500 font-medium px-4">
                我哋嘅 AI 兄弟會掃描你嘅相簿，搵出所有致命「瀨嘢位」，幫你準備好最強求生劇本。
              </p>
            </div>

            <div className="p-5 bg-zinc-950/50 rounded-2xl border border-zinc-800 text-left space-y-3 relative">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                  <Search className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-300">影像深度偵測</div>
                  <div className="text-[10px] text-zinc-500">反射、女性特徵、危險餐飲環境</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-300">生存劇本生成</div>
                  <div className="text-[10px] text-zinc-500">提供 3 個以上合理藉口及對話範本</div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowWelcome(false)}
              className="w-full py-5 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl transition-all shadow-lg shadow-red-900/30 uppercase tracking-[0.2em] text-sm group flex items-center justify-center gap-2"
            >
              啟動求生模式 <Zap className="w-4 h-4 group-hover:scale-125 transition-transform" />
            </button>
            
            <p className="text-[10px] text-zinc-600 font-mono text-center">BRO CODE COMPLIANT v1.1.0</p>
          </div>
        </div>
      )}

      {/* Notifications Overlay */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 pointer-events-none">
        {notifications.map(n => (
          <div 
            key={n.id} 
            className="mb-2 bg-red-600/90 backdrop-blur-md text-white px-4 py-3 rounded-xl shadow-2xl flex items-center justify-between pointer-events-auto cursor-pointer animate-bounce border border-red-400"
            onClick={() => setSelectedPhotoId(n.photoId)}
          >
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 fill-current" />
              <span className="font-bold tracking-wider">{n.message}</span>
            </div>
            <ChevronRight className="w-5 h-5" />
          </div>
        ))}
      </div>

      {/* Main UI Layout */}
      <div className="flex-1 flex flex-col md:flex-row h-full">
        {/* Stream Sidebar */}
        <aside className="w-full md:w-80 lg:w-96 border-r border-zinc-800 bg-zinc-950 flex flex-col">
          <div className="p-6 flex items-center justify-between border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-red-500" />
              <h1 className="text-xl font-bold tracking-tighter uppercase italic">Survivor Bro</h1>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors border border-zinc-700"
                title="上傳危險影像"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileUpload} 
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest px-2">影像流掃描中...</div>
            {photos.length === 0 && (
              <div className="text-center py-20 text-zinc-600">
                <div className="mb-4 flex justify-center">
                  <Search className="w-12 h-12 opacity-20" />
                </div>
                <p className="text-xs">仲未有嘢要處理。<br/>上傳相片開始掃描。</p>
              </div>
            )}
            {photos.map(photo => (
              <div 
                key={photo.id}
                onClick={() => setSelectedPhotoId(photo.id)}
                className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-300 group ${
                  selectedPhotoId === photo.id ? 'border-red-500 ring-2 ring-red-500/20' : 'border-zinc-800 hover:border-zinc-600'
                }`}
              >
                <img src={photo.url} alt="scanned" className="w-full h-32 object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                {photo.analyzing && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                      <span className="text-xs font-mono text-red-500 uppercase tracking-tighter">Scanning...</span>
                    </div>
                  </div>
                )}
                {photo.analysis && (
                  <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold ${
                    photo.analysis.riskLevel === RiskLevel.CRITICAL ? 'bg-red-600 text-white animate-pulse' :
                    photo.analysis.riskLevel === RiskLevel.HIGH ? 'bg-red-500 text-white' :
                    photo.analysis.riskLevel === RiskLevel.MEDIUM ? 'bg-orange-500 text-white' : 'bg-green-600 text-white'
                  }`}>
                    {photo.analysis.riskLevel}
                  </div>
                )}
                {!photo.analyzing && !photo.analysis && (
                  <div className="absolute inset-0 bg-red-900/40 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 bg-black flex flex-col relative overflow-y-auto">
          {!selectedPhoto ? (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center text-zinc-700">
              <Shield className="w-24 h-24 mb-6 opacity-10" />
              <h2 className="text-2xl font-bold mb-2 uppercase italic tracking-tighter">Standby Mode</h2>
              <p className="max-w-md text-sm">當你喺「危險環境」影咗相，我會第一時間幫你分析。兄弟嘅責任，就係幫你諗好晒啲劇本。</p>
            </div>
          ) : (
            <div className="p-4 md:p-8 max-w-5xl mx-auto w-full">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Photo Viewer */}
                <div className="space-y-4">
                  <div className="rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-900 group relative">
                    <img src={selectedPhoto.url} alt="Detail" className="w-full h-auto max-h-[70vh] object-contain" />
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-zinc-700 flex items-center gap-2 text-xs font-mono">
                      <Zap className="w-3 h-3 text-red-500" />
                      ID: {selectedPhoto.id}
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <button className="flex items-center justify-center gap-2 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-all border border-zinc-700 font-bold text-sm">
                      <EyeOff className="w-4 h-4 text-red-500" /> 一鍵模糊背景
                    </button>
                    <button className="flex items-center justify-center gap-2 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-all border border-zinc-700 font-bold text-sm">
                      <Shield className="w-4 h-4 text-blue-500" /> 移動至私隱空間
                    </button>
                  </div>
                </div>

                {/* Analysis Report */}
                <div className="space-y-6">
                  {selectedPhoto.analyzing ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-4 py-20 text-zinc-500">
                      <div className="w-12 h-12 border-4 border-zinc-800 border-t-red-600 rounded-full animate-spin"></div>
                      <p className="font-mono text-xs tracking-widest uppercase">Analyzing Threat Vectors...</p>
                    </div>
                  ) : selectedPhoto.analysis ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      {/* Risk Header */}
                      <div className={`p-6 rounded-2xl border ${
                        selectedPhoto.analysis.riskLevel === RiskLevel.CRITICAL || selectedPhoto.analysis.riskLevel === RiskLevel.HIGH
                        ? 'bg-red-950/20 border-red-500/50 risk-glow-red'
                        : 'bg-zinc-900 border-zinc-700'
                      }`}>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-black tracking-[0.2em] uppercase opacity-60">風險報告報告書</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                            selectedPhoto.analysis.riskLevel === RiskLevel.CRITICAL ? 'bg-red-600' :
                            selectedPhoto.analysis.riskLevel === RiskLevel.HIGH ? 'bg-red-500' :
                            selectedPhoto.analysis.riskLevel === RiskLevel.MEDIUM ? 'bg-orange-500' : 'bg-green-600'
                          }`}>
                            LEVEL: {selectedPhoto.analysis.riskLevel}
                          </span>
                        </div>
                        <p className="text-lg leading-relaxed italic text-zinc-100 font-bold">
                          「{selectedPhoto.analysis.summary}」
                        </p>
                      </div>

                      {/* Analysis Details */}
                      <div className="space-y-4">
                        <h3 className="flex items-center gap-2 text-red-500 font-black text-sm uppercase tracking-wider">
                          <AlertTriangle className="w-4 h-4" /> 瀨嘢位偵測
                        </h3>
                        <ul className="grid grid-cols-1 gap-2">
                          {selectedPhoto.analysis.riskSpots.map((spot, idx) => (
                            <li key={idx} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex items-start gap-3 text-sm">
                              <span className="w-5 h-5 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 font-black text-[10px] shrink-0 mt-0.5 border border-red-500/20">
                                {idx + 1}
                              </span>
                              {spot}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Survival Scripts */}
                      <div className="space-y-4">
                        <h3 className="flex items-center gap-2 text-blue-500 font-black text-sm uppercase tracking-wider">
                          <MessageSquare className="w-4 h-4" /> 求生對話劇本
                        </h3>
                        <div className="space-y-3">
                          {selectedPhoto.analysis.scripts.map((script, idx) => (
                            <div key={idx} className="bg-zinc-900 border-l-4 border-blue-600 p-4 rounded-r-xl italic text-sm text-zinc-300 leading-relaxed shadow-lg">
                              {script}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Reasonable Excuses */}
                      <div className="space-y-4">
                        <h3 className="flex items-center gap-2 text-green-500 font-black text-sm uppercase tracking-wider">
                          <Zap className="w-4 h-4" /> 合理路過理由
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                          {selectedPhoto.analysis.excuses.map((excuse, idx) => (
                            <div key={idx} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between group hover:bg-zinc-800 transition-colors">
                              <span className="text-sm font-medium">{excuse}</span>
                              <button 
                                onClick={() => navigator.clipboard.writeText(excuse)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1 bg-zinc-700 rounded-lg text-[10px] font-bold hover:bg-zinc-600"
                              >
                                複製
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => {
                          setPhotos(prev => prev.filter(p => p.id !== selectedPhotoId));
                          setSelectedPhotoId(null);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-4 text-zinc-600 hover:text-red-500 transition-all border-t border-zinc-900 mt-8 text-xs font-bold uppercase tracking-widest"
                      >
                        <Trash2 className="w-4 h-4" /> 永久銷毀此證據
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-20 space-y-6">
                      <div className="flex justify-center">
                        <div className="w-16 h-16 bg-red-600/10 rounded-full flex items-center justify-center border border-red-600/30">
                          <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-zinc-200 font-bold uppercase tracking-widest">系統連線異常</div>
                        <div className="text-xs text-red-500 font-mono bg-red-500/10 py-2 px-4 rounded-lg inline-block border border-red-500/20">
                          {lastErrorMsg || "連線逾時 (TIMEOUT_ERROR)"}
                        </div>
                      </div>
                      <p className="text-[10px] text-zinc-600 px-10 leading-relaxed">
                        兄弟，可能 Vercel 條水喉唔係好順，或者粒 API Key 仲未生效。請檢查 Vercel 環境變數並確保部署狀態係「綠色」。
                      </p>
                      <button 
                        onClick={() => selectedPhotoId && handleFileUpload({ target: { files: [] } } as any)} // Placeholder for retry
                        className="px-6 py-2 bg-zinc-800 rounded-full text-xs font-bold hover:bg-zinc-700 transition-colors"
                      >
                        重新連線
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer / Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md border-t border-zinc-900 py-2.5 px-6 flex items-center justify-between text-[9px] uppercase tracking-[0.2em] text-zinc-600 z-40 font-mono">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div> SYSTEM_READY</span>
          <span className="hidden md:inline">SCAN_POOL: {photos.length}</span>
          <span className="text-red-900 font-bold">THREAT_LEVEL: {photos.filter(p => p.analysis?.riskLevel === RiskLevel.CRITICAL).length > 0 ? 'CRITICAL' : 'STABLE'}</span>
        </div>
        <div className="flex items-center gap-2">
           <Zap className="w-3 h-3" /> SURVIVOR_BRO_V1.1
        </div>
      </footer>
    </div>
  );
};

export default App;