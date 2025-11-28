// src/app/utils/routineEngine.js

// -----------------------------
// 1) sampleSize 직접 구현 (방법 B)
// -----------------------------
function sampleSize(arr, n) {
  if (!Array.isArray(arr)) return [];
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// -----------------------------
// 2) 중복 제외 추출 함수
// -----------------------------
function pickExceptRecent(pool, n, recentIds) {
  const candidates = pool.filter((x) => !recentIds.has(x.id));

  // 중복 제외된 후보가 충분할 때
  if (candidates.length >= n) return sampleSize(candidates, n);

  // 부족할 때: 후보 + 부족분은 전체 pool에서 보충
  const picked = [...candidates];
  const rest = pool.filter((x) => !picked.some((p) => p.id === x.id));
  picked.push(...sampleSize(rest, n - picked.length));

  return picked;
}

// -----------------------------
// 3) 메인 루틴 생성 함수
// -----------------------------
export function buildRoutineFromHistory(
  pools,
  recentIds,
  options = {}
) {
  const {
    wordCount = 6,
    sentenceCount = 3,
    grammarCount = 1,
    dialogCount = 1,
  } = options;

  const wordsPicked = pickExceptRecent(
    pools.words,
    wordCount,
    recentIds
  );
  const sentencesPicked = pickExceptRecent(
    pools.sentences,
    sentenceCount,
    recentIds
  );
  const grammarPicked = pickExceptRecent(
    pools.grammar,
    grammarCount,
    recentIds
  );
  const dialogsPicked = pickExceptRecent(
    pools.dialogs,
    dialogCount,
    recentIds
  );

  return {
    words: wordsPicked.map((x) => x.id),
    sentences: sentencesPicked.map((x) => x.id),
    grammar: grammarPicked.map((x) => x.id),
    dialogs: dialogsPicked.map((x) => x.id),
  };
}
