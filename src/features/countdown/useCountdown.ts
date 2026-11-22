import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { queryKeys } from '@/lib/queryKeys';
import { remainingUntil, type Remaining } from '@/lib/time';

/**
 * 카운트다운 표시용. 클라이언트 시간 기준이며 공개 판단에는 쓰지 않는다.
 * 0이 되는 순간 summary/messages 를 재조회해서 서버 판단(opened)을 받아온다.
 */
export function useCountdown(openAt: string | undefined): Remaining & { done: boolean } {
  const qc = useQueryClient();
  const [now, setNow] = useState(() => Date.now());
  const firedRef = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const rem = openAt
    ? remainingUntil(openAt, now)
    : { totalMs: 1, days: 0, hours: 0, minutes: 0, seconds: 0 };
  const done = !!openAt && rem.totalMs === 0;

  useEffect(() => {
    if (!openAt) return;
    if (!done) {
      firedRef.current = false;
      return;
    }
    if (firedRef.current) return;
    firedRef.current = true;
    // 서버 시계와 약간의 오차를 고려해 살짝 늦게 한 번 더
    const refetch = () => {
      void qc.invalidateQueries({ queryKey: queryKeys.boardSummaries });
      void qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'board-summary' });
      void qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'my-board-messages' });
    };
    refetch();
    const t = setTimeout(refetch, 3000);
    return () => clearTimeout(t);
  }, [done, openAt, qc]);

  return { ...rem, done };
}
