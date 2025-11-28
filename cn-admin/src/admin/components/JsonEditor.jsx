import { useEffect, useState } from "react";
import {
  Card, CardContent, Stack, Typography, TextField, Button, Alert, Divider
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export default function JsonEditor({ value, onChange, onSave }) {
  const [text, setText] = useState("");
  const [parseError, setParseError] = useState("");

  useEffect(() => {
    if (value) setText(JSON.stringify(value, null, 2));
    else setText("");
    setParseError("");
  }, [value]);

  const applyChanges = () => {
    try {
      const obj = JSON.parse(text);
      onChange(obj);
      setParseError("");
    } catch (e) {
      setParseError("JSON 파싱 실패. 쉼표/따옴표/중괄호 구조를 확인해줘.");
      console.error(e);
    }
  };

  if (!value) {
    return (
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            JSON을 업로드하거나 ID로 조회하면 여기에 표시됩니다.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack spacing={1.5}>
          <Typography fontWeight={800}>JSON 편집</Typography>
          <Typography variant="body2" color="text.secondary">
            수정 후 <b>변경 적용(파싱)</b> → <b>Firestore 저장</b> 순서로 진행.
          </Typography>

          <Divider />

          <TextField
            multiline
            minRows={14}
            maxRows={20}
            fullWidth
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="여기에 JSON이 표시됩니다."
            sx={{
              "& textarea": {
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: 13,
                lineHeight: 1.6
              }
            }}
          />

          {parseError && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {parseError}
            </Alert>
          )}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button
              variant="outlined"
              onClick={applyChanges}
              startIcon={<CheckCircleIcon />}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              변경 적용(파싱)
            </Button>

            <Button
              variant="contained"
              onClick={onSave}
              startIcon={<SaveIcon />}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              Firestore 저장
            </Button>
          </Stack>

          <Typography variant="caption" color="text.secondary">
            * 저장 전에 “변경 적용(파싱)”으로 유효성 체크하면 실수 확 줄어듦.
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
