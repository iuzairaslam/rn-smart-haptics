import { describe, expect, it, jest } from '@jest/globals';

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

import HapticsDefault, {
  HapticsValidationError,
  LIMITS,
  type RhythmConfig,
  type SequenceStep,
} from '../index';

describe('package entry (index)', () => {
  it('default export is the Haptics namespace object', () => {
    expect(HapticsDefault).toBeTruthy();
    expect(typeof HapticsDefault.success).toBe('function');
    expect(typeof HapticsDefault.playSequence).toBe('function');
    expect(typeof HapticsDefault.rhythm).toBe('function');
  });

  it('exports validation primitives', () => {
    expect(LIMITS.maxSequenceSteps).toBe(256);
    expect(typeof HapticsValidationError).toBe('function');
  });

  it('types compile-time re-export surface exists at runtime for values', () => {
    const step: SequenceStep = {
      type: 'impact',
      intensity: 0.5,
      sharpness: 0.5,
    };
    const rhythm: RhythmConfig = {
      bpm: 60,
      pattern: [1],
      duration: 500,
    };
    expect(step.type).toBe('impact');
    expect(rhythm.bpm).toBe(60);
  });
});
