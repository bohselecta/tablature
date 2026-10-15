/* Records exactly N frames from a selected input. It never monitors input to output. */
class LoopCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.start = Infinity;
    this.length = 0;
    this.count = 0;
    this.buffers = [];
    this.port.onmessage = ({ data }) => {
      this.start = data.start;
      this.length = data.length;
      this.count = 0;
      this.buffers = [
        new Float32Array(this.length),
        new Float32Array(this.length),
      ];
    };
  }
  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0] || !this.length) return true;
    for (let i = 0; i < input[0].length; i++)
      if (currentFrame + i >= this.start && this.count < this.length) {
        for (let ch = 0; ch < 2; ch++)
          this.buffers[ch][this.count] = (input[ch] || input[0])[i];
        this.count++;
      }
    if (this.count === this.length) {
      this.port.postMessage(this.buffers, [
        this.buffers[0].buffer,
        this.buffers[1].buffer,
      ]);
      this.length = 0;
    }
    return true;
  }
}
registerProcessor("fd-loop-capture", LoopCapture);
