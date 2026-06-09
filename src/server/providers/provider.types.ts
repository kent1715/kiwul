export interface LLMConfig {
  provider: "ollama" | "gemini" | string;
  base_url: string;
  model: string;
  enabled?: boolean;
}

export interface ImageConfig {
  provider: "zimage" | "gemini" | "unsplash" | string;
  base_url: string;
  model: string;
  enabled?: boolean;
  default_size?: string;
  steps?: number;
  cfg?: number;
  fallback_enabled?: boolean;
}

export interface VideoConfig {
  provider: "ltx" | "ltx_comfy" | "gemini" | string;
  base_url: string;
  model: string;
  enabled?: boolean;
  duration?: number;
  fps?: number;
  resolution?: string;
}

export interface TTSConfig {
  provider: "f5tts" | "edge" | "gemini" | string;
  base_url: string;
  model: string;
  enabled?: boolean;
  voice?: string;
}

export interface RenderConfig {
  provider: "ffmpeg" | "simulated" | string;
  enabled?: boolean;
  output_format?: "mp4" | "mkv" | string;
}

export interface ProviderSettings {
  llm: LLMConfig;
  image: ImageConfig;
  video: VideoConfig;
  tts: TTSConfig;
  render: RenderConfig;
}
