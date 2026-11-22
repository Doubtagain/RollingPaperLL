import { Link } from 'react-router-dom';
import { EmptyState, PageShell } from '@/components/layout/PageShell';

export default function NotFoundPage() {
  return (
    <PageShell>
      <EmptyState icon="🦌" title="길을 잃었어요" desc="루돌프가 찾지 못한 페이지예요" />
      <div className="text-center">
        <Link
          to="/"
          className="inline-flex min-h-touch items-center rounded-xl bg-white/10 px-4 text-sm font-semibold"
        >
          마을로 돌아가기
        </Link>
      </div>
    </PageShell>
  );
}
