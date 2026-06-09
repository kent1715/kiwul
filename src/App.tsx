import { useState, useEffect } from "react";
import { Project, Scene, Storyboard, CharacterBible, LocationBible } from "./types";
import ProjectList from "./components/ProjectList";
import ProviderSettings from "./components/ProviderSettings";
import StoryboardView from "./components/StoryboardView";
import CharacterView from "./components/CharacterView";
import LocationView from "./components/LocationView";
import PreviewPlayer from "./components/PreviewPlayer";

import { 
  Sparkles, 
  HelpCircle,
  Lightbulb, 
  BookOpen, 
  FileText, 
  UserSquare, 
  TableProperties, 
  Play, 
  History, 
  CheckCircle,
  ChevronRight,
  ArrowLeft,
  Settings,
  Flame,
  Info,
  Loader2,
  Trash2,
  Video
} from "lucide-react";

function getUnsplashFallback(query: string, ratio: string = "1:1"): string {
  const norm = query.toLowerCase();
  if (norm.includes("rachel") || norm.includes("host") || norm.includes("female") || norm.includes("wanita") || norm.includes("chef")) {
    return "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80";
  }
  if (norm.includes("pria") || norm.includes("pria") || norm.includes("male") || norm.includes("budi")) {
    return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80";
  }
  if (norm.includes("kitchen") || norm.includes("dapur") || norm.includes("masak") || norm.includes("studio")) {
    return "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80";
  }
  return "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop&q=80";
}

export const COLOR_THEMES = [
  {
    id: "amber",
    name: "Amber Gold",
    primary: "amber",
    textAccent: "text-amber-400",
    textHover: "hover:text-amber-300",
    textAccentMuted: "text-amber-500/80",
    textAccentLight: "text-amber-300",
    textAccentDeep: "text-amber-500",
    borderAccent: "border-amber-500/80",
    borderFocus: "focus:border-amber-500",
    borderAccentMuted: "border-amber-900/10",
    borderAccentDark: "border-amber-900",
    bgAccentSubtle: "bg-amber-950/20",
    bgAccentVerySubtle: "bg-amber-950/5",
    bgAccentLow: "bg-amber-950/15",
    bgAccentMedium: "bg-amber-950/40",
    bgAccentSolid: "bg-amber-500",
    bgAccentSolidHover: "hover:bg-amber-400",
    gradient: "from-amber-600 to-amber-400",
    gradientHover: "hover:from-amber-500 hover:to-amber-300",
    glow: "shadow-amber-500/20",
    glowLight: "shadow-amber-500/10",
    selectionClass: "selection:bg-amber-500 selection:text-zinc-950"
  },
  {
    id: "emerald",
    name: "Emerald Green",
    primary: "emerald",
    textAccent: "text-emerald-400",
    textHover: "hover:text-emerald-300",
    textAccentMuted: "text-emerald-500/80",
    textAccentLight: "text-emerald-300",
    textAccentDeep: "text-emerald-500",
    borderAccent: "border-emerald-500/80",
    borderFocus: "focus:border-emerald-500",
    borderAccentMuted: "border-emerald-950/10",
    borderAccentDark: "border-emerald-900",
    bgAccentSubtle: "bg-emerald-950/20",
    bgAccentVerySubtle: "bg-emerald-950/5",
    bgAccentLow: "bg-emerald-950/15",
    bgAccentMedium: "bg-emerald-950/40",
    bgAccentSolid: "bg-emerald-500",
    bgAccentSolidHover: "hover:bg-emerald-400",
    gradient: "from-emerald-600 to-emerald-400",
    gradientHover: "hover:from-emerald-500 hover:to-emerald-300",
    glow: "shadow-emerald-500/20",
    glowLight: "shadow-emerald-500/10",
    selectionClass: "selection:bg-emerald-500 selection:text-zinc-950"
  },
  {
    id: "violet",
    name: "Neon Violet",
    primary: "violet",
    textAccent: "text-violet-400",
    textHover: "hover:text-violet-300",
    textAccentMuted: "text-violet-500/80",
    textAccentLight: "text-violet-300",
    textAccentDeep: "text-violet-500",
    borderAccent: "border-violet-500/80",
    borderFocus: "focus:border-violet-500",
    borderAccentMuted: "border-violet-950/10",
    borderAccentDark: "border-violet-900",
    bgAccentSubtle: "bg-violet-950/20",
    bgAccentVerySubtle: "bg-violet-950/5",
    bgAccentLow: "bg-violet-950/15",
    bgAccentMedium: "bg-violet-950/40",
    bgAccentSolid: "bg-violet-500",
    bgAccentSolidHover: "hover:bg-violet-400",
    gradient: "from-violet-600 to-violet-400",
    gradientHover: "hover:from-violet-500 hover:to-violet-300",
    glow: "shadow-violet-500/20",
    glowLight: "shadow-violet-500/10",
    selectionClass: "selection:bg-violet-500 selection:text-zinc-950"
  },
  {
    id: "rose",
    name: "Rose Crimson",
    primary: "rose",
    textAccent: "text-rose-400",
    textHover: "hover:text-rose-300",
    textAccentMuted: "text-rose-500/80",
    textAccentLight: "text-rose-300",
    textAccentDeep: "text-rose-500",
    borderAccent: "border-rose-500/80",
    borderFocus: "focus:border-rose-500",
    borderAccentMuted: "border-rose-950/10",
    borderAccentDark: "border-rose-900",
    bgAccentSubtle: "bg-rose-950/20",
    bgAccentVerySubtle: "bg-rose-950/5",
    bgAccentLow: "bg-rose-950/15",
    bgAccentMedium: "bg-rose-950/40",
    bgAccentSolid: "bg-rose-500",
    bgAccentSolidHover: "hover:bg-rose-400",
    gradient: "from-rose-600 to-rose-400",
    gradientHover: "hover:from-rose-500 hover:to-rose-300",
    glow: "shadow-rose-500/20",
    glowLight: "shadow-rose-500/10",
    selectionClass: "selection:bg-rose-500 selection:text-zinc-950"
  },
  {
    id: "sky",
    name: "Sky Blue",
    primary: "sky",
    textAccent: "text-sky-400",
    textHover: "hover:text-sky-300",
    textAccentMuted: "text-sky-500/80",
    textAccentLight: "text-sky-300",
    textAccentDeep: "text-sky-500",
    borderAccent: "border-sky-500/80",
    borderFocus: "focus:border-sky-500",
    borderAccentMuted: "border-sky-950/10",
    borderAccentDark: "border-sky-900",
    bgAccentSubtle: "bg-sky-950/20",
    bgAccentVerySubtle: "bg-sky-950/5",
    bgAccentLow: "bg-sky-950/15",
    bgAccentMedium: "bg-sky-950/40",
    bgAccentSolid: "bg-sky-500",
    bgAccentSolidHover: "hover:bg-sky-400",
    gradient: "from-sky-600 to-sky-400",
    gradientHover: "hover:from-sky-500 hover:to-sky-300",
    glow: "shadow-sky-500/20",
    glowLight: "shadow-sky-500/10",
    selectionClass: "selection:bg-sky-500 selection:text-zinc-950"
  }
];

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ideas" | "script" | "universe" | "storyboard" | "player">("ideas");
  const [showConfig, setShowConfig] = useState(false);
  const [loading, setLoading] = useState<string | null>(null); // State representing loading process message
  const [error, setError] = useState<string | null>(null);
  const [tempBrief, setTempBrief] = useState("");
  const [activeThemeId, setActiveThemeId] = useState<string>(() => localStorage.getItem("kiwul_app_theme") || "amber");

  const activeTheme = COLOR_THEMES.find(t => t.id === activeThemeId) || COLOR_THEMES[0];

  const handleSelectTheme = (themeId: string) => {
    setActiveThemeId(themeId);
    localStorage.setItem("kiwul_app_theme", themeId);
  };

  const activeProject = projects.find((p) => p.project_id === selectedProjectId);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (activeProject) {
      setTempBrief(activeProject.raw_brief || "");
    } else {
      setTempBrief("");
    }
  }, [selectedProjectId, projects]);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error("Failed to load projects:", err);
      setError("Gagal memuat daftar proyek dari database server.");
    }
  };

  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id);
    setActiveTab("ideas");
    setShowConfig(false);
  };

  const handleCreateProject = async (newProjData: any) => {
    setLoading("Membuat proyek baru di server...");
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProjData)
      });
      if (!res.ok) throw new Error("Gagal menyimpan proyek baru.");
      const created = await res.json();
      setProjects(prev => [...prev, created]);
      setSelectedProjectId(created.project_id);
      setActiveTab("ideas");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus proyek konten ini?")) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProjects(prev => prev.filter(p => p.project_id !== id));
        if (selectedProjectId === id) setSelectedProjectId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetWorkspace = async () => {
    if (!confirm("PENTING: Ini akan menghapus semua proyek konten di studio lokal dan mengembalikan database ke awal. Lanjutkan?")) return;
    try {
      const res = await fetch("/api/projects/reset", { method: "POST" });
      if (res.ok) {
        setProjects([]);
        setSelectedProjectId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- WORKFLOW GENERATION TRIGGERS ---

  // Step 0: Normalize Brief (Step 1 of the pipeline)
  const handleNormalizeBrief = async () => {
    if (!selectedProjectId || !tempBrief.trim()) return;
    setLoading("Kiwul AI sedang menstrukturkan & menyiapkan brief video Anda...");
    setError(null);
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/normalize-brief`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_brief: tempBrief })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal melakukan normalisasi brief.");
      }
      await fetchProjects();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  // Step 13-14: Manual QC Evaluation & Auto-Fix Recheck
  const handleTriggerManualQC = async () => {
    if (!selectedProjectId) return;
    setLoading("AI Creative Director sedang menganalisis naskah, timing adegan, dan prompt kamera...");
    setError(null);
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/run-qc`, { method: "POST" });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal memproses evaluasi QC.");
      }
      await fetchProjects();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  // Step 1: Generate Ideas
  const handleGenerateIdeas = async () => {
    if (!selectedProjectId) return;
    setLoading("Gemini creative brain sedang meramu ide konten viral...");
    setError(null);
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/generate-ideas`, { method: "POST" });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menghasilkan ide konten.");
      }
      await fetchProjects(); // Refresh items
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  // Step 2: Choose Idea and lock it in
  const handleSelectIdeaId = async (ideaId: string) => {
    if (!selectedProjectId) return;
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/select-idea`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea_id: ideaId })
      });
      if (res.ok) {
        await fetchProjects();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Step 3: Generate Storyline
  const handleGenerateStoryline = async () => {
    if (!selectedProjectId) return;
    setLoading("Menyusun storyline, membagi opening/middle/ending serta emotional arc...");
    setError(null);
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/generate-storyline`, { method: "POST" });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menyusun storyline.");
      }
      await fetchProjects();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  // Step 4: Generate Spoken Script
  const handleGenerateScript = async () => {
    if (!selectedProjectId) return;
    setLoading("Menulis naskah kasual berdurasi presisi untuk disuarakan (TTS)...");
    setError(null);
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/generate-script`, { method: "POST" });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menulis naskah.");
      }
      await fetchProjects();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  // Step 5: Initialize Universe (Character and Location Bible)
  const handleGenerateUniverse = async () => {
    if (!selectedProjectId) return;
    setLoading("Membentuk spesifikasi aktor fisik & konsep studio latar belakang...");
    setError(null);
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/generate-characters`, { method: "POST" });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal membentuk universe proyek.");
      }
      await fetchProjects();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  // Step 6: Split Narration into complete Storyboard Parts and Scenes
  const handleGenerateStoryboard = async () => {
    if (!selectedProjectId) return;
    setLoading("Mengurai naskah dan menginstruksikan prompt per scene secara harmonis...");
    setError(null);
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/generate-storyboard`, { method: "POST" });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal mengurai storyboard.");
      }
      await fetchProjects();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  // Step 7: Update scene data when cells are edited
  const handleUpdateScene = async (sceneId: string, updatedFields: Partial<Scene>) => {
    if (!activeProject || !activeProject.storyboard) return;
    
    // Perform local client update first for extreme latency speed
    const updatedStoryboard = { ...activeProject.storyboard };
    updatedStoryboard.parts.forEach((part) => {
      part.scenes = part.scenes.map((scene) => {
        if (scene.scene_id === sceneId) {
          return { ...scene, ...updatedFields };
        }
        return scene;
      });
    });

    setProjects(prev => prev.map(p => {
      if (p.project_id === selectedProjectId) {
        return { ...p, storyboard: updatedStoryboard };
      }
      return p;
    }));

    // Send save to server
    try {
      await fetch(`/api/projects/${selectedProjectId}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyboard: updatedStoryboard })
      });
    } catch (err) {
      console.error("Failed to commit scene update to server:", err);
    }
  };

  // Step 8: Regenerate specific image per scene
  const handleRegenerateSceneImage = async (sceneId: string, customPrompt?: string) => {
    if (!selectedProjectId) return;
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/scenes/${sceneId}/image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ custom_prompt: customPrompt })
      });
      if (res.ok) {
        const data = await res.json();
        // Update local path state
        handleUpdateScene(sceneId, { image_path: data.image_path, status: "completed" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Step 9: Re-generate specific voice/narration per scene
  const handleRegenerateSceneVoice = async (sceneId: string, customVO?: string) => {
    if (!selectedProjectId) return;
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/scenes/${sceneId}/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ custom_vo: customVO })
      });
      if (res.ok) {
        const data = await res.json();
        handleUpdateScene(sceneId, { vo: data.vo, audio_path: data.audio_path });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Step 10: General Project Field updating (save bible profiles, settings)
  const handleUpdateProjectField = async (fields: Partial<Project>) => {
    if (!selectedProjectId) return;
    
    // Update local state fast
    setProjects(prev => prev.map(p => {
      if (p.project_id === selectedProjectId) {
        return { ...p, ...fields };
      }
      return p;
    }));

    try {
      await fetch(`/api/projects/${selectedProjectId}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields)
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div data-theme={activeThemeId} className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans select-none antialiased selection:bg-accent selection:text-zinc-950">
      
      {/* 1. Header Navigation Bar */}
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {selectedProjectId && (
            <button 
              onClick={() => setSelectedProjectId(null)}
              className="p-1 px-1.5 hover:bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-400 hover:text-white transition cursor-pointer font-medium"
              title="Kembali ke Daftar Proyek"
              id="header-back-btn"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${activeTheme.gradient} flex items-center justify-center font-black text-zinc-950 text-sm shadow-lg ${activeTheme.glow}`}>
              K
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                Kiwul Content Studio
                <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-zinc-900 text-accent border border-zinc-800 rounded font-mono">v1.2</span>
              </h1>
              <p className="text-[10px] text-zinc-500">Local & Cloud Vertical Content Factory (Sophisticated Dark)</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 justify-between w-full sm:w-auto sm:justify-end">
          {/* Pilihan Style Warna App */}
          <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-1.5">
            <span className="text-[9px] text-zinc-500 font-bold px-1 font-mono uppercase tracking-wider">Style Warna:</span>
            <div className="flex items-center gap-1.5">
              {COLOR_THEMES.map((t) => {
                const ringColor = {
                  amber: "focus-visible:ring-amber-500",
                  emerald: "focus-visible:ring-emerald-500",
                  violet: "focus-visible:ring-violet-500",
                  rose: "focus-visible:ring-rose-500",
                  sky: "focus-visible:ring-sky-500",
                }[t.id] || "focus-visible:ring-amber-500";
                const dotColor = {
                  amber: "bg-amber-500 border-amber-400",
                  emerald: "bg-emerald-500 border-emerald-400",
                  violet: "bg-violet-500 border-violet-400",
                  rose: "bg-rose-500 border-rose-400",
                  sky: "bg-sky-500 border-sky-400",
                }[t.id];
                const isSel = t.id === activeThemeId;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTheme(t.id)}
                    className={`w-3.5 h-3.5 rounded-full border transition cursor-pointer relative ${dotColor} ${isSel ? 'ring-2 ring-white/90 scale-125' : 'opacity-40 hover:opacity-100 hover:scale-110'} ${ringColor}`}
                    title={t.name}
                    id={`btn-color-theme-${t.id}`}
                  />
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${showConfig ? 'bg-accent/10 border-accent/40 text-accent' : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-400'}`}
            id="header-config-toggle"
          >
            <Settings size={14} className={showConfig ? "animate-spin text-accent-light" : ""} />
            AI Engines
          </button>
        </div>
      </header>

      {/* 2. Error Panel alerts */}
      {error && (
        <div className="mx-6 mt-4 bg-rose-950/30 border border-rose-900/50 p-3.5 rounded-xl text-xs text-rose-400 flex gap-2.5 items-center animate-in fade-in slide-in-from-top-2 duration-200">
          <Info size={16} className="shrink-0" />
          <div className="flex-1 font-medium">{error}</div>
          <button onClick={() => setError(null)} className="text-[10px] bg-rose-900/30 px-2 py-0.5 rounded text-rose-300">Sembunyikan</button>
        </div>
      )}

      {/* 3. Infinite Full-Screen Loading Mask */}
      {loading && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-center p-4 animate-in fade-in duration-200">
          <Loader2 size={40} className="text-amber-500 animate-spin mb-4" />
          <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">{loading}</h4>
          <p className="text-[10px] text-zinc-500 mt-1 max-w-xs leading-relaxed">System sedang memproses API dan meramu aset. Mohon tunggu sejenak, ini tidak akan memakan waktu lama!</p>
        </div>
      )}

      {/* 4. Active Workspace Body */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        
        {/* If Settings menu is toggle on */}
        {showConfig ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase text-zinc-500 tracking-wider">Workspace Environment Settings</h2>
              <button 
                onClick={() => setShowConfig(false)}
                className="text-xs text-amber-400 hover:underline font-semibold cursor-pointer"
              >
                Kembali ke Workspace
              </button>
            </div>
            <ProviderSettings onSave={() => setShowConfig(false)} />
          </div>
        ) : !selectedProjectId ? (
          
          /* Proyek list selection view */
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-black uppercase text-zinc-500 tracking-wider">Daftar Proyek Aktif</h2>
            </div>
            <ProjectList 
              projects={projects}
              onSelectProject={handleSelectProject}
              onCreateProject={handleCreateProject}
              onDeleteProject={handleDeleteProject}
              onResetProjects={handleResetWorkspace}
            />
          </div>
        ) : (
          
          /* Single Project Workflow dashboard */
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Active Project brief details header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#141417]/70 border border-zinc-800/80 p-5 rounded-xl">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2 py-0.5 bg-amber-950/20 text-amber-400 text-[10px] font-bold border border-amber-900/30 rounded font-mono uppercase">
                     {activeProject?.aspect_ratio}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">• {activeProject?.resolution}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">• {activeProject?.content_type.replace("_", " ").toUpperCase()}</span>
                </div>
                <h2 className="text-sm font-bold text-white tracking-tight">{activeProject?.title}</h2>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setSelectedProjectId(null)}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 text-xs font-semibold rounded-lg border border-zinc-805 transition cursor-pointer"
                  id="btn-back-to-projs"
                >
                  Tukar Proyek
                </button>
              </div>
            </div>

            {/* Stepped Workspace Tabs */}
            <div className="flex border-b border-zinc-800 text-xs font-semibold tracking-tight overflow-x-auto scrollbar-none">
              <button 
                onClick={() => setActiveTab("ideas")}
                className={`py-3 px-5 border-b-2 hover:text-white transition flex items-center gap-1.5 cursor-pointer shrink-0 ${activeTab === "ideas" ? 'border-accent text-white bg-accent-very-subtle' : 'border-transparent text-zinc-500'}`}
                id="tab-btn-ideas"
              >
                <Lightbulb size={14} className={activeTab === "ideas" ? "text-accent" : ""} />
                1-2. Ide & Storyline
              </button>
              <button 
                onClick={() => setActiveTab("script")}
                className={`py-3 px-5 border-b-2 hover:text-white transition flex items-center gap-1.5 cursor-pointer shrink-0 ${activeTab === "script" ? 'border-accent text-white bg-accent-very-subtle' : 'border-transparent text-zinc-500'}`}
                id="tab-btn-script"
              >
                <FileText size={14} className={activeTab === "script" ? "text-accent" : ""} />
                3. Naskah/Script
              </button>
              <button 
                onClick={() => setActiveTab("universe")}
                className={`py-3 px-5 border-b-2 hover:text-white transition flex items-center gap-1.5 cursor-pointer shrink-0 ${activeTab === "universe" ? 'border-accent text-white bg-accent-very-subtle' : 'border-transparent text-zinc-500'}`}
                id="tab-btn-universe"
              >
                <UserSquare size={14} className={activeTab === "universe" ? "text-accent" : ""} />
                4. Universe Bible
              </button>
              <button 
                onClick={() => setActiveTab("storyboard")}
                className={`py-3 px-5 border-b-2 hover:text-white transition flex items-center gap-1.5 cursor-pointer shrink-0 ${activeTab === "storyboard" ? 'border-accent text-white bg-accent-very-subtle' : 'border-transparent text-zinc-500'}`}
                id="tab-btn-storyboard"
              >
                <TableProperties size={14} className={activeTab === "storyboard" ? "text-accent" : ""} />
                5. Storyboard Table
              </button>
              <button 
                onClick={() => setActiveTab("player")}
                className={`py-3 px-5 border-b-2 hover:text-white transition flex items-center gap-1.5 cursor-pointer shrink-0 ${activeTab === "player" ? 'border-accent text-white bg-accent-very-subtle' : 'border-transparent text-zinc-500'}`}
                id="tab-btn-player"
              >
                <Play size={14} className={activeTab === "player" ? "text-accent" : ""} />
                6. 9:16 Preview Player
              </button>
            </div>

            {/* TAB CONTENTS */}
            <div className="space-y-6">
              
              {/* === TAB 1: IDEATION === */}
              {activeTab === "ideas" && activeProject && (
                <div className="space-y-6">
                  {/* === STEP 1: BRIEF NORMALIZER === */}
                  <div className="bg-zinc-900/40 p-6 border border-zinc-800 rounded-xl space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-black uppercase text-amber-400">Tahap 1: AI Project Brief Normalizer</h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Tulis intisari kasar ide video Anda dalam bahasa bebas. Kiwul AI Creative Director akan merapikan parameter target, niche, audiens, dan referensi visual secara otomatis!</p>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-3 pt-2">
                       <textarea 
                         className="flex-1 min-h-[64px] bg-zinc-950 border border-zinc-800 focus:border-amber-550 rounded-lg text-xs text-zinc-250 p-3 focus:outline-none transition leading-normal font-sans"
                         placeholder="Contoh: Bikin video reels tiktok resep seblak bandung super pedas buat anak muda kosan. Suasana ceria asik di dapur bersih kosan..."
                         value={tempBrief}
                         onChange={(e) => setTempBrief(e.target.value)}
                         id="brief-normalizer-textarea"
                       />
                       <button
                         onClick={handleNormalizeBrief}
                         disabled={!tempBrief.trim()}
                         className="px-5 py-3 bg-gradient-to-tr from-amber-600 to-amber-400 hover:from-amber-500 hover:to-amber-300 text-zinc-950 text-xs font-black rounded-lg transition shrink-0 h-fit cursor-pointer disabled:opacity-40"
                         id="btn-trigger-normalize-brief"
                       >
                         Normalisasikan Brief
                       </button>
                    </div>
                    {activeProject.raw_brief && (
                      <div className="text-[10px] text-amber-500/80 bg-amber-950/5 border border-amber-900/10 p-2.5 rounded-lg leading-relaxed">
                        <strong className="font-bold">Brief Terakhir Terproses:</strong> "{activeProject.raw_brief}"
                      </div>
                    )}
                  </div>

                  <div className="bg-zinc-900/40 p-6 border border-zinc-800 rounded-xl space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-black uppercase text-zinc-400">Tahap 2: Pembentukan Alternatif Ide</h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Letakkan parameter target audience, niche, dan biarkan Gemini creative brain merekomendasikan konsep hook yang catchy!</p>
                      </div>
                      <button 
                        onClick={handleGenerateIdeas}
                        className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-lg shadow shadow-amber-500/10 transition cursor-pointer"
                        id="btn-trigger-ideas"
                      >
                        <Sparkles size={13} />
                        Hasilkan Konsep Ide
                      </button>
                    </div>

                    {/* Ideas items readout */}
                    {activeProject.ideas && activeProject.ideas.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                        {activeProject.ideas.map((idea) => {
                          const isSelected = activeProject.selected_idea_id === idea.id;
                          return (
                            <div 
                              key={idea.id}
                              onClick={() => handleSelectIdeaId(idea.id)}
                              className={`cursor-pointer p-4 rounded-xl border transition ${isSelected ? 'bg-amber-950/15 border-amber-550/80 shadow-md shadow-amber-550/10' : 'bg-zinc-950 hover:bg-zinc-900/60 border-zinc-800/80'}`}
                              id={`idea-choice-${idea.id}`}
                            >
                              <div className="flex justify-between items-start mb-2.5 font-semibold">
                                <span className="text-[10px] font-mono text-zinc-500 uppercase">{idea.content_type.replace("_", " ")}</span>
                                {isSelected && <span className="px-1.5 py-0.2 bg-amber-500 text-zinc-950 rounded text-[9px] font-bold">Terpilih</span>}
                              </div>
                              <h5 className="text-xs font-bold text-zinc-200 group-hover:text-white leading-normal mb-1">{idea.title}</h5>
                              <p className="text-[11px] text-zinc-450 leading-relaxed mb-3">"{idea.hook}"</p>
                              <div className="text-[10px] text-zinc-500 pt-2 border-t border-zinc-900 italic">Angle: {idea.angle}</div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-10 text-center border border-zinc-800 border-dashed rounded-xl bg-zinc-950/20 text-zinc-500 text-xs">
                        Belum ada ide yang digenerate. Klik "Hasilkan Konsep Ide" untuk memulai.
                      </div>
                    )}
                  </div>

                  {/* Stage 2: Storyline outline planning */}
                  {activeProject.selected_idea_id && (
                    <div className="bg-zinc-900/40 p-6 border border-zinc-800 rounded-xl space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-black uppercase text-zinc-400">Tahap 2: Matriks Alur Plot (Storyline)</h4>
                          <p className="text-[10px] text-zinc-500 mt-0.5">Uraikan konsep ide terpilih menjadi rentetan arc drama, opening, middle, climax, dan visual sequence</p>
                        </div>
                        <button 
                          onClick={handleGenerateStoryline}
                          className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-lg shadow shadow-amber-500/10 transition cursor-pointer font-sans"
                          id="btn-trigger-storyline"
                        >
                          <Sparkles size={13} />
                          Formulasikan Storyline
                        </button>
                      </div>

                      {activeProject.storyline ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 text-xs">
                           <div className="space-y-4">
                            <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-850">
                              <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Hook Opening</span>
                              <p className="text-zinc-350 leading-relaxed font-semibold">"{activeProject.storyline.hook}"</p>
                            </div>
                            <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-850">
                              <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Intrik Tengah (Middle)</span>
                              <p className="text-zinc-350 leading-relaxed">{activeProject.storyline.middle}</p>
                            </div>
                            <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-850">
                              <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Ending & CTA</span>
                              <p className="text-zinc-350 leading-relaxed font-medium text-amber-400">{activeProject.storyline.ending} — {activeProject.storyline.cta}</p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-850">
                              <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1.5">Misi & Pertanyaan Inti (Core Curiosity)</span>
                              <p className="text-zinc-300 font-medium">{activeProject.storyline.core_question}</p>
                            </div>
                            <div className="bg-amber-950/15 p-3.5 rounded-lg border border-amber-900/30">
                              <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1.5">Awan Visual & Alur Emosi (Arcs)</span>
                              <div className="space-y-1 text-zinc-400">
                                <p><span className="text-amber-300 font-semibold">Visual Path:</span> {activeProject.storyline.visual_arc}</p>
                                <p><span className="text-amber-300 font-semibold">Emotional Path:</span> {activeProject.storyline.emotional_arc}</p>
                              </div>
                            </div>
                            <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-850">
                              <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Sifat & Gaya Drama (Story Angle)</span>
                              <p className="text-zinc-350 leading-relaxed">{activeProject.storyline.story_angle}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="py-10 text-center border border-zinc-800 border-dashed rounded-xl bg-zinc-950/20 text-zinc-500 text-xs">
                          Uraian storyline belum direncanakan. Klik "Formulasikan Storyline" untuk menyusun alur plot.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Flow control next */}
                  <div className="flex justify-end pt-3">
                    <button 
                      disabled={!activeProject.storyline}
                      onClick={() => setActiveTab("script")}
                      className="px-6 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-250 font-bold hover:bg-zinc-800 rounded-xl text-xs flex items-center gap-1.5 hover:text-white transition disabled:opacity-40"
                    >
                      Menuju Langkah Tulis Naskah
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* === TAB 2: SCRIPT === */}
              {activeTab === "script" && activeProject && (
                <div className="space-y-6">
                  <div className="bg-zinc-900/40 p-6 border border-zinc-800 rounded-xl space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-black uppercase text-zinc-400">Tahap 3: Penyuntingan Naskah Spoken script</h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Tulis naskah kasual untuk voiceover. Anda bisa menulis manual atau meminta AI Gemini menyusunnya.</p>
                      </div>
                      <button 
                        onClick={handleGenerateScript}
                        className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-lg shadow shadow-amber-500/10 transition cursor-pointer"
                        id="btn-trigger-script"
                      >
                        <Sparkles size={13} />
                        Hasilkan Naskah Baru
                      </button>
                    </div>

                    {activeProject.script ? (
                      <div className="space-y-4 pt-2">
                        {/* Interactive Script Block Display */}
                        <div className="relative bg-zinc-950 p-5 rounded-xl border border-zinc-850">
                          <label className="text-[10px] uppercase font-bold text-zinc-650 block mb-2 font-mono">Continuous Spoken Script (Editan):</label>
                          <textarea 
                            value={activeProject.script.full_text}
                            onChange={(e) => {
                              const updatedScript = { ...activeProject.script!, full_text: e.target.value };
                              handleUpdateProjectField({ script: updatedScript });
                            }}
                            className="w-full h-36 bg-zinc-950 border border-transparent focus:border-amber-500 rounded text-sm text-zinc-200 leading-relaxed font-serif p-2 resize-none focus:outline-none"
                            placeholder="Tulis naskah narasi di sini..."
                            id="script-editor-textarea"
                          />
                          <div className="absolute bottom-3 right-4 text-[10px] text-zinc-650 font-mono">
                            Jumlah kata: {activeProject.script.full_text.split(/\s+/).filter(Boolean).length} kata
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          <div className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-850/80">
                            <span className="text-[10px] text-zinc-500 font-bold block mb-0.5 uppercase">Target Durasi</span>
                            <p className="text-zinc-300 font-mono text-[11px] font-bold">{activeProject.script.estimated_duration} Detik</p>
                          </div>
                          <div className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-850/80">
                            <span className="text-[10px] text-zinc-500 font-bold block mb-0.5 uppercase">Aksen & Nada Bicara</span>
                            <p className="text-zinc-300 font-mono text-[11px] font-bold capitalize">{activeProject.script.tone}</p>
                          </div>
                          <div className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-850/80">
                            <span className="text-[10px] text-zinc-500 font-bold block mb-0.5 uppercase">Bahasa</span>
                            <p className="text-zinc-300 font-mono text-[11px] font-bold uppercase">{activeProject.script.language}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-10 text-center border border-zinc-800 border-dashed rounded-xl bg-zinc-950/20 text-zinc-500 text-xs">
                        Naskah kosong. Klik "Hasilkan Naskah Baru" untuk menulis naskah yang mengalir alami.
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-3">
                    <button 
                      disabled={!activeProject.script}
                      onClick={() => setActiveTab("universe")}
                      className="px-6 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-250 font-bold hover:bg-zinc-805 rounded-xl text-xs flex items-center gap-1.5 hover:text-white transition disabled:opacity-40 cursor-pointer"
                    >
                      Menuju Langkah Universe Bible
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* === TAB 3: UNIVERSE BIBLE === */}
              {activeTab === "universe" && activeProject && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-zinc-900/20 p-4 border border-zinc-800/80 rounded-xl">
                      <div>
                        <h4 className="text-xs font-black uppercase text-zinc-400">Tahap 4: Universe Bible (Aktor & Studio)</h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Konstruksikan karakter pemeran utama (Character Bible) dan latar belakang tempat agar konsistensi grafis di setiap scene terjaga!</p>
                      </div>
                      <button 
                        onClick={handleGenerateUniverse}
                        className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-lg shadow shadow-amber-500/10 transition cursor-pointer"
                        id="btn-trigger-universe"
                      >
                        <Sparkles size={13} />
                        Lahirkan Universe Baru
                      </button>
                    </div>

                    {/* Character component view */}
                    <CharacterView 
                      charBible={activeProject.character}
                      onUpdate={(fields) => {
                        const updatedChar = { ...activeProject.character!, ...fields } as CharacterBible;
                        handleUpdateProjectField({ character: updatedChar });
                      }}
                      onGenerateReference={async () => {
                        if (!activeProject.character) return;
                        // Force change ref path as mock fallback
                        const fallbackRef = getUnsplashFallback(activeProject.character.name || "host", "1:1");
                        const updatedChar = { ...activeProject.character, reference_image_path: fallbackRef };
                        await handleUpdateProjectField({ character: updatedChar });
                      }}
                    />

                    {/* Location component view */}
                    <LocationView 
                      locBible={activeProject.location}
                      onUpdate={(fields) => {
                        const updatedLoc = { ...activeProject.location!, ...fields } as LocationBible;
                        handleUpdateProjectField({ location: updatedLoc });
                      }}
                      onGenerateReference={async () => {
                        if (!activeProject.location) return;
                        const fallbackRef = getUnsplashFallback("kitchen", "1:1");
                        const updatedLoc = { ...activeProject.location, reference_image_path: fallbackRef };
                        await handleUpdateProjectField({ location: updatedLoc });
                      }}
                    />
                  </div>

                  <div className="flex justify-end pt-3">
                    <button 
                      disabled={!activeProject.character || !activeProject.location}
                      onClick={() => setActiveTab("storyboard")}
                      className="px-6 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-250 font-bold hover:bg-zinc-805 rounded-xl text-xs flex items-center gap-1.5 hover:text-white transition disabled:opacity-40 cursor-pointer"
                    >
                      Menuju Langkah Penguraian Storyboard
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* === TAB 4: STORYBOARD TABLE === */}
              {activeTab === "storyboard" && activeProject && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-zinc-900/20 p-4 border border-zinc-800/80 rounded-xl">
                      <div>
                        <h4 className="text-xs font-black uppercase text-zinc-400">Tahap 5: Penguraian Storyboard Matriks</h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Potong naskah menjadi bagian kecil berdurasi 3-5 detik per scene. Terapkan visual deskripsi dan edit langsung di dalam tabel!</p>
                      </div>
                      <button 
                        onClick={handleGenerateStoryboard}
                        className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-lg shadow shadow-amber-500/10 transition cursor-pointer"
                        id="btn-trigger-storyboard"
                      >
                        <Sparkles size={13} />
                        Urai Menjadi Storyboard
                      </button>
                    </div>

                    {/* === STEP 13-14: AI CREATIVE DIRECTOR QC CHECKLIST & AUTO-FIX LOGS === */}
                    {activeProject.storyboard && activeProject.qc_report && (
                      <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-5 space-y-4 animate-in fade-in duration-200">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-zinc-900">
                          <div>
                            <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                              <CheckCircle size={14} className="text-amber-500" />
                              AI Creative Director QC Report & Auto-Fix Log
                            </h4>
                            <p className="text-[10px] text-zinc-550 mt-0.5">
                              Verifikasi otomatis asangan, hook video, spelling voiceover (TTS), dan stabilitas gerak kamera.
                            </p>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <div className="text-right">
                              <span className="text-[9px] uppercase text-zinc-500 block font-mono">Skor Kelayakan</span>
                              <span className={`text-lg font-black font-mono leading-none ${activeProject.qc_report.qc_score >= 85 ? 'text-green-400' : 'text-amber-400'}`}>
                                {activeProject.qc_report.qc_score}/100
                              </span>
                            </div>
                            <button
                              onClick={handleTriggerManualQC}
                              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold rounded-lg border border-zinc-800 transition cursor-pointer"
                              id="btn-re-evaluate-qc"
                            >
                              Evaluasi Ulang & Perbaiki
                            </button>
                          </div>
                        </div>

                        {activeProject.qc_report.feedback_general && (
                          <div className="text-xs bg-zinc-950 p-3 rounded-lg border border-zinc-900 italic text-zinc-400 leading-relaxed">
                            "{activeProject.qc_report.feedback_general}"
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          {/* Checklist */}
                          <div className="space-y-2 bg-zinc-950/50 p-4 border border-zinc-900 rounded-lg">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase font-mono tracking-wider block">Hasil Pemeriksaan Standar</span>
                            <div className="space-y-1.5 mt-2">
                              {activeProject.qc_report.checklist?.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-start gap-3 bg-zinc-950 p-2 rounded border border-zinc-900/50">
                                  <div className="space-y-0.5">
                                    <span className="text-[11px] text-zinc-300 font-semibold">{item.criteria}</span>
                                    <span className="text-[9px] text-zinc-500 block leading-tight">{item.notes}</span>
                                  </div>
                                  <span className={`px-1.5 py-0.2 rounded text-[8px] font-mono font-bold shrink-0 ${item.passed ? 'bg-green-950/50 text-green-400 border border-green-900/40' : 'bg-red-950/50 text-red-400 border border-red-900/40'}`}>
                                    {item.passed ? 'LULUS' : 'GAGAL'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Fix logs */}
                          <div className="space-y-2 bg-zinc-950/50 p-4 border border-zinc-900 rounded-lg">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase font-mono tracking-wider block">Log Auto-Fix AI Director</span>
                            <div className="space-y-1.5 mt-2 overflow-y-auto max-h-[180px] pr-1">
                              {activeProject.qc_report.auto_fixed_logs && activeProject.qc_report.auto_fixed_logs.length > 0 ? (
                                activeProject.qc_report.auto_fixed_logs.map((logStr, idx) => (
                                  <div key={idx} className="bg-amber-950/10 p-2 rounded border border-amber-900/10 text-[10px] text-amber-300/85 leading-relaxed flex gap-2">
                                    <span className="text-amber-500 font-bold font-mono">✓</span>
                                    <span>{logStr}</span>
                                  </div>
                                ))
                              ) : (
                                <div className="text-[10px] text-zinc-500 font-mono italic p-2 text-center">
                                  Tidak ada perbaikan yang perlu diterapkan. Storyboard prima.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <StoryboardView 
                      storyboard={activeProject.storyboard}
                      onUpdateScene={handleUpdateScene}
                      onRegenerateImage={handleRegenerateSceneImage}
                      onRegenerateVoice={handleRegenerateSceneVoice}
                      onPreviewScene={(scene) => {
                        setActiveTab("player");
                      }}
                    />
                  </div>

                  <div className="flex justify-end pt-3">
                    <button 
                      disabled={!activeProject.storyboard}
                      onClick={() => setActiveTab("player")}
                      className="px-6 py-2.5 bg-amber-500 border border-amber-400 text-zinc-950 font-bold hover:bg-amber-450 hover:text-zinc-950 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition disabled:opacity-40 cursor-pointer"
                    >
                      Masuk ke Layout Video Player
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* === TAB 5: PREVIEW PLAYER === */}
              {activeTab === "player" && activeProject && (
                <div className="space-y-6">
                  <PreviewPlayer project={activeProject} />
                </div>
              )}

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
