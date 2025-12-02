// src/shared/components/ErrorBox.jsx
import { Box, Typography, Alert } from "@mui/material";

/**
 * ErrorBox
 * - WeeklyHistorySection, API 오류, 데이터 누락 등 상황에서 사용
 * - error 메시지를 표시하는 공용 컴포넌트
 */

export default function ErrorBox({ message = "오류가 발생했습니다.", detail }) {
  return (
    <Box sx={{ p: 2 }}>
      <Alert severity="error" sx={{ mb: detail ? 1 : 0 }}>
        {message}
      </Alert>

      {detail && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            opacity: 0.8,
          }}
        >
          {detail}
        </Typography>
      )}
    </Box>
  );
}
