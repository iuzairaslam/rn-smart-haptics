import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('../NativeRnSmartHaptics', () => ({
  __esModule: true,
  default: {
    success: jest.fn(() => Promise.resolve()),
    error: jest.fn(() => Promise.resolve()),
    warning: jest.fn(() => Promise.resolve()),
    celebration: jest.fn(() => Promise.resolve()),
    lightImpact: jest.fn(() => Promise.resolve()),
    mediumImpact: jest.fn(() => Promise.resolve()),
    heavyImpact: jest.fn(() => Promise.resolve()),
    rigid: jest.fn(() => Promise.resolve()),
    soft: jest.fn(() => Promise.resolve()),
    selection: jest.fn(() => Promise.resolve()),
    doubleTap: jest.fn(() => Promise.resolve()),
    tick: jest.fn(() => Promise.resolve()),
    playSequenceJson: jest.fn(() => Promise.resolve()),
    rhythmJson: jest.fn(() => Promise.resolve()),
  },
}));

import Haptics from '../Haptics';
import { HapticsValidationError } from '../internal/validation';
import Native from '../NativeRnSmartHaptics';

describe('Haptics JS API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not call native for empty playSequence', async () => {
    await Haptics.playSequence([]);
    expect(jest.mocked(Native.playSequenceJson)).not.toHaveBeenCalled();
  });

  it('stringifies valid sequences for native', async () => {
    const steps = [
      { type: 'impact' as const, intensity: 0.5, sharpness: 0.5 },
      { type: 'pause' as const, duration: 40 },
    ];
    await Haptics.playSequence(steps);
    expect(jest.mocked(Native.playSequenceJson)).toHaveBeenCalledWith(
      JSON.stringify(steps)
    );
  });

  it('rejects invalid sequences before native', async () => {
    await expect(
      Haptics.playSequence([{ type: 'impact', intensity: 2, sharpness: 0.5 }])
    ).rejects.toThrow(HapticsValidationError);
    expect(jest.mocked(Native.playSequenceJson)).not.toHaveBeenCalled();
  });

  it('stringifies rhythm config for native', async () => {
    const cfg = { bpm: 90, pattern: [1, 0, 1, 1], duration: 2000 };
    await Haptics.rhythm(cfg);
    expect(jest.mocked(Native.rhythmJson)).toHaveBeenCalledWith(
      JSON.stringify(cfg)
    );
  });

  it('rejects invalid rhythm before native', async () => {
    await expect(
      Haptics.rhythm({ bpm: 10, duration: 1000, pattern: [1] })
    ).rejects.toThrow(HapticsValidationError);
    expect(jest.mocked(Native.rhythmJson)).not.toHaveBeenCalled();
  });

  const presetSpecs = [
    ['success', () => Haptics.success()],
    ['error', () => Haptics.error()],
    ['warning', () => Haptics.warning()],
    ['celebration', () => Haptics.celebration()],
    ['lightImpact', () => Haptics.lightImpact()],
    ['mediumImpact', () => Haptics.mediumImpact()],
    ['heavyImpact', () => Haptics.heavyImpact()],
    ['rigid', () => Haptics.rigid()],
    ['soft', () => Haptics.soft()],
    ['selection', () => Haptics.selection()],
    ['doubleTap', () => Haptics.doubleTap()],
    ['tick', () => Haptics.tick()],
  ] as const satisfies ReadonlyArray<
    readonly [keyof typeof Native, () => Promise<void>]
  >;

  for (const [name, invoke] of presetSpecs) {
    it(`delegates ${String(name)} to the Turbo Module`, async () => {
      await invoke();
      expect(jest.mocked(Native[name])).toHaveBeenCalledTimes(1);
    });
  }
});
