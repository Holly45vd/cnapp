import { Link } from "react-router-dom";

export default function WordSession() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">단어 학습</h2>
      <p className="text-gray-600">
        (더미 화면) 나중에 오늘의 신규 3개 + 복습 18개 카드로 연결
      </p>

      <div className="bg-white p-5 rounded-xl border">
        <div className="text-sm text-gray-500 mb-2">예시 카드</div>
        <div className="text-3xl font-bold">需要</div>
        <div className="text-gray-600">xūyào</div>
        <div className="mt-2">필요하다</div>
      </div>

      <Link to="/app" className="text-sm text-gray-500 hover:text-black">
        ← 홈으로
      </Link>
    </div>
  );
}
