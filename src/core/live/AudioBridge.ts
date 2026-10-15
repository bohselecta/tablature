import source from "./capture-worklet.js?raw";
export class AudioBridge {
  stream: MediaStream | null = null;
  node: AudioWorkletNode | null = null;
  input: MediaStreamAudioSourceNode | null = null;
  loop: AudioBufferSourceNode | null = null;
  gain: GainNode | null = null;
  buffer: AudioBuffer | null = null;
  captureBpm: number | null = null;
  recorder: MediaRecorder | null = null;
  recordStream: MediaStream | null = null;
  moduleContext: AudioContext | null = null;
  cancel: ((reason: Error) => void) | null = null;
  async devices() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return navigator.mediaDevices.enumerateDevices();
  }
  async capture(
    ctx: AudioContext,
    deviceId: string,
    start: number,
    bpm: number,
  ) {
    if (!Number.isFinite(bpm) || bpm < 60 || bpm > 180)
      throw Error("Capture tempo must be 60–180 BPM.");
    if (!deviceId) throw Error("Select the MV-1 audio input first.");
    if (this.loop) throw Error("Stop the captured loop before recapturing.");
    if (this.cancel) throw Error("A loop capture is already in progress.");
    if (this.moduleContext !== ctx) {
      const url = URL.createObjectURL(
        new Blob([source], { type: "text/javascript" }),
      );
      try {
        await ctx.audioWorklet.addModule(url);
        this.moduleContext = ctx;
      } finally {
        URL.revokeObjectURL(url);
      }
    }
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: { exact: deviceId },
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 2,
      },
    });
    if (start < ctx.currentTime + 0.05) {
      this.closeInput();
      throw Error(
        "Capture boundary passed while opening input. Try again; input permissions are now ready.",
      );
    }
    const length = Math.round((ctx.sampleRate * 960) / bpm);
    this.node = new AudioWorkletNode(ctx, "fd-loop-capture");
    this.input = ctx.createMediaStreamSource(this.stream);
    this.input.connect(this.node);
    this.node.connect(ctx.destination);
    // Worklet output is always zero; no live input monitoring or return feedback.
    return new Promise<AudioBuffer>((resolve, reject) => {
      const timeout = setTimeout(
        () =>
          fail(new Error("Capture timed out. Check the selected audio input.")),
        Math.max(15000, (start - ctx.currentTime + 960 / bpm + 3) * 1000),
      );
      const finish = () => {
        clearTimeout(timeout);
        this.cancel = null;
        this.closeInput();
      };
      const fail = (error: Error) => {
        finish();
        reject(error);
      };
      this.cancel = fail;
      this.node!.port.onmessage = ({ data }: MessageEvent<Float32Array[]>) => {
        let energy = 0;
        for (const value of data[0]) energy += value * value;
        if (Math.sqrt(energy / data[0].length) < 0.00005) {
          fail(
            new Error(
              "Input was silent. Check MV-1 audio routing and try again.",
            ),
          );
          return;
        }
        const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
        for (let ch = 0; ch < 2; ch++)
          buffer.copyToChannel(new Float32Array(data[ch]), ch);
        this.buffer = buffer;
        this.captureBpm = bpm;
        finish();
        resolve(buffer);
      };
      this.node!.onprocessorerror = () =>
        fail(
          new Error(
            "Audio capture processor failed. Try reconnecting the input.",
          ),
        );
      this.node!.port.postMessage({
        start: Math.round(start * ctx.sampleRate),
        length,
      });
    });
  }
  play(ctx: AudioContext, at: number) {
    if (!this.buffer) throw Error("Capture a loop first.");
    this.stopLoop();
    this.loop = ctx.createBufferSource();
    this.loop.buffer = this.buffer;
    this.loop.loop = true;
    this.gain = ctx.createGain();
    this.gain.gain.value = 0.7;
    this.loop.connect(this.gain).connect(ctx.destination);
    this.loop.start(at);
  }
  level(value: number) {
    if (this.gain)
      this.gain.gain.setTargetAtTime(
        value,
        this.gain.context.currentTime,
        0.02,
      );
  }
  async wav() {
    if (!this.buffer) throw Error("Capture a loop first.");
    const ctx = new OfflineAudioContext(
      2,
      Math.round(this.buffer.duration * 44100),
      44100,
    );
    const src = ctx.createBufferSource();
    src.buffer = this.buffer;
    src.connect(ctx.destination);
    src.start();
    const audio = await ctx.startRendering();
    const samples = audio.length * 2;
    const bytes = new ArrayBuffer(44 + samples * 2);
    const v = new DataView(bytes);
    const text = (offset: number, s: string) => {
      for (let i = 0; i < s.length; i++)
        v.setUint8(offset + i, s.charCodeAt(i));
    };
    text(0, "RIFF");
    v.setUint32(4, 36 + samples * 2, true);
    text(8, "WAVE");
    text(12, "fmt ");
    v.setUint32(16, 16, true);
    v.setUint16(20, 1, true);
    v.setUint16(22, 2, true);
    v.setUint32(24, 44100, true);
    v.setUint32(28, 44100 * 4, true);
    v.setUint16(32, 4, true);
    v.setUint16(34, 16, true);
    text(36, "data");
    v.setUint32(40, samples * 2, true);
    const left = audio.getChannelData(0),
      right = audio.getChannelData(1);
    for (let i = 0; i < audio.length; i++) {
      v.setInt16(
        44 + i * 4,
        Math.round(Math.max(-1, Math.min(1, left[i])) * 32767),
        true,
      );
      v.setInt16(
        46 + i * 4,
        Math.round(Math.max(-1, Math.min(1, right[i])) * 32767),
        true,
      );
    }
    return bytes;
  }
  stopLoop() {
    this.loop?.stop();
    this.loop?.disconnect();
    this.loop = null;
    this.gain?.disconnect();
    this.gain = null;
  }
  closeInput() {
    this.input?.disconnect();
    this.input = null;
    this.node?.disconnect();
    this.node = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }
  async output(ctx: AudioContext, id: string) {
    const c = ctx as AudioContext & {
      setSinkId?: (id: string) => Promise<void>;
    };
    if (!c.setSinkId)
      throw Error(
        "Output selection unavailable in this browser. Use the system audio output setting.",
      );
    await c.setSinkId(id);
  }
  async record(id: string) {
    if (!id) throw Error("Choose the mixer recording input first.");
    if (this.recorder) throw Error("Recording is already active.");
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: { exact: id },
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 2,
      },
    });
    this.recordStream = stream;
    try {
      this.recorder = new MediaRecorder(stream);
      this.recorder.start();
    } catch (e) {
      stream.getTracks().forEach((t) => t.stop());
      this.recordStream = null;
      throw e;
    }
  }
  finishRecording() {
    const recorder = this.recorder;
    if (!recorder) return Promise.reject(new Error("No active recording."));
    return new Promise<Blob>((resolve, reject) => {
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      recorder.onstop = () => {
        this.recordStream?.getTracks().forEach((t) => t.stop());
        this.recordStream = null;
        this.recorder = null;
        resolve(new Blob(chunks, { type: recorder.mimeType }));
      };
      recorder.onerror = () => {
        this.recordStream?.getTracks().forEach((t) => t.stop());
        this.recordStream = null;
        this.recorder = null;
        reject(new Error("Mixer recording failed."));
      };
      recorder.stop();
    });
  }
  dispose() {
    this.cancel?.(new Error("Capture canceled."));
    this.closeInput();
    this.stopLoop();
    if (this.recorder?.state === "recording") this.recorder.stop();
    this.recordStream?.getTracks().forEach((t) => t.stop());
  }
}
