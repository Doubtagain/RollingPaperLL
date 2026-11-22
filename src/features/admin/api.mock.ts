import { AppError } from '@/lib/errors';
import { delay, mockDb } from '@/mocks/db';
import type { AdminApi } from './api';

function assertAdmin() {
  if (!mockDb.isAdmin()) throw new AppError('볼 수 없거나 할 수 없는 작업이에요 🔒', '42501');
}

export const mockAdminApi: AdminApi = {
  async getStats() {
    await delay();
    assertAdmin();
    const { members, boards, messages } = mockDb.get();
    return members.map((m) => {
      const board = boards.find((b) => b.ownerId === m.id);
      return {
        memberId: m.id,
        name: m.name,
        part: m.part,
        generation: m.generation,
        receivedCount: messages.filter((x) => x.boardId === board?.id && !x.isHidden).length,
        writtenCount: messages.filter((x) => x.authorId === m.id).length,
      };
    });
  },
  async listMembers() {
    await delay();
    assertAdmin();
    return mockDb
      .get()
      .members.map((m) => ({
        id: m.id,
        name: m.name,
        part: m.part,
        generation: m.generation,
        role: m.role,
        avatarUrl: m.avatarUrl,
        inviteCode: m.inviteCode,
        linked: !!m.authId,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  },
  async createMember(input) {
    await delay();
    assertAdmin();
    const db = mockDb.get();
    if (db.members.some((m) => m.inviteCode === input.inviteCode))
      throw new AppError('이미 있는 초대코드예요', '23505');
    const id = mockDb.newId('m');
    const openAt = db.boards[0]?.openAt ?? new Date().toISOString();
    db.members.push({ id, authId: null, avatarUrl: null, ...input });
    db.boards.push({ id: mockDb.newId('b'), ownerId: id, isGroup: false, title: null, openAt });
    mockDb.save();
  },
  async updateRole(memberId, role) {
    await delay();
    assertAdmin();
    const m = mockDb.get().members.find((x) => x.id === memberId);
    if (m) m.role = role;
    mockDb.save();
  },
  async listMessages() {
    await delay();
    assertAdmin();
    const { members, boards, messages } = mockDb.get();
    const nameOf = (id: string | null | undefined) => members.find((m) => m.id === id)?.name;
    return messages
      .map((m) => ({
        id: m.id,
        boardId: m.boardId,
        nickname: m.nickname,
        content: m.content,
        cardDesign: m.cardDesign,
        stickers: m.stickers,
        createdAt: m.createdAt,
        authorId: m.authorId,
        authorName: nameOf(m.authorId) ?? '(알 수 없음)',
        ownerName: nameOf(boards.find((b) => b.id === m.boardId)?.ownerId) ?? null,
        isHidden: m.isHidden,
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async setHidden(messageId, hidden) {
    await delay(150);
    assertAdmin();
    const m = mockDb.get().messages.find((x) => x.id === messageId);
    if (m) m.isHidden = hidden;
    mockDb.save();
  },
  async setOpenAt(iso) {
    await delay();
    assertAdmin();
    mockDb.get().boards.forEach((b) => (b.openAt = iso));
    mockDb.save();
  },
};
