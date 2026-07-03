// Audio player: WebView IS the play button. play() is only called from user tap inside WebView.
// load → sets src, shows play icon. Tap → play() with real gesture. Pause → rnPause() (no gesture needed).

let webViewRef: { injectJavaScript: (code: string) => void } | null = null;
let sourceSetter: ((src: { html: string }) => void) | null = null;
let statusCb: ((s: any) => void) | null = null;
let savedPosition = 0;
let currentUrl: string | null = null;

export function registerAudioWebView(ref: any) { webViewRef = ref; }
export function registerSourceSetter(fn: (src: { html: string }) => void) { sourceSetter = fn; }
export function setWebViewReady() {}
export function getAudioDebug() { return currentUrl ? 'url ok' : 'no url'; }

export function makePlayBtnHtml(url: string, seekTo = 0): string {
  const safeUrl = url.replace(/"/g, '&quot;');
  const seekScript = seekTo > 0
    ? `a.addEventListener('canplay',function f(){a.removeEventListener('canplay',f);a.currentTime=${seekTo.toFixed(2)};},{once:true});`
    : '';
  // White icon on dark circle — visible on any background. Matches FullPlayer button style.
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:transparent;overflow:hidden;display:flex;align-items:center;justify-content:center}
#b{width:90%;height:90%;border-radius:50%;background:#1A2E1A;display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:rgba(255,255,255,0.2)}
</style></head><body>
<div id="b" onclick="tap()">
  <svg id="pi" width="42%" height="42%" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M8 5v14l11-7z"/></svg>
  <svg id="si" width="42%" height="42%" viewBox="0 0 24 24" fill="#FFFFFF" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
</div>
<audio id="a" src="${safeUrl}" playsinline></audio>
<script>
var a=document.getElementById('a'),pi=document.getElementById('pi'),si=document.getElementById('si');
var lastDur=0;
${seekScript}
function post(o){window.ReactNativeWebView.postMessage(JSON.stringify(o));}
function upd(){pi.style.display=a.paused?'':'none';si.style.display=a.paused?'none':'';}
function tap(){
  if(a.paused){
    a.play().then(function(){upd();post({t:'playtap'});})
            .catch(function(e){post({t:'err',msg:e.toString()});});
  } else {
    a.pause();upd();post({t:'pausetap'});
  }
}
a.addEventListener('durationchange',function(){if(a.duration&&!isNaN(a.duration))lastDur=a.duration;});
a.addEventListener('canplay',function(){upd();post({t:'ready',dur:isNaN(a.duration)?lastDur:a.duration});});
a.addEventListener('timeupdate',function(){upd();post({t:'p',pos:a.currentTime,dur:isNaN(a.duration)?lastDur:a.duration,paused:a.paused});});
a.addEventListener('ended',function(){upd();post({t:'e',dur:isNaN(a.duration)?lastDur:a.duration});});
a.addEventListener('error',function(){post({t:'err',code:a.error?a.error.code:-1,msg:a.error?a.error.message:''});});
window.rnPause=function(){a.pause();upd();};
window.rnSeek=function(t){a.currentTime=t;};
</script></body></html>`;
}

export function handleAudioMessage(data: string) {
  try {
    const msg = JSON.parse(data);
    if (msg.t === 'p' && msg.pos != null) savedPosition = msg.pos;
    if (!statusCb) return;
    switch (msg.t) {
      case 'playtap':
        statusCb({ isLoaded: true, isPlaying: true, isBuffering: false, positionMillis: savedPosition * 1000, durationMillis: 0, didJustFinish: false });
        break;
      case 'pausetap':
        statusCb({ isLoaded: true, isPlaying: false, isBuffering: false, positionMillis: savedPosition * 1000, durationMillis: 0, didJustFinish: false });
        break;
      case 'ready':
        statusCb({ isLoaded: true, isPlaying: false, isBuffering: false, positionMillis: savedPosition * 1000, durationMillis: msg.dur * 1000, didJustFinish: false });
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

export async function setupAudio(): Promise<void> {}

export async function loadAndPlay(url: string, onStatus: (s: any) => void): Promise<void> {
  statusCb = onStatus;
  currentUrl = url;
  savedPosition = 0;
  onStatus({ isLoaded: true, isPlaying: false, isBuffering: true, positionMillis: 0, durationMillis: 0, didJustFinish: false });
  sourceSetter?.({ html: makePlayBtnHtml(url, 0) });
}

export async function pauseAudio(): Promise<void> {
  webViewRef?.injectJavaScript('window.rnPause();true;');
}

// Resume: reload HTML at saved position so user can tap play again
export async function resumeAudio(): Promise<void> {
  if (currentUrl) {
    sourceSetter?.({ html: makePlayBtnHtml(currentUrl, savedPosition) });
  }
}

export async function seekAudio(positionMs: number): Promise<void> {
  savedPosition = positionMs / 1000;
  webViewRef?.injectJavaScript(`window.rnSeek(${savedPosition.toFixed(2)});true;`);
}

export async function setAudioRate(_rate: number): Promise<void> {}

export async function stopAudio(): Promise<void> {
  statusCb = null;
  currentUrl = null;
  savedPosition = 0;
  sourceSetter?.({ html: '<html><body style="background:transparent"></body></html>' });
}
