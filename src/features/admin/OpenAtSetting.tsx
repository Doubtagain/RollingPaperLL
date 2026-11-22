import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfirmModal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { useMe } from '@/features/auth/AuthProvider';
import { useBoardSummary } from '@/features/members/hooks';
import { DEFAULT_OPEN_AT } from '@/lib/constants';
import { toAppError } from '@/lib/errors';
import { formatKst, isoToKstLocalInput, kstLocalInputToIso } from '@/lib/time';
import { useSetOpenAt } from './hooks';

export function OpenAtSetting() {
  const me = useMe();
  const summary = useBoardSummary(me.boardId);
  const setOpenAt = useSetOpenAt();
  const current = summary.data?.openAt ?? DEFAULT_OPEN_AT;
  const [value, setValue] = useState(() => isoToKstLocalInput(current));
  const [confirm, setConfirm] = useState(false);

  useEffect(() => setValue(isoToKstLocalInput(current)), [current]);

  return (
    <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
      <p className="text-sm text-snow-50/70">
        현재 공개 시각: <strong className="text-gold-400">{formatKst(current)}</strong>{' '}
        {summary.data?.opened ? '(공개됨)' : '(공개 전)'}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Input
          type="datetime-local"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="max-w-[240px]"
          aria-label="공개 시각 (KST)"
        />
        <Button variant="gold" disabled={!value} onClick={() => setConfirm(true)}>
          모든 트리에 적용
        </Button>
      </div>
      <p className="mt-2 text-xs text-snow-50/50">
        한국 시간(KST) 기준. 모든 멤버 트리에 일괄 적용돼요.
      </p>

      <ConfirmModal
        open={confirm}
        title="공개 시각을 바꿀까요?"
        description={
          value
            ? `${formatKst(kstLocalInputToIso(value))} 로 모든 트리의 공개 시각이 바뀌어요.`
            : ''
        }
        confirmText="변경"
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          setConfirm(false);
          try {
            await setOpenAt.mutateAsync(kstLocalInputToIso(value));
            toast.success('공개 시각을 바꿨어요');
          } catch (e) {
            toast.error(toAppError(e).message);
          }
        }}
      />
    </div>
  );
}
