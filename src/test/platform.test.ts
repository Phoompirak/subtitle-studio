import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { detectPlatform, isWebGPUAvailable, getDeviceMemoryGB } from '@/lib/stt/platform';

describe('platform detection', () => {
  const originalWindow = global.window;

  afterEach(() => {
    // Restore original window
    vi.stubGlobal('window', originalWindow);
    vi.stubGlobal('navigator', global.navigator);
  });

  it('should detect web platform by default', () => {
    vi.stubGlobal('window', {});
    expect(detectPlatform()).toBe('web');
  });

  it('should detect Tauri platform', () => {
    vi.stubGlobal('window', {
      __TAURI_INTERNALS__: {},
    });
    expect(detectPlatform()).toBe('tauri');
  });

  it('should detect Capacitor platform', () => {
    vi.stubGlobal('window', {
      Capacitor: {
        isNativePlatform: () => true,
      },
    });
    expect(detectPlatform()).toBe('capacitor');
  });

  it('should prioritize Tauri over Capacitor', () => {
    vi.stubGlobal('window', {
      __TAURI_INTERNALS__: {},
      Capacitor: {
        isNativePlatform: () => true,
      },
    });
    expect(detectPlatform()).toBe('tauri');
  });

  it('should return false for WebGPU when navigator is undefined', () => {
    vi.stubGlobal('window', {});
    vi.stubGlobal('navigator', undefined);
    expect(isWebGPUAvailable()).toBe(false);
  });

  it('should return false for WebGPU when gpu is not available', () => {
    vi.stubGlobal('navigator', {});
    expect(isWebGPUAvailable()).toBe(false);
  });

  it('should return true for WebGPU when gpu is available', () => {
    vi.stubGlobal('navigator', {
      gpu: {},
    });
    expect(isWebGPUAvailable()).toBe(true);
  });

  it('should return null for device memory when not available', () => {
    vi.stubGlobal('navigator', {});
    expect(getDeviceMemoryGB()).toBe(null);
  });

  it('should return device memory when available', () => {
    vi.stubGlobal('navigator', {
      deviceMemory: 8,
    });
    expect(getDeviceMemoryGB()).toBe(8);
  });
});
