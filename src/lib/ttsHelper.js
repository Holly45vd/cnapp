// src/lib/ttsHelper.js

/**
 * 🔊 중국어 TTS 실행
 * text: 예) "放心"
 */
export function speakZh(text) {
  if (!text) return;

  const synth = window.speechSynthesis;
  if (!synth) {
    console.warn("Speech Synthesis not supported.");
    return;
  }

  const utter = new SpeechSynthesisUtterance(text);

  const pickVoiceAndSpeak = () => {
    const voices = synth.getVoices() || [];

    // zh 계열 언어를 최대한 다 잡기
    const zhVoice =
      voices.find((v) => v.lang?.toLowerCase() === "zh-cn") ||
      voices.find((v) => v.lang?.toLowerCase() === "zh-tw") ||
      voices.find((v) => v.lang?.toLowerCase().startsWith("zh")) ||
      voices.find((v) => v.lang?.toLowerCase().includes("zh")) ||
      voices.find((v) => v.name?.toLowerCase().includes("chinese")) ||
      voices.find((v) => v.lang?.toLowerCase().startsWith("cmn")); // 일부 환경: cmn-Hans-CN 등

    if (zhVoice) {
      utter.voice = zhVoice;
    } else {
      console.warn("⚠️ 중국어 음성을 찾을 수 없음. 기본 음성 사용.");
    }

    utter.rate = 1;
    utter.pitch = 1;
    utter.volume = 1;

    synth.cancel();
    synth.speak(utter);
  };

  // voices가 아직 로드 안 된 경우(onvoiceschanged 사용)
  if (!synth.getVoices().length && "onvoiceschanged" in synth) {
    const handler = () => {
      pickVoiceAndSpeak();
      synth.onvoiceschanged = null; // 한 번만
    };
    synth.onvoiceschanged = handler;
    synth.getVoices(); // 트리거
  } else {
    pickVoiceAndSpeak();
  }
}

/**
 * 🔊 (선택) 앱 시작 시 한 번 호출해서 voice 목록 미리 로드
 */
export function prepareVoices() {
  const synth = window.speechSynthesis;
  if (!synth) return;
  synth.getVoices();
}
