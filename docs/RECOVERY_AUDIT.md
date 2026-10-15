# Recovery audit — 2026-10-15

Canonical source: https://github.com/bohselecta/tablature, owner bohselecta, main at `1a001b65c48f507e08a40a2a45a9600f7fdf7626`. Connector discovery and clone agree. Initial tree was clean; remote had only main; base build passed. Repository is public despite package metadata describing it as private. The owner authorized a public pull request on 2026-10-15. No deployment or broadcast is configured.

Recovered design: a May 2026 design pack informed the product, capability, reference-engine, sound-shaping and starter contracts. The original private intake archive is retained separately and is not included in this public repository. It is mostly design material with a small tone recipe function, not a finished native app.

| Observed source | Consequence | Disposition |
|---|---|---|
| GenreEngine returns empty tracks/sections | Generate Song can succeed without music | Added real seven-lane composer in Live Canvas; old engine retained historically |
| sendPattern ignores notes and plays test kicks | Does not load promised clips | Placeholder send removed; explicit error; new scheduler performs actual notes and exports SMF |
| selectSound uses unverified sequential patch data | May alter clips or unrelated state | Automatic patch selection blocked; hardware source suggestions visible |
| 4,852 catalogue rows; 3,421 program numbers above 128; ten FXM names | Extraction is not a proven 7-bit patch map | Retained catalogue excluded from automatic writes |
| SysEx checksum placeholders and ambiguous track indexing | Packet creation is not verification | Preview-only compiler uses one-based track IDs and real checksum; known community example tested |
| Old refresh never requests MIDI; multiple managers; auto test notes | Confusing discovery and false confidence | Single new session, explicit permission/output, silent connect, unplug recovery |
| Save Project has no handler | No completed persistence journey | Versioned validated JSON save/import/export, separate explicit taste memory |
| AutoTune loads an absent worklet URL; vocal code exists | Not evidence of finished professional suite | Retained behind legacy route, not advertised as verified; independent tested loop worklet added |
| Electribe is a placeholder | Universal hardware support unsupported | No additional hardware claims |
| README includes unsupported awards/testimonials/world-first/browser/performance claims | Documentation cannot prove acceptance | Original README dated in archive; current README grounded in actual implementation |

The product opportunity is coupling preference, musical arrangement and physical response: keep a bassline, reinterpret percussion, inspect tone changes, then perform a transition at a musical boundary. Capturing the previous groove supplies a second source from one hardware engine. This is a product inference, not proof of exclusive novelty.

Adjacent primary sources: Roland's Zenbeats editor already integrates with MV-1; Ableton documents external notes/CC/sync; Wotja describes live generative MIDI; Drolez documents community MV-1 SysEx. Do not reuse world-first claims.

Current implementation: explicit rule composer, editable taste memory, validated plan import and real browser audio/MIDI plumbing. Not implemented or proven: arbitrary semantic reference understanding, runtime cloud AI, device-state readback, automatic patch discovery, deep ZEN-Core editing, physical routing/latency compensation. Any paid provider requires separate cost authorization.

Sources inspected:

- https://static.roland.com/assets/media/pdf/MV-1_MIDIImpleChart_eng01_W.pdf
- https://static.roland.com/assets/media/pdf/MV-1_Update_eng01_W.pdf
- https://support.roland.com/hc/en-us/articles/360057110072-VERSELAB-MV-1-Using-the-VERSELAB-Editor-in-Zenbeats
- https://drolez.com/blog/music/sysex-codes-for-roland-verselab-mv1.php (author's community research, updated 2025-09-06)
- https://help.ableton.com/hc/en-us/articles/209774265-Using-hardware-synthesizers-with-Live
- https://wotja.com/app/
- https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/process
- https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/setSinkId

The official MIDI chart predates later firmware and community observations. Distinguish documented support, compiled candidate packets, software tests and actual local device confirmation.
