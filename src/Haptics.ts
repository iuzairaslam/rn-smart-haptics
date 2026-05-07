import Native from './NativeRnSmartHaptics';
import { assertValidRhythm, assertValidSequence } from './internal/validation';
import type { RhythmConfig, SequenceStep } from './types';

async function playSequence(steps: SequenceStep[]): Promise<void> {
  assertValidSequence(steps);
  if (steps.length === 0) {
    return;
  }
  return Native.playSequenceJson(JSON.stringify(steps));
}

async function rhythm(config: RhythmConfig): Promise<void> {
  assertValidRhythm(config);
  return Native.rhythmJson(JSON.stringify(config));
}

/**
 * Rich haptic feedback built on Core Haptics (iOS) and waveform vibration (Android).
 * Requires React Native New Architecture (Turbo Modules).
 */
const Haptics = {
  success: (): Promise<void> => Native.success(),
  error: (): Promise<void> => Native.error(),
  warning: (): Promise<void> => Native.warning(),
  celebration: (): Promise<void> => Native.celebration(),
  lightImpact: (): Promise<void> => Native.lightImpact(),
  mediumImpact: (): Promise<void> => Native.mediumImpact(),
  heavyImpact: (): Promise<void> => Native.heavyImpact(),
  rigid: (): Promise<void> => Native.rigid(),
  soft: (): Promise<void> => Native.soft(),
  selection: (): Promise<void> => Native.selection(),
  doubleTap: (): Promise<void> => Native.doubleTap(),
  tick: (): Promise<void> => Native.tick(),
  playSequence,
  rhythm,
};

export default Haptics;
