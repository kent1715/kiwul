interface OllamaConfig {
  base_url: string;
  model: string;
}

function buildEndpoint(baseUrl: string, suffix: string): string {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanSuffix = suffix.startsWith("/") ? suffix.slice(1) : suffix;
  
  if (cleanBase.endsWith("/v1")) {
    if (cleanSuffix.startsWith("v1/")) {
      const rest = cleanSuffix.slice(3);
      return `${cleanBase}/${rest}`;
    }
  }
  return `${cleanBase}/${cleanSuffix}`;
}

/**
 * Executes a text generation query against a local Ollama server
 */
export async function runOllamaLLM(
  prompt: string,
  systemInstruction: string,
  config: OllamaConfig,
  temperature: number = 0.5
): Promise<string> {
  const baseUrl = config.base_url || "http://127.0.0.1:11434";
  const modelName = config.model || "qwen3:8b";
  const endpoint = buildEndpoint(baseUrl, "/v1/chat/completions");
  
  console.log(`[Ollama Adapter] Fetching chat completion from: ${endpoint} (Model: ${modelName})`);
  
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt }
      ],
      temperature: temperature,
      top_p: 0.8,
      stream: false
    })
  });
  
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ollama Integration Error [Code ${res.status}]: ${errText}. Please make sure Ollama is active locally.`);
  }
  
  const responseData: any = await res.json();
  return responseData.choices?.[0]?.message?.content || "";
}
