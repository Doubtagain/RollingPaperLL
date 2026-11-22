import { cn } from '@/lib/cn';

interface Props {
  /** 꼭대기 별 점등 (내가 이미 쓴 트리 등) */
  starLit?: boolean;
  className?: string;
  /** 오너먼트 장식 개수 (0~12) */
  ornaments?: number;
}

const ORNAMENT_POS: [number, number, string][] = [
  [50, 34, 'var(--berry-600)'],
  [40, 50, 'var(--gold-400)'],
  [61, 48, 'var(--snow-50)'],
  [33, 68, 'var(--snow-50)'],
  [52, 63, 'var(--berry-600)'],
  [68, 70, 'var(--gold-400)'],
  [26, 86, 'var(--berry-600)'],
  [44, 82, 'var(--gold-400)'],
  [62, 88, 'var(--snow-50)'],
  [76, 86, 'var(--berry-600)'],
  [36, 98, 'var(--gold-400)'],
  [58, 100, 'var(--berry-600)'],
];

export function TreeIllustration({ starLit = false, className, ornaments = 6 }: Props) {
  return (
    <svg viewBox="0 0 100 124" className={cn('h-auto w-full', className)} aria-hidden="true">
      <defs>
        <linearGradient id="tree-g" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--pine-400)" />
          <stop offset="1" stopColor="var(--pine-600)" />
        </linearGradient>
        <radialGradient id="star-glow">
          <stop offset="0" stopColor="var(--gold-400)" stopOpacity="0.9" />
          <stop offset="1" stopColor="var(--gold-400)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="44" y="104" width="12" height="14" rx="2" fill="#7a4a24" />
      <path d="M50 16 70 46H60l16 26H66l20 34H14l20-34H24l16-26H30z" fill="url(#tree-g)" />
      <path
        d="M34 46q16 8 32 0M27 72q23 10 46 0"
        stroke="var(--gold-400)"
        strokeOpacity="0.55"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      {ORNAMENT_POS.slice(0, ornaments).map(([x, y, c], i) => (
        <circle key={i} cx={x} cy={y} r="2.6" fill={c} />
      ))}
      {starLit && <circle cx="50" cy="13" r="14" fill="url(#star-glow)" />}
      <path
        d="M50 4l2.9 6 6.6.8-4.9 4.5 1.3 6.5L50 18.6l-5.9 3.2 1.3-6.5-4.9-4.5 6.6-.8z"
        fill={starLit ? 'var(--gold-400)' : '#5b6478'}
        stroke={starLit ? '#fff3c4' : 'none'}
        strokeWidth="0.8"
      />
    </svg>
  );
}
