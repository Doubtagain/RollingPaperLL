import { useMemo, useState } from 'react';
import { ErrorState } from '@/components/layout/PageShell';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { MessageCard } from '@/features/messages/MessageCard';
import { cn } from '@/lib/cn';
import { formatKst } from '@/lib/time';
import { HideMessageButton } from './HideMessageButton';
import { useAdminMessages } from './hooks';

/** admin 전용: 전체 메시지 + 작성자 실명 확인 + 숨김 토글 */
export function MessageManager() {
  const messages = useAdminMessages();
  const [q, setQ] = useState('');
  const [onlyHidden, setOnlyHidden] = useState(false);

  const filtered = useMemo(() => {
    const k = q.trim();
    return (messages.data ?? []).filter(
      (m) =>
        (!onlyHidden || m.isHidden) &&
        (!k ||
          m.content.includes(k) ||
          m.nickname.includes(k) ||
          m.authorName.includes(k) ||
          (m.ownerName ?? '').includes(k)),
    );
  }, [messages.data, q, onlyHidden]);

  if (messages.isPending) return <Spinner />;
  if (messages.isError) return <ErrorState onRetry={() => messages.refetch()} />;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Input placeholder="내용/이름 검색" value={q} onChange={(e) => setQ(e.target.value)} />
        <label className="flex min-h-touch shrink-0 items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            checked={onlyHidden}
            onChange={(e) => setOnlyHidden(e.target.checked)}
            className="h-4 w-4 accent-[var(--gold-400)]"
          />
          숨김만
        </label>
      </div>
      <p className="mb-2 text-xs text-snow-50/50">{filtered.length}개</p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {filtered.map((m) => (
          <li
            key={m.id}
            className={cn(
              'flex gap-3 rounded-xl bg-white/5 p-3 ring-1 ring-white/10',
              m.isHidden && 'opacity-60',
            )}
          >
            <div className="w-20 shrink-0">
              <MessageCard
                cardDesign={m.cardDesign}
                content={m.content}
                nickname={m.nickname}
                stickers={m.stickers}
              />
            </div>
            <div className="min-w-0 flex-1 text-sm">
              <p className="text-xs text-snow-50/60">
                <strong className="text-snow-50">{m.authorName}</strong> →{' '}
                {m.ownerName ?? '단체 트리'}
              </p>
              <p className="text-xs text-snow-50/40">
                닉네임 “{m.nickname}” · {formatKst(m.createdAt)}
              </p>
              <p className="mt-1 line-clamp-3 whitespace-pre-wrap break-words">{m.content}</p>
              <div className="mt-2">
                <HideMessageButton id={m.id} hidden={m.isHidden} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
