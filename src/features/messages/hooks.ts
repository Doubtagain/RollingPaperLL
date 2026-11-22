import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import type { MessageInput } from '@/types/domain';
import { messagesApi } from './api';

export function useMyMessage(boardId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.myMessage(boardId ?? ''),
    queryFn: () => messagesApi.getMyMessage(boardId!),
    enabled: !!boardId,
  });
}

/** opened === true 일 때만 요청한다 (공개 전에는 네트워크 요청 자체가 없음) */
export function useMyBoardMessages(boardId: string | undefined, opened: boolean) {
  return useQuery({
    queryKey: queryKeys.myBoardMessages(boardId ?? ''),
    queryFn: () => messagesApi.listMyBoardMessages(boardId!),
    enabled: !!boardId && opened,
  });
}

function useInvalidateAfterWrite() {
  const qc = useQueryClient();
  return (boardId: string) =>
    Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.myMessage(boardId) }),
      qc.invalidateQueries({ queryKey: queryKeys.boardSummary(boardId) }),
      qc.invalidateQueries({ queryKey: queryKeys.boardSummaries }),
      qc.invalidateQueries({ queryKey: queryKeys.myWrittenMemberIds }),
      qc.invalidateQueries({ queryKey: queryKeys.admin.all }),
    ]);
}

export function useUpsertMessage() {
  const invalidate = useInvalidateAfterWrite();
  return useMutation({
    mutationFn: ({ input, existingId }: { input: MessageInput; existingId?: string }) =>
      messagesApi.upsertMessage(input, existingId),
    onSuccess: (_m, { input }) => invalidate(input.boardId),
  });
}

export function useDeleteMessage() {
  const invalidate = useInvalidateAfterWrite();
  return useMutation({
    mutationFn: ({ id }: { id: string; boardId: string }) => messagesApi.deleteMessage(id),
    onSuccess: (_v, { boardId }) => invalidate(boardId),
  });
}
