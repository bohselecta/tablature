export const ROLES = [
  "KICK",
  "SNARE",
  "HI-HAT",
  "KIT",
  "BASS",
  "INST1",
  "INST2",
] as const;
export interface Taste {
  density: number;
  swing: number;
  brightness: number;
  space: number;
}
export interface Hit {
  step: number;
  note: number;
  velocity: number;
  gate: number;
}
export interface Lane {
  role: string;
  channel: number;
  offset: number;
  locked: boolean;
  muted: boolean;
  volume: number;
  cutoff: number;
  reverb: number;
  source: string;
  hits: Hit[];
}
export interface Plan {
  version: 1;
  title: string;
  prompt: string;
  seed: number;
  bpm: number;
  scene: number;
  taste: Taste;
  lanes: Lane[];
}
export const DEFAULT_TASTE: Taste = {
  density: 28,
  swing: 14,
  brightness: 35,
  space: 18,
};
const SCENES = [
  "Door crack",
  "Dry room",
  "Little teeth",
  "Rubber floor",
  "Night bus",
  "Side alley",
  "Loose screws",
  "Gold circuit",
  "Empty booth",
  "Pressure return",
  "Bent wire",
  "Small hours",
  "Hot contacts",
  "Last room",
  "Afterimage",
  "Lights low",
];
export { SCENES };
const SOURCES = [
  "Short dry kick · tone C4",
  "Dry rim / click · tone C4",
  "Closed hat · tone C4",
  "Wood / rim · kit pad 37",
  "Mono sub / rubber bass",
  "Short minor synth stab",
  "Glass / metal pluck",
];
function rng(seed: number) {
  let a = seed | 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function interpret(
  prompt: string,
  previous: Taste,
): { taste: Taste; bpm?: number; traits: string[] } {
  const taste = { ...previous };
  const traits: string[] = [];
  const p = prompt.toLowerCase();
  if (/minimal|sparse|click|hawtin/.test(p)) {
    taste.density = 23;
    traits.push("Sparse, original micro-rhythms");
  }
  if (/busy|dense|driving/.test(p)) {
    taste.density = 68;
    traits.push("Driving percussion");
  }
  if (/dry|tight/.test(p)) {
    taste.space = 5;
    traits.push("Dry, short tails");
  }
  if (/dub|space|echo/.test(p)) {
    taste.space = 62;
    traits.push("Spacious punctuation");
  }
  if (/dark|warm|rubber/.test(p)) {
    taste.brightness = 24;
    traits.push("Warm filtered tone");
  }
  if (/bright|icy|glass/.test(p)) {
    taste.brightness = 76;
    traits.push("Bright short accents");
  }
  if (/swing|shuffle/.test(p)) {
    taste.swing = 32;
    traits.push("Shuffled sixteenths");
  }
  if (/straight/.test(p)) {
    taste.swing = 0;
    traits.push("Straight pulse");
  }
  const match = p.match(/\b(\d{2,3})\s*bpm\b/);
  const bpm = match ? Math.max(60, Math.min(180, Number(match[1]))) : undefined;
  return {
    taste,
    bpm,
    traits: traits.length
      ? traits
      : [
          "Using your editable taste settings; unfamiliar references need descriptive traits",
        ],
  };
}
export function compose(
  prompt: string,
  taste: Taste = DEFAULT_TASTE,
  seed = 1,
  bpm = 127,
  scene = 0,
  previous?: Plan,
): Plan {
  const random = rng(seed + scene * 7919);
  const lanes = ROLES.map((role, i): Lane => {
    const old = previous?.lanes[i];
    if (old?.locked) return structuredClone(old);
    const hits: Hit[] = [];
    for (let bar = 0; bar < 4; bar++)
      for (let step = 0; step < 16; step++) {
        let trigger = false;
        let note = i < 3 ? 60 : i === 3 ? 37 : i === 4 ? 36 : i === 5 ? 60 : 72;
        if (i === 0) trigger = step % 4 === 0;
        if (i === 1)
          trigger =
            step === 12 ||
            (step === 4 && random() < 0.35 + taste.density / 150);
        if (i === 2)
          trigger =
            step % 4 === 2 ||
            (step % 2 === 1 && random() < taste.density / 250);
        if (i === 3) trigger = step % 4 !== 0 && random() < taste.density / 240;
        if (i === 4) {
          trigger =
            [1, 7, 10, 14].includes(step) &&
            random() < 0.45 + taste.density / 130;
          note = [36, 36, 43, 39][(bar + step) % 4];
        }
        if (i === 5) {
          trigger =
            [3, 11].includes(step) && random() < 0.2 + taste.density / 130;
          note = [60, 63, 67][bar % 3];
        }
        if (i === 6) {
          trigger =
            step === (bar * 5 + scene * 3) % 16 &&
            random() < 0.3 + taste.density / 140;
          note = [72, 75, 79, 82][bar];
        }
        if (trigger)
          hits.push({
            step: bar * 16 + step,
            note,
            velocity: Math.round(
              [103, 65, 63, 60, 82, 61, 50][i] + random() * 14 - 7,
            ),
            gate: i < 4 ? 0.4 : 0.72,
          });
      }
    return {
      role,
      channel: old?.channel ?? i + 1,
      offset: old?.offset ?? 0,
      locked: false,
      muted: old?.muted ?? false,
      volume: old?.volume ?? [95, 68, 65, 62, 85, 63, 54][i],
      cutoff: Math.round(32 + taste.brightness * 0.7),
      reverb: i === 0 || i === 4 ? 0 : Math.round(taste.space * 0.6),
      source: SOURCES[i],
      hits,
    };
  });
  return {
    version: 1,
    title: "Gold Circuit",
    prompt,
    seed,
    bpm,
    scene,
    taste: { ...taste },
    lanes,
  };
}
function object(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function num(v: unknown, min: number, max: number): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
}
export function validatePlan(value: unknown): asserts value is Plan {
  if (
    !object(value) ||
    value.version !== 1 ||
    typeof value.title !== "string" ||
    value.title.length > 120 ||
    typeof value.prompt !== "string" ||
    value.prompt.length > 4000 ||
    !num(value.seed, 0, 2147483647) ||
    !Number.isInteger(value.seed) ||
    !num(value.bpm, 60, 180) ||
    !num(value.scene, 0, 15) ||
    !Number.isInteger(value.scene) ||
    !object(value.taste) ||
    !["density", "swing", "brightness", "space"].every((k) =>
      num((value.taste as Record<string, unknown>)[k], 0, 100),
    ) ||
    !Array.isArray(value.lanes) ||
    value.lanes.length !== 7
  )
    throw Error(
      "Invalid live project. Expected a version 1, seven-track project.",
    );
  const channels = new Set<number>();
  for (const [i, l] of value.lanes.entries()) {
    if (
      !object(l) ||
      l.role !== ROLES[i] ||
      !num(l.channel, 1, 16) ||
      !Number.isInteger(l.channel) ||
      channels.has(l.channel) ||
      !num(l.offset, -24, 24) ||
      !Number.isInteger(l.offset) ||
      typeof l.locked !== "boolean" ||
      typeof l.muted !== "boolean" ||
      !num(l.volume, 0, 127) ||
      !num(l.cutoff, 0, 127) ||
      !num(l.reverb, 0, 127) ||
      typeof l.source !== "string" ||
      l.source.length > 160 ||
      !Array.isArray(l.hits) ||
      l.hits.length > 128
    )
      throw Error("Invalid track settings or duplicate MIDI channels.");
    channels.add(l.channel);
    const positions = new Set<number>();
    for (const h of l.hits) {
      if (
        !object(h) ||
        !num(h.step, 0, 63) ||
        !Number.isInteger(h.step) ||
        positions.has(h.step) ||
        !num(h.note, 0, 127) ||
        !Number.isInteger(h.note) ||
        !num(h.note + l.offset, 0, 127) ||
        !num(h.velocity, 1, 127) ||
        !Number.isInteger(h.velocity) ||
        !num(h.gate, 0.05, 0.9)
      )
        throw Error("Invalid or overlapping notes. Nothing imported.");
      positions.add(h.step);
    }
  }
}
export function commands(plan: Plan) {
  validatePlan(plan);
  return plan.lanes.flatMap((l) => [
    {
      track: l.role,
      label: `Notes · channel ${l.channel}`,
      status: "Documented",
      send: true,
      bytes: [
        0x90 + l.channel - 1,
        l.hits[0]?.note ?? 60,
        l.hits[0]?.velocity ?? 70,
      ],
    },
    ...[
      [7, l.volume, "Volume"],
      [74, l.cutoff, "Cutoff"],
      [91, l.reverb, "Reverb"],
    ].map(([cc, v, label]) => ({
      track: l.role,
      label: String(label),
      status: "Documented · local test pending",
      send: true,
      bytes: [0xb0 + l.channel - 1, Number(cc), Math.round(Number(v))],
    })),
    {
      track: l.role,
      label: "Source / MFX / EQ SysEx",
      status: "Unverified · preview only",
      send: false,
      bytes: [],
    },
  ]);
}
export function midiFile(plan: Plan): Uint8Array {
  validatePlan(plan);
  const data: number[] = [];
  const events: { tick: number; bytes: number[] }[] = [];
  const vlq = (v: number) => {
    const b = [v & 127];
    while ((v >>= 7) > 0) b.unshift((v & 127) | 128);
    return b;
  };
  const tempo = Math.round(60000000 / plan.bpm);
  events.push({
    tick: 0,
    bytes: [255, 81, 3, (tempo >> 16) & 255, (tempo >> 8) & 255, tempo & 255],
  });
  for (const l of plan.lanes)
    if (!l.muted)
      for (const h of l.hits) {
        const tick = Math.round(
          h.step * 120 + (h.step % 2 ? plan.taste.swing * 0.36 : 0),
        );
        events.push(
          {
            tick,
            bytes: [0x90 + l.channel - 1, h.note + l.offset, h.velocity],
          },
          {
            tick:
              tick +
              Math.round(
                Math.min(
                  h.gate,
                  h.step % 2 ? 0.98 - plan.taste.swing * 0.003 : 0.98,
                ) * 120,
              ),
            bytes: [0x80 + l.channel - 1, h.note + l.offset, 0],
          },
        );
      }
  events.sort((a, b) => a.tick - b.tick);
  let last = 0;
  for (const e of events) {
    data.push(...vlq(e.tick - last), ...e.bytes);
    last = e.tick;
  }
  data.push(...vlq(7680 - last), 255, 47, 0);
  const n = data.length;
  return new Uint8Array([
    77,
    84,
    104,
    100,
    0,
    0,
    0,
    6,
    0,
    0,
    0,
    1,
    1,
    224,
    77,
    84,
    114,
    107,
    (n >>> 24) & 255,
    (n >>> 16) & 255,
    (n >>> 8) & 255,
    n & 255,
    ...data,
  ]);
}
