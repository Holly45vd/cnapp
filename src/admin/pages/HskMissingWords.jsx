// src/admin/pages/HskMissingWords.jsx
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebase";

// MUI
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  TextField,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
} from "@mui/material";

/**
 * HSK 필드 정규화
 */
function normalizeHskDoc(docSnap) {
  const data = docSnap.data() || {};
  const simplified = (data.simplified || docSnap.id || "").trim();
  const traditional = (data.traditional || "").trim();
  const pinyin = (data.pinyin || data.Pinyin || "").trim();

  let levelNum = data.hskLevel ?? null;

  if (levelNum == null && typeof data.hskLabel === "string") {
    const m = data.hskLabel.match(/(\d+)/);
    if (m) levelNum = Number(m[1]);
  }

  if (
    levelNum == null &&
    typeof data.hsk_level === "string" &&
    !Number.isNaN(Number(data.hsk_level.replace(/[^\d]/g, "")))
  ) {
    const n = Number(data.hsk_level.replace(/[^\d]/g, ""));
    if (!Number.isNaN(n)) levelNum = n;
  }

  const label =
    data.hskLabel ||
    data.hsk_level ||
    (levelNum ? `HSK${levelNum}` : null);

  return {
    id: docSnap.id,
    simplified,
    traditional,
    pinyin,
    level: levelNum,
    label,
    raw: data,
  };
}

/**
 * words 컬렉션의 zh 집합 만들기
 */
function buildWordsZhSet(wordDocs) {
  const set = new Set();
  wordDocs.forEach((d) => {
    const data = d.data() || {};
    const zh = (data.zh || "").trim();
    if (zh) set.add(zh);
  });
  return set;
}

export default function HskMissingWords() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [hskWords, setHskWords] = useState([]);
  const [wordsZhSet, setWordsZhSet] = useState(new Set());

  // 필터
  const [levelFilter, setLevelFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");

        // 1) HSK 전체 + words 전체 로딩
        const [hskSnap, wordsSnap] = await Promise.all([
          getDocs(collection(db, "hskWords")),
          getDocs(collection(db, "words")),
        ]);

        const hskList = hskSnap.docs.map(normalizeHskDoc);
        const zhSet = buildWordsZhSet(wordsSnap.docs);

        setHskWords(hskList);
        setWordsZhSet(zhSet);
      } catch (e) {
        console.error(e);
        setError(e.message || "데이터를 불러오는 데 실패했어.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 아직 words에 없는 HSK 단어만 추출
  const missingHskWords = useMemo(() => {
    return hskWords.filter(
      (h) => h.simplified && !wordsZhSet.has(h.simplified)
    );
  }, [hskWords, wordsZhSet]);

  // 사용중인 HSK 레벨 옵션
  const levelOptions = useMemo(() => {
    const map = new Map(); // levelNum → label
    missingHskWords.forEach((w) => {
      if (w.level != null) map.set(w.level, w.label || `HSK${w.level}`);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([level, label]) => ({ level, label }));
  }, [missingHskWords]);

  // 필터/검색 적용
  const filtered = useMemo(() => {
    let list = missingHskWords;

    if (levelFilter !== "all") {
      const num = Number(levelFilter);
      list = list.filter((w) => w.level === num);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((w) => {
        const s = w.simplified || "";
        const t = w.traditional || "";
        const p = w.pinyin || "";
        return (
          s.includes(q) ||
          t.includes(q) ||
          p.toLowerCase().includes(q)
        );
      });
    }

    // 기본 정렬: level → simplified
    return list.sort((a, b) => {
      const la = a.level ?? 999;
      const lb = b.level ?? 999;
      if (la !== lb) return la - lb;
      return a.simplified.localeCompare(b.simplified);
    });
  }, [missingHskWords, levelFilter, search]);

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", p: 3 }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography>HSK / 단어 데이터 불러오는 중...</Typography>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: "100vh", p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      {/* 헤더 */}
      <Box>
        <Typography variant="h4" fontWeight={800}>
          HSK 미등록 단어
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          hskWords에는 있지만 words 컬렉션에 아직 등록되지 않은 HSK 단어 목록이야.
          <br />
          급수별로 부족한 단어를 채워 넣을 때 참고용으로 쓰면 좋다.
        </Typography>
      </Box>

      {/* 요약 / 필터 카드 */}
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                size="small"
                label={`HSK 전체: ${hskWords.length}개`}
                color="default"
              />
              <Chip
                size="small"
                label={`미등록: ${missingHskWords.length}개`}
                color="warning"
              />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                size="small"
                fullWidth
                label="검색 (간체/번체/병음)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <TextField
                size="small"
                select
                label="HSK 급수"
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                sx={{ minWidth: 140 }}
              >
                <MenuItem value="all">전체</MenuItem>
                {levelOptions.map((opt) => (
                  <MenuItem key={opt.level} value={opt.level}>
                    {opt.label || `HSK${opt.level}`}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <Typography variant="caption" color="text.secondary">
              * 이 페이지는 읽기 전용이야. 실제 단어 등록은 상단 메뉴의{" "}
              <b>Words</b> 페이지에서 JSON으로 추가하면 돼.
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {/* 리스트 */}
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
            미등록 HSK 단어 목록 ({filtered.length}개)
          </Typography>

          {filtered.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              선택한 조건에 맞는 미등록 HSK 단어가 없어.
              <br />
              (이미 전부 words에 등록했거나, 필터/검색 조건이 너무 좁을 수 있어.)
            </Typography>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
                maxHeight: "65vh",
                overflowY: "auto",
              }}
            >
              {filtered.map((w) => (
                <Box
                  key={w.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 1,
                    borderRadius: 2,
                    border: "1px solid #f0f0f0",
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="h6" fontWeight={800}>
                        {w.simplified}
                      </Typography>
                      {w.traditional && w.traditional !== w.simplified && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          ({w.traditional})
                        </Typography>
                      )}
                    </Stack>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.2 }}
                    >
                      {w.pinyin}
                    </Typography>
                  </Box>

                  <Stack spacing={0.5} alignItems="flex-end">
                    {w.label && (
                      <Chip
                        size="small"
                        label={w.label}
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    {w.level != null && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        레벨: {w.level}
                      </Typography>
                    )}
                  </Stack>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
