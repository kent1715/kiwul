/**
 * Type declarations for Kiwul Content Studio
 */

export type AssetStatus = "pending" | "generating" | "running" | "completed" | "failed";

export type ProjectStatus =
  | "draft"
  | "ideas_generated"
  | "storyline_ready"
  | "script_ready"
  | "storyboard_ready"
  | "character_ready"
  | "images_ready"
  | "videos_ready"
  | "audio_ready"
  | "rendered"
  | "failed";

export interface ProviderSettings {
  provider: "gemini" | "ollama" | "zimage" | "f5tts" | "edge" | "ltx" | "ltx_comfy" | "ffmpeg" | string;
  base_url: string;
  model: string;
  voice?: string;
  api_key?: string;
  enabled?: boolean;
  default_size?: string;
  fallback_enabled?: boolean;
  duration?: number;
  fps?: number;
  resolution?: string;
  output_format?: string;
}

export interface ProviderRegistry {
  llm: ProviderSettings;
  image: ProviderSettings;
  tts: ProviderSettings;
  video: ProviderSettings;
}

export interface ProjectConfig {
  niche: string;
  topic: string;
  audience: string;
  tone: string;
  count?: number;
}

export interface ContentIdea {
  id: string;
  title: string;
  hook: string;
  angle: string;
  content_type: string;
  estimated_duration: number;
  conflict_or_value?: string;
  visual_potential?: string;
}

export interface Storyline {
  title: string;
  hook: string;
  core_question: string;
  story_angle: string;
  opening: string;
  middle: string;
  ending: string;
  cta: string;
  emotional_arc: string;
  visual_arc: string;
}

export interface ScriptNarrative {
  full_text: string;
  estimated_duration: number;
  tone: string;
  language: string;
}

export interface Scene {
  scene_id: string;
  part_number?: number;
  scene_number?: number;
  order?: number;
  time_range?: string;
  duration: number;

  action?: string;
  visual_description?: string;
  vo: string;

  image_prompt: string;
  negative_prompt?: string;
  motion_prompt: string;
  camera?: string;

  character_ids?: string[];
  location_id?: string;

  image_path?: string;
  video_path?: string;
  audio_path?: string;

  image_status?: AssetStatus;
  video_status?: AssetStatus;
  tts_status?: AssetStatus;
  render_status?: AssetStatus;
  status?: AssetStatus;

  error?: string | null;
}

export interface StoryboardPart {
  part_number: number;
  time_range: string;
  title: string;
  icon?: string;
  scenes: Scene[];
}

export interface Storyboard {
  title: string;
  duration_total: number;
  format: string;
  character: string;
  location: string;
  music: string;
  parts: StoryboardPart[];
}

export interface CharacterBible {
  id: string;
  name: string;
  gender: string;
  age_range: string;
  ethnicity_style: string;
  face_description: string;
  hair_or_hijab: string;
  outfit: string;
  body_type: string;
  personality: string;
  visual_consistency_prompt: string;
  reference_image_path?: string;
  negative_prompt?: string;
}

export interface LocationBible {
  id: string;
  name: string;
  description: string;
  lighting: string;
  camera_style: string;
  consistency_prompt: string;
  reference_image_path?: string;
}

export interface QCItem {
  criteria: string;
  passed: boolean;
  notes: string;
}

export interface QCReport {
  qc_score: number;
  checklist: QCItem[];
  auto_fixed_logs?: string[];
  feedback_general: string;
}

export interface Project {
  project_id: string;
  title: string;
  content_type: string;
  language: string;
  target_platform: string[];
  duration_seconds: number;
  aspect_ratio: string;
  resolution: string;
  visual_style: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  
  // Pipeline Data
  raw_brief?: string;
  config?: ProjectConfig;
  ideas?: ContentIdea[];
  selected_idea_id?: string;
  storyline?: Storyline;
  script?: ScriptNarrative;
  storyboard?: Storyboard;
  character?: CharacterBible;
  location?: LocationBible;
  qc_report?: QCReport;
  
  // Rendered properties
  final_video_path?: string;
  subtitle_style?: {
    font: string;
    font_size: number;
    position: string;
    background: boolean;
    max_words_per_line: number;
  };
}
