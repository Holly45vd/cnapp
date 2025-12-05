// src/app/components/review/RandomQuizPanel.jsx
import {
  Card,
  CardContent,
  Stack,
  Typography,
  Chip,
  LinearProgress,
  Button,
  Box,
} from "@mui/material";
import QuizIcon from "@mui/icons-material/Quiz";
import HomeIcon from "@mui/icons-material/Home";
import TodayIcon from "@mui/icons-material/Today";

export default function RandomQuizPanel({
  questions,
  currentIdx,
  selected,
  isCorrect,
  finished,
  correctCount,
  onSelect,
  onNext,
  onGoHome,
  onGoToReview,
}) {
  if (!questions.length) {
    return (
      <Card>
        <CardContent>
          <Stack spacing={2} alignItems="center">
            <Typography variant="h6" fontWeight={800}>
              출제할 복습 대상이 없습니다.
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
            >
              최근 7일 동안 학습 데이터가 부족하거나,  
              모든 항목이 이미 Master로 표시된 상태일 수 있어.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<TodayIcon />}
              onClick={onGoToReview}
            >
              날짜별 복습 보기
            </Button>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  const currentQ = questions[currentIdx];
  const progressPct = Math.round((currentIdx / questions.length) * 100);

  if (finished) {
    const total = questions.length;
    const scorePct = Math.round((correctCount / total) * 100);

    return (
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <QuizIcon />
              <Typography variant="h6" fontWeight={800}>
                복습 퀴즈 결과
              </Typography>
            </Stack>

            <Typography variant="h5" fontWeight={800}>
              {correctCount} / {total} 문제 정답
            </Typography>
            <Typography variant="body2" color="text.secondary">
              정답률 {scorePct}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={scorePct}
              sx={{ height: 10, borderRadius: 999 }}
            />

            <Typography variant="body2">
              🔁 틀린 문제에 나온 단어/문장/문법/회화를 위주로 한 번 더 복습해 줘.
            </Typography>

            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                fullWidth
                onClick={onGoToReview}
                startIcon={<TodayIcon />}
              >
                기록으로 가기
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => window.location.reload()}
              >
                다시 풀기
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          {/* 헤더 */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <QuizIcon />
            <Typography variant="h6" fontWeight={800}>
              복습 퀴즈 (지난 7일)
            </Typography>
            <Chip
              size="small"
              label={`${currentIdx + 1} / ${questions.length}`}
            />
          </Stack>

          <LinearProgress
            variant="determinate"
            value={progressPct}
            sx={{ height: 8, borderRadius: 999 }}
          />

          {/* 문제 */}
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              {currentQ?.prompt}
            </Typography>

            <Typography variant="h5" fontWeight={800}>
              {currentQ?.stem}
            </Typography>
            {currentQ?.stemSub && (
              <Typography variant="body2" color="text.secondary">
                {currentQ.stemSub}
              </Typography>
            )}

            <Stack spacing={1.2} sx={{ mt: 2 }}>
              {currentQ?.options.map((opt) => {
                const selectedThis = selected === opt;
                let variant = "outlined";
                let color = "primary";

                if (selected != null) {
                  if (opt === currentQ.correct) {
                    variant = "contained";
                    color = "success";
                  } else if (selectedThis && opt !== currentQ.correct) {
                    variant = "contained";
                    color = "error";
                  }
                } else if (selectedThis) {
                  variant = "contained";
                }

                return (
                  <Button
                    key={opt}
                    variant={variant}
                    color={color}
                    onClick={() => onSelect(opt)}
                    sx={{ justifyContent: "flex-start", borderRadius: 2 }}
                  >
                    {opt}
                  </Button>
                );
              })}
            </Stack>

            {selected != null && (
              <Typography
                variant="body2"
                sx={{ mt: 1 }}
                color={isCorrect ? "success.main" : "error.main"}
              >
                {isCorrect
                  ? "정답입니다! 👏"
                  : `오답입니다. 정답: ${currentQ?.correct}`}
              </Typography>
            )}

            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<HomeIcon />}
                onClick={onGoHome}
              >
                홈으로
              </Button>
              <Box sx={{ flex: 1 }} />
              <Button
                variant="contained"
                disabled={selected == null}
                onClick={onNext}
              >
                {currentIdx + 1 >= questions.length ? "결과 보기" : "다음 문제"}
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
