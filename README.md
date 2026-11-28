# 점검노트

> 기준 사진과 오늘 사진을 비교해 공간에서 달라진 곳을 찾고, 점검 기록으로 남기는 모바일 웹앱

점검노트는 숙소·스튜디오·매장 운영자가 공간을 정기적으로 확인하고, 점검 결과를 손님에게 QR로 공유할 수 있도록 돕습니다.

## 주요 기능

- 구역별 기준 사진을 등록하고 AI 점검 동선을 생성합니다.
- 오늘 사진을 기준 사진과 비교해 새로 생기거나, 사라지거나, 위치가 바뀐 물건을 표시합니다.
- 사진에 잘 잡히지 않은 점검 지점을 확인할 수 있습니다.
- 점검 사진과 결과를 리포트로 저장하고 다시 확인합니다.
- 점검 요약을 QR 링크로 손님에게 공유합니다.

## 화면 흐름

1. 공간 유형과 구역을 정하고 기준 사진을 등록합니다.
2. AI가 기준 사진에서 점검할 지점을 정리합니다.
3. 점검할 때 같은 구역의 오늘 사진을 촬영하거나 업로드합니다.
4. AI 비교 결과를 확인하고 점검 항목을 처리합니다.
5. 리포트를 저장하고 QR 링크로 공유합니다.

## 기술 구성

| 영역 | 기술 |
| --- | --- |
| 웹 | React, TypeScript, Vite |
| API | Node.js, Express |
| 이미지 분석 | Google Gemini 또는 OpenAI 비전 모델 |
| 기록 공유 | QR 코드 |

## 프로젝트 구조

```text
.
├── ai/                       AI 모델 연동과 분석 정의
│   ├── gemini.js             Gemini API 호출
│   ├── openai.js             OpenAI API 호출
│   ├── prompts.js            분석 프롬프트
│   ├── schemas.js            구조화 응답 스키마
│   ├── samples/              분석 API 예시 응답
│   └── test-vision.mjs       이미지 모델 연결 확인
├── server/                   백엔드 API 서버
│   ├── index.js              Express 엔드포인트와 요청 처리
│   ├── clean.js              응답 텍스트 정리
│   └── try.mjs               응답 샘플 생성 보조 스크립트
├── web/                      프런트엔드 앱
│   ├── public/                정적 이미지와 샘플 사진
│   └── src/
│       ├── components/        공통 UI 컴포넌트
│       ├── dev/               개발용 갤러리
│       ├── i18n/              문구와 다국어 처리
│       ├── lib/               이미지·해시·공유·점검 유틸리티
│       ├── samples/            샘플 공간과 화면 예시 데이터
│       ├── screens/            홈·등록·점검·리포트 화면
│       ├── state/              앱 상태와 화면 간 데이터
│       ├── styles/             전역 디자인 토큰
│       ├── App.tsx             화면 연결
│       ├── api.ts              백엔드 API 요청
│       ├── screens.tsx         화면 모듈 내보내기
│       └── main.tsx            React 시작점
├── .env.example                환경변수 설정 예시
├── package.json                의존성과 실행 명령
├── tsconfig.json               TypeScript 설정
└── vite.config.ts              Vite 설정과 API 프록시
```

웹 샘플 화면 데이터는 `web/src/samples/`에, 백엔드 분석 응답 예시는 `ai/samples/`에 있습니다.

## 실행 방법

### 준비 사항

- Node.js 18 이상
- Google Gemini API 키 또는 OpenAI API 키

### 설치

```bash
npm install
```

프로젝트 루트의 `.env.example`을 복사해 `.env`를 만든 뒤 사용할 AI 제공자와 키를 설정합니다.

Gemini 예시:

```dotenv
AI_PROVIDER=gemini
GEMINI_API_KEY=발급받은_API_키
MODEL=gemini-3.1-flash-lite
MOCK=0
PORT=8787
```

OpenAI를 사용할 때는 `AI_PROVIDER=openai`와 `OPENAI_API_KEY`를 설정합니다. API 키는 서버 전용 환경변수로 보관하고, `VITE_` 접두사를 붙이지 마세요.

### 개발 서버

```bash
npm run dev
```

Vite 웹 서버는 `http://localhost:5173`에서 실행되며, `/api` 요청은 `http://localhost:8787`의 Express 서버로 전달됩니다.

## API

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| `POST` | `/api/route` | 구역별 기준 사진을 분석해 점검 동선을 생성합니다. |
| `POST` | `/api/inspect` | 기준 사진과 오늘 사진을 비교합니다. |
| `POST` | `/api/notice` | 점검 요약을 바탕으로 안내 문구를 생성합니다. |

이미지는 분석 요청 처리에 사용되며 앱 서버에 저장되지 않습니다. AI 분석은 점검을 돕기 위한 참고 정보이며, 숨겨진 카메라의 존재 여부를 판정하거나 안전을 보증하지 않습니다.

## 확인 명령

```bash
npm run build
npm test
```

이미지 분석 API 연결은 다음 명령으로 확인할 수 있습니다.

```bash
npm run vision:check -- ./path/to/image.jpg
```

## 오프라인 응답

`.env`에서 `MOCK=1`로 설정하면 `ai/samples/`의 예시 응답을 사용할 수 있습니다. 실제 이미지 분석은 `MOCK=0`과 유효한 API 키가 필요합니다. AI 호출이 실패하면 API 응답에 `fallback: true`가 포함됩니다.
