import React, { useState, useEffect, useRef } from "react";
import { Project, Scene } from "../types";
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  Settings, 
  Smartphone, 
  Sparkle,
  Tv,
  Subtitles,
  Music
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PreviewPlayerProps {
  project: Project;
}

export default function PreviewPlayer({ project }: PreviewPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePartIndex, setActivePartIndex] = useState(0);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [timelineSecs, setTimelineSecs] = useState(0);
  const [subtitleStyle, setSubtitleStyle] = useState(
    project.subtitle_style || {
      font: "Inter",
      font_size: 20,
      position: "bottom",
      background: true,
      max_words_per_line: 5
    }
  );

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextSynthesizer = useRef<SpeechSynthesisUtterance | null>(null);

  // Compile all scenes sequentially
  const allScenes: Scene[] = [];
  project.storyboard?.parts.forEach((part) => {
    part.scenes.forEach((scene) => {
      allScenes.push(scene);
    });
  });

  const activeScene = allScenes[activeSceneIndex];

  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, []);

  const startPlayback = () => {
    if (allScenes.length === 0) return;
    setIsPlaying(true);
    playSceneVoice(allScenes[activeSceneIndex]);
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    window.speechSynthesis.cancel();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  };

  // Speaks out narration and automatically advances to the next scene when done!
  const playSceneVoice = (scene: Scene) => {
    if (!scene) return;
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(scene.vo);
    utterance.lang = "id-ID"; // Indonesian spoken accent
    utterance.rate = 1.0;
    audioContextSynthesizer.current = utterance;

    // Estimate duration for fallback if tts fails or is unsupported
    const sceneSeconds = scene.duration || 5;
    let secondsElapsed = 0;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      secondsElapsed += 1;
      setTimelineSecs(prev => prev + 1);
      
      if (secondsElapsed >= sceneSeconds) {
        clearInterval(timerRef.current!);
        timerRef.current = null;
        // Advance to next scene
        advanceNext();
      }
    }, 1000);

    utterance.onend = () => {
      // Speech finished
    };

    window.speechSynthesis.speak(utterance);
  };

  const advanceNext = () => {
    setActiveSceneIndex((prev) => {
      const nextIndex = prev + 1;
      if (nextIndex < allScenes.length) {
        // Play next scene
        setTimeout(() => {
          if (isPlaying) {
            playSceneVoice(allScenes[nextIndex]);
          }
        }, 300);
        return nextIndex;
      } else {
        // Done with all scenes
        setIsPlaying(false);
        setTimelineSecs(0);
        return 0;
      }
    });
  };

  const handlePrev = () => {
    window.speechSynthesis.cancel();
    setActiveSceneIndex((prev) => {
      const prevIndex = Math.max(0, prev - 1);
      if (isPlaying) {
        playSceneVoice(allScenes[prevIndex]);
      }
      return prevIndex;
    });
  };

  const handleNext = () => {
    window.speechSynthesis.cancel();
    setActiveSceneIndex((prev) => {
      const nextIndex = Math.min(allScenes.length - 1, prev + 1);
      if (isPlaying) {
        playSceneVoice(allScenes[nextIndex]);
      }
      return nextIndex;
    });
  };

  // Determine dynamic Framer Motion styles based on Motion Prompt descriptions
  const getMotionAnimation = (motionPrompt: string) => {
    const norm = (motionPrompt || "").toLowerCase();
    if (norm.includes("push-in") || norm.includes("zoom-in") || norm.includes("close-up")) {
      return {
        scale: [1, 1.12],
        transition: { duration: activeScene?.duration || 5, ease: "linear" }
      };
    }
    if (norm.includes("pan right") || norm.includes("pan-right") || norm.includes("tilt")) {
      return {
        x: [0, 15],
        scale: 1.05,
        transition: { duration: activeScene?.duration || 5, ease: "linear" }
      };
    }
    if (norm.includes("pan left") || norm.includes("pan-left")) {
      return {
        x: [0, -15],
        scale: 1.05,
        transition: { duration: activeScene?.duration || 5, ease: "linear" }
      };
    }
    if (norm.includes("bubble") || norm.includes("movement") || norm.includes("steam")) {
      return {
        scale: [1.02, 1.06, 1.02],
        y: [0, -4, 0],
        transition: { duration: activeScene?.duration || 5, ease: "easeInOut", repeat: Infinity }
      };
    }
    // Subtle default float
    return {
      scale: [1, 1.05],
      transition: { duration: activeScene?.duration || 5, ease: "linear" }
    };
  };

  if (allScenes.length === 0) {
    return (
      <div className="py-12 text-center bg-zinc-950/30 border border-zinc-900 rounded-xl">
        <Smartphone size={24} className="mx-auto text-zinc-650 mb-2" />
        <h4 className="text-xs font-semibold text-zinc-400">Pratinjau Belum Tersedia</h4>
        <p className="text-[10px] text-zinc-650 max-w-xs mx-auto mt-1">Lengkapi storyboard terlebih dahulu untuk merender pratinjau video di player 9:16 ini.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl">
      
      {/* 9:16 Vertical Smartphone Screen Frame */}
      <div className="lg:col-span-5 flex flex-col items-center">
        <div className="relative aspect-[9/16] w-full max-w-[280px] bg-zinc-950 rounded-[40px] border-[10px] border-zinc-800/90 shadow-2xl overflow-hidden ring-4 ring-zinc-900 flex flex-col justify-between">
          
          {/* Status Bar / Camera island notch */}
          <div className="absolute top-0 inset-x-0 h-6 flex justify-center items-center z-30">
            <div className="w-24 h-4 bg-zinc-800/95 rounded-b-xl flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-zinc-900 rounded-full border border-zinc-800"></div>
            </div>
          </div>

          {/* Player Display Viewport */}
          <div className="relative flex-1 bg-zinc-950 overflow-hidden flex items-center justify-center">
            <AnimatePresence mode="wait">
              {activeScene && (
                <motion.div 
                  key={activeScene.scene_id}
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <motion.img 
                    src={activeScene.image_path}
                    alt={`Preview Active scene ${activeScene.scene_number}`}
                    className="w-full h-full object-cover"
                    animate={isPlaying ? getMotionAnimation(activeScene.motion_prompt) : {}}
                    referrerPolicy="no-referrer"
                  />

                  {/* Aesthetic Video Filter Glares */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                  {/* Timing progress bar */}
                  <div className="absolute top-8 inset-x-3 h-1 bg-zinc-800/70 rounded-full overflow-hidden z-25">
                    <div 
                      className="h-full bg-amber-550 transition-all duration-300"
                      style={{ width: `${((activeSceneIndex + 1) / allScenes.length) * 100}%` }}
                    />
                  </div>

                  {/* Hot watermark indicator */}
                  <div className="absolute top-11 right-3 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-md text-[8px] font-bold text-amber-450 border border-amber-900/35 font-mono tracking-tight flex items-center gap-1 z-20">
                    <Sparkle size={8} className="animate-spin text-amber-400" />
                    LIVE DESIGN
                  </div>

                  {/* Styled Burn-in Subtitles Overlay */}
                  <div className="absolute bottom-16 inset-x-4 text-center z-25 leading-snug">
                    <div className={`inline-block border px-3 py-1.5 rounded-lg text-center ${subtitleStyle.background ? 'bg-black/85 backdrop-blur-sm border-zinc-800/80 shadow-2xl' : 'border-transparent'}`}>
                      <p 
                        className="text-white font-bold leading-normal tracking-tight drop-shadow-md text-center"
                        style={{ 
                          fontSize: `${subtitleStyle.font_size}px`,
                          fontFamily: subtitleStyle.font === "Mono" ? "JetBrains Mono" : "Inter"
                        }}
                      >
                        {activeScene.vo}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Inactive overlay lock */}
            {!isPlaying && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center z-10 p-4 text-center">
                <button 
                  onClick={handleTogglePlay}
                  className="w-14 h-14 bg-amber-500 hover:bg-amber-400 hover:scale-105 active:scale-95 text-zinc-950 rounded-full flex items-center justify-center shadow-2xl shadow-amber-500/35 transition duration-150 cursor-pointer"
                  id="btn-big-play-smart-phone"
                >
                  <Play size={24} className="fill-zinc-950 ml-1" />
                </button>
                <span className="text-[10px] text-zinc-300 font-bold mt-4 tracking-wide uppercase">Pratinjau Storyboard</span>
                <span className="text-[9px] text-zinc-500 mt-1 max-w-[180px]">Mainkan untuk mensimulasikan VO audio, transisi, dan subtitle otomatis</span>
              </div>
            )}
          </div>

          {/* Bottom Device Indicator Home bar */}
          <div className="h-6 flex items-center justify-center bg-zinc-950 z-30 border-t border-zinc-900/10">
            <div className="w-24 h-1 bg-zinc-800 rounded-full"></div>
          </div>

        </div>
      </div>

      {/* Controller specifications & Project Details */}
      <div className="lg:col-span-7 space-y-6">
        <div>
          <span className="px-2 py-0.5 text-[10px] font-bold bg-zinc-800 border border-zinc-700 text-zinc-300 rounded font-mono uppercase tracking-wider">Preview Console</span>
          <h3 className="text-base font-bold text-zinc-200 mt-2">Active Production Playback</h3>
          <p className="text-[11px] text-zinc-500 mt-1">Simulasikan audio voiceover dengan browser SpeechSynthesis generator dan transisi Ken Burns di viewport vertical 9:16.</p>
        </div>

        {/* Playback controller buttons */}
        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-zinc-400">
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrev}
              disabled={activeSceneIndex === 0}
              className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-800/80 disabled:opacity-40"
              id="btn-play-prev"
            >
              <SkipBack size={15} />
            </button>
            <button 
              onClick={handleTogglePlay}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-450 hover:text-zinc-950 text-zinc-950 font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              id="btn-play-toggle"
            >
              {isPlaying ? <Pause size={14} className="fill-zinc-950" /> : <Play size={14} className="fill-zinc-950" />}
              {isPlaying ? "Pause Playback" : "Mulai Putar (Full 9:16)"}
            </button>
            <button 
              onClick={handleNext}
              disabled={activeSceneIndex === allScenes.length - 1}
              className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-800/80 disabled:opacity-40"
              id="btn-play-next"
            >
              <SkipForward size={15} />
            </button>
          </div>

          <div className="text-center md:text-right font-mono text-[11px] text-zinc-450 space-y-0.5">
            <div>Scene {activeSceneIndex + 1} of {allScenes.length}</div>
            <div className="text-zinc-500">Estimasi Durasi Aktif: {activeScene?.duration || 5}s</div>
          </div>
        </div>

        {/* Dynamic active scene log readout */}
        {activeScene && (
          <div className="bg-[#18181b] p-4 rounded-xl border border-zinc-800 space-y-3.5">
            <div className="flex justify-between items-center border-b border-zinc-800/80 pb-2">
              <span className="text-xs font-bold text-zinc-300 font-mono">SCENE {activeScene.scene_number} LOG</span>
              <span className="px-1.5 py-0.5 bg-amber-950/40 border border-amber-900/40 text-amber-400 text-[10px] rounded font-mono font-bold tracking-tight">Active Screen</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-semibold leading-relaxed">
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase font-black mb-1">Aksi visual</span>
                <p className="text-zinc-300 font-medium">{activeScene.action}</p>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase font-black mb-1">Narasi VO</span>
                <p className="text-zinc-300 font-medium italic">"{activeScene.vo}"</p>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-900">
              <span className="text-[9px] text-zinc-500 uppercase font-black block mb-1">Motion preset</span>
              <p className="text-[11px] text-zinc-400 font-mono italic">{activeScene.motion_prompt}</p>
            </div>
          </div>
        )}

        {/* Subtitle burner configurator */}
        <div className="bg-[#18181b]/50 p-4 rounded-xl border border-zinc-800 space-y-4">
          <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5"><Subtitles size={14} className="text-amber-400" /> Pengaturan Gaya Subtitle (Burn-in)</span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Jenis Font</label>
              <select 
                value={subtitleStyle.font}
                onChange={(e) => setSubtitleStyle({ ...subtitleStyle, font: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 focus:outline-none"
              >
                <option value="Inter">Inter (Modern Clean)</option>
                <option value="Mono">JetBrains Mono (Technical)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Ukuran Font (px)</label>
              <input 
                type="number"
                value={subtitleStyle.font_size}
                onChange={(e) => setSubtitleStyle({ ...subtitleStyle, font_size: Number(e.target.value) })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Latar Belakang Subtitle</label>
              <select 
                value={subtitleStyle.background ? "true" : "false"}
                onChange={(e) => setSubtitleStyle({ ...subtitleStyle, background: e.target.value === "true" })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 focus:outline-none"
              >
                <option value="true">Gantungan Hitam (85% Opacity)</option>
                <option value="false">Tanpa Latar (Drop Shadow)</option>
              </select>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
