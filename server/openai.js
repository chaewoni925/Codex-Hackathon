const OpenAI = require("openai");

let client;
function getClient() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY가 설정되지 않았습니다.");
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, maxRetries: 0 });
  return client;
}

async function callVision({ system, content, schema }) {
  if (!schema) throw new Error("JSON Schema가 아직 설정되지 않았습니다.");
  if (!process.env.MODEL) throw new Error("MODEL이 설정되지 않았습니다.");

  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await getClient().chat.completions.create({
        model: process.env.MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "api_result", strict: true, schema },
        },
      }, { signal: controller.signal });

      const text = response.choices[0]?.message?.content;
      if (!text) throw new Error("OpenAI 응답에 JSON 내용이 없습니다.");
      return { result: JSON.parse(text), usage: response.usage ?? null };
    } catch (error) {
      lastError = error;
      if (attempt === 1) break;
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError;
}

module.exports = { callVision };
