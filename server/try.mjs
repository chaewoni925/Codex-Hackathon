import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(scriptDir, "..");
const samplesDir = path.join(projectDir, "samples");
const apiBase = (process.env.API_URL || "http://localhost:8787").replace(/\/$/, "");
const forbidden = ["안전합니다", "안전해요", "안전해", "문제 없음", "문제없", "카메라 없음", "이상 없음"];
const mimeByExtension = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

function usage() {
  console.error(
    "사용법:\n  node server/try.mjs route <main.jpg> <bath.jpg> [--save]\n  node server/try.mjs inspect <before.jpg> <after.jpg> [--save]",
  );
}

async function imageDataUrl(file) {
  const absolutePath = path.resolve(process.cwd(), file);
  const mime = mimeByExtension[path.extname(absolutePath).toLowerCase()];
  if (!mime) throw new Error(`지원하지 않는 이미지 형식입니다: ${file}`);
  const bytes = await readFile(absolutePath);
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

async function readRouteSample() {
  return JSON.parse(await readFile(path.join(samplesDir, "route.json"), "utf8"));
}

async function post(endpoint, body) {
  const response = await fetch(`${apiBase}${endpoint}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(75_000),
  });
  const text = await response.text();
  let result;
  try {
    result = JSON.parse(text);
  } catch {
    throw new Error(`${endpoint} 응답이 JSON이 아닙니다: ${text}`);
  }
  if (!response.ok) {
    throw new Error(`${endpoint} HTTP ${response.status}: ${JSON.stringify(result)}`);
  }
  return result;
}

function findForbidden(result, label) {
  const serialized = JSON.stringify(result);
  const found = forbidden.filter((phrase) => serialized.includes(phrase));
  if (found.length) console.warn(`경고 [${label}]: 판정 금지어 발견 — ${found.join(", ")}`);
}

function summarize(result) {
  const changes = (result.changes ?? []).map((change) =>
    `${change.object} / ${change.change} / ${change.where} / ${change.priority}`,
  );
  const uncovered = (result.coverage ?? [])
    .filter((item) => item.covered === false)
    .map((item) => item.spotId);
  return {
    personVisible: result.personVisible,
    changes,
    coveredFalse: uncovered,
  };
}

function printSideBySide(results) {
  const summaries = results.map(summarize);
  const columns = summaries.map((summary, index) => ({
    호출: index + 1,
    personVisible: summary.personVisible,
    "changes 목록": summary.changes.length ? summary.changes.join("\n") : "없음",
    "covered=false 지점": summary.coveredFalse.length ? summary.coveredFalse.join(", ") : "없음",
  }));
  console.table(columns);
}

async function main() {
  const args = process.argv.slice(2);
  const save = args.includes("--save");
  const [mode, ...inputFiles] = args.filter((arg) => arg !== "--save");
  if (!mode || !["route", "inspect"].includes(mode) || inputFiles.length !== 2) {
    usage();
    process.exitCode = 2;
    return;
  }

  const [firstPhoto, secondPhoto] = await Promise.all(inputFiles.map(imageDataUrl));
  const routeSample = await readRouteSample();
  let endpoint;
  let body;

  if (mode === "route") {
    endpoint = "/api/route";
    body = {
      spaceType: "숙소",
      zones: [
        { zoneId: "zone-main", name: "메인룸", photo: firstPhoto },
        { zoneId: "zone-bath", name: "욕실", photo: secondPhoto },
      ],
    };
  } else {
    endpoint = "/api/inspect";
    body = {
      zoneId: "zone-main",
      baseline: firstPhoto,
      today: secondPhoto,
      spots: routeSample.route
        .filter((spot) => spot.zoneId === "zone-main")
        .map(({ spotId, object, where }) => ({ spotId, object, where })),
    };
  }

  const results = await Promise.all(
    [1, 2, 3].map(() => post(endpoint, body)),
  );
  results.forEach((result, index) => findForbidden(result, `호출 ${index + 1}`));
  printSideBySide(results);

  if (save) {
    const last = results[results.length - 1];
    const outputName = mode === "route"
      ? "route.json"
      : last.personVisible ? "inspect-person.json" : "inspect-main.json";
    await writeFile(path.join(samplesDir, outputName), `${JSON.stringify(last, null, 2)}\n`, "utf8");
    console.log(`마지막 결과를 samples/${outputName}에 저장했습니다.`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
