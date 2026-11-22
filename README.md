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

## 배포 (Cloudflare Workers — 정적 에셋)

### GitHub 연동 (Workers Builds)

1. Cloudflare 대시보드 → Workers & Pages → 이 레포로 연결된 Worker → Settings → Build
2. 빌드 설정
   - Build command: `pnpm build`
   - Deploy command: `npx wrangler deploy`
3. 환경 변수: Settings → Build → **Build variables** 에 넣을 것 (Vite 가 빌드 시점에 번들에 넣음. Runtime 변수에 넣으면 적용 안 됨)
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   - Supabase 없이 데모만 띄우려면 `VITE_USE_MOCK=true`
   - Node 버전은 `.node-version`(22), pnpm 버전은 `package.json` 의 `packageManager` 로 지정됨
4. 이후 `main` 에 push 하면 자동 배포

### CLI 직접 배포

```bash
pnpm run deploy   # = pnpm build && npx wrangler deploy (처음엔 npx wrangler login 필요)
```

로컬 `.env` 의 `VITE_*` 값이 번들에 들어가므로 `.env` 를 채운 뒤 실행할 것.

### 포함된 설정 파일

- `wrangler.toml` — `[assets] directory = "./dist"`, `not_found_handling = "single-page-application"` (SPA fallback)
  - `name` 은 대시보드의 Worker 이름과 같아야 함
- `public/_headers` — 해시된 에셋 장기 캐시, 기본 보안 헤더

### Supabase 쪽

- Auth → Providers 에서 Kakao 활성화
- Auth → URL Configuration 에 배포 도메인 추가: Site URL `https://<도메인>`, Redirect URL `https://<도메인>/login`
