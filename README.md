# Codex-Hackathon

## 비전 API 연결 테스트

이미지 파일 한 장을 OpenAI 비전 모델에 보내고, 사진에 보이는 물체 목록과 요청 시간을 출력하는 Node.js 스크립트입니다.

## 준비

Node.js 18 이상을 설치한 뒤 프로젝트 폴더에서 의존성을 설치합니다.

```bash
npm install openai dotenv
```

프로젝트 폴더에 `.env` 파일을 만들고 API 키와 사용할 비전 모델을 지정합니다.

```dotenv
OPENAI_API_KEY=your_openai_api_key
MODEL=gpt-4o-mini
```

## 실행

```bash
node test-vision.mjs ./path/to/image.jpg
```

지원 이미지 형식: JPG, JPEG, PNG, GIF, WEBP.

성공하면 `{ "objects": [...] }` JSON과 `걸린 시간: ...ms`를 출력합니다. 실패하면 오류 메시지를 출력하고 종료 코드 1을 반환합니다.
