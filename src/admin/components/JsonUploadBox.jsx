import { useRef, useState } from "react";
import {
  Card, CardContent, Stack, Typography, Button,
  TextField, Alert, Divider, Chip
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

export default function JsonUploadBox({ idKey, onLoaded }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const handleFile = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result);
        onLoaded(obj);
        setText(JSON.stringify(obj, null, 2));
        setError("");
      } catch (e) {
        setError("JSON 파일 파싱 실패. 파일 내용 확인해줘.");
        console.error(e);
      }
    };
    reader.readAsText(file);
  };

  const handlePasteLoad = () => {
    try {
      const obj = JSON.parse(text);
      onLoaded(obj);
      setError("");
    } catch (e) {
      setError("붙여넣은 JSON 파싱 실패. 형식 확인해줘.");
      console.error(e);
    }
  };

  const handleClear = () => {
    setText("");
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography fontWeight={800}>JSON 등록</Typography>
            <Chip size="small" label={idKey} />
          </Stack>

          <Typography variant="body2" color="text.secondary">
            파일 업로드 또는 붙여넣기로 JSON을 불러옵니다.  
            최상단에 <b>{idKey}</b>가 없으면 저장 시 자동 생성됩니다.
          </Typography>

          <Divider />

          {/* 파일 업로드 라인 */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadFileIcon />}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              JSON 파일 선택
              <input
                ref={fileRef}
                type="file"
                hidden
                accept=".json,application/json"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </Button>

            <Button
              variant="text"
              color="inherit"
              onClick={handleClear}
              startIcon={<DeleteOutlineIcon />}
              sx={{ borderRadius: 2 }}
            >
              입력 지우기
            </Button>
          </Stack>

          {/* 붙여넣기 박스 */}
          <TextField
            multiline
            minRows={8}
            fullWidth
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`JSON 붙여넣기. ${idKey} 필드가 있으면 그 값이 문서 ID가 됩니다.`}
            sx={{
              "& textarea": {
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: 13,
                lineHeight: 1.6
              }
            }}
          />

          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              onClick={handlePasteLoad}
              startIcon={<ContentPasteIcon />}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              붙여넣은 JSON 불러오기
            </Button>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Typography variant="caption" color="text.secondary">
            * JSON 최상단에 <b>{idKey}</b>가 있으면 그 값으로 문서 ID를 씁니다.
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
