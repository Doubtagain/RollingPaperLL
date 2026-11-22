import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type { Member } from '@/types/domain';
import { authApi, type AuthSession } from './api';

type Status = 'loading' | 'signedOut' | 'needsInvite' | 'ready';

interface AuthContextValue {
  status: Status;
  session: AuthSession | null;
  member: Member | null;
  isAdmin: boolean;
  signInWithKakao: () => Promise<void>;
  signOut: () => Promise<void>;
  linkMember: (code: string) => Promise<Member>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  const resolve = useCallback(async (s: AuthSession | null) => {
    setSession(s);
    if (!s) {
      setMember(null);
      setStatus('signedOut');
      return;
    }
    try {
      const m = await authApi.getMyMember();
      setMember(m);
      setStatus(m ? 'ready' : 'needsInvite');
    } catch {
      setMember(null);
      setStatus('needsInvite');
    }
  }, []);

  const lastAuthId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    const handle = (s: AuthSession | null) => {
      if (!alive) return;
      // 같은 계정의 토큰 갱신 이벤트 등은 무시
      if (lastAuthId.current === (s?.authId ?? null)) return;
      lastAuthId.current = s?.authId ?? null;
      void resolve(s);
    };
    authApi.getSession().then(handle);
    const off = authApi.onChange(handle);
    return () => {
      alive = false;
      off();
    };
  }, [resolve]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      member,
      isAdmin: member?.role === 'admin',
      signInWithKakao: () => authApi.signInWithKakao(),
      signOut: async () => {
        await authApi.signOut();
        qc.clear();
      },
      linkMember: async (code) => {
        const m = await authApi.linkMember(code);
        setMember(m);
        setStatus('ready');
        return m;
      },
    }),
    [status, session, member, qc],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/** ready 상태에서만 쓰는 훅 (AuthGuard 내부) */
export function useMe(): Member {
  const { member } = useAuth();
  if (!member) throw new Error('useMe() called outside AuthGuard');
  return member;
}
