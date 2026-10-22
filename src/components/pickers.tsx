/**
 * showDatePicker / showTimePicker equivalents (dark theme, gold primary like the Flutter builder override).
 * Android: native dialog via DateTimePickerAndroid. iOS/web: modal hosting the inline picker.
 * Usage: const d = await pickDate({ value, minimumDate, maximumDate });
 */
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';
import { create } from 'zustand';
import { AppColors } from '@/theme/colors';
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
  const { req, set } = usePicker();
  const [temp, setTemp] = useState<Date | null>(null);
  if (!req) return null;
  const current = temp ?? req.value;
  const close = (d: Date | null) => { req.resolve(d); setTemp(null); set(null); };
  return (
    <Modal transparent animationType="fade" visible onRequestClose={() => close(null)}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.54)', justifyContent: 'center', padding: 24 }} onPress={() => close(null)}>
        <Pressable onPress={() => {}} style={{ backgroundColor: AppColors.surfaceDark, borderRadius: 24, padding: 16 }}>
          <DateTimePicker
            value={current}
            mode={req.mode}
            display={req.mode === 'date' ? 'inline' : 'spinner'}
            themeVariant="dark"
            accentColor={AppColors.goldAccent}
            minimumDate={req.min}
            maximumDate={req.max}
            onChange={(_, d) => d && setTemp(d)}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
            <Pressable onPress={() => close(null)} style={{ padding: 12 }}>
              <Text style={{ color: AppColors.goldAccent, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
            <Pressable onPress={() => close(current)} style={{ padding: 12 }}>
              <Text style={{ color: AppColors.goldAccent, fontWeight: '600' }}>OK</Text>
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
