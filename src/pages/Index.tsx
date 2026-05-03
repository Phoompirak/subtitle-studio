import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Upload, Download, Sparkles, Play, Pause, Wand2, Loader2 } from 'lucide-react';
import { Segment, buildSegments, toSrt } from '@/lib/subtitles';
import { detectVoicedRegions, alignSegmentsToRegions } from '@/lib/audioAnalysis';
import { SubtitleOverlay, defaultStyle, SubtitleStyle } from '@/components/SubtitleOverlay';
import { SegmentList } from '@/components/SegmentList';
import { StylePanel } from '@/components/StylePanel';
import { WaveformTimeline } from '@/components/WaveformTimeline';
import { toast } from 'sonner';

const RATIOS = {
  '9:16': 'aspect-[9/16] max-h-[70vh]',
  '1:1': 'aspect-square max-h-[70vh]',
  '16:9': 'aspect-video w-full',
  '4:5': 'aspect-[4/5] max-h-[70vh]',
} as const;

const Index = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [wordsPer, setWordsPer] = useState(2);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [style, setStyle] = useState<SubtitleStyle>(defaultStyle);
  const [ratio, setRatio] = useState<keyof typeof RATIOS>('9:16');
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    const onTime = () => setCurrentTime(v.currentTime);
    const onMeta = () => setDuration(v.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onMeta);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onMeta);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
    };
  }, [videoUrl]);

  const handleUpload = (file: File) => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(URL.createObjectURL(file));
    setSegments([]);
    toast.success('โหลดวิดีโอแล้ว');
  };

  const handleGenerate = () => {
    if (!transcript.trim()) return toast.error('ใส่ transcript ก่อน');
    if (!duration) return toast.error('รอให้วิดีโอโหลดก่อน');
    setSegments(buildSegments(transcript, duration, wordsPer));
    toast.success('สร้างซับไตเติ้ลแล้ว');
  };

  const activeSegment = useMemo(
    () => segments.find(s => currentTime >= s.start && currentTime < s.end) ?? null,
    [segments, currentTime]
  );

  const togglePlay = () => {
    const v = videoRef.current; if (!v) return;
    if (v.paused) v.play(); else v.pause();
  };

  const seek = (t: number) => { if (videoRef.current) videoRef.current.currentTime = t; };

  const exportSrt = () => {
    if (!segments.length) return toast.error('ไม่มีซับไตเติ้ล');
    const blob = new Blob([toSrt(segments)], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'subtitles.srt'; a.click();
    URL.revokeObjectURL(url);
    toast.success('ดาวน์โหลด .srt แล้ว');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary shadow-glow flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold text-gradient">SubCraft</h1>
          </div>
          <Button onClick={exportSrt} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" /> Export .srt
          </Button>
        </div>
      </header>

      <main className="container py-6 grid grid-cols-1 lg:grid-cols-[340px_1fr_320px] gap-4 h-[calc(100vh-3.5rem)]">
        {/* LEFT: transcript list */}
        <Card className="p-4 overflow-hidden flex flex-col bg-gradient-surface">
          <SegmentList segments={segments} currentTime={currentTime} onChange={setSegments} onSeek={seek} />
        </Card>

        {/* CENTER: video preview */}
        <div className="flex flex-col gap-4 min-h-0">
          <Card className="flex-1 flex items-center justify-center bg-black/60 overflow-hidden p-4">
            {!videoUrl ? (
              <label className="cursor-pointer flex flex-col items-center gap-3 p-12 border-2 border-dashed border-border rounded-xl hover:border-primary transition-colors">
                <div className="h-16 w-16 rounded-full bg-gradient-primary shadow-glow flex items-center justify-center">
                  <Upload className="h-7 w-7 text-primary-foreground" />
                </div>
                <p className="text-lg font-semibold">อัปโหลดวิดีโอ</p>
                <p className="text-sm text-muted-foreground">.mp4, .webm, .mov</p>
                <input type="file" accept="video/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} />
              </label>
            ) : (
              <div className={`relative ${RATIOS[ratio]} bg-black rounded-lg overflow-hidden shadow-elegant`}>
                <video ref={videoRef} src={videoUrl} className="w-full h-full object-contain" onClick={togglePlay} />
                <SubtitleOverlay segment={activeSegment} currentTime={currentTime} style={style} />
              </div>
            )}
          </Card>

          {videoUrl && (
            <Card className="p-3 flex items-center gap-3">
              <Button size="icon" variant="ghost" onClick={togglePlay}>
                {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              <span className="text-xs font-mono text-muted-foreground tabular-nums">
                {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
              </span>
              <input
                type="range" min={0} max={duration || 0} step={0.01} value={currentTime}
                onChange={e => seek(+e.target.value)}
                className="flex-1 accent-primary"
              />
              <div className="flex gap-1">
                {(Object.keys(RATIOS) as (keyof typeof RATIOS)[]).map(r => (
                  <Button key={r} size="sm" variant={ratio === r ? 'default' : 'ghost'} onClick={() => setRatio(r)} className="h-7 px-2 text-xs">
                    {r}
                  </Button>
                ))}
              </div>
            </Card>
          )}

          {videoUrl && (
            <Card className="p-3">
              <WaveformTimeline
                videoUrl={videoUrl}
                segments={segments}
                currentTime={currentTime}
                onChange={setSegments}
                onSeek={seek}
              />
            </Card>
          )}
        </div>

        {/* RIGHT: settings */}
        <Card className="p-4 overflow-y-auto bg-gradient-surface">
          <Tabs defaultValue="setup">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="setup">Setup</TabsTrigger>
              <TabsTrigger value="style">Style</TabsTrigger>
            </TabsList>

            <TabsContent value="setup" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-xs">Transcript</Label>
                <Textarea
                  rows={8}
                  placeholder="วาง transcript ทั้งหมดที่นี่..."
                  value={transcript}
                  onChange={e => setTranscript(e.target.value)}
                  className="resize-none text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Words per subtitle</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <Button key={n} size="sm" variant={wordsPer === n ? 'default' : 'outline'} onClick={() => setWordsPer(n)} className="flex-1 h-8">
                      {n}
                    </Button>
                  ))}
                </div>
              </div>
              <Button onClick={handleGenerate} className="w-full bg-gradient-primary shadow-glow hover:opacity-90">
                <Sparkles className="h-4 w-4 mr-2" /> Generate Subtitles
              </Button>
              <p className="text-xs text-muted-foreground italic">
                * Auto Speech-to-Text (Whisper) ต้องเปิด Lovable Cloud ก่อน — ดู requirement.txt
              </p>
            </TabsContent>

            <TabsContent value="style" className="mt-4">
              <StylePanel style={style} onChange={setStyle} />
            </TabsContent>
          </Tabs>
        </Card>
      </main>
    </div>
  );
};

export default Index;
