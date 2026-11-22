import { useState } from 'react';
import { cn } from '@/lib/cn';
import { STICKER_PACKS, STICKERS, type StickerDef } from './manifest';

interface Props {
  onPick: (id: string) => void;
  disabled?: boolean;
}

export function StickerPicker({ onPick, disabled }: Props) {
  const [pack, setPack] = useState<StickerDef['pack']>('basic');
  const list = STICKERS.filter((s) => s.pack === pack);
  return (
    <div>
      <div role="tablist" className="mb-2 flex gap-1">
        {STICKER_PACKS.map((p) => (
          <button
            key={p.value}
            role="tab"
            type="button"
            aria-selected={pack === p.value}
            onClick={() => setPack(p.value)}
            className={cn(
              'min-h-touch rounded-lg px-3 text-sm font-semibold',
              pack === p.value ? 'bg-white/15 text-gold-400' : 'text-snow-50/60',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
        {list.map((s) => (
          <button
            key={s.id}
            type="button"
            disabled={disabled}
            onClick={() => onPick(s.id)}
            className="flex aspect-square min-h-touch items-center justify-center rounded-xl bg-white/5 p-1.5 ring-1 ring-white/10 transition hover:bg-white/10 active:scale-95 disabled:opacity-40"
            aria-label={`${s.label} 스티커 추가`}
            title={s.label}
          >
            <img src={s.src} alt="" className="h-full w-full object-contain" draggable={false} />
          </button>
        ))}
      </div>
    </div>
  );
}
