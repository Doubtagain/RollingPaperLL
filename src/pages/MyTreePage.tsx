import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { EmptyState, ErrorState, PageShell } from '@/components/layout/PageShell';
import { GiftOpenAnimation } from '@/components/effects/GiftOpenAnimation';
import { Modal } from '@/components/ui/Modal';
import { FullscreenSpinner } from '@/components/ui/Spinner';
import { TreeIllustration } from '@/components/ui/TreeIllustration';
import { useMe } from '@/features/auth/AuthProvider';
import { CountdownBanner } from '@/features/countdown/CountdownBanner';
import { useBoardSummary } from '@/features/members/hooks';
import { GiftBox } from '@/features/messages/GiftBox';
import { useMyBoardMessages } from '@/features/messages/hooks';
import { MessageCard } from '@/features/messages/MessageCard';
import { cn } from '@/lib/cn';
import { STORAGE_KEYS } from '@/lib/constants';
import { safeStorage } from '@/lib/storage';
import { formatKst, formatKstShort } from '@/lib/time';
import { usePrefersReducedMotion } from '@/lib/useReducedMotion';
import type { Message } from '@/types/domain';

export default function MyTreePage() {
  const me = useMe();
  const summary = useBoardSummary(me.boardId);

  if (summary.isPending) return <FullscreenSpinner />;
  if (summary.isError) return <ErrorState onRetry={() => summary.refetch()} />;

  return (
    <PageShell className="max-w-3xl">
      <h1 className="text-center text-2xl font-extrabold">{me.name}의 트리 🎄</h1>
      {summary.data.opened ? (
        <OpenedView boardId={me.boardId} />
      ) : (
        <LockedView count={summary.data.count} openAt={summary.data.openAt} />
      )}
    </PageShell>
  );
}

/* ───────────────────────── 공개 전 ───────────────────────── */

function LockedView({ count, openAt }: { count: number; openAt: string }) {
  const reduced = usePrefersReducedMotion();
  const [shaking, setShaking] = useState<number | null>(null);
  const [tip, setTip] = useState(false);
  const shown = Math.min(count, 30);

  useEffect(() => {
    if (!tip) return;
    const t = setTimeout(() => setTip(false), 1800);
    return () => clearTimeout(t);
  }, [tip]);

  return (
    <div className="mt-2 flex flex-col items-center">
      <p className="text-center text-sm text-snow-50/70">
        {count > 0 ? (
          <>
            🎁 <strong className="text-gold-400">{count}개</strong>의 선물이 도착했어요
          </>
        ) : (
          <>아직 도착한 선물이 없어요. 곧 올 거예요 ☃️</>
        )}
      </p>

      <div className="relative mt-4 w-[58%] max-w-[260px]">
        <TreeIllustration starLit={count > 0} ornaments={Math.min(12, 4 + count)} />
      </div>

      <div className="relative mt-1 flex max-w-[340px] flex-wrap-reverse justify-center gap-1">
        {Array.from({ length: shown }, (_, i) => (
          <motion.button
            key={i}
            type="button"
            className="w-10"
            aria-label="선물 상자 (12월 25일에 열 수 있어요)"
            animate={
              reduced
                ? undefined
                : shaking === i
                  ? { rotate: [0, -14, 12, -8, 6, 0], y: [0, -6, 0] }
                  : { rotate: [0, -2, 2, 0] }
            }
            transition={
              shaking === i
                ? { duration: 0.6 }
                : { duration: 2.4 + (i % 5) * 0.3, repeat: Infinity, delay: (i % 7) * 0.2 }
            }
            onClick={() => {
              setShaking(i);
              setTip(true);
              setTimeout(() => setShaking(null), 650);
            }}
          >
            <GiftBox variant={i} />
          </motion.button>
        ))}
        {count > shown && (
          <span className="self-end text-xs font-bold text-gold-400">+{count - shown}</span>
        )}
        <AnimatePresence>
          {tip && (
            <motion.div
              role="status"
              className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-snow-50 px-4 py-2 text-sm font-bold text-night-900 shadow-lg"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {formatKstShort(openAt)}에 열 수 있어요 🎅
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <CountdownBanner openAt={openAt} opened={false} size="big" className="mt-10" />
      <p className="mt-3 text-xs text-snow-50/40">공개: {formatKst(openAt)} (KST)</p>
    </div>
  );
}

/* ───────────────────────── 공개 후 ───────────────────────── */

type View = 'grid' | 'tree';

function OpenedView({ boardId }: { boardId: string }) {
  const reduced = usePrefersReducedMotion();
  const messages = useMyBoardMessages(boardId, true);
  const [view, setView] = useState<View>(() =>
    safeStorage.get<View>(STORAGE_KEYS.myTreeView) === 'tree' ? 'tree' : 'grid',
  );
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [showIntro, setShowIntro] = useState(
    () => !reduced && !safeStorage.get<boolean>(STORAGE_KEYS.giftOpenSeen(boardId)),
  );

  const finishIntro = useCallback(() => {
    safeStorage.set(STORAGE_KEYS.giftOpenSeen(boardId), true);
    setShowIntro(false);
  }, [boardId]);

  const changeView = (v: View) => {
    setView(v);
    safeStorage.set(STORAGE_KEYS.myTreeView, v);
  };

  if (messages.isPending) return <FullscreenSpinner />;
  if (messages.isError) return <ErrorState onRetry={() => messages.refetch()} />;
  const list = messages.data;

  if (list.length === 0) {
    return (
      <EmptyState icon="🎄" title="받은 선물이 없어요" desc="내년엔 더 많은 선물이 올 거예요!" />
    );
  }

  return (
    <>
      <AnimatePresence>
        {showIntro && <GiftOpenAnimation messages={list} onDone={finishIntro} />}
      </AnimatePresence>

      <p className="mt-1 text-center text-sm text-snow-50/70">
        🎁 <strong className="text-gold-400">{list.length}개</strong>의 카드가 도착했어요
      </p>

      <div className="mt-4 flex justify-center">
        <div
          role="tablist"
          className="inline-flex rounded-full bg-white/5 p-1 ring-1 ring-white/10"
        >
          {(
            [
              ['grid', '카드 모아보기'],
              ['tree', '트리에 걸기'],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              role="tab"
              type="button"
              aria-selected={view === v}
              onClick={() => changeView(v)}
              className={cn(
                'min-h-touch rounded-full px-4 text-sm font-semibold',
                view === v ? 'bg-snow-50 text-night-900' : 'text-snow-50/70',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === 'grid' ? (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {list.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              className="text-left transition active:scale-[0.98]"
              aria-label={`${m.nickname}의 카드 열기`}
            >
              <MessageCard
                cardDesign={m.cardDesign}
                content={m.content}
                nickname={m.nickname}
                stickers={m.stickers}
              />
            </button>
          ))}
        </div>
      ) : (
        <TreeArrangement messages={list} onOpen={setActiveIndex} />
      )}

      <CardViewer messages={list} index={activeIndex} onChange={setActiveIndex} />
    </>
  );
}

/** 트리 배치 뷰: 카드를 트리 위 오너먼트처럼 배치 */
function TreeArrangement({
  messages,
  onOpen,
}: {
  messages: Message[];
  onOpen: (i: number) => void;
}) {
  // 삼각형 안쪽 좌표: 위에서부터 줄마다 1개씩 늘어남 (1, 2, 3, …)
  const rows = Math.max(1, Math.ceil((Math.sqrt(8 * messages.length + 1) - 1) / 2));
  const cardW = Math.min(16, 64 / (rows + 0.5));
  const slots: { x: number; y: number }[] = [];
  for (let row = 0; slots.length < messages.length; row++) {
    const perRow = row + 1;
    const t = rows === 1 ? 0.5 : row / (rows - 1); // 0(꼭대기) ~ 1(맨 아래)
    const y = 24 + t * 56; // 트리 높이 대비 %
    const spread = 8 + t * 58; // 아래로 갈수록 넓게
    for (let k = 0; k < perRow && slots.length < messages.length; k++) {
      const x = perRow === 1 ? 50 : 50 - spread / 2 + (spread * k) / (perRow - 1);
      slots.push({ x, y });
    }
  }
  return (
    <div className="relative mx-auto mt-6 aspect-[100/124] w-full max-w-md">
      <TreeIllustration className="absolute inset-x-0 top-0" ornaments={0} starLit />
      {messages.map((m, i) => {
        const s = slots[i]!;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onOpen(i)}
            className="absolute -translate-x-1/2 -translate-y-1/2 transition hover:z-10 hover:scale-110"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: `${cardW}%`,
              rotate: `${(i % 2 ? 1 : -1) * (3 + (i % 4))}deg`,
            }}
            aria-label={`${m.nickname}의 카드 열기`}
          >
            <span className="absolute -top-2 left-1/2 h-3 w-px bg-gold-400" aria-hidden />
            <MessageCard
              cardDesign={m.cardDesign}
              content={m.content}
              nickname={m.nickname}
              stickers={m.stickers}
              className="!shadow-md"
            />
          </button>
        );
      })}
    </div>
  );
}

/** 카드 확대 모달: 좌우 스와이프 / 화살표로 이동 */
function CardViewer({
  messages,
  index,
  onChange,
}: {
  messages: Message[];
  index: number | null;
  onChange: (i: number | null) => void;
}) {
  const reduced = usePrefersReducedMotion();
  const [dir, setDir] = useState(0);
  const m = index != null ? messages[index] : undefined;

  const go = useCallback(
    (delta: number) => {
      if (index == null) return;
      const next = index + delta;
      if (next < 0 || next >= messages.length) return;
      setDir(delta);
      onChange(next);
    },
    [index, messages.length, onChange],
  );

  useEffect(() => {
    if (index == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, go]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60 || info.velocity.x < -400) go(1);
    else if (info.offset.x > 60 || info.velocity.x > 400) go(-1);
  };

  return (
    <Modal open={index != null} onClose={() => onChange(null)} variant="bare">
      {m && (
        <div className="mx-auto w-[min(88vw,380px)]">
          <div className="relative overflow-visible">
            <AnimatePresence mode="popLayout" initial={false} custom={dir}>
              <motion.div
                key={m.id}
                custom={dir}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragEnd={onDragEnd}
                initial={reduced ? { opacity: 0 } : { x: dir * 240, opacity: 0, rotate: dir * 6 }}
                animate={{ x: 0, opacity: 1, rotate: 0 }}
                exit={reduced ? { opacity: 0 } : { x: dir * -240, opacity: 0, rotate: dir * -6 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="touch-pan-y"
              >
                <MessageCard
                  cardDesign={m.cardDesign}
                  content={m.content}
                  nickname={m.nickname}
                  stickers={m.stickers}
                />
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="mt-4 flex items-center justify-between text-snow-50">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={index === 0}
              className="min-h-touch min-w-touch rounded-full bg-white/10 text-xl disabled:opacity-30"
              aria-label="이전 카드"
            >
              ‹
            </button>
            <span className="text-sm tabular-nums text-snow-50/70">
              {(index ?? 0) + 1} / {messages.length}
            </span>
            <button
              type="button"
              onClick={() => go(1)}
              disabled={index === messages.length - 1}
              className="min-h-touch min-w-touch rounded-full bg-white/10 text-xl disabled:opacity-30"
              aria-label="다음 카드"
            >
              ›
            </button>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="mt-2 min-h-touch w-full text-sm text-snow-50/60"
          >
            닫기
          </button>
        </div>
      )}
    </Modal>
  );
}
