# Techno Mixing Station: dedicated appliance plan

Locked by the owner on 2026-10-15. This is the target for the next coding increment, not a claim of implemented native behavior. Canonical project: bohselecta/tablature. Preserve the current instrument, saved plans, legacy studio and approved groove-conservatory identity.

## Machine and operating system

Dedicate the 2020 Intel MacBook Pro with 8 GB RAM to the Roland VERSELAB MV-1 and Vestax PMC-250 rotary mixer. Keep macOS for the initial implementation. Exact Mac model, installed macOS, available storage and interface are not yet inventoried. Do not upgrade, erase, repartition or install a different OS automatically. Match any required Roland/interface drivers to that actual OS. Linux boot capability on this Intel Mac is an option to test, not a proven Linux audio configuration; T2, USB, power and audio behavior require model-specific checks.

Linux is a fallback if measured routing, recovery or timing requirements cannot be met on macOS. Do not create a parallel Linux implementation during the first vertical slice. No future A/V, streaming, daily computing or local-model workload is included in sizing or acceptance.

## Performance path

1. Load a validated locally stored set/plan or compose an original minimal groove. External AI can author portable plan JSON ahead of a session; no paid runtime model is required.
2. Inspect and explicitly arm the intended MIDI endpoint. The MV-1 is the sound engine; choose hardware patches manually until their addressing is verified.
3. Perform groove A, capture four bars of its actual audio, then play that retained source to Vestax PGM2.
4. Change the live MV-1 groove B and blend PGM1/PGM2 physically. Stop the retained source independently; recapture only after that source is stopped. Do not discard a retained buffer merely to stop it.
5. Record the Vestax return to a recoverable lossless stereo file; save the musical plan, routing profile, calibration and command receipts separately.

## Physical audio design

The two mix sources are live MV-1 audio and a previous captured loop. A stereo split duplicates one source; it does not create independently changing music. The interface is not selected, so the following is the reference wiring, conditional on internal routing support:

| Source | Destination | Role |
|---|---|---|
| MV-1 MIX OUT L/R | Interface analog inputs 1/2 | Capture live hardware |
| Interface direct route from inputs 1/2 | Interface analog outputs 1/2 → Vestax PGM1 LINE | Live source, independent of browser timing |
| Native loop playback | Interface analog outputs 3/4 → Vestax PGM2 LINE | Retained source |
| Vestax LINE OUT L/R | Interface analog inputs 3/4 | Record physical rotary mix |
| Vestax PA OUT / PHONES | Speakers / headphones | Listening and mixer cue |

This reference requires four simultaneous analog line inputs, four independently routable analog line outputs and suitable interface direct-routing support. Marketing counts including digital I/O are insufficient. This is not a universal minimum: direct MV-1-to-Vestax wiring plus another verified capture path may reduce interface output requirements. Inventory owned equipment before choosing or buying anything. Do not assume the MV-1 USB mix excludes computer returns; prove any USB alternative with isolation tests.

Never route mixer-return inputs 3/4 back into performance outputs. Pair selection must be explicit; browser device selection alone is insufficient. Prefer one hardware audio clock. Calibrate measured MIDI-to-audio response and capture/playback alignment; do not assume an integer-length buffer eliminates latency or drift. Vestax LINE inputs are RCA; LINE OUT is unbalanced 1/4-inch L/R; final cable list follows the interface inventory.

## Controller architecture

Keep the React operator panel and pure musical-plan model. Add a native local engine, initially Rust with macOS CoreAudio/CoreMIDI adapters. Select and pin binding libraries during implementation after proving macOS x86_64 support; do not introduce a framework rewrite or a paid dependency. Separate platform adapters so Linux remains possible later.

The native process owns timestamps, MIDI lifecycle, audio device/channel pairs, capture buffers, loop voices, recording and recovery. Rendering, composition, filesystem writes and model calls never run inside an audio callback. Use bounded queues, preallocated buffers and a worker for disk recording. Report overflow/underrun explicitly. Browser timers must not own native performance timing.

Serve the existing built operator UI locally. Use a versioned, validated command/event protocol over loopback with an ephemeral session token, exact origin checks and bounded message sizes. Bind only to loopback; no arbitrary filesystem, shell or raw MIDI/SysEx endpoint. Ship the built UI with the engine so performance needs neither npm nor internet. A disconnected/reloaded UI does not become a second transport master.

Use requested → validated → queued → sent → confirmed/unsupported receipts. A successful API send is sent-without-ack, not device confirmation. Record audio is evidence of sound, not proof of an exact patch value. No unsupported MV-1 readback, patch or project write claims.

## Appliance lifecycle

States: starting, needs-configuration, ready-disarmed, armed-idle, playing, capturing, loop-retained/playing, recording, degraded and fault. Recording is independent of transport state. Define each command's valid states and recoveries in the protocol before UI integration.

Launch at login only after explicit installation/setup. Restore routing profiles by persistent identity and channel pair; refuse ambiguous/missing endpoints rather than choosing a default speaker or microphone. Startup and process restart are disarmed. An output disconnect or engine fault stops scheduled MIDI, attempts note release and stops affected loop playback; never resume sound automatically after reconnection. Keep an operator panic control available. Recording finalization/recovery must remain possible independently. Releasing software notes cannot guarantee that disconnected hardware stopped; show the physical recovery instruction.

Save versioned configuration and session checkpoints atomically. Retain last-known-good app/config versions. Do not disable OS security updates globally; apply updates outside performance sessions and rehearse the known configuration afterward. Configure power/lid behavior only during device setup with the owner present.

## Acceptance and boundaries

The next release must satisfy CODING_PASS.md. A Linux container build cannot prove macOS native integration. The machine, MV-1 and interface are unavailable to this coding runtime, so physical receipts remain pending until executed on the station.

No paid APIs, purchases, cloud service requirement, automatic OS replacement, deep SysEx writes, streaming or general DAW replacement are authorized by this plan. The app should be useful offline with local composition and previously authored sets.

Reference evidence already inspected: Roland macOS compatibility https://www.roland.com/us/support/support_news/25090811m1/ and the PMC-250 owner manual https://www.manualsdir.com/manuals/218915/vestax-pmc-250.html?page=7 . Compatibility must be rechecked against the actual installed OS and selected interface during setup.
