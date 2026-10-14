// Fictional telemetry only. No firing controls or weapon simulation.
const TECH_INITIAL = Object.freeze({pairing:'conectado',battery:85,charge:'disponível',shots:12,integrity:100,condition:'operacional'});
function initializeEquipmentStory(){
 state.techBang ??= {...TECH_INITIAL,history:[{at:Date.UTC(2091,2,31,23),title:'Equipamento operacional.',detail:'Pareamento conectado. Bateria: 85%. Carga disponível. Disparos estimados: 12. Integridade: 100%.'}]};
 state.motherMessages ??= [];
 state.amelieStory ??= {messages:[],stage:0,nextAt:0,revealed:false};
 syncPersonalChats();
}
function syncPersonalChats(){
 chats.mae.messages=state.motherMessages || [];
 const story=state.amelieStory;
 if(story?.messages.length)chats.amelie={name:story.revealed?'Amélie':'Número desconhecido',status:'Canal privado',messages:story.messages,answers:[]};
 else delete chats.amelie;
}
function appendPersonalMessage(id,text,at,mine=false){
 const messages=id==='mae'?state.motherMessages:state.amelieStory.messages;
 messages.push({from:mine?'mine':'other',text,...stampAt(at),receivedAt:at});
 if(!mine){recordNarrativeMessage(id+':'+messages.length,at);if(!(state.unlocked&&state.page==='mensagens'&&state.openChat===id))state.read=state.read.filter(item=>item!==id);}
 syncPersonalChats();
}
function applyEquipmentStoryEvent(event){
 if(event.id==='mother-reminder')appendPersonalMessage('mae','Desliga as luzes antes de deitar, você tem mania de deixar tudo ligado.',event.at);
 if(event.id==='amelie-birthday')appendPersonalMessage('amelie','Feliz aniversário. Apesar de tudo.',event.at);
 if(event.id==='tech-damaged'){
  Object.assign(state.techBang,{integrity:0,condition:'danificada',pairing:'sinal perdido',shots:null,charge:'indisponível'});
  state.techBang.history.push({at:event.at,title:'Falha crítica detectada.',detail:'Integridade do equipamento comprometida. Comunicação com o equipamento interrompida. Causa não identificada.'});
 }
}
function renderTechBang(){
 const t=state.techBang;
 return head('TECH BANG','EQUIPAMENTO PAREADO')+`<section class="panel tech-status ${t.integrity===0?'damaged':''}"><span class="widget-icon">${icon('techbang')}</span><h3>TECH BANG</h3><p>${escapeHtml(t.condition.toUpperCase())}</p><div class="telemetry-grid">${[['Pareamento',t.pairing],['Bateria',t.battery+'%'],['Carga',t.charge],['Disparos estimados',t.shots===null?'indisponível':t.shots],['Integridade',t.integrity+'%'],['Condição operacional',t.condition]].map(([label,value])=>`<div><small>${label}</small><strong>${escapeHtml(value)}</strong></div>`).join('')}</div>${t.integrity===0?'<p class="muted">Comunicação interrompida. Bateria: última leitura recebida.</p>':''}</section><section class="timeline-history"><h3>Histórico do equipamento</h3>${t.history.map(record=>`<details class="panel"><summary>${stampAt(record.at).date} · ${stampAt(record.at).time} — ${escapeHtml(record.title)}</summary><p>${escapeHtml(record.detail)}</p></details>`).join('')}</section>`;
}
const AMELIE_REPLIES=['Quem é?','Quem está falando?'];
const AMELIE_MESSAGES=['Você realmente não reconhece meu número?','Sou eu, Amélie.','Eu sei que a gente não se fala direito, mas não ia deixar seu aniversário passar em branco.'];
function amelieControls(){
 const s=state.amelieStory;
 if(s.nextAt)return typingIndicator(s.revealed?'Amélie':'Número desconhecido');
 if(s.stage>1)return '';
 return `<div class="responses"><button class="secondary" data-amelie-reply="${s.stage}">${AMELIE_REPLIES[s.stage]}</button></div>`;
}
content.addEventListener('click',e=>{
 const button=e.target.closest('[data-amelie-reply]');if(!button)return;
 const s=state.amelieStory;
 if(!state.unlocked||state.openChat!=='amelie'||!s.messages.length||s.nextAt||s.stage>1||Number(button.dataset.amelieReply)!==s.stage)return;
 appendPersonalMessage('amelie',AMELIE_REPLIES[s.stage],getGameDate().getTime(),true);
 s.nextAt=getGameDate().getTime()+typingDelay(AMELIE_MESSAGES[s.stage]);save();render();
});
document.addEventListener('pirate40:chat-tick',()=>{
 const s=state.amelieStory;if(!s?.nextAt||getGameDate().getTime()<s.nextAt)return;
 appendPersonalMessage('amelie',AMELIE_MESSAGES[s.stage],s.nextAt);
 if(s.stage===1)s.revealed=true;
 s.stage++;s.nextAt=s.stage===2?s.nextAt+typingDelay(AMELIE_MESSAGES[2]):0;
 syncPersonalChats();save();updateMessageBadges();
 if(state.unlocked&&state.page==='mensagens'&&(state.openChat==='amelie'||!state.openChat)){render();}
});
