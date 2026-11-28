const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const { clean } = require("./clean");
const { callVision: callOpenAI } = require("../ai/openai");
const { callGemini } = require("../ai/gemini");
const { PROMPT_A, PROMPT_B, PROMPT_C, PROMPT_INSPECT, PROMPT_NOTICE } = require("../ai/prompts");
const { ROUTE_SCHEMA, INSPECT_SCHEMA, NOTICE_SCHEMA } = require("../ai/schemas");

loadEnvFile(path.resolve(__dirname, "../.env"));
const app = express();
app.use(express.json({ limit: "20mb" }));

const readSample = (name) => JSON.parse(fs.readFileSync(path.resolve(__dirname, `../ai/samples/${name}`), "utf8"));
const provider = () => (process.env.AI_PROVIDER || "openai").trim().toLowerCase();
const canCallAI = () => process.env.MOCK === "0" && (
  provider() === "gemini" ? Boolean(process.env.GEMINI_API_KEY) :
  provider() === "openai" ? Boolean(process.env.OPENAI_API_KEY) :
  false
);
const callConfigured = (options) => {
  if (!options.system || !options.schema) throw new Error("프롬프트 또는 JSON Schema가 아직 설정되지 않았습니다.");
  if (provider() === "gemini") return callGemini(options);
  if (provider() === "openai") return callOpenAI(options);
  throw new Error(`지원하지 않는 AI_PROVIDER입니다: ${provider()}`);
};
const sendClean = (res, body) => res.json(clean(body));

function removeNoticeClaims(value) {
  if (typeof value === "string") {
    return value
      .split(/(?<=[.!?。！？])\s+|\r?\n+/u)
      .filter((sentence) => !sentence.includes("100%") && !sentence.includes("보장"))
      .join(" ")
      .trim();
  }
  if (Array.isArray(value)) return value.map(removeNoticeClaims);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, removeNoticeClaims(item)]));
  }
  return value;
}

function cleanNotice(value) {
  return removeNoticeClaims(clean(value));
}

function mapRouteResult(result, zones) {
  if (result.personVisible) return { personVisible: true, route: [] };
  const requestedZones = Array.isArray(zones) ? zones : [];

  return {
    personVisible: false,
    route: (result.route ?? []).filter(step => requestedZones.length === 1 || requestedZones.some(zone => zone.name === step.zone)).map((step, index) => {
      const matchedZone = requestedZones.find((zone) => zone.name === step.zone);
      const { zone, ...routeStep } = step;
      return {
        ...routeStep,
        order: index + 1,
        zoneId: matchedZone?.zoneId ?? requestedZones[0].zoneId,
        spotId: `s${index + 1}`,
      };
    }),
  };
}

function normalizeInspectResult(result, spots) {
  if (result.personVisible) return { ...result, coverage: [], changes: [] };
  const requestedIds = [...new Set(spots.map((spot) => spot.spotId).filter(Boolean))];
  const requested = new Set(requestedIds);
  const uncertain = new Set(Array.isArray(result.uncertain) ? result.uncertain : []);
  const received = new Map();
  for (const item of result.coverage ?? []) {
    if (requested.has(item.spotId) && !received.has(item.spotId)) {
      received.set(item.spotId, { spotId: item.spotId, covered: Boolean(item.covered) });
    }
  }
  return {
    ...result,
    uncertain: requestedIds.filter((spotId) => uncertain.has(spotId)),
    coverage: requestedIds.map((spotId) => received.get(spotId) ?? { spotId, covered: false }),
  };
}

async function respond({ api, res, fallback, run, transform }) {
  const startedAt = Date.now();
  let usage = null;
  try {
    if (!run) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return sendClean(res, { ...fallback, fallback: true });
    }
    const response = await run();
    usage = response?.usage ?? null;
    const result = response?.result ?? response;
    return sendClean(res, transform ? transform(result) : result);
  } catch (error) {
    console.error(`[${api}] ${error?.message ?? error}`);
    return sendClean(res, { ...fallback, fallback: true });
  } finally {
    const tokenLog = usage
      ? ` prompt_tokens=${usage.prompt_tokens ?? 0} completion_tokens=${usage.completion_tokens ?? 0} total_tokens=${usage.total_tokens ?? 0}`
      : " tokens=n/a";
    console.info(`[${api}] ${Date.now() - startedAt}ms${tokenLog}`);
  }
}

app.post("/api/route", async (req, res) => {
  const { spaceType } = req.body ?? {};
  const zones = (Array.isArray(req.body?.zones) ? req.body.zones : []).map((zone) => ({
    zoneId: zone.zoneId ?? zone.id,
    name: zone.name,
    photo: zone.photo ?? zone.baselinePhoto,
  }));
  const sampleRoute = readSample("route.json");
  const fallback = {
    ...sampleRoute,
    route: sampleRoute.route.map((step) => ({
      ...step,
      zoneId: zones[step.zoneId === "zone-bath" ? 1 : 0]?.zoneId
        ?? zones[0]?.zoneId
        ?? step.zoneId,
    })),
  };
  const content = [{ type: "text", text: `공간 유형: ${spaceType ?? ""}` }];
  for (const zone of zones) {
    content.push({ type: "text", text: `구역: ${zone.name ?? ""}` });
    content.push({ type: "image_url", image_url: { url: zone.photo } });
  }
  return respond({
    api: "POST /api/route", res, fallback,
    transform: (result) => mapRouteResult(result, zones),
    run: canCallAI()
      ? () => callConfigured({ system: PROMPT_A, content, schema: ROUTE_SCHEMA })
      : null,
  });
});

app.post("/api/inspect", async (req, res) => {
  const { zoneId, baseline, today, spots = [], mockPerson = false } = req.body ?? {};
  const fixture = mockPerson
    ? "inspect-person.json"
    : ["bath", "zone-bath"].includes(zoneId) ? "inspect-bath.json" : "inspect-main.json";
  const fallback = readSample(fixture);
  const spotList = spots.map(({ spotId, object, where }) => ({ spotId, object, where }));
  const content = [
    {
      type: "text",
      text: `점검 지점 목록: ${JSON.stringify(spotList)}\n첫 번째가 기준 사진, 두 번째가 오늘 사진이야.`,
    },
    { type: "image_url", image_url: { url: baseline } },
    { type: "image_url", image_url: { url: today } },
  ];
  return respond({
    api: "POST /api/inspect", res, fallback,
    transform: (result) => normalizeInspectResult(result, spots),
    run: !mockPerson && canCallAI()
      ? () => callConfigured({ system: PROMPT_B, content, schema: INSPECT_SCHEMA })
      : null,
  });
});

app.post("/api/notice", async (req, res) => {
  const fallback = cleanNotice(readSample("notice.json"));
  const summary = req.body?.summary ?? {};
  const content = `GuestSummary JSON:\n${typeof summary === "string" ? summary : JSON.stringify(summary)}`;
  return respond({
    api: "POST /api/notice", res, fallback,
    transform: cleanNotice,
    run: canCallAI()
      ? () => callConfigured({ system: PROMPT_C, content, schema: NOTICE_SCHEMA })
      : null,
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  return sendClean(res, {
    error: error?.message ?? "요청을 처리할 수 없습니다.",
    status: error?.status === 413 ? 413 : 400,
  });
});

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || Object.hasOwn(process.env, match[1])) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}

const port = Number(process.env.PORT) || 8787;
app.listen(port, () => console.info(`API 서버가 ${port} 포트에서 실행 중입니다.`));


