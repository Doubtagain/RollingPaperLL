import type { PublicMessageRow, StickerPlacementJson } from '@/types/db';
import type { Message, StickerPlacement } from '@/types/domain';

const clamp = (v: unknown, min: number, max: number, fallback: number) => {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  return Math.min(max, Math.max(min, n));
};

/** jsonb 는 신뢰할 수 없으므로 방어적으로 파싱 */
export function parseStickers(raw: unknown): StickerPlacement[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s): s is StickerPlacementJson => !!s && typeof (s as { id?: unknown }).id === 'string')
    .map((s) => ({
      id: s.id,
      x: clamp(s.x, 0, 1, 0.5),
      y: clamp(s.y, 0, 1, 0.5),
      rotate: clamp(s.rotate, -30, 30, 0),
      scale: clamp(s.scale, 0.6, 1.6, 1),
    }));
}

export function mapMessage(r: PublicMessageRow): Message {
  return {
    id: r.id,
    boardId: r.board_id,
    nickname: r.nickname,
    content: r.content,
    cardDesign: r.card_design,
    stickers: parseStickers(r.stickers),
    createdAt: r.created_at,
    isMine: r.is_mine,
  };
}

export const PUBLIC_MESSAGE_COLUMNS =
  'id,board_id,nickname,content,card_design,stickers,created_at,updated_at,is_mine';
