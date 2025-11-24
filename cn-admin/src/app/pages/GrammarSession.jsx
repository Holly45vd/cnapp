import { Link } from "react-router-dom";

export default function GrammarSession() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">문법</h2>
      <p className="text-gray-600">
        (더미 화면) 나중에 Day.grammarId 로딩해서 학습/연습문제 표시
      </p>

      <div className="bg-white p-5 rounded-xl border space-y-2">
        <div className="text-sm text-gray-500">예시 문법</div>
        <div className="text-xl font-semibold">把字句</div>
        <div className="font-mono text-sm">S + 把 + O + V + 了</div>
        <div className="text-gray-700">목적어를 앞으로 꺼내 결과를 강조</div>
      </div>

      <Link to="/app" className="text-sm text-gray-500 hover:text-black">
        ← 홈으로
      </Link>
    </div>
  );
}
