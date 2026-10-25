import test from 'node:test';
import assert from 'node:assert/strict';
import {CROPS,freshState,sleep} from './simulation.js';
import {MAX_AGENDA_ITEMS,validDate,calendarDate,shiftSeason,migrateAgenda,saveAppointment,deleteAppointment,appointmentsForDate,eventsForDate} from './calendar-rules.js';
const date=(day=1,season=0,year=1)=>({year,season,day});
test('calendar navigation matches the game 30-day season and year rollover',()=>{
 const state=freshState(false);Object.assign(state,date(30,3,4));sleep(state);assert.deepEqual(calendarDate(state),date(1,0,5));
 assert.deepEqual(shiftSeason(date(17,3,4),1),date(17,0,5));
 assert.deepEqual(shiftSeason(date(17,0,5),-1),date(17,3,4));
 assert.deepEqual(shiftSeason(date(30,2,3),4),date(30,2,4));
 assert.deepEqual(shiftSeason(date(),-4),date());
 assert.deepEqual(shiftSeason(date(5,3,9999),1),date(5,3,9999));
});
test('invalid dates and corrupt agenda records are rejected and text is bounded',()=>{
 for(const value of[null,[],date(0),date(31),date(1,4),date(1,-1),date(1,0,0),date(1,0,10000),{...date(),year:NaN},{...date(),day:'1'}])assert.equal(validDate(value),false);
 const state={agenda:[null,{...date(),id:'one',title:'  A\nB  ',note:'x'.repeat(900),time:'09:30'},{...date(),id:'one',title:'duplicate',time:''},{...date(),id:'evil<script>',title:'bad',time:''},{...date(),id:'two',title:'bad hour',time:'29:01'},{...date(),id:'three',title:'',time:''}]};
 const result=migrateAgenda(state);assert.equal(result.length,1);assert.equal(result[0].title,'A B');assert.equal(result[0].note.length,280);assert.deepEqual(migrateAgenda({agenda:{}}),[]);
});
test('agenda appointments create, edit, order by time, survive JSON save, and delete',()=>{
 const state=freshState(false),first=saveAppointment(state,{...date(12,1,3),title:'Sementes',time:'10:15',note:'Milho'}),second=saveAppointment(state,{...date(12,1,3),title:'Regar',time:'06:00'});
 assert.equal(first.changed,true);assert.equal(second.changed,true);
 const restored=JSON.parse(JSON.stringify(state));assert.equal(appointmentsForDate(restored,date(12,1,3))[0].title,'Regar');
 assert.equal(appointmentsForDate(restored,date(12,1,2)).length,0);
 assert.equal(saveAppointment(restored,{...first.item,title:'Comprar sementes',time:'08:00'}).changed,true);assert.equal(restored.agenda.length,2);assert.equal(restored.agenda.find(item=>item.id===first.item.id).title,'Comprar sementes');
 assert.equal(deleteAppointment(restored,first.item.id).changed,true);assert.equal(deleteAppointment(restored,first.item.id).changed,false);assert.equal(restored.agenda.length,1);
});
test('invalid appointment mutations do not create entries or silently change dates',()=>{
 const state={};for(const input of[null,{}, {...date(31),title:'A',time:''},{...date(),title:'  ',time:''},{...date(),title:'A',time:'7:00'},{...date(),title:'A',time:42},{...date(),id:'missing',title:'A',time:''}])assert.equal(saveAppointment(state,input).changed,false);
 assert.equal(state.agenda.length,0);const result=saveAppointment(state,{...date(),title:'a'.repeat(200),time:'',note:'b'.repeat(600)});assert.equal(result.changed,true);assert.equal(result.item.title.length,80);assert.equal(result.item.note.length,280);
});
test('agenda count is bounded on migration and creation while edits remain possible',()=>{
 const state={agenda:Array.from({length:MAX_AGENDA_ITEMS+20},(_,i)=>({...date(),id:'entry_'+i,title:'Entry '+i,time:''}))};migrateAgenda(state);assert.equal(state.agenda.length,MAX_AGENDA_ITEMS);
 assert.equal(saveAppointment(state,{...date(),title:'New',time:''}).changed,false);assert.equal(saveAppointment(state,{...state.agenda[0],title:'Updated'}).changed,true);assert.equal(state.agenda.length,MAX_AGENDA_ITEMS);
 deleteAppointment(state,'entry_1');assert.equal(saveAppointment(state,{...date(),title:'Room again',time:''}).changed,true);
});
test('marked dates describe the existing shipping, weather and season rules',()=>{
 const state=freshState(false);for(let day=1;day<=30;day++){const events=eventsForDate(state,date(day));assert.equal(events.find(e=>e.id==='shipping').time,'17:00');assert.equal(events.some(e=>e.kind==='weather'),day%6===0)}
 assert.equal(eventsForDate(state,date()).some(e=>e.id==='season-start'),true);assert.equal(eventsForDate(state,date(30)).some(e=>e.id==='season-end'),true);assert.deepEqual(eventsForDate(state,date(31)),[]);
});
test('every planting marker permits first harvest on day 30 under daily watering',()=>{
 for(const[id,crop]of Object.entries(CROPS)){const plantingDay=30-crop.days,events=eventsForDate({},date(plantingDay,crop.season));assert.equal(events.some(e=>e.id==='plant-'+id),true);assert.equal(eventsForDate({},date(plantingDay-1,crop.season)).some(e=>e.id==='plant-'+id),false);
 const state=freshState(false);state.season=crop.season;state.day=plantingDay;const plot=state.plots[0];plot.tilled=true;plot.crop=id;for(let i=0;i<crop.days;i++){plot.wet=true;sleep(state)}assert.equal(state.day,30);assert.equal(plot.crop,id);assert.equal(plot.age,crop.days)}
});
