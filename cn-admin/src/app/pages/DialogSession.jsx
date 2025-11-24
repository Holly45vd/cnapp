import { Link } from "react-router-dom";

export default function DialogSession() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">회화</h2>
      <p className="text-gray-600">
        (더미 화면) 나중에 Day.dialogIds 불러와서 2줄 회화/듣기/따라읽기
      </p>

      <div className="bg-white p-5 rounded-xl border space-y-3">
        <div>
          <div className="text-sm text-gray-500">A</div>
          <div className="text-lg">你今天要去办公室吗？</div>
          <div className="text-gray-600 text-sm">Nǐ jīntiān yào qù bàngōngshì ma?</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">B</div>
          <div className="text-lg">不，我在家工作。</div>
          <div className="text-gray-600 text-sm">Bù, wǒ zàijiā gōngzuò.</div>
        </div>
      </div>

      <Link to="/app" className="text-sm text-gray-500 hover:text-black">
        ← 홈으로
      </Link>
    </div>
  );
}
