// src/app/pages/RandomReview.jsx

import { useEffect, useMemo, useState } from "react";
import {
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "../../providers/AuthProvider";
import {
  listUserHistoryAll,
  listCollection,
  updateUserHistoryDoc,
} from "../../firebase/db";

import { getLast7DateKeys } from "../../shared/utils/date";
import { speakZh } from "../../lib/ttsHelper";

// MUI
import {
  Box,
  Stack,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Chip,
  Button,
} from "@mui/material";

import ReplayIcon from "@mui/icons-material/Replay";
import QuizIcon from "@mui/icons-material/Quiz";
import HomeIcon from "@mui/icons-material/Home";

// Components
import ReviewDateSelector from "../components/review/ReviewDateSelector";
import ReviewSections from "../components/review/ReviewSections";
import RandomQuizPanel from "../components/review/RandomQuizPanel";

const TAB_REVIEW = "review";
const TAB_QUIZ = "quiz";

/* ---------------------------------------
   공통 유틸
--------------------------------------- */

function normalizeId(item) {
  if (!item) return null;
  if (typeof item === "string") return item;
  return (
    item.wordId ||
    item.sentenceId ||
    item.grammarId ||
    item.dialogId ||
    item.id ||
    null
  );
}

function resolveFromMap(item, map) {
  if (!item) return null;
  if (typeof item === "object" && item.zh) return item;
  const id = normalizeId(item);
  return id ? map.get(id) : null;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------------------------------------
   페이지 시작
--------------------------------------- */

export default function RandomReview() {
  const { user } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [tab, setTab] = useState(() => {
    const mode = searchParams.get("mode");
    return mode === TAB_QUIZ ? TAB_QUIZ : TAB_REVIEW;
  });

  const [loading, setLoading] = useState(true);

  const [historyDocs, setHistoryDocs] = useState([]);
  const [words, setWords] = useState([]);
  const [grammar, setGrammar] = useState([]);
  const [dialogs, setDialogs] = useState([]);
  const [sentences, setSentences] = useState([]);

  const [selectedDateKey, setSelectedDateKey] = useState("");

  const last7Keys = useMemo(() => getLast7DateKeys(new Date()), []);

  /* ---------------------------------------
     데이터 로딩
  --------------------------------------- */
  useEffect(() => {
    if (!user) return;

    (async () => {
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

      // 기본 선택 날짜 로직
      if (allHistory.length > 0) {
        const fromStateKey = location.state?.dateKey;
        const todayKey = new Date().toISOString().slice(0, 10);

        let initialKey = "";

        if (fromStateKey && allHistory.some((h) => h.dateKey === fromStateKey)) {
          initialKey = fromStateKey;
        } else if (allHistory.some((h) => h.dateKey === todayKey)) {
          initialKey = todayKey;
        } else {
          initialKey = [...allHistory].sort((a, b) =>
            b.dateKey.localeCompare(a.dateKey)
          )[0].dateKey;
        }

        setSelectedDateKey(initialKey);
      }

      setLoading(false);
    })();
  }, [user, location.state]);

  /* ---------------------------------------
     맵 구성
  --------------------------------------- */
  const historyByKey = useMemo(
    () => new Map(historyDocs.map((d) => [d.dateKey, d])),
    [historyDocs]
  );

  const wordMap = useMemo(() => new Map(words.map((w) => [w.wordId, w])), [words]);
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
      new Map(sentences.map((s) => [s.sentenceId || s.id, s])),
    [sentences]
  );

  const selectedHistory = selectedDateKey
    ? historyByKey.get(selectedDateKey)
    : null;

  const availableDates = useMemo(
    () =>
      historyDocs
        .map((h) => h.dateKey)
        .sort((a, b) => b.localeCompare(a)),
    [historyDocs]
  );

  /* ---------------------------------------
     복습 대상 분리 (Done / Known 기준)
  --------------------------------------- */
  const reviewItems = useMemo(() => {
    if (!selectedHistory)
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

    const mapIds = (ids, map) =>
      (ids || []).map((it) => resolveFromMap(it, map)).filter(Boolean);

    return {
      wordReview: mapIds(selectedHistory.wordsDone, wordMap),
      wordMaster: mapIds(selectedHistory.wordsKnown, wordMap),

      sentenceReview: mapIds(selectedHistory.sentencesDone, sentenceMap),
      sentenceMaster: mapIds(selectedHistory.sentencesKnown, sentenceMap),

      grammarReview: mapIds(selectedHistory.grammarDone, grammarMap),
      grammarMaster: mapIds(selectedHistory.grammarKnown, grammarMap),

      dialogReview: mapIds(selectedHistory.dialogsDone, dialogMap),
      dialogMaster: mapIds(selectedHistory.dialogsKnown, dialogMap),
    };
  }, [selectedHistory, wordMap, sentenceMap, grammarMap, dialogMap]);

  /* ---------------------------------------
     🔁 토글 (Done ↔ Known)
  --------------------------------------- */

  const toggleConfig = {
    word: { doneKey: "wordsDone", knownKey: "wordsKnown" },
    sentence: { doneKey: "sentencesDone", knownKey: "sentencesKnown" },
    grammar: { doneKey: "grammarDone", knownKey: "grammarKnown" },
    dialog: { doneKey: "dialogsDone", knownKey: "dialogsKnown" },
  };

  const handleToggleReviewStatus = async (type, item, toMaster) => {
    if (!selectedDateKey || !user) return;

    const id = normalizeId(item);
    if (!id) return;

    const cfg = toggleConfig[type];
    if (!cfg) return;

    // 현재 선택된 날짜의 히스토리 스냅샷 기준으로 계산
    const currentDoc = historyByKey.get(selectedDateKey);
    if (!currentDoc) return;

    const prevDone = currentDoc[cfg.doneKey] || [];
    const prevKnown = currentDoc[cfg.knownKey] || [];

    let nextDone = [...prevDone];
    let nextKnown = [...prevKnown];

    if (toMaster) {
      // Done → Known
      nextDone = nextDone.filter((x) => x !== id);
      if (!nextKnown.includes(id)) nextKnown.push(id);
    } else {
      // Known → Done
      nextKnown = nextKnown.filter((x) => x !== id);
      if (!nextDone.includes(id)) nextDone.push(id);
    }

    // 1) UI 상태 업데이트 (optimistic)
    setHistoryDocs((prev) =>
      prev.map((doc) =>
        doc.dateKey === selectedDateKey
          ? {
              ...doc,
              [cfg.doneKey]: nextDone,
              [cfg.knownKey]: nextKnown,
            }
          : doc
      )
    );

    // 2) Firestore에도 동일 값으로 반영
    await updateUserHistoryDoc(user.uid, selectedDateKey, {
      [cfg.doneKey]: nextDone,
      [cfg.knownKey]: nextKnown,
    });
  };

  /* ---------------------------------------
     TTS
  --------------------------------------- */

  const handleSpeakWord = (w) => speakZh(w?.audio?.ttsText || w?.zh || "");
  const handleSpeakSentence = (s) =>
    speakZh(s?.audio?.ttsText || s?.zh || "");
  const handleSpeakDialog = (d) =>
    speakZh(
      (d?.lines || [])
        .map((l) => l.zh)
        .filter(Boolean)
        .join(" ")
    );

  /* ---------------------------------------
     지난 7일 랜덤 퀴즈 생성
  --------------------------------------- */

  const quizQuestions = useMemo(() => {
    if (!historyDocs.length) return [];

    const byKey = new Map(historyDocs.map((d) => [d.dateKey, d]));
    const last7Docs = last7Keys.map((k) => byKey.get(k)).filter(Boolean);

    const mergeUnique = (arr) => {
      const map = new Map();
      for (const it of arr) {
        const id = normalizeId(it);
        if (id && !map.has(id)) map.set(id, it);
      }
      return [...map.values()];
    };

    const collectForQuiz = (doneKey, knownKey) => {
      const done = mergeUnique(last7Docs.flatMap((d) => d[doneKey] || []));
      const known = new Set(
        last7Docs.flatMap((d) => d[knownKey] || []).map(normalizeId)
      );
      return done.filter((it) => !known.has(normalizeId(it)));
    };

    const wordReview = collectForQuiz("wordsDone", "wordsKnown")
      .map((it) => resolveFromMap(it, wordMap))
      .filter(Boolean);

    const sentenceReview = collectForQuiz("sentencesDone", "sentencesKnown")
      .map((it) => resolveFromMap(it, sentenceMap))
      .filter(Boolean);

    const grammarReview = collectForQuiz("grammarDone", "grammarKnown")
      .map((it) => resolveFromMap(it, grammarMap))
      .filter(Boolean);

    const dialogReview = collectForQuiz("dialogsDone", "dialogsKnown")
      .map((it) => resolveFromMap(it, dialogMap))
      .filter(Boolean);

    const wordQs = wordReview.map((w) => {
      const correct = w.ko || w.meaning_ko || w.kr;
      const options = shuffle([
        correct,
        ...shuffle(
          wordReview
            .map((x) => x.ko || x.meaning_ko)
            .filter((x) => x && x !== correct)
        ).slice(0, 3),
      ]);
      return {
        id: normalizeId(w),
        type: "word",
        stem: w.zh,
        stemSub: w.pinyin || "",
        prompt: "단어 의미를 고르세요",
        correct,
        options,
      };
    });

    const sentenceQs = sentenceReview.map((s) => {
      const correct = s.ko;
      const options = shuffle([
        correct,
        ...shuffle(
          sentenceReview
            .map((x) => x.ko)
            .filter((x) => x && x !== correct)
        ).slice(0, 3),
      ]);

      return {
        id: normalizeId(s),
        type: "sentence",
        stem: s.zh,
        stemSub: s.pinyin || "",
        prompt: "문장 의미를 고르세요",
        correct,
        options,
      };
    });

    const grammarQs = grammarReview.map((g) => {
      const correct = g.meaning_ko;
      const options = shuffle([
        correct,
        ...shuffle(
          grammarReview
            .map((x) => x.meaning_ko)
            .filter((x) => x && x !== correct)
        ).slice(0, 3),
      ]);

      return {
        id: normalizeId(g),
        type: "grammar",
        stem: g.title || g.shortTitle || g.corePattern || "",
        stemSub: g.corePattern || "",
        prompt: "문법 뜻을 고르세요",
        correct,
        options,
      };
    });

    const dialogQs = dialogReview
      .map((d) => {
        const zh = (d.lines || []).map((l) => l.zh).join(" / ");
        const ko = (d.lines || []).map((l) => l.ko).join(" / ");
        if (!zh || !ko) return null;

        const correct = ko;
        const options = shuffle([
          correct,
          ...shuffle(
            dialogReview
              .map(
                (x) => (x.lines || []).map((l) => l.ko).join(" / ")
              )
              .filter((x) => x && x !== correct)
          ).slice(0, 3),
        ]);

        return {
          id: normalizeId(d),
          type: "dialog",
          stem: zh,
          stemSub: "",
          prompt: "대화 전체 의미를 고르세요",
          correct,
          options,
        };
      })
      .filter(Boolean);

    return shuffle([...wordQs, ...sentenceQs, ...grammarQs, ...dialogQs]).slice(
      0,
      10
    );
  }, [historyDocs, last7Keys, wordMap, sentenceMap, grammarMap, dialogMap]);

  /* ---------------------------------------
     퀴즈 상태
  --------------------------------------- */

  const [quizIdx, setQuizIdx] = useState(0);
  const [quizSelected, setQuizSelected] = useState(null);
  const [quizIsCorrect, setQuizIsCorrect] = useState(null);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizCorrectCount, setQuizCorrectCount] = useState(0);

  useEffect(() => {
    setQuizIdx(0);
    setQuizSelected(null);
    setQuizIsCorrect(null);
    setQuizFinished(false);
    setQuizCorrectCount(0);
  }, [quizQuestions]);

  const currentQuestion = quizQuestions[quizIdx] || null;

  const handleQuizSelect = (opt) => {
    if (!currentQuestion || quizFinished) return;
    if (quizSelected != null) return;

    setQuizSelected(opt);
    const isOk = opt === currentQuestion.correct;
    setQuizIsCorrect(isOk);
    if (isOk) setQuizCorrectCount((c) => c + 1);
  };

  const handleQuizNext = () => {
    if (quizIdx + 1 >= quizQuestions.length) {
      setQuizFinished(true);
    } else {
      setQuizIdx((idx) => idx + 1);
      setQuizSelected(null);
      setQuizIsCorrect(null);
    }
  };

  /* ---------------------------------------
     렌더링
  --------------------------------------- */

  if (!user) {
    return (
      <Box sx={{ minHeight: "100vh", p: 2 }}>
        <Typography>로그인이 필요합니다.</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", p: 2 }}>
        <Typography>복습 데이터를 불러오는 중...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: 1 }}>
      <Stack spacing={2.5} sx={{ p: 1 }}>
        {/* 헤더 */}
        <Stack direction="row" spacing={1} alignItems="center">
          <ReplayIcon fontSize="small" />
          <Typography variant="h5" fontWeight={800}>
            복습하기
          </Typography>
          <Chip size="small" label="지난 기록 기반" />
          <Box sx={{ flex: 1 }} />
          <Button
            size="small"
            variant="text"
            startIcon={<HomeIcon />}
            onClick={() => nav("/app")}
          >
            홈
          </Button>
        </Stack>

        {/* 탭 */}
        <Card>
          <CardContent sx={{ pb: 0 }}>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant="fullWidth"
            >
              <Tab
                value={TAB_REVIEW}
                icon={<ReplayIcon fontSize="small" />}
                iconPosition="start"
                label="날짜별 복습"
              />
              <Tab
                value={TAB_QUIZ}
                icon={<QuizIcon fontSize="small" />}
                iconPosition="start"
                label="랜덤 퀴즈"
              />
            </Tabs>
          </CardContent>
        </Card>

        {/* REVIEW 탭 */}
        {tab === TAB_REVIEW && (
          <>
            <ReviewDateSelector
              selectedDateKey={selectedDateKey}
              onChangeDateKey={setSelectedDateKey}
              availableDates={availableDates}
            />

            <ReviewSections
              selectedDateKey={selectedDateKey}
              hasHistory={!!selectedHistory}
              reviewItems={reviewItems}
              onSpeakWord={handleSpeakWord}
              onSpeakSentence={handleSpeakSentence}
              onSpeakDialog={handleSpeakDialog}
              onToggleStatus={handleToggleReviewStatus}
            />
          </>
        )}

        {/* QUIZ 탭 */}
        {tab === TAB_QUIZ && (
          <RandomQuizPanel
            questions={quizQuestions}
            currentIdx={quizIdx}
            selected={quizSelected}
            isCorrect={quizIsCorrect}
            finished={quizFinished}
            correctCount={quizCorrectCount}
            onSelect={handleQuizSelect}
            onNext={handleQuizNext}
            onBackToReview={() => setTab(TAB_REVIEW)}
          />
        )}
      </Stack>
    </Box>
  );
}
