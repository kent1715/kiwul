import fs from "fs";
import path from "path";
import { execSync } from "child_process";

/**
 * Checks if ffmpeg is available in the shell environment path
 */
function isFFmpegAvailable(): boolean {
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Renders the final compilation video from storyboard scenes
 */
export async function renderCompilation(projectId: string, storyboard: any): Promise<string> {
  const finalDirRelative = `outputs/projects/${projectId}/final`;
  const finalDirAbsolute = path.join(process.cwd(), finalDirRelative);
  fs.mkdirSync(finalDirAbsolute, { recursive: true });
  
  const finalOutputFile = path.join(finalDirAbsolute, "final.mp4");
  
  // Flatten storyboard parts to easily get all scenes in order
  const scenes: any[] = [];
  storyboard.parts.forEach((part: any) => {
    part.scenes.forEach((scene: any) => {
      scenes.push(scene);
    });
  });
  
  if (scenes.length === 0) {
    throw new Error("No scenes found in the storyboard to compile.");
  }
  
  console.log(`[FFmpeg compiler] Compiling ${scenes.length} scenes for project ${projectId}...`);
  
  const ffmpegOk = isFFmpegAvailable();
  if (!ffmpegOk) {
    throw new Error("FFmpeg CLI is not found or not available in the host environment.");
  }
  
  // Safe temporary folder for intermediate clips
  const tempDir = path.join(process.cwd(), `outputs/temp_${projectId}_${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });
  
  try {
    const sceneClips: string[] = [];
    
    for (let index = 0; index < scenes.length; index++) {
      const scene = scenes[index];
      const clipOutPath = path.join(tempDir, `scene_${index}_clip.mp4`);
      
      // Determine inputs
      const imagePathRaw = scene.image_path || "";
      const videoPathRaw = scene.video_path || "";
      const audioPathRaw = scene.audio_path || "";
      
      const absoluteImgPath = imagePathRaw.startsWith("/") 
        ? path.join(process.cwd(), imagePathRaw.slice(1))
        : path.join(process.cwd(), imagePathRaw);
        
      const absoluteVidPath = videoPathRaw ? (
        videoPathRaw.startsWith("/") 
          ? path.join(process.cwd(), videoPathRaw.slice(1))
          : path.join(process.cwd(), videoPathRaw)
      ) : "";
      
      const absoluteAudPath = audioPathRaw ? (
        audioPathRaw.startsWith("/") 
          ? path.join(process.cwd(), audioPathRaw.slice(1))
          : path.join(process.cwd(), audioPathRaw)
      ) : "";
      
      const clipDuration = Number(scene.duration) || 3;
      
      console.log(`[FFmpeg Clip Builder] Scene ${index + 1}/${scenes.length}. Duration: ${clipDuration}s.`);
      
      // Build options based on what is available
      if (fs.existsSync(absoluteVidPath) && fs.existsSync(absoluteAudPath)) {
        // Option A: Video exists, Audio exists. Merge them!
        console.log(`[FFmpeg] Scene ${index + 1}: Combining real video + audio`);
        try {
          execSync(`ffmpeg -y -i "${absoluteVidPath}" -i "${absoluteAudPath}" -t ${clipDuration} -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 128k -ar 44100 -shortest "${clipOutPath}"`, { stdio: "ignore" });
        } catch (clipErr) {
          console.warn("[FFmpeg merge clip error], fallback to option B", clipErr);
        }
      }
      
      // Fallback clips if Option A fails or video is missing
      if (!fs.existsSync(clipOutPath)) {
        if (fs.existsSync(absoluteImgPath) && fs.existsSync(absoluteAudPath)) {
          // Option B: Loop Image + Audio
          console.log(`[FFmpeg] Scene ${index + 1}: Generating loop image slideshow + audio`);
          execSync(`ffmpeg -y -loop 1 -framerate 25 -i "${absoluteImgPath}" -i "${absoluteAudPath}" -t ${clipDuration} -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 128k -ar 44100 -shortest "${clipOutPath}"`, { stdio: "ignore" });
        } else if (fs.existsSync(absoluteImgPath)) {
          // Option C: Loop Image + silent Audio fallback
          console.log(`[FFmpeg] Scene ${index + 1}: Generating loop image slideshow + silent track`);
          execSync(`ffmpeg -y -loop 1 -framerate 25 -i "${absoluteImgPath}" -f lavfi -i anullsrc=r=44100:cl=mono -t ${clipDuration} -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest "${clipOutPath}"`, { stdio: "ignore" });
        } else {
          // Absolute last resort placeholder generator
          console.log(`[FFmpeg] Scene ${index + 1}: Generating black slate scene`);
          execSync(`ffmpeg -y -f lavfi -i color=c=black:s=768x1024:r=25 -f lavfi -i anullsrc=r=44100:cl=mono -t ${clipDuration} -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest "${clipOutPath}"`, { stdio: "ignore" });
        }
      }
      
      if (fs.existsSync(clipOutPath)) {
        sceneClips.push(clipOutPath);
      }
    }
    
    if (sceneClips.length === 0) {
      throw new Error("FFmpeg failed to compile individual scene clips.");
    }
    
    // Concat all intermediate MP4 files inside tempDir
    const concatListFile = path.join(tempDir, "concat_list.txt");
    const listContent = sceneClips.map(clip => `file '${clip.replace(/\\/g, "/")}'`).join("\n");
    fs.writeFileSync(concatListFile, listContent);
    
    console.log("[FFmpeg Joining] Concat list generated:\n", listContent);
    
    // Concat action
    execSync(`ffmpeg -y -f concat -safe 0 -i "${concatListFile}" -c copy "${finalOutputFile}"`, { stdio: "ignore" });
    
    console.log(`[FFmpeg Success] Final compiled output short compiled to: ${finalOutputFile}`);
    return `/${finalDirRelative}/final.mp4`;
  } catch (renderError: any) {
    console.error("[FFmpeg compiler error]", renderError);
    throw renderError;
  } finally {
    // Clear temp files
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (_) {}
  }
}
