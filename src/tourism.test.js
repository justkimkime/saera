import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePlace,parseResponse,favoriteKey,serviceFor} from './tourism.js';
test('normalizes regular and wellness schemas without treating missing coordinates as valid',()=>{
 const regular=normalizePlace({contentid:1,title:'A &amp; B',addr1:'서울',addr2:'중구',mapx:'126.9',mapy:'37.5',firstimage:'javascript:alert(1)'},'ko','ko','general');
 assert.equal(regular.title,'A & B');assert.equal(regular.address,'서울 중구');assert.equal(regular.lng,126.9);assert.equal(regular.image,'');
 const wellness=normalizePlace({contentId:2,baseAddr:'부산',detailAddr:'해운대',mapX:'0',mapY:'',thumbImage:'https://example.com/a.jpg'},'wellness','en','wellness');
 assert.equal(wellness.id,'2');assert.equal(wellness.lat,null);assert.equal(wellness.address,'부산 해운대');assert.equal(wellness.image,'https://example.com/a.jpg');
});
test('handles single results, empty results, and provider errors even on HTTP 200',()=>{
 assert.equal(parseResponse({data:{response:{header:{resultCode:'0000'},body:{totalCount:'1',items:{item:{title:'A'}}}}}}).items.length,1);
 assert.deepEqual(parseResponse({data:{response:{body:{totalCount:0,items:''}}}}),{items:[],total:0});
 assert.throws(()=>parseResponse({data:{resultCode:'30',resultMsg:'Invalid key'}}),/Invalid key/);
 assert.throws(()=>parseResponse({format:'text',raw:'error'}));
});
test('keeps saves distinct across theme and language',()=>{
 const p={id:'1',theme:'general',service:'ko',lang:'ko'};
 assert.notEqual(favoriteKey(p),favoriteKey({...p,theme:'access'}));assert.notEqual(favoriteKey(p),favoriteKey({...p,lang:'en'}));
 assert.equal(serviceFor('general','en'),'en');assert.equal(serviceFor('wellness','en'),'wellness');
});
test('forwards a wellness theme in every search mode without leaking it to general searches',async t=>{
 const {requestTour}=await import('./tourism.js');
 const calls=[];
 t.mock.method(globalThis,'fetch',async url=>{calls.push(new URL(url,'http://localhost'));return {json:async()=>({data:{response:{header:{resultCode:'0000'},body:{totalCount:0,items:''}}}})};});
 for(const prefix of ['areaBasedList','searchKeyword','locationBasedList'])await requestTour('wellness',prefix,{wellnessThemaCd:'EX050100',langDivCd:'KOR'});
 assert.ok(calls.every(url=>url.searchParams.get('wellnessThemaCd')==='EX050100'));
 await requestTour('ko','areaBasedList',{wellnessThemaCd:'EX050100'});
 assert.equal(calls.at(-1).searchParams.has('wellnessThemaCd'),false);
});
