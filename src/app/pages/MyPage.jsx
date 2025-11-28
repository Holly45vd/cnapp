import { useState } from "react";
import { useAuth } from "../../providers/AuthProvider";
import { logout } from "../../firebase/auth";
import { useNavigate } from "react-router-dom";

// Firebase Auth
import {
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { auth } from "../../firebase/firebase";

// MUI
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Avatar,
  Button,
  Divider,
  Chip,
  Switch,
  FormControlLabel,
  TextField,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import PersonIcon from "@mui/icons-material/Person";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PaletteIcon from "@mui/icons-material/Palette";
import LogoutIcon from "@mui/icons-material/Logout";
import EditIcon from "@mui/icons-material/Edit";
import LockIcon from "@mui/icons-material/Lock";

export default function MyPage() {
  const { user } = useAuth();
  const nav = useNavigate();

  // ----- 닉네임 변경 상태 -----
  const [openName, setOpenName] = useState(false);
  const [newName, setNewName] = useState(user?.displayName || "");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameMsg, setNameMsg] = useState("");

  // ----- 비밀번호 변경 상태 -----
  const [openPw, setOpenPw] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState("");

  const handleLogout = async () => {
    await logout();
    nav("/", { replace: true });
  };

  // ===== 닉네임 저장 =====
  const handleSaveName = async () => {
    setNameMsg("");
    if (!newName.trim()) {
      setNameMsg("닉네임을 입력해줘.");
      return;
    }
    if (!auth.currentUser) {
      setNameMsg("로그인 정보를 찾을 수 없음");
      return;
    }

    try {
      setNameLoading(true);
      await updateProfile(auth.currentUser, { displayName: newName.trim() });
      setNameMsg("닉네임이 변경됐어.");
      setOpenName(false);
    } catch (e) {
      console.error(e);
      setNameMsg(e.message || "닉네임 변경 실패");
    } finally {
      setNameLoading(false);
    }
  };

  // ===== 비밀번호 저장 (재인증 포함) =====
  const handleSavePassword = async () => {
    setPwMsg("");

    if (!currentPw || !newPw || !newPw2) {
      setPwMsg("현재 비밀번호와 새 비밀번호를 모두 입력해줘.");
      return;
    }
    if (newPw !== newPw2) {
      setPwMsg("새 비밀번호 확인이 서로 달라.");
      return;
    }
    if (newPw.length < 6) {
      setPwMsg("새 비밀번호는 6자 이상이어야 해.");
      return;
    }
    if (!auth.currentUser || !auth.currentUser.email) {
      setPwMsg("로그인 정보를 찾을 수 없음");
      return;
    }

    try {
      setPwLoading(true);

      // 1) 재인증
      const cred = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPw
      );
      await reauthenticateWithCredential(auth.currentUser, cred);

      // 2) 비밀번호 변경
      await updatePassword(auth.currentUser, newPw);

      setPwMsg("비밀번호가 변경됐어.");
      setOpenPw(false);

      // 입력 초기화
      setCurrentPw("");
      setNewPw("");
      setNewPw2("");
    } catch (e) {
      console.error(e);
      // 흔한 케이스: 재인증 실패 / 너무 오래된 로그인
      setPwMsg(e.message || "비밀번호 변경 실패");
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: 1 }}>
      <Stack spacing={2.5} sx={{ p: 1 }}>
        {/* 헤더 */}
        <Typography variant="h5" fontWeight={800}>
          마이페이지
        </Typography>

        {/* 프로필 카드 */}
        <Card>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ width: 56, height: 56, bgcolor: "grey.100" }}>
                <PersonIcon />
              </Avatar>

              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={800}>
                  {user?.displayName || user?.email?.split("@")?.[0]}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user?.email}
                </Typography>
                <Chip
                  size="small"
                  label="learner"
                  variant="outlined"
                  sx={{ mt: 0.8 }}
                />
              </Box>

              <Button
                variant="outlined"
                size="small"
                startIcon={<EditIcon />}
                onClick={() => {
                  setNewName(user?.displayName || "");
                  setNameMsg("");
                  setOpenName(true);
                }}
                sx={{ fontWeight: 800 }}
              >
                닉네임 수정
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* 비밀번호 변경 */}
        <Card>
          <CardContent>
            <Stack spacing={1.2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <LockIcon fontSize="small" />
                <Typography fontWeight={800}>비밀번호</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                보안을 위해 비밀번호는 주기적으로 변경하는 게 좋아.
              </Typography>

              <Button
                variant="outlined"
                onClick={() => {
                  setPwMsg("");
                  setOpenPw(true);
                }}
                sx={{ fontWeight: 800, width: "fit-content" }}
              >
                비밀번호 변경
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* 목표/학습 설정 (더미) */}
        <Card>
          <CardContent>
            <Stack spacing={1.5}>
              <Typography fontWeight={800}>학습 목표</Typography>
              <Typography variant="body2" color="text.secondary">
                지금은 기본 루틴(단어/문법/회화)으로 진행 중.<br />
              </Typography>

              <Stack direction="row" spacing={1}>
                <Chip size="small" label="단어 6" />
                <Chip size="small" label="문법 1" />
                <Chip size="small" label="회화 2" />
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* 알림 설정 (더미) */}
        <Card>
          <CardContent>
            <Stack spacing={1.2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <NotificationsIcon fontSize="small" />
                <Typography fontWeight={800}>알림</Typography>
              </Stack>

              <FormControlLabel
                control={<Switch defaultChecked />}
                label="매일 학습 알림"
              />
              <FormControlLabel control={<Switch />} label="복습 리마인드" />
            </Stack>
          </CardContent>
        </Card>

       
        <Divider />

        {/* 로그아웃 */}
        <Button
          fullWidth
          variant="contained"
          color="inherit"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{ fontWeight: 800, borderRadius: 2, py: 1.3 }}
        >
          로그아웃
        </Button>
      </Stack>

      {/* ===== 닉네임 수정 다이얼로그 ===== */}
      <Dialog open={openName} onClose={() => setOpenName(false)} fullWidth>
        <DialogTitle>닉네임 수정</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="새 닉네임"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              fullWidth
              autoFocus
            />
            {nameMsg && (
              <Alert severity={nameMsg.includes("변경") ? "success" : "error"}>
                {nameMsg}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenName(false)}>취소</Button>
          <Button
            variant="contained"
            onClick={handleSaveName}
            disabled={nameLoading}
            sx={{ fontWeight: 800 }}
          >
            {nameLoading ? "저장 중..." : "저장"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== 비밀번호 수정 다이얼로그 ===== */}
      <Dialog open={openPw} onClose={() => setOpenPw(false)} fullWidth>
        <DialogTitle>비밀번호 변경</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="현재 비밀번호"
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              fullWidth
              autoFocus
            />
            <TextField
              label="새 비밀번호"
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              fullWidth
            />
            <TextField
              label="새 비밀번호 확인"
              type="password"
              value={newPw2}
              onChange={(e) => setNewPw2(e.target.value)}
              fullWidth
            />
            {pwMsg && (
              <Alert severity={pwMsg.includes("변경") ? "success" : "error"}>
                {pwMsg}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenPw(false)}>취소</Button>
          <Button
            variant="contained"
            onClick={handleSavePassword}
            disabled={pwLoading}
            sx={{ fontWeight: 800 }}
          >
            {pwLoading ? "변경 중..." : "변경"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
