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
 * ====== 자동 매핑 로직 ======
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
