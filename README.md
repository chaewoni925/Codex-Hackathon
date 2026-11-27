# 점검노트

공간 운영자가 점검 동선을 따라 확인한 내용을 기록하고, 손님에게 QR로 공유하는 모바일 우선 웹앱입니다. React와 Vite 프런트엔드, Express와 OpenAI 비전 API로 구성되어 있습니다.

## 시작하기

Node.js 18 이상이 필요합니다.

```bash
npm install
```

`.env.example`을 복사해 `.env`를 만들고 서버용 `OPENAI_API_KEY`와 `MODEL`을 설정합니다. 키는 서버에서만 사용하며 `VITE_` 접두사가 붙은 환경변수에 넣지 마세요. `.env`는 Git에서 제외됩니다.

프런트와 API 서버를 함께 실행하려면:

```bash
npm run dev
```

웹앱은 Vite 개발 서버에서 열리고 `/api` 요청은 `localhost:8787`의 API 서버로 전달됩니다.

## AI 설정

`MOCK=0`이면 실제 OpenAI 비전 API를 호출하고, `MOCK=1`이면 서버의 샘플 응답을 반환합니다. API 호출 실패나 샘플 모드 응답에는 `fallback: true`가 표시됩니다. 안내 문구 생성은 `POST /api/notice`에서 처리합니다.

## 주요 API

| 메서드 | 경로 | 동작 |
| --- | --- | --- |
| POST | `/api/route` | 공간과 구역별 기준 사진으로 점검 동선 생성 |
| POST | `/api/inspect` | 기준 사진과 오늘 사진으로 커버리지·변화 분석 |
| POST | `/api/notice` | 점검 기록을 바탕으로 손님 안내 문구 생성 |

이미지는 요청 처리 중 분석에 전달되며 서버에 저장하지 않습니다. 사람 감지 시 결과에 `personVisible: true`를 반환합니다. AI는 점검을 돕는 도구이며 카메라 유무를 판정하거나 보증하지 않습니다.

## 빌드와 테스트

```bash
npm run build
npm test
```

샘플 이미지와 사전 준비된 결과로 네트워크 없이 전체 화면 흐름을 체험할 수 있습니다.
