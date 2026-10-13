// PIRATE 40 — Protótipo 1.0. Tudo é ficção: sem câmera, GPS ou rede real.
const $ = (selector) => document.querySelector(selector);
const scanScreen = $('#scanScreen');
const systemScreen = $('#systemScreen');
const content = $('#content');
const nav = $('#nav');
const STORAGE_KEY = 'pirate40-save-v1';

const initialState = {
  unlocked: false,
  page: 'inicio',
  openChat: null,
  read: [],
  sent: {},
  notes: [{ id: 1, title: 'LEMBRETE', body: 'Desligar o localizador antes de sair.\nNão confiar nos canais oficiais.\nEncontrar o protótipo.', date: '09/04/2091' }],
  locator: true,
  wallpaper: 'aero',
  notifications: [],
  welcomed: false
};
let state;
try { state = { ...initialState, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
catch { state = structuredClone(initialState); }
const chats = {
  maya: { name: 'MAYA', status: 'Frequência privada', messages: [
    { from: 'other', text: 'Cadê você? Já pegou o nosso protótipo?', time: '03:41' },
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
  group: { name: 'CANAL / BASE', status: 'Histórico fragmentado', messages: [
    { from: 'other', text: '[14 mensagens perdidas]', time: '02:16' },
    { from: 'other', text: '[Transmissão de áudio irrecuperável]', time: '02:18' },
    { from: 'other', text: 'Fechem o acesso ao setor inferior.', time: '02:19' }
  ], answers: [] }
};
function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { showToast('Armazenamento indisponível. O progresso desta sessão não será salvo.', 'sistema'); } }
function escapeHtml(str) { return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function head(title, extra = '') { return `<div class="page-heading"><h2>${title}</h2><span class="meta">${extra}</span></div>`; }
function activate() {
  scanScreen.classList.add('hidden'); systemScreen.classList.remove('hidden');
  state.unlocked = true; state.page = 'inicio'; state.openChat = null; save(); render();
  if (!state.welcomed) { state.welcomed = true; notify('Mensagem de Maya', 'Cadê você? Já pegou o nosso protótipo?', 'mensagens'); notify('IA de Sobrevivência', 'Assistência local disponível.', 'ia', false); save(); }
}
$('#scanButton').addEventListener('click', () => {
  scanScreen.classList.add('scanning');
  const btn = $('#scanButton'); btn.disabled = true; btn.textContent = 'Reconhecendo você…';
  $('#scanDescription').textContent = 'Só um instante. Encontrando seu perfil pessoal…';
  setTimeout(() => { btn.textContent = 'Olá, Pirate 40 ✓'; $('#scanDescription').textContent = 'IDENTIDADE RECONHECIDA • PIRATE 40'; setTimeout(activate, 750); }, 1500);
});
$('#lockButton').addEventListener('click', () => {
  state.unlocked = false; scanScreen.classList.remove('scanning'); $('#notificationPanel').classList.add('hidden'); $('#toastRegion').innerHTML = ''; save(); systemScreen.classList.add('hidden'); scanScreen.classList.remove('hidden');
  $('#scanButton').disabled = false; $('#scanButton').textContent = 'Reconhecer meu rosto →';
  $('#scanDescription').textContent = 'Desbloqueie seu dispositivo para continuar, Pirate 40.';
  updateNotifications(); $('#notificationButton').setAttribute('aria-expanded', 'false');
});
nav.addEventListener('click', e => {
  const button = e.target.closest('[data-page]'); if (!button) return;
  state.page = button.dataset.page; state.openChat = null; save(); render();
});
content.addEventListener('click', e => {
  const pageButton = e.target.closest('[data-go]');
  if (pageButton) { state.page = pageButton.dataset.go; state.openChat = null; save(); render(); return; }
  const chatButton = e.target.closest('[data-chat]');
  if (chatButton) { state.openChat = chatButton.dataset.chat; if (!state.read.includes(state.openChat)) state.read.push(state.openChat); save(); render(); return; }
  if (e.target.closest('[data-back]')) { state.openChat = null; save(); render(); return; }
  const response = e.target.closest('[data-reply]');
  if (response && state.openChat) {
    const chatId = state.openChat, idx = Number(response.dataset.reply);
    const answer = chats[chatId].answers[idx];
    if (!answer || state.sent[chatId] !== undefined) return;
    state.sent[chatId] = idx; save(); render();
  }
  if (e.target.id === 'saveNote') {
    const title = $('#noteTitle').value.trim(), body = $('#noteBody').value.trim();
    if (!title || !body) { $('#noteFeedback').textContent = 'Preencha o título e o conteúdo.'; return; }
    state.notes.unshift({id: Date.now(), title, body, date: 'CRIADO PELO RECEPTOR'}); save(); render(); notify('Anotação salva', title, 'notas');
  }
  if (e.target.closest('[data-delete-note]')) {
    state.notes = state.notes.filter(n => n.id !== Number(e.target.closest('[data-delete-note]').dataset.deleteNote)); save(); render();
  }
  if (e.target.id === 'resetSave' && confirm('Apagar o progresso local e reiniciar o terminal?')) {
    localStorage.removeItem(STORAGE_KEY); localStorage.removeItem('pirate40-ia-v1'); location.reload();
  }
});
content.addEventListener('change', e => { if (e.target.id === 'locatorToggle') { state.locator = e.target.checked; save(); render(); notify(state.locator ? 'Localização ativada' : 'Localização desativada', state.locator ? 'Seu dispositivo está transmitindo sua posição.' : 'Emissão de posição suspensa.', 'sistema'); }});
function render() {
  nav.querySelectorAll('[data-page]').forEach(b => b.classList.toggle('active', b.dataset.page === state.page));
  const unread = Object.keys(chats).filter(id => !state.read.includes(id)).length;
  const pill = $('#unreadPill'); if (pill) { pill.textContent = unread; pill.hidden = unread === 0; }
  document.querySelector('.device').dataset.wallpaper = state.wallpaper;
  systemScreen.classList.toggle('is-home', state.page === 'inicio');
  $('#appToolbar').classList.toggle('hidden', state.page === 'inicio');
  $('#appTitle').textContent = apps.find(a => a.id === state.page)?.name || '';
  updateNotifications();
  $('#bottomLocation').textContent = state.locator ? 'LOCALIZADOR: EMISSÃO ATIVA' : 'LOCALIZADOR: DESLIGADO';
  const pages = { inicio: renderInicio, ia: (typeof renderIA === 'function' ? renderIA : renderInicio), mensagens: renderMensagens, mapa: renderMapa, galeria: renderGaleria, notas: renderNotas, arquivos: renderArquivos, sistema: renderSistema };
  content.innerHTML = pages[state.page]?.() || renderInicio();
  content.scrollTop = 0;
  if (content.animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) content.animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}], {duration:220,easing:'ease-out'});
}
function renderInicio() {
  const unread = Object.keys(chats).filter(id => !state.read.includes(id)).length;
  return `<div class="home-hero"><div><p class="eyebrow">SEGUNDA-FEIRA, 9 DE ABRIL</p><div class="hero-clock">03<span>:</span>41</div><p class="hero-date">2091 <span>→</span> Um novo dia lá fora.</p></div><div class="orbit-art" aria-hidden="true"><i></i><i></i><i></i><span>40</span></div></div>
  <div class="home-widgets"><button class="survival-widget" data-go="ia"><span class="widget-icon">${icon('ia')}</span><span><small>AO SEU LADO</small><strong>Um passo de cada vez.</strong><span>Seu guia de sobrevivência está aqui.</span></span><span class="widget-arrow">→</span></button><button class="location-widget" data-go="mapa">${icon('mapa')}<small>ÚLTIMA LOCALIZAÇÃO</small><strong>Em algum lugar<br>no oceano.</strong><span class="location-caption">Instalação desconhecida ?</span></button></div>
  <div class="apps-heading"><span>Seu universo</span><span>7 aplicativos · modo local</span></div>
  <div class="app-grid">${apps.map(a => `<button class="app-launcher" data-go="${a.id}"><span class="app-icon ${a.id}">${icon(a.id)}${a.id === 'mensagens' && unread ? `<b class="app-badge">${unread}</b>` : ''}</span><strong>${a.name}</strong><small>${a.caption}</small></button>`).join('')}</div>
  <button class="home-reminder" data-go="${unread ? 'mensagens' : 'notas'}"><span class="reminder-dot"></span><span>${unread ? 'Você tem conversas esperando por você.' : 'Algumas coisas merecem ser lembradas.'}</span><span>→</span></button>`;
}
function renderMensagens() {
  if (state.openChat) {
    const id = state.openChat, chat = chats[id], sentIdx = state.sent[id];
    const messages = [...chat.messages];
    if (sentIdx !== undefined) { const a = chat.answers[sentIdx]; messages.push({from:'mine',text:a.text,time:'03:45'}, {from:'other',text:a.response,time:'03:46'}); }
    return `<button class="back" data-back>← VOLTAR AOS CONTATOS</button>${head(escapeHtml(chat.name),escapeHtml(chat.status))}
    <div class="chat">${messages.map(m=>`<div class="bubble ${m.from==='mine'?'mine':''}">${escapeHtml(m.text)}<small>${m.time}</small></div>`).join('')}</div>
    ${sentIdx===undefined && chat.answers.length ? `<p class="muted" style="margin-top:15px">ESCOLHA UMA RESPOSTA:</p><div class="responses">${chat.answers.map((a,i)=>`<button class="secondary" data-reply="${i}">${escapeHtml(a.text)}</button>`).join('')}</div>` : `<p class="muted" style="margin-top:15px">${chat.answers.length ? 'Nenhuma nova resposta disponível.' : 'Canal somente para leitura.'}</p>`}`;
  }
  return `${head('COMUNICAÇÕES','REDE DESCENTRALIZADA')}
  <div class="list">${Object.entries(chats).map(([id,chat])=>`<button class="chat-item" data-chat="${id}"><div><strong>${escapeHtml(chat.name)} ${!state.read.includes(id)?'•':''}</strong><p>${escapeHtml(chat.messages.at(-1).text)}</p></div><span class="meta">${chat.messages.at(-1).time} →</span></button>`).join('')}</div>`;
}
function renderMapa() {
  return `${head('LOCALIZAÇÃO','MAPA PARCIAL // 2091')}
  <div class="map" role="img" aria-label="Mapa fictício de uma localização no oceano, afastada da costa"><div class="land"></div><div class="ping"></div><span class="map-right">SINAL P40<br>${state.locator?'EMISSÃO ATIVA':'ÚLTIMA POSIÇÃO CONHECIDA'}</span><span class="map-label">OCEANO ABERTO // INSTALAÇÃO NÃO CATALOGADA</span></div>
  <div class="panel" style="margin-top:14px"><p class="eyebrow">DADOS DE POSIÇÃO</p><p class="line">LOCAL: <strong>NÃO IDENTIFICADO</strong></p><p class="line">ESTRUTURA PRÓXIMA: <strong>POSSÍVEL BASE</strong></p><p class="line">CARTOGRAFIA INTERNA: <strong>INDISPONÍVEL</strong></p><p class="muted" style="padding-top:12px">O mapa é ilustrativo; nenhum GPS ou localização real é utilizado.</p></div>`;
}
function renderGaleria() {
  const albums = ['Base', 'Equipe', 'Dispositivos', 'Exterior', 'Recuperados'];
  return `${head('Galeria', 'SUAS MEMÓRIAS')}<div class="gallery-intro"><h3>Um lugar para guardar o mundo.</h3><p class="muted">Suas fotografias vão morar aqui.</p></div><div class="album-grid">${albums.map(name => `<div class="album"><div>${icon('galeria')}</div><strong>${name}</strong><span>0 fotografias</span></div>`).join('')}</div><div class="empty"><strong>Nenhuma fotografia por enquanto</strong><p>Álbuns reservados. As imagens serão adicionadas em uma próxima atualização.</p></div>`;
}
function renderNotas() {
  return `${head('ANOTAÇÕES','ARQUIVO LOCAL')}<div class="panel"><p class="eyebrow">NOVA ANOTAÇÃO</p><input id="noteTitle" class="input" aria-label="Título da nota" placeholder="Título da nota" maxlength="70"/><textarea id="noteBody" aria-label="Conteúdo da nota" placeholder="Escreva aqui..."></textarea><div class="row"><span id="noteFeedback" class="meta">Salvo neste navegador</span><button class="primary" id="saveNote">SALVAR NOTA</button></div></div>
  <div class="list">${state.notes.map(n=>`<article class="note-item"><div class="row"><strong>${escapeHtml(n.title)}</strong><button class="icon-button" data-delete-note="${n.id}" title="Excluir nota" aria-label="Excluir ${escapeHtml(n.title)}">×</button></div><span class="meta">${escapeHtml(n.date)}</span><p>${escapeHtml(n.body)}</p></article>`).join('')}</div>`;
}
function renderArquivos() {
  return `${head('ARQUIVOS','RECUPERAÇÃO PARCIAL')}
  <div class="file-item"><strong>PROTOCOLO_001.txt</strong><p>Indivíduos sem identificação neural não devem se aproximar das zonas monitoradas.<br>Status: circulação restrita.</p><span class="meta">TEXTO RECUPERADO • DATA DESCONHECIDA</span></div>
  <div class="file-item"><strong>PROTOTIPO_40.dat</strong><p>Arquivo encriptado. O dispositivo original é necessário para leitura.</p><span class="meta">ACESSO INDISPONÍVEL</span></div>
  <div class="file-item"><strong>BASE_INTERNA.map</strong><p>Fragmento de planta cartográfica indisponível.</p><span class="meta">ARQUIVO CORROMPIDO</span></div>`;
}
function renderSistema() {
  return `${head('Configurações','NEXUS / P40')}
  <div class="panel"><p class="eyebrow">CONFIGURAÇÃO DE RASTREIO</p><div class="row" style="margin-top:12px"><div><strong>Localizador</strong><p class="muted">Transmitir posição pela rede</p></div><label class="switch"><input id="locatorToggle" type="checkbox" ${state.locator?'checked':''}/> <span>${state.locator?'ATIVO':'INATIVO'}</span></label></div></div>
  <div class="panel"><p class="line">PROPRIETÁRIO: <strong>PIRATE 40</strong></p><p class="line">ANO: <strong>2091</strong></p><p class="line">BIOMETRIA: <strong>VERIFICADA (SIMULAÇÃO)</strong></p><p class="line">REDE: <strong>MODO LOCAL</strong></p><p class="muted" style="margin-top:12px">As decisões e notas ficam salvas apenas neste navegador por localStorage.</p></div>
  <div class="panel"><p class="eyebrow">PAPEL DE PAREDE</p><div class="wallpaper-options">${['aero','dusk','tide'].map((w,i) => `<button data-wallpaper="${w}" aria-pressed="${state.wallpaper === w}" class="wallpaper-choice ${w}">${['Aurora','Entardecer','Maré'][i]}</button>`).join('')}</div></div><div class="panel"><p class="line">LOCALIZAÇÃO: <strong>Instalação desconhecida · oceano aberto</strong></p><p class="line">SEGURANÇA: <strong>Reconhecimento facial local simulado</strong></p></div>
  <button id="resetSave" class="danger">APAGAR PROGRESSO E REINICIAR</button>`;
}
// Every session begins at the fictional lock screen; saved progress is preserved.
state.unlocked = false;

const apps = [
  {id:'mensagens',name:'Mensagens',caption:'Perto, mesmo de longe'},
  {id:'ia',name:'IA de Sobrevivência',caption:'Conte comigo'},
  {id:'galeria',name:'Galeria',caption:'Fragmentos do mundo'},
  {id:'mapa',name:'Mapa',caption:'Encontre seu caminho'},
  {id:'notas',name:'Anotações',caption:'Para não esquecer'},
  {id:'arquivos',name:'Arquivos',caption:'O que ficou guardado'},
  {id:'sistema',name:'Configurações',caption:'Do seu jeito'}
];
function icon(name) {
  const paths = {
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
function showToast(text, page) {
  if (!state.unlocked) return;
  $('#toastRegion').innerHTML = `<button class="notification-toast" data-notification-page="${page}">${icon('bell')}<span>${escapeHtml(text)}</span><span>→</span></button>`;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toastRegion').innerHTML = '', 5500);
}
function notify(title, body, page, toast = true) {
  state.notifications.unshift({id:Date.now(), title, body, page, read:false});
  state.notifications = state.notifications.slice(0,20); save(); updateNotifications();
  if (toast) showToast(`${title} · ${body}`, page);
}
function updateNotifications() {
  const count = state.notifications.filter(n => !n.read).length;
  $('#notificationCount').textContent = count; $('#notificationCount').hidden = count === 0;
  $('#notificationButton').disabled = !state.unlocked;
  $('#notificationPanel').innerHTML = `<div class="row"><h3>Notificações</h3><button id="closeNotifications" class="icon-button" aria-label="Fechar notificações">×</button></div>${state.notifications.length ? state.notifications.map(n => `<button class="notification-item ${n.read ? '' : 'unread'}" data-notification-page="${n.page}"><strong>${escapeHtml(n.title)}</strong><span>${escapeHtml(n.body)}</span></button>`).join('') : '<p class="muted">Tudo tranquilo por aqui.</p>'}`;
}
$('#notificationButton').addEventListener('click', () => {
  const panel = $('#notificationPanel'); panel.classList.toggle('hidden');
  $('#notificationButton').setAttribute('aria-expanded', String(!panel.classList.contains('hidden')));
  if (!panel.classList.contains('hidden')) { state.notifications.forEach(n => n.read = true); save(); updateNotifications(); }
});
document.addEventListener('click', e => {
  if (e.target.closest('#closeNotifications')) { $('#notificationPanel').classList.add('hidden'); $('#notificationButton').setAttribute('aria-expanded','false'); }
  const notice = e.target.closest('[data-notification-page]');
  if (notice && state.unlocked) { state.page = notice.dataset.notificationPage; state.openChat = null; $('#notificationPanel').classList.add('hidden'); $('#notificationButton').setAttribute('aria-expanded','false'); $('#toastRegion').innerHTML = ''; save(); render(); }
  const wallpaper = e.target.closest('[data-wallpaper]');
  if (wallpaper) { state.wallpaper = wallpaper.dataset.wallpaper; save(); render(); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') { $('#notificationPanel').classList.add('hidden'); $('#notificationButton').setAttribute('aria-expanded','false'); if (state.unlocked) goHome(); } });
document.querySelector('.device').dataset.wallpaper = state.wallpaper;
updateNotifications();
