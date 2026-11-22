import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { MemberManager } from '@/features/admin/MemberManager';
import { MessageManager } from '@/features/admin/MessageManager';
import { OpenAtSetting } from '@/features/admin/OpenAtSetting';
import { StatsTable } from '@/features/admin/StatsTable';
import { cn } from '@/lib/cn';

const TABS = [
  { id: 'stats', label: '현황' },
  { id: 'members', label: '멤버' },
  { id: 'messages', label: '메시지' },
  { id: 'settings', label: '설정' },
] as const;
type Tab = (typeof TABS)[number]['id'];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('stats');
  return (
    <PageShell>
      <h1 className="text-xl font-extrabold">🛠️ 관리자</h1>
      <div role="tablist" className="scrollbar-none -mx-4 mt-4 flex gap-1.5 overflow-x-auto px-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'min-h-touch shrink-0 rounded-full px-4 text-sm font-semibold',
              tab === t.id
                ? 'bg-snow-50 text-night-900'
                : 'bg-white/5 text-snow-50/70 ring-1 ring-white/10',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <section className="mt-5">
        {tab === 'stats' && <StatsTable />}
        {tab === 'members' && <MemberManager />}
        {tab === 'messages' && <MessageManager />}
        {tab === 'settings' && <OpenAtSetting />}
      </section>
    </PageShell>
  );
}
