/** Supabase/PostgREST 에러 → 사용자 친화 문구 */
export class AppError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

interface PgLikeError {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

/** SQL 함수에서 `raise exception 'BOARD_LOCKED'` 처럼 던지는 코드 */
const RAISE_MESSAGES: Record<string, string> = {
  BOARD_LOCKED: '선물은 크리스마스 전까지만 남길 수 있어요 🎄',
  NOT_OPENED: '아직 선물을 열 수 없어요. 12월 25일을 기다려 주세요 🎅',
  OWN_BOARD: '내 트리에는 선물을 남길 수 없어요',
  INVALID_INVITE: '초대코드를 다시 확인해 주세요 🎅',
  ALREADY_LINKED: '이미 다른 계정과 연결된 초대코드예요',
};

export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  const e = (err ?? {}) as PgLikeError;
  const raw = `${e.message ?? ''} ${e.details ?? ''} ${e.hint ?? ''}`;
  for (const [key, msg] of Object.entries(RAISE_MESSAGES)) {
    if (raw.includes(key)) return new AppError(msg, key);
  }
  switch (e.code) {
    case '42501': // insufficient_privilege (RLS 거부)
    case 'PGRST301':
      return new AppError('볼 수 없거나 할 수 없는 작업이에요 🔒', e.code);
    case '23505':
      return new AppError('이 트리에는 이미 선물을 남겼어요. 수정해 주세요!', e.code);
    case '23514':
      return new AppError('입력값을 다시 확인해 주세요', e.code);
    case 'PGRST116':
      return new AppError('찾을 수 없어요', e.code);
  }
  if (raw.includes('Failed to fetch') || raw.includes('NetworkError')) {
    return new AppError('네트워크 연결을 확인해 주세요', 'NETWORK');
  }
  return new AppError('문제가 생겼어요. 잠시 후 다시 시도해 주세요', e.code);
}

/** api 레이어 공통: supabase 응답 에러를 AppError로 변환해 throw */
export function unwrap<T>(res: { data: T | null; error: unknown }): T {
  if (res.error) throw toAppError(res.error);
  return res.data as T;
}
