/**
 * showDatePicker / showTimePicker equivalents (dark theme, gold primary like the Flutter builder override).
 * Android: native dialog via DateTimePickerAndroid. iOS/web: modal hosting the inline picker.
 * Usage: const d = await pickDate({ value, minimumDate, maximumDate });
 */
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';
import { create } from 'zustand';
import { useThemeColors } from '@/theme/themeStore';
import { Text } from './Text';

type Req = { mode: 'date' | 'time'; value: Date; min?: Date; max?: Date; resolve: (d: Date | null) => void };
const usePicker = create<{ req: Req | null; set: (r: Req | null) => void }>((set) => ({ req: null, set: (req) => set({ req }) }));

function open(mode: 'date' | 'time', value: Date, min?: Date, max?: Date): Promise<Date | null> {
  return new Promise((resolve) => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value, mode, minimumDate: min, maximumDate: max, is24Hour: false,
        onChange: (e, d) => resolve(e.type === 'set' && d ? d : null),
      });
      return;
    }
    usePicker.getState().set({ mode, value, min, max, resolve });
  });
}

export const pickDate = (o: { value: Date; minimumDate?: Date; maximumDate?: Date }) => open('date', o.value, o.minimumDate, o.maximumDate);
export const pickTime = (o: { value: Date }) => open('time', o.value);

/** Mount once at root (iOS/web only renders). */
export function PickerHost() {
  const colors = useThemeColors();
  const { req, set } = usePicker();
  const [temp, setTemp] = useState<Date | null>(null);
  if (!req) return null;
  const current = temp ?? req.value;
  const close = (d: Date | null) => { req.resolve(d); setTemp(null); set(null); };
  return (
    <Modal transparent animationType="fade" visible onRequestClose={() => close(null)}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.54)', justifyContent: 'center', padding: 24 }} onPress={() => close(null)}>
        <Pressable onPress={() => {}} style={{ backgroundColor: colors.surface, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: colors.cardBorder }}>
          <DateTimePicker
            value={current}
            mode={req.mode}
            display={req.mode === 'date' ? 'inline' : 'spinner'}
            themeVariant={colors.isLight ? 'light' : 'dark'}
            accentColor={colors.goldAccent}
            minimumDate={req.min}
            maximumDate={req.max}
            onChange={(_, d) => d && setTemp(d)}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
            <Pressable onPress={() => close(null)} style={{ padding: 12 }}>
              <Text style={{ color: colors.goldAccent, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
            <Pressable onPress={() => close(current)} style={{ padding: 12 }}>
              <Text style={{ color: colors.goldAccent, fontWeight: '600' }}>OK</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** TimeOfDay.format(context) — 12h "h:mm AM" like en_US Material. */
export function formatTimeOfDay(d: Date) {
  const h = d.getHours(), m = d.getMinutes();
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/**
 * Safely parses any date string (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, or ISO) into a valid Date object.
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
