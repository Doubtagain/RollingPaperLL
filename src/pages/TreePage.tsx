import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { EmptyState, ErrorState, PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { ConfirmModal, Modal } from '@/components/ui/Modal';
import { FullscreenSpinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';
import { TreeIllustration } from '@/components/ui/TreeIllustration';
import { useMe } from '@/features/auth/AuthProvider';
import { CountdownBanner } from '@/features/countdown/CountdownBanner';
import { useBoardSummary, useMembers } from '@/features/members/hooks';
import { PartBadge } from '@/features/members/MemberTreeCard';
import { GiftBox } from '@/features/messages/GiftBox';
import { useDeleteMessage, useMyMessage } from '@/features/messages/hooks';
import { MessageCard } from '@/features/messages/MessageCard';
import { MessageFormSheet } from '@/features/messages/MessageForm';
import { toAppError } from '@/lib/errors';
import { usePrefersReducedMotion } from '@/lib/useReducedMotion';

const GIFT_SHOW_MAX = 24;

export default function TreePage() {
  const { memberId } = useParams<{ memberId: string }>();
  const me = useMe();
  const members = useMembers();
  const owner = members.data?.find((m) => m.id === memberId);
  const summary = useBoardSummary(owner?.boardId);
  const myMessage = useMyMessage(owner?.boardId);
  const del = useDeleteMessage();
  const reduced = usePrefersReducedMotion();

  const [formOpen, setFormOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dropKey, setDropKey] = useState(0);

  if (memberId === me.id) return <Navigate to="/me" replace />;
  if (members.isPending) return <FullscreenSpinner />;
  if (members.isError) return <ErrorState onRetry={() => members.refetch()} />;
  if (!owner) {
    return (
      <PageShell>
        <EmptyState icon="🌲" title="트리를 찾을 수 없어요" desc="마을로 돌아가 다시 골라 주세요" />
        <div className="text-center">
          <Link to="/" className="text-sm text-gold-400 underline">
            마을로
          </Link>
        </div>
      </PageShell>
    );
  }

  const opened = summary.data?.opened ?? false;
  const count = summary.data?.count ?? 0;
  const mine = myMessage.data ?? null;
  const canWrite = !!summary.data && !opened;
  const shownGifts = Math.min(count, GIFT_SHOW_MAX);

  return (
    <PageShell className="max-w-xl">
      <Link to="/" className="inline-flex min-h-touch items-center text-sm text-snow-50/60">
        ← 마을
      </Link>

      <CountdownBanner openAt={summary.data?.openAt} opened={opened} className="mb-4" />

      <section className="relative flex flex-col items-center text-center">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-extrabold">{owner.name}의 트리</h1>
          <PartBadge part={owner.part} />
        </div>
        <p className="mt-1 text-sm text-snow-50/70">
          선물 <strong className="text-gold-400">{summary.isPending ? '…' : count}개</strong>
        </p>

        <div className="relative mt-4 w-[62%] max-w-[280px]">
          <TreeIllustration starLit={!!mine} ornaments={Math.min(12, 4 + count)} />
          <AnimatePresence>
            {dropKey > 0 && !reduced && (
              <motion.div
                key={dropKey}
                className="absolute left-1/2 top-0 w-12 -translate-x-1/2"
                initial={{ y: -120, opacity: 0, rotate: -20 }}
                animate={{
                  y: [-120, 260, 240, 250],
                  opacity: [0, 1, 1, 1],
                  rotate: [-20, 10, -5, 0],
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.1, ease: 'easeIn' }}
                onAnimationComplete={() => setDropKey(0)}
              >
                <GiftBox variant={2} highlighted />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 선물상자 더미: 남의 메시지는 개수만, 내 것만 강조/클릭 가능 */}
        <div className="mt-2 flex max-w-[320px] flex-wrap justify-center gap-1">
          {Array.from({ length: shownGifts }, (_, i) => {
            const isMine = !!mine && i === shownGifts - 1;
            return isMine ? (
              <button
                key={i}
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="w-9 animate-bounce [animation-duration:2s]"
                aria-label="내가 남긴 선물 보기"
              >
                <GiftBox variant={i} highlighted />
              </button>
            ) : (
              <div key={i} className="w-7 opacity-80">
                <GiftBox variant={i} />
              </div>
            );
          })}
          {count > GIFT_SHOW_MAX && (
            <span className="self-end text-xs font-bold text-gold-400">
              +{count - GIFT_SHOW_MAX}
            </span>
          )}
        </div>
      </section>

      <section className="mt-8 text-center">
        {summary.isError ? (
          <ErrorState onRetry={() => summary.refetch()} />
        ) : opened ? (
          <p className="rounded-2xl bg-white/5 px-4 py-4 text-sm text-snow-50/70 ring-1 ring-white/10">
            선물은 크리스마스 전까지만 남길 수 있어요 🎄
            <br />
            남긴 카드는 {owner.name}님만 볼 수 있어요.
          </p>
        ) : mine ? (
          <div className="space-y-2">
            <p className="text-sm text-snow-50/70">
              이미 선물을 남겼어요! 반짝이는 상자를 눌러 확인·수정할 수 있어요.
            </p>
            <Button variant="secondary" onClick={() => setPreviewOpen(true)}>
              내 카드 보기
            </Button>
          </div>
        ) : (
          <Button
            size="lg"
            className="w-full max-w-xs"
            disabled={!canWrite || myMessage.isPending}
            onClick={() => setFormOpen(true)}
          >
            🎁 선물 남기기
          </Button>
        )}
        <p className="mt-3 text-xs text-snow-50/40">
          다른 사람이 남긴 카드는 보이지 않아요. 트리 주인만 크리스마스에 열어볼 수 있어요.
        </p>
      </section>

      {/* 내 카드 미리보기 */}
      <Modal open={previewOpen && !!mine} onClose={() => setPreviewOpen(false)} variant="bare">
        {mine && (
          <div className="mx-auto w-[min(86vw,340px)]">
            <MessageCard
              cardDesign={mine.cardDesign}
              content={mine.content}
              nickname={mine.nickname}
              stickers={mine.stickers}
            />
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setPreviewOpen(false)}>
                닫기
              </Button>
              {!opened && (
                <>
                  <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                    삭제
                  </Button>
                  <Button
                    variant="gold"
                    className="flex-1"
                    onClick={() => {
                      setPreviewOpen(false);
                      setFormOpen(true);
                    }}
                  >
                    수정
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      <MessageFormSheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        boardId={owner.boardId}
        ownerName={owner.name}
        myName={me.name}
        existing={mine}
        onSaved={(_msg, isNew) => {
          setFormOpen(false);
          setDropKey((k) => k + 1);
          toast.success(isNew ? '선물을 남겼어요!' : '카드를 수정했어요!');
        }}
      />

      <ConfirmModal
        open={confirmDelete}
        title="선물을 삭제할까요?"
        description="삭제하면 되돌릴 수 없어요. 크리스마스 전까지 다시 남길 수 있어요."
        confirmText="삭제"
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          setConfirmDelete(false);
          if (!mine) return;
          try {
            await del.mutateAsync({ id: mine.id, boardId: owner.boardId });
            setPreviewOpen(false);
            toast.info('선물을 삭제했어요');
          } catch (e) {
            toast.error(toAppError(e).message);
          }
        }}
      />
    </PageShell>
  );
}
