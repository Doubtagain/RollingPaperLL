import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { StickerLayer } from '@/features/stickers/StickerLayer';
import type { CardDesign, StickerPlacement } from '@/types/domain';

interface Props {
  cardDesign: CardDesign;
  content: string;
  nickname: string;
  stickers: StickerPlacement[];
  /** 작성 화면에서 스티커 편집 */
  editableStickers?: boolean;
  onStickersChange?: (next: StickerPlacement[]) => void;
  placeholder?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * 3:4 고정 카드. 작성 미리보기 / 공개 후 보기 / 관리자 화면에서 공통 사용.
 * 글자 크기는 컨테이너 너비(cqw) 기준이라 어떤 크기로 렌더링해도 같은 배치.
 */
export function MessageCard({
  cardDesign,
  content,
  nickname,
  stickers,
  editableStickers,
  onStickersChange,
  placeholder = '여기에 마음을 적어 주세요…',
  className,
  children,
}: Props) {
  const dark = cardDesign === 'green-pine';
  return (
    <div className={cn('card-base w-full', `card-${cardDesign}`, className)}>
      <div className="absolute inset-0 z-[1] flex flex-col p-[11%]">
        <p
          className={cn(
            'card-text flex-1 overflow-hidden text-[7.2cqw]',
            !content && (dark ? 'text-white/40' : 'text-black/30'),
          )}
        >
          {content || placeholder}
        </p>
        <p className="card-text mt-[3%] self-end text-right text-[6.4cqw]">
          from. {nickname || '…'}
        </p>
      </div>
      <StickerLayer stickers={stickers} editable={editableStickers} onChange={onStickersChange} />
      {children}
    </div>
  );
}
