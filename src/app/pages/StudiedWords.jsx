// src/app/pages/StudiedWords.jsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../providers/AuthProvider";
import { listUserHistoryAll, listCollection } from "../../firebase/db";
import { speakZh } from "../../lib/ttsHelper";

// MUI
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  TextField,
  MenuItem,
  IconButton,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";

// 복습 상세 모달 재사용
import ReviewDetailDialog from "../components/review/ReviewDetailDialog";

// --------------------------------------------------
// 공통 유틸
// --------------------------------------------------
function normalizeId(item) {
  if (!item) return null;
  if (typeof item === "string") return item;
  return item.wordId || item.id || null;
}

// HSK 라벨 추출 (여러 케이스 방어적으로 처리)
function getHskLabel(word) {
  if (!word) return null;

  if (word.hskLabel) return word.hskLabel;        // "HSK1"
  if (typeof word.hskLevel === "number") return `HSK${word.hskLevel}`;
  if (typeof word.hsk_level === "string") return word.hsk_level;

  if (Array.isArray(word.tags)) {
    const t = word.tags.find((x) => /^HSK\d/.test(x));
    if (t) return t;
  }
  return null;
}

export default function StudiedWords() {
  const { user } = useAuth();

  const [historyDocs, setHistoryDocs] = useState([]);
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);

  // 필터 / 검색
  const [search, setSearch] = useState("");
  const [hskFilter, setHskFilter] = useState("all");

  // 상세 모달 상태
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  // --------------------------------------
  // 데이터 로딩
  // --------------------------------------
  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        setLoading(true);
        const [allHistory, allWords] = await Promise.all([
          listUserHistoryAll(user.uid),
          listCollection("words"),
        ]);

        setHistoryDocs(allHistory);
        setWords(allWords);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // wordId → word 맵
  const wordMap = useMemo(
    () => new Map(words.map((w) => [w.wordId, w])),
    [words]
  );

  // 내가 실제로 공부한 단어 ID 집합 (Done + Known 기준)
  const studiedWordIds = useMemo(() => {
    const set = new Set();
    for (const doc of historyDocs) {
      (doc.wordsDone || []).forEach((x) => set.add(normalizeId(x)));
      (doc.wordsKnown || []).forEach((x) => set.add(normalizeId(x)));
    }
    set.delete(null);
    return set;
  }, [historyDocs]);

  // 실제 단어 객체 리스트
  const studiedWords = useMemo(() => {
    const arr = [];
    studiedWordIds.forEach((id) => {
      const w = wordMap.get(id);
      if (w) arr.push(w);
    });

    // 기본 정렬: HSK → 레벨 → 한자
    return arr.sort((a, b) => {
      const ha = getHskLabel(a) || "";
      const hb = getHskLabel(b) || "";
      if (ha !== hb) return ha.localeCompare(hb);
      const la = a.level ?? 999;
      const lb = b.level ?? 999;
      if (la !== lb) return la - lb;
      return (a.zh || "").localeCompare(b.zh || "");
    });
  }, [studiedWordIds, wordMap]);

  // HSK 필터 옵션 자동 생성
  const hskOptions = useMemo(() => {
    const set = new Set();
    studiedWords.forEach((w) => {
      const label = getHskLabel(w);
      if (label) set.add(label);
    });
    return Array.from(set).sort(); // ["HSK1", "HSK2", ...]
  }, [studiedWords]);

  // 검색 + HSK 필터 적용
  const filteredWords = useMemo(() => {
    let list = studiedWords;

    if (hskFilter !== "all") {
      list = list.filter((w) => getHskLabel(w) === hskFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((w) => {
        const zh = w.zh || "";
        const pinyin = w.pinyin || "";
        const ko = w.meaning_ko || "";
        return (
          zh.includes(q) ||
          pinyin.toLowerCase().includes(q) ||
          ko.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [studiedWords, hskFilter, search]);

  const handleOpenDetail = (word) => {
    setDetailItem(word);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setDetailItem(null);
  };

  const handleSpeakWord = (w) =>
    speakZh(w?.audio?.ttsText || w?.zh || "");

  if (!user) {
    return (
      <Box sx={{ minHeight: "100vh", p: 2 }}>
        <Typography>로그인이 필요합니다.</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", p: 2 }}>
        <Typography>내가 공부한 단어를 불러오는 중...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: 1 }}>
      <Stack spacing={2.5} sx={{ p: 1 }}>
        {/* 헤더 */}
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton size="small" onClick={() => window.history.back()}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Typography variant="h5" fontWeight={800}>
            내가 공부한 단어
          </Typography>
          <Chip
            size="small"
            label={`${studiedWords.length}개`}
            sx={{ ml: 0.5 }}
          />
        </Stack>

        {/* 필터 영역 */}
        <Card>
          <CardContent>
            <Stack spacing={1.5}>
              <Typography variant="body2" color="text.secondary">
                복습 기록 기준으로, 지금까지 학습한 단어만 모아서 볼 수 있어.
              </Typography>

              <Stack direction="row" spacing={1}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="한자 / 병음 / 뜻 검색"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon fontSize="small" />,
                  }}
                />

                <TextField
                  size="small"
                  select
                  label="HSK"
                  value={hskFilter}
                  onChange={(e) => setHskFilter(e.target.value)}
                  sx={{ width: 110 }}
                >
                  <MenuItem value="all">전체</MenuItem>
                  {hskOptions.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* 리스트 */}
        {filteredWords.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            조건에 맞는 단어가 없어. 필터를 바꾸거나 더 공부해보자.
          </Typography>
        ) : (
          <Stack spacing={1.2}>
            {filteredWords.map((w) => {
              const hsk = getHskLabel(w);
              return (
                <Card
                  key={w.wordId}
                  onClick={() => handleOpenDetail(w)}
                  sx={{
                    borderRadius: 2,
                    cursor: "pointer",
                    "&:hover": { boxShadow: 3, transform: "translateY(-1px)" },
                  }}
                >
                  <CardContent sx={{ py: 1.2 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1.5}
                      justifyContent="space-between"
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h6" fontWeight={800}>
                          {w.zh}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.3 }}
                        >
                          {w.pinyin} · {w.meaning_ko}
                        </Typography>
                      </Box>

                      <Stack spacing={0.5} alignItems="flex-end">
                        {hsk && (
                          <Chip
                            size="small"
                            label={hsk}
                            color="primary"
                            variant="outlined"
                          />
                        )}
                        {typeof w.level === "number" && (
                          <Chip
                            size="small"
                            label={`Lv.${w.level}`}
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        )}
      </Stack>

      {/* 상세 모달 – 복습하기와 동일한 컴포넌트 재사용 */}
      <ReviewDetailDialog
        open={detailOpen}
        onClose={handleCloseDetail}
        type="word"
        item={detailItem}
        onSpeak={handleSpeakWord}
      />
    </Box>
  );
}
