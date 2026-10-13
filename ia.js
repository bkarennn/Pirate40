// PIRATE 40 — IA DE SOBREVIVÊNCIA
// Assistente FICTÍCIO com respostas prontas. Não usa serviços externos.
(() => {
  const KEY = 'pirate40-ia-v1';
  const GREETING = 'Bem-vindo ou bem-vinda ao apocalipse. Precisa de assistência?';
  const options = [
    { id: 'apocalipse', label: 'Como assim apocalipse?' },
    { id: 'algas', label: 'Algas comestíveis' },
    { id: 'defesa', label: 'Armas e ferramentas de sobrevivência' },
    { id: 'socorros', label: 'Primeiros socorros' },
    { id: 'agua', label: 'Como conseguir água potável?' },
    { id: 'sinal', label: 'Meu localizador está ligado?' },
    { id: 'piratas', label: 'Quem são os Piratas?' },
    { id: 'base', label: 'Onde eu estou?' },
  ];
  const answers = {
    apocalipse: `RESUMO DE CONTINGÊNCIA // 2091
A rede de implantes neurais tornou-se o principal sistema de identificação e assistência da população. Após a ativação dos Protocolos de Unificação, milhões de usuários perderam autonomia sobre suas ações.
Indivíduos sem implante passaram a ser classificados como PIRATAS e estão sujeitos à captura.
A origem do protocolo permanece sob sigilo. Recomenda-se evitar canais governamentais.
[REGISTRO HISTÓRICO INCOMPLETO]`,
    algas: `GUIA COSTEIRO // ALIMENTAÇÃO
Algumas algas marinhas são consumidas como alimento, como nori, wakame e kombu, quando obtidas de fontes confiáveis e preparadas corretamente.
NÃO consuma algas desconhecidas, retiradas de águas contaminadas ou encontradas à deriva. Podem conter toxinas, excesso de iodo ou outros contaminantes.
Inventário alimentar da base: NÃO DISPONÍVEL.`,
    defesa: `PROTOCOLO DE AUTOPROTEÇÃO
Prioridade: evitar contato, procurar abrigo, preservar comunicação e preparar uma rota de saída.
Equipamentos recomendados para emergências: lanterna, apito de sinalização, rádio, kit de primeiros socorros e ferramenta de corte de uso geral para tarefas de resgate.
O sistema não possui autorização para fornecer instruções de confronto.
[ALERTA: MOVIMENTAÇÃO NÃO IDENTIFICADA]`,
    socorros: `PROTOCOLO MÉDICO BÁSICO
• Sangramento: pressione o ferimento com pano limpo ou gaze e procure socorro urgente em caso de sangramento intenso.
• Queimadura térmica: resfrie com água corrente fresca por 20 minutos; não use gelo nem pomadas improvisadas.
• Pessoa inconsciente: verifique a respiração e solicite ajuda de emergência. Se não respirar normalmente, inicie RCP conforme seu treinamento ou instruções de emergência.
Em risco imediato, procure assistência médica. Qual é a situação?`,
    agua: `ABASTECIMENTO // BASE MARÍTIMA
A água do mar NÃO é potável. Ferver água salgada não remove o sal.
Procure água armazenada e lacrada ou um dessalinizador funcional. Água coletada de fontes duvidosas precisa ser tratada conforme o tipo de contaminação.
SISTEMA DE DESSALINIZAÇÃO DA BASE: STATUS DESCONHECIDO.`,
    sinal: `DIAGNÓSTICO DE EMISSÃO
Status atual do localizador: {locator}.
A emissão de posição pode permitir rastreamento por terceiros.
Controle disponível em Configurações > Localizador.`,
    piratas: `CLASSIFICAÇÃO // INDIVÍDUOS NÃO REGISTRADOS
“Pirata” é a designação atribuída a pessoas sem implante neural ativo.
O acesso a serviços oficiais pode ser recusado. Os canais de comunicação utilizados por esses indivíduos são descentralizados.
Seu identificador nesta unidade é: PIRATE 40.
[OUTROS DADOS NÃO DISPONÍVEIS]`,
    base: `POSICIONAMENTO // SEM CARTOGRAFIA COMPLETA
Sinal associado a uma estrutura não catalogada em área oceânica.
A planta interna da instalação não está disponível nesta unidade.
Acesse MAPA para visualizar o último ponto registrado.
[AVISO: NÃO É POSSÍVEL CONFIRMAR A PROFUNDIDADE]`,
    medSangue: `HEMORRAGIA // RESPOSTA IMEDIATA
Aplique pressão firme e contínua diretamente sobre o ferimento com gaze ou tecido limpo. Chame ajuda de emergência para sangramento intenso. Não remova objetos encravados; faça pressão ao redor.`,
    medQueimadura: `QUEIMADURA // RESPOSTA IMEDIATA
Resfrie a área em água corrente fresca por 20 minutos. Remova acessórios próximos que não estejam grudados na pele. Cubra com curativo limpo não aderente. Procure assistência urgente se for extensa, profunda ou em região sensível.`,
    medDesmaio: `INCONSCIÊNCIA // RESPOSTA IMEDIATA
Verifique se o local é seguro, tente obter resposta e observe a respiração. Acione imediatamente o serviço de emergência. Se não respirar normalmente, faça RCP com orientação de um atendente de emergência ou segundo treinamento.`,
  };
  let history;
  try {
    const saved = migrateCharacterData(JSON.parse(localStorage.getItem(KEY)));
    history = Array.isArray(saved) && saved.every(m => m && typeof m.text === 'string' && ['bot', 'user'].includes(m.from)) ? saved : null;
  } catch { history = null; }
  if (!history || !history.length) history = [{ from: 'bot', text: GREETING }];
  persist();
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(history)); } catch {} }
  function safe(text) { return String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function pendingReply() { return history.at(-1)?.pendingReply; }
  function finishPendingReply() {
    const pending=pendingReply();
    if (!pending || Date.now()<pending.due) return;
    delete history.at(-1).pendingReply;
    history.push({from:'bot',text:pending.text});persist();
    if(state.unlocked && state.page==='ia'){render();const log=document.getElementById('iaLog');if(log)log.scrollTop=log.scrollHeight;}
  }
  document.addEventListener('pirate40:chat-tick',finishPendingReply);
  function renderIA() {
    const buttons = [...options];
    if (history.at(-1)?.text.includes('Qual é a situação?')) {
      buttons.unshift(
        { id: 'medSangue', label: 'Sangramento' },
        { id: 'medQueimadura', label: 'Queimadura' },
        { id: 'medDesmaio', label: 'Pessoa inconsciente' }
      );
    }
    return `<div class="page-heading"><h2>IA DE SOBREVIVÊNCIA</h2><span class="meta">ASSISTÊNCIA // 2091</span></div>
      <div class="ia-head"><div class="ia-symbol">${icon('ia')}</div><div><strong>IA DE SOBREVIVÊNCIA</strong><p class="muted">UNIDADE DE CONTINGÊNCIA • RESPOSTAS DISPONÍVEIS</p></div></div>
      <div class="ia-log" id="iaLog" role="log" aria-live="polite">${history.map(m => `<div class="ia-msg ${m.from}"><small>${m.from === 'bot' ? 'IA DE SOBREVIVÊNCIA' : 'PIRATE 40'}</small>${safe(m.text)}</div>`).join('')}${pendingReply() ? typingIndicator('IA de Sobrevivência') : ''}</div>
      <div class="ia-actions"><span class="eyebrow">SELECIONE UMA SOLICITAÇÃO</span><button class="ia-clear" id="iaClear">Reiniciar conversa</button></div>
      <div class="ia-options">${buttons.map(o => `<button class="ia-option" data-ia="${o.id}" ${pendingReply() ? 'disabled' : ''}>${safe(o.label)} ↗</button>`).join('')}</div>
      <p class="ia-footer">Transmissão local simulada • Informações de sobrevivência são orientações gerais; não substituem serviços de emergência.</p>`;
  }
  document.addEventListener('pirate40:reset-session', () => { history = [{from:'bot',text:GREETING}]; persist(); });
  window.renderIA = renderIA;
  if (state.unlocked && state.page === 'ia') render();
  document.getElementById('content').addEventListener('click', event => {
    if (event.target.closest('#iaClear')) {
      history = [{ from: 'bot', text: GREETING }]; persist(); render(); return;
    }
    const button = event.target.closest('[data-ia]');
    if (!button || pendingReply()) return;
    const id = button.dataset.ia;
    const option = [...options, {id:'medSangue',label:'Sangramento'}, {id:'medQueimadura',label:'Queimadura'}, {id:'medDesmaio',label:'Pessoa inconsciente'}].find(o => o.id === id);
    if (!option || !answers[id]) return;
    trackSecurityActivity('ia');
    const reply = answers[id].replace('{locator}', state.locator ? 'ATIVO' : 'DESLIGADO');
    history.push({ from: 'user', text: option.label, pendingReply:{text:reply,due:Date.now()+typingDelay(reply)} });
    persist(); render();
    const log = document.getElementById('iaLog'); if (log) log.scrollTop = log.scrollHeight;
  });
})();
