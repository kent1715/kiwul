import React, { useState } from "react";
import { Project, ProjectStatus } from "../types";
import { 
  FolderPlus, 
  Trash2, 
  Video, 
  Clock, 
  Layout, 
  ChevronRight, 
  Sparkles,
  RefreshCw,
  FolderOpen
} from "lucide-react";

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
  onCreateProject: (data: any) => void;
  onDeleteProject: (id: string) => void;
  onResetProjects: () => void;
}

export default function ProjectList({
  projects,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onResetProjects
}: ProjectListProps) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content_type: "tutorial_cooking",
    language: "id",
    duration_seconds: 30,
    aspect_ratio: "9:16",
    resolution: "1080x1920",
    visual_style: "realistic cinematic vertical",
    niche: "",
    topic: "",
    audience: "",
    tone: "ceria, hangat, cepat"
  });

  const getStatusBadge = (status: ProjectStatus) => {
    const maps: Record<ProjectStatus, { text: string; css: string }> = {
      draft: { text: "Draft", css: "bg-zinc-800 text-zinc-400 border-zinc-700" },
      ideas_generated: { text: "Ideas Ready", css: "bg-blue-950/40 text-blue-400 border-blue-900/50" },
      storyline_ready: { text: "Storyline Ready", css: "bg-amber-950/40 text-amber-400 border-amber-900/40" },
      script_ready: { text: "Script Ready", css: "bg-pink-950/40 text-pink-400 border-pink-900/50" },
      storyboard_ready: { text: "Storyboard OK", css: "bg-amber-950/40 text-amber-400 border-amber-900/50" },
      character_ready: { text: "Character OK", css: "bg-teal-950/40 text-teal-400 border-teal-900/50" },
      images_ready: { text: "Images OK", css: "bg-purple-950/40 text-purple-400 border-purple-900/50" },
      videos_ready: { text: "Videos OK", css: "bg-emerald-950/40 text-emerald-400 border-emerald-900/50" },
      audio_ready: { text: "Voice Ready", css: "bg-sky-950/40 text-sky-400 border-sky-900/50" },
      rendered: { text: "Rendered (Shorts)", css: "bg-green-950/40 text-green-400 border-green-900/50" },
      failed: { text: "Failed Stage", css: "bg-rose-950/40 text-rose-400 border-rose-900/50" }
    };
    const badge = maps[status] || { text: status, css: "bg-zinc-800 text-zinc-400 border-zinc-700" };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${badge.css}`}>
        {badge.text}
      </span>
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    
    // Auto fill niche and topic if empty based on title
    const formattedData = {
      ...formData,
      config: {
        niche: formData.niche || "Short Tutorial",
        topic: formData.topic || formData.title,
        audience: formData.audience || "Umum",
        tone: formData.tone || "Ceria, Menarik"
      }
    };
    
    onCreateProject(formattedData);
    setShowModal(false);
    // Reset defaults
    setFormData({
      title: "",
      content_type: "tutorial_cooking",
      language: "id",
      duration_seconds: 30,
      aspect_ratio: "9:16",
      resolution: "1080x1920",
      visual_style: "realistic cinematic vertical",
      niche: "",
      topic: "",
      audience: "",
      tone: "ceria, hangat, cepat"
    });
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in duration-300">
        <div className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/80 p-4 rounded-xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-amber-950/60 text-amber-400 rounded-lg border border-amber-900/30">
            <FolderOpen size={20} />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono">{projects.length}</div>
            <div className="text-xs text-zinc-500">Total Proyek Konten</div>
          </div>
        </div>
        
        <div className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-green-950 text-green-400 rounded-lg">
            <Video size={20} />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono">
              {projects.filter(p => p.status === "rendered").length}
            </div>
            <div className="text-xs text-zinc-500">Ready To Upload (9:16)</div>
          </div>
        </div>

        <div className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-amber-950 text-amber-400 rounded-lg">
            <Clock size={20} />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono">
              {projects.reduce((acc, p) => acc + (p.duration_seconds || 0), 0)}s
            </div>
            <div className="text-xs text-zinc-500">Akumulasi Durasi</div>
          </div>
        </div>

        <div className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 p-4 rounded-xl flex gap-3 justify-between items-center">
          <div>
            <button 
              onClick={onResetProjects}
              className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg border border-zinc-700 transition"
              id="btn-reset-workspace"
            >
              <RefreshCw size={13} />
              Reset Proyek
            </button>
            <div className="text-[10px] text-zinc-500 mt-1 pl-1">Mengosongkan workspace</div>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-lg shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transition duration-150 cursor-pointer"
            id="btn-create-project-trigger"
          >
            <FolderPlus size={15} />
            Buat Studio Baru
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900/30 border border-zinc-800 border-dashed rounded-2xl">
          <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-500">
            <Video size={28} />
          </div>
          <h3 className="text-base font-semibold text-zinc-300 mb-1">Mulai Kiwul Content Studio</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-6">
            Proyek konten masih kosong. Klik tombol di bawah untuk membuat ide konten, menulis naskah, merancang storyboard, serta render video kreatif Anda!
          </p>
          <button 
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-lg shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transition cursor-pointer"
            id="btn-empty-create"
          >
            <FolderPlus size={14} />
            Buat Proyek Studio Pertama Anda
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div 
              key={project.project_id}
              className="group relative bg-[#18181b]/80 border border-zinc-800 rounded-xl hover:border-zinc-700 transition duration-150 overflow-hidden flex flex-col justify-between"
              id={`project-card-${project.project_id}`}
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  {getStatusBadge(project.status)}
                  <div className="text-[11px] font-mono text-zinc-500 flex items-center gap-1">
                    <Clock size={11} /> {project.duration_seconds}s
                  </div>
                </div>

                <h3 className="text-sm font-bold text-zinc-200 group-hover:text-amber-450 transition mb-2 line-clamp-1">
                  {project.title}
                </h3>
                
                {project.config && (
                  <div className="space-y-1 mb-4 text-xs text-zinc-400 bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-900">
                    <div className="flex justify-between"><span className="text-zinc-600 font-medium">Niche:</span> <span className="text-zinc-300 font-mono text-[11px] truncate w-2/3 text-right">{project.config.niche}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-600 font-medium">Topik:</span> <span className="text-zinc-300 font-mono text-[11px] truncate w-2/3 text-right">{project.config.topic}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-600 font-medium">Tone:</span> <span className="text-zinc-300 font-mono text-[11px] truncate w-2/3 text-right">{project.config.tone}</span></div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                  <span className="font-semibold px-1 rounded bg-zinc-800 text-zinc-400">{project.aspect_ratio}</span>
                  <span>•</span>
                  <span>{project.resolution}</span>
                  <span>•</span>
                  <span className="capitalize">{project.content_type.replace("_", " ")}</span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="px-5 py-3.5 bg-zinc-900/40 border-t border-zinc-800/80 flex justify-between items-center gap-2">
                <button
                  onClick={() => onDeleteProject(project.project_id)}
                  className="p-1.5 hover:bg-zinc-800 hover:text-rose-500 text-zinc-500 rounded-lg transition"
                  title="Hapus Proyek"
                  id={`btn-delete-${project.project_id}`}
                >
                  <Trash2 size={14} />
                </button>
                
                <button
                  onClick={() => onSelectProject(project.project_id)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-800 hover:bg-amber-500 text-zinc-200 hover:text-zinc-950 text-xs font-bold rounded-lg border border-zinc-700/60 hover:border-amber-400 transition cursor-pointer"
                  id={`btn-open-${project.project_id}`}
                >
                  Masuk Studio
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="p-6 border-b border-zinc-800 bg-zinc-900/40 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-950/60 border border-amber-900/30 text-amber-400 rounded-lg">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-200">Buat Proyek Studio Baru</h3>
                  <p className="text-[10px] text-zinc-400">Siapkan konfigurasi konten interaktif Anda</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs font-medium px-2 py-1 hover:bg-zinc-850 rounded"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Judul Proyek *</label>
                  <input 
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Contoh: Hacks Masak Indomie Rasa Rendang"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/35 font-medium"
                    id="input-title"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Niche Konten</label>
                  <input 
                    type="text"
                    value={formData.niche}
                    onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                    placeholder="Contoh: Kuliner / Memasak"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/35"
                    id="input-niche"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Topik Konten</label>
                  <input 
                    type="text"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    placeholder="Contoh: Indomie Goreng Rendang"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/35"
                    id="input-topic"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Target Penonton (Audience)</label>
                  <input 
                    type="text"
                    value={formData.audience}
                    onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                    placeholder="Contoh: Anak kos dan Remaja"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/35"
                    id="input-audience"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Nada Bicara (Tone)</label>
                  <input 
                    type="text"
                    value={formData.tone}
                    onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                    placeholder="Contoh: Ceria, Cepat, Mengugah Selera"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/35"
                    id="input-tone"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Jenis Konten (Format)</label>
                  <select 
                    value={formData.content_type}
                    onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/35 font-medium"
                    id="select-content-type"
                  >
                    <option value="tutorial_cooking">Edu Cooking Tutorial (Memasak)</option>
                    <option value="micro_drama">Micro Drama Series</option>
                    <option value="science_fact">Fakta Sains & Edukasi</option>
                    <option value="horror_short">Horor Pendek Paranormal</option>
                    <option value="motivation">Motivasi & Pengembangan Diri</option>
                    <option value="product_review">Cinematic Product Review</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Target Durasi Konten</label>
                  <select 
                    value={formData.duration_seconds}
                    onChange={(e) => setFormData({ ...formData, duration_seconds: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/35 font-medium font-mono"
                    id="select-duration"
                  >
                    <option value="30">30 Detik (Ideal/Rekomendasi)</option>
                    <option value="40">40 Detik</option>
                    <option value="50">50 Detik</option>
                    <option value="60">60 Detik</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Rasio Aspek (Default)</label>
                  <select 
                    value={formData.aspect_ratio}
                    onChange={(e) => setFormData({ ...formData, aspect_ratio: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/35 font-medium"
                    id="select-aspect-ratio"
                  >
                    <option value="9:16">Vertikal 9:16 (TikTok, Reels, Shorts)</option>
                    <option value="16:9">Lanskap 16:9 (Desktop/Youtube)</option>
                    <option value="1:1">Kotak 1:1 (Instagram Feed)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Gaya Visual (Style)</label>
                  <select 
                    value={formData.visual_style}
                    onChange={(e) => setFormData({ ...formData, visual_style: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/35 font-medium"
                    id="select-visual-style"
                  >
                    <option value="realistic cinematic vertical">Realistic Cinematic Vertical</option>
                    <option value="warm high contrast dslr">Warm High Contrast DSLR</option>
                    <option value="anime lifestyle art">Anime Shinkai Lifestyle Art</option>
                    <option value="dark atmospheric cinematic">Dark Atmospheric Horror Cinematic</option>
                    <option value="bright glowing minimalist">Bright Glowing Minimalist</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-2.5">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-300 text-xs font-medium rounded-lg transition"
                  id="btn-cancel"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-lg shadow-lg shadow-amber-500/10 transition cursor-pointer"
                  id="btn-submit"
                >
                  Buat Proyek
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
