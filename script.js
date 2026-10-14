// PIRATE 40 — Protótipo 1.0. Tudo é ficção: sem câmera, GPS ou rede real.
const $ = (selector) => document.querySelector(selector);
const scanScreen = $('#scanScreen');
const systemScreen = $('#systemScreen');
const content = $('#content');
const nav = $('#nav');
const STORAGE_KEY = 'pirate40-save-v1';

const initialState = {
  profile: null,
  diary: [],
  diaryUnlocked: false,
  techBang: null,
  motherMessages: [],
  amelieStory: null,
  clock: null,
  timeline: null,
  gameTime: Date.UTC(2091,2,31,23,0,0),
  vitals: {bpm:76,mode:'normal'},
  sentTimes: {},
  unlocked: false,
  page: 'inicio',
  openChat: null,
  read: [],
  sent: {},
  replyDue: {},
  dogStory: {messages:[],choice:null,photoUnlocked:false,completed:false,nextAt:0},
  notes: [{ id: 1, title: 'LEMBRETE', body: 'Desligar o localizador antes de sair.\nNão confiar nos canais oficiais.\nEncontrar o protótipo.', date: '09/04/2091' }],
  locator: true,
  wallpaper: 'aero',
  notifications: [],
  welcomed: false
};
let state;
try { state = { ...structuredClone(initialState), ...migrateCharacterData(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')) }; }
catch { state = structuredClone(initialState); }
// Persist renamed references without changing the save key.
try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
const chats = {
  esther: { name: 'ESTHER', status: 'Frequência privada', messages: [
    { from: 'other', text: '{player}, cadê você? Já pegou o nosso protótipo?', time: '03:41' },
    { from: 'other', text: 'Não podemos continuar aqui por muito tempo.', time: '03:42' }
  ], answers: [
    { text: 'Que protótipo?', response: 'Para de brincar. Você sabe que não podemos deixar isso lá.' },
    { text: 'Onde você está?', response: 'Estou no ponto combinado. Você não lembra?' },
    { text: 'A conexão está estranha.', response: 'Sua voz está diferente. O que aconteceu?' }
  ] },
  unknown: { name: 'CONTATO DESCONHECIDO', status: 'Origem mascarada', messages: [
    { from: 'other', text: 'Deixou o localizador ligado, Pirata.', time: '03:44' }
  ], answers: [
    { text: 'Quem é você?', response: 'Não importa. Encontramos seu sinal.' },
    { text: 'O que você quer?', response: 'Que não se mova.' }
  ] },
  group: { name: 'BASE — GRUPO GERAL', status: 'Histórico da base', messages: [
    { from: 'other', text: '[14 mensagens perdidas]', date:'31/03/2091', time: '02:16' },
    { from: 'other', text: '[Transmissão de áudio irrecuperável]', date:'31/03/2091', time: '02:18' },
    { from: 'other', text: 'Fechem o acesso ao setor inferior.', date:'31/03/2091', time: '02:19' }
  ], answers: [] }
};
function save() { if(typeof syncGameTime === 'function') syncGameTime(); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { showToast('Armazenamento indisponível. O progresso desta sessão não será salvo.', 'sistema'); } }
function escapeHtml(str) { return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function head(title, extra = '') { return `<div class="page-heading"><h2>${title}</h2><span class="meta">${extra}</span></div>`; }
function activate() {
  if (!state.profile || state.security?.status === 'failed') return;
  $('#identityScreen').classList.add('hidden');
  scanScreen.classList.add('hidden'); systemScreen.classList.remove('hidden');
  state.unlocked = true; beginNarrativeAccess(); state.page = 'inicio'; state.openChat = null; save(); render();
  if (!state.welcomed) { state.welcomed = true; notify('Mensagem de Esther', 'Cadê você? Já pegou o nosso protótipo?', 'mensagens'); notify('IA de Sobrevivência', 'Assistência local disponível.', 'ia', false); save(); }
}
let scanTimers = [], scanGeneration = 0;
function beginFaceScan() {
  if(!state.profile || state.security?.status==='failed')return;
  scanTimers.forEach(clearTimeout);const generation=++scanGeneration;
  $('#identityScreen').classList.add('hidden');scanScreen.classList.remove('hidden');
  scanScreen.classList.add('scanning');
  const btn=$('#scanButton');btn.disabled=true;btn.textContent='Reconhecendo você…';
  $('#scanDescription').textContent='Localizando a identidade compartilhada…';
  scanTimers.push(setTimeout(()=>{
    if(generation!==scanGeneration)return;
    $('#scanDescription').textContent='IDENTIDADE LOCALIZADA · USUÁRIO: '+playerName()+' · REGISTRO TEMPORAL: 2091 · CORRESPONDÊNCIA BIOMÉTRICA CONFIRMADA';
    btn.textContent='ACESSO AUTORIZADO';
    scanTimers.push(setTimeout(()=>{if(generation===scanGeneration)activate();},1000));
  },1500));
}
$('#scanButton').addEventListener('click',beginFaceScan);
$('#lockButton').addEventListener('click', () => {
  endNarrativeAccess();
  scanTimers.forEach(clearTimeout);scanGeneration++;
  closePhoto(false);
  state.unlocked = false; scanScreen.classList.remove('scanning'); $('#notificationPanel').classList.add('hidden'); $('#toastRegion').innerHTML = ''; save(); systemScreen.classList.add('hidden'); scanScreen.classList.remove('hidden');
  $('#scanButton').disabled = false; $('#scanButton').textContent = 'Reconhecer meu rosto →';
  $('#scanDescription').textContent = 'Desbloqueie seu dispositivo para continuar, Pirate 40.';
  updateNotifications(); $('#notificationButton').setAttribute('aria-expanded', 'false');
  if (typeof updateSecurityUI === 'function') updateSecurityUI();
});
nav.addEventListener('click', e => {
  const button = e.target.closest('[data-page]'); if (!button) return;
  state.page = button.dataset.page; state.openChat = null; save(); render();
});
content.addEventListener('click', e => {
  const pageButton = e.target.closest('[data-go]');
  if (pageButton) { state.page = pageButton.dataset.go; state.openChat = null; save(); render(); return; }
  const chatButton = e.target.closest('[data-chat]');
  if (chatButton) { messengerProfile=null; state.openChat = chatButton.dataset.chat; if (!state.read.includes(state.openChat)) state.read.push(state.openChat); save(); render(); return; }
  if (e.target.closest('[data-back]')) { state.openChat = null; save(); render(); return; }
  const response = e.target.closest('[data-reply]');
  if (response && state.openChat) {
    const chatId = state.openChat, idx = Number(response.dataset.reply);
    const answer = chats[chatId].answers[idx];
    if (!answer || state.sent[chatId] !== undefined) return;
    state.sentTimes[chatId]={mine:gameMessageStamp()}; state.sent[chatId] = idx; state.replyDue[chatId] = Date.now() + typingDelay(answer.response); state.sentTimes[chatId].replyAt=state.gameTime+typingDelay(answer.response)*(state.clock?.rate || 1); save(); render();
  }
  if (e.target.id === 'saveNote') {
    const title = $('#noteTitle').value.trim(), body = $('#noteBody').value.trim();
    if (!title || !body) { $('#noteFeedback').textContent = 'Preencha o título e o conteúdo.'; return; }
    state.notes.unshift({id: Date.now(), title, body, date: gameMessageStamp().date}); save(); render(); notify('Anotação salva', title, 'notas');
  }
  if (e.target.closest('[data-delete-note]')) {
    state.notes = state.notes.filter(n => n.id !== Number(e.target.closest('[data-delete-note]').dataset.deleteNote)); save(); render();
  }
  if (e.target.id === 'resetSave') $('#restartDialog').showModal();
});
content.addEventListener('change', e => { if (e.target.id === 'locatorToggle') { state.locator = e.target.checked; save(); render(); notify(state.locator ? 'Localização ativada' : 'Localização desativada', state.locator ? 'Seu dispositivo está transmitindo sua posição.' : 'Emissão de posição suspensa.', 'sistema'); }});
function render() {
  const passwordField=state.page==='diario'?$('#diaryPassword'):null;
  const passwordEditing=passwordField && document.activeElement===passwordField;
  const passwordSelection=passwordEditing?[passwordField.selectionStart,passwordField.selectionEnd]:null;
  if(state.page!=='mensagens') messengerProfile=null;
  if (typeof mapCleanup === 'function') mapCleanup();
  if (typeof trackSecurityActivity === 'function') { if (state.page !== 'ia') trackSecurityActivity(state.page); checkSecurityProgress(); }
  if (state.page === 'mensagens' && state.openChat === 'emergency' && state.security) { state.security.readCount=state.security.messages.length; save(); }
  nav.querySelectorAll('[data-page]').forEach(b => b.classList.toggle('active', b.dataset.page === state.page));
  const unread = getUnreadMessageCount();
  const pill = $('#unreadPill'); if (pill) { pill.textContent = unread; pill.hidden = unread === 0; }
  document.querySelector('.device').dataset.wallpaper = state.wallpaper;
  systemScreen.classList.toggle('is-home', state.page === 'inicio');
  $('#appToolbar').classList.toggle('hidden', state.page === 'inicio');
  $('#appTitle').textContent = apps.find(a => a.id === state.page)?.name || '';
  updateNotifications();
  $('#bottomLocation').textContent = state.locator ? 'LOCALIZADOR: EMISSÃO ATIVA' : 'LOCALIZADOR: DESLIGADO';
  const pages = { inicio: renderInicio, ia: (typeof renderIA === 'function' ? renderIA : renderInicio), mensagens: renderMensagens, mapa: renderMapa, galeria: renderGaleria, notas: renderNotas, arquivos: renderArquivos, sistema: renderSistema, seguranca: renderSecurity, vitals: renderVitals, calendar: renderCalendar, diario: renderDiary, techbang: renderTechBang };
  content.innerHTML = pages[state.page]?.() || renderInicio();
  if(state.page==='diario'&&!state.diaryUnlocked){const field=$('#diaryPassword');if(field){field.value=diaryPasswordDraft;if(passwordEditing){field.focus();if(field.setSelectionRange)field.setSelectionRange(...passwordSelection);}}}
  content.scrollTop = 0;
  if(typeof updateSessionUI === 'function')updateSessionUI();
  if (state.page === 'mapa') mountWorldMap();
  if (typeof updateSecurityUI === 'function') updateSecurityUI();
  if (content.animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) content.animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}], {duration:220,easing:'ease-out'});
}
function renderInicio() {
  const unread = getUnreadMessageCount();
  return `<div class="home-hero"><div><p class="eyebrow" data-game-date></p><div class="hero-clock" data-game-clock></div><p class="hero-date">2091 <span>·</span> Seu tempo, sua história.</p></div><div class="orbit-art" aria-hidden="true"><i></i><i></i><i></i><span>40</span></div></div>
  <div class="home-widgets"><button class="survival-widget" data-go="ia"><span class="widget-icon">${icon('ia')}</span><span><small>AO SEU LADO</small><strong>Um passo de cada vez.</strong><span>Seu guia de sobrevivência está aqui.</span></span><span class="widget-arrow">→</span></button><button class="location-widget" data-go="mapa">${icon('mapa')}<small>ÚLTIMA LOCALIZAÇÃO</small><strong>Em algum lugar<br>no oceano.</strong><span class="location-caption">Instalação desconhecida ↗</span></button></div>
  <div class="apps-heading"><span>Seu universo</span><span>${apps.length} aplicativos · modo local</span></div>
  <div class="app-grid">${apps.map(a => `<button class="app-launcher" data-go="${a.id}"><span class="app-icon ${a.id}">${icon(a.id)}${a.id === 'mensagens' ? `<b class="app-badge" data-message-badge ${unread ? '' : 'hidden'}>${unread}</b>` : ''}</span><strong>${a.name}</strong><small>${a.caption}</small></button>`).join('')}</div>
  <button class="home-reminder" data-go="${unread ? 'mensagens' : 'notas'}"><span class="reminder-dot"></span><span>${unread ? 'Você tem conversas esperando por você.' : 'Algumas coisas merecem ser lembradas.'}</span><span>→</span></button>`;
}
function renderMensagens() {
  if (messengerProfile) return renderMessengerProfile(messengerProfile);
  if (state.openChat) {
    const id = state.openChat, chat = chats[id], sentIdx = state.sent[id];
    if(id === 'group') startDogConversation();
    const messages = id === 'group' ? [...chat.messages,...BASE_HISTORY,...state.dogStory.messages] : [...chat.messages];
    if (sentIdx !== undefined) { const a = chat.answers[sentIdx]; messages.push({from:'mine',text:a.text,...(state.sentTimes[id]?.mine || {time:'03:45'})}); if (!state.replyDue[id]) messages.push({from:'other',text:a.response,...(state.sentTimes[id]?.other || {time:'03:46'})}); }
    return `<button class="back" data-back>← VOLTAR AOS CONTATOS</button>${messengerHeader(id,chat)}
    <div class="chat">${!messages.length ? '<p class="empty-history">Nenhuma mensagem disponível neste histórico.</p>' : ''}${messages.map(m=>`<div class="bubble ${m.from==='mine'?'mine':''}">${m.sender ? `<strong class="message-sender">${escapeHtml(m.sender==='Pirate 40' ? playerName()+' · Pirate 40' : m.sender)}</strong>` : ''}${escapeHtml(dialogueText(m.text))}${m.photoId ? photoThumbnail(m.photoId, true) : ''}<small>${m.date ? escapeHtml(m.date)+' · ' : ''}${m.time}</small></div>`).join('')}${state.replyDue[id] ? typingIndicator(chat.name) : ''}${id === 'group' ? dogTyping() : ''}${id === 'emergency' ? '<div id="emergencyTyping"></div>' : ''}</div>
    ${id === 'group' ? dogChoices() : id === 'amelie' ? amelieControls() : ''}
    ${sentIdx===undefined && chat.answers.length ? `<p class="muted" style="margin-top:15px">ESCOLHA UMA RESPOSTA:</p><div class="responses">${chat.answers.map((a,i)=>`<button class="secondary" data-reply="${i}">${escapeHtml(a.text)}</button>`).join('')}</div>` : `<p class="muted" style="margin-top:15px">${state.replyDue[id] ? 'Aguardando resposta…' : chat.answers.length ? 'Nenhuma nova resposta disponível.' : id === 'group' ? (state.dogStory.completed ? 'Histórico recuperado.' : 'Conversa da base') : 'Canal somente para leitura.'}</p>`}`;
  }
  return renderMessengerList();
}
function renderMapa() { return locationControl()+renderWorldMap(); }
function renderGaleria() {
  return head('Galeria','SUAS MEMÓRIAS') + '<div class="gallery-intro"><h3>Pequenos pedaços da vida.</h3><p class="muted">' + availablePhotos().length + ' fotografias · toque para ampliar</p></div><div class="photo-grid">' + availablePhotos().map(photo => photoThumbnail(photo.id)).join('') + '</div><div class="gallery-albums"><span>Base</span><span>Registros</span></div>';
}
function renderNotas() {
  return `${head('ANOTAÇÕES','ARQUIVO LOCAL')}<div class="panel"><p class="eyebrow">NOVA ANOTAÇÃO</p><input id="noteTitle" class="input" aria-label="Título da nota" placeholder="Título da nota" maxlength="70"/><textarea id="noteBody" aria-label="Conteúdo da nota" placeholder="Escreva aqui..."></textarea><div class="row"><span id="noteFeedback" class="meta">Salvo neste navegador</span><button class="primary" id="saveNote">SALVAR NOTA</button></div></div>
  <div class="list">${state.notes.map(n=>`<article class="note-item"><div class="row"><strong>${escapeHtml(n.title)}</strong><button class="icon-button" data-delete-note="${n.id}" title="Excluir nota" aria-label="Excluir ${escapeHtml(n.title)}">×</button></div><span class="meta">${escapeHtml(n.date)}</span><p>${escapeHtml(dialogueText(n.body))}</p></article>`).join('')}</div>`;
}
function renderArquivos() {
  return `${head('ARQUIVOS','RECUPERAÇÃO PARCIAL')}
  <div class="file-item"><strong>PROTOCOLO_001.txt</strong><p>Indivíduos sem identificação neural não devem se aproximar das zonas monitoradas.<br>Status: circulação restrita.</p><span class="meta">TEXTO RECUPERADO • DATA DESCONHECIDA</span></div>
  <div class="file-item"><strong>PROTOTIPO_40.dat</strong><p>Arquivo encriptado. O dispositivo original é necessário para leitura.</p><span class="meta">ACESSO INDISPONÍVEL</span></div>
  <div class="file-item"><strong>BASE_INTERNA.map</strong><p>Fragmento de planta cartográfica indisponível.</p><span class="meta">ARQUIVO CORROMPIDO</span></div>`;
}
function locationControl(){return '<button type="button" class="secondary location-control" data-locator-toggle aria-pressed="'+state.locator+'">'+(state.locator?'Desativar localização':'Ativar localização')+'</button>';}
function renderSistema() {
  return `${head('Configurações','NEXUS / P40')}
  <div class="panel"><p class="eyebrow">CONFIGURAÇÃO DE RASTREIO</p><div class="row" style="margin-top:12px"><div><strong>Localizador</strong><p class="muted">Transmitir posição pela rede</p></div>${locationControl()}</div></div>
  <div class="panel"><p class="line">PROPRIETÁRIO: <strong>${escapeHtml(playerName())} · PIRATE 40</strong></p><p class="line">ANO: <strong>2091</strong></p><p class="line">BIOMETRIA: <strong>VERIFICADA (SIMULAÇÃO)</strong></p><p class="line">REDE: <strong>MODO LOCAL</strong></p><p class="muted" style="margin-top:12px">As decisões e notas ficam salvas apenas neste navegador por localStorage.</p></div>
  <div class="panel"><p class="eyebrow">PAPEL DE PAREDE</p><div class="wallpaper-options">${['aero','dusk','tide'].map((w,i) => `<button data-wallpaper="${w}" aria-pressed="${state.wallpaper === w}" class="wallpaper-choice ${w}">${['Aurora','Entardecer','Maré'][i]}</button>`).join('')}</div></div><div class="panel"><p class="line">LOCALIZAÇÃO: <strong>Instalação desconhecida · oceano aberto</strong></p><p class="line">SEGURANÇA: <strong>Reconhecimento facial local simulado</strong></p></div>
  <div class="panel"><h3>Gerenciamento da Partida</h3><p class="muted">Começar novamente, com uma nova identidade e todo o progresso reiniciado.</p><button id="resetSave" class="danger">REINICIAR HISTÓRIA</button></div>`;
}
// Every session begins at the fictional lock screen; saved progress is preserved.
state.unlocked = false;

const apps = [
  {id:'mensagens',name:'Mensagens',caption:'Perto, mesmo de longe'},
  {id:'ia',name:'IA de Sobrevivência',caption:'Conte comigo'},
  {id:'galeria',name:'Galeria',caption:'Fragmentos do mundo'},
  {id:'mapa',name:'Mapa',caption:'Encontre seu caminho'},
  {id:'techbang',name:'TECH BANG',caption:'Equipamento pareado'},
  {id:'diario',name:'Diário',caption:'Entre dois tempos'},
  {id:'notas',name:'Anotações',caption:'Para não esquecer'},
  {id:'arquivos',name:'Arquivos',caption:'O que ficou guardado'},
  {id:'seguranca',name:'Segurança',caption:'Cuide da base'},
  {id:'vitals',name:'Sinais Vitais',caption:'Do outro lado do tempo'},
  {id:'calendar',name:'Calendário',caption:'Dias que contam histórias'},
  {id:'sistema',name:'Configurações',caption:'Do seu jeito'}
];
function icon(name) {
  const paths = {
    techbang:'<rect x="5" y="8" width="22" height="16" rx="5"/><path d="M10 3v5m6-5v5m6-5v5M10 24v5m6-5v5m6-5v5M1 13h4m22 0h4M1 19h4m22 0h4m-12-8-5 6h6l-5 5"/>',
    diario:'<path d="M5 4h19a3 3 0 0 1 3 3v22H8a3 3 0 0 1-3-3Zm4 0v25M14 10h8m-8 6h8m-8 6h5"/>',
    calendar:'<rect x="4" y="6" width="24" height="23" rx="4"/><path d="M4 13h24M10 3v6m12-6v6M10 19h3m6 0h3m-12 5h3"/>',
    vitals:'<path d="M16 28S2 19 2 10a7 7 0 0 1 14-3 7 7 0 0 1 14 3c0 9-14 18-14 18Z"/><path d="M4 16h7l3-6 4 12 3-6h7"/>',
    seguranca:'<path d="M16 3 27 7v9c0 7-11 13-11 13S5 23 5 16V7Z"/><path d="m10 16 4 4 8-9"/>',
    mensagens:'<path d="M5 5h22v16H14l-7 5v-5H5z"/><path d="M10 11h12M10 16h8"/>',
    ia:'<rect x="5" y="9" width="22" height="17" rx="7"/><path d="M16 9V5m-3 0h6M2 16v5m28-5v5M11 21h10"/><circle cx="11" cy="15" r="1"/><circle cx="21" cy="15" r="1"/>',
    galeria:'<rect x="4" y="5" width="24" height="22" rx="4"/><circle cx="12" cy="12" r="3"/><path d="m5 24 8-7 5 4 5-7 5 6"/>',
    mapa:'<path d="M26 13c0 7-10 16-10 16S6 20 6 13a10 10 0 0 1 20 0Z"/><circle cx="16" cy="13" r="4"/>',
    notas:'<rect x="6" y="4" width="21" height="25" rx="3"/><path d="M11 4v25M15 11h7m-7 6h7m-7 6h4M4 10h4m-4 7h4m-4 7h4"/>',
    arquivos:'<path d="M3 10V7a2 2 0 0 1 2-2h8l4 5h10a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10Z"/><path d="M3 12h26"/>',
    sistema:'<path d="m13 3-1 4-4 2-4-1-2 5 3 3v4l-2 3 4 4 4-1 3 1 2 3 5-2v-4l3-3 4-1-1-6-4-1-2-3V4Z"/><circle cx="16" cy="16" r="5"/>',
    lock:'<rect x="7" y="14" width="18" height="14" rx="4"/><path d="M11 14V9a5 5 0 0 1 10 0v5M16 20v3"/>',
    bell:'<path d="M7 22h18l-3-5v-5a6 6 0 0 0-12 0v5l-3 5Zm6 4h6"/>',
    face:'<path d="M10 3H5a2 2 0 0 0-2 2v5m19-7h5a2 2 0 0 1 2 2v5M3 22v5a2 2 0 0 0 2 2h5m12 0h5a2 2 0 0 0 2-2v-5M10 11v3m12-3v3m-6-2v7h-2m-4 3q6 5 12 0"/>'
  };
  return `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.sistema}</svg>`;
}
document.querySelectorAll('[data-icon]').forEach(el => el.innerHTML = icon(el.dataset.icon));
nav.innerHTML = apps.map(a => `<button class="nav-btn" data-page="${a.id}" aria-label="${a.name}" title="${a.name}">${icon(a.id)}<span>${a.name}</span>${a.id === 'mensagens' ? '<b id="unreadPill">3</b>' : ''}</button>`).join('');
function goHome() { state.page = 'inicio'; state.openChat = null; save(); render(); }
$('#homeButton').addEventListener('click', goHome);
$('#homeGesture').addEventListener('click', goHome);
let toastTimer;
function showToast(text, page, urgent = false, chatId = null) {
  if (!state.unlocked) return;
  $('#toastRegion').innerHTML = `<button class="notification-toast ${urgent ? 'urgent' : ''}" data-notification-page="${page}" ${chatId ? `data-notification-chat="${chatId}"` : ''}>${icon(urgent ? 'seguranca' : 'bell')}<span>${escapeHtml(dialogueText(text))}</span><span>→</span></button>`;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toastRegion').innerHTML = '', 5500);
}
function notify(title, body, page, toast = true, urgent = false, chatId = null) {
  state.notifications.unshift({id:Date.now(), title, body, page, urgent, chatId, read:false});
  state.notifications = state.notifications.slice(0,20); save(); updateNotifications();
  if (toast) showToast(`${title} · ${body}`, page, urgent, chatId);
}
function updateNotifications() {
  const count = state.notifications.filter(n => !n.read).length;
  $('#notificationCount').textContent = count; $('#notificationCount').hidden = count === 0;
  $('#notificationButton').disabled = !state.unlocked;
  $('#notificationPanel').innerHTML = `<div class="row"><h3>Notificações</h3><button id="closeNotifications" class="icon-button" aria-label="Fechar notificações">×</button></div>${state.notifications.length ? state.notifications.map(n => `<button class="notification-item ${n.read ? '' : 'unread'}" data-notification-page="${n.page}" ${n.chatId ? `data-notification-chat="${n.chatId}"` : ''}><strong>${escapeHtml(n.title)}</strong><span>${escapeHtml(n.body)}</span></button>`).join('') : '<p class="muted">Tudo tranquilo por aqui.</p>'}`;
}
$('#notificationButton').addEventListener('click', () => {
  const panel = $('#notificationPanel'); panel.classList.toggle('hidden');
  $('#notificationButton').setAttribute('aria-expanded', String(!panel.classList.contains('hidden')));
  if (!panel.classList.contains('hidden')) { state.notifications.forEach(n => n.read = true); save(); updateNotifications(); }
});
document.addEventListener('click', e => {
  if (e.target.closest('#closeNotifications')) { $('#notificationPanel').classList.add('hidden'); $('#notificationButton').setAttribute('aria-expanded','false'); }
  const notice = e.target.closest('[data-notification-page]');
  if (notice && state.unlocked) { messengerProfile=null; state.page = notice.dataset.notificationPage; state.openChat = notice.dataset.notificationChat || null; $('#notificationPanel').classList.add('hidden'); $('#notificationButton').setAttribute('aria-expanded','false'); $('#toastRegion').innerHTML = ''; save(); render(); }
  if(e.target.closest('[data-locator-toggle]') && state.unlocked){state.locator=!state.locator;save();render();notify(state.locator?'Localização ativada':'Localização desativada',state.locator?'Seu dispositivo está transmitindo sua posição.':'Emissão de posição suspensa.','sistema');}
  const wallpaper = e.target.closest('[data-wallpaper]');
  if (wallpaper) { state.wallpaper = wallpaper.dataset.wallpaper; save(); render(); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (e.defaultPrevented) return; if ($('#restartDialog').open) { e.preventDefault(); $('#restartDialog').close(); return; } if ($('#photoViewer').open) { e.preventDefault(); closePhoto(); return; } $('#notificationPanel').classList.add('hidden'); $('#notificationButton').setAttribute('aria-expanded','false'); if (state.unlocked) goHome(); } });
document.querySelector('.device').dataset.wallpaper = state.wallpaper;
updateNotifications();

function getUnreadMessageCount() {
 const ordinary=Object.keys(chats).filter(id=>id!=='emergency' && chats[id].messages.length>0 && !state.read.includes(id)).length;
 return ordinary + (state.security ? Math.max(0,state.security.messages.length-state.security.readCount) : 0);
}
function updateMessageBadges() {
 const count=getUnreadMessageCount();
 const pill=$('#unreadPill');if(pill){pill.textContent=count;pill.hidden=count===0;}
 document.querySelectorAll('[data-message-badge]').forEach(el=>{el.textContent=count;el.hidden=count===0;});
}

// A short, length-sensitive pause makes live replies feel conversational.
function typingDelay(text) { return Math.min(3400, 1400 + String(text).length * 13); }
function typingIndicator(name) {
 return '<div class="typing-indicator" role="status"><span>' + escapeHtml(name) + ' está digitando</span><span class="typing-dots" aria-hidden="true"><i></i><i></i><i></i></span></div>';
}
function tickConversations() {
 tickDogConversation();
 for (const [id,due] of Object.entries(state.replyDue)) {
   if (Date.now() < due) continue;
   delete state.replyDue[id];
   state.sentTimes[id] ??= {};const receivedAt=state.sentTimes[id].replyAt ?? state.gameTime;state.sentTimes[id].other=stampAt(receivedAt);recordNarrativeMessage('reply:'+id,receivedAt);
   const reading = state.unlocked && state.page === 'mensagens' && state.openChat === id;
   if (!reading) state.read = state.read.filter(item => item !== id);
   save();
   if (reading || (state.unlocked && state.page==='mensagens' && !state.openChat)) { render(); const log=content.querySelector('.chat');if(log)log.scrollTop=log.scrollHeight; }
   updateMessageBadges();
 }
 document.dispatchEvent(new Event('pirate40:chat-tick'));
 if (typeof updateEmergencyTyping === 'function') updateEmergencyTyping();
}
let conversationTimer = setInterval(tickConversations, 250);
document.addEventListener('visibilitychange', tickConversations);

// The old base conversation is revealed in place, using the existing chat renderer.
const DOG_INTRO = [
 ['Kevin','Gente, vocês não vão acreditar no que eu encontrei KKKKK'],['Esther','O quê?'],['Kevin','Um cachorro 😭'],['Gustavo','Um O QUÊ?'],
 ['Kevin','Ele tava perto de uma das entradas da base. Ficou uivando um tempão, acho que tava perdido.'],['Kevin','Olha ele aqui'],['Kevin','','dog'],
 ['Kevin','Posso trazer ele pra dentro? Não dá pra deixar o bichinho lá.']
];
const DOG_OPTIONS = ['Por mim pode trazer! 🥹','Acho melhor não, pode ser perigoso.'];
const DOG_BRANCHES = [
 [['Kevin','EU SABIA QUE PODIA CONTAR COM VOCÊ KKKKK'],['Esther','Mais um integrante pra nossa base 💗'],['Gustavo','Tá, mas o Kevin vai cuidar dele.'],['Kevin','FECHOU!!']],
 [['Kevin','AH NÃO, 40 😭'],['Esther','Eu entendo a preocupação, mas a gente não pode deixar ele lá sozinho.'],['Gustavo','Pela primeira vez eu concordo com o 40. Isso pode dar problema.'],['Kevin','Mas ele tá abandonado! Eu prometo cuidar dele.'],['Esther','Eu voto pra ele ficar.'],['Kevin','Então tá decidido KKKKK'],['Gustavo','Isso não é uma votação justa.']]
];
function dogSequence() {
 const story=state.dogStory;
 return story.choice===null ? DOG_INTRO : [...DOG_INTRO,['Pirate 40',DOG_OPTIONS[story.choice]],...DOG_BRANCHES[story.choice],['Kevin','PRONTO, ELE JÁ TÁ AQUI!! 🐶'],['Sistema','Novo integrante acolhido na base.']];
}
function startDogConversation() { processNarrativeEvents(); }
function dogTyping() {
 const next=dogSequence()[state.dogStory.messages.length];
 return next && (state.dogStory.nextAt || (state.timeline?.events?.['dog-found'] && state.dogStory.messages.length<DOG_INTRO.length)) ? typingIndicator(next[0]) : '';
}
function dogChoices() {
 const story=state.dogStory;
 if(story.choice!==null || story.messages.length!==DOG_INTRO.length)return '';
 return '<div class="responses" aria-label="Sua resposta a Kevin">'+DOG_OPTIONS.map((text,i)=>'<button class="secondary" data-dog-choice="'+i+'">'+escapeHtml(text)+'</button>').join('')+'</div>';
}
function addDogMessage(entry, at = getGameDate().getTime()) {
 const story=state.dogStory;
 story.messages.push({from:entry[0]==='Pirate 40'?'mine':'other',sender:entry[0],text:entry[1],...(entry[2]?{photoId:entry[2]}:{}),...stampAt(at),receivedAt:at});
 if(entry[2]==='dog')story.photoUnlocked=true;
 if(entry[0]!=='Pirate 40')recordNarrativeMessage('dog:'+story.messages.length,at);
}
function refreshDogChat() {
 if(state.unlocked && state.page==='mensagens' && state.openChat==='group'){
   render();const log=content.querySelector('.chat');if(log)log.scrollTop=log.scrollHeight;
 }
}
function tickDogConversation() {
 const story=state.dogStory;
 if(!state.timeline?.events?.['dog-found'])return;
 // Pause outside the historical conversation and during an invasion; never catch up in a burst.
 if(!state.unlocked || state.page!=='mensagens' || state.openChat!=='group' || document.hidden || ['active','failed'].includes(state.security?.status))return;
 if(story.completed || !story.nextAt || Date.now()<story.nextAt)return;
 const entry=dogSequence()[story.messages.length];if(!entry)return;
 addDogMessage(entry);
 const next=dogSequence()[story.messages.length];
 story.completed=story.choice!==null && !next;
 story.nextAt=next?Date.now()+typingDelay(next[1]):0;
 save();refreshDogChat();
}
content.addEventListener('click',event=>{
 const button=event.target.closest('[data-dog-choice]');if(!button)return;
 const story=state.dogStory,choice=Number(button.dataset.dogChoice);
 if(!state.timeline?.events?.['dog-found'] || !state.unlocked || state.openChat!=='group' || story.choice!==null || story.messages.length!==DOG_INTRO.length || ![0,1].includes(choice))return;
 story.choice=choice;addDogMessage(['Pirate 40',DOG_OPTIONS[choice]]);
 story.nextAt=Date.now()+typingDelay(DOG_BRANCHES[choice][0][1]);save();refreshDogChat();
});
