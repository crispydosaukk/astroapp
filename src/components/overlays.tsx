/**
 * Modal primitives replacing Flutter's showModalBottomSheet, showDialog and ScaffoldMessenger SnackBar.
 */
import React, { useEffect, useState } from 'react';
import { Dimensions, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, StyleProp, Text as RNText, View, ViewStyle } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';
import { AppColors } from '@/theme/colors';
import { ralewayFamily } from '@/theme/fonts';
import { useThemeColors } from '@/theme/themeStore';
import { AppIcon } from './AppIcon';
import { Text } from './Text';

const SCREEN_H = Dimensions.get('window').height;

/* ------------------------------------------------------------------ BottomSheet */
/**
 * showModalBottomSheet equivalent. Slides up over 250 ms (Material default), barrier tap dismisses.
 * `maxHeightRatio` mirrors isScrollControlled + constraints used in the source.
 */
export function BottomSheet({
  visible, onClose, children, style, maxHeightRatio = 0.9, backgroundColor = 'transparent', testID,
}: {
  visible: boolean; onClose: () => void; children: React.ReactNode; style?: StyleProp<ViewStyle>;
  maxHeightRatio?: number; backgroundColor?: string; testID?: string;
}) {
  const [mounted, setMounted] = useState(visible);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const insets = useSafeAreaInsets();
  const y = useSharedValue(SCREEN_H);
  const barrier = useSharedValue(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      y.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) });
      barrier.value = withTiming(1, { duration: 250 });
    } else if (mounted) {
      barrier.value = withTiming(0, { duration: 200 });
      y.value = withTiming(SCREEN_H, { duration: 200, easing: Easing.in(Easing.cubic) }, (f) => {
        if (f) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const barrierStyle = useAnimatedStyle(() => ({ opacity: barrier.value }));

  if (!mounted) return null;

  const topSafe = insets.top > 0 ? insets.top : 24;
  const maxAvailableH = SCREEN_H - topSafe - (Platform.OS === 'android' ? keyboardHeight : 0) - 16;
  const calculatedMaxHeight = Math.max(200, Math.min(SCREEN_H * maxHeightRatio, maxAvailableH));

  return (
    <Modal transparent visible statusBarTranslucent animationType="none" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          paddingBottom: Platform.OS === 'android' ? keyboardHeight : 0,
        }}
      >
        <Animated.View
          style={[
            { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.54)' },
            barrierStyle,
          ]}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} testID={testID ? `${testID}.barrier` : undefined} />
        </Animated.View>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ width: '100%', justifyContent: 'flex-end' }}
        >
          <Animated.View
            testID={testID}
            style={[
              {
                width: '100%',
                maxHeight: calculatedMaxHeight,
                backgroundColor,
              },
              sheetStyle,
              style,
            ]}
          >
            {children}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

/** Standard sheet container used by most source sheets: surface, top radius 28, drag handle. */
export function SheetContainer({ children, style, handle = true, radius = 28 }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; handle?: boolean; radius?: number }) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface, borderTopLeftRadius: radius, borderTopRightRadius: radius,
          borderWidth: 1, borderBottomWidth: 0, borderColor: colors.cardBorder, paddingBottom: insets.bottom,
        },
        style,
      ]}
    >
      {handle ? (
        <View style={{ alignItems: 'center', paddingTop: 12 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.divider }} />
        </View>
      ) : null}
      {children}
    </View>
  );
}

/* ----------------------------------------------------------------------- Dialog */
/** showDialog equivalent — fades + scales in, barrier dismissible by default. */
export function Dialog({
  visible, onClose, children, barrierDismissible = true, style, testID,
}: { visible: boolean; onClose: () => void; children: React.ReactNode; barrierDismissible?: boolean; style?: StyleProp<ViewStyle>; testID?: string }) {
  const colors = useThemeColors();
  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent onRequestClose={barrierDismissible ? onClose : () => {}}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Pressable
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={barrierDismissible ? onClose : undefined}
        />
        <View
          testID={testID}
          style={[{ width: '100%', maxWidth: 420, backgroundColor: colors.surface, borderRadius: 24, padding: 24, borderWidth: 1.5, borderColor: colors.cardBorder, elevation: 25, zIndex: 10 }, style]}
        >
          {children}
        </View>
      </View>
    </Modal>
  );
}

/* --------------------------------------------------------------------- Snackbar */
type SnackState = {
  message: string | null;
  bg?: string;
  key: number;
  show: (m: string, bg?: string) => void;
  hide: () => void;
};

export const useSnackbar = create<SnackState>((set) => ({
  message: null,
  bg: undefined,
  key: 0,
  show: (message, bg) => set((s) => ({ message, bg, key: s.key + 1 })),
  hide: () => set({ message: null }),
}));

export const showSnackBar = (m: string, bg?: string) => useSnackbar.getState().show(m, bg);

/** Mount once at the root. Floating high-contrast SnackBar, crystal clear text & premium styling. */
export function SnackbarHost() {
  const { message, bg, key, hide } = useSnackbar();
  const insets = useSafeAreaInsets();
  const o = useSharedValue(0);

  useEffect(() => {
    if (!message) return;
    o.value = withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) });
    const t = setTimeout(() => {
      o.value = withTiming(0, { duration: 220, easing: Easing.in(Easing.cubic) }, (f) => {
        if (f) runOnJS(hide)();
      });
    }, 4000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const st = useAnimatedStyle(() => ({
    opacity: o.value,
    transform: [
      { translateY: (1 - o.value) * 14 },
      { scale: 0.96 + o.value * 0.04 },
    ],
  }));

  if (!message) return null;

  // Determine intent (error, success, info/guest)
  const isError = bg === '#CF4444' || bg === '#EF4444' || /error|failed|invalid|declined/i.test(message);
  const isSuccess = bg === '#075E54' || bg === '#2D9E6B' || /success|purchased|verified|added|saved|completed/i.test(message);

  let containerBg = '#0B132B'; // Deep obsidian midnight with maximum contrast
  let borderColor = '#C9A84C'; // Sacred Gold border
  let iconName = 'auto_awesome';
  let iconColor = '#FFD700';
  let iconBg = 'rgba(201, 168, 76, 0.22)';

  if (isError) {
    containerBg = '#22080B';
    borderColor = '#FF5252';
    iconName = 'error_outline';
    iconColor = '#FF6B6B';
    iconBg = 'rgba(255, 82, 82, 0.22)';
  } else if (isSuccess) {
    containerBg = '#052317';
    borderColor = '#34D399';
    iconName = 'check_circle';
    iconColor = '#4ADE80';
    iconBg = 'rgba(52, 211, 153, 0.22)';
  } else if (bg && bg !== AppColors.surfaceVariantDark) {
    containerBg = bg;
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: insets.bottom + 90,
          backgroundColor: containerBg,
          borderRadius: 16,
          borderWidth: 1.5,
          borderColor: borderColor,
          paddingHorizontal: 16,
          paddingVertical: 14,
          flexDirection: 'row',
          alignItems: 'center',
          elevation: 25,
          zIndex: 999999,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.5,
          shadowRadius: 12,
        },
        st,
      ]}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: iconBg,
          borderWidth: 1,
          borderColor: borderColor,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <AppIcon name={iconName} size={18} color={iconColor} />
      </View>
      <RNText
        allowFontScaling={false}
        style={{
          flex: 1,
          color: '#FFFFFF',
          fontSize: 14.5,
          fontFamily: ralewayFamily(700),
          fontWeight: '700',
          letterSpacing: 0.25,
          lineHeight: 20,
        }}
      >
        {message}
      </RNText>
    </Animated.View>
  );
}

/** Sheet payload state that survives the close animation (payload kept until next open). */
export function useSheet<T>() {
  const [state, setState] = useState<{ visible: boolean; value: T | null }>({ visible: false, value: null });
  return {
    visible: state.visible,
    value: state.value,
    open: (value: T) => setState({ visible: true, value }),
    close: () => setState((s) => ({ ...s, visible: false })),
  };
}

/* -------------------------------------------------------------------- PopupMenu */
/** PopupMenuButton equivalent: icon button that opens an anchored menu (Material 3 surface, radius 14). */
export function PopupMenu<T extends string>({
  items, onSelected, icon = 'more_vert_rounded', iconColor, iconSize = 20, testID, menuColor,
}: {
  items: Array<{ value: T; label: string; color?: string }>; onSelected: (v: T) => void; icon?: string; iconColor?: string;
  iconSize?: number; testID?: string; menuColor?: string;
}) {
  const colors = useThemeColors();
  const ref = React.useRef<View>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const open = () => ref.current?.measureInWindow((x, y, w, h) => setPos({ x: x + w, y: y + h }));
  const screenW = Dimensions.get('window').width;
  return (
    <>
      <Pressable ref={ref} testID={testID} onPress={open} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
        <AppIcon name={icon} color={iconColor ?? colors.textMuted} size={iconSize} />
      </Pressable>
      <Modal transparent visible={!!pos} animationType="fade" onRequestClose={() => setPos(null)}>
        <Pressable style={{ flex: 1 }} onPress={() => setPos(null)}>
          {pos ? (
            <View style={{ position: 'absolute', top: pos.y - 40, right: Math.max(8, screenW - pos.x), minWidth: 160, paddingVertical: 8, borderRadius: 14, backgroundColor: menuColor ?? colors.surface, borderWidth: 1, borderColor: colors.cardBorder, elevation: 8, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10 }}>
              {items.map((it) => (
                <Pressable
                  key={it.value}
                  testID={testID ? `${testID}.${it.value}` : undefined}
                  onPress={() => { setPos(null); onSelected(it.value); }}
                  style={{ paddingHorizontal: 16, height: 48, justifyContent: 'center' }}
                >
                  <Text style={{ color: it.color ?? colors.textPrimary, fontSize: 14 }}>{it.label}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </Pressable>
      </Modal>
    </>
  );
}
