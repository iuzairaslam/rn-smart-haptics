export type ImpactStep = {
  type: 'impact';
  intensity: number;
  sharpness: number;
};

export type PauseStep = {
  type: 'pause';
  duration: number;
};

export type SequenceStep = ImpactStep | PauseStep;

export type RhythmConfig = {
  bpm: number;
  pattern: number[];
  duration: number;
};
