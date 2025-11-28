// src/app/pages/WordSession.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { listCollection } from "../../firebase/db";
import {
  pinyinArrayToKorean,
  freeTextPinyinToKorean,
} from "../../lib/pinyinKorean";
import { speakZh } from "../../lib/ttsHelper";

// MUI
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  Chip,
  LinearProgress,
  IconButton,
} from "@mui/material";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";

/** 상단 알다/학습/전체 진행 표시 */
function PillProgress({ known, learn, total }) {
  const knownW = total ? Math.round((known / total) * 100) : 0;
  const learnW = total ? Math.round((learn / total) * 100) : 0;

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent sx={{ py: 1.5 }}>
        <Stack spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Chip
              size="small"
              label={`${known} 알다`}
              sx={{ bgcolor: "blue.50", color: "primary.main" }}
            />
            <Chip
              size="small"
              label={`${learn} 학습`}
              sx={{ bgcolor: "amber.50", color: "warning.main" }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ marginLeft: "auto" }}
            >
              {total} 단어
            </Typography>
          </Stack>

          <Box
            sx={{
              height: 8,
              borderRadius: 999,
              bgcolor: "grey.100",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                height: "100%",
                width: `${knownW}%`,
                bgcolor: "primary.main",
                float: "left",
              }}
            />
            <Box
              sx={{
                height: "100%",
                width: `${learnW}%`,
                bgcolor: "warning.main",
                float: "left",
              }}
            />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function WordSession({ wordIds: propWordIds, onDone, mode }) {
  const { state } = useLocation();
  const wordIds = propWordIds || state?.routine?.words || [];

  const [allWords, setAllWords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [idx, setIdx] = useState(0);
  const [doneIds, setDoneIds] = useState([]); // 학습
  const [knownIds, setKnownIds] = useState([]); // 알고있다

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const words = await listCollection("words");
        setAllWords(words);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sessionWords = useMemo(() => {
    if (!wordIds?.length) return [];
    const idSet = new Set(wordIds);
    return allWords.filter((w) => idSet.has(w.wordId));
  }, [allWords, wordIds]);

  const current = sessionWords[idx];

  // ✅ 한글 뜻
  const meaningKo =
    current?.ko ||
    current?.meaning_ko || // 네 JSON 기준
    current?.meaningKo ||
    "";

  // ✅ 한글 발음
  let koPron = "";
  if (current?.koPronunciation) {
    koPron = current.koPronunciation;
  } else if (Array.isArray(current?.syllables) && current.syllables.length) {
    // 단어용: 음절 배열 → 한국어 발음
    koPron = pinyinArrayToKorean(current.syllables);
  } else if (current?.pinyin) {
    // 보정용: 전체 병음을 free-text 변환
    koPron = freeTextPinyinToKorean(current.pinyin);
  }

  const handleChoice = (type) => {
    if (!current) return;

    if (type === "learn") {
      setDoneIds((p) =>
        p.includes(current.wordId) ? p : [...p, current.wordId]
      );
    }
    if (type === "known") {
      setKnownIds((p) =>
        p.includes(current.wordId) ? p : [...p, current.wordId]
      );
    }

    const nextIdx = idx + 1;

    if (nextIdx >= sessionWords.length) {
      onDone?.({
        wordsDone:
          type === "learn" && !doneIds.includes(current.wordId)
            ? [...doneIds, current.wordId]
            : doneIds,
        wordsKnown:
          type === "known" && !knownIds.includes(current.wordId)
            ? [...knownIds, current.wordId]
            : knownIds,
      });
      return;
    }
    setIdx(nextIdx);
  };

  const handleCancel = () => {
    onDone?.({ wordsDone: doneIds, wordsKnown: knownIds });
  };

  // 🔊 항상 중국어 한자만 읽게 고정
  const handleSpeak = () => {
    if (!current?.zh) return;
    speakZh(current.zh);
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          단어 불러오는 중...
        </Typography>
      </Box>
    );
  }

  if (!sessionWords.length) {
    return (
      <Box sx={{ p: 2 }}>
        {mode !== "today" && (
          <Typography variant="h6" fontWeight={800}>
            오늘 공부 - 단어
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary">
          오늘 학습할 단어가 없습니다.
        </Typography>
      </Box>
    );
  }

  const content = (
    <Stack spacing={2}>
      <PillProgress
        known={knownIds.length}
        learn={doneIds.length}
        total={sessionWords.length}
      />

      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ py: 4 }}>
          <Stack spacing={2} alignItems="center">
            {/* 스피커 */}
            <IconButton
              onClick={handleSpeak}
              sx={{
                bgcolor: "blue.50",
                color: "primary.main",
                "&:hover": { bgcolor: "blue.100" },
              }}
            >
              <VolumeUpIcon />
            </IconButton>

            {/* 한자 */}
            <Typography variant="h3" fontWeight={800}>
              {current.zh}
            </Typography>

            {/* 병음 */}
            {current.pinyin && (
              <Typography variant="subtitle1" color="text.secondary">
                {current.pinyin}
              </Typography>
            )}

            {/* 한글 발음 */}
            {koPron && (
              <Typography variant="body2" color="text.secondary">
                {koPron}
              </Typography>
            )}

            {/* 한글 뜻 */}
            {meaningKo && (
              <Typography variant="h6" sx={{ mt: 1 }}>
                {meaningKo}
              </Typography>
            )}

            <Typography variant="caption" color="text.secondary">
              {idx + 1} / {sessionWords.length}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <Stack direction="row" spacing={1.5}>
        <Button
          fullWidth
          variant="contained"
          color="warning"
          onClick={() => handleChoice("learn")}
          sx={{ fontWeight: 800, borderRadius: 2, py: 1.5 }}
        >
          다시보기
        </Button>
        <Button
          fullWidth
          variant="contained"
          onClick={() => handleChoice("known")}
          sx={{ fontWeight: 800, borderRadius: 2, py: 1.5 }}
        >
          외웠음
        </Button>
      </Stack>

      <Button onClick={handleCancel} sx={{ color: "text.secondary" }}>
        실행 취소
      </Button>
    </Stack>
  );

  if (mode === "today") return content;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: 2 }}>
      {content}
    </Box>
  );
}
