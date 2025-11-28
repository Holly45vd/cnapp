import { useState } from "react";
import { Box, Card, CardContent, Stack, Typography, TextField, Button, Chip } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

export default function DocIdSearch({ idKey, onSearch }) {
  const [id, setId] = useState("");

  const handleSearch = () => onSearch(id.trim());

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography fontWeight={800}>ID로 조회</Typography>
            <Chip size="small" label={idKey} />
          </Stack>

          <Typography variant="body2" color="text.secondary">
            문서 ID({idKey})로 Firestore 데이터를 불러옵니다.
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
            <TextField
              fullWidth
              size="small"
              label={`${idKey} 입력`}
              placeholder={`${idKey}를 입력하세요`}
              value={id}
              onChange={(e) => setId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />

            <Button
              variant="contained"
              onClick={handleSearch}
              startIcon={<SearchIcon />}
              sx={{ borderRadius: 2, px: 3, fontWeight: 700 }}
            >
              조회
            </Button>
          </Stack>

          <Box sx={{ fontSize: 12, color: "text.secondary" }}>
            * 예: words → wordId, sentences → sentenceId
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
