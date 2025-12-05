// src/app/components/WeeklyHistorySection.jsx
import {
  Box,
  Stack,
  Typography,
  Chip,
  Grid,
  Divider,
} from "@mui/material";

function formatDateLabel(dateKey) {
  if (!dateKey) return "";
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][dt.getDay()];
  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${mm}/${dd} (${weekday})`;
}

/**
 * props:
 *  - trend: [{ dateKey, words, sentences, grammar, dialogs, total }]
 *  - onSelectDate?: (dateKey) => void   // 클릭 시 호출
 */
export default function WeeklyHistorySection({ trend = [], onSelectDate }) {
  const hasTrend = trend && trend.length > 0;

  return (
    <Stack spacing={1.5}>
      {/* 헤더 */}
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight={800}>지난 7일 상세 기록</Typography>
        <Chip size="small" label="Detail" />
      </Stack>


      {!hasTrend && (
        <Typography variant="body2" color="text.secondary">
          아직 지난 7일 동안의 학습 기록이 없습니다.
        </Typography>
      )}

      {hasTrend && (
        <Stack spacing={1.2}>
          {trend.map((d) => {
            const label = formatDateLabel(d.dateKey);
            const total = d.total || 0;
            const isZero = total === 0;
            const clickable = !!onSelectDate && !isZero;

            return (
              <Box
                key={d.dateKey}
                onClick={() => {
                  if (clickable) onSelectDate(d.dateKey);
                }}
                sx={{
                  borderRadius: 2,
                  border: "1px solid #eee",
                  p: 1.4,
                  bgcolor: isZero ? "grey.50" : "background.default",
                  cursor: clickable ? "pointer" : "default",
                  transition: "all 0.15s ease",
                  "&:hover": clickable
                    ? { boxShadow: 1, borderColor: "primary.light" }
                    : undefined,
                }}
              >
                {/* 날짜 & 총량 */}
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Typography variant="subtitle2" fontWeight={700}>
                    {label}
                  </Typography>
                  <Chip
                    size="small"
                    variant={isZero ? "outlined" : "filled"}
                    label={isZero ? "학습 없음" : `총 ${total}개 학습`}
                    color={isZero ? "default" : "primary"}
                  />
                </Stack>

                <Divider sx={{ my: 1 }} />

                {isZero ? (
                  <Typography variant="caption" color="text.secondary">
                    이 날은 기록된 학습이 없습니다.
                  </Typography>
                ) : (
                  <>
<Grid
  container
  spacing={1.5}
  justifyContent="center"   // 🔹 전체를 가운데로 모으기
>
  <CategoryStat label="단어" value={d.words || 0} />
  <CategoryStat label="문장" value={d.sentences || 0} />
  <CategoryStat label="문법" value={d.grammar || 0} />
  <CategoryStat label="회화" value={d.dialogs || 0} />
</Grid>

                    {clickable && (
                      <Typography
                        variant="caption"
                        color="primary"
                        sx={{ mt: 0.5, display: "block" }}
                      >
                      </Typography>
                    )}
                  </>
                )}
              </Box>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}


// 🔹 한 날 안에서 카테고리별 카운트
function CategoryStat({ label, value }) {
  return (
    <Grid item xs={6} sx={{ display: "flex", justifyContent: "center" }}>
      <Box
        sx={{
          bgcolor: "grey.50",
          borderRadius: "999px",
          p: 1.1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid #eef0f5",
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mb: 0.3 }}   // margin 아주 미세하게만 유지
        >
          {label}
        </Typography>

        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "white",
          }}
        >
          <Typography variant="subtitle2" fontWeight={800}>
            {value}개
          </Typography>
        </Box>
      </Box>
    </Grid>
  );
}
