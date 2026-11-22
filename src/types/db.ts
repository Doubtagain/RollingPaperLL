/**
 * Supabase 스키마 타입 (수동 작성 — `supabase gen types typescript` 결과로 교체 가능)
 * DB는 snake_case. 프론트 도메인 타입(camelCase)은 types/domain.ts 참고.
 */
export type Part = 'plan' | 'design' | 'frontend' | 'backend';
export type Role = 'member' | 'admin';
export type CardDesign = 'kraft' | 'red-check' | 'snow' | 'green-pine';

/** view: member_directory (auth_id, invite_code 제외) */
export interface MemberDirectoryRow {
  id: string;
  name: string;
  part: Part;
  generation: number;
  role: Role;
  avatar_url: string | null;
  board_id: string;
}

/** admin 전용: members 테이블 원본 */
export interface MemberRow {
  id: string;
  auth_id: string | null;
  name: string;
  part: Part;
  generation: number;
  role: Role;
  avatar_url: string | null;
  invite_code: string;
}

export interface StickerPlacementJson {
  id: string;
  x: number;
  y: number;
  rotate: number;
  scale: number;
}

/** view: public_messages (author_id 제외, is_hidden=false, RLS 적용) */
export interface PublicMessageRow {
  id: string;
  board_id: string;
  nickname: string;
  content: string;
  card_design: CardDesign;
  stickers: StickerPlacementJson[] | null;
  created_at: string;
  updated_at: string;
  is_mine: boolean;
}

/** rpc: get_board_summary / get_board_summaries */
export interface BoardSummaryRow {
  board_id: string;
  count: number;
  opened: boolean;
  open_at: string;
}

/** rpc: get_admin_stats */
export interface AdminStatRow {
  member_id: string;
  name: string;
  part: Part;
  generation: number;
  received_count: number;
  written_count: number;
}

/** rpc: admin_list_messages */
export interface AdminMessageRow extends Omit<PublicMessageRow, 'is_mine'> {
  author_id: string;
  author_name: string;
  owner_name: string | null;
  is_hidden: boolean;
}
