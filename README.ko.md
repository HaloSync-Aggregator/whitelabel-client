[English](./README.md) | 한국어

# Whitelabel Flight Booking Platform

OTA가 몇 분 안에 브랜드형 항공 예약 웹사이트를 시작할 수 있도록 돕는 멀티 테넌트 화이트라벨 프론트엔드 생성 플랫폼입니다. Claude Code의 멀티 에이전트 구조와 PolarHub NDC API를 기반으로 합니다.

## Live Demo

데모는 **[demo.halosync.kr/demo](https://demo.halosync.kr/)** 에서 확인할 수 있습니다.

> 이 데모는 항공사 테스트 시스템에 연결된 샌드박스 환경입니다. 실제 예약은 생성되지 않습니다.

## 개요

항공 예약 웹사이트를 처음부터 만드는 일은 비용도 크고 시간도 많이 듭니다. 이 플랫폼은 브랜드 정보만 정의하면 검색, 예약, 좌석 선택, 부가서비스, 예약 후 관리까지 포함된 **Vite + React SPA**를 자동 생성합니다.

생성된 사이트는 모두 S3 + CloudFront 등에 바로 배포할 수 있는 **정적 프론트엔드(HTML/JS/CSS)** 이며, 12개 이상 항공사의 NDC 연동 복잡성은 **PolarHub NDC Middleware**가 처리합니다.

### 핵심 포인트

- **멀티 에이전트 코드 생성**: Claude Code 에이전트가 디자인 토큰, 컴포넌트, 페이지를 3단계 파이프라인으로 생성
- **12개 항공사 지원**: 항공사별 분기 로직을 템플릿과 서비스 레이어에서 처리
- **전체 예약 라이프사이클 지원**: 검색부터 변경, 취소, 환불까지 포함
- **샘플 테넌트 포함**: `apps/DEMO001`로 실제 참고 가능한 앱과 CI 기준 제공

## 동작 방식

자체 화이트라벨 항공 예약 사이트를 만들고 실행하려면 아래 3단계를 따르면 됩니다.

```
1단계                    2단계                    3단계
프로비저닝               미들웨어                 프론트엔드
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ 온보딩 및        │────▶│ NDC API         │────▶│ 예약 웹사이트    │
│ 자격증명 수령    │      │ 미들웨어 생성    │      │ 생성             │
│                  │      │                  │      │                  │
│ → Tenant ID      │      │ → Backend API    │      │ → Vite+React SPA │
│ → API Key        │      │ → Airline routes │      │ → 브랜드 UI      │
│ → Airline access │      │ → Auth & config  │      │ → 전체 예약 흐름 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

### 1단계: 프로비저닝(온보딩)

온보딩을 완료하면 아래 정보를 받게 됩니다.
- **Tenant ID**: OTA를 구분하는 고유 식별자
- **API Key**: PolarHub NDC API 인증용 키
- **Airline access**: 계정에 활성화된 항공사 목록

> 온보딩 포털은 아직 준비 중입니다. 조기 접근이 필요하면 GitHub issue로 문의해 주세요.

### 2단계: 미들웨어 생성

**PolarHub NDC Middleware**는 항공사 NDC 통신, 인증, 항공사별 프로토콜 차이를 처리하는 백엔드입니다. 이 역시 Claude Code로 생성됩니다.

> **미들웨어 저장소**: [whitelabel-middleware](https://github.com/HaloSync-Aggregator/whitelabel-middleware)

미들웨어 저장소를 clone한 뒤, 1단계에서 받은 자격정보를 이용해 테넌트 전용 미들웨어를 생성하세요. 자세한 설정은 미들웨어 README를 참고하면 됩니다.

### 3단계: 프론트엔드 생성(이 저장소)

미들웨어가 실행 중이면 이 저장소를 사용해 브랜드형 예약 웹사이트를 생성할 수 있습니다. 자세한 절차는 아래 [Quick Start](#quick-start)를 참고하세요.

#### 디자인 시스템

디자인 시스템은 테넌트의 시각적 아이덴티티를 정의합니다. 색상, 타이포그래피, 간격, 그림자, 레이아웃 등을 포함하며 아래 3가지 방식으로 준비할 수 있습니다.

**옵션 1: 기존 웹사이트에서 추출하기**

`design-analyzer` 에이전트에 레퍼런스 URL을 주면 로고, 색상, 폰트, 레이아웃, 컴포넌트 사양을 분석해 디자인 토큰으로 정리합니다.

```
# Claude Code에서
@design-analyzer
Analyze https://your-travel-site.com and extract design tokens for tenant DEMO001.
```

**옵션 2: design-system.json 직접 작성**

기본 템플릿을 복사해서 브랜드에 맞게 수정합니다.

```bash
mkdir -p tenant/{tenant-id}
cp .claude/skills/whitelabel-dev/templates/config/design-system.json tenant/{tenant-id}/
```

그 다음 색상, 폰트, 간격 값을 수정하면 됩니다.

**옵션 3: 기본 템플릿 사용**

별도 디자인 설정이 없으면 기본 템플릿(구글 스타일 블루 테마, Roboto 기반)을 사용합니다. 빠른 프로토타이핑에 적합합니다.

```
/whitelabel-dev
Generate a whitelabel site for tenant {tenant-id}.
```

#### 생성 파이프라인

디자인 시스템이 준비되면 3단계 에이전트 파이프라인이 전체 애플리케이션을 생성합니다.

```
 디자인 시스템         컴포넌트                페이지
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ design-system-   │──▶│ component-       │──▶│ app-builder      │
│ setup            │    │ builder          │    │                  │
│                  │    │                  │    │ 검색 페이지      │
│ tailwind.config  │    │ Header, Footer   │    │ 결과 페이지      │
│ globals.css      │    │ FlightCard       │    │ 예약 페이지      │
│ tenant.ts        │    │ SeatMap 등       │    │ 취소 페이지      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 기능

| 분류 | 기능 |
|----------|-------------|
| **검색 및 예약** | 편도/왕복 검색, OfferPrice, 승객 입력, 예약 생성 |
| **좌석 선택** | 인터랙티브 좌석 맵, 항공사별 무료/유료/제한 좌석 처리 |
| **부가서비스** | 수하물, 기내식 등 추가 서비스와 중량 기반 bookingInstructions 처리 |
| **예약 후 관리** | 승객 정보 변경, 여정 변경, 취소 및 환불 견적 |
| **발권 흐름** | Hold-to-ticketing, 서비스 포함 발권, 2단계 결제 흐름 |
| **테넌트 브랜딩** | 로고, 색상, 폰트, 레이아웃을 테넌트별로 구성 가능 |

## 지원 항공사

| 코드 | 항공사 | Booking | Seat | Service | Post-Booking |
|------|---------|:-------:|:----:|:-------:|:------------:|
| AY | Finnair | Y | Y | Y | Y |
| SQ | Singapore Airlines | Y | Y | Y | Y |
| AF | Air France | Y | Y | Y | Y |
| KL | KLM | Y | Y | Y | Y |
| TK | Turkish Airlines | Y | * | * | Y |
| QR | Qatar Airways | Y | Y | Y | Y |
| TR | Scoot | Y | Y | Y | Y |
| EK | Emirates | Y | * | - | Y |
| LH | Lufthansa | Y | - | - | Y |
| AA | American Airlines | Y | - | - | - |
| HA | Hawaiian Airlines | Y | Y | Y | Y |
| BA | British Airways | Y | - | - | - |

`Y` = 지원, `*` = 부분 지원 또는 노선 의존, `-` = 미지원

항공사별 상세 capability는 [docs/carrier-support-matrix.md](./docs/carrier-support-matrix.md)를 참고하세요.

## 기술 스택

- **빌드 도구**: Vite 5
- **프레임워크**: React 18 / React Router 6 / TypeScript
- **스타일링**: Tailwind CSS 3
- **배포 형태**: 정적 파일(S3 + CloudFront, nginx, 기타 CDN)
- **AI 도구**: Claude Code Max 이상
- **백엔드**: [PolarHub NDC Middleware](https://github.com/HaloSync-Aggregator/whitelabel-middleware)
- **검증**: GitHub Actions CI + 로컬 lint/typecheck/build

## Quick Start

### 사전 준비

- [Claude Code](https://claude.ai/code) Max 플랜 이상
- 실행 가능한 [PolarHub NDC Middleware](https://github.com/HaloSync-Aggregator/whitelabel-middleware)
- Node.js 18 이상
- npm 9 이상

### 설정

```bash
git clone <repository-url>
cd whitelabel-client

cp .env.example .env
```

`.env`에서 필요한 값:

| 변수 | 설명 | 예시 |
|----------|-------------|---------|
| `VITE_MIDDLEWARE_URL` | 로컬 개발 시 미들웨어 주소 | `http://localhost:3000` |
| `VITE_BASE_PATH` | SPA를 서브패스로 배포할 때 사용할 base path | `/` |

```bash
source scripts/env.sh

cd apps/DEMO001
npm install
npm run dev
```

> 이 프론트엔드 저장소는 PolarHub API credential 자체를 보관하지 않습니다. 항공사/PolarHub credential은 미들웨어 저장소에서 관리하고, 여기서는 `VITE_MIDDLEWARE_URL`로 연결만 설정합니다.

> Vite 개발 서버 기본 포트는 `5173`이고, 미들웨어는 보통 `3000`에서 실행합니다. 따라서 `.env`에는 일반적으로 `VITE_MIDDLEWARE_URL=http://localhost:3000`를 설정합니다.

[http://localhost:5173](http://localhost:5173) 에 접속해서 검색 화면이 뜨는지 확인하세요.

### 새 테넌트 사이트 생성

Claude Code에서 `/whitelabel-dev` 스킬을 사용합니다.

```
/whitelabel-dev
Generate a whitelabel site for tenant DEMO001.
Use https://example-travel.com as the design reference.
```

생성 결과 예시는 다음과 같습니다.

```
apps/DEMO001/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── package.json
├── nginx.conf
├── Dockerfile
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── app/
    │   ├── globals.css
    │   ├── page.tsx
    │   ├── results/page.tsx
    │   ├── booking/page.tsx
    │   ├── booking/[id]/page.tsx
    │   └── booking/[id]/cancel/page.tsx
    ├── components/
    ├── lib/
    │   ├── tenant.ts
    │   └── api/
    └── types/
```

생성된 앱 실행:

```bash
cd apps/DEMO001
npm install && npm run dev
```

프로덕션 배포:

```bash
npm run build
```

`dist/` 결과물을 S3 등에 업로드하고 SPA 라우팅용 404 → `index.html` 리다이렉트를 설정하면 됩니다.

## API 접근 및 사용 권한

- 이 저장소의 코드는 MIT 라이선스로 배포됩니다.
- PolarHub API 접근 권한은 별도의 온보딩 및 credential 발급 정책으로 관리됩니다.
- PolarHub 온보딩을 완료하고 API credential을 발급받은 OTA 개발자는, 자신의 미들웨어 및 접근 권한 범위 안에서 이 프로젝트를 사용해 웹 애플리케이션을 생성하고 운영할 수 있습니다.
- 이 저장소 자체가 API 접근 권한을 부여하지는 않습니다.

## 아키텍처

### 에이전트 스킬

| 스킬 | 목적 |
|-------|---------|
| `/whitelabel-dev` | 3단계 생성 파이프라인을 오케스트레이션 |
| `/tenant-config` | 테넌트 설정 파일 생성 |

전체 흐름은 위의 [동작 방식](#동작-방식) 섹션을 참고하세요.

## 프로젝트 구조

```
whitelabel-client/
├── apps/{tenant-id}/
│   ├── index.html
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── app/
│       ├── components/
│       ├── lib/api/
│       └── types/
│
├── tenant/{tenant-id}.yaml
├── tenant/{tenant-id}/
│   └── design-system.json
│
├── .claude/
│   ├── agents/
│   ├── skills/
│   └── assets/
│
├── scripts/
│   └── env.sh
│
└── docs/
    └── carrier-support-matrix.md
```

## API 연동

프론트엔드는 항공사 API를 직접 호출하지 않습니다. 브라우저에서 `polarhub-service.ts`를 통해 PolarHub NDC Middleware를 호출합니다.

```
Browser (React SPA) → Service Layer → PolarHub NDC Middleware → Airlines
```

주요 서비스 함수와 엔드포인트:

| 서비스 함수 | 미들웨어 엔드포인트 |
|-----------------|---------------------|
| `searchFlights()` | `POST /middleware/polarhub/air-shopping` |
| `getOfferPrice()` | `POST /middleware/polarhub/offer-price` |
| `createBooking()` | `POST /middleware/polarhub/order` |
| `getBookingDetail()` | `POST /middleware/polarhub/order/retrieve` |
| `getSeatAvailability()` | `POST /middleware/polarhub/seat-availability` |
| `getServiceList()` | `POST /middleware/polarhub/service-list` |

전체 OpenAPI 스펙은 `.claude/assets/whitelabel-middleware.openapi.yaml`에 있습니다.

## 개발

```bash
cd apps/{tenant-id}

npm run dev
npm run build
npm run preview
npm run lint
npx tsc --noEmit
```

항공사별 API 패턴과 구현 규칙은 [CLAUDE.md](./CLAUDE.md)를 참고하세요.

### 테스트

이 public seed에는 샘플 테넌트 앱 기준 CI 검증이 포함되어 있습니다.

1. `npm run lint`
2. `npx tsc --noEmit`
3. `npm run build`

콜드스타트 점검 시에는 DEMO001 앱을 로컬에서 띄워 홈 화면 로딩과 미들웨어 연결 여부를 확인하면 됩니다.

## 기여

기여 전 아래 문서를 먼저 확인해 주세요.

1. [CLAUDE.md](./CLAUDE.md)
2. [docs/carrier-support-matrix.md](./docs/carrier-support-matrix.md)
3. [CONTRIBUTING.md](./CONTRIBUTING.md)
4. `.claude/` 하위 에이전트/스킬 문서

## 라이선스

MIT License. 자세한 내용은 [LICENSE](./LICENSE)를 참고하세요.

API 접근 권한, credential 발급, 온보딩 정책은 별도로 PolarHub에서 관리합니다.

---

Built with [Claude Code](https://claude.ai/code)
