import fs from "fs";
import path from "path";
import { execSync } from "child_process";

interface EdgeTTSConfig {
  model?: string; // e.g. "id-ID-ArdiNeural" or "id-ID-GadisNeural"
  voice?: string;
}

/**
 * Generates speech audio using edge-tts CLI tool with aTranslate endpoint fallback
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
    // 1. Try to run real edge-tts CLI tool
    try {
      execSync(`edge-tts --voice ${voice} --text "${cleanText.replace(/"/g, '\\"')}" --write-media "${absolutePath}"`, { stdio: "ignore" });
      if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).size > 0) {
        console.log(`[Edge-TTS CLI] Generated audio successfully: ${absolutePath}`);
        return `/${relativePath}`;
      }
    } catch (cliErr: any) {
      console.warn(`[Edge-TTS CLI Failed] ${cliErr.message}. Falling back to translation endpoint.`);
    }

    // 2. Fallback step to Translation URL
    const language = "id"; // Default to Indonesian
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${language}&client=tw-ob&q=${encodeURIComponent(cleanText)}`;
    
    console.log(`[Edge-TTS Fallback] Downloading audio track from translation API`);
    const response = await fetch(ttsUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });
    
    if (!response.ok) {
      throw new Error(`TTS download failed with status code ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(absolutePath, buffer);
    console.log(`[Edge-TTS Fallback] Saved track to: ${absolutePath}`);
    return `/${relativePath}`;
  } catch (err: any) {
    console.error(`[Edge-TTS Fallback Error] ${err.message}. Building silent wav backup.`);
    
    // Write standard 1-second silent WAV as last resort backup (using wav extension)
    const silentWPath = absolutePath.replace(/\.mp3$/, ".wav");
    const header = Buffer.alloc(44);
    header.write("RIFF", 0);
    header.writeUInt32LE(36044, 4);
    header.write("WAVE", 8);
    header.write("fmt ", 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20); // Mono
    header.writeUInt16LE(1, 22); // Channel
    header.writeUInt32LE(8000, 24); // Sample rate
    header.writeUInt32LE(8000, 28); // Byte rate
    header.writeUInt16LE(1, 32); // Block align
    header.writeUInt16LE(8, 34); // Bits per sample
    header.write("data", 36);
    header.writeUInt32LE(36000, 40);
    
    const pcmBytes = Buffer.alloc(36000, 128); // Silence
    const wav = Buffer.concat([header, pcmBytes]);
    fs.writeFileSync(silentWPath, wav);
    
    return `/${relativePath.replace(/\.mp3$/, ".wav")}`;
  }
}
