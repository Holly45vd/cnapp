// src/app/components/WeeklyHistorySection.jsx

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Stack,
  IconButton,
  Tooltip,
} from "@mui/material";

import { useAuth } from "../../providers/AuthProvider";
import {
  listUserHistoryRange,
  listCollection,
  updateUserHistoryDoc,
} from "../../firebase/db";
import { speakZh } from "../../lib/ttsHelper";
import {
  freeTextPinyinToKorean,
  pinyinArrayToKorean,
} from "../../lib/pinyinKorean";
import Loading from "../../shared/components/Loading";
import ErrorBox from "../../shared/components/ErrorBox";
import { toDateKey } from "../../shared/utils/date";

import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ReplayIcon from "@mui/icons-material/Replay";

/* ---------------------------------------
 *  오늘 포함 지난 7일 dateKey 리스트
 * --------------------------------------*/
function getLast7DateKeys() {
  const keys = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    keys.push(toDateKey(d)); // "YYYY-MM-DD"
  }
  return keys; // [오늘, 어제, ...]
}

export default function WeeklyHistorySection() {
  const { user } = useAuth();
  const [tab, setTab] = useState("words"); // words | sentences | grammar | dialogs

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [historyDocs, setHistoryDocs] = useState([]);

  const [wordsMap, setWordsMap] = useState({});
  const [sentencesMap, setSentencesMap] = useState({});
  const [grammarMap, setGrammarMap] = useState({});
  const [dialogsMap, setDialogsMap] = useState({});

  const last7Keys = useMemo(() => getLast7DateKeys(), []);
  const startKey = last7Keys[last7Keys.length - 1]; // 7일 전
  const endKey = last7Keys[0]; // 오늘

  /* ---------------------------------------
   *  지난 7일 히스토리 + vocab 로딩
   * --------------------------------------*/
  useEffect(() => {
    if (!user) return;

    async function load() {
      try {
        setLoading(true);
        setErr(null);

        // 1) 지난 7일 히스토리
        const hist = await listUserHistoryRange(user.uid, startKey, endKey);
        setHistoryDocs(hist || []);

        // 2) 단어/문장/문법/회화 컬렉션 로딩
        const [words, sentences, grammar, dialogs] = await Promise.all([
          listCollection("words"),
          listCollection("sentences"),
          listCollection("grammar"),
          listCollection("dialogs"),
        ]);

        const wMap = {};
        (words || []).forEach((w) => {
          const id = w.wordId || w.id;
          if (id) wMap[id] = w;
        });

        const sMap = {};
        (sentences || []).forEach((s) => {
          const id = s.sentenceId || s.id;
          if (id) sMap[id] = s;
        });

        const gMap = {};
        (grammar || []).forEach((g) => {
          const id = g.grammarId || g.id;
          if (id) gMap[id] = g;
        });

        const dMap = {};
        (dialogs || []).forEach((d) => {
          const id = d.dialogId || d.id;
          if (id) dMap[id] = d;
        });

        setWordsMap(wMap);
        setSentencesMap(sMap);
        setGrammarMap(gMap);
        setDialogsMap(dMap);
      } catch (e) {
        console.error(e);
        setErr(e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user, startKey, endKey]);

  /* ---------------------------------------
   *  지난 7일 집계 (Set → 배열)
   * --------------------------------------*/
  const weeklySummary = useMemo(() => {
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

    for (const h of historyDocs) {
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

    return {
      wordsReview: toArr(agg.wordsReview),
      wordsMaster: toArr(agg.wordsMaster),
      sentencesReview: toArr(agg.sentencesReview),
      sentencesMaster: toArr(agg.sentencesMaster),
      grammarReview: toArr(agg.grammarReview),
      grammarMaster: toArr(agg.grammarMaster),
      dialogsReview: toArr(agg.dialogsReview),
      dialogsMaster: toArr(agg.dialogsMaster),
    };
  }, [historyDocs]);

  /* ---------------------------------------
   *  상태 토글 → historyDocs + Firestore 동기화
   *  kind: "words" | "sentences" | "grammar" | "dialogs"
   *  from: "review" | "master"
   * --------------------------------------*/
  const handleToggleStatus = async (kind, id, from) => {
    if (!user || !id) return;

    const config = {
      words: { reviewField: "wordsDone", masterField: "wordsKnown" },
      sentences: {
        reviewField: "sentencesDone",
        masterField: "sentencesKnown",
      },
      grammar: {
        reviewField: "grammarDone",
        masterField: "grammarKnown",
      },
      dialogs: {
        reviewField: "dialogsDone",
        masterField: "dialogsKnown",
      },
    }[kind];

    if (!config) return;

    const fromField =
      from === "review" ? config.reviewField : config.masterField;
    const toField =
      from === "review" ? config.masterField : config.reviewField;

    const updates = [];

    const newDocs = historyDocs.map((doc) => {
      const fromArr = doc[fromField] || [];
      const toArr = doc[toField] || [];

      if (!fromArr.includes(id)) return doc;

      const newFrom = fromArr.filter((x) => x !== id);
      const newTo = toArr.includes(id) ? toArr : [...toArr, id];

      updates.push({
        dateKey: doc.dateKey,
        patch: { [fromField]: newFrom, [toField]: newTo },
      });

      return {
        ...doc,
        [fromField]: newFrom,
        [toField]: newTo,
      };
    });

    // 로컬 상태 먼저 반영
    setHistoryDocs(newDocs);

    // Firestore 동기화
    try {
      await Promise.all(
        updates.map(({ dateKey, patch }) =>
          updateUserHistoryDoc(user.uid, dateKey, patch)
        )
      );
    } catch (e) {
      console.error("toggleStatus Firestore 에러", e);
      // 필요하면 여기서 토스트/에러 표시 추가 가능
    }
  };

  if (!user) return null;
  if (loading) return <Loading />;
  if (err) return <ErrorBox error={err} />;

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        지난 7일 요약
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {startKey} ~ {endKey}
      </Typography>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 2 }}
        variant="scrollable"
        allowScrollButtonsMobile
      >
        <Tab label="단어" value="words" />
        <Tab label="문장" value="sentences" />
        <Tab label="문법" value="grammar" />
        <Tab label="회화" value="dialogs" />
      </Tabs>

      {tab === "words" && (
        <WordsWeeklyTab
          summary={weeklySummary}
          wordsMap={wordsMap}
          onToggle={handleToggleStatus}
        />
      )}
      {tab === "sentences" && (
        <SentencesWeeklyTab
          summary={weeklySummary}
          sentencesMap={sentencesMap}
          onToggle={handleToggleStatus}
        />
      )}
      {tab === "grammar" && (
        <GrammarWeeklyTab
          summary={weeklySummary}
          grammarMap={grammarMap}
          onToggle={handleToggleStatus}
        />
      )}
      {tab === "dialogs" && (
        <DialogsWeeklyTab
          summary={weeklySummary}
          dialogsMap={dialogsMap}
          onToggle={handleToggleStatus}
        />
      )}
    </Box>
  );
}

/* ---------------------------------------
 *  공통: 카드 우측 상단 토글 아이콘
 * --------------------------------------*/
function StatusToggleIcon({ kind, id, type, onToggle }) {
  // type: "review" or "master"
  const isReview = type === "review";
  const label = isReview ? "알고있는 쪽으로 이동" : "다시보기로 이동";

  const handleClick = (e) => {
    e.stopPropagation(); // 카드 클릭(speak)과 분리
    onToggle(kind, id, type);
  };

  return (
    <Tooltip title={label}>
      <IconButton
        size="small"
        onClick={handleClick}
        sx={{
          ml: 1,
        }}
      >
        {isReview ? (
          <CheckCircleOutlineIcon fontSize="small" />
        ) : (
          <ReplayIcon fontSize="small" />
        )}
      </IconButton>
    </Tooltip>
  );
}

/* ------------------------------
 *  단어 탭
 * ------------------------------*/
function WordsWeeklyTab({ summary, wordsMap, onToggle }) {
  const makeKoPron = (w) => {
    if (!w) return "";
    if (w.koPronunciation) return w.koPronunciation;
    if (Array.isArray(w.syllables) && w.syllables.length > 0) {
      return pinyinArrayToKorean(w.syllables);
    }
    if (w.pinyin) return freeTextPinyinToKorean(w.pinyin);
    return "";
  };

  const renderList = (ids, title, type) => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        {title} ({ids.length}개)
      </Typography>
      <Stack spacing={1.2}>
        {ids.map((id) => {
          const w = wordsMap[id];
          if (!w) return null;

          const koPron = makeKoPron(w);
          const meaning = w.ko || w.meaning_ko || w.meaningKr || w.kr || "";

          return (
            <Card
              key={id}
              variant="outlined"
              sx={{
                cursor: "pointer",
              }}
              onClick={() => speakZh(w.audio?.ttsText || w.zh)}
            >
              <CardContent sx={{ pb: 1.5 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  sx={{ mb: 0.5 }}
                >
                  <Typography variant="h6">{w.zh}</Typography>
                  <StatusToggleIcon
                    kind="words"
                    id={id}
                    type={type}
                    onToggle={onToggle}
                  />
                </Stack>

                {/* 병음 + 한국어 발음 */}
                {(w.pinyin || koPron) && (
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    {w.pinyin}
                    {koPron && ` / ${koPron}`}
                  </Typography>
                )}

                {/* 한국어 뜻 */}
                {meaning && (
                  <Typography variant="body2" color="text.secondary">
                    {meaning}
                  </Typography>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );

  return (
    <Box>
      {renderList(summary.wordsReview, "다시보기 단어", "review")}
      {renderList(summary.wordsMaster, "알고있는 단어", "master")}
    </Box>
  );
}

/* ------------------------------
 *  문장 탭
 * ------------------------------*/
function SentencesWeeklyTab({ summary, sentencesMap, onToggle }) {
  const renderList = (ids, title, type) => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        {title} ({ids.length}개)
      </Typography>
      <Stack spacing={1.2}>
        {ids.map((id) => {
          const s = sentencesMap[id];
          if (!s) return null;

          const koPron = s.pinyin
            ? freeTextPinyinToKorean(s.pinyin)
            : "";

          return (
            <Card
              key={id}
              variant="outlined"
              sx={{ cursor: "pointer" }}
              onClick={() => speakZh(s.audio?.ttsText || s.zh)}
            >
              <CardContent sx={{ pb: 1.5 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  sx={{ mb: 0.5 }}
                >
                  {/* 중국어 문장 */}
                  <Typography variant="body1">{s.zh}</Typography>
                  <StatusToggleIcon
                    kind="sentences"
                    id={id}
                    type={type}
                    onToggle={onToggle}
                  />
                </Stack>

                {/* 병음 + 한국어 발음 */}
                {(s.pinyin || koPron) && (
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    {s.pinyin}
                    {koPron && ` / ${koPron}`}
                  </Typography>
                )}

                {/* 한국어 뜻 */}
                {s.ko && (
                  <Typography variant="body2" color="text.secondary">
                    {s.ko}
                  </Typography>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );

  return (
    <Box>
      {renderList(summary.sentencesReview, "다시보기 문장", "review")}
      {renderList(summary.sentencesMaster, "알고있는 문장", "master")}
    </Box>
  );
}

/* ------------------------------
 *  문법 탭
 * ------------------------------*/
function GrammarWeeklyTab({ summary, grammarMap, onToggle }) {
  const renderList = (ids, title, type) => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        {title} ({ids.length}개)
      </Typography>
      <Stack spacing={1.2}>
        {ids.map((id) => {
          const g = grammarMap[id];
          if (!g) return null;

          return (
            <Card key={id} variant="outlined">
              <CardContent sx={{ pb: 1.5 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  sx={{ mb: 0.5 }}
                >
                  <Typography variant="h6">
                    {g.title || g.shortTitle}
                  </Typography>
                  <StatusToggleIcon
                    kind="grammar"
                    id={id}
                    type={type}
                    onToggle={onToggle}
                  />
                </Stack>

                {g.corePattern && (
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    {g.corePattern}
                  </Typography>
                )}

                <Typography variant="body2" color="text.secondary">
                  {g.meaning_ko || g.summary_ko}
                </Typography>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );

  return (
    <Box>
      {renderList(summary.grammarReview, "다시보기 문법", "review")}
      {renderList(summary.grammarMaster, "알고있는 문법", "master")}
    </Box>
  );
}

/* ------------------------------
 *  회화 탭
 *  - topic 타이틀 제거
 *  - 각 줄에: 한자 / 병음 / 한글 발음 / 뜻
 *  - 토글 아이콘으로 상태 변경
 * ------------------------------*/
function DialogsWeeklyTab({ summary, dialogsMap, onToggle }) {
  const makeKoPron = (pinyin) => {
    if (!pinyin) return "";
    return freeTextPinyinToKorean(pinyin);
  };

  const renderList = (ids, title, type) => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        {title} ({ids.length}개)
      </Typography>

      <Stack spacing={1.5}>
        {ids.map((id) => {
          const d = dialogsMap[id];
          if (!d) return null;

          const lines = d.lines || [];
          const previewLines = lines.slice(0, 3);

          return (
            <Card key={id} variant="outlined" sx={{ p: 1.3 }}>
              <CardContent sx={{ p: 0 }}>
                {/* 상단: 좌측엔 "회화" 표시 정도, 우측엔 토글 */}
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 1 }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 700 }}
                  >
                    회화
                  </Typography>

                  <StatusToggleIcon
                    kind="dialogs"
                    id={id}
                    type={type}
                    onToggle={onToggle}
                  />
                </Stack>

                {/* 각 줄: 한자 / 병음 / 한국어 발음 / 뜻 */}
                {previewLines.map((l, idx) => {
                  const koPron = makeKoPron(l.pinyin);

                  return (
                    <Box
                      key={idx}
                      sx={{
                        mb: 1,
                        cursor: "pointer",
                      }}
                      onClick={() => speakZh(l.zh)}
                    >
                      {/* 한자 */}
                      <Typography fontWeight={700}>{l.zh}</Typography>

                      {/* 병음 + 한국어 발음 */}
                      {(l.pinyin || koPron) && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          {l.pinyin}
                          {koPron && ` / ${koPron}`}
                        </Typography>
                      )}

                      {/* 한국어 뜻 */}
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

                {/* 나머지 줄 안내 */}
                {lines.length > 3 && (
                  <Typography variant="caption" color="text.secondary">
                    · 외 {lines.length - 3}줄…
                  </Typography>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );

  return (
    <Box>
      {renderList(summary.dialogsReview, "다시보기 회화", "review")}
      {renderList(summary.dialogsMaster, "알고있는 회화", "master")}
    </Box>
  );
}
