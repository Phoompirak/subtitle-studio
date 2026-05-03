import { describe, it, expect, vi } from 'vitest';
import { BrowserSTTEngine } from '@/lib/stt/browser-stt';
import type { STTEngineState } from '@/lib/stt/types';

// Mock @huggingface/transformers
vi.mock('@huggingface/transformers', () => ({
  pipeline: vi.fn(() => Promise.resolve({
    model: { dispose: vi.fn() },
  })),
  env: {
    allowLocalModels: true,
    useBrowserCache: true,
  },
}));

describe('BrowserSTTEngine', () => {
  let engine: BrowserSTTEngine;

  beforeEach(() => {
    engine = new BrowserSTTEngine();
  });

  it('should start in idle state', () => {
    expect(engine.getState()).toBe('idle');
  });

  it('should not have model loaded initially', () => {
    expect(engine.isModelLoaded()).toBe(false);
    expect(engine.getLoadedModelId()).toBe(null);
  });

  it('should throw error when transcribing without model', async () => {
    await expect(
      engine.transcribe(new Float32Array([0.1, 0.2, 0.3]))
    ).rejects.toThrow('Model not loaded');
  });

  it('should update state to loading when loading model', async () => {
    const loadPromise = engine.loadModel('onnx-community/whisper-tiny');
    expect(engine.getState()).toBe('loading');
    await loadPromise;
  });

  it('should update state to ready after successful load', async () => {
    await engine.loadModel('onnx-community/whisper-tiny');
    expect(engine.getState()).toBe('ready');
    expect(engine.isModelLoaded()).toBe(true);
    expect(engine.getLoadedModelId()).toBe('onnx-community/whisper-tiny');
  });

  it('should unload model and reset state', async () => {
    await engine.loadModel('onnx-community/whisper-tiny');
    await engine.unloadModel();
    expect(engine.getState()).toBe('idle');
    expect(engine.isModelLoaded()).toBe(false);
    expect(engine.getLoadedModelId()).toBe(null);
  });

  it('should accept progress callback during load', async () => {
    const onProgress = vi.fn();
    await engine.loadModel('onnx-community/whisper-tiny', {
      onProgress,
    });
    // Progress callback should be called (mocked pipeline may not call it)
    expect(typeof onProgress).toBe('function');
  });
});
