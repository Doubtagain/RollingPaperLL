/**
 * VITE_USE_MOCK=true 일 때 쓰는 인메모리 DB (localStorage 영속, 실패해도 메모리로 동작).
 * Supabase RLS 규칙을 흉내 내서, 목 모드에서도 "공개 전 내용 미노출" 등 동작이 동일하도록 한다.
 */
import { DEFAULT_OPEN_AT, STORAGE_KEYS } from '@/lib/constants';
import { safeStorage } from '@/lib/storage';
import type { CardDesign, Part, Role, StickerPlacementJson } from '@/types/db';

export interface MockMember {
  id: string;
  authId: string | null;
  name: string;
  part: Part;
  generation: number;
  role: Role;
  avatarUrl: string | null;
  inviteCode: string;
}
export interface MockBoard {
  id: string;
  ownerId: string | null;
  isGroup: boolean;
  title: string | null;
  openAt: string;
}
export interface MockMessage {
  id: string;
  boardId: string;
  authorId: string;
  nickname: string;
  content: string;
  cardDesign: CardDesign;
  stickers: StickerPlacementJson[];
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface MockState {
  members: MockMember[];
  boards: MockBoard[];
  messages: MockMessage[];
  session: { authId: string } | null;
}

const NAMES = [
  '김멋사',
  '이사자',
  '박하늘',
  '최다온',
  '정유진',
  '강민준',
  '조서연',
  '윤지호',
  '장하린',
  '임도윤',
  '한소율',
  '오지안',
  '서예준',
  '신채원',
  '권시우',
  '황나은',
  '안주원',
  '송하윤',
  '전건우',
  '홍서아',
  '유태오',
  '고은채',
  '문지환',
  '양다인',
  '손우진',
  '배수아',
  '백승현',
  '허윤슬',
  '남궁별',
  '노을',
];
const PART_CYCLE: Part[] = ['plan', 'design', 'frontend', 'backend', 'frontend', 'backend'];
const DESIGNS: CardDesign[] = ['kraft', 'red-check', 'snow', 'green-pine'];
const SAMPLE = [
  '올해 같이 해커톤 밤새면서 진짜 많이 배웠어! 메리 크리스마스 🎄',
  '항상 먼저 웃어줘서 고마워. 내년에도 같이 커밋하자!',
  '네 PR 리뷰 덕분에 코드가 깔끔해졌어 ㅋㅋ 고마워!',
  '세션 준비하느라 고생 많았어. 따뜻한 연말 보내 ☃️',
  '처음엔 어색했는데 이제 제일 편한 사람! 새해 복 많이 받아',
  '디자인 볼 때마다 감탄했어. 너는 진짜 천재야 ✨',
];

export const MOCK_AUTH_ID = 'mock-auth-me';

const uuid = (prefix: string, n: number) =>
  `${prefix}-0000-4000-8000-${String(n).padStart(12, '0')}`;

function seed(): MockState {
  const members: MockMember[] = NAMES.map((name, i) => ({
    id: uuid('m0000000', i + 1),
    authId: null,
    name,
    part: PART_CYCLE[i % PART_CYCLE.length]!,
    generation: i < 10 ? 13 : 14,
    role: i === 0 ? 'admin' : 'member',
    avatarUrl: null,
    inviteCode: `XMAS-${String(i + 1).padStart(4, '0')}`,
  }));
  const boards: MockBoard[] = members.map((m, i) => ({
    id: uuid('b0000000', i + 1),
    ownerId: m.id,
    isGroup: false,
    title: null,
    openAt: DEFAULT_OPEN_AT,
  }));

  const messages: MockMessage[] = [];
  let n = 1;
  const now = Date.now();
  // 내 트리(0번)에 5개, 다른 트리에 무작위 분포
  for (let b = 0; b < boards.length; b++) {
    const count = b === 0 ? 5 : (b * 7) % 6;
    for (let k = 0; k < count; k++) {
      const authorIdx = (b + k * 3 + 1) % members.length;
      if (authorIdx === b || authorIdx === 0) continue; // 자기 트리 금지, '나'의 작성은 아래에서
      const created = new Date(now - (n * 37 + 60) * 60_000).toISOString();
      messages.push({
        id: uuid('c0000000', n),
        boardId: boards[b]!.id,
        authorId: members[authorIdx]!.id,
        nickname: k % 2 === 0 ? members[authorIdx]!.name : '수줍은 루돌프',
        content: SAMPLE[(b + k) % SAMPLE.length]!,
        cardDesign: DESIGNS[(b + k) % DESIGNS.length]!,
        stickers:
          k % 2 === 0
            ? [
                { id: 'christmas-tree', x: 0.8, y: 0.15, rotate: 12, scale: 1 },
                { id: 'snowflake', x: 0.18, y: 0.82, rotate: -10, scale: 0.8 },
              ]
            : [{ id: 'gift', x: 0.82, y: 0.78, rotate: -8, scale: 1.1 }],
        isHidden: false,
        createdAt: created,
        updatedAt: created,
      });
      n++;
    }
  }
  // '나'는 이미 2명에게 작성
  for (const b of [3, 7]) {
    const created = new Date(now - b * 3600_000).toISOString();
    messages.push({
      id: uuid('c0000000', n++),
      boardId: boards[b]!.id,
      authorId: members[0]!.id,
      nickname: '김멋사',
      content: '항상 고마워! 메리 크리스마스 🎅',
      cardDesign: 'red-check',
      stickers: [{ id: 'santa-lion', x: 0.78, y: 0.2, rotate: 10, scale: 1 }],
      isHidden: false,
      createdAt: created,
      updatedAt: created,
    });
  }
  return { members, boards, messages, session: null };
}

let state: MockState = safeStorage.get<MockState>(STORAGE_KEYS.mockDb) ?? seed();

export const mockDb = {
  get: () => state,
  save() {
    safeStorage.set(STORAGE_KEYS.mockDb, state);
  },
  reset() {
    state = seed();
    this.save();
  },
  me(): MockMember | null {
    const s = state.session;
    if (!s) return null;
    return state.members.find((m) => m.authId === s.authId) ?? null;
  },
  isAdmin(): boolean {
    return this.me()?.role === 'admin';
  },
  boardOf(memberId: string) {
    return state.boards.find((b) => b.ownerId === memberId);
  },
  isOpened(board: MockBoard) {
    return Date.now() >= new Date(board.openAt).getTime();
  },
  newId(prefix = 'x') {
    return `${prefix}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
  },
};

/** 네트워크 지연 흉내 */
export const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

if (typeof window !== 'undefined') {
  // 디버그용: 콘솔에서 __mockDb.reset()
  (window as unknown as { __mockDb: typeof mockDb }).__mockDb = mockDb;
}
