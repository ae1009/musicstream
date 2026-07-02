// Audio player using WebView source-swap strategy.
// Avoids audio.play() from injectedJS (blocked by Android autoplay policy).
// Instead, each play/resume sets a new WebView source with <audio autoplay src="...">.
// Android loads it natively via loadDataWithBaseURL, which is not subject to user-gesture policy.

let webViewRef: { injectJavaScript: (code: string) => void } | null = null;
let sourceSetter: ((src: { html: string }) => void) | null = null;
let statusCb: ((s: any) => void) | null = null;
let savedPosition = 0; // seconds, updated from timeupdate
let currentUrl: string | null = null;

export function registerAudioWebView(ref: any) {
  webViewRef = ref;
}

export function registerSourceSetter(fn: (src: { html: string }) => void) {
  sourceSetter = fn;
}

// No-op: ready state now tied to source change, not initial load
export function setWebViewReady() {}

function makeHtml(url: string, seekTo = 0): string {
  const safeUrl = url.replace(/"/g, '&quot;');
  const seekScript = seekTo > 0
    ? `a.addEventListener('canplay',function f(){a.removeEventListener('canplay',f);a.currentTime=${seekTo};},{once:true});`
    : '';
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width"></head><body>
<audio id="a" playsinline autoplay src="${safeUrl}"></audio>
<script>
var a=document.getElementById('a');
var lastDur=0;
${seekScript}
function post(o){window.ReactNativeWebView.postMessage(JSON.stringify(o));}
a.addEventListener('durationchange',function(){if(a.duration&&!isNaN(a.duration))lastDur=a.duration;});
a.addEventListener('canplay',function(){post({t:'ready',dur:isNaN(a.duration)?lastDur:a.duration});});
a.addEventListener('timeupdate',function(){post({t:'p',pos:a.currentTime,dur:isNaN(a.duration)?lastDur:a.duration,paused:a.paused});});
a.addEventListener('ended',function(){post({t:'e',dur:isNaN(a.duration)?lastDur:a.duration});});
a.addEventListener('error',function(){post({t:'err',code:a.error?a.error.code:-1,msg:a.error?a.error.message:''});});
window.rnPause=function(){a.pause();};
window.rnSeek=function(t){a.currentTime=t;};
</script></body></html>`;
}

export function handleAudioMessage(data: string) {
  try {
    const msg = JSON.parse(data);
    // Always track position for resume-after-pause
    if (msg.t === 'p' && msg.pos) savedPosition = msg.pos;
    if (!statusCb) return;
    switch (msg.t) {
      case 'ready':
        statusCb({ isLoaded: true, isPlaying: true, isBuffering: false, positionMillis: savedPosition * 1000, durationMillis: msg.dur * 1000, didJustFinish: false });
        break;
      case 'p':
        statusCb({ isLoaded: true, isPlaying: !msg.paused, isBuffering: false, positionMillis: msg.pos * 1000, durationMillis: msg.dur * 1000, didJustFinish: false });
        break;
      case 'e':
        statusCb({ isLoaded: true, isPlaying: false, isBuffering: false, positionMillis: msg.dur * 1000, durationMillis: msg.dur * 1000, didJustFinish: true });
        break;
      case 'err':
        statusCb({ isLoaded: false, isPlaying: false, isBuffering: false, positionMillis: 0, durationMillis: 0, didJustFinish: false });
        break;
    }
  } catch (_) {}
}

export function getAudioDebug(): string {
  return `url=${currentUrl ? 'set' : 'none'} pos=${savedPosition.toFixed(1)}`;
}

export async function setupAudio(): Promise<void> {}

export async function loadAndPlay(url: string, onStatus: (s: any) => void): Promise<void> {
  statusCb = onStatus;
  currentUrl = url;
  savedPosition = 0;
  onStatus({ isLoaded: true, isPlaying: true, isBuffering: true, positionMillis: 0, durationMillis: 0, didJustFinish: false });
  sourceSetter?.({ html: makeHtml(url) });
}

export async function pauseAudio(): Promise<void> {
  webViewRef?.injectJavaScript('window.rnPause();true;');
}

export async function resumeAudio(): Promise<void> {
  if (currentUrl) {
    sourceSetter?.({ html: makeHtml(currentUrl, savedPosition) });
  }
}

export async function seekAudio(positionMs: number): Promise<void> {
  savedPosition = positionMs / 1000;
  webViewRef?.injectJavaScript(`window.rnSeek(${savedPosition});true;`);
}

export async function setAudioRate(_rate: number): Promise<void> {}

export async function stopAudio(): Promise<void> {
  statusCb = null;
  currentUrl = null;
  savedPosition = 0;
  sourceSetter?.({ html: '<html><body></body></html>' });
}
