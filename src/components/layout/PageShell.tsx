import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main className={cn('relative z-10 mx-auto w-full max-w-5xl px-4 pb-16 pt-5', className)}>
      {children}
    </main>
  );
}

export function Footer() {
  return (
    <footer className="relative z-10 px-4 pb-8 pt-4 text-center text-[11px] leading-relaxed text-snow-50/40">
      <p>멋쟁이사자처럼 수원대학교 · Merry Christmas 🎄</p>
      <p>
        Stickers:{' '}
        <a
          className="underline"
          href="https://github.com/microsoft/fluentui-emoji"
          target="_blank"
          rel="noreferrer"
        >
          Fluent Emoji by Microsoft (MIT)
        </a>{' '}
        · Font: Nanum Pen Script (SIL OFL 1.1)
      </p>
    </footer>
  );
}

export function EmptyState({ icon, title, desc }: { icon: string; title: string; desc?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <div className="text-4xl" aria-hidden>
        {icon}
      </div>
      <p className="font-bold">{title}</p>
      {desc && <p className="text-sm text-snow-50/60">{desc}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="text-4xl" aria-hidden>
        🥶
      </div>
      <p className="font-bold">{message ?? '불러오지 못했어요'}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="min-h-touch rounded-xl bg-white/10 px-4 text-sm font-semibold"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}
