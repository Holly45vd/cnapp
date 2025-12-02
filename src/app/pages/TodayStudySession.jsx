// src/app/pages/TodayStudySession.jsx

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import WordSession from "./WordSession";
import GrammarSession from "./GrammarSession";
import DialogSession from "./DialogSession";
import SentenceSession from "./SentenceSession";

// MUI
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  Button,
  Stack,
} from "@mui/material";

export default function TodayStudySession() {
  const nav = useNavigate();
  const { state } = useLocation();
  const routine = state?.routine;

  // "words" | "sentences" | "grammar" | "dialogs"
  const [step, setStep] = useState("words");
  const [wordResult, setWordResult] = useState(null);
  const [sentenceResult, setSentenceResult] = useState(null);
  const [grammarResult, setGrammarResult] = useState(null);
  const [dialogResult, setDialogResult] = useState(null);

  // ⏱ 시작 시각 기록 → 마지막에 durationSec 계산
  const [startedAt] = useState(() => Date.now());

  useEffect(() => {
    if (!routine) return;
    setStep("words");
  }, [routine]);

  if (!routine) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: 2 }}>
        <Card>
          <CardContent>
            <Stack spacing={1.5}>
              <Typography variant="h6" fontWeight={800}>
                오늘 루틴이 없습니다
              </Typography>
              <Typography variant="body2" color="text.secondary">
                홈으로 돌아가서 “오늘 공부”를 다시 시작해줘.
              </Typography>
              <Button
                variant="contained"
                onClick={() => nav("/app")}
                sx={{ borderRadius: 2, fontWeight: 800 }}
              >
                홈으로
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const steps = [
    { key: "words", label: "단어" },
    { key: "sentences", label: "문장" },
    { key: "grammar", label: "문법" },
    { key: "dialogs", label: "회화" },
  ];
  const currentIdx = steps.findIndex((s) => s.key === step);

  const wordCount = routine.words?.length ?? 0;
  const sentenceCount = routine.sentences?.length ?? 0;
  const grammarCount = routine.grammar?.length ?? 0;
  const dialogCount = routine.dialogs?.length ?? 0;

  // ✅ Done 페이지로 이동 + durationSec 계산 + 기본값 보정
  const goDonePage = (lastDialogResult) => {
    const durationSec = Math.max(
      0,
      Math.floor((Date.now() - startedAt) / 1000)
    );

    const safeWordResult = wordResult || { wordsDone: [], wordsKnown: [] };
    const safeSentenceResult =
      sentenceResult || { sentencesDone: [], sentencesKnown: [] };
    const safeGrammarResult =
      grammarResult || { grammarDone: [], grammarKnown: [] };
    const safeDialogResult =
      lastDialogResult || dialogResult || { dialogsDone: [], dialogsKnown: [] };

    nav("/app/today/done", {
      state: {
        routine,
        wordResult: safeWordResult,
        sentenceResult: safeSentenceResult,
        grammarResult: safeGrammarResult,
        dialogResult: safeDialogResult,
        durationSec,
      },
    });
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: 1 }}>
      <Stack spacing={2} sx={{ p: 1 }}>
        {/* 상단 진행 헤더 */}
        <Card>
          <CardContent>
            <Stack spacing={1.5}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography fontWeight={800}>오늘 공부</Typography>
                <Typography variant="caption" color="text.secondary">
                  {currentIdx + 1} / {steps.length}
                </Typography>
              </Stack>

              <Stepper activeStep={currentIdx} alternativeLabel>
                {steps.map((s) => (
                  <Step key={s.key}>
                    <StepLabel>{s.label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              <LinearProgress
                variant="determinate"
                value={((currentIdx + 1) / steps.length) * 100}
                sx={{ height: 8, borderRadius: 999 }}
              />
            </Stack>
          </CardContent>
        </Card>

        {/* 오늘의 단어 / 문장 / 문법 / 회화 - 한 줄 미니 버튼 카드 */}
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
          <StepMiniCard
            label="단어"
            value={`${wordCount}개`}
            active={step === "words"}
            onClick={() => setStep("words")}
          />
          <StepMiniCard
            label="문장"
            value={`${sentenceCount}개`}
            active={step === "sentences"}
            onClick={() => setStep("sentences")}
          />
          <StepMiniCard
            label="문법"
            value={`${grammarCount}개`}
            active={step === "grammar"}
            onClick={() => setStep("grammar")}
          />
          <StepMiniCard
            label="회화"
            value={`${dialogCount}개`}
            active={step === "dialogs"}
            onClick={() => setStep("dialogs")}
          />
        </Box>

        {/* 실제 학습 세션 (step에 따라 교체) */}
        {step === "words" && (
          <WordSession
            wordIds={routine.words}
            mode="today"
            onDone={(result) => {
              setWordResult(result);
              setStep("sentences");
            }}
          />
        )}

        {step === "sentences" && (
          <SentenceSession
            sentenceIds={routine.sentences}
            mode="today"
            onDone={(result) => {
              setSentenceResult(result);
              setStep("grammar");
            }}
          />
        )}

        {step === "grammar" && (
          <GrammarSession
            grammarIds={routine.grammar}
            mode="today"
            onDone={(result) => {
              setGrammarResult(result);
              setStep("dialogs");
            }}
          />
        )}

        {step === "dialogs" && (
          <DialogSession
            dialogIds={routine.dialogs}
            mode="today"
            onDone={(result) => {
              setDialogResult(result);
              goDonePage(result);
            }}
          />
        )}
      </Stack>
    </Box>
  );
}

/* ---------------------------------------------------- */
/*     StepMiniCard: 오늘 공부 4종 한 줄 버튼 스타일     */
/* ---------------------------------------------------- */
function StepMiniCard({ label, value, active, onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        flex: 1,
        minWidth: 0,
        borderRadius: 999,
        py: 1.1,
        px: 1,
        textAlign: "center",
        cursor: "pointer",
        bgcolor: active ? "primary.light" : "#F5F7FB",
        color: active ? "primary.main" : "text.primary",
        border: "1px solid",
        borderColor: active ? "primary.main" : "#E2E6F0",
        transition: "all 0.15s ease-out",
        "&:hover": {
          bgcolor: active ? "primary.light" : "#EDF1FB",
        },
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="subtitle1"
        fontWeight={800}
        sx={{ lineHeight: 1.3 }}
      >
        {value}
      </Typography>
    </Box>
  );
}
