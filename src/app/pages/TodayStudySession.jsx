// src/app/pages/TodayStudySession.jsx

import { useEffect, useMemo, useState } from "react";
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

  const [startedAt] = useState(() => Date.now());
  const durationSec = useMemo(
    () => Math.max(0, Math.floor((Date.now() - startedAt) / 1000)),
    [startedAt, step]
  );

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

        {/* 오늘의 단어 / 문장 / 문법 / 회화 카드 */}
        <Stack
          spacing={1.5}
          direction={{ xs: "column", md: "row" }}
          sx={{ mt: 0.5 }}
        >
          {/* 단어 카드 */}
          <Card
            onClick={() => setStep("words")}
            sx={{
              flex: 1,
              borderRadius: 3,
              cursor: "pointer",
              border:
                step === "words" ? "2px solid #1976d2" : "1px solid #eee",
            }}
          >
            <CardContent>
              <Stack spacing={0.5}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600 }}
                >
                  단어
                </Typography>
                <Typography variant="h6" fontWeight={800}>
                  {wordCount}개
                </Typography>

              </Stack>
            </CardContent>
          </Card>

          {/* 문장 카드 */}
          <Card
            onClick={() => setStep("sentences")}
            sx={{
              flex: 1,
              borderRadius: 3,
              cursor: "pointer",
              border:
                step === "sentences" ? "2px solid #1976d2" : "1px solid #eee",
            }}
          >
            <CardContent>
              <Stack spacing={0.5}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600 }}
                >
                  문장
                </Typography>
                <Typography variant="h6" fontWeight={800}>
                  {sentenceCount}개
                </Typography>

              </Stack>
            </CardContent>
          </Card>

          {/* 문법 카드 */}
          <Card
            onClick={() => setStep("grammar")}
            sx={{
              flex: 1,
              borderRadius: 3,
              cursor: "pointer",
              border:
                step === "grammar" ? "2px solid #1976d2" : "1px solid #eee",
            }}
          >
            <CardContent>
              <Stack spacing={0.5}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600 }}
                >
                  문법
                </Typography>
                <Typography variant="h6" fontWeight={800}>
                  {grammarCount}개
                </Typography>

              </Stack>
            </CardContent>
          </Card>

          {/* 회화 카드 */}
          <Card
            onClick={() => setStep("dialogs")}
            sx={{
              flex: 1,
              borderRadius: 3,
              cursor: "pointer",
              border:
                step === "dialogs" ? "2px solid #1976d2" : "1px solid #eee",
            }}
          >
            <CardContent>
              <Stack spacing={0.5}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600 }}
                >
                  회화
                </Typography>
                <Typography variant="h6" fontWeight={800}>
                  {dialogCount}개
                </Typography>

              </Stack>
            </CardContent>
          </Card>
        </Stack>

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
              nav("/app/today/done", {
                state: {
                  routine,
                  wordResult,
                  sentenceResult,
                  grammarResult,
                  dialogResult: result,
                  durationSec,
                },
              });
            }}
          />
        )}
      </Stack>
    </Box>
  );
}
