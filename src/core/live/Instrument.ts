import {
  commands,
  validatePlan,
  type Plan,
  type Lane,
  type Hit,
} from "./model";

export type Route = "audition" | "hardware";
export class Instrument {
  context: AudioContext | null = null;
  output: MIDIOutput | null = null;
  access: MIDIAccess | null = null;
  plan: Plan;
  pending: Plan | null = null;
  route: Route = "audition";
  running = false;
  controlsArmed = false;
  epoch = 0;
  nextTime = 0;
  step = 0;
  timer: ReturnType<typeof setInterval> | null = null;
  visualTimers = new Set<ReturnType<typeof setTimeout>>();
  held = new Set<string>();
  voices = new Set<AudioScheduledSourceNode>();
  onStep: (step: number, plan: Plan) => void = () => {};
  onError: (message: string) => void = () => {};
  onPorts: () => void = () => {};
  journal: { at: string; event: string }[] = [];
  messages: {
    at: number;
    bytes: number[];
    result: "sent-no-ack" | "failed";
  }[] = [];
  droppedMessages = 0;
  private sendMIDI(bytes: number[], timestamp?: number) {
    if (!this.output) throw Error("MIDI output unavailable.");
    const entry = {
      at: timestamp ?? performance.now(),
      bytes: [...bytes],
      result: "sent-no-ack" as "sent-no-ack" | "failed",
    };
    try {
      this.output.send(bytes, timestamp);
    } catch (e) {
      entry.result = "failed";
      throw e;
    } finally {
      this.messages.push(entry);
      if (this.messages.length > 20000) {
        this.messages.shift();
        this.droppedMessages++;
      }
    }
  }
  constructor(plan: Plan) {
    validatePlan(plan);
    this.plan = structuredClone(plan);
  }
  async audio() {
    if (!this.context) this.context = new AudioContext();
    await this.context.resume();
    return this.context;
  }
  async requestMIDI() {
    if (!navigator.requestMIDIAccess)
      throw Error(
        "Web MIDI unavailable. Use a supporting desktop browser or stay in software audition.",
      );
    this.access = await navigator.requestMIDIAccess({ sysex: false });
    this.access.onstatechange = () => {
      if (this.output?.state === "disconnected") {
        this.stop();
        this.output = null;
        this.onError(
          "MIDI device disconnected. Performance stopped; reconnect and select output again.",
        );
      }
      this.onPorts();
    };
    this.onPorts();
    return [...this.access.outputs.values()];
  }
  async selectOutput(id: string) {
    this.stop();
    const output = this.access?.outputs.get(id);
    if (!output || output.state === "disconnected")
      throw Error("That MIDI output is unavailable. Refresh devices.");
    await this.output?.close();
    this.output = null;
    await output.open();
    this.output = output;
    this.controlsArmed = false;
  }
  queue(plan: Plan) {
    validatePlan(plan);
    if (this.running) this.pending = structuredClone(plan);
    else {
      this.plan = structuredClone(plan);
      this.pending = null;
    }
    this.journal.push({
      at: new Date().toISOString(),
      event: `Plan ${plan.seed}, scene ${plan.scene + 1}: ${this.running ? "queued" : "applied"}`,
    });
  }
  async start(route: Route) {
    if (this.running) return;
    if (
      route === "hardware" &&
      (!this.output || this.output.state === "disconnected")
    )
      throw Error("Select an available MIDI output before playing hardware.");
    await this.audio();
    this.route = route;
    this.running = true;
    this.epoch = this.context!.currentTime + 0.1;
    this.nextTime = this.epoch;
    this.step = 0;
    try {
      if (route === "hardware" && this.controlsArmed) this.applyControls();
      this.schedule();
      this.timer = setInterval(() => this.schedule(), 25);
    } catch (e) {
      this.stop();
      throw e;
    }
  }
  boundary() {
    const ctx = this.context;
    if (!ctx || !this.running)
      throw Error("Start the performance before capturing a loop.");
    const bar = 240 / this.plan.bpm;
    return (
      this.epoch +
      Math.max(1, Math.ceil((ctx.currentTime + 0.15 - this.epoch) / bar)) * bar
    );
  }
  applyControls() {
    if (this.output && this.controlsArmed)
      for (const c of commands(this.plan))
        if (c.send && (c.bytes[0] & 0xf0) === 0xb0) this.sendMIDI(c.bytes);
  }
  private schedule() {
    const ctx = this.context;
    if (!ctx || !this.running) return;
    try {
      if (ctx.state !== "running" || ctx.currentTime - this.nextTime > 0.15)
        throw Error(
          "Playback timing stalled. Stopped cleanly; press Play to restart.",
        );
      while (this.nextTime < ctx.currentTime + 0.08) {
        if (this.step % 16 === 0 && this.pending) {
          // Do not change tempo while a bar is already sounding. New grid starts here.
          this.plan = this.pending;
          this.pending = null;
          this.epoch = this.nextTime - this.step * (60 / this.plan.bpm / 4);
          if (this.route === "hardware") this.applyControls();
        }
        const interval = 60 / this.plan.bpm / 4;
        const step = this.step % 64;
        const at =
          this.nextTime +
          (step % 2 ? interval * this.plan.taste.swing * 0.003 : 0);
        for (let i = 0; i < 7; i++) {
          const lane = this.plan.lanes[i];
          if (!lane.muted)
            for (const hit of lane.hits)
              if (hit.step === step) {
                if (this.route === "audition") this.synth(i, lane, hit, at);
                else this.note(lane, hit, at);
              }
        }
        const snapshot = this.plan;
        const timeout = setTimeout(
          () => {
            this.visualTimers.delete(timeout);
            if (this.running) this.onStep(step, snapshot);
          },
          Math.max(0, (this.nextTime - ctx.currentTime) * 1000),
        );
        this.visualTimers.add(timeout);
        this.step++;
        this.nextTime += interval;
      }
    } catch (e) {
      this.stop();
      this.onError(e instanceof Error ? e.message : String(e));
    }
  }
  private note(lane: Lane, hit: Hit, at: number) {
    if (!this.output || this.output.state === "disconnected")
      throw Error("MIDI output disconnected.");
    const ch = lane.channel - 1;
    const note = hit.note + lane.offset;
    const timestamp =
      performance.now() + (at - this.context!.currentTime) * 1000;
    this.sendMIDI([0x90 + ch, note, hit.velocity], timestamp);
    this.sendMIDI(
      [0x80 + ch, note, 0],
      timestamp +
        ((Math.min(
          hit.gate,
          hit.step % 2 ? 0.98 - this.plan.taste.swing * 0.003 : 0.98,
        ) *
          60) /
          this.plan.bpm /
          4) *
          1000,
    );
    this.held.add(`${ch}:${note}`);
  }
  private synth(index: number, lane: Lane, hit: Hit, at: number) {
    const ctx = this.context!;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 250 + lane.cutoff * 95;
    const frequency = 440 * 2 ** ((hit.note + lane.offset - 69) / 12);
    let duration = 0.16;
    osc.type = index === 4 ? "triangle" : "sine";
    osc.frequency.value = frequency;
    if (index === 0) {
      osc.frequency.setValueAtTime(140, at);
      osc.frequency.exponentialRampToValueAtTime(47, at + 0.05);
      duration = 0.28;
    }
    if (index === 1) {
      osc.type = "triangle";
      osc.frequency.value = 1750;
      duration = 0.045;
    }
    if (index === 2) {
      osc.type = "square";
      osc.frequency.value = 9000;
      duration = 0.025;
    }
    if (index === 3) {
      osc.frequency.value = 2200;
      duration = 0.035;
    }
    if (index === 5) {
      osc.type = "sawtooth";
      duration = 0.12;
    }
    const level =
      ((((index === 0 ? 0.3 : index === 4 ? 0.18 : 0.055) * hit.velocity) /
        127) *
        lane.volume) /
      100;
    amp.gain.setValueAtTime(0.0001, at);
    amp.gain.linearRampToValueAtTime(level, at + 0.002);
    amp.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    osc.connect(filter).connect(amp).connect(ctx.destination);
    this.voices.add(osc);
    osc.onended = () => {
      this.voices.delete(osc);
      osc.disconnect();
      filter.disconnect();
      amp.disconnect();
    };
    osc.start(at);
    osc.stop(at + duration + 0.01);
  }
  stop() {
    this.running = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    for (const timer of this.visualTimers) clearTimeout(timer);
    this.visualTimers.clear();
    if (this.output) {
      try {
        (this.output as MIDIOutput & { clear?: () => void }).clear?.();
        for (const key of this.held) {
          const [ch, note] = key.split(":").map(Number);
          this.sendMIDI([0x80 + ch, note, 0]);
        }
      } catch {
        /* Device may already be gone. */
      }
    }
    this.held.clear();
    for (const voice of this.voices) {
      try {
        voice.stop();
      } catch {
        /* Already ended. */
      }
    }
    this.voices.clear();
    if (this.pending) {
      this.plan = this.pending;
      this.pending = null;
    }
  }
  async dispose() {
    this.stop();
    if (this.access) this.access.onstatechange = null;
    await this.output?.close();
    await this.context?.close();
    this.context = null;
  }
}
