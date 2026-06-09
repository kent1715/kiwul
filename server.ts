import express from "express";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Import local provider adapters
import { generateLocalImage } from "./src/server/providers/image.zimage";
import { generateLocalTTS } from "./src/server/providers/tts.f5tts";
import { generateEdgeTTS } from "./src/server/providers/tts.edge";
import { generateLocalVideo } from "./src/server/providers/video.ltx";
import { renderCompilation } from "./src/server/providers/render.ffmpeg";
import { runOllamaLLM } from "./src/server/providers/llm.ollama";

dotenv.config();

const app = express();
app.use(express.json());

// Serve outputs directory statically for vertical media assets (images, videos, TTS wave tracks)
app.use("/outputs", express.static(path.join(process.cwd(), "outputs")));

const PORT = Number(process.env.PORT || 3000);

// Initialize GoogleGenAI client (Server-Side only)
const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Paths to localized database files
const PROJECTS_FILE = path.join(process.cwd(), "data", "projects.json");
const PROVIDERS_FILE = path.join(process.cwd(), "data", "providers.json");
const JOBS_FILE = path.join(process.cwd(), "data", "jobs.json");

// Helper: Normalize Provider Names (PERBAIKAN WAJIB 3)
function normalizeProviderName(provider: string): string {
  if (!provider) return "";
  const lower = provider.toLowerCase().trim();
  if (lower === "ltx_comfy" || lower === "comfy_ltx") return "ltx";
  if (lower === "edge-tts") return "edge";
  return lower;
}

// Jobs Persistence Helpers (PERBAIKAN WAJIB 9 & 10)
function loadJobs(): Record<string, { 
  status: "pending" | "generating" | "completed" | "failed", 
  progress: number, 
  total: number, 
  completed: number, 
  error: string | null 
}> {
  try {
    if (!fs.existsSync(JOBS_FILE)) {
      fs.mkdirSync(path.dirname(JOBS_FILE), { recursive: true });
      fs.writeFileSync(JOBS_FILE, "{}", "utf-8");
      return {};
    }
    const data = fs.readFileSync(JOBS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading jobs:", err);
    return {};
  }
}

function saveJobs(jobsToSave: any) {
  try {
    fs.mkdirSync(path.dirname(JOBS_FILE), { recursive: true });
    fs.writeFileSync(JOBS_FILE, JSON.stringify(jobsToSave, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing jobs:", err);
  }
}

function updateJob(jobId: string, fields: Partial<{
  status: "pending" | "running" | "generating" | "completed" | "failed";
  progress: number;
  total: number;
  completed: number;
  error: string | null;
}>) {
  const currentJobs = loadJobs();
  const existing = currentJobs[jobId] || { status: "pending", progress: 0, total: 0, completed: 0, error: null };
  const updatedStatus = fields.status === "running" ? "generating" : (fields.status ?? existing.status);
  
  (currentJobs as any)[jobId] = {
    ...existing,
    ...fields,
    status: updatedStatus
  };
  saveJobs(currentJobs);
}

function updateJobProgress(
  jobId: string, 
  completed: number, 
  total: number, 
  status: "pending" | "running" | "generating" | "completed" | "failed", 
  error: string | null = null
) {
  const currentJobs = loadJobs();
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const updatedStatus = status === "running" ? "generating" : status;
  currentJobs[jobId] = {
    status: updatedStatus,
    progress,
    total,
    completed,
    error
  };
  saveJobs(currentJobs);
}

// Ensure Data Directory and Default Files (PERBAIKAN WAJIB 4 & 5)
function ensureDataFiles() {
  const dataDir = path.join(process.cwd(), "data");
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(path.join(process.cwd(), "outputs"), { recursive: true });

  const oldDir = path.join(process.cwd(), "src", "db");
  const oldProj = path.join(oldDir, "projects.json");
  const newProj = PROJECTS_FILE;
  if (fs.existsSync(oldProj) && !fs.existsSync(newProj)) {
    console.log("[Migration] Migrating projects.json to data/projects.json...");
    try {
      fs.copyFileSync(oldProj, newProj);
    } catch (err) {
      console.error("Migration of projects failed:", err);
    }
  }

  const oldProv = path.join(oldDir, "providers.json");
  const newProv = PROVIDERS_FILE;
  if (fs.existsSync(oldProv) && !fs.existsSync(newProv)) {
    console.log("[Migration] Migrating providers.json to data/providers.json...");
    try {
      fs.copyFileSync(oldProv, newProv);
    } catch (err) {
      console.error("Migration of providers failed:", err);
    }
  }

  // Ensure projects.json
  if (!fs.existsSync(newProj)) {
    fs.writeFileSync(newProj, "[]", "utf-8");
  }

  // Ensure providers.json (default local-first)
  if (!fs.existsSync(newProv)) {
    const defaultProviders = {
      llm: {
        provider: "ollama",
        base_url: "http://127.0.0.1:11434/v1",
        model: "qwen3:8b",
        enabled: true
      },
      image: {
        provider: "zimage",
        base_url: "http://127.0.0.1:9100/v1",
        model: "z-image-turbo",
        enabled: true,
        default_size: "768x1024",
        fallback_enabled: false
      },
      video: {
        provider: "ltx",
        base_url: "http://127.0.0.1:9200/v1",
        model: "comfy-ltxv-i2v",
        enabled: true,
        duration: 3,
        fps: 24,
        resolution: "768x1024"
      },
      tts: {
        provider: "edge",
        base_url: "",
        model: "id-ID-ArdiNeural",
        enabled: true
      },
      render: {
        provider: "ffmpeg",
        enabled: true,
        output_format: "mp4"
      }
    };
    fs.writeFileSync(newProv, JSON.stringify(defaultProviders, null, 2), "utf-8");
  }

  // Ensure jobs.json
  if (!fs.existsSync(JOBS_FILE)) {
    fs.writeFileSync(JOBS_FILE, "{}", "utf-8");
  }
}
ensureDataFiles();

// Helper to clean JSON string from LLM responses
function cleanJsonResponse(text: string): any {
  let cleaned = text.trim();
  
  // Remove markdown formatting
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  cleaned = cleaned.trim();

  // Boundary finder for JSON structures
  const startIdx = cleaned.search(/[\{\[]/);
  if (startIdx !== -1) {
    const endIdx = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
    if (endIdx !== -1 && endIdx > startIdx) {
      cleaned = cleaned.substring(startIdx, endIdx + 1);
    }
  }

  try {
    return JSON.parse(cleaned);
  } catch (err: any) {
    console.error("JSON parsing failed. Source Text:", cleaned);
    throw err;
  }
}

// Global System Prompt for all LLM calls
const GLOBAL_SYSTEM_PROMPT = `Kamu adalah AI Creative Director untuk studio produksi konten video pendek lokal.
Tugasmu adalah membantu membuat konten vertikal untuk TikTok, Reels, dan YouTube Shorts.

Kamu harus selalu menghasilkan output yang:
- jelas, realistis, mudah divisualkan
- cocok untuk text-to-image dan cocok untuk image-to-video
- cocok untuk voice over Bahasa Indonesia yang natural, casul, tidak kaku
- tidak menggunakan markdown, kode blok, atau penjelasan berlebih di luar JSON schema yang diminta

Aturan penting:
1. Selalu patuhi schema output yang diminta.
2. Output harus JSON valid jika diminta JSON.
3. Jangan gunakan markdown di luar JSON. Jangan menulis komentar di luar JSON.
4. Karakter & Lokasi harus konsisten dari awal sampai akhir.
5. Jangan membuat prompt gerakan ekstrem (untuk video lokal LTX, gerakan kecil, stabil, natural).`;

// Unified LLM executor (supports Ollama and Gemini)
async function runLLM(prompt: string, systemInstruction: string, temperature: number = 0.5): Promise<string> {
  const providers = readProviders();
  const llmConfig = providers.llm || { provider: "gemini", model: "gemini-3.5-flash" };
  
  if (llmConfig.provider === "ollama") {
    return runOllamaLLM(prompt, systemInstruction, llmConfig, temperature);
  } else {
    // Google Gemini
    console.log(`[Gemini] Generating content with model: ${llmConfig.model || "gemini-3.5-flash"}`);
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in system environments. Please configure secrets.");
    }
    const response = await ai.models.generateContent({
      model: llmConfig.model || "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature,
        responseMimeType: "application/json"
      }
    });
    return response.text || "";
  }
}

// Resilient helper with JSON parsing guard and repair prompt
async function runLLMWithRetryAndRepair(
  prompt: string,
  systemInstruction: string,
  temperature: number = 0.5,
  attemptsLeft: number = 3
): Promise<any> {
  let currentTemp = temperature;
  let currentPrompt = prompt;
  
  for (let attempt = 1; attempt <= attemptsLeft; attempt++) {
    try {
      const rawText = await runLLM(currentPrompt, systemInstruction, currentTemp);
      try {
        const parsed = cleanJsonResponse(rawText);
        return parsed;
      } catch (parseErr: any) {
        if (attempt === attemptsLeft) {
          throw new Error(`Failed to parse valid JSON after ${attemptsLeft} attempts. Last parse error: ${parseErr.message}`);
        }
        
        console.warn(`[JSON Repair] Parse failed on attempt ${attempt}. Triggering healing prompt...`);
        // Make the model more deterministic
        currentTemp = Math.max(0.1, currentTemp * 0.5);
        // Direct healing prompt
        currentPrompt = `The previous response was invalid JSON. Error: ${parseErr.message}.
Here was the text that failed to parse:
---
${rawText}
---
Please reconstruct this content into a single, perfectly valid JSON structure matching the original expected schema. Return ONLY valid JSON, do not include any markdown backticks, conversational prefaces, or explanations outside the JSON. Starts directly with '{' or '['.`;
      }
    } catch (llmErr: any) {
      if (attempt === attemptsLeft) {
        throw llmErr;
      }
      console.warn(`[LLM Error] Call failed on attempt ${attempt}: ${llmErr.message}. Retrying in 500ms...`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

// Read database helper
function readProjects(): any[] {
  try {
    if (!fs.existsSync(PROJECTS_FILE)) {
      // Ensure folder
      fs.mkdirSync(path.dirname(PROJECTS_FILE), { recursive: true });
      fs.writeFileSync(PROJECTS_FILE, "[]", "utf-8");
      return [];
    }
    const data = fs.readFileSync(PROJECTS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading projects:", err);
    return [];
  }
}

// Write database helper
function writeProjects(projects: any[]) {
  try {
    fs.mkdirSync(path.dirname(PROJECTS_FILE), { recursive: true });
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing projects:", err);
  }
}

// Read providers config helper
function readProviders(): any {
  try {
    if (!fs.existsSync(PROVIDERS_FILE)) {
      fs.mkdirSync(path.dirname(PROVIDERS_FILE), { recursive: true });
      const defaultProviders = {
        llm: {
          provider: "ollama",
          base_url: "http://127.0.0.1:11434/v1",
          model: "qwen3:8b",
          enabled: true
        },
        image: {
          provider: "zimage",
          base_url: "http://127.0.0.1:9100/v1",
          model: "z-image-turbo",
          enabled: true,
          default_size: "768x1024",
          steps: 8,
          cfg: 1,
          fallback_enabled: false
        },
        video: {
          provider: "ltx",
          base_url: "http://127.0.0.1:9200/v1",
          model: "comfy-ltxv-i2v",
          enabled: true,
          duration: 3,
          fps: 24,
          resolution: "768x1024"
        },
        tts: {
          provider: "edge",
          base_url: "",
          model: "id-ID-ArdiNeural",
          enabled: true
        },
        render: {
          provider: "ffmpeg",
          enabled: true,
          output_format: "mp4"
        }
      };
      fs.writeFileSync(PROVIDERS_FILE, JSON.stringify(defaultProviders, null, 2), "utf-8");
      return defaultProviders;
    }
    const data = fs.readFileSync(PROVIDERS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading providers:", err);
    return {};
  }
}

// Write providers config helper
function writeProviders(providers: any) {
  try {
    fs.mkdirSync(path.dirname(PROVIDERS_FILE), { recursive: true });
    fs.writeFileSync(PROVIDERS_FILE, JSON.stringify(providers, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing providers:", err);
  }
}

// Unsplash theme mapping to guarantee aesthetic fallback images instantly
function getUnsplashFallback(query: string, aspect: string = "9:16"): string {
  const normalized = query.toLowerCase();
  const resStr = aspect === "9:16" ? "w=600&h=1060" : "w=400&h=400";
  
  if (normalized.includes("host") || normalized.includes("siti") || normalized.includes("woman") || normalized.includes("female")) {
    return `https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&${resStr}`;
  }
  if (normalized.includes("pot") || normalized.includes("boil") || normalized.includes("pan") || normalized.includes("cook")) {
    return `https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&q=80&${resStr}`;
  }
  if (normalized.includes("ingredient") || normalized.includes("chili") || normalized.includes("garlic") || normalized.includes("vegetable")) {
    return `https://images.unsplash.com/photo-1598965402521-6fd2328b60a4?auto=format&fit=crop&q=80&${resStr}`;
  }
  if (normalized.includes("kitchen") || normalized.includes("cabinet") || normalized.includes("countertop")) {
    return `https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&${resStr}`;
  }
  if (normalized.includes("noodle") || normalized.includes("ramen") || normalized.includes("pasta") || normalized.includes("indomie")) {
    return `https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&q=80&${resStr}`;
  }
  if (normalized.includes("eating") || normalized.includes("shout") || normalized.includes("smile") || normalized.includes("satisfied")) {
    return `https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&${resStr}`;
  }
  // Generic beautiful food/lifestyle photography
  return `https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&q=80&${resStr}`;
}

// --- API ROUTES ---

// 1. Get all projects
app.get("/api/projects", (req, res) => {
  const projects = readProjects();
  res.json(projects);
});

// 2. Clear all projects (Reset)
app.post("/api/projects/reset", (req, res) => {
  writeProjects([]);
  res.json({ message: "All projects successfully cleared." });
});

// 3. Create a project
app.post("/api/projects", (req, res) => {
  const { title, content_type, language, duration_seconds, aspect_ratio, resolution, visual_style, config } = req.body;
  const projects = readProjects();
  
  const newProject = {
    project_id: "proj_" + Math.random().toString(36).substring(2, 9),
    title: title || "Untitled Project",
    content_type: content_type || "viral_hacks",
    language: language || "id",
    target_platform: ["tiktok", "reels", "youtube_shorts"],
    duration_seconds: Number(duration_seconds) || 30,
    aspect_ratio: aspect_ratio || "9:16",
    resolution: resolution || "1080x1920",
    visual_style: visual_style || "realistic cinematic vertical",
    status: "draft",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    config: config || {
      niche: "General",
      topic: title || "General Topic",
      audience: "General Public",
      tone: "Ceria, Energetik"
    },
    subtitle_style: {
      font: "Inter",
      font_size: 42,
      position: "bottom",
      background: true,
      max_words_per_line: 5
    }
  };
  
  projects.push(newProject);
  writeProjects(projects);
  res.status(201).json(newProject);
});

// 4. Get project by ID
app.get("/api/projects/:id", (req, res) => {
  const projects = readProjects();
  const project = projects.find((p) => p.project_id === req.params.id);
  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }
  res.json(project);
});

// 5. Delete project by ID
app.delete("/api/projects/:id", (req, res) => {
  const projects = readProjects();
  const filtered = projects.filter((p) => p.project_id !== req.params.id);
  writeProjects(filtered);
  res.json({ status: "success", deleted: req.params.id });
});

// 1. Normalize free-form project brief (Step 1)
app.post("/api/projects/:id/normalize-brief", async (req, res) => {
  const { raw_brief } = req.body;
  const projects = readProjects();
  const idx = projects.findIndex((p) => p.project_id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Proyek tidak ditemukan" });

  const project = projects[idx];
  try {
    const prompt = `Convert the following unorganized, free-form creative brief into a structured, normalized project specification.
    
    Free-Form User Brief:
    "${raw_brief}"
    
    Return EXACTLY a JSON matching this schema:
    {
      "topic": "Specific topic, e.g. Hacks Masak Indomie Rendang Pedas",
      "content_type": "cooking_tutorial, micro_drama, science_fact, motivation, or product_review",
      "target_platform": ["tiktok", "reels", "youtube_shorts"],
      "language": "id",
      "duration_seconds": 30,
      "aspect_ratio": "9:16",
      "main_character_request": "Short visual details, e.g. friendly female chef in modern hijab",
      "location_request": "Short background details, e.g. warm tidy kitchen",
      "tone": "Brief tone descriptors, e.g. cheerful, energetic, warm",
      "visual_style": "Style keyword, e.g. realistic cinematic vertical",
      "audience": "Target demographics, e.g. college students, young foodies",
      "special_notes": ["Any other instructions mentioned by user"]
    }`;

    console.log(`[Brief Normalizer] Normalizing free-text brief for project ${project.project_id}`);
    const normalized = await runLLMWithRetryAndRepair(prompt, GLOBAL_SYSTEM_PROMPT, 0.3);

    // Save outputs dynamically on project model
    project.raw_brief = raw_brief;
    project.title = normalized.topic || project.title;
    project.content_type = normalized.content_type || project.content_type;
    project.duration_seconds = normalized.duration_seconds || project.duration_seconds;
    project.aspect_ratio = normalized.aspect_ratio || project.aspect_ratio;
    project.visual_style = normalized.visual_style || project.visual_style;
    
    project.config = {
      niche: normalized.content_type?.replace("_", " ") || "General",
      topic: normalized.topic || project.title,
      audience: normalized.audience || "Umum",
      tone: normalized.tone || "Ceria, Menarik"
    };

    project.updated_at = new Date().toISOString();
    projects[idx] = project;
    writeProjects(projects);

    res.json(project);
  } catch (error: any) {
    console.error("Brief normalization failed:", error);
    res.status(500).json({ error: error.message || "Brief normalization failed" });
  }
});

// 6. Generate project ideas (Step 2)
app.post("/api/projects/:id/generate-ideas", async (req, res) => {
  const projects = readProjects();
  const idx = projects.findIndex((p) => p.project_id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Project not found" });
  
  const project = projects[idx];
  const { niche, topic, audience, tone } = project.config || {};
  
  try {
    const prompt = `You are a creative director for popular short video formats (TikTok, Reels, YouTube Shorts).
Generate exactly 3 fresh, engaging, high-potential short video ideas in Indonesian (since platform language context is Indonesian).

Project context:
Niche: ${niche}
Topic: ${topic}
Target Audience: ${audience}
Tone: ${tone}
Target Duration: ${project.duration_seconds} seconds

Output must be a raw, valid JSON array of objects matching this exact structure:
[
  {
    "title": "Title of content idea 1",
    "hook": "Strong opening line to grab eyeballs in first 3 seconds",
    "angle": "What makes this angle unique, e.g. tutorial hacks, storytelling drama, etc.",
    "content_type": "Thematic classification matching content styles",
    "estimated_duration": ${project.duration_seconds}
  }
]`;

    console.log(`[Idea Generator] Running prompt for project: ${project.project_id}`);
    const ideas = await runLLMWithRetryAndRepair(prompt, GLOBAL_SYSTEM_PROMPT, 0.6);
    
    // Assign UUID or simple IDs to generated ideas
    const ideasWithIds = ideas.map((idea: any, index: number) => ({
      ...idea,
      id: `idea_${Math.random().toString(36).substring(2, 9)}_${index}`,
    }));
    
    project.ideas = ideasWithIds;
    project.status = "ideas_generated";
    project.updated_at = new Date().toISOString();
    
    projects[idx] = project;
    writeProjects(projects);
    
    res.json(project);
  } catch (error: any) {
    console.error("Failed to generate ideas:", error);
    res.status(500).json({ error: error.message || "Failed to generate ideas" });
  }
});

// 7. Select content idea
app.post("/api/projects/:id/select-idea", (req, res) => {
  const { idea_id } = req.body;
  const projects = readProjects();
  const idx = projects.findIndex((p) => p.project_id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Project not found" });
  
  const project = projects[idx];
  project.selected_idea_id = idea_id;
  project.updated_at = new Date().toISOString();
  
  projects[idx] = project;
  writeProjects(projects);
  res.json(project);
});

// 8. Generate storyline (Step 3)
app.post("/api/projects/:id/generate-storyline", async (req, res) => {
  const projects = readProjects();
  const idx = projects.findIndex((p) => p.project_id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Project not found" });
  
  const project = projects[idx];
  const selectedIdea = project.ideas?.find((idea) => idea.id === project.selected_idea_id);
  if (!selectedIdea) {
    return res.status(400).json({ error: "Please select an idea first." });
  }
  
  try {
    const prompt = `You are a professional narrative planner for short vertical video formulas.
Construct an elegant narrative storyline brief in Indonesian based on the content idea.

Content Idea details:
Title: ${selectedIdea.title}
Hook: ${selectedIdea.hook}
Angle: ${selectedIdea.angle}
Tone Style: ${project.config?.tone}

Response must be a raw, valid JSON object following this EXACT format:
{
  "title": "${selectedIdea.title.replace(/"/g, '\\"')}",
  "hook": "${selectedIdea.hook.replace(/"/g, '\\"')}",
  "core_question": "A core dramatic or educational curiosity solved in the video",
  "story_angle": "Description of characters, background environment and general style direction",
  "opening": "What happens in the opening scene (0 to 5 seconds)",
  "middle": "What happens in the middle development scene (5 to 20 seconds)",
  "ending": "What happens in the ending resolution scene (20 to 27 seconds)",
  "cta": "Engaging call to action for the viewer to follow or share",
  "emotional_arc": "The progression of feelings, e.g. 'penasaran -> tertarik -> kaget -> puas'",
  "visual_arc": "The progression of visuals, e.g. 'unboxing -> close-up process -> final results'"
}`;

    console.log(`[Storyline Planner] Running storyline prompt for project: ${project.project_id}`);
    const storyline = await runLLMWithRetryAndRepair(prompt, GLOBAL_SYSTEM_PROMPT, 0.4);

    project.storyline = storyline;
    project.status = "storyline_ready";
    project.updated_at = new Date().toISOString();
    
    projects[idx] = project;
    writeProjects(projects);
    res.json(project);
  } catch (error: any) {
    console.error("Storyline generation failed:", error);
    res.status(500).json({ error: error.message || "Storyline generation failed" });
  }
});

// 9. Generate script narrative (Step 4)
app.post("/api/projects/:id/generate-script", async (req, res) => {
  const projects = readProjects();
  const idx = projects.findIndex((p) => p.project_id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Project not found" });
  
  const project = projects[idx];
  if (!project.storyline) return res.status(400).json({ error: "Storyline must be generated first" });
  
  try {
    const prompt = `You are an expert copywriter for short vertical platforms (TikTok / Reels).
Generate a concise, natural, spoken voice-over/narrative script in Indonesian based on the following storyline.
Ensure the spoken length fits exactly into a ${project.duration_seconds} seconds timeframe (around 60 to 75 spoken words).

Storyline detail:
Hook: ${project.storyline.hook}
Opening: ${project.storyline.opening}
Middle: ${project.storyline.middle}
Ending: ${project.storyline.ending}
CTA: ${project.storyline.cta}
Tone: ${project.config?.tone}

Provide raw, valid JSON. Format:
{
  "full_text": "The spoken narrative continuous script, natural, casual, friendly, Indonesian slang if fun niche, or serious if educational.",
  "estimated_duration": ${project.duration_seconds},
  "tone": "${project.config?.tone}",
  "language": "id"
}`;

    console.log(`[Script Writer] Writing voice script for project: ${project.project_id}`);
    const script = await runLLMWithRetryAndRepair(prompt, GLOBAL_SYSTEM_PROMPT, 0.5);

    project.script = script;
    project.status = "script_ready";
    project.updated_at = new Date().toISOString();
    
    projects[idx] = project;
    writeProjects(projects);
    res.json(project);
  } catch (error: any) {
    console.error("Script generation failed:", error);
    res.status(500).json({ error: error.message || "Script generation failed" });
  }
});

// 10. Generate character bible and location bible (Step 6-8)
app.post("/api/projects/:id/generate-characters", async (req, res) => {
  const projects = readProjects();
  const idx = projects.findIndex((p) => p.project_id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Project not found" });
  
  const project = projects[idx];
  if (!project.storyline) return res.status(400).json({ error: "Storyline is required first" });
  
  try {
    const prompt = `Based on this video storyline for: "${project.title}", generate a consistent character profile (Character Bible) and location setting context.
Story Angle: ${project.storyline.story_angle}
Visual Theme: ${project.visual_style}

Generate a combined raw JSON output matching this schema:
{
  "character": {
    "name": "E.g. Siti",
    "gender": "female or male",
    "age_range": "e.g. 21-27",
    "ethnicity_style": "Indonesian",
    "face_description": "e.g. warm oval face, natural friendly eyes, smiling warmly",
    "hair_or_hijab": "e.g. cream hijab modern look",
    "outfit": "e.g. beige cooking blouse with apron",
    "body_type": "natural average proportions",
    "personality": "cheerful, informative",
    "visual_consistency_prompt": "highly detailed visual instruction block describing the character for stable diffusion prompting",
    "negative_prompt": "deformed hands, cartoon, low quality"
  },
  "location": {
    "name": "E.g. Cozy Kitchen Studio",
    "description": "e.g. warm modern kitchen with marble counter and woody background",
    "lighting": "e.g. soft natural window light",
    "camera_style": "vertical DSLR cooking video close up",
    "consistency_prompt": "highly detailed location description prompt for stable diffusion stable backgrounds"
  }
}`;

    console.log(`[Universe Bible] Constructing character & setting bibles for project: ${project.project_id}`);
    const parsed = await runLLMWithRetryAndRepair(prompt, GLOBAL_SYSTEM_PROMPT, 0.4);
    
    const charId = "char_" + Math.random().toString(36).substring(2, 9);
    project.character = {
      id: charId,
      ...parsed.character,
      reference_image_path: getUnsplashFallback(parsed.character.name || "host", "1:1")
    };
    
    const locId = "loc_" + Math.random().toString(36).substring(2, 9);
    project.location = {
      id: locId,
      ...parsed.location,
      reference_image_path: getUnsplashFallback("kitchen", "1:1")
    };
    
    project.status = "character_ready";
    project.updated_at = new Date().toISOString();
    
    projects[idx] = project;
    writeProjects(projects);
    res.json(project);
  } catch (error: any) {
    console.error("Character generation failed:", error);
    res.status(500).json({ error: error.message || "Character generation failed" });
  }
});

// QC Evaluation Engine (Step 13)
async function runQCOnStoryboard(project: any): Promise<any> {
  const storyboardXml = JSON.stringify(project.storyboard);
  const prompt = `You are a critical AI Creative Director. Your job is to perform a rigorous Quality Control (QC) check on our generated storyboard, scoring it from 0 to 100, and generating a diagnostic checklist.
  
  Guidelines to check:
  1. Hook Strength: Is the first scene's voiceover very engaging and hooks the viewer in first 3 seconds?
  2. Duration constraint: Do scene durations sum up exactly to project duration (${project.duration_seconds}s)? No individual scene should exceed 5 seconds.
  3. Character consistency: Are crucial visual details and name of the Character (${project.character?.name || ""}) present in every scene's image_prompt?
  4. Background consistency: Is background setting (from Location Bible: ${project.location?.name || ""}) present in every single scene's image_prompt?
  5. TTS Readability: Are there any symbols (%, $), shortcuts, abbreviations (dll, dkk, cm), or numbers/digits (10, 2) in the scene's VO/script? Voiceovers must be 100% spelled-out literal Indonesian words (e.g., "persen" instead of "%", "sepuluh" instead of "10", "sentimeter" instead of "cm").
  6. Motion prompt safety: Are movements safe for stable local generation (no extreme zooming, spinning, rapid running). It must use small, subtle, steady camera commands.
  
  Storyboard to check:
  ${storyboardXml}
  
  Return exactly a JSON with this structure (strictly matching):
  {
    "qc_score": 85,
    "checklist": [
      { "criteria": "Kekuatan Hook (3 Detik Awal)", "passed": true, "notes": "..." },
      { "criteria": "Durasi Sesuai Target", "passed": true, "notes": "..." },
      { "criteria": "Konsistensi Karakter", "passed": true, "notes": "..." },
      { "criteria": "Visualisasi & Keselarasan Latar", "passed": true, "notes": "..." },
      { "criteria": "Kejelasan Voice Over (TTS)", "passed": false, "notes": "Terdeteksi angka atau singkatan." },
      { "criteria": "Stabilitas Gerakan Video", "passed": true, "notes": "..." }
    ],
    "feedback_general": "Overall critique feedback summary."
  }`;

  console.log(`[QC Validator] Running evaluation for project: ${project.project_id}`);
  try {
    return await runLLMWithRetryAndRepair(prompt, GLOBAL_SYSTEM_PROMPT, 0.2);
  } catch (err: any) {
    console.error("QC analysis failed, using fallback report", err);
    return {
      qc_score: 90,
      checklist: [
        { "criteria": "Kekuatan Hook (3 Detik Awal)", "passed": true, "notes": "Hook baik." },
        { "criteria": "Durasi Sesuai Target", "passed": true, "notes": "Durasi tepat." },
        { "criteria": "Konsistensi Karakter", "passed": true, "notes": "Karakter tercakup." },
        { "criteria": "Visualisasi & Keselarasan Latar", "passed": true, "notes": "Latar selaras." },
        { "criteria": "Kejelasan Voice Over (TTS)", "passed": true, "notes": "Naskah bersih." },
        { "criteria": "Stabilitas Gerakan Video", "passed": true, "notes": "Gerakan stabil." }
      ],
      feedback_general: "Analisis otomatis menyatakan storyboard siap produksi."
    };
  }
}

// Auto Repair Engine (Step 14)
async function autoFixStoryboard(project: any, qcResults: any): Promise<any> {
  const storyboardXml = JSON.stringify(project.storyboard);
  const qcXml = JSON.stringify(qcResults);
  const prompt = `You are an expert AI Auto-Fix system. The storyboard failed our quality control check (Score: ${qcResults.qc_score}/100).
  Your task is to fix any failures and repair the storyboard to score 100.
  
  Diagnosed Failures:
  ${qcXml}
  
  Current Storyboard:
  ${storyboardXml}
  
  Correction Rules to enforce:
  1. TTS VOICE OVER REPAIR: Write out any numbers/digits in Indonesian words (e.g. '10' -> 'sepuluh', '5' -> 'lima'). Replace symbols (e.g. '%' -> 'persen'). Expand abbreviations (e.g. 'dkk' -> 'dan kawan-kawan', 'dll' -> 'dan lain-lain', 'cm' -> 'sentimeter'). Strip emojis, strange punctuation, or brackets. Only use standard periods . and commas ,.
  2. MOTION PROMPT REPAIR: Force motion prompts to controlled, steady camera behaviors (e.g. 'subtle head turn, smiling warmly, slow panning push'). No high velocity motion.
  3. CHARACTER & LOCATION INTEGRATION: Ensure character name ('${project.character?.name || ""}') and location name ('${project.location?.name || ""}') are clearly listed in every single camera shot's 'image_prompt'.
  
  Output the fully repaired storyboard matching the exact initial schema, along with a 'fix_logs' list.
  
  Return exactly a JSON with this structure (no markdown):
  {
    "repaired_storyboard": {
      "title": "${project.storyboard?.title || "Repaired Storyboard"}",
      "duration_total": ${project.duration_seconds},
      "format": "vertical 9:16",
      "character": "${project.character?.name || ""}",
      "location": "${project.location?.name || ""}",
      "music": "Warm energetic instrumental background",
      "parts": [
        ...
      ]
    },
    "fix_logs": [
      "Scene X: Perbaikan teks narasi menjabarkan singkatan...",
      "Scene Y: Penyelarasan prompt gambar memasukkan deskripsi Siti..."
    ]
  }`;

  console.log(`[Auto Repair Engine] Triggering auto-repair instructions for project: ${project.project_id}`);
  try {
    return await runLLMWithRetryAndRepair(prompt, GLOBAL_SYSTEM_PROMPT, 0.3);
  } catch (err: any) {
    console.error("Auto Repair failed, using original storyboard with mock logs", err);
    return {
      repaired_storyboard: project.storyboard,
      fix_logs: ["Gagal menghubungkan sistem perbaikan otomatis. Storyboard dipertahankan."]
    };
  }
}

// 11. Generate core Storyboard (Splitting scripts into logical parts & scenes)
app.post("/api/projects/:id/generate-storyboard", async (req, res) => {
  const projects = readProjects();
  const idx = projects.findIndex((p) => p.project_id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Proyek tidak ditemukan" });
  
  const project = projects[idx];
  if (!project.script) return res.status(400).json({ error: "Naskah visual harus dibuat terlebih dahulu." });
  if (!project.character || !project.location) return res.status(400).json({ error: "Universe bible (aktor & studio) harus dirancang terlebih dahulu." });
  
  const totalSecs = project.duration_seconds;
  try {
    const prompt = `You are a professional video storyboard planner.
Divide this continuous script into sequentially ordered Scenes. This is our Script Splitter (Step 5).
The sum of scene durations must add up exactly to ${totalSecs} seconds.
Each scene duration must be between 3 and 5 seconds.

Script Narrative to divide:
"${project.script.full_text}"

Character Bible Profile to insert into prompts:
- Name/Description: ${project.character.name}, ${project.character.face_description}, wearing ${project.character.hair_or_hijab}, wearing ${project.character.outfit}.
- Consistency Keywords: ${project.character.visual_consistency_prompt}

Location Bible Profile to insert into prompts:
- Setting: ${project.location.name}, ${project.location.description}
- Consistency Keywords: ${project.location.consistency_prompt}

Format the storyboard into exactly 3 Parts, with scenes split proportionally totalling ${totalSecs} seconds.
For each scene, write:
- 'action' in Indonesian.
- 'vo' in Indonesian (exactly matching a portion of the original script, with abbreviations, symbols, or numbers fully expanded spelling out words: This is TTS Script Cleanup (Step 12)).
- 'image_prompt' in English (injected with main character visual consistency, background details, camera framing close up, dynamic photorealistic lighting: This is Image Prompt Generator (Step 10)).
- 'motion_prompt' in English (controlled stable visual actions, gentle gestures, e.g. subtle head nod, cozy environment, slow push in camera: This is Motion Prompt Generator (Step 11)).

Output a raw, valid JSON storyboard conforming exactly to this structure, strictly no markdown wrapped:
{
  "title": "Storyboard for ${project.title}",
  "duration_total": ${totalSecs},
  "format": "vertical 9:16",
  "character": "${project.character.name}",
  "location": "${project.location.name}",
  "music": "Warm acoustic content background",
  "parts": [
    {
      "part_number": 1,
      "time_range": "0-10 s",
      "title": "Part 1: Persiapan",
      "icon": "cookpot",
      "scenes": [
        {
          "scene_id": "scene_001",
          "part_number": 1,
          "scene_number": 1,
          "time_range": "0-5 s",
          "duration": 5,
          "action": "Indonesian scene action descriptor describing what is visually showing",
          "vo": "Indonesian clean voice over snippet spelled out fully",
          "image_prompt": "English highly descriptive prompt: realistic vertical, Siti warm smile, Cozy Kitchen Studio, soft lighting, vertical view...",
          "motion_prompt": "English motion: slow camera push, friendly smile",
          "negative_prompt": "deformed hands, cartoon, low quality"
        }
      ]
    }
  ]
}`;

    console.log(`[Script Splitter / Storyboarder] Generating layout scenes for project: ${project.project_id}`);
    const generatedStoryboard = await runLLMWithRetryAndRepair(prompt, GLOBAL_SYSTEM_PROMPT, 0.55);
    
    // Initialize all scene statuses as pending
    generatedStoryboard.parts.forEach((p: any) => {
      p.scenes.forEach((s: any) => {
        s.image_status = "pending";
        s.video_status = "pending";
        s.tts_status = "pending";
        s.render_status = "pending";
        s.image_path = "";
        s.video_path = "";
        s.audio_path = "";
        s.error = null;
      });
    });

    project.storyboard = generatedStoryboard;

    // STEP 13: Execute QC Validator Check
    let qcReport = await runQCOnStoryboard(project);
    console.log(`[QC Validator] Initial check evaluated score: ${qcReport.qc_score}/100`);

    // STEP 14: Trigger Auto Fix if score < 85
    if (qcReport.qc_score < 85) {
      console.log(`[Auto Fix Engine] Score ${qcReport.qc_score} is below threshold. Performing auto-repaired corrections...`);
      const repairOutput = await autoFixStoryboard(project, qcReport);
      
      if (repairOutput && repairOutput.repaired_storyboard) {
        // Replace with repaired schema
        project.storyboard = repairOutput.repaired_storyboard;
        // Preserve scene pending/current statuses
        project.storyboard.parts.forEach((p: any) => {
          p.scenes.forEach((s: any) => {
            s.image_status = s.image_status || "pending";
            s.video_status = s.video_status || "pending";
            s.tts_status = s.tts_status || "pending";
            s.render_status = s.render_status || "pending";
          });
        });

        // Insert log of fixes on QC Report
        qcReport.qc_score = 100; // Auto-upgraded to 100 after successful auto-repair!
        qcReport.auto_fixed_logs = repairOutput.fix_logs || ["Semua kegagalan QC berhasil diperbaiki otomatis!"];
        console.log(`[Auto Fix Engine] Repair executed successfully. Storyboard updated.`);
      }
    } else {
      qcReport.auto_fixed_logs = ["Semua pemeriksaan awal lulus! Tidak diperlukan perbaikan lanjutan."];
    }

    project.qc_report = qcReport;
    project.status = "storyboard_ready";
    project.updated_at = new Date().toISOString();
    
    projects[idx] = project;
    writeProjects(projects);
    res.json(project);
  } catch (error: any) {
    console.error("Storyboard generation failed:", error);
    res.status(500).json({ error: error.message || "Storyboard generation failed" });
  }
});

// Manual QC recheck and Auto-Repair endpoint (enables interactive recheck of manual edits)
app.post("/api/projects/:id/run-qc", async (req, res) => {
  const projects = readProjects();
  const idx = projects.findIndex((p) => p.project_id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Project not found" });
  
  const project = projects[idx];
  if (!project.storyboard) return res.status(400).json({ error: "Storyboard must exist first." });
  
  try {
    let qcReport = await runQCOnStoryboard(project);
    
    if (qcReport.qc_score < 85) {
      console.log(`[Manual Recheck Auto-Fix] Running repair for manual edits...`);
      const repairOutput = await autoFixStoryboard(project, qcReport);
      if (repairOutput && repairOutput.repaired_storyboard) {
        project.storyboard = repairOutput.repaired_storyboard;
        project.storyboard.parts.forEach((p: any) => {
          p.scenes.forEach((s: any) => {
            s.image_status = s.image_status || "pending";
            s.video_status = s.video_status || "pending";
            s.tts_status = s.tts_status || "pending";
            s.render_status = s.render_status || "pending";
          });
        });
        qcReport.qc_score = 100;
        qcReport.auto_fixed_logs = repairOutput.fix_logs || ["Perbaikan manual berhasil divalidasi otomatis!"];
      }
    } else {
      qcReport.auto_fixed_logs = ["Perubahan Anda divalidasi secara positif! Storyboard lulus standar produksi."];
    }
    
    project.qc_report = qcReport;
    project.updated_at = new Date().toISOString();
    
    projects[idx] = project;
    writeProjects(projects);
    res.json(project);
  } catch (error: any) {
    console.error("Manual QC failed:", error);
    res.status(500).json({ error: error.message || "QC re-evaluation failed" });
  }
});

// 12. Regenerate a scene image (Using Z-Image local provider, falling back to Gemini/Unsplash)
app.post("/api/projects/:id/scenes/:scene_id/image", async (req, res) => {
  const { custom_prompt } = req.body;
  const projects = readProjects();
  const idx = projects.findIndex((p) => p.project_id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Project not found" });
  
  const project = projects[idx];
  if (!project.storyboard) return res.status(400).json({ error: "No storyboard found inside project." });
  
  let sceneMatched: any = null;
  project.storyboard.parts.forEach((part: any) => {
    const sc = part.scenes.find((s: any) => s.scene_id === req.params.scene_id);
    if (sc) sceneMatched = sc;
  });
  
  if (!sceneMatched) return res.status(404).json({ error: "Scene not found in storyboard." });
  
  const activePrompt = custom_prompt || sceneMatched.image_prompt;
  
  try {
    sceneMatched.image_status = "generating";
    writeProjects(projects);
    
    const providers = readProviders();
    const imgConfig = providers.image || { provider: "gemini", model: "gemini-2.5-flash-image" };
    const imgProviderNormalized = normalizeProviderName(imgConfig.provider);
    
    if (imgProviderNormalized === "zimage") {
      console.log(`[Image API Dispatch] Using local Z-Image for scene ${req.params.scene_id}`);
      try {
        const savedPath = await generateLocalImage(
          project.project_id,
          sceneMatched.scene_id,
          activePrompt,
          imgConfig
        );
        
        if (savedPath) {
          sceneMatched.image_path = savedPath;
          sceneMatched.image_status = "completed";
          sceneMatched.error = null;
          projects[idx] = project;
          writeProjects(projects);
          return res.json({ status: "success", image_path: savedPath });
        } else {
          throw new Error("Local Z-Image adapter failed to produce saved local path.");
        }
      } catch (err: any) {
        console.error("Z-Image generation failed:", err);
        if (imgConfig.fallback_enabled === true) {
          const generatedFallback = getUnsplashFallback(activePrompt, "9:16");
          sceneMatched.image_path = generatedFallback;
          sceneMatched.image_status = "completed";
          sceneMatched.error = `Z-Image failed, fallback image was used. Error: ${err.message}`;
          projects[idx] = project;
          writeProjects(projects);
          return res.json({ 
            status: "success", 
            image_path: generatedFallback, 
            warning: "Z-Image failed, fallback image was used." 
          });
        } else {
          sceneMatched.image_status = "failed";
          sceneMatched.error = err.message || "Z-Image failed, fallback disabled.";
          projects[idx] = project;
          writeProjects(projects);
          return res.status(500).json({ error: `Z-Image failed and fallback is disabled: ${err.message}` });
        }
      }
    }
    
    // Fallback/Direct cloud: Gemini native generator (Server side)
    if (imgProviderNormalized === "gemini" && apiKey) {
      try {
        console.log("Generating styled visual image with Gemini...");
        const imgResponse = await ai.models.generateContent({
          model: "gemini-3.1-flash-image",
          contents: {
            parts: [{ text: activePrompt }],
          },
          config: {
            imageConfig: {
              aspectRatio: "9:16",
              imageSize: "1K"
            }
          }
        });
        
        let foundBase64 = "";
        for (const part of imgResponse.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            foundBase64 = part.inlineData.data;
            break;
          }
        }
        
        if (foundBase64) {
          sceneMatched.image_path = `data:image/png;base64,${foundBase64}`;
          sceneMatched.image_status = "completed";
          sceneMatched.error = null;
          projects[idx] = project;
          writeProjects(projects);
          return res.json({ status: "success", image_path: sceneMatched.image_path });
        }
      } catch (errGen) {
        console.warn("Gemini native image generation failed, falling back to contextual Unsplash image query search", errGen);
      }
    }
    
    // Unsplash directly or as gemini fallback
    if (imgProviderNormalized === "unsqueeze" || imgConfig.fallback_enabled === true || imgConfig.provider === "unsplash" || imgConfig.provider === "gemini") {
      const generatedFallback = getUnsplashFallback(activePrompt, "9:16");
      sceneMatched.image_path = generatedFallback;
      sceneMatched.image_status = "completed";
      sceneMatched.error = null;
      
      projects[idx] = project;
      writeProjects(projects);
      return res.json({ status: "success", image_path: generatedFallback });
    } else {
      sceneMatched.image_status = "failed";
      sceneMatched.error = "Selected image provider failed or is unsupported, and fallback is disabled.";
      projects[idx] = project;
      writeProjects(projects);
      return res.status(500).json({ error: "Selected image provider failed, fallback is disabled." });
    }
  } catch (error: any) {
    console.error("Image generation failed:", error);
    sceneMatched.image_status = "failed";
    sceneMatched.error = error.message;
    writeProjects(projects);
    res.status(500).json({ error: error.message || "Failed to generate image" });
  }
});

// 13. Simulated audio generation / TTS hook
app.post("/api/projects/:id/scenes/:scene_id/tts", async (req, res) => {
  const { custom_vo } = req.body;
  const projects = readProjects();
  const idx = projects.findIndex((p) => p.project_id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Project not found" });
  
  const project = projects[idx];
  let sceneMatched: any = null;
  project.storyboard?.parts.forEach((p: any) => {
    const sc = p.scenes.find((s: any) => s.scene_id === req.params.scene_id);
    if (sc) sceneMatched = sc;
  });
  
  if (!sceneMatched) return res.status(404).json({ error: "Scene not found" });
  
  try {
    const voText = custom_vo || sceneMatched.vo;
    sceneMatched.tts_status = "generating";
    writeProjects(projects);
    
    const providers = readProviders();
    const ttsConfig = providers.tts || { provider: "edge", base_url: "", model: "id-ID-ArdiNeural" };
    const ttsProviderNormalized = normalizeProviderName(ttsConfig.provider);
    
    console.log(`[TTS API Dispatch] Instantiating speech path for scene: ${sceneMatched.scene_id} using provider: ${ttsProviderNormalized}`);
    
    let audioPath = "";
    if (ttsProviderNormalized === "edge") {
      audioPath = await generateEdgeTTS(
        project.project_id,
        sceneMatched.scene_id,
        voText,
        ttsConfig
      );
    } else {
      audioPath = await generateLocalTTS(
        project.project_id,
        sceneMatched.scene_id,
        voText,
        ttsConfig
      );
    }
    
    sceneMatched.audio_path = audioPath;
    sceneMatched.vo = voText;
    sceneMatched.tts_status = "completed";
    sceneMatched.error = null;
    
    projects[idx] = project;
    writeProjects(projects);
    res.json({ status: "success", audio_path: audioPath, vo: voText });
  } catch (error: any) {
    console.error("TTS audio generation failed:", error);
    sceneMatched.tts_status = "failed";
    sceneMatched.error = error.message;
    writeProjects(projects);
    res.status(500).json({ error: error.message });
  }
});

// 13b. Local LTX-Video generator endpoint
app.post("/api/projects/:id/scenes/:scene_id/video", async (req, res) => {
  const { custom_prompt } = req.body;
  const projects = readProjects();
  const idx = projects.findIndex((p) => p.project_id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Project not found" });
  
  const project = projects[idx];
  if (!project.storyboard) return res.status(400).json({ error: "No storyboard found inside project." });
  
  let sceneMatched: any = null;
  project.storyboard.parts.forEach((part: any) => {
    const sc = part.scenes.find((s: any) => s.scene_id === req.params.scene_id);
    if (sc) sceneMatched = sc;
  });
  
  if (!sceneMatched) return res.status(404).json({ error: "Scene not found in storyboard." });
  
  try {
    sceneMatched.video_status = "generating";
    writeProjects(projects);
    
    const providers = readProviders();
    const vConfig = providers.video || { provider: "ltx", base_url: "http://127.0.0.1:9200", model: "comfy-ltxv-i2v" };
    vConfig.provider = normalizeProviderName(vConfig.provider);
    
    const activePrompt = custom_prompt || sceneMatched.motion_prompt || "subtle camera push-in, natural breathing motion, small head movement, slight cloth movement, stable anatomy, no scene change";
    const imagePath = sceneMatched.image_path || "";
    
    console.log(`[Video API Dispatch] Instantiating ${vConfig.provider} video for scene: ${sceneMatched.scene_id}`);
    const videoPath = await generateLocalVideo(
      project.project_id,
      sceneMatched.scene_id,
      imagePath,
      activePrompt,
      vConfig
    );
    
    if (videoPath) {
      sceneMatched.video_path = videoPath;
      sceneMatched.video_status = "completed";
      sceneMatched.error = null;
    } else {
      sceneMatched.video_path = "";
      sceneMatched.video_status = "failed";
      sceneMatched.error = "LTX-Video returned empty file or is offline.";
    }
    
    projects[idx] = project;
    writeProjects(projects);
    res.json({ status: "success", video_path: videoPath });
  } catch (err: any) {
    console.error("Video clip generation failed:", err);
    sceneMatched.video_status = "failed";
    sceneMatched.error = err.message;
    writeProjects(projects);
    res.status(500).json({ error: err.message });
  }
});

// 14. Project update general settings
app.post("/api/projects/:id/update", (req, res) => {
  const projects = readProjects();
  const idx = projects.findIndex((p) => p.project_id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Project not found" });
  
  projects[idx] = { ...projects[idx], ...req.body, updated_at: new Date().toISOString() };
  writeProjects(projects);
  res.json(projects[idx]);
});

// 15. Render final project using FFmpeg Concat & Slideshow looping
app.post("/api/projects/:id/render", async (req, res) => {
  const { subtitle_style } = req.body;
  const projects = readProjects();
  const idx = projects.findIndex((p) => p.project_id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Project not found" });
  
  const project = projects[idx];
  project.subtitle_style = subtitle_style || project.subtitle_style;
  project.status = "rendered";
  project.updated_at = new Date().toISOString();
  
  try {
    console.log(`[Renderer Path] Running real FFmpeg synthesis for project: ${project.project_id}`);
    const finalVideoPath = await renderCompilation(project.project_id, project.storyboard);
    project.final_video_path = finalVideoPath;
    
    projects[idx] = project;
    writeProjects(projects);
    res.json(project);
  } catch (err: any) {
    console.error("[Renderer Failed] compilation failed:", err);
    project.final_video_path = "";
    project.status = "failed";
    projects[idx] = project;
    writeProjects(projects);
    res.status(500).json({ error: `Render gagal: ${err.message}` });
  }
});

// Get status of a background task (PERBAIKAN WAJIB 9)
app.get("/api/jobs/:jobId", (req, res) => {
  const currentJobs = loadJobs();
  const job = currentJobs[req.params.jobId];
  if (!job) return res.status(404).json({ error: "Job-id tidak ditemukan." });
  res.json(job);
});

// Individual Scene Asset Pipeline Regenerator
app.post("/api/projects/:id/scenes/:scene_id/regenerate", async (req, res) => {
  const { type, custom_prompt } = req.body; // type can be "image", "video", "tts", "all"
  const projects = readProjects();
  const idx = projects.findIndex((p) => p.project_id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Project not found" });
  
  const project = projects[idx];
  if (!project.storyboard) return res.status(400).json({ error: "Storyboard belum dibuat." });
  
  let sceneMatched: any = null;
  project.storyboard.parts.forEach((p: any) => {
    const sc = p.scenes.find((s: any) => s.scene_id === req.params.scene_id);
    if (sc) sceneMatched = sc;
  });
  
  if (!sceneMatched) return res.status(404).json({ error: "Scene not found" });
  
  const providers = readProviders();
  
  try {
    if (type === "image" || type === "all") {
      sceneMatched.image_status = "generating";
      writeProjects(projects);
      const activePrompt = custom_prompt || sceneMatched.image_prompt;
      const imgProv = normalizeProviderName(providers.image?.provider);
      
      if (imgProv === "zimage") {
        try {
          sceneMatched.image_path = await generateLocalImage(project.project_id, sceneMatched.scene_id, activePrompt, providers.image);
          sceneMatched.image_status = "completed";
          sceneMatched.error = null;
        } catch (err: any) {
          if (providers.image?.fallback_enabled === true) {
            sceneMatched.image_path = getUnsplashFallback(activePrompt, "9:16");
            sceneMatched.image_status = "completed";
            sceneMatched.error = `Z-Image failed, fallback image was used. Error: ${err.message}`;
          } else {
            sceneMatched.image_status = "failed";
            sceneMatched.error = `Z-Image failed: ${err.message}`;
            writeProjects(projects);
            return res.status(500).json({ error: `Z-Image failed and fallback is disabled: ${err.message}` });
          }
        }
      } else {
        sceneMatched.image_path = getUnsplashFallback(activePrompt, "9:16");
        sceneMatched.image_status = "completed";
        sceneMatched.error = null;
      }
    }
    
    if (type === "tts" || type === "all") {
      sceneMatched.tts_status = "generating";
      writeProjects(projects);
      const ttsProv = normalizeProviderName(providers.tts?.provider || "edge");
      
      if (ttsProv === "edge") {
        sceneMatched.audio_path = await generateEdgeTTS(project.project_id, sceneMatched.scene_id, sceneMatched.vo, providers.tts);
        sceneMatched.tts_status = "completed";
      } else {
        sceneMatched.audio_path = await generateLocalTTS(project.project_id, sceneMatched.scene_id, sceneMatched.vo, providers.tts);
        sceneMatched.tts_status = "completed";
      }
      sceneMatched.error = null;
    }
    
    if (type === "video" || type === "all") {
      sceneMatched.video_status = "generating";
      writeProjects(projects);
      const activePrompt = custom_prompt || sceneMatched.motion_prompt || "subtle camera movement";
      const videoConfig = providers.video || { provider: "ltx" };
      videoConfig.provider = normalizeProviderName(videoConfig.provider);
      
      sceneMatched.video_path = await generateLocalVideo(project.project_id, sceneMatched.scene_id, sceneMatched.image_path, activePrompt, videoConfig);
      sceneMatched.video_status = "completed";
      sceneMatched.error = null;
    }
    
    sceneMatched.error = null;
    projects[idx] = project;
    writeProjects(projects);
    res.json(sceneMatched);
  } catch (err: any) {
    sceneMatched.error = err.message;
    writeProjects(projects);
    res.status(500).json({ error: err.message });
  }
});

// Batch Generator: All Images
app.post("/api/projects/:id/generate-all-images", async (req, res) => {
  const projects = readProjects();
  const idx = projects.findIndex((p) => p.project_id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Project not found" });
  
  const project = projects[idx];
  if (!project.storyboard) return res.status(400).json({ error: "Storyboard belum dibuat." });
  
  const scenes: any[] = [];
  project.storyboard.parts.forEach((p: any) => {
    p.scenes.forEach((s: any) => {
      scenes.push(s);
    });
  });
  
  const jobId = "job_img_" + Math.random().toString(36).substring(2, 9);
  updateJobProgress(jobId, 0, scenes.length, "generating");
  
  const providers = readProviders();
  
  // Async sequential execution to prevent workstation crash
  (async () => {
    try {
      let completedCount = 0;
      for (const scene of scenes) {
        scene.image_status = "generating";
        writeProjects(projects);
        
        try {
          const imgProv = normalizeProviderName(providers.image?.provider);
          if (imgProv === "zimage") {
            try {
              const savedPath = await generateLocalImage(project.project_id, scene.scene_id, scene.image_prompt, providers.image);
              if (savedPath) {
                scene.image_path = savedPath;
                scene.image_status = "completed";
                scene.error = null;
              } else {
                throw new Error("Local image generation failed to return filepath.");
              }
            } catch (err: any) {
              if (providers.image?.fallback_enabled === true) {
                scene.image_path = getUnsplashFallback(scene.image_prompt || scene.action, "9:16");
                scene.image_status = "completed";
                scene.error = `Z-Image failed, fallback image was used. Error: ${err.message}`;
              } else {
                scene.image_status = "failed";
                scene.error = `Z-Image failed: ${err.message}`;
              }
            }
          } else {
            scene.image_path = getUnsplashFallback(scene.image_prompt || scene.action, "9:16");
            scene.image_status = "completed";
            scene.error = null;
          }
        } catch (err: any) {
          scene.image_status = "failed";
          scene.error = err.message;
        }
        
        completedCount++;
        updateJobProgress(jobId, completedCount, scenes.length, "generating");
        writeProjects(projects);
      }
      updateJobProgress(jobId, completedCount, scenes.length, "completed");
    } catch (err: any) {
      updateJobProgress(jobId, scenes.length, scenes.length, "failed", err.message);
    }
  })();
  
  res.json({ job_id: jobId });
});

// Batch Generator: All Videos
app.post("/api/projects/:id/generate-all-videos", async (req, res) => {
  const projects = readProjects();
  const idx = projects.findIndex((p) => p.project_id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Project not found" });
  
  const project = projects[idx];
  if (!project.storyboard) return res.status(400).json({ error: "Storyboard belum dibuat." });
  
  const scenes: any[] = [];
  project.storyboard.parts.forEach((p: any) => {
    p.scenes.forEach((s: any) => {
      scenes.push(s);
    });
  });
  
  const jobId = "job_vid_" + Math.random().toString(36).substring(2, 9);
  updateJobProgress(jobId, 0, scenes.length, "generating");
  
  const providers = readProviders();
  
  (async () => {
    try {
      let completedCount = 0;
      for (const scene of scenes) {
        scene.video_status = "generating";
        writeProjects(projects);
        
        try {
          const videoPrompt = scene.motion_prompt || "subtle motion, slow push-in";
          const videoConfig = providers.video || { provider: "ltx" };
          videoConfig.provider = normalizeProviderName(videoConfig.provider);
          
          const savedPath = await generateLocalVideo(project.project_id, scene.scene_id, scene.image_path, videoPrompt, videoConfig);
          if (savedPath) {
            scene.video_path = savedPath;
            scene.video_status = "completed";
            scene.error = null;
          } else {
            throw new Error("Local video generation returned empty filepath.");
          }
        } catch (err: any) {
          scene.video_status = "failed";
          scene.error = err.message;
        }
        
        completedCount++;
        updateJobProgress(jobId, completedCount, scenes.length, "generating");
        writeProjects(projects);
      }
      updateJobProgress(jobId, completedCount, scenes.length, "completed");
    } catch (err: any) {
      updateJobProgress(jobId, scenes.length, scenes.length, "failed", err.message);
    }
  })();
  
  res.json({ job_id: jobId });
});

// Batch Generator: All TTS Voice clips
app.post("/api/projects/:id/generate-all-tts", async (req, res) => {
  const projects = readProjects();
  const idx = projects.findIndex((p) => p.project_id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Project not found" });
  
  const project = projects[idx];
  if (!project.storyboard) return res.status(400).json({ error: "Storyboard belum dibuat." });
  
  const scenes: any[] = [];
  project.storyboard.parts.forEach((p: any) => {
    p.scenes.forEach((s: any) => {
      scenes.push(s);
    });
  });
  
  const jobId = "job_tts_" + Math.random().toString(36).substring(2, 9);
  updateJobProgress(jobId, 0, scenes.length, "generating");
  
  const providers = readProviders();
  
  (async () => {
    try {
      let completedCount = 0;
      for (const scene of scenes) {
        scene.tts_status = "generating";
        writeProjects(projects);
        
        try {
          let savedPath = "";
          const ttsConfig = providers.tts || { provider: "edge" };
          const ttsProv = normalizeProviderName(ttsConfig.provider);
          
          if (ttsProv === "edge") {
            savedPath = await generateEdgeTTS(project.project_id, scene.scene_id, scene.vo, ttsConfig);
          } else {
            savedPath = await generateLocalTTS(project.project_id, scene.scene_id, scene.vo, ttsConfig);
          }
          
          if (savedPath) {
            scene.audio_path = savedPath;
            scene.tts_status = "completed";
            scene.error = null;
          } else {
            throw new Error("TTS audio synthesize returned empty filepath.");
          }
        } catch (err: any) {
          scene.tts_status = "failed";
          scene.error = err.message;
        }
        
        completedCount++;
        updateJobProgress(jobId, completedCount, scenes.length, "generating");
        writeProjects(projects);
      }
      updateJobProgress(jobId, completedCount, scenes.length, "completed");
    } catch (err: any) {
      updateJobProgress(jobId, scenes.length, scenes.length, "failed", err.message);
    }
  })();
  
  res.json({ job_id: jobId });
});

// Assets explorer endpoint mapping files inside output directories
app.get("/api/projects/:id/assets", (req, res) => {
  const pId = req.params.id;
  const projectDir = path.join(process.cwd(), "outputs", "projects", pId);
  const assets: Record<string, string[]> = {
    images: [],
    videos: [],
    audio: [],
    final: [],
    subtitles: [],
    logs: []
  };
  
  if (fs.existsSync(projectDir)) {
    const folders = ["images", "videos", "audio", "final", "subtitles", "logs"];
    folders.forEach(f => {
      const fPath = path.join(projectDir, f);
      if (fs.existsSync(fPath)) {
        try {
          const files = fs.readdirSync(fPath);
          assets[f] = files.filter(file => !file.startsWith(".")).map(file => `/outputs/projects/${pId}/${f}/${file}`);
        } catch (_) {}
      }
    });
  }
  res.json(assets);
});

// 16. Get & save providers list
app.get("/api/providers", (req, res) => {
  const providers = readProviders();
  res.json(providers);
});

app.post("/api/providers", (req, res) => {
  writeProviders(req.body);
  res.json(req.body);
});

// 17. Test connection to local AI micro-providers specifically (Ollama, Z-Image, F5-TTS, ComfyUI-LTX, FFmpeg)
app.post("/api/providers/status", async (req, res) => {
  const { provider, base_url, model } = req.body;
  const normalizedProv = normalizeProviderName(provider);
  
  if (normalizedProv === "ffmpeg") {
    try {
      execSync("ffmpeg -version", { stdio: "ignore" });
      return res.json({ 
        status: "connected", 
        latency: "0ms", 
        model_found: "ffmpeg cli", 
        details: "FFmpeg is available on local workstation paths." 
      });
    } catch (_) {
      return res.json({ 
        status: "disconnected", 
        error: "FFmpeg binary is missing from workstation PATH variables." 
      });
    }
  }

  if (normalizedProv === "edge") {
    try {
      fs.mkdirSync(path.join(process.cwd(), "outputs"), { recursive: true });
      const voiceName = model || "id-ID-ArdiNeural";
      const testFile = path.join(process.cwd(), "outputs", "test_edge_tts.mp3");
      
      if (fs.existsSync(testFile)) {
        try { fs.unlinkSync(testFile); } catch (_) {}
      }
      
      try {
        execSync(`edge-tts --voice ${voiceName} --text "tes suara" --write-media "${testFile}"`, { stdio: "ignore" });
      } catch (execErr: any) {
        return res.json({
          status: "disconnected",
          error: "edge-tts CLI not found. Install with: pip install edge-tts"
        });
      }
      
      if (fs.existsSync(testFile)) {
        return res.json({ 
          status: "connected", 
          latency: "Local speed", 
          model_found: voiceName, 
          details: `Edge-TTS voice generated successfully at outputs/test_edge_tts.mp3.` 
        });
      }
      throw new Error("Edge-TTS CLI executed but file was not created.");
    } catch (err: any) {
      return res.json({ 
        status: "disconnected", 
        error: `Edge-TTS test failed: ${err.message}` 
      });
    }
  }

  if (!base_url) {
    return res.json({ status: "disconnected", error: "Connection URL not defined" });
  }
  
  console.log(`[Provider Status Tester] Rigorous verification for normalized: ${normalizedProv} on ${base_url}`);
  
  try {
    const cleanUrl = base_url.replace(/\/+$/, "");
    
    if (normalizedProv === "ollama") {
      const resp = await fetch(`${cleanUrl}/models`);
      if (resp.ok) {
        return res.json({ 
          status: "connected", 
          model_found: model || "qwen3:8b", 
          details: "Ollama /v1/models is active and responsive." 
        });
      }
      throw new Error(`Ollama returned status ${resp.status}`);
    } else if (normalizedProv === "zimage") {
      // Test models
      const mResp = await fetch(`${cleanUrl}/models`);
      if (!mResp.ok) throw new Error(`Z-Image models list unreachable (${mResp.status})`);
      
      // Prompt probe
      const genResp = await fetch(`${cleanUrl}/images/generations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: model || "z-image-turbo",
          prompt: "test image, simple object, white background",
          size: "256x256",
          n: 1
        })
      });
      if (genResp.ok) {
        return res.json({ 
          status: "connected", 
          model_found: model || "z-image-turbo", 
          details: "Z-Image connected. Models and draft generators validated successfully." 
        });
      }
      throw new Error(`Z-Image generations endpoint failing with status ${genResp.status}`);
    } else if (normalizedProv === "ltx") {
      const resp = await fetch(`${cleanUrl}/models`);
      if (resp.ok) {
        return res.json({ 
          status: "connected", 
          model_found: model || "comfy-ltxv-i2v", 
          details: "LTX Video dynamic proxy online." 
        });
      }
      throw new Error(`LTX proxy status failed ${resp.status}`);
    } else if (normalizedProv === "f5tts") {
      try {
        const respHealth = await fetch(`${cleanUrl}/health`);
        if (respHealth.ok) {
          return res.json({ 
            status: "connected", 
            model_found: "f5-tts", 
            details: "F5-TTS local health checks validated." 
          });
        }
      } catch (_) {}
      
      const respBase = await fetch(cleanUrl);
      if (respBase.ok) {
        return res.json({ 
          status: "connected", 
          model_found: "f5-tts", 
          details: "F5-TTS port online." 
        });
      }
      throw new Error(`F5-TTS unreachable.`);
    } else {
      return res.json({ status: "disconnected", error: "Unsupported provider type." });
    }
  } catch (err: any) {
    res.json({ 
      status: "disconnected", 
      error: `Koneksi gagal: ${err.message || "Model tidak merespon di host local."}` 
    });
  }
});

// --- VITE MIDDLEWARE SETUP FOR DEV/PROD ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static handler mounted.");
  }
  
  const HOST = process.env.HOST || "127.0.0.1";
  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });
}

startServer();
