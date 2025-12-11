import React from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  Link as RouterLink,
} from "react-router-dom";
import { logout } from "../firebase/auth";

// MUI
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  IconButton,
  Stack,
  Button,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import StorageIcon from "@mui/icons-material/Storage";
import ArticleIcon from "@mui/icons-material/Article";
import ForumIcon from "@mui/icons-material/Forum";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CloudUploadIcon from "@mui/icons-material/CloudUpload"; // 🔹 HSK 업로드용 아이콘
import LabelIcon from "@mui/icons-material/Label"; // (선택) HSK 단어 관리용 아이콘

const drawerWidth = 240;

export default function AdminLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // 🔹 어드민 메뉴 목록
  const nav = [
    { to: "/admin", label: "홈", icon: <DashboardIcon fontSize="small" /> },
    { to: "/admin/words", label: "단어", icon: <StorageIcon fontSize="small" /> },
    { to: "/admin/sentences", label: "문장", icon: <ArticleIcon fontSize="small" /> },
    { to: "/admin/dialogs", label: "회화", icon: <ForumIcon fontSize="small" /> },
    { to: "/admin/grammar", label: "문법", icon: <MenuBookIcon fontSize="small" /> },

    // ✅ HSK JSON → Firestore 업로드 페이지
    { to: "/admin/hsk-import", label: "HSK 업로드", icon: <CloudUploadIcon fontSize="small" /> },


  // { to: "/admin/hsk-words", label: "HSK 단어", icon: <LabelIcon fontSize="small" /> },
   { to: "/admin/hsk-missing", label: "HSK 미등록", icon: <StorageIcon fontSize="small" /> },
  ];

  const handleDrawerToggle = () => setMobileOpen((p) => !p);

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Drawer header (클릭하면 /admin 홈) */}
      <Box
        component={RouterLink}
        to="/admin"
        onClick={() => setMobileOpen(false)}
        sx={{
          p: 2,
          textDecoration: "none",
          color: "inherit",
          cursor: "pointer",
          "&:hover": { bgcolor: "grey.100" },
        }}
      >
        <Typography variant="h6" fontWeight={800}>
          CN Admin
        </Typography>
        <Typography variant="caption" color="text.secondary">
          데이터 등록 · 자동매핑 · 관리
        </Typography>
      </Box>

      <Divider />

      {/* Nav list */}
      <List sx={{ px: 1 }}>
        {nav.map((n) => {
          // ✅ /admin은 exact match, 나머지는 startsWith
          const active =
            n.to === "/admin"
              ? location.pathname === "/admin"
              : location.pathname.startsWith(n.to);

          return (
            <ListItemButton
              key={n.to}
              component={NavLink}
              to={n.to}
              selected={active}
              onClick={() => setMobileOpen(false)}
              sx={{
                borderRadius: 2,
                my: 0.5,
                "&.Mui-selected": {
                  bgcolor: "black",
                  color: "white",
                  "& .MuiListItemText-primary": { fontWeight: 800 },
                },
                "&.Mui-selected:hover": { bgcolor: "black" },
              }}
            >
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ width: "100%" }}
              >
                {n.icon}
                <ListItemText primary={n.label} />
              </Stack>
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ flex: 1 }} />

      <Divider />

      {/* Logout */}
      <Box sx={{ p: 2 }}>
        <Button
          variant="outlined"
          fullWidth
          color="inherit"
          startIcon={<LogoutIcon />}
          onClick={logout}
          sx={{ borderRadius: 2, fontWeight: 700 }}
        >
          로그아웃
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "grey.50" }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: "white",
          color: "black",
          borderBottom: "1px solid #eee",
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          {/* Mobile menu button */}
          <IconButton
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          {/* AppBar title (클릭하면 /admin 홈) */}
          <Typography
            component={RouterLink}
            to="/admin"
            variant="h6"
            fontWeight={800}
            sx={{
              textDecoration: "none",
              color: "inherit",
              cursor: "pointer",
              "&:hover": { opacity: 0.7 },
            }}
          >
            Admin
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {location.pathname}
          </Typography>

          <Box sx={{ flex: 1 }} />

          <Button
            onClick={logout}
            startIcon={<LogoutIcon />}
            sx={{ fontWeight: 700 }}
          >
            로그아웃
          </Button>
        </Toolbar>
      </AppBar>

      {/* Drawer - desktop */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: "1px solid #eee",
            // ✅ AppBar 높이만큼 위 여백 확보
            pt: "64px", // 기본 Toolbar height(데스크탑)
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>

      {/* Drawer - mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            pt: "56px", // 모바일 Toolbar height
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Main */}
      <Box component="main" sx={{ flex: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
