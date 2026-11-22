import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import type { Role } from '@/types/domain';
import { adminApi } from './api';

export function useAdminStats() {
  return useQuery({ queryKey: queryKeys.admin.stats, queryFn: adminApi.getStats });
}
export function useAdminMembers() {
  return useQuery({ queryKey: queryKeys.admin.members, queryFn: adminApi.listMembers });
}
export function useAdminMessages() {
  return useQuery({ queryKey: queryKeys.admin.messages, queryFn: adminApi.listMessages });
}

/** 관리자 쓰기 후: admin 데이터 + 일반 조회 데이터 모두 무효화 */
function useInvalidateAll() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries();
}

export function useCreateMember() {
  const inv = useInvalidateAll();
  return useMutation({ mutationFn: adminApi.createMember, onSuccess: inv });
}
export function useUpdateRole() {
  const inv = useInvalidateAll();
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: Role }) =>
      adminApi.updateRole(memberId, role),
    onSuccess: inv,
  });
}
export function useSetHidden() {
  const inv = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, hidden }: { id: string; hidden: boolean }) => adminApi.setHidden(id, hidden),
    onSuccess: inv,
  });
}
export function useSetOpenAt() {
  const inv = useInvalidateAll();
  return useMutation({ mutationFn: adminApi.setOpenAt, onSuccess: inv });
}
