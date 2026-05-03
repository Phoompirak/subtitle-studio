import { Segment } from '@/lib/subtitles';

export type SubtitleStyle = {
  fontFamily: string;
  fontSize: number;
  color: string;
  bgColor: string;
  bgOpacity: number;
  shadow: boolean;
  uppercase: boolean;
  weight: number;
  animation: 'none' | 'fade' | 'pop' | 'slide' | 'typewriter' | 'karaoke';
};

export const defaultStyle: SubtitleStyle = {
  fontFamily: 'Inter',
  fontSize: 38,
  color: '#ffffff',
  bgColor: '#000000',
  bgOpacity: 0.5,
  shadow: true,
  uppercase: false,
  weight: 800,
  animation: 'pop',
};

export function SubtitleOverlay({
  segment,
  currentTime,
  style,
}: {
  segment: Segment | null;
  currentTime: number;
  style: SubtitleStyle;
}) {
  if (!segment) return null;

  const text = style.uppercase ? segment.text.toUpperCase() : segment.text;
  const animClass =
    style.animation === 'fade' ? 'anim-fade'
    : style.animation === 'pop' ? 'anim-pop'
    : style.animation === 'slide' ? 'anim-slide'
    : style.animation === 'typewriter' ? 'anim-typewriter'
    : '';

  const baseStyle: React.CSSProperties = {
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.weight,
    color: style.color,
    background: `rgba(0,0,0,${style.bgOpacity})`,
    padding: '0.4em 0.8em',
    borderRadius: 8,
    textShadow: style.shadow ? '0 2px 8px rgba(0,0,0,0.8)' : 'none',
    letterSpacing: '0.02em',
    lineHeight: 1.2,
    maxWidth: '85%',
    textAlign: 'center',
    backgroundColor: style.bgOpacity > 0 ? undefined : 'transparent',
  };

  if (style.animation === 'karaoke') {
    const words = segment.text.split(/\s+/);
    const dur = segment.end - segment.start;
    const elapsed = currentTime - segment.start;
    const activeIdx = Math.min(words.length - 1, Math.floor((elapsed / dur) * words.length));
    return (
      <div key={segment.id} className="absolute left-1/2 bottom-[12%] -translate-x-1/2 pointer-events-none anim-fade" style={baseStyle}>
        {words.map((w, i) => (
          <span key={i} style={{ color: i <= activeIdx ? style.color : 'rgba(255,255,255,0.45)', marginRight: '0.3em', transition: 'color .2s' }}>
            {style.uppercase ? w.toUpperCase() : w}
          </span>
        ))}
      </div>
    );
  }

  if (style.animation === 'typewriter') {
    return (
      <div key={segment.id} className={`absolute left-1/2 bottom-[12%] -translate-x-1/2 pointer-events-none ${animClass}`} style={baseStyle}>
        {text.split('').map((c, i) => (
          <span key={i} style={{ animationDelay: `${i * 30}ms` }}>{c === ' ' ? '\u00A0' : c}</span>
        ))}
      </div>
    );
  }

  return (
    <div
      key={segment.id}
      className={`absolute left-1/2 bottom-[12%] -translate-x-1/2 pointer-events-none ${animClass}`}
      style={baseStyle}
    >
      {text}
    </div>
  );
}
