// src/firebase/db.js
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { db } from "./firebase";

// ✅ 컬렉션 전체 문서 가져오기
export async function listCollection(colName) {
  const colRef = collection(db, colName);
  const snap = await getDocs(colRef);
  // 기존 로직 유지 (id가 필요하면 나중에 여기서 바꾸면 됨)
  return snap.docs.map((d) => d.data());
}

/**
 * users/{uid}/studyHistory 에서 최근 N개 가져오기
 */
export async function listUserHistoryRecent(uid, n = 7) {
  const colRef = collection(db, "users", uid, "studyHistory");
  const q = query(colRef, orderBy("completedAt", "desc"), limit(n));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * 오늘 학습 결과 저장 (누적 저장용)
 *  - users/{uid}/studyHistory/{dateKey}
 *  - 배열 필드는 기존 값 + 새 값 합쳐서 unique
 *  - durationSec 은 누적
 *
 *  payload 예:
 *  {
 *    wordsDone: [],
 *    wordsKnown: [],
 *    sentencesDone: [],
 *    sentencesKnown: [],
 *    grammarDone: [],
 *    grammarKnown: [],
 *    dialogsDone: [],
 *    dialogsKnown: [],
 *    durationSec: 123
 *  }
 */
export async function saveUserHistory(uid, dateKey, payload) {
  const ref = doc(db, "users", uid, "studyHistory", dateKey);
  const snap = await getDoc(ref);

  const prev = snap.exists() ? snap.data() : {};

  const mergeArr = (oldArr = [], newArr = []) => {
    if (!Array.isArray(oldArr)) oldArr = [];
    if (!Array.isArray(newArr)) newArr = [];
    // 새 배열이 비어 있어도 기존 유지하고 싶으면 아래 if는 주석 처리하지 말고 그대로 둔다
    if (newArr.length === 0) return oldArr;
    return Array.from(new Set([...oldArr, ...newArr]));
  };

  const next = {
    dateKey,

    // 배열 누적
    wordsDone: mergeArr(prev.wordsDone, payload.wordsDone),
    wordsKnown: mergeArr(prev.wordsKnown, payload.wordsKnown),
    sentencesDone: mergeArr(prev.sentencesDone, payload.sentencesDone),
    sentencesKnown: mergeArr(prev.sentencesKnown, payload.sentencesKnown),
    grammarDone: mergeArr(prev.grammarDone, payload.grammarDone),
    grammarKnown: mergeArr(prev.grammarKnown, payload.grammarKnown),
    dialogsDone: mergeArr(prev.dialogsDone, payload.dialogsDone),
    dialogsKnown: mergeArr(prev.dialogsKnown, payload.dialogsKnown),

    // 시간 / 메타 정보
    durationSec: (prev.durationSec || 0) + (payload?.durationSec || 0),

    createdAt: prev.createdAt || serverTimestamp(),
    completedAt: serverTimestamp(), // 마지막 완료 시각
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, next); // merge 옵션 불필요 (우리가 직접 병합)
}

/** users/{uid}/studyHistory 전체 가져오기 */
export async function listUserHistoryAll(uid) {
  const colRef = collection(db, "users", uid, "studyHistory");
  const q = query(colRef, orderBy("dateKey", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * users/{uid}/studyHistory 특정 기간 가져오기
 * startKey, endKey: "YYYY-MM-DD"
 */
export async function listUserHistoryRange(uid, startKey, endKey) {
  const colRef = collection(db, "users", uid, "studyHistory");

  const q = query(
    colRef,
    where("dateKey", ">=", startKey),
    where("dateKey", "<=", endKey),
    orderBy("dateKey", "asc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ✅ 특정 날짜의 studyHistory 일부 필드를 merge 업데이트
export async function updateUserHistoryDoc(uid, dateKey, partial) {
  if (!uid || !dateKey) {
    throw new Error("updateUserHistoryDoc: uid와 dateKey가 필요합니다.");
  }

  const userRef = doc(db, "users", uid);
  const histRef = doc(collection(userRef, "studyHistory"), dateKey);

  // 해당 날짜 문서를 부분 업데이트(merge)
  await setDoc(histRef, partial, { merge: true });
}

// ✅ 다시보기/외웠음 토글용 래퍼 (가독성용)
export async function updateUserHistoryReview(uid, dateKey, partial) {
  return updateUserHistoryDoc(uid, dateKey, partial);
}

/* ===========================
 *  Daily Routine 전역 설정
 *  appConfig/routine 문서 사용
 * =========================== */

/**
 * 🔹 Daily Routine 설정 조회
 *  - 문서가 없으면 기본값 반환
 */
export async function getRoutineConfig() {
  const ref = doc(db, "appConfig", "routine");
  const snap = await getDoc(ref);

  const defaultConfig = {
    wordCount: 5,
    sentenceCount: 5,
    grammarCount: 1,
    dialogCount: 1,
  };

  if (!snap.exists()) return defaultConfig;

  const data = snap.data() || {};
  return {
    wordCount:
      typeof data.wordCount === "number" ? data.wordCount : defaultConfig.wordCount,
    sentenceCount:
      typeof data.sentenceCount === "number"
        ? data.sentenceCount
        : defaultConfig.sentenceCount,
    grammarCount:
      typeof data.grammarCount === "number"
        ? data.grammarCount
        : defaultConfig.grammarCount,
    dialogCount:
      typeof data.dialogCount === "number"
        ? data.dialogCount
        : defaultConfig.dialogCount,
  };
}

/**
 * 🔹 Daily Routine 설정 저장 (어드민 전용)
 *  - 숫자 변환 후 저장, updatedAt 갱신
 */
export async function saveRoutineConfig(config) {
  const ref = doc(db, "appConfig", "routine");

  const payload = {
    wordCount: Number(config.wordCount) || 0,
    sentenceCount: Number(config.sentenceCount) || 0,
    grammarCount: Number(config.grammarCount) || 0,
    dialogCount: Number(config.dialogCount) || 0,
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, payload, { merge: true });
}
