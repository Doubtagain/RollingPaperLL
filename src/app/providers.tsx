import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'framer-motion';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { toast } from '@/components/ui/Toast';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { toAppError } from '@/lib/errors';

function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      // 조회 실패는 공통 토스트 (화면에는 각 페이지의 ErrorState 도 표시)
      onError: (err) => toast.error(toAppError(err).message),
    }),
    mutationCache: new MutationCache({
      // mutation 은 각 화면이 mutateAsync + try/catch 로 toast 를 띄우므로 여기선 로깅만
      onError: (err) => console.warn('[mutation]', err),
    }),
    defaultOptions: {
      queries: {
        retry: (count, err) => {
          const code = toAppError(err).code;
          if (code === '42501' || code === 'PGRST116' || code === 'PGRST301') return false;
          return count < 2;
        },
        refetchOnWindowFocus: true,
      },
    },
  });
}

export function Providers({ children }: { children: ReactNode }) {
  const [qc] = useState(createQueryClient);
  return (
    <QueryClientProvider client={qc}>
      {/* reducedMotion="user": OS 설정이 reduce 면 framer-motion 의 transform 애니메이션 비활성 */}
      <MotionConfig reducedMotion="user">
        <AuthProvider>{children}</AuthProvider>
      </MotionConfig>
    </QueryClientProvider>
  );
}
