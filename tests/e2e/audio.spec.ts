import { expect, test } from "@playwright/test";

// A fake speech engine: records speak/cancel calls and lets the test finish utterances,
// since headless browsers have no voices to play.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const log: string[] = [];
    const queue: SpeechSynthesisUtterance[] = [];
    const voices = [
      { name: "Fred", lang: "en-US", localService: true },
      {
        name: "Microsoft Ava Online (Natural) - English (United States)",
        lang: "en-US",
        localService: false,
      },
      { name: "Thomas", lang: "fr-FR", localService: true },
    ];
    const fake = {
      speaking: false,
      paused: false,
      pending: false,
      getVoices: () => voices,
      speak(u: SpeechSynthesisUtterance) {
        log.push(`speak:${u.voice?.name ?? "default"}`);
        queue.push(u);
        u.onstart?.(new Event("start") as SpeechSynthesisEvent);
      },
      cancel() {
        log.push("cancel");
        queue.length = 0;
      },
      pause() {},
      resume() {},
      addEventListener() {},
      removeEventListener() {},
    };
    // real utterances only accept real SpeechSynthesisVoice objects, so fake those too
    class FakeUtterance {
      text: string;
      lang = "";
      rate = 1;
      voice: { name: string } | null = null;
      onstart: ((e: Event) => void) | null = null;
      onend: ((e: Event) => void) | null = null;
      onerror: ((e: Event) => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    }
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      value: FakeUtterance,
    });
    Object.defineProperty(window, "speechSynthesis", { value: fake });
    Object.assign(window, {
      __speech: {
        log,
        // finish the utterance that's speaking, as the engine would
        finish: () =>
          queue.shift()?.onend?.(new Event("end") as SpeechSynthesisEvent),
      },
    });
  });
  await page.goto("/blog/hello-rustophile");
});

const speech = (page: import("@playwright/test").Page) =>
  page.evaluate(
    () => (window as unknown as { __speech: { log: string[] } }).__speech.log,
  );

test("reads part after part without cancelling between them, in the best voice", async ({
  page,
}) => {
  await page.locator("#audio-toggle-btn").click();
  await page.locator("#audio-play-btn").click();

  // pressing play may cancel whatever was speaking, then speaks the first part
  await expect
    .poll(() => speech(page))
    .toContain(
      "speak:Microsoft Ava Online (Natural) - English (United States)",
    );
  const before = (await speech(page)).length;

  for (let i = 0; i < 3; i++) {
    await page.evaluate(() =>
      (
        window as unknown as { __speech: { finish: () => void } }
      ).__speech.finish(),
    );
  }
  const after = (await speech(page)).slice(before);
  expect(after).toHaveLength(3);
  expect(after.every((call) => call.startsWith("speak:"))).toBe(true);
});

test("skipping ahead interrupts the current part", async ({ page }) => {
  await page.locator("#audio-toggle-btn").click();
  await page.locator("#audio-play-btn").click();
  await expect
    .poll(() => speech(page))
    .toContain(
      "speak:Microsoft Ava Online (Natural) - English (United States)",
    );
  const before = (await speech(page)).length;
  await page.locator("#audio-next-btn").click();
  expect((await speech(page)).slice(before)).toEqual([
    "cancel",
    "speak:Microsoft Ava Online (Natural) - English (United States)",
  ]);
});
