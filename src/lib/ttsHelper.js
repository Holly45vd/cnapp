// src/lib/ttsHelper.js

const TTS_CONFIG_KEY = "cnstudy_tts_prefs";

/** 🔧 현재 TTS 설정 가져오기 (localStorage 기반) */
export function getTtsConfig() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(TTS_CONFIG_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed || {};
  } catch (e) {
    console.warn("getTtsConfig parse error", e);
    return {};
  }
}

/** 🔧 TTS 설정 저장 (부분 업데이트) */
export function setTtsConfig(patch) {
  if (typeof window === "undefined") return;
  const prev = getTtsConfig();
  const next = {
    ...prev,
    ...patch,
  };
  try {
    window.localStorage.setItem(TTS_CONFIG_KEY, JSON.stringify(next));
  } catch (e) {
    console.warn("setTtsConfig error", e);
  }
  return next;
}

/** 내부용: 중국어 보이스 목록에서 gender에 맞는 보이스 찾기 */
function pickZhVoiceByGender(voices, gender) {
  if (!voices || voices.length === 0) return null;

  // 중국어 계열만 필터
  const zhVoices = voices.filter((v) => {
    const lang = (v.lang || "").toLowerCase();
    return (
      lang.startsWith("zh") || // zh-CN, zh-TW 등
      lang.includes("chinese") ||
      lang.includes("cmn") // 일부 브라우저 코드
    );
  });

  if (zhVoices.length === 0) return null;

  if (!gender || gender === "default") {
    return zhVoices[0];
  }

  const lowerGender = gender.toLowerCase();

  // 이름에 남/여 느낌 키워드가 있는지 체크 (대충 휴리스틱)
  const maleKeywords = ["male", "man", "boy", "남", "남성", "男", "男声"];
  const femaleKeywords = ["female", "woman", "girl", "여", "여성", "女", "女声"];

  const targetKeywords =
    lowerGender === "male" ? maleKeywords : femaleKeywords;

  const matched = zhVoices.find((v) => {
    const name = (v.name || "").toLowerCase();
    const localService = (v.localService ? "" : "").toLowerCase();
    const combo = `${name} ${localService}`;
    return targetKeywords.some((kw) => combo.includes(kw.toLowerCase()));
  });

  return matched || zhVoices[0];
}

/**
 * 🔊 중국어 TTS 실행
 *  - text: 예) "放心"
 *  - 내부적으로 localStorage에 저장된 설정(rate, pitch, gender)을 사용
 */
export function speakZh(text) {
  if (!text) return;

  const synth = window.speechSynthesis;
  if (!synth) {
    console.warn("Speech Synthesis not supported.");
    return;
  }

  const cfg = getTtsConfig();
  const rate = typeof cfg.rate === "number" && cfg.rate > 0 ? cfg.rate : 1;
  const pitch =
    typeof cfg.pitch === "number" && cfg.pitch > 0 ? cfg.pitch : 1;
  const gender = cfg.gender || "default"; // "default" | "male" | "female"

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "zh-CN"; // 기본 중국어 (필요하면 zh-TW 등으로 바꿀 수 있음)
  utter.rate = rate; // 0.1 ~ 10, 보통 0.7~1.3 정도를 추천
  utter.pitch = pitch; // 0 ~ 2, 1이 기본

  const voices = synth.getVoices();

  const pickVoiceAndSpeak = () => {
    const updatedVoices = synth.getVoices();
    const voice = pickZhVoiceByGender(updatedVoices, gender);

    if (voice) {
      utter.voice = voice;
    }

    synth.cancel(); // 기존 재생 중단 후
    synth.speak(utter);
  };

  if (!voices || voices.length === 0) {
    // 일부 브라우저는 getVoices() 비동기라 이벤트 한번 기다려야 함
    synth.onvoiceschanged = () => {
      pickVoiceAndSpeak();
    };
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
