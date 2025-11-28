// src/lib/pinyinKorean.js
import pinyinData from "./pinyinData.json";

// pinyin → korean 맵
const MAP = new Map(
  (pinyinData || []).map((item) => [item.pinyin.toLowerCase(), item.korean])
);

// 성조 달린 모음 → 기본 모음으로 변환
const TONE_MAP = {
  ā: "a", á: "a", ǎ: "a", à: "a",
  ē: "e", é: "e", ě: "e", è: "e",
  ī: "i", í: "i", ǐ: "i", ì: "i",
  ō: "o", ó: "o", ǒ: "o", ò: "o",
  ū: "u", ú: "u", ǔ: "u", ù: "u",
  ǖ: "ü", ǘ: "ü", ǚ: "ü", ǜ: "ü",
};

// 한 음절의 성조/숫자 제거 + 소문자
function normalizeSyllable(s) {
  if (!s) return "";
  let out = s.toLowerCase();
  out = out.replace(/[0-9]/g, "");
  out = out
    .split("")
    .map((ch) => TONE_MAP[ch] || ch)
    .join("");
  return out;
}

// "fàng" → "팡" 처럼 한 음절 변환
export function pinyinSyllableToKorean(syllable) {
  const key = normalizeSyllable(syllable);
  return MAP.get(key) || syllable;
}

// ["fàng", "xīn"] → "팡 신"
export function pinyinArrayToKorean(syllables = []) {
  return syllables.map(pinyinSyllableToKorean).join(" ");
}

// -----------------------------
// freeTextPinyinToKorean 추가
// -----------------------------

// MAP에 들어있는 key들(=사용 가능한 음절 후보) 집합
const SYLLABLE_SET = new Set([...MAP.keys()]);

// "zhe" "ding" "maozi" 같이 붙어 있는 pinyin을
// 가능한 한 MAP에 있는 음절 단위로 잘라주는 함수
function splitToSyllables(rawSyllable) {
  const base = normalizeSyllable(rawSyllable);
  if (!base) return [];

  const result = [];
  let i = 0;
  const maxLen = 6; // pinyin 최대 길이 대략 6글자(zhuang 등)

  while (i < base.length) {
    let matched = null;
    let matchedLen = 0;

    for (let len = Math.min(maxLen, base.length - i); len >= 1; len--) {
      const part = base.slice(i, i + len);
      if (SYLLABLE_SET.has(part)) {
        matched = part;
        matchedLen = len;
        break;
      }
    }

    if (matched) {
      result.push(matched);
      i += matchedLen;
    } else {
      // 못 찾으면 그냥 한 글자씩 밀어가며 넣기
      result.push(base[i]);
      i += 1;
    }
  }

  return result;
}

// "Zhè dǐng màozi hěn hǎokàn." 같은 문장 전체를 한국어 발음으로
export function freeTextPinyinToKorean(text = "") {
  if (!text) return "";

  // 공백 기준으로 나눠서 토큰 단위 처리
  return text
    .split(/\s+/)
    .map((token) => {
      if (!token) return "";

      // 앞부분: 글자/성조/숫자, 뒷부분: 구두점 등
      const match = token.match(
        /^([\p{L}\p{M}üÜǖǘǚǜ0-9]+)(.*)$/u
      );
      if (!match) {
        // 그냥 구두점만 있는 경우 등
        return token;
      }

      const raw = match[1];
      const tail = match[2] || "";

      // "maozi" → ["mao", "zi"] 식으로 쪼개기
      const syllables = splitToSyllables(raw);

      const korean = syllables
        .map((syll) => pinyinSyllableToKorean(syll))
        .join(" ");

      return korean + tail;
    })
    .join(" ");
}
