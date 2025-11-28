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
  LinearProgress,
  IconButton,
  Grid,
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

  if (!routine) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary">
          데이터 없음
        </Typography>
      </Box>
    );
  }

  const dateKey = toDateKey(new Date());

  const wordsDone = wordResult?.wordsDone || [];
  const wordsKnown = wordResult?.wordsKnown || [];
  const grammarDone = grammarResult?.grammarDone || [];
  const dialogsDone = dialogResult?.dialogsDone || [];
  const sentencesDone = sentenceResult?.sentencesDone || [];

  const totalLearn =
    wordsDone.length + grammarDone.length + dialogsDone.length + sentencesDone.length;
  const totalKnown = wordsKnown.length;

const totalGoal =
  (routine.words?.length || 0) +
  (routine.sentences?.length || 0) +
  (routine.grammar?.length || 0) +
  (routine.dialogs?.length || 0);

  const learnedPct = totalGoal ? Math.round((totalLearn / totalGoal) * 100) : 0;
  const knownPct = totalGoal ? Math.round((totalKnown / totalGoal) * 100) : 0;

  const handleSaveAndGoHome = async () => {
    await saveUserHistory(user.uid, dateKey, {
      wordsDone,
      wordsKnown,
      grammarDone,
      dialogsDone,
      sentencesDone,
      durationSec,
    });
    nav("/app", { replace: true });
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: 1 }}>
      <Stack spacing={2.5} sx={{ p: 1 }}>
        {/* 상단 완료 */}
        <Card>
          <CardContent>
            <Stack spacing={2} alignItems="center" textAlign="center" sx={{ position: "relative" }}>
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
                <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
                  {totalGoal} 목표
                </Typography>
              </Stack>

              <Stack spacing={0.8}>
                <Typography variant="caption" color="text.secondary">
                  알고있다 {knownPct}% · 학습 {learnedPct}%
                </Typography>
                <Box sx={{ display: "flex", height: 10, borderRadius: 999, overflow: "hidden", bgcolor: "grey.100" }}>
                  <Box sx={{ width: `${knownPct}%`, bgcolor: "primary.main" }} />
                  <Box sx={{ width: `${learnedPct}%`, bgcolor: "secondary.main" }} />
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
