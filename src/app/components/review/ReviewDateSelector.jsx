// src/app/components/review/ReviewSections.jsx

import React, { useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  Tabs,
  Tab,
  Chip,
  Divider,
  Button,
} from "@mui/material";

const TYPE_CONFIG = {
  word: { label: "단어", color: "primary", key: "word" },
  sentence: { label: "문장", color: "secondary", key: "sentence" },
  grammar: { label: "문법", color: "success", key: "grammar" },
  dialog: { label: "회화", color: "warning", key: "dialog" },
};

function ReviewSummaryCard({ label, reviewCount, masterCount, color }) {
  return (
    <Card variant="outlined" sx={{ flex: 1, minWidth: 0 }}>
      <CardContent sx={{ py: 1.5 }}>
        <Stack spacing={0.5}>
          <Typography variant="subtitle2" color="text.secondary">
            {label}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={`다시보기 ${reviewCount}개`}
              size="small"
              color={color}
              variant="outlined"
            />
            <Chip
              label={`외웠음 ${masterCount}개`}
              size="small"
              color={color}
            />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function ReviewItemList({
  title,
  items,
  type,
  mode, // "review" | "master"
  onSpeak,
  onToggleStatus,
}) {
  const isReview = mode === "review";

  if (!items || items.length === 0) {
    return (
      <Box sx={{ p: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {isReview ? "다시 볼 항목이 없습니다." : "외웠음으로 표시된 항목이 없습니다."}
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1}>
      {items.map((item) => {
        const zh = item.zh || "";
        const pinyin = item.pinyin || "";
        const ko =
          item.ko ||
          item.meaning_ko ||
          item.meaningKr ||
          item.kr ||
          "";

        return (
          <Card
            key={zh + pinyin + ko}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            <CardContent sx={{ py: 1.2, "&:last-child": { pb: 1.2 } }}>
              <Stack spacing={0.75}>
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
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => onSpeak?.(item)}
                    >
                      듣기
                    </Button>
                    {isReview ? (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() =>
                          onToggleStatus?.(type, item, true /* toMaster */)
                        }
                      >
                        외웠음으로 표시
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          onToggleStatus?.(type, item, false /* toReview */)
                        }
                      >
                        다시보기로 이동
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
                  <Typography variant="body2" sx={{ mt: 0.25 }}>
                    {ko}
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
}

export default function ReviewSections({
  selectedDateKey,
  hasHistory,
  reviewItems,
  onSpeakWord,
  onSpeakSentence,
  onSpeakDialog,
  onToggleStatus,
}) {
  const [tab, setTab] = useState("word");

  const counts = useMemo(() => {
    if (!reviewItems) {
      return {
        word: { review: 0, master: 0 },
        sentence: { review: 0, master: 0 },
        grammar: { review: 0, master: 0 },
        dialog: { review: 0, master: 0 },
      };
    }
    return {
      word: {
        review: reviewItems.wordReview?.length || 0,
        master: reviewItems.wordMaster?.length || 0,
      },
      sentence: {
        review: reviewItems.sentenceReview?.length || 0,
        master: reviewItems.sentenceMaster?.length || 0,
      },
      grammar: {
        review: reviewItems.grammarReview?.length || 0,
        master: reviewItems.grammarMaster?.length || 0,
      },
      dialog: {
        review: reviewItems.dialogReview?.length || 0,
        master: reviewItems.dialogMaster?.length || 0,
      },
    };
  }, [reviewItems]);

  if (!hasHistory) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            {selectedDateKey
              ? `${selectedDateKey}에는 학습 기록이 없습니다.`
              : "복습할 날짜를 먼저 선택해주세요."}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // 현재 탭에 따른 데이터와 핸들러
  let currentReview = [];
  let currentMaster = [];
  let speakHandler = () => {};

  if (tab === "word") {
    currentReview = reviewItems.wordReview || [];
    currentMaster = reviewItems.wordMaster || [];
    speakHandler = onSpeakWord;
  } else if (tab === "sentence") {
    currentReview = reviewItems.sentenceReview || [];
    currentMaster = reviewItems.sentenceMaster || [];
    speakHandler = onSpeakSentence;
  } else if (tab === "grammar") {
    currentReview = reviewItems.grammarReview || [];
    currentMaster = reviewItems.grammarMaster || [];
    // 문법은 보통 TTS 안 쓰겠지만, 그냥 단어 읽게 둘 수도 있음
    speakHandler = () => {};
  } else if (tab === "dialog") {
    currentReview = reviewItems.dialogReview || [];
    currentMaster = reviewItems.dialogMaster || [];
    speakHandler = onSpeakDialog;
  }

  const typeConfig = TYPE_CONFIG[tab];

  return (
    <Stack spacing={2}>
      {/* 상단 요약 (4종) */}
      <Card>
        <CardContent>
          <Stack spacing={1.5}>
            <Typography variant="subtitle1" fontWeight={700}>
              {selectedDateKey} 학습 정리
            </Typography>
            <Typography variant="body2" color="text.secondary">
              이 날 학습한 내용 중, 다시 볼 항목과 이미 외운 항목을 한눈에 볼 수
              있어요.
            </Typography>

            <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
              <ReviewSummaryCard
                label="단어"
                reviewCount={counts.word.review}
                masterCount={counts.word.master}
                color="primary"
              />
              <ReviewSummaryCard
                label="문장"
                reviewCount={counts.sentence.review}
                masterCount={counts.sentence.master}
                color="secondary"
              />
              <ReviewSummaryCard
                label="문법"
                reviewCount={counts.grammar.review}
                masterCount={counts.grammar.master}
                color="success"
              />
              <ReviewSummaryCard
                label="회화"
                reviewCount={counts.dialog.review}
                masterCount={counts.dialog.master}
                color="warning"
              />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* 상세 탭 */}
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant="fullWidth"
            >
              <Tab label="단어" value="word" />
              <Tab label="문장" value="sentence" />
              <Tab label="문법" value="grammar" />
              <Tab label="회화" value="dialog" />
            </Tabs>

            <Divider />

            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems="flex-start"
            >
              {/* 다시보기 리스트 */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {typeConfig.label} 다시보기
                  </Typography>
                  <Chip
                    label={`${counts[typeConfig.key].review}개`}
                    size="small"
                    color={typeConfig.color}
                    variant="outlined"
                  />
                </Stack>
                <ReviewItemList
                  title="다시보기"
                  items={currentReview}
                  type={tab}
                  mode="review"
                  onSpeak={speakHandler}
                  onToggleStatus={onToggleStatus}
                />
              </Box>

              {/* 외웠음 리스트 */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {typeConfig.label} 외웠음
                  </Typography>
                  <Chip
                    label={`${counts[typeConfig.key].master}개`}
                    size="small"
                    color={typeConfig.color}
                  />
                </Stack>
                <ReviewItemList
                  title="외웠음"
                  items={currentMaster}
                  type={tab}
                  mode="master"
                  onSpeak={speakHandler}
                  onToggleStatus={onToggleStatus}
                />
              </Box>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
