// src/lib/ttsHelper.js

/**
 * 🔊 중국어 TTS 실행
 * text: 예) "放心"
 */
export function speakZh(text) {
  if (!text) return;

  // 브라우저 speechSynthesis 사용
  const synth = window.speechSynthesis;
  if (!synth) {
    console.warn("Speech Synthesis not supported.");
    return;
  }

  const utter = new SpeechSynthesisUtterance(text);

  /**
   * 🔍 중국어 음성 찾기
   * zh-CN, zh-TW 둘 다 검색
   */
  const voices = synth.getVoices();
  const zhVoice =
    voices.find((v) => v.lang === "zh-CN") ||
    voices.find((v) => v.lang.startsWith("zh")) ||
    voices.find((v) => v.lang === "zh-TW");

  if (zhVoice) {
    utter.voice = zhVoice;
  } else {
    console.warn("중국어 음성을 찾을 수 없음. 기본음성 사용.");
  }

  // 속도·톤 기본 설정
  utter.rate = 1;
  utter.pitch = 1;
  utter.volume = 1;

  synth.cancel(); // 기존 재생 중지
  synth.speak(utter);
}

/**
 * 🔊 준비가 안 된 상태에서 voices가 로딩되도록 강제 호출
 * App 초기 실행 시 1~2번 호출하면 voice 목록이 제대로 준비됨
 */
export function prepareVoices() {
  const synth = window.speechSynthesis;
  if (!synth) return;

  synth.getVoices(); // 초기 로드
}
