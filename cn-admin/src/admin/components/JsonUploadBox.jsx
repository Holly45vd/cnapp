import { useState } from "react";

export default function JsonUploadBox({ idKey, onLoaded }) {
  const [text, setText] = useState("");

  const handleFile = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result);
        onLoaded(obj);
        setText(JSON.stringify(obj, null, 2));
      } catch (e) {
        alert("❌ JSON 파일 파싱 실패");
        console.error(e);
      }
    };
    reader.readAsText(file);
  };

  const handlePasteLoad = () => {
    try {
      const obj = JSON.parse(text);
      onLoaded(obj);
    } catch (e) {
      alert("❌ 붙여넣은 JSON 파싱 실패");
      console.error(e);
    }
  };

  const handleClear = () => {
    setText("");
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border space-y-3">
      <div className="font-semibold">JSON 등록</div>

      {/* 파일 업로드 */}
      <div className="flex items-center gap-3">
        <input
          type="file"
          accept=".json,application/json"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <button
          type="button"
          onClick={handleClear}
          className="text-sm text-gray-500 hover:text-black"
        >
          입력 지우기
        </button>
      </div>

      {/* JSON 붙여넣기 텍스트 */}
      <textarea
        className="w-full h-48 border rounded-lg p-3 font-mono text-sm"
        placeholder={`JSON 붙여넣기. ${idKey} 필드가 있으면 자동으로 ID가 됩니다.`}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handlePasteLoad}
          className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-black"
        >
          붙여넣은 JSON 불러오기
        </button>
      </div>

      <div className="text-xs text-gray-500">
        * JSON 최상단에 <b>{idKey}</b>가 있으면 그 값으로 문서 ID를 씁니다.
      </div>
    </div>
  );
}
