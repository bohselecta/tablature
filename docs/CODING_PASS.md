# Next coding pass: dedicated Intel Mac station

Start on main after Techno Mixing Station PR #1 is merged. Use one implementation branch, suggested `codex/intel-mac-station`. Read AGENTS.md, STATUS.md, STATION_PLAN.md and the existing model/Instrument/AudioBridge code first. Continue this repository and approved visual identity; do not create a second project.

## First complete vertical slice

Implement one real path: validated plan → native scheduling → explicit MIDI output → physical MV-1 sound → selected stereo capture → retained loop on a separate output pair → mixer-return stereo recording → recoverable saved session. Keep software fixtures for environments without hardware and clearly label their evidence. Preserve the existing browser mode and old project format while adding a selectable native transport adapter.

1. Define protocol v1 and fixtures for device identity, channel pairs, state, timestamps, validated plans, commands, acknowledgements and errors. Engine snapshots are authoritative; reconnection requests a snapshot instead of resending Play.
2. Implement and test the native process with a deterministic fake backend first, then macOS CoreAudio/CoreMIDI adapters. Use a monotonic timing source and immutable plan handoff at bar boundaries. Validate incoming plan data independently of the browser. Keep unsupported hardware writes blocked.
3. Route live capture, loop playback and mixer recording through explicitly selected channel pairs. Support actual negotiated sample rate and buffer size; reject unsupported layouts. Stop loop independently, retain its buffer, block recapture while it plays and leave the previous buffer usable after capture failure. Write PCM WAV on a disk worker and provide recoverable partial takes after simulated failure.
4. Connect the current operator UI through the native adapter. Expose startup/disarmed, configuration, missing/ambiguous device, playing/capture/recording, xrun, fault and recovery states. Keep panic, locks, traits, scenes, undo, persistence, exports and legacy route.
5. Package a macOS x86_64 application/launcher with bundled assets, versioned configuration, optional login launch, diagnostics and a documented last-known-good rollback. No internet/npm dependency during use. Do not claim signing/notarization or installation until performed.

## Evidence required

| Gate | Acceptance receipt |
|---|---|
| Baseline preservation | Existing 13 core checks and browser flows retained; add meaningful regressions for changed behavior, no test weakening |
| Protocol | Reject malformed/out-of-range plans, stale session tokens, wrong origins, invalid-state commands and oversized messages; duplicate requests do not duplicate playback |
| Timing | Deterministic simulation proves bar-boundary change, queue bounds, cancel/stop, stall/disconnect and no burst of overdue notes |
| Native integration | Build and run macOS x86_64 engine; enumerate actual CoreAudio/CoreMIDI endpoints, open correct pairs, report negotiated configuration; Linux simulation is insufficient |
| Loop lifecycle | Capture, independent loop start/stop, recapture guard, retained buffer on failure, tempo guard and alignment compensation exercised |
| Recording | Actual mixer return has left/right separation and rotary moves, no feedback or clipping; interrupted take is recoverable; no silent drop/overflow |
| Recovery | UI reload/reconnect, missing devices, duplicate names, USB unplug, permission denial, engine restart and full disk produce explicit safe states; restart never auto-arms |
| UI | Actual browser desktop/phone states inspected, keyboard/panic accessible, reduced motion honored, no console errors or page-width overflow |
| Appliance | Login launch and offline launch verified on the Mac; no automatic sound; profiles restore unambiguously; rollback performed |
| Physical rehearsal | 60-minute dedicated performance; log CPU/RAM, callback xruns, MIDI timing, loop offset/drift, recording continuity and any stop. No unexplained stops or xruns; timing thresholds below |

Initial engineering targets, not measured claims: configure 48 kHz / 256 frames if supported (otherwise document negotiated rate/buffer); compensated loop onset within 10 ms of the live bar; relative drift below 10 ms during a 10-minute retained-loop overlap; no overdue-note bursts or unexplained transport stops during the 60-minute run. Report measured distributions, not only averages. If the selected hardware cannot meet a target, record the failure and engineering decision; do not quietly relax the gate. A UI crash may not automatically restart playback. No universal sub-10-ms round-trip monitoring claim is made.

## Known gaps to start from

- Current implementation is browser scheduling/audio, not a native daemon. Selected browser device does not establish independent access to interface channel pairs.
- Desktop browser acceptance intermittently hit the strict timing stall guard; final complete run passed. Investigate timing on the dedicated machine; retain the guard.
- Actual Mac model/OS, MV-1 firmware and interface inventory are external dependencies. Complete software work independently, then provide an executable hardware acceptance runner/checklist; do not invent receipts.
- Runtime composition is a limited local rules engine. Preserve validated AI-authored plan import; no cloud API key or paid model is assumed. A richer set schema must migrate the existing plan format without data loss.
- The inherited Vercel preview reported failure; API inspection returned 404. This is not a local appliance acceptance gate and its root cause is unknown. Do not present it as a verified deployment.
- Existing unrelated legacy lint debt remains documented; do not disable rules or remove features to make it disappear.

Deliver a reviewable implementation PR, exact commit, runnable package/build instructions, protocol fixtures, automated results, actual macOS results where available, and a concise physical NOT_RUN list. Keep the distinction between planned, simulated, compiled and physically verified capabilities.
