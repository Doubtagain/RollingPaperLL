import { cn } from '@/lib/cn';
import { pad2 } from '@/lib/time';
import { useCountdown } from './useCountdown';

interface Props {
  openAt: string | undefined;
  /** 서버 기준 공개 여부 */
  opened: boolean | undefined;
  size?: 'banner' | 'big';
  className?: string;
}

export function CountdownBanner({ openAt, opened, size = 'banner', className }: Props) {
  const { days, hours, minutes, seconds, done } = useCountdown(openAt);

  if (!openAt) return null;

  if (opened) {
    return (
      <div
        className={cn(
          'rounded-2xl bg-gold-400/15 px-4 py-3 text-center font-bold text-gold-400 ring-1 ring-gold-400/30',
          className,
        )}
      >
        🎁 선물이 열렸어요!
      </div>
    );
  }

  if (size === 'big') {
    const cells: [number, string][] = [
      [days, '일'],
      [hours, '시간'],
      [minutes, '분'],
      [seconds, '초'],
    ];
    return (
      <div className={cn('text-center', className)}>
        <p className="mb-3 text-sm text-snow-50/70">크리스마스까지</p>
        <div className="flex justify-center gap-2" aria-live="off">
          {cells.map(([v, label]) => (
            <div key={label} className="w-[68px] rounded-2xl bg-white/10 py-3 ring-1 ring-white/10">
              <div className="text-2xl font-extrabold tabular-nums text-gold-400">{pad2(v)}</div>
              <div className="text-xs text-snow-50/60">{label}</div>
            </div>
          ))}
        </div>
        {done && <p className="mt-3 text-sm text-gold-400">곧 선물이 열려요…</p>}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 rounded-2xl bg-white/5 px-4 py-3 text-sm ring-1 ring-white/10',
        className,
      )}
    >
      <span>🎄 크리스마스까지</span>
      <strong className="font-extrabold text-gold-400">D-{days}</strong>
      <span className="tabular-nums text-snow-50/80">
        · {pad2(hours)}:{pad2(minutes)}:{pad2(seconds)}
      </span>
    </div>
  );
}
