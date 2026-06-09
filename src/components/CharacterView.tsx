import React, { useState } from "react";
import { CharacterBible } from "../types";
import { User, Sparkles, Image, Check, RefreshCw } from "lucide-react";

interface CharacterViewProps {
  charBible: CharacterBible | undefined;
  onUpdate: (updated: Partial<CharacterBible>) => void;
  onGenerateReference: () => Promise<void>;
}

export default function CharacterView({
  charBible,
  onUpdate,
  onGenerateReference
}: CharacterViewProps) {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    age_range: "",
    face_description: "",
    hair_or_hijab: "",
    outfit: "",
    personality: "",
    visual_consistency_prompt: ""
  });

  if (!charBible) {
    return (
      <div className="py-12 text-center bg-zinc-950/30 border border-zinc-900 rounded-xl">
        <User size={24} className="mx-auto text-zinc-650 animate-pulse mb-3" />
        <h4 className="text-xs font-semibold text-zinc-400">Character Bible Belum Ada</h4>
        <p className="text-[10px] text-zinc-650 max-w-xs mx-auto mt-1">Lahirkan tokoh utama video Anda di langkah character set-up selanjutnya.</p>
      </div>
    );
  }

  const handleStartEdit = () => {
    setFormData({
      name: charBible.name || "",
      age_range: charBible.age_range || "",
      face_description: charBible.face_description || "",
      hair_or_hijab: charBible.hair_or_hijab || "",
      outfit: charBible.outfit || "",
      personality: charBible.personality || "",
      visual_consistency_prompt: charBible.visual_consistency_prompt || ""
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
      
      {/* 1. Portrait reference block */}
      <div className="space-y-4">
        <span className="text-xs font-bold text-zinc-400 block uppercase tracking-wider">Aktor / Karakter Utama</span>
        <div className="relative aspect-[1/1] w-full bg-zinc-950 rounded-xl border border-zinc-800 shadow-inner overflow-hidden group">
          {charBible.reference_image_path ? (
            <img 
              src={charBible.reference_image_path} 
              alt="Character portrait" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600">
              <User size={40} className="text-zinc-700 mb-2" />
              <span className="text-[10px]">Reference portrait empty</span>
            </div>
          )}
          <div className="absolute bottom-3 left-3 right-3 bg-black/75 backdrop-blur-sm border border-zinc-800 px-3 py-2 rounded-lg text-center opacity-0 group-hover:opacity-100 transition duration-150">
            <span className="text-[9px] text-zinc-450 block font-mono">ID: {charBible.id}</span>
          </div>
        </div>

        <button 
          onClick={triggerGenerateRef}
          disabled={loading}
          className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-820 text-zinc-300 text-xs font-bold rounded-lg border border-zinc-800/80 hover:border-zinc-700 transition"
          id="btn-regen-character-portrait"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          {loading ? "Re-generating..." : "Generate Karakter AI"}
        </button>
      </div>

      {/* 2. Character specifications */}
      <div className="md:col-span-2 space-y-4">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
          <div>
            <h4 className="text-sm font-bold text-zinc-300">{charBible.name} ({charBible.gender})</h4>
            <p className="text-[10px] text-zinc-500">Karakter fisik dan personality untuk konsistensi AI</p>
          </div>
          {isEditing ? (
            <button 
              onClick={handleSave}
              className="flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded shadow-sm cursor-pointer"
              id="btn-save-character-bible"
            >
              <Check size={12} /> Simpan
            </button>
          ) : (
            <button 
              onClick={handleStartEdit}
              className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded border border-zinc-700/60"
              id="btn-edit-character-bible"
            >
              Edit Karakter
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[11px] text-zinc-500 font-medium mb-1">Nama Karakter</label>
              <input 
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-500 text-zinc-300 font-medium"
              />
            </div>
            
            <div>
              <label className="block text-[11px] text-zinc-500 font-medium mb-1">Rentang Umur</label>
              <input 
                type="text"
                value={formData.age_range}
                onChange={(e) => setFormData({ ...formData, age_range: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-500 text-zinc-300 font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-500 font-medium mb-1">Raut Wajah</label>
              <input 
                type="text"
                value={formData.face_description}
                onChange={(e) => setFormData({ ...formData, face_description: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-500 font-medium mb-1">Model Rambut / Hijab</label>
              <input 
                type="text"
                value={formData.hair_or_hijab}
                onChange={(e) => setFormData({ ...formData, hair_or_hijab: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] text-zinc-500 font-medium mb-1">Gaya Busana (Outfit)</label>
              <input 
                type="text"
                value={formData.outfit}
                onChange={(e) => setFormData({ ...formData, outfit: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] text-zinc-500 font-medium mb-1">Karakter Konsistensi Prompt (Stable Diffusion/Midjourney style)</label>
              <textarea 
                value={formData.visual_consistency_prompt}
                onChange={(e) => setFormData({ ...formData, visual_consistency_prompt: e.target.value })}
                className="w-full h-20 bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-350 focus:outline-none font-mono"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-zinc-950/30 p-3 rounded border border-zinc-850/65">
              <span className="text-[10px] text-zinc-500 uppercase font-black block mb-0.5 tracking-wider">Identifikasi Fisik</span>
              <p className="text-zinc-300 font-medium">Umur: {charBible.age_range || "N/A"} • Wajah: {charBible.face_description}</p>
            </div>

            <div className="bg-zinc-950/30 p-3 rounded border border-zinc-850/65">
              <span className="text-[10px] text-zinc-500 uppercase font-black block mb-0.5 tracking-wider">Mahkota / Rambut / Hijab</span>
              <p className="text-zinc-300 font-medium">{charBible.hair_or_hijab}</p>
            </div>

            <div className="bg-zinc-950/30 p-3 rounded border border-zinc-850/65 md:col-span-2">
              <span className="text-[10px] text-zinc-500 uppercase font-black block mb-0.5 tracking-wider">Gaya Pakaian (Outfit)</span>
              <p className="text-zinc-300 font-medium">{charBible.outfit}</p>
            </div>

            <div className="bg-zinc-950/30 p-3 rounded border border-zinc-850/65 md:col-span-2">
              <span className="text-[10px] text-zinc-500 uppercase font-black block mb-0.5 tracking-wider">Kepribadian & Aura (Personality)</span>
              <p className="text-zinc-300 font-medium">{charBible.personality || "N/A"}</p>
            </div>

            <div className="bg-zinc-950/30 p-3 rounded border border-zinc-850/65 md:col-span-2">
              <span className="text-[10px] text-amber-400 uppercase font-black block mb-1 tracking-wider">Prompt Konsistensi Karakter</span>
              <code className="text-[10px] text-zinc-400 leading-normal block bg-zinc-950 p-2 rounded border border-zinc-900 font-mono">
                {charBible.visual_consistency_prompt}
              </code>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
