import { useState, useEffect } from "react";
import { useAuth } from "../../providers/AuthProvider";
import { logout } from "../../firebase/auth";
import { useNavigate } from "react-router-dom";
import { getTtsConfig, setTtsConfig } from "../../lib/ttsHelper";

// Firebase Auth
import {
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { auth } from "../../firebase/firebase";

// 🔹 Daily Routine 설정용 import
import {
  getRoutineConfig,
  saveRoutineConfig,
} from "../../firebase/db";

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
  Slider
} from "@mui/material";

import PersonIcon from "@mui/icons-material/Person";
import NotificationsIcon from "@mui/icons-material/Notifications";
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

  // ----- Daily Routine 설정 상태 -----
  const [routineConfig, setRoutineConfig] = useState({
    wordCount: 5,
    sentenceCount: 5,
    grammarCount: 1,
    dialogCount: 1,
  });
  const [routineLoading, setRoutineLoading] = useState(false);
  const [routineMsg, setRoutineMsg] = useState("");

  // 최초 진입 시 설정 불러오기
  useEffect(() => {
    (async () => {
      try {
        setRoutineLoading(true);
        const cfg = await getRoutineConfig();
        setRoutineConfig(cfg);
      } catch (e) {
        console.error(e);
        setRoutineMsg("학습량 설정을 불러오지 못했어.");
      } finally {
        setRoutineLoading(false);
      }
    })();
  }, []);

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
      setPwMsg(e.message || "비밀번호 변경 실패");
    } finally {
      setPwLoading(false);
    }
  };

  // ===== Daily Routine 저장 =====
  const handleSaveRoutine = async () => {
    try {
      setRoutineMsg("");
      setRoutineLoading(true);
      await saveRoutineConfig(routineConfig);
      setRoutineMsg("하루 학습량 설정이 저장됐어. 다음 루틴부터 적용돼.");
    } catch (e) {
      console.error(e);
      setRoutineMsg(e.message || "하루 학습량 저장에 실패했어.");
    } finally {
      setRoutineLoading(false);
    }
  };
  // ----- TTS 설정 상태 -----
  const [ttsConfig, setTtsConfigState] = useState({
    gender: "default", // "default" | "male" | "female"
    rate: 1,           // 0.7 ~ 1.2 정도 권장
  });
  const [ttsMsg, setTtsMsg] = useState("");

  // 마운트 시 localStorage에서 기존 설정 불러오기
  useEffect(() => {
    const cfg = getTtsConfig();
    setTtsConfigState({
      gender: cfg.gender || "default",
      rate: typeof cfg.rate === "number" ? cfg.rate : 1,
    });
  }, []);
  // ===== TTS 설정 저장 =====
const handleSaveTts = () => {
  setTtsMsg("");
  const clampedRate = Math.min(
    2,
    Math.max(0.5, Number(ttsConfig.rate) || 1)
  );

  setTtsConfig({
    gender: ttsConfig.gender || "default",
    rate: clampedRate,
  });

  setTtsMsg("음성 설정이 저장됐어. 다음 발음부터 적용돼.");
  setTtsConfigState((prev) => ({ ...prev, rate: clampedRate }));
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

        {/* 🔹 하루 학습량 설정 카드 */}
        <Card>
          <CardContent>
            <Stack spacing={1.5}>
              <Typography fontWeight={800}>하루 학습량 설정</Typography>
              <Typography variant="body2" color="text.secondary">
                오늘 공부 루틴에서 사용할 단어·문장·문법·회화 개수를 설정해.
                너무 많으면 지치고, 너무 적으면 성장이 느려져.
              </Typography>

              <Stack direction="row" spacing={1.5}>
                <TextField
                  label="단어 개수"
                  type="number"
                  size="small"
                  value={routineConfig.wordCount}
                  onChange={(e) =>
                    setRoutineConfig((prev) => ({
                      ...prev,
                      wordCount: Number(e.target.value),
                    }))
                  }
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="문장 개수"
                  type="number"
                  size="small"
                  value={routineConfig.sentenceCount}
                  onChange={(e) =>
                    setRoutineConfig((prev) => ({
                      ...prev,
                      sentenceCount: Number(e.target.value),
                    }))
                  }
                  sx={{ flex: 1 }}
                />
              </Stack>

              <Stack direction="row" spacing={1.5}>
                <TextField
                  label="문법 개수"
                  type="number"
                  size="small"
                  value={routineConfig.grammarCount}
                  onChange={(e) =>
                    setRoutineConfig((prev) => ({
                      ...prev,
                      grammarCount: Number(e.target.value),
                    }))
                  }
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="회화 개수"
                  type="number"
                  size="small"
                  value={routineConfig.dialogCount}
                  onChange={(e) =>
                    setRoutineConfig((prev) => ({
                      ...prev,
                      dialogCount: Number(e.target.value),
                    }))
                  }
                  sx={{ flex: 1 }}
                />
              </Stack>

              {routineMsg && (
                <Alert
                  severity={
                    routineMsg.includes("저장됐어") ? "success" : "error"
                  }
                >
                  {routineMsg}
                </Alert>
              )}

              <Button
                variant="contained"
                onClick={handleSaveRoutine}
                disabled={routineLoading}
                sx={{ fontWeight: 800, alignSelf: "flex-start" }}
              >
                {routineLoading ? "저장 중..." : "학습량 저장"}
              </Button>
            </Stack>
          </CardContent>
        </Card>

                      {/* 🔊 TTS 음성 설정 */}
        <Card>
          <CardContent>
            <Stack spacing={1.5}>
              <Typography fontWeight={800}>발음 음성 설정</Typography>
              <Typography variant="body2" color="text.secondary">
                중국어 발음 들을 때 남자/여자 느낌과 재생 속도를 조절할 수 있어.
                브라우저에서 제공하는 중국어 음성을 기준으로, 최대한 맞는 보이스를 골라줄게.
              </Typography>

              {/* 성별 선택 */}
              <Stack direction="row" spacing={1.5}>
                <Button
                  variant={
                    ttsConfig.gender === "default" ? "contained" : "outlined"
                  }
                  size="small"
                  onClick={() =>
                    setTtsConfigState((prev) => ({
                      ...prev,
                      gender: "default",
                    }))
                  }
                >
                  기본
                </Button>
                <Button
                  variant={
                    ttsConfig.gender === "male" ? "contained" : "outlined"
                  }
                  size="small"
                  onClick={() =>
                    setTtsConfigState((prev) => ({
                      ...prev,
                      gender: "male",
                    }))
                  }
                >
                  남자 느낌
                </Button>
                <Button
                  variant={
                    ttsConfig.gender === "female" ? "contained" : "outlined"
                  }
                  size="small"
                  onClick={() =>
                    setTtsConfigState((prev) => ({
                      ...prev,
                      gender: "female",
                    }))
                  }
                >
                  여자 느낌
                </Button>
              </Stack>

              {/* 🔁 재생 속도 슬라이더 */}
              <Stack spacing={0.5}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" fontWeight={600}>
                    재생 속도
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {ttsConfig.rate?.toFixed
                      ? ttsConfig.rate.toFixed(1)
                      : Number(ttsConfig.rate || 1).toFixed(1)}
                  </Typography>
                </Stack>

                <Slider
                  value={
                    typeof ttsConfig.rate === "number"
                      ? ttsConfig.rate
                      : Number(ttsConfig.rate || 1)
                  }
                  min={0.5}
                  max={2}
                  step={0.1}
                  onChange={(_, newValue) => {
                    const num =
                      Array.isArray(newValue) ? newValue[0] : newValue;
                    setTtsConfigState((prev) => ({
                      ...prev,
                      rate: num,
                    }));
                  }}
                  valueLabelDisplay="auto"
                />

                <Typography variant="caption" color="text.secondary">
                  1.0이 기본 속도야. 0.8 정도가 듣기 편한 경우가 많아.
                </Typography>
              </Stack>

              {ttsMsg && (
                <Alert
                  severity={ttsMsg.includes("저장") ? "success" : "error"}
                >
                  {ttsMsg}
                </Alert>
              )}

              <Button
                variant="contained"
                onClick={handleSaveTts}
                sx={{ fontWeight: 800, alignSelf: "flex-start" }}
              >
                음성 설정 저장
              </Button>
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
