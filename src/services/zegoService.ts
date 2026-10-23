/**
 * ZegoCloud & WebRTC Call Integration Service for AstroParihar
 * 
 * Synchronized with website credentials and call routing:
 * - App ID: 1951519898
 * - Server Secret: d68c140051b7d8f2404c2b2b9b586886
 * - Web Call Room: https://astroparihar.com/call/[roomID]
 * - AI Voice Room: https://astroparihar.com/ai-call/[sessionId]
 */
import * as Linking from 'expo-linking';

export const ZEGO_CONFIG = {
  appId: 1951519898,
  serverSecret: 'd68c140051b7d8f2404c2b2b9b586886',
  webCallBaseUrl: 'https://astroparihar.com/call/',
  aiCallBaseUrl: 'https://astroparihar.com/ai-call/',
} as const;

/**
 * Generate unique room ID conforming to website format:
 * e.g. room_1730000000000_abc123
 */
export function generateZegoRoomId(prefix = 'room'): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${ts}_${rand}`;
}

/**
 * Generate unique AI consultation session ID:
 * e.g. ai_session_1730000000000_xyz456
 */
export function generateAiSessionId(): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 9);
  return `ai_session_${ts}_${rand}`;
}

/**
 * Open the live ZegoCloud 1-on-1 audio/video call room
 */
export async function openZegoCallRoom(roomId: string): Promise<boolean> {
  const url = `${ZEGO_CONFIG.webCallBaseUrl}${encodeURIComponent(roomId)}`;
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    }
    // Fallback: try direct open without pre-check
    await Linking.openURL(url);
    return true;
  } catch (err) {
    console.error('Failed to open ZegoCloud call room:', err);
    return false;
  }
}

/**
 * Open the live AI Astrologer voice consultation session room
 */
export async function openAiCallRoom(sessionId: string): Promise<boolean> {
  const url = `${ZEGO_CONFIG.aiCallBaseUrl}${encodeURIComponent(sessionId)}`;
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    }
    await Linking.openURL(url);
    return true;
  } catch (err) {
    console.error('Failed to open AI call room:', err);
    return false;
  }
}
