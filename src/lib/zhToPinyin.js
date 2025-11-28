// src/lib/zhToPinyin.js
import { pinyin } from "pinyin-pro";

// 일반 문장: "用于计算帽子..." → "Yòng yú jì suàn mào zi ..."
export function zhToPinyin(text = "") {
  if (!text) return "";
  return pinyin(text, {
    toneType: "mark",    // mā má mǎ mà 형식
    type: "string",      // 공백 포함 문자열
    nonZh: "consecutive" // 한자 아닌 건 원형 유지
  });
}

// 패턴용: "一顶 + 名词", "这/那 + 顶 + 名词" 등
export function patternZhToPinyin(pattern = "") {
  if (!pattern) return "";
  // +, /, 공백 등을 경계로 토큰 분리
  return pattern
    .split(/(\s*\+\s*|\s*\/\s*|\s+)/)
    .map((token) => {
      const hasHanzi = /[\u4e00-\u9fff]/.test(token);
      if (!hasHanzi) return token;
      return zhToPinyin(token);
    })
    .join("");
}
