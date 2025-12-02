// src/app/pages/DoneToday.jsx
import { useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { saveUserHistory } from "../../firebase/db";
import { useAuth } from "../../providers/AuthProvider";
import { toDateKey } from "../../shared/utils/date";

// MUI
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  Chip,
  Grid,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ReplayIcon from "@mui/icons-material/Replay";

export default function DoneToday() {
  const { user } = useAuth();
  const { state } = useLocation();
  const nav = useNavigate();

  const {
    routine,
    wordResult,
    grammarResult,
    dialogResult,
    sentenceResult,
    durationSec = 0,
  } = state || {};

  // 디버그: 처음 들어올 때 전체 상태 찍기
  useEffect(() => {
    console.log("[DoneToday] mount", {
      user,
      hasRoutine: !!routine,
      wordResult,
      grammarResult,
      dialogResult,
      sentenceResult,
      durationSec,
    });
  }, [user, routine, wordResult, grammarResult, dialogResult, sentenceResult, durationSec]);

  if (!routine) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary">
          데이터 없음 (routine 누락)
        </Typography>
      </Box>
    );
  }

  const dateKey = toDateKey(new Date());

  const wordsDone = wordResult?.wordsDone || [];
  const wordsKnown = wordResult?.wordsKnown || [];

  const grammarDone = grammarResult?.grammarDone || [];
  const grammarKnown = grammarResult?.grammarKnown || [];

  const dialogsDone = dialogResult?.dialogsDone || [];
  const dialogsKnown = dialogResult?.dialogsKnown || [];

  const sentencesDone = sentenceResult?.sentencesDone || [];
  const sentencesKnown = sentenceResult?.sentencesKnown || [];

  const totalLearn =
    wordsDone.length +
    sentencesDone.length +
    grammarDone.length +
    dialogsDone.length;

  const totalKnown =
    wordsKnown.length +
    sentencesKnown.length +
    grammarKnown.length +
    dialogsKnown.length;

  const totalGoal =
    (routine.words?.length || 0) +
    (routine.sentences?.length || 0) +
    (routine.grammar?.length || 0) +
    (routine.dialogs?.length || 0);

  const learnedPct = totalGoal
    ? Math.round((totalLearn / totalGoal) * 100)
    : 0;
  const knownPct = totalGoal
    ? Math.round((totalKnown / totalGoal) * 100)
    : 0;

  // 🔒 중복 저장 방지용
  const savingRef = useRef(false);

  // ✅ 1) 페이지 진입 시 자동 저장 (한 번만)
  useEffect(() => {
    const autoSave = async () => {
      if (!user) {
        console.warn("[DoneToday] autoSave: user 없음, 저장 스킵");
        return;
      }
      if (savingRef.current) {
        console.log("[DoneToday] autoSave: 이미 저장 시도됨, 스킵");
        return;
      }
      savingRef.current = true;

      const payload = {
        wordsDone,
        wordsKnown,
        sentencesDone,
        sentencesKnown,
        grammarDone,
        grammarKnown,
        dialogsDone,
        dialogsKnown,
        durationSec,
      };

      try {
        console.log("[DoneToday] autoSave 시작", {
          uid: user.uid,
          dateKey,
          payload,
        });

        await saveUserHistory(user.uid, dateKey, payload);

        console.log("[DoneToday] autoSave 성공");
      } catch (err) {
        console.error("[DoneToday] autoSave 에러", err);
      }
    };

    autoSave();
  }, [
    user,
    dateKey,
    wordsDone,
    wordsKnown,
    sentencesDone,
    sentencesKnown,
    grammarDone,
    grammarKnown,
    dialogsDone,
    dialogsKnown,
    durationSec,
  ]);

  // ✅ 2) 버튼으로 강제 저장 + 홈 이동
  const handleSaveAndGoHome = async () => {
    if (!user) {
      console.warn("[DoneToday] handleSaveAndGoHome: user 없음");
      nav("/app", { replace: true });
      return;
    }

    const payload = {
      wordsDone,
      wordsKnown,
      sentencesDone,
      sentencesKnown,
      grammarDone,
      grammarKnown,
      dialogsDone,
      dialogsKnown,
      durationSec,
    };

    try {
      console.log("[DoneToday] 버튼 저장 시작", {
        uid: user.uid,
        dateKey,
        payload,
      });

      await saveUserHistory(user.uid, dateKey, payload);

      console.log("[DoneToday] 버튼 저장 성공");
    } catch (err) {
      console.error("[DoneToday] 버튼 저장 에러", err);
    } finally {
      nav("/app", { replace: true });
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: 1 }}>
      <Stack spacing={2.5} sx={{ p: 1 }}>
        {/* 상단 완료 카드 */}
        <Card>
          <CardContent>
            <Stack
              spacing={2}
              alignItems="center"
              textAlign="center"
              sx={{ position: "relative" }}
            >
              <IconButton
                onClick={handleSaveAndGoHome}
                sx={{ position: "absolute", left: 0, top: 0 }}
              >
                <CloseIcon />
              </IconButton>

              <Box
                sx={{
                  width: 76,
                  height: 76,
                  borderRadius: "50%",
                  bgcolor: "success.light",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <CheckCircleIcon color="success" sx={{ fontSize: 44 }} />
              </Box>

              <Typography variant="h6" fontWeight={800}>
                준비 완료! 잘했어!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                오늘 공부를 마무리했어. 내일도 가자.
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        {/* 점수 카드 */}
        <Grid container spacing={1.5}>
          <Grid item xs={6}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="caption" color="text.secondary">
                  학습
                </Typography>
                <Typography variant="h4" fontWeight={800} color="secondary.main">
                  +{totalLearn}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="caption" color="text.secondary">
                  알다
                </Typography>
                <Typography variant="h4" fontWeight={800} color="primary.main">
                  +{totalKnown}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* 진행바 */}
        <Card>
          <CardContent>
            <Stack spacing={1.2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  size="small"
                  label={`${totalKnown} 알다`}
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 700 }}
                />
                <Chip
                  size="small"
                  label={`${totalLearn} 학습`}
                  color="secondary"
                  variant="outlined"
                  sx={{ fontWeight: 700 }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ ml: "auto" }}
                >
                  {totalGoal} 목표
                </Typography>
              </Stack>

              <Stack spacing={0.8}>
                <Typography variant="caption" color="text.secondary">
                  알고있다 {knownPct}% · 학습 {learnedPct}%
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    height: 10,
                    borderRadius: 999,
                    overflow: "hidden",
                    bgcolor: "grey.100",
                  }}
                >
                  <Box sx={{ width: `${knownPct}%`, bgcolor: "primary.main" }} />
                  <Box
                    sx={{ width: `${learnedPct}%`, bgcolor: "secondary.main" }}
                  />
                </Box>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Typography variant="body2" color="text.secondary" textAlign="center">
          어떤 종류의 학습을 선호하시나요?
        </Typography>

        <Stack spacing={1.2}>
          <Button
            variant="outlined"
            size="large"
            startIcon={<ReplayIcon />}
            onClick={() => nav("/app/review")}
            sx={{ py: 1.4, fontWeight: 800 }}
          >
            복습하기
          </Button>
          <Button
            variant="contained"
            size="large"
            onClick={handleSaveAndGoHome}
            sx={{ py: 1.4, fontWeight: 800 }}
          >
            홈으로
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
