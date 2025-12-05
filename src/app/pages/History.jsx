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

function formatDateLabel(dateKey) {
  if (!dateKey) return "";
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][dt.getDay()];
  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${mm}/${dd} (${weekday})`;
}

export default function History() {
  const { user } = useAuth();
  const nav = useNavigate();

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  const weekKeys = useMemo(() => getWeekDateKeys(new Date()), []);
  const last7Keys = useMemo(() => getLast7DateKeys(new Date()), []);

  // 누적 학습일 클릭 시 전체 날짜 리스트 토글
  const [showTotalDateList, setShowTotalDateList] = useState(false);
  // 하단 상세 영역에서 집중해서 볼 날짜
  const [detailDateKey, setDetailDateKey] = useState(null);

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
  //   ※ Done + Known = "그날 실제로 공부한 개수" 기준
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
        allTrend: [],
      };
    }

    const byKey = new Map(docs.map((d) => [d.dateKey, d]));

    const getDailyTotals = (doc) => {
      if (!doc) {
        return {
          words: 0,
          sentences: 0,
          grammar: 0,
          dialogs: 0,
          total: 0,
        };
      }

      const words =
        (doc.wordsDone?.length || 0) + (doc.wordsKnown?.length || 0);
      const sentences =
        (doc.sentencesDone?.length || 0) +
        (doc.sentencesKnown?.length || 0);
      const grammar =
        (doc.grammarDone?.length || 0) + (doc.grammarKnown?.length || 0);
      const dialogs =
        (doc.dialogsDone?.length || 0) + (doc.dialogsKnown?.length || 0);

      const total = words + sentences + grammar + dialogs;
      return { words, sentences, grammar, dialogs, total };
    };

    // 이번 주 학습일: 해당 주에 실제 공부한 날만 카운트
    const weekDocs = weekKeys
      .map((k) => byKey.get(k))
      .filter(Boolean);

    const weekDone = weekDocs.filter((d) => getDailyTotals(d).total > 0).length;

    // 누적 합계 (전체 기간)
    const totalWords = docs.reduce(
      (s, d) =>
        s +
        (d.wordsDone?.length || 0) +
        (d.wordsKnown?.length || 0),
      0
    );
    const totalSentences = docs.reduce(
      (s, d) =>
        s +
        (d.sentencesDone?.length || 0) +
        (d.sentencesKnown?.length || 0),
      0
    );
    const totalGrammar = docs.reduce(
      (s, d) =>
        s +
        (d.grammarDone?.length || 0) +
        (d.grammarKnown?.length || 0),
      0
    );
    const totalDialogs = docs.reduce(
      (s, d) =>
        s +
        (d.dialogsDone?.length || 0) +
        (d.dialogsKnown?.length || 0),
      0
    );

    const totalDays = docs.length;

    // 지난 7일 트렌드
    const last7Trend = last7Keys.map((key) => {
      const doc = byKey.get(key);
      const dayTotals = getDailyTotals(doc);
      return {
        dateKey: key,
        ...dayTotals,
      };
    });

    // 전체 학습일 트렌드 (누적 학습일 리스트용)
    const allTrend = docs
      .map((d) => ({
        dateKey: d.dateKey,
        ...getDailyTotals(d),
      }))
      .sort((a, b) => b.dateKey.localeCompare(a.dateKey)); // 최신 먼저

    return {
      weekDone,
      totalWords,
      totalSentences,
      totalGrammar,
      totalDialogs,
      totalDays,
      last7Trend,
      allTrend,
    };
  }, [docs, weekKeys, last7Keys]);

  const weekGoal = 7;
  const weekPct =
    weekGoal === 0
      ? 0
      : Math.min(100, Math.round((stats.weekDone / weekGoal) * 100));

  // 하단 상세 영역에 무엇을 보여줄지 결정
  const detailTrend = useMemo(() => {
    if (detailDateKey && stats.allTrend.length) {
      const t = stats.allTrend.find((x) => x.dateKey === detailDateKey);
      if (t) return [t];
    }
    // 기본은 지난 7일
    return stats.last7Trend;
  }, [detailDateKey, stats.allTrend, stats.last7Trend]);

  // 🔗 지난 7일 / 상세 카드 클릭 → 복습 페이지로 이동
  const handleSelectDateFromTrend = (dateKey) => {
    if (!dateKey) return;
    // 하단 상세 선택 상태도 같이 맞춰줌
    setDetailDateKey(dateKey);
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
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    cursor: stats.totalDays > 0 ? "pointer" : "default",
                    textDecoration:
                      stats.totalDays > 0 ? "underline" : "none",
                  }}
                  onClick={() => {
                    if (!stats.totalDays) return;
                    setShowTotalDateList((v) => !v);
                  }}
                >
                  누적 학습일: {stats.totalDays}일
                </Typography>
              </Stack>

              <Grid
                container
                spacing={1.5}
                sx={{ display: "flex", justifyContent: "center" }}
              >
                <Grid item xs={3} sx={{ display: "flex", justifyContent: "center" }}>
                  <TotalBubble label="단어" value={stats.totalWords} color="#EEF3FF" />
                </Grid>
                <Grid item xs={3} sx={{ display: "flex", justifyContent: "center" }}>
                  <TotalBubble
                    label="문장"
                    value={stats.totalSentences}
                    color="#EAF5FF"
                  />
                </Grid>
                <Grid item xs={3} sx={{ display: "flex", justifyContent: "center" }}>
                  <TotalBubble
                    label="문법"
                    value={stats.totalGrammar}
                    color="#FFF4E2"
                  />
                </Grid>
                <Grid item xs={3} sx={{ display: "flex", justifyContent: "center" }}>
                  <TotalBubble
                    label="회화"
                    value={stats.totalDialogs}
                    color="#E9FBF1"
                  />
                </Grid>
              </Grid>

              {/* 🔽 누적 학습일 클릭 시 전체 날짜 리스트 */}
              {showTotalDateList && stats.allTrend.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 0.5 }}
                  >
                    날짜를 선택하면 아래에서 해당 날짜의 상세 기록을 볼 수 있어요.
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 0.6,
                    }}
                  >
                    {stats.allTrend.map((t) => (
                      <Chip
                        key={t.dateKey}
                        size="small"
                        label={`${formatDateLabel(t.dateKey)} · ${
                          t.total
                        }개`}
                        color={
                          detailDateKey === t.dateKey ? "primary" : "default"
                        }
                        onClick={() => setDetailDateKey(t.dateKey)}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* --------------------- */}
        {/* 지난 7일 / 선택 날짜 상세 기록 */}
        {/* --------------------- */}
        <Card>
          <CardContent>
            <WeeklyHistorySection
              trend={detailTrend}
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
