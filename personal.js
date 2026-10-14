// Personal network metadata. Portrait paths can replace the initial avatars later.
const CONTACTS = {
 esther:{name:'Esther',initials:'ES',color:'#568d82',portrait:null,info:'Integrante dos Piratas. Cuidadosa e prática. Namorada de Kevin.',mission:'Equipe A · Em missão com Gustavo: alimentos e suprimentos.'},
 kevin:{name:'Kevin',initials:'KE',color:'#ba8144',portrait:null,info:'Integrante dos Piratas. Brincalhão e espontâneo. Namorado de Esther.',mission:'Equipe B · Em missão com Mãe: alimentos e suprimentos.'},
 gustavo:{name:'Gustavo',initials:'GU',color:'#727aba',portrait:null,info:'Adolescente de 15 anos. Integrante dos Piratas. Irônico, inteligente e ocasionalmente atrapalhado. Mais reservado com Pirate 40, embora se preocupe.',mission:'Equipe A · Em missão com Esther: alimentos e suprimentos.'},
 mae:{name:'Mãe',initials:'MÃ',color:'#ac7193',portrait:null,info:'Mulher adulta, com mais de 40 anos. Responsável pela base oceânica e uma das lideranças da comunidade. Acolhedora, protetora e firme. Todos a chamam de Mãe por carinho, sem parentesco biológico.',mission:'Equipe B · Em missão com Kevin: alimentos e suprimentos.'}
};
// Future narrative reveal only: the supply teams are also preparing a birthday surprise.
// Do not expose that intention in profiles, summaries, messages or diary entries yet.
const BASE_GROUP = Object.freeze({created:'15 de janeiro de 2090',description:'Canal de comunicação da base. Assuntos importantes, avisos e conversas que definitivamente poderiam ser resolvidas pessoalmente.',members:['player','esther','kevin','gustavo','mae']});
const BASE_HISTORY = [
 ['Gustavo','Gente'],['Gustavo','KKKKKKKKKKKKKK'],['Gustavo','Tô preso no banheiro'],['Kevin','KKKKKKKKKK COMO ASSIM'],['Gustavo','A maçaneta saiu na minha mão 😭'],['Esther','Meu Deus, Gustavo, já tô indo aí'],['Kevin','ESTHER TIRA FOTO KKKKKKK'],['Mãe','Kevin, deixa o menino em paz.'],['Kevin','Desculpa mãe 😔'],['Mãe','Gustavo, você se machucou?'],['Gustavo','Não mãe, só minha dignidade']
].map(([sender,text],i)=>({from:'other',sender,text,date:'31/03/2091',time:'21:'+String(10+i).padStart(2,'0')}));
for(const [id,contact] of Object.entries(CONTACTS)) {
 if(!chats[id])chats[id]={name:contact.name,status:contact.mission,messages:[],answers:[]};
 chats[id].status=contact.mission;
}
for(const chat of Object.values(chats))for(const message of chat.messages)message.date ??= '31/03/2091';
let messengerProfile=null, profileTrail=[];
function contactData(id){if(['esther','gustavo'].includes(id)&&state.timeline?.events?.['group-missing'])return {...CONTACTS[id],mission:'Equipe A · Retornou à base oceânica.'};return id==='player'?{name:playerName()+' · Pirate 40',initials:'40',color:'#487e9f',info:'Responsável pela segurança da base oceânica.',mission:'Base oceânica · Em serviço.'}:CONTACTS[id];}
function contactAvatar(id){const c=contactData(id);return `<span class="contact-avatar" style="--avatar-color:${c?.color || '#557d94'}">${c?.portrait ? `<img src="${escapeHtml(c.portrait)}" alt=""/>` : escapeHtml(c?.initials || (id==='group'?'BG':'◈'))}</span>`;}
function messengerHeader(id,chat){return `<button class="messenger-header" ${id==='group'||CONTACTS[id]?'data-profile="'+id+'"':''}>${contactAvatar(id)}<span><strong>${escapeHtml(chat.name)}</strong><small>${escapeHtml(CONTACTS[id]?contactData(id).mission:chat.status)}</small></span><span>ⓘ</span></button>`;}

function messageTimestamp(message){
 if(Number.isFinite(message?.receivedAt))return message.receivedAt;
 if(!message?.date)return 0;
 const [day,month,year]=message.date.split('/').map(Number),[hour=0,minute=0,second=0]=(message.time||'').split(':').map(Number);
 return Date.UTC(year,month-1,day,hour,minute,second)||0;
}
function latestChatMessage(id,chat){
 const messages=id==='group'?allBaseMessages():[...chat.messages];
 const answer=chat.answers[state.sent[id]],times=state.sentTimes[id];
 if(answer){messages.push({text:answer.text,...times?.mine});if(!state.replyDue[id])messages.push({text:answer.response,...times?.other});}
 return messages.reduce((latest,message)=>!latest||messageTimestamp(message)>=messageTimestamp(latest)?message:latest,null);
}
function sortedConversations(){return Object.entries(chats).map(([id,chat])=>({id,chat,last:latestChatMessage(id,chat)})).sort((a,b)=>messageTimestamp(b.last)-messageTimestamp(a.last));}

function renderMessengerList(){
 return head('Mensagens','NEXUS · REDE DOS PIRATAS')+'<p class="muted">Seus canais, suas pessoas.</p><div class="list messenger-list">'+sortedConversations().map(({id,chat,last})=>{
 const unread=id==='emergency'?Math.max(0,state.security.messages.length-state.security.readCount):!!last&&!state.read.includes(id);
 return `<article class="contact-row"><button class="avatar-button" ${CONTACTS[id]||id==='group'?'data-profile="'+id+'"':'data-chat="'+id+'"'} aria-label="Informações de ${escapeHtml(chat.name)}">${contactAvatar(id)}</button><button class="chat-item" data-chat="${id}"><span><strong>${escapeHtml(chat.name)} ${unread?'<b class="unread-dot" aria-label="Não lida">●</b>':''}</strong><small>${escapeHtml(dialogueText(last?.text || 'Nenhuma mensagem disponível neste histórico.'))}</small></span><span class="meta">${last?.time || ''} →</span></button></article>`;
 }).join('')+'</div>';
}
function sharedDogPhotos(){return state.dogStory.messages.some(m=>m.photoId==='dog')?photoThumbnail('dog',true):'<p class="muted">Nenhuma fotografia compartilhada neste histórico.</p>';}
function renderMessengerProfile(id){
 const back='<button class="back" data-close-profile>← VOLTAR ÀS MENSAGENS</button>';
 if(id==='group')return back+head('Informações do grupo')+`<section class="panel profile-card">${contactAvatar(id)}<h3>BASE — GRUPO GERAL</h3><p>5 participantes · Criado em ${BASE_GROUP.created}</p><p>${BASE_GROUP.description}</p></section><h3>Integrantes</h3><div class="member-list">${BASE_GROUP.members.map(member=>`<button data-profile="${member}">${contactAvatar(member)}<span>${escapeHtml(contactData(member).name)}</span><span>→</span></button>`).join('')}</div><section class="panel"><h3>Fotografias enviadas</h3>${sharedDogPhotos()}<h3>Arquivos compartilhados</h3><p class="muted">Nenhum arquivo recuperável neste histórico.</p></section>`;
 const c=contactData(id);if(!c)return back;
 return back+head('Perfil na rede')+`<section class="panel profile-card">${contactAvatar(id)}<h3>${escapeHtml(c.name)}</h3><p class="meta">REDE PIRATAS · ${id==='player'?'PIRATE 40':escapeHtml(id.toUpperCase())}</p><p>${id==='player'?'Dispositivo conectado localmente':'Conexão remota · status não confirmado'}</p><p>${escapeHtml(c.info)}</p><p>${escapeHtml(c.mission)}</p></section><section class="panel"><h3>Grupos em comum</h3><button class="secondary" data-profile="group">BASE — GRUPO GERAL · 5 participantes</button></section><section class="panel"><h3>Arquivos compartilhados</h3>${id==='kevin'?sharedDogPhotos():'<p class="muted">Nenhum arquivo disponível neste histórico.</p>'}</section>`;
}
// Authored 2091 records are immutable; player notes live exclusively in state.diary.
const ORIGINAL_DIARY = Object.freeze({"id":"base-2091","title":"Mais um dia na base","at":3826220400000,"body":"Hoje o pessoal saiu para procurar alimentos e alguns suprimentos.\n\nEsther foi com Gustavo, enquanto Kevin acompanhou a Mãe.\n\nFiquei responsável pela segurança da base até eles voltarem.\n\nGustavo insistiu tanto para acompanhar Esther que a Mãe acabou deixando.\n\nDisseram que não vão demorar muito.\n\nPor enquanto está tudo tranquilo.\n\nEspero que encontrem alguma coisa boa para comer. Kevin reclamou da última refeição por três dias seguidos."});
const CONTROL_DIARY = Object.freeze({id:'world-control',title:'O dia em que tudo mudou',at:null,body:"Eu ainda lembro de quando tudo aconteceu.\n\nNo começo, ninguém entendeu direito.\n\nAs pessoas simplesmente começaram a agir de maneira estranha. Algumas pararam de responder, outras continuaram andando como se nada estivesse acontecendo.\n\nDepois vieram as ordens.\n\nFoi quando percebemos que os chips nunca foram apenas aquilo que nos prometeram.\n\nNão sei se algum dia o mundo vai voltar ao normal."});
let diaryEditing=null, diaryQuery='', diaryPasswordDraft='';

function normalizePersonalDiary(){
 if(Array.isArray(state.diary)&&state.diary.every(note=>note&&typeof note==='object'&&typeof note.title==='string'&&typeof note.body==='string'))return;
 const legacy=state.diary;
 if(!Object.prototype.hasOwnProperty.call(state,'diaryLegacyData'))state.diaryLegacyData=structuredClone(legacy ?? null);
 const candidates=Array.isArray(legacy)?legacy:Array.isArray(legacy?.entries)?legacy.entries:Array.isArray(legacy?.notes)?legacy.notes:legacy&&typeof legacy==='object'?(('title' in legacy||'body' in legacy)?[legacy]:Object.values(legacy)):[];
 state.diary=candidates.filter(note=>note&&typeof note==='object'&&!Array.isArray(note)).map((note,index)=>({...note,id:note.id??'legacy-note-'+index,title:String(note.title??'Sem título'),body:String(note.body??note.text??''),at:Number.isFinite(note.at)?note.at:state.gameTime}));
 save();
}
function normalizeDiaryPassword(value){return String(value??'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
function unlockPersonalDiary(form){
 const input=form?.querySelector?.('#diaryPassword') || $('#diaryPassword');
 if(!input)return;
 const value=normalizeDiaryPassword(input.value);
 if(!value){$('#diaryLockFeedback').textContent='Digite uma senha para continuar.';input.setAttribute('aria-invalid','true');return;}
 if(value!=='amelie'){$('#diaryLockFeedback').textContent='Senha incorreta. Tente novamente.';input.setAttribute('aria-invalid','true');return;}
 normalizePersonalDiary();
 state.diaryUnlocked=true;diaryPasswordDraft='';diaryQuery='';
 save();render();
 $('#personalDiaryTitle')?.focus();
}

function diaryEntriesMarkup(){
 if(!state.diaryUnlocked)return '';
 const match=n=>(n.title+' '+n.body).toLocaleLowerCase('pt-BR').includes(diaryQuery.toLocaleLowerCase('pt-BR'));
 const card=(n,original)=>`<article class="note-item diary-entry ${original?'original-entry':''}"><span class="eyebrow">${original?'PIRATE 40 · REGISTRO ORIGINAL DE 2091 · SOMENTE LEITURA':'JOGADOR CONECTADO · 2026'}</span><h3>${escapeHtml(n.title)}</h3><small>${n.at===null?'DATA DO REGISTRO NÃO DEFINIDA':escapeHtml(stampAt(n.at).date)+' · '+escapeHtml(stampAt(n.at).time)}${original?'':' · referência narrativa'}</small><p>${escapeHtml(n.body)}</p>${original?'':`<div class="responses"><button class="secondary" data-edit-diary="${escapeHtml(n.id)}">Editar</button><button class="secondary" data-delete-diary="${escapeHtml(n.id)}">Excluir</button></div>`}</article>`;
 const notes=[...state.diary].sort((a,b)=>b.at-a.at).filter(match);
 return '<h3>Arquivo pessoal · registros históricos</h3>'+(archiveCards([ORIGINAL_DIARY,CONTROL_DIARY,...PIRATE_ARCHIVE].filter(match))||'<p class="muted">Nenhum registro encontrado.</p>')+'<h3>Minhas descobertas · conexão de 2026</h3>'+ (notes.map(n=>card(n,false)).join('')||'<p class="muted">Nenhuma anotação pessoal encontrada.</p>');
}
function renderDiary(){
 try{return renderPersonalDiaryContent();}
 catch(error){
  console.error("[PIRATE 40] Falha ao renderizar o diário pessoal.",error);
  return head("DIÁRIO PESSOAL — PIRATE 40")+'<section class="panel" role="alert"><h3>Não foi possível carregar os registros.</h3><p>Seu estado de desbloqueio foi mantido. Tente abrir o diário novamente.</p></section>';
 }
}
function renderPersonalDiaryContent(){
 normalizePersonalDiary();

 if(!state.diaryUnlocked)return head('DIÁRIO PESSOAL',escapeHtml(playerName())+' · Pirate 40')+'<form id="diaryUnlockForm" novalidate class="panel diary-lock"><span class="widget-icon">'+icon('lock')+'</span><p>Este arquivo está protegido.</p><label for="diaryPassword">Senha</label><input id="diaryPassword" name="diaryPassword" class="input" type="password" placeholder="Digite a senha" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="100" aria-describedby="diaryLockFeedback" required/><button type="button" class="secondary" id="showDiaryPassword" aria-pressed="false">Mostrar senha</button><p id="diaryLockFeedback" role="status"></p><button class="primary" type="submit">Desbloquear</button></form>';
 const edit=state.diary.find(n=>n.id===diaryEditing);
 return '<h2 id="personalDiaryTitle" tabindex="-1">DIÁRIO PESSOAL — PIRATE 40</h2><p class="meta">'+escapeHtml(playerName())+'</p>'+`<p class="muted">Memórias de Pirate 40 e descobertas de quem está conectado em 2026.</p><label class="diary-search">Pesquisar registros<input class="input" id="diarySearch" type="search" value="${escapeHtml(diaryQuery)}" placeholder="Título ou texto"/></label><div id="diaryEntries">${diaryEntriesMarkup()}</div><section class="panel"><h3>${edit?'Editar descoberta':'Nova anotação pessoal · 2026'}</h3><label>Título<input class="input" id="diaryTitle" maxlength="100" value="${escapeHtml(edit?.title || '')}"/></label><label>Texto<textarea id="diaryBody" maxlength="20000">${escapeHtml(edit?.body || '')}</textarea></label><p class="muted" id="diaryFeedback" role="status">Só você escreve suas descobertas. A data usa o relógio de 2091.</p><div class="responses"><button class="primary" id="saveDiary">Salvar</button>${edit?'<button class="secondary" id="cancelDiary">Cancelar edição</button>':''}</div></section>`;
}
content.addEventListener('input',e=>{if(e.target.id==='diaryPassword')diaryPasswordDraft=e.target.value;if(e.target.id==='diarySearch'){diaryQuery=e.target.value;$('#diaryEntries').innerHTML=diaryEntriesMarkup();}});
content.addEventListener('click',e=>{
 if(e.target.id==='showDiaryPassword'){const field=$('#diaryPassword');const show=field.type==='password';field.type=show?'text':'password';e.target.textContent=show?'Ocultar senha':'Mostrar senha';e.target.setAttribute('aria-pressed',String(show));field.focus();return;}
 const profile=e.target.closest('[data-profile]');if(profile){if(messengerProfile)profileTrail.push(messengerProfile);messengerProfile=profile.dataset.profile;render();return;}
 if(e.target.closest('[data-close-profile]')){navigateBack();return;}
 if(!state.diaryUnlocked)return;
 const edit=e.target.closest('[data-edit-diary]');if(edit){diaryEditing=edit.dataset.editDiary;render();return;}
 const del=e.target.closest('[data-delete-diary]');if(del){state.diary=state.diary.filter(n=>n.id!==del.dataset.deleteDiary);if(diaryEditing===del.dataset.deleteDiary)diaryEditing=null;save();render();return;}
 if(e.target.id==='cancelDiary'){diaryEditing=null;render();}
 if(e.target.id==='saveDiary'){
  const title=$('#diaryTitle').value.trim(),body=$('#diaryBody').value.trim();if(!title||!body){$('#diaryFeedback').textContent='Preencha o título e o texto.';return;}
  const existing=state.diary.find(n=>n.id===diaryEditing);
  if(existing){existing.title=title;existing.body=body;}else state.diary.push({id:'personal-'+Date.now()+'-'+Math.random().toString(36).slice(2),title,body,at:getGameDate().getTime()});
  diaryEditing=null;save();render();
 }
});
// Leaving the messenger dismisses its transient profile view without changing history.


content.addEventListener('submit',e=>{
 if(e.target.id!=='diaryUnlockForm')return;e.preventDefault();
 unlockPersonalDiary(e.target);
});
