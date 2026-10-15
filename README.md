# Techno Mixing Station

A local-first performance instrument for Hayden's Roland VERSELAB MV-1, laptop and Vestax PMC-250 rotary mixer. Describe a groove, edit its traits, lock the parts you love, and change the rest while you play. The MV-1 supplies hardware sound; the computer supplies composition, sequencing, an inspectable tone recipe and an audio loop bridge.

Recovered from `bohselecta/tablature` at `1a001b65c48f507e08a40a2a45a9600f7fdf7626`. Working branch: `codex/techno-mixing-station`. The recovered design provenance is described in docs. The original studio remains at `/?studio=legacy`; old storage keys and unrelated audio tools are preserved. See docs/RECOVERY_AUDIT.md for defects and limitations.

## Open the packaged app

Extract the ZIP, open a terminal in its folder, and run `python3 start.py` (Windows: `py start.py`). Python opens the included built app on localhost. Keep the terminal open; Ctrl+C stops the server. No API key or account required. For hardware use a desktop browser supporting Web MIDI. This is a local browser app, not a native Tauri executable.

For a source checkout: `npm ci`, then `npm run dev`. Rebuild packaged files with `npm run build`.

## First performance

1. Edit your idea, press **Shape the draft**, inspect the seven lanes, then **Apply draft** and **Audition**. Software audition uses simple local synths; it is not MV-1 audio.
2. Lock a lane with its Hold circle. Change density, pocket, tone or room. **Evolve unlocked parts** generates new original material around protected lanes. **Apply at next bar** performs the change; **Undo** restores a previous applied plan. Part mute buttons apply the visible draft directly at the next bar.
3. **Remember this feel** stores your explicit taste settings in this browser; **Recall** uses them in a new draft. This is preference recall, not an online learned model or automatic observation of your taste.
4. **Save here** persists the current draft. Export/import JSON makes it portable and validates before application. Import leaves the active groove untouched. **Export MIDI** contains the current four-bar pattern. **Export selected clip** contains only the selected lane for manual MV-1 import. Copy it into `ROLAND/MV/MIDI` on the SD card, then use the device's IMPORT MIDI operation in the destination track/section (firmware 1.80+). Patch choice remains manual.

The local composer understands a small vocabulary: sparse/dense, dry/dubby, warm/bright, straight/shuffled and explicit BPM. Unfamiliar references are not semantically understood. External AI can author the same validated plan JSON; no runtime cloud model/provider was connected or billed. Seeded variations are reproducible.

## Play the MV-1

Open **Connections & recording → Find MIDI outputs** and explicitly select the output. Connection sends no automatic note, patch change or SysEx. Choose patches on the MV-1, check receive channels/Auto Channel, and stop its internal transport to avoid duplicated sequences. Defaults: channels 1–7 for KICK through INST2; mapping and note offsets are editable.

Switch destination to **MV-1 hardware · MIDI**. Inspect the command plan before playing. Notes send during playback. CC7 level, CC74 cutoff and CC91 reverb send only when **Include documented tone controls** is enabled. Official documentation establishes support, not a passed test on Hayden's unit. Patch selection, internal clip writing and deep SysEx transmission are blocked. Community packets compile with proper checksums for inspection only.

The inherited 4,852-row sound catalogue remains a reference, not a verified patch-address database. Source suggestions are selected manually on the hardware.

## Mix the hardware against its previous self

MV-1 MIX OUT L/R → one Vestax stereo LINE channel. A captured laptop loop needs a separate stereo output → another Vestax LINE channel. The MV-1's stereo analog output does not become seven separate physical outputs.

1. Allow audio access in Connections. Select the actual MV-1 loop input and laptop loop output. Direct input monitoring is off. Avoid feeding the laptop return back into its own capture input.
2. While the sequencer plays, **Capture 4 bars** records an exact frame count beginning on the next bar. **Loop** starts the captured audio at a bar boundary. Change live MV-1 parts and blend with the captured groove on your rotary mixer. Software audition and the loop share the chosen laptop output.
3. Clear a retained loop before changing tempo. Physical MIDI/audio latency, drift and alignment require actual hardware measurement; this version does not automatically compensate round-trip latency or provide independent cue buses.
4. **Save WAV** exports captured audio as 44.1 kHz stereo PCM16. Select the actual mixer recording input, **Record mixer input**, then stop to download. Recording includes rotary moves only when the Vestax output is physically routed to that input. Browser recording uses its supported MediaRecorder format, typically WebM/Opus, not a lossless master.

The mixer is the owner-confirmed Vestax PMC-250 with rotary controls. Interface outputs and physical routing remain unverified. Check existing equipment before buying anything. No TikTok account or live broadcast is configured.

## Checks and recovery

`npm test` runs core checks. `npm run build` typechecks/builds. `npm run test:browser` starts its dev server and runs browser acceptance. Test configuration accepts `FD_CHROMIUM_PATH`; otherwise it uses bundled Chromium. Synthetic oscillator audio and mocked MIDI ports are explicitly test fixtures, not hardware evidence.

Keep the performance tab visible: hiding it stops playback and loops to avoid timing bursts. Stop clears scheduled MIDI and releases tracked notes where supported. Mixer recording is independent; stop it explicitly to download a take. Unplug may require stopping the physical device manually. Exported change logs include MIDI sends labeled without device acknowledgement.

See docs/STATUS.md, docs/LIVE_CONTRACT.md, docs/RECOVERY_AUDIT.md and docs/HARDWARE_TEST_LOG.md.

## The groove conservatory

The visual direction is a New Orleans daiquiri factory inside a forest moon base: cream enamel housings, polished metal, citrus and coral controls, and a cypress observatory panorama. See docs/VISUAL_DIRECTION.md for the generated asset and integration details.
