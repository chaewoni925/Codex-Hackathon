const REPLACEMENTS = [
  "안전합니다",
  "안전해요",
  "안전해",
  "문제 없음",
  "문제없",
  "카메라 없음",
  "이상 없음",
];

function clean(obj) {
  if (typeof obj === "string") {
    return REPLACEMENTS.reduce((text, phrase) => text.split(phrase).join("확인 필요"), obj);
  }
  if (Array.isArray(obj)) return obj.map(clean);
  if (obj && typeof obj === "object") {
    return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, clean(value)]));
  }
  return obj;
}

module.exports = { clean };
