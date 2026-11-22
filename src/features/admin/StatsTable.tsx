import { useMemo, useState } from 'react';
import { ErrorState } from '@/components/layout/PageShell';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/cn';
import { LOW_RECEIVED_THRESHOLD, PART_LABEL } from '@/lib/constants';
import type { AdminStat } from '@/types/domain';
import { useAdminStats } from './hooks';

type SortKey = 'receivedCount' | 'writtenCount' | 'name';

export function StatsTable() {
  const stats = useAdminStats();
  const [sort, setSort] = useState<{ key: SortKey; asc: boolean }>({
    key: 'receivedCount',
    asc: true, // 기본: 받은 수 오름차순 → 적게 받은 사람이 위로
  });

  const rows = useMemo(() => {
    const list = [...(stats.data ?? [])];
    list.sort((a: AdminStat, b: AdminStat) => {
      const d =
        sort.key === 'name' ? a.name.localeCompare(b.name, 'ko') : a[sort.key] - b[sort.key];
      return (sort.asc ? d : -d) || a.name.localeCompare(b.name, 'ko');
    });
    return list;
  }, [stats.data, sort]);

  if (stats.isPending) return <Spinner />;
  if (stats.isError) return <ErrorState onRetry={() => stats.refetch()} />;

  const total = rows.reduce((s, r) => s + r.receivedCount, 0);
  const low = rows.filter((r) => r.receivedCount < LOW_RECEIVED_THRESHOLD).length;

  const th = (key: SortKey, label: string, align = 'text-right') => (
    <th className={cn('px-3 py-2 font-semibold', align)}>
      <button
        type="button"
        className="min-h-touch"
        onClick={() => setSort((s) => ({ key, asc: s.key === key ? !s.asc : true }))}
      >
        {label}
        {sort.key === key ? (sort.asc ? ' ▲' : ' ▼') : ''}
      </button>
    </th>
  );

  return (
    <div>
      <p className="mb-3 text-sm text-snow-50/70">
        전체 선물 <strong className="text-gold-400">{total}</strong>개 · {LOW_RECEIVED_THRESHOLD}개
        미만 받은 멤버 <strong className="text-red-300">{low}</strong>명
      </p>
      <div className="overflow-x-auto rounded-xl ring-1 ring-white/10">
        <table className="w-full min-w-[340px] text-sm">
          <thead className="bg-white/5 text-snow-50/70">
            <tr>
              {th('name', '이름', 'text-left')}
              <th className="px-3 py-2 text-left font-semibold">파트</th>
              {th('receivedCount', '받은')}
              {th('writtenCount', '남긴')}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isLow = r.receivedCount < LOW_RECEIVED_THRESHOLD;
              return (
                <tr
                  key={r.memberId}
                  className={cn('border-t border-white/5', isLow && 'bg-berry-600/15')}
                >
                  <td className="px-3 py-2 font-semibold">{r.name}</td>
                  <td className="px-3 py-2 text-snow-50/70">
                    {PART_LABEL[r.part]} · {r.generation}기
                  </td>
                  <td
                    className={cn(
                      'px-3 py-2 text-right tabular-nums',
                      isLow && 'font-bold text-red-300',
                    )}
                  >
                    {r.receivedCount}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.writtenCount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
