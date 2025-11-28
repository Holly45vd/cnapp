// src/app/pages/GrammarSession.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { listCollection } from "../../firebase/db";
import { freeTextPinyinToKorean } from "../../lib/pinyinKorean";
import { speakZh } from "../../lib/ttsHelper";
import { zhToPinyin, patternZhToPinyin } from "../../lib/zhToPinyin";

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
  Divider,
} from "@mui/material";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";

export default function GrammarSession({
  grammarIds: propGrammarIds,
  onDone,
  mode,
}) {
  const { state } = useLocation();
  const grammarIds = propGrammarIds || state?.routine?.grammar || [];

  const [allGrammar, setAllGrammar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);

  const [doneIds, setDoneIds] = useState([]);
  const [knownIds, setKnownIds] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const grammar = await listCollection("grammar");
        setAllGrammar(grammar);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sessionGrammar = useMemo(() => {
    if (!grammarIds?.length) return [];
    const idSet = new Set(grammarIds);
    return allGrammar.filter((g) => idSet.has(g.grammarId));
  }, [allGrammar, grammarIds]);

  const current = sessionGrammar[idx];

  const handleChoice = (type) => {
    if (!current) return;

    if (type === "learn") setDoneIds((p) => [...p, current.grammarId]);
    if (type === "known") setKnownIds((p) => [...knownIds, current.grammarId]);

    const nextIdx = idx + 1;
    if (nextIdx >= sessionGrammar.length) {
      onDone?.({
        grammarDone:
          type === "learn" ? [...doneIds, current.grammarId] : doneIds,
        grammarKnown:
          type === "known" ? [...knownIds, current.grammarId] : knownIds,
      });
      return;
    }
    setIdx(nextIdx);
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          문법 불러오는 중...
        </Typography>
      </Box>
    );
  }

  if (!sessionGrammar.length) {
    return (
      <Box sx={{ p: 2 }}>
        {mode !== "today" && (
          <Typography variant="h6" fontWeight={800}>
            오늘 공부 - 문법
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary">
          오늘 학습할 문법이 없습니다.
        </Typography>
      </Box>
    );
  }

  // 대표 예문 – 첫 번째 예문
  const example = current.examples?.[0];
  const examplePinyin = example?.pinyin || "";
  const exampleKoPron = examplePinyin
    ? freeTextPinyinToKorean(examplePinyin)
    : "";

  const handleExampleSpeak = () => {
    if (!example?.zh) return;
    speakZh(example.audio?.ttsText || example.zh);
  };

  // 의미(중문) → 병음 → 한국어 발음
  const meaningZhPinyin = current?.meaning_zh
    ? zhToPinyin(current.meaning_zh)
    : "";
  const meaningZhKoPron = meaningZhPinyin
    ? freeTextPinyinToKorean(meaningZhPinyin)
    : "";

  // 핵심 패턴 → 병음 → 한국어 발음
  const corePatternPinyin = current?.corePattern
    ? patternZhToPinyin(current.corePattern)
    : "";
  const corePatternKoPron = corePatternPinyin
    ? freeTextPinyinToKorean(corePatternPinyin)
    : "";

  const content = (
    <Stack spacing={2}>
      {/* 상단 헤더 카드 (제목 / 진행도) */}
      {mode !== "today" && (
        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between">
              <Typography fontWeight={800}>오늘 공부 - 문법</Typography>
              <Typography variant="caption" color="text.secondary">
                {idx + 1} / {sessionGrammar.length}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* 메인 문법 카드 */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ py: 3 }}>
          <Stack spacing={2.4}>
            {/* 태그/레벨/난이도 */}
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
            >
              <Chip
                size="small"
                label="문법 포인트"
                sx={{ width: "fit-content" }}
              />
              {current.level != null && (
                <Chip
                  size="small"
                  label={`LV.${current.level}`}
                  color="primary"
                  variant="outlined"
                />
              )}
              {current.difficulty && (
                <Chip
                  size="small"
                  label={current.difficulty}
                  color="secondary"
                  variant="outlined"
                />
              )}
              {(current.tags || current.category)?.map((tag) => (
                <Chip
                  key={tag}
                  size="small"
                  label={tag}
                  variant="outlined"
                  sx={{ ml: 0.5, mt: 0.5 }}
                />
              ))}
            </Stack>

            {/* 제목 */}
            <Typography variant="h6" fontWeight={800}>
              {current.title || current.shortTitle}
            </Typography>

            {/* 의미/설명 블록 */}
            {(current.meaning_ko ||
              current.meaning_zh ||
              current.subtitle ||
              current.description) && (
              <Box>
                {current.meaning_ko && (
                  <Typography sx={{ lineHeight: 1.7 }}>
                    {current.meaning_ko}
                  </Typography>
                )}

                {current.meaning_zh && (
                  <Box sx={{ mt: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      {current.meaning_zh}
                    </Typography>
                    {meaningZhPinyin && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 0.3 }}
                      >
                        {meaningZhPinyin}
                      </Typography>
                    )}
                    {meaningZhKoPron && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 0.1 }}
                      >
                        {meaningZhKoPron}
                      </Typography>
                    )}
                  </Box>
                )}

                {current.subtitle && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    {current.subtitle}
                  </Typography>
                )}
                {current.description && (
                  <Typography sx={{ lineHeight: 1.7, mt: 0.5 }}>
                    {current.description}
                  </Typography>
                )}
              </Box>
            )}

            {/* 핵심 패턴 */}
            {current.corePattern && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  핵심 패턴
                </Typography>
                <Box
                  sx={{
                    fontFamily: "monospace",
                    bgcolor: "grey.50",
                    p: 2,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "grey.200",
                  }}
                >
                  {current.corePattern}
                </Box>

                {(corePatternPinyin || corePatternKoPron) && (
                  <Box sx={{ mt: 0.5 }}>
                    {corePatternPinyin && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block" }}
                      >
                        {corePatternPinyin}
                      </Typography>
                    )}
                    {corePatternKoPron && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 0.1 }}
                      >
                        {corePatternKoPron}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            )}

            {/* 언제 쓰나 / 언제 안 쓰나 */}
            {(current.whenToUse?.length || current.whenNotToUse?.length) && (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                {current.whenToUse?.length ? (
                  <Box flex={1}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      언제 쓰나?
                    </Typography>
                    <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
                      {current.whenToUse.map((item, i) => (
                        <li key={i}>
                          <Typography variant="body2">{item}</Typography>
                        </li>
                      ))}
                    </ul>
                  </Box>
                ) : null}
                {current.whenNotToUse?.length ? (
                  <Box flex={1}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      언제 피해야 하나?
                    </Typography>
                    <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
                      {current.whenNotToUse.map((item, i) => (
                        <li key={i}>
                          <Typography variant="body2">{item}</Typography>
                        </li>
                      ))}
                    </ul>
                  </Box>
                ) : null}
              </Stack>
            )}

            {/* 세부 패턴 리스트 */}
            {current.patterns?.length && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  세부 패턴
                </Typography>
                <Stack spacing={1}>
                  {current.patterns.map((p, i) => {
                    const pattPy = patternZhToPinyin(p.pattern || "");
                    const pattKo = pattPy
                      ? freeTextPinyinToKorean(pattPy)
                      : "";
                    return (
                      <Box
                        key={i}
                        sx={{
                          bgcolor: "grey.50",
                          borderRadius: 2,
                          p: 1.5,
                          border: "1px solid",
                          borderColor: "grey.200",
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: "monospace" }}
                        >
                          {p.pattern}
                        </Typography>
                        {(pattPy || pattKo) && (
                          <Box sx={{ mt: 0.3 }}>
                            {pattPy && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: "block" }}
                              >
                                {pattPy}
                              </Typography>
                            )}
                            {pattKo && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: "block", mt: 0.1 }}
                              >
                                {pattKo}
                              </Typography>
                            )}
                          </Box>
                        )}
                        {p.useCase_ko && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.3 }}
                          >
                            {p.useCase_ko}
                          </Typography>
                        )}
                        {p.constraints?.length && (
                          <ul
                            style={{
                              margin: 0,
                              paddingLeft: "1.2rem",
                              marginTop: 4,
                            }}
                          >
                            {p.constraints.map((c, j) => (
                              <li key={j}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {c}
                                </Typography>
                              </li>
                            ))}
                          </ul>
                        )}
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            )}

            {/* 대표 예문 하이라이트 박스 (첫 번째 예문) */}
            {example && (
              <Box
                sx={{
                  bgcolor: "#FFF7E8",
                  p: 2,
                  borderRadius: 2,
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  spacing={1}
                >
                  <Box>
                    <Typography fontWeight={700}>대표 예문</Typography>
                    <Typography sx={{ mt: 1 }}>{example.zh}</Typography>

                    {examplePinyin && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        {examplePinyin}
                      </Typography>
                    )}

                    {exampleKoPron && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 0.3 }}
                      >
                        {exampleKoPron}
                      </Typography>
                    )}

                    {example.ko && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        {example.ko}
                      </Typography>
                    )}
                  </Box>

                  <IconButton
                    size="small"
                    onClick={handleExampleSpeak}
                    sx={{
                      bgcolor: "orange.50",
                      color: "warning.main",
                      "&:hover": { bgcolor: "orange.100" },
                    }}
                  >
                    <VolumeUpIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Box>
            )}

            {/* 모든 예문 리스트 */}
            {current.examples?.length > 1 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  예문 더 보기
                </Typography>
                <Stack spacing={1.5}>
                  {current.examples.slice(1).map((ex) => {
                    const pinyin = ex.pinyin || "";
                    const koPron = pinyin ? freeTextPinyinToKorean(pinyin) : "";
                    const structure =
                      ex.structure &&
                      Object.entries(ex.structure)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" / ");

                    const handleSpeak = () => {
                      speakZh(ex.audio?.ttsText || ex.zh);
                    };

                    return (
                      <Box
                        key={ex.exampleId}
                        sx={{
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "grey.200",
                          p: 1.5,
                        }}
                      >
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="flex-start"
                          spacing={1}
                        >
                          <Box>
                            <Typography>{ex.zh}</Typography>
                            {pinyin && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 0.3 }}
                              >
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
                            {ex.ko && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 0.3 }}
                              >
                                {ex.ko}
                              </Typography>
                            )}
                            {structure && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ mt: 0.3 }}
                              >
                                구조: {structure}
                              </Typography>
                            )}
                            {ex.notes_ko && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ mt: 0.3, display: "block" }}
                              >
                                노트: {ex.notes_ko}
                              </Typography>
                            )}
                          </Box>
                          <IconButton
                            size="small"
                            onClick={handleSpeak}
                            sx={{
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
                </Stack>
              </Box>
            )}

            <Divider sx={{ my: 1.5 }} />

            {/* 자주 하는 실수 */}
            {current.commonErrors?.length && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  자주 하는 실수
                </Typography>
                <Stack spacing={1}>
                  {current.commonErrors.map((err, i) => (
                    <Box
                      key={i}
                      sx={{
                        borderRadius: 2,
                        border: "1px dashed",
                        borderColor: "error.light",
                        p: 1.5,
                        bgcolor: "error.50",
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="error.main"
                        sx={{ fontWeight: 600 }}
                      >
                        {err.error_ko}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ mt: 0.5, textDecoration: "line-through" }}
                      >
                        ✕ {err.wrong_zh}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.2 }}>
                        ✓ {err.correct_zh}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {/* 비슷한 문법과 비교 */}
            {current.contrast?.length && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  비슷한 문법과 비교
                </Typography>
                <Stack spacing={1}>
                  {current.contrast.map((c, i) => (
                    <Box key={i}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {c.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {c.diff_ko}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {/* 문장 변환 규칙 */}
            {current.transformRules?.length && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  문장 변환 규칙
                </Typography>
                <Stack spacing={1}>
                  {current.transformRules.map((r) => (
                    <Box
                      key={r.ruleId}
                      sx={{
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "grey.200",
                        p: 1.5,
                      }}
                    >
                      <Typography variant="body2">
                        {r.fromPattern} ➜ {r.toPattern}
                      </Typography>
                      {r.exampleFrom && r.exampleTo && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.3 }}
                        >
                          {r.exampleFrom} ➜ {r.exampleTo}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

        

            {/* 진행률 */}
            <LinearProgress
              variant="determinate"
              value={((idx + 1) / sessionGrammar.length) * 100}
              sx={{ height: 6, borderRadius: 999, mt: 1 }}
            />
            <Typography variant="caption" color="text.secondary">
              {idx + 1} / {sessionGrammar.length}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {/* 액션 버튼 */}
      <Stack direction="row" spacing={1.5}>
        <Button
          fullWidth
          variant="contained"
          color="warning"
          onClick={() => handleChoice("learn")}
          sx={{ fontWeight: 800, borderRadius: 2, py: 1.5 }}
        >
          다시보기
        </Button>
        <Button
          fullWidth
          variant="contained"
          onClick={() => handleChoice("known")}
          sx={{ fontWeight: 800, borderRadius: 2, py: 1.5 }}
        >
          외웠음
        </Button>
      </Stack>

      <Button
        onClick={() =>
          onDone?.({ grammarDone: doneIds, grammarKnown: knownIds })
        }
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
