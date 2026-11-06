export function responseInfo(result) {
 const data=result?.data;
 const header=data?.response?.header||data||{};
 const body=data?.response?.body;
 const raw=body?.items?.item;
 const items=Array.isArray(raw)?raw:raw&&typeof raw==='object'?[raw]:[];
 return {code:header.resultCode,message:header.resultMsg,body,items};
}
export const isEmpty=value=>value==null||typeof value==='string'&&value.trim()==='';
export function fieldLabel(name,fields=[]) {
 return fields.find(f=>f.name===name)?.label||fields.find(f=>f.name.toLowerCase()===name.toLowerCase())?.label||name;
}
export function textValue(value) {
 if(value===null)return 'null';if(value===undefined)return '정보 없음';
 if(typeof value==='object')return JSON.stringify(value,null,2);
 return String(value).replace(/<br\s*\/?\s*>/gi,'\n').replace(/<\/(p|div|li)>/gi,'\n').replace(/<[^>]*>/g,'').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&quot;/gi,'"').replace(/&#39;/g,"'");
}
export function safeUrl(value) {
 if(typeof value!=='string')return null;
 try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)?url.href:null;}catch{return null;}
}
