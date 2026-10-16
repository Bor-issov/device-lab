import { Link } from 'expo-router';
import { useEffect } from 'react';
import { PixelRatio, Platform, ScrollView, Text, View, useColorScheme, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/action-button';

// Every row reads a value the Device Lab bridge controls, so a wrong value points at a bridge gap.
export default function BridgeCheck() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const { width, height } = useWindowDimensions();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.cubic) }), -1, true);
  }, [progress]);

  const bar = useAnimatedStyle(() => ({ width: `${20 + progress.value * 80}%` }));

  const rows: [string, string][] = [
    ['Platform.OS', Platform.OS],
    ['Platform.select', Platform.select({ ios: 'ios branch', android: 'android branch', default: 'default branch' })],
    ['useColorScheme', String(scheme)],
    ['Window', `${Math.round(width)} × ${Math.round(height)}`],
    ['Safe area', `${insets.top} ${insets.right} ${insets.bottom} ${insets.left}`],
    ['Font scale', String(PixelRatio.getFontScale())],
  ];

  return (
    <View
      className="flex-1 bg-paper dark:bg-ink"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }}
    >
      <ScrollView>
        <View className="gap-5 px-5 pb-8">
          <Text className="pt-2 text-4xl font-bold text-ink dark:text-paper">Bridge check</Text>

          <View className="overflow-hidden rounded-2xl bg-ink/5 dark:bg-paper/5">
            {rows.map(([label, value]) => (
              <View key={label} className="flex-row items-center justify-between px-4 py-3">
                <Text className="text-ink/60 dark:text-paper/60">{label}</Text>
                <Text className="font-semibold text-ink dark:text-paper">{value}</Text>
              </View>
            ))}
          </View>

          <View className="gap-2">
            <Text className="text-sm text-ink/60 dark:text-paper/60">Reanimated</Text>
            <View className="h-2 overflow-hidden rounded-full bg-ink/10 dark:bg-paper/10">
              <Animated.View style={[{ height: '100%', borderRadius: 999, backgroundColor: '#ecf94d' }, bar]} />
            </View>
          </View>

          <ActionButton label="Send test error" onPress={() => console.error(new Error(`Test error from ${Platform.OS} at ${Math.round(width)}w`))} />

          <Link href="/details" asChild>
            <ActionButton label="Open details" tone="quiet" />
          </Link>
        </View>
      </ScrollView>
    </View>
  );
}
