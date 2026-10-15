import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  commands,
  compose,
  DEFAULT_TASTE,
  interpret,
  midiFile,
  SCENES,
  validatePlan,
  type Plan,
  type Taste,
} from "../core/live/model";
import { Instrument, type Route } from "../core/live/Instrument";
import { AudioBridge } from "../core/live/AudioBridge";
import { candidateTrackPacket } from "../core/live/MV1Protocol";
import "./live.css";

const INITIAL_PROMPT =
  "Clicky minimal techno, dry drums, rubber bass, tiny glass stabs. 127 BPM.";
const COLORS = [
  "#efb768",
  "#ee8a8b",
  "#99c7bb",
  "#bba1d3",
  "#d8bc73",
  "#84b9cc",
  "#aab99b",
];
function initial() {
  try {
    const s = localStorage.getItem("fd-live-project-v1");
    if (s) {
      const p: unknown = JSON.parse(s);
      validatePlan(p);
      return p;
    }
  } catch {
    /* Corrupt saved bytes are preserved until the user explicitly saves again. */
  }
  return compose(INITIAL_PROMPT);
}
function download(data: BlobPart, name: string, type = "application/json") {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function describe(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}

export function LiveCanvas() {
  const [draft, setDraft] = useState<Plan>(initial);
  const [engine] = useState(() => new Instrument(draft));
  const [bridge] = useState(() => new AudioBridge());
  const [prompt, setPrompt] = useState(draft.prompt);
  const [active, setActive] = useState(draft);
  const [playing, setPlaying] = useState(false);
  const [route, setRoute] = useState<Route>("audition");
  const [step, setStep] = useState(-1);
  const [bar, setBar] = useState(0);
  const [selected, setSelected] = useState(4);
  const [message, setMessage] = useState(
    "Your hardware is the instrument. Start with software audition, or connect the MV-1.",
  );
  const [error, setError] = useState("");
  const [traits, setTraits] = useState<string[]>([
    "Original patterns",
    "Editable local interpretation",
  ]);
  const [history, setHistory] = useState<Plan[]>([]);
  const [queued, setQueued] = useState(false);
  const [ports, setPorts] = useState<MIDIOutput[]>([]);
  const [portId, setPortId] = useState("");
  const [armed, setArmed] = useState(false);
  const [midiBusy, setMidiBusy] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [captureId, setCaptureId] = useState("");
  const [recordId, setRecordId] = useState("");
  const [outputId, setOutputId] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [loopReady, setLoopReady] = useState(false);
  const [looping, setLooping] = useState(false);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showRouting, setShowRouting] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [remembered, setRemembered] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const lane = draft.lanes[selected];
  const candidatePacket = candidateTrackPacket(
    selected + 1,
    "volume",
    Math.round(lane.volume),
  );
  let commandRows: ReturnType<typeof commands> = [];
  let planError = "";
  try {
    commandRows = commands(draft);
  } catch (e) {
    planError = describe(e);
  }
  const safe = async (action: () => Promise<void>) => {
    setError("");
    try {
      await action();
    } catch (e) {
      setError(describe(e));
    }
  };
  useEffect(() => {
    engine.onStep = (s, p) => {
      setStep(s);
      setActive(p);
      if (s % 16 === 0 && !engine.pending) setQueued(false);
    };
    engine.onError = (m) => {
      setPlaying(false);
      setLooping(false);
      bridge.stopLoop();
      setError(m);
    };
    engine.onPorts = () => {
      setPorts([...(engine.access?.outputs.values() ?? [])]);
      if (!engine.output) {
        setPortId("");
        setArmed(false);
      }
    };
    const suspend = () => {
      if (document.hidden) {
        engine.stop();
        bridge.stopLoop();
        setPlaying(false);
        setLooping(false);
        setStep(-1);
        setMessage(
          "Paused because the performance tab was hidden. Return here and press Play.",
        );
      }
    };
    document.addEventListener("visibilitychange", suspend);
    return () => {
      document.removeEventListener("visibilitychange", suspend);
      bridge.dispose();
      void engine.dispose();
    };
  }, [engine, bridge]);
  const queuePlan = (p: Plan) => {
    if ((loopReady || capturing) && p.bpm !== engine.plan.bpm)
      throw Error("Clear or finish the captured loop before changing tempo.");
    engine.queue(p);
  };
  const editLane = (changes: Partial<Plan["lanes"][number]>) =>
    setDraft((p) => ({
      ...p,
      lanes: p.lanes.map((l, i) => (i === selected ? { ...l, ...changes } : l)),
    }));
  const rememberHistory = () =>
    setHistory((h) => [
      ...h.slice(-11),
      structuredClone(engine.pending ?? engine.plan),
    ]);
  const generate = (
    taste: Taste = draft.taste,
    seed = draft.seed + 1,
    scene = draft.scene,
  ) => {
    setDraft(compose(prompt, taste, seed, draft.bpm, scene, draft));
    setTraits(["Using your edited taste settings"]);
  };
  const apply = () => {
    try {
      validatePlan(draft);
      if (loopReady && draft.bpm !== engine.plan.bpm)
        throw Error("Clear the captured loop before changing tempo.");
      rememberHistory();
      queuePlan(draft);
      setQueued(engine.running);
      if (!engine.running) setActive(draft);
      setMessage(
        engine.running
          ? "Changes queued for the next bar. Locked parts stay yours."
          : "Plan applied. Choose software audition or hardware, then Play.",
      );
      setError("");
    } catch (e) {
      setError(describe(e));
    }
  };
  const stop = () => {
    engine.stop();
    bridge.cancel?.(new Error("Capture canceled by Stop."));
    bridge.stopLoop();
    setPlaying(false);
    setLooping(false);
    setStep(-1);
    setQueued(false);
    setActive(engine.plan);
  };
  const play = () =>
    safe(async () => {
      if (busy) return;
      setBusy(true);
      try {
        await engine.start(route);
        setPlaying(true);
        setActive(engine.plan);
        setMessage(
          route === "audition"
            ? "Software audition is playing. These are simple local synth tones, not MV-1 audio."
            : "Live MIDI is playing. Keep MV-1 internal transport stopped; listen through its audio outputs.",
        );
      } finally {
        setBusy(false);
      }
    });
  const usePrompt = () => {
    const result = interpret(prompt, draft.taste);
    setTraits(result.traits);
    setDraft(
      compose(
        prompt,
        result.taste,
        draft.seed + 1,
        result.bpm ?? draft.bpm,
        draft.scene,
        draft,
      ),
    );
    setMessage(
      "Local composer interpreted your words. Edit the traits, inspect the notes, then apply.",
    );
  };
  const save = () => {
    try {
      validatePlan(draft);
      localStorage.setItem("fd-live-project-v1", JSON.stringify(draft));
      setMessage(
        "Project saved in this browser. Export JSON for a portable backup.",
      );
      setError("");
    } catch (e) {
      setError(`Could not save: ${describe(e)}. Export JSON instead.`);
    }
  };
  const like = () => {
    try {
      localStorage.setItem("fd-live-taste-v1", JSON.stringify(draft.taste));
      setRemembered(true);
      setMessage(
        "Taste remembered locally: density, swing, brightness and space. Recall it on any new variation.",
      );
    } catch (e) {
      setError(describe(e));
    }
  };
  const recall = () => {
    try {
      const raw = localStorage.getItem("fd-live-taste-v1");
      if (!raw)
        throw Error("No saved taste yet. Use Remember this feel first.");
      const taste: unknown = JSON.parse(raw);
      const p = compose(
        prompt,
        taste as Taste,
        draft.seed + 1,
        draft.bpm,
        draft.scene,
        draft,
      );
      validatePlan(p);
      setDraft(p);
      setMessage(
        "Your saved feel is back in the draft. Locked parts preserved.",
      );
    } catch (e) {
      setError(describe(e));
    }
  };
  const importFile = async (f: File) => {
    if (f.size > 1000000) {
      setError("Project is too large. Use a Live Canvas JSON under 1 MB.");
      return;
    }
    try {
      const value: unknown = JSON.parse(await f.text());
      validatePlan(value);
      setDraft(value);
      setPrompt(value.prompt);
      setMessage(
        "Project imported as a draft. Review before applying; the current groove keeps playing.",
      );
      setError("");
    } catch (e) {
      setError(describe(e));
    }
  };
  const capture = () =>
    safe(async () => {
      if (engine.pending)
        throw Error("Wait for the queued plan to land before capturing.");
      setCapturing(true);
      try {
        const at = engine.boundary();
        setMessage(
          "Capturing four bars from the selected audio input, starting on the next bar.",
        );
        await bridge.capture(engine.context!, captureId, at, engine.plan.bpm);
        setLoopReady(true);
        setMessage(
          "Four-bar loop captured. Start it on the next bar, then change the live groove.",
        );
      } finally {
        setCapturing(false);
      }
    });
  const record = () =>
    safe(async () => {
      if (recording) {
        const blob = await bridge.finishRecording();
        setRecording(false);
        download(
          blob,
          `Gold-Circuit-mixer-${Date.now()}.${blob.type.includes("mp4") ? "mp4" : "webm"}`,
          blob.type,
        );
        setMessage(
          "Mixer input recording downloaded. This captures the selected input, including only what is routed there.",
        );
      } else {
        await bridge.record(recordId);
        setRecording(true);
        setMessage(
          "Recording selected mixer input. Stop recording to download your take.",
        );
      }
    });
  return (
    <div className="live">
      <header className="live-header">
        <a
          className="live-brand"
          href="/"
          aria-label="Techno Mixing Station home"
        >
          <span className="brand-mark">tm</span>
          <span>
            <strong>TECHNO MIXING STATION</strong>
            <small>FROZEN GROOVES · LIVE HARDWARE</small>
          </span>
        </a>
        <div className="session-name">
          <span className="signal-dot" /> CYPRESS OUTPOST <span>/ BAY 01</span>
        </div>
        <button
          onClick={() => setShowRouting((s) => !s)}
          aria-expanded={showRouting}
        >
          Connections & recording
        </button>
      </header>
      <section
        className="observatory"
        aria-label="Forest moon-base observatory"
      >
        <div className="outpost-label">
          <span className="signal-dot" /> NEW ORLEANS ↔ LUNAR FORESTRY DIVISION
        </div>
        <div className="observatory-caption">
          <span>THE GROOVE CONSERVATORY</span>
          <strong>
            Small patterns.
            <br />
            Strange new worlds.
          </strong>
          <span>TAKE A SIP. DROP A PART. STAY A WHILE.</span>
        </div>
        <div className="window-stamp">
          01 / CYPRESS
          <br />
          FROZEN FREQUENCY WORKS
        </div>
      </section>
      <main className="live-layout">
        <aside className="intent panel">
          <div className="eyebrow">01 / DIRECTION</div>
          <h1>
            Make it
            <br />
            <em>feel like you.</em>
          </h1>
          <p>
            Write the idea. Keep what moves you.
            <br />
            Play the rest into something new.
          </p>
          <label className="field-label" htmlFor="intent">
            Your next groove
          </label>
          <textarea
            id="intent"
            value={prompt}
            maxLength={4000}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="button-pair">
            <button className="gold" onClick={usePrompt}>
              Shape the draft ↗
            </button>
            <button
              onClick={() => {
                const text =
                  "Sparse dry rubber bass, shuffled clicks, tiny glass stabs. 127 BPM.";
                setPrompt(text);
                setDraft(
                  compose(
                    text,
                    DEFAULT_TASTE,
                    draft.seed + 97,
                    draft.bpm,
                    draft.scene,
                    draft,
                  ),
                );
                setTraits([
                  "New deterministic variation",
                  "Locked parts preserved",
                ]);
              }}
              aria-label="Random Spark"
            >
              ✳ Spark
            </button>
          </div>
          <div className="composer-tag">
            LOCAL COMPOSER <span>OFFLINE · NO API</span>
          </div>
          <div className="trait-chips">
            {traits.map((t) => (
              <span key={t}>{t}</span>
            ))}
            <span>C minor</span>
            <span>{draft.bpm} BPM</span>
          </div>
          <div className="panel-rule" />
          <div className="eyebrow">PROMPT TRAITS / EDITABLE</div>
          {(
            [
              ["density", "Space between notes", "Sparse", "Busy"],
              ["swing", "Pocket", "Straight", "Shuffled"],
              ["brightness", "Tone", "Warm", "Bright"],
              ["space", "Room", "Dry", "Dubby"],
            ] as const
          ).map(([key, title, min, max]) => (
            <label className="taste-control" key={key}>
              <span>
                {title}
                <b>{draft.taste[key]}</b>
              </span>
              <input
                aria-label={title}
                type="range"
                min="0"
                max="100"
                value={draft.taste[key]}
                onChange={(e) =>
                  generate({ ...draft.taste, [key]: Number(e.target.value) })
                }
              />
              <small>
                <span>{min}</span>
                <span>{max}</span>
              </small>
            </label>
          ))}
          <div className="button-pair">
            <button onClick={like}>
              {remembered ? "✓ Feel remembered" : "♡ Remember this feel"}
            </button>
            <button onClick={recall}>Recall</button>
          </div>
          <p className="micro">
            References become editable musical traits. Every pattern is
            original. Taste memory stores your explicit settings on this
            browser.
          </p>
        </aside>
        <section className="canvas panel" aria-label="MV-1 live canvas">
          <div className="canvas-heading">
            <div>
              <div className="eyebrow">02 / MV-1 HARDWARE CANVAS</div>
              <h2>
                {SCENES[draft.scene]}
                <span className="scene-number">
                  {String(draft.scene + 1).padStart(2, "0")} / 16
                </span>
              </h2>
            </div>
            <label className="tempo">
              <input
                aria-label="Tempo"
                type="number"
                min="60"
                max="180"
                value={draft.bpm}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (n >= 60 && n <= 180 && !loopReady && !playing)
                    setDraft((p) => ({ ...p, bpm: n }));
                }}
                disabled={playing || loopReady}
              />{" "}
              <span>BPM</span>
            </label>
          </div>
          <div className="performance-bar">
            <div className="transport">
              <button
                className="play gold"
                aria-label={route === "audition" ? "Audition" : "Play MV-1"}
                disabled={busy || playing}
                onClick={play}
              >
                ▶ {route === "audition" ? "Audition" : "Play MV-1"}
              </button>
              <button onClick={stop} aria-label="Stop all playback">
                ■ Stop
              </button>
            </div>
            <select
              aria-label="Playback destination"
              value={route}
              disabled={playing}
              onChange={(e) => setRoute(e.target.value as Route)}
            >
              <option value="audition">Software audition</option>
              <option value="hardware">MV-1 hardware · MIDI</option>
            </select>
            <span className="bar-count">
              {playing
                ? `${Math.floor(step / 16) + 1}.${(step % 16) + 1}`
                : "—.—"}
            </span>
          </div>
          {planError && (
            <p className="plan-invalid" role="alert">
              {planError} Fix the channel or note settings before applying.
            </p>
          )}
          <div className="draft-actions">
            <button className="mint" disabled={!!planError} onClick={apply}>
              {playing ? "Apply at next bar" : "Apply draft"}
            </button>
            <button onClick={() => generate()}>↻ Evolve unlocked parts</button>
            <button
              disabled={
                !history.length ||
                ((loopReady || capturing) &&
                  history[history.length - 1]?.bpm !== engine.plan.bpm)
              }
              onClick={() => {
                const p = history[history.length - 1];
                setHistory((h) => h.slice(0, -1));
                setDraft(p);
                setPrompt(p.prompt);
                queuePlan(p);
                setQueued(engine.running);
                if (!engine.running) setActive(p);
                setMessage(
                  "Previous plan restored; playback changes on the next bar.",
                );
              }}
            >
              ↶ Undo
            </button>
          </div>
          <div className="scene-strip" aria-label="Scenes">
            {SCENES.map((name, i) => (
              <button
                key={name}
                aria-label={`Scene ${i + 1}: ${name}`}
                aria-pressed={draft.scene === i}
                onClick={() => generate(draft.taste, draft.seed, i)}
                className={draft.scene === i ? "chosen" : ""}
              >
                {String(i + 1).padStart(2, "0")}
              </button>
            ))}
          </div>
          <div className="grid-toolbar">
            <span>
              {queued
                ? "NEXT BAR: NEW PLAN"
                : playing
                  ? `PLAYING: ${SCENES[active.scene]}`
                  : "DRAFT · FOUR-BAR LOOP"}
            </span>
            <div>
              {[0, 1, 2, 3].map((b) => (
                <button
                  key={b}
                  aria-label={`Edit bar ${b + 1}`}
                  aria-pressed={bar === b}
                  className={bar === b ? "chosen" : ""}
                  onClick={() => setBar(b)}
                >
                  {b + 1}
                </button>
              ))}
            </div>
          </div>
          <div className="sequencer-scroll">
            <div className="sequencer">
              <div className="step-head">
                <span>PART / CH</span>
                {Array.from({ length: 16 }, (_, i) => (
                  <span key={i}>
                    {i % 4 === 0 ? String(i / 4 + 1).padStart(2, "0") : "·"}
                  </span>
                ))}
                <span>HOLD</span>
              </div>
              {draft.lanes.map((l, index) => (
                <div
                  className={`seq-row ${selected === index ? "selected" : ""} ${l.muted ? "muted" : ""}`}
                  style={{ "--lane": COLORS[index] } as CSSProperties}
                  key={l.role}
                >
                  <button
                    className="lane-name"
                    onClick={() => setSelected(index)}
                    aria-label={`Select ${l.role}`}
                  >
                    <span className="lane-led" />
                    <span>
                      {l.role}
                      <small>
                        CH {l.channel} · {l.hits.length} NOTES
                      </small>
                    </span>
                  </button>
                  {Array.from({ length: 16 }, (_, i) => {
                    const hit = l.hits.find((h) => h.step === bar * 16 + i);
                    return (
                      <button
                        key={i}
                        aria-label={`${l.role} bar ${bar + 1} step ${i + 1}`}
                        aria-pressed={!!hit}
                        className={`step-cell ${hit ? "hit" : ""} ${playing && step === bar * 16 + i ? "playhead" : ""} ${i % 4 === 0 ? "beat" : ""}`}
                        onClick={() =>
                          setDraft((p) => ({
                            ...p,
                            lanes: p.lanes.map((old, j) =>
                              j !== index
                                ? old
                                : {
                                    ...old,
                                    hits: hit
                                      ? old.hits.filter(
                                          (h) => h.step !== bar * 16 + i,
                                        )
                                      : [
                                          ...old.hits,
                                          {
                                            step: bar * 16 + i,
                                            note:
                                              index < 3
                                                ? 60
                                                : index === 3
                                                  ? 37
                                                  : index === 4
                                                    ? 36
                                                    : index === 5
                                                      ? 60
                                                      : 72,
                                            velocity: 80,
                                            gate: 0.4,
                                          },
                                        ].sort((a, b) => a.step - b.step),
                                  },
                            ),
                          }))
                        }
                      >
                        <span />
                      </button>
                    );
                  })}
                  <button
                    className="lock"
                    aria-label={`${l.locked ? "Unlock" : "Lock"} ${l.role}`}
                    aria-pressed={l.locked}
                    onClick={() =>
                      setDraft((p) => ({
                        ...p,
                        lanes: p.lanes.map((old, j) =>
                          j === index ? { ...old, locked: !old.locked } : old,
                        ),
                      }))
                    }
                  >
                    {l.locked ? "●" : "○"}
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="mute-bank" aria-label="Part mutes">
            {draft.lanes.map((l, i) => (
              <button
                key={l.role}
                aria-pressed={!l.muted}
                className={!l.muted ? "on" : ""}
                style={{ "--lane": COLORS[i] } as CSSProperties}
                onClick={() => {
                  const p = {
                    ...draft,
                    lanes: draft.lanes.map((old, j) =>
                      j === i ? { ...old, muted: !old.muted } : old,
                    ),
                  };
                  setDraft(p);
                  try {
                    queuePlan(p);
                    setQueued(engine.running);
                    if (!engine.running) setActive(p);
                  } catch (e) {
                    setError(describe(e));
                  }
                }}
              >
                {l.muted ? "＋" : "−"} {l.role}
              </button>
            ))}
          </div>
          <div className="loop-deck">
            <div>
              <span className="eyebrow">THE SECOND SOURCE</span>
              <h3>Mix it against itself.</h3>
              <p>
                Capture four bars. Let that groove run while you change the
                MV-1.
              </p>
            </div>
            <div className="loop-controls">
              <button
                disabled={
                  !playing || capturing || !captureId || queued || looping
                }
                onClick={capture}
              >
                {capturing
                  ? "Capturing four bars…"
                  : loopReady
                    ? "Recapture 4 bars"
                    : "Capture 4 bars"}
              </button>
              <button
                disabled={!loopReady || !playing || capturing}
                onClick={() =>
                  safe(async () => {
                    if (looping) {
                      bridge.stopLoop();
                      setLooping(false);
                      setMessage(
                        "Captured loop stopped and retained. Recapture or restart it while the live groove keeps playing.",
                      );
                      return;
                    }
                    bridge.play(engine.context!, engine.boundary());
                    setLooping(true);
                    setMessage(
                      "Captured loop starts on the next bar. Blend its separate audio output on your Vestax.",
                    );
                  })
                }
              >
                {looping ? "■ Stop loop" : "▶ Loop"}
              </button>
              <button
                disabled={!loopReady}
                onClick={() => {
                  bridge.stopLoop();
                  bridge.buffer = null;
                  setLooping(false);
                  setLoopReady(false);
                }}
              >
                Clear loop
              </button>
              <button
                disabled={!loopReady}
                onClick={() =>
                  safe(async () => {
                    download(
                      await bridge.wav(),
                      `Gold-Circuit-loop-${bridge.captureBpm ?? draft.bpm}bpm.wav`,
                      "audio/wav",
                    );
                  })
                }
              >
                Save WAV
              </button>
              <input
                aria-label="Captured loop level"
                type="range"
                min="0"
                max="100"
                defaultValue="70"
                onChange={(e) => bridge.level(Number(e.target.value) / 100)}
              />
            </div>
          </div>
        </section>
        <aside className="shaping panel">
          <div className="eyebrow">03 / SOUND SHAPING STACK</div>
          <h2 style={{ color: COLORS[selected] }}>
            {lane.role}
            <small>CHANNEL {lane.channel}</small>
          </h2>
          <label className="field-label">
            Source suggestion
            <input
              aria-label="Source suggestion"
              value={lane.source}
              maxLength={160}
              onChange={(e) => editLane({ source: e.target.value })}
            />
          </label>
          <p className="micro">
            Select this sound on the MV-1. Automatic patch/MFX selection awaits
            verification.
          </p>
          <div className="tone-dials">
            {(
              [
                ["volume", "Level"],
                ["cutoff", "Cutoff"],
                ["reverb", "Reverb"],
              ] as const
            ).map(([key, label]) => (
              <label key={key}>
                <span
                  className="dial"
                  style={
                    {
                      "--turn": `${(lane[key] / 127) * 270 - 135}deg`,
                    } as CSSProperties
                  }
                >
                  <i />
                </span>
                <span>{label}</span>
                <b>{Math.round(lane[key])}</b>
                <input
                  type="range"
                  aria-label={`${lane.role} ${label}`}
                  min="0"
                  max="127"
                  value={lane[key]}
                  onChange={(e) => editLane({ [key]: Number(e.target.value) })}
                />
              </label>
            ))}
          </div>
          <div className="mapping-fields">
            <label>
              MIDI channel
              <input
                aria-label={`${lane.role} MIDI channel`}
                type="number"
                min="1"
                max="16"
                value={lane.channel}
                onChange={(e) => editLane({ channel: Number(e.target.value) })}
              />
            </label>
            <label>
              Note offset
              <input
                aria-label={`${lane.role} note offset`}
                type="number"
                min="-24"
                max="24"
                value={lane.offset}
                onChange={(e) => editLane({ offset: Number(e.target.value) })}
              />
            </label>
          </div>
          <div className="panel-rule" />
          <div className="eyebrow">MV-1 COMMAND SAFETY</div>
          <div className="capability">
            <span className="badge documented">DOCUMENTED</span>
            <p>
              Notes, level, cutoff, reverb. Physical response still needs your
              MV-1 test.
            </p>
          </div>
          <label className="arm">
            <input
              type="checkbox"
              checked={armed}
              onChange={(e) => {
                setArmed(e.target.checked);
                engine.controlsArmed = e.target.checked;
              }}
            />{" "}
            Include documented tone controls when applying a plan
          </label>
          <div className="capability">
            <span className="badge candidate">PREVIEW ONLY</span>
            <p>
              Patch selection, MFX and deeper SysEx. Nothing from this group is
              sent.
            </p>
          </div>
          <button
            className="full"
            aria-expanded={showCommands}
            onClick={() => setShowCommands((s) => !s)}
          >
            Inspect command plan {showCommands ? "−" : "+"}
          </button>
          <div className="panel-rule" />
          <div className="eyebrow">YOUR SESSION</div>
          <div className="file-actions">
            <button onClick={save}>Save here</button>
            <button
              onClick={() => {
                try {
                  validatePlan(draft);
                  download(
                    JSON.stringify(draft, null, 2),
                    "Gold-Circuit.fd-live.json",
                  );
                } catch (e) {
                  setError(describe(e));
                }
              }}
            >
              Export JSON
            </button>
            <button onClick={() => file.current?.click()}>Import JSON</button>
            <button
              onClick={() => {
                try {
                  const bytes = midiFile(draft);
                  download(
                    new Uint8Array(bytes).buffer,
                    "Gold-Circuit.mid",
                    "audio/midi",
                  );
                } catch (e) {
                  setError(describe(e));
                }
              }}
            >
              Export MIDI
            </button>
            <button
              onClick={() => {
                try {
                  const p = {
                    ...draft,
                    lanes: draft.lanes.map((l, i) => ({
                      ...l,
                      muted: i !== selected,
                    })),
                  };
                  const bytes = midiFile(p);
                  download(
                    new Uint8Array(bytes).buffer,
                    `S${String(draft.scene + 1).padStart(2, "0")}T${selected + 1}.mid`,
                    "audio/midi",
                  );
                } catch (e) {
                  setError(describe(e));
                }
              }}
            >
              Export selected clip
            </button>
            <button
              onClick={() =>
                download(
                  JSON.stringify(
                    {
                      changes: engine.journal,
                      midi: engine.messages,
                      droppedMessages: engine.droppedMessages,
                    },
                    null,
                    2,
                  ),
                  "Gold-Circuit-command-log.json",
                )
              }
            >
              Export change log
            </button>
          </div>
          <input
            hidden
            ref={file}
            type="file"
            accept=".json"
            aria-label="Import live project"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importFile(f);
              e.target.value = "";
            }}
          />
          <p className="micro">
            MIDI export is the current four-bar pattern. It does not write an
            MV-1 project or assign patches.
          </p>
          <a className="legacy-link" href="/?studio=legacy">
            Open original tablature studio ↗
          </a>
        </aside>
      </main>
      {showRouting && (
        <section
          className="connections panel"
          aria-label="Connections and recording"
        >
          <div>
            <div className="eyebrow">THE PHYSICAL PATH</div>
            <h2>MV-1 → Vestax → your room.</h2>
            <p>
              USB MIDI supplies the notes. MV-1 stereo audio goes to a Vestax
              LINE channel. The laptop loop needs a separate output into another
              LINE channel. Capture the mixer’s recording output for the full
              performance. Exact Vestax model and interface routing remain
              unverified.
            </p>
          </div>
          <div className="connection-section">
            <h3>MIDI / instrument</h3>
            <button
              disabled={midiBusy || playing}
              onClick={() =>
                safe(async () => {
                  setMidiBusy(true);
                  try {
                    const found = await engine.requestMIDI();
                    setPorts(found);
                    setMessage(
                      found.length
                        ? `${found.length} MIDI outputs found. Select yours explicitly.`
                        : "No MIDI outputs found. Connect the MV-1 and refresh; software audition is available.",
                    );
                  } finally {
                    setMidiBusy(false);
                  }
                })
              }
            >
              {midiBusy ? "Requesting access…" : "Find MIDI outputs"}
            </button>
            <select
              aria-label="MIDI output"
              value={portId}
              disabled={playing}
              onChange={(e) => {
                const id = e.target.value;
                if (!id) return;
                void safe(async () => {
                  await engine.selectOutput(id);
                  setPortId(id);
                  setArmed(false);
                  setMessage(
                    "MIDI port selected. No test note or patch command sent. Choose hardware playback when ready.",
                  );
                });
              }}
            >
              <option value="">Select output…</option>
              {ports.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.state}
                </option>
              ))}
            </select>
            <span className="micro">
              {portId
                ? "Port selected · audio not verified"
                : "No MIDI port selected"}
            </span>
          </div>
          <div className="connection-section">
            <h3>Audio / loop bridge</h3>
            <button
              onClick={() =>
                safe(async () => {
                  setDevices(await bridge.devices());
                  setMessage(
                    "Audio permission granted. Select the actual hardware inputs and laptop output. Input monitoring is off.",
                  );
                })
              }
            >
              Find audio devices
            </button>
            <label>
              MV-1 loop input
              <select
                aria-label="MV-1 loop input"
                value={captureId}
                disabled={capturing}
                onChange={(e) => setCaptureId(e.target.value)}
              >
                <option value="">Select input…</option>
                {devices
                  .filter((d) => d.kind === "audioinput")
                  .map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || "Audio input"}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Laptop loop output
              <select
                aria-label="Laptop loop output"
                value={outputId}
                onChange={(e) => {
                  const id = e.target.value;
                  void safe(async () => {
                    await bridge.output(await engine.audio(), id);
                    setOutputId(id);
                    setMessage(
                      "Laptop audio output changed. Software audition and captured loop share this output.",
                    );
                  });
                }}
              >
                <option value="">System default</option>
                {devices
                  .filter(
                    (d) => d.kind === "audiooutput" && d.deviceId !== "default",
                  )
                  .map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || "Audio output"}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <div className="connection-section">
            <h3>Record the real mixer</h3>
            <label>
              Vestax record input
              <select
                aria-label="Vestax record input"
                value={recordId}
                disabled={recording}
                onChange={(e) => setRecordId(e.target.value)}
              >
                <option value="">Select input…</option>
                {devices
                  .filter((d) => d.kind === "audioinput")
                  .map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || "Audio input"}
                    </option>
                  ))}
              </select>
            </label>
            <button
              className={recording ? "recording" : ""}
              disabled={!recordId}
              onClick={record}
            >
              {recording ? "■ Stop & download take" : "● Record mixer input"}
            </button>
            <p className="micro">
              No automatic input monitoring. Avoid routing laptop return back
              into its capture input. Recording is the selected input, not a
              synthesized mix.
            </p>
          </div>
        </section>
      )}
      {showCommands && (
        <section className="command-inspector panel">
          <h2>Draft command plan</h2>
          <p>
            Notes send only during hardware playback. CC7 / CC74 / CC91 send
            only when tone controls are enabled. No SysEx or patch changes.
          </p>
          <p>
            MV-1 lab preview: {candidatePacket.label}.{" "}
            <code>
              {candidatePacket.bytes
                .map((b) => b.toString(16).padStart(2, "0"))
                .join(" ")}
            </code>
            . Community-derived address and computed checksum; transmission
            blocked.
          </p>
          <div className="command-table">
            <table>
              <thead>
                <tr>
                  <th>Track</th>
                  <th>Change</th>
                  <th>Evidence</th>
                  <th>Bytes / example</th>
                </tr>
              </thead>
              <tbody>
                {commandRows.map((c, i) => (
                  <tr key={i}>
                    <td>{c.track}</td>
                    <td>{c.label}</td>
                    <td>{c.status}</td>
                    <td>
                      {c.bytes
                        .map((b) => b.toString(16).padStart(2, "0"))
                        .join(" ") || "BLOCKED"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      <footer className="live-footer">
        <span>
          <i className={playing ? "lit" : ""} />
          {playing ? "LIVE" : "READY"}{" "}
          <b>
            {queued
              ? "CHANGE QUEUED"
              : route === "audition"
                ? "SOFTWARE AUDITION"
                : "HARDWARE MIDI"}
          </b>
        </span>
        <p role="status">{message}</p>
        <span>COMPOSE → SHAPE → PLAY → KEEP</span>
      </footer>
      {error && (
        <div className="live-error" role="alert">
          <span>{error}</span>
          <button onClick={() => setError("")} aria-label="Dismiss error">
            ×
          </button>
        </div>
      )}
    </div>
  );
}
