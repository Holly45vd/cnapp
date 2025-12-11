import { useState } from "react";
import {
  collection,
  getDocs,
  doc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../firebase/firebase";

// Routing
import { Link as RouterLink } from "react-router-dom";

// MUI
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  Chip,
  CardActionArea,
} from "@mui/material";

import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import StorageIcon from "@mui/icons-material/Storage";
import ArticleIcon from "@mui/icons-material/Article";
import ForumIcon from "@mui/icons-material/Forum";
import MenuBookIcon from "@mui/icons-material/MenuBook";

/**
 * ====== 자동 매핑 로직 (단어/문장/회화 ↔ 문법) ======
 */
async function autoMapAll() {
  const wordsSnap = await getDocs(collection(db, "words"));
  const words = wordsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const grammarSnap = await getDocs(collection(db, "grammar"));
  const grammars = grammarSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const wordIndex = words
    .filter((w) => w.zh && w.zh.length >= 1)
    .filter((w) => !["这", "那", "很", "有", "最近"].includes(w.zh));

  const grammarKeywords = [
    { id: findGrammarId(grammars, "这/那"), keys: ["这", "那"] },
    { id: findGrammarId(grammars, "顶"), keys: ["顶"] },
    { id: findGrammarId(grammars, "只"), keys: ["只"] },
    { id: findGrammarId(grammars, "有"), keys: ["有"] },
    { id: findGrammarId(grammars, "很"), keys: ["很"] },
    { id: findGrammarId(grammars, "最近"), keys: ["最近"] },
  ].filter((g) => g.id);

  /**
   * ===== sentences 매핑 =====
   */
  const sentencesSnap = await getDocs(collection(db, "sentences"));
  const sentences = sentencesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const batch1 = writeBatch(db);
  let writes1 = 0;

  for (const s of sentences) {
    const zh = s.zh || "";

    const matchedWords = wordIndex
      .filter((w) => zh.includes(w.zh))
      .map((w) => ({
        wordId: w.wordId || w.id,
        zh: w.zh,
        role: guessRole(w.pos),
      }));

    const matchedGrammarIds = grammarKeywords
      .filter((g) => g.keys.some((k) => zh.includes(k)))
      .map((g) => g.id);

    batch1.set(
      doc(db, "sentences", s.id),
      {
        words: matchedWords,
        grammarLinks: matchedGrammarIds,
        updatedAt: Date.now(),
        autoMappedAt: Date.now(),
      },
      { merge: true }
    );

    writes1++;
    if (writes1 >= 450) {
      await batch1.commit();
      writes1 = 0;
    }
  }
  if (writes1 > 0) await batch1.commit();

  /**
   * ===== dialogs 매핑 =====
   */
  const dialogsSnap = await getDocs(collection(db, "dialogs"));
  const dialogs = dialogsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const batch2 = writeBatch(db);
  let writes2 = 0;

  for (const d of dialogs) {
    const lines = Array.isArray(d.lines) ? d.lines : [];

    const newLines = lines.map((line) => {
      const lzh = line.zh || "";
      const gIds = grammarKeywords
        .filter((g) => g.keys.some((k) => lzh.includes(k)))
        .map((g) => g.id);

      return { ...line, grammarLinks: gIds };
    });

    const dialogZh = newLines.map((l) => l.zh || "").join(" ");
    const focusWordIds = wordIndex
      .filter((w) => dialogZh.includes(w.zh))
      .map((w) => w.wordId || w.id);

    const recommendedGrammarIds = [
      ...new Set(newLines.flatMap((l) => l.grammarLinks || [])),
    ];

    batch2.set(
      doc(db, "dialogs", d.id),
      {
        lines: newLines,
        focusWordIds,
        recommendedGrammarIds,
        updatedAt: Date.now(),
        autoMappedAt: Date.now(),
      },
      { merge: true }
    );

    writes2++;
    if (writes2 >= 450) {
      await batch2.commit();
      writes2 = 0;
    }
  }
  if (writes2 > 0) await batch2.commit();

  return {
    sentencesUpdated: sentences.length,
    dialogsUpdated: dialogs.length,
  };
}

/**
 * ====== HSK ↔ words 자동 매핑 (hskWords → words) ======
 * - 기준: words.zh === hskWords.simplified
 * - 결과: words 문서에 hskLevel, hskLabel, hskMappedAt 필드 저장
 */
async function autoMapHskToWords() {
  // 1) HSK 인덱스 로딩
  const hskSnap = await getDocs(collection(db, "hskWords"));
  const hskIndex = {};

  hskSnap.docs.forEach((d) => {
    const data = d.data() || {};
    const simplified = (data.simplified || d.id || "").trim();
    if (!simplified) return;

    // 레벨 숫자
    let levelNum = data.hskLevel ?? null;
    if (levelNum == null && typeof data.hskLabel === "string") {
      const m = data.hskLabel.match(/(\d+)/);
      if (m) levelNum = Number(m[1]);
    }
    if (
      levelNum == null &&
      typeof data.hsk_level === "string" &&
      !Number.isNaN(Number(data.hsk_level.replace(/[^\d]/g, "")))
    ) {
      const n = Number(data.hsk_level.replace(/[^\d]/g, ""));
      if (!Number.isNaN(n)) levelNum = n;
    }

    const label =
      data.hskLabel ||
      data.hsk_level ||
      (levelNum ? `HSK${levelNum}` : null);

    hskIndex[simplified] = {
      level: levelNum,
      label,
    };
  });

  // 2) words 전체 로딩
  const wordsSnap = await getDocs(collection(db, "words"));
  const now = Date.now();

  let total = 0;
  let matched = 0;
  let notMatched = 0;
  let already = 0;

  let batch = writeBatch(db);
  let writes = 0;

  for (const docSnap of wordsSnap.docs) {
    const data = docSnap.data() || {};
    const zh = (data.zh || "").trim();
    total += 1;

    if (!zh) {
      notMatched += 1;
      continue;
    }

    const info = hskIndex[zh];
    if (!info) {
      notMatched += 1;
      continue;
    }

    const prevLevel = data.hskLevel ?? null;
    const prevLabel = data.hskLabel ?? null;

    // 이미 동일 값이면 스킵
    if (prevLevel === info.level && prevLabel === info.label) {
      already += 1;
      continue;
    }

    batch.set(
      doc(db, "words", docSnap.id),
      {
        hskLevel: info.level ?? null,
        hskLabel: info.label ?? null,
        hskMappedAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    matched += 1;
    writes += 1;

    if (writes >= 450) {
      await batch.commit();
      batch = writeBatch(db);
      writes = 0;
    }
  }

  if (writes > 0) {
    await batch.commit();
  }

  return {
    total,
    matched,
    notMatched,
    already,
  };
}

function findGrammarId(grammars, key) {
  const g = grammars.find(
    (x) =>
      (x.title || "").includes(key) ||
      (x.shortTitle || "").includes(key) ||
      (x.corePattern || "").includes(key)
  );
  return g?.grammarId || g?.id;
}

function guessRole(pos) {
  if (!pos) return "unknown";
  if (pos.includes("noun")) return "object";
  if (pos.includes("verb")) return "verb";
  if (pos.includes("adjective")) return "adjective";
  return "unknown";
}

/**
 * ====== AdminHome UI ======
 */
export default function AdminHome() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const [hskRunning, setHskRunning] = useState(false);
  const [hskResult, setHskResult] = useState(null);
  const [hskError, setHskError] = useState("");

  const handleAutoMap = async () => {
    setRunning(true);
    setResult(null);
    setError("");

    try {
      const res = await autoMapAll();
      setResult(res);
    } catch (e) {
      console.error(e);
      setError(e.message || "자동 매핑 실패");
    } finally {
      setRunning(false);
    }
  };

  const handleAutoMapHsk = async () => {
    setHskRunning(true);
    setHskResult(null);
    setHskError("");

    try {
      const res = await autoMapHskToWords();
      setHskResult(res);
    } catch (e) {
      console.error(e);
      setHskError(e.message || "HSK 자동 매핑 실패");
    } finally {
      setHskRunning(false);
    }
  };

  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      {/* 헤더 */}
      <Box>
        <Typography variant="h4" fontWeight={800}>
          Admin Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          단어/문장/회화/문법 데이터를 등록하고 자동 매핑을 실행하세요.
        </Typography>
      </Box>

      {/* 컬렉션 요약 카드 */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <SummaryCard
          icon={<StorageIcon />}
          title="Words"
          desc="단어 JSON 등록"
          chips={["words"]}
          to="/admin/words"
        />
        <SummaryCard
          icon={<ArticleIcon />}
          title="Sentences"
          desc="문장 JSON 등록"
          chips={["sentences"]}
          to="/admin/sentences"
        />
        <SummaryCard
          icon={<ForumIcon />}
          title="Dialogs"
          desc="회화 JSON 등록"
          chips={["dialogs"]}
          to="/admin/dialogs"
        />
        <SummaryCard
          icon={<MenuBookIcon />}
          title="Grammar"
          desc="문법 JSON 등록"
          chips={["grammar"]}
          to="/admin/grammar"
        />
      </Stack>

      {/* 자동 매핑 액션 */}
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            {/* ===== 단어/문장/회화 ↔ 문법 자동 매핑 ===== */}
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <AutoFixHighIcon fontSize="small" />
                <Typography variant="h6" fontWeight={700}>
                  자동 매핑 실행
                </Typography>
                <Chip size="small" label="MVP" />
              </Stack>

              <Typography variant="body2" color="text.secondary">
                sentences와 dialogs를 스캔해서 단어(words) / 문법(grammar) 링크를 자동으로 채웁니다.
              </Typography>

              <Divider />

              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleAutoMap}
                  disabled={running}
                  startIcon={!running ? <AutoFixHighIcon /> : null}
                  sx={{ borderRadius: 2, px: 3, fontWeight: 700 }}
                >
                  {running ? "매핑 실행 중..." : "단어/문장/회화 자동 매핑"}
                </Button>

                {running && <CircularProgress size={22} />}
              </Stack>

              {result && (
                <Alert severity="success" sx={{ borderRadius: 2 }}>
                  완료! sentences {result.sentencesUpdated}개 / dialogs{" "}
                  {result.dialogsUpdated}개 업데이트됨.
                </Alert>
              )}

              {error && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  {error}
                </Alert>
              )}
            </Stack>

            {/* ===== HSK 레벨 자동 매핑 ===== */}
            <Divider />

            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip size="small" label="HSK" color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  HSK 레벨 자동 매핑
                </Typography>
              </Stack>

              <Typography variant="body2" color="text.secondary">
                hskWords 컬렉션의 간체(simplified)와 words 컬렉션의 zh를 매칭해서
                각 단어에 hskLevel / hskLabel 필드를 자동으로 채웁니다.
                <br />
                이 작업을 해두면, 학습 화면에서 HSK 급수별로 단어를 나눠서 공부할 수 있어.
              </Typography>

              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleAutoMapHsk}
                  disabled={hskRunning}
                  sx={{ borderRadius: 2, px: 3, fontWeight: 700 }}
                >
                  {hskRunning ? "HSK 매핑 중..." : "HSK → 단어 자동 매핑"}
                </Button>
                {hskRunning && <CircularProgress size={22} />}
              </Stack>

              {hskResult && (
                <Alert severity="success" sx={{ borderRadius: 2 }}>
                  HSK 매핑 완료!
                  <br />
                  전체 단어: {hskResult.total}개 /
                  매칭됨: {hskResult.matched}개 /
                  매칭 없음: {hskResult.notMatched}개 /
                  이미 동일해서 건너뜀: {hskResult.already}개
                </Alert>
              )}

              {hskError && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  {hskError}
                </Alert>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

/**
 * ===== SummaryCard (클릭 → 라우팅) =====
 */
function SummaryCard({ icon, title, desc, chips = [], to }) {
  return (
    <Card
      variant="outlined"
      sx={{
        flex: 1,
        borderRadius: 3,
        minHeight: 120,
        transition: "0.15s",
        "&:hover": { boxShadow: 3, transform: "translateY(-2px)" },
      }}
    >
      <CardActionArea component={RouterLink} to={to} sx={{ height: "100%" }}>
        <CardContent>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              {icon}
              <Typography fontWeight={800}>{title}</Typography>
            </Stack>

            <Typography variant="body2" color="text.secondary">
              {desc}
            </Typography>

            <Stack direction="row" spacing={0.5}>
              {chips.map((c) => (
                <Chip key={c} size="small" label={c} />
              ))}
            </Stack>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              클릭해서 이동 →
            </Typography>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
