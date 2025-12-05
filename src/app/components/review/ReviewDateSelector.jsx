// src/app/components/review/ReviewDateSelector.jsx
import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  Chip,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import HistoryIcon from "@mui/icons-material/History";

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
 *  - selectedDateKey: 현재 선택된 날짜("YYYY-MM-DD")
 *  - onChangeDateKey: (dateKey: string) => void
 *  - availableDates: string[]  // 실제 학습 기록이 있는 날짜 목록
 */
export default function ReviewDateSelector({
  selectedDateKey,
  onChangeDateKey,
  availableDates = [],
}) {
  const hasAnyHistory = availableDates.length > 0;
  const selectedHasHistory =
    !!selectedDateKey && availableDates.includes(selectedDateKey);

  // 최신순 정렬
  const sortedDates = [...availableDates].sort((a, b) =>
    b.localeCompare(a)
  );
  const recentDates = sortedDates.slice(0, 7);

  // 누적 공부일
  const totalStudyDays = availableDates.length;

  // 팝업 상태
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);

  const handleDateInputChange = (e) => {
    const value = e.target.value; // "YYYY-MM-DD"
    if (!value) return;
    onChangeDateKey && onChangeDateKey(value);
  };

  const handleSelectFromDialog = (dateKey) => {
    onChangeDateKey && onChangeDateKey(dateKey);
    setOpenHistoryDialog(false);
  };

  return (
    <>
      <Card>
        <CardContent>
          <Stack spacing={1.5}>
            {/* 헤더 + 누적 공부일 버튼 */}
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={1}
            >
              <Typography variant="subtitle1" fontWeight={700}>
                복습 날짜 선택
              </Typography>

              <Button
                size="small"
                variant="outlined"
                startIcon={<HistoryIcon fontSize="small" />}
                disabled={!hasAnyHistory}
                onClick={() => setOpenHistoryDialog(true)}
              >
                누적 {totalStudyDays}일 공부
              </Button>
            </Stack>

            {/* 안내 문구 */}
            {!hasAnyHistory && (
              <Typography variant="body2" color="text.secondary">
                아직 기록된 학습 날짜가 없습니다. 오늘 공부를 마치면 이곳에서
                복습 날짜를 선택할 수 있어요.
              </Typography>
            )}

            {hasAnyHistory && !selectedDateKey && (
              <Typography variant="body2" color="text.secondary">
                복습할 날짜를 선택해주세요.
              </Typography>
            )}

            {hasAnyHistory && selectedDateKey && !selectedHasHistory && (
              <Typography variant="body2" color="text.secondary">
                {selectedDateKey}에는 학습 기록이 없습니다. 아래에서 다른 날짜를
                선택해주세요.
              </Typography>
            )}

            {/* 달력 선택 (HTML5 date input) */}
            {hasAnyHistory && (
              <Stack direction="row" spacing={1.5} alignItems="center">
                <CalendarMonthIcon fontSize="small" color="action" />
                <TextField
                  type="date"
                  size="small"
                  value={selectedDateKey || ""}
                  onChange={handleDateInputChange}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Stack>
            )}

            

            {/* (옵션) 전체 날짜가 7일보다 많으면 안내 문구만 추가 */}
            {hasAnyHistory && sortedDates.length > 7 && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                * 최근 7일만 표시 중입니다. 모든 기록은 상단 “누적 {totalStudyDays}
                일 공부” 버튼에서 날짜별로 확인할 수 있어요.
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* 누적 공부일 팝업 다이얼로그 */}
      <Dialog
        open={openHistoryDialog}
        onClose={() => setOpenHistoryDialog(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>지금까지 공부한 날짜</DialogTitle>
        <DialogContent>
          {!hasAnyHistory ? (
            <Typography variant="body2" color="text.secondary">
              아직 기록된 학습 날짜가 없습니다.
            </Typography>
          ) : (
            <Stack spacing={1.5} sx={{ mt: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                날짜를 선택하면 해당 날짜의 복습 내용이 아래 화면에 표시됩니다.
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 0.8,
                  mt: 0.5,
                }}
              >
                {sortedDates.map((key) => (
                  <Chip
                    key={key}
                    size="small"
                    label={formatDateLabel(key)}
                    color={selectedDateKey === key ? "primary" : "default"}
                    onClick={() => handleSelectFromDialog(key)}
                  />
                ))}
              </Box>
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
