import { USE_MOCK } from '@/lib/constants';
import { unwrap } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import type { PublicMessageRow } from '@/types/db';
import type { Message, MessageInput } from '@/types/domain';
import { mockMessagesApi } from './api.mock';
import { mapMessage, PUBLIC_MESSAGE_COLUMNS } from './mapper';

export interface MessagesApi {
  /** 이 보드에 내가 쓴 메시지 (RLS: 작성자 본인은 공개 전에도 조회 가능) */
  getMyMessage(boardId: string): Promise<Message | null>;
  /**
   * 내 보드의 메시지 전체. **공개 후(summary.opened)에만 호출한다.**
   * 공개 전에는 RLS가 빈 배열을 돌려주지만, 애초에 요청하지 않는다.
   */
  listMyBoardMessages(boardId: string): Promise<Message[]>;
  upsertMessage(input: MessageInput, existingId?: string): Promise<Message>;
  deleteMessage(id: string): Promise<void>;
}

async function fetchPublicById(id: string): Promise<Message> {
  const row = unwrap(
    await supabase.from('public_messages').select(PUBLIC_MESSAGE_COLUMNS).eq('id', id).single(),
  ) as PublicMessageRow;
  return mapMessage(row);
}

const realMessagesApi: MessagesApi = {
  async getMyMessage(boardId) {
    const row = unwrap(
      await supabase
        .from('public_messages')
        .select(PUBLIC_MESSAGE_COLUMNS)
        .eq('board_id', boardId)
        .eq('is_mine', true)
        .maybeSingle(),
    ) as PublicMessageRow | null;
    return row ? mapMessage(row) : null;
  },
  async listMyBoardMessages(boardId) {
    const rows = unwrap(
      await supabase
        .from('public_messages')
        .select(PUBLIC_MESSAGE_COLUMNS)
        .eq('board_id', boardId)
        .order('created_at', { ascending: true }),
    ) as PublicMessageRow[];
    return rows.map(mapMessage);
  },
  async upsertMessage(input, existingId) {
    const payload = {
      nickname: input.nickname,
      content: input.content,
      card_design: input.cardDesign,
      stickers: input.stickers,
    };
    // author_id 는 DB default(current_member_id())로 채워짐 — 클라이언트가 보내지 않는다
    // returning 은 id 만 받는다 (messages 테이블 row 를 그대로 받지 않음)
    const { id } = unwrap(
      existingId
        ? await supabase.from('messages').update(payload).eq('id', existingId).select('id').single()
        : await supabase
            .from('messages')
            .insert({ ...payload, board_id: input.boardId })
            .select('id')
            .single(),
    ) as { id: string };
    return fetchPublicById(id);
  },
  async deleteMessage(id) {
    unwrap(await supabase.from('messages').delete().eq('id', id));
  },
};

export const messagesApi: MessagesApi = USE_MOCK ? mockMessagesApi : realMessagesApi;
