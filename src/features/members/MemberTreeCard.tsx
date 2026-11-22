import { Link } from 'react-router-dom';
import { TreeIllustration } from '@/components/ui/TreeIllustration';
import { GiftBox } from '@/features/messages/GiftBox';
import { cn } from '@/lib/cn';
import { PART_LABEL, VILLAGE_GIFT_ICON_MAX } from '@/lib/constants';
import type { Member } from '@/types/domain';

interface Props {
  member: Member;
  giftCount: number | undefined;
  written: boolean;
  isMe: boolean;
}

export function PartBadge({ part }: { part: Member['part'] }) {
  return (
    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-snow-50/80">
      {PART_LABEL[part]}
    </span>
  );
}

export function GiftRow({ count, max = VILLAGE_GIFT_ICON_MAX }: { count: number; max?: number }) {
  const shown = Math.min(count, max);
  return (
    <div
      className="flex min-h-[18px] items-end justify-center gap-0.5"
      aria-label={`선물 ${count}개`}
    >
      {Array.from({ length: shown }, (_, i) => (
        <GiftBox key={i} variant={i} className="!w-[14px]" />
      ))}
      {count > max && (
        <span className="ml-1 text-[11px] font-bold text-gold-400">+{count - max}</span>
      )}
      {count === 0 && <span className="text-[11px] text-snow-50/40">아직 선물이 없어요</span>}
    </div>
  );
}

export function MemberTreeCard({ member, giftCount, written, isMe }: Props) {
  return (
    <Link
      to={isMe ? '/me' : `/tree/${member.id}`}
      className={cn(
        'group relative flex flex-col items-center rounded-2xl bg-white/[0.04] px-3 pb-3 pt-4 ring-1 ring-white/10 transition hover:bg-white/[0.08] active:scale-[0.98]',
        isMe && 'bg-gold-400/[0.08] ring-gold-400/40',
      )}
    >
      {isMe && (
        <span className="absolute left-2 top-2 rounded-full bg-gold-400 px-2 py-0.5 text-[10px] font-bold text-night-900">
          내 트리
        </span>
      )}
      {written && !isMe && (
        <span className="absolute right-2 top-2 rounded-full bg-pine-600 px-2 py-0.5 text-[10px] font-bold text-white">
          작성 완료
        </span>
      )}
      <div className="w-[72%] transition group-hover:-translate-y-0.5">
        <TreeIllustration
          starLit={written || isMe}
          ornaments={Math.min(12, 3 + (giftCount ?? 0))}
        />
      </div>
      <div className="mt-1 w-full">
        <GiftRow count={giftCount ?? 0} />
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <span className="font-bold">{member.name}</span>
        <PartBadge part={member.part} />
      </div>
    </Link>
  );
}
