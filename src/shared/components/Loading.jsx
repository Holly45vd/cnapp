// src/shared/components/Loading.jsx
import { Box, CircularProgress, Typography } from "@mui/material";

/**
 * Loading
 * - 페이지 또는 섹션에서 데이터를 로딩할 때 표시
 * - 중앙 정렬 + 일관된 스타일
 */

export default function Loading({ message = "불러오는 중…" }) {
  return (
    <Box
      sx={{
        p: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        minHeight: "120px",
        gap: 1.5,
      }}
    >
      <CircularProgress size={32} thickness={4} />

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontWeight: 500 }}
      >
        {message}
      </Typography>
    </Box>
  );
}
