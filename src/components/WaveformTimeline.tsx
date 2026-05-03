import { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin, { Region } from 'wavesurfer.js/dist/plugins/regions.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.js';
import { Segment } from '@/lib/subtitles';

export function WaveformTimeline({
  videoUrl,
  segments,
  currentTime,
  onChange,
  onSeek,
}: {
  videoUrl: string;
  segments: Segment[];
  currentTime: number;
  onChange: (segs: Segment[]) => void;
  onSeek: (t: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<RegionsPlugin | null>(null);
  const segmentsRef = useRef(segments);
  const onChangeRef = useRef(onChange);
  segmentsRef.current = segments;
  onChangeRef.current = onChange;

  // init wavesurfer when videoUrl changes
  useEffect(() => {
    if (!containerRef.current || !videoUrl) return;
    const regions = RegionsPlugin.create();
    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'hsl(240 5% 35%)',
      progressColor: 'hsl(270 95% 65%)',
      cursorColor: 'hsl(190 95% 55%)',
      cursorWidth: 2,
      height: 70,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      normalize: true,
      interact: true,
      plugins: [regions, TimelinePlugin.create({ height: 16, insertPosition: 'beforebegin' })],
    });
    ws.load(videoUrl);
    ws.on('interaction', (t) => onSeek(t));

    regions.on('region-updated', (region: Region) => {
      const id = region.id;
      const updated = segmentsRef.current.map(s =>
        s.id === id ? { ...s, start: +region.start.toFixed(2), end: +region.end.toFixed(2) } : s
      );
      onChangeRef.current(updated);
    });
    regions.on('region-clicked', (region: Region, e: MouseEvent) => {
      e.stopPropagation();
      onSeek(region.start);
    });

    wsRef.current = ws;
    regionsRef.current = regions;

    return () => {
      ws.destroy();
      wsRef.current = null;
      regionsRef.current = null;
    };
  }, [videoUrl, onSeek]);

  // sync regions whenever segments change
  useEffect(() => {
    const regions = regionsRef.current;
    if (!regions) return;
    regions.clearRegions();
    segments.forEach((s, i) => {
      regions.addRegion({
        id: s.id,
        start: s.start,
        end: s.end,
        content: `${i + 1}`,
        color: i % 2 === 0 ? 'hsla(270, 95%, 65%, 0.25)' : 'hsla(190, 95%, 55%, 0.25)',
        drag: true,
        resize: true,
      });
    });
  }, [segments]);

  // sync playhead
  useEffect(() => {
    const ws = wsRef.current;
    if (!ws) return;
    const dur = ws.getDuration();
    if (!dur) return;
    if (Math.abs(ws.getCurrentTime() - currentTime) > 0.15) {
      ws.setTime(Math.min(currentTime, dur));
    }
  }, [currentTime]);

  return (
    <div className="w-full">
      <div ref={containerRef} className="w-full rounded-md bg-card/40 px-2 py-1" />
      <p className="text-[10px] text-muted-foreground mt-1">ลาก/ปรับขอบ region เพื่อแก้ start-end ของแต่ละ segment</p>
    </div>
  );
}
