/* Public Worker diagnostics. No secret value is downloaded or displayed. */
(()=>{
  'use strict';
  const base='https://apikey.elias256.workers.dev';
  const $=id=>document.getElementById(id);
  const T=(key,args)=>window.DancingI18n?.t(key,args)??key;
  const msg=$('worker-message'), badge=$('worker-badge');
  function render(lines,level){
    if(!msg||!badge)return;
    msg.textContent=lines.join('\n');msg.classList.remove('ok','bad');if(level)msg.classList.add(level);
    badge.textContent=T(level==='ok'?'BEREIT':level==='bad'?'PROBLEM':'PRÜFEN');
    badge.style.color=level==='ok'?'#00ff88':'#ffbd69';
  }
  async function check(){
    render([T('Cloudflare Worker wird geprüft ...')],'');
    if(location.protocol==='file:'){
      render([T('Lokale Datei (file://) erkannt.'),T('Bitte die App über http://localhost:8000 oder Cloudflare Pages öffnen. Danach erneut prüfen.')],'bad');
      return {status:'file-protocol',message:T('Lokale file://-URL – bitte mit lokalem HTTP-Server starten.')};
    }
    try{
      const ctrl=new AbortController();const timeout=setTimeout(()=>ctrl.abort(),11000);
      let r;
      try{r=await fetch(base+'/health',{mode:'cors',cache:'no-store',signal:ctrl.signal});}finally{clearTimeout(timeout);}
      const contentType=r.headers.get('content-type')||'';
      if(r.status===404)return renderFail(T('Auf /health kommt HTTP 404. Der Worker enthält wahrscheinlich noch nicht den neuen Projekt-Code. worker.js neu deployen.'));
      if(!contentType.includes('application/json'))return renderFail(T('Worker liefert keine JSON-Diagnose (HTTP {status}). Prüfe, ob der richtige Worker unter apikey.elias256.workers.dev liegt.',{status:r.status}));
      const d=await r.json();if(!r.ok)return renderFail(T('Statusfehler HTTP {status}: {error}',{status:r.status,error:d.error||T('Unbekannt')}));
      if(d.service!=='Dancing with SARS API')return renderFail(T('ALTE WORKER-VERSION ERKANNT (service: {service}). Du nutzt noch den alten Code. Neue cloudflare/worker.js mit Wrangler deployen; Chat-Rate-Limit-Binding wird dabei aus wrangler.jsonc eingerichtet.',{service:String(d.service||'?')}));
      const lines=[
        T('Worker: erreichbar · Version {version}',{version:d.version}),
        T('Groq Secret: {value}',{value:T(d.groq_configured?'vorhanden':'FEHLT: GROQ_API_KEY')}),
        T('Rate-Limit CHAT: {value}',{value:d.chat_rate_limit_configured?T('aktiv ({mode})',{mode:d.chat_rate_limit_mode||T('unbekannt')}):T('FEHLT: CHAT_RATE_KV oder CHAT_RATE_LIMITER (Chat blockiert)')}),
        T('Rate-Limit DATA: {value}',{value:T(d.data_rate_limit_configured?'vorhanden':'optional nicht gesetzt')}),
        T('Website-Origin: {value}',{value:!d.browser_origin?T('nicht testbar – kein Origin-Header'):d.origin_allowed?T('freigegeben ({origin})',{origin:d.browser_origin}):T('NICHT FREIGEGEBEN: {origin}',{origin:d.browser_origin})}),
      ];
      const ok=d.groq_configured&&d.chat_rate_limit_configured&&d.origin_allowed;
      lines.push(T(ok?'KI bereit zur Anfrage; die Verbindung zu Groq wurde noch nicht live getestet.':'Bitte Worker-Einstellungen korrigieren und erneut deployen.'));
      render(lines,ok?'ok':'bad');
      return {...d,status:ok?'ready':'incomplete',message:lines.join(' / ')};
    }catch(e){
      const detail=T(e.name==='AbortError'?'Zeitüberschreitung':'Netzwerk, Firewall, DNS oder Worker nicht erreichbar');
      return renderFail(T('Keine Verbindung zu {url}/health ({detail}). Worker-URL und Deployment prüfen.',{url:base,detail}));
    }
  }
  function renderFail(text){render([text],'bad');return {status:'unreachable',message:text};}
  if($('worker-check'))$('worker-check').addEventListener('click',check);
  window.DancingWorkerDiagnostics={check};
  window.addEventListener('languagechange',check);
  check();
})();
