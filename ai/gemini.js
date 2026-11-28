const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

function toGeminiParts(content) {
  if (typeof content === "string") return [{ text: content }];
  if (!Array.isArray(content)) throw new Error("Gemini 요청 내용이 올바르지 않습니다.");

  return content.map((part) => {
    if (part.type === "text") return { text: part.text };
    if (part.type === "image_url") {
      const url = part.image_url?.url ?? "";
      const match = url.match(/^data:([^;,]+);base64,([\s\S]+)$/);
      if (!match) throw new Error("Gemini에는 base64 이미지 데이터가 필요합니다.");
      return { inlineData: { mimeType: match[1], data: match[2] } };
    }
    throw new Error("지원하지 않는 Gemini 입력 형식입니다.");
  });
}

function usageFrom(response) {
  const usage = response.usageMetadata;
  if (!usage) return null;
  return {
    prompt_tokens: usage.promptTokenCount ?? 0,
    completion_tokens: usage.candidatesTokenCount ?? 0,
    total_tokens: usage.totalTokenCount ?? 0,
  };
}

async function callGemini({ system, content, schema }) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.MODEL || "gemini-3.8-flash";
  if (!apiKey) throw new Error("GEMINI_API_KEY가 설정되지 않았습니다.");
  if (!system || !schema) throw new Error("프롬프트 또는 JSON Schema가 설정되지 않았습니다.");

  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: toGeminiParts(content) }],
    generationConfig: {
      responseMimeType: "application/json",
      responseJsonSchema: schema,
      temperature: 0.2,
    },
  };

  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 50_000);
    try {
      const response = await fetch(`${API_BASE}/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = payload.error?.message ?? `HTTP ${response.status}`;
        const error = new Error(`Gemini API ${response.status}: ${message}`);
        if (response.status < 500 && response.status !== 408) throw error;
        lastError = error;
        continue;
      }

      const text = payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("")
        .trim();
      if (!text) {
        const reason = payload.promptFeedback?.blockReason ?? "응답 텍스트 없음";
        throw new Error(`Gemini 응답에서 JSON을 받지 못했습니다: ${reason}`);
      }
      return { result: JSON.parse(text), usage: usageFrom(payload) };
    } catch (error) {
      lastError = error;
      if (attempt === 1 || error?.name === "AbortError") break;
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError;
}

module.exports = { callGemini };
