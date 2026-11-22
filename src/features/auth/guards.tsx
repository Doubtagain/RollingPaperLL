import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { FullscreenSpinner } from '@/components/ui/Spinner';
import { useAuth } from './AuthProvider';

/** 세션 + 멤버 연결 완료 상태만 통과. 그 외엔 /login (초대코드 단계 포함) */
export function AuthGuard() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <FullscreenSpinner />;
  if (status !== 'ready') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

export function AdminGuard() {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}
