import { test, expect } from "@playwright/test";

test("desktop: edit, protect, apply, audition, save, export and recover import errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Make it feel like you." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Lock BASS", exact: true }).click();
  await page
    .getByLabel("Your next groove")
    .fill("Dry sparse rubber bass, 129 BPM");
  await page.getByRole("button", { name: "Shape the draft" }).click();
  await expect(page.getByLabel("Tempo", { exact: true })).toHaveValue("129");
  await expect(
    page.getByRole("button", { name: "Unlock BASS", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Apply draft", exact: true }).click();
  await page.getByRole("button", { name: "Audition", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Audition", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Evolve unlocked parts" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.getByRole("button", { name: "Apply at next bar" }).click();
  await expect(page.getByRole("status")).toContainText("queued");
  await page.getByRole("button", { name: "Stop all playback" }).click();
  await page.getByRole("button", { name: "Remember this feel" }).click();
  await page.getByRole("button", { name: "Save here" }).click();
  await page.reload();
  await expect(page.getByLabel("Tempo", { exact: true })).toHaveValue("129");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export MIDI", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("Gold-Circuit.mid");
  await page.getByLabel("Import live project").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":1}'),
  });
  await expect(page.getByRole("alert")).toContainText("Invalid live project");
  await page.getByRole("button", { name: "Dismiss error" }).click();
  await page.getByRole("button", { name: "Select BASS", exact: true }).click();
  await page.getByLabel("BASS MIDI channel").fill("1");
  await expect(
    page.getByRole("button", { name: "Apply draft", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("BASS MIDI channel").fill("5");
  await expect(
    page.getByRole("button", { name: "Apply draft", exact: true }),
  ).toBeEnabled();
  await page.screenshot({
    path: "/workspace/scratch/ad2e0af2eb1e/qa-live-desktop.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("mobile, keyboard and reduced motion remain usable; no output error recovers", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe("A");
  await page.getByLabel("Playback destination").selectOption("hardware");
  await page.getByRole("button", { name: "Play MV-1", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Select an available MIDI output",
  );
  await page.getByRole("button", { name: "Dismiss error" }).click();
  await page.getByLabel("Playback destination").selectOption("audition");
  await page.getByRole("button", { name: "Audition", exact: true }).click();
  await page.getByRole("button", { name: "Stop all playback" }).click();
  await page.screenshot({
    path: "/workspace/scratch/ad2e0af2eb1e/qa-live-mobile.png",
    fullPage: true,
  });
});

test("mock MIDI: explicit port, controls opt-in, note playback and hot-unplug recovery", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const w = window as unknown as { sent: number[][]; unplug: () => void };
    w.sent = [];
    const output = {
      id: "mv1-test",
      name: "MV-1 MOCK PORT",
      state: "connected",
      open: async () => {},
      close: async () => {},
      clear: () => {},
      send: (bytes: number[]) => w.sent.push([...bytes]),
    };
    const access = {
      outputs: new Map([["mv1-test", output]]),
      onstatechange: null as null | (() => void),
    };
    Object.defineProperty(navigator, "requestMIDIAccess", {
      value: async () => access,
      configurable: true,
    });
    w.unplug = () => {
      output.state = "disconnected";
      access.onstatechange?.();
    };
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Connections & recording" }).click();
  await page.getByRole("button", { name: "Find MIDI outputs" }).click();
  await page
    .getByLabel("MIDI output", { exact: true })
    .selectOption("mv1-test");
  expect(
    await page.evaluate(
      () => (window as unknown as { sent: number[][] }).sent.length,
    ),
  ).toBe(0);
  await page.getByLabel("Include documented tone controls").check();
  await page.getByLabel("Playback destination").selectOption("hardware");
  await page.getByRole("button", { name: "Play MV-1", exact: true }).click();
  await page.waitForTimeout(400);
  const bytes = await page.evaluate(
    () => (window as unknown as { sent: number[][] }).sent,
  );
  expect(bytes.some((b) => (b[0] & 240) === 144)).toBe(true);
  expect(bytes.some((b) => (b[0] & 240) === 176)).toBe(true);
  expect(bytes.some((b) => b[0] === 240 || (b[0] & 240) === 192)).toBe(false);
  await page.evaluate(() =>
    (window as unknown as { unplug: () => void }).unplug(),
  );
  await expect(page.getByRole("alert")).toContainText("disconnected");
  await expect(
    page.getByRole("button", { name: "Play MV-1", exact: true }),
  ).toBeEnabled();
});

test("real Web Audio loop worklet and MediaRecorder with synthetic source", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    // Synthetic audio fixture, deliberately separate from physical hardware evidence.
    const { AudioBridge } = await import("/src/core/live/AudioBridge.ts");
    const ctx = new AudioContext();
    await ctx.resume();
    const oscillator = ctx.createOscillator(),
      destination = ctx.createMediaStreamDestination();
    oscillator.frequency.value = 110;
    oscillator.connect(destination);
    oscillator.start();
    const original = navigator.mediaDevices.getUserMedia.bind(
      navigator.mediaDevices,
    );
    navigator.mediaDevices.getUserMedia = async () =>
      destination.stream.clone();
    const bridge = new AudioBridge();
    try {
      const b = await bridge.capture(
        ctx,
        "synthetic",
        ctx.currentTime + 0.3,
        180,
      );
      bridge.play(ctx, ctx.currentTime + 0.05);
      bridge.level(0.3);
      let recaptureBlocked = false;
      try {
        await bridge.capture(ctx, "synthetic", ctx.currentTime + 0.3, 180);
      } catch (error) {
        recaptureBlocked = String(error).includes("Stop the captured loop");
      }
      const retainedBuffer = bridge.buffer;
      bridge.stopLoop();
      const stoppedAndRetained =
        bridge.loop === null && bridge.buffer === retainedBuffer;
      await bridge.record("synthetic");
      await new Promise((r) => setTimeout(r, 300));
      const take = await bridge.finishRecording();
      const wav = new DataView(await bridge.wav());
      return {
        recaptureBlocked,
        stoppedAndRetained,
        frames: b.length,
        rate: b.sampleRate,
        channels: b.numberOfChannels,
        energy: b.getChannelData(0).some((n: number) => Math.abs(n) > 0.001),
        take: take.size,
        mime: take.type,
        wavRate: wav.getUint32(24, true),
        wavBits: wav.getUint16(34, true),
      };
    } finally {
      bridge.dispose();
      oscillator.stop();
      destination.stream.getTracks().forEach((t) => t.stop());
      await ctx.close();
      navigator.mediaDevices.getUserMedia = original;
    }
  });
  expect(result.recaptureBlocked).toBe(true);
  expect(result.stoppedAndRetained).toBe(true);
  expect(result.frames).toBe(Math.round((result.rate * 960) / 180));
  expect(result.channels).toBe(2);
  expect(result.energy).toBe(true);
  expect(result.take).toBeGreaterThan(100);
  expect(result.mime).toContain("audio");
  expect(result.wavRate).toBe(44100);
  expect(result.wavBits).toBe(16);
});

test("loop controls: stop retained source independently before recapture", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    // UI fixture only: capture completes immediately with a real silent buffer.
    // Actual worklet capture is covered separately above.
    const { AudioBridge } = await import("/src/core/live/AudioBridge.ts");
    const { Instrument } = await import("/src/core/live/Instrument.ts");
    // Isolate UI lifecycle from real-time scheduling, covered by the other journeys.
    Instrument.prototype.start = async function () {
      await this.audio();
      this.running = true;
      this.epoch = this.context!.currentTime;
    };
    AudioBridge.prototype.devices = async () => [
      {
        deviceId: "fixture-input",
        kind: "audioinput",
        label: "Fixture input",
        groupId: "fixture",
        toJSON: () => ({}),
      },
    ];
    AudioBridge.prototype.capture = async function (
      ctx: AudioContext,
      _id: string,
      _at: number,
      bpm: number,
    ) {
      this.buffer = ctx.createBuffer(
        2,
        Math.round((ctx.sampleRate * 960) / bpm),
        ctx.sampleRate,
      );
      this.captureBpm = bpm;
      return this.buffer;
    };
  });
  await page.getByRole("button", { name: "Connections & recording" }).click();
  await page.getByRole("button", { name: "Find audio devices" }).click();
  await page
    .getByLabel("MV-1 loop input", { exact: true })
    .selectOption("fixture-input");
  await page.getByRole("button", { name: "Connections & recording" }).click();
  await page.getByRole("button", { name: "Audition", exact: true }).click();
  await page
    .getByRole("button", { name: "Capture 4 bars", exact: true })
    .click();
  await page.getByRole("button", { name: "▶ Loop", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Recapture 4 bars" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "■ Stop loop", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Audition", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Save WAV", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Recapture 4 bars" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Recapture 4 bars" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Four-bar loop captured",
  );
  await page.getByRole("button", { name: "▶ Loop", exact: true }).click();
  await page.getByRole("button", { name: "■ Stop loop", exact: true }).click();
  await page.getByRole("button", { name: "Stop all playback" }).click();
});
