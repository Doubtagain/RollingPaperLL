import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import { usePrefersReducedMotion } from '@/lib/useReducedMotion';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** sheet: 모바일 풀스크린 시트 / 데스크탑 큰 모달 */
  variant?: 'dialog' | 'sheet' | 'bare';
  className?: string;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  variant = 'dialog',
  className,
}: ModalProps) {
  const reduced = usePrefersReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const prevFocus = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
      prevFocus?.focus?.();
    };
  }, [open]);

  const isSheet = variant === 'sheet';

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className={cn(
            'fixed inset-0 z-50 flex justify-center bg-black/60 backdrop-blur-sm',
            isSheet ? 'items-end sm:items-center' : 'items-center p-4',
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            className={cn(
              'relative outline-none',
              variant === 'bare'
                ? 'w-full max-w-md'
                : 'bg-night-700 text-snow-50 shadow-2xl ring-1 ring-white/10',
              variant === 'dialog' && 'w-full max-w-sm rounded-2xl p-5',
              isSheet &&
                'flex h-[100dvh] w-full flex-col sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-2xl',
              className,
            )}
            initial={
              reduced
                ? { opacity: 0 }
                : isSheet
                  ? { y: 40, opacity: 0 }
                  : { scale: 0.95, opacity: 0 }
            }
            animate={reduced ? { opacity: 1 } : { y: 0, scale: 1, opacity: 1 }}
            exit={
              reduced
                ? { opacity: 0 }
                : isSheet
                  ? { y: 40, opacity: 0 }
                  : { scale: 0.95, opacity: 0 }
            }
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          >
            {title && variant === 'dialog' && <h2 className="mb-3 text-lg font-bold">{title}</h2>}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

interface ConfirmProps {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmText = '확인',
  cancelText = '취소',
  danger,
  onConfirm,
  onCancel,
}: ConfirmProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      {description && <p className="mb-5 text-sm text-snow-50/70">{description}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-touch flex-1 rounded-xl bg-white/10 font-semibold hover:bg-white/15"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={cn(
            'min-h-touch flex-1 rounded-xl font-semibold',
            danger ? 'bg-berry-600 text-white' : 'bg-gold-400 text-night-900',
          )}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
