import type { MemberDirectoryRow } from '@/types/db';
import type { Member } from '@/types/domain';

export function mapMember(r: MemberDirectoryRow): Member {
  return {
    id: r.id,
    name: r.name,
    part: r.part,
    generation: r.generation,
    role: r.role,
    avatarUrl: r.avatar_url,
    boardId: r.board_id,
  };
}
