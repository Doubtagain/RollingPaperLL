import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { Footer } from '@/components/layout/PageShell';
import { FullscreenSpinner } from '@/components/ui/Spinner';
import { AdminGuard, AuthGuard } from '@/features/auth/guards';
import LoginPage from '@/pages/LoginPage';
import NotFoundPage from '@/pages/NotFoundPage';
import VillagePage from '@/pages/VillagePage';

const TreePage = lazy(() => import('@/pages/TreePage'));
const MyTreePage = lazy(() => import('@/pages/MyTreePage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));

function AppLayout() {
  return (
    <div className="relative flex min-h-[100dvh] flex-col">
      <AppHeader />
      <div className="flex-1">
        <Suspense fallback={<FullscreenSpinner />}>
          <Outlet />
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <AppLayout />,
    children: [
      {
        element: <AuthGuard />,
        children: [
          { path: '/', element: <VillagePage /> },
          { path: '/tree/:memberId', element: <TreePage /> },
          { path: '/me', element: <MyTreePage /> },
          {
            element: <AdminGuard />,
            children: [{ path: '/admin', element: <AdminPage /> }],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
