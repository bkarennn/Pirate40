// Fictional calendar and identity. Real-time security deadlines remain in security.js.
const GAME_START_TIME = Date.UTC(2091,2,31,23,0,0);
const GAME_TIME_RATE = 1; // One real second = one narrative second.
const PROFILE_PRONOUNS = ['he','she','neutral'];
let gameLastTick = performance.now(), gameClockActive = false, sessionTimer = null;
let vitalsLastTick = performance.now();
if(!Number.isFinite(state.gameTime))state.gameTime=GAME_START_TIME;
if(!state.vitals || !Number.isFinite(state.vitals.bpm))state.vitals={bpm:76,mode:'normal'};
if(typeof state.profile?.name !== 'string' || !state.profile.name.trim() || !PROFILE_PRONOUNS.includes(state.profile.pronouns))state.profile=null;
function playerName(){return state.profile?.name || 'Pirate 40';}
function playerTerms(){
 const pronouns=state.profile?.pronouns;
 return pronouns==='he'?{subject:'Ele',object:'dele',parent:'pai'}:pronouns==='she'?{subject:'Ela',object:'dela',parent:'mãe'}:{subject:playerName(),object:'de '+playerName(),parent:playerName()};
}
function dialogueText(text){const terms=playerTerms();return String(text).replace(/\{(player|subject|object|parent)\}/g,(_,key)=>key==='player'?playerName():terms[key]);}
// Ready for Amelie's future scenes; no new story event is introduced here.
function amelieAddress(){return state.profile?.pronouns==='neutral'?'Por favor, me escuta. Eu só quero você de volta.':(state.profile?.pronouns==='she'?'Mãe':'Pai')+', você precisa me escutar.';}
function syncGameTime(){
 if(!state.clock)return;
 const elapsed=Math.max(0,Date.now()-state.clock.startedReal);
 state.gameTime=Math.max(state.gameTime,state.clock.baseGame+elapsed*state.clock.rate+state.clock.offsetMs);
}
function getGameDate(){syncGameTime();return new Date(state.gameTime);}
function gameMessageStamp(){return stampAt(getGameDate().getTime());}
function saveGameTime(){syncGameTime();processNarrativeEvents();save();}
function advanceGameTime(minutes){if(!Number.isFinite(minutes)||minutes<0)throw new RangeError('Use minutos positivos.');startNarrativeClock();state.clock.offsetMs+=minutes*60000;syncGameTime();processNarrativeEvents();save();updateSessionUI();}
// Rewinding only the clock would leave future events marked as completed.
function resetGameTime(){restartWholeStory();}
function setVitalsState(mode){if(!['rest','normal','tension','extreme'].includes(mode))throw new Error('Estado vital desconhecido');state.vitals.mode=mode;save();}
function tickVitals(){
 const now=performance.now(),elapsed=Math.min(5,Math.max(0,(now-vitalsLastTick)/1000));vitalsLastTick=now;
 if(document.hidden || !state.unlocked)return;
 const scripted=['running','interrupted'].includes(state.vitals.mode);
 const mode=!scripted && state.security?.status==='active'?'invasion':state.vitals.mode;
 const target={rest:68,normal:78,tension:106,extreme:158,invasion:138,running:150,interrupted:72}[mode] || 78;
 const step=elapsed*(target>state.vitals.bpm?3:1.4);
 state.vitals.bpm+=Math.sign(target-state.vitals.bpm)*Math.min(step,Math.abs(target-state.vitals.bpm));
 state.vitals.updatedAt=gameMessageStamp();
}
function renderVitals(){return head('Sinais Vitais','CORPO / 2091')+'<section class="vitals-monitor"><div class="vitals-heading"><span>CONEXÃO BIOMÉTRICA <b id="vitalConnection">ATIVA</b></span><span>SIMULAÇÃO NARRATIVA</span></div><div class="vitals-reading"><span class="beating-heart">'+icon('vitals')+'</span><div><p class="eyebrow">FREQUÊNCIA CARDÍACA</p><strong id="vitalBpm"></strong> <span>BPM</span></div></div><div class="ecg-window" aria-hidden="true"><svg class="ecg-trace" viewBox="0 0 800 100"><path d="M0 55H70l10-10 10 10h30l8-20 10 55 12-80 12 45h25l12-10 12 10H400h70l10-10 10 10h30l8-20 10 55 12-80 12 45h25l12-10 12 10H800"/></svg></div><p class="vital-status" id="vitalStatus"></p><p class="muted" id="vitalUpdated"></p></section><div class="panel"><h3>'+escapeHtml(playerName())+' · Pirate 40</h3><p class="muted">Estes sinais pertencem à sua versão de 2091. Você, em 2026, acompanha o dispositivo compartilhado — não controla esse corpo.</p><p class="tiny">Valores fictícios de gameplay. Sem sensores reais ou diagnóstico médico.</p></div>'+renderNarrativeHistory('vitals');}
function updateSessionUI(){
 document.querySelector('.device').dataset.wallpaper=state.wallpaper;
 const d=getGameDate(),clock=d.toLocaleTimeString('pt-BR',{timeZone:'UTC',hour:'2-digit',minute:'2-digit'}),date=d.toLocaleDateString('pt-BR',{timeZone:'UTC',weekday:'long',day:'numeric',month:'long',year:'numeric'});
 document.querySelectorAll('[data-game-clock]').forEach(el=>el.textContent=clock);
 document.querySelectorAll('[data-game-date]').forEach(el=>el.textContent=date);
 $('#deviceClock').textContent=clock;
 $('#profileName').textContent=playerName();
 const bpm=$('#vitalBpm');if(bpm){bpm.textContent=Math.round(state.vitals.bpm);const monitor=document.querySelector('.vitals-monitor');if(monitor)monitor.style.setProperty('--beat-duration',(60/state.vitals.bpm)+'s');}
 const status=$('#vitalStatus');if(status)status.textContent=state.security?.status==='active' && !['running','interrupted'].includes(state.vitals.mode)?'ALERTA · frequência elevada':state.vitals.mode==='interrupted'?'MOVIMENTO INTERROMPIDO · SINAL PRESENTE':state.vitals.mode==='running'?'ATIVIDADE FÍSICA INTENSA':state.vitals.bpm>95?'RECUPERAÇÃO / TENSÃO':'ESTÁVEL';
 const updated=$('#vitalUpdated');if(updated)updated.textContent='Última atualização: '+(state.vitals.updatedAt?state.vitals.updatedAt.date+' · '+state.vitals.updatedAt.time:'aguardando sincronização');
}
function showIdentityGate(){
 $('#identityScreen').classList.toggle('hidden',!!state.profile);scanScreen.classList.toggle('hidden',!state.profile);systemScreen.classList.add('hidden');
 if(state.profile)$('#scanDescription').textContent='Desbloqueie seu dispositivo para continuar, '+playerName()+'.';
 updateSessionUI();
}
$('#identityForm').addEventListener('submit',event=>{
 event.preventDefault();const name=$('#playerName').value.trim(),pronouns=$('#playerPronouns').value;
 if(!name || name.length>32 || !PROFILE_PRONOUNS.includes(pronouns)){$('#identityError').textContent='Informe um nome de até 32 caracteres e selecione os pronomes.';return;}
 state.profile={name,pronouns};startNarrativeClock();processNarrativeEvents();save();prepareSecurityAudio();beginFaceScan();
});
function stopSessionTimers(){
 syncGameTime();gameClockActive=false;
 scanGeneration++;scanTimers.forEach(clearTimeout);scanTimers=[];
 clearTimeout(toastTimer);clearInterval(conversationTimer);clearInterval(securityTimer);clearInterval(sessionTimer);
 stopSecurityAlarm();mapCleanup();
}
function restartWholeStory(){
 stopSessionTimers();closePhoto(false);if($('#restartDialog').open)$('#restartDialog').close();
 // Remove only owned keys. Other applications' storage is never touched.
 localStorage.removeItem(STORAGE_KEY);localStorage.removeItem('pirate40-ia-v1');
 state=structuredClone(initialState);state.security=freshSecurity();delete chats.emergency;messengerProfile=null;diaryEditing=null;diaryQuery='';resetTimelineView();initializeNarrativeClock();mapView.x=350;mapView.y=100;mapView.zoom=1.2;
 lastClosedSector=null;soundMuted=false;audioPrepared=false;
 document.dispatchEvent(new Event('pirate40:reset-session'));
 $('#securityFailure').classList.add('hidden');systemScreen.inert=false;scanScreen.inert=false;
 $('#notificationPanel').classList.add('hidden');$('#toastRegion').innerHTML='';$('#notificationButton').setAttribute('aria-expanded','false');
 $('#scanButton').disabled=false;$('#scanButton').textContent='Reconhecer meu rosto →';scanScreen.classList.remove('scanning');
 $('#playerName').value='';$('#playerPronouns').value='neutral';$('#identityError').textContent='';
 gameLastTick=performance.now();vitalsLastTick=gameLastTick;gameClockActive=false;
 save();showIdentityGate();updateSecurityUI();updateNotifications();
 conversationTimer=setInterval(tickConversations,250);runSecurityClock();startSessionClock();$('#playerName').focus();
}
$('#cancelRestart').addEventListener('click',()=>$('#restartDialog').close());
$('#confirmRestart').addEventListener('click',restartWholeStory);
$('#restartDialog').addEventListener('cancel',event=>{event.preventDefault();$('#restartDialog').close();});
function startSessionClock(){clearInterval(sessionTimer);sessionTimer=setInterval(()=>{syncGameTime();processNarrativeEvents();tickVitals();updateSessionUI();updateNarrativeUI();if(state.unlocked&&!document.hidden)state.timeline.lastSeen=state.gameTime;save();},1000);}
document.addEventListener('visibilitychange',()=>{if(document.hidden)endNarrativeAccess();else if(state.unlocked)beginNarrativeAccess();vitalsLastTick=performance.now();saveGameTime();});
window.addEventListener('pagehide',()=>{endNarrativeAccess();saveGameTime();});
window.addEventListener('pageshow',()=>{syncGameTime();processNarrativeEvents();if(state.unlocked)beginNarrativeAccess();});
initializeNarrativeClock();processNarrativeEvents();showIdentityGate();startSessionClock();
