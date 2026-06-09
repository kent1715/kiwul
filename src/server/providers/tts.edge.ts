import fs from "fs";
import path from "path";
import { execSync } from "child_process";

interface EdgeTTSConfig {
  model?: string; // e.g. "id-ID-ArdiNeural" or "id-ID-GadisNeural"
  voice?: string;
}

/**
 * Generates speech audio using edge-tts CLI tool
 */
export async function generateEdgeTTS(
  projectId: string,
  sceneId: string,
  text: string,
  config: EdgeTTSConfig
): Promise<string> {
  const relativePath = `outputs/projects/${projectId}/audio/${sceneId}.mp3`;
  const absolutePath = path.join(process.cwd(), relativePath);
  
  // Ensure target folder exists
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  
  const cleanText = text.trim();
  const voice = config.voice || config.model || "id-ID-ArdiNeural";
  
  console.log(`[Edge-TTS] Synthesizing text: "${cleanText.slice(0, 50)}..." using voice ${voice}`);
  
  try {
    execSync(`edge-tts --voice ${voice} --text "${cleanText.replace(/"/g, '\\"')}" --write-media "${absolutePath}"`, { stdio: "ignore" });
    if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).size > 0) {
      console.log(`[Edge-TTS CLI] Generated audio successfully: ${absolutePath}`);
      return `/${relativePath}`;
    }
    throw new Error("Generated file is empty or missing.");
  } catch (err: any) {
    console.error(`[Edge-TTS CLI Failed] ${err.message}`);
    throw new Error("edge-tts CLI not found. Install with: pip install edge-tts");
  }
}
