import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { FieldError, Input, Label, Textarea } from '@/components/ui/Input';
import { ConfirmModal, Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { StickerPicker } from '@/features/stickers/StickerPicker';
import { cn } from '@/lib/cn';
import {
  CARD_DESIGNS,
  CONTENT_MAX,
  NICKNAME_MAX,
  STICKER_MAX,
  STORAGE_KEYS,
} from '@/lib/constants';
import { toAppError } from '@/lib/errors';
import { randomNickname, resolveNickname } from '@/lib/nickname';
import { safeStorage } from '@/lib/storage';
import type { Message } from '@/types/domain';
import { useUpsertMessage } from './hooks';
import { MessageCard } from './MessageCard';

const stickerSchema = z.object({
  id: z.string().min(1),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  rotate: z.number().min(-30).max(30),
  scale: z.number().min(0.6).max(1.6),
});

export const messageFormSchema = z.object({
  cardDesign: z.enum(['kraft', 'red-check', 'snow', 'green-pine']),
  content: z
    .string()
    .trim()
    .min(1, '마음을 한 글자 이상 적어 주세요 ✍️')
    .max(CONTENT_MAX, `${CONTENT_MAX}자까지 쓸 수 있어요`),
  nickname: z.string().trim().max(NICKNAME_MAX, `닉네임은 ${NICKNAME_MAX}자까지예요`),
  stickers: z.array(stickerSchema).max(STICKER_MAX, `스티커는 ${STICKER_MAX}개까지 붙일 수 있어요`),
});
export type MessageFormValues = z.infer<typeof messageFormSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  boardId: string;
  ownerName: string;
  myName: string;
  existing?: Message | null;
  onSaved: (msg: Message, isNew: boolean) => void;
}

export function MessageFormSheet(props: Props) {
  // 열릴 때마다 폼을 새로 마운트 → 기본값/임시저장 재로드
  return (
    <MessageFormModal
      {...props}
      key={props.open ? `open-${props.existing?.id ?? 'new'}` : 'closed'}
    />
  );
}

function MessageFormModal({ open, onClose, boardId, ownerName, myName, existing, onSaved }: Props) {
  const draftKey = STORAGE_KEYS.draft(boardId);
  const upsert = useUpsertMessage();
  const [confirmLeave, setConfirmLeave] = useState(false);

  const defaults = useMemo<MessageFormValues>(() => {
    const draft = safeStorage.get<MessageFormValues>(draftKey);
    const parsed = draft ? messageFormSchema.safeParse(draft) : null;
    if (parsed?.success) return parsed.data;
    if (draft && typeof draft === 'object') {
      // 검증 실패해도 쓸 수 있는 값은 복원
      return {
        cardDesign: existing?.cardDesign ?? 'kraft',
        content: typeof draft.content === 'string' ? draft.content.slice(0, CONTENT_MAX) : '',
        nickname: existing?.nickname ?? myName,
        stickers: existing?.stickers ?? [],
      };
    }
    if (existing) {
      return {
        cardDesign: existing.cardDesign,
        content: existing.content,
        nickname: existing.nickname,
        stickers: existing.stickers,
      };
    }
    return { cardDesign: 'kraft', content: '', nickname: myName, stickers: [] };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const restoredDraft = useMemo(() => safeStorage.get(draftKey) !== null, [draftKey]);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = useForm<MessageFormValues>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: defaults,
  });

  const values = useWatch({ control }) as MessageFormValues;
  const dirty = isDirty || restoredDraft;

  // 임시저장 (debounce)
  useEffect(() => {
    if (!open || !isDirty) return;
    const t = window.setTimeout(() => safeStorage.set(draftKey, values), 400);
    return () => window.clearTimeout(t);
  }, [values, isDirty, open, draftKey]);

  // 새로고침/탭 닫기 경고
  useEffect(() => {
    if (!open || !dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [open, dirty]);

  const requestClose = () => (dirty && !upsert.isPending ? setConfirmLeave(true) : onClose());

  const onSubmit = handleSubmit(async (v) => {
    try {
      const msg = await upsert.mutateAsync({
        existingId: existing?.id,
        input: {
          boardId,
          cardDesign: v.cardDesign,
          content: v.content.trim(),
          nickname: resolveNickname(v.nickname), // 비우면 랜덤 닉네임
          stickers: v.stickers,
        },
      });
      safeStorage.remove(draftKey);
      onSaved(msg, !existing);
    } catch (err) {
      toast.error(toAppError(err).message);
    }
  });

  const addSticker = (id: string) => {
    const cur = values.stickers ?? [];
    if (cur.length >= STICKER_MAX) {
      toast.info(`스티커는 ${STICKER_MAX}개까지 붙일 수 있어요`);
      return;
    }
    // 중앙 근처에 살짝 흩어서 추가
    const jitter = () => (Math.random() - 0.5) * 0.16;
    setValue(
      'stickers',
      [
        ...cur,
        { id, x: 0.5 + jitter(), y: 0.5 + jitter(), rotate: Math.round(jitter() * 60), scale: 1 },
      ],
      { shouldDirty: true },
    );
  };

  const contentLen = values.content?.length ?? 0;

  return (
    <>
      <Modal open={open} onClose={requestClose} variant="sheet" title="카드 쓰기">
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
            <button
              type="button"
              onClick={requestClose}
              className="min-h-touch min-w-touch text-left text-sm text-snow-50/70"
            >
              닫기
            </button>
            <h2 className="text-base font-bold">
              {ownerName}에게 {existing ? '카드 수정' : '선물 남기기'}
            </h2>
            <span className="min-w-touch" />
          </div>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5">
            {restoredDraft && (
              <p className="rounded-lg bg-gold-400/10 px-3 py-2 text-xs text-gold-400">
                임시저장된 카드를 불러왔어요
              </p>
            )}

            {/* 미리보기 (스티커 편집 가능) */}
            <div className="mx-auto w-full max-w-[300px]">
              <Controller
                control={control}
                name="stickers"
                render={({ field }) => (
                  <MessageCard
                    cardDesign={values.cardDesign ?? 'kraft'}
                    content={values.content ?? ''}
                    nickname={values.nickname?.trim() || '랜덤 닉네임 🎲'}
                    stickers={field.value}
                    editableStickers
                    onStickersChange={(next) => field.onChange(next)}
                  />
                )}
              />
              <p className="mt-2 text-center text-[11px] text-snow-50/50">
                스티커를 끌어서 옮기고 ↻ 로 돌리기·크기 조절, 길게 누르면 삭제
              </p>
            </div>

            {/* 1. 카드 디자인 */}
            <section>
              <Label>카드 디자인</Label>
              <Controller
                control={control}
                name="cardDesign"
                render={({ field }) => (
                  <div className="scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
                    {CARD_DESIGNS.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => field.onChange(d.value)}
                        aria-pressed={field.value === d.value}
                        className="flex shrink-0 flex-col items-center gap-1.5"
                      >
                        <span
                          className={cn(
                            'card-base block w-16 !shadow-md',
                            `card-${d.value}`,
                            field.value === d.value
                              ? 'ring-[3px] ring-gold-400 ring-offset-2 ring-offset-night-700'
                              : 'opacity-80',
                          )}
                        />
                        <span className="text-xs text-snow-50/80">{d.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              />
            </section>

            {/* 2. 본문 */}
            <section>
              <div className="flex items-baseline justify-between">
                <Label htmlFor="content">마음 전하기</Label>
                <span
                  className={cn(
                    'text-xs tabular-nums',
                    contentLen > CONTENT_MAX ? 'text-red-300' : 'text-snow-50/50',
                  )}
                >
                  {contentLen}/{CONTENT_MAX}
                </span>
              </div>
              <Textarea
                id="content"
                rows={5}
                maxLength={CONTENT_MAX}
                placeholder={`${ownerName}에게 하고 싶은 말을 적어 주세요`}
                aria-invalid={!!errors.content}
                {...register('content')}
              />
              <FieldError message={errors.content?.message} />
            </section>

            {/* 3. 스티커 */}
            <section>
              <div className="flex items-baseline justify-between">
                <Label>스티커 꾸미기</Label>
                <span className="text-xs text-snow-50/50">
                  {values.stickers?.length ?? 0}/{STICKER_MAX}
                </span>
              </div>
              <StickerPicker
                onPick={addSticker}
                disabled={(values.stickers?.length ?? 0) >= STICKER_MAX}
              />
              <FieldError message={errors.stickers?.message} />
            </section>

            {/* 4. 닉네임 */}
            <section>
              <Label htmlFor="nickname">닉네임</Label>
              <div className="flex gap-2">
                <Input
                  id="nickname"
                  maxLength={NICKNAME_MAX}
                  placeholder={myName}
                  aria-invalid={!!errors.nickname}
                  autoComplete="off"
                  {...register('nickname')}
                />
                <button
                  type="button"
                  onClick={() =>
                    setValue('nickname', randomNickname(values.nickname), { shouldDirty: true })
                  }
                  className="min-h-touch min-w-touch shrink-0 rounded-xl bg-white/10 text-xl ring-1 ring-white/15 active:scale-95"
                  aria-label="랜덤 크리스마스 닉네임"
                  title="랜덤 닉네임"
                >
                  🎲
                </button>
              </div>
              <p className="mt-1.5 text-xs text-snow-50/50">
                비워 두면 크리스마스 랜덤 닉네임이 붙어요. 트리 주인에게 실명은 보이지 않아요.
              </p>
              <FieldError message={errors.nickname?.message} />
            </section>
          </div>

          <div className="safe-bottom border-t border-white/10 px-4 pt-3">
            <Button type="submit" size="lg" className="w-full" loading={upsert.isPending}>
              {existing ? '수정해서 다시 걸기 🎄' : '트리에 걸기 🎄'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={confirmLeave}
        title="작성을 그만할까요?"
        description="작성 중인 내용은 이 기기에 임시저장돼요. 다음에 이어서 쓸 수 있어요."
        confirmText="나가기"
        cancelText="계속 쓰기"
        onCancel={() => setConfirmLeave(false)}
        onConfirm={() => {
          setConfirmLeave(false);
          onClose();
        }}
      />
    </>
  );
}
