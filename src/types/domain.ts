import type { CardDesign, Part, Role } from './db';

export type { CardDesign, Part, Role };

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
  /** sticker manifest id, e.g. "santa-lion" */
  id: string;
  /** 0~1 (카드 너비 대비 비율) */
  x: number;
  /** 0~1 (카드 높이 대비 비율) */
  y: number;
  /** deg, -30 ~ 30 */
  rotate: number;
  /** 0.6 ~ 1.6 */
  scale: number;
}

export interface Message {
  id: string;
  boardId: string;
  nickname: string;
  content: string;
  cardDesign: CardDesign;
  stickers: StickerPlacement[];
  createdAt: string;
  /** 내가 쓴 메시지인지 (수정 버튼 노출용) */
  isMine: boolean;
}

export interface BoardSummary {
  boardId: string;
  count: number;
  opened: boolean;
  openAt: string;
}

export interface MessageInput {
  boardId: string;
  nickname: string;
  content: string;
  cardDesign: CardDesign;
  stickers: StickerPlacement[];
}

export interface AdminStat {
  memberId: string;
  name: string;
  part: Part;
  generation: number;
  receivedCount: number;
  writtenCount: number;
}

export interface AdminMember extends Omit<Member, 'boardId'> {
  inviteCode: string;
  linked: boolean;
}

export interface AdminMessage extends Omit<Message, 'isMine'> {
  authorId: string;
  authorName: string;
  ownerName: string | null;
  isHidden: boolean;
}

export interface NewMemberInput {
  name: string;
  part: Part;
  generation: number;
  role: Role;
}
