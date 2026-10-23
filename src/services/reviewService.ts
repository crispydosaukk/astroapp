import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './astrologyService';

export interface AppReviewItem {
  id: string;
  astrologerId: string;
  astrologerName: string;
  customerId?: string;
  customerName: string;
  rating: number;
  reviewText: string;
  tags?: string[];
  serviceType: 'Voice Call' | 'Video Call' | 'Chat';
  date: string;
  showInApp?: boolean;
  status?: string;
}

export interface SubmitReviewPayload {
  astrologerId: string;
  astrologerName: string;
  customerName?: string;
  customerId?: string;
  rating: number;
  reviewText: string;
  tags?: string[];
  serviceType?: 'Voice Call' | 'Video Call' | 'Chat';
}

const STORAGE_KEY_REVIEWS = 'astroparihar_local_reviews';

const DEFAULT_REVIEWS: AppReviewItem[] = [
  {
    id: 'rev_1',
    astrologerId: 'swami-shankarananda',
    astrologerName: 'Swami Shankarananda Giri',
    customerName: 'Priya Sharma',
    rating: 5,
    reviewText: "Swamiji's reading was extraordinarily accurate. He described my current Dasha period with such precision — it felt like he was reading my life story. His remedies have already started showing results.",
    tags: ['Accurate Prediction 🎯', 'Calm & Compassionate 🙏', 'Effective Remedies ✨'],
    serviceType: 'Voice Call',
    date: '2 days ago',
    showInApp: true,
  },
  {
    id: 'rev_2',
    astrologerId: 'swami-shankarananda',
    astrologerName: 'Swami Shankarananda Giri',
    customerName: 'Rajesh Kumar',
    rating: 5,
    reviewText: 'I was sceptical at first, but the consultation completely changed my perspective. His analysis of my career challenges was spot-on and the guidance he provided has been transformative.',
    tags: ['Career Clarity 💼', 'Deep Vedic Wisdom 📜'],
    serviceType: 'Video Call',
    date: '1 week ago',
    showInApp: true,
  },
  {
    id: 'rev_3',
    astrologerId: 'swami-shankarananda',
    astrologerName: 'Swami Shankarananda Giri',
    customerName: 'Ananya Patel',
    rating: 5,
    reviewText: 'The Kundli Milan reading for my marriage was incredibly detailed. He explained every aspect of compatibility with such clarity and compassion. Highly recommend for anyone seeking genuine Vedic guidance.',
    tags: ['Accurate Prediction 🎯', 'Clear Guidance 🗣️'],
    serviceType: 'Voice Call',
    date: '2 weeks ago',
    showInApp: true,
  },
  {
    id: 'rev_4',
    astrologerId: 'swami-shankarananda',
    astrologerName: 'Swami Shankarananda Giri',
    customerName: 'Vikram Singh',
    rating: 4,
    reviewText: 'Very knowledgeable and patient. Took time to explain complex astrological concepts in simple terms. The session ran a bit long but every minute was worth it.',
    tags: ['Deep Vedic Wisdom 📜', 'Clear Guidance 🗣️'],
    serviceType: 'Video Call',
    date: '3 weeks ago',
    showInApp: true,
  },
];

export async function getAstrologerReviews(astrologerId?: string): Promise<AppReviewItem[]> {
  try {
    const url = new URL(`${API_BASE_URL}/reviews`);
    url.searchParams.set('appOnly', 'true');
    if (astrologerId) {
      url.searchParams.set('astrologerId', astrologerId);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.reviews) && data.reviews.length > 0) {
        await AsyncStorage.setItem(
          `${STORAGE_KEY_REVIEWS}_${astrologerId || 'all'}`,
          JSON.stringify(data.reviews)
        );
        return data.reviews;
      }
    }
  } catch (err) {
    console.warn('Reviews fetch fallback to cache:', err);
  }

  // Fallback to local storage or defaults
  try {
    const cached = await AsyncStorage.getItem(`${STORAGE_KEY_REVIEWS}_${astrologerId || 'all'}`);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}

  return DEFAULT_REVIEWS;
}

export async function submitConsultationReview(payload: SubmitReviewPayload): Promise<{
  success: boolean;
  message?: string;
  review?: AppReviewItem;
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        // Cache locally as well
        try {
          const list = await getAstrologerReviews(payload.astrologerId);
          await AsyncStorage.setItem(
            `${STORAGE_KEY_REVIEWS}_${payload.astrologerId}`,
            JSON.stringify([data.review, ...list])
          );
        } catch {}
        return { success: true, message: 'Review submitted successfully!', review: data.review };
      }
    }
  } catch (err) {
    console.warn('Review submission online failed, creating local copy:', err);
  }

  // Local fallback creation
  const fallbackReview: AppReviewItem = {
    id: `local_rev_${Date.now()}`,
    astrologerId: payload.astrologerId,
    astrologerName: payload.astrologerName,
    customerName: payload.customerName || 'Verified Seeker',
    rating: payload.rating,
    reviewText: payload.reviewText,
    tags: payload.tags || ['Accurate Prediction 🎯'],
    serviceType: payload.serviceType || 'Voice Call',
    date: 'Just now',
    showInApp: true,
  };

  try {
    const list = await getAstrologerReviews(payload.astrologerId);
    await AsyncStorage.setItem(
      `${STORAGE_KEY_REVIEWS}_${payload.astrologerId}`,
      JSON.stringify([fallbackReview, ...list])
    );
  } catch {}

  return { success: true, message: 'Review saved successfully!', review: fallbackReview };
}
