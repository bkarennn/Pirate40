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
  locator: true
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
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function escapeHtml(str) { return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function head(title, extra = '') { return `<div class="page-heading"><h2>${title}</h2><span class="meta">${extra}</span></div>`; }
function activate() {
  scanScreen.classList.add('hidden'); systemScreen.classList.remove('hidden');
  state.unlocked = true; save(); render();
}
$('#scanButton').addEventListener('click', () => {
  const btn = $('#scanButton'); btn.disabled = true; btn.textContent = 'ANALISANDO PADRÃO BIOMÉTRICO...';
  $('#scanDescription').textContent = 'Comparando assinatura temporal com perfil PIRATE 40...';
  setTimeout(() => { btn.textContent = 'ACESSO AUTORIZADO'; $('#scanDescription').textContent = 'IDENTIDADE RECONHECIDA • PIRATE 40'; setTimeout(activate, 750); }, 1500);
});
$('#lockButton').addEventListener('click', () => {
  state.unlocked = false; save(); systemScreen.classList.add('hidden'); scanScreen.classList.remove('hidden');
  $('#scanButton').disabled = false; $('#scanButton').textContent = 'INICIAR RECONHECIMENTO FACIAL';
  $('#scanDescription').textContent = 'Posicione-se diante do sensor para autenticar o acesso à unidade.';
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
    state.notes.unshift({id: Date.now(), title, body, date: 'CRIADO PELO RECEPTOR'}); save(); render();
  }
  if (e.target.closest('[data-delete-note]')) {
    state.notes = state.notes.filter(n => n.id !== Number(e.target.closest('[data-delete-note]').dataset.deleteNote)); save(); render();
  }
  if (e.target.id === 'resetSave' && confirm('Apagar o progresso local e reiniciar o terminal?')) {
    localStorage.removeItem(STORAGE_KEY); location.reload();
  }
});
content.addEventListener('change', e => { if (e.target.id === 'locatorToggle') { state.locator = e.target.checked; save(); render(); }});
function render() {
  nav.querySelectorAll('[data-page]').forEach(b => b.classList.toggle('active', b.dataset.page === state.page));
  const unread = Object.keys(chats).filter(id => !state.read.includes(id)).length;
  $('#unreadPill').textContent = unread; $('#unreadPill').hidden = unread === 0;
  $('#bottomLocation').textContent = state.locator ? 'LOCALIZADOR: EMISSÃO ATIVA' : 'LOCALIZADOR: DESLIGADO';
  const pages = { inicio: renderInicio, ia: (typeof renderIA === 'function' ? renderIA : renderInicio), mensagens: renderMensagens, mapa: renderMapa, galeria: renderGaleria, notas: renderNotas, arquivos: renderArquivos, sistema: renderSistema };
  content.innerHTML = pages[state.page]?.() || renderInicio();
}
function renderInicio() {
  return `${head('PAINEL PESSOAL', '09.04.2091 // 03:41')}
  <div class="alert">⚠ ${state.locator ? 'Localizador transmitindo sua posição. Canal de rastreio exposto.' : 'Localizador desligado. Emissão de posição suspensa.'}</div>
  <div class="panel"><p class="eyebrow">BOAS-VINDAS, PIRATE 40</p><h2 style="margin:8px 0">Sua unidade foi sincronizada.</h2><p class="muted">3 canais de comunicação encontrados. Último acesso registrado: desconhecido.</p></div>
  <div class="tiles">
    <button class="tile" data-go="ia"><strong>✧ IA DE SOBREVIVÊNCIA</strong><span>Consulte o guia de contingência</span></button>
    <button class="tile" data-go="mensagens"><strong>▤ MENSAGENS</strong><span>${Object.keys(chats).length} conversas recuperadas</span></button>
    <button class="tile" data-go="mapa"><strong>⌖ MAPA</strong><span>Coordenadas em oceano aberto</span></button>
    <button class="tile" data-go="galeria"><strong>▧ GALERIA</strong><span>Aguardando imagens</span></button>
    <button class="tile" data-go="notas"><strong>✎ NOTAS</strong><span>${state.notes.length} registros disponíveis</span></button>
    <button class="tile" data-go="arquivos"><strong>▣ ARQUIVOS</strong><span>Documentos fragmentados</span></button>
    <button class="tile" data-go="sistema"><strong>⚙ SISTEMA</strong><span>Configurações de rastreio</span></button>
  </div>`;
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
  return `${head('GALERIA','ARMAZENAMENTO VISUAL')}<div class="empty"><strong>▧ SEM IMAGENS IMPORTADAS</strong><p>Pastas reservadas: BASE • EQUIPE • DISPOSITIVOS • EXTERIOR • RECUPERADOS</p><p class="small">As fotografias serão adicionadas em uma próxima atualização.</p></div>`;
}
function renderNotas() {
  return `${head('ANOTAÇÕES','ARQUIVO LOCAL')}<div class="panel"><p class="eyebrow">NOVA ANOTAÇÃO</p><input id="noteTitle" class="input" placeholder="Título da nota" maxlength="70"/><textarea id="noteBody" placeholder="Escreva aqui..."></textarea><div class="row"><span id="noteFeedback" class="meta">Salvo neste navegador</span><button class="primary" id="saveNote">SALVAR NOTA</button></div></div>
  <div class="list">${state.notes.map(n=>`<article class="note-item"><div class="row"><strong>${escapeHtml(n.title)}</strong><button class="icon-button" data-delete-note="${n.id}" title="Excluir nota" aria-label="Excluir ${escapeHtml(n.title)}">×</button></div><span class="meta">${escapeHtml(n.date)}</span><p>${escapeHtml(n.body)}</p></article>`).join('')}</div>`;
}
function renderArquivos() {
  return `${head('ARQUIVOS','RECUPERAÇÃO PARCIAL')}
  <div class="file-item"><strong>PROTOCOLO_001.txt</strong><p>Indivíduos sem identificação neural não devem se aproximar das zonas monitoradas.<br>Status: circulação restrita.</p><span class="meta">TEXTO RECUPERADO • DATA DESCONHECIDA</span></div>
  <div class="file-item"><strong>PROTOTIPO_40.dat</strong><p>Arquivo encriptado. O dispositivo original é necessário para leitura.</p><span class="meta">ACESSO INDISPONÍVEL</span></div>
  <div class="file-item"><strong>BASE_INTERNA.map</strong><p>Fragmento de planta cartográfica indisponível.</p><span class="meta">ARQUIVO CORROMPIDO</span></div>`;
}
function renderSistema() {
  return `${head('SISTEMA','UNIDADE NEXUS / P40')}
  <div class="panel"><p class="eyebrow">CONFIGURAÇÃO DE RASTREIO</p><div class="row" style="margin-top:12px"><div><strong>Localizador</strong><p class="muted">Transmitir posição pela rede</p></div><label class="switch"><input id="locatorToggle" type="checkbox" ${state.locator?'checked':''}/> <span>${state.locator?'ATIVO':'INATIVO'}</span></label></div></div>
  <div class="panel"><p class="line">PROPRIETÁRIO: <strong>PIRATE 40</strong></p><p class="line">ANO: <strong>2091</strong></p><p class="line">BIOMETRIA: <strong>VERIFICADA (SIMULAÇÃO)</strong></p><p class="line">REDE: <strong>MODO LOCAL</strong></p><p class="muted" style="margin-top:12px">As decisões e notas ficam salvas apenas neste navegador por localStorage.</p></div>
  <button id="resetSave" class="danger">APAGAR PROGRESSO E REINICIAR</button>`;
}
if (state.unlocked) activate();
