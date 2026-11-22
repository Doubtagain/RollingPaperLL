import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { toAppError } from '@/lib/errors';
import { useSetHidden } from './hooks';

export function HideMessageButton({ id, hidden }: { id: string; hidden: boolean }) {
  const setHidden = useSetHidden();
  return (
    <Button
      size="sm"
      variant={hidden ? 'secondary' : 'danger'}
      loading={setHidden.isPending}
      onClick={async () => {
        try {
          await setHidden.mutateAsync({ id, hidden: !hidden });
          toast.info(hidden ? '다시 보이게 했어요' : '숨겼어요');
        } catch (e) {
          toast.error(toAppError(e).message);
        }
      }}
    >
      {hidden ? '숨김 해제' : '숨기기'}
    </Button>
  );
}
