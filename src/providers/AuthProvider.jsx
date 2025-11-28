import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (u) {
        try {
          // 1) 정석: users/{uid} 먼저 조회
          let snap = await getDoc(doc(db, "users", u.uid));

          // 2) 없으면 (테스트용) users/{email} fallback
          if (!snap.exists() && u.email) {
            snap = await getDoc(doc(db, "users", u.email));
          }

          if (snap.exists()) {
            setRole(snap.data().role || "learner");
          } else {
            setRole("learner");
          }
        } catch (err) {
          console.error("role load error:", err);
          setRole("learner");
        }
      } else {
        setRole(null);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <AuthCtx.Provider value={{ user, role, loading }}>
      {children}
    </AuthCtx.Provider>
  );
}
