// src/app/components/WeeklyHistorySection.jsx

import { useEffect, useMemo, useState } from "react";
import { Box, Card, CardContent, Typography, Tabs, Tab, Stack } from "@mui/material";

import { useAuth } from "../../providers/AuthProvider";
import { listUserHistoryRange, listCollection } from "../../firebase/db";
import { speakZh } from "../../lib/ttsHelper";
import { freeTextPinyinToKorean, pinyinArrayToKorean } from "../../lib/pinyinKorean";
import Loading from "../../shared/components/Loading";
import ErrorBox from "../../shared/components/ErrorBox";
import { toDateKey } from "../../shared/utils/date";

// ✅ 오늘 포함 지난 7일 dateKey 리스트
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

        // ⚠ listCollection 이 d.data()만 반환하므로,
        // 여기서 id를 wordId / sentenceId / grammarId / dialogId 로 세팅해서 map 생성
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

  // ✅ 지난 7일 집계 (Done = 다시보기, Known = 마스터)
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
        <WordsWeeklyTab summary={weeklySummary} wordsMap={wordsMap} />
      )}
      {tab === "sentences" && (
        <SentencesWeeklyTab
          summary={weeklySummary}
          sentencesMap={sentencesMap}
        />
      )}
      {tab === "grammar" && (
        <GrammarWeeklyTab
          summary={weeklySummary}
          grammarMap={grammarMap}
        />
      )}
      {tab === "dialogs" && (
        <DialogsWeeklyTab
          summary={weeklySummary}
          dialogsMap={dialogsMap}
        />
      )}
    </Box>
  );
}

/* ------------------------------
 *  탭별 하위 컴포넌트
 * ------------------------------ */

function WordsWeeklyTab({ summary, wordsMap }) {
  const makeKoPron = (w) => {
    if (!w) return "";
    if (w.koPronunciation) return w.koPronunciation;
    if (Array.isArray(w.syllables) && w.syllables.length > 0) {
      return pinyinArrayToKorean(w.syllables);
    }
    if (w.pinyin) return freeTextPinyinToKorean(w.pinyin);
    return "";
  };

  const renderList = (ids, title) => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        {title} ({ids.length}개)
      </Typography>
      <Stack spacing={1}>
        {ids.map((id) => {
          const w = wordsMap[id];
          if (!w) return null;
          const koPron = makeKoPron(w);

          return (
            <Card
              key={id}
              variant="outlined"
              sx={{ cursor: "pointer" }}
              onClick={() => speakZh(w.audio?.ttsText || w.zh)}
            >
              <CardContent>
                <Typography variant="h6">{w.zh}</Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  {w.pinyin}
                  {koPron && ` / ${koPron}`}
                </Typography>
                <Typography variant="body2">
                  {w.ko || w.meaning_ko}
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
      {renderList(summary.wordsReview, "다시보기 단어")}
      {renderList(summary.wordsMaster, "알고있는 단어")}
    </Box>
  );
}

function SentencesWeeklyTab({ summary, sentencesMap }) {
  const renderList = (ids, title) => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        {title} ({ids.length}개)
      </Typography>
      <Stack spacing={1}>
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
              <CardContent>
                <Typography variant="body1">{s.zh}</Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  {s.pinyin}
                  {koPron && ` / ${koPron}`}
                </Typography>
                <Typography variant="body2">{s.ko}</Typography>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );

  return (
    <Box>
      {renderList(summary.sentencesReview, "다시보기 문장")}
      {renderList(summary.sentencesMaster, "알고있는 문장")}
    </Box>
  );
}

function GrammarWeeklyTab({ summary, grammarMap }) {
  const renderList = (ids, title) => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        {title} ({ids.length}개)
      </Typography>
      <Stack spacing={1}>
        {ids.map((id) => {
          const g = grammarMap[id];
          if (!g) return null;

          return (
            <Card key={id} variant="outlined">
              <CardContent>
                <Typography variant="h6">{g.title}</Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  {g.corePattern}
                </Typography>
                <Typography variant="body2">
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
      {renderList(summary.grammarReview, "다시보기 문법")}
      {renderList(summary.grammarMaster, "알고있는 문법")}
    </Box>
  );
}

function DialogsWeeklyTab({ summary, dialogsMap }) {
  const renderList = (ids, title) => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        {title} ({ids.length}개)
      </Typography>
      <Stack spacing={1}>
        {ids.map((id) => {
          const d = dialogsMap[id];
          if (!d) return null;

          const firstLines = (d.lines || [])
            .slice(0, 3)
            .map((ln) => ln.zh);
          const preview = firstLines.join(" / ");

          const allZh = (d.lines || [])
            .map((ln) => ln.zh)
            .join(" ");

          return (
            <Card
              key={id}
              variant="outlined"
              sx={{ cursor: "pointer" }}
              onClick={() => speakZh(allZh)}
            >
              <CardContent>
                <Typography variant="h6">{d.topic}</Typography>
                <Typography variant="body2">{preview}</Typography>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );

  return (
    <Box>
      {renderList(summary.dialogsReview, "다시보기 회화")}
      {renderList(summary.dialogsMaster, "알고있는 회화")}
    </Box>
  );
}
