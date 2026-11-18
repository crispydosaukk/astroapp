/**
 * showDatePicker / showTimePicker equivalents (dark theme, gold primary like the Flutter builder override).
 * Android: native dialogs via DateTimePickerAndroid (unchanged).
 * iOS/web: root overlay (no <Modal>). Date uses the native inline calendar; time uses a pure-JS wheel
 * (Hour / Minute / AM-PM) because the native iOS spinner drops onChange events on the New Architecture
 * (wheel only moves 12 <-> 1 and the selected time is never saved).
 * Usage: const d = await pickDate({ value, minimumDate, maximumDate });
 *        const t = await pickTime({ value });
 */
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import React, { useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { create } from 'zustand';
import { withAlpha } from '@/theme/colors';
import { useThemeColors } from '@/theme/themeStore';
import { Text } from './Text';

type Req = {
  id: number;
  mode: 'date' | 'time';
  value: Date;
  min?: Date;
  max?: Date;
  title?: string;
  resolve: (d: Date | null) => void;
};
const usePicker = create<{ req: Req | null; set: (r: Req | null) => void }>((set) => ({ req: null, set: (req) => set({ req }) }));
let nextPickerId = 1;

function toValidDate(d: Date | undefined, fallback: Date): Date {
  return d instanceof Date && !isNaN(d.getTime()) ? d : fallback;
}

function clampDate(value: Date, min?: Date, max?: Date): Date {
  let ts = value.getTime();
  if (min && ts < min.getTime()) ts = min.getTime();
  if (max && ts > max.getTime()) ts = max.getTime();
  return new Date(ts);
}

function open(mode: 'date' | 'time', value: Date, min?: Date, max?: Date, title?: string): Promise<Date | null> {
  Keyboard.dismiss();
  const fallback = mode === 'date' ? new Date(1995, 9, 15) : new Date(2000, 0, 1, 12, 0);
  const safeMin = mode === 'date' && min instanceof Date && !isNaN(min.getTime()) ? min : undefined;
  const safeMax = mode === 'date' && max instanceof Date && !isNaN(max.getTime()) ? max : undefined;
  const rawValue = toValidDate(value, fallback);
  const safeValue = mode === 'date' ? clampDate(rawValue, safeMin, safeMax) : rawValue;

  return new Promise((resolve) => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: safeValue, mode, minimumDate: safeMin, maximumDate: safeMax, is24Hour: false,
        onChange: (e, d) => resolve(e.type === 'set' && d ? d : null),
      });
      return;
    }
    const prev = usePicker.getState().req;
    if (prev) prev.resolve(null);
    usePicker.getState().set({ id: nextPickerId++, mode, value: safeValue, min: safeMin, max: safeMax, title, resolve });
  });
}

export const pickDate = (o: { value: Date; minimumDate?: Date; maximumDate?: Date; title?: string }) =>
  open('date', o.value, o.minimumDate, o.maximumDate, o.title);
export const pickTime = (o: { value: Date; title?: string }) => open('time', o.value, undefined, undefined, o.title);

function formatPickerPreview(mode: 'date' | 'time', d: Date): string {
  if (mode === 'time') return formatTimeOfDay(d);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/* ---------------------------------------------------------------- JS time wheel */
const ITEM_H = 44;
const VISIBLE_ROWS = 5;
const PAD_ROWS = Math.floor(VISIBLE_ROWS / 2);

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1)); // index 0 -> "1" ... index 11 -> "12"
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

function WheelColumn({
  items,
  index,
  onChange,
  width,
  testID,
}: {
  items: string[];
  index: number;
  onChange: (i: number) => void;
  width: number;
  testID?: string;
}) {
  const colors = useThemeColors();
  const ref = useRef<ScrollView>(null);
  const [wheelHeight, setWheelHeight] = useState(ITEM_H * VISIBLE_ROWS);
  const initialOffset = useRef({ x: 0, y: index * ITEM_H }).current;
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapLockRef = useRef(false);
  const readyRef = useRef(false);
  const indexRef = useRef(index);
  indexRef.current = index;

  const topPad = ITEM_H * PAD_ROWS;
  // Ensure the last item can always scroll up to the center selection row regardless of viewport height.
  const bottomPad = Math.max(ITEM_H * PAD_ROWS, wheelHeight - topPad - ITEM_H);

  // Initial position (iOS honours contentOffset; scrollTo covers Android/web).
  useEffect(() => {
    const t = setTimeout(() => {
      ref.current?.scrollTo({ y: indexRef.current * ITEM_H, animated: false });
      readyRef.current = true;
    }, 20);
    return () => {
      clearTimeout(t);
      if (settleTimer.current) clearTimeout(settleTimer.current);
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    };
  }, []);

  const clampIdx = (y: number) => Math.max(0, Math.min(items.length - 1, Math.round(y / ITEM_H)));

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!readyRef.current || tapLockRef.current) return;
    const i = clampIdx(e.nativeEvent.contentOffset.y);
    if (i !== indexRef.current) onChange(i);
  };

  const settle = (y: number) => {
    const i = clampIdx(y);
    if (i !== indexRef.current) {
      indexRef.current = i;
      onChange(i);
    }
    ref.current?.scrollTo({ y: i * ITEM_H, animated: true });
  };

  const onScrollBeginDrag = () => {
    tapLockRef.current = false;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    if (settleTimer.current) clearTimeout(settleTimer.current);
  };

  const onDragEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    if (settleTimer.current) clearTimeout(settleTimer.current);
    // If no momentum follows the drag, settle on the nearest row.
    settleTimer.current = setTimeout(() => settle(y), 100);
  };

  const onMomentumBegin = () => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    tapLockRef.current = false;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settle(e.nativeEvent.contentOffset.y);
  };

  return (
    <View style={{ width, height: ITEM_H * VISIBLE_ROWS, overflow: 'hidden' }} testID={testID}>
      <ScrollView
        ref={ref}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        contentOffset={initialOffset}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 0 && Math.abs(h - wheelHeight) > 1) setWheelHeight(h);
        }}
        onScrollBeginDrag={onScrollBeginDrag}
        onScroll={onScroll}
        onScrollEndDrag={onDragEnd}
        onMomentumScrollBegin={onMomentumBegin}
        onMomentumScrollEnd={onMomentumEnd}
        scrollEventThrottle={16}
      >
        <View style={{ height: topPad }} />
        {items.map((label, i) => {
          const dist = Math.abs(i - index);
          const selected = dist === 0;
          return (
            <Pressable
              key={label}
              onPress={() => {
                if (settleTimer.current) clearTimeout(settleTimer.current);
                if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
                tapLockRef.current = true;
                indexRef.current = i;
                onChange(i);
                ref.current?.scrollTo({ y: i * ITEM_H, animated: true });
                tapTimerRef.current = setTimeout(() => {
                  tapLockRef.current = false;
                }, 350);
              }}
              style={{ height: ITEM_H, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text
                style={{
                  fontSize: selected ? 24 : 18,
                  fontWeight: selected ? '700' : '500',
                  color: selected ? colors.textPrimary : colors.textMuted,
                  opacity: selected ? 1 : dist === 1 ? 0.6 : 0.3,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
        <View style={{ height: bottomPad }} />
      </ScrollView>
    </View>
  );
}

function TimeWheel({ initial, onChange }: { initial: Date; onChange: (d: Date) => void }) {
  const colors = useThemeColors();
  const h24 = initial.getHours();
  const [hourIdx, setHourIdx] = useState(((h24 % 12) || 12) - 1);
  const [minuteIdx, setMinuteIdx] = useState(initial.getMinutes());
  const [ampmIdx, setAmpmIdx] = useState(h24 >= 12 ? 1 : 0);

  useEffect(() => {
    const hour12 = hourIdx + 1;
    const hours = (hour12 % 12) + (ampmIdx === 1 ? 12 : 0);
    onChange(new Date(2000, 0, 1, hours, minuteIdx));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hourIdx, minuteIdx, ampmIdx]);

  return (
    <View style={{ height: ITEM_H * VISIBLE_ROWS, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
      {/* Selection band scoped to Hour and Minute wheels */}
      <View style={{ flexDirection: 'row', alignItems: 'center', position: 'relative', paddingHorizontal: 6 }}>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: ITEM_H * PAD_ROWS,
            height: ITEM_H,
            borderRadius: 12,
            backgroundColor: withAlpha(colors.goldAccent, 34),
            borderWidth: 1,
            borderColor: withAlpha(colors.goldAccent, 90),
          }}
        />
        <WheelColumn testID="picker.time.hour" items={HOURS} index={hourIdx} onChange={setHourIdx} width={72} />
        <Text style={{ fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginHorizontal: 2 }}>:</Text>
        <WheelColumn testID="picker.time.minute" items={MINUTES} index={minuteIdx} onChange={setMinuteIdx} width={72} />
      </View>

      {/* Direct tap AM / PM toggle (avoids 2-item ScrollView snap-back on iOS) */}
      <View testID="picker.time.ampm" style={{ width: 72, marginLeft: 10, gap: 8, justifyContent: 'center' }}>
        {(['AM', 'PM'] as const).map((period, idx) => {
          const selected = ampmIdx === idx;
          return (
            <Pressable
              key={period}
              testID={`picker.time.${period.toLowerCase()}`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setAmpmIdx(idx)}
              style={{
                height: ITEM_H,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: selected ? colors.goldAccent : colors.surfaceVariant,
                borderWidth: 1.5,
                borderColor: selected ? colors.goldAccent : colors.cardBorder,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '800',
                  color: selected ? '#FFFFFF' : colors.textPrimary,
                }}
              >
                {period}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Mount once at root above OverlayHost (iOS/web only renders). */
export function PickerHost() {
  const colors = useThemeColors();
  const { req, set } = usePicker();
  const pickedRef = useRef<Date>(new Date());
  const [previewLabel, setPreviewLabel] = useState('');
  const closeRef = useRef<(d: Date | null) => void>(() => {});

  useEffect(() => {
    if (req) {
      pickedRef.current = req.value;
      setPreviewLabel(formatPickerPreview(req.mode, req.value));
    } else {
      setPreviewLabel('');
    }
  }, [req]);

  const close = (d: Date | null) => {
    const active = usePicker.getState().req;
    set(null);
    active?.resolve(d);
  };
  closeRef.current = close;

  useEffect(() => {
    if (!req) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeRef.current(null);
      return true;
    });
    return () => sub.remove();
  }, [req]);

  if (!req) return null;

  const handleChange = (d: Date) => {
    pickedRef.current = d;
    setPreviewLabel(formatPickerPreview(req.mode, d));
  };

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: 'rgba(0,0,0,0.54)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10, zIndex: 2000 },
      ]}
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={() => close(null)} />
      <View
        style={{
          width: '100%',
          maxWidth: 380,
          backgroundColor: colors.surface,
          borderRadius: 24,
          padding: 14,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          elevation: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 6, marginBottom: 6 }}>
          <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600' }}>
            {req.title || (req.mode === 'time' ? 'Select Time' : 'Select Date')}
          </Text>
          <Text style={{ color: colors.goldAccent, fontSize: 14, fontWeight: '700' }}>
            {previewLabel || formatPickerPreview(req.mode, req.value)}
          </Text>
        </View>

        {req.mode === 'time' ? (
          <TimeWheel key={req.id} initial={req.value} onChange={handleChange} />
        ) : (
          <View style={{ alignItems: 'center', width: '100%' }}>
            <DateTimePicker
              key={req.id}
              value={req.value}
              mode="date"
              display="inline"
              themeVariant={colors.isLight ? 'light' : 'dark'}
              accentColor={colors.goldAccent}
              minimumDate={req.min}
              maximumDate={req.max}
              style={Platform.OS === 'ios' ? { width: '100%', minHeight: 320 } : undefined}
              onChange={(_, d) => {
                if (d && !isNaN(d.getTime())) handleChange(d);
              }}
            />
          </View>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
          <Pressable onPress={() => close(null)} style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
            <Text style={{ color: colors.goldAccent, fontWeight: '600' }}>Cancel</Text>
          </Pressable>
          <Pressable testID="picker.ok" onPress={() => close(pickedRef.current)} style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
            <Text style={{ color: colors.goldAccent, fontWeight: '700' }}>OK</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/** TimeOfDay.format(context) — 12h "h:mm AM" like en_US Material. */
export function formatTimeOfDay(d: Date) {
  const h = d.getHours(), m = d.getMinutes();
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/**
 * Safely parses a time string ("10:30 AM", "12:00 PM", "14:30") into a Date object.
 */
export function parseTimeToDate(tobStr?: string | null): Date {
  const fallback = new Date(2000, 0, 1, 12, 0);
  if (!tobStr) return fallback;
  const clean = tobStr.trim();
  const m12 = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (m12) {
    let h = parseInt(m12[1], 10);
    const min = parseInt(m12[2], 10);
    const meridiem = m12[3].toUpperCase();
    if (meridiem === 'PM' && h < 12) h += 12;
    if (meridiem === 'AM' && h === 12) h = 0;
    if (h >= 0 && h <= 23 && min >= 0 && min <= 59) {
      return new Date(2000, 0, 1, h, min);
    }
  }
  const m24 = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (m24) {
    const h = parseInt(m24[1], 10);
    const min = parseInt(m24[2], 10);
    if (h >= 0 && h <= 23 && min >= 0 && min <= 59) {
      return new Date(2000, 0, 1, h, min);
    }
  }
  return fallback;
}

const MONTH_NAME_MAP: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/**
 * Safely parses any date string (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, DD MMM YYYY, or ISO) into a valid Date object.
 */
export function parseDobToDate(dobStr?: string | null): Date {
  if (!dobStr) return new Date(1995, 9, 15);
  const clean = dobStr.trim();
  // Check DD/MM/YYYY or DD-MM-YYYY
  const dmy = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) {
    const day = parseInt(dmy[1], 10);
    const month = parseInt(dmy[2], 10) - 1;
    const year = parseInt(dmy[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }
  // Check YYYY-MM-DD or YYYY/MM/DD
  const ymd = clean.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (ymd) {
    const year = parseInt(ymd[1], 10);
    const month = parseInt(ymd[2], 10) - 1;
    const day = parseInt(ymd[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }
  // Check DD MMM YYYY (e.g. "15 Oct 1995")
  const dMonY = clean.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/);
  if (dMonY) {
    const day = parseInt(dMonY[1], 10);
    const mon = MONTH_NAME_MAP[dMonY[2].slice(0, 3).toLowerCase()];
    const year = parseInt(dMonY[3], 10);
    if (mon !== undefined) {
      const d = new Date(year, mon, day);
      if (!isNaN(d.getTime())) return d;
    }
  }
  const fallback = new Date(clean);
  return isNaN(fallback.getTime()) ? new Date(1995, 9, 15) : fallback;
}

/**
 * Formats any Date object or raw date string into standard DD/MM/YYYY format.
 */
export function formatDobToDDMMYYYY(val?: Date | string | null): string {
  if (!val) return '';
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    const d = String(val.getDate()).padStart(2, '0');
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const y = val.getFullYear();
    return `${d}/${m}/${y}`;
  }
  const clean = val.trim();
  if (!clean || clean === 'Not specified' || clean === 'Sign in to view') return clean;
  // If already standard DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) return clean;
  // If DD-MM-YYYY or DD/M/YYYY
  const dmy = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) {
    const d = dmy[1].padStart(2, '0');
    const m = dmy[2].padStart(2, '0');
    const y = dmy[3];
    return `${d}/${m}/${y}`;
  }
  // If YYYY-MM-DD or YYYY/MM/DD
  const ymd = clean.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (ymd) {
    const y = ymd[1];
    const m = ymd[2].padStart(2, '0');
    const d = ymd[3].padStart(2, '0');
    return `${d}/${m}/${y}`;
  }
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    const d = String(parsed.getDate()).padStart(2, '0');
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const y = parsed.getFullYear();
    return `${d}/${m}/${y}`;
  }
  return clean;
}
