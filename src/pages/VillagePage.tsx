import { useMemo, useState } from 'react';
import { EmptyState, ErrorState, PageShell } from '@/components/layout/PageShell';
import { FullscreenSpinner } from '@/components/ui/Spinner';
import { useMe } from '@/features/auth/AuthProvider';
import { CountdownBanner } from '@/features/countdown/CountdownBanner';
import { useBoardSummaries, useMembers, useMyWrittenMemberIds } from '@/features/members/hooks';
import { MemberTreeCard } from '@/features/members/MemberTreeCard';
import { cn } from '@/lib/cn';
import { PARTS } from '@/lib/constants';
import type { Member, Part } from '@/types/domain';

type Filter = 'all' | Part;

export default function VillagePage() {
  const me = useMe();
  const members = useMembers();
  const summaries = useBoardSummaries();
  const written = useMyWrittenMemberIds();
  const [filter, setFilter] = useState<Filter>('all');

  const countByBoard = useMemo(
    () => new Map(summaries.data?.map((s) => [s.boardId, s.count])),
    [summaries.data],
  );
  const mySummary = summaries.data?.find((s) => s.boardId === me.boardId);

  const writtenSet = useMemo(() => written.data ?? new Set<string>(), [written.data]);
  const others = useMemo(
    () => (members.data ?? []).filter((m) => m.id !== me.id),
    [members.data, me.id],
  );
  const remaining = others.filter((m) => !writtenSet.has(m.id)).length;

  // 정렬: 내 트리 → 아직 안 쓴 멤버 → 쓴 멤버 (각 그룹 이름순)
  const sorted = useMemo(() => {
    const byName = (a: Member, b: Member) => a.name.localeCompare(b.name, 'ko');
    const list = others.filter((m) => filter === 'all' || m.part === filter);
    const notYet = list.filter((m) => !writtenSet.has(m.id)).sort(byName);
    const done = list.filter((m) => writtenSet.has(m.id)).sort(byName);
    return [...notYet, ...done];
  }, [others, filter, writtenSet]);

  if (members.isPending) return <FullscreenSpinner />;
  if (members.isError) return <ErrorState onRetry={() => members.refetch()} />;

  const meMember = members.data.find((m) => m.id === me.id) ?? me;
  const showMine = filter === 'all' || meMember.part === filter;

  return (
    <PageShell>
      <CountdownBanner openAt={mySummary?.openAt} opened={mySummary?.opened} />

      <section className="mt-5">
        <h1 className="text-xl font-extrabold">🎄 멋사 트리 마을</h1>
        <p className="mt-1 text-sm text-snow-50/70">
          {remaining > 0 ? (
            <>
              아직 선물을 안 남긴 멤버가 <strong className="text-gold-400">{remaining}명</strong>{' '}
              있어요
              <span className="ml-1 text-snow-50/40">
                ({others.length - remaining}/{others.length})
              </span>
            </>
          ) : (
            <>모든 멤버에게 선물을 남겼어요! 최고예요 🎅</>
          )}
        </p>
      </section>

      <div
        role="tablist"
        className="scrollbar-none -mx-4 mt-4 flex gap-1.5 overflow-x-auto px-4 pb-1"
      >
        {[{ value: 'all' as const, label: '전체' }, ...PARTS].map((p) => (
          <button
            key={p.value}
            role="tab"
            type="button"
            aria-selected={filter === p.value}
            onClick={() => setFilter(p.value)}
            className={cn(
              'min-h-touch shrink-0 rounded-full px-4 text-sm font-semibold transition',
              filter === p.value
                ? 'bg-snow-50 text-night-900'
                : 'bg-white/5 text-snow-50/70 ring-1 ring-white/10',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {showMine && (
          <MemberTreeCard
            member={meMember}
            giftCount={countByBoard.get(meMember.boardId)}
            written={false}
            isMe
          />
        )}
        {sorted.map((m) => (
          <MemberTreeCard
            key={m.id}
            member={m}
            giftCount={countByBoard.get(m.boardId)}
            written={writtenSet.has(m.id)}
            isMe={false}
          />
        ))}
      </div>
      {!showMine && sorted.length === 0 && (
        <EmptyState icon="🌲" title="이 파트에는 아직 멤버가 없어요" />
      )}
    </PageShell>
  );
}
