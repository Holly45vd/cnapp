// /src/theme.js
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#2563EB" },        // Admin & App 공통 Blue
    secondary: { main: "#F59E0B" },      // Amber
    background: {
      default: "#F6F7FB",                // Admin grey.50
      paper: "#FFFFFF",
    },
    text: {
      primary: "#111",
      secondary: "#666",
    },
  },

  shape: {
    borderRadius: 16, // 카드/버튼 라운드 느낌 통일
  },

  typography: {
    fontFamily: `"Pretendard", "Noto Sans KR", system-ui, sans-serif`,
    fontWeightBold: 800,
  },

  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          border: "1px solid #E5E7EB",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 700,
          textTransform: "none",
        },
      },
    },
  },
});

export default theme;
