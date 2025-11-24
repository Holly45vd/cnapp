import { useEffect, useState } from "react";

export default function JsonEditor({ value, onChange, onSave }) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (value) setText(JSON.stringify(value, null, 2));
    else setText("");
  }, [value]);

  const applyChanges = () => {
    try {
      const obj = JSON.parse(text);
      onChange(obj);
    } catch (e) {
      alert("❌ JSON 파싱 실패 (형식 확인)");
      console.error(e);
    }
  };

  if (!value) {
    return (
      <div className="bg-white p-4 rounded-xl border text-gray-500">
        JSON을 업로드하거나 ID로 조회하면 여기에 표시됩니다.
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border space-y-3">
      <div className="font-semibold">JSON 편집</div>

      <textarea
        className="w-full h-96 border rounded-lg p-3 font-mono text-sm"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={applyChanges}
          className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
        >
          변경 적용(파싱)
        </button>

        <button
          type="button"
          onClick={onSave}
          className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-900"
        >
          Firestore 저장
        </button>
      </div>

      <div className="text-xs text-gray-500">
        * 저장 전 “변경 적용(파싱)”을 눌러 JSON 유효성 체크하는 습관 들이면 편함.
      </div>
    </div>
  );
}
