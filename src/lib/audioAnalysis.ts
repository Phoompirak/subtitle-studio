// Detect voiced (non-silent) regions from a media URL using Web Audio API.
// Returns array of {start, end} in seconds covering speech-active areas.

export type VoicedRegion = { start: number; end: number };

export async function detectVoicedRegions(
  url: string,
  opts: { silenceThreshold?: number; minSilenceMs?: number; minVoiceMs?: number; padMs?: number } = {}
): Promise<{ regions: VoicedRegion[]; duration: number }> {
  const {
    silenceThreshold = 0.015, // RMS threshold (0-1)
    minSilenceMs = 250,        // gap below threshold required to split
    minVoiceMs = 120,          // minimum voiced region length
    padMs = 80,                // padding added to each region
  } = opts;

  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtx();
  const audio = await ctx.decodeAudioData(buf.slice(0));
  const duration = audio.duration;

  // Mix to mono
  const len = audio.length;
  const ch0 = audio.getChannelData(0);
  const mono = new Float32Array(len);
  if (audio.numberOfChannels > 1) {
    const ch1 = audio.getChannelData(1);
    for (let i = 0; i < len; i++) mono[i] = (ch0[i] + ch1[i]) * 0.5;
  } else {
    mono.set(ch0);
  }

  // Window-based RMS (20ms windows)
  const sr = audio.sampleRate;
  const winSize = Math.floor(sr * 0.02);
  const numWin = Math.floor(len / winSize);
  const rms = new Float32Array(numWin);
  for (let w = 0; w < numWin; w++) {
    let sum = 0;
    const base = w * winSize;
    for (let i = 0; i < winSize; i++) {
      const v = mono[base + i];
      sum += v * v;
    }
    rms[w] = Math.sqrt(sum / winSize);
  }

  const winMs = 20;
  const minSilWin = Math.ceil(minSilenceMs / winMs);
  const minVoiceWin = Math.ceil(minVoiceMs / winMs);

  // Build voiced regions
  const regions: VoicedRegion[] = [];
  let i = 0;
  while (i < numWin) {
    if (rms[i] >= silenceThreshold) {
      let j = i;
      let silentRun = 0;
      while (j < numWin) {
        if (rms[j] < silenceThreshold) {
          silentRun++;
          if (silentRun >= minSilWin) break;
        } else silentRun = 0;
        j++;
      }
      const endWin = j - silentRun;
      if (endWin - i >= minVoiceWin) {
        const start = Math.max(0, (i * winMs) / 1000 - padMs / 1000);
        const end = Math.min(duration, (endWin * winMs) / 1000 + padMs / 1000);
        if (regions.length && start <= regions[regions.length - 1].end) {
          regions[regions.length - 1].end = Math.max(regions[regions.length - 1].end, end);
        } else {
          regions.push({ start: +start.toFixed(2), end: +end.toFixed(2) });
        }
      }
      i = j + 1;
    } else i++;
  }

  ctx.close();
  return { regions, duration };
}

// Distribute subtitle segments across detected voiced regions, weighted by word count.
import { Segment } from './subtitles';

export function alignSegmentsToRegions(segments: Segment[], regions: VoicedRegion[]): Segment[] {
  if (!segments.length || !regions.length) return segments;

  // Total voiced time
  const totalVoiced = regions.reduce((s, r) => s + (r.end - r.start), 0);
  // Total words
  const wordCounts = segments.map(s => Math.max(1, s.text.trim().split(/\s+/).length));
  const totalWords = wordCounts.reduce((a, b) => a + b, 0);

  const out: Segment[] = [];
  let regionIdx = 0;
  let regionUsed = 0; // seconds consumed in current region

  for (let i = 0; i < segments.length; i++) {
    let need = (wordCounts[i] / totalWords) * totalVoiced;
    let start = -1;
    let end = -1;

    while (need > 0 && regionIdx < regions.length) {
      const r = regions[regionIdx];
      const available = (r.end - r.start) - regionUsed;
      if (start < 0) start = r.start + regionUsed;
      if (available >= need) {
        regionUsed += need;
        end = r.start + regionUsed;
        need = 0;
      } else {
        end = r.end;
        need -= available;
        regionIdx++;
        regionUsed = 0;
        // If text needs more time but next region exists, jump (creates a gap)
        if (need > 0 && regionIdx < regions.length) {
          out.push({ ...segments[i], start: +start.toFixed(2), end: +end.toFixed(2) });
          // Restart this segment in the new region for the leftover — but simpler: stop here
          start = -1;
          break;
        }
      }
    }

    if (start >= 0 && end > start) {
      out.push({ ...segments[i], start: +start.toFixed(2), end: +end.toFixed(2) });
    } else if (out.length) {
      // fallback: append after previous
      const prev = out[out.length - 1];
      out.push({ ...segments[i], start: prev.end, end: prev.end + 1 });
    } else {
      out.push(segments[i]);
    }
  }

  return out;
}
