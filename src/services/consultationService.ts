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
  customerDob?: string;
  customerTob?: string;
  customerPob?: string;
  customerGender?: string;
  customerRelation?: string;
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
      customerDob: { stringValue: params.customerDob || '' },
      customerTob: { stringValue: params.customerTob || '' },
      customerPob: { stringValue: params.customerPob || '' },
      customerGender: { stringValue: params.customerGender || '' },
      customerRelation: { stringValue: params.customerRelation || 'Myself' },
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
  details?: any;
}): Promise<{ success: boolean; newBalance?: number; reportContent?: string; error?: string }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${LIVE_BASE_URL}/api/deduct-service-wallet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        newBalance: data.newBalance,
        reportContent: data.reportContent,
      };
    } else {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error || 'Deduction failed' };
    }
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/* ============================================================================
 * ASTROLOGER PORTAL LIVE FIRESTORE & CONSULTATION CONNECTIVITY HELPERS
 * Mirrors website:
 * - /astrologer-dashboard
 * - /astrologer-dashboard/consultations
 * - /astrologer-dashboard/earnings
 * - /astrologer-dashboard/profile
 * - /call/[roomID]
 * ============================================================================ */

function parseFirestoreVal(val: any): any {
  if (!val || typeof val !== 'object') return val;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('booleanValue' in val) return Boolean(val.booleanValue);
  if ('timestampValue' in val) return val.timestampValue;
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) {
    return (val.arrayValue?.values || []).map(parseFirestoreVal);
  }
  if ('mapValue' in val) {
    const out: Record<string, any> = {};
    const fields = val.mapValue?.fields || {};
    Object.keys(fields).forEach((k) => {
      out[k] = parseFirestoreVal(fields[k]);
    });
    return out;
  }
  return val;
}

function parseFirestoreDoc(docObj: any): Record<string, any> {
  const fields = docObj?.fields || {};
  const result: Record<string, any> = {};
  Object.keys(fields).forEach((k) => {
    result[k] = parseFirestoreVal(fields[k]);
  });
  if (docObj?.name) {
    result.id = docObj.name.split('/').pop();
  }
  return result;
}

function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val)
      ? { integerValue: String(val) }
      : { doubleValue: val };
  }
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    Object.keys(val).forEach((k) => {
      fields[k] = toFirestoreValue(val[k]);
    });
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

/**
 * 8. Fetch Astrologer Profile from Firestore (`astrologers/{id}` or `candidates/{id}`)
 */
export async function fetchAstrologerProfileFromFirestore(
  astrologerId: string
): Promise<Record<string, any> | null> {
  if (!astrologerId) return null;
  try {
    const res1 = await fetch(
      `${FIRESTORE_BASE_URL}/astrologers/${encodeURIComponent(astrologerId)}?key=${FIREBASE_API_KEY}`
    );
    if (res1.ok) {
      const docData = await res1.json();
      return parseFirestoreDoc(docData);
    }

    const res2 = await fetch(
      `${FIRESTORE_BASE_URL}/candidates/${encodeURIComponent(astrologerId)}?key=${FIREBASE_API_KEY}`
    );
    if (res2.ok) {
      const docData = await res2.json();
      return parseFirestoreDoc(docData);
    }
  } catch (err) {
    console.warn('fetchAstrologerProfileFromFirestore error:', err);
  }
  return null;
}

/**
 * 9. Patch Astrologer fields in Firestore (`astrologers/{id}` & `candidates/{id}`)
 */
export async function saveAstrologerProfileToFirestore(
  astrologerId: string,
  updates: Record<string, any>
): Promise<boolean> {
  if (!astrologerId) return false;
  const keys = Object.keys(updates);
  if (keys.length === 0) return true;

  const maskQuery = keys
    .map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`)
    .join('&');
  const fields: Record<string, any> = {};
  keys.forEach((k) => {
    fields[k] = toFirestoreValue(updates[k]);
  });

  try {
    const res = await fetch(
      `${FIRESTORE_BASE_URL}/astrologers/${encodeURIComponent(astrologerId)}?${maskQuery}&key=${FIREBASE_API_KEY}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      }
    );
    return res.ok;
  } catch (err) {
    console.warn('saveAstrologerProfileToFirestore error:', err);
    return false;
  }
}

/**
 * 10. Query all consultations for an Astrologer from Firestore (`consultations` collection)
 */
export async function fetchAstrologerConsultations(
  astrologerId: string
): Promise<Array<Record<string, any>>> {
  if (!astrologerId) return [];
  try {
    const queryBody = {
      structuredQuery: {
        from: [{ collectionId: 'consultations' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'astrologerId' },
            op: 'EQUAL',
            value: { stringValue: astrologerId },
          },
        },
        limit: 60,
      },
    };

    const res = await fetch(`${FIRESTORE_BASE_URL}:runQuery?key=${FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(queryBody),
    });

    if (!res.ok) return [];
    const rows = await res.json();
    if (!Array.isArray(rows)) return [];

    const docs = rows
      .filter((r) => r.document)
      .map((r) => parseFirestoreDoc(r.document));

    docs.sort((a, b) => {
      const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tB - tA;
    });

    return docs;
  } catch (err) {
    console.warn('fetchAstrologerConsultations error:', err);
    return [];
  }
}

/**
 * 11. Accept an incoming customer consultation request
 * Calls `/api/accept-call` and updates Firestore `consultations/{id}` status to `'active'`
 */
export async function acceptConsultationCall(
  consultationId: string
): Promise<{ success: boolean; error?: string }> {
  if (!consultationId) return { success: false, error: 'Missing consultation ID' };
  const acceptedAt = new Date().toISOString();

  try {
    // Update Firestore directly so customer's mobile/web client detects 'active' immediately
    const patchRes = await fetch(
      `${FIRESTORE_BASE_URL}/consultations/${encodeURIComponent(consultationId)}?updateMask.fieldPaths=status&updateMask.fieldPaths=acceptedAt&key=${FIREBASE_API_KEY}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            status: { stringValue: 'active' },
            acceptedAt: { stringValue: acceptedAt },
          },
        }),
      }
    );

    // Also notify backend /api/accept-call
    fetch(`${LIVE_BASE_URL}/api/accept-call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consultationId }),
    }).catch(() => {});

    if (patchRes.ok) {
      return { success: true };
    }
    return { success: false, error: 'Could not update consultation status' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error accepting call' };
  }
}

/**
 * 12. Decline an incoming customer consultation request
 */
export async function declineConsultationCall(consultationId: string): Promise<boolean> {
  if (!consultationId) return false;
  try {
    const res = await fetch(
      `${FIRESTORE_BASE_URL}/consultations/${encodeURIComponent(consultationId)}?updateMask.fieldPaths=status&key=${FIREBASE_API_KEY}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            status: { stringValue: 'declined' },
          },
        }),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * 13. Fetch Customer Profile (`users/{customerId}`) & Generated Reports (`service_requests`)
 * Used by Astrologers during an active consultation call (matches `/call/[roomID]` on website)
 */
export async function fetchCustomerProfileAndReports(customerId: string): Promise<{
  customerDetails: Record<string, any> | null;
  customerReports: Array<Record<string, any>>;
}> {
  if (!customerId) return { customerDetails: null, customerReports: [] };

  let customerDetails: Record<string, any> | null = null;
  let customerReports: Array<Record<string, any>> = [];

  try {
    const userRes = await fetch(
      `${FIRESTORE_BASE_URL}/users/${encodeURIComponent(customerId)}?key=${FIREBASE_API_KEY}`
    );
    if (userRes.ok) {
      const userDoc = await userRes.json();
      customerDetails = parseFirestoreDoc(userDoc);
    }
  } catch {}

  try {
    const queryBody = {
      structuredQuery: {
        from: [{ collectionId: 'service_requests' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'userId' },
            op: 'EQUAL',
            value: { stringValue: customerId },
          },
        },
        limit: 30,
      },
    };
    const repRes = await fetch(`${FIRESTORE_BASE_URL}:runQuery?key=${FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(queryBody),
    });
    if (repRes.ok) {
      const rows = await repRes.json();
      if (Array.isArray(rows)) {
        customerReports = rows
          .filter((r) => r.document)
          .map((r) => parseFirestoreDoc(r.document))
          .filter((r) => !r.status || r.status === 'completed' || r.status === 'ready');
      }
    }
  } catch {}

  return { customerDetails, customerReports };
}

