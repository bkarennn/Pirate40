// Run: node Pirate40/tests/game.test.cjs
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
function boot(storage = new Map(), now = 1000000, newGame = false) {
  if(!newGame && !storage.has('pirate40-save-v1'))storage.set('pirate40-save-v1',JSON.stringify({profile:{name:'Alex',pronouns:'neutral'}}));
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
    const node = {innerHTML:'',textContent:'',dataset:{},attrs:{},style:{setProperty(){}},value:'',open:false,isConnected:true,
      showModal(){this.open=true;},close(){this.open=false;},
      classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x),toggle(x,force){const on=force===undefined?!classes.has(x):force;on?classes.add(x):classes.delete(x);return on;}},
      addEventListener(type,fn){const k=key+':'+type;handlers.set(k,[...(handlers.get(k)||[]),fn]);},
      setAttribute(k,v){this.attrs[k]=v;},focus(){},click(){fire(key,'click');},
      querySelector:el,querySelectorAll(selector){return selector==='[data-map-action]'?['in','out','center','world'].map(a=>{const b=el('[data-map-action="'+a+'"]');b.dataset.mapAction=a;return b;}):[];},
      getBoundingClientRect(){return {width:800,height:400};},setPointerCapture(){}}
    elements.set(key,node);return node;
  }
  function fire(key,type,target={}) {const e={target:{id:'',closest:()=>null,...target},preventDefault(){},...target};(handlers.get(key+':'+type)||[]).forEach(fn=>fn(e));}
  class FakeDate extends Date {static now(){return clock.now;}}
  const context=vm.createContext({console,structuredClone,performance:{now:()=>clock.now},Audio:FakeAudio,Date:FakeDate,Event:class{constructor(type){this.type=type;}},AbortController,
    ResizeObserver:class{observe(){}disconnect(){}},matchMedia:()=>({matches:true}),
    setInterval:()=>1,clearInterval(){},setTimeout:fn=>{timeouts.push(fn);return timeouts.length;},clearTimeout(){},confirm:()=>false,
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
    document:{querySelector:el,querySelectorAll:()=>[],getElementById:id=>el('#'+id),addEventListener:(t,f)=>el('document').addEventListener(t,f),dispatchEvent:e=>fire('document',e.type)},
    location:{reload(){}},addEventListener:(t,f)=>el('window').addEventListener(t,f)});
  context.window=context;
  for(const file of ['characters.js','photos.js','script.js','personal.js','ia.js','world-data.js','map.js','timeline.js','session.js','security.js']) new vm.Script(fs.readFileSync(path.join(root,file),'utf8'),{filename:file}).runInContext(context);
  return {el,fire,clock,storage,audioControl,timeouts,run:code=>vm.runInContext(code,context)};
}

function minutes(g,n){g.clock.now+=n*60000;g.run('syncGameTime();processNarrativeEvents()');}
function pick(g,choice){g.fire('#content','click',{closest:s=>s==='[data-dog-choice]'?{dataset:{dogChoice:String(choice)}}:null});}
const fresh=boot(new Map(),1000000,true);
assert.equal(fresh.run('getGameDate().toISOString()'),'2091-03-31T23:00:00.000Z');fresh.clock.now+=3600000;assert.equal(fresh.run('getGameDate().toISOString()'),'2091-03-31T23:00:00.000Z');fresh.run('activate()');assert.equal(fresh.run('state.unlocked'),false);
fresh.el('#playerName').value='Alex';fresh.el('#playerPronouns').value='neutral';fresh.fire('#identityForm','submit');assert.equal(fresh.run('state.profile.name'),'Alex');assert.equal(fresh.run('state.unlocked'),false);fresh.timeouts[0]();fresh.timeouts.at(-1)();assert.equal(fresh.run('state.unlocked'),true);
const g=boot();g.run('activate()');assert.equal(g.run('apps.length'),11);g.run('apps.forEach(a=>{state.page=a.id;render();if(!content.innerHTML)throw Error(a.id);})');
assert.equal(g.run('getGameDate().toISOString()'),'2091-03-31T23:00:00.000Z');g.run('state.page="mensagens";state.openChat="group";render()');assert.equal(g.run('state.dogStory.messages.length'),0);assert.ok(!g.run('availablePhotos().some(p=>p.id==="dog")'));
minutes(g,60);assert.equal(g.run('getGameDate().toISOString()'),'2091-04-01T00:00:00.000Z');assert.equal(g.run('state.dogStory.messages.length'),0);
minutes(g,31);assert.equal(g.run('state.dogStory.messages.length'),1);assert.equal(g.run('state.dogStory.messages[0].time'),'00:31:00');assert.equal(g.run('state.dogStory.photoUnlocked'),false);
g.clock.now+=25000;g.run('processNarrativeEvents()');assert.equal(g.run('state.dogStory.messages.length'),8);assert.equal(g.run('state.dogStory.photoUnlocked'),true);assert.equal(g.run('state.dogStory.choice'),null);
const before=JSON.stringify(JSON.parse(g.storage.get('pirate40-save-v1')).timeline.events);g.run('processNarrativeEvents();processNarrativeEvents()');assert.equal(JSON.stringify(JSON.parse(g.storage.get('pirate40-save-v1')).timeline.events),before);
g.run('state.page="mensagens";state.openChat="group";render()');assert.ok(g.el('#content').innerHTML.includes('data-dog-choice="0"'));
for(const choice of [0,1]){
 const dog=boot();dog.run('activate();advanceGameTime(92);state.page="mensagens";state.openChat="group";render()');pick(dog,choice);pick(dog,1-choice);assert.equal(dog.run('state.dogStory.choice'),choice);
 const resumed=boot(dog.storage,dog.clock.now+1000);resumed.run('activate();state.page="mensagens";state.openChat="group";render()');for(let i=0;i<12;i++){resumed.clock.now+=4000;resumed.run('tickConversations()');}
 assert.equal(resumed.run('state.dogStory.completed'),true);assert.equal(resumed.run('state.dogStory.messages.at(-2).text'),'PRONTO, ELE JÁ TÁ AQUI!! 🐶');assert.equal(resumed.run('state.dogStory.messages.filter(m=>m.photoId==="dog").length'),1);
}
const bio=boot();bio.run('activate();advanceGameTime(109)');assert.equal(bio.run('state.vitals.bpm'),150);assert.equal(bio.run('state.vitals.mode'),'running');bio.run('advanceGameTime(1)');assert.equal(bio.run('state.vitals.bpm'),72);assert.equal(bio.run('state.vitals.mode'),'interrupted');assert.equal(bio.run('Object.values(state.timeline.events).filter(e=>e.type==="vitals").length'),2);
bio.run('state.page="vitals";render()');assert.ok(bio.el('#content').innerHTML.includes('150 BPM'));assert.ok(bio.el('#content').innerHTML.includes('72 BPM'));
// Offline catch-up uses saved wall-clock anchor, without ticking any intervals.
const away=boot();away.run('activate();advanceGameTime(100);endNarrativeAccess();save()');const savedAt=away.clock.now;
const six=boot(new Map(away.storage),savedAt+320*60000);assert.equal(six.run('getGameDate().toISOString()'),'2091-04-01T06:00:00.000Z');assert.equal(six.run('currentNarrativePosition().stage'),'transit');const x=six.run('currentNarrativePosition().x');assert.ok(x<350&&x>182.35);assert.equal(six.run('state.dogStory.choice'),null);assert.equal(six.run('state.dogStory.messages.length'),8);
const late=boot(new Map(away.storage),savedAt+620*60000);assert.equal(late.run('getGameDate().toISOString()'),'2091-04-01T11:00:00.000Z');assert.equal(late.run('currentNarrativePosition().stage'),'france');assert.equal(late.run('currentNarrativePosition().x'),182.35);assert.equal(late.run('currentNarrativePosition().y'),41.14);assert.equal(late.run('Object.keys(state.timeline.events).length'),6);assert.equal(late.run('state.timeline.events["journey-end"].notified'),false);
late.run('activate()');const summary=late.run('narrativeSummary("away")');for(const time of ['00:49:00','00:50:00','01:00:00','10:00:00'])assert.ok(summary.includes(time));assert.ok(summary.includes('França'));assert.ok(!summary.includes('sequestro'));const notes=late.run('state.notifications.length');late.run('processNarrativeEvents();processNarrativeEvents()');assert.equal(late.run('state.notifications.length'),notes);assert.equal(late.run('state.timeline.events["journey-end"].read'),false);
const again=boot(late.storage,late.clock.now);again.run('activate();processNarrativeEvents()');assert.equal(again.run('state.notifications.length'),notes);assert.equal(again.run('state.dogStory.messages.length'),8);
const noSpoilers=boot();noSpoilers.run('activate()');assert.ok(!noSpoilers.run('narrativeSummary("recent")').includes('França'));assert.equal(noSpoilers.run('narrativeSummary("away")'),'Nenhuma alteração significativa foi registrada durante sua ausência.');
noSpoilers.run('state.page="calendar";calendarMonth=Date.UTC(2091,3,1);calendarDay="2091-04-02";render()');assert.ok(noSpoilers.el('#content').innerHTML.includes('Meu aniversário 🎂'));assert.ok(noSpoilers.el('#content').innerHTML.includes('Mais um ano sobrevivendo.'));assert.ok(!noSpoilers.el('#content').innerHTML.includes('França'));
late.run('state.page="mapa";render()');assert.ok(late.el('#content').innerHTML.includes('translate(182.35 41.14)'));assert.ok(late.el('#content').innerHTML.includes('Histórico de localização'));assert.ok(late.el('#content').innerHTML.includes('journey-route'));
// Alarms still use real time even when the narrative clock jumps multiple days.
const alarm=boot();alarm.run('activate();startSecurityAlarm()');assert.equal(alarm.run('securityRemaining()'),90);const deadline=alarm.run('state.security.deadline');alarm.run('advanceGameTime(3000)');assert.equal(alarm.run('state.security.deadline'),deadline);assert.equal(alarm.run('securityRemaining()'),90);alarm.run('SECURITY_SECTORS.forEach(s=>closeSecuritySector(s.id))');assert.equal(alarm.run('state.security.status'),'contained');assert.equal(alarm.audioControl.instances[0].paused,true);
const failed=boot();failed.run('activate();startSecurityAlarm();advanceGameTime(120)');failed.clock.now+=90000;failed.run('securityTick()');assert.equal(failed.run('state.security.status'),'failed');failed.clock.now+=4500;failed.run('securityTick();processNarrativeEvents()');assert.equal(failed.run('state.security.status'),'idle');assert.ok(failed.run('state.timeline.events["dog-found"]'));assert.equal(failed.run('state.dogStory.messages.length'),8);
// Existing apps, notes, delayed replies and images remain functional.
const old=boot();old.run('activate();state.page="mensagens";state.openChat="esther";render()');old.fire('#content','click',{closest:s=>s==='[data-reply]'?{dataset:{reply:'0'}}:null});old.clock.now+=4000;old.run('tickConversations()');assert.ok(old.el('#content').innerHTML.includes('Para de brincar.'));
old.run('state.page="notas";render()');old.el('#noteTitle').value='<nota>';old.el('#noteBody').value='texto';old.fire('#content','click',{id:'saveNote'});assert.ok(old.el('#content').innerHTML.includes('&lt;nota&gt;'));
old.run('state.page="galeria";render()');for(const photo of old.run('availablePhotos()')){assert.ok(fs.existsSync(path.join(root,'fotos',photo.file)));old.run('openPhoto('+JSON.stringify(photo.id)+')');assert.equal(old.el('#photoViewer').open,true);old.run('closePhoto()');}
old.run('state.page="ia";render()');old.fire('#content','click',{closest:s=>s==='[data-ia]'?{dataset:{ia:'recent'}}:null});old.clock.now+=4000;old.run('tickConversations()');assert.ok(old.el('#content').innerHTML.includes('nesse período'));
late.storage.set('other-app','keep');late.run('restartWholeStory()');assert.equal(late.storage.get('other-app'),'keep');assert.equal(late.run('state.profile'),null);assert.equal(late.run('state.clock'),null);assert.equal(late.run('getGameDate().toISOString()'),'2091-03-31T23:00:00.000Z');assert.equal(late.run('Object.keys(state.timeline.events).length'),0);assert.equal(late.run('state.timeline.lastSeen'),null);assert.equal(late.run('state.dogStory.photoUnlocked'),false);assert.equal(late.run('currentNarrativePosition().stage'),'base');assert.equal(late.run('state.vitals.bpm'),76);
console.log('PASS: official start; persistent offline clock; midnight; scheduled dog and both choices; photo gate; vital history; 06:00 transit and 11:00 France; birthday; idempotent events/notifications; real summaries; real-time alarm; legacy apps and selective reset.');
globalThis.testDone=Promise.resolve();

// Personal network, immutable historical messages and player-owned diary.
const personal=boot();personal.run('activate()');
for(const id of ['esther','kevin','gustavo','mae']){
 assert.ok(personal.run('chats['+JSON.stringify(id)+']'));
 personal.fire('#content','click',{closest:s=>s==='[data-profile]'?{dataset:{profile:id}}:null});
 personal.run('state.page="mensagens";render()');
 // Open through the actual profile control while in the messenger.
 personal.fire('#content','click',{closest:s=>s==='[data-profile]'?{dataset:{profile:id}}:null});
 assert.ok(personal.el('#content').innerHTML.includes('Perfil na rede'));
 assert.ok(personal.el('#content').innerHTML.includes('BASE — GRUPO GERAL'));
}
personal.fire('#content','click',{closest:s=>s==='[data-profile]'?{dataset:{profile:'group'}}:null});
assert.ok(personal.el('#content').innerHTML.includes('15 de janeiro de 2090'));
assert.equal((personal.el('#content').innerHTML.match(/data-profile="(?:player|esther|kevin|gustavo|mae)"/g)||[]).length,5);
personal.run('messengerProfile=null;state.openChat="mae";render()');assert.ok(personal.el('#content').innerHTML.includes('Nenhuma mensagem disponível neste histórico.'));
personal.run('state.openChat="group";render()');assert.ok(personal.el('#content').innerHTML.includes('Tô preso no banheiro'));const noticeCount=personal.run('state.notifications.length');personal.run('render();save()');assert.equal(personal.run('state.notifications.length'),noticeCount);
const historic=boot(personal.storage,personal.clock.now);historic.run('activate();state.page="mensagens";state.openChat="group";render()');assert.equal((historic.el('#content').innerHTML.match(/Tô preso no banheiro/g)||[]).length,1);
personal.run('state.page="diario";render()');assert.ok(personal.el('#content').innerHTML.includes('Mais um dia na base.'));assert.ok(personal.el('#content').innerHTML.includes('31/03/2091'));
personal.el('#diaryTitle').value='Descoberta <segura>';personal.el('#diaryBody').value='Equipe A está fora.';personal.fire('#content','click',{id:'saveDiary'});assert.equal(personal.run('state.diary.length'),1);assert.ok(personal.el('#content').innerHTML.includes('&lt;segura&gt;'));
const diaryReload=boot(personal.storage,personal.clock.now);diaryReload.run('activate();state.page="diario";render()');assert.ok(diaryReload.el('#content').innerHTML.includes('Equipe A está fora.'));const diaryId=diaryReload.run('state.diary[0].id');
diaryReload.fire('#content','click',{closest:s=>s==='[data-edit-diary]'?{dataset:{editDiary:diaryId}}:null});diaryReload.el('#diaryTitle').value='Corrigido';diaryReload.el('#diaryBody').value='Anotação revisada';diaryReload.fire('#content','click',{id:'saveDiary'});assert.equal(diaryReload.run('state.diary[0].title'),'Corrigido');assert.equal(diaryReload.run('state.diary.length'),1);
diaryReload.fire('#content','input',{id:'diarySearch',value:'sem resultado'});assert.ok(!diaryReload.el('#diaryEntries').innerHTML.includes('Corrigido'));
diaryReload.fire('#content','click',{closest:s=>s==='[data-delete-diary]'?{dataset:{deleteDiary:'base-2091'}}:null});assert.equal(diaryReload.run('ORIGINAL_DIARY.title'),'Mais um dia na base.');assert.equal(diaryReload.run('Object.isFrozen(ORIGINAL_DIARY)'),true);
diaryReload.fire('#content','click',{closest:s=>s==='[data-delete-diary]'?{dataset:{deleteDiary:diaryId}}:null});assert.equal(diaryReload.run('state.diary.length'),0);
assert.equal(personal.run('migrateCharacterData({sender:"Noah",sent:{noah:1}}).sender'),'Gustavo');assert.equal(personal.run('migrateCharacterData({sent:{noah:1}}).sent.gustavo'),1);
personal.run('restartWholeStory()');assert.equal(personal.run('state.diary.length'),0);assert.equal(personal.run('messengerProfile'),null);
console.log('PASS: contacts, five group members, profile controls, historical messages without replay, diary CRUD/reload/search/escaping, immutable original, character migration, full reset.');

const inbox=boot();inbox.run('activate();state.page="mensagens";state.openChat="esther";render()');inbox.fire('#content','click',{closest:s=>s==='[data-reply]'?{dataset:{reply:'0'}}:null});inbox.run('endNarrativeAccess();save()');const inboxReturn=boot(inbox.storage,inbox.clock.now+10000);inboxReturn.run('activate()');assert.ok(inboxReturn.run('narrativeSummary("away")').includes('Você recebeu 1 mensagem'));
const hidden=boot();hidden.run('activate();document.hidden=true');hidden.fire('document','visibilitychange');hidden.clock.now+=3*3600000;hidden.run('syncGameTime();processNarrativeEvents()');assert.equal(hidden.run('getGameDate().toISOString()'),'2091-04-01T02:00:00.000Z');assert.equal(hidden.run('state.dogStory.choice'),null);hidden.run('document.hidden=false');hidden.fire('document','visibilitychange');assert.ok(hidden.run('narrativeSummary("away")').includes('Atividade física intensa'));
const migratedStore=new Map([['pirate40-save-v1',JSON.stringify({profile:{name:'Alex',pronouns:'he'},gameTime:Date.UTC(2091,3,9,23),notes:[{id:7,title:'Preservar',body:'Lembrete',date:'2091'}],sent:{esther:0}})]]);const migrated=boot(migratedStore);assert.equal(migrated.run('state.notes[0].title'),'Preservar');assert.equal(migrated.run('state.sent.esther'),0);assert.equal(migrated.run('currentNarrativePosition().stage'),'france');const stable=migrated.run('state.gameTime');const migrationReload=boot(migratedStore,migrated.clock.now);assert.equal(migrationReload.run('state.gameTime'),stable);assert.equal(migrationReload.run('Object.keys(state.timeline.events).length'),6);
console.log('PASS: offline pending-message summary, hidden-tab clock, absence window, non-destructive legacy-save migration.');
