// Scheduled additions to the existing base chat. Choices never advance automatically.
const GROUP_SCENES = {
 dvd:{at:Date.UTC(2091,3,1,6),title:'Conversa sobre um DVD antigo',description:'Kevin encontrou um DVD antigo; há novas mensagens no grupo.',lines:[
 ['Kevin','GENTE'],['Kevin','VOCÊS NÃO VÃO ACREDITAR NO QUE EU ACHEI KKKKKKK'],['Gustavo','Kevin são seis da manhã'],['Kevin','UM DVD'],['Esther','Um o quê?'],['Kevin','UM DVD DE VERDADE KKKKKKK'],['Kevin','E O PIOR'],['Kevin','É UM FILME SOBRE O APOCALIPSE KKKKKKKKKKK'],['Gustavo','Meu Deus'],['Gustavo','Queima'],['Esther','KKKKKKKKKKKK'],['Esther','Kevin, onde você encontrou isso?'],['Kevin','Num depósito abandonado'],['Kevin','Imagina sobreviver ao fim do mundo pra assistir um filme sobre o fim do mundo'],['Mãe','Guarda, meu filho. Talvez a gente ainda tenha algum aparelho pra reproduzir.'],['Gustavo','Mãe, não incentiva'],['Kevin','NOITE DO CINEMA QUANDO VOLTARMOS'],['Gustavo','Eu me recuso']]},
 feeding:{at:Date.UTC(2091,3,1,6,15),title:'Cuidados com o cachorro',description:'Esther pediu uma verificação do alimentador remoto do cachorro.',lines:[
 ['Esther','Gente, lembrando que agora temos um cachorro pra cuidar KKKKK'],['Esther','40, você conseguiu deixar comida pra ele?'],['Kevin','EU ESQUECI QUE A GENTE NÃO TEM RAÇÃO 😭'],['Gustavo','Adotaram um cachorro sem ter comida pra cachorro'],['Kevin','EU VOU ARRUMAR'],['Mãe','Calma, meu filho. Vamos organizar isso.'],['Esther','40, verifica se o alimentador improvisado tá funcionando, por favor.']]},
 naming:{at:Date.UTC(2091,3,1,6,20),title:'Um nome para o cachorro',description:'O grupo pediu que você escolha um nome para o cachorro.',lines:[['Gustavo','Gente, esse cachorro precisa de um nome né'],['Kevin','VERDADE'],['Esther','40, escolhe um nome pra ele!']]},
 missing:{at:Date.UTC(2091,3,2,9),title:'Esther e Gustavo retornaram à base',description:'Esther e Gustavo retornaram à base e procuraram Pirate 40 no grupo.',lines:[
 ['Esther','40? Chegamos!'],['Gustavo','Cadê você?'],['Esther','40, a gente tá na base'],['Gustavo','Deve ter saído'],['Esther','Sem avisar?'],['Esther','As coisas {object} ainda estão aqui'],['Gustavo','Espera'],['Gustavo','A Tech Bang {object} não tá respondendo'],['Esther','Como assim?'],['Gustavo','O último registro é do dia 1º, 00:51'],['Esther','Mãe, você falou com o 40 hoje?'],['Mãe','Não, minha filha. Por quê?'],['Esther','{subject} não tá aqui.'],['Kevin','Como assim não tá aí???'],['Esther','Não tem ninguém na base e não estamos conseguindo encontrar o 40'],['Mãe','Esther, verifica os registros de segurança.'],['Mãe','Gustavo, procura alguma indicação de saída.'],['Mãe','Kevin, nós vamos voltar.'],['Kevin','40, SE VOCÊ TIVER LENDO ISSO RESPONDE']]}
};
const MISSING_OPTIONS=['Eu acho que sei onde o 40 está.','O mapa mostra uma localização na França.','Não sei o que aconteceu com ele.'];
const MISSING_BRANCHES=[
 [['Esther','Como assim acha?'],['Esther','Espera...'],['Esther','Quem tá falando?'],['Gustavo','Que história é essa?']],
 [['Esther','FRANÇA???'],['Kevin','QUE????'],['Gustavo','Como você conseguiu essa informação?'],['Mãe','Calma. Precisamos verificar esse sinal.']],
 [['Esther','Mas você tá usando a conta {object}.'],['Gustavo','Quem é você?'],['Mãe','Seja quem for, por favor, precisamos saber se o 40 está bem.']]
];
const FEEDING_FALLBACK_AT=Date.UTC(2091,3,1,6,16);
const GROUP_MESSAGE_GAP=3000;
let dogNameDraft='';
function initializeGroupStory(){
 state.groupStory ??= {};
 const s=state.groupStory;
 s.messages ??= [];s.counts ??= {};s.responses ??= {};
 s.dogName ??= null;s.feeding ??= null;s.missingChoice ??= null;
 // Attach known IDs to legacy messages without replacing their text or timestamps.
 for(const [id,scene] of Object.entries(GROUP_SCENES))scene.lines.forEach((line,i)=>{
  const key='group-'+id+'-'+i;if(s.messages.some(m=>m.id===key))return;
  const old=s.messages.find(m=>!m.id&&m.sender===line[0]&&m.text===line[1]&&messageTimestamp(m)===scene.at+i*GROUP_MESSAGE_GAP);
  if(old)old.id=key;
 });
}
function appendGroupStoryMessage(id,line,at,mine=false){
 const story=state.groupStory;if(story.messages.some(m=>m.id===id))return false;
 story.messages.push({id,sender:mine?'Pirate 40':line[0],text:line[1],from:mine?'mine':'other',receivedAt:at,...stampAt(at)});
 if(!mine){recordNarrativeMessage(id,at);if(!(state.unlocked&&state.page==='mensagens'&&state.openChat==='group'))state.read=state.read.filter(id=>id!=='group');}
 return true;
}
function groupRecord(id,at,title,description){
 if(state.timeline.events[id])return;
 state.timeline.events[id]={id,at,title,description,type:'interactive',chatId:'group',executed:true,notified:false,read:false};
}
function programDogFeeding(at,automatic){
 const s=state.groupStory;if(s.feeding)return false;
 s.feeding={at,automatic,verifiedAt:automatic?null:at};
 s.responses.feeding={at:at+GROUP_MESSAGE_GAP,count:0,lines:[['Esther','Obrigada, 40! 💗'],['Kevin','MEU FILHO NÃO VAI PASSAR FOME'],['Gustavo','Teu filho KKKKKKK']]};
 groupRecord('dog-fed',at,'Alimentação programada',(automatic?'A rotina automática':'A verificação remota')+' programou o alimentador com a mistura veterinária segura e fictícia preparada pela base.');
 return true;
}
function processGroupStory(){
 const s=state.groupStory;let changed=false;
 for(const [id,scene] of Object.entries(GROUP_SCENES)){
  if(!state.timeline.events['group-'+id])continue;
  const count=Math.max(0,Math.min(scene.lines.length,1+Math.floor((state.gameTime-scene.at)/GROUP_MESSAGE_GAP)));
  for(let i=0;i<count;i++)changed=appendGroupStoryMessage('group-'+id+'-'+i,scene.lines[i],scene.at+i*GROUP_MESSAGE_GAP)||changed;
  if(s.counts[id]!==count){s.counts[id]=count;changed=true;}
 }
 if(state.gameTime>=FEEDING_FALLBACK_AT)changed=programDogFeeding(FEEDING_FALLBACK_AT,true)||changed;
 if(missingSceneReady()&&!state.timeline.events['missing-confirmed']){
  groupRecord('missing-confirmed',GROUP_SCENES.missing.at+18*GROUP_MESSAGE_GAP,'Pirate 40 não foi encontrado','O grupo relatou que Pirate 40 não está na base. A conversa aguarda sua resposta.');changed=true;
 }

 if(Number.isInteger(s.missingChoice)&&MISSING_BRANCHES[s.missingChoice]){
  const choiceMessage=s.messages.find(m=>m.id==='missing-choice'||(m.from==='mine'&&m.text===MISSING_OPTIONS[s.missingChoice]));
  const at=choiceMessage?messageTimestamp(choiceMessage):(s.responses.missing?.at ? s.responses.missing.at-GROUP_MESSAGE_GAP : state.gameTime);
  if(choiceMessage&&!choiceMessage.id)choiceMessage.id='missing-choice';
  changed=appendGroupStoryMessage('missing-choice',['Pirate 40',MISSING_OPTIONS[s.missingChoice]],at,true)||changed;
  if(!s.responses.missing){s.responses.missing={at:at+GROUP_MESSAGE_GAP,count:0,lines:MISSING_BRANCHES[s.missingChoice]};changed=true;}
 }

 for(const [id,response] of Object.entries(s.responses)){
  const count=Math.min(response.lines.length,Math.max(0,1+Math.floor((state.gameTime-response.at)/GROUP_MESSAGE_GAP)));
  for(let i=0;i<count;i++)changed=appendGroupStoryMessage('group-response-'+id+'-'+i,response.lines[i],response.at+i*GROUP_MESSAGE_GAP)||changed;
  if(response.count!==count){response.count=count;changed=true;}
 }
 return changed;
}
function missingSceneReady(){
 const scene=GROUP_SCENES.missing;
 return getGameDate().getTime()>=scene.at+(scene.lines.length-1)*GROUP_MESSAGE_GAP &&
 !!state.timeline?.events?.['group-missing'] &&
 scene.lines.every((_,i)=>state.groupStory.messages.some(m=>m.id==='group-missing-'+i));
}
function allBaseMessages(){return [...chats.group.messages,...BASE_HISTORY,...state.dogStory.messages,...(state.groupStory?.messages||[])].sort((a,b)=>messageTimestamp(a)-messageTimestamp(b));}
function groupStoryTyping(){
 const s=state.groupStory;
 for(const [id,scene] of Object.entries(GROUP_SCENES)){const count=s.counts[id]||0;if(count>0&&count<scene.lines.length)return typingIndicator(scene.lines[count][0]);}
 for(const response of Object.values(s.responses))if(response.count<response.lines.length)return typingIndicator(response.lines[response.count][0]);
 return '';
}
function dogCarePanel(){
 const s=state.groupStory;if(!state.timeline?.events['group-feeding'])return '';
 const f=s.feeding;
 return `<section class="panel dog-care"><p class="eyebrow">BASE · AUTOMAÇÃO REMOTA</p><h3>${escapeHtml(s.dogName||'Cachorro da base')}</h3><p>Estado: ${f?'Alimentação programada':'aguardando alimentação'}</p><p>Status do alimentador: ${f?'rotina confirmada':'pronto para verificação'}</p><p class="muted">Mistura veterinária segura e fictícia, preparada previamente pela base.</p>${f?`<p class="meta">${stampAt(f.at).date} · ${stampAt(f.at).time} — ${f.automatic?'Rotina automática executada':'Verificação remota realizada'}.</p>`:''}<button class="secondary" data-check-feeding ${f?.verifiedAt||(!f&&s.counts.feeding!==GROUP_SCENES.feeding.lines.length)?'disabled':''}>${f?.verifiedAt?'Alimentação verificada ✓':'Verificar alimentação'}</button><span class="feeder-pulse" aria-hidden="true"></span></section>`;
}
function groupStoryControls(){
 const s=state.groupStory;let html='';
 if(s.counts.naming===GROUP_SCENES.naming.lines.length&&!s.dogName)html+='<form id="dogNameForm" class="panel"><label for="dogNameInput">Nome do cachorro</label><input class="input" id="dogNameInput" maxlength="24" required value="'+escapeHtml(dogNameDraft)+'" placeholder="Escolha um nome"/><button class="primary" type="submit">Escolher nome</button><p id="dogNameFeedback" role="status"></p></form>';
 if(missingSceneReady()&&s.missingChoice===null)html+='<div class="responses" aria-label="Responder ao grupo">'+MISSING_OPTIONS.map((text,i)=>'<button class="secondary" data-missing-choice="'+i+'">'+escapeHtml(text)+'</button>').join('')+'</div>';
 return html+dogCarePanel();
}
content.addEventListener('input',e=>{if(e.target.id==='dogNameInput')dogNameDraft=e.target.value;});
content.addEventListener('submit',e=>{
 if(e.target.id!=='dogNameForm')return;e.preventDefault();const s=state.groupStory;
 if(!state.unlocked||state.openChat!=='group'||s.dogName||s.counts.naming!==GROUP_SCENES.naming.lines.length)return;
 const name=$('#dogNameInput').value.trim();if(!name||name.length>24){$('#dogNameFeedback').textContent='Escolha um nome de até 24 caracteres.';return;}
 s.dogName=name;dogNameDraft='';const at=getGameDate().getTime();appendGroupStoryMessage('dog-name-choice',['Pirate 40',name],at,true);
 s.responses.naming={at:at+GROUP_MESSAGE_GAP,count:0,lines:[['Kevin','EU AMEI KKKKKKK'],['Esther','Pronto, agora ele tem nome 🥹'],['Gustavo','Bem-vindo à base, '+name+'.']]};
 groupRecord('dog-named',at,'O cachorro ganhou um nome','O nome escolhido para o cachorro foi '+name+'.');save();refreshDogChat();
});
content.addEventListener('click',e=>{
 if(!state.unlocked)return;
 if(e.target.closest('[data-check-feeding]')&&state.timeline.events['group-feeding']){
  if(!state.groupStory.feeding&&state.groupStory.counts.feeding!==GROUP_SCENES.feeding.lines.length)return;
  const at=getGameDate().getTime();programDogFeeding(at,false);state.groupStory.feeding.verifiedAt ??= at;save();render();return;
 }
 const choice=e.target.closest('[data-missing-choice]');if(!choice)return;
 const s=state.groupStory,index=Number(choice.dataset.missingChoice);
 if(state.openChat!=='group'||s.missingChoice!==null||!missingSceneReady()||!Number.isInteger(index)||index<0||index>2)return;
 s.missingChoice=index;const at=getGameDate().getTime();appendGroupStoryMessage('missing-choice',['Pirate 40',MISSING_OPTIONS[index]],at,true);
 s.responses.missing={at:at+GROUP_MESSAGE_GAP,count:0,lines:MISSING_BRANCHES[index]};save();refreshDogChat();
});
