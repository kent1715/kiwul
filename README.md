# Kiwul Content Production Studio 🎬

Kiwul adalah stasiun kerja lokal (*local AI content production studio*) untuk membuat konten video vertikal secara otomatis (untuk TikTok, Instagram Reels, dan YouTube Shorts). Kiwul mendukung integrasi penuh dengan kecerdasan buatan lokal (local engine) untuk menjaga privasi data Anda, menghemat kuota cloud API, dan memaksimalkan performa GPU NVIDIA di perangkat Windows Anda.

---

## 🚀 Persyaratan Sistem & Mesin Lokal

Kiwul telah di-refactor agar berjalan maksimal pada komputer Windows dengan GPU NVIDIA (misalnya, RTX 2000 Ada, RTX 3060, dll). Pastikan mesin-mesin lokal berikut sudah berjalan di komputer Anda sebelum memulai aplikasi:

1. **Ollama (LLM)**
   * Endpoint: `http://127.0.0.1:11434/v1`
   * Model Utama: `qwen3:8b` (atau model lain pilihan Anda)
   
2. **Z-Image Turbo proxy (Image)**
   * Endpoint: `http://127.0.0.1:9100/v1`
   * Model Utama: `z-image-turbo`

3. **Comfy LTXV I2V / Local Video (Video)**
   * Endpoint: `http://127.0.0.1:9200/v1`
   * Model Utama: `comfy-ltxv-i2v`

4. **Edge-TTS / F5-TTS (Voiceover)**
   * Edge-TTS diinstal via Python. Jika belum ada, jalankan perintah berikut:
     ```powershell
     pip install edge-tts
     ```

5. **FFmpeg (Final Render Compiler)**
   * FFmpeg harus terinstal secara lokal dan terdaftar pada PATH lingkungan Windows Anda.

---

## 🛠️ Cek Kondisi Koneksi Mesin Lokal (Windows PowerShell)

Sebelum menjalankan aplikasi, Anda dapat memverifikasi kesiapan setiap komponen AI lokal menggunakan perintah berikut di PowerShell Anda:

```powershell
# 1. Cek Ollama LLM
curl http://127.0.0.1:11434/v1/models

# 2. Cek Z-Image Turbo
curl http://127.0.0.1:9100/v1/models

# 3. Cek Comfy LTXV Video Proxy
curl http://127.0.0.1:9200/v1/models

# 4. Cek Versi FFmpeg lokal Anda
ffmpeg -version
```

---

## ⚡ Langkah Memulai Aplikasi (Quickstart)

Ikuti langkah-langkah mudah berikut menggunakan **Windows PowerShell** untuk mendownload pustaka ketergantungan, mem-build program, dan menjalankannya secara lokal:

```powershell
# 1. Unduh modul node_modules
npm install

# 2. Buat berkas konfigurasi .env Anda
Copy-Item .env.example .env

# 3. Bangun aplikasi React & Bundler Express
npm run build

# 4. Jalankan aplikasi mode pengembangan
npm run dev
```

Buka peramban browser Anda di: [http://127.0.0.1:3000](http://127.0.0.1:3000)

---

## 🔥 Fitur Unggulan Kiwul

* **Storyboard Generative Flow**: Membangun ide, video, dan storyline dari satu prompt kreatif utama.
* **Granular Asset Pipeline**: Regerenerasi scene, image draft, motion video, dan voiceover per part/scene tanpa mengulangi rendering dari awal.
* **Offline-First Resilience**: Logika pintar penanganan kegagalan otomatis (*fail-safe fallback systems*) untuk mencegah crash produksi di stasiun kerja Anda.
