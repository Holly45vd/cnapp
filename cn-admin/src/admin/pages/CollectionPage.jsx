import { useEffect, useMemo, useState } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/firebase";

import JsonUploadBox from "../components/JsonUploadBox";
import JsonEditor from "../components/JsonEditor";
import DocIdSearch from "../components/DocIdSearch";

export default function CollectionPage({ collection, idKey }) {
  const [currentId, setCurrentId] = useState("");
  const [jsonObj, setJsonObj] = useState(null);

  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const titleMap = useMemo(
    () => ({
      words: "단어",
      sentences: "문장",
      dialogs: "회화",
      grammar: "문법",
      days: "Day",
    }),
    []
  );

  useEffect(() => {
    setStatus("");
    setError("");
    setCurrentId("");
    setJsonObj(null);
  }, [collection, idKey]);

  const loadById = async (id) => {
    if (!id) {
      setError(`❌ ${idKey}를 입력해줘`);
      return;
    }

    setStatus("loading");
    setError("");
    setCurrentId(id);

    try {
      const ref = doc(db, collection, id);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        setJsonObj(null);
        setStatus("");
        setError("❌ 해당 ID 문서가 없음");
        return;
      }

      setJsonObj(snap.data());
      setStatus("loaded");
    } catch (e) {
      console.error(e);
      setStatus("");
      setError("❌ 로드 실패: " + e.message);
    }
  };

  const saveJson = async (obj) => {
    if (!obj) {
      setError("❌ 저장할 JSON이 없음");
      return;
    }

    const idFromObj = obj?.[idKey];
    const id = idFromObj || currentId;

    if (!id) {
      setError(`❌ JSON 안에 ${idKey}가 없고, 조회한 ID도 없음`);
      return;
    }

    setStatus("saving");
    setError("");

    try {
      const ref = doc(db, collection, id);

      // createdAt / updatedAt 자동 세팅 (있으면 유지)
      const payload = {
        ...obj,
        [idKey]: id,
        updatedAt: serverTimestamp(),
        createdAt: obj.createdAt ?? serverTimestamp(),
      };

      await setDoc(ref, payload, { merge: true });

      setCurrentId(id);
      setJsonObj(payload);
      setStatus("saved");
    } catch (e) {
      console.error(e);
      setStatus("");
      setError("❌ 저장 실패: " + e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <header className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {titleMap[collection] || collection} 관리
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            JSON 업로드/조회/수정 후 Firestore에 저장합니다.
          </p>
        </div>

        {currentId && (
          <div className="text-sm text-gray-500">
            현재 ID: <span className="font-mono">{currentId}</span>
          </div>
        )}
      </header>

      {/* ID 조회 */}
      <DocIdSearch idKey={idKey} onSearch={loadById} />

      {/* JSON 업로드 */}
      <JsonUploadBox
        idKey={idKey}
        onLoaded={(obj) => {
          setError("");
          setStatus("loaded");
          setJsonObj(obj);
          setCurrentId(obj?.[idKey] || "");
        }}
      />

      {/* JSON 편집기 */}
      <JsonEditor
        value={jsonObj}
        onChange={(obj) => {
          setJsonObj(obj);
          if (obj?.[idKey]) setCurrentId(obj[idKey]);
        }}
        onSave={() => saveJson(jsonObj)}
      />

      {/* 상태/에러 메시지 */}
      <footer className="space-y-2">
        {status === "loading" && (
          <div className="text-sm text-gray-600">불러오는 중...</div>
        )}
        {status === "saving" && (
          <div className="text-sm text-gray-600">저장하는 중...</div>
        )}
        {status === "saved" && (
          <div className="text-sm text-green-700">✅ 저장 완료</div>
        )}
        {status === "loaded" && !error && (
          <div className="text-sm text-blue-700">✅ 로드 완료</div>
        )}
        {error && <div className="text-sm text-red-600">{error}</div>}
      </footer>
    </div>
  );
}
