// Browser controller for the accessible Web Speech API player.
import { extractSpeechContent, speechLanguage } from "./content";
import { selectVoice } from "./voices";

let activeStickyObserver: IntersectionObserver | null = null;

function setupAudioPlayer() {
  // Teardown previous observer if present
  if (activeStickyObserver) {
    activeStickyObserver.disconnect();
    activeStickyObserver = null;
  }

  const root = document.getElementById("audio-player-root");
  if (!root) return;

  if (!("speechSynthesis" in window)) {
    root.style.display = "none";
    return;
  }

  const toggleBtn = document.getElementById("audio-toggle-btn");
  const playBtn = document.getElementById("audio-play-btn");
  const stopBtn = document.getElementById(
    "audio-stop-btn",
  ) as HTMLButtonElement | null;
  const prevBtn = document.getElementById(
    "audio-prev-btn",
  ) as HTMLButtonElement | null;
  const nextBtn = document.getElementById(
    "audio-next-btn",
  ) as HTMLButtonElement | null;
  const rateBtn = document.getElementById("audio-rate-btn");
  const rateVal = document.getElementById("audio-rate-val");
  const playText = document.getElementById("audio-play-text");
  const statusBadge = document.getElementById("audio-status-badge");
  const estimateLabel = document.getElementById("audio-estimate");
  const partLabel = document.getElementById("audio-part-label");
  const pctLabel = document.getElementById("audio-pct-label");
  const progressFill = document.getElementById("audio-progress-fill");
  const iconPlay = playBtn?.querySelector(".icon-play");
  const iconPause = playBtn?.querySelector(".icon-pause");

  const selector = root.dataset.selector || ".post-content";
  const contentEl = document.querySelector(selector);
  if (!contentEl) {
    root.style.display = "none";
    return;
  }

  const {
    nodes: textNodes,
    parts,
    totalWords,
  } = extractSpeechContent(contentEl);
  if (!parts.length) {
    root.style.display = "none";
    return;
  }

  const estMin = Math.max(1, Math.ceil(totalWords / 140)); // ~140 words/min speech rate

  if (estimateLabel) {
    estimateLabel.textContent = `~${estMin} min narration (${parts.length} parts)`;
  }

  let currentIndex = 0;
  let isPlaying = false;
  let isPaused = false;
  const rates = [1.0, 1.25, 1.5, 2.0, 0.75];
  let currentRateIdx = 0;
  const synth = window.speechSynthesis;
  let userToggledWhileSticky = false;

  const pageLang = document.documentElement.lang || "en";
  const targetLang = speechLanguage(pageLang);

  let voice: SpeechSynthesisVoice | null = null;
  function pickVoice() {
    voice = selectVoice(synth.getVoices(), targetLang);
  }
  pickVoice();
  // voices load asynchronously in Chrome
  synth.addEventListener("voiceschanged", pickVoice);

  function setExpanded(expanded: boolean) {
    if (expanded) {
      root?.classList.add("is-expanded");
      root?.classList.remove("is-collapsed");
      toggleBtn?.setAttribute("aria-expanded", "true");
      toggleBtn?.setAttribute("title", "Collapse audio player");
    } else {
      root?.classList.remove("is-expanded");
      root?.classList.add("is-collapsed");
      toggleBtn?.setAttribute("aria-expanded", "false");
      toggleBtn?.setAttribute("title", "Expand audio player");
    }
  }

  toggleBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    const isCurrentlyExpanded = root?.classList.contains("is-expanded");
    if (root?.classList.contains("is-sticky")) {
      userToggledWhileSticky = true;
    }
    if (!isCurrentlyExpanded) {
      root?.classList.add("is-active-player");
    }
    setExpanded(!isCurrentlyExpanded);
  });

  function updateProgress() {
    const pct = parts.length
      ? Math.round(((currentIndex + 1) / parts.length) * 100)
      : 0;
    if (progressFill) progressFill.style.width = `${pct}%`;

    const currentEl = textNodes[currentIndex];
    let label = `Part ${currentIndex + 1} of ${parts.length}`;
    if (currentEl) {
      if (currentEl.tagName === "H1") {
        label = targetLang.startsWith("pt")
          ? `Título (${currentIndex + 1} de ${parts.length})`
          : `Title (${currentIndex + 1} of ${parts.length})`;
      } else if (
        currentEl.classList.contains("post-description") ||
        currentEl.classList.contains("project-description")
      ) {
        label = targetLang.startsWith("pt")
          ? `Subtítulo (${currentIndex + 1} de ${parts.length})`
          : `Subtitle (${currentIndex + 1} of ${parts.length})`;
      } else {
        label = targetLang.startsWith("pt")
          ? `Parágrafo ${currentIndex + 1} de ${parts.length}`
          : `Paragraph ${currentIndex + 1} of ${parts.length}`;
      }
    }

    if (partLabel) partLabel.textContent = label;
    if (pctLabel) pctLabel.textContent = `${pct}%`;

    if (prevBtn) prevBtn.disabled = currentIndex <= 0;
    if (nextBtn) nextBtn.disabled = currentIndex >= parts.length - 1;
  }

  function clearHighlight() {
    document.querySelectorAll(".audio-speaking-active").forEach((el) => {
      el.classList.remove("audio-speaking-active");
    });
  }

  function highlightCurrent() {
    clearHighlight();
    const currentEl = textNodes[currentIndex];
    if (currentEl) {
      currentEl.classList.add("audio-speaking-active");
      const rect = currentEl.getBoundingClientRect();
      if (rect.top < 90 || rect.bottom > window.innerHeight - 80) {
        currentEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }

  // the utterance currently meant to be speaking; events from cancelled ones are ignored
  // (Safari fires onend for a cancelled utterance)
  let currentUtterance: SpeechSynthesisUtterance | null = null;

  // Called with interrupt=false only to move on after a part finishes: cancelling then
  // tears down the speech engine between parts, which crackles on some platforms.
  function playCurrentPart(interrupt = true) {
    if (currentIndex >= parts.length) {
      stopPlayback();
      return;
    }

    root?.classList.add("is-active-player");
    if (sentinel && sentinel.getBoundingClientRect().top <= 64) {
      root?.classList.add("is-sticky");
    }

    if (interrupt) synth.cancel();
    const text = parts[currentIndex];
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = targetLang;
    if (voice) utterance.voice = voice;
    utterance.rate = rates[currentRateIdx];
    currentUtterance = utterance;

    utterance.onstart = () => {
      if (utterance !== currentUtterance) return;
      isPlaying = true;
      isPaused = false;
      highlightCurrent();
      updateUI();
    };

    utterance.onend = () => {
      if (utterance !== currentUtterance) return;
      currentIndex++;
      updateProgress();
      if (currentIndex < parts.length && isPlaying) {
        playCurrentPart(false);
      } else {
        stopPlayback();
      }
    };

    utterance.onerror = (e) => {
      if (utterance !== currentUtterance) return;
      if (e.error === "canceled" || e.error === "interrupted") return;
      stopPlayback();
    };

    synth.speak(utterance);
  }

  function updateUI() {
    if (isPlaying && !isPaused) {
      iconPlay?.classList.add("hidden");
      iconPause?.classList.remove("hidden");
      if (playText) playText.textContent = "Pause";
      if (statusBadge) {
        statusBadge.textContent =
          parts.length > 0
            ? `Playing (${currentIndex + 1}/${parts.length})`
            : "Playing...";
      }
      root?.classList.add("is-playing");
      if (stopBtn) stopBtn.disabled = false;
    } else if (isPaused) {
      iconPlay?.classList.remove("hidden");
      iconPause?.classList.add("hidden");
      if (playText) playText.textContent = "Resume";
      if (statusBadge) statusBadge.textContent = "Paused";
      root?.classList.remove("is-playing");
    } else {
      iconPlay?.classList.remove("hidden");
      iconPause?.classList.add("hidden");
      if (playText) playText.textContent = "Play";
      if (statusBadge) statusBadge.textContent = "Ready to play";
      root?.classList.remove("is-playing");
      if (stopBtn) stopBtn.disabled = true;
    }
  }

  playBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    if (!isPlaying) {
      playCurrentPart();
    } else if (isPaused) {
      synth.resume();
      isPaused = false;
      updateUI();
    } else {
      synth.pause();
      isPaused = true;
      updateUI();
    }
  });

  function stopPlayback() {
    currentUtterance = null;
    synth.cancel();
    isPlaying = false;
    isPaused = false;
    currentIndex = 0;
    clearHighlight();
    root?.classList.remove("is-active-player", "is-sticky");
    userToggledWhileSticky = false;
    updateUI();
    updateProgress();
  }

  stopBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    stopPlayback();
  });

  prevBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    if (currentIndex > 0) {
      currentIndex--;
      updateProgress();
      if (isPlaying) playCurrentPart();
      else highlightCurrent();
    }
  });

  nextBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    if (currentIndex < parts.length - 1) {
      currentIndex++;
      updateProgress();
      if (isPlaying) playCurrentPart();
      else highlightCurrent();
    }
  });

  rateBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    currentRateIdx = (currentRateIdx + 1) % rates.length;
    const newRate = rates[currentRateIdx];
    if (rateVal)
      rateVal.textContent = `${newRate.toFixed(1).replace(".0", "")}x`;
    if (isPlaying) {
      playCurrentPart();
    }
  });

  updateProgress();

  // Sentinel & IntersectionObserver for Sticky detection
  let sentinel = root.parentElement?.querySelector(
    ".audio-sticky-sentinel",
  ) as HTMLElement | null;
  if (!sentinel) {
    sentinel = document.createElement("div");
    sentinel.className = "audio-sticky-sentinel";
    sentinel.style.cssText =
      "position: relative; top: -64px; height: 1px; pointer-events: none; visibility: hidden; margin: 0; padding: 0;";
    root.parentNode?.insertBefore(sentinel, root);
  }

  activeStickyObserver = new IntersectionObserver(
    ([entry]) => {
      const isActive = root?.classList.contains("is-active-player") ?? false;
      const isScrolledPast =
        !entry.isIntersecting && entry.boundingClientRect.top <= 64;
      const shouldBeSticky = isActive && isScrolledPast;
      const wasSticky = root?.classList.contains("is-sticky") ?? false;

      root?.classList.toggle("is-sticky", shouldBeSticky);

      if (shouldBeSticky && !wasSticky) {
        if (
          !userToggledWhileSticky &&
          root?.classList.contains("is-expanded")
        ) {
          setExpanded(false);
        }
      } else if (!shouldBeSticky && wasSticky) {
        userToggledWhileSticky = false;
      }
    },
    { threshold: [0, 1] },
  );

  activeStickyObserver.observe(sentinel);
}

// Initial run and page navigation hooks
setupAudioPlayer();
document.addEventListener("astro:page-load", setupAudioPlayer);
document.addEventListener("astro:after-swap", setupAudioPlayer);

// Global teardown listeners (module scripts run once per page load)
window.addEventListener("beforeunload", () => {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
});
document.addEventListener("astro:before-swap", () => {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  if (activeStickyObserver) {
    activeStickyObserver.disconnect();
    activeStickyObserver = null;
  }
});
