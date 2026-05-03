import { Button } from '@/components/ui/button';
import { Mic, Loader2, AlertCircle } from 'lucide-react';
import type { STTEngineState } from '@/lib/stt/types';

type TranscribeButtonProps = {
  engineState: STTEngineState;
  hasVideo: boolean;
  onTranscribe: () => void;
};

export function TranscribeButton({
  engineState,
  hasVideo,
  onTranscribe,
}: TranscribeButtonProps) {
  const isReady = engineState === 'ready';
  const isTranscribing = engineState === 'transcribing';
  const isLoading = engineState === 'loading';
  const isIdle = engineState === 'idle';
  const isError = engineState === 'error';

  return (
    <div className="space-y-2">
      <Button
        onClick={onTranscribe}
        disabled={!isReady || !hasVideo || isTranscribing}
        className="w-full bg-gradient-primary shadow-glow hover:opacity-90"
      >
        {isTranscribing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            กำลังถอดเสียง...
          </>
        ) : isReady ? (
          <>
            <Mic className="h-4 w-4 mr-2" />
            ถอดเสียงเป็นข้อความ (STT)
          </>
        ) : isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            กำลังโหลดโมเดล...
          </>
        ) : isError ? (
          <>
            <AlertCircle className="h-4 w-4 mr-2" />
            เกิดข้อผิดพลาด — ลองใหม่
          </>
        ) : (
          <>
            <Mic className="h-4 w-4 mr-2" />
            ถอดเสียงเป็นข้อความ (STT)
          </>
        )}
      </Button>

      {isIdle && (
        <p className="text-xs text-muted-foreground italic">
          * โหลดโมเดล STT ก่อน แล้วกดปุ่มนี้เพื่อถอดเสียงจากวิดีโอ
        </p>
      )}
      {!hasVideo && isReady && (
        <p className="text-xs text-muted-foreground italic">
          * อัปโหลดวิดีโอก่อนถึงจะถอดเสียงได้
        </p>
      )}
    </div>
  );
}
