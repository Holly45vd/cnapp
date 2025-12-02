// src/shared/utils/date.js

/**
 * ----------------------------------------------------
 *  기본 변환 유틸
 * ----------------------------------------------------
 */

/**
 * Date 객체를 "YYYY-MM-DD" 문자열로 변환
 */
export function toDateKey(date = new Date()) {
  if (!(date instanceof Date)) date = new Date(date);

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

/**
 * "YYYY-MM-DD" → Date 객체
 */
export function fromDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * 날짜를 n일 전/후로 이동
 * offsetDays가 -1이면 하루 전, +1이면 하루 후
 */
export function shiftDate(date, offsetDays) {
  const dt = new Date(date);
  dt.setDate(dt.getDate() + offsetDays);
  return dt;
}

/**
 * ✅ dateKey 동일 여부
 */
export function isSameDateKey(aKey, bKey) {
  return aKey === bKey;
}

/**
 * ✅ 두 dateKey 간 일수 차이
 */
export function diffDays(aKey, bKey) {
  const a = fromDateKey(aKey);
  const b = fromDateKey(bKey);
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/**
 * ----------------------------------------------------
 *  주 / 월 / 최근 N일 범위 유틸
 * ----------------------------------------------------
 */

/**
 * ✅ 이번 주(일~토) dateKey 7개 반환
 * baseDate 기준으로 같은 주의 Sunday~Saturday 생성
 */
export function getWeekDateKeys(baseDate = new Date()) {
  const d = new Date(baseDate);
  const day = d.getDay(); // 0=일요일
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - day);

  return Array.from({ length: 7 }).map((_, i) => {
    const t = new Date(sunday);
    t.setDate(sunday.getDate() + i);
    return toDateKey(t);
  });
}

/**
 * ✅ 이번 달 dateKey 전체 반환 (1일~말일)
 */
export function getMonthDateKeys(baseDate = new Date()) {
  const d = new Date(baseDate);
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);

  const days = last.getDate();
  return Array.from({ length: days }).map((_, i) => {
    const t = new Date(first);
    t.setDate(first.getDate() + i);
    return toDateKey(t);
  });
}

/**
 * ✅ 최근 N일(dateKey 배열) — 오늘 포함
 * 예: N=7 → ["2025-01-20", "2025-01-19", ...]
 */
export function getLastNDaysDateKeys(n = 7, baseDate = new Date()) {
  const arr = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - i);
    arr.push(toDateKey(d));
  }
  return arr;
}

/**
 * ✅ 최근 7일(dateKey 배열) — 오늘 포함 7개
 * 내부적으로 getLastNDaysDateKeys 재사용
 */
export function getLast7DateKeys(baseDate = new Date()) {
  return getLastNDaysDateKeys(7, baseDate);
}
