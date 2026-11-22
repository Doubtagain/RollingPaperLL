import { delay, mockDb, type MockBoard } from '@/mocks/db';
import { mockMemberToDomain } from '@/features/auth/api.mock';
import type { BoardSummary, Member } from '@/types/domain';
import type { MembersApi } from './api';

export function mockSummary(b: MockBoard): BoardSummary {
  return {
    boardId: b.id,
    count: mockDb.get().messages.filter((m) => m.boardId === b.id && !m.isHidden).length,
    opened: mockDb.isOpened(b),
    openAt: b.openAt,
  };
}

export const mockMembersApi: MembersApi = {
  async listMembers() {
    await delay();
    return mockDb
      .get()
      .members.map((m) => mockMemberToDomain(m.id))
      .filter((m): m is Member => m !== null)
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  },
  async listBoardSummaries() {
    await delay();
    return mockDb.get().boards.map(mockSummary);
  },
  async getBoardSummary(boardId) {
    await delay(150);
    const b = mockDb.get().boards.find((x) => x.id === boardId);
    if (!b) throw new Error('PGRST116');
    return mockSummary(b);
  },
  async getMyWrittenMemberIds() {
    await delay(150);
    const me = mockDb.me();
    if (!me) return [];
    const { boards, messages } = mockDb.get();
    const boardIds = new Set(messages.filter((m) => m.authorId === me.id).map((m) => m.boardId));
    return boards.filter((b) => boardIds.has(b.id) && b.ownerId).map((b) => b.ownerId!);
  },
};
