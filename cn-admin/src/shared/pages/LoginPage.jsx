import { useState } from "react";
import { login } from "../../firebase/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../providers/AuthProvider";

export default function LoginPage() {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");

  // 이미 로그인 되어 있으면 바로 분기
  if (user && role) {
    if (role === "admin") navigate("/admin");
    else navigate("/app");
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, pw);
    } catch (err) {
      setError("로그인 실패: " + err.message);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <form
        onSubmit={onSubmit}
        className="bg-white p-6 rounded-xl shadow-md w-96 space-y-4"
      >
        <h2 className="text-2xl font-bold">로그인</h2>

        <div>
          <input
            type="email"
            className="w-full border p-2 rounded"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <input
            type="password"
            className="w-full border p-2 rounded"
            placeholder="비밀번호"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <button
          type="submit"
          className="w-full bg-black text-white p-2 rounded"
        >
          로그인
        </button>
      </form>
    </div>
  );
}
