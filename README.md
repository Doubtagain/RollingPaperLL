# 멋사 수원대 크리스마스 롤링페이퍼

구현 명세: [fe.md](./fe.md)

## 실행

```bash
pnpm install
pnpm dev:mock      # Supabase 없이 목 데이터로 실행 (VITE_USE_MOCK=true, .env.mock)
pnpm dev           # 실제 Supabase (.env 에 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)
pnpm build         # tsc --noEmit + vite build
pnpm lint
```

### 목 모드

- "카카오로 시작하기" → 초대코드 `XMAS-0001` 입력 → 김멋사(관리자)로 입장
- 데이터는 localStorage 에 저장됨. 초기화: 브라우저 콘솔에서 `__mockDb.reset()`
- 공개 후 화면 확인: 관리 → 설정 에서 공개 시각을 과거로 변경
- 목 API(`features/*/api.mock.ts`)도 RLS 규칙을 흉내 내서, 공개 전에는 내 트리 메시지 내용을 반환하지 않음

## 구조 메모

- Supabase 호출은 `src/features/*/api.ts` 에만 있음 (ESLint `no-restricted-imports` 로 강제)
- 공개 여부는 서버 응답(`opened`)으로만 판단. 클라이언트 시간은 카운트다운 표시용
- 내 트리 메시지 목록(`useMyBoardMessages`)은 `opened === true` 일 때만 요청함
- DB 스키마/RLS/RPC 초안: `supabase/migrations/20261122000000_init.sql`
  - 명세 외 추가: `member_directory` view, `get_my_member`, `get_board_summaries`(마을 화면 일괄 조회), `admin_list_messages`, `admin_set_message_hidden`, `admin_set_open_at`

## 에셋 / 라이선스

- 스티커 기본 팩: [Fluent Emoji](https://github.com/microsoft/fluentui-emoji) (MIT) — `public/stickers/LICENSE-fluent-emoji.txt`
- 시그니처 팩(`santa-lion`, `likelion-ribbon`, `suwon-badge`)은 placeholder SVG. 같은 파일명으로 교체하면 반영됨
- 카드 손글씨 폰트: Nanum Pen Script (SIL OFL 1.1) — `public/fonts/`. 다른 폰트로 바꾸려면 `src/styles/theme.css` 의 `@font-face` 수정
  - 현재 TTF(약 3MB). 배포 전 woff2 서브셋으로 바꾸는 것을 권장

## 배포 (Cloudflare Pages)

### 방법 A — GitHub 연동 (권장)

1. Cloudflare 대시보드 → Workers & Pages → Create → Pages → **Connect to Git** → 이 레포 선택
2. 빌드 설정
   - Framework preset: `None` (또는 Vite)
   - Build command: `pnpm build`
   - Build output directory: `dist`
3. 환경 변수 (Production / Preview 각각)
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   - Supabase 없이 데모만 띄우려면 `VITE_USE_MOCK=true`
   - Node 버전은 `.node-version`(22), pnpm 버전은 `package.json` 의 `packageManager` 로 지정됨
4. 이후 `main` 에 push 하면 자동 배포

### 방법 B — CLI 직접 업로드

```bash
pnpm deploy   # = pnpm build && npx wrangler pages deploy dist (처음엔 wrangler login 필요)
```

`.env` 의 `VITE_*` 값이 빌드 시점에 번들에 들어가므로, 로컬 `.env` 를 채운 뒤 실행할 것.

### 포함된 설정 파일

- `public/_redirects` — SPA fallback (`/* /index.html 200`)
- `public/_headers` — 해시된 에셋 장기 캐시, 기본 보안 헤더
- `wrangler.toml` — `pages_build_output_dir = "dist"`

### Supabase 쪽

- Auth → Providers 에서 Kakao 활성화
- Auth → URL Configuration 에 배포 도메인 추가: Site URL `https://<도메인>`, Redirect URL `https://<도메인>/login` (프리뷰용 `https://*.<프로젝트>.pages.dev/login` 도)
