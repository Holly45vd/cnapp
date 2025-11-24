import { Link } from "react-router-dom";

export default function RandomReview() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">랜덤 복습</h2>
      <p className="text-gray-600">
        (더미 화면) 나중에 오늘 학습/최근 오답에서 랜덤 퀴즈 생성
      </p>

      <div className="bg-white p-5 rounded-xl border">
        <div className="text-sm text-gray-500 mb-2">예시 문제</div>
        <div className="text-xl font-semibold">“需要” 뜻은?</div>
        <div className="mt-3 space-y-2">
          <button className="w-full text-left px-3 py-2 border rounded-lg">A. 필요하다</button>
          <button className="w-full text-left px-3 py-2 border rounded-lg">B. 좋아하다</button>
          <button className="w-full text-left px-3 py-2 border rounded-lg">C. 기다리다</button>
        </div>
      </div>

      <Link to="/app" className="text-sm text-gray-500 hover:text-black">
        ← 홈으로
      </Link>
    </div>
  );
}
