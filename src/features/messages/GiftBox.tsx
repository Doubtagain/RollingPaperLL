import { cn } from '@/lib/cn';

const COLORS = [
  ['var(--berry-600)', 'var(--gold-400)'],
  ['var(--pine-400)', 'var(--snow-50)'],
  ['var(--gold-400)', 'var(--berry-600)'],
  ['#5b7bd5', 'var(--snow-50)'],
  ['var(--snow-50)', 'var(--berry-600)'],
] as const;

interface Props {
  /** 색상 변형 인덱스 */
  variant?: number;
  className?: string;
  highlighted?: boolean;
}

export function GiftBox({ variant = 0, className, highlighted }: Props) {
  const [box, ribbon] = COLORS[Math.abs(variant) % COLORS.length]!;
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn(
        'h-auto w-full',
        highlighted && 'drop-shadow-[0_0_8px_rgba(244,201,93,0.9)]',
        className,
      )}
      aria-hidden="true"
    >
      <rect x="5" y="16" width="30" height="21" rx="2.5" fill={box} />
      <rect x="3" y="11" width="34" height="7" rx="2" fill={box} />
      <rect x="3" y="11" width="34" height="7" rx="2" fill="#000" opacity="0.12" />
      <rect x="17.5" y="11" width="5" height="26" fill={ribbon} />
      <path d="M20 11c-3-7-11-7-9-2 1 2 5 2 9 2zm0 0c3-7 11-7 9-2-1 2-5 2-9 2z" fill={ribbon} />
    </svg>
  );
}
