// src/app/components/review/ReviewDetailDialog.jsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Stack,
  Typography,
  Chip,
  Box,
  Divider,
  Slide,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";

// pinyin → 한글발음 변환 유틸
import {
  freeTextPinyinToKorean,
  pinyinArrayToKorean,
} from "../../../lib/pinyinKorean";

// ─────────────────────────────
// 공통 상수 / 유틸
// ─────────────────────────────
const TYPE_LABEL = {
  word: "단어",
  sentence: "문장",
  grammar: "문법",
  dialog: "회화",
};

const TYPE_COLOR = {
  word: "primary",
  sentence: "secondary",
  grammar: "success",
  dialog: "warning",
};

function SectionTitle({ children }) {
  return (
    <Typography
      variant="subtitle2"
      sx={{ fontWeight: 700, mt: 2, mb: 0.7, color: "#607086" }}
    >
      {children}
    </Typography>
  );
}

// 공통: 병음 → 한글 발음
function toPronKoFromPinyin(pinyin, fallback) {
  if (fallback) return fallback;
  if (!pinyin) return "";
  return freeTextPinyinToKorean(pinyin);
}

// 단어용: syllables / pinyin / koreanPronunciation 다 고려
function toWordPronKo(item) {
  if (!item) return "";
  if (item.koreanPronunciation) return item.koreanPronunciation;
  if (item.pinyinKo) return item.pinyinKo;

  if (Array.isArray(item.syllables) && item.syllables.length > 0) {
    return pinyinArrayToKorean(item.syllables);
  }
  if (item.pinyin) {
    return freeTextPinyinToKorean(item.pinyin);
  }
  return "";
}

// Dialog Transition
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// ─────────────────────────────
// 타입별 상세 렌더링
// ─────────────────────────────

// 1) 단어 상세
function renderWordDetail(item) {
  if (!item) return null;

  const {
    zh,
    pinyin,
    meaning_ko,
    meaning_en,
    level,
    tags,
    pos,
    syllables,
    components,
    notes_ko,
    examples,
  } = item;

  const pronKo = toWordPronKo(item);

  return (
    <Stack spacing={1.5}>
      {/* 상단 하이라이트 카드 */}
      <Box
        sx={{
          p: 2.2,
          borderRadius: 3,
          bgcolor: "#F4F6FF",
          display: "flex",
          alignItems: "center",
          gap: 2.5,
        }}
      >
        {/* 한자 아이콘 영역 (조금 크게) */}
        <Box
          sx={{
            width: 130,
            height: 80,
            borderRadius: "28px",
            bgcolor: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
            fontSize: 40,
            fontWeight: 800,
          }}
        >
          {zh}
        </Box>

        {/* 텍스트 영역 */}
        <Box sx={{ minWidth: 0 }}>
          {pinyin && (
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontWeight: 500 }}
            >
              {pinyin}
            </Typography>
          )}

          {pronKo && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.2 }}
            >
              {pronKo}
            </Typography>
          )}

          {meaning_ko && (
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, mt: 0.5, lineHeight: 1.3 }}
            >
              {meaning_ko}
            </Typography>
          )}

          {meaning_en && (
            <Typography variant="body2" color="text.secondary">
              {meaning_en}
            </Typography>
          )}
        </Box>
      </Box>

      {/* 메타 정보 Chip */}
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {typeof level === "number" && (
          <Chip size="small" label={`Level ${level}`} color="primary" />
        )}
        {pos && (
          <Chip size="small" label={pos} variant="outlined" color="primary" />
        )}
        {Array.isArray(tags) &&
          tags.map((t) => (
            <Chip
              key={t}
              size="small"
              label={t}
              variant="outlined"
              sx={{ borderRadius: "999px" }}
            />
          ))}
      </Stack>

      {/* 음절 */}
      {Array.isArray(syllables) && syllables.length > 0 && (
        <>
          <SectionTitle>음절</SectionTitle>
          <Typography variant="body2">{syllables.join(" · ")}</Typography>
        </>
      )}

      {/* 구성(한자 / 부수) */}
      {components && (components.hanzi || components.radicals) && (
        <>
          <SectionTitle>구성</SectionTitle>
          <Typography variant="body2">
            {components.hanzi && (
              <>
                한자: {components.hanzi.join(", ")}
                <br />
              </>
            )}
            {components.radicals && (
              <>부수: {components.radicals.join(", ")}</>
            )}
          </Typography>
        </>
      )}

      {/* 메모 */}
      {Array.isArray(notes_ko) && notes_ko.length > 0 && (
        <>
          <SectionTitle>메모</SectionTitle>
          <Stack spacing={0.4}>
            {notes_ko.map((n, idx) => (
              <Typography key={idx} variant="body2">
                • {n}
              </Typography>
            ))}
          </Stack>
        </>
      )}

      {/* 예문 */}
      {Array.isArray(examples) && examples.length > 0 && (
        <>
          <SectionTitle>예문</SectionTitle>
          <Stack spacing={0.8}>
            {examples.map((ex, idx) => {
              const exPronKo = toPronKoFromPinyin(
                ex.pinyin,
                ex.koreanPronunciation
              );
              return (
                <Box
                  key={idx}
                  sx={{
                    p: 1,
                    borderRadius: 1.5,
                    bgcolor: "#F7F8FA",
                  }}
                >
                  {ex.zh && (
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, mb: 0.1 }}
                    >
                      {ex.zh}
                    </Typography>
                  )}
                  {ex.pinyin && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.1 }}
                    >
                      {ex.pinyin}
                    </Typography>
                  )}
                  {exPronKo && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.1 }}
                    >
                      {exPronKo}
                    </Typography>
                  )}
                  {ex.ko && <Typography variant="body2">{ex.ko}</Typography>}
                </Box>
              );
            })}
          </Stack>
        </>
      )}
    </Stack>
  );
}

// 2) 문장 상세
function renderSentenceDetail(item) {
  if (!item) return null;

  const {
    zh,
    pinyin,
    ko,
    level,
    tags,
    focusPoints,
    notes_ko,
    grammarIds,
    wordRefs,
    koreanPronunciation,
  } = item;

  const pronKo = toPronKoFromPinyin(pinyin, koreanPronunciation);

  return (
    <Stack spacing={1.5}>
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: "#EAF7FF",
        }}
      >
        {zh && (
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.4 }}>
            {zh}
          </Typography>
        )}
        {pinyin && (
          <Typography variant="body2" color="text.secondary">
            {pinyin}
          </Typography>
        )}
        {pronKo && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.1 }}
          >
            {pronKo}
          </Typography>
        )}
        {ko && (
          <Typography variant="body2" sx={{ mt: 0.4 }}>
            {ko}
          </Typography>
        )}
      </Box>

      <Stack direction="row" spacing={1} flexWrap="wrap">
        {typeof level === "number" && (
          <Chip size="small" label={`Level ${level}`} color="secondary" />
        )}
        {Array.isArray(tags) &&
          tags.map((t) => (
            <Chip
              key={t}
              size="small"
              label={t}
              variant="outlined"
              sx={{ borderRadius: "999px" }}
            />
          ))}
      </Stack>

      {Array.isArray(focusPoints) && focusPoints.length > 0 && (
        <>
          <SectionTitle>포인트</SectionTitle>
          <Stack spacing={0.4}>
            {focusPoints.map((f, idx) => (
              <Typography key={idx} variant="body2">
                • {f}
              </Typography>
            ))}
          </Stack>
        </>
      )}

      {Array.isArray(grammarIds) && grammarIds.length > 0 && (
        <>
          <SectionTitle>연계 문법</SectionTitle>
          <Typography variant="body2">{grammarIds.join(", ")}</Typography>
        </>
      )}

      {Array.isArray(wordRefs) && wordRefs.length > 0 && (
        <>
          <SectionTitle>포함 단어</SectionTitle>
          <Typography variant="body2">
            {wordRefs
              .map((w) => (typeof w === "string" ? w : w.wordId))
              .join(", ")}
          </Typography>
        </>
      )}

      {Array.isArray(notes_ko) && notes_ko.length > 0 && (
        <>
          <SectionTitle>메모</SectionTitle>
          <Stack spacing={0.4}>
            {notes_ko.map((n, idx) => (
              <Typography key={idx} variant="body2">
                • {n}
              </Typography>
            ))}
          </Stack>
        </>
      )}
    </Stack>
  );
}

// 3) 문법 상세
function renderGrammarDetail(item) {
  if (!item) return null;

  const {
    title,
    shortTitle,
    corePattern,
    meaning_ko,
    description_ko,
    level,
    tags,
    examples,
    notes_ko,
  } = item;

  return (
    <Stack spacing={1.5}>
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: "#FFF3DF",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {title || shortTitle || corePattern || "(제목 없음)"}
        </Typography>
        {corePattern && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.4 }}
          >
            패턴: {corePattern}
          </Typography>
        )}
        {meaning_ko && (
          <Typography variant="body2" sx={{ mt: 0.4 }}>
            {meaning_ko}
          </Typography>
        )}
      </Box>

      <Stack direction="row" spacing={1} flexWrap="wrap">
        {typeof level === "number" && (
          <Chip size="small" label={`Level ${level}`} color="success" />
        )}
        {Array.isArray(tags) &&
          tags.map((t) => (
            <Chip
              key={t}
              size="small"
              label={t}
              variant="outlined"
              sx={{ borderRadius: "999px" }}
            />
          ))}
      </Stack>

      {description_ko && (
        <>
          <SectionTitle>설명</SectionTitle>
          <Typography variant="body2">{description_ko}</Typography>
        </>
      )}

      {Array.isArray(examples) && examples.length > 0 && (
        <>
          <SectionTitle>예문</SectionTitle>
          <Stack spacing={0.8}>
            {examples.map((ex, idx) => {
              const exPronKo = toPronKoFromPinyin(
                ex.pinyin,
                ex.koreanPronunciation
              );
              return (
                <Box
                  key={idx}
                  sx={{
                    p: 1,
                    borderRadius: 1.5,
                    bgcolor: "#F7F8FA",
                  }}
                >
                  {ex.zh && (
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, mb: 0.1 }}
                    >
                      {ex.zh}
                    </Typography>
                  )}
                  {ex.pinyin && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.1 }}
                    >
                      {ex.pinyin}
                    </Typography>
                  )}
                  {exPronKo && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.1 }}
                    >
                      {exPronKo}
                    </Typography>
                  )}
                  {ex.ko && <Typography variant="body2">{ex.ko}</Typography>}
                </Box>
              );
            })}
          </Stack>
        </>
      )}

      {Array.isArray(notes_ko) && notes_ko.length > 0 && (
        <>
          <SectionTitle>메모</SectionTitle>
          <Stack spacing={0.4}>
            {notes_ko.map((n, idx) => (
              <Typography key={idx} variant="body2">
                • {n}
              </Typography>
            ))}
          </Stack>
        </>
      )}
    </Stack>
  );
}

// 4) 회화 상세
function renderDialogDetail(item) {
  if (!item) return null;

  const { lines, level, tags, topic, notes_ko } = item;
  const safeLines = Array.isArray(lines) ? lines : [];

  return (
    <Stack spacing={1.5}>
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: "#E9FAF1",
        }}
      >
        <Stack spacing={1}>
          {safeLines.map((line, idx) => {
            const pronKo = toPronKoFromPinyin(
              line.pinyin,
              line.koreanPronunciation
            );
            return (
              <Box key={idx}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700, mb: 0.2 }}
                >
                  {line.speaker || (idx === 0 ? "A" : "B")}
                </Typography>
                {line.zh && (
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {line.zh}
                  </Typography>
                )}
                {line.pinyin && (
                  <Typography variant="body2" color="text.secondary">
                    {line.pinyin}
                  </Typography>
                )}
                {pronKo && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.1 }}
                  >
                    {pronKo}
                  </Typography>
                )}
                {line.ko && (
                  <Typography variant="body2" sx={{ mt: 0.1 }}>
                    {line.ko}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Stack>
      </Box>

      <Stack direction="row" spacing={1} flexWrap="wrap">
        {typeof level === "number" && (
          <Chip size="small" label={`Level ${level}`} color="warning" />
        )}
        {Array.isArray(topic) &&
          topic.map((t) => (
            <Chip
              key={t}
              size="small"
              label={t}
              variant="outlined"
              sx={{ borderRadius: "999px" }}
            />
          ))}
        {Array.isArray(tags) &&
          tags.map((t) => (
            <Chip
              key={t}
              size="small"
              label={t}
              variant="outlined"
              sx={{ borderRadius: "999px" }}
            />
          ))}
      </Stack>

      {Array.isArray(notes_ko) && notes_ko.length > 0 && (
        <>
          <SectionTitle>메모</SectionTitle>
          <Stack spacing={0.4}>
            {notes_ko.map((n, idx) => (
              <Typography key={idx} variant="body2">
                • {n}
              </Typography>
            ))}
          </Stack>
        </>
      )}
    </Stack>
  );
}

// ─────────────────────────────
// 메인 Dialog 컴포넌트
// ─────────────────────────────
export default function ReviewDetailDialog({
  open,
  onClose,
  type,
  item,
  onSpeak,
}) {
  const handleSpeak = () => {
    if (!item || !onSpeak) return;
    onSpeak(item);
  };

  let body = null;
  if (type === "word") body = renderWordDetail(item);
  else if (type === "sentence") body = renderSentenceDetail(item);
  else if (type === "grammar") body = renderGrammarDetail(item);
  else if (type === "dialog") body = renderDialogDetail(item);

  const typeLabel = TYPE_LABEL[type] || "상세";
  const typeColor = TYPE_COLOR[type] || "primary";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 3,
          py: 2,
          borderBottom: "1px solid #EBEFF3",
          bgcolor: "#FBFCFF",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Chip
            label={typeLabel}
            color={typeColor}
            size="small"
            sx={{ borderRadius: "999px", fontWeight: 600 }}
          />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            학습 상세 보기
          </Typography>

          {onSpeak && item && (
            <IconButton
              size="small"
              onClick={handleSpeak}
              sx={{ ml: "auto" }}
            >
              <VolumeUpIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton
            size="small"
            onClick={onClose}
            sx={{ ml: !onSpeak || !item ? "auto" : 0 }}
          >
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          px: 3,
          py: 2.5,
          bgcolor: "#F7F9FC",
        }}
      >
        {item ? (
          <Box
            sx={{
              bgcolor: "#FFFFFF",
              borderRadius: 2,
              p: 2.2,
              boxShadow: "0 4px 16px rgba(15, 23, 42, 0.06)",
            }}
          >
            {body}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            선택된 항목이 없습니다.
          </Typography>
        )}

        <Divider sx={{ mt: 2.5 }} />
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 1.2, display: "block" }}
        >
          카드에서 항목을 클릭하면 이 창에서 자세한 정보를 확인할 수 있어요.
        </Typography>
      </DialogContent>
    </Dialog>
  );
}
