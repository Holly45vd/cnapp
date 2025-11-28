import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

// 로그인
export const login = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

// 로그아웃
export const logout = () => signOut(auth);

// ✅ 회원가입 + Firestore users/{uid} 생성
export const register = async (email, password) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const u = cred.user;

  // users/{uid} 문서 생성 (이미 있으면 role 유지)
  const userRef = doc(db, "users", u.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      uid: u.uid,
      email: u.email,
      displayName: u.displayName || email.split("@")[0],
      role: "learner",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    await setDoc(
      userRef,
      { updatedAt: serverTimestamp() },
      { merge: true }
    );
  }

  return cred;
};
