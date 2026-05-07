import { describe, expect, it } from '@jest/globals';

import {
  assertValidRhythm,
  assertValidSequence,
  HapticsValidationError,
  LIMITS,
  throwIfPayloadExceedsLimit,
} from '../internal/validation';

describe('assertValidSequence', () => {
  it('allows empty arrays (no-op at call site)', () => {
    expect(() => assertValidSequence([])).not.toThrow();
  });

  it('rejects non-arrays', () => {
    expect(() => assertValidSequence(null as never)).toThrow(
      HapticsValidationError
    );
  });

  it('rejects too many steps', () => {
    const steps = Array.from({ length: LIMITS.maxSequenceSteps + 1 }, () => ({
      type: 'impact' as const,
      intensity: 0.5,
      sharpness: 0.5,
    }));
    expect(() => assertValidSequence(steps)).toThrow(HapticsValidationError);
    expect(() => assertValidSequence(steps)).toThrowError(
      expect.objectContaining({
        code: 'sequence_too_long',
      })
    );
  });

  it('rejects NaN intensity', () => {
    expect(() =>
      assertValidSequence([{ type: 'impact', intensity: NaN, sharpness: 0.5 }])
    ).toThrow(HapticsValidationError);
    expect(() =>
      assertValidSequence([{ type: 'impact', intensity: NaN, sharpness: 0.5 }])
    ).toThrowError(expect.objectContaining({ code: 'invalid_number' }));
  });

  it('rejects Infinity sharpness', () => {
    expect(() =>
      assertValidSequence([
        { type: 'impact', intensity: 0.5, sharpness: Number.POSITIVE_INFINITY },
      ])
    ).toThrow(HapticsValidationError);
  });

  it('rejects intensity outside 0–1', () => {
    expect(() =>
      assertValidSequence([{ type: 'impact', intensity: 1.01, sharpness: 0.5 }])
    ).toThrow(HapticsValidationError);
    expect(() =>
      assertValidSequence([{ type: 'impact', intensity: 1.01, sharpness: 0.5 }])
    ).toThrowError(expect.objectContaining({ code: 'invalid_impact_range' }));

    expect(() =>
      assertValidSequence([
        { type: 'impact', intensity: -0.01, sharpness: 0.5 },
      ])
    ).toThrow(HapticsValidationError);
  });

  it('rejects negative pause', () => {
    expect(() =>
      assertValidSequence([{ type: 'pause', duration: -1 }])
    ).toThrow(HapticsValidationError);
    expect(() =>
      assertValidSequence([{ type: 'pause', duration: -1 }])
    ).toThrowError(expect.objectContaining({ code: 'invalid_pause' }));
  });

  it('rejects pause above limit', () => {
    expect(() =>
      assertValidSequence([
        { type: 'pause', duration: LIMITS.maxPauseMsPerStep + 1 },
      ])
    ).toThrow(HapticsValidationError);
    expect(() =>
      assertValidSequence([
        { type: 'pause', duration: LIMITS.maxPauseMsPerStep + 1 },
      ])
    ).toThrowError(expect.objectContaining({ code: 'pause_too_long' }));
  });

  it('rejects invalid step objects', () => {
    expect(() => assertValidSequence([null as unknown as never])).toThrow(
      HapticsValidationError
    );
    expect(() => assertValidSequence([null as unknown as never])).toThrowError(
      expect.objectContaining({ code: 'invalid_step' })
    );
  });

  it('rejects unknown step type', () => {
    expect(() =>
      assertValidSequence([
        { type: 'nope', intensity: 1, sharpness: 1 } as never,
      ])
    ).toThrow(HapticsValidationError);
    expect(() =>
      assertValidSequence([
        { type: 'nope', intensity: 1, sharpness: 1 } as never,
      ])
    ).toThrowError(expect.objectContaining({ code: 'unknown_step_type' }));
  });

  it('accepts boundary impacts and pauses', () => {
    expect(() =>
      assertValidSequence([
        { type: 'impact', intensity: 0, sharpness: 0 },
        { type: 'impact', intensity: 1, sharpness: 1 },
        { type: 'pause', duration: 0 },
        { type: 'pause', duration: LIMITS.maxPauseMsPerStep },
      ])
    ).not.toThrow();
  });

  it('accepts a minimal valid sequence', () => {
    expect(() =>
      assertValidSequence([
        { type: 'impact', intensity: 0.4, sharpness: 0.8 },
        { type: 'pause', duration: 80 },
      ])
    ).not.toThrow();
  });
});

describe('assertValidRhythm', () => {
  it('rejects null config', () => {
    expect(() => assertValidRhythm(null as never)).toThrow(
      HapticsValidationError
    );
    expect(() => assertValidRhythm(null as never)).toThrowError(
      expect.objectContaining({ code: 'invalid_rhythm' })
    );
  });

  it('rejects bpm out of range (low)', () => {
    expect(() =>
      assertValidRhythm({ bpm: 10, duration: 1000, pattern: [1] })
    ).toThrow(HapticsValidationError);
    expect(() =>
      assertValidRhythm({ bpm: 10, duration: 1000, pattern: [1] })
    ).toThrowError(expect.objectContaining({ code: 'invalid_bpm' }));
  });

  it('rejects bpm out of range (high)', () => {
    expect(() =>
      assertValidRhythm({ bpm: 500, duration: 1000, pattern: [1] })
    ).toThrow(HapticsValidationError);
  });

  it('accepts boundary bpm values', () => {
    expect(() =>
      assertValidRhythm({
        bpm: LIMITS.minBpm,
        duration: 100,
        pattern: [1],
      })
    ).not.toThrow();
    expect(() =>
      assertValidRhythm({
        bpm: LIMITS.maxBpm,
        duration: 100,
        pattern: [1],
      })
    ).not.toThrow();
  });

  it('rejects NaN bpm', () => {
    expect(() =>
      assertValidRhythm({
        bpm: NaN,
        duration: 1000,
        pattern: [1],
      })
    ).toThrow(HapticsValidationError);
  });

  it('rejects zero or negative duration', () => {
    expect(() =>
      assertValidRhythm({ bpm: 60, duration: 0, pattern: [1] })
    ).toThrow(HapticsValidationError);
    expect(() =>
      assertValidRhythm({ bpm: 60, duration: 0, pattern: [1] })
    ).toThrowError(expect.objectContaining({ code: 'invalid_duration' }));

    expect(() =>
      assertValidRhythm({ bpm: 60, duration: -1, pattern: [1] })
    ).toThrow(HapticsValidationError);
  });

  it('rejects duration above limit', () => {
    expect(() =>
      assertValidRhythm({
        bpm: 60,
        duration: LIMITS.maxRhythmDurationMs + 1,
        pattern: [1],
      })
    ).toThrow(HapticsValidationError);
  });

  it('accepts boundary duration', () => {
    expect(() =>
      assertValidRhythm({
        bpm: 60,
        duration: LIMITS.maxRhythmDurationMs,
        pattern: [1],
      })
    ).not.toThrow();
  });

  it('rejects empty pattern', () => {
    expect(() =>
      assertValidRhythm({ bpm: 60, duration: 1000, pattern: [] })
    ).toThrow(HapticsValidationError);
    expect(() =>
      assertValidRhythm({ bpm: 60, duration: 1000, pattern: [] })
    ).toThrowError(expect.objectContaining({ code: 'invalid_pattern' }));
  });

  it('rejects pattern length above limit', () => {
    const pattern = Array.from(
      { length: LIMITS.maxPatternLength + 1 },
      () => 1
    );
    expect(() =>
      assertValidRhythm({ bpm: 60, duration: 1000, pattern })
    ).toThrow(HapticsValidationError);
    expect(() =>
      assertValidRhythm({ bpm: 60, duration: 1000, pattern })
    ).toThrowError(expect.objectContaining({ code: 'pattern_too_long' }));
  });

  it('rejects non-finite pattern entries', () => {
    expect(() =>
      assertValidRhythm({ bpm: 60, duration: 1000, pattern: [NaN] })
    ).toThrow(HapticsValidationError);
    expect(() =>
      assertValidRhythm({ bpm: 60, duration: 1000, pattern: [NaN] })
    ).toThrowError(expect.objectContaining({ code: 'invalid_pattern_entry' }));
  });

  it('rejects non-number pattern entries', () => {
    expect(() =>
      assertValidRhythm({
        bpm: 60,
        duration: 1000,
        pattern: ['x'] as unknown as number[],
      })
    ).toThrow(HapticsValidationError);
  });

  it('accepts a typical rhythm', () => {
    expect(() =>
      assertValidRhythm({ bpm: 90, pattern: [1, 0, 1, 1], duration: 2000 })
    ).not.toThrow();
  });
});

describe('HapticsValidationError', () => {
  it('exposes code and name', () => {
    const err = new HapticsValidationError('test_code', 'hello');
    expect(err.code).toBe('test_code');
    expect(err.name).toBe('HapticsValidationError');
    expect(err.message).toBe('hello');
  });
});

describe('throwIfPayloadExceedsLimit', () => {
  it('throws payload_too_large for sequences when over limit', () => {
    const huge = 'x'.repeat(LIMITS.maxJsonChars + 1);
    expect(() => throwIfPayloadExceedsLimit(huge, 'sequence')).toThrow(
      HapticsValidationError
    );
    expect(() => throwIfPayloadExceedsLimit(huge, 'sequence')).toThrowError(
      expect.objectContaining({
        code: 'payload_too_large',
        message: 'Serialized sequence exceeds size limit',
      })
    );
  });

  it('throws payload_too_large for rhythms when over limit', () => {
    const huge = 'y'.repeat(LIMITS.maxJsonChars + 1);
    expect(() => throwIfPayloadExceedsLimit(huge, 'rhythm')).toThrow(
      HapticsValidationError
    );
    expect(() => throwIfPayloadExceedsLimit(huge, 'rhythm')).toThrowError(
      expect.objectContaining({
        code: 'payload_too_large',
        message: 'Serialized rhythm exceeds size limit',
      })
    );
  });

  it('allows payloads exactly at limit', () => {
    const boundary = 'z'.repeat(LIMITS.maxJsonChars);
    expect(() =>
      throwIfPayloadExceedsLimit(boundary, 'sequence')
    ).not.toThrow();
  });
});
