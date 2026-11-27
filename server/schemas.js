const ROUTE_SCHEMA = {
  type: "object",
  properties: {
    personVisible: { type: "boolean" },
    route: {
      type: "array",
      items: {
        type: "object",
        properties: {
          order: { type: "integer" }, zone: { type: "string" }, object: { type: "string" },
          where: { type: "string" }, reason: { type: "string" }, check: { type: "string" },
          priority: { type: "string", enum: ["높음", "보통"] },
        },
        required: ["order", "zone", "object", "where", "reason", "check", "priority"],
        additionalProperties: false,
      },
    },
  },
  required: ["personVisible", "route"],
  additionalProperties: false,
};

const INSPECT_SCHEMA = {
  type: "object",
  properties: {
    personVisible: { type: "boolean" },
    coverage: { type: "array", items: {
      type: "object", properties: { spotId: { type: "string" }, covered: { type: "boolean" } },
      required: ["spotId", "covered"], additionalProperties: false,
    } },
    changes: { type: "array", items: {
      type: "object",
      properties: {
        object: { type: "string" }, change: { type: "string", enum: ["새로 생김", "위치 바뀜", "사라짐"] },
        where: { type: "string" }, check: { type: "string" }, priority: { type: "string", enum: ["높음", "보통"] },
      },
      required: ["object", "change", "where", "check", "priority"], additionalProperties: false,
    } },
    uncertain: { type: "array", items: { type: "string" } }, note: { type: "string" },
  },
  required: ["personVisible", "coverage", "changes", "uncertain", "note"],
  additionalProperties: false,
};

const NOTICE_SCHEMA = {
  type: "object",
  properties: { listing: { type: "string" }, checkin: { type: "string" } },
  required: ["listing", "checkin"],
  additionalProperties: false,
};

module.exports = { ROUTE_SCHEMA, INSPECT_SCHEMA, NOTICE_SCHEMA };
