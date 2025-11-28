import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../providers/AuthProvider";
import { listUserHistoryAll, listCollection } from "../../firebase/db";
import {
  freeTextPinyinToKorean,
  pinyinArrayToKorean,
} from "../../lib/pinyinKorean";
import { speakZh } from "../../lib/ttsHelper"; // 🔊 중국어 TTS 추가

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
  Dialog,
  DialogTitle,
  DialogContent,
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
  const [sentences, setSentences] = useState([]);

  const [selectedDateKey, setSelectedDateKey] = useState("");
  const [dateSelectorOpen, setDateSelectorOpen] = useState(false);

  const historyByKey = useMemo(
    () => new Map(historyDocs.map((d) => [d.dateKey, d])),
    [historyDocs]
  );

  const selectedHistory = selectedDateKey
    ? historyByKey.get(selectedDateKey)
    : null;

  // 초기 데이터 로딩
  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        setLoading(true);

        const [
          allHistory,
          allWords,
          allGrammar,
          allDialogs,
          allSentences,
        ] = await Promise.all([
          listUserHistoryAll(user.uid),
          listCollection("words"),
          listCollection("grammar"),
          listCollection("dialogs"),
          listCollection("sentences"),
        ]);

        setHistoryDocs(allHistory);
        setWords(allWords);
        setGrammar(allGrammar);
        setDialogs(allDialogs);
        setSentences(allSentences);

        // 기본 선택 날짜: 오늘 있으면 오늘, 아니면 최근 날짜
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
  const sentenceMap = useMemo(
    () =>
      new Map(
        sentences.map((s) => [
          s.sentenceId || s.id, // 둘 다 대응
          s,
        ])
      ),
    [sentences]
  );

  // --------------------------------
  // 선택한 날짜의 “다시보기 / 외웠음” 분리
  // --------------------------------
  const reviewItems = useMemo(() => {
    if (!selectedHistory) {
      return {
        wordReview: [],
        wordMaster: [],
        sentenceReview: [],
        sentenceMaster: [],
        grammarReview: [],
        grammarMaster: [],
        dialogReview: [],
        dialogMaster: [],
      };
    }

    // 단어: 다시보기 / 외웠음
    const wordReviewIds =
      selectedHistory.wordsReview || selectedHistory.wordsDone || [];
    const wordMasterIds =
      selectedHistory.wordsMastered || selectedHistory.wordsKnown || [];

    const wordReview = wordReviewIds
      .map((id) => wordMap.get(id))
      .filter(Boolean);
    const wordMaster = wordMasterIds
      .map((id) => wordMap.get(id))
      .filter(Boolean);

    // 문장: 다시보기 / 외웠음
    const sentenceReviewIds =
      selectedHistory.sentencesReview ||
      selectedHistory.sentencesDone ||
      selectedHistory.sentenceDone ||
      [];
    const sentenceMasterIds =
      selectedHistory.sentencesMastered ||
      selectedHistory.sentencesKnown ||
      [];

    const sentenceReview = sentenceReviewIds
      .map((id) => sentenceMap.get(id))
      .filter(Boolean);
    const sentenceMaster = sentenceMasterIds
      .map((id) => sentenceMap.get(id))
      .filter(Boolean);

    // 문법: 다시보기 / 외웠음
    const grammarReviewIds =
      selectedHistory.grammarReview || selectedHistory.grammarDone || [];
    const grammarMasterIds =
      selectedHistory.grammarMastered || selectedHistory.grammarKnown || [];

    const grammarReview = grammarReviewIds
      .map((id) => grammarMap.get(id))
      .filter(Boolean);
    const grammarMaster = grammarMasterIds
      .map((id) => grammarMap.get(id))
      .filter(Boolean);

    // 회화: 다시보기 / 외웠음
    const dialogReviewIds =
      selectedHistory.dialogsReview || selectedHistory.dialogsDone || [];
    const dialogMasterIds =
      selectedHistory.dialogsMastered || selectedHistory.dialogsKnown || [];

    const dialogReview = dialogReviewIds
      .map((id) => dialogMap.get(id))
      .filter(Boolean);
    const dialogMaster = dialogMasterIds
      .map((id) => dialogMap.get(id))
      .filter(Boolean);

    return {
      wordReview,
      wordMaster,
      sentenceReview,
      sentenceMaster,
      grammarReview,
      grammarMaster,
      dialogReview,
      dialogMaster,
    };
  }, [selectedHistory, wordMap, sentenceMap, grammarMap, dialogMap]);

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
    .sort((a, b) => b.localeCompare(a)); // 최신 → 과거

  const {
    wordReview,
    wordMaster,
    sentenceReview,
    sentenceMaster,
    grammarReview,
    grammarMaster,
    dialogReview,
    dialogMaster,
  } = reviewItems;

  // 🔊 단어 클릭 시 중국어(또는 TTS용 텍스트) 읽기
  const handleSpeakWord = (w) => {
    const text = w?.audio?.ttsText || w?.zh || "";
    if (!text) return;
    speakZh(text);
  };

  // 🔊 문장 클릭 시
  const handleSpeakSentence = (s) => {
    const text = s?.audio?.ttsText || s?.zh || "";
    if (!text) return;
    speakZh(text);
  };

  // 🔊 회화 카드 클릭 시 – 해당 회화의 중국어 줄 전부 이어서 읽기
  const handleSpeakDialog = (d) => {
    const zhAll = (d?.lines || [])
      .map((l) => l.zh)
      .filter(Boolean)
      .join(" ");
    if (!zhAll) return;
    speakZh(zhAll);
  };

  const SectionCard = ({ title, color, children }) => (
    <Card>
      <CardContent>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip size="small" label={title} color={color} />
          </Stack>
          {children}
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: 1 }}>
      <Stack spacing={2.5} sx={{ p: 1 }}>
        {/* 헤더 */}
        <Stack direction="row" spacing={1} alignItems="center">
          <ReplayIcon fontSize="small" />
          <Typography variant="h5" fontWeight={800}>
            복습하기
          </Typography>
          <Chip size="small" label="날짜별" />
        </Stack>

        {/* 안내 */}
        <Typography variant="body2" color="text.secondary">
          날짜를 선택하면, 그날 학습했던 단어·문장·문법·회화를{" "}
          <b>다시보기 / 외웠음</b>으로 나눠서 볼 수 있어. 카드 자체를 누르면
          중국어 발음을 들을 수 있어.
        </Typography>

        {/* 날짜 선택 카드 */}
        <Card>
          <CardContent>
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <TodayIcon fontSize="small" />
                <Typography fontWeight={800}>날짜 선택</Typography>
                <Chip
                  size="small"
                  clickable
                  label={
                    availableDates.length
                      ? `${availableDates.length}일 학습 기록`
                      : "기록 없음"
                  }
                  onClick={() => {
                    if (availableDates.length > 0) {
                      setDateSelectorOpen(true);
                    }
                  }}
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
              </Stack>

              {!selectedHistory && (
                <Typography variant="caption" color="text.secondary">
                  선택한 날짜({selectedDateKey || "미선택"})에는 학습 기록이
                  없습니다.
                </Typography>
              )}

              {selectedHistory && (
                <Typography variant="caption" color="text.secondary">
                  {selectedDateKey} 학습 기록이 있습니다.
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* 날짜 선택 모달 */}
        <Dialog
          open={dateSelectorOpen}
          onClose={() => setDateSelectorOpen(false)}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle>학습 날짜 선택</DialogTitle>
          <DialogContent>
            <Stack spacing={0.75} sx={{ mt: 1, pb: 1 }}>
              {availableDates.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  아직 학습 기록이 없습니다.
                </Typography>
              )}
              {availableDates.map((d) => (
                <Chip
                  key={d}
                  label={d}
                  size="small"
                  clickable
                  color={d === selectedDateKey ? "primary" : "default"}
                  onClick={() => {
                    setSelectedDateKey(d);
                    setDateSelectorOpen(false);
                  }}
                  sx={{ mb: 0.5 }}
                />
              ))}
            </Stack>
          </DialogContent>
        </Dialog>

        {/* ---------------- 단어: 다시보기 ---------------- */}
        <SectionCard title="단어 (다시보기)" color="warning">
          {wordReview.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              다시 볼 단어가 없습니다.
            </Typography>
          ) : (
            <Grid container spacing={1.2}>
              {wordReview.map((w) => {
                const koPron =
                  w.koPron ||
                  (w.syllables?.length
                    ? pinyinArrayToKorean(w.syllables)
                    : w.pinyin
                    ? freeTextPinyinToKorean(w.pinyin)
                    : "");

                const meaning =
                  w.ko || w.meaning_ko || w.meaningKr || w.kr || "";

                return (
                  <Grid item xs={12} sm={4} key={w.wordId}>
                    <Box
                      onClick={() => handleSpeakWord(w)}
                      role="button"
                      tabIndex={0}
                      sx={{
                        borderRadius: 2,
                        border: "1px solid #eee",
                        p: 1.3,
                        bgcolor: "#FFF7E8",
                        cursor: "pointer",
                        "&:hover": { bgcolor: "#FFECCB" },
                      }}
                    >
                      <Typography fontWeight={800}>{w.zh}</Typography>
                      {meaning && (
                        <Typography sx={{ mt: 0.1 }}>{meaning}</Typography>
                      )}
                      {w.pinyin && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.2 }}
                        >
                          {w.pinyin}
                        </Typography>
                      )}
                      {koPron && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 0.2, display: "block" }}
                        >
                          {koPron}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </SectionCard>

        {/* ---------------- 단어: 외웠음 ---------------- */}
        <SectionCard title="단어 (외웠음)" color="success">
          {wordMaster.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              외웠다고 표시한 단어가 없습니다.
            </Typography>
          ) : (
            <Grid container spacing={1.2}>
              {wordMaster.map((w) => {
                const koPron =
                  w.koPron ||
                  (w.syllables?.length
                    ? pinyinArrayToKorean(w.syllables)
                    : w.pinyin
                    ? freeTextPinyinToKorean(w.pinyin)
                    : "");

                const meaning =
                  w.ko || w.meaning_ko || w.meaningKr || w.kr || "";

                return (
                  <Grid item xs={12} sm={4} key={w.wordId}>
                    <Box
                      onClick={() => handleSpeakWord(w)}
                      role="button"
                      tabIndex={0}
                      sx={{
                        borderRadius: 2,
                        border: "1px solid #eee",
                        p: 1.3,
                        bgcolor: "#E8FFF3",
                        cursor: "pointer",
                        "&:hover": { bgcolor: "#D4FBE7" },
                      }}
                    >
                      <Typography fontWeight={800}>{w.zh}</Typography>
                      {meaning && (
                        <Typography sx={{ mt: 0.1 }}>{meaning}</Typography>
                      )}
                      {w.pinyin && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.2 }}
                        >
                          {w.pinyin}
                        </Typography>
                      )}
                      {koPron && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 0.2, display: "block" }}
                        >
                          {koPron}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </SectionCard>

        {/* ---------------- 문장: 다시보기 ---------------- */}
        <SectionCard title="문장 (다시보기)" color="warning">
          {sentenceReview.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              다시 볼 문장이 없습니다.
            </Typography>
          ) : (
            <Stack spacing={1.2}>
              {sentenceReview.map((s) => {
                const pinyin = s.pinyin || "";
                const koPron = pinyin ? freeTextPinyinToKorean(pinyin) : "";

                return (
                  <Box
                    key={s.sentenceId || s.id}
                    onClick={() => handleSpeakSentence(s)}
                    role="button"
                    tabIndex={0}
                    sx={{
                      borderRadius: 2,
                      border: "1px solid #eee",
                      p: 1.3,
                      bgcolor: "#FFF7E8",
                      cursor: "pointer",
                      "&:hover": { bgcolor: "#FFECCB" },
                    }}
                  >
                    <Typography fontWeight={800}>{s.zh}</Typography>
                    {pinyin && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.2 }}
                      >
                        {pinyin}
                      </Typography>
                    )}
                    {koPron && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 0.2, display: "block" }}
                      >
                        {koPron}
                      </Typography>
                    )}
                    {s.ko && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.2 }}
                      >
                        {s.ko}
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Stack>
          )}
        </SectionCard>

        {/* ---------------- 문장: 외웠음 ---------------- */}
        <SectionCard title="문장 (외웠음)" color="success">
          {sentenceMaster.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              외웠다고 표시한 문장이 없습니다.
            </Typography>
          ) : (
            <Stack spacing={1.2}>
              {sentenceMaster.map((s) => {
                const pinyin = s.pinyin || "";
                const koPron = pinyin ? freeTextPinyinToKorean(pinyin) : "";

                return (
                  <Box
                    key={s.sentenceId || s.id}
                    onClick={() => handleSpeakSentence(s)}
                    role="button"
                    tabIndex={0}
                    sx={{
                      borderRadius: 2,
                      border: "1px solid #eee",
                      p: 1.3,
                      bgcolor: "#E8FFF3",
                      cursor: "pointer",
                      "&:hover": { bgcolor: "#D4FBE7" },
                    }}
                  >
                    <Typography fontWeight={800}>{s.zh}</Typography>
                    {pinyin && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.2 }}
                      >
                        {pinyin}
                      </Typography>
                    )}
                    {koPron && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 0.2, display: "block" }}
                      >
                        {koPron}
                      </Typography>
                    )}
                    {s.ko && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.2 }}
                      >
                        {s.ko}
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Stack>
          )}
        </SectionCard>

        {/* ---------------- 문법: 다시보기 ---------------- */}
        <SectionCard title="문법 (다시보기)" color="warning">
          {grammarReview.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              다시 볼 문법이 없습니다.
            </Typography>
          ) : (
            <Stack spacing={1.2}>
              {grammarReview.map((g) => (
                <Box
                  key={g.grammarId}
                  sx={{
                    borderRadius: 2,
                    border: "1px solid #eee",
                    p: 1.3,
                    bgcolor: "#FFF7E8",
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
          )}
        </SectionCard>

        {/* ---------------- 문법: 외웠음 ---------------- */}
        <SectionCard title="문법 (외웠음)" color="success">
          {grammarMaster.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              외웠다고 표시한 문법이 없습니다.
            </Typography>
          ) : (
            <Stack spacing={1.2}>
              {grammarMaster.map((g) => (
                <Box
                  key={g.grammarId}
                  sx={{
                    borderRadius: 2,
                    border: "1px solid #eee",
                    p: 1.3,
                    bgcolor: "#E8FFF3",
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
          )}
        </SectionCard>

        {/* ---------------- 회화: 다시보기 ---------------- */}
        <SectionCard title="회화 (다시보기)" color="warning">
          {dialogReview.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              다시 볼 회화가 없습니다.
            </Typography>
          ) : (
            <Stack spacing={1.2}>
              {dialogReview.map((d) => (
                <Box
                  key={d.dialogId}
                  onClick={() => handleSpeakDialog(d)}
                  role="button"
                  tabIndex={0}
                  sx={{
                    borderRadius: 2,
                    border: "1px solid #eee",
                    p: 1.3,
                    bgcolor: "#FFF7E8",
                    cursor: "pointer",
                    "&:hover": { bgcolor: "#FFECCB" },
                  }}
                >
                  {d.topic && (
                    <Typography variant="caption" color="text.secondary">
                      {d.topic}
                    </Typography>
                  )}
                  <Divider sx={{ my: 0.5 }} />

                  {(d.lines || []).slice(0, 3).map((l, idx) => {
                    const pinyin = l.pinyin || "";
                    const koPron = pinyin
                      ? freeTextPinyinToKorean(pinyin)
                      : "";

                    return (
                      <Box key={idx} sx={{ mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {l.role || `L${idx + 1}`}
                        </Typography>
                        <Typography sx={{ mt: 0.1 }}>{l.zh}</Typography>
                        {pinyin && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            {pinyin}
                          </Typography>
                        )}
                        {koPron && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block" }}
                          >
                            {koPron}
                          </Typography>
                        )}
                        {l.ko && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            {l.ko}
                          </Typography>
                        )}
                      </Box>
                    );
                  })}

                  {d.lines && d.lines.length > 3 && (
                    <Typography variant="caption" color="text.secondary">
                      · 외 {d.lines.length - 3}줄…
                    </Typography>
                  )}
                </Box>
              ))}
            </Stack>
          )}
        </SectionCard>

        {/* ---------------- 회화: 외웠음 ---------------- */}
        <SectionCard title="회화 (외웠음)" color="success">
          {dialogMaster.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              외웠다고 표시한 회화가 없습니다.
            </Typography>
          ) : (
            <Stack spacing={1.2}>
              {dialogMaster.map((d) => (
                <Box
                  key={d.dialogId}
                  onClick={() => handleSpeakDialog(d)}
                  role="button"
                  tabIndex={0}
                  sx={{
                    borderRadius: 2,
                    border: "1px solid #eee",
                    p: 1.3,
                    bgcolor: "#E8FFF3",
                    cursor: "pointer",
                    "&:hover": { bgcolor: "#D4FBE7" },
                  }}
                >
                  {d.topic && (
                    <Typography variant="caption" color="text.secondary">
                      {d.topic}
                    </Typography>
                  )}
                  <Divider sx={{ my: 0.5 }} />

                  {(d.lines || []).slice(0, 3).map((l, idx) => {
                    const pinyin = l.pinyin || "";
                    const koPron = pinyin
                      ? freeTextPinyinToKorean(pinyin)
                      : "";

                    return (
                      <Box key={idx} sx={{ mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {l.role || `L${idx + 1}`}
                        </Typography>
                        <Typography sx={{ mt: 0.1 }}>{l.zh}</Typography>
                        {pinyin && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            {pinyin}
                          </Typography>
                        )}
                        {koPron && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block" }}
                          >
                            {koPron}
                          </Typography>
                        )}
                        {l.ko && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            {l.ko}
                          </Typography>
                        )}
                      </Box>
                    );
                  })}

                  {d.lines && d.lines.length > 3 && (
                    <Typography variant="caption" color="text.secondary">
                      · 외 {d.lines.length - 3}줄…
                    </Typography>
                  )}
                </Box>
              ))}
            </Stack>
          )}
        </SectionCard>

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
