// src/app/components/review/TypeContentCard.jsx
import React from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  Chip,
  Divider,
} from "@mui/material";

import ReviewItemList from "./ReviewItemList";

export default function TypeContentCard({
  typeKey,
  label,
  reviewItems,
  masterItems,
  onSpeak,
  onToggleStatus,
  onItemClick,
}) {
  const reviewCount = reviewItems?.length || 0;
  const masterCount = masterItems?.length || 0;

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
            <Chip
              size="small"
              color="primary"
              label={`외웠음 ${masterCount}개`}
            />
          </Stack>

          <Typography variant="caption" color="text.secondary">
            다시보기 = 더 공부할 예정 / 외웠음 = 다 공부한 상태
          </Typography>

          <Divider />

          {/* 다시보기 리스트 */}
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
              onItemClick={onItemClick}
            />
          </Box>

          <Divider sx={{ my: 1.5 }} />

          {/* 외웠음 리스트 */}
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
              onItemClick={onItemClick}
            />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
