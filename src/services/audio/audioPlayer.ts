// Persistent WebView strategy:
// - WebView loads INITIAL_HTML once and never reloads
// - New tracks are loaded via injectJavaScript(window.loadTrack(url, autoplay))
// - After first user tap, hadFirstPlay=true → subsequent tracks autoplay
// - This preserves the document's user-activation state across track changes

let webViewRef: { injectJavaScript: (code: string) => void } | null = null;
let sourceSetter: ((src: { html: string }) => void) | null = null;
let statusCb: ((s: any) => void) | null = null;
let savedPosition = 0;
let currentUrl: string | null = null;
let hadFirstPlay = false;

export const INITIAL_HTML = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:transparent;overflow:hidden;display:flex;align-items:center;justify-content:center}
#b{width:90%;height:90%;border-radius:50%;background:#1A2E1A;display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:rgba(255,255,255,0.2);transition:opacity 0.1s}
#b:active{opacity:0.7}
</style></head><body>
<div id="b" onclick="tap()">
  <svg id="pi" width="42%" height="42%" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M8 5v14l11-7z"/></svg>
  <svg id="si" width="42%" height="42%" viewBox="0 0 24 24" fill="#FFFFFF" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
</div>
<audio id="a" playsinline></audio>
<script>
var a=document.getElementById('a'),pi=document.getElementById('pi'),si=document.getElementById('si');
var lastDur=0;
function post(o){try{window.ReactNativeWebView.postMessage(JSON.stringify(o));}catch(e){}}
function upd(){pi.style.display=a.paused?'':'none';si.style.display=a.paused?'none':'';}
function tap(){
  if(!a.src){return;}
  if(a.paused){
    a.play().then(function(){upd();post({t:'playtap'});})
            .catch(function(e){post({t:'err',msg:e.toString()});});
  } else {
    a.pause();upd();post({t:'pausetap'});
  }
}
window.loadTrack=function(url,autoplay){
  a.src=url;
  a.load();
  upd();
  if(autoplay){
    a.play().then(function(){upd();post({t:'playtap'});})
            .catch(function(e){
              upd();
              post({t:'err',msg:'auto:'+e.toString()});
            });
  }
};
a.addEventListener('durationchange',function(){if(a.duration&&!isNaN(a.duration))lastDur=a.duration;});
a.addEventListener('canplay',function(){post({t:'ready',dur:isNaN(a.duration)?lastDur:a.duration});});
a.addEventListener('timeupdate',function(){
  var dur=isNaN(a.duration)?lastDur:a.duration;
  upd();
  post({t:'p',pos:a.currentTime,dur:dur,paused:a.paused});
});
a.addEventListener('ended',function(){
  upd();
  post({t:'e',dur:isNaN(a.duration)?lastDur:a.duration});
});
a.addEventListener('error',function(){
  post({t:'err',code:a.error?a.error.code:-1,msg:a.error?a.error.message:''});
});
window.rnPause=function(){if(!a.paused){a.pause();upd();}};
window.rnResume=function(){
  if(a.src&&a.paused){
    a.play().then(function(){upd();post({t:'playtap'});})
            .catch(function(e){post({t:'err',msg:e.toString()});});
  }
};
window.rnSeek=function(t){a.currentTime=t;};
</script></body></html>`;

export function registerAudioWebView(ref: any) { webViewRef = ref; }

export function registerSourceSetter(fn: (src: { html: string }) => void) {
  sourceSetter = fn;
  fn({ html: INITIAL_HTML }); // Load once — never change again
}

export function setWebViewReady() {
  // WebView (re)loaded: reset user-activation tracking
  hadFirstPlay = false;
  // Re-show current track play button if there was one
  if (currentUrl) {
    const safe = currentUrl.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    webViewRef?.injectJavaScript(`window.loadTrack("${safe}", false);true;`);
  }
}

export function handleAudioMessage(data: string) {
  try {
    const msg = JSON.parse(data);
    if (msg.t === 'p' && msg.pos != null) savedPosition = msg.pos;
    if (msg.t === 'playtap') hadFirstPlay = true;
    if (!statusCb) return;
    switch (msg.t) {
      case 'playtap':
        statusCb({ isLoaded: true, isPlaying: true, isBuffering: false, positionMillis: savedPosition * 1000, durationMillis: 0, didJustFinish: false });
        break;
      case 'pausetap':
        statusCb({ isLoaded: true, isPlaying: false, isBuffering: false, positionMillis: savedPosition * 1000, durationMillis: 0, didJustFinish: false });
        break;
      case 'ready':
        statusCb({ isLoaded: true, isPlaying: false, isBuffering: false, positionMillis: 0, durationMillis: (msg.dur || 0) * 1000, didJustFinish: false });
        break;
      case 'p':
        statusCb({ isLoaded: true, isPlaying: !msg.paused, isBuffering: false, positionMillis: msg.pos * 1000, durationMillis: (msg.dur || 0) * 1000, didJustFinish: false });
        break;
      case 'e':
        statusCb({ isLoaded: true, isPlaying: false, isBuffering: false, positionMillis: (msg.dur || 0) * 1000, durationMillis: (msg.dur || 0) * 1000, didJustFinish: true });
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
  const safe = url.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  // autoplay=true only if user has previously tapped play (preserves user-activation)
  webViewRef?.injectJavaScript(`window.loadTrack("${safe}", ${hadFirstPlay});true;`);
}

export async function pauseAudio(): Promise<void> {
  webViewRef?.injectJavaScript('window.rnPause();true;');
}

export async function resumeAudio(): Promise<void> {
  webViewRef?.injectJavaScript('window.rnResume();true;');
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
  webViewRef?.injectJavaScript('window.rnPause();a.src="";a.load();true;');
}
