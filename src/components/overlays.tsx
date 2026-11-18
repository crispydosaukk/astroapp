/**
 * Overlay primitives replacing Flutter's showModalBottomSheet, showDialog, PopupMenuButton and SnackBar.
 * Rendered via a root OverlayHost instead of stacked RN <Modal>s to prevent iOS UIKit modal collisions and hangs.
 */
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Dimensions,
  Easing,
  Keyboard,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text as RNText,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';
import { AppColors } from '@/theme/colors';
import { ralewayFamily } from '@/theme/fonts';
import { useThemeColors } from '@/theme/themeStore';
import { AppIcon } from './AppIcon';
import { Text } from './Text';

const SCREEN_H = Dimensions.get('window').height;

/* ----------------------------------------------------------- Root Overlay Portal */
type PortalEntry = { id: string; node: React.ReactNode };
const portalListeners = new Set<() => void>();
let portalEntries: PortalEntry[] = [];

function notifyPortals() {
  portalListeners.forEach((fn) => fn());
}

function upsertPortal(id: string, node: React.ReactNode) {
  const idx = portalEntries.findIndex((e) => e.id === id);
  if (idx >= 0) {
    portalEntries = portalEntries.map((e, i) => (i === idx ? { id, node } : e));
  } else {
    portalEntries = [...portalEntries, { id, node }];
  }
  notifyPortals();
}

function removePortal(id: string) {
  if (!portalEntries.some((e) => e.id === id)) return;
  portalEntries = portalEntries.filter((e) => e.id !== id);
  notifyPortals();
}

/** Mount once at root (after <Stack />) so all sheets, dialogs, and popup menus stack cleanly without iOS <Modal> deadlocks. */
export function OverlayHost() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const listener = () => forceUpdate((n) => n + 1);
    portalListeners.add(listener);
    return () => {
      portalListeners.delete(listener);
    };
  }, []);

  if (portalEntries.length === 0) return null;

  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}>
      {portalEntries.map((entry) => (
        <React.Fragment key={entry.id}>{entry.node}</React.Fragment>
      ))}
    </View>
  );
}

function PortalOverlayContent({
  onRequestClose,
  children,
}: {
  onRequestClose?: () => void;
  children: React.ReactNode;
}) {
  const onCloseRef = useRef(onRequestClose);
  onCloseRef.current = onRequestClose;

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onCloseRef.current) {
        onCloseRef.current();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, []);

  return <View style={StyleSheet.absoluteFill}>{children}</View>;
}

/** Full-screen portal overlay replacing native <Modal> when sheets/dialogs need to open inside it on iOS. */
export function PortalOverlay({
  visible,
  onRequestClose,
  children,
}: {
  visible: boolean;
  onRequestClose?: () => void;
  children: React.ReactNode;
}) {
  const id = useId();

  useEffect(() => {
    if (visible) {
      upsertPortal(id, <PortalOverlayContent onRequestClose={onRequestClose}>{children}</PortalOverlayContent>);
    } else {
      removePortal(id);
    }
  });

  useEffect(() => () => removePortal(id), [id]);

  return null;
}

/* ------------------------------------------------------------------ BottomSheet */
type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  maxHeightRatio?: number;
  backgroundColor?: string;
  testID?: string;
};

function BottomSheetContent({
  visible,
  onClose,
  children,
  style,
  maxHeightRatio = 0.9,
  backgroundColor = 'transparent',
  testID,
  onExited,
}: BottomSheetProps & { onExited: () => void }) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const insets = useSafeAreaInsets();
  const { height: windowH } = useWindowDimensions();
  const y = useRef(new Animated.Value(windowH || SCREEN_H)).current;
  const barrier = useRef(new Animated.Value(0)).current;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const onExitedRef = useRef(onExited);
  onExitedRef.current = onExited;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => {
      const h = e.endCoordinates.height;
      setKeyboardHeight((prev) => (prev === h ? prev : h));
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight((prev) => (prev === 0 ? prev : 0));
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onCloseRef.current();
      return true;
    });
    return () => sub.remove();
  }, [visible]);

  useEffect(() => {
    const h = windowH || SCREEN_H;
    if (visible) {
      const anim = Animated.parallel([
        Animated.timing(y, { toValue: 0, duration: 250, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(barrier, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]);
      anim.start();
      return () => anim.stop();
    }

    Keyboard.dismiss();
    let finished = false;
    const finishExit = () => {
      if (finished) return;
      finished = true;
      onExitedRef.current();
    };

    const anim = Animated.parallel([
      Animated.timing(barrier, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(y, { toValue: h, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]);
    anim.start(({ finished: ok }) => {
      if (ok) finishExit();
    });
    const timer = setTimeout(finishExit, 240);
    return () => {
      finished = true;
      clearTimeout(timer);
      anim.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const currentWindowH = windowH || SCREEN_H;
  const screenH = Dimensions.get('screen').height;
  const topSafe = insets.top > 0 ? insets.top : 24;

  // Detect whether Android OS has already resized the window for the keyboard (adjustResize)
  const isAndroidWindowResized = Platform.OS === 'android' && currentWindowH < screenH - 120;

  // Bottom padding to lift the sheet cleanly above the keyboard without native KeyboardAvoidingView teardown issues
  const bottomPad = Platform.OS === 'ios'
    ? keyboardHeight
    : (isAndroidWindowResized ? 0 : keyboardHeight);

  // Available height calculation:
  // If Android OS already resized the window, currentWindowH is ALREADY the space above the keyboard.
  // Never subtract keyboardHeight again, otherwise it gets double-deducted and crushes the sheet.
  const heightAboveKeyboard = isAndroidWindowResized
    ? currentWindowH
    : Math.max(300, currentWindowH - (keyboardHeight > 0 ? keyboardHeight : 0));

  const effectiveRatio = keyboardHeight > 0 ? 0.98 : maxHeightRatio;
  const maxAvailableH = Math.max(300, heightAboveKeyboard - topSafe - 8);
  const availableHeight = Math.min(Math.floor(heightAboveKeyboard * effectiveRatio), maxAvailableH);

  return (
    <View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end', paddingBottom: bottomPad }]}
    >
      <Animated.View
        style={[
          { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.54)', opacity: barrier },
        ]}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} testID={testID ? `${testID}.barrier` : undefined} />
      </Animated.View>
      <Animated.View
        testID={testID}
        style={[
          {
            width: '100%',
            maxHeight: availableHeight,
            backgroundColor,
            overflow: 'hidden',
            transform: [{ translateY: y }],
          },
          style,
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

/**
 * showModalBottomSheet equivalent. Slides up over 250 ms (Material default), barrier tap dismisses.
 * `maxHeightRatio` mirrors isScrollControlled + constraints used in the source.
 */
export function BottomSheet(props: BottomSheetProps) {
  const id = useId();
  const [alive, setAlive] = useState(props.visible);

  const handleExited = useCallback(() => {
    removePortal(id);
    setAlive(false);
  }, [id]);

  useEffect(() => {
    if (props.visible) setAlive(true);
  }, [props.visible]);

  useEffect(() => {
    if (props.visible || alive) {
      upsertPortal(id, <BottomSheetContent {...props} onExited={handleExited} />);
    } else {
      removePortal(id);
    }
  });

  useEffect(() => () => removePortal(id), [id]);

  return null;
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
          flexShrink: 1, overflow: 'hidden',
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
function DialogContent({
  onClose,
  children,
  barrierDismissible = true,
  style,
  testID,
}: {
  onClose: () => void;
  children: React.ReactNode;
  barrierDismissible?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const colors = useThemeColors();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (barrierDismissible) onCloseRef.current();
      return true;
    });
    return () => sub.remove();
  }, [barrierDismissible]);

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 24 },
      ]}
    >
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={barrierDismissible ? onClose : undefined}
      />
      <View
        testID={testID}
        style={[{ width: '100%', maxWidth: 420, backgroundColor: colors.surface, borderRadius: 24, padding: 24, borderWidth: 1.5, borderColor: colors.cardBorder, elevation: 25, zIndex: 10 }, style]}
      >
        {children}
      </View>
    </View>
  );
}

/** showDialog equivalent — barrier dismissible by default, rendered via OverlayHost. */
export function Dialog({
  visible, onClose, children, barrierDismissible = true, style, testID,
}: { visible: boolean; onClose: () => void; children: React.ReactNode; barrierDismissible?: boolean; style?: StyleProp<ViewStyle>; testID?: string }) {
  const id = useId();

  useEffect(() => {
    if (visible) {
      upsertPortal(
        id,
        <DialogContent onClose={onClose} barrierDismissible={barrierDismissible} style={style} testID={testID}>
          {children}
        </DialogContent>,
      );
    } else {
      removePortal(id);
    }
  });

  useEffect(() => () => removePortal(id), [id]);

  return null;
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
  const o = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) return;
    o.setValue(0);
    const showAnim = Animated.timing(o, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    showAnim.start();

    let hideAnim: Animated.CompositeAnimation | null = null;
    const t = setTimeout(() => {
      hideAnim = Animated.timing(o, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      });
      hideAnim.start(({ finished }) => {
        if (finished) hide();
      });
    }, 4000);
    return () => {
      clearTimeout(t);
      showAnim.stop();
      hideAnim?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!message) return null;

  const translateY = o.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });
  const scale = o.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });
  const st = {
    opacity: o,
    transform: [{ translateY }, { scale }],
  };

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
function PopupMenuOverlay<T extends string>({
  pos,
  items,
  menuColor,
  testID,
  onDismiss,
  onSelect,
}: {
  pos: { x: number; y: number };
  items: { value: T; label: string; color?: string }[];
  menuColor?: string;
  testID?: string;
  onDismiss: () => void;
  onSelect: (v: T) => void;
}) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onDismissRef.current();
      return true;
    });
    return () => sub.remove();
  }, []);

  const estMenuH = items.length * 48 + 16;
  const clampedTop = Math.max(insets.top + 8, Math.min(pos.y - 40, screenH - insets.bottom - estMenuH - 8));

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
      <View
        style={{
          position: 'absolute',
          top: clampedTop,
          right: Math.max(8, screenW - pos.x),
          minWidth: 170,
          paddingVertical: 8,
          borderRadius: 14,
          backgroundColor: menuColor ?? colors.surface,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
        }}
      >
        {items.map((it) => (
          <Pressable
            key={it.value}
            testID={testID ? `${testID}.${it.value}` : undefined}
            onPress={() => onSelect(it.value)}
            style={({ pressed }) => ({
              paddingHorizontal: 16,
              height: 48,
              justifyContent: 'center',
              backgroundColor: pressed ? 'rgba(201,168,76,0.12)' : 'transparent',
            })}
          >
            <Text style={{ color: it.color ?? colors.textPrimary, fontSize: 14 }}>{it.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/** PopupMenuButton equivalent: icon button that opens an anchored menu (Material 3 surface, radius 14). */
export function PopupMenu<T extends string>({
  items, onSelected, icon = 'more_vert_rounded', iconColor, iconSize = 20, testID, menuColor,
}: {
  items: { value: T; label: string; color?: string }[]; onSelected: (v: T) => void; icon?: string; iconColor?: string;
  iconSize?: number; testID?: string; menuColor?: string;
}) {
  const colors = useThemeColors();
  const id = useId();
  const ref = React.useRef<View>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const open = () => ref.current?.measureInWindow((x, y, w, h) => setPos({ x: x + w, y: y + h }));

  useEffect(() => {
    if (pos) {
      upsertPortal(
        id,
        <PopupMenuOverlay
          pos={pos}
          items={items}
          menuColor={menuColor}
          testID={testID}
          onDismiss={() => setPos(null)}
          onSelect={(v) => {
            setPos(null);
            removePortal(id);
            onSelected(v);
          }}
        />,
      );
    } else {
      removePortal(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, pos]);

  useEffect(() => () => removePortal(id), [id]);

  return (
    <Pressable ref={ref} testID={testID} onPress={open} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
      <AppIcon name={icon} color={iconColor ?? colors.textMuted} size={iconSize} />
    </Pressable>
  );
}
