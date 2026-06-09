import React, { useState } from "react";
import { Scene, Storyboard, StoryboardPart } from "../types";
import { 
  Play, 
  Sparkles, 
  RotateCw, 
  Check, 
  Edit, 
  Lock, 
  Unlock, 
  Volume2, 
  Clapperboard, 
  Compass, 
  Flame, 
  UtensilsCrossed, 
  HelpCircle 
} from "lucide-react";

interface StoryboardViewProps {
  storyboard: Storyboard | undefined;
  onUpdateScene: (sceneId: string, updatedFields: Partial<Scene>) => void;
  onRegenerateImage: (sceneId: string, customPrompt?: string) => Promise<void>;
  onRegenerateVoice: (sceneId: string, customVO?: string) => Promise<void>;
  onRegenerateVideo: (sceneId: string, customPrompt?: string) => Promise<void>;
  onPreviewScene: (scene: Scene) => void;
}

export default function StoryboardView({
  storyboard,
  onUpdateScene,
  onRegenerateImage,
  onRegenerateVoice,
  onRegenerateVideo,
  onPreviewScene
}: StoryboardViewProps) {
  const [editingCell, setEditingCell] = useState<{ sceneId: string; field: keyof Scene } | null>(null);
  const [editedValue, setEditedValue] = useState("");
  const [lockedSeeds, setLockedSeeds] = useState<Record<string, boolean>>({});
  const [speakingSceneId, setSpeakingSceneId] = useState<string | null>(null);
  
  // Granular asset generation tracking
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({});
  const [loadingAudios, setLoadingAudios] = useState<Record<string, boolean>>({});
  const [loadingVideos, setLoadingVideos] = useState<Record<string, boolean>>({});

  if (!storyboard) {
    return (
      <div className="py-12 text-center bg-zinc-950/30 border border-zinc-900 rounded-xl">
        <Sparkles size={24} className="mx-auto text-zinc-650 animate-pulse mb-3" />
        <h4 className="text-xs font-semibold text-zinc-400">Storyboard Belum Terbentuk</h4>
        <p className="text-[10px] text-zinc-600 max-w-xs mx-auto mt-1">Selesaikan langkah sebelumnya terlebih dahulu untuk mengurai naskah narasi menjadi storyboard per scene.</p>
      </div>
    );
  }

  const handleStartEdit = (sceneId: string, field: keyof Scene, currentValue: string) => {
    setEditingCell({ sceneId, field });
    setEditedValue(currentValue);
  };

  const handleSaveEdit = (sceneId: string, field: keyof Scene) => {
    onUpdateScene(sceneId, { [field]: editedValue });
    setEditingCell(null);
  };

  const triggerRegenImage = async (sceneId: string, currentPrompt: string) => {
    setLoadingImages(prev => ({ ...prev, [sceneId]: true }));
    try {
      await onRegenerateImage(sceneId, currentPrompt);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingImages(prev => ({ ...prev, [sceneId]: false }));
    }
  };

  const triggerRegenAudio = async (sceneId: string, currentVo: string) => {
    setLoadingAudios(prev => ({ ...prev, [sceneId]: true }));
    try {
      await onRegenerateVoice(sceneId, currentVo);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAudios(prev => ({ ...prev, [sceneId]: false }));
    }
  };

  const triggerRegenVideo = async (sceneId: string, motionPrompt: string) => {
    setLoadingVideos(prev => ({ ...prev, [sceneId]: true }));
    try {
      await onRegenerateVideo(sceneId, motionPrompt);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingVideos(prev => ({ ...prev, [sceneId]: false }));
    }
  };

  const toggleSeedClass = (sceneId: string) => {
    setLockedSeeds(prev => ({
      ...prev,
      [sceneId]: !prev[sceneId]
    }));
  };

  // Speaks out VO in Indonesian beautifully using browser SpeechSynthesis
  const speakVoiceOver = (scene: Scene) => {
    if (!scene.vo) return;
    
    // Stop any active speech
    window.speechSynthesis.cancel();
    
    if (speakingSceneId === scene.scene_id) {
      setSpeakingSceneId(null);
      return;
    }
    
    setSpeakingSceneId(scene.scene_id);
    const utterance = new SpeechSynthesisUtterance(scene.vo);
    utterance.lang = "id-ID"; // Indonesian Voice
    utterance.rate = 1.05;
    
    utterance.onend = () => {
      setSpeakingSceneId(null);
    };
    utterance.onerror = () => {
      setSpeakingSceneId(null);
    };
    
    window.speechSynthesis.speak(utterance);
  };

  const getPartIcon = (iconName?: string) => {
    switch (iconName) {
      case "cookpot":
        return <UtensilsCrossed size={14} className="text-amber-400" />;
      case "flame":
        return <Flame size={14} className="text-orange-400" />;
      case "star":
        return <Sparkles size={14} className="text-amber-400" />;
      default:
        return <Compass size={14} className="text-amber-450" />;
    }
  };

  // Helper for rendering status indicators beautifully
  const renderStatusBadge = (status?: string, err?: string | null) => {
    const activeStatus = status || "pending";
    if (activeStatus === "completed") {
      return <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-emerald-950/40 border border-emerald-900/40 text-emerald-400">Ready</span>;
    }
    if (activeStatus === "generating") {
      return <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-amber-950/40 border border-amber-900/40 text-amber-400 animate-pulse">Running</span>;
    }
    if (activeStatus === "failed") {
      return (
        <span 
          className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-red-950/40 border border-red-900/40 text-red-400 cursor-help"
          title={err || "Gagal menghubungi service lokal"}
        >
          Failed
        </span>
      );
    }
    return <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-zinc-900 border border-zinc-800 text-zinc-500 font-mono">Idle</span>;
  };

  return (
    <div className="space-y-8">
      {/* Structural Storyboard Table */}
      <div className="border border-zinc-800 rounded-xl bg-zinc-950/60 overflow-hidden shadow-2xl">
        <div className="p-4 bg-zinc-900/50 border-b border-zinc-800 flex justify-between items-center">
          <div>
            <h3 className="text-xs font-bold text-zinc-300 font-mono tracking-tight">{storyboard.title}</h3>
            <p className="text-[10px] text-zinc-500 font-medium">Visual format: {storyboard.format} • Total durasi: {storyboard.duration_total}s</p>
          </div>
          <div className="flex gap-2.5 items-center text-[10px] text-zinc-500">
            <span className="flex items-center gap-1"><Volume2 size={11} /> Auto-TTS ID</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Clapperboard size={11} /> 9:16 Cinematic Grid</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-900/30 text-zinc-500 text-[10px] font-semibold tracking-wider uppercase border-b border-zinc-850">
                <th className="py-3 px-4 w-[140px] text-center font-mono">Part / Durasi</th>
                <th className="py-3 px-4 w-[160px]">Skenario Preview</th>
                <th className="py-3 px-4 min-w-[200px]">Aksi & Gesture (Action)</th>
                <th className="py-3 px-4 min-w-[220px]">Suara Narasi (Voice Over)</th>
                <th className="py-3 px-4 min-w-[240px]">Gambar Prompt (Text-to-Image)</th>
                <th className="py-3 px-4 w-[210px] text-center">Status & Pipeline Aksi</th>
              </tr>
            </thead>
            <tbody>
              {storyboard.parts.map((part: StoryboardPart) => {
                return (
                  <React.Fragment key={`part-${part.part_number}`}>
                    {/* Part Header row */}
                    <tr className="bg-zinc-900/50 border-t border-zinc-800">
                      <td colSpan={6} className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-zinc-950 border border-zinc-800 rounded">
                            {getPartIcon(part.icon)}
                          </div>
                          <span className="font-bold text-zinc-300 text-[11px] uppercase tracking-wide">
                            BAGIAN {part.part_number} — {part.title}
                          </span>
                          <span className="ml-2 px-1.5 py-0.5 text-[9px] bg-amber-950/50 border border-amber-900/30 text-amber-400 font-mono rounded">
                            Rentang Waktu: {part.time_range}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Scenes under this part */}
                    {part.scenes.map((scene: Scene) => {
                      const isImageLoading = loadingImages[scene.scene_id] || false;
                      const isAudioLoading = loadingAudios[scene.scene_id] || false;
                      const isVideoLoading = loadingVideos[scene.scene_id] || false;
                      
                      const isSpeaking = speakingSceneId === scene.scene_id;
                      const isSeedLocked = lockedSeeds[scene.scene_id] || false;

                      return (
                        <tr 
                          key={scene.scene_id}
                          className="border-t border-zinc-900 hover:bg-zinc-900/10 transition"
                          id={`storyboard-row-${scene.scene_id}`}
                        >
                          {/* Part / Timing metadata column */}
                          <td className="py-4 px-4 text-center border-r border-zinc-900/80 bg-zinc-900/10">
                            <div className="font-mono text-zinc-400 font-semibold mb-1">Scene {scene.scene_number}</div>
                            <div className="inline-block px-1.5 py-0.5 bg-zinc-800/80 border border-zinc-700/50 text-[11px] rounded font-mono text-zinc-300">
                              {scene.duration} Detik
                            </div>
                          </td>

                          {/* Scene Preview Block */}
                          <td className="py-4 px-4 border-r border-zinc-900/80">
                            <div className="relative aspect-[9/16] w-[110px] mx-auto rounded-lg border border-zinc-800 bg-zinc-900 shadow-lg overflow-hidden group cursor-pointer"
                              onClick={() => onPreviewScene(scene)}
                              title="Klik untuk pratinjau"
                            >
                              {scene.image_path ? (
                                <img 
                                  src={scene.image_path} 
                                  alt="Preview" 
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 text-zinc-650 bg-zinc-950">
                                  <Sparkles size={16} className="animate-pulse text-zinc-500 mb-1" />
                                  <span className="text-[10px]">No visuals</span>
                                </div>
                              )}
                              {/* Timing watermark */}
                              <div className="absolute bottom-1 right-1 bg-black/70 px-1 py-0.5 rounded text-[9px] font-mono text-zinc-300">
                                {scene.time_range || `${scene.scene_number * 5 - 5}-${scene.scene_number * 5}s`}
                              </div>
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                <Play size={16} className="text-white fill-white" />
                              </div>
                            </div>
                          </td>

                          {/* Action cell details */}
                          <td className="py-4 px-4 border-r border-zinc-900/80">
                            {editingCell?.sceneId === scene.scene_id && editingCell?.field === "action" ? (
                              <div className="space-y-1.5">
                                <textarea 
                                  value={editedValue}
                                  onChange={(e) => setEditedValue(e.target.value)}
                                  className="w-full h-20 bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-medium"
                                />
                                <button 
                                  onClick={() => handleSaveEdit(scene.scene_id, "action")}
                                  className="flex items-center gap-1 px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-[10px] font-bold rounded cursor-pointer"
                                  id={`btn-save-action-${scene.scene_id}`}
                                >
                                  <Check size={11} /> Simpan
                                </button>
                              </div>
                            ) : (
                              <div 
                                className="group/edit cursor-pointer hover:bg-zinc-900/50 rounded p-1.5 relative min-h-[40px] text-zinc-300 leading-normal"
                                onClick={() => handleStartEdit(scene.scene_id, "action", scene.action)}
                              >
                                {scene.action}
                                <span className="absolute top-1 right-1 opacity-0 group-hover/edit:opacity-100 text-zinc-500">
                                  <Edit size={10} />
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Voice Over Speech narration cell */}
                          <td className="py-4 px-4 border-r border-zinc-900/80">
                            {editingCell?.sceneId === scene.scene_id && editingCell?.field === "vo" ? (
                              <div className="space-y-1.5">
                                <textarea 
                                  value={editedValue}
                                  onChange={(e) => setEditedValue(e.target.value)}
                                  className="w-full h-20 bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-zinc-200 font-mono focus:border-amber-500 focus:outline-none"
                                />
                                <button 
                                  onClick={() => handleSaveEdit(scene.scene_id, "vo")}
                                  className="flex items-center gap-1 px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-[10px] font-bold rounded cursor-pointer"
                                  id={`btn-save-vo-${scene.scene_id}`}
                                >
                                  <Check size={11} /> Simpan
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div 
                                  className="group/edit cursor-pointer hover:bg-zinc-900/50 rounded p-1.5 relative min-h-[40px] text-zinc-300 leading-normal italic font-medium"
                                  onClick={() => handleStartEdit(scene.scene_id, "vo", scene.vo)}
                                >
                                  "{scene.vo}"
                                  <span className="absolute top-1 right-1 opacity-0 group-hover/edit:opacity-100 text-zinc-500">
                                    <Edit size={10} />
                                  </span>
                                </div>
                                <div className="flex gap-1.5">
                                  <button 
                                    onClick={() => speakVoiceOver(scene)}
                                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 ${isSpeaking ? 'bg-amber-600 text-white' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400'} rounded border border-zinc-800 text-[10px] font-semibold transition`}
                                    id={`btn-play-voice-${scene.scene_id}`}
                                  >
                                    <Volume2 size={11} className={isSpeaking ? 'animate-bounce' : ''} />
                                    Browser Audio
                                  </button>
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Image Prompt editor cell */}
                          <td className="py-4 px-4 border-r border-zinc-900/80">
                            {editingCell?.sceneId === scene.scene_id && editingCell?.field === "image_prompt" ? (
                              <div className="space-y-1.5">
                                <textarea 
                                  value={editedValue}
                                  onChange={(e) => setEditedValue(e.target.value)}
                                  className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-zinc-300 font-mono focus:border-amber-500 focus:outline-none"
                                />
                                <button 
                                  onClick={() => handleSaveEdit(scene.scene_id, "image_prompt")}
                                  className="flex items-center gap-1 px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-[10px] font-bold rounded cursor-pointer"
                                  id={`btn-save-prompt-${scene.scene_id}`}
                                >
                                  <Check size={11} /> Simpan
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <span className="text-[10px] uppercase font-bold text-zinc-600 block">T2I Prompt:</span>
                                <div 
                                  className="group/edit cursor-pointer hover:bg-zinc-900/50 rounded p-1.5 relative min-h-[50px] text-zinc-400 font-mono text-[10px] leading-relaxed"
                                  onClick={() => handleStartEdit(scene.scene_id, "image_prompt", scene.image_prompt)}
                                >
                                  {scene.image_prompt}
                                  <span className="absolute top-1 right-1 opacity-0 group-hover/edit:opacity-100 text-zinc-500">
                                    <Edit size={10} />
                                  </span>
                                </div>
                                
                                {scene.motion_prompt && (
                                  <div className="pt-2 border-t border-zinc-900">
                                    <span className="text-[9px] uppercase font-bold text-zinc-650 block font-mono">Motion Prompt:</span>
                                    <span className="text-[10px] italic text-zinc-500 font-mono leading-tight block">{scene.motion_prompt}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Generation trigger status & action triggers */}
                          <td className="py-4 px-4 bg-zinc-900/5">
                            <div className="space-y-3">
                              
                              {/* 1. Image generator controls */}
                              <div className="space-y-1 bg-zinc-950/40 p-2 border border-zinc-900 rounded-lg">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Visual</span>
                                  {renderStatusBadge(scene.image_status, scene.error)}
                                </div>
                                <button 
                                  onClick={() => triggerRegenImage(scene.scene_id, scene.image_prompt)}
                                  disabled={isImageLoading}
                                  className="w-full flex items-center justify-center gap-1 px-2 py-1 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-amber-500 hover:text-amber-400 text-[10px] font-bold rounded border border-zinc-800/80 hover:border-zinc-700 transition cursor-pointer"
                                  id={`btn-regen-image-${scene.scene_id}`}
                                >
                                  <RotateCw size={10} className={isImageLoading ? 'animate-spin' : ''} />
                                  {isImageLoading ? "Creating..." : "Z-Image Turbo"}
                                </button>
                              </div>

                              {/* 2. TTS generator controls */}
                              <div className="space-y-1 bg-zinc-950/40 p-2 border border-zinc-900 rounded-lg">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">WAV Audio</span>
                                  {renderStatusBadge(scene.tts_status, scene.error)}
                                </div>
                                <button 
                                  onClick={() => triggerRegenAudio(scene.scene_id, scene.vo)}
                                  disabled={isAudioLoading}
                                  className="w-full flex items-center justify-center gap-1 px-2 py-1 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-amber-500 hover:text-amber-400 text-[10px] font-bold rounded border border-zinc-800/80 hover:border-zinc-700 transition cursor-pointer"
                                  id={`btn-regen-audio-${scene.scene_id}`}
                                >
                                  <RotateCw size={10} className={isAudioLoading ? 'animate-spin' : ''} />
                                  {isAudioLoading ? "Speaking..." : "F5-TTS Sync"}
                                </button>
                              </div>

                              {/* 3. LTX-Video generator controls */}
                              <div className="space-y-1 bg-zinc-950/40 p-2 border border-zinc-900 rounded-lg">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Video</span>
                                  {renderStatusBadge(scene.video_status, scene.error)}
                                </div>
                                <button 
                                  onClick={() => triggerRegenVideo(scene.scene_id, scene.motion_prompt)}
                                  disabled={isVideoLoading}
                                  className="w-full flex items-center justify-center gap-1 px-2 py-1 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-amber-500 hover:text-amber-400 text-[10px] font-bold rounded border border-zinc-800/80 hover:border-zinc-700 transition cursor-pointer"
                                  id={`btn-regen-video-${scene.scene_id}`}
                                >
                                  <RotateCw size={10} className={isVideoLoading ? 'animate-spin' : ''} />
                                  {isVideoLoading ? "Motion..." : "LTX-Video Gen"}
                                </button>
                              </div>

                              {/* Lock Seed option */}
                              <button 
                                onClick={() => toggleSeedClass(scene.scene_id)}
                                className={`w-full flex items-center justify-center gap-1 py-1 border ${isSeedLocked ? 'bg-amber-950/40 border-amber-900 text-amber-400' : 'bg-transparent border-zinc-900 text-zinc-600'} text-[9px] font-medium rounded transition`}
                                id={`btn-lock-seed-${scene.scene_id}`}
                              >
                                {isSeedLocked ? (
                                  <>
                                    <Lock size={10} /> Seed Locked (AI)
                                  </>
                                ) : (
                                  <>
                                    <Unlock size={10} /> Unlock Seed
                                  </>
                                )}
                              </button>
                              
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
