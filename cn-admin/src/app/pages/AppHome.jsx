import { useAuth } from "../../providers/AuthProvider";
import { Link } from "react-router-dom";

export default function AppHome() {
  const { user } = useAuth();

  const routine = [
    { key: "words", title: "단어 학습", desc: "신규 3 + 복습 18", to: "/app/words" },
    { key: "grammar", title: "문법", desc: "오늘의 문법 1개", to: "/app/grammar" },
    { key: "dialogs", title: "회화", desc: "오늘의 회화 2줄", to: "/app/dialogs" },
    { key: "review", title: "랜덤 복습", desc: "단어/문장/문법 랜덤", to: "/app/review" },
    { key: "history", title: "학습 기록", desc: "주간/누적 기록", to: "/app/history" },
    { key: "mypage", title: "마이페이지", desc: "프로필/설정", to: "/app/mypage" },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold">오늘의 루틴</h2>
        <p className="text-gray-600 text-sm">{user?.email}님</p>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {routine.map(r => (
          <Link key={r.key} to={r.to}
            className="bg-white p-5 rounded-xl border shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-lg font-semibold">{r.title}</div>
                <div className="text-sm text-gray-500">{r.desc}</div>
              </div>
              <div className="text-gray-400 text-xl">›</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
