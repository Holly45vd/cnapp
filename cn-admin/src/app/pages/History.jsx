import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../providers/AuthProvider";
import { listUserHistoryAll } from "../../firebase/db";
import { getWeekDateKeys } from "../../shared/utils/date";

// MUI
import {
  Box, Card, CardContent, Typography, Stack, Chip,
  Grid, LinearProgress, Button
} from "@mui/material";
import BarChartIcon from "@mui/icons-material/BarChart";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import TodayIcon from "@mui/icons-material/Today";

export default function History() {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  const weekKeys = useMemo(() => getWeekDateKeys(new Date()), []);

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
  // 🔥 연속 학습 스트릭 계산 (전체 기간 기준)
  // -------------------------------
  const computeStreak = (docs) => {
    if (!docs.length) return 0;

    // dateKey만 추출 후 최신→과거 정렬
    const keys = docs
      .map((d) => d.dateKey)
      .sort((a, b) => b.localeCompare(a));

    const keysSet = new Set(keys);

    let streak = 0;
    let cursor = new Date();

    // YYYY-MM-DD
    const dateKeyOf = (date) => date.toISOString().slice(0, 10);

    // 하루 전 날짜
    const prevDate = (date) => {
      const d = new Date(date);
      d.setDate(d.getDate() - 1);
      return d;
    };

    while (true) {
      const key = dateKeyOf(cursor);

      if (keysSet.has(key)) {
        streak++;
        cursor = prevDate(cursor);
      } else {
        break;
      }
    }

    return streak;
  };

  // -------------------------------
  // 통계 처리
  // -------------------------------
  const stats = useMemo(() => {
    const byKey = new Map(docs.map((d) => [d.dateKey, d]));

    // 이번 주 데이터
    const weekDocs = weekKeys.map((k) => byKey.get(k)).filter(Boolean);
    const weekDone = weekDocs.length;

    // 누적
    const totalWords = docs.reduce((s, d) => s + (d.wordsDone?.length || 0), 0);
    const totalGrammar = docs.reduce((s, d) => s + (d.grammarDone?.length || 0), 0);
    const totalDialogs = docs.reduce((s, d) => s + (d.dialogsDone?.length || 0), 0);
    const totalDays = docs.length;

    // 🔥 전체 기록 기반 진짜 스트릭
    const streak = computeStreak(docs);

    return {
      weekDone,
      totalWords,
      totalGrammar,
      totalDialogs,
      totalDays,
      streak,
    };
  }, [docs, weekKeys]);

  const weekGoal = 7;
  const rawWeekPct = (stats.weekDone / weekGoal) * 100;
  const weekPct = Math.max(0, Math.min(100, Math.round(rawWeekPct)));

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: 3 }}>
        <Typography>기록 불러오는 중...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: 1 }}>
      <Stack spacing={2.5} sx={{ p: 1 }}>
        <Stack spacing={0.5}>
          <Typography variant="h5" fontWeight={800}>학습 기록</Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.displayName || user?.email?.split("@")?.[0]}님의 히스토리
          </Typography>
        </Stack>

        {/* 이번주 */}
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
                  <MiniStat label="학습일" value={`${stats.weekDone} / ${weekGoal}`} />
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

        {/* 연속 학습 */}
        <Card>
          <CardContent>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <LocalFireDepartmentIcon color="warning" />
              <Box>
                <Typography fontWeight={800}>연속 학습</Typography>
                <Typography variant="body2" color="text.secondary">
                  현재 {stats.streak}일 연속 학습 중
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }} />
              <Chip
                label={`${stats.streak} days`}
                color="warning"
                variant="outlined"
                sx={{ fontWeight: 800 }}
              />
            </Stack>
          </CardContent>
        </Card>

        {/* 누적 */}
        <Card>
          <CardContent>
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <BarChartIcon fontSize="small" />
                <Typography fontWeight={800}>누적 성과</Typography>
                <Chip size="small" label="Total" />
              </Stack>

              <Grid container spacing={1.5}>
                <Grid item xs={4}>
                  <MiniStat label="단어" value={stats.totalWords} />
                </Grid>
                <Grid item xs={4}>
                  <MiniStat label="문법" value={stats.totalGrammar} />
                </Grid>
                <Grid item xs={4}>
                  <MiniStat label="회화" value={stats.totalDialogs} />
                </Grid>
              </Grid>

              <Typography variant="caption" color="text.secondary">
                누적 학습일: {stats.totalDays}일
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}

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
