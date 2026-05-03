import { SubtitleStyle } from './SubtitleOverlay';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const fonts = ['Inter', 'Bebas Neue', 'Anton', 'Oswald', 'Montserrat', 'Poppins', 'Roboto Mono', 'Permanent Marker'];
const animations: SubtitleStyle['animation'][] = ['none', 'fade', 'pop', 'slide', 'typewriter', 'karaoke'];

export function StylePanel({ style, onChange }: { style: SubtitleStyle; onChange: (s: SubtitleStyle) => void }) {
  const set = <K extends keyof SubtitleStyle>(k: K, v: SubtitleStyle[K]) => onChange({ ...style, [k]: v });

  return (
    <div className="space-y-5">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Style</h3>

      <div className="space-y-2">
        <Label className="text-xs">Font</Label>
        <Select value={style.fontFamily} onValueChange={v => set('fontFamily', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {fonts.map(f => <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Animation</Label>
        <Select value={style.animation} onValueChange={v => set('animation', v as SubtitleStyle['animation'])}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {animations.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Size · {style.fontSize}px</Label>
        <Slider min={16} max={96} step={1} value={[style.fontSize]} onValueChange={v => set('fontSize', v[0])} />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Weight · {style.weight}</Label>
        <Slider min={300} max={900} step={100} value={[style.weight]} onValueChange={v => set('weight', v[0])} />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">BG Opacity · {Math.round(style.bgOpacity * 100)}%</Label>
        <Slider min={0} max={1} step={0.05} value={[style.bgOpacity]} onValueChange={v => set('bgOpacity', v[0])} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs">Text</Label>
          <input type="color" value={style.color} onChange={e => set('color', e.target.value)} className="h-9 w-full rounded-md bg-secondary border border-border cursor-pointer" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">BG</Label>
          <input type="color" value={style.bgColor} onChange={e => set('bgColor', e.target.value)} className="h-9 w-full rounded-md bg-secondary border border-border cursor-pointer" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-xs">UPPERCASE</Label>
        <Switch checked={style.uppercase} onCheckedChange={v => set('uppercase', v)} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Drop shadow</Label>
        <Switch checked={style.shadow} onCheckedChange={v => set('shadow', v)} />
      </div>
    </div>
  );
}
