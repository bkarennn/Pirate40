// Historical local documents. Dates never change the narrative clock.
let diaryOwner='pirate', gustavoFolder='all', gustavoPasswordDraft='';
function archiveDate(entry){return entry.dateLabel || (entry.at===null?'DATA DO REGISTRO NÃO DEFINIDA':stampAt(entry.at).date+(entry.id==='base-2091'?' · '+stampAt(entry.at).time:''));}
function archiveCards(entries){
 const ordered=[...entries].sort((a,b)=>(a.at??(a.year?Date.UTC(a.year,0,1):Infinity))-(b.at??(b.year?Date.UTC(b.year,0,1):Infinity)));
 return ordered.map(entry=>'<details class="archive-record" data-archive-record="'+escapeHtml(entry.id)+'"><summary><span class="meta">'+escapeHtml(archiveDate(entry))+'</span><strong>'+escapeHtml(entry.title)+'</strong><small>'+(entry.folder==='letters'?'Para Mamãe · carta não enviada':'Registro pessoal · somente leitura')+'</small></summary><div class="archive-text" tabindex="0" aria-label="'+escapeHtml(entry.title)+'">'+escapeHtml(entry.body)+'</div></details>').join('');
}
function renderGustavoDiary(){
 if(!remoteDiaryAccess('gustavo'))return '<p class="muted">Conecte e pareie o dispositivo de Gustavo para acessar este arquivo.</p>';
 const top=head('Diário de Gustavo','DISPOSITIVO PESSOAL · ARQUIVO LOCAL SINCRONIZADO');
 if(!state.gustavoDiaryUnlocked)return top+'<form id="gustavoUnlockForm" novalidate class="panel diary-lock"><span class="widget-icon">'+icon('lock')+'</span><p>Arquivo privado bloqueado.</p><label for="gustavoPassword">Senha</label><input id="gustavoPassword" class="input" type="password" autocomplete="off" maxlength="100" required value="'+escapeHtml(gustavoPasswordDraft)+'"/><p id="gustavoLockFeedback" role="status"></p><button class="primary" type="submit">Desbloquear</button></form>';
 const entries=GUSTAVO_ARCHIVE.filter(entry=>gustavoFolder==='all'||entry.folder==='letters');
 return top+'<p class="muted">Memórias privadas de Gustavo. Estas cartas não foram enviadas.</p><div class="diary-owners"><button class="secondary" data-gustavo-folder="all" aria-pressed="'+(gustavoFolder==='all')+'">Todos os registros</button><button class="secondary" data-gustavo-folder="letters" aria-pressed="'+(gustavoFolder==='letters')+'">Para Mamãe</button></div><section aria-label="Registros de Gustavo">'+archiveCards(entries)+'</section>';
}
content.addEventListener('input',event=>{if(event.target.id==='gustavoPassword')gustavoPasswordDraft=event.target.value;});
content.addEventListener('click',event=>{
 const folder=event.target.closest('[data-gustavo-folder]');if(folder&&remoteDiaryAccess('gustavo')&&state.gustavoDiaryUnlocked&&['all','letters'].includes(folder.dataset.gustavoFolder)){gustavoFolder=folder.dataset.gustavoFolder;render();}
});
content.addEventListener('submit',event=>{
 if(event.target.id!=='gustavoUnlockForm')return;event.preventDefault();
 if(!remoteDiaryAccess('gustavo'))return;
 const input=event.target.querySelector?.('#gustavoPassword') || $('#gustavoPassword');
 const value=normalizeDiaryPassword(input.value);
 if(!value){$('#gustavoLockFeedback').textContent='Digite uma senha para continuar.';input.setAttribute('aria-invalid','true');return;}
 if(value!=='lisandra'){$('#gustavoLockFeedback').textContent='Senha incorreta. Tente novamente.';input.setAttribute('aria-invalid','true');return;}
 state.gustavoDiaryUnlocked=true;gustavoPasswordDraft='';save();render();
});
const PIRATE_ARCHIVE = Object.freeze([
  {
    "id": "beginning",
    "title": "O começo do fim",
    "body": "Não gosto de lembrar de certos dias, mas a Mãe insiste que é importante documentar tudo.\n\nO controle mundial começou aos poucos. A Neuronix vendeu a ideia dos chips como poderes de super-herói. Bom, são mesmo, mas entregues nas mãos de vilões.\n\nOs chips concedem habilidades tanto físicas quanto intelectuais, e isso chama muita atenção.\n\nPessoas conseguiam calcular movimentos muito rapidamente, ficavam mais fortes e conseguiam estabilizar a mente de uma forma que antes parecia impossível.\n\nCom alguns upgrades, habilidades como a telecinese passaram a existir. Algo que antes era inalcançável pela sociedade passou a pertencer principalmente a pessoas das classes mais altas.\n\nMas isso também colocava em risco as mentes das pessoas.\n\nPessoas já são manipuladas todos os dias externamente por palavras bonitas e bons acordos, mas agora a Neuronix tinha outro tipo de acesso.",
    "at": null,
    "dateLabel": "Registro histórico anterior a março de 2091 · data da escrita não definida"
  },
  {
    "id": "mirage",
    "title": "Miragem",
    "body": "Em 2082 foi quando a coisa ficou feia.\n\nUm hacker que se intitulava Miragem começou a acessar o controle neural das pessoas por meio de redes Wi-Fi públicas.\n\nNão se sabia quando seria seu próximo ataque.\n\nNo começo, eram acontecimentos pequenos: pessoas em um aeroporto, grupos conectados à mesma rede, indivíduos que de repente deixavam de agir por vontade própria.\n\nDepois, os ataques começaram a atingir áreas cada vez maiores.\n\nMiragem já conseguia comprometer o controle neural de cidades inteiras.\n\nA Neuronix prometeu que iria impedir os ataques.\n\nEra uma promessa que todos queriam acreditar que seria cumprida.",
    "at": null,
    "year": 2082,
    "dateLabel": "2082 · data do acontecimento; data da escrita não definida"
  }
].map(Object.freeze));
const GUSTAVO_ARCHIVE = Object.freeze([
  {
    "id": "gustavo-0",
    "title": "Feliz Dia das Mães — 2085",
    "body": "Mãe, desculpa ter fugido daquele jeito, mas sendo sincero? Você e papai estão malucos!\n\nMãe, eu não podia ficar sentado vendo vocês lamberem os pés da Neuronix, eu não podia aceitar aquilo, mas eu vou salvar você, mamãe, e vou te dar um buquê de girassóis depois!\n\nFeliz Dia das Mães.",
    "at": 3640204800000,
    "folder": "letters"
  },
  {
    "id": "gustavo-1",
    "title": "Feliz Dia das Mães — 2086",
    "body": "Mãe, me perdoa, mas eu não sei se algum dia eu vou ser capaz de perdoar o 40.\n\nEu não acho que seja rancor o que você queira para mim, mas dói, uma dor que seus abraços não podem curar, nem seus cafunés, nem nada do que você pode fazer, porque você não está aqui.\n\nFeliz Dia das Mães.",
    "at": 3671740800000,
    "folder": "letters"
  },
  {
    "id": "gustavo-2",
    "title": "Feliz Dia das Mães — 2087",
    "body": "Feliz Dia das Mães, mãe.\n\nEu espero que em algum lugar do céu, você esteja me ouvindo, e que nesse céu, a sua voz realmente pertença a você, que seja você falando comigo, e não aquele chip idiota.\n\nEu queria que você tivesse conhecido a Mãe, sabe, de verdade, ela me trata bem, apesar de tudo, todos os dias eu sinto sua falta.\n\nAliás, eu estou cuidando da Lisandra, fica tranquila.\n\nTe amo, mãe.",
    "at": 3703276800000,
    "folder": "letters"
  },
  {
    "id": "gustavo-3",
    "title": "Experimentos culinários",
    "body": "Kevin tentou fazer pão.\n\nAcho que dava pra usar como material de construção.\n\nA Esther disse que tava bom.\n\nO amor realmente deixa as pessoas cegas.",
    "at": 3740860800000,
    "folder": "daily"
  },
  {
    "id": "gustavo-4",
    "title": "Lisandra",
    "body": "A Mãe costurou a orelha da Lisandra hoje.\n\nDisse que eu precisava cuidar melhor das minhas coisas.\n\nEu falei que já cuidava.\n\nEla olhou pro estado do meu quarto.\n\nNão tive argumentos.",
    "at": 3776630400000,
    "folder": "daily"
  },
  {
    "id": "gustavo-5",
    "title": "Missão",
    "body": "A Esther disse que talvez precisem de ajuda na próxima missão.\n\nEu pedi pra ir.\n\nEla falou que ia conversar com a Mãe.\n\nNão aguento mais ficar aqui enquanto todo mundo sai.\n\nEu sei que sou o mais novo, mas também preciso aprender a sobreviver lá fora.",
    "at": 3822768000000,
    "folder": "daily"
  },
  {
    "id": "procedure-reference",
    "title": "O que aconteceu",
    "body": "Eu não gosto de pensar naquele dia.\n\nSei que a Esther guardou os registros do procedimento.\n\nNão sei se algum dia vou ter coragem de ler.\n\nEla estava lá.\n\nO 40 também.\n\nÀs vezes eu queria saber exatamente o que aconteceu.\n\nOutras vezes acho que não quero saber de mais nada.",
    "at": null,
    "dateLabel": "Após a perda da mãe · data da escrita não definida",
    "folder": "private"
  },
  {
    "id": "gustavo-esther-arrival",
    "title": "Uma menina nova",
    "body": "A Mãe trouxe uma menina para a base, o nome dela é Esther.\n\nEla não abriu um sorriso desde que entrou, ela disse que tem um garoto chamado Kevin que ela não pode deixar para trás.\n\nEla pareceu muito desesperada, mas a gente vai ajudar ela.",
    "at": 3643142400000,
    "folder": "daily"
  },
  {
    "id": "gustavo-kevin-arrival",
    "title": "Kevin chegou",
    "body": "Kevin chegou na base.\n\nEle estava sorrindo, por incrível que pareça, mesmo todo roxo por causa dos usuários de chip que bateram nele.\n\nEle foi muito legal, disse que ele só teve que fugir porque senão ia dar uma surra nos chips.\n\nBom, que bom que ele acredita nisso.",
    "at": 3643228800000,
    "folder": "daily"
  }
].map(Object.freeze));
// Private Esther records: stored for future release; no password has been defined.
const ESTHER_ARCHIVE = Object.freeze([
  {
    "id": "esther-family",
    "title": "Uma nova família",
    "body": "Uma mulher me deu esse dispositivo, disse que iríamos ficar um bom tempo juntos, e que agora eu fazia parte da família. De acordo com ela, é importante anotar.\n\nBom, hoje eu resgatei Kevin, quer dizer, todos nós.\n\nEstamos em uma base em alguma parte da Oceania, ela pertence à mulher. Ela não pode revelar seu verdadeiro nome, achei maneira pra uma mulher de 39 anos, espero que ela não consiga ler isso.\n\nAqui também tem o Gustavo, ele não fala muito, mas fica me olhando de longe.\n\nA mulher me disponibilizou um quarto, acho que eu me acostume com essa loucura.",
    "at": 3643228800000,
    "folder": "daily"
  },
  {
    "id": "esther-world-control",
    "title": "O dia em que tudo mudou",
    "body": "Tudo já estava acontecendo antes do dia 13 de fevereiro de 2083.\n\nAconteceu aos poucos, e estávamos deixando, estávamos cedendo, éramos ratos indo para a ratoeira.\n\nO Miragem conseguiu o controle de todas as pessoas que estavam com os chips.\n\nLembro de que as pessoas não sorriam, não choravam, apenas pareciam zumbis sem alma, submissas, sem sonhos.\n\nÉ como se todo o esforço, todos os protestos, todo o escândalo fosse em vão.\n\nMas se eu estou aqui, deve haver uma razão.",
    "at": 3643315200000,
    "folder": "daily"
  },
  {
    "id": "esther-forgiveness",
    "title": "Perdão",
    "body": "Se existir alguém aí em cima, quero pedir perdão, porque nenhum pecado se compara com o que eu fiz, mas agora acho que não tem volta.\n\nQuando eu era menor, acreditava que as pessoas que morriam reencarnavam como fadas e protegiam a natureza.\n\nTambém acreditava que meu nariz cresceria se eu mentisse, mas ele não cresceu, e nenhuma fada veio me visitar, nem a que eu matei.\n\nÉ culpa minha, Senhora Lorena, me perdoa.\n\nGustavo, espero que você me perdoe um dia.",
    "at": 3659817600000,
    "folder": "daily"
  }
].map(Object.freeze));

const LISANDRA_HISTORY = Object.freeze([
  {
    "from": "other",
    "text": "40",
    "date": "18/02/2091",
    "time": "19:10"
  },
  {
    "from": "other",
    "text": "Você viu a Lisandra?",
    "date": "18/02/2091",
    "time": "19:11"
  },
  {
    "from": "other",
    "text": "Deixei ela no alojamento e não tá mais lá",
    "date": "18/02/2091",
    "time": "19:12"
  },
  {
    "from": "mine",
    "text": "A girafa?",
    "date": "18/02/2091",
    "time": "19:13"
  },
  {
    "from": "other",
    "text": "Não, a outra Lisandra que mora na base",
    "date": "18/02/2091",
    "time": "19:14"
  },
  {
    "from": "other",
    "text": "Claro que é a girafa 🙄",
    "date": "18/02/2091",
    "time": "19:15"
  },
  {
    "from": "mine",
    "text": "Calma KKKKK vou procurar",
    "date": "18/02/2091",
    "time": "19:16"
  },
  {
    "from": "other",
    "text": "Tá",
    "date": "18/02/2091",
    "time": "19:17"
  },
  {
    "from": "other",
    "text": "Só não perde ela.",
    "date": "18/02/2091",
    "time": "19:18"
  }
].map(Object.freeze));
chats.gustavo.messages=[...LISANDRA_HISTORY];
