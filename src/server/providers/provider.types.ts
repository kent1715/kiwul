export interface LLMConfig {
  provider: "ollama" | "gemini";
  base_url: string;
  model: string;
  enabled?: boolean;
}

export interface ImageConfig {
  provider: "zimage" | "gemini" | "unsplash";
  base_url: string;
  model: string;
  enabled?: boolean;
  default_size?: string;
  steps?: number;
  cfg?: number;
}

export interface VideoConfig {
  provider: "ltx" | "ltx_comfy" | "gemini";
  base_url: string;
  model: string;
  enabled?: boolean;
  duration?: number;
  fps?: number;
  resolution?: string;
}

export interface TTSConfig {
  provider: "f5tts" | "edge" | "gemini";
  base_url: string;
  model: string;
  enabled?: boolean;
  voice?: string;
}

export interface RenderConfig {
  provider: "ffmpeg" | "simulated";
  enabled?: boolean;
  output_format?: "mp4" | "mkv";
}

export interface ProviderSettings {
  llm: LLMConfig;
  image: ImageConfig;
  video: VideoConfig;
  tts: TTSConfig;
  render: RenderConfig;
}
