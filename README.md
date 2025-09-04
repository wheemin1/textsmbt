# 한국어 텍스트 배틀 (Korean Word Battle Game)

실시간 멀티플레이어 한국어 단어 유사도 배틀 게임입니다. 플레이어들이 주어진 단어와 의미적으로 유사한 단어를 제출하여 점수를 경쟁하는 게임입니다.

## 🎮 게임 특징

- **실시간 멀티플레이어**: WebSocket을 통한 실시간 대전
- **AI 봇 연습 모드**: 다양한 난이도의 AI 봇과 연습 가능
- **의미적 유사도 점수**: FastText 한국어 임베딩 기반 점수 계산
- **5라운드 배틀**: 총 5라운드로 구성된 경쟁 시스템

## 🛠 기술 스택

### Frontend
- **React 18** + **TypeScript**
- **Vite** (빌드 도구)
- **shadcn/ui** + **Radix UI** (UI 컴포넌트)
- **Tailwind CSS** (스타일링)
- **Wouter** (라우팅)
- **TanStack Query** (상태 관리)

### Backend
- **Node.js** + **Express.js**
- **TypeScript**
- **WebSocket** (실시간 통신)
- **PostgreSQL** + **Drizzle ORM** (데이터베이스)

## 🚀 로컬 개발 환경 설정

### 1. 프로젝트 클론

```bash
git clone <repository-url>
cd korean-word-battle
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 필요한 값들을 입력하세요:

```bash
cp .env.example .env
```

### 4. 데이터베이스 설정

PostgreSQL 데이터베이스를 준비하고 스키마를 푸시하세요:

```bash
npm run db:push
```

### 5. 개발 서버 실행

```bash
npm run dev
```

애플리케이션이 `http://localhost:5000`에서 실행됩니다.

## 📁 프로젝트 구조

```
├── client/           # React 프론트엔드
│   ├── src/
│   │   ├── components/   # 재사용 가능한 컴포넌트
│   │   ├── pages/       # 페이지 컴포넌트
│   │   ├── hooks/       # 커스텀 훅
│   │   └── lib/         # 유틸리티 및 API 클라이언트
├── server/           # Express 백엔드
│   ├── routes.ts        # API 라우트
│   ├── storage.ts       # 데이터베이스 인터페이스
│   └── services/        # 비즈니스 로직
├── shared/           # 공유 타입 및 스키마
│   └── schema.ts        # Drizzle 데이터베이스 스키마
└── package.json
```

## 🎯 게임 플레이

1. **로그인**: 닉네임을 입력하여 게임에 참여
2. **매칭**: "대전 찾기" 또는 "봇 연습" 선택
3. **게임 시작**: 5라운드 동안 주어진 단어와 유사한 단어 제출
4. **점수 계산**: FastText 임베딩을 통한 의미적 유사도 점수
5. **승부 결정**: 총점이 높은 플레이어가 승리

## 🚀 배포

### Replit 배포

1. Replit에서 "Deploy" 버튼 클릭
2. "Autoscale Deployment" 선택 (웹 애플리케이션에 최적화)
3. 환경 변수 설정
4. 배포 완료 후 `.replit.app` 도메인으로 접근

### 외부 서버 배포

1. 프로덕션 환경 변수 설정
2. `npm run build` (필요시)
3. `npm start` 또는 PM2 등을 사용한 프로세스 관리

## 🔧 개발 스크립트

- `npm run dev`: 개발 서버 실행
- `npm run db:push`: 데이터베이스 스키마 푸시
- `npm run db:studio`: Drizzle Studio 실행 (데이터베이스 GUI)

## 📝 라이센스

MIT License