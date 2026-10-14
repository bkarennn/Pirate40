// Edit this value to change the invasion deadline (seconds).
const SECURITY_ALARM_SECONDS = 90;
const SECURITY_RESTART_MS = 4500;
const SECURITY_SECTORS = [
  {id:'a',name:'Alojamentos'}, {id:'b',name:'Comunicações'}, {id:'c',name:'Armazém'},
  {id:'lab',name:'Laboratório'}, {id:'west',name:'Ala Oeste'}, {id:'dock',name:'Doca'}
];
let securityTimer = null;
function freshSecurity() { return {explored:[],triggered:false,homeDue:0,messages:[],readCount:0,messageIndex:0,startedAt:0,finishedAt:0,aftermathIndex:0,status:'idle',closed:[],deadline:0,restartAt:0,warned:false}; }
if (!state.security || !['idle','active','contained','failed'].includes(state.security.status)) state.security = freshSecurity();
state.security = {...freshSecurity(),...state.security};
state.security.triggered = state.security.triggered || state.security.status !== 'idle';
state.security.messages = Array.isArray(state.security.messages) ? state.security.messages : [];
state.security.explored = Array.isArray(state.security.explored) ? state.security.explored : [];
state.security.closed = Array.isArray(state.security.closed) ? state.security.closed.filter(id => SECURITY_SECTORS.some(s => s.id === id)) : [];
function securityRemaining() { return Math.max(0, Math.ceil((state.security.deadline - Date.now()) / 1000)); }
function securityTime() { const seconds = securityRemaining(); return String(Math.floor(seconds / 60)).padStart(2,'0') + ':' + String(seconds % 60).padStart(2,'0'); }
function startSecurityAlarm() {
  if (state.security.status !== 'idle' || state.security.triggered) return false;
  state.security = {...freshSecurity(),explored:state.security.explored,triggered:true,status:'active',startedGameTime:getGameDate().getTime(),startedAt:Date.now(),deadline:Date.now() + SECURITY_ALARM_SECONDS * 1000};
  playSecurityAudio();
  const device = document.querySelector('.device'); device.classList.remove('invasion-shake'); void device.offsetWidth; device.classList.add('invasion-shake');
  save();
  notify('ALERTA CRÍTICO', 'INVASÃO DETECTADA. ACESSO NÃO AUTORIZADO À INSTALAÇÃO. PROTOCOLO DE CONTENÇÃO INICIADO.', 'seguranca', true, true);
  if (state.unlocked) render();
  runSecurityClock();
  return true;
}
window.startSecurityAlarm = startSecurityAlarm;
function closeSecuritySector(id) {
  if (!state.unlocked || state.security.status !== 'active') return;
  securityTick(); // Check the actual deadline before accepting a click.
  if (state.security.status !== 'active' || !SECURITY_SECTORS.some(s => s.id === id) || state.security.closed.includes(id)) return;
  state.security.closed.push(id);
  if (SECURITY_SECTORS.every(s => state.security.closed.includes(s.id))) {
    finishSecurityEvent();
  }
  lastClosedSector = id;
  save(); render(); updateSecurityUI();
}
function renderSecurity() {
  const alarm = state.security;
  const active = alarm.status === 'active';
  const contained = alarm.status === 'contained';
  return head('Segurança', 'CONTROLE DE SETORES') + '<div class="security-summary ' + (active ? 'emergency' : contained ? 'contained' : '') + '"><span class="security-shield">' + icon('seguranca') + '</span><div><p class="eyebrow">' + (active ? 'INVASÃO DETECTADA' : contained ? 'CONTENÇÃO CONCLUÍDA' : 'MONITORAMENTO LOCAL') + '</p><h3>' + (active ? 'Fechem as portas dos setores.' : contained ? 'Setores selados.' : 'A base está sob observação.') + '</h3><p class="muted">' + (active ? 'Feche manualmente os seis setores antes do fim do prazo.' : 'Portas e setores da instalação não registrada.') + '</p></div><strong class="security-countdown" data-security-time>' + (active ? securityTime() : '—') + '</strong></div>' +
    '<div class="security-progress"><span>' + alarm.closed.length + ' de 6 setores selados</span><span>Fechamento manual obrigatório</span></div><div class="sector-grid">' + SECURITY_SECTORS.map(s => { const closed = alarm.closed.includes(s.id); return '<article class="sector-card ' + (closed ? 'sealed' + (lastClosedSector === s.id ? ' just-sealed' : '') : '') + '"><span class="sector-door" aria-hidden="true">' + icon('lock') + '</span><div><h3>' + s.name + '</h3><p>' + (closed ? 'Fechado · SETOR TRANCADO' : 'Aberto') + '</p></div><button class="' + (closed ? 'secondary' : 'primary') + '" data-close-sector="' + s.id + '" ' + (!active || closed ? 'disabled' : '') + '>' + (closed ? 'Selado ✓' : 'Fechar porta') + '</button></article>'; }).join('') + '</div><p class="muted">' + (active ? 'O prazo continua correndo em outros aplicativos e com o dispositivo bloqueado.' : 'Os controles de fechamento são liberados durante uma invasão.') + '</p><details class="security-test"><summary>Diagnóstico do dispositivo</summary><p class="muted">Iniciar um evento real de jogo. Se o prazo terminar, o sistema reiniciará.</p><button class="danger" data-start-security ' + (alarm.triggered ? 'disabled' : '') + '>Iniciar evento de invasão</button></details>';
}
function updateSecurityUI() {
  const active = state.security.status === 'active';
  updateSoundButton();
  const banner = $('#securityBanner');
  banner.classList.toggle('hidden', !active);
  document.querySelector('.device').classList.toggle('security-active',active);
  document.querySelectorAll('[data-security-time]').forEach(el => el.textContent = securityTime());
  $('#securityOpen').textContent = state.unlocked ? 'Fechar setores →' : 'Desbloqueie para fechar setores';
  $('#securityOpen').disabled = !state.unlocked;
}
function securityTick() {
  if (state.security.status === 'failed') {
    if (Date.now() >= state.security.restartAt) restartAfterSecurityFailure();
    return;
  }
  if (state.security.status === 'contained') { deliverEmergencyMessages(); return; }
  if (state.security.status === 'idle') { checkSecurityProgress(); return; }
  if (state.security.status !== 'active') return;
  if (!Number.isFinite(state.security.deadline) || Date.now() >= state.security.deadline) { failSecurity(); return; }
  deliverEmergencyMessages();
  if (!state.security.warned && securityRemaining() <= 30) {
    state.security.warned = true;
    const open = SECURITY_SECTORS.find(s => !state.security.closed.includes(s.id));
    notify('Integridade da base em risco', (open ? 'Porta: ' + open.name + ' ainda aberta. ' : '') + 'Menos de 30 segundos restantes.', 'seguranca');
    save();
  }
  updateSecurityUI();
}
function failSecurity() {
  stopSecurityAlarm();
  state.security.status = 'failed'; state.security.restartAt = Date.now() + SECURITY_RESTART_MS;
  save(); showSecurityFailure();
}
function showSecurityFailure() {
  closePhoto(false);
  $('#securityFailure').classList.remove('hidden');
  systemScreen.inert = true; scanScreen.inert = true;
  $('#securityFailure').focus();
  $('#notificationPanel').classList.add('hidden'); $('#toastRegion').innerHTML = '';
  updateSecurityUI();
}
function restartAfterSecurityFailure() {
  stopSecurityAlarm(); lastClosedSector = null; soundMuted = false;
  delete chats.emergency;
  // Preserve player-authored notes and wallpaper; reset narrative session progress.
  const groupStory=state.groupStory, diaryUnlocked=state.diaryUnlocked, techBang=state.techBang, motherMessages=state.motherMessages, amelieStory=state.amelieStory, diary = state.diary, notes = state.notes, wallpaper = state.wallpaper, profile = state.profile, gameTime = state.gameTime, clock = state.clock, timeline = state.timeline, dogStory = state.dogStory, vitals = state.vitals;
  state = {...structuredClone(initialState),groupStory,diaryUnlocked,techBang,motherMessages,amelieStory,diary,notes,wallpaper,profile,gameTime,clock,timeline,dogStory,vitals,security:freshSecurity()};
  document.dispatchEvent(new Event('pirate40:reset-session'));
  save();
  $('#securityFailure').classList.add('hidden');
  systemScreen.inert = false; scanScreen.inert = false;
  $('#lockButton').click();
  updateSecurityUI(); $('#scanButton').focus();
  runSecurityClock();
}
function runSecurityClock() {
  clearInterval(securityTimer);
  securityTimer = setInterval(securityTick,250);
  securityTick();
}
content.addEventListener('click', e => {
  const close = e.target.closest('[data-close-sector]');
  if (close) closeSecuritySector(close.dataset.closeSector);
  if (e.target.closest('[data-start-security]') && state.unlocked) startSecurityAlarm();
});
$('#securityOpen').addEventListener('click', () => { if (state.unlocked) { state.page = 'seguranca'; state.openChat = null; save(); render(); } });
document.addEventListener('visibilitychange', securityTick);
window.addEventListener('pageshow', () => {securityTick();if(state.security.status==='active')playSecurityAudio();});

const SECURITY_AUDIO_SRC = "Alarme%20de%20Emerg%C3%AAncia%20-%20Som%20de%20Alerta%20Vermelho%20Emergency%20Alarm%20-%20Red%20Alert%20Sound%20%E0%A4%86%E0%A4%AA%E0%A4%BE%E0%A4%A4%E0%A4%95%E0%A4%BE%E0%A4%B2%E0%A5%80%E0%A4%A8%20%E0%A4%85%E0%A4%B2%E0%A4%BE%E0%A4%B0%E0%A5%8D%E0%A4%AEmp3.mp3";

const SECURITY_HOME_DELAY_MS = 5000;
const SECURITY_MESSAGE_INTERVAL_MS = 3500;
const REQUIRED_SECURITY_ACTIVITIES = ['mensagens','ia','mapa','galeria','notas','seguranca'];
const INVASION_DIALOGUE = [
 ['Esther','GENTE??? O QUE TÁ ACONTECENDO??'],['Kevin','Tem alguém entrando pela doca!'],
 ['Esther','FECHA AS PORTAS!! AGORA!!'],['Gustavo','QUEM DEIXOU O SISTEMA DE LOCALIZAÇÃO LIGADO???'],
 ['Kevin','Espera...'],['Kevin','Meu Deus. Foi o Pirate 40.'],
 ['Esther','{player}, POR FAVOR, FECHA OS SETORES!!'],['Gustavo','É CULPA DE {player}! {subject} DEIXOU A LOCALIZAÇÃO ATIVA!'],
 ['Esther','DISCUTE ISSO DEPOIS, NOAH! A GENTE VAI MORRER!'],['Sistema','Presença não autorizada detectada no perímetro.']
];
const AFTERMATH_DIALOGUE = [['Esther','Conseguimos...'],['Kevin','Acho que eles não passaram.'],['Gustavo','Isso não teria acontecido se alguém tivesse desligado o localizador.'],['Esther','40, a gente precisa conversar.']];
let lastClosedSector = null;
const securityAudio = new Audio(SECURITY_AUDIO_SRC);
securityAudio.loop = true; securityAudio.preload = 'auto'; securityAudio.volume = .65;
let audioPrepared = false, audioPending = false, audioEpoch = 0, audioBlocked = false, soundMuted = false;
function updateSoundButton() {
 const button = $('#securitySound');
 button.textContent = audioBlocked ? 'Ativar som do alarme' : soundMuted ? 'Ativar som' : 'Silenciar alarme';
 button.setAttribute('aria-pressed', String(!soundMuted && !audioBlocked));
}
async function prepareSecurityAudio() {
 if (state.security.status === 'active') { if (!soundMuted) playSecurityAudio(); return; }
 if (audioPrepared || audioPending) return;
 audioPrepared = true; audioPending = true;
 const epoch = ++audioEpoch; securityAudio.muted = true;
 try { await securityAudio.play(); } catch { audioPrepared = false; }
 finally { if (epoch === audioEpoch) { securityAudio.pause(); securityAudio.currentTime=0;securityAudio.muted=false;audioPending=false; if(state.security.status==='active')playSecurityAudio(); } }
}
async function playSecurityAudio() {
 if(state.security.status!=='active' || soundMuted || audioPending || !securityAudio.paused)return;
 const epoch=++audioEpoch;audioPending=true;securityAudio.muted=false;
 try { await securityAudio.play(); if(epoch!==audioEpoch || state.security.status!=='active'){securityAudio.pause();return;} audioBlocked=false; }
 catch {if(epoch===audioEpoch)audioBlocked=true;}
 finally {if(epoch===audioEpoch){audioPending=false;updateSoundButton();}}
}
function stopSecurityAlarm() {++audioEpoch;audioPending=false;audioBlocked=false;securityAudio.pause();securityAudio.currentTime=0;securityAudio.muted=false;}
$('#scanButton').addEventListener('click',prepareSecurityAudio);
$('#securitySound').addEventListener('click',()=>{
 if(audioBlocked || soundMuted || securityAudio.paused){soundMuted=false;playSecurityAudio();}
 else {soundMuted=true;stopSecurityAlarm();updateSoundButton();}
});
window.addEventListener('pagehide',stopSecurityAlarm);
function trackSecurityActivity(activity) {
 if(!state.unlocked || state.security.triggered || !REQUIRED_SECURITY_ACTIVITIES.includes(activity))return;
 if(!state.security.explored.includes(activity)){state.security.explored.push(activity);save();}
}
function checkSecurityProgress() {
 const alarm=state.security;if(alarm.status!=='idle' || alarm.triggered)return;
 const ready=REQUIRED_SECURITY_ACTIVITIES.every(a=>alarm.explored.includes(a));
 if(!ready || !state.unlocked || state.page!=='inicio' || document.hidden){if(alarm.homeDue){alarm.homeDue=0;save();}return;}
 if(!alarm.homeDue){alarm.homeDue=Date.now()+SECURITY_HOME_DELAY_MS;save();}
 else if(Date.now()>=alarm.homeDue)startSecurityAlarm();
}
function syncEmergencyChat() {
 if(!state.security.messages.length){delete chats.emergency;return;}
 chats.emergency={name:'BASE — CANAL DE EMERGÊNCIA',status:'Canal de emergência · '+state.security.messages.at(-1).date,messages:state.security.messages,answers:[]};
}
function sendEmergencyMessage(sender,text,index,phase='invasion') {
 const id=phase+'-'+index;if(state.security.messages.some(m=>m.id===id))return;
 const originGame=phase==='invasion'?state.security.startedGameTime:state.security.finishedGameTime;
 const receivedAt=originGame===undefined?getGameDate().getTime():originGame+(index+1)*SECURITY_MESSAGE_INTERVAL_MS*(state.clock?.rate || 1);
 state.security.messages.push({id,from:'other',sender,text,...stampAt(receivedAt)});
 recordNarrativeMessage('emergency:'+state.security.startedAt+':'+id,receivedAt);
 syncEmergencyChat();
 const reading=state.unlocked && state.page==='mensagens' && state.openChat==='emergency';
 if(reading)state.security.readCount=state.security.messages.length;
 save();notify(sender,text,'mensagens',!reading,state.security.status==='active','emergency');
 if(state.unlocked && state.page==='mensagens'){render();const log=content.querySelector('.chat');if(reading && log)log.scrollTop=log.scrollHeight;}
 updateMessageBadges();
}
function deliverEmergencyMessages() {
 const alarm=state.security,active=alarm.status==='active';if(!active && alarm.status!=='contained')return;
 const dialogue=active?INVASION_DIALOGUE:AFTERMATH_DIALOGUE,field=active?'messageIndex':'aftermathIndex',origin=active?alarm.startedAt:alarm.finishedAt;
 const due=Math.min(dialogue.length,Math.floor((Date.now()-origin)/SECURITY_MESSAGE_INTERVAL_MS));
 while(alarm[field]<due){const index=alarm[field]++;sendEmergencyMessage(...dialogue[index],index,active?'invasion':'aftermath');}
}
function finishSecurityEvent() {
 if(state.security.status!=='active')return;
 stopSecurityAlarm();state.security.status='contained';state.security.finishedAt=Date.now();state.security.finishedGameTime=getGameDate().getTime();state.security.homeDue=0;
 save();notify('CONTENÇÃO CONCLUÍDA','Todos os setores foram trancados. A base está segura.','seguranca');
}
function failSecurityEvent(){failSecurity();}
if(state.security.status==='active' && !state.security.startedAt)state.security.startedAt=state.security.deadline-SECURITY_ALARM_SECONDS*1000;
if(state.security.status==='contained' && !state.security.finishedAt){state.security.finishedAt=Date.now();state.security.aftermathIndex=AFTERMATH_DIALOGUE.length;}
syncEmergencyChat();

if (state.security.status === 'failed') {
  if (!Number.isFinite(state.security.restartAt)) state.security.restartAt = Date.now();
  showSecurityFailure();
}


runSecurityClock();
if(state.security.status === "active") playSecurityAudio();
updateSecurityUI();

// Existing emergency intervals remain unchanged; preview the next sender.
function updateEmergencyTyping() {
 const target=document.getElementById('emergencyTyping');
 if(!target || !state.unlocked || state.page!=='mensagens' || state.openChat!=='emergency')return;
 const active=state.security.status==='active',contained=state.security.status==='contained';
 const dialogue=active?INVASION_DIALOGUE:AFTERMATH_DIALOGUE;
 const index=active?state.security.messageIndex:state.security.aftermathIndex;
 const markup=(active || contained) && dialogue[index] ? typingIndicator(dialogue[index][0]) : '';
 if(target.innerHTML!==markup)target.innerHTML=markup;
}
