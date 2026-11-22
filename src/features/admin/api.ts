import { USE_MOCK } from '@/lib/constants';
import { unwrap } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { parseStickers } from '@/features/messages/mapper';
import type { AdminMessageRow, AdminStatRow, MemberRow, Role } from '@/types/db';
import type { AdminMember, AdminMessage, AdminStat, NewMemberInput } from '@/types/domain';
import { mockAdminApi } from './api.mock';

export interface AdminApi {
  getStats(): Promise<AdminStat[]>;
  listMembers(): Promise<AdminMember[]>;
  createMember(input: NewMemberInput & { inviteCode: string }): Promise<void>;
  updateRole(memberId: string, role: Role): Promise<void>;
  listMessages(): Promise<AdminMessage[]>;
  setHidden(messageId: string, hidden: boolean): Promise<void>;
  /** 모든 보드의 open_at 일괄 변경 */
  setOpenAt(iso: string): Promise<void>;
}

/** 헷갈리는 문자(0/O, 1/I) 제외 */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const arr = new Uint32Array(6);
  crypto.getRandomValues(arr);
  return `XMAS-${Array.from(arr, (n) => chars[n % chars.length]).join('')}`;
}

const realAdminApi: AdminApi = {
  async getStats() {
    const rows = unwrap(await supabase.rpc('get_admin_stats')) as AdminStatRow[];
    return rows.map((r) => ({
      memberId: r.member_id,
      name: r.name,
      part: r.part,
      generation: r.generation,
      receivedCount: Number(r.received_count),
      writtenCount: Number(r.written_count),
    }));
  },
  async listMembers() {
    const rows = unwrap(
      await supabase
        .from('members')
        .select('id,auth_id,name,part,generation,role,avatar_url,invite_code')
        .order('name'),
    ) as MemberRow[];
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      part: r.part,
      generation: r.generation,
      role: r.role,
      avatarUrl: r.avatar_url,
      inviteCode: r.invite_code,
      linked: !!r.auth_id,
    }));
  },
  async createMember(input) {
    // boards row 는 DB 트리거(on_member_created)가 생성
    unwrap(
      await supabase.from('members').insert({
        name: input.name,
        part: input.part,
        generation: input.generation,
        role: input.role,
        invite_code: input.inviteCode,
      }),
    );
  },
  async updateRole(memberId, role) {
    unwrap(await supabase.from('members').update({ role }).eq('id', memberId));
  },
  async listMessages() {
    const rows = unwrap(await supabase.rpc('admin_list_messages')) as AdminMessageRow[];
    return rows.map((r) => ({
      id: r.id,
      boardId: r.board_id,
      nickname: r.nickname,
      content: r.content,
      cardDesign: r.card_design,
      stickers: parseStickers(r.stickers),
      createdAt: r.created_at,
      authorId: r.author_id,
      authorName: r.author_name,
      ownerName: r.owner_name,
      isHidden: r.is_hidden,
    }));
  },
  async setHidden(messageId, hidden) {
    unwrap(await supabase.rpc('admin_set_message_hidden', { message_id: messageId, hidden }));
  },
  async setOpenAt(iso) {
    unwrap(await supabase.rpc('admin_set_open_at', { open_at: iso }));
  },
};

export const adminApi: AdminApi = USE_MOCK ? mockAdminApi : realAdminApi;
