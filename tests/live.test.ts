import { describe, it, expect, vi, afterEach } from "vitest";
import {
  compose,
  interpret,
  DEFAULT_TASTE,
  validatePlan,
  commands,
  midiFile,
} from "../src/core/live/model";
import { Instrument } from "../src/core/live/Instrument";
import { candidateTrackPacket } from "../src/core/live/MV1Protocol";
import { MV1Device } from "../src/devices/mv1/MV1Device";

afterEach(() => vi.useRealTimers());
describe("musical intent and protected state", () => {
  it("compiles the published candidate example with the correct checksum and track address", () => {
    const packet = candidateTrackPacket(1, "mute", 0);
    expect(packet.bytes).toEqual([
      240, 65, 16, 0, 0, 0, 111, 18, 16, 0, 8, 13, 0, 91, 247,
    ]);
    expect(packet.status).toBe("candidate");
    expect(() => candidateTrackPacket(0, "mute", 0)).toThrow();
    expect(() => candidateTrackPacket(1, "volume", 128)).toThrow();
  });
  it("legacy unsupported writes fail visibly without playing substitute patterns", async () => {
    const device = new MV1Device();
    await expect(device.selectSound(0, "sound_001")).rejects.toThrow(
      "not verified",
    );
    await expect(
      device.sendPattern(0, 0, { steps: 16, notes: [] }),
    ).rejects.toThrow("No placeholder");
    await expect(device.clearClip(0, 0)).rejects.toThrow("no command");
    expect(device.getMaxClipsPerTrack()).toBe(16);
  });
  it("composes seven nonempty four-bar parts deterministically", () => {
    const a = compose("minimal", DEFAULT_TASTE, 9);
    expect(a).toEqual(compose("minimal", DEFAULT_TASTE, 9));
    expect(a.lanes).toHaveLength(7);
    for (const l of a.lanes) {
      expect(l.hits.length).toBeGreaterThan(0);
      expect(l.hits.every((h) => h.step < 64)).toBe(true);
    }
    validatePlan(a);
  });
  it("different seeds produce new material without changing the kick anchor", () => {
    const a = compose("a", DEFAULT_TASTE, 1),
      b = compose("a", DEFAULT_TASTE, 3);
    expect(a.lanes[3].hits).not.toEqual(b.lanes[3].hits);
    expect(a.lanes[0].hits.map((h) => h.step)).toEqual(
      b.lanes[0].hits.map((h) => h.step),
    );
  });
  it("preserves locked notes, tone recipe, mute and mapping across preferences/scenes", () => {
    const a = compose("a");
    a.lanes[4].locked = true;
    a.lanes[4].offset = 12;
    a.lanes[4].cutoff = 10;
    const b = compose(
      "bright busy",
      { ...DEFAULT_TASTE, density: 90 },
      99,
      127,
      8,
      a,
    );
    expect(b.lanes[4]).toEqual(a.lanes[4]);
    expect(b.lanes[3].hits).not.toEqual(a.lanes[3].hits);
  });
  it("interprets explicit descriptors and BPM without pretending unfamiliar names are understood", () => {
    const a = interpret(
      "dry sparse rubber bass, shuffled clicks, 129 BPM",
      DEFAULT_TASTE,
    );
    expect(a.bpm).toBe(129);
    expect(a.taste.space).toBe(5);
    expect(a.taste.brightness).toBe(24);
    expect(a.taste.density).toBe(23);
    expect(interpret("unknown reference", DEFAULT_TASTE).taste).toEqual(
      DEFAULT_TASTE,
    );
  });
  it("rejects hostile, duplicate and out-of-range imported data", () => {
    for (const bad of [
      null,
      {},
      [],
      { ...compose("a"), bpm: Infinity },
      { ...compose("a"), scene: 1.5 },
    ])
      expect(() => validatePlan(bad)).toThrow();
    const a = compose("a");
    a.lanes[0].channel = 2;
    expect(() => validatePlan(a)).toThrow();
    a.lanes[0].channel = 1;
    a.lanes[0].hits.push({ ...a.lanes[0].hits[0] });
    expect(() => validatePlan(a)).toThrow();
  });
  it("never includes program changes or SysEx in the executable plan", () => {
    const rows = commands(compose("a"));
    expect(
      rows
        .filter((c) => c.send)
        .every((c) => [0x90, 0xb0].includes(c.bytes[0] & 0xf0)),
    ).toBe(true);
    expect(
      rows
        .filter((c) => c.send && (c.bytes[0] & 0xf0) === 0xb0)
        .every((c) => [7, 74, 91].includes(c.bytes[1])),
    ).toBe(true);
    expect(rows.filter((c) => !c.send)).toHaveLength(7);
  });
  it("exports valid type-zero MIDI with four-bar length and balanced notes", () => {
    const bytes = midiFile(compose("a"));
    expect(String.fromCharCode(...bytes.slice(0, 4))).toBe("MThd");
    const view = new DataView(bytes.buffer);
    expect(view.getUint16(8)).toBe(0);
    expect(view.getUint16(12)).toBe(480);
    expect(view.getUint32(18)).toBe(bytes.length - 22);
    let pos = 22,
      tick = 0,
      on = 0,
      off = 0;
    while (pos < bytes.length) {
      let delta = 0,
        b;
      do {
        b = bytes[pos++];
        delta = (delta << 7) | (b & 127);
      } while (b & 128);
      tick += delta;
      const status = bytes[pos++];
      if (status === 255) {
        const kind = bytes[pos++],
          len = bytes[pos++];
        pos += len;
        if (kind === 47) break;
      } else {
        if ((status & 240) === 144) on++;
        if ((status & 240) === 128) off++;
        pos += 2;
      }
    }
    expect(tick).toBe(7680);
    expect(on).toBeGreaterThan(0);
    expect(on).toBe(off);
  });
});
describe("real MIDI scheduler with mocked port, not physical hardware", () => {
  function fixture() {
    let now = 0;
    const send = vi.fn(),
      clear = vi.fn();
    const engine = new Instrument(compose("a"));
    engine.context = {
      get currentTime() {
        return now;
      },
      state: "running",
      resume: async () => {},
    } as unknown as AudioContext;
    engine.output = {
      state: "connected",
      send,
      clear,
    } as unknown as MIDIOutput;
    return {
      engine,
      send,
      clear,
      time: (n: number) => {
        now = n;
      },
    };
  }
  it("requires explicit connected output", async () => {
    const e = new Instrument(compose("a"));
    await expect(e.start("hardware")).rejects.toThrow("Select");
  });
  it("plays note content and clears scheduled notes on stop", async () => {
    vi.useFakeTimers();
    const { engine, send, clear, time } = fixture();
    await engine.start("hardware");
    time(0.08);
    vi.advanceTimersByTime(25);
    expect(send.mock.calls.some((c) => (c[0][0] & 240) === 144)).toBe(true);
    expect(send.mock.calls.some((c) => (c[0][0] & 240) === 176)).toBe(false);
    engine.stop();
    expect(clear).toHaveBeenCalled();
    expect(send.mock.calls.some((c) => (c[0][0] & 240) === 128)).toBe(true);
    expect(engine.running).toBe(false);
  });
  it("only applies queued plan at a bar boundary", async () => {
    vi.useFakeTimers();
    const { engine, time } = fixture();
    await engine.start("hardware");
    time(0.08);
    vi.advanceTimersByTime(25);
    const p = compose("b", DEFAULT_TASTE, 2);
    engine.queue(p);
    expect(engine.plan.seed).toBe(1);
    for (let n = 1; n < 42; n++) {
      time(0.08 + n * 0.05);
      vi.advanceTimersByTime(25);
    }
    expect(engine.plan.seed).toBe(2);
    expect(engine.pending).toBe(null);
    engine.stop();
  });
  it("stops after a timing stall instead of bursting late notes", async () => {
    vi.useFakeTimers();
    const { engine, time } = fixture();
    const error = vi.fn();
    engine.onError = error;
    await engine.start("hardware");
    time(3);
    vi.advanceTimersByTime(25);
    expect(engine.running).toBe(false);
    expect(error).toHaveBeenCalledWith(expect.stringContaining("stalled"));
  });
});
