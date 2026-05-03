import type { ModelInfo } from './types';

export const MODEL_REGISTRY: ModelInfo[] = [
  {
    id: 'onnx-community/whisper-tiny',
    name: 'Whisper Tiny',
    size: 'tiny',
    sizeMB: 75,
    languages: ['th', 'en', 'multi'],
    description: 'เล็กที่สุด เร็ว แต่ความแม่นต่ำ — เหมาะทดสอบหรือมือถือ',
    recommendedFor: ['web', 'mobile'],
    thaiQuality: 2,
  },
  {
    id: 'onnx-community/whisper-base',
    name: 'Whisper Base',
    size: 'base',
    sizeMB: 150,
    languages: ['th', 'en', 'multi'],
    description: 'เล็ก เร็ว ภาษาไทยพอใช้ — เหมาะมือถือ/เว็บเบาๆ',
    recommendedFor: ['web', 'mobile'],
    thaiQuality: 3,
  },
  {
    id: 'onnx-community/whisper-small',
    name: 'Whisper Small',
    size: 'small',
    sizeMB: 500,
    languages: ['th', 'en', 'multi'],
    description: 'สมดุลดี ภาษาไทยดี — แนะนำสำหรับเว็บ/เดสก์ท็อป',
    recommendedFor: ['web', 'desktop'],
    thaiQuality: 4,
  },
  {
    id: 'onnx-community/whisper-medium',
    name: 'Whisper Medium',
    size: 'medium',
    sizeMB: 1500,
    languages: ['th', 'en', 'multi'],
    description: 'ความแม่นสูง แต่ช้าและกิน RAM — เหมาะเดสก์ท็อป GPU',
    recommendedFor: ['desktop'],
    thaiQuality: 4,
  },
  {
    id: 'onnx-community/whisper-large-v3',
    name: 'Whisper Large V3',
    size: 'large',
    sizeMB: 3000,
    languages: ['th', 'en', 'multi'],
    description: 'ดีที่สุด แต่กินสเปคมาก — เฉพาะเดสก์ท็อป GPU แรง',
    recommendedFor: ['desktop'],
    thaiQuality: 5,
  },
  {
    id: 'onnx-community/whisper-large-v3-turbo',
    name: 'Whisper Large V3 Turbo',
    size: 'large',
    sizeMB: 800,
    languages: ['th', 'en', 'multi'],
    description: 'เร็วเกือบเท่า small แต่แม่นเกือบเท่า large — แนะนำเดสก์ท็อป',
    recommendedFor: ['desktop', 'web'],
    thaiQuality: 5,
  },
];

export function getModelsForPlatform(platform: 'web' | 'desktop' | 'mobile'): ModelInfo[] {
  return MODEL_REGISTRY.filter(m => m.recommendedFor.includes(platform));
}

export function getModelById(id: string): ModelInfo | undefined {
  return MODEL_REGISTRY.find(m => m.id === id);
}

export function getRecommendedModel(platform: 'web' | 'desktop' | 'mobile'): ModelInfo {
  const models = getModelsForPlatform(platform);
  // Pick the best quality that's still reasonable for the platform
  if (platform === 'mobile') return models.find(m => m.size === 'base') || models[0];
  if (platform === 'web') return models.find(m => m.size === 'small') || models[0];
  return models.find(m => m.id.includes('turbo')) || models[0];
}
