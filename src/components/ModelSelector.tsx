import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Download, Trash2, Check, Loader2, Cpu, Monitor, Smartphone, Zap } from 'lucide-react';
import { MODEL_REGISTRY, getModelsForPlatform, getRecommendedModel } from '@/lib/stt/model-registry';
import { isWebGPUAvailable } from '@/lib/stt/platform';
import type { ModelInfo, STTEngineState } from '@/lib/stt/types';

type ModelSelectorProps = {
  platform: 'web' | 'desktop' | 'mobile';
  loadedModelId: string | null;
  engineState: STTEngineState;
  loadProgress: number;
  onSelectModel: (modelId: string) => void;
  onUnloadModel: () => void;
};

const SIZE_LABELS: Record<string, string> = {
  tiny: 'Tiny',
  base: 'Base',
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
};

const QUALITY_STARS = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

export function ModelSelector({
  platform,
  loadedModelId,
  engineState,
  loadProgress,
  onSelectModel,
  onUnloadModel,
}: ModelSelectorProps) {
  const models = getModelsForPlatform(platform);
  const recommended = getRecommendedModel(platform);
  const hasWebGPU = isWebGPUAvailable();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">เลือกโมเดล STT</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {hasWebGPU ? (
            <><Zap className="h-3 w-3 text-yellow-500" /> WebGPU</>
          ) : (
            <><Cpu className="h-3 w-3" /> WASM</>
          )}
        </div>
      </div>

      {engineState === 'loading' && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            กำลังโหลดโมเดล... {Math.round(loadProgress * 100)}%
          </div>
          <Progress value={loadProgress * 100} className="h-2" />
        </div>
      )}

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {models.map(model => {
          const isLoaded = loadedModelId === model.id;
          const isLoading = engineState === 'loading' && loadedModelId === model.id;
          const isRecommended = model.id === recommended.id;

          return (
            <Card
              key={model.id}
              className={`p-3 cursor-pointer transition-all ${
                isLoaded ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-accent/50'
              }`}
              onClick={() => !isLoaded && !isLoading && onSelectModel(model.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{model.name}</span>
                    {isRecommended && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        แนะนำ
                      </Badge>
                    )}
                    {isLoaded && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0">
                        <Check className="h-2.5 w-2.5 mr-0.5" /> พร้อมใช้
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {model.description}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                    <span>{model.sizeMB >= 1000 ? `${(model.sizeMB / 1000).toFixed(1)} GB` : `${model.sizeMB} MB`}</span>
                    <span>{QUALITY_STARS(model.thaiQuality)} ไทย</span>
                    <span className="flex items-center gap-0.5">
                      {model.recommendedFor.map(p => (
                        p === 'mobile' ? <Smartphone key={p} className="h-2.5 w-2.5" /> :
                        p === 'desktop' ? <Monitor key={p} className="h-2.5 w-2.5" /> :
                        <Cpu key={p} className="h-2.5 w-2.5" />
                      ))}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  {isLoaded ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive"
                      onClick={e => { e.stopPropagation(); onUnloadModel(); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant={isRecommended ? 'default' : 'outline'}
                      className="h-7 px-2 text-xs"
                      disabled={isLoading || engineState === 'loading'}
                      onClick={e => { e.stopPropagation(); onSelectModel(model.id); }}
                    >
                      {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {!hasWebGPU && (
        <p className="text-[10px] text-muted-foreground italic">
          * เบราว์เซอร์นี้ไม่รองรับ WebGPU — จะใช้ WASM (ช้ากว่า) แนะนำใช้ Chrome
        </p>
      )}
    </div>
  );
}
