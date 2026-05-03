export type ModelSize = 'tiny' | 'base' | 'small' | 'medium' | 'large';

export type ModelInfo = {
  id: string;            // e.g. 'Xenova/whisper-small'
  name: string;          // display name
  size: ModelSize;
  sizeMB: number;         // approximate download size in MB
  languages: string[];    // ['th', 'en', ...]
  description: string;
  recommendedFor: ('web' | 'desktop' | 'mobile')[];
  thaiQuality: 1 | 2 | 3 | 4 | 5; // 1=poor, 5=best
};

export type WordTimestamp = {
  word: string;
  start: number;  // seconds
  end: number;
};

export type TranscribeOpts = {
  language?: string;       // e.g. 'th'
  wordTimestamps?: boolean;
  chunkLengthSecs?: number;
};

export type TranscribeResult = {
  text: string;
  chunks?: WordTimestamp[];
  language?: string;
};

export type STTEngineState = 'idle' | 'loading' | 'ready' | 'transcribing' | 'error';

export type ProgressCallback = (progress: number) => void; // 0-1

export interface STTEngine {
  loadModel(modelId: string, opts?: { device?: 'webgpu' | 'wasm'; onProgress?: ProgressCallback }): Promise<void>;
  transcribe(audio: Blob | Float32Array, opts?: TranscribeOpts): Promise<TranscribeResult>;
  unloadModel(): Promise<void>;
  isModelLoaded(): boolean;
  getState(): STTEngineState;
  getLoadedModelId(): string | null;
}
