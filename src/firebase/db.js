// src/firebase/db.js
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
  where, // ✅ 추가
} from "firebase/firestore";

import { db } from "./firebase";

// ✅ 컬렉션 전체 문서 가져오기
export async function listCollection(colName) {
  const colRef = collection(db, colName);
  const snap = await getDocs(colRef);
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
 * 오늘 학습 결과 저장
 * dateKey = "YYYY-MM-DD"
 */
export async function saveUserHistory(uid, dateKey, payload) {
  const ref = doc(db, "users", uid, "studyHistory", dateKey);
  await setDoc(
    ref,
    {
      dateKey,
      ...payload,
      completedAt: serverTimestamp(),
    },
    { merge: true }
  );
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
