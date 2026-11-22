import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { cn } from '@/lib/cn';
import type { StickerPlacement } from '@/types/domain';
import { STICKER_MAP } from './manifest';

/** 스티커 기본 크기: 카드 너비의 22% */
const BASE_SIZE = 0.22;
const ROT_MIN = -30;
const ROT_MAX = 30;
const SCALE_MIN = 0.6;
const SCALE_MAX = 1.6;
const LONG_PRESS_MS = 550;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

interface Props {
  stickers: StickerPlacement[];
  editable?: boolean;
  onChange?: (next: StickerPlacement[]) => void;
}

/**
 * 카드 위 absolute 레이어. 좌표는 0~1 비율로 저장 → 카드 크기와 무관하게 같은 상대 위치.
 * 편집 모드: 드래그 이동, 핸들(또는 두 손가락 핀치)로 회전·크기, 길게 눌러 삭제, × 버튼 삭제.
 * 보기 모드: 정적 렌더링. 매니페스트에 없는 id 는 조용히 무시.
 */
export function StickerLayer({ stickers, editable = false, onChange }: Props) {
  const layerRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const stickersRef = useRef(stickers);
  stickersRef.current = stickers;

  // 제스처 상태
  const gesture = useRef<
    | null
    | {
        kind: 'move';
        index: number;
        pointerId: number;
        startX: number;
        startY: number;
        offX: number;
        offY: number;
        moved: boolean;
        timer: number | null;
      }
    | {
        kind: 'transform';
        index: number;
        startAngle: number;
        startDist: number;
        startRotate: number;
        startScale: number;
      }
  >(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());

  useEffect(() => {
    if (selected !== null && selected >= stickers.length) setSelected(null);
  }, [stickers.length, selected]);

  const update = (index: number, patch: Partial<StickerPlacement>) => {
    const next = stickersRef.current.map((s, i) => (i === index ? { ...s, ...patch } : s));
    onChange?.(next);
  };
  const remove = (index: number) => {
    onChange?.(stickersRef.current.filter((_, i) => i !== index));
    setSelected(null);
  };

  const rect = () => layerRef.current!.getBoundingClientRect();
  const centerPx = (s: StickerPlacement) => {
    const r = rect();
    return { cx: r.left + s.x * r.width, cy: r.top + s.y * r.height };
  };

  const clearTimer = () => {
    const g = gesture.current;
    if (g?.kind === 'move' && g.timer) {
      window.clearTimeout(g.timer);
      g.timer = null;
    }
  };

  // ── 스티커 본체: 이동 + 길게 눌러 삭제 ──
  const onStickerDown = (e: ReactPointerEvent, index: number) => {
    if (!editable) return;
    e.stopPropagation();
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setSelected(index);

    // 두 번째 손가락 → 핀치 제스처로 전환
    if (pointers.current.size === 2) {
      clearTimer();
      startPinch(index);
      return;
    }
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const s = stickersRef.current[index]!;
    const { cx, cy } = centerPx(s);
    gesture.current = {
      kind: 'move',
      index,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      offX: e.clientX - cx,
      offY: e.clientY - cy,
      moved: false,
      timer: window.setTimeout(() => {
        const g = gesture.current;
        if (g?.kind === 'move' && !g.moved) {
          gesture.current = null;
          navigator.vibrate?.(30);
          remove(index);
        }
      }, LONG_PRESS_MS),
    };
  };

  const startPinch = (index: number) => {
    const [a, b] = [...pointers.current.values()];
    if (!a || !b) return;
    const s = stickersRef.current[index]!;
    gesture.current = {
      kind: 'transform',
      index,
      startAngle: Math.atan2(b.y - a.y, b.x - a.x),
      startDist: Math.hypot(b.x - a.x, b.y - a.y) || 1,
      startRotate: s.rotate,
      startScale: s.scale,
    };
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!editable) return;
    if (pointers.current.has(e.pointerId)) {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    const g = gesture.current;
    if (!g) return;

    if (g.kind === 'move') {
      if (e.pointerId !== g.pointerId) return;
      if (!g.moved && Math.hypot(e.clientX - g.startX, e.clientY - g.startY) > 6) {
        g.moved = true;
        clearTimer();
      }
      if (!g.moved) return;
      const r = rect();
      update(g.index, {
        x: clamp((e.clientX - g.offX - r.left) / r.width, 0, 1),
        y: clamp((e.clientY - g.offY - r.top) / r.height, 0, 1),
      });
      return;
    }

    // transform: 핀치(두 포인터) 또는 핸들(한 포인터, 스티커 중심 기준)
    let angle: number;
    let dist: number;
    if (pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      angle = Math.atan2(b!.y - a!.y, b!.x - a!.x);
      dist = Math.hypot(b!.x - a!.x, b!.y - a!.y);
    } else {
      const { cx, cy } = centerPx(stickersRef.current[g.index]!);
      angle = Math.atan2(e.clientY - cy, e.clientX - cx);
      dist = Math.hypot(e.clientX - cx, e.clientY - cy);
    }
    const deltaDeg = ((angle - g.startAngle) * 180) / Math.PI;
    update(g.index, {
      rotate: Math.round(clamp(g.startRotate + deltaDeg, ROT_MIN, ROT_MAX)),
      scale: Number(clamp((g.startScale * dist) / g.startDist, SCALE_MIN, SCALE_MAX).toFixed(2)),
    });
  };

  const onPointerUp = (e: ReactPointerEvent) => {
    pointers.current.delete(e.pointerId);
    clearTimer();
    if (pointers.current.size === 0) gesture.current = null;
  };

  // ── 회전·크기 핸들 ──
  const onHandleDown = (e: ReactPointerEvent, index: number) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const s = stickersRef.current[index]!;
    const { cx, cy } = centerPx(s);
    gesture.current = {
      kind: 'transform',
      index,
      startAngle: Math.atan2(e.clientY - cy, e.clientX - cx),
      startDist: Math.hypot(e.clientX - cx, e.clientY - cy) || 1,
      startRotate: s.rotate,
      startScale: s.scale,
    };
  };

  return (
    <div
      ref={layerRef}
      className={cn('absolute inset-0 z-[2]', !editable && 'pointer-events-none')}
      onPointerDown={(e) => {
        if (!editable) return;
        // 스티커를 잡은 상태에서 카드 아무 곳에 두 번째 손가락 → 핀치
        if (selected !== null && pointers.current.size === 1) {
          pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          clearTimer();
          startPinch(selected);
          return;
        }
        setSelected(null);
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {stickers.map((s, i) => {
        const def = STICKER_MAP[s.id];
        if (!def) return null; // 매니페스트에 없는 id 는 무시 (크래시 금지)
        const isSel = editable && selected === i;
        return (
          <div
            key={`${s.id}-${i}`}
            className={cn(
              'absolute aspect-square',
              editable && 'cursor-grab touch-none select-none active:cursor-grabbing',
            )}
            style={{
              left: `${s.x * 100}%`,
              top: `${s.y * 100}%`,
              width: `${BASE_SIZE * 100}%`,
              transform: `translate(-50%, -50%) rotate(${s.rotate}deg) scale(${s.scale})`,
            }}
            onPointerDown={(e) => onStickerDown(e, i)}
          >
            <img
              src={def.src}
              alt={def.label}
              draggable={false}
              className="pointer-events-none h-full w-full object-contain drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)]"
            />
            {isSel && (
              <>
                <div className="pointer-events-none absolute -inset-1 rounded-lg border-2 border-dashed border-gold-400" />
                <button
                  type="button"
                  aria-label={`${def.label} 스티커 삭제`}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(i);
                  }}
                  className="absolute -left-4 -top-4 flex h-8 w-8 items-center justify-center rounded-full bg-berry-600 text-sm font-bold text-white shadow"
                  style={{ transform: `scale(${1 / s.scale})` }}
                >
                  ×
                </button>
                <div
                  role="slider"
                  aria-label="회전 및 크기 조절"
                  aria-valuenow={s.rotate}
                  tabIndex={0}
                  onPointerDown={(e) => onHandleDown(e, i)}
                  onKeyDown={(e) => {
                    const step: Record<string, Partial<StickerPlacement>> = {
                      ArrowLeft: { rotate: clamp(s.rotate - 5, ROT_MIN, ROT_MAX) },
                      ArrowRight: { rotate: clamp(s.rotate + 5, ROT_MIN, ROT_MAX) },
                      ArrowUp: { scale: clamp(s.scale + 0.1, SCALE_MIN, SCALE_MAX) },
                      ArrowDown: { scale: clamp(s.scale - 0.1, SCALE_MIN, SCALE_MAX) },
                    };
                    const p = step[e.key];
                    if (p) {
                      e.preventDefault();
                      update(i, p);
                    }
                  }}
                  className="absolute -bottom-4 -right-4 flex h-8 w-8 cursor-nwse-resize touch-none items-center justify-center rounded-full bg-gold-400 text-sm text-night-900 shadow"
                  style={{ transform: `scale(${1 / s.scale})` }}
                >
                  ↻
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
