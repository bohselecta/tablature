# Status — 2026-10-15

Canonical repo: bohselecta/tablature. Base: `1a001b65c48f507e08a40a2a45a9600f7fdf7626`. Review branch: `codex/techno-mixing-station`. The owner authorized a public pull request; deployment and broadcast remain unconfigured. Packaged source and built localhost app are delivered together; run `python3 start.py` after extraction.

## Acceptance evidence

| Surface | Result | Evidence |
|---|---|---|
| L1/L2 composer, preservation, validation | PASS | Deterministic seven-lane output, changed seeds, locked notes/tone/mapping, explicit prompt descriptors, hostile/duplicate import rejection |
| L3/L4 scheduler and commands | PASS with mocked MIDI | Real pattern notes, explicit output, controls opt-in, note-off/stop, bar-boundary changes, stall stop, browser hot-unplug; no PC/SysEx sends |
| L5 audio bridge | PASS with synthetic input | Real Chromium AudioWorklet captured exact four-bar frame count, two channels, nonzero signal; loop start/level/stop executed; WAV verified 44.1 kHz/16-bit |
| L6 recording | PASS with synthetic input | Actual MediaRecorder produced a nonempty audio Blob from a selected synthetic stream |
| L7 save/import/export | PASS | Browser save/reload, MIDI download, malformed import recovery; type-0 SMF parsed for four-bar duration and balanced note events |
| L8 UI | PASS | Real Chromium desktop 1440×1100 and mobile 390×844; rendered screenshots inspected; keyboard focus, reduced motion, page-width overflow and errors/recovery checked |
| Legacy send regression | PASS | Unsupported patch/clip methods now reject instead of sending substitute patterns; sixteen clip positions |
| Candidate packets | PASS for compilation only | Published track-1 mute example/checksum matched; invalid track/value rejected; no candidate sender |
| Typecheck / production build | PASS | `npm run build` (TypeScript project build + Vite) |
| Core tests | PASS | `npm test`: 13 tests |
| Browser acceptance | PASS | `npm run test:browser`: 5 journeys, 14.0 seconds on Chromium 153 in this runtime |
| Changed-code lint | PASS | New live/model/audio/protocol/UI/test/config files and modified MV1Device pass ESLint |
| Repo-wide lint | FAIL, inherited debt | Untouched-base worktree: 14 errors/5 warnings; current repository: 12 errors/5 warnings, in retained legacy code. No lint rules relaxed |
| Packaged launcher | PASS | Python localhost launcher served built HTML and four referenced built assets with HTTP 200 |
| Physical MV-1/Vestax/interface | NOT_RUN | Hardware unavailable; follow HARDWARE_TEST_LOG.md |
| Runtime cloud AI / provider | NOT_APPLICABLE | No provider wired or billed; current composer is explicit local rules plus validated plan import |
| Native app / public deployment / TikTok | NOT_RUN | Not built or performed in this pass |

The software slice is verified under the stated fixtures. The complete hardware station is pending physical calibration. Deep hardware readback, patch discovery/MFX writes, round-trip latency compensation, independent cue buses and long-set validation remain open. Existing vocal/Electribe placeholders remain in the original studio and are not included in the verified live path.

The earlier private portable delivery retains the recovered design archive. The public review branch excludes that raw intake archive and incidental private file identifiers.


## Locked next coding pass

The owner dedicated the 2020 Intel MacBook Pro (8 GB, exact model/OS pending inventory) to this station on 2026-10-15. macOS is the initial target; Linux remains a measured fallback. Read STATION_PLAN.md and CODING_PASS.md before implementation. Native audio/MIDI, appliance startup, channel-pair routing, calibration and recovery are planned, not implemented in this browser baseline.

Review finding addressed: capture now rejects replacement while a loop is playing; Stop loop retains the buffer and keeps the live sequencer running. The synthetic audio regression covers the rejection and retained-buffer stop behavior. A separate UI lifecycle fixture verifies Stop loop, retained WAV availability and recapture without stopping the live sequencer; it mocks capture and scheduling, while the other journeys retain real browser audio and scheduler checks. Earlier desktop browser runs intermittently hit the strict timing stop; retain this as a native-engine acceptance concern.

An inherited Vercel integration attempted a preview for PR #1 and reported Error. Its deployment HNzuDDs5i3CdBVseft8Fn6oMMHVj could not be inspected through the connected Vercel account (404 with the bot-reported team ID); root cause is unknown. Local build success does not establish deployment success. Cloud hosting is not an acceptance dependency for this dedicated local appliance; no project settings were changed or deployment explicitly requested.
