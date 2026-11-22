import { AnimatePresence, motion } from 'framer-motion';
import { useSyncExternalStore } from 'react';
import { cn } from '@/lib/cn';

type Kind = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  kind: Kind;
  message: string;
}

let items: ToastItem[] = [];
let seq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function push(kind: Kind, message: string, ms = 2600) {
  // 같은 문구 연속 노출 방지
  if (items.some((t) => t.message === message)) return;
  const id = ++seq;
  items = [...items, { id, kind, message }].slice(-3);
  emit();
  setTimeout(() => {
    items = items.filter((t) => t.id !== id);
    emit();
  }, ms);
}

/** React 바깥(QueryClient 등)에서도 호출 가능 */
export const toast = {
  success: (m: string) => push('success', m),
  error: (m: string) => push('error', m, 3500),
  info: (m: string) => push('info', m),
};

export function Toaster() {
  const list = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => items,
  );
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
    >
      <AnimatePresence>
        {list.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className={cn(
              'pointer-events-auto max-w-sm rounded-full px-5 py-3 text-sm font-semibold shadow-lg',
              t.kind === 'success' && 'bg-pine-600 text-white',
              t.kind === 'error' && 'bg-berry-600 text-white',
              t.kind === 'info' && 'bg-snow-50 text-night-900',
            )}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
