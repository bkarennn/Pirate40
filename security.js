// Edit this value to change the invasion deadline (seconds).
const SECURITY_ALARM_SECONDS = 90;
const SECURITY_RESTART_MS = 4500;
const SECURITY_SECTORS = [
  {id:'a',name:'Setor A'}, {id:'b',name:'Setor B'}, {id:'c',name:'Setor C'},
  {id:'lab',name:'Laboratório'}, {id:'west',name:'Ala Oeste'}, {id:'dock',name:'Doca / Entrada'}
];
let securityTimer = null;
function freshSecurity() { return {status:'idle',closed:[],deadline:0,restartAt:0,warned:false}; }
if (!state.security || !['idle','active','contained','failed'].includes(state.security.status)) state.security = freshSecurity();
state.security.closed = Array.isArray(state.security.closed) ? state.security.closed.filter(id => SECURITY_SECTORS.some(s => s.id === id)) : [];
function securityRemaining() { return Math.max(0, Math.ceil((state.security.deadline - Date.now()) / 1000)); }
function securityTime() { const seconds = securityRemaining(); return String(Math.floor(seconds / 60)).padStart(2,'0') + ':' + String(seconds % 60).padStart(2,'0'); }
function startSecurityAlarm() {
  if (state.security.status === 'active' || state.security.status === 'failed') return false;
  state.security = {...freshSecurity(),status:'active',deadline:Date.now() + SECURITY_ALARM_SECONDS * 1000};
  save();
  notify('INVASÃO DETECTADA', 'Movimento não autorizado detectado. Fechem as portas dos setores.', 'seguranca');
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
    state.security.status = 'contained';
    clearInterval(securityTimer); securityTimer = null;
    notify('INVASÃO CONTIDA', 'Setores selados. Integridade da base preservada.', 'seguranca');
  }
  save(); render(); updateSecurityUI();
}
function renderSecurity() {
  const alarm = state.security;
  const active = alarm.status === 'active';
  const contained = alarm.status === 'contained';
  return head('Segurança', 'CONTROLE DE SETORES') + '<div class="security-summary ' + (active ? 'emergency' : contained ? 'contained' : '') + '"><span class="security-shield">' + icon('seguranca') + '</span><div><p class="eyebrow">' + (active ? 'INVASÃO DETECTADA' : contained ? 'INVASÃO CONTIDA' : 'MONITORAMENTO LOCAL') + '</p><h3>' + (active ? 'Fechem as portas dos setores.' : contained ? 'Setores selados.' : 'A base está sob observação.') + '</h3><p class="muted">' + (active ? 'Feche manualmente os seis setores antes do fim do prazo.' : 'Portas e setores da instalação não registrada.') + '</p></div><strong class="security-countdown" data-security-time>' + (active ? securityTime() : '—') + '</strong></div>' +
    '<div class="security-progress"><span>' + alarm.closed.length + ' de 6 setores selados</span><span>Fechamento manual obrigatório</span></div><div class="sector-grid">' + SECURITY_SECTORS.map(s => { const closed = alarm.closed.includes(s.id); return '<article class="sector-card ' + (closed ? 'sealed' : '') + '"><span class="sector-door" aria-hidden="true">' + icon('lock') + '</span><div><h3>' + s.name + '</h3><p>' + (closed ? 'Fechado' : 'Aberto') + '</p></div><button class="' + (closed ? 'secondary' : 'primary') + '" data-close-sector="' + s.id + '" ' + (!active || closed ? 'disabled' : '') + '>' + (closed ? 'Selado ✓' : 'Fechar porta') + '</button></article>'; }).join('') + '</div><p class="muted">' + (active ? 'O prazo continua correndo em outros aplicativos e com o dispositivo bloqueado.' : 'Os controles de fechamento são liberados durante uma invasão.') + '</p><details class="security-test"><summary>Diagnóstico do dispositivo</summary><p class="muted">Iniciar um evento real de jogo. Se o prazo terminar, o sistema reiniciará.</p><button class="danger" data-start-security ' + (active ? 'disabled' : '') + '>Iniciar evento de invasão</button></details>';
}
function updateSecurityUI() {
  const active = state.security.status === 'active';
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
  if (state.security.status !== 'active') return;
  if (!Number.isFinite(state.security.deadline) || Date.now() >= state.security.deadline) { failSecurity(); return; }
  if (!state.security.warned && securityRemaining() <= 30) {
    state.security.warned = true;
    const open = SECURITY_SECTORS.find(s => !state.security.closed.includes(s.id));
    notify('Integridade da base em risco', (open ? 'Porta: ' + open.name + ' ainda aberta. ' : '') + 'Menos de 30 segundos restantes.', 'seguranca');
    save();
  }
  updateSecurityUI();
}
function failSecurity() {
  state.security.status = 'failed'; state.security.restartAt = Date.now() + SECURITY_RESTART_MS;
  save(); showSecurityFailure();
}
function showSecurityFailure() {
  $('#securityFailure').classList.remove('hidden');
  systemScreen.inert = true; scanScreen.inert = true;
  $('#securityFailure').focus();
  $('#notificationPanel').classList.add('hidden'); $('#toastRegion').innerHTML = '';
  updateSecurityUI();
}
function restartAfterSecurityFailure() {
  clearInterval(securityTimer); securityTimer = null;
  // Preserve player-authored notes and wallpaper; reset narrative session progress.
  const notes = state.notes, wallpaper = state.wallpaper;
  state = {...structuredClone(initialState),notes,wallpaper,security:freshSecurity()};
  document.dispatchEvent(new Event('pirate40:reset-session'));
  save();
  $('#securityFailure').classList.add('hidden');
  systemScreen.inert = false; scanScreen.inert = false;
  $('#lockButton').click();
  updateSecurityUI(); $('#scanButton').focus();
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
window.addEventListener('pageshow', securityTick);
if (state.security.status === 'failed') {
  if (!Number.isFinite(state.security.restartAt)) state.security.restartAt = Date.now();
  showSecurityFailure();
}
if (['active','failed'].includes(state.security.status)) runSecurityClock();
updateSecurityUI();
