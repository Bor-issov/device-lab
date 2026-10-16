import { router } from 'expo-router';
import { Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/action-button';

export default function Details() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 600;

  return (
    <View className="flex-1 gap-5 bg-paper px-5 dark:bg-ink" style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom }}>
      <Text className="text-4xl font-bold text-ink dark:text-paper">Details</Text>
      <View className={wide ? 'flex-row gap-4' : 'gap-4'}>
        <View className="flex-1 rounded-2xl bg-ink/5 p-5 dark:bg-paper/5">
          <Text className="text-ink dark:text-paper">{wide ? 'Two columns at 600+ wide' : 'One column below 600 wide'}</Text>
        </View>
        <View className="flex-1 rounded-2xl bg-ink/5 p-5 dark:bg-paper/5">
          <Text className="text-ink dark:text-paper">Turn on Sync nav in the Lab and every device follows this route.</Text>
        </View>
      </View>
      <ActionButton label="Back" tone="quiet" onPress={() => router.back()} />
    </View>
  );
}
