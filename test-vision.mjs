import "dotenv/config";
import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import OpenAI from "openai";

try {
  const imagePath = process.argv[2];
  if (!imagePath) {
    throw new Error("사용법: node test-vision.mjs <이미지 파일 경로>");
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.MODEL;
  if (!apiKey) throw new Error(".env에 OPENAI_API_KEY를 설정해 주세요.");
  if (!model) throw new Error(".env에 MODEL을 설정해 주세요.");

  const mimeTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };
  const imageFile = resolve(imagePath);
  const mimeType = mimeTypes[extname(imageFile).toLowerCase()];
  if (!mimeType) {
    throw new Error("지원하는 이미지 형식은 jpg, jpeg, png, gif, webp입니다.");
  }

  const image = await readFile(imageFile);
  const dataUrl = `data:${mimeType};base64,${image.toString("base64")}`;
  const client = new OpenAI({ apiKey });
  const startedAt = Date.now();

  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "이 사진에 보이는 물체를 JSON 배열로 알려줘" },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "visible_objects",
        strict: true,
        schema: {
          type: "object",
          properties: {
            objects: { type: "array", items: { type: "string" } },
          },
          required: ["objects"],
          additionalProperties: false,
        },
      },
    },
  });

  const elapsedMs = Date.now() - startedAt;
  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("모델 응답에 JSON 내용이 없습니다.");

  console.log(JSON.stringify(JSON.parse(content), null, 2));
  console.log(`걸린 시간: ${elapsedMs}ms`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
