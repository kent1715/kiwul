import fs from "fs";
import path from "path";

interface VideoConfig {
  base_url: string;
  model: string;
}

function openAIEndpoint(baseUrl: string, endpointPath: string) {
  const clean = baseUrl.replace(/\/+$/, "");
  if (clean.endsWith("/v1")) return `${clean}${endpointPath}`;
  return `${clean}/v1${endpointPath}`;
}

/**
 * Generates video from scene image and motion prompt using local LTX Video service
 */
export async function generateLocalVideo(
  projectId: string,
  sceneId: string,
  imagePath: string, // relative /outputs/projects/x/images/y.png
  motionPrompt: string,
  config: VideoConfig
): Promise<string> {
  const baseUrl = config.base_url || "http://127.0.0.1:9200";
  const modelName = config.model || "comfy-ltxv-i2v";
  
  const relativeVideoPath = `outputs/projects/${projectId}/videos/${sceneId}.mp4`;
  const absoluteVideoPath = path.join(process.cwd(), relativeVideoPath);
  
  // Ensure folder exists
  fs.mkdirSync(path.dirname(absoluteVideoPath), { recursive: true });
  
  // Get absolute physical path of the input image
  const resolvedImagePath = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;
  const absoluteImagePath = path.join(process.cwd(), resolvedImagePath);
  
  if (!fs.existsSync(absoluteImagePath)) {
    throw new Error(`Input image does not exist: ${absoluteImagePath}`);
  }
  
  console.log(`[LTX Video] Generating motion clip for: ${sceneId}. Input image: ${resolvedImagePath}`);
  
  try {
    const fileBase64 = fs.readFileSync(absoluteImagePath).toString("base64");
    const endpoint = openAIEndpoint(baseUrl, "/videos");
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: modelName,
        image_url: `data:image/png;base64,${fileBase64}`,
        prompt: motionPrompt || "subtle camera push-in, natural breathing motion",
        duration: 3, // default LTX safe duration
        resolution: "768x1024"
      })
    });
    
    if (!response.ok) {
      throw new Error(`Video API returned status code ${response.status}`);
    }
    
    const data: any = await response.json();
    let videoBuffer: Buffer;
    
    if (data.b64_json) {
      videoBuffer = Buffer.from(data.b64_json, "base64");
    } else if (data.url) {
      console.log(`[LTX Video] Downloading video from returned link: ${data.url}`);
      const videoFetch = await fetch(data.url);
      if (!videoFetch.ok) throw new Error(`Failed to download video from url: ${data.url}`);
      videoBuffer = Buffer.from(await videoFetch.arrayBuffer());
    } else if (data.video_path && fs.existsSync(data.video_path)) {
      // Sometimes local proxies copy files directly or output relative paths
      videoBuffer = fs.readFileSync(data.video_path);
    } else {
      throw new Error("Local video service output format unrecognized (neither url, b64_json or valid path was provided)");
    }
    
    fs.writeFileSync(absoluteVideoPath, videoBuffer);
    console.log(`[LTX Video] Successfully saved output video to: ${absoluteVideoPath}`);
    return `/${relativeVideoPath}`;
  } catch (err: any) {
    console.error(`[LTX Video Error] Service failed: ${err.message}`);
    throw err;
  }
}
