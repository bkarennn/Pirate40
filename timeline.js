// Official schedule. Add definitions here; execution records live in the existing save.
const STORY_EVENTS = [
 ...Object.entries(GROUP_SCENES).map(([id,scene])=>({id:'group-'+id,at:scene.at,type:'interactive',chatId:'group',title:scene.title,description:scene.description})),
 {id:'mother-reminder',at:Date.UTC(2091,2,31,23),type:'message',chatId:'mae',title:'Mensagem da Mãe',description:'Desliga as luzes antes de deitar, você tem mania de deixar tudo ligado.'},
 {id:'tech-damaged',at:Date.UTC(2091,3,1,0,51),type:'equipment',title:'TECH BANG — FALHA CRÍTICA',description:'Integridade do equipamento comprometida. Comunicação com o equipamento interrompida.'},
 {id:'amelie-birthday',at:Date.UTC(2091,3,2),type:'message',chatId:'amelie',title:'Número desconhecido',description:'Feliz aniversário. Apesar de tudo.'},
 {id:'activation',at:Date.UTC(2091,2,31,23),type:'location',title:'Dispositivo ativado',description:'Base oceânica · instalação não registrada.'},
 {id:'dog-found',at:Date.UTC(2091,3,1,0,31),type:'interactive',title:'Mensagem de Kevin',description:'Kevin encontrou um cachorro. A conversa aguarda sua resposta.'},
 {id:'vitals-running',at:Date.UTC(2091,3,1,0,49),type:'vitals',title:'ALERTA BIOMÉTRICO',description:'Elevação incomum da frequência cardíaca detectada. Atividade física intensa identificada.',bpm:150,mode:'running',status:'Atividade física intensa'},
 {id:'vitals-interrupted',at:Date.UTC(2091,3,1,0,50),type:'vitals',title:'ALTERAÇÃO BIOMÉTRICA DETECTADA',description:'Redução abrupta da atividade física. Movimento corporal interrompido.',bpm:72,mode:'interrupted',status:'Movimento interrompido'},
 {id:'journey-start',at:Date.UTC(2091,3,1,1),type:'location',title:'LOCALIZAÇÃO ATUALIZADA',description:'Deslocamento não programado detectado. Origem: instalação oceânica.'},
 {id:'journey-end',at:Date.UTC(2091,3,1,10),type:'location',title:'DESLOCAMENTO ENCERRADO',description:'Nova localização identificada: França. Instalação de destino: desconhecida.'}
];
const BIRTHDAY = {at:Date.UTC(2091,3,2),title:'Meu aniversário 🎂',description:'Mais um ano sobrevivendo.'};
let processingTimeline=false,accessOpen=false,calendarMonth=null,calendarDay=null,lastNarrativeRevision='',lastMapStage='';
function stampAt(at){const date=new Date(at);return {date:date.toLocaleDateString('pt-BR',{timeZone:'UTC'}),time:date.toLocaleTimeString('pt-BR',{timeZone:'UTC',hour:'2-digit',minute:'2-digit',second:'2-digit'})};}
function initializeNarrativeClock(){
 initializeEquipmentStory();initializeGroupStory();
 state.timeline ??= {events:{},messages:[],lastSeen:null,absence:null};
 state.timeline.events ??= {};state.timeline.messages ??= [];
 if(state.profile && !state.clock)startNarrativeClock();
}
function startNarrativeClock(){
 if(!state.clock)state.clock={startedReal:Date.now(),baseGame:state.gameTime,offsetMs:0,rate:GAME_TIME_RATE};
}
function recordNarrativeMessage(id,at){
 if(!state.timeline || state.timeline.messages.some(m=>m.id===id))return;
 state.timeline.messages.push({id,at});
}
function beginNarrativeAccess(){
 syncGameTime();processNarrativeEvents();
 if(!accessOpen){state.timeline.absence={from:state.timeline.lastSeen ?? state.clock?.baseGame ?? state.gameTime,to:state.gameTime};accessOpen=true;}
 state.timeline.lastSeen=state.gameTime;flushNarrativeNotifications();
}
function endNarrativeAccess(){
 if(!state.timeline)return;syncGameTime();if(accessOpen)state.timeline.lastSeen=state.gameTime;accessOpen=false;
}
function processNarrativeEvents(){
 if(processingTimeline || !state.timeline || !state.clock)return;
 processingTimeline=true;
 try {
  syncGameTime();let changed=false;
  for(const event of [...STORY_EVENTS].sort((a,b)=>a.at-b.at)){
   if(event.at>state.gameTime || state.timeline.events[event.id])continue;
   state.timeline.events[event.id]={...event,executed:true,notified:event.id==='activation',read:false};
   if(event.type==='vitals'){state.vitals.bpm=event.bpm;state.vitals.mode=event.mode;state.vitals.updatedAt=stampAt(event.at);}
   applyEquipmentStoryEvent(event);
   changed=true;
  }
  const dogEvent=state.timeline.events['dog-found'];
  if(dogEvent && state.dogStory.choice===null){
   const count=Math.min(DOG_INTRO.length,1+Math.floor((state.gameTime-dogEvent.at)/3500));
   while(state.dogStory.messages.length<count){const i=state.dogStory.messages.length;addDogMessage(DOG_INTRO[i],dogEvent.at+i*3500);changed=true;}
   state.dogStory.nextAt=0;
   if(changed && !(state.unlocked&&state.page==='mensagens'&&state.openChat==='group'))state.read=state.read.filter(id=>id!=='group');
  }
  changed=processGroupStory()||changed;
  if(changed){save();lastNarrativeRevision='';}
 } finally {processingTimeline=false;}
 flushNarrativeNotifications();
}
function flushNarrativeNotifications(){
 if(!state.unlocked || document.hidden || !state.timeline)return;
 const pending=Object.values(state.timeline.events).filter(e=>!e.notified).sort((a,b)=>a.at-b.at);
 for(const event of pending){
  event.notified=true;
  const page=event.type==='equipment'?'techbang':event.type==='vitals'?'vitals':event.type==='location'?'mapa':'mensagens';
  notify(event.title,event.description,page,false,false,event.chatId || (event.id==='dog-found'?'group':null));
 }
 if(pending.length){const only=pending.length===1?pending[0]:null;showToast(only?only.title:pending.length+' novos registros no dispositivo.',only?.chatId?'mensagens':only?.type==='equipment'?'techbang':'calendar',false,only?.chatId || null);}
}
function renderNarrativeHistory(type){
 const records=Object.values(state.timeline?.events || {}).filter(e=>e.type===type).sort((a,b)=>a.at-b.at);
 return '<section class="timeline-history"><h3>Histórico '+(type==='vitals'?'biométrico':'de localização')+'</h3>'+ (records.length?records.map(e=>'<article><span class="meta">'+stampAt(e.at).date+' · '+stampAt(e.at).time+'</span><strong>'+escapeHtml(e.status || e.title)+(e.bpm?' · '+e.bpm+' BPM':'')+'</strong><p>'+escapeHtml(e.description)+'</p></article>').join(''):'<p class="muted">Nenhuma alteração registrada.</p>')+'</section>';
}
function narrativeSummary(kind){
 tickConversations();processNarrativeEvents();const now=state.gameTime;
 const window=kind==='away'?(state.timeline.absence || {from:now,to:now}):{from:now-24*3600000,to:now};
 const records=Object.values(state.timeline.events).filter(e=>e.id!=='activation'&&e.at>window.from&&e.at<=window.to).sort((a,b)=>a.at-b.at);
 const received=state.timeline.messages.filter(m=>m.at>window.from&&m.at<=window.to).length;
 const lines=records.map(e=>stampAt(e.at).date+', '+stampAt(e.at).time+' — '+(e.type==='equipment'?'Tech Bang: ':'')+e.description);
 if(received)lines.push('Você recebeu '+received+' mensagem'+(received===1?'':'s')+' nesse período. Abra Mensagens para ler.');
 if(!lines.length)return kind==='away'?'Nenhuma alteração significativa foi registrada durante sua ausência.':'Nenhuma alteração significativa foi registrada nas últimas 24 horas.';
 return (kind==='away'?'Durante sua ausência, foram registrados estes acontecimentos:':'Registros das últimas 24 horas:')+'\n\n'+lines.join('\n\n')+'\n\nNão há informações suficientes para determinar a causa desses acontecimentos.';
}
// Fixed fictional long-distance route: South Pacific → Asia → Europe → mainland France.
const JOURNEY_WAYPOINTS = [[350,115],[326,95],[286,62],[244,43],[204,42],[182.35,41.14]];
function currentNarrativePosition(){
 const start=STORY_EVENTS.find(e=>e.id==='journey-start').at,end=STORY_EVENTS.find(e=>e.id==='journey-end').at,now=getGameDate().getTime();
 const progress=Math.max(0,Math.min(1,(now-start)/(end-start)));
 const segment=Math.min(JOURNEY_WAYPOINTS.length-2,Math.floor(progress*(JOURNEY_WAYPOINTS.length-1))),fraction=progress*(JOURNEY_WAYPOINTS.length-1)-segment;
 const a=JOURNEY_WAYPOINTS[segment],b=JOURNEY_WAYPOINTS[segment+1];
 return {x:a[0]+(b[0]-a[0])*fraction,y:a[1]+(b[1]-a[1])*fraction,progress,stage:now<start?'base':now<end?'transit':'france',label:now<start?'Pacífico Sul / proximidades da Oceania':now<end?'Em trânsito · deslocamento não programado':'França · instalação desconhecida'};
}
function routeMarkup(){
 const p=currentNarrativePosition();if(p.stage==='base')return '';
 const n=Math.floor(p.progress*(JOURNEY_WAYPOINTS.length-1));
 const points=[...JOURNEY_WAYPOINTS.slice(0,n+1),[p.x,p.y]];
 return '<polyline class="journey-route" points="'+points.map(v=>v.join(',')).join(' ')+'"/><circle cx="350" cy="115" r="2" class="journey-origin"/>';
}
function dayKey(ms){return new Date(ms).toISOString().slice(0,10);}
function calendarRecords(day){return [...Object.values(state.timeline.events),BIRTHDAY].filter(e=>dayKey(e.at)===day).sort((a,b)=>a.at-b.at);}
function renderCalendar(){
 const today=getGameDate();if(calendarMonth===null)calendarMonth=Date.UTC(today.getUTCFullYear(),today.getUTCMonth(),1);if(!calendarDay)calendarDay=dayKey(state.gameTime);
 const month=new Date(calendarMonth),year=month.getUTCFullYear(),number=month.getUTCMonth(),days=new Date(Date.UTC(year,number+1,0)).getUTCDate(),offset=(month.getUTCDay()+6)%7;
 const records=calendarRecords(calendarDay);
 return head('Calendário','SEU TEMPO / 2091')+'<div class="calendar-nav"><button class="icon-button" data-calendar-nav="-1" aria-label="Mês anterior">←</button><h3>'+month.toLocaleDateString('pt-BR',{timeZone:'UTC',month:'long',year:'numeric'})+'</h3><button class="icon-button" data-calendar-nav="1" aria-label="Próximo mês">→</button><button class="secondary" data-calendar-today>Hoje</button></div><div class="calendar-grid">'+['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(d=>'<span class="weekday">'+d+'</span>').join('')+'<span class="calendar-gap" style="grid-column:span '+(offset||1)+';'+(!offset?'display:none':'')+'"></span>'+Array.from({length:days},(_,i)=>{const day=dayKey(Date.UTC(year,number,i+1));return '<button data-calendar-day="'+day+'" class="calendar-day '+(day===dayKey(state.gameTime)?'today ':'')+(day===calendarDay?'selected':'')+'" '+(day===dayKey(state.gameTime)?'aria-current="date"':'')+' aria-pressed="'+(day===calendarDay)+'">'+(i+1)+(calendarRecords(day).length?'<span aria-label="Com registros">•</span>':'')+'</button>';}).join('')+'</div><section class="calendar-records"><h3>'+new Date(calendarDay+'T12:00:00Z').toLocaleDateString('pt-BR',{timeZone:'UTC',day:'numeric',month:'long',year:'numeric'})+'</h3>'+(records.length?records.map(e=>'<article><strong>'+escapeHtml(e.title)+'</strong><p>'+escapeHtml(e.description)+'</p>'+(e===BIRTHDAY?'<small>'+escapeHtml(playerName())+' · 2 de abril</small>':'<small>'+stampAt(e.at).time+'</small>')+'</article>').join(''):'<p class="muted">Nenhum compromisso ou registro neste dia.</p>')+'</section>';
}
content.addEventListener('click',event=>{
 const nav=event.target.closest('[data-calendar-nav]'),day=event.target.closest('[data-calendar-day]'),today=event.target.closest('[data-calendar-today]');
 if(nav){const m=new Date(calendarMonth);calendarMonth=Date.UTC(m.getUTCFullYear(),m.getUTCMonth()+Number(nav.dataset.calendarNav),1);render();}
 if(day){calendarDay=day.dataset.calendarDay;calendarRecords(calendarDay).forEach(e=>{if(e.id)state.timeline.events[e.id].read=true;});save();render();}
 if(today){calendarMonth=null;calendarDay=dayKey(state.gameTime);render();}
});
function resetTimelineView(){accessOpen=false;calendarMonth=null;calendarDay=null;lastNarrativeRevision='';lastMapStage='';}
function updateNarrativeUI(){
 if(!state.unlocked)return;
 const revision=Object.keys(state.timeline.events).length+':'+state.groupStory.messages.length+':'+state.dogStory.messages.length+':'+dayKey(state.gameTime);
 if(revision!==lastNarrativeRevision){lastNarrativeRevision=revision;if(['calendar','vitals','mapa','techbang','seguranca'].includes(state.page))render();else if(state.page==='mensagens'&&state.openChat==='group')refreshDogChat();else if(state.page==='galeria'||state.page==='mensagens')render();}
 updateMessageBadges();
 if(state.page==='mapa'){
  const p=currentNarrativePosition(),marker=content.querySelector('.player-marker'),route=content.querySelector('#journeyRoute'),label=content.querySelector('#journeyLocation');
  if(marker)marker.setAttribute('transform','translate('+p.x+' '+p.y+')');if(route)route.innerHTML=routeMarkup();if(label)label.textContent=p.label;
  if(lastMapStage!==p.stage){lastMapStage=p.stage;mapView.x=p.x;mapView.y=p.y;mountWorldMap();}
 }
}
