# 멋사 수원대 크리스마스 롤링페이퍼 — 프론트엔드 구현 명세

> 이 문서는 Claude Code가 프론트엔드를 구현하기 위한 명세서다.
> 정해지지 않은 부분은 **기본값(Default)** 으로 명시했으니, 그대로 구현하되 상수/설정으로 빼서 쉽게 바꿀 수 있게 한다.

---

## 0. 프로젝트 개요

- **목적**: 멋쟁이사자처럼 수원대 멤버(약 30명)끼리 서로에게 크리스마스 카드 형태의 롤링페이퍼를 남기는 사이트
- **핵심 메타포**
  - 멤버 1명 = **트리 1그루** (각자의 보드)
  - 메시지 = **선물상자 / 오너먼트** → 누르면 **카드**가 펼쳐짐
  - 공개일 전까지 트리 주인은 **자기 트리의 메시지를 볼 수 없음** (선물 개수만 보임)
  - **공개일 = 2026-12-25 00:00 KST** (Default, 환경변수/DB 값으로 관리)
- **닉네임 방식**: 실명/익명 토글 없음. 작성 시 닉네임 입력 칸 하나.
  - 기본값: 작성자 실명
  - 비워서 제출하면 크리스마스 랜덤 닉네임 자동 부여 (예: "졸린 루돌프")
  - 작성자 ID는 DB에 저장되지만 화면(다른 사용자 대상)에는 절대 노출하지 않음

---

## 1. 기술 스택

| 영역 | 선택 |
|---|---|
| 빌드 | Vite |
| 언어 | TypeScript (strict) |
| UI | React 18+ |
| 라우팅 | React Router v6 |
| 서버 상태 | TanStack Query |
| 백엔드 | Supabase (Auth, Postgres, Storage) — `@supabase/supabase-js` v2 |
| 스타일 | Tailwind CSS + CSS 변수 기반 테마 토큰 |
| 애니메이션 | Framer Motion |
| 폼 | react-hook-form + zod |
| 배포 | Cloudflare Pages (SPA fallback 설정 필요) |
| 패키지 매니저 | pnpm |

- 절대 경로 alias: `@/` → `src/`
- ESLint + Prettier 설정 포함
- 환경변수: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

---

## 2. 디렉토리 구조

```
src/
├── app/
│   ├── App.tsx
│   ├── router.tsx
│   └── providers.tsx          # QueryClient, Auth, Theme
├── pages/
│   ├── LoginPage.tsx
│   ├── VillagePage.tsx        # "/" 멤버 트리 목록
│   ├── TreePage.tsx           # "/tree/:memberId" 남의 트리 + 작성
│   ├── MyTreePage.tsx         # "/me" 내 트리
│   ├── AdminPage.tsx          # "/admin"
│   └── NotFoundPage.tsx
├── features/
│   ├── auth/                  # useAuth, AuthGuard, AdminGuard
│   ├── members/               # api, hooks, MemberTreeCard
│   ├── messages/              # api, hooks, MessageForm, GiftBox, MessageCard
│   ├── stickers/              # manifest, StickerPicker, StickerLayer
│   ├── countdown/             # useCountdown, CountdownBanner
│   └── admin/                 # StatsTable, MemberManager, HideMessageButton
├── components/
│   ├── ui/                    # Button, Input, Textarea, Modal, Toast, Spinner
│   ├── layout/                # AppHeader, PageShell
│   └── effects/               # Snowfall, GiftOpenAnimation
├── lib/
│   ├── supabase.ts
│   ├── nickname.ts            # 랜덤 닉네임 생성기
│   ├── time.ts                # KST 처리, isOpened()
│   └── constants.ts
├── styles/
│   ├── globals.css
│   └── theme.css              # CSS 변수 (색상, 폰트, 그림자)
└── types/
    └── db.ts                  # Supabase 타입 (supabase gen types 결과 or 수동)
public/
├── stickers/                  # *.svg / *.webp
└── fonts/
```

---

## 3. 데이터 모델 (프론트가 가정하는 Supabase 스키마)

> 백엔드(스키마·RLS)는 별도 작업이지만, 프론트 타입과 API 호출은 이 스키마를 기준으로 한다.
> `supabase/migrations/` 에 아래 SQL 초안을 함께 만들어 두면 좋다.

### members
| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | uuid PK | |
| auth_id | uuid nullable, unique | `auth.users.id`, 최초 로그인 시 연결 |
| name | text | 실명 |
| part | text | `'plan' \| 'design' \| 'frontend' \| 'backend'` |
| generation | int | 기수 (예: 14) |
| role | text | `'member' \| 'admin'` |
| avatar_url | text nullable | |
| invite_code | text unique | 초대코드 입장용 |

### boards
| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | uuid PK | |
| owner_id | uuid FK → members nullable | 단체 보드면 null |
| is_group | boolean | 단체 트리 여부 (확장 기능) |
| title | text nullable | 단체 보드 제목 |
| open_at | timestamptz | Default `2026-12-25 00:00+09` |

### messages
| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | uuid PK | |
| board_id | uuid FK → boards | |
| author_id | uuid FK → members | **절대 클라이언트에 노출 X (본인 것 제외)** |
| nickname | text | 화면에 보이는 이름 |
| content | text | 1~500자 |
| card_design | text | `'kraft' \| 'red-check' \| 'snow' \| 'green-pine'` |
| stickers | jsonb | `StickerPlacement[]` |
| is_hidden | boolean | 관리자 숨김 |
| created_at / updated_at | timestamptz | |

- 제약: `unique (board_id, author_id)` — **1인당 한 트리에 메시지 1개** (Default). 수정은 공개 전까지 가능.
- 자기 자신의 트리에는 작성 불가.

### 조회용 View / RPC (프론트는 이것만 사용)
- `public_messages` view: `author_id` 제외, `is_hidden = false` 만, 공개 조건 충족 시만 row 반환
- `rpc('get_board_summary', { board_id })` → `{ count: number, opened: boolean }` — 공개 전에도 개수 조회 가능
- `rpc('get_my_written_member_ids')` → `uuid[]` — 내가 이미 쓴 트리 표시용
- `rpc('get_admin_stats')` → 멤버별 받은 수/쓴 수 (admin only)

### RLS 요구사항 (프론트에서 우회 불가능해야 함)
- messages SELECT: `작성자 본인` OR `(보드 주인 AND now() >= open_at)` OR `admin`
- messages INSERT/UPDATE: 작성자 본인, `now() < open_at`, 자기 보드 아님
- **프론트의 잠금 UI는 UX일 뿐이고, 실제 차단은 RLS가 한다.** 프론트 코드에 "공개 전이지만 일단 받아와서 숨기는" 로직을 절대 만들지 않는다.

---

## 4. TypeScript 타입

```ts
export type Part = 'plan' | 'design' | 'frontend' | 'backend';
export type Role = 'member' | 'admin';
export type CardDesign = 'kraft' | 'red-check' | 'snow' | 'green-pine';

export interface Member {
  id: string;
  name: string;
  part: Part;
  generation: number;
  role: Role;
  avatarUrl: string | null;
  boardId: string;
}

export interface StickerPlacement {
  id: string;        // sticker manifest id, e.g. "santa-lion"
  x: number;         // 0~1 (카드 너비 대비 비율)
  y: number;         // 0~1
  rotate: number;    // deg, -30 ~ 30
  scale: number;     // 0.6 ~ 1.6
}

export interface Message {
  id: string;
  boardId: string;
  nickname: string;
  content: string;
  cardDesign: CardDesign;
  stickers: StickerPlacement[];
  createdAt: string;
  isMine: boolean;   // 내가 쓴 메시지인지 (수정 버튼 노출용)
}

export interface BoardSummary {
  count: number;
  opened: boolean;
  openAt: string;
}
```

- DB snake_case ↔ 프론트 camelCase 변환은 `features/*/api.ts` 의 mapper에서만 처리.

---

## 5. 라우팅 & 접근 제어

| 경로 | 페이지 | 접근 |
|---|---|---|
| `/login` | LoginPage | 비로그인 |
| `/` | VillagePage | 로그인 + 멤버 연결 완료 |
| `/tree/:memberId` | TreePage | 로그인. `memberId === 나` 이면 `/me`로 redirect |
| `/me` | MyTreePage | 로그인 |
| `/admin` | AdminPage | `role === 'admin'` |
| `*` | NotFoundPage | |

- `AuthGuard`: 세션 없으면 `/login`
- 로그인했지만 `members.auth_id` 연결이 안 된 경우 → 초대코드 입력 화면 (LoginPage 내 단계)
- `AdminGuard`: admin 아니면 `/`

---

## 6. 페이지별 상세

### 6.1 LoginPage (`/login`)
- 배경: 밤하늘 + 눈 내리는 효과 + 마을 일러스트
- 1단계: **카카오 로그인** 버튼 (Supabase OAuth `kakao`)
- 2단계 (첫 로그인 시): **초대코드 입력** → `rpc('link_member', { invite_code })` 호출 → 성공 시 `/`
- 실패 메시지: "초대코드를 다시 확인해 주세요 🎅"

### 6.2 VillagePage (`/`) — 멤버 트리 마을
- 상단 `CountdownBanner`: "크리스마스까지 D-3 · 12:04:33" / 공개 후엔 "🎁 선물이 열렸어요!"
- 진행 안내: "아직 선물을 안 남긴 멤버가 **12명** 있어요" (내가 쓴 수 / 전체-1)
- 파트 필터 탭: 전체 / 기획 / 디자인 / 프론트 / 백엔드
- 그리드: `MemberTreeCard` (모바일 2열, 태블릿 3열, 데스크탑 4~5열)
  - 트리 일러스트 + 이름 + 파트 뱃지
  - 트리 아래 선물상자 개수만큼 작은 상자 아이콘 (최대 표시 8개, 초과는 "+N")
  - 내가 이미 쓴 트리: 트리 꼭대기 별이 켜짐 ⭐ + "작성 완료" 라벨
  - 내 트리는 맨 앞에 "내 트리" 로 고정, 클릭 시 `/me`
- 정렬: 내 트리 → 아직 안 쓴 멤버 → 쓴 멤버 (각 그룹 내 이름순)

### 6.3 TreePage (`/tree/:memberId`) — 남의 트리에 선물 남기기
- 상단: 큰 트리 + 주인 이름 + "선물 N개"
- 공개 전:
  - 다른 사람 메시지는 **보이지 않음** (선물상자 개수만)
  - 내가 쓴 메시지가 있으면 내 선물상자만 강조, 클릭 시 내 카드 미리보기 + 수정/삭제
  - 없으면 CTA: "🎁 선물 남기기" → `MessageForm` 모달(모바일은 풀스크린 시트)
- 공개 후: 작성/수정 불가, "선물은 크리스마스 전까지만 남길 수 있어요" 안내. (남의 메시지는 공개 후에도 보이지 않음 — 트리 주인만 볼 수 있음)

### 6.4 MessageForm — 카드 작성
필드 순서:
1. **카드 디자인 선택** (4종, 가로 스크롤 썸네일)
2. **본문** textarea (1~500자, 글자수 카운터, 손글씨 폰트로 실시간 미리보기)
3. **스티커 꾸미기**: `StickerPicker`에서 고르면 카드 미리보기 중앙에 추가 → 드래그로 이동, 핀치/핸들로 회전·크기 조절, 길게 눌러 삭제. 최대 6개.
4. **닉네임** input
   - placeholder/기본값: 내 실명
   - 옆에 🎲 버튼: 랜덤 크리스마스 닉네임으로 교체
   - 비우고 제출하면 랜덤 닉네임 자동 부여
   - 최대 12자
5. 제출 버튼: "트리에 걸기 🎄"

- 제출 성공 시: 선물상자가 트리 아래로 떨어지는 짧은 애니메이션 → 토스트 "선물을 남겼어요!"
- zod 스키마로 검증, 에러는 필드 아래 표시
- 작성 중 이탈 시 확인 모달 + localStorage 임시저장 (try/catch로 감싸기)

### 6.5 MyTreePage (`/me`) — 내 트리
- **공개 전**:
  - 트리 아래 선물상자 N개가 쌓여 있음 (흔들림 idle 애니메이션)
  - 상자 클릭 시: "12월 25일에 열 수 있어요 🎅" 툴팁/흔들림
  - 큰 카운트다운
  - "🎁 N개의 선물이 도착했어요" 문구
- **공개 후**:
  - 처음 진입 시 `GiftOpenAnimation`: 리본이 풀리며 카드들이 하나씩 트리에 걸림 (스킵 버튼 제공, 한 번 본 뒤에는 localStorage 플래그로 생략)
  - 카드 그리드/트리 배치 뷰 토글
  - 카드 클릭 → `MessageCard` 확대 모달 (좌우 스와이프로 다음 카드)
  - (확장) "이미지로 저장" 버튼

### 6.6 AdminPage (`/admin`)
- **설정**: 공개일(open_at) 일괄 변경
- **현황 테이블** (`get_admin_stats`): 이름 / 파트 / 받은 선물 수 / 남긴 선물 수
  - 받은 수 오름차순 정렬 기본 → 적게 받은 사람이 위로
  - 받은 수 3개 미만은 빨간 강조
- **멤버 관리**: 추가(이름/파트/기수/초대코드 자동생성), 초대코드 복사, 역할 변경
- **메시지 관리**: 신고/부적절 메시지 숨김 토글 (admin은 전체 메시지 조회 가능, 작성자 실명 확인 가능)

---

## 7. 랜덤 닉네임 생성기 (`lib/nickname.ts`)

```ts
const ADJECTIVES = ['졸린', '수상한', '배고픈', '반짝이는', '수줍은', '용감한',
  '눈 덮인', '코가 빨간', '야근하는', '커밋하는', '디버깅하는', '포근한'];
const NOUNS = ['루돌프', '산타', '눈사람', '진저쿠키', '엘프', '썰매',
  '양말', '트리', '사자', '펭귄', '북극곰', '종'];

export function randomNickname(): string { /* ADJ + ' ' + NOUN */ }
```
- 12자 초과 조합은 제외

---

## 8. 테마 & 디자인 토큰

### 색상 (`styles/theme.css`)
```css
:root {
  --night-900: #0f1a2e;   /* 배경 밤하늘 */
  --night-700: #1c2b48;
  --snow-50:   #f8fafc;
  --pine-600:  #1f6f4a;   /* 트리 */
  --pine-400:  #3c9a6b;
  --berry-600: #c0392b;   /* 포인트 레드 */
  --gold-400:  #f4c95d;   /* 별, 리본, 하이라이트 */
  --kraft-200: #e8d5b0;   /* 크라프트 카드 */
  --ink-800:   #2b2b2b;   /* 카드 글씨 */
  --radius-card: 14px;
  --shadow-card: 0 8px 24px rgb(0 0 0 / 0.25);
}
```
- 전체 배경은 다크(밤 + 눈), 카드는 밝은 종이 톤 → 대비로 카드가 돋보이게

### 폰트
- 본문 UI: Pretendard
- 카드 손글씨: 눈누에서 **상업적 이용 가능 + 웹폰트 허용** 라이선스 한글 손글씨 폰트 1종 (`public/fonts/`, `font-display: swap`)
- 폰트 파일명/패밀리명은 `constants.ts`의 `CARD_FONT_FAMILY`로 관리

### 효과
- `Snowfall`: canvas 기반, 입자 수는 화면 크기에 비례(최대 120), `prefers-reduced-motion` 이면 비활성
- 모든 애니메이션은 `prefers-reduced-motion` 존중

### 반응형
- **모바일 퍼스트** (대부분 카톡 링크로 폰에서 접속)
- 기준 폭 375px, 터치 타겟 최소 44px

---

## 9. 스티커 시스템 (`features/stickers/`)

### 에셋
- 위치: `public/stickers/{id}.svg` (또는 `.webp`, 256×256, 투명 배경)
- **기본 팩**: Microsoft Fluent Emoji (MIT) 에서 크리스마스 관련 10~15종
  - 예: christmas-tree, santa, snowman, gift, snowflake, deer, bell, cookie, sock, star, candy-cane, mitten, hot-beverage, sparkles
  - 라이선스 고지: `/about` 또는 푸터에 "Stickers: Fluent Emoji by Microsoft (MIT)" 표기
- **시그니처 팩** (직접 제작, 추후 추가): santa-lion(산타 모자 쓴 사자), likelion-ribbon, suwon-badge 등
  - 처음엔 placeholder SVG로 두고 파일만 교체하면 되게 구현

### 매니페스트 (`features/stickers/manifest.ts`)
```ts
export interface StickerDef {
  id: string;
  label: string;
  src: string;
  pack: 'basic' | 'signature';
}
export const STICKERS: StickerDef[] = [ /* ... */ ];
export const STICKER_MAP = Object.fromEntries(STICKERS.map(s => [s.id, s]));
```
- DB에는 `id`만 저장. 매니페스트에 없는 id는 렌더링 시 무시(크래시 금지).

### 컴포넌트
- `StickerPicker`: 팩별 탭, 그리드, 탭하면 추가
- `StickerLayer`: 카드 위 absolute 레이어. 좌표는 0~1 비율로 저장해서 카드 크기와 무관하게 동일 배치
  - 편집 모드: 드래그(Framer Motion `drag`, `dragConstraints`=카드), 선택 시 회전/크기 핸들 + 삭제 버튼
  - 보기 모드: 정적 렌더링

---

## 10. 카드 디자인 (`MessageCard`)
- 비율 3:4 고정
- 4종 디자인은 CSS 배경(그라디언트/패턴/SVG 패턴)으로 구현, 이미지 의존 최소화
  - `kraft`: 크라프트지 톤 + 노이즈 텍스처
  - `red-check`: 빨강/흰 체크 테두리 + 아이보리 내지
  - `snow`: 연하늘 + 눈결정 패턴
  - `green-pine`: 짙은 초록 + 금색 테두리 (글씨 밝은색)
- 하단 우측: `from. {nickname}`
- 같은 컴포넌트를 작성 미리보기 / 공개 후 보기 / 관리자 화면에서 재사용

---

## 11. 시간 처리 (`lib/time.ts`)
- 공개 여부 판단은 **서버(RPC 응답의 `opened`)를 기준**으로 한다. 클라이언트 시간은 카운트다운 표시용으로만 사용.
- 카운트다운이 0이 되면 `queryClient.invalidateQueries` 로 summary/messages 재조회.
- 날짜 표시는 KST 고정 (`Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul' })`).

---

## 12. API 레이어 규칙
- 모든 Supabase 호출은 `features/*/api.ts` 에만 둔다. 컴포넌트에서 `supabase` 직접 호출 금지.
- 각 api 함수는 Query 훅으로 감싼다: `useMembers`, `useBoardSummary`, `useMyMessage`, `useMyBoardMessages`, `useUpsertMessage`, `useDeleteMessage`, `useAdminStats` …
- Query key 상수화: `queryKeys.ts`
- 에러는 공통 Toast로 표시. RLS 거부(공개 전 조회 등)는 사용자 친화 문구로 매핑.

---

## 13. 구현 순서 (마일스톤)

1. **세팅**: Vite + TS + Tailwind + Router + Query + Supabase 클라이언트, 테마 토큰, 폰트, 기본 레이아웃, `Snowfall`
2. **인증**: 카카오 로그인, 초대코드 연결, Guard들
3. **마을**: VillagePage, MemberTreeCard, 카운트다운, 작성 진행 안내
4. **작성**: TreePage, MessageForm(카드 디자인·본문·닉네임), 수정/삭제
5. **스티커**: 매니페스트, Picker, StickerLayer(드래그/회전/크기)
6. **내 트리**: 공개 전 잠금 화면 → 공개 후 카드 보기 + 개봉 애니메이션
7. **관리자**: 현황 테이블, 멤버 관리, 메시지 숨김, 공개일 설정
8. **마감**: 반응형 점검, reduced-motion, 빈 상태/에러 상태, 라이선스 고지, Cloudflare Pages 배포 설정 (`_redirects`: `/* /index.html 200`)

각 단계는 동작하는 상태로 커밋한다. Supabase가 아직 없을 때를 위해 `VITE_USE_MOCK=true` 이면 `features/*/api.mock.ts` 의 목 데이터로 동작하게 한다 (멤버 30명, 일부 메시지 포함).

---

## 14. 수용 기준 (Acceptance Criteria)

- [ ] 공개 전, 내 트리에서 메시지 **내용**이 네트워크 응답에도 포함되지 않는다 (개수만 받음)
- [ ] 공개 전, 남의 트리에서 다른 사람 메시지 내용이 네트워크 응답에 포함되지 않는다
- [ ] 어떤 응답에도 타인의 `author_id` / 실명이 포함되지 않는다 (admin 제외)
- [ ] 닉네임을 비우고 제출하면 랜덤 크리스마스 닉네임이 저장된다
- [ ] 한 트리에 한 번만 작성 가능, 공개 전까지 수정·삭제 가능
- [ ] 자기 트리에는 작성 UI가 나타나지 않는다
- [ ] 스티커 배치가 다른 화면 크기에서도 동일한 상대 위치로 보인다
- [ ] 매니페스트에 없는 스티커 id가 있어도 페이지가 깨지지 않는다
- [ ] 마을 화면에서 내가 쓴 트리가 구분 표시되고, 남은 인원 수가 정확하다
- [ ] 관리자 현황에서 받은 수가 적은 순으로 정렬된다
- [ ] 375px 모바일에서 모든 기능 사용 가능
- [ ] `prefers-reduced-motion` 에서 눈/개봉 애니메이션이 꺼진다
- [ ] `pnpm build` 경고 없이 통과, `tsc --noEmit` 통과

---

## 15. 확장 기능 (MVP 이후, 지금은 구조만 열어두기)
- 단체 트리 (`boards.is_group = true`) — 멋사 전체에게 남기는 트리
- 카드에 사진/GIF 첨부 (Supabase Storage)
- 손글씨 캔버스 모드
- 받은 카드에 하트 반응
- 내 트리 전체를 이미지/PDF로 저장 (html-to-image)