import type { STTEngine, STTEngineState, TranscribeOpts, TranscribeResult, ProgressCallback } from './types';
import type { Pipeline } from '@huggingface/transformers';

type ProgressStatus = {
  status: string;
  progress?: number;
};

export class BrowserSTTEngine implements STTEngine {
  private state: STTEngineState = 'idle';
  private loadedModelId: string | null = null;
  private transcriber: Pipeline | null = null;
  private device: 'webgpu' | 'wasm' = 'wasm';

  async loadModel(modelId: string, opts?: { device?: 'webgpu' | 'wasm'; onProgress?: ProgressCallback }): Promise<void> {
    if (this.transcriber && this.loadedModelId === modelId) return;

    if (this.transcriber) {
      await this.unloadModel();
    }

    this.state = 'loading';
    this.device = opts?.device ?? (await this.detectBestDevice());

    try {
      const { pipeline, env } = await import('@huggingface/transformers');

      env.allowLocalModels = true;
      env.useBrowserCache = true;

      const progressCb = opts?.onProgress;

      this.transcriber = (await pipeline('automatic-speech-recognition', modelId, {
        device: this.device,
        dtype: {
          encoder_model: 'fp32',
          decoder_model_merged: 'q4',
        },
        progress_callback: progressCb
          ? (p: ProgressStatus) => {
              if (p.status === 'progress' && p.progress !== undefined) {
                progressCb(p.progress / 100);
              }
            }
          : undefined,
      })) as Pipeline;

      this.loadedModelId = modelId;
      this.state = 'ready';
    } catch (err) {
      this.state = 'error';
      console.error('Failed to load STT model:', err);

      if (this.device === 'webgpu') {
        console.warn('WebGPU failed, falling back to WASM...');
        return this.loadModel(modelId, { device: 'wasm', onProgress: opts?.onProgress });
      }

      throw err;
    }
  }

  async transcribe(audio: Blob | Float32Array, opts?: TranscribeOpts): Promise<TranscribeResult> {
    if (!this.transcriber) throw new Error('Model not loaded');

    this.state = 'transcribing';
    try {
      const audioData: Float32Array = audio instanceof Blob ? await this.blobToFloat32(audio) : audio;

      const result = (await this.transcriber(audioData, {
        language: opts?.language ?? 'th',
        task: 'transcribe',
        return_timestamps: opts?.wordTimestamps ? 'word' : true,
        chunk_length_s: opts?.chunkLengthSecs ?? 30,
      })) as { text: string; chunks?: { text: string; timestamp: [number, number] }[] };

      const chunks = result.chunks?.map((c) => ({
        word: c.text.trim(),
        start: c.timestamp[0] ?? 0,
        end: c.timestamp[1] ?? (c.timestamp[0] ?? 0) + 1,
      }));

      this.state = 'ready';

      return {
        text: result.text ?? '',
        chunks,
        language: opts?.language ?? 'th',
      };
    } catch (err) {
      this.state = 'error';
      throw err;
    }
  }

  async unloadModel(): Promise<void> {
    if (this.transcriber) {
      // Clean up model resources
      try {
        if (this.transcriber.model) {
          this.transcriber.model.dispose?.();
        }
      } catch { /* ignore */ }
      this.transcriber = null;
    }
    this.loadedModelId = null;
    this.state = 'idle';
  }

  isModelLoaded(): boolean {
    return this.state === 'ready' || this.state === 'transcribing';
  }

  getState(): STTEngineState {
    return this.state;
  }

  getLoadedModelId(): string | null {
    return this.loadedModelId;
  }

  private async blobToFloat32(blob: Blob): Promise<Float32Array> {
    const arrayBuffer = await blob.arrayBuffer();
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    try {
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
      // Mix to mono at 16kHz
      const sr = audioBuffer.sampleRate;
      const len = audioBuffer.length;
      const ch0 = audioBuffer.getChannelData(0);
      let mono: Float32Array;
      if (audioBuffer.numberOfChannels > 1) {
        mono = new Float32Array(len);
        const ch1 = audioBuffer.getChannelData(1);
        for (let i = 0; i < len; i++) mono[i] = (ch0[i] + ch1[i]) * 0.5;
      } else {
        mono = ch0;
      }
      // Resample to 16kHz if needed
      if (sr !== 16000) {
        return this.resample(mono, sr, 16000);
      }
      return mono;
    } finally {
      ctx.close();
    }
  }

  private resample(data: Float32Array, fromRate: number, toRate: number): Float32Array {
    const ratio = toRate / fromRate;
    const newLen = Math.round(data.length * ratio);
    const out = new Float32Array(newLen);
    for (let i = 0; i < newLen; i++) {
      const srcIdx = i / ratio;
      const lo = Math.floor(srcIdx);
      const hi = Math.min(lo + 1, data.length - 1);
      const frac = srcIdx - lo;
      out[i] = data[lo] * (1 - frac) + data[hi] * frac;
    }
    return out;
  }

  private async detectBestDevice(): Promise<'webgpu' | 'wasm'> {
    try {
      if (!('gpu' in navigator)) return 'wasm';
      const adapter = await (navigator as Navigator & { gpu: { requestAdapter: () => Promise<unknown> } }).gpu.requestAdapter();
      return adapter ? 'webgpu' : 'wasm';
    } catch {
      return 'wasm';
    }
  }
}
