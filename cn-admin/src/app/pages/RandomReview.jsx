import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../providers/AuthProvider";
import { listUserHistoryAll, listCollection } from "../../firebase/db";
import {
  freeTextPinyinToKorean,
  pinyinArrayToKorean,
} from "../../lib/pinyinKorean";

// MUI
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  Chip,
  Divider,
  Grid,
  TextField,
} from "@mui/material";

import ReplayIcon from "@mui/icons-material/Replay";
import HomeIcon from "@mui/icons-material/Home";
import TodayIcon from "@mui/icons-material/Today";

export default function RandomReview() {
  const nav = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [historyDocs, setHistoryDocs] = useState([]);
  const [words, setWords] = useState([]);
  const [grammar, setGrammar] = useState([]);
  const [dialogs, setDialogs] = useState([]);

  const [selectedDateKey, setSelectedDateKey] = useState("");

  // dateKey → historyDoc 맵
  const historyByKey = useMemo(
    () => new Map(historyDocs.map((d) => [d.dateKey, d])),
    [historyDocs]
  );

  // 선택된 날짜의 history
  const selectedHistory = selectedDateKey
    ? historyByKey.get(selectedDateKey)
    : null;

  // 초기 데이터 로딩
  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        setLoading(true);

        const [allHistory, allWords, allGrammar, allDialogs] = await Promise.all([
          listUserHistoryAll(user.uid),
          listCollection("words"),
          listCollection("grammar"),
          listCollection("dialogs"),
        ]);

        setHistoryDocs(allHistory);
        setWords(allWords);
        setGrammar(allGrammar);
        setDialogs(allDialogs);

        // 기본 선택 날짜: 오늘 기록이 있으면 오늘, 없으면 가장 최근 날짜
        if (allHistory.length > 0) {
          const todayKey = new Date().toISOString().slice(0, 10);
          const hasToday = allHistory.some((h) => h.dateKey === todayKey);

          if (hasToday) {
            setSelectedDateKey(todayKey);
          } else {
            const sorted = [...allHistory].sort((a, b) =>
              b.dateKey.localeCompare(a.dateKey)
            );
            setSelectedDateKey(sorted[0].dateKey);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // ID → 객체 맵
  const wordMap = useMemo(
    () => new Map(words.map((w) => [w.wordId, w])),
    [words]
  );
  const grammarMap = useMemo(
    () => new Map(grammar.map((g) => [g.grammarId, g])),
    [grammar]
  );
  const dialogMap = useMemo(
    () => new Map(dialogs.map((d) => [d.dialogId, d])),
    [dialogs]
  );

  // 선택된 날짜의 실제 엔트리들
  const reviewItems = useMemo(() => {
    if (!selectedHistory) return { wordList: [], grammarList: [], dialogList: [] };

    const wordList = (selectedHistory.wordsDone || [])
      .map((id) => wordMap.get(id))
      .filter(Boolean);

    const grammarList = (selectedHistory.grammarDone || [])
      .map((id) => grammarMap.get(id))
      .filter(Boolean);

    const dialogList = (selectedHistory.dialogsDone || [])
      .map((id) => dialogMap.get(id))
      .filter(Boolean);

    return { wordList, grammarList, dialogList };
  }, [selectedHistory, wordMap, grammarMap, dialogMap]);

  if (!user) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: 2 }}>
        <Typography>로그인이 필요합니다.</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: 2 }}>
        <Typography>복습 데이터를 불러오는 중...</Typography>
      </Box>
    );
  }

  const availableDates = historyDocs
    .map((h) => h.dateKey)
    .sort((a, b) => b.localeCompare(a)); // 최신→과거

  const { wordList, grammarList, dialogList } = reviewItems;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: 1 }}>
      <Stack spacing={2.5} sx={{ p: 1 }}>
        {/* 헤더 */}
        <Stack direction="row" spacing={1} alignItems="center">
          <ReplayIcon fontSize="small" />
          <Typography variant="h5" fontWeight={800}>
            복습하기
          </Typography>
          <Chip size="small" label="By 날짜" />
        </Stack>

        {/* 안내 */}
        <Typography variant="body2" color="text.secondary">
          날짜를 선택하면, 그날 학습했던 단어·문법·회화를 한 번에 볼 수 있어.
        </Typography>

        {/* 날짜 선택 */}
        <Card>
          <CardContent>
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <TodayIcon fontSize="small" />
                <Typography fontWeight={800}>날짜 선택</Typography>
                <Chip
                  size="small"
                  label={
                    availableDates.length
                      ? `${availableDates.length}일 학습 기록`
                      : "기록 없음"
                  }
                />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <TextField
                  label="날짜"
                  type="date"
                  size="small"
                  value={selectedDateKey || ""}
                  onChange={(e) => setSelectedDateKey(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ maxWidth: 220 }}
                />

                {/* 빠른 선택용 최근 날짜 칩들 */}
                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                  {availableDates.slice(0, 5).map((d) => (
                    <Chip
                      key={d}
                      label={d}
                      size="small"
                      clickable
                      color={d === selectedDateKey ? "primary" : "default"}
                      onClick={() => setSelectedDateKey(d)}
                      sx={{ mb: 0.5 }}
                    />
                  ))}
                </Stack>
              </Stack>

              {!selectedHistory && (
                <Typography variant="caption" color="text.secondary">
                  선택한 날짜({selectedDateKey || "미선택"})에는 학습 기록이 없습니다.
                </Typography>
              )}

              {selectedHistory && (
                <Typography variant="caption" color="text.secondary">
                  {selectedDateKey} 학습 요약 — 단어 {wordList.length}개 · 문법{" "}
                  {grammarList.length}개 · 회화 {dialogList.length}개
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* 실제 복습 내용들 */}
        {selectedHistory && (
          <>
            {/* 단어 복습 */}
            <Card>
              <CardContent>
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip size="small" label="단어" color="primary" />
                    <Typography fontWeight={800}>
                      단어 {wordList.length}개
                    </Typography>
                  </Stack>

                  {wordList.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      이 날은 단어 학습 기록이 없습니다.
                    </Typography>
                  )}

                  <Grid container spacing={1.2}>
                    {wordList.map((w) => {
                      // 🔥 한국어 발음 생성 로직
                      const koPron =
                        w.koPron ||
                        (w.syllables?.length
                          ? pinyinArrayToKorean(w.syllables)
                          : w.pinyin
                          ? freeTextPinyinToKorean(w.pinyin)
                          : "");

                      return (
                        <Grid item xs={12} sm={6} key={w.wordId}>
                          <Box
                            sx={{
                              borderRadius: 2,
                              border: "1px solid #eee",
                              p: 1.2,
                              bgcolor: "#F9FAFF",
                            }}
                          >
                            {/* 한자 */}
                            <Typography fontWeight={800}>{w.zh}</Typography>

                            {/* 병음 */}
                            {w.pinyin && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 0.2 }}
                              >
                                {w.pinyin}
                              </Typography>
                            )}

                            {/* 한국어 발음 */}
                            {koPron && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ mt: 0.2, display: "block" }}
                              >
                                {koPron}
                              </Typography>
                            )}

                            {/* 뜻 */}
                            {w.ko && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 0.2 }}
                              >
                                {w.ko}
                              </Typography>
                            )}
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Stack>
              </CardContent>
            </Card>

            {/* 문법 복습 */}
            <Card>
              <CardContent>
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip size="small" label="문법" color="warning" />
                    <Typography fontWeight={800}>
                      문법 {grammarList.length}개
                    </Typography>
                  </Stack>

                  {grammarList.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      이 날은 문법 학습 기록이 없습니다.
                    </Typography>
                  )}

                  <Stack spacing={1.2}>
                    {grammarList.map((g) => (
                      <Box
                        key={g.grammarId}
                        sx={{
                          borderRadius: 2,
                          border: "1px solid #eee",
                          p: 1.3,
                          bgcolor: "#FFFAF3",
                        }}
                      >
                        <Typography fontWeight={800}>
                          {g.title || g.shortTitle}
                        </Typography>
                        {g.corePattern && (
                          <Typography
                            variant="body2"
                            sx={{
                              mt: 0.3,
                              fontFamily: "monospace",
                            }}
                          >
                            {g.corePattern}
                          </Typography>
                        )}
                        {g.meaning_ko && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.3 }}
                          >
                            {g.meaning_ko}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* 회화 복습 */}
            <Card>
              <CardContent>
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip size="small" label="회화" color="success" />
                    <Typography fontWeight={800}>
                      회화 {dialogList.length}개
                    </Typography>
                  </Stack>

                  {dialogList.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      이 날은 회화 학습 기록이 없습니다.
                    </Typography>
                  )}

                  <Stack spacing={1.2}>
                    {dialogList.map((d) => (
                      <Box
                        key={d.dialogId}
                        sx={{
                          borderRadius: 2,
                          border: "1px solid #eee",
                          p: 1.3,
                          bgcolor: "#F0FBF5",
                        }}
                      >
                        {d.topic && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {d.topic}
                          </Typography>
                        )}
                        <Divider sx={{ my: 0.5 }} />

                        {(d.lines || []).slice(0, 3).map((l, idx) => (
                          <Box key={idx} sx={{ mb: 0.5 }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {l.role || `L${idx + 1}`}
                            </Typography>
                            <Typography sx={{ mt: 0.1 }}>{l.zh}</Typography>
                            {l.ko && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {l.ko}
                              </Typography>
                            )}
                          </Box>
                        ))}

                        {d.lines && d.lines.length > 3 && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            · 외 {d.lines.length - 3}줄...
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </>
        )}

        {/* 하단 버튼 */}
        <Stack direction="row" spacing={1.2}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<ReplayIcon />}
            disabled
            sx={{ fontWeight: 800 }}
          >
            랜덤 퀴즈 (추후)
          </Button>
          <Button
            fullWidth
            variant="contained"
            startIcon={<HomeIcon />}
            onClick={() => nav("/app")}
            sx={{ fontWeight: 800 }}
          >
            홈으로
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
