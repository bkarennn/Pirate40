// Run: node Pirate40/tests/game.test.cjs
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
function boot(storage = new Map(), now = 1000000) {
  const elements = new Map(), handlers = new Map(), timeouts = [];
  const clock = {now};
  const audioControl={blocked:false,instances:[],plays:0,pauses:0};
  class FakeAudio {
    constructor(src){this.src=src;this.paused=true;this.currentTime=0;audioControl.instances.push(this);}
    play(){audioControl.plays++;if(audioControl.blocked)return Promise.reject(new Error('NotAllowedError'));this.paused=false;return Promise.resolve();}
    pause(){audioControl.pauses++;this.paused=true;}
  }
  function el(key) {
    if(elements.has(key)) return elements.get(key);
    const classes = new Set();
    const node = {innerHTML:'',textContent:'',dataset:{},attrs:{},value:'',
      classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x),toggle(x,force){const on=force===undefined?!classes.has(x):force;on?classes.add(x):classes.delete(x);return on;}},
      addEventListener(type,fn){const k=key+':'+type;handlers.set(k,[...(handlers.get(k)||[]),fn]);},
      setAttribute(k,v){this.attrs[k]=v;},focus(){},click(){fire(key,'click');},
      querySelector:el,querySelectorAll(selector){return selector==='[data-map-action]'?['in','out','center','world'].map(a=>{const b=el('[data-map-action="'+a+'"]');b.dataset.mapAction=a;return b;}):[];},
      getBoundingClientRect(){return {width:800,height:400};},setPointerCapture(){}}
    elements.set(key,node);return node;
  }
  function fire(key,type,target={}) {const e={target:{id:'',closest:()=>null,...target},preventDefault(){},...target};(handlers.get(key+':'+type)||[]).forEach(fn=>fn(e));}
  class FakeDate extends Date {static now(){return clock.now;}}
  const context=vm.createContext({console,structuredClone,Audio:FakeAudio,Date:FakeDate,Event:class{constructor(type){this.type=type;}},AbortController,
    ResizeObserver:class{observe(){}disconnect(){}},matchMedia:()=>({matches:true}),
    setInterval:()=>1,clearInterval(){},setTimeout:fn=>{timeouts.push(fn);return timeouts.length;},clearTimeout(){},confirm:()=>false,
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
    document:{querySelector:el,querySelectorAll:()=>[],getElementById:id=>el('#'+id),addEventListener:(t,f)=>el('document').addEventListener(t,f),dispatchEvent:e=>fire('document',e.type)},
    location:{reload(){}},addEventListener:(t,f)=>el('window').addEventListener(t,f)});
  context.window=context;
  for(const file of ['script.js','ia.js','world-data.js','map.js','security.js']) new vm.Script(fs.readFileSync(path.join(root,file),'utf8'),{filename:file}).runInContext(context);
  return {el,fire,clock,storage,audioControl,run:code=>vm.runInContext(code,context)};
}
const g=boot();
assert.equal(g.run('state.unlocked'),false);
g.run('activate()');
assert.equal(g.run('apps.length'),8);
g.run('apps.forEach(a=>{state.page=a.id;render();if(!content.innerHTML)throw Error(a.id);})');
assert.equal(g.run('startSecurityAlarm()'),true);
assert.equal(g.run('securityRemaining()'),90);
assert.equal(g.run('startSecurityAlarm()'),false);
g.run('closeSecuritySector("a");closeSecuritySector("a");closeSecuritySector("invalid")');
assert.equal(g.run('state.security.closed.length'),1);
g.clock.now+=20000;g.run('goHome();securityTick()');assert.equal(g.run('securityRemaining()'),70);
const resumed=boot(g.storage,g.clock.now);assert.equal(resumed.run('securityRemaining()'),70);assert.equal(resumed.run('state.security.closed.length'),1);
resumed.run('activate();SECURITY_SECTORS.forEach(s=>closeSecuritySector(s.id))');assert.equal(resumed.run('state.security.status'),'contained');
resumed.clock.now+=100000;resumed.run('securityTick()');assert.equal(resumed.run('state.security.status'),'contained');
resumed.run('restartAfterSecurityFailure();activate()');
resumed.run('state.notes.push({id:9,title:"Keep",body:"Personal note",date:"2091"});state.sent.maya=0;state.wallpaper="tide";startSecurityAlarm();closeSecuritySector("a")');
resumed.clock.now+=90000;resumed.run('closeSecuritySector("b")');assert.equal(resumed.run('state.security.status'),'failed');assert.equal(resumed.run('state.security.closed.length'),1);
assert.equal(resumed.el('#securityFailure').classList.contains('hidden'),false);
resumed.clock.now+=4500;resumed.run('securityTick()');assert.equal(resumed.run('state.unlocked'),false);assert.equal(resumed.run('state.security.status'),'idle');assert.equal(resumed.run('state.notes.at(-1).title'),'Keep');assert.equal(resumed.run('state.wallpaper'),'tide');assert.equal(resumed.run('Object.keys(state.sent).length'),0);
resumed.run('activate();startSecurityAlarm()');resumed.clock.now+=61000;resumed.run('securityTick();securityTick()');assert.equal(resumed.run('state.notifications.filter(n=>n.title==="Integridade da base em risco").length'),1);
const expired=boot(resumed.storage,resumed.clock.now+40000);assert.equal(expired.run('state.security.status'),'failed');
// A fresh save must not share mutable defaults with the reset template.
const fresh=boot();fresh.run('activate();state.sent.maya=0;state.read.push("maya");startSecurityAlarm()');fresh.clock.now+=90000;fresh.run('securityTick()');fresh.clock.now+=4500;fresh.run('securityTick()');assert.equal(fresh.run('Object.keys(state.sent).length'),0);assert.equal(fresh.run('state.read.length'),0);assert.equal(fresh.run('state.notifications.length'),0);
// Map geometry, wiring, bounded zoom, recenter and drag.
const m=boot();m.run('activate();state.page="mapa";render()');assert.ok(m.el('#content').innerHTML.includes('worldMap'));assert.equal(m.run('WORLD_COUNTRIES.length'),177);assert.ok(m.run('WORLD_COUNTRIES.some(c=>c.name.includes("Austr"))'));
for(let i=0;i<30;i++)m.fire('[data-map-action="in"]','click');assert.equal(m.run('mapView.zoom'),8);
for(let i=0;i<30;i++)m.fire('[data-map-action="out"]','click');assert.equal(m.run('mapView.zoom'),1);
m.fire('[data-map-action="center"]','click');assert.equal(m.run('mapView.x'),350);assert.equal(m.run('mapView.y'),115);
m.fire('#worldMap','pointerdown',{button:0,pointerId:1,clientX:200,clientY:200});m.fire('#worldMap','pointermove',{pointerId:1,clientX:250,clientY:210});assert.ok(m.run('mapView.x')<350);m.fire('#worldMap','pointercancel',{pointerId:1});
m.run('state.locator=false;render()');assert.ok(m.el('#content').innerHTML.includes('Última posição conhecida'));
// Existing conversation, IA, notes and local save remain usable.
m.run('state.page="mensagens";state.openChat="maya";render()');m.fire('#content','click',{closest:s=>s==='[data-reply]'?{dataset:{reply:'0'}}:null});assert.ok(m.el('#content').innerHTML.includes('está digitando'));assert.ok(!m.el('#content').innerHTML.includes('Para de brincar.'));m.clock.now+=4000;m.run('tickConversations()');assert.ok(m.el('#content').innerHTML.includes('Para de brincar.'));
m.run('state.page="ia";render()');m.fire('#content','click',{closest:s=>s==='[data-ia]'?{dataset:{ia:'sinal'}}:null});assert.ok(m.el('#content').innerHTML.includes('está digitando'));m.clock.now+=4000;m.run('tickConversations()');assert.ok(m.el('#content').innerHTML.includes('DESLIGADO'));
m.run('state.page="notas";render()');m.el('#noteTitle').value='<nota>';m.el('#noteBody').value='Texto salvo';m.fire('#content','click',{id:'saveNote'});assert.ok(m.el('#content').innerHTML.includes('&lt;nota&gt;'));assert.equal(JSON.parse(m.storage.get('pirate40-save-v1')).notes[0].body,'Texto salvo');
console.log('PASS: 8 apps; alarm start, duplicate guard, manual doors, deadline, reload, victory, failure, auto-reset, warnings; geography, zoom, pan, recenter; messages, IA, notes and persistence.');

// Narrative gates, ordered delivery, persistent read state and audio lifecycle.
globalThis.testDone=(async()=>{
 const n=boot();assert.equal(n.audioControl.plays,0);assert.equal(n.audioControl.instances.length,1);
 const audio=n.audioControl.instances[0];assert.ok(decodeURIComponent(audio.src).endsWith('अलार्मmp3.mp3'));assert.equal(audio.loop,true);
 n.run('activate()');n.clock.now+=100000;n.run('securityTick()');assert.equal(n.run('state.security.status'),'idle');
 n.run('["mensagens","mapa","galeria","notas","seguranca","ia"].forEach(page=>{state.page=page;render()});goHome()');
 n.clock.now+=6000;n.run('securityTick()');assert.equal(n.run('state.security.status'),'idle'); // Opening IA alone is not a conversation.
 n.run('state.page="ia";render()');n.fire('#content','click',{closest:s=>s==='[data-ia]'?{dataset:{ia:'base'}}:null});n.run('goHome()');
 n.clock.now+=4000;n.run('securityTick()');assert.equal(n.run('state.security.status'),'idle');
 n.run('state.page="mapa";render()');n.clock.now+=6000;n.run('securityTick()');assert.equal(n.run('state.security.status'),'idle');
 n.run('goHome()');n.clock.now+=5000;n.run('securityTick()');await Promise.resolve();
 assert.equal(n.run('state.security.status'),'active');assert.equal(n.run('securityRemaining()'),90);assert.equal(audio.paused,false);
 n.run('playSecurityAudio();playSecurityAudio()');assert.equal(n.audioControl.instances.length,1);assert.equal(n.audioControl.plays,1);
 n.run('apps.forEach(a=>{state.page=a.id;render();if(!content.innerHTML)throw Error(a.id);})');
 n.run('state.page="notas";render()');n.el('#noteBody').value='Rascunho que não pode sumir';
 n.clock.now+=3500;n.run('securityTick()');assert.equal(n.run('state.security.messages.length'),1);assert.equal(n.el('#noteBody').value,'Rascunho que não pode sumir');assert.equal(n.run('state.page'),'notas');
 assert.equal(n.run('state.security.messages[0].sender'),'Maya');assert.equal(n.run('state.security.messages[0].time'),'03:45:03');
 n.clock.now+=3500;n.run('securityTick()');assert.equal(n.run('state.security.messages[1].sender'),'Ravi');
 const r=boot(n.storage,n.clock.now);await Promise.resolve();r.run('activate()');assert.equal(r.run('state.security.messages.length'),2);
 r.clock.now+=28000;r.run('securityTick();securityTick()');assert.equal(r.run('state.security.messages.length'),10);
 assert.equal(r.run('state.security.messages.map(m=>m.text).join("|")'),r.run('INVASION_DIALOGUE.map(m=>m[1]).join("|")'));
 assert.equal(r.run('getUnreadMessageCount()'),13);r.run('state.page="mensagens";state.openChat="emergency";render()');assert.equal(r.run('getUnreadMessageCount()'),3);
 r.run('state.page="seguranca";render();SECURITY_SECTORS.forEach(s=>closeSecuritySector(s.id))');assert.equal(r.audioControl.instances[0].paused,true);assert.equal(r.run('state.security.status'),'contained');
 r.clock.now+=14000;r.run('securityTick();securityTick()');assert.equal(r.run('state.security.messages.length'),14);assert.equal(r.run('state.security.messages.at(-1).text'),'40, a gente precisa conversar.');assert.equal(r.run('startSecurityAlarm()'),false);
 const won=boot(r.storage,r.clock.now);assert.equal(won.run('state.security.messages.length'),14);won.run('activate();goHome()');won.clock.now+=100000;won.run('securityTick()');assert.equal(won.run('state.security.status'),'contained');assert.equal(won.audioControl.plays,0);
 const blocked=boot();blocked.audioControl.blocked=true;blocked.run('activate();startSecurityAlarm()');for(let flush=0;flush<10;flush++)await Promise.resolve();
 assert.equal(blocked.run('audioBlocked'),true);assert.equal(blocked.el('#securitySound').textContent,'Ativar som do alarme');assert.equal(blocked.run('state.security.status'),'active');
 blocked.audioControl.blocked=false;blocked.fire('#securitySound','click');await Promise.resolve();assert.equal(blocked.audioControl.instances[0].paused,false);
 blocked.clock.now+=90000;blocked.run('securityTick()');assert.equal(blocked.audioControl.instances[0].paused,true);assert.equal(blocked.run('state.security.status'),'failed');
 blocked.clock.now+=4500;blocked.run('securityTick()');assert.equal(blocked.run('state.security.messages.length'),0);assert.equal(blocked.run('state.security.explored.length'),0);assert.equal(blocked.run('state.security.triggered'),false);assert.equal(blocked.run('state.unlocked'),false);assert.equal(blocked.run('chats.emergency'),undefined);
 const fast=boot();fast.run('activate();startSecurityAlarm();SECURITY_SECTORS.forEach(s=>closeSecuritySector(s.id))');await Promise.resolve();assert.equal(fast.audioControl.instances[0].paused,true);fast.clock.now+=15000;fast.run('securityTick()');assert.equal(fast.run('state.security.messages.length'),4);assert.equal(fast.run('state.security.messages[0].text'),'Conseguimos...');
 const post=boot();post.run('activate();startSecurityAlarm();SECURITY_SECTORS.forEach(s=>closeSecuritySector(s.id))');post.clock.now+=3500;post.run('securityTick()');const postReload=boot(post.storage,post.clock.now);postReload.clock.now+=11000;postReload.run('securityTick();securityTick()');assert.equal(postReload.run('state.security.messages.length'),4);
 const prime=boot();await prime.run('prepareSecurityAudio()');assert.equal(prime.audioControl.instances[0].paused,true);assert.equal(prime.run('audioPending'),false);assert.equal(prime.run('state.security.status'),'idle');
 console.log('PASS: exploration gates, delayed home trigger, one event per match, original MP3, singleton loop, blocked autoplay/retry, ordered messages, read counters, reload, victory aftermath, quick victory, failure audio stop and clean restart.');
})();

const typing=boot();typing.run('activate();state.page="ia";render()');
const ask=()=>typing.fire('#content','click',{closest:s=>s==='[data-ia]'?{dataset:{ia:'base'}}:null});ask();ask();
assert.equal(JSON.parse(typing.storage.get('pirate40-ia-v1')).length,2);
const typingReload=boot(typing.storage,typing.clock.now);typingReload.run('activate();state.page="ia";render()');assert.ok(typingReload.el('#content').innerHTML.includes('está digitando'));
typingReload.clock.now+=4000;typingReload.run('state.page="notas";render();tickConversations()');assert.equal(typingReload.run('state.page'),'notas');assert.equal(JSON.parse(typingReload.storage.get('pirate40-ia-v1')).length,3);
typing.run('restartAfterSecurityFailure()');typing.clock.now+=4000;typing.run('tickConversations()');assert.equal(JSON.parse(typing.storage.get('pirate40-ia-v1')).length,1);
const contact=boot();contact.run('activate();state.page="mensagens";state.openChat="maya";render()');contact.fire('#content','click',{closest:s=>s==='[data-reply]'?{dataset:{reply:'0'}}:null});
const contactReload=boot(contact.storage,contact.clock.now);contactReload.clock.now+=4000;contactReload.run('tickConversations();activate();state.page="mensagens";state.openChat="maya";render()');assert.ok(contactReload.el('#content').innerHTML.includes('Para de brincar.'));assert.ok(!contactReload.el('#content').innerHTML.includes('está digitando'));
console.log('PASS: typing delay, single pending IA reply, pending replies survive reload, reset cancels replies, background delivery keeps current app.');
