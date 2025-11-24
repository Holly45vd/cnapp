import { useState } from "react";

export default function DocIdSearch({ idKey, onSearch }) {
  const [id, setId] = useState("");

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border space-y-2">
      <div className="font-semibold">ID로 조회</div>

      <div className="flex gap-2">
        <input
          className="border rounded-lg px-3 py-2 flex-1"
          placeholder={`${idKey} 입력`}
          value={id}
          onChange={(e) => setId(e.target.value)}
        />

        <button
          onClick={() => onSearch(id)}
          className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-900"
        >
          조회
        </button>
      </div>

      <p className="text-xs text-gray-500">
        * 예: words → wordId, sentences → sentenceId
      </p>
    </div>
  );
}
