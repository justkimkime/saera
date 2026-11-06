import test from 'node:test';
import assert from 'node:assert/strict';
import {travelDates,createItinerary,addItineraryPlace,moveItineraryEntry,readItineraries} from './itineraries.js';
const place=(id)=>({id,service:'ko',lang:'ko',theme:'general',title:`Place ${id}`,address:'Seoul',lat:37.5,lng:127});
const trip=()=>createItinerary('Trip','2026-11-05','2026-11-07','ko');
test('dates are consecutive, valid, timezone-independent and at most seven days',()=>{
 assert.equal(travelDates('2026-12-29','2027-01-04').length,7);
 assert.equal(travelDates('2028-02-28','2028-03-01').length,3);
 for(const dates of [['2026-11-05','2026-11-12'],['2026-11-05','2026-11-04'],['2026-02-30','2026-03-01'],['','']]) assert.throws(()=>travelDates(...dates));
});
test('addition uses independent snapshots, rejects same-day duplicates, allows different days',()=>{
 const original=trip();const p=place('a');const next=addItineraryPlace(original,original.days[0].date,p);
 assert.equal(original.days[0].entries.length,0);
 p.title='Changed';assert.equal(next.days[0].entries[0].place.title,'Place a');
 assert.throws(()=>addItineraryPlace(next,next.days[0].date,place('a')),/duplicate/);
 assert.equal(addItineraryPlace(next,next.days[1].date,place('a')).days[1].entries.length,1);
 assert.throws(()=>addItineraryPlace(next,'invalid',p),/day/);
});
test('reorder and cross-day move preserve entry identity and prevent duplicate destinations',()=>{
 let value=trip();const date=value.days[0].date;
 for(const id of ['a','b','c'])value=addItineraryPlace(value,date,place(id));
 const first=value.days[0].entries[0].id;
 value=moveItineraryEntry(value,first,date,2);
 assert.deepEqual(value.days[0].entries.map(e=>e.place.id),['b','c','a']);
 value=moveItineraryEntry(value,first,value.days[1].date,0);
 assert.equal(value.days[1].entries[0].id,first);
 assert.equal(value.days[0].entries.length,2);
 value=addItineraryPlace(value,date,place('a'));
 assert.throws(()=>moveItineraryEntry(value,first,date,0),/duplicate/);
});
test('browser storage roundtrip retains daily notes, order, language and snapshots',()=>{
 let value=addItineraryPlace(trip(),'2026-11-05',place('a'));value.days[0].note='Travel notes';
 const storage={getItem:()=>JSON.stringify([value,{id:'broken',days:[]}])};
 assert.deepEqual(readItineraries(storage),[value]);
 assert.throws(()=>readItineraries({getItem:()=>'{broken'}));
 assert.throws(()=>readItineraries({getItem:()=>'{"not":"array"}'}));
});
