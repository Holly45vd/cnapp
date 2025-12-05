// src/app/pages/History.jsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../providers/AuthProvider";
import { listUserHistoryAll } from "../../firebase/db";
import { getWeekDateKeys, getLast7DateKeys } from "../../shared/utils/date";
import { useNavigate } from "react-router-dom";

// MUI
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Grid,
  LinearProgress,
} from "@mui/material";

import BarChartIcon from "@mui/icons-material/BarChart";
import TodayIcon from "@mui/icons-material/Today";

// 🔥 Weekly 상세 리스트 (지난 7일)
import WeeklyHistorySection from "../components/WeeklyHistorySection";

export default function History() {
  const { user } = useAuth();
  const nav = useNavigate();

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  const weekKeys = useMemo(() => getWeekDateKeys(new Date()), []);
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

  // -----------------------------------
  // 📊 통계 + 지난 7일 트렌드
  // -----------------------------------
  const stats = useMemo(() => {
    if (!docs.length) {
      return {
        weekDone: 0,
        totalWords: 0,
        totalSentences: 0,
        totalGrammar: 0,
        totalDialogs: 0,
        totalDays: 0,
        last7Trend: [],
      };
    }

    const byKey = new Map(docs.map((d) => [d.dateKey, d]));

    // 이번 주 문서
    const weekDocs = weekKeys.map((k) => byKey.get(k)).filter(Boolean);
    const weekDone = weekDocs.length;

    // 누적 합계
    const totalWords = docs.reduce(
      (s, d) => s + (d.wordsDone?.length || 0),
      0
    );
    const totalSentences = docs.reduce(
      (s, d) => s + (d.sentencesDone?.length || 0),
      0
    );
    const totalGrammar = docs.reduce(
      (s, d) => s + (d.grammarDone?.length || 0),
      0
    );
    const totalDialogs = docs.reduce(
      (s, d) => s + (d.dialogsDone?.length || 0),
      0
    );

    const totalDays = docs.length;

    // 지난 7일 트렌드 (없어도 7칸은 고정 생성)
    const last7Trend = last7Keys.map((key) => {
      const doc = byKey.get(key);
      if (!doc) {
        return {
          dateKey: key,
          words: 0,
          sentences: 0,
          grammar: 0,
          dialogs: 0,
          total: 0,
        };
      }
      const words = doc.wordsDone?.length || 0;
      const sentences = doc.sentencesDone?.length || 0;
      const grammar = doc.grammarDone?.length || 0;
      const dialogs = doc.dialogsDone?.length || 0;
      const total = words + sentences + grammar + dialogs;
      return { dateKey: key, words, sentences, grammar, dialogs, total };
    });

    return {
      weekDone,
      totalWords,
      totalSentences,
      totalGrammar,
      totalDialogs,
      totalDays,
      last7Trend,
    };
  }, [docs, weekKeys, last7Keys]);

  const weekGoal = 7;
  const weekPct =
    weekGoal === 0 ? 0 : Math.min(100, Math.round((stats.weekDone / weekGoal) * 100));

  // 🔗 지난 7일 카드 클릭 → 복습 페이지로 이동 (해당 날짜 선택된 상태)
  const handleSelectDateFromTrend = (dateKey) => {
    if (!dateKey) return;
    nav("/app/review", {
      state: { dateKey },
    });
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", p: 3 }}>
        <Typography>기록 불러오는 중...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", p: 1 }}>
      <Stack spacing={2.5} sx={{ p: 1 }}>
        {/* 헤더 */}
        <Stack spacing={0.5}>
          <Typography variant="h5" fontWeight={800}>
            학습 기록
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.displayName || user?.email?.split("@")[0]}님의 히스토리
          </Typography>
        </Stack>

        {/* --------------------- */}
        {/* 이번 주 학습 요약 */}
        {/* --------------------- */}
        <Card>
          <CardContent>
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <TodayIcon fontSize="small" />
                <Typography fontWeight={800}>이번 주 학습</Typography>
                <Chip size="small" label="Weekly" />
              </Stack>

              <Grid container spacing={1.5}>
                <Grid item xs={6}>
                  <MiniStat label="학습일" value={`${stats.weekDone} / 7`} />
                </Grid>
                <Grid item xs={6}>
                  <MiniStat label="달성률" value={`${weekPct}%`} />
                </Grid>
              </Grid>

              <LinearProgress
                variant="determinate"
                value={weekPct}
                sx={{ height: 10, borderRadius: 999 }}
              />
            </Stack>
          </CardContent>
        </Card>

        {/* --------------------- */}
        {/* 누적 성과 – 홈 카드 스타일 */}
        {/* --------------------- */}
        <Card>
          <CardContent>
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <BarChartIcon fontSize="small" />
                <Typography fontWeight={800}>누적 성과</Typography>
                <Chip size="small" label="Total" />
                <Typography variant="caption" color="text.secondary">
                  누적 학습일: {stats.totalDays}일
                </Typography>
              </Stack>

<Grid container spacing={1.5} sx={{ display: "flex", justifyContent: "center" }}>
  <Grid item xs={3} sx={{ display: "flex", justifyContent: "center" }}>
    <TotalBubble label="단어" value={stats.totalWords} color="#EEF3FF" />
  </Grid>
  <Grid item xs={3} sx={{ display: "flex", justifyContent: "center" }}>
    <TotalBubble label="문장" value={stats.totalSentences} color="#EAF5FF" />
  </Grid>
  <Grid item xs={3} sx={{ display: "flex", justifyContent: "center" }}>
    <TotalBubble label="문법" value={stats.totalGrammar} color="#FFF4E2" />
  </Grid>
  <Grid item xs={3} sx={{ display: "flex", justifyContent: "center" }}>
    <TotalBubble label="회화" value={stats.totalDialogs} color="#E9FBF1" />
  </Grid>
</Grid>

            </Stack>
          </CardContent>
        </Card>

        {/* --------------------- */}
        {/* 지난 7일 상세 기록 */}
        {/* --------------------- */}
        <Card>
          <CardContent>
            <WeeklyHistorySection
              trend={stats.last7Trend}
              onSelectDate={handleSelectDateFromTrend}
            />
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}

// --------------------------------
// 🔹 MiniStat – 작은 숫자 카드
// --------------------------------
function MiniStat({ label, value }) {
  return (
    <Box
      sx={{
        bgcolor: "grey.50",
        borderRadius: 2,
        p: 1.5,
        textAlign: "center",
        border: "1px solid #eee",
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6" fontWeight={800}>
        {value}
      </Typography>
    </Box>
  );
}

// --------------------------------
// 🔹 TotalBubble – 홈 스타일 누적 버블
// --------------------------------
function TotalBubble({ label, value, color }) {
  return (
    <Box
      sx={{
        bgcolor: color || "grey.50",
        borderRadius: "999px",
        p: 1.2,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid #eef0f5",
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.3 }}>
        {label}
      </Typography>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "white",
          boxShadow: "0 0 0 2px rgba(255,255,255,0.7)",
        }}
      >
        <Typography variant="h6" fontWeight={800}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}
