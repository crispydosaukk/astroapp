/**
 * Real-time Astrologer Consultation & WebRTC Billing Bridge
 * AstroParihar - Mobile & Web Parity Service
 *
 * Connects directly to Firebase Firestore ('consultations' collection)
 * and AstroParihar Live Billing Endpoints (/api/start-call-billing, /api/deduct-minute)
 */

import { LIVE_BASE_URL } from '@/config/api';
import { openZegoCallRoom, generateZegoRoomId } from './zegoService';

const FIREBASE_PROJECT_ID = 'astroparihar-85e2d';
const FIREBASE_API_KEY = 'AIzaSyCXZ9S7Th0lpAVLMnZnRlgusCH1dPgF98g';
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

export interface ConsultationBookingParams {
  astrologerId: string;
  astrologerName: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  type: 'voice' | 'video' | 'chat';
  price: number;
  roomID?: string;
  duration?: number;
}

export interface ConsultationStatusResult {
  success: boolean;
  consultationId?: string;
  status: 'pending' | 'active' | 'cancelled' | 'declined' | 'completed' | 'unknown';
  roomID?: string;
  astrologerName?: string;
  price?: number;
  error?: string;
}

/**
 * 1. Create a live consultation booking in Firestore
 * This triggers the incoming call popup & ringtone on the Astrologer's web dashboard!
 */
export async function createConsultationBooking(
  params: ConsultationBookingParams
): Promise<{ success: boolean; consultationId?: string; roomID: string; error?: string }> {
  const roomID = params.roomID || generateZegoRoomId();
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString('en-US', { hour12: false }).slice(0, 5);

  const payload = {
    fields: {
      astrologerId: { stringValue: params.astrologerId },
      astrologerName: { stringValue: params.astrologerName },
      customerId: { stringValue: params.customerId },
      customerName: { stringValue: params.customerName || 'Customer' },
      customerPhone: { stringValue: params.customerPhone || '' },
      roomID: { stringValue: roomID },
      type: { stringValue: params.type === 'video' ? 'video' : 'call' },
      price: { integerValue: String(Math.round(params.price || 45)) },
      duration: { integerValue: String(params.duration || 30) },
      status: { stringValue: 'pending' },
      date: { stringValue: dateStr },
      time: { stringValue: timeStr },
      createdAt: { timestampValue: now.toISOString() },
      source: { stringValue: 'mobile_app' },
    },
  };

  try {
    const res = await fetch(`${FIRESTORE_BASE_URL}/consultations?key=${FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      const docName = data.name || '';
      const consultationId = docName.split('/').pop();
      return {
        success: true,
        consultationId,
        roomID,
      };
    } else {
      const errData = await res.json().catch(() => ({}));
      return {
        success: false,
        roomID,
        error: errData.error?.message || 'Failed to create consultation booking',
      };
    }
  } catch (err: any) {
    console.error('Error creating consultation booking:', err);
    return {
      success: false,
      roomID,
      error: err.message || 'Network error booking consultation',
    };
  }
}

/**
 * 2. Poll the status of a consultation
 * Returns 'pending', 'active' (astrologer accepted), 'declined', 'cancelled', or 'completed'
 */
export async function getConsultationStatus(
  consultationId: string
): Promise<ConsultationStatusResult> {
  if (!consultationId) {
    return { success: false, status: 'unknown', error: 'Missing consultation ID' };
  }

  try {
    const res = await fetch(
      `${FIRESTORE_BASE_URL}/consultations/${encodeURIComponent(consultationId)}?key=${FIREBASE_API_KEY}`
    );

    if (res.ok) {
      const data = await res.json();
      const fields = data.fields || {};
      const status = fields.status?.stringValue || 'pending';
      const roomID = fields.roomID?.stringValue;
      const astrologerName = fields.astrologerName?.stringValue;
      const price = fields.price?.integerValue ? Number(fields.price.integerValue) : undefined;

      return {
        success: true,
        consultationId,
        status: status as any,
        roomID,
        astrologerName,
        price,
      };
    } else {
      return { success: false, status: 'unknown', error: 'Consultation document not found' };
    }
  } catch (err: any) {
    return { success: false, status: 'unknown', error: err.message || 'Error checking status' };
  }
}

/**
 * 3. Cancel consultation if astrologer did not respond in time or user backs out
 */
export async function cancelConsultationBooking(
  consultationId: string,
  reason: string = 'User cancelled'
): Promise<boolean> {
  if (!consultationId) return false;

  try {
    const res = await fetch(
      `${FIRESTORE_BASE_URL}/consultations/${encodeURIComponent(consultationId)}?updateMask.fieldPaths=status&updateMask.fieldPaths=cancelledReason&key=${FIREBASE_API_KEY}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            status: { stringValue: 'cancelled' },
            cancelledReason: { stringValue: reason },
          },
        }),
      }
    );
    return res.ok;
  } catch (err) {
    console.warn('Error cancelling consultation:', err);
    return false;
  }
}

/**
 * 4. Mark consultation as completed upon call termination
 */
export async function completeConsultationBooking(
  consultationId: string
): Promise<boolean> {
  if (!consultationId) return false;

  try {
    const res = await fetch(
      `${FIRESTORE_BASE_URL}/consultations/${encodeURIComponent(consultationId)}?updateMask.fieldPaths=status&key=${FIREBASE_API_KEY}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            status: { stringValue: 'completed' },
          },
        }),
      }
    );
    return res.ok;
  } catch (err) {
    console.warn('Error completing consultation:', err);
    return false;
  }
}

/**
 * 5. Start live server call billing
 * Matches website /api/start-call-billing
 * Deducts 1st minute from user's Firestore wallet and records wallet_transactions entry
 */
export async function startCallBilling(
  consultationId: string
): Promise<{ success: boolean; error?: string }> {
  if (!consultationId) return { success: false, error: 'Missing consultationId' };

  try {
    const res = await fetch(`${LIVE_BASE_URL}/api/start-call-billing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consultationId }),
    });

    if (res.ok) {
      const data = await res.json();
      return { success: Boolean(data.success) };
    } else {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error || 'Failed to start billing' };
    }
  } catch (err: any) {
    console.warn('startCallBilling error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * 6. Deduct per-minute consultation fee
 * Matches website /api/deduct-minute
 * Deducts 1 minute every 60s from user's Firestore wallet
 * Returns HTTP 402 if balance is depleted
 */
export async function deductMinuteBilling(
  consultationId: string
): Promise<{ success: boolean; remainingBalance?: number; error?: string; isDepleted?: boolean }> {
  if (!consultationId) return { success: false, error: 'Missing consultationId' };

  try {
    const res = await fetch(`${LIVE_BASE_URL}/api/deduct-minute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consultationId }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        remainingBalance: data.remainingBalance,
      };
    } else if (res.status === 402) {
      return {
        success: false,
        isDepleted: true,
        error: 'Insufficient wallet balance for next minute',
      };
    } else {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error || 'Failed to deduct minute' };
    }
  } catch (err: any) {
    console.warn('deductMinuteBilling error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * 7. Deduct from wallet for one-off services (AI chat prompts, reports, parihars)
 * Matches website /api/deduct-service-wallet
 */
export async function deductServiceWallet(params: {
  userId: string;
  userEmail?: string;
  amount: number;
  serviceId?: string;
  serviceTitle: string;
  serviceType?: string;
}): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  try {
    const res = await fetch(`${LIVE_BASE_URL}/api/deduct-service-wallet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, newBalance: data.newBalance };
    } else {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error || 'Deduction failed' };
    }
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
