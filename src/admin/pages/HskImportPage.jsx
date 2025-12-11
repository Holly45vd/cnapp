// src/admin/pages/HskImportPage.jsx
import { useState } from "react";
import { doc, writeBatch, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/firebase";

import JsonUploadBox from "../components/JsonUploadBox";

// MUI
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  Button,
  Alert,
  Divider,
  Chip,
} from "@mui/material";

export default function HskImportPage() {
  const [jsonData, setJsonData] = useState(null); // 업로드된 원본 JSON (배열 기대)
  const [status, setStatus] = useState("idle"); // idle | running
  const [error, setError] = useState("");
  const [result, setResult] = useState(null); // { total, skipped }

  const handleUpload = async () => {
    setError("");
    setResult(null);

    if (!jsonData) {
      setError("먼저 JSON을 업로드하거나 붙여넣어줘.");
      return;
    }

    if (!Array.isArray(jsonData)) {
      setError("JSON 최상단이 배열이어야 해. [ { ... }, { ... } ] 형태로 만들어줘.");
      return;
    }

    setStatus("running");

    try {
      let total = 0;
      let skipped = 0;

      let batch = writeBatch(db);
      let writes = 0;

      const now = serverTimestamp();

      for (const row of jsonData) {
        const simplified = (row.simplified || "").trim();
        if (!simplified) {
          skipped += 1;
          continue;
        }

        // "HSK1" 같은 문자열에서 숫자만 뽑기
        const rawLevel = row.hsk_level || row.hskLevel || "";
        let levelNum = null;
        if (typeof rawLevel === "string") {
          const m = rawLevel.match(/(\d+)/);
          if (m) levelNum = Number(m[1]);
        } else if (typeof rawLevel === "number") {
          levelNum = rawLevel;
        }

        const ref = doc(db, "hskWords", simplified);

        batch.set(
          ref,
          {
            simplified,
            traditional: row.traditional || "",
            pinyin: row.pinyin || "",
            hskLevel: levelNum,                    // 숫자 레벨 (1~6)
            hskLabel: rawLevel || null,            // "HSK1" 이런 원본 문자열
            raw: row,                              // 원본 전체 보관 (혹시 나중에 필요하면)
            updatedAt: now,
            createdAt: now,
          },
          { merge: true }
        );

        writes += 1;
        total += 1;

        // Firestore 한 배치당 500 제한 여유롭게 고려해서 400마다 커밋
        if (writes >= 400) {
          await batch.commit();
          batch = writeBatch(db);
          writes = 0;
        }
      }

      if (writes > 0) {
        await batch.commit();
      }

      setResult({ total, skipped });
    } catch (e) {
      console.error(e);
      setError(e.message || "업로드 중 오류가 발생했어.");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={2.5}>
        <Typography variant="h5" fontWeight={800}>
          HSK 단어 일괄 업로드
        </Typography>

        <Card>
          <CardContent>
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip size="small" label="HSK" color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  CSV → JSON 변환한 HSK 리스트를 업로드
                </Typography>
              </Stack>

              <Typography variant="body2" color="text.secondary">
                예시 형태:
                <pre
                  style={{
                    margin: "8px 0",
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: "#f9fafb",
                    fontSize: 12,
                    overflowX: "auto",
                  }}
                >
{`[
  {
    "simplified": "爱",
    "traditional": "愛",
    "pinyin": "ài",
    "hsk_level": "HSK1"
  },
  {
    "simplified": "八",
    "traditional": "八",
    "pinyin": "bā",
    "hsk_level": "HSK1"
  }
]`}
                </pre>
                위와 같이 배열 형태로 변환해 두고 JSON으로 업로드하면,
                <code>hskWords</code> 컬렉션에 각 단어가 저장돼.
                <br />
                문서 ID는 <b>simplified</b> (간체 표기) 기준으로 쓴다.
              </Typography>

              <Divider />

              <JsonUploadBox
                idKey="simplified"
                onLoaded={(obj) => {
                  setError("");
                  setResult(null);
                  setJsonData(obj);
                }}
              />

              {jsonData && (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  배열 길이:{" "}
                  {Array.isArray(jsonData) ? jsonData.length : "배열 아님"}
                </Alert>
              )}

              {error && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              {result && (
                <Alert severity="success" sx={{ borderRadius: 2 }}>
                  업로드 완료: 총 {result.total}개 저장 (simplified 없는 항목{" "}
                  {result.skipped}개 스킵)
                </Alert>
              )}

              <Box>
                <Button
                  variant="contained"
                  onClick={handleUpload}
                  disabled={status === "running" || !jsonData}
                  sx={{ borderRadius: 2, fontWeight: 700 }}
                >
                  {status === "running" ? "업로드 중..." : "hskWords 컬렉션에 업로드"}
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
