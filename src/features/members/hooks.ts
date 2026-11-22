import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { membersApi } from './api';

export function useMembers() {
  return useQuery({
    queryKey: queryKeys.members,
    queryFn: membersApi.listMembers,
    staleTime: 5 * 60_000,
  });
}

export function useBoardSummaries() {
  return useQuery({
    queryKey: queryKeys.boardSummaries,
    queryFn: membersApi.listBoardSummaries,
    staleTime: 30_000,
  });
}

export function useBoardSummary(boardId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.boardSummary(boardId ?? ''),
    queryFn: () => membersApi.getBoardSummary(boardId!),
    enabled: !!boardId,
    staleTime: 30_000,
  });
}

export function useMyWrittenMemberIds() {
  return useQuery({
    queryKey: queryKeys.myWrittenMemberIds,
    queryFn: membersApi.getMyWrittenMemberIds,
    select: (ids) => new Set(ids),
  });
}
