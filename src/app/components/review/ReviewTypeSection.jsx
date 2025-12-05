// src/app/components/review/ReviewTypeSection.jsx
import React from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  Chip,
  Divider,
  Button,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ReplayIcon from "@mui/icons-material/Replay";

function ReviewItemCard({
  item,
  type,
  mode, // "review" | "master"
  onSpeak,
  onToggleStatus,
  onOpenDetail,
}) {
  const isReview = mode === "review";

  const handleCardClick = () => {
    onOpenDetail && onOpenDetail(type, item);
  };

  // 회화
  if (type === "dialog") {
    const lines = item.lines || [];
    return (
      <Card variant="outlined" sx={{ borderRadius: 2 }} onClick={handleCardClick}>
        <CardContent sx={{ py: 1.1, "&:last-child": { pb: 1.1 } }}>
          <Stack spacing={0.8}>
            {lines.map((line, idx) => (
              <Box key={idx}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700, mb: 0.2 }}
                >
                  {line.speaker || (idx === 0 ? "A" : "B")}
                </Typography>
                {line.zh && (
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {line.zh}
                  </Typography>
                )}
                {line.pinyin && (
                  <Typography variant="body2" color="text.secondary">
                    {line.pinyin}
                  </Typography>
                )}
                {line.koreanPronunciation && (
                  <Typography variant="body2" color="text.secondary">
                    {line.koreanPronunciation}
                  </Typography>
                )}
                {line.ko && (
                  <Typography variant="body2" sx={{ mt: 0.1 }}>
                    {line.ko}
                  </Typography>
                )}
              </Box>
            ))}

            <Stack
              direction="row"
              spacing={1}
              justifyContent="flex-end"
              sx={{ mt: 0.5 }}
            >
              {onSpeak && (
                <Button
                  size="small"
                  variant="text"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSpeak(item);
                  }}
                >
                  듣기
                </Button>
              )}
              {isReview ? (
                <Button
                  size="small"
                  variant="contained"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStatus?.(type, item, true);
                  }}
                >
                  <CheckCircleIcon fontSize="small" />
                </Button>
              ) : (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStatus?.(type, item, false);
                  }}
                >
                  <ReplayIcon fontSize="small" />
                </Button>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  // 문법
  if (type === "grammar") {
    const title =
      item.title || item.shortTitle || item.corePattern || "(제목 없음)";
    const sub = item.corePattern || "";
    const meaning =
      item.meaning_ko || item.ko || item.meaningKr || item.kr || "";

    return (
      <Card variant="outlined" sx={{ borderRadius: 2 }} onClick={handleCardClick}>
        <CardContent sx={{ py: 1.1, "&:last-child": { pb: 1.1 } }}>
          <Stack spacing={0.7}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {title}
              </Typography>
              <Stack direction="row" spacing={1}>
                {onSpeak && (
                  <Button
                    size="small"
                    variant="text"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSpeak(item);
                    }}
                  >
                    듣기
                  </Button>
                )}
                {isReview ? (
                  <Button
                    size="small"
                    variant="contained"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStatus?.(type, item, true);
                    }}
                  >
                    <CheckCircleIcon fontSize="small" />
                  </Button>
                ) : (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStatus?.(type, item, false);
                    }}
                  >
                    <ReplayIcon fontSize="small" />
                  </Button>
                )}
              </Stack>
            </Stack>

            {sub && (
              <Typography variant="body2" color="text.secondary">
                패턴: {sub}
              </Typography>
            )}
            {meaning && (
              <Typography variant="body2" sx={{ mt: 0.25 }}>
                의미: {meaning}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  // 단어 / 문장 공통
  const zh = item.zh || "";
  const pinyin = item.pinyin || "";
  const ko =
    item.ko || item.meaning_ko || item.meaningKr || item.kr || "";

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }} onClick={handleCardClick}>
      <CardContent sx={{ py: 1.1, "&:last-child": { pb: 1.1 } }}>
        <Stack spacing={0.7}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {zh}
            </Typography>
            <Stack direction="row" spacing={1}>
              {onSpeak && (
                <Button
                  size="small"
                  variant="text"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSpeak(item);
                  }}
                >
                  듣기
                </Button>
              )}
              {isReview ? (
                <Button
                  size="small"
                  variant="contained"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStatus?.(type, item, true);
                  }}
                >
                  <CheckCircleIcon fontSize="small" />
                </Button>
              ) : (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStatus?.(type, item, false);
                  }}
                >
                  <ReplayIcon fontSize="small" />
                </Button>
              )}
            </Stack>
          </Stack>

          {pinyin && (
            <Typography variant="body2" color="text.secondary">
              {pinyin}
            </Typography>
          )}
          {ko && (
            <Typography variant="body2" sx={{ mt: 0.2 }}>
              {ko}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

function ReviewItemList(props) {
  const { items, mode } = props;
  if (!items || items.length === 0) {
    return (
      <Box sx={{ py: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {mode === "review"
            ? "더 공부할 예정(다시보기) 항목이 없습니다."
            : "다 공부한 상태(외웠음) 항목이 없습니다."}
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1}>
      {items.map((item, idx) => (
        <ReviewItemCard key={idx} {...props} item={item} />
      ))}
    </Stack>
  );
}

export default function ReviewTypeSection({
  typeKey,
  label,
  reviewItems,
  masterItems,
  counts,
  onSpeak,
  onToggleStatus,
  onOpenDetail,
}) {
  const reviewCount = counts?.review || 0;
  const masterCount = counts?.master || 0;

  return (
    <Card>
      <CardContent>
        <Stack spacing={1.5}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="subtitle1" fontWeight={700}>
              {label} 복습 정리
            </Typography>
            <Chip
              size="small"
              label={`다시보기 ${reviewCount}개`}
              variant="outlined"
            />
            <Chip size="small" color="primary" label={`외웠음 ${masterCount}개`} />
          </Stack>

          <Typography variant="caption" color="text.secondary">
            다시보기 = 더 공부할 예정 / 외웠음 = 다 공부한 상태
          </Typography>

          <Divider />

          {/* 다시보기 */}
          <Box sx={{ mt: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, mb: 0.5 }}
            >
              다시보기 (더 공부할 예정)
            </Typography>
            <ReviewItemList
              items={reviewItems}
              type={typeKey}
              mode="review"
              onSpeak={onSpeak}
              onToggleStatus={onToggleStatus}
              onOpenDetail={onOpenDetail}
            />
          </Box>

          <Divider sx={{ my: 1.5 }} />

          {/* 외웠음 */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, mb: 0.5 }}
            >
              외웠음 (다 공부한 상태)
            </Typography>
            <ReviewItemList
              items={masterItems}
              type={typeKey}
              mode="master"
              onSpeak={onSpeak}
              onToggleStatus={onToggleStatus}
              onOpenDetail={onOpenDetail}
            />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
