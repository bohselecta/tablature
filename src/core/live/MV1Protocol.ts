/** Community-derived MV-1 packets. Compilation only; no transmission API exists here. */
export interface CandidatePacket {
  label: string;
  status: "candidate";
  bytes: number[];
  source: string;
}
const SOURCE =
  "https://drolez.com/blog/music/sysex-codes-for-roland-verselab-mv1.php";
export function candidateTrackPacket(
  track: number,
  parameter: "mute" | "volume",
  value: number,
): CandidatePacket {
  if (!Number.isInteger(track) || track < 1 || track > 7)
    throw Error("MV-1 track must be 1–7.");
  if (
    !Number.isInteger(value) ||
    value < 0 ||
    value > (parameter === "mute" ? 1 : 127)
  )
    throw Error("Invalid candidate value.");
  const body = [
    0x10,
    0,
    0x07 + track,
    parameter === "mute" ? 0x0d : 0x31,
    value,
  ];
  const checksum = (128 - (body.reduce((a, b) => a + b, 0) % 128)) % 128;
  return {
    label: `Track ${track} ${parameter} (community map, not hardware verified)`,
    status: "candidate",
    bytes: [0xf0, 0x41, 0x10, 0, 0, 0, 0x6f, 0x12, ...body, checksum, 0xf7],
    source: SOURCE,
  };
}
