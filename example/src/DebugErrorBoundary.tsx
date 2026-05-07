import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

type Props = { children: ReactNode };

type State = { error: Error | null };

/**
 * Surfaces render-time failures on-screen (avoids a totally blank UI when Metro/Xcode are easy to miss).
 */
export class DebugErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[example] render error', error.message, info.componentStack);
  }

  override render(): ReactNode {
    const { error } = this.state;
    if (error != null) {
      const body = error.stack ?? String(error);
      return (
        <View style={styles.wrap}>
          <Text style={styles.title}>Example crashed while rendering</Text>
          <Text style={styles.hint}>
            Metro terminal shows JS logs; Xcode console shows native logs (open
            the .xcworkspace and Run ▶).
          </Text>
          <ScrollView style={styles.scroll}>
            <Text selectable style={styles.mono}>
              {body}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingTop: 56,
    paddingHorizontal: 16,
    backgroundColor: '#0b0b10',
  },
  title: {
    color: '#fb7185',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  hint: {
    color: 'rgba(244,244,248,0.65)',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  scroll: { flex: 1 },
  mono: {
    color: '#a7f3d0',
    fontSize: 11,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
});
