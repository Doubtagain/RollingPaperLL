import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ErrorState } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { FieldError, Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';
import { PART_LABEL, PARTS } from '@/lib/constants';
import { toAppError } from '@/lib/errors';
import type { AdminMember, Role } from '@/types/domain';
import { generateInviteCode } from './api';
import { useAdminMembers, useCreateMember, useUpdateRole } from './hooks';

const schema = z.object({
  name: z.string().trim().min(1, '이름을 입력해 주세요').max(20),
  part: z.enum(['plan', 'design', 'frontend', 'backend']),
  generation: z.coerce.number().int().min(1).max(99),
  role: z.enum(['member', 'admin']),
});
type FormValues = z.infer<typeof schema>;

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`복사했어요: ${text}`);
  } catch {
    toast.error('복사하지 못했어요');
  }
}

/** 엑셀에서 한글이 깨지지 않도록 UTF-8 BOM 을 붙인 CSV 로 내려받기 */
function downloadInviteCsv(members: AdminMember[]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const header = ['이름', '파트', '기수', '역할', '초대코드', '연결 여부'];
  const rows = members.map((m) => [
    m.name,
    PART_LABEL[m.part],
    m.generation,
    m.role === 'admin' ? '관리자' : '멤버',
    m.inviteCode,
    m.linked ? '연결됨' : '미연결',
  ]);
  const csv = [header, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `초대코드_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function MemberManager() {
  const members = useAdminMembers();
  const create = useCreateMember();
  const updateRole = useUpdateRole();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', part: 'frontend', generation: 14, role: 'member' },
  });

  const onSubmit = handleSubmit(async (v) => {
    const inviteCode = generateInviteCode();
    try {
      await create.mutateAsync({ ...v, inviteCode });
      reset({ ...v, name: '' });
      toast.success(`${v.name} 추가 완료 · 초대코드 ${inviteCode}`);
    } catch (e) {
      toast.error(toAppError(e).message);
    }
  });

  return (
    <div className="space-y-4">
      <form
        onSubmit={onSubmit}
        className="grid grid-cols-2 gap-2 rounded-xl bg-white/5 p-3 ring-1 ring-white/10 sm:grid-cols-[1fr_auto_auto_auto_auto]"
        noValidate
      >
        <div className="col-span-2 sm:col-span-1">
          <Input placeholder="이름" aria-invalid={!!errors.name} {...register('name')} />
          <FieldError message={errors.name?.message} />
        </div>
        <select
          className="min-h-touch rounded-xl bg-white/10 px-3 ring-1 ring-white/15"
          aria-label="파트"
          {...register('part')}
        >
          {PARTS.map((p) => (
            <option key={p.value} value={p.value} className="text-night-900">
              {p.label}
            </option>
          ))}
        </select>
        <Input
          type="number"
          inputMode="numeric"
          aria-label="기수"
          className="sm:w-20"
          {...register('generation')}
        />
        <select
          className="min-h-touch rounded-xl bg-white/10 px-3 ring-1 ring-white/15"
          aria-label="역할"
          {...register('role')}
        >
          <option value="member" className="text-night-900">
            멤버
          </option>
          <option value="admin" className="text-night-900">
            관리자
          </option>
        </select>
        <Button type="submit" variant="gold" loading={create.isPending}>
          추가
        </Button>
      </form>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-snow-50/50">초대코드는 추가할 때 자동으로 만들어져요.</p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!members.data?.length}
          onClick={() => members.data && downloadInviteCsv(members.data)}
        >
          📥 엑셀로 내려받기
        </Button>
      </div>

      {members.isPending ? (
        <Spinner />
      ) : members.isError ? (
        <ErrorState onRetry={() => members.refetch()} />
      ) : (
        <ul className="divide-y divide-white/5 rounded-xl ring-1 ring-white/10">
          {members.data.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
              <span className="font-semibold">{m.name}</span>
              <span className="text-snow-50/50">
                {PART_LABEL[m.part]} · {m.generation}기
              </span>
              <span
                className={m.linked ? 'text-[11px] text-pine-400' : 'text-[11px] text-snow-50/40'}
              >
                {m.linked ? '● 연결됨' : '○ 미연결'}
              </span>
              <div className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => void copy(m.inviteCode)}
                  className="min-h-touch rounded-lg bg-white/5 px-2 font-mono text-xs ring-1 ring-white/10"
                  title="초대코드 복사"
                >
                  {m.inviteCode} 📋
                </button>
                <select
                  value={m.role}
                  aria-label={`${m.name} 역할`}
                  onChange={async (e) => {
                    try {
                      await updateRole.mutateAsync({
                        memberId: m.id,
                        role: e.target.value as Role,
                      });
                      toast.success('역할을 바꿨어요');
                    } catch (err) {
                      toast.error(toAppError(err).message);
                    }
                  }}
                  className="min-h-touch rounded-lg bg-white/10 px-2 text-xs ring-1 ring-white/15"
                >
                  <option value="member" className="text-night-900">
                    멤버
                  </option>
                  <option value="admin" className="text-night-900">
                    관리자
                  </option>
                </select>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
