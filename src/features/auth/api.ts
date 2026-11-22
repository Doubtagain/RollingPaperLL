import { USE_MOCK } from '@/lib/constants';
import { toAppError, unwrap } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import type { MemberDirectoryRow } from '@/types/db';
import type { Member } from '@/types/domain';
import { mapMember } from '@/features/members/mapper';
import { mockAuthApi } from './api.mock';

export interface AuthSession {
  authId: string;
}

export interface AuthApi {
  getSession(): Promise<AuthSession | null>;
  onChange(cb: (s: AuthSession | null) => void): () => void;
  signInWithKakao(): Promise<void>;
  signOut(): Promise<void>;
  /** 로그인한 계정과 연결된 멤버 (없으면 null → 초대코드 단계) */
  getMyMember(): Promise<Member | null>;
  linkMember(inviteCode: string): Promise<Member>;
}

const realAuthApi: AuthApi = {
  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session ? { authId: data.session.user.id } : null;
  },
  onChange(cb) {
    const { data } = supabase.auth.onAuthStateChange((_e, session) =>
      cb(session ? { authId: session.user.id } : null),
    );
    return () => data.subscription.unsubscribe();
  },
  async signInWithKakao() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo: `${window.location.origin}/login` },
    });
    if (error) throw toAppError(error);
  },
  async signOut() {
    await supabase.auth.signOut();
  },
  async getMyMember() {
    const rows = unwrap(await supabase.rpc('get_my_member')) as MemberDirectoryRow[] | null;
    const row = rows?.[0];
    return row ? mapMember(row) : null;
  },
  async linkMember(inviteCode) {
    const rows = unwrap(
      await supabase.rpc('link_member', { invite_code: inviteCode.trim().toUpperCase() }),
    ) as MemberDirectoryRow[] | null;
    const row = rows?.[0];
    if (!row) throw new Error('INVALID_INVITE');
    return mapMember(row);
  },
};

export const authApi: AuthApi = USE_MOCK ? mockAuthApi : realAuthApi;
