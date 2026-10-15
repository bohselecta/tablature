# Live Canvas contract — 2026-10-15

Goal: a usable preference-driven minimal-techno instrument around one MV-1, laptop and rotary mixer. Continue the existing repository, retain the old studio/data, and complete hardware-independent work. Public PR publication and merge were authorized on 2026-10-15; public hosting is not part of acceptance.

| ID | Acceptance behavior |
|---|---|
| L1 | Original deterministic four-bar/seven-lane plans, 16 scene directions, inspectable JSON and tone decisions |
| L2 | Editable traits, lane locks protecting notes/tone/mapping/mutes, explicit taste save/recall |
| L3 | Audition, note editing, bar-boundary application, part mutes, undo, active/draft distinction |
| L4 | Explicit MIDI output, actual notes/offs, stop/unplug/stall recovery, opt-in documented controls, no unverified PC/SysEx transmission |
| L5 | Selected audio input, exact four-bar capture, bar-aligned looping, selectable output, level and PCM16 WAV export |
| L6 | Selected mixer input recording, stop/download, no direct input monitoring |
| L7 | Versioned local save, validated import/export, full/single-lane MIDI export, legacy storage preservation |
| L8 | Desktop/mobile browser, keyboard/reduced-motion, error/recovery, meaningful tests |
| L9 | Recovery audit, source provenance, capability distinctions, physical test log |

Non-goals for the browser baseline: native rewrite, proprietary project editing, unverified patch/MFX writes, full DAW/vocal-suite completion, arbitrary language understanding, paid APIs, hardware purchases, public deployment.

Hardware response, kit mapping, driver latency, mixer routing/cue, long-set stability, musical enjoyment and TikTok broadcast require external equipment/account work. Synthetic browser audio and fake ports cannot satisfy those gates.

The next native appliance increment is governed by STATION_PLAN.md and CODING_PASS.md. Its native engine is planned; this does not change the evidence for the current browser implementation.
