import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { GiftBox } from '@/features/messages/GiftBox';
import { MessageCard } from '@/features/messages/MessageCard';
import type { Message } from '@/types/domain';

interface Props {
  messages: Message[];
  onDone: () => void;
}

/**
 * 공개 후 첫 진입 연출: 리본이 풀리며 상자가 열리고 카드가 하나씩 날아와 걸림.
 * reduced-motion 환경에서는 부모가 렌더링하지 않는다.
 */
export function GiftOpenAnimation({ messages, onDone }: Props) {
  const [phase, setPhase] = useState<'box' | 'open' | 'cards'>('box');
  const preview = messages.slice(0, 6);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('open'), 900);
    const t2 = setTimeout(() => setPhase('cards'), 1700);
    const t3 = setTimeout(onDone, 1700 + preview.length * 350 + 1400);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, [onDone, preview.length]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-night-900/95"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        onClick={onDone}
        className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] min-h-touch rounded-full bg-white/10 px-4 text-sm font-semibold"
      >
        건너뛰기
      </button>

      <AnimatePresence>
        {phase !== 'cards' && (
          <motion.div
            key="box"
            className="relative w-40"
            initial={{ scale: 0.6, y: 40 }}
            animate={
              phase === 'box'
                ? { scale: 1, y: 0, rotate: [0, -6, 6, -4, 4, 0] }
                : { scale: 1.15, y: 0 }
            }
            exit={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <GiftBox variant={0} />
            {phase === 'open' && (
              <motion.div
                className="absolute inset-0 rounded-full bg-gold-400/60 blur-2xl"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1.6 }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {phase === 'cards' && (
        <div className="relative h-[60vh] w-full max-w-md">
          {preview.map((m, i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);
            return (
              <motion.div
                key={m.id}
                className="absolute w-[30%]"
                style={{ left: `${3 + col * 33}%`, top: `${8 + row * 42}%` }}
                initial={{ y: 300, opacity: 0, rotate: 0, scale: 0.4 }}
                animate={{ y: 0, opacity: 1, rotate: (i % 2 ? 1 : -1) * (4 + i), scale: 1 }}
                transition={{ delay: i * 0.35, type: 'spring', stiffness: 140, damping: 14 }}
              >
                <MessageCard
                  cardDesign={m.cardDesign}
                  content={m.content}
                  nickname={m.nickname}
                  stickers={m.stickers}
                />
              </motion.div>
            );
          })}
        </div>
      )}

      <motion.p
        className="absolute bottom-[12vh] text-lg font-bold text-gold-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === 'box' ? 0 : 1 }}
      >
        {messages.length}개의 선물이 열렸어요! 🎁
      </motion.p>
    </motion.div>
  );
}
