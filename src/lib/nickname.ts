import { NICKNAME_MAX } from './constants';

const ADJECTIVES = [
  '졸린',
  '수상한',
  '배고픈',
  '반짝이는',
  '수줍은',
  '용감한',
  '눈 덮인',
  '코가 빨간',
  '야근하는',
  '커밋하는',
  '디버깅하는',
  '포근한',
];
const NOUNS = [
  '루돌프',
  '산타',
  '눈사람',
  '진저쿠키',
  '엘프',
  '썰매',
  '양말',
  '트리',
  '사자',
  '펭귄',
  '북극곰',
  '종',
];

/** 12자 이하 조합만 미리 계산 */
export const NICKNAME_POOL: readonly string[] = ADJECTIVES.flatMap((a) =>
  NOUNS.map((n) => `${a} ${n}`),
).filter((s) => s.length <= NICKNAME_MAX);

export function randomNickname(exclude?: string): string {
  const pool = exclude ? NICKNAME_POOL.filter((n) => n !== exclude) : NICKNAME_POOL;
  return pool[Math.floor(Math.random() * pool.length)] ?? '수상한 산타';
}

/** 비어있으면 랜덤 닉네임 */
export function resolveNickname(input: string | undefined | null): string {
  const t = (input ?? '').trim();
  return t.length > 0 ? t : randomNickname();
}
