import type { RhythmConfig, SequenceStep } from '../types';

/** Published caps — mirror defensive checks in native code where practical. */
export const LIMITS = {
  maxSequenceSteps: 256,
  maxPauseMsPerStep: 30_000,
  maxRhythmDurationMs: 120_000,
  minBpm: 20,
  maxBpm: 480,
  maxPatternLength: 64,
  /** Serialized JSON passed to native — bounds hostile payloads. */
  maxJsonChars: 65_536,
} as const;

export class HapticsValidationError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'HapticsValidationError';
    this.code = code;
  }
}

/** Throws when serialized JSON would exceed native/JVM limits. Exported for unit tests. */
export function throwIfPayloadExceedsLimit(
  json: string,
  kind: 'sequence' | 'rhythm'
): void {
  if (json.length > LIMITS.maxJsonChars) {
    throw new HapticsValidationError(
      'payload_too_large',
      kind === 'sequence'
        ? 'Serialized sequence exceeds size limit'
        : 'Serialized rhythm exceeds size limit'
    );
  }
}

function assertFinite(name: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new HapticsValidationError(
      'invalid_number',
      `${name} must be a finite number`
    );
  }
}

export function assertValidSequence(steps: SequenceStep[]): void {
  if (!Array.isArray(steps)) {
    throw new HapticsValidationError(
      'invalid_sequence',
      'steps must be an array'
    );
  }
  if (steps.length === 0) {
    return;
  }
  if (steps.length > LIMITS.maxSequenceSteps) {
    throw new HapticsValidationError(
      'sequence_too_long',
      `At most ${LIMITS.maxSequenceSteps} steps are allowed`
    );
  }

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (!step || typeof step !== 'object' || !('type' in step)) {
      throw new HapticsValidationError(
        'invalid_step',
        `Invalid step at index ${i}`
      );
    }
    if (step.type === 'pause') {
      assertFinite(`steps[${i}].duration`, step.duration);
      if (step.duration < 0) {
        throw new HapticsValidationError(
          'invalid_pause',
          `pause duration must be ≥ 0 (index ${i})`
        );
      }
      if (step.duration > LIMITS.maxPauseMsPerStep) {
        throw new HapticsValidationError(
          'pause_too_long',
          `pause duration must be ≤ ${LIMITS.maxPauseMsPerStep}ms`
        );
      }
    } else if (step.type === 'impact') {
      assertFinite(`steps[${i}].intensity`, step.intensity);
      assertFinite(`steps[${i}].sharpness`, step.sharpness);
      if (
        step.intensity < 0 ||
        step.intensity > 1 ||
        step.sharpness < 0 ||
        step.sharpness > 1
      ) {
        throw new HapticsValidationError(
          'invalid_impact_range',
          `intensity and sharpness must be within 0–1 (index ${i})`
        );
      }
    } else {
      throw new HapticsValidationError(
        'unknown_step_type',
        `Unknown step type at index ${i}`
      );
    }
  }

  const json = JSON.stringify(steps);
  throwIfPayloadExceedsLimit(json, 'sequence');
}

export function assertValidRhythm(config: RhythmConfig): void {
  if (!config || typeof config !== 'object') {
    throw new HapticsValidationError(
      'invalid_rhythm',
      'config must be an object'
    );
  }
  assertFinite('bpm', config.bpm);
  assertFinite('duration', config.duration);
  if (config.bpm < LIMITS.minBpm || config.bpm > LIMITS.maxBpm) {
    throw new HapticsValidationError(
      'invalid_bpm',
      `bpm must be between ${LIMITS.minBpm} and ${LIMITS.maxBpm}`
    );
  }
  if (config.duration <= 0 || config.duration > LIMITS.maxRhythmDurationMs) {
    throw new HapticsValidationError(
      'invalid_duration',
      `duration must be between 0 and ${LIMITS.maxRhythmDurationMs}ms`
    );
  }
  if (!Array.isArray(config.pattern) || config.pattern.length === 0) {
    throw new HapticsValidationError(
      'invalid_pattern',
      'pattern must be a non-empty array'
    );
  }
  if (config.pattern.length > LIMITS.maxPatternLength) {
    throw new HapticsValidationError(
      'pattern_too_long',
      `pattern length must be ≤ ${LIMITS.maxPatternLength}`
    );
  }
  for (let i = 0; i < config.pattern.length; i++) {
    const v = config.pattern[i];
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      throw new HapticsValidationError(
        'invalid_pattern_entry',
        `pattern[${i}] must be a finite number`
      );
    }
  }

  const json = JSON.stringify(config);
  throwIfPayloadExceedsLimit(json, 'rhythm');
}
