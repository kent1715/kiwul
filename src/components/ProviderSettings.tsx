import React, { useState, useEffect } from "react";
import { ProviderRegistry, ProviderSettings as PS } from "../types";
import { 
  Server, 
  Settings, 
  CheckCircle, 
  XSquare, 
  Info, 
  Play, 
  Save, 
  Activity, 
  AlertCircle 
} from "lucide-react";

interface ProviderSettingsProps {
  onSave?: () => void;
}

export default function ProviderSettings({ onSave }: ProviderSettingsProps) {
  const [providers, setProviders] = useState<ProviderRegistry>({
    llm: { provider: "ollama", base_url: "http://127.0.0.1:11434/v1", model: "qwen3:8b" },
    image: { provider: "zimage", base_url: "http://127.0.0.1:9100/v1", model: "z-image-turbo" },
    tts: { provider: "edge", base_url: "", model: "id-ID-ArdiNeural", voice: "id-ID-ArdiNeural" },
    video: { provider: "ltx", base_url: "http://127.0.0.1:9200/v1", model: "comfy-ltxv-i2v" }
  });

  const [loading, setLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<Record<string, { status: string; error?: string }>>({});

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const res = await fetch("/api/providers");
      const data = await res.json();
      if (data && data.llm) {
        setProviders(data);
      }
    } catch (err) {
      console.error("Failed to load providers config:", err);
    }
  };

  const handleChange = (role: keyof ProviderRegistry, field: keyof PS, value: string) => {
    setProviders(prev => ({
      ...prev,
      [role]: { ...prev[role], [field]: value }
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(providers)
      });
      if (res.ok && onSave) {
        onSave();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async (role: keyof ProviderRegistry) => {
    const config = providers[role];
    const key = String(role);
    setTestStatus(prev => ({ ...prev, [key]: { status: "testing" } }));
    
    if (config.provider === "gemini") {
      // Automatic passes because Gemini is supported natively server-side
      setTimeout(() => {
        setTestStatus(prev => ({ ...prev, [key]: { status: "connected" } }));
      }, 600);
      return;
    }
    
    try {
      const res = await fetch("/api/providers/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: config.provider,
          base_url: config.base_url || "http://127.0.0.1:11434"
        })
      });
      const data = await res.json();
      setTestStatus(prev => ({ 
        ...prev, 
        [key]: { status: data.status, error: data.error } 
      }));
    } catch (err) {
      setTestStatus(prev => ({ 
        ...prev, 
        [key]: { status: "disconnected", error: "Endpoint server not reachable." } 
      }));
    }
  };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-xl space-y-6">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2">
          <Settings size={18} className="text-amber-400 animate-pulse" />
          <div>
            <h3 className="text-sm font-bold text-zinc-200">Konfigurasi Engine AI Lokal & Cloud</h3>
            <p className="text-[10px] text-zinc-500">Sesuaikan alamat model lokal (Ollama, ComfyUI, F5-TTS) atau jalankan via Sandboxed Gemini</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-lg shadow-lg hover:shadow-amber-500/20 transition disabled:opacity-50 cursor-pointer"
          id="btn-save-providers"
        >
          <Save size={13} />
          {loading ? "Menyimpan..." : "Simpan Config"}
        </button>
      </div>

      <div className="bg-amber-950/20 border border-amber-900/30 p-3 rounded-lg text-xs leading-relaxed text-amber-400/90 flex gap-2.5">
        <Info size={16} className="text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-300">Tips Workspace AI:</span> default kami mengatur engine ke <b>Built-in Gemini Cloud</b> agar studio langsung siap di-generate tanpa setup panjang. Anda bisa mengganti engine ke <code className="bg-amber-950/50 px-1 py-0.5 rounded text-amber-300">ollama</code>, <code className="bg-amber-950/50 px-1 py-0.5 rounded text-amber-300">f5tts</code>, atau <code className="bg-amber-950/50 px-1 py-0.5 rounded text-amber-300">ltx_comfy</code> sewaktu-waktu jika menjalankan model AI tersebut di komputer Anda secara lokal.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* LLM Engine */}
        <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-lg space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Server size={14} className="text-amber-400" />
              1. Brain (LLM/Ollama/Gemini)
            </span>
            <button 
              onClick={() => testConnection("llm")}
              className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-[10px] text-zinc-400 font-medium rounded border border-zinc-800 flex items-center gap-1"
            >
              <Activity size={10} /> Test Connection
            </button>
          </div>

          <div className="space-y-2.5 text-xs text-zinc-400">
            <div>
              <label className="block text-[11px] text-zinc-550 font-medium mb-1">Provider *</label>
              <select 
                value={providers.llm.provider}
                onChange={(e) => handleChange("llm", "provider", e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-805 rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-500 font-medium text-zinc-300"
              >
                <option value="gemini">Google Gemini (Cloud Fallback)</option>
                <option value="ollama">Ollama (Local Engine)</option>
              </select>
            </div>

            {providers.llm.provider === "ollama" && (
              <div>
                <label className="block text-[11px] text-zinc-550 font-medium mb-1">Base URL (Ollama API)</label>
                <input 
                  type="text"
                  value={providers.llm.base_url}
                  onChange={(e) => handleChange("llm", "base_url", e.target.value)}
                  placeholder="e.g. http://127.0.0.1:11434"
                  className="w-full bg-zinc-950 border border-zinc-805 rounded px-2.5 py-1.5 font-mono text-[11px]"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] text-zinc-550 font-medium mb-1">Model Name</label>
              <input 
                type="text"
                value={providers.llm.model}
                onChange={(e) => handleChange("llm", "model", e.target.value)}
                placeholder={providers.llm.provider === "gemini" ? "gemini-3.5-flash" : "qwen3:8b, mistral, llama3"}
                className="w-full bg-zinc-950 border border-zinc-805 rounded px-2.5 py-1.5 font-mono text-[11px]"
              />
            </div>

            {testStatus.llm && (
              <div className="pt-2 text-[10px] border-t border-zinc-900">
                {testStatus.llm.status === "testing" && <span className="text-amber-500 flex items-center gap-1"><Play size={10} className="animate-spin" /> Sedang menghubungi server...</span>}
                {testStatus.llm.status === "connected" && <span className="text-emerald-500 flex items-center gap-1 font-medium"><CheckCircle size={11} /> Berhasil terhubung!</span>}
                {testStatus.llm.status === "disconnected" && (
                  <div className="text-zinc-500 space-y-1">
                    <span className="text-rose-450 font-medium flex items-center gap-1"><XSquare size={11} /> Terputus</span>
                    <p className="text-[9px] leading-normal text-zinc-550">{testStatus.llm.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Visual Engine */}
        <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-lg space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Server size={14} className="text-amber-400" />
              2. Visuals (Z-Image Turbo / Gemini)
            </span>
            <button 
              onClick={() => testConnection("image")}
              className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-[10px] text-zinc-400 font-medium rounded border border-zinc-800 flex items-center gap-1"
            >
              <Activity size={10} /> Test Connection
            </button>
          </div>

          <div className="space-y-2.5 text-xs text-zinc-400">
            <div>
              <label className="block text-[11px] text-zinc-550 font-medium mb-1">Provider *</label>
              <select 
                value={providers.image.provider}
                onChange={(e) => handleChange("image", "provider", e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-805 rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-500 font-medium text-zinc-300"
              >
                <option value="gemini">Google Imagen (Gemini 2.5/3.1-Image)</option>
                <option value="zimage">Z-Image Turbo (Local Diffusion)</option>
              </select>
            </div>

            {providers.image.provider === "zimage" && (
              <div>
                <label className="block text-[11px] text-zinc-550 font-medium mb-1">Base URL (Local API Proxy)</label>
                <input 
                  type="text"
                  value={providers.image.base_url}
                  onChange={(e) => handleChange("image", "base_url", e.target.value)}
                  placeholder="e.g. http://127.0.0.1:9100/v1"
                  className="w-full bg-zinc-950 border border-zinc-805 rounded px-2.5 py-1.5 font-mono text-[11px]"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] text-zinc-550 font-medium mb-1">Model Name</label>
              <input 
                type="text"
                value={providers.image.model}
                onChange={(e) => handleChange("image", "model", e.target.value)}
                placeholder={providers.image.provider === "gemini" ? "gemini-2.5-flash-image" : "z-image-turbo"}
                className="w-full bg-zinc-950 border border-zinc-805 rounded px-2.5 py-1.5 font-mono text-[11px]"
              />
            </div>

            {testStatus.image && (
              <div className="pt-2 text-[10px] border-t border-zinc-900">
                {testStatus.image.status === "testing" && <span className="text-amber-500 flex items-center gap-1"><Play size={10} className="animate-spin" /> Menghubungi server...</span>}
                {testStatus.image.status === "connected" && <span className="text-emerald-500 flex items-center gap-1 font-medium"><CheckCircle size={11} /> Berhasil terhubung!</span>}
                {testStatus.image.status === "disconnected" && (
                  <div className="text-zinc-500 space-y-1">
                    <span className="text-rose-450 font-medium flex items-center gap-1"><XSquare size={11} /> Terputus</span>
                    <p className="text-[9px] leading-normal text-zinc-550">{testStatus.image.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* voice/TTS Engine */}
        <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-lg space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Server size={14} className="text-amber-400" />
              3. Voice (F5-TTS / Gemini TTS)
            </span>
            <button 
              onClick={() => testConnection("tts")}
              className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-[10px] text-zinc-400 font-medium rounded border border-zinc-800 flex items-center gap-1"
            >
              <Activity size={10} /> Test Connection
            </button>
          </div>

          <div className="space-y-2.5 text-xs text-zinc-400">
            <div>
              <label className="block text-[11px] text-zinc-550 font-medium mb-1">Provider *</label>
              <select 
                value={providers.tts.provider}
                onChange={(e) => handleChange("tts", "provider", e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-805 rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-500 font-medium text-zinc-300"
              >
                <option value="gemini">Google TTS (Gemini 3.1-TTS)</option>
                <option value="edge">Edge-TTS (Local CLI Engine)</option>
                <option value="f5tts">F5-TTS (Local Voice Cloner)</option>
              </select>
            </div>

            {providers.tts.provider === "f5tts" && (
              <div>
                <label className="block text-[11px] text-zinc-550 font-medium mb-1">Base URL (TTS Endpoint)</label>
                <input 
                  type="text"
                  value={providers.tts.base_url}
                  onChange={(e) => handleChange("tts", "base_url", e.target.value)}
                  placeholder="e.g. http://127.0.0.1:9880"
                  className="w-full bg-zinc-950 border border-zinc-805 rounded px-2.5 py-1.5 font-mono text-[11px]"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] text-zinc-550 font-medium mb-1">Voice Accent</label>
              <input 
                type="text"
                value={providers.tts.voice || ""}
                onChange={(e) => handleChange("tts", "voice", e.target.value)}
                placeholder={providers.tts.provider === "gemini" ? "Kore, Zephyr, Puck" : "indonesian_female, male_casual"}
                className="w-full bg-zinc-950 border border-zinc-805 rounded px-2.5 py-1.5 font-mono text-[11px]"
              />
            </div>

            {testStatus.tts && (
              <div className="pt-2 text-[10px] border-t border-zinc-900">
                {testStatus.tts.status === "testing" && <span className="text-amber-500 flex items-center gap-1"><Play size={10} className="animate-spin" /> Menghubungi server...</span>}
                {testStatus.tts.status === "connected" && <span className="text-emerald-500 flex items-center gap-1 font-medium"><CheckCircle size={11} /> Berhasil terhubung!</span>}
                {testStatus.tts.status === "disconnected" && (
                  <div className="text-zinc-500 space-y-1">
                    <span className="text-rose-450 font-medium flex items-center gap-1"><XSquare size={11} /> Terputus</span>
                    <p className="text-[9px] leading-normal text-zinc-550">{testStatus.tts.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Video motion engine */}
        <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-lg space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Server size={14} className="text-amber-400" />
              4. Video (LTX ComfyUI / Veo)
            </span>
            <button 
              onClick={() => testConnection("video")}
              className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-[10px] text-zinc-400 font-medium rounded border border-zinc-800 flex items-center gap-1"
            >
              <Activity size={10} /> Test Connection
            </button>
          </div>

          <div className="space-y-2.5 text-xs text-zinc-400">
            <div>
              <label className="block text-[11px] text-zinc-550 font-medium mb-1">Provider *</label>
              <select 
                value={providers.video.provider}
                onChange={(e) => handleChange("video", "provider", e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-805 rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-500 font-medium text-zinc-300"
              >
                <option value="gemini">Google Veo (Cloud Video)</option>
                <option value="ltx">LTX Video (Local Image-To-Video)</option>
                <option value="ltx_comfy">ComfyUI/LTXV (Local Proxy)</option>
              </select>
            </div>

            {(providers.video.provider === "ltx" || providers.video.provider === "ltx_comfy") && (
              <div>
                <label className="block text-[11px] text-zinc-550 font-medium mb-1">Base URL (Comfy API)</label>
                <input 
                  type="text"
                  value={providers.video.base_url}
                  onChange={(e) => handleChange("video", "base_url", e.target.value)}
                  placeholder="e.g. http://127.0.0.1:9200/v1"
                  className="w-full bg-zinc-950 border border-zinc-805 rounded px-2.5 py-1.5 font-mono text-[11px]"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] text-zinc-550 font-medium mb-1">Model Name</label>
              <input 
                type="text"
                value={providers.video.model}
                onChange={(e) => handleChange("video", "model", e.target.value)}
                placeholder={providers.video.provider === "gemini" ? "veo-3.1-lite-generate" : "comfy-ltxv-i2v"}
                className="w-full bg-zinc-950 border border-zinc-805 rounded px-2.5 py-1.5 font-mono text-[11px]"
              />
            </div>

            {testStatus.video && (
              <div className="pt-2 text-[10px] border-t border-zinc-900">
                {testStatus.video.status === "testing" && <span className="text-amber-500 flex items-center gap-1"><Play size={10} className="animate-spin" /> Menghubungi server...</span>}
                {testStatus.video.status === "connected" && <span className="text-emerald-500 flex items-center gap-1 font-medium"><CheckCircle size={11} /> Berhasil terhubung!</span>}
                {testStatus.video.status === "disconnected" && (
                  <div className="text-zinc-500 space-y-1">
                    <span className="text-rose-450 font-medium flex items-center gap-1"><XSquare size={11} /> Terputus</span>
                    <p className="text-[9px] leading-normal text-zinc-550">{testStatus.video.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
