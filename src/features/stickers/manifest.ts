export interface StickerDef {
  id: string;
  label: string;
  src: string;
  pack: 'basic' | 'signature';
}

const basic = (id: string, label: string): StickerDef => ({
  id,
  label,
  src: `/stickers/${id}.svg`,
  pack: 'basic',
});
const signature = (id: string, label: string, ext = 'svg'): StickerDef => ({
  id,
  label,
  src: `/stickers/${id}.${ext}`,
  pack: 'signature',
});

/**
 * 기본 팩: Microsoft Fluent Emoji (MIT) — https://github.com/microsoft/fluentui-emoji
 * 시그니처 팩: 직접 제작 (현재 placeholder SVG, 같은 파일명으로 교체하면 반영됨)
 */
export const STICKERS: StickerDef[] = [
  basic('christmas-tree', '트리'),
  basic('santa', '산타'),
  basic('snowman', '눈사람'),
  basic('gift', '선물'),
  basic('snowflake', '눈송이'),
  basic('deer', '사슴'),
  basic('bell', '종'),
  basic('cookie', '쿠키'),
  basic('sock', '양말'),
  basic('star', '별'),
  basic('candy', '사탕'),
  basic('gloves', '장갑'),
  basic('hot-beverage', '코코아'),
  basic('sparkles', '반짝'),
  basic('lion', '사자'),
  basic('penguin', '펭귄'),
  basic('polar-bear', '북극곰'),
  signature('santa-lion', '산타 사자'),
  signature('likelion-ribbon', '멋사 리본'),
  signature('suwon-badge', '수원대 뱃지'),
];

export const STICKER_MAP: Record<string, StickerDef | undefined> = Object.fromEntries(
  STICKERS.map((s) => [s.id, s]),
);

export const STICKER_PACKS: { value: StickerDef['pack']; label: string }[] = [
  { value: 'basic', label: '기본' },
  { value: 'signature', label: '멋사 시그니처' },
];
