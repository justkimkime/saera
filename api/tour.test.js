import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHandler} from './tour.js';
async function call(url,options={}){const res={setHeader(){},end(s){this.body=JSON.parse(s)}};await createHandler(options)({method:'GET',url,headers:{}},res);return res;}
test('rejects missing key without network call',async()=>{const r=await call('/?service=ko&operation=areaBasedList2',{getKey:()=>''});assert.equal(r.statusCode,503)});
test('restricts routes and rejects browser keys',async()=>{const o={getKey:()=> 'secret'};assert.equal((await call('/?service=evil&operation=areaBasedList2',o)).statusCode,400);assert.equal((await call('/?service=ko&operation=areaBasedList2&serviceKey=leak',o)).statusCode,400)});
test('forwards to fixed endpoint, encodes key once and redacts response',async()=>{let captured;const key='abc+/=';const r=await call('/?service=wellness&operation=searchKeyword&langDivCd=ENG&keyword=spa',{getKey:()=>key,fetcher:async url=>{captured=url;return{status:200,text:async()=>JSON.stringify({echo:key,encoded:encodeURIComponent(key)})}}});assert.equal(captured.hostname,'apis.data.go.kr');assert.equal(captured.pathname,'/B551011/WellnessTursmService/searchKeyword');assert.equal(captured.searchParams.get('serviceKey'),key);assert.equal(r.body.data.echo,'[REDACTED]');assert(!JSON.stringify(r.body).includes(key))});
test('preserves XML errors, validates required fields and caps rows',async()=>{const o={getKey:()=> 'secret',fetcher:async()=>({status:200,text:async()=>'<error>denied</error>'})};assert.equal((await call('/?service=wellness&operation=searchKeyword',o)).statusCode,400);assert.equal((await call('/?service=ko&operation=areaBasedList2&numOfRows=1000',o)).statusCode,400);const r=await call('/?service=ko&operation=areaBasedList2',o);assert.equal(r.body.format,'text');assert.equal(r.body.raw,'<error>denied</error>')});
test('uses one common key for all five services',async()=>{
 for(const service of ['ko','en','access','pet','wellness']){
  let usedKey;const operation=service==='wellness'?'areaBasedList':'areaBasedList2';
  const r=await call(`/?service=${service}&operation=${operation}${service==='wellness'?'&langDivCd=KOR':''}`,{
   getKey:()=> 'common-secret',fetcher:async url=>{usedKey=url.searchParams.get('serviceKey');return{status:200,text:async()=>'{"ok":true}'}}
  });
  assert.equal(r.statusCode,200);assert.equal(usedKey,'common-secret');
 }
});
test('missing key identifies common variable',async()=>{
 const r=await call('/?service=pet&operation=areaBasedList2',{getKey:()=>''});
 assert.equal(r.statusCode,503);assert.match(r.body.error,/TOUR_API_KEY/);
});
