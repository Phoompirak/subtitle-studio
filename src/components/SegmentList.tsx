import { Segment } from '@/lib/subtitles';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';

export function SegmentList({
  segments,
  currentTime,
  onChange,
  onSeek,
}: {
  segments: Segment[];
  currentTime: number;
  onChange: (segs: Segment[]) => void;
  onSeek: (t: number) => void;
}) {
  const update = (id: string, patch: Partial<Segment>) =>
    onChange(segments.map(s => (s.id === id ? { ...s, ...patch } : s)));

  const remove = (id: string) => onChange(segments.filter(s => s.id !== id));

  const add = () => {
    const last = segments[segments.length - 1];
    const start = last ? last.end : 0;
    onChange([...segments, { id: crypto.randomUUID(), text: 'New subtitle', start, end: start + 2 }]);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Transcript</h3>
        <Button size="sm" variant="ghost" onClick={add}><Plus className="h-4 w-4" /></Button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {segments.length === 0 && (
          <p className="text-sm text-muted-foreground italic">ยังไม่มีซับไตเติ้ล – ใส่ transcript ทางขวาแล้วกด Generate</p>
        )}
        {segments.map((seg, i) => {
          const active = currentTime >= seg.start && currentTime < seg.end;
          return (
            <div
              key={seg.id}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                active ? 'border-primary bg-primary/10 shadow-glow' : 'border-border bg-card hover:border-primary/50'
              }`}
              onClick={() => onSeek(seg.start)}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-muted-foreground font-mono w-6">#{i + 1}</span>
                <Input
                  type="number"
                  step="0.1"
                  value={seg.start}
                  onChange={e => update(seg.id, { start: +e.target.value })}
                  onClick={e => e.stopPropagation()}
                  className="h-7 text-xs w-20"
                />
                <span className="text-muted-foreground text-xs">→</span>
                <Input
                  type="number"
                  step="0.1"
                  value={seg.end}
                  onChange={e => update(seg.id, { end: +e.target.value })}
                  onClick={e => e.stopPropagation()}
                  className="h-7 text-xs w-20"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 ml-auto text-destructive hover:text-destructive"
                  onClick={e => { e.stopPropagation(); remove(seg.id); }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Input
                value={seg.text}
                onChange={e => update(seg.id, { text: e.target.value })}
                onClick={e => e.stopPropagation()}
                className="h-8 text-sm"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
