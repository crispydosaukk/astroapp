/**
 * TabBar + TabBarView equivalents.
 * - TabBar: animated indicator that slides between tabs (Material ~300 ms ease).
 * - TabPager: horizontally swipeable pages synced with the bar (TabBarView).
 */
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleProp, View, ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Text } from '@/components/Text';
import { ralewayFamily } from '@/theme/fonts';

export function TabBar({
  tabs, index, onChange, indicatorColor, labelColor, unselectedLabelColor, fontSize = 12, fontWeight = '700',
  style, indicatorRadius = 10, indicatorStyle = 'pill', height = 46, testIDPrefix = 'tabs', inset = 0,
}: {
  tabs: string[]; index: number; onChange: (i: number) => void; indicatorColor: string; labelColor: string; unselectedLabelColor: string;
  fontSize?: number; fontWeight?: '500' | '600' | '700'; style?: StyleProp<ViewStyle>; indicatorRadius?: number;
  indicatorStyle?: 'pill' | 'underline'; height?: number; testIDPrefix?: string; inset?: number;
}) {
  const [w, setW] = useState(0);
  const x = useSharedValue(0);
  const tabW = w / tabs.length;
  useEffect(() => { x.value = withTiming(index * tabW, { duration: 300, easing: Easing.out(Easing.cubic) }); }, [index, tabW, x]);
  const ind = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <View style={[{ height, flexDirection: 'row' }, style]} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            indicatorStyle === 'pill'
              ? { position: 'absolute', top: inset, bottom: inset, left: inset, width: tabW - inset * 2, borderRadius: indicatorRadius, backgroundColor: indicatorColor }
              : { position: 'absolute', bottom: 0, left: 0, width: tabW, height: 2, backgroundColor: indicatorColor },
            ind,
          ]}
        />
      ) : null}
      {tabs.map((t, i) => (
        <Pressable key={t} testID={`${testIDPrefix}.${i}`} onPress={() => onChange(i)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text
            style={{
              color: i === index ? labelColor : unselectedLabelColor, fontSize, fontFamily: ralewayFamily(fontWeight),
            }}
          >
            {t}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function TabPager({ index, onChange, children, height }: { index: number; onChange: (i: number) => void; children: React.ReactNode[]; height?: number }) {
  const ref = useRef<ScrollView>(null);
  const [w, setW] = useState(0);
  useEffect(() => { if (w > 0) ref.current?.scrollTo({ x: index * w, animated: true }); }, [index, w]);
  return (
    <View style={{ height, flex: height ? undefined : 1 }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w > 0 ? (
        <ScrollView
          ref={ref}
          horizontal
          style={{ flex: 1 }}
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const i = Math.round(e.nativeEvent.contentOffset.x / w);
            if (i !== index) onChange(i);
          }}
        >
          {children.map((c, i) => <View key={i} style={{ width: w, height: height ?? '100%' }}>{c}</View>)}
        </ScrollView>
      ) : null}
    </View>
  );
}
