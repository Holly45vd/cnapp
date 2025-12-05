// src/app/components/review/ReviewSections.jsx
import React, { useMemo, useState } from "react";
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import TypeContentCard from "./TypeContentCard";

const TYPE_CONFIG = {
  word: { label: "단어", pillBg: "#EAF1FF", innerBg: "#FFFFFF" },
  sentence: { label: "문장", pillBg: "#EAF7FF", innerBg: "#FFFFFF" },
  grammar: { label: "문법", pillBg: "#FFF3DF", innerBg: "#FFFFFF" },
  dialog: { label: "회화", pillBg: "#E9FAF1", innerBg: "#FFFFFF" },
};

export default function ReviewSections({
  selectedDateKey,
  hasHistory, // 지금은 안 씀. reviewItems 기준으로 판단.
  reviewItems,
  onSpeakWord,
  onSpeakSentence,
  onSpeakDialog,
  onToggleStatus,
}) {
  const [activeType, setActiveType] = useState("word");

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

  const progressCounts = useMemo(() => {
    if (!reviewItems) {
      return {
        word: { done: 0, total: 0 },
        sentence: { done: 0, total: 0 },
        grammar: { done: 0, total: 0 },
        dialog: { done: 0, total: 0 },
      };
    }
    const safe = (n) => (Number.isFinite(n) ? n : 0);
    return {
      word: {
        done: safe(reviewItems.wordMaster?.length),
        total:
          safe(reviewItems.wordMaster?.length) +
          safe(reviewItems.wordReview?.length),
      },
      sentence: {
        done: safe(reviewItems.sentenceMaster?.length),
        total:
          safe(reviewItems.sentenceMaster?.length) +
          safe(reviewItems.sentenceReview?.length),
      },
      grammar: {
        done: safe(reviewItems.grammarMaster?.length),
        total:
          safe(reviewItems.grammarMaster?.length) +
          safe(reviewItems.grammarReview?.length),
      },
      dialog: {
        done: safe(reviewItems.dialogMaster?.length),
        total:
          safe(reviewItems.dialogMaster?.length) +
          safe(reviewItems.dialogReview?.length),
      },
    };
  }, [reviewItems]);

  const hasAnyItem = useMemo(() => {
    if (!reviewItems) return false;
    const keys = [
      "wordReview",
      "wordMaster",
      "sentenceReview",
      "sentenceMaster",
      "grammarReview",
      "grammarMaster",
      "dialogReview",
      "dialogMaster",
    ];
    return keys.some((k) => (reviewItems[k]?.length || 0) > 0);
  }, [reviewItems]);

  const typeOrder = ["word", "sentence", "grammar", "dialog"];

  const getSpeakHandler = (typeKey) => {
    switch (typeKey) {
      case "word":
        return onSpeakWord;
      case "sentence":
        return onSpeakSentence;
      case "dialog":
        return onSpeakDialog;
      default:
        return undefined;
    }
  };

  // 아무 항목도 없을 때만 기록 없음 표시
  if (!hasAnyItem) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            {selectedDateKey
              ? `${selectedDateKey}에는 복습할 학습 내용이 아직 없습니다.`
              : "복습할 날짜를 먼저 선택해주세요."}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const activeCfg = TYPE_CONFIG[activeType];
  const activeLabel = activeCfg.label;
  const activeReview =
    reviewItems[
      activeType === "word"
        ? "wordReview"
        : activeType === "sentence"
        ? "sentenceReview"
        : activeType === "grammar"
        ? "grammarReview"
        : "dialogReview"
    ] || [];
  const activeMaster =
    reviewItems[
      activeType === "word"
        ? "wordMaster"
        : activeType === "sentence"
        ? "sentenceMaster"
        : activeType === "grammar"
        ? "grammarMaster"
        : "dialogMaster"
    ] || [];

  return (
    <Stack spacing={2}>
      {/* 상단 알약 요약 */}
      <Card>
        <CardContent>
          <Stack spacing={1.5}>
            <Typography variant="subtitle1" fontWeight={700}>
              {selectedDateKey} 학습 복습
            </Typography>

            <Stack direction="row" spacing={1.5} justifyContent="center">
              {typeOrder.map((key) => {
                const cfg = TYPE_CONFIG[key];
                const prog = progressCounts[key] || { done: 0, total: 0 };
                const done = prog.done || 0;
                const total = prog.total || 0;
                const isActive = activeType === key;

                return (
                  <Box
                    key={key}
                    onClick={() => setActiveType(key)}
                    sx={{
                      cursor: "pointer",
                      borderRadius: "999px",
                      px: 1.8,
                      py: 1.3,
                      minWidth: 70,
                      bgcolor: cfg.pillBg,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: isActive
                        ? "0 0 0 2px rgba(0,0,0,0.06)"
                        : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: "#65708A", mb: 0.4 }}
                    >
                      {cfg.label}
                    </Typography>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        bgcolor: cfg.innerBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: 16,
                      }}
                    >
                      {done}/{total}
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* 선택된 타입 상세 */}
      <TypeContentCard
        typeKey={activeType}
        label={activeLabel}
        reviewItems={activeReview}
        masterItems={activeMaster}
        onSpeak={getSpeakHandler(activeType)}
        onToggleStatus={onToggleStatus}
      />
    </Stack>
  );
}
