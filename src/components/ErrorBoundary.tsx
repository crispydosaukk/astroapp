/**
 * Port of lib/widgets/custom_error_widget.dart + the ErrorWidget.builder hook in main.dart.
 * Flutter showed this once, then suppressed further error widgets for 5 s.
 */
import { router } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppImage } from './AppImage';
import { AppIcon } from './AppIcon';
import { Text } from './Text';

export function CustomErrorWidget({ onBack }: { onBack: () => void }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <AppImage uri={require('../../assets/images/sad_face.svg')} width={42} height={42} fit="contain" />
        <Text style={{ marginTop: 8, fontSize: 24, fontWeight: '500', color: '#262626' }}>Something went wrong</Text>
        <Text style={{ marginTop: 4, fontSize: 16, color: '#525252', textAlign: 'center' }}>
          We encountered an unexpected error while processing your request.
        </Text>
        <Pressable
          testID="error.back"
          onPress={onBack}
          style={{ marginTop: 24, flexDirection: 'row', alignItems: 'center', backgroundColor: '#713B32', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }}
        >
          <AppIcon name="arrow_back" size={18} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', marginLeft: 8, fontWeight: '500' }}>Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    console.warn('[AppErrorBoundary]', error);
  }
  private back = () => {
    this.setState({ error: null });
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };
  render() {
    if (this.state.error) return <CustomErrorWidget onBack={this.back} />;
    return this.props.children;
  }
}
