// /src/layouts/AppLayout.jsx
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Box,
} from "@mui/material";

import HomeIcon from "@mui/icons-material/Home";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import ReplayIcon from "@mui/icons-material/Replay";
import BarChartIcon from "@mui/icons-material/BarChart";
import PersonIcon from "@mui/icons-material/Person";

export default function AppLayout() {
  const nav = useNavigate();
  const location = useLocation();

  // 현재 path → navigation value로 변환
  const current = (() => {
    if (location.pathname.startsWith("/app/today")) return "today";
    if (location.pathname.startsWith("/app/review")) return "review";
    if (location.pathname.startsWith("/app/history")) return "history";
    if (location.pathname.startsWith("/app/mypage")) return "mypage";
    return "home";
  })();

  const handleChange = (_, value) => {
    nav(`/app/${value === "home" ? "" : value}`);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        pb: 8, // bottom nav height만큼 공간 확보
        bgcolor: "background.default",
      }}
    >
      {/* Main Content */}
      <Box sx={{ p: 2 }}>
        <Outlet />
      </Box>

      {/* Bottom Navigation */}
      <Paper
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          borderRadius: 0,
        }}
        elevation={6}
      >
        <BottomNavigation value={current} onChange={handleChange}>
          <BottomNavigationAction
            value="home"
            label="홈"
            icon={<HomeIcon />}
          />
          <BottomNavigationAction
            value="today"
            label="오늘공부"
            icon={<AutoStoriesIcon />}
          />
          <BottomNavigationAction
            value="review"
            label="복습"
            icon={<ReplayIcon />}
          />
          <BottomNavigationAction
            value="history"
            label="기록"
            icon={<BarChartIcon />}
          />
          <BottomNavigationAction
            value="mypage"
            label="마이"
            icon={<PersonIcon />}
          />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
