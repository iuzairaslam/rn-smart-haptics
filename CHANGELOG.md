# Changelog

All notable changes to **rn-smart-haptics** are documented here. This project adheres to [Semantic Versioning](https://semver.org/).

## 1.0.0 — 2026-05-08

### Added

- Stable **1.0** API: default `Haptics` export with preset methods, `playSequence`, and `rhythm`.
- **Turbo Module** (`RnSmartHaptics`) with codegen spec for React Native **0.76+**.
- iOS **Core Haptics** with UIKit fallbacks; Android **VibrationEffect** waveforms with amplitude support where available.
- **`HapticsValidationError`** and **`LIMITS`** exports for client-side validation and documentation.
- Native defensive caps (JSON size, sequence steps, waveform segments, rhythm beats, fallback timer scheduling).
- Unit tests (`yarn test`) and CI wiring.

### Notes

- Requires **New Architecture** (Fabric / Turbo Modules). Old Architecture apps must migrate before using this package.
