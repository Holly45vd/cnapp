import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../providers/AuthProvider";
import { useNavigate } from "react-router-dom";
import { logout } from "../../firebase/auth";
import { buildRoutineFromHistory } from "../utils/routineEngine";
import { listCollection, listUserHistoryRecent } from "../../firebase/db";

// MUI
import {
  Box,
  Stack,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Grid,
  Chip,
  LinearProgress,
  Avatar,
  IconButton,
  Skeleton,
  Alert,
} from "@mui/material";

import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import ReplayIcon from "@mui/icons-material/Replay";
import BarChartIcon from "@mui/icons-material/BarChart";
import PersonIcon from "@mui/icons-material/Person";

export default function AppHome() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [routine, setRoutine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("daily"); // daily / weekly (UI용)

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        setLoading(true);

        const [words, grammar, dialogs, sentences] = await Promise.all([
          listCollection("words"),
          listCollection("grammar"),
          listCollection("dialogs"),
          listCollection("sentences"),
        ]);

        const pools = {
          words: words.map((w) => ({ ...w, id: w.wordId })),
          grammar: grammar.map((g) => ({ ...g, id: g.grammarId })),
          dialogs: dialogs.map((d) => ({ ...d, id: d.dialogId })),
          sentences: sentences.map((s) => ({ ...s, id: s.sentenceId })),
        };

        const recentDocs = await listUserHistoryRecent(user.uid, 7);
        const recentIds = new Set(
          recentDocs.flatMap((h) => [
            ...(h.wordsDone || []),
            ...(h.wordsKnown || []),
            ...(h.grammarDone || []),
            ...(h.dialogsDone || []),
            ...(h.sentencesDone || []),
          ])
        );

        // 🔥🔥🔥 여기만 수정됨 — 오늘 루틴 9개/2개/1개 생성
        const todaySet = buildRoutineFromHistory(pools, recentIds, {
          wordCount: 9,      // 단어 9개
          grammarCount: 2,   // 문법 2개
          dialogCount: 1,    // 회화 1개
          sentenceCount: 0,  // 문장은 오늘 제외
        });

        setRoutine(todaySet);
      } catch (e) {
        console.error(e);
        setRoutine(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const w = routine?.words?.length ?? 0;
  const g = routine?.grammar?.length ?? 0;
  const d = routine?.dialogs?.length ?? 0;
  const total = w + g + d;

  const homeCards = useMemo(
    () => [
      {
        key: "review",
        title: "복습",
        desc: "단어/문장/문법 랜덤 복습",
        icon: <ReplayIcon />,
        onClick: () => navigate("/app/review"),
      },
      {
        key: "history",
        title: "학습 기록",
        desc: "주간/누적 기록",
        icon: <BarChartIcon />,
        onClick: () => navigate("/app/history"),
      },
      {
        key: "mypage",
        title: "마이페이지",
        desc: "프로필/설정",
        icon: <PersonIcon />,
        onClick: () => navigate("/app/mypage"),
      },
    ],
    [navigate]
  );

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: 1 }}>
      <Stack spacing={2.5} sx={{ px: 1, py: 1.5 }}>
        
        {/* 헤더 */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              sx={{
                width: 44,
                height: 44,
                bgcolor: "primary.light",
                color: "primary.main",
                fontWeight: 800,
              }}
            >
              CN
            </Avatar>

            <Box>
              <Typography fontWeight={800}>
                {user?.displayName || user?.email?.split("@")?.[0]}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={0.5}>
            <IconButton
              size="small"
              onClick={() => navigate("/app/mypage")}
              sx={{ bgcolor: "white", border: "1px solid #eee" }}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleLogout}
              sx={{ bgcolor: "white", border: "1px solid #eee" }}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>

        {/* 세그먼트 탭 */}
        <Card>
          <CardContent sx={{ p: 1 }}>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant="fullWidth"
              sx={{
                minHeight: 36,
                "& .MuiTab-root": { minHeight: 36, fontWeight: 700 },
              }}
            >
              <Tab value="daily" label="매일" />
              <Tab value="weekly" label="주간" />
            </Tabs>
          </CardContent>
        </Card>

        {/* 오늘 공부 메인 카드 */}
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    오늘 공부
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    단어·문법·회화를 한 번에 끝내자
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  size="medium"
                  startIcon={<AutoStoriesIcon />}
                  disabled={!routine || loading}
                  onClick={() => navigate("/app/today", { state: { routine } })}
                  sx={{
                    px: 2.5,
                    borderRadius: 2,
                    fontWeight: 800,
                  }}
                >
                  시작
                </Button>
              </Stack>

              {loading && (
                <Stack spacing={1.5}>
                  <Skeleton variant="rounded" height={78} />
                  <Skeleton variant="rounded" height={18} />
                  <Skeleton variant="rounded" height={40} />
                </Stack>
              )}

              {!loading && !routine && (
                <Alert severity="warning">
                  루틴 생성 실패. 새로고침하거나 내일 다시 시도해줘.
                </Alert>
              )}

              {!loading && routine && (
                <>
                  <Grid container spacing={1.5}>
                    <Grid item xs={4}>
                      <MiniCountCard label="단어" value={w} color="primary.main" bg="#F3F6FF" />
                    </Grid>
                    <Grid item xs={4}>
                      <MiniCountCard label="문법" value={g} color="#D97706" bg="#FFF7E8" />
                    </Grid>
                    <Grid item xs={4}>
                      <MiniCountCard label="회화" value={d} color="#059669" bg="#F0FBF5" />
                    </Grid>
                  </Grid>

                  <Stack spacing={0.8}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">
                        오늘 목표
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        0 / {total}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={0}
                      sx={{ height: 10, borderRadius: 999 }}
                    />
                  </Stack>

                  <Stack direction="row" justifyContent="space-between" sx={{ pt: 0.5 }}>
                    {["Sun", "월", "화", "수", "목", "금", "Sat"].map((day, i) => (
                      <Chip
                        key={day}
                        label={day}
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          fontSize: 12,
                          bgcolor: i === 3 ? "primary.light" : "white",
                          color: i === 3 ? "primary.main" : "text.secondary",
                          border: "1px solid",
                          borderColor: i === 3 ? "primary.light" : "grey.200",
                        }}
                      />
                    ))}
                  </Stack>
                </>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* 아래 카드들 */}
        <Stack spacing={1.5}>
          {homeCards.map((c) => (
            <Card key={c.key} onClick={c.onClick} sx={{ cursor: "pointer" }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1.5} justifyContent="space-between">
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ bgcolor: "grey.100", color: "text.primary" }}>
                      {c.icon}
                    </Avatar>
                    <Box>
                      <Typography fontWeight={800}>{c.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {c.desc}
                      </Typography>
                    </Box>
                  </Stack>
                  <Typography color="text.secondary">›</Typography>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}

function MiniCountCard({ label, value, color, bg }) {
  return (
    <Box
      sx={{
        bgcolor: bg,
        borderRadius: 2.5,
        p: 1.5,
        textAlign: "center",
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" fontWeight={800} sx={{ color }}>
        {value}
      </Typography>
    </Box>
  );
}
