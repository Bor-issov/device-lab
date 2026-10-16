import '../global.css';

import { PreviewBridge } from '@device-lab/preview-bridge';
import { Stack, router, type Href } from 'expo-router';

export default function RootLayout() {
  return (
    <PreviewBridge onNavigate={(path) => router.push(path as Href)}>
      <Stack screenOptions={{ headerShown: false }} />
    </PreviewBridge>
  );
}
