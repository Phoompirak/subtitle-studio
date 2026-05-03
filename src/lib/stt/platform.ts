export type Platform = 'web' | 'tauri' | 'capacitor';

interface WindowWithTauri extends Window {
  __TAURI_INTERNALS__?: unknown;
  Capacitor?: {
    isNativePlatform?: () => boolean;
  };
}

export function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'web';

  const win = window as WindowWithTauri;

  // Tauri detection
  if (win.__TAURI_INTERNALS__) return 'tauri';

  // Capacitor detection
  if (win.Capacitor?.isNativePlatform?.()) return 'capacitor';

  return 'web';
}

export function isWebGPUAvailable(): boolean {
  if (typeof navigator === 'undefined') return false;
  return 'gpu' in navigator;
}

export function getDeviceMemoryGB(): number | null {
  // navigator.deviceMemory is Chrome-only and approximate
  const nav = navigator as Navigator & { deviceMemory?: number };
  return nav.deviceMemory ?? null;
}
