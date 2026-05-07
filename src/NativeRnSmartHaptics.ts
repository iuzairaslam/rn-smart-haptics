import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  success(): Promise<void>;
  error(): Promise<void>;
  warning(): Promise<void>;
  celebration(): Promise<void>;
  lightImpact(): Promise<void>;
  mediumImpact(): Promise<void>;
  heavyImpact(): Promise<void>;
  rigid(): Promise<void>;
  soft(): Promise<void>;
  selection(): Promise<void>;
  doubleTap(): Promise<void>;
  tick(): Promise<void>;
  playSequenceJson(sequenceJson: string): Promise<void>;
  rhythmJson(configJson: string): Promise<void>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RnSmartHaptics');
