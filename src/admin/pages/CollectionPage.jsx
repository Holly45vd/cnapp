import { useEffect, useMemo, useState } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/firebase";

import JsonUploadBox from "../components/JsonUploadBox";
import JsonEditor from "../components/JsonEditor";
import DocIdSearch from "../components/DocIdSearch";

// MUI
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Divider,
  Alert,
  Chip,
} from "@mui/material";

// ===== id 자동생성 규칙 =====
function generateId(prefix) {
  const rand = Math.random().toString(36).slice(2, 6);
  return `${prefix}${Date.now()}_${rand}`;
}
function getPrefixByCollection(collection) {
  switch (collection) {
    case "words":
      return "w_";
    case "sentences":
      return "s_";
    case "dialogs":
      return "d_";
    case "grammar":
      return "g_";
    case "days":
      return "day_";
    default:
      return "x_";
  }
}

export default function CollectionPage({ collection, idKey }) {
  const [currentId, setCurrentId] = useState("");
  const [jsonObj, setJsonObj] = useState(null);

  const [status, setStatus] = useState(""); // loading | loaded | saving | saved
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

    // 1) JSON에 id가 있으면 그거 사용
    let idFromObj = obj?.[idKey];
    let id = idFromObj || currentId;

    // 2) 없으면 자동 생성
    if (!id) {
      const prefix = getPrefixByCollection(collection);
      id = generateId(prefix);

      // JSON에도 id 박아주기(연결/재조회 편하게)
      obj = { ...obj, [idKey]: id };
      setJsonObj(obj);
      setCurrentId(id);
    }

    setStatus("saving");
    setError("");

    try {
      const ref = doc(db, collection, id);

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

  const title = titleMap[collection] || collection;

  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      {/* ===== 헤더 ===== */}
      <Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h5" fontWeight={800}>
            {title} 관리
          </Typography>
          <Chip size="small" label={collection} />
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          JSON 업로드 / 조회 / 수정 후 Firestore에 저장합니다.
        </Typography>
      </Box>

      {/* ===== 현재 ID 표시 ===== */}
      {currentId && (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          현재 문서 ID: <b style={{ fontFamily: "monospace" }}>{currentId}</b>
        </Alert>
      )}

      {/* ===== ID 조회 카드 ===== */}
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <Stack spacing={1.5}>
            <Typography fontWeight={700}>ID로 조회</Typography>
            <Typography variant="body2" color="text.secondary">
              {idKey}로 기존 문서를 불러옵니다.
            </Typography>
            <Divider />
            {/* 기존 컴포넌트 유지 */}
            <DocIdSearch idKey={idKey} onSearch={loadById} />
          </Stack>
        </CardContent>
      </Card>

      {/* ===== JSON 업로드 카드 ===== */}
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <Stack spacing={1.5}>
            <Typography fontWeight={700}>JSON 업로드</Typography>
            <Typography variant="body2" color="text.secondary">
              파일 업로드 또는 붙여넣기로 JSON을 불러옵니다.
              <br />
              {idKey}가 없으면 저장 시 자동으로 생성됩니다.
            </Typography>
            <Divider />
            <JsonUploadBox
              idKey={idKey}
              onLoaded={(obj) => {
                setError("");
                setStatus("loaded");
                setJsonObj(obj);
                setCurrentId(obj?.[idKey] || "");
              }}
            />
          </Stack>
        </CardContent>
      </Card>

      {/* ===== JSON 에디터 카드 ===== */}
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <Stack spacing={1.5}>
            <Typography fontWeight={700}>JSON 편집</Typography>
            <Typography variant="body2" color="text.secondary">
              로드된 JSON을 수정하고 저장하세요.
            </Typography>
            <Divider />
            <JsonEditor
              value={jsonObj}
              onChange={(obj) => {
                setJsonObj(obj);
                if (obj?.[idKey]) setCurrentId(obj[idKey]);
              }}
              onSave={() => saveJson(jsonObj)}
            />
          </Stack>
        </CardContent>
      </Card>

      {/* ===== 상태/에러 ===== */}
      <Box sx={{ display: "grid", gap: 1 }}>
        {status === "loading" && (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            불러오는 중...
          </Alert>
        )}
        {status === "saving" && (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            저장하는 중...
          </Alert>
        )}
        {status === "saved" && (
          <Alert severity="success" sx={{ borderRadius: 2 }}>
            ✅ 저장 완료
          </Alert>
        )}
        {status === "loaded" && !error && (
          <Alert severity="success" sx={{ borderRadius: 2 }}>
            ✅ 로드 완료
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        )}
      </Box>
    </Box>
  );
}
