import React, { useState } from "react";
import { LocationBible } from "../types";
import { Compass, Sparkles, Map, Check, RefreshCw } from "lucide-react";

interface LocationViewProps {
  locBible: LocationBible | undefined;
  onUpdate: (updated: Partial<LocationBible>) => void;
  onGenerateReference: () => Promise<void>;
}

export default function LocationView({
  locBible,
  onUpdate,
  onGenerateReference
}: LocationViewProps) {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    lighting: "",
    camera_style: "",
    consistency_prompt: ""
  });

  if (!locBible) {
    return (
      <div className="py-12 text-center bg-zinc-950/30 border border-zinc-900 rounded-xl">
        <Compass size={24} className="mx-auto text-zinc-650 animate-pulse mb-3" />
        <h4 className="text-xs font-semibold text-zinc-400">Location Bible Belum Terbentuk</h4>
        <p className="text-[10px] text-zinc-650 max-w-xs mx-auto mt-1">Definisikan latar belakang pementasan video Anda di langkah location set-up selanjutnya.</p>
      </div>
    );
  }

  const handleStartEdit = () => {
    setFormData({
      name: locBible.name || "",
      description: locBible.description || "",
      lighting: locBible.lighting || "",
      camera_style: locBible.camera_style || "",
      consistency_prompt: locBible.consistency_prompt || ""
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
  };

  const triggerGenerateRef = async () => {
    setLoading(true);
    try {
      await onGenerateReference();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-zinc-900/40 border border-zinc-800 p-6 rounded-xl">
      
      {/* Latar Belakang reference image slot */}
      <div className="space-y-4">
        <span className="text-xs font-bold text-zinc-400 block uppercase tracking-wider">Latar Lokasi (Studio)</span>
        <div className="relative aspect-[1/1] w-full bg-zinc-950 rounded-xl border border-zinc-800 shadow-inner overflow-hidden group">
          {locBible.reference_image_path ? (
            <img 
              src={locBible.reference_image_path} 
              alt="Location architecture" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600">
              <Map size={40} className="text-zinc-700 mb-2" />
              <span className="text-[10px]">Location graphic empty</span>
            </div>
          )}
          <div className="absolute bottom-3 left-3 right-3 bg-black/75 backdrop-blur-sm border border-zinc-800 px-3 py-2 rounded-lg text-center opacity-0 group-hover:opacity-100 transition">
            <span className="text-[9px] text-zinc-450 block font-mono">ID: {locBible.id}</span>
          </div>
        </div>

        <button 
          onClick={triggerGenerateRef}
          disabled={loading}
          className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-820 text-zinc-300 text-xs font-bold rounded-lg border border-zinc-800/80 hover:border-zinc-700 transition"
          id="btn-regen-location-portrait"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          {loading ? "Re-generating..." : "Generate Lokasi AI"}
        </button>
      </div>

      {/* Location specifics parameters */}
      <div className="md:col-span-2 space-y-4">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
          <div>
            <h4 className="text-sm font-bold text-zinc-300">{locBible.name}</h4>
            <p className="text-[10px] text-zinc-500">Konsep arsitektur latar untuk kestabilan background dan lighting</p>
          </div>
          {isEditing ? (
            <button 
              onClick={handleSave}
              className="flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded shadow-sm cursor-pointer"
              id="btn-save-location-bible"
            >
              <Check size={12} /> Simpan
            </button>
          ) : (
            <button 
              onClick={handleStartEdit}
              className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded border border-zinc-700/60"
              id="btn-edit-location-bible"
            >
              Edit Studio
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="block text-[11px] text-zinc-500 font-medium mb-1">Nama Lokasi</label>
              <input 
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-500 text-zinc-300 font-medium"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-[11px] text-zinc-500 font-medium mb-1">Deskripsi Detail</label>
              <input 
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-500 text-zinc-300"
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-500 font-medium mb-1">Pencahayaan (Lighting)</label>
              <input 
                type="text"
                value={formData.lighting}
                onChange={(e) => setFormData({ ...formData, lighting: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-500 font-medium mb-1">Sifat & Gaya Kamera</label>
              <input 
                type="text"
                value={formData.camera_style}
                onChange={(e) => setFormData({ ...formData, camera_style: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] text-zinc-500 font-medium mb-1">Prompt Latar Belakang (Stable Diffusion background model)</label>
              <textarea 
                value={formData.consistency_prompt}
                onChange={(e) => setFormData({ ...formData, consistency_prompt: e.target.value })}
                className="w-full h-20 bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-350 focus:outline-none font-mono"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-zinc-950/30 p-3 rounded border border-zinc-850/65 md:col-span-2">
              <span className="text-[10px] text-zinc-500 uppercase font-black block mb-0.5 tracking-wider">Deskripsi Studio</span>
              <p className="text-zinc-300 font-medium">{locBible.description}</p>
            </div>

            <div className="bg-zinc-950/30 p-3 rounded border border-zinc-850/65">
              <span className="text-[10px] text-zinc-500 uppercase font-black block mb-0.5 tracking-wider">Atmosfer Cahaya</span>
              <p className="text-zinc-300 font-medium">{locBible.lighting}</p>
            </div>

            <div className="bg-zinc-950/30 p-3 rounded border border-zinc-850/65">
              <span className="text-[10px] text-zinc-500 uppercase font-black block mb-0.5 tracking-wider">Preset Kamera</span>
              <p className="text-zinc-300 font-medium">{locBible.camera_style}</p>
            </div>

            <div className="bg-zinc-950/30 p-3 rounded border border-zinc-850/65 md:col-span-2">
              <span className="text-[10px] text-amber-400 uppercase font-black block mb-1 tracking-wider">Prompt Konsistensi Latar</span>
              <code className="text-[10px] text-zinc-400 leading-normal block bg-zinc-950 p-2 rounded border border-zinc-900 font-mono">
                {locBible.consistency_prompt}
              </code>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
