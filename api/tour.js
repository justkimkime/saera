import { readFileSync } from 'node:fs';
const catalog = JSON.parse(readFileSync(new URL('../src/catalog.json', import.meta.url), 'utf8'));
export function createHandler({getKey = () => process.env.TOUR_API_KEY, fetcher = (...args) => fetch(...args)} = {}) {
  return async (req, res) => {
    const send = (status, body) => { res.statusCode=status; res.setHeader('Content-Type','application/json; charset=utf-8'); res.setHeader('Cache-Control','no-store'); res.end(JSON.stringify(body)); };
    if(req.method !== 'GET') return send(405,{error:'GET 요청만 지원합니다.'});
    const origin=req.headers?.origin;
    if(origin && new URL(origin).host !== req.headers.host) return send(403,{error:'다른 사이트에서의 요청은 허용하지 않습니다.'});
    const input=new URL(req.url,'http://localhost');
    const service=catalog.find(s=>s.id===input.searchParams.get('service'));
    const op=service?.operations.find(o=>o.id===input.searchParams.get('operation'));
    if(!op) return send(400,{error:'지원하지 않는 서비스 또는 기능입니다.'});
    const key=getKey()?.trim();
    if(!key) return send(503,{error:'.env.local에 TOUR_API_KEY를 설정한 뒤 개발 서버를 다시 실행하세요.'});
    const url=new URL(op.url); const allowed=new Set(op.params.map(p=>p.name));
    for(const [name,value] of input.searchParams) {
      if(['service','operation'].includes(name)) continue;
      if(name.toLowerCase()==='servicekey') return send(400,{error:'서비스키는 서버 환경변수에서만 사용합니다.'});
      if(!allowed.has(name)) return send(400,{error:`문서에 없는 요청 항목: ${name}`});
      if(value.length>2000) return send(400,{error:'입력값이 너무 깁니다.'});
      if(value.trim()) url.searchParams.set(name,value.trim());
    }
    url.searchParams.set('MobileOS',url.searchParams.get('MobileOS')||'ETC');
    url.searchParams.set('MobileApp',url.searchParams.get('MobileApp')||'TourApiLab');
    url.searchParams.set('_type','json');
    url.searchParams.set('numOfRows',url.searchParams.get('numOfRows')||'10');
    if(!/^\d+$/.test(url.searchParams.get('numOfRows')) || +url.searchParams.get('numOfRows')<1 || +url.searchParams.get('numOfRows')>100) return send(400,{error:'한 번에 조회할 결과 수는 1~100으로 입력하세요.'});
    const missing=op.params.filter(p=>p.required && p.name.toLowerCase()!=='servicekey' && !url.searchParams.get(p.name));
    if(missing.length) return send(400,{error:`필수 항목을 입력하세요: ${missing.map(p=>p.name).join(', ')}`});
    // Decoding 키를 URLSearchParams가 한 번 인코딩하도록 한다.
    url.searchParams.set('serviceKey',key);
    const started=Date.now();
    const redact=value=>{let str=String(value); for(const secret of [key,encodeURIComponent(key),url.searchParams.toString().match(/serviceKey=([^&]+)/)?.[1]].filter(Boolean)) str=str.split(secret).join('[REDACTED]'); return str;};
    try {
      const upstream=await fetcher(url,{signal:AbortSignal.timeout(20000),redirect:'error'});
      const raw=redact(await upstream.text()); let data=null;
      try{data=JSON.parse(raw);}catch{}
      return send(200,{httpStatus:upstream.status,durationMs:Date.now()-started,format:data===null?'text':'json',data,raw});
    } catch(error) { return send(502,{error:error.name==='TimeoutError'?'20초 안에 응답하지 않았습니다. 다시 시도하세요.':'관광공사 API 연결에 실패했습니다. 네트워크 또는 서비스 상태를 확인하세요.'}); }
  };
}
export default createHandler();
