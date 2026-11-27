export type SpaceType = "숙소" | "탈의실" | "스터디룸" | "화장실";
export type Priority = "높음" | "보통";
export type ChangeKind = "새로 생김" | "위치 바뀜" | "사라짐";
export type InspectionStatus = "확인함" | "이상해요" | "미확인";

export interface Space {
  id: string;
  type: SpaceType;
  name: string;
  zones: Zone[];
  route: RouteStep[];
  routeFallback?: boolean;
}

export interface Zone {
  id: string;
  name: string;
  /** 기준 사진의 data URL입니다. */
  baselinePhoto: string;
}

export interface RouteStep {
  order: number;
  zoneId: string;
  spotId: string;
  object: string;
  where: string;
  reason: string;
  check: string;
  priority: Priority;
}

export interface Change {
  zoneId: string;
  object: string;
  change: ChangeKind;
  where: string;
  check: string;
  priority: Priority;
}

/** 서버 응답의 changes에는 zoneId가 없으며, 프런트엔드가 요청의 zoneId를 붙여 저장합니다. */
export interface InspectResult {
  personVisible: boolean;
  coverage: { spotId: string; covered: boolean }[];
  changes: Omit<Change, "zoneId">[];
  uncertain: string[];
  note: string;
  fallback?: boolean;
}

export interface RouteResult {
  personVisible: boolean;
  route: RouteStep[];
  fallback?: boolean;
}

export interface Inspection {
  id: string;
  spaceId: string;
  at: string;
  photos: { zoneId: string; dataUrl: string; sha256: string }[];
  results: {
    spotId: string;
    covered: boolean;
    status: InspectionStatus;
  }[];
  changes: Change[];
  coverage: { checked: number; total: number };
}

export interface GuestSummary {
  spaceName: string;
  at: string;
  coverage: { checked: number; total: number };
  spots: { order: number; object: string; where: string; check: string }[];
  changesCount: number;
}

export interface NoticeResult {
  listing: string;
  checkin: string;
  fallback?: boolean;
}
