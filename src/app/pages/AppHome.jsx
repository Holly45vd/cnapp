import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../providers/AuthProvider";
import { useNavigate } from "react-router-dom";
import { logout } from "../../firebase/auth";
import { buildRoutineFromHistory } from "../utils/routineEngine";
import {
  listCollection,
  listUserHistoryRange,
  getRoutineConfig,          // 🔹 추가
} from "../../firebase/db";
import { toDateKey } from "../../shared/utils/date";

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
  Avatar,
  IconButton,
  Skeleton,
  Alert,
  LinearProgress,
  Chip,
} from "@mui/material";

import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import ReplayIcon from "@mui/icons-material/Replay";
import BarChartIcon from "@mui/icons-material/BarChart";
import PersonIcon from "@mui/icons-material/Person";

/* ------------------------------------------
 *  주간 집계 헬퍼
 * ------------------------------------------ */
function calcWeeklySummary(historyDocs = []) {
  const agg = {
    wordsReview: new Set(),
    wordsMaster: new Set(),
    sentencesReview: new Set(),
    sentencesMaster: new Set(),
    grammarReview: new Set(),
    grammarMaster: new Set(),
    dialogsReview: new Set(),
    dialogsMaster: new Set(),
  };

  const dateSet = new Set();

  for (const h of historyDocs) {
    if (h.dateKey) dateSet.add(h.dateKey);

    (h.wordsDone || []).forEach((id) => agg.wordsReview.add(id));
    (h.wordsKnown || []).forEach((id) => agg.wordsMaster.add(id));

    (h.sentencesDone || []).forEach((id) =>
      agg.sentencesReview.add(id)
    );
    (h.sentencesKnown || []).forEach((id) =>
      agg.sentencesMaster.add(id)
    );

    (h.grammarDone || []).forEach((id) =>
      agg.grammarReview.add(id)
    );
    (h.grammarKnown || []).forEach((id) =>
      agg.grammarMaster.add(id)
    );

    (h.dialogsDone || []).forEach((id) =>
      agg.dialogsReview.add(id)
    );
    (h.dialogsKnown || []).forEach((id) =>
      agg.dialogsMaster.add(id)
    );
  }

  const toArr = (s) => Array.from(s);

  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = toDateKey(d);
    if (dateSet.has(key)) streak += 1;
    else break;
  }

  return {
    wordsReview: toArr(agg.wordsReview),
    wordsMaster: toArr(agg.wordsMaster),
    sentencesReview: toArr(agg.sentencesReview),
    sentencesMaster: toArr(agg.sentencesMaster),
    grammarReview: toArr(agg.grammarReview),
    grammarMaster: toArr(agg.grammarMaster),
    dialogsReview: toArr(agg.dialogsReview),
    dialogsMaster: toArr(agg.dialogsMaster),
    studiedDays: dateSet.size,
    streak,
  };
}

/* ------------------------------------------
 *  메인 컴포넌트
 * ------------------------------------------ */
export default function AppHome() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [routine, setRoutine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("daily"); // "daily" | "weekly"

  const [weeklySummary, setWeeklySummary] = useState(null);

  // ✅ 요일 라벨 & 오늘 요일 인덱스 (0=일 ~ 6=토)
  const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];
  const todayIdx = new Date().getDay();

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        setLoading(true);

        // 1) 학습 풀 + 루틴 설정 같이 로딩
        const [words, grammar, dialogs, sentences, routineConfig] =
          await Promise.all([
            listCollection("words"),
            listCollection("grammar"),
            listCollection("dialogs"),
            listCollection("sentences"),
            getRoutineConfig(), // 🔹 전역 설정 불러오기
          ]);

        const pools = {
          words: words.map((w) => ({ ...w, id: w.wordId })),
          grammar: grammar.map((g) => ({ ...g, id: g.grammarId })),
          dialogs: dialogs.map((d) => ({ ...d, id: d.dialogId })),
          sentences: sentences.map((s) => ({ ...s, id: s.sentenceId })),
        };

        // 2) 지난 7일 히스토리
        const today = new Date();
        const endKey = toDateKey(today);

        const start = new Date(today);
        start.setDate(today.getDate() - 6); // 오늘 포함 7일 전
        const startKey = toDateKey(start);

        const historyDocs = await listUserHistoryRange(
          user.uid,
          startKey,
          endKey
        );

        // 3) 루틴 생성용 최근 학습 ID 집합
        const recentIds = new Set(
          historyDocs.flatMap((h) => [
            ...(h.wordsDone || []),
            ...(h.wordsKnown || []),
            ...(h.grammarDone || []),
            ...(h.dialogsDone || []),
            ...(h.sentencesDone || []),
          ])
        );

        // 🔹 전역 설정 기반 루틴 생성
        const todaySet = buildRoutineFromHistory(
          pools,
          recentIds,
          routineConfig
        );

        setRoutine(todaySet);

        // 4) 주간 요약 계산
        setWeeklySummary(calcWeeklySummary(historyDocs));
      } catch (e) {
        console.error(e);
        setRoutine(null);
        setWeeklySummary(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const w = routine?.words?.length ?? 0;
  const s = routine?.sentences?.length ?? 0;
  const g = routine?.grammar?.length ?? 0;
  const d = routine?.dialogs?.length ?? 0;
  const total = w + s + g + d;

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
        desc: "일별/주간 기록 보기",
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

  // 주간 탭용 숫자들
  const weeklyCounts = useMemo(() => {
    if (!weeklySummary) {
      return {
        wordTotal: 0,
        sentenceTotal: 0,
        grammarTotal: 0,
        dialogTotal: 0,
        studiedDays: 0,
        streak: 0,
      };
    }
    const ws = weeklySummary;
    return {
      wordTotal: ws.wordsReview.length + ws.wordsMaster.length,
      sentenceTotal:
        ws.sentencesReview.length + ws.sentencesMaster.length,
      grammarTotal:
        ws.grammarReview.length + ws.grammarMaster.length,
      dialogTotal:
        ws.dialogsReview.length + ws.dialogsMaster.length,
      studiedDays: ws.studiedDays,
      streak: ws.streak,
    };
  }, [weeklySummary]);

  return (
    <Box sx={{ py: 1 }}>
      <Stack spacing={2.5} sx={{ px: 1, py: 1.5 }}>
        {/* 헤더 */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
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

        {/* DAILY: 오늘 공부 메인 카드 */}
        {tab === "daily" && (
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    <Typography variant="h6" fontWeight={800}>
                      오늘 공부
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      단어·문장·문법·회화를 한 번에 끝내자
                    </Typography>
                  </Box>

                  <Button
                    variant="contained"
                    size="medium"
                    startIcon={<AutoStoriesIcon />}
                    disabled={!routine || loading}
                    onClick={() =>
                      navigate("/app/today", { state: { routine } })
                    }
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
                    <Box
                      sx={{
                        mt: 0.5,
                        borderRadius: 3,
                        border: "1px solid #EEF0F5",
                        bgcolor: "#FFFFFF",
                        p: 1,
                        display: "flex",
                        gap: 1,
                      }}
                    >
                      <MiniCountCard
                        label="단어"
                        value={w}
                        color="primary.main"
                        bg="#F3F6FF"
                      />
                      <MiniCountCard
                        label="문장"
                        value={s}
                        color="#2563EB"
                        bg="#EFF6FF"
                      />
                      <MiniCountCard
                        label="문법"
                        value={g}
                        color="#D97706"
                        bg="#FFF7E8"
                      />
                      <MiniCountCard
                        label="회화"
                        value={d}
                        color="#059669"
                        bg="#F0FBF5"
                      />
                    </Box>

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

                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      sx={{ pt: 0.5 }}
                    >
                      {weekdayLabels.map((day, i) => {
                        const isToday = i === todayIdx;
                        return (
                          <Chip
                            key={day + i}
                            label={day}
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 2,
                              fontSize: 12,
                              bgcolor: "white",
                              color: isToday
                                ? "primary.main"
                                : "text.secondary",
                              border: "1px solid",
                              borderColor: isToday
                                ? "primary.main"
                                : "grey.200",
                            }}
                          />
                        );
                      })}
                    </Stack>
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* WEEKLY: 지난 7일 요약 */}
        {tab === "weekly" && (
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    지난 7일 학습
                  </Typography>
                </Box>

                {loading && (
                  <Stack spacing={1.5}>
                    <Skeleton variant="rounded" height={78} />
                    <Skeleton variant="rounded" height={18} />
                    <Skeleton variant="rounded" height={40} />
                  </Stack>
                )}

                {!loading && !weeklySummary && (
                  <Alert severity="info">
                    아직 지난 7일 동안 학습 기록이 없어. 오늘부터 시작해보자.
                  </Alert>
                )}

                {!loading && weeklySummary && (
                  <>
                    <Stack direction="row" spacing={1}>
                      <Chip
                        label={`공부한 날 ${weeklyCounts.studiedDays}일`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        label={`연속 ${weeklyCounts.streak}일`}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    </Stack>

                    <Box
                      sx={{
                        mt: 0.5,
                        borderRadius: 3,
                        border: "1px solid #EEF0F5",
                        bgcolor: "#FFFFFF",
                        p: 1,
                        display: "flex",
                        gap: 1,
                      }}
                    >
                      <MiniCountCard
                        label="단어"
                        value={weeklyCounts.wordTotal}
                        color="primary.main"
                        bg="#F3F6FF"
                      />
                      <MiniCountCard
                        label="문장"
                        value={weeklyCounts.sentenceTotal}
                        color="#2563EB"
                        bg="#EFF6FF"
                      />
                      <MiniCountCard
                        label="문법"
                        value={weeklyCounts.grammarTotal}
                        color="#D97706"
                        bg="#FFF7E8"
                      />
                      <MiniCountCard
                        label="회화"
                        value={weeklyCounts.dialogTotal}
                        color="#059669"
                        bg="#F0FBF5"
                      />
                    </Box>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      * 다시보기 + 알고있는 항목 합산 기준
                    </Typography>

                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate("/app/history")}
                      sx={{ alignSelf: "flex-start", mt: 1 }}
                      startIcon={<BarChartIcon fontSize="small" />}
                    >
                      자세히 보기 (일별/항목별)
                    </Button>
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* 아래 리스트 카드 */}
        <Stack spacing={1.5}>
          {homeCards.map((c) => (
            <Card key={c.key} onClick={c.onClick} sx={{ cursor: "pointer" }}>
              <CardContent>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1.5}
                  justifyContent="space-between"
                >
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

/* ---------------------------------------------------- */
/*        MiniCountCard (4개 항목용)                    */
/* ---------------------------------------------------- */
function MiniCountCard({ label, value, color, bg }) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        bgcolor: bg,
        borderRadius: 999,
        py: 1.2,
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
