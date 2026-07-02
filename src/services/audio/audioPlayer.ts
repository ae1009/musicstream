export const AUDIO_HTML = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width"></head><body>
<audio id="a" playsinline></audio>
<script>
var a=document.getElementById('a');
var lastDur=0;
function post(obj){window.ReactNativeWebView.postMessage(JSON.stringify(obj));}
a.addEventListener('durationchange',function(){if(a.duration&&!isNaN(a.duration))lastDur=a.duration;});
a.addEventListener('timeupdate',function(){
  post({t:'p',pos:a.currentTime,dur:isNaN(a.duration)?lastDur:a.duration,paused:a.paused});
});
a.addEventListener('ended',function(){post({t:'e',dur:isNaN(a.duration)?lastDur:a.duration});});
a.addEventListener('error',function(){post({t:'err',code:a.error?a.error.code:-1});});
a.addEventListener('canplay',function(){post({t:'ready',dur:isNaN(a.duration)?lastDur:a.duration});});
window.rnAudio=function(cmd,arg){
  switch(cmd){
    case 'load': a.src=arg; a.load(); a.play().catch(function(){}); break;
    case 'pause': a.pause(); break;
    case 'resume': a.play().catch(function(){}); break;
    case 'seek': a.currentTime=parseFloat(arg); break;
    case 'stop': a.pause(); a.src=''; break;
  }
};
</script></body></html>`;

let webViewRef: { injectJavaScript: (code: string) => void } | null = null;
let webViewReady = false;
let pendingLoad: { url: string } | null = null;
let statusCb: ((s: any) => void) | null = null;

export function registerAudioWebView(ref: any) {
  webViewRef = ref;
}

export function setWebViewReady() {
  webViewReady = true;
  if (pendingLoad) {
    const { url } = pendingLoad;
    pendingLoad = null;
    _doLoad(url);
  }
}

export function handleAudioMessage(data: string) {
  try {
    const msg = JSON.parse(data);
    if (!statusCb) return;
    switch (msg.t) {
      case 'ready':
        statusCb({ isLoaded: true, isPlaying: true, isBuffering: false, positionMillis: 0, durationMillis: msg.dur * 1000, didJustFinish: false });
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

function inject(code: string) {
  webViewRef?.injectJavaScript(code + ';true;');
}

function _doLoad(url: string) {
  inject(`window.rnAudio('load',${JSON.stringify(url)})`);
}

export async function setupAudio(): Promise<void> {}

export async function loadAndPlay(url: string, onStatus: (s: any) => void): Promise<void> {
  statusCb = onStatus;
  onStatus({ isLoaded: true, isPlaying: true, isBuffering: true, positionMillis: 0, durationMillis: 0, didJustFinish: false });
  if (!webViewReady) {
    pendingLoad = { url };
    return;
  }
  _doLoad(url);
}

export async function pauseAudio(): Promise<void> { inject(`window.rnAudio('pause','')`); }
export async function resumeAudio(): Promise<void> { inject(`window.rnAudio('resume','')`); }
export async function seekAudio(positionMs: number): Promise<void> { inject(`window.rnAudio('seek','${positionMs / 1000}')`); }
export async function setAudioRate(_rate: number): Promise<void> {}
export async function stopAudio(): Promise<void> { statusCb = null; inject(`window.rnAudio('stop','')`); }
