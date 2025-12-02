// src/app/pages/DialogSession.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { listCollection } from "../../firebase/db";
import { freeTextPinyinToKorean } from "../../lib/pinyinKorean";
import { speakZh } from "../../lib/ttsHelper";

// MUI
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  Chip,
  LinearProgress,
  IconButton,
} from "@mui/material";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";

export default function DialogSession({
  dialogIds: propDialogIds,
  onDone,
  mode,
}) {
  const { state } = useLocation();
  const dialogIds = propDialogIds || state?.routine?.dialogs || [];

  const [allDialogs, setAllDialogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);

  const [doneIds, setDoneIds] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const dialogs = await listCollection("dialogs");
        setAllDialogs(dialogs);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sessionDialogs = useMemo(() => {
    if (!dialogIds?.length) return [];
    const idSet = new Set(dialogIds);
    return allDialogs.filter((d) => idSet.has(d.dialogId));
  }, [allDialogs, dialogIds]);

  const current = sessionDialogs[idx];
  const lines = current?.lines || [];

  const handleDoneOne = () => {
    if (!current) return;
    const newDone = [...doneIds, current.dialogId];
    setDoneIds(newDone);

    const nextIdx = idx + 1;
    if (nextIdx >= sessionDialogs.length) {
      onDone?.({ dialogsDone: newDone });
      return;
    }
    setIdx(nextIdx);
  };

  // 🔊 각 대사도 항상 중국어 원문(zh)만 읽도록 고정
  const handleLineSpeak = (zh) => {
    if (!zh) return;
    speakZh(zh);
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          회화 불러오는 중...
        </Typography>
      </Box>
    );
  }

  if (!sessionDialogs.length) {
    return (
      <Box sx={{ p: 2 }}>
        {mode !== "today" && (
          <Typography variant="h6" fontWeight={800}>
            오늘 공부 - 회화
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary">
          오늘 회화가 없습니다.
        </Typography>
      </Box>
    );
  }

  const content = (
    <Stack spacing={2}>
      {/* today 모드가 아니면 상단 헤더 노출 */}
      {mode !== "today" && (
        <Card>
          <CardContent sx={{ display: "flex", justifyContent: "space-between" }}>
            <Box>
              <Typography fontWeight={800}>오늘 공부 - 회화</Typography>
              <Typography variant="caption" color="text.secondary">
                {idx + 1} / {sessionDialogs.length}
              </Typography>
            </Box>
            {current?.topic && <Chip size="small" label={current.topic} />}
          </CardContent>
        </Card>
      )}

      {/* 회화 카드 */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ py: 3 }}>
          <Stack spacing={2}>
            {lines.map((l, i) => {
              const pinyin = l.pinyin || "";
              const koPron = pinyin ? freeTextPinyinToKorean(pinyin) : "";

              return (
                <Box key={i}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={1}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {l.role || (i === 0 ? "A" : "B")}
                      </Typography>
                      <Typography fontWeight={700} sx={{ mt: 0.3 }}>
                        {l.zh}
                      </Typography>
                      {pinyin && (
                        <Typography variant="body2" color="text.secondary">
                          {pinyin}
                        </Typography>
                      )}
                      {koPron && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mt: 0.2 }}
                        >
                          {koPron}
                        </Typography>
                      )}
                      {l.ko && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.3 }}
                        >
                          {l.ko}
                        </Typography>
                      )}
                    </Box>

                    {/* 한 문장씩 발음 듣기 */}
                    <IconButton
                      size="small"
                      onClick={() => handleLineSpeak(l.zh)}
                      sx={{
                        mt: 2,
                        bgcolor: "grey.50",
                        "&:hover": { bgcolor: "grey.100" },
                      }}
                    >
                      <VolumeUpIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Box>
              );
            })}

            <LinearProgress
              variant="determinate"
              value={((idx + 1) / sessionDialogs.length) * 100}
              sx={{ height: 6, borderRadius: 999, mt: 1 }}
            />
            <Typography variant="caption" color="text.secondary">
              {idx + 1} / {sessionDialogs.length}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
      
      {/* 완료 */}
      <Button
        variant="contained"
        onClick={handleDoneOne}
        sx={{ fontWeight: 800, borderRadius: 2, py: 1.5 }}
      >
        회화 완료
      </Button>

      {/* 취소 */}
      <Button
        onClick={() => onDone?.({ dialogsDone: doneIds })}
        sx={{ color: "text.secondary" }}
      >
        실행 취소
      </Button>
    </Stack>
  );

  if (mode === "today") return content;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: 2 }}>
      {content}
    </Box>
  );
}
