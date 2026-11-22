import type { CardDesign, Part } from '@/types/domain';

/** 공개일 기본값 (실제 값은 DB boards.open_at / RPC 응답 기준) */
export const DEFAULT_OPEN_AT = '2026-12-25T00:00:00+09:00';

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export const CARD_FONT_FAMILY = 'CardHand';
export const CARD_FONT_SRC = '/fonts/NanumPenScript.ttf';

export const CONTENT_MAX = 500;
export const NICKNAME_MAX = 12;
export const STICKER_MAX = 6;
export const VILLAGE_GIFT_ICON_MAX = 8;
export const LOW_RECEIVED_THRESHOLD = 3;

export const PARTS: { value: Part; label: string }[] = [
  { value: 'plan', label: '기획' },
  { value: 'design', label: '디자인' },
  { value: 'frontend', label: '프론트' },
  { value: 'backend', label: '백엔드' },
];
export const PART_LABEL: Record<Part, string> = {
  plan: '기획',
  design: '디자인',
  frontend: '프론트',
  backend: '백엔드',
};

export const CARD_DESIGNS: { value: CardDesign; label: string }[] = [
  { value: 'kraft', label: '크라프트' },
  { value: 'red-check', label: '레드 체크' },
  { value: 'snow', label: '스노우' },
  { value: 'green-pine', label: '그린 파인' },
];

export const STORAGE_KEYS = {
  draft: (boardId: string) => `rp:draft:${boardId}`,
  giftOpenSeen: (boardId: string) => `rp:gift-open-seen:${boardId}`,
  myTreeView: 'rp:my-tree-view',
  mockDb: 'rp:mock-db',
} as const;
