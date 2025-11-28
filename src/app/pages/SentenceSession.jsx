// src/app/pages/SentenceSession.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { listCollection } from "../../firebase/db";
import { freeTextPinyinToKorean } from "../../lib/pinyinKorean";
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

export default function SentenceSession({
  sentenceIds: propSentenceIds,
  onDone,
  mode,
}) {
  const { state } = useLocation();

  // AppHome → TodayStudySession에서 routine을 state로 넘겨주는 경우 대비
  const sentenceIds = propSentenceIds || state?.routine?.sentences || [];

  const [allSentences, setAllSentences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);

  // ✅ 문장도 학습 / 알고 있음 두 단계로 분리
  const [doneIds, setDoneIds] = useState([]);   // sentencesDone
  const [knownIds, setKnownIds] = useState([]); // sentencesKnown

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const sentences = await listCollection("sentences");
        setAllSentences(sentences);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ✅ routine에 들어있는 ID는 doc.id 기준일 가능성이 크기 때문에
  //    s.id 또는 s.sentenceId 둘 다 대응하도록 필터
  const sessionSentences = useMemo(() => {
    if (!sentenceIds?.length) return [];
    const idSet = new Set(sentenceIds);
    return allSentences.filter((s) => {
      const key = s.id || s.sentenceId;
      return key && idSet.has(key);
    });
  }, [allSentences, sentenceIds]);

  const current = sessionSentences[idx];

  const handleChoice = (type) => {
    if (!current) return;

    const currentKey = current.id || current.sentenceId;
    if (!currentKey) return;

    if (type === "learn") {
      setDoneIds((prev) =>
        prev.includes(currentKey) ? prev : [...prev, currentKey]
      );
    }
    if (type === "known") {
      setKnownIds((prev) =>
        prev.includes(currentKey) ? prev : [...prev, currentKey]
      );
    }

    const nextIdx = idx + 1;

    // 마지막 문장이면 onDone 호출
    if (nextIdx >= sessionSentences.length) {
      onDone?.({
        sentencesDone:
          type === "learn" && !doneIds.includes(currentKey)
            ? [...doneIds, currentKey]
            : doneIds,
        sentencesKnown:
          type === "known" && !knownIds.includes(currentKey)
            ? [...knownIds, currentKey]
            : knownIds,
      });
      return;
    }

    setIdx(nextIdx);
  };

  const handleCancel = () => {
    // 지금까지의 상태 그대로 넘기고 종료
    onDone?.({
      sentencesDone: doneIds,
      sentencesKnown: knownIds,
    });
  };

  const handleSpeak = () => {
    if (!current?.zh) return;
    speakZh(current.audio?.ttsText || current.zh);
  };

  if (loading) {
    const body = (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          문장 불러오는 중...
        </Typography>
      </Box>
    );
    if (mode === "today") return body;
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: 2 }}>
        {body}
      </Box>
    );
  }

  if (!sessionSentences.length) {
    const body = (
      <Box sx={{ p: 2 }}>
        {mode !== "today" && (
          <Typography variant="h6" fontWeight={800}>
            오늘 공부 - 문장
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary">
          오늘 학습할 문장이 없습니다.
        </Typography>
      </Box>
    );
    if (mode === "today") return body;
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: 2 }}>
        {body}
      </Box>
    );
  }

  const pinyin = current?.pinyin || "";
  const koPron = pinyin ? freeTextPinyinToKorean(pinyin) : "";
  const words = current?.words || [];

  const content = (
    <Stack spacing={2}>
      {/* today 모드가 아니면 상단 헤더 표시 */}
      {mode !== "today" && (
        <Card>
          <CardContent
            sx={{ display: "flex", justifyContent: "space-between" }}
          >
            <Box>
              <Typography fontWeight={800}>오늘 공부 - 문장</Typography>
              <Typography variant="caption" color="text.secondary">
                {idx + 1} / {sessionSentences.length}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Stack spacing={1.5}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 600 }}
              >
                문장 {idx + 1} / {sessionSentences.length}
              </Typography>
              <Box sx={{ flex: 1 }} />
              <IconButton size="small" onClick={handleSpeak}>
                <VolumeUpIcon fontSize="small" />
              </IconButton>
            </Stack>

            <Typography sx={{ fontSize: 20, fontWeight: 700 }}>
              {current?.zh}
            </Typography>

            {pinyin && (
              <Typography variant="body2" color="text.secondary">
                {pinyin}
              </Typography>
            )}

            {koPron && (
              <Typography variant="body2" color="text.secondary">
                {koPron}
              </Typography>
            )}

            {current?.ko && (
              <Typography variant="body2">{current.ko}</Typography>
            )}

            {words.length > 0 && (
              <Stack direction="row" spacing={0.5} flexWrap="wrap">
                {words.map((w, i) => (
                  <Chip
                    key={w.wordId || w.id || `${w.zh}-${i}`}
                    label={w.zh || w.pinyin || ""}
                    size="small"
                    sx={{ mb: 0.5 }}
                  />
                ))}
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Stack spacing={1}>
        <LinearProgress
          variant="determinate"
          value={((idx + 1) / sessionSentences.length) * 100}
          sx={{ height: 8, borderRadius: 999 }}
        />
        {/* ✅ 두 단계: 학습 / 알고 있음 */}
        <Stack direction="row" spacing={1.5}>
          <Button
            fullWidth
            variant="contained"
            color="warning"
            onClick={() => handleChoice("learn")}
            sx={{ borderRadius: 2, fontWeight: 800, py: 1.4 }}
          >
            다시보기
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={() => handleChoice("known")}
            sx={{ borderRadius: 2, fontWeight: 800, py: 1.4 }}
          >
            외웠음
          </Button>
        </Stack>

        <Button
          onClick={handleCancel}
          sx={{ color: "text.secondary", mt: 0.5 }}
        >
          실행 취소
        </Button>
      </Stack>
    </Stack>
  );

  if (mode === "today") return content;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: 2 }}>
      {content}
    </Box>
  );
}
