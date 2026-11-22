const KST = 'Asia/Seoul';

const dateFmt = new Intl.DateTimeFormat('ko-KR', {
  timeZone: KST,
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
const shortFmt = new Intl.DateTimeFormat('ko-KR', {
  timeZone: KST,
  month: 'long',
  day: 'numeric',
});

export function formatKst(iso: string): string {
  return dateFmt.format(new Date(iso));
}
export function formatKstShort(iso: string): string {
  return shortFmt.format(new Date(iso));
}

/**
 * 클라이언트 시간 기준 공개 여부 — 카운트다운 표시용으로만 사용.
 * 실제 공개 판단은 서버 응답(BoardSummary.opened)을 따른다.
 */
export function isOpenedLocally(openAt: string, now = Date.now()): boolean {
  return now >= new Date(openAt).getTime();
}

export interface Remaining {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function remainingUntil(openAt: string, now = Date.now()): Remaining {
  const totalMs = Math.max(0, new Date(openAt).getTime() - now);
  const s = Math.floor(totalMs / 1000);
  return {
    totalMs,
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

export const pad2 = (n: number) => String(n).padStart(2, '0');

/** ISO → datetime-local 입력값 (KST 기준) */
export function isoToKstLocalInput(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 9 * 3600_000);
  return d.toISOString().slice(0, 16);
}
/** datetime-local 입력값(KST로 간주) → ISO */
export function kstLocalInputToIso(local: string): string {
  return new Date(`${local}:00+09:00`).toISOString();
}
