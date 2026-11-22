import { USE_MOCK } from '@/lib/constants';
import { unwrap } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import type { BoardSummaryRow, MemberDirectoryRow } from '@/types/db';
import type { BoardSummary, Member } from '@/types/domain';
import { mockMembersApi } from './api.mock';
import { mapMember } from './mapper';

export interface MembersApi {
  listMembers(): Promise<Member[]>;
  /** 전체 보드의 선물 개수 (공개 전에도 개수만 조회 가능) */
  listBoardSummaries(): Promise<BoardSummary[]>;
  getBoardSummary(boardId: string): Promise<BoardSummary>;
  /** 내가 이미 메시지를 남긴 트리 주인들의 member id */
  getMyWrittenMemberIds(): Promise<string[]>;
}

export const mapSummary = (r: BoardSummaryRow): BoardSummary => ({
  boardId: r.board_id,
  count: Number(r.count),
  opened: r.opened,
  openAt: r.open_at,
});

const realMembersApi: MembersApi = {
  async listMembers() {
    const rows = unwrap(
      await supabase
        .from('member_directory')
        .select('id,name,part,generation,role,avatar_url,board_id')
        .order('name'),
    ) as MemberDirectoryRow[];
    return rows.map(mapMember);
  },
  async listBoardSummaries() {
    const rows = unwrap(await supabase.rpc('get_board_summaries')) as BoardSummaryRow[];
    return rows.map(mapSummary);
  },
  async getBoardSummary(boardId) {
    const rows = unwrap(
      await supabase.rpc('get_board_summary', { board_id: boardId }),
    ) as BoardSummaryRow[];
    const row = rows[0];
    if (!row) throw new Error('PGRST116');
    return mapSummary(row);
  },
  async getMyWrittenMemberIds() {
    return (unwrap(await supabase.rpc('get_my_written_member_ids')) as string[] | null) ?? [];
  },
};

export const membersApi: MembersApi = USE_MOCK ? mockMembersApi : realMembersApi;
