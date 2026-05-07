import Haptics, {
  HapticsValidationError,
  LIMITS,
  type RhythmConfig,
  type SequenceStep,
} from 'rn-smart-haptics';
import { type ReactNode, useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const palette = {
  bg: '#07070b',
  bgElevated: '#101018',
  bgCard: '#16161f',
  border: 'rgba(255,255,255,0.08)',
  text: '#f4f4f8',
  textMuted: 'rgba(244,244,248,0.55)',
  accent: '#5eead4',
  accentDim: 'rgba(94,234,212,0.15)',
  magenta: '#e879f9',
  success: '#4ade80',
  warning: '#fbbf24',
  danger: '#fb7185',
  ripple: 'rgba(255,255,255,0.14)',
};

async function runWithFeedback(
  label: string,
  fn: () => Promise<void>
): Promise<void> {
  try {
    await fn();
  } catch (e: unknown) {
    if (e instanceof HapticsValidationError) {
      Alert.alert(label, `${e.code}\n\n${e.message}`);
    } else {
      Alert.alert(label, String(e));
    }
  }
}

type TileProps = {
  emoji: string;
  title: string;
  caption: string;
  onPress: () => void;
  tint?: 'default' | 'success' | 'warning' | 'danger' | 'accent';
};

function Section({
  kicker,
  title,
  subtitle,
  children,
}: {
  kicker: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionKicker}>{kicker}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      {children}
    </View>
  );
}

function HapticTile({
  emoji,
  title,
  caption,
  onPress,
  tint = 'default',
}: TileProps) {
  const borderColors = {
    default: palette.border,
    success: 'rgba(74,222,128,0.35)',
    warning: 'rgba(251,191,36,0.35)',
    danger: 'rgba(251,113,133,0.35)',
    accent: 'rgba(94,234,212,0.35)',
  };

  return (
    <Pressable
      accessibilityLabel={`${title}. ${caption}`}
      accessibilityRole="button"
      android_ripple={{ color: palette.ripple, borderless: false }}
      style={({ pressed }) => [
        styles.tile,
        { borderColor: borderColors[tint] },
        pressed && styles.tilePressed,
      ]}
      onPress={onPress}
    >
      <Text style={styles.tileEmoji}>{emoji}</Text>
      <Text style={styles.tileTitle}>{title}</Text>
      <Text style={styles.tileCaption}>{caption}</Text>
    </Pressable>
  );
}

function WideAction({
  title,
  subtitle,
  emoji,
  onPress,
  variant = 'filled',
}: {
  title: string;
  subtitle: string;
  emoji: string;
  onPress: () => void;
  variant?: 'filled' | 'outline';
}) {
  return (
    <Pressable
      accessibilityRole="button"
      android_ripple={{ color: palette.ripple }}
      style={({ pressed }) => [
        styles.wideBtn,
        variant === 'outline' ? styles.wideBtnOutline : styles.wideBtnFilled,
        pressed && styles.wideBtnPressed,
      ]}
      onPress={onPress}
    >
      <Text style={styles.wideEmoji}>{emoji}</Text>
      <View style={styles.wideTextWrap}>
        <Text style={styles.wideTitle}>{title}</Text>
        <Text style={styles.wideSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.wideChevron}>→</Text>
    </Pressable>
  );
}

const SEMANTIC_PRESETS: readonly {
  key: 'success' | 'error' | 'warning' | 'celebration';
  emoji: string;
  title: string;
  caption: string;
  tint: TileProps['tint'];
}[] = [
  {
    key: 'success',
    emoji: '✓',
    title: 'Success',
    caption: 'Task completed, payment OK',
    tint: 'success',
  },
  {
    key: 'error',
    emoji: '✕',
    title: 'Error',
    caption: 'Triple ascending pulse',
    tint: 'danger',
  },
  {
    key: 'warning',
    emoji: '⚠',
    title: 'Warning',
    caption: 'Attention, retry soon',
    tint: 'warning',
  },
  {
    key: 'celebration',
    emoji: '✨',
    title: 'Celebration',
    caption: 'Reward & milestones',
    tint: 'accent',
  },
];

const IMPACT_PRESETS: readonly {
  key: 'lightImpact' | 'mediumImpact' | 'heavyImpact' | 'rigid' | 'soft';
  emoji: string;
  title: string;
  caption: string;
}[] = [
  { key: 'lightImpact', emoji: '○', title: 'Light', caption: 'Subtle UI tap' },
  {
    key: 'mediumImpact',
    emoji: '◎',
    title: 'Medium',
    caption: 'Default button',
  },
  { key: 'heavyImpact', emoji: '◉', title: 'Heavy', caption: 'Strong confirm' },
  { key: 'rigid', emoji: '◇', title: 'Rigid', caption: 'Crisp / mechanical' },
  { key: 'soft', emoji: '☁', title: 'Soft', caption: 'Cushioned feel' },
];

const MICRO_PRESETS: readonly {
  key: 'selection' | 'doubleTap' | 'tick';
  emoji: string;
  title: string;
  caption: string;
}[] = [
  {
    key: 'selection',
    emoji: '▹',
    title: 'Selection',
    caption: 'Picker / slider tick',
  },
  {
    key: 'doubleTap',
    emoji: '②',
    title: 'Double tap',
    caption: 'Compact confirm',
  },
  { key: 'tick', emoji: '·', title: 'Tick', caption: 'Metronome / grid snap' },
];

const SEQUENCE_DEMOS: readonly {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  steps: SequenceStep[];
}[] = [
  {
    id: 'docs',
    emoji: '⌁',
    title: 'Docs sequence',
    subtitle: 'Impact → pause → stronger impact',
    steps: [
      { type: 'impact', intensity: 0.4, sharpness: 0.8 },
      { type: 'pause', duration: 80 },
      { type: 'impact', intensity: 0.9, sharpness: 0.3 },
    ],
  },
  {
    id: 'heartbeat',
    emoji: '♥',
    title: 'Heartbeat',
    subtitle: 'Two soft pulses with rest',
    steps: [
      { type: 'impact', intensity: 0.35, sharpness: 0.4 },
      { type: 'pause', duration: 120 },
      { type: 'impact', intensity: 0.45, sharpness: 0.35 },
      { type: 'pause', duration: 380 },
    ],
  },
  {
    id: 'triplet',
    emoji: '⚡',
    title: 'Triplet ramp',
    subtitle: 'Three impacts, tighter spacing',
    steps: [
      { type: 'impact', intensity: 0.3, sharpness: 0.9 },
      { type: 'pause', duration: 45 },
      { type: 'impact', intensity: 0.55, sharpness: 0.65 },
      { type: 'pause', duration: 45 },
      { type: 'impact', intensity: 0.85, sharpness: 0.5 },
    ],
  },
  {
    id: 'glass-tap',
    emoji: '◇',
    title: 'Glass taps',
    subtitle: 'High sharpness, low intensity',
    steps: [
      { type: 'impact', intensity: 0.22, sharpness: 0.95 },
      { type: 'pause', duration: 55 },
      { type: 'impact', intensity: 0.28, sharpness: 0.92 },
      { type: 'pause', duration: 55 },
      { type: 'impact', intensity: 0.34, sharpness: 0.88 },
    ],
  },
];

const RHYTHM_DEMOS: readonly {
  emoji: string;
  title: string;
  subtitle: string;
  config: RhythmConfig;
}[] = [
  {
    emoji: '♩',
    title: 'Straight four',
    subtitle: '72 BPM · pulse every beat · 3 s',
    config: { bpm: 72, pattern: [1], duration: 3000 },
  },
  {
    emoji: '♫',
    title: 'Docs groove',
    subtitle: '90 BPM · [1,0,1,1] · 2 s',
    config: { bpm: 90, pattern: [1, 0, 1, 1], duration: 2000 },
  },
  {
    emoji: '♬',
    title: 'Syncopated',
    subtitle: '100 BPM · off-beat accents · 2.5 s',
    config: { bpm: 100, pattern: [0, 1, 0, 1, 1, 0], duration: 2500 },
  },
  {
    emoji: '♪',
    title: 'Double clutch',
    subtitle: '120 BPM · dense pattern · 2 s',
    config: { bpm: 120, pattern: [1, 1, 0, 1], duration: 2000 },
  },
];

export default function App() {
  const topInset =
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 8 : 52;

  const [lastPlayed, setLastPlayed] = useState<string | null>(null);

  const mark = useCallback((label: string, fn: () => Promise<void>) => {
    return async () => {
      setLastPlayed(label);
      await runWithFeedback(label, fn);
    };
  }, []);

  const limitsLines = useMemo(
    () =>
      [
        `maxSequenceSteps · ${LIMITS.maxSequenceSteps}`,
        `maxPauseMsPerStep · ${LIMITS.maxPauseMsPerStep}`,
        `maxRhythmDurationMs · ${LIMITS.maxRhythmDurationMs}`,
        `bpm · ${LIMITS.minBpm} … ${LIMITS.maxBpm}`,
        `maxPatternLength · ${LIMITS.maxPatternLength}`,
        `maxJsonChars · ${LIMITS.maxJsonChars}`,
      ].join('\n'),
    []
  );

  return (
    <View style={[styles.screen, { paddingTop: topInset }]}>
      <StatusBar barStyle="light-content" backgroundColor={palette.bg} />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.heroGlow} />

        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>RN SMART HAPTICS</Text>
          <Text style={styles.heroTitle}>Feel every interaction</Text>
          <Text style={styles.heroBody}>
            Turbo Module · Core Haptics (iOS) · Waveforms (Android). Use a{' '}
            <Text style={styles.heroBold}>physical device</Text> — simulators
            rarely expose full haptics.
          </Text>
          {lastPlayed ? (
            <View style={styles.lastChip}>
              <Text style={styles.lastChipLabel}>Last</Text>
              <Text style={styles.lastChipValue} numberOfLines={1}>
                {lastPlayed}
              </Text>
            </View>
          ) : null}
        </View>

        <Section
          kicker="API · Presets"
          title="Semantic feedback"
          subtitle="Maps to notification-style moments in your product flows."
        >
          <View style={styles.tileGrid}>
            {SEMANTIC_PRESETS.map((p) => (
              <HapticTile
                key={p.key}
                emoji={p.emoji}
                title={p.title}
                caption={p.caption}
                tint={p.tint}
                onPress={mark(p.title, () => Haptics[p.key]())}
              />
            ))}
          </View>
        </Section>

        <Section
          kicker="API · Presets"
          title="Impact spectrum"
          subtitle="Continuous-weight taps — light through rigid."
        >
          <View style={styles.tileGrid}>
            {IMPACT_PRESETS.map((p) => (
              <HapticTile
                key={p.key}
                emoji={p.emoji}
                title={p.title}
                caption={p.caption}
                onPress={mark(p.title, () => Haptics[p.key]())}
              />
            ))}
          </View>
        </Section>

        <Section
          kicker="API · Presets"
          title="Micro-interactions"
          subtitle="Selection changes, double confirms, and ticks."
        >
          <View style={styles.tileGrid}>
            {MICRO_PRESETS.map((p) => (
              <HapticTile
                key={p.key}
                emoji={p.emoji}
                title={p.title}
                caption={p.caption}
                onPress={mark(p.title, () => Haptics[p.key]())}
              />
            ))}
          </View>
        </Section>

        <Section
          kicker="API · playSequence"
          title="Custom sequences"
          subtitle="Compose impacts and pauses — same API as the library docs."
        >
          <View style={styles.stack}>
            {SEQUENCE_DEMOS.map((d) => (
              <WideAction
                key={d.id}
                emoji={d.emoji}
                title={d.title}
                subtitle={d.subtitle}
                onPress={mark(d.title, () => Haptics.playSequence(d.steps))}
              />
            ))}
          </View>
        </Section>

        <Section
          kicker="API · rhythm"
          title="Rhythm patterns"
          subtitle="BPM-driven pulses with repeating binary patterns."
        >
          <View style={styles.stack}>
            {RHYTHM_DEMOS.map((r) => (
              <WideAction
                key={r.title}
                emoji={r.emoji}
                title={r.title}
                subtitle={r.subtitle}
                variant="outline"
                onPress={mark(r.title, () => Haptics.rhythm(r.config))}
              />
            ))}
          </View>
        </Section>

        <Section
          kicker="API · Edge cases"
          title="Validation & limits"
          subtitle="JavaScript throws HapticsValidationError before native calls; native caps apply too."
        >
          <WideAction
            emoji="∅"
            title="Empty sequence (no-op)"
            subtitle="playSequence([]) — silent, native not invoked"
            variant="outline"
            onPress={mark('Empty sequence', async () => {
              await Haptics.playSequence([]);
              Alert.alert(
                'Empty sequence',
                'Resolved immediately — nothing sent to native (by design).'
              );
            })}
          />
          <WideAction
            emoji="✎"
            title="Trigger validation error"
            subtitle="Invalid intensity — inspect error.code in the alert"
            variant="outline"
            onPress={mark('Validation demo', () =>
              Haptics.playSequence([
                { type: 'impact', intensity: 1.5, sharpness: 0.5 },
              ])
            )}
          />
          <View style={styles.limitsCard}>
            <Text style={styles.limitsTitle}>Exported LIMITS</Text>
            <Text selectable style={styles.limitsMono}>
              {limitsLines}
            </Text>
          </View>
        </Section>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            rn-smart-haptics · New Architecture ·{' '}
            <Text style={styles.footerAccent}>yarn example ios | android</Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  heroGlow: {
    position: 'absolute',
    top: -80,
    alignSelf: 'center',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: palette.accentDim,
    opacity: 0.55,
  },
  hero: {
    marginBottom: 28,
  },
  heroEyebrow: {
    color: palette.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 10,
  },
  heroTitle: {
    color: palette.text,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 38,
    marginBottom: 12,
  },
  heroBody: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  heroBold: {
    color: palette.text,
    fontWeight: '600',
  },
  lastChip: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: palette.bgCard,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    maxWidth: '100%',
  },
  lastChipLabel: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  lastChipValue: {
    color: palette.accent,
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
  section: {
    marginBottom: 28,
  },
  sectionKicker: {
    color: palette.magenta,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  sectionSubtitle: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tile: {
    flexGrow: 1,
    flexBasis: '47%',
    minWidth: 148,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: palette.bgCard,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tilePressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  tileEmoji: {
    fontSize: 22,
    marginBottom: 8,
    color: palette.text,
  },
  tileTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  tileCaption: {
    color: palette.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  stack: {
    gap: 10,
  },
  wideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 12,
  },
  wideBtnFilled: {
    backgroundColor: palette.bgCard,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
  },
  wideBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(94,234,212,0.35)',
  },
  wideBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  wideEmoji: {
    fontSize: 22,
  },
  wideTextWrap: {
    flex: 1,
  },
  wideTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '700',
  },
  wideSubtitle: {
    color: palette.textMuted,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  wideChevron: {
    color: palette.textMuted,
    fontSize: 18,
    fontWeight: '300',
  },
  limitsCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: palette.bgElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
  },
  limitsTitle: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  limitsMono: {
    color: palette.accent,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
  footer: {
    marginTop: 8,
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    color: palette.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerAccent: {
    color: palette.accent,
    fontWeight: '600',
  },
});
