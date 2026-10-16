import { Pressable, Text, type PressableProps } from 'react-native';

type Props = PressableProps & { label: string; tone?: 'signal' | 'quiet' };

export function ActionButton({ label, tone = 'signal', ...props }: Props) {
  return (
    <Pressable
      {...props}
      className={tone === 'signal' ? 'items-center rounded-2xl bg-signal px-5 py-3.5' : 'items-center rounded-2xl bg-ink/10 px-5 py-3.5 dark:bg-paper/10'}
    >
      <Text className={tone === 'signal' ? 'font-semibold text-ink' : 'font-semibold text-ink dark:text-paper'}>{label}</Text>
    </Pressable>
  );
}
