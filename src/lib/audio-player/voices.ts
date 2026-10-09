// Prefer neural voices, enhanced local voices, and Google's voices before generic defaults.
const VOICE_RANKS = [/natural|neural/i, /premium/i, /enhanced/i, /^google/i];

export function selectVoice(
  voices: SpeechSynthesisVoice[],
  language: string,
): SpeechSynthesisVoice | null {
  const target = language.toLowerCase();
  const rank = (voice: SpeechSynthesisVoice) => {
    const index = VOICE_RANKS.findIndex((pattern) => pattern.test(voice.name));
    return index === -1
      ? VOICE_RANKS.length + (voice.localService ? 0 : 1)
      : index;
  };

  return (
    voices
      .filter((voice) =>
        voice.lang.toLowerCase().replace("_", "-").startsWith(target),
      )
      .sort((a, b) => rank(a) - rank(b))[0] ?? null
  );
}
