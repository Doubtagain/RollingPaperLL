import { AppError } from '@/lib/errors';
import { delay, mockDb, type MockMessage } from '@/mocks/db';
import type { Message } from '@/types/domain';
import type { MessagesApi } from './api';

/** RLS 흉내: 작성자 본인 OR (보드 주인 AND 공개됨) OR admin */
function canSelect(msg: MockMessage): boolean {
  const me = mockDb.me();
  if (!me) return false;
  if (msg.authorId === me.id) return true;
  if (me.role === 'admin') return true;
  const board = mockDb.get().boards.find((b) => b.id === msg.boardId);
  return !!board && board.ownerId === me.id && mockDb.isOpened(board);
}

function toPublic(m: MockMessage): Message {
  return {
    id: m.id,
    boardId: m.boardId,
    nickname: m.nickname,
    content: m.content,
    cardDesign: m.cardDesign,
    stickers: m.stickers,
    createdAt: m.createdAt,
    isMine: m.authorId === mockDb.me()?.id,
  };
}

const visible = () => mockDb.get().messages.filter((m) => !m.isHidden && canSelect(m));

export const mockMessagesApi: MessagesApi = {
  async getMyMessage(boardId) {
    await delay(150);
    const me = mockDb.me();
    const m = visible().find((x) => x.boardId === boardId && x.authorId === me?.id);
    return m ? toPublic(m) : null;
  },
  async listMyBoardMessages(boardId) {
    await delay();
    // public_messages view 는 admin 이라도 남의 보드를 이 경로로 주지 않도록 board_id = 내 보드만 요청됨
    return visible()
      .filter((x) => x.boardId === boardId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(toPublic);
  },
  async upsertMessage(input, existingId) {
    await delay(400);
    const me = mockDb.me();
    if (!me) throw new AppError('로그인이 필요해요');
    const db = mockDb.get();
    const board = db.boards.find((b) => b.id === input.boardId);
    if (!board) throw new AppError('찾을 수 없어요');
    if (board.ownerId === me.id)
      throw new AppError('내 트리에는 선물을 남길 수 없어요', 'OWN_BOARD');
    if (mockDb.isOpened(board))
      throw new AppError('선물은 크리스마스 전까지만 남길 수 있어요 🎄', 'BOARD_LOCKED');
    const now = new Date().toISOString();
    const fields = {
      nickname: input.nickname,
      content: input.content,
      cardDesign: input.cardDesign,
      stickers: input.stickers,
      updatedAt: now,
    };
    let msg: MockMessage | undefined;
    if (existingId) {
      msg = db.messages.find((m) => m.id === existingId && m.authorId === me.id);
      if (!msg) throw new AppError('볼 수 없거나 할 수 없는 작업이에요 🔒', '42501');
      Object.assign(msg, fields);
    } else {
      if (db.messages.some((m) => m.boardId === input.boardId && m.authorId === me.id))
        throw new AppError('이 트리에는 이미 선물을 남겼어요. 수정해 주세요!', '23505');
      msg = {
        id: mockDb.newId('msg'),
        boardId: input.boardId,
        authorId: me.id,
        isHidden: false,
        createdAt: now,
        ...fields,
      };
      db.messages.push(msg);
    }
    mockDb.save();
    return toPublic(msg);
  },
  async deleteMessage(id) {
    await delay(250);
    const me = mockDb.me();
    const db = mockDb.get();
    const msg = db.messages.find((m) => m.id === id && m.authorId === me?.id);
    const board = msg && db.boards.find((b) => b.id === msg.boardId);
    if (!msg || !board) throw new AppError('볼 수 없거나 할 수 없는 작업이에요 🔒', '42501');
    if (mockDb.isOpened(board))
      throw new AppError('선물은 크리스마스 전까지만 남길 수 있어요 🎄', 'BOARD_LOCKED');
    db.messages = db.messages.filter((m) => m.id !== id);
    mockDb.save();
  },
};
