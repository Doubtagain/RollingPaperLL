import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { FieldError, Input } from '@/components/ui/Input';
import { FullscreenSpinner } from '@/components/ui/Spinner';
import { TreeIllustration } from '@/components/ui/TreeIllustration';
import { toast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/AuthProvider';
import { USE_MOCK } from '@/lib/constants';
import { toAppError } from '@/lib/errors';

export default function LoginPage() {
  const { status, signInWithKakao, linkMember, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  if (status === 'loading') return <FullscreenSpinner />;
  if (status === 'ready') return <Navigate to={from} replace />;

  return (
    <main className="relative z-10 mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center px-6 py-10">
      <VillageSkyline />
      <div className="relative w-full text-center">
        <p className="mb-1 text-sm font-semibold tracking-wide text-gold-400">
          LIKELION SUWON · CHRISTMAS
        </p>
        <h1 className="text-[28px] font-extrabold leading-tight">
          멋사 수원대
          <br />
          크리스마스 롤링페이퍼
        </h1>
        <p className="mt-3 text-sm text-snow-50/70">
          서로의 트리에 선물을 걸어 주세요.
          <br />
          선물은 <strong className="text-gold-400">11월 30일 수료식 저녁 7시</strong>에 열려요 🎁
        </p>
      </div>

      <div className="relative mt-10 w-full">
        {status === 'signedOut' ? (
          <KakaoStep onLogin={signInWithKakao} />
        ) : (
          <InviteStep
            onSubmit={async (code) => {
              await linkMember(code);
              navigate(from, { replace: true });
            }}
            onCancel={() => void signOut()}
          />
        )}
      </div>
    </main>
  );
}

function KakaoStep({ onLogin }: { onLogin: () => Promise<void> }) {
  const [loading, setLoading] = useState(false);
  return (
    <>
      <button
        type="button"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          try {
            await onLogin();
          } catch (e) {
            toast.error(toAppError(e).message);
            setLoading(false);
          }
        }}
        className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] font-bold text-[#191919] transition active:scale-[0.99] disabled:opacity-60"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#191919"
            d="M12 3C6.48 3 2 6.58 2 11c0 2.86 1.88 5.37 4.7 6.78-.2.74-.74 2.7-.85 3.12-.13.52.19.51.4.37.17-.11 2.66-1.8 3.73-2.53.66.1 1.33.15 2.02.15 5.52 0 10-3.58 10-8s-4.48-8-10-8z"
          />
        </svg>
        {loading ? '카카오로 이동 중…' : '카카오로 시작하기'}
      </button>
      {USE_MOCK && (
        <p className="mt-3 text-center text-xs text-snow-50/50">
          목 모드: 바로 로그인돼요. 다음 화면에서 초대코드 <code>XMAS-0001</code> 입력
        </p>
      )}
    </>
  );
}

function InviteStep({
  onSubmit,
  onCancel,
}: {
  onSubmit: (code: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  return (
    <form
      className="rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!code.trim()) return setError('초대코드를 입력해 주세요');
        setLoading(true);
        setError(undefined);
        try {
          await onSubmit(code);
        } catch {
          setError('초대코드를 다시 확인해 주세요 🎅');
        } finally {
          setLoading(false);
        }
      }}
    >
      <h2 className="font-bold">초대코드를 입력해 주세요</h2>
      <p className="mb-4 mt-1 text-sm text-snow-50/60">
        운영진에게 받은 코드로 내 트리와 계정을 연결해요. (처음 한 번만)
      </p>
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="XMAS-XXXXXX"
        autoCapitalize="characters"
        autoComplete="off"
        aria-invalid={!!error}
        className="text-center font-mono tracking-widest"
      />
      <FieldError message={error} />
      <Button type="submit" variant="gold" size="lg" className="mt-4 w-full" loading={loading}>
        내 트리 찾기 🎄
      </Button>
      <button
        type="button"
        onClick={onCancel}
        className="mt-2 min-h-touch w-full text-sm text-snow-50/50"
      >
        다른 계정으로 로그인
      </button>
    </form>
  );
}

/** 마을 일러스트 */
function VillageSkyline() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-0 flex items-end justify-center gap-2 opacity-60">
      <div className="w-16">
        <TreeIllustration ornaments={3} />
      </div>
      <svg viewBox="0 0 120 80" className="w-36" aria-hidden="true">
        <path d="M10 40 40 14l30 26v40H10z" fill="#24365a" />
        <path d="M4 42 40 10l36 32" stroke="#f8fafc" strokeWidth="6" fill="none" />
        <rect x="32" y="52" width="14" height="28" fill="#7a4a24" />
        <rect x="16" y="46" width="10" height="10" fill="#f4c95d" />
        <rect x="54" y="46" width="10" height="10" fill="#f4c95d" />
        <path d="M70 50 92 30l22 20v30H70z" fill="#1c2b48" />
        <path d="M66 52 92 28l26 24" stroke="#f8fafc" strokeWidth="5" fill="none" />
        <rect x="86" y="58" width="10" height="10" fill="#f4c95d" />
      </svg>
      <div className="w-24">
        <TreeIllustration starLit ornaments={8} />
      </div>
      <div className="w-12">
        <TreeIllustration ornaments={2} />
      </div>
    </div>
  );
}
