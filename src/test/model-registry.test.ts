import { describe, it, expect } from 'vitest';
import { MODEL_REGISTRY, getModelsForPlatform, getRecommendedModel, getModelById } from '@/lib/stt/model-registry';

describe('model-registry', () => {
  it('should have all required models', () => {
    expect(MODEL_REGISTRY.length).toBeGreaterThan(0);
    expect(MODEL_REGISTRY.every(m => m.id && m.name && m.size && m.sizeMB && m.languages)).toBe(true);
  });

  it('should filter models by platform', () => {
    const webModels = getModelsForPlatform('web');
    const mobileModels = getModelsForPlatform('mobile');
    const desktopModels = getModelsForPlatform('desktop');

    expect(webModels.length).toBeGreaterThan(0);
    expect(mobileModels.length).toBeGreaterThan(0);
    expect(desktopModels.length).toBeGreaterThan(0);

    // Mobile should have fewer models (only small ones)
    expect(mobileModels.length).toBeLessThanOrEqual(webModels.length);
  });

  it('should get model by id', () => {
    const model = getModelById('onnx-community/whisper-small');
    expect(model).toBeDefined();
    expect(model?.name).toBe('Whisper Small');
    expect(model?.size).toBe('small');
  });

  it('should return undefined for unknown model id', () => {
    const model = getModelById('unknown-model');
    expect(model).toBeUndefined();
  });

  it('should recommend appropriate model for each platform', () => {
    const webRec = getRecommendedModel('web');
    const mobileRec = getRecommendedModel('mobile');
    const desktopRec = getRecommendedModel('desktop');

    expect(webRec).toBeDefined();
    expect(mobileRec).toBeDefined();
    expect(desktopRec).toBeDefined();

    // Mobile should recommend small or tiny
    expect(['tiny', 'base', 'small']).toContain(mobileRec.size);
  });

  it('should have valid Thai quality ratings', () => {
    MODEL_REGISTRY.forEach(model => {
      expect(model.thaiQuality).toBeGreaterThanOrEqual(1);
      expect(model.thaiQuality).toBeLessThanOrEqual(5);
    });
  });

  it('should have valid size values', () => {
    const validSizes = ['tiny', 'base', 'small', 'medium', 'large'];
    MODEL_REGISTRY.forEach(model => {
      expect(validSizes).toContain(model.size);
    });
  });
});
