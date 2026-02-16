import React, { useState, useEffect, useRef } from 'react';
import { Camera, Shield, AlertTriangle, MessageSquare, Trash2, EyeOff, Search, ChevronRight, Bell, Zap, Info, RefreshCcw, WifiOff } from 'lucide-react';
import { ScannedPhoto, AppNotification, RiskLevel, AnalysisResult } from './types';
import { analyzePhoto } from './services/geminiService';

const App: React.FC = () => {
  const [photos, setPhotos] = useState<ScannedPhoto[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
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
          const { result, mode } = await analyzePhoto(base64);
          if (mode === 'FALLBACK') setIsFallbackMode(true);
          
          setPhotos(prev => prev.map(p => p.id === newPhoto.id ? { ...p, analyzing: false, analysis: result } : p));
          
          if (result.riskLevel === RiskLevel.HIGH || result.riskLevel === RiskLevel.CRITICAL) {
            addNotification(mode === 'FALLBACK' ? "⚠️ 離線警告：發現危險" : "🚨 兄弟，大鑊嘢！", newPhoto.id);
          }
        } catch (err: any) {
          setPhotos(prev => prev.map(p => p.id === newPhoto.id ? { ...p, analyzing: false } : p));
          addNotification("分析出錯，請再試", newPhoto.id);
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

            <button 
              onClick={() => setShowWelcome(false)}
              className="w-full py-5 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl transition-all shadow-lg shadow-red-900/30 uppercase tracking-[0.2em] text-sm group flex items-center justify-center gap-2"
            >
              進入求生基地 <Zap className="w-4 h-4 group-hover:scale-125 transition-transform" />
            </button>
            
            <p className="text-[10px] text-zinc-600 font-mono text-center">BRO CODE COMPLIANT v1.2.0</p>
          </div>
        </div>
      )}

      {/* Notifications Overlay */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 pointer-events-none">
        {notifications.map(n => (
          <div 
            key={n.id} 
            className="mb-2 bg-red-600/95 backdrop-blur-md text-white px-4 py-3 rounded-xl shadow-2xl flex items-center justify-between pointer-events-auto cursor-pointer animate-bounce border border-red-400"
            onClick={() => setSelectedPhotoId(n.photoId)}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 fill-current" />
              <span className="font-bold tracking-wider">{n.message}</span>
            </div>
            <ChevronRight className="w-5 h-5" />
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col md:flex-row h-full">
        {/* Stream Sidebar */}
        <aside className="w-full md:w-80 lg:w-96 border-r border-zinc-800 bg-zinc-950 flex flex-col">
          <div className="p-6 flex items-center justify-between border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-red-500" />
              <h1 className="text-xl font-bold tracking-tighter uppercase italic">Survivor Bro</h1>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors shadow-lg shadow-red-900/20"
            >
              <Camera className="w-5 h-5" />
            </button>
            <input type="file" multiple accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {photos.length === 0 && (
              <div className="text-center py-20 text-zinc-700">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-xs uppercase tracking-widest">暫無威脅影像</p>
              </div>
            )}
            {photos.map(photo => (
              <div 
                key={photo.id}
                onClick={() => setSelectedPhotoId(photo.id)}
                className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                  selectedPhotoId === photo.id ? 'border-red-500 scale-[1.02]' : 'border-zinc-800'
                }`}
              >
                <img src={photo.url} alt="scan" className="w-full h-32 object-cover opacity-70" />
                {photo.analyzing && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-[10px] font-mono text-red-500 uppercase tracking-widest">Scanning...</span>
                    </div>
                  </div>
                )}
                {photo.analysis && (
                  <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-black ${
                    photo.analysis.riskLevel === RiskLevel.CRITICAL ? 'bg-red-600' : 'bg-zinc-700'
                  }`}>
                    {photo.analysis.riskLevel}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 bg-black overflow-y-auto pb-20">
          {!selectedPhoto ? (
            <div className="h-full flex flex-col items-center justify-center p-12 text-zinc-800">
              <Shield className="w-32 h-32 mb-6 opacity-5" />
              <h2 className="text-xl font-black uppercase tracking-widest italic">Waiting for Input...</h2>
            </div>
          ) : (
            <div className="p-4 md:p-10 max-w-4xl mx-auto space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-2xl">
                    <img src={selectedPhoto.url} className="w-full h-auto" alt="focus" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs font-black uppercase flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors">
                      <EyeOff className="w-4 h-4 text-red-500" /> 模糊特徵
                    </button>
                    <button className="py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs font-black uppercase flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors">
                      <Shield className="w-4 h-4 text-blue-500" /> 私隱移動
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {selectedPhoto.analyzing ? (
                    <div className="py-20 flex flex-col items-center gap-4 text-zinc-600">
                      <RefreshCcw className="w-8 h-8 animate-spin" />
                      <p className="text-xs font-mono tracking-[0.3em] uppercase">Processing Threat Report...</p>
                    </div>
                  ) : selectedPhoto.analysis && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                      {/* Risk Box */}
                      <div className={`p-6 rounded-3xl border ${
                        selectedPhoto.analysis.riskLevel === RiskLevel.CRITICAL || selectedPhoto.analysis.riskLevel === RiskLevel.HIGH
                        ? 'bg-red-950/20 border-red-500/50'
                        : 'bg-zinc-900/50 border-zinc-800'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">Risk Level</span>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                            selectedPhoto.analysis.riskLevel === RiskLevel.CRITICAL ? 'bg-red-600' : 'bg-zinc-700'
                          }`}>
                            {selectedPhoto.analysis.riskLevel}
                          </span>
                        </div>
                        <p className="text-lg font-black italic leading-snug">「{selectedPhoto.analysis.summary}」</p>
                      </div>

                      {/* Details */}
                      <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-red-500 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" /> 瀨嘢位偵測
                        </h3>
                        <div className="space-y-2">
                          {selectedPhoto.analysis.riskSpots.map((spot, i) => (
                            <div key={i} className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 text-sm font-medium">
                              {spot}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Scripts */}
                      <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" /> 求生劇本
                        </h3>
                        <div className="space-y-3">
                          {selectedPhoto.analysis.scripts.map((script, i) => (
                            <div key={i} className="bg-zinc-900 p-5 rounded-2xl border-l-4 border-blue-600 italic text-sm text-zinc-300">
                              {script}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Excuses */}
                      <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-green-500 flex items-center gap-2">
                          <Zap className="w-4 h-4" /> 合理藉口
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                          {selectedPhoto.analysis.excuses.map((excuse, i) => (
                            <div key={i} className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 text-sm flex justify-between items-center group">
                              <span>{excuse}</span>
                              <button 
                                onClick={() => navigator.clipboard.writeText(excuse)}
                                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-zinc-800 rounded-lg transition-all"
                              >
                                <ChevronRight className="w-4 h-4" />
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
                        className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-red-500 transition-colors"
                      >
                        永久銷毀證據
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-zinc-900 py-3 px-6 flex items-center justify-between z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${isFallbackMode ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'}`} />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">
              {isFallbackMode ? 'Local_Simulation_Mode' : 'AI_Cloud_Active'}
            </span>
          </div>
          {isFallbackMode && (
             <div className="flex items-center gap-2 text-orange-500 text-[9px] font-black uppercase tracking-[0.2em]">
               <WifiOff className="w-3 h-3" /> API_OFFLINE
             </div>
          )}
        </div>
        <div className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">
          Survivor_Bro_v1.2.0_HK
        </div>
      </footer>
    </div>
  );
};

export default App;