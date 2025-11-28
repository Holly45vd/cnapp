import React, { useEffect, useState } from "react";
import { login, register } from "../../firebase/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../providers/AuthProvider";

// MUI
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Tabs,
  Tab,
  Stack,
} from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";

export default function LoginPage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);

  // ✅ 로그인 상태면 role 기반 자동 분기
  useEffect(() => {
    if (loading) return;
    if (user && role) {
      navigate(role === "admin" ? "/admin" : "/app", { replace: true });
    }
  }, [user, role, loading, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !pw) {
      setError("이메일과 비밀번호를 입력해줘.");
      return;
    }

    if (mode === "signup" && pw !== pw2) {
      setError("비밀번호 확인이 서로 달라.");
      return;
    }

    setRunning(true);
    try {
      if (mode === "login") {
        await login(email, pw);
      } else {
        await register(email, pw);
        // 가입 직후 AuthProvider가 role 읽고 /app으로 자동 이동
      }
    } catch (err) {
      setError(
        (mode === "login" ? "로그인 실패: " : "가입 실패: ") + err.message
      );
    } finally {
      setRunning(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "grey.100",
        display: "grid",
        placeItems: "center",
        p: 2,
      }}
    >
      <Paper
        elevation={2}
        sx={{
          width: "100%",
          maxWidth: 420,
          p: 4,
          borderRadius: 3,
        }}
      >
        {/* 상단 타이틀 */}
        <Stack spacing={0.5} sx={{ mb: 2 }}>
          <Typography variant="h5" fontWeight={800}>
            CN Study
          </Typography>
          <Typography variant="body2" color="text.secondary">
            이메일로 로그인하거나 가입해서 학습을 시작하세요.
          </Typography>
        </Stack>

        {/* 로그인/가입 탭 */}
        <Tabs
          value={mode}
          onChange={(_, v) => {
            setMode(v);
            setError("");
          }}
          sx={{ mb: 2 }}
        >
          <Tab value="login" label="로그인" />
          <Tab value="signup" label="가입" />
        </Tabs>

        <form onSubmit={onSubmit}>
          <Stack spacing={2}>
            <TextField
              type="email"
              label="이메일"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              autoFocus
            />

            <TextField
              type="password"
              label="비밀번호"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              fullWidth
            />

            {mode === "signup" && (
              <TextField
                type="password"
                label="비밀번호 확인"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                fullWidth
              />
            )}

            {error && <Alert severity="error">{error}</Alert>}

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={running}
              startIcon={mode === "login" ? <LoginIcon /> : <PersonAddAltIcon />}
              sx={{
                borderRadius: 2,
                fontWeight: 800,
                py: 1.2,
                bgcolor: "black",
                "&:hover": { bgcolor: "#111" },
              }}
            >
              {running
                ? mode === "login"
                  ? "로그인 중..."
                  : "가입 중..."
                : mode === "login"
                ? "로그인"
                : "가입하기"}
            </Button>

            <Typography variant="caption" color="text.secondary" textAlign="center">
              가입하면 기본 권한은 learner로 생성됩니다.
              <br />
              admin 권한은 Firestore에서 role을 admin으로 바꾸면 됩니다.
            </Typography>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
