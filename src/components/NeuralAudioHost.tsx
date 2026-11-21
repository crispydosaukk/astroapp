import React, { useEffect, useRef } from 'react';
import { Platform, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

export interface NeuralAudioCallbacks {
  onStart?: () => void;
  onDone?: () => void;
  onError?: (err: any) => void;
}

interface ActivePlayback {
  id: number;
  callbacks: NeuralAudioCallbacks;
  settled: boolean;
  startTimer?: ReturnType<typeof setTimeout>;
}

let webViewRefGlobal: WebView<any> | null = null;
let webViewLoadedGlobal = false;
let webHtmlAudioGlobal: any = null;
let playbackSeq = 0;
let activePlayback: ActivePlayback | null = null;

function clearActiveTimers() {
  if (activePlayback?.startTimer) {
    clearTimeout(activePlayback.startTimer);
    activePlayback.startTimer = undefined;
  }
}

export function stopNeuralAudio(): void {
  playbackSeq += 1;
  clearActiveTimers();
  activePlayback = null;

  if (Platform.OS === 'web') {
    try {
      if (webHtmlAudioGlobal) {
        webHtmlAudioGlobal.onended = null;
        webHtmlAudioGlobal.onerror = null;
        webHtmlAudioGlobal.pause();
        webHtmlAudioGlobal.src = '';
        webHtmlAudioGlobal = null;
      }
    } catch {}
    return;
  }

  try {
    webViewRefGlobal?.injectJavaScript(`if (window.__apStopAudio) { window.__apStopAudio(); } true;`);
  } catch {}
}

export function isNeuralAudioReady(): boolean {
  if (Platform.OS === 'web') return typeof Audio !== 'undefined';
  return Boolean(webViewRefGlobal && webViewLoadedGlobal);
}

/**
 * Plays studio-synthesized MP3 audio (base64) cleanly on Android, iOS, and Web
 * without requiring extra native audio dependencies.
 * Resolves `true` once audio finishes cleanly, or `false` if playback could not start
 * so callers can seamlessly fall back to native speech.
 */
export function playNeuralAudioBase64(
  base64Mp3: string,
  callbacks: NeuralAudioCallbacks = {}
): Promise<boolean> {
  return new Promise((resolve) => {
    if (!base64Mp3 || base64Mp3.length < 32) {
      callbacks.onError?.('Empty audio buffer');
      resolve(false);
      return;
    }

    stopNeuralAudio();
    const myId = ++playbackSeq;

    const finish = (ok: boolean, err?: any) => {
      if (activePlayback && activePlayback.id === myId) {
        if (activePlayback.settled) return;
        activePlayback.settled = true;
        clearActiveTimers();
        activePlayback = null;
      }
      if (ok) {
        callbacks.onDone?.();
        resolve(true);
      } else {
        callbacks.onError?.(err || 'Playback failed');
        resolve(false);
      }
    };

    activePlayback = {
      id: myId,
      callbacks: {
        onStart: callbacks.onStart,
        onDone: () => finish(true),
        onError: (e) => finish(false, e),
      },
      settled: false,
    };

    // Web platform: use native HTML5 Audio directly
    if (Platform.OS === 'web') {
      try {
        const audio = new (globalThis as any).Audio(`data:audio/mpeg;base64,${base64Mp3}`);
        webHtmlAudioGlobal = audio;
        audio.onplay = () => {
          if (myId === playbackSeq) callbacks.onStart?.();
        };
        audio.onended = () => {
          if (myId === playbackSeq) finish(true);
        };
        audio.onerror = (e: any) => {
          if (myId === playbackSeq) finish(false, e);
        };
        const p = audio.play();
        if (p && typeof p.catch === 'function') {
          p.catch((e: any) => {
            if (myId === playbackSeq) finish(false, e);
          });
        }
      } catch (e) {
        finish(false, e);
      }
      return;
    }

    // Native Android/iOS: play via mounted hidden WebView HTML5 audio engine
    if (!webViewRefGlobal || !webViewLoadedGlobal) {
      finish(false, 'Neural audio host not ready');
      return;
    }

    // Safety guard: if audio hasn't started within 3.5 seconds, trigger graceful fallback
    activePlayback.startTimer = setTimeout(() => {
      if (activePlayback && activePlayback.id === myId && !activePlayback.settled) {
        finish(false, 'Audio start timeout');
      }
    }, 3500);

    try {
      const payload = JSON.stringify({ id: myId, b64: base64Mp3 });
      webViewRefGlobal.injectJavaScript(
        `if (window.__apPlayAudio) { window.__apPlayAudio(${payload}); } else { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', id: ${myId}, msg: 'Bridge missing' })); } true;`
      );
    } catch (e) {
      finish(false, e);
    }
  });
}

const NEURAL_AUDIO_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:transparent;">
  <audio id="apAudio" playsinline webkit-playsinline preload="auto"></audio>
  <script>
    (function() {
      var audioEl = document.getElementById('apAudio');
      var currentId = 0;
      var currentUrl = null;

      function post(msg) {
        try {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify(msg));
          }
        } catch (e) {}
      }

      function cleanupUrl() {
        if (currentUrl) {
          try { URL.revokeObjectURL(currentUrl); } catch (e) {}
          currentUrl = null;
        }
      }

      window.__apStopAudio = function() {
        currentId = 0;
        try {
          audioEl.onplay = null;
          audioEl.onended = null;
          audioEl.onerror = null;
          audioEl.pause();
          audioEl.removeAttribute('src');
          audioEl.load();
        } catch (e) {}
        cleanupUrl();
      };

      window.__apPlayAudio = function(payload) {
        try {
          window.__apStopAudio();
          var id = payload && payload.id ? payload.id : 0;
          var b64 = payload && payload.b64 ? payload.b64 : '';
          currentId = id;
          if (!b64) {
            post({ type: 'ERROR', id: id, msg: 'Empty b64' });
            return;
          }

          var binary = atob(b64);
          var len = binary.length;
          var bytes = new Uint8Array(len);
          for (var i = 0; i < len; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          var blob = new Blob([bytes], { type: 'audio/mpeg' });
          currentUrl = URL.createObjectURL(blob);

          audioEl.onplay = function() {
            if (currentId === id) {
              post({ type: 'START', id: id });
            }
          };
          audioEl.onended = function() {
            if (currentId === id) {
              cleanupUrl();
              post({ type: 'ENDED', id: id });
            }
          };
          audioEl.onerror = function() {
            if (currentId === id) {
              cleanupUrl();
              post({ type: 'ERROR', id: id, msg: 'HTML5 audio decode/play error' });
            }
          };

          audioEl.src = currentUrl;
          audioEl.volume = 1.0;
          var playPromise = audioEl.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(function(err) {
              if (currentId === id) {
                cleanupUrl();
                post({ type: 'ERROR', id: id, msg: String(err && err.message ? err.message : err) });
              }
            });
          }
        } catch (err) {
          post({ type: 'ERROR', id: currentId, msg: String(err && err.message ? err.message : err) });
        }
      };

      post({ type: 'READY' });
    })();
  </script>
</body>
</html>
`;

/**
 * Mounted once at app root (_layout.tsx) to provide smooth ChatGPT-style neural MP3
 * audio playback on Android and iOS via an invisible lightweight HTML5 audio engine.
 */
export function NeuralAudioHost() {
  const localRef = useRef<WebView<any> | null>(null);

  useEffect(() => {
    return () => {
      stopNeuralAudio();
      if (webViewRefGlobal === localRef.current) {
        webViewRefGlobal = null;
        webViewLoadedGlobal = false;
      }
    };
  }, []);

  if (Platform.OS === 'web') {
    return null;
  }

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'READY') {
        webViewLoadedGlobal = true;
        return;
      }
      if (!activePlayback || data.id !== activePlayback.id) return;

      if (data.type === 'START') {
        clearActiveTimers();
        activePlayback.callbacks.onStart?.();
      } else if (data.type === 'ENDED') {
        clearActiveTimers();
        activePlayback.callbacks.onDone?.();
      } else if (data.type === 'ERROR') {
        clearActiveTimers();
        activePlayback.callbacks.onError?.(data.msg || 'Audio error');
      }
    } catch {}
  };

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: 1,
        height: 1,
        opacity: 0,
        left: -10,
        top: -10,
        overflow: 'hidden',
      }}
    >
      <WebView
        ref={(node) => {
          localRef.current = node;
          webViewRefGlobal = node;
        }}
        originWhitelist={['*']}
        source={{ html: NEURAL_AUDIO_HTML, baseUrl: 'https://astroparihar.com/' }}
        javaScriptEnabled
        domStorageEnabled
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        onLoadEnd={() => {
          webViewLoadedGlobal = true;
        }}
        onMessage={handleMessage}
      />
    </View>
  );
}
