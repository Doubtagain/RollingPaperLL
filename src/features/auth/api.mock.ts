import { AppError } from '@/lib/errors';
import { delay, MOCK_AUTH_ID, mockDb } from '@/mocks/db';
import type { Member } from '@/types/domain';
import type { AuthApi, AuthSession } from './api';

const listeners = new Set<(s: AuthSession | null) => void>();
const emit = () => listeners.forEach((l) => l(mockDb.get().session));

export function mockMemberToDomain(id: string): Member | null {
  const m = mockDb.get().members.find((x) => x.id === id);
  const b = m && mockDb.boardOf(m.id);
  if (!m || !b) return null;
  return {
    id: m.id,
    name: m.name,
    part: m.part,
    generation: m.generation,
    role: m.role,
    avatarUrl: m.avatarUrl,
    boardId: b.id,
  };
}

export const mockAuthApi: AuthApi = {
  async getSession() {
    return mockDb.get().session;
  },
  onChange(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  async signInWithKakao() {
    await delay(300);
    mockDb.get().session = { authId: MOCK_AUTH_ID };
    mockDb.save();
    emit();
  },
  async signOut() {
    mockDb.get().session = null;
    mockDb.save();
    emit();
  },
  async getMyMember() {
    await delay(100);
    const me = mockDb.me();
    return me ? mockMemberToDomain(me.id) : null;
  },
  async linkMember(inviteCode) {
    await delay(300);
    const s = mockDb.get().session;
    if (!s) throw new AppError('로그인이 필요해요');
    const m = mockDb.get().members.find((x) => x.inviteCode === inviteCode.trim().toUpperCase());
    if (!m) throw new AppError('초대코드를 다시 확인해 주세요 🎅', 'INVALID_INVITE');
    if (m.authId && m.authId !== s.authId)
      throw new AppError('이미 다른 계정과 연결된 초대코드예요', 'ALREADY_LINKED');
    m.authId = s.authId;
    mockDb.save();
    return mockMemberToDomain(m.id)!;
  },
};
