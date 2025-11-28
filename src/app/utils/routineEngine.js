// src/app/utils/routineEngine.js

// -----------------------------
// 1) sampleSize 직접 구현
// -----------------------------
function sampleSize(arr, n) {
  if (!Array.isArray(arr)) return [];
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// -----------------------------
// 2) 중복 제외 추출 함수 (recentIds 제외)
// -----------------------------
function pickExceptRecent(pool, n, recentIds) {
  if (!Array.isArray(pool) || n <= 0) return [];

  const recentSet = recentIds || new Set();

  const candidates = pool.filter((x) => !recentSet.has(x.id));

  // 중복 제외된 후보가 충분할 때
  if (candidates.length >= n) return sampleSize(candidates, n);

  // 부족할 때: 후보 + 부족분은 전체 pool에서 보충
  const picked = [...candidates];
  const pickedIdSet = new Set(picked.map((x) => x.id));

  const rest = pool.filter((x) => !pickedIdSet.has(x.id));
  const need = n - picked.length;

  if (need > 0 && rest.length > 0) {
    picked.push(...sampleSize(rest, Math.min(need, rest.length)));
  }

  return picked;
}

// -----------------------------
// 3) 단어와 연결된 문장을 우선 선택하는 함수
//    - 오늘 단어와 연결된 문장 우선
//    - 부족하면 전체 문장에서 채워서 "n개 맞추기" 시도
// -----------------------------
function pickSentencesForWords(pools, todayWordIds, n, recentIds) {
  const full = Array.isArray(pools.sentences) ? pools.sentences : [];
  if (!n || !full.length) return [];

  const recentSet = recentIds || new Set();
  const wordIdSet = new Set(todayWordIds || []);

  // sentences[].words 안에 wordId 또는 id 기준으로 연결된 문장 찾기
  const linkedAll = full.filter((s) => {
    const words = Array.isArray(s.words) ? s.words : [];
    return words.some((w) => {
      const wid = w.wordId || w.id;
      return wid && wordIdSet.has(wid);
    });
  });

  // 연결된 문장이 하나도 없으면 전체 문장 풀에서 뽑기
  const basePool = linkedAll.length ? linkedAll : full;

  // 1차: basePool 안에서 최근 학습 제외
  const baseCandidates = basePool.filter((x) => !recentSet.has(x.id));

  if (baseCandidates.length >= n) {
    return sampleSize(baseCandidates, n);
  }

  // 2차: baseCandidates + 나머지 전체 문장에서 채우기
  let picked = [...baseCandidates];
  const pickedIdSet = new Set(picked.map((x) => x.id));

  const rest = full.filter((x) => !pickedIdSet.has(x.id));
  const need = n - picked.length;

  if (need > 0 && rest.length > 0) {
    picked = picked.concat(
      sampleSize(rest, Math.min(need, rest.length))
    );
  }

  return picked;
}

// -----------------------------
// 4) 메인 루틴 생성 함수
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

  const safePools = {
    words: Array.isArray(pools.words) ? pools.words : [],
    sentences: Array.isArray(pools.sentences) ? pools.sentences : [],
    grammar: Array.isArray(pools.grammar) ? pools.grammar : [],
    dialogs: Array.isArray(pools.dialogs) ? pools.dialogs : [],
  };

  const recentSet = recentIds || new Set();

  // 1) 단어 먼저 뽑기
  const wordsPicked = pickExceptRecent(
    safePools.words,
    wordCount,
    recentSet
  );
  const todayWordIds = wordsPicked.map((x) => x.id);

  // 2) 단어와 연결된 문장을 우선해서 sentenceCount개
  const sentencesPicked = pickSentencesForWords(
    safePools,
    todayWordIds,
    sentenceCount,
    recentSet
  );

  // 3) 문법
  const grammarPicked = pickExceptRecent(
    safePools.grammar,
    grammarCount,
    recentSet
  );

  // 4) 회화
  const dialogsPicked = pickExceptRecent(
    safePools.dialogs,
    dialogCount,
    recentSet
  );

  return {
    words: wordsPicked.map((x) => x.id),
    sentences: sentencesPicked.map((x) => x.id),
    grammar: grammarPicked.map((x) => x.id),
    dialogs: dialogsPicked.map((x) => x.id),
  };
}
