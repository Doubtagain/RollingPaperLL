import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthProvider';
import { cn } from '@/lib/cn';
import { USE_MOCK } from '@/lib/constants';

export function AppHeader() {
  const { member, isAdmin, signOut } = useAuth();
  const navCls = ({ isActive }: { isActive: boolean }) =>
    cn(
      'min-h-touch inline-flex items-center rounded-lg px-3 text-sm font-semibold',
      isActive ? 'bg-white/10 text-gold-400' : 'text-snow-50/80 hover:text-snow-50',
    );
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-night-900/70 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-1 px-4">
        <Link to="/" className="mr-auto flex items-center gap-1.5 font-extrabold">
          <span aria-hidden>🎄</span>
          <span className="text-[15px] sm:hidden">롤링페이퍼</span>
          <span className="hidden text-[15px] sm:inline">멋사 수원대 롤링페이퍼</span>
          {USE_MOCK && (
            <span className="ml-1 rounded bg-gold-400/20 px-1.5 py-0.5 text-[10px] text-gold-400">
              MOCK
            </span>
          )}
        </Link>
        {member && (
          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={navCls}>
              마을
            </NavLink>
            <NavLink to="/me" className={navCls}>
              내 트리
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin" className={navCls}>
                관리
              </NavLink>
            )}
            <button
              type="button"
              onClick={() => void signOut()}
              className="min-h-touch min-w-touch rounded-lg px-2 text-sm text-snow-50/50 hover:text-snow-50"
              aria-label="로그아웃"
              title="로그아웃"
            >
              ⎋
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
