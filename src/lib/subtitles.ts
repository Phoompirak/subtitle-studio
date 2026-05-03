export type Segment = {
  id: string;
  text: string;
  start: number; // seconds
  end: number;
};

export function buildSegments(transcript: string, totalDuration: number, wordsPer: number): Segment[] {
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  if (!words.length || totalDuration <= 0) return [];
  const groups: string[][] = [];
  for (let i = 0; i < words.length; i += wordsPer) {
    groups.push(words.slice(i, i + wordsPer));
  }
  const perGroup = totalDuration / groups.length;
  return groups.map((g, i) => ({
    id: crypto.randomUUID(),
    text: g.join(' '),
    start: +(i * perGroup).toFixed(2),
    end: +((i + 1) * perGroup).toFixed(2),
  }));
}

export function toSrt(segments: Segment[]): string {
  const fmt = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    const ms = Math.floor((s % 1) * 1000).toString().padStart(3, '0');
    return `${h}:${m}:${sec},${ms}`;
  };
  return segments
    .map((seg, i) => `${i + 1}\n${fmt(seg.start)} --> ${fmt(seg.end)}\n${seg.text}\n`)
    .join('\n');
}
