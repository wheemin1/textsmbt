# Netlify 배포 가이드

## 🚀 Netlify 수동 배포 설정

### 1단계: Netlify 사이트 생성

1. [Netlify](https://app.netlify.com) 로그인
2. **"Add new site"** → **"Import an existing project"** 선택
3. **GitHub** 선택하여 연결
4. **`wheemin1/textsmbt`** 저장소 선택

### 2단계: 빌드 설정 (수동 입력)

```
Base directory: (비워두기)
Build command: npm install && npm run build:client
Publish directory: client/dist
```

### 3단계: 환경 변수 설정

Site settings → Environment variables에서 추가:

```
NODE_VERSION = 18
NODE_ENV = production
NPM_FLAGS = --prefer-offline --no-audit
```

### 4단계: 고급 빌드 설정

Site settings → Build & deploy → Build settings:

```
Build command: npm install && npm run build:client
Publish directory: client/dist
```

## 🔧 문제 해결

### 빌드 실패 시:

1. **Node.js 버전**: 18로 설정 확인
2. **빌드 명령어**: `npm install && npm run build:client`
3. **출력 디렉토리**: `client/dist`

### 빌드 로그 확인:

- Netlify 대시보드 → Site → Deploys → 최신 배포 클릭
- Build log에서 오류 확인

### 수동 배포 테스트:

로컬에서 먼저 테스트:

```bash
npm install
npm run build:client
```

## 📁 파일 구조 확인

```
SemantleKo/
├── netlify.toml          # Netlify 설정 파일
├── package.json          # 빌드 스크립트 포함
├── vite.config.ts        # Vite 빌드 설정
├── client/
│   └── dist/             # 빌드 출력 (배포 대상)
└── .github/
    └── workflows/
        └── deploy.yml    # GitHub Actions
```

## ✅ 배포 완료 후 확인사항

1. **사이트 접속**: `https://your-site-name.netlify.app`
2. **라우팅 동작**: `/game` 등 SPA 라우팅 테스트
3. **빌드 로그**: 오류 없이 완료 확인
4. **성능**: Lighthouse 점수 확인

## 🔄 자동 배포 확인

- `main` 브랜치에 푸시 시 자동 배포 시작
- PR 생성 시 프리뷰 배포 생성
- 배포 완료까지 약 2-3분 소요
