// src/app/pages/RandomQuiz.jsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../providers/AuthProvider";
import { listUserHistoryAll } from "../../firebase/db";
import { getLast7DateKeys } from "../../shared/utils/date";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  Chip,
  LinearProgress,
} from "@mui/material";
import QuizIcon from "@mui/icons-material/Quiz";
import HomeIcon from "@mui/icons-material/Home";

export default function RandomQuiz() {
  const { user } = useAuth();
  const nav = useNavigate();

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [finished, setFinished] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const last7Keys = useMemo(() => getLast7DateKeys(new Date()), []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        setLoading(true);
        const all = await listUserHistoryAll(user.uid);
        setDocs(all);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // -------------------------------
  // 🔍 지난 7일 복습 대상 단어 풀 구성
  // -------------------------------
  useEffect(() => {
    if (!docs.length) return;

    const byKey = new Map(docs.map((d) => [d.dateKey, d]));
    const last7Docs = last7Keys.map((k) => byKey.get(k)).filter(Boolean);

    const normalizeId = (item) => {
      if (item == null) return null;
      if (typeof item === "string") return item;
      return item.wordId || item.id || null;
    };

    const mergeUniqueItems = (items) => {
      const map = new Map();
      for (const it of items) {
        const id = normalizeId(it);
        if (!id) continue;
        if (!map.has(id)) map.set(id, it);
      }
      return Array.from(map.values());
    };

    const doneWords = mergeUniqueItems(
      last7Docs.flatMap((d) => d.wordsDone || [])
    );

    const knownRaw = last7Docs.flatMap((d) => d.wordsKnown || []);
    const knownIds = new Set(
      knownRaw
        .map((it) => normalizeId(it))
        .filter(Boolean)
    );

    let reviewPool = doneWords.filter(
      (w) => !knownIds.has(normalizeId(w))
    );

    // 복습 타겟이 너무 적으면 → 그냥 전체 doneWords 기준으로 퀴즈
    if (reviewPool.length < 4) {
      reviewPool = doneWords;
    }

    // 한국어 뜻이 없는 항목 제거 (퀴즈용)
    reviewPool = reviewPool.filter((w) => !!w.ko);

    const maxQuestions = 10;
    const selectedPool = shuffle([...reviewPool]).slice(
      0,
      Math.min(maxQuestions, reviewPool.length)
    );

    const allKo = reviewPool.map((w) => w.ko);

    const qs = selectedPool.map((w) => {
      const correct = w.ko;
      const others = shuffle(
        allKo.filter((ko) => ko !== correct)
      ).slice(0, 3);
      const options = shuffle([correct, ...others]);

      return {
        id: normalizeId(w),
        zh: w.zh,
        pinyin: w.pinyin,
        ko: correct,
        options,
      };
    });

    setQuestions(qs);
    setCurrentIdx(0);
    setSelected(null);
    setIsCorrect(null);
    setFinished(false);
    setCorrectCount(0);
  }, [docs, last7Keys]);

  const current = questions[currentIdx] || null;
  const progressPct =
    questions.length === 0
      ? 0
      : Math.round(((currentIdx) / questions.length) * 100);

  const handleSelect = (opt) => {
    if (!current || finished) return;
    if (selected != null) return; // 이미 선택함

    setSelected(opt);
    const ok = opt === current.ko;
    setIsCorrect(ok);
    if (ok) {
      setCorrectCount((c) => c + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setCurrentIdx((idx) => idx + 1);
    setSelected(null);
    setIsCorrect(null);
  };

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>로그인이 필요합니다.</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>퀴즈 준비 중...</Typography>
      </Box>
    );
  }

  if (!questions.length) {
    return (
      <Box sx={{ p: 3 }}>
        <Stack spacing={2} alignItems="center">
          <Typography variant="h6" fontWeight={800}>
            출제할 복습 대상 단어가 없습니다.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            최근 7일 동안 학습 데이터가 부족하거나,
            모든 단어가 이미 Master로 표시된 상태일 수 있습니다.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<HomeIcon />}
            onClick={() => nav("/history")}
          >
            기록으로 돌아가기
          </Button>
        </Stack>
      </Box>
    );
  }

  if (finished) {
    const total = questions.length;
    const scorePct = Math.round((correctCount / total) * 100);

    return (
      <Box sx={{ minHeight: "100vh", p: 2 }}>
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <QuizIcon />
            <Typography variant="h6" fontWeight={800}>
              복습 퀴즈 결과
            </Typography>
          </Stack>

          <Card>
            <CardContent>
              <Stack spacing={1.5}>
                <Typography variant="h5" fontWeight={800}>
                  {correctCount} / {total} 문제 정답
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  정답률 {scorePct}%  
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={scorePct}
                  sx={{ height: 10, borderRadius: 999 }}
                />

                <Typography variant="body2">
                  🔁 틀린 단어 위주로 다시 한 번 복습해 주세요.  
                  (다음 버전에서는 틀린 단어만 모아서 별도 복습 모드로 확장 가능)
                </Typography>

                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => nav("/history")}
                    startIcon={<HomeIcon />}
                  >
                    기록으로 돌아가기
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => {
                      // 새 퀴즈 다시 시작 (docs를 그대로 두고 questions만 재생성하려면
                      // docs dependency를 건드려야 하는데,
                      // 간단하게는 페이지 리로드 or 상태 초기화 로직 별도 분리 가능)
                      window.location.reload();
                    }}
                  >
                    다시 풀기
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", p: 2 }}>
      <Stack spacing={2}>
        {/* 헤더 */}
        <Stack direction="row" alignItems="center" spacing={1}>
          <QuizIcon />
          <Typography variant="h6" fontWeight={800}>
            복습 퀴즈 (지난 7일)
          </Typography>
          <Chip
            size="small"
            label={`${currentIdx + 1} / ${questions.length}`}
          />
        </Stack>

        <LinearProgress
          variant="determinate"
          value={
            questions.length === 0
              ? 0
              : Math.round(((currentIdx) / questions.length) * 100)
          }
          sx={{ height: 8, borderRadius: 999 }}
        />

        {/* 문제 카드 */}
        <Card>
          <CardContent>
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" color="text.secondary">
                단어 의미를 고르세요
              </Typography>

              <Typography variant="h4" fontWeight={800}>
                {current?.zh}
              </Typography>
              {current?.pinyin && (
                <Typography variant="body1" color="text.secondary">
                  {current.pinyin}
                </Typography>
              )}

              <Stack spacing={1.2} sx={{ mt: 2 }}>
                {current?.options.map((opt) => {
                  const selectedThis = selected === opt;
                  let variant = "outlined";
                  let color = "primary";

                  if (selected != null) {
                    if (opt === current.ko) {
                      variant = "contained";
                      color = "success";
                    } else if (selectedThis && opt !== current.ko) {
                      variant = "contained";
                      color = "error";
                    }
                  } else if (selectedThis) {
                    variant = "contained";
                  }

                  return (
                    <Button
                      key={opt}
                      variant={variant}
                      color={color}
                      onClick={() => handleSelect(opt)}
                      sx={{ justifyContent: "flex-start", borderRadius: 2 }}
                    >
                      {opt}
                    </Button>
                  );
                })}
              </Stack>

              {selected != null && (
                <Typography
                  variant="body2"
                  sx={{ mt: 1 }}
                  color={isCorrect ? "success.main" : "error.main"}
                >
                  {isCorrect ? "정답입니다! 👏" : `오답입니다. 정답: ${current.ko}`}
                </Typography>
              )}

              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<HomeIcon />}
                  onClick={() => nav("/history")}
                >
                  기록으로
                </Button>
                <Box sx={{ flex: 1 }} />
                <Button
                  variant="contained"
                  disabled={selected == null}
                  onClick={handleNext}
                >
                  {currentIdx + 1 >= questions.length
                    ? "결과 보기"
                    : "다음 문제"}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}

// -----------------------
// 🔧 유틸: shuffle
// -----------------------
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
