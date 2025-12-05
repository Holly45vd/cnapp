// src/app/components/review/ReviewSections.jsx
import React, { useMemo, useState } from "react";
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

const TYPE_CONFIG = {
  word: { label: "단어", pillBg: "#EAF1FF", innerBg: "#FFFFFF" },
  sentence: { label: "문장", pillBg: "#EAF7FF", innerBg: "#FFFFFF" },
  grammar: { label: "문법", pillBg: "#FFF3DF", innerBg: "#FFFFFF" },
  dialog: { label: "회화", pillBg: "#E9FAF1", innerBg: "#FFFFFF" },
};

/**
 * 공통 리스트 렌더러
 * type: word | sentence | grammar | dialog
 * mode: review(더 공부) | master(외웠음)
 */
function ReviewItemList({ items, type, mode, onSpeak, onToggleStatus }) {
  const isReview = mode === "review";

  if (!items || items.length === 0) {
    return (
      <Box sx={{ py: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {isReview
            ? "더 공부할 예정(다시보기) 항목이 없습니다."
            : "다 공부한 상태(외웠음) 항목이 없습니다."}
        </Typography>
      </Box>
    );
  }

  const renderToggleButtons = (item) => (
    <Stack direction="row" spacing={1}>
      {typeof onSpeak === "function" && (
        <Button size="small" variant="text" onClick={() => onSpeak(item)}>
          듣기
        </Button>
      )}

      {isReview ? (
        <Button
          size="small"
          variant="contained"
          onClick={() => onToggleStatus?.(type, item, true /* → 외웠음 */)}
        >
          <CheckCircleIcon fontSize="small" />
        </Button>
      ) : (
        <Button
          size="small"
          variant="outlined"
          onClick={() => onToggleStatus?.(type, item, false /* → 다시보기 */)}
        >
          <ReplayIcon fontSize="small" />
        </Button>
      )}
    </Stack>
  );

  return (
    <Stack spacing={1}>
      {items.map((item, idx) => {
        /** ─────────────────────
         *  1) 회화 전용 렌더링 (A/B 라인별)
         *  ───────────────────── */
        if (type === "dialog") {
          const lines = item.lines || [];
          return (
            <Card key={idx} variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent sx={{ py: 1.2, "&:last-child": { pb: 1.2 } }}>
                <Stack spacing={1.2}>
                  {lines.map((line, li) => (
                    <Box key={li}>
                      {/* 화자 (A/B 등) */}
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 700, mb: 0.4 }}
                      >
                        {line.speaker || (li === 0 ? "A" : "B")}
                      </Typography>

                      {/* 중국어 문장 */}
                      {line.zh && (
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {line.zh}
                        </Typography>
                      )}

                      {/* 병음 */}
                      {line.pinyin && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.2 }}
                        >
                          {line.pinyin}
                        </Typography>
                      )}

                      {/* 한글 발음(있을 때만) */}
                      {line.koreanPronunciation && (
                        <Typography variant="body2" color="text.secondary">
                          {line.koreanPronunciation}
                        </Typography>
                      )}

                      {/* 한국어 해석 */}
                      {line.ko && (
                        <Typography variant="body2" sx={{ mt: 0.2 }}>
                          {line.ko}
                        </Typography>
                      )}
                    </Box>
                  ))}

                  {/* 버튼 영역 */}
                  <Stack
                    direction="row"
                    justifyContent="flex-end"
                    spacing={1}
                  >
                    {renderToggleButtons(item)}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          );
        }

        /** ─────────────────────
         *  2) 문법 카드 렌더링 (조금 더 자세히)
         *  ───────────────────── */
        if (type === "grammar") {
          const title =
            item.title || item.shortTitle || item.corePattern || "(제목 없음)";
          const sub = item.corePattern || "";
          const meaning =
            item.meaning_ko ||
            item.ko ||
            item.meaningKr ||
            item.kr ||
            "";
          const description =
            item.description_ko ||
            item.explanation_ko ||
            item.detail_ko ||
            "";
          const examples = Array.isArray(item.examples) ? item.examples : [];

          return (
            <Card key={idx} variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent sx={{ py: 1.1, "&:last-child": { pb: 1.1 } }}>
                <Stack spacing={0.9}>
                  {/* 제목 + 버튼 */}
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1.5}
                    justifyContent="center"
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {title}
                    </Typography>
                    {renderToggleButtons(item)}
                  </Stack>

                  {/* 패턴(문법 형식) */}
                  {sub && (
                    <Typography variant="body2" color="text.secondary">
                      패턴: {sub}
                    </Typography>
                  )}

                  {/* 기본 뜻 */}
                  {meaning && (
                    <Typography variant="body2" sx={{ mt: 0.25 }}>
                      의미: {meaning}
                    </Typography>
                  )}

                  {/* 추가 설명 */}
                  {description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      {description}
                    </Typography>
                  )}

                  {/* 예문들 */}
                  {examples.length > 0 && (
                    <Box sx={{ mt: 0.75 }}>
                      <Typography variant="caption" color="text.secondary">
                        예문
                      </Typography>
                      <Stack spacing={0.6} sx={{ mt: 0.3 }}>
                        {examples.map((ex, ei) => (
                          <Box key={ei}>
                            {ex.zh && (
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600 }}
                              >
                                {ex.zh}
                              </Typography>
                            )}
                            {ex.pinyin && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {ex.pinyin}
                              </Typography>
                            )}
                            {ex.ko && (
                              <Typography variant="body2">{ex.ko}</Typography>
                            )}
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          );
        }

        /** ─────────────────────
         *  3) 단어 / 문장 공통 카드
         *  ───────────────────── */
        const zh = item.zh || "";
        const pinyin = item.pinyin || "";
        const ko =
          item.ko ||
          item.meaning_ko ||
          item.meaningKr ||
          item.kr ||
          "";

        return (
          <Card key={idx} variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent sx={{ py: 1.1, "&:last-child": { pb: 1.1 } }}>
              <Stack spacing={0.75}>
                {/* 상단: 중국어 + 버튼들 */}
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1.5}
                  justifyContent="center"
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {zh}
                  </Typography>

                  {renderToggleButtons(item)}
                </Stack>

                {/* 병음 */}
                {pinyin && (
                  <Typography variant="body2" color="text.secondary">
                    {pinyin}
                  </Typography>
                )}

                {/* 한국어 뜻 */}
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

function TypeContentCard({
  typeKey,
  label,
  reviewItems,
  masterItems,
  onSpeak,
  onToggleStatus,
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
            />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function ReviewSections({
  selectedDateKey,
  hasHistory, // 현재는 사용하지 않지만 prop 유지
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

  // 진행률 (master / (review + master))
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

  // 실제 아이템이 하나라도 있는지
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
        return undefined; // 문법은 TTS 없음
    }
  };

  // ✅ 진짜로 아무 복습 아이템도 없을 때만 안내 문구
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
      {/* 상단 안내 + 알약 탭 포함 카드 */}
      <Card>
        <CardContent>
          <Stack spacing={1.5}>
            <Typography variant="subtitle1" fontWeight={700}>
              {selectedDateKey} 학습 복습
            </Typography>

            {/* 알약형 탭 */}
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

      {/* 선택된 유형 카드 */}
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
