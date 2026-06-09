import fs from "fs";
import path from "path";

interface ZImageConfig {
  base_url: string;
  model: string;
}

function openAIEndpoint(baseUrl: string, endpointPath: string) {
  const clean = baseUrl.replace(/\/+$/, "");
  if (clean.endsWith("/v1")) return `${clean}${endpointPath}`;
  return `${clean}/v1${endpointPath}`;
}

/**
 * Generates an image using local Z-Image endpoint
 */
export async function generateLocalImage(
  projectId: string,
  sceneId: string,
  prompt: string,
  config: ZImageConfig
): Promise<string> {
  const baseUrl = config.base_url || "http://127.0.0.1:9100";
  const modelName = config.model || "z-image-turbo";
  
  // Format target output file path
  const relativePath = `outputs/projects/${projectId}/images/${sceneId}.png`;
  const absolutePath = path.join(process.cwd(), relativePath);
  
  // Ensure target folder exists
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  
  const endpoint = openAIEndpoint(baseUrl, "/images/generations");
  console.log(`[Z-Image] Triggering generation on: ${endpoint} for prompt: "${prompt.slice(0, 50)}..."`);
  
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: modelName,
        prompt: prompt,
        size: "768x1024",
        n: 1,
        response_format: "b64_json" // Request base64 or URL
      })
    });
    
    if (!res.ok) {
      throw new Error(`Z-Image API returned status ${res.status}: ${await res.text()}`);
    }
    
    const data: any = await res.json();
    const imageData = data.data?.[0];
    
    if (!imageData) {
      throw new Error("No image data found in local Z-Image API response.");
    }
    
    let buffer: Buffer;
    
    if (imageData.b64_json) {
      buffer = Buffer.from(imageData.b64_json, "base64");
    } else if (imageData.url) {
      // Fetch binary image from returned local URL
      console.log(`[Z-Image] Downloading image from returned URL: ${imageData.url}`);
      const imgFetch = await fetch(imageData.url);
      if (!imgFetch.ok) throw new Error(`Failed to download image from: ${imageData.url}`);
      buffer = Buffer.from(await imgFetch.arrayBuffer());
    } else {
      throw new Error("Local image response missing both url and b64_json.");
    }
    
    fs.writeFileSync(absolutePath, buffer);
    console.log(`[Z-Image] Saved local image to: ${absolutePath}`);
    return `/${relativePath}`;
  } catch (err: any) {
    console.error(`[Z-Image Error] Failed: ${err.message}`);
    throw err;
  }
}
