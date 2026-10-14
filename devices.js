// Entirely local narrative simulation. No network discovery or external device access.
const NEXUS_DEVICES = Object.freeze({
 esther:{id:'NXS-EST-01',name:'Esther',arrival:Date.UTC(2091,3,2,9),diary:'esther',records:ESTHER_ARCHIVE,files:[]},
 gustavo:{id:'NXS-GUS-01',name:'Gustavo',arrival:Date.UTC(2091,3,2,9),diary:'gustavo',files:[]},
 kevin:{id:'NXS-KEV-01',name:'Kevin',arrival:null,diary:null,files:[]},
 mae:{id:'NXS-MAE-01',name:'Mãe',arrival:null,diary:null,files:[]}
});
let remoteDevice=null,remoteSection='overview';
function initializeDevices(){
 state.devices ??= {};
 for(const id of Object.keys(NEXUS_DEVICES))state.devices[id]={detectedAt:null,paired:false,pairDue:0,lastSync:null,read:[],...state.devices[id]};
}
function deviceConnected(id){const device=NEXUS_DEVICES[id];return !!device&&device.arrival!==null&&getGameDate().getTime()>=device.arrival&&!!state.timeline?.events?.['group-missing'];}
function remoteDiaryAccess(id){return state.unlocked&&state.page==='devices'&&remoteDevice===id&&remoteSection==='diary'&&deviceConnected(id)&&state.devices[id].paired;}
function processDevices(){
 let changed=false;
 for(const [id,device] of Object.entries(NEXUS_DEVICES)){
  const saved=state.devices[id];
  if(deviceConnected(id)){
   if(saved.detectedAt===null){saved.detectedAt=device.arrival;changed=true;}
   if(saved.pairDue&&state.gameTime>=saved.pairDue){saved.paired=true;saved.lastSync=saved.pairDue;saved.pairDue=0;changed=true;}
  }
 }
 return changed;
}
function remoteNavigation(){return '<div class="responses remote-navigation"><button class="back" data-remote-back>← Voltar</button><button class="back" data-device-list>Lista de aparelhos</button><button class="back" data-devices-home>Tela inicial</button></div>';}
function renderDevices(){
 const network=head('Dispositivos','REDE LOCAL')+'<section class="panel"><h3>BASE_PIRATA_40</h3><p class="muted">Conectado · Nexus OS · conexão simulada</p></section>';
 if(!remoteDevice){
  const available=Object.entries(NEXUS_DEVICES).filter(([id])=>deviceConnected(id));
  return network+'<div class="row"><h3>Dispositivos disponíveis</h3><button class="secondary" data-device-search>Buscar dispositivos</button></div><div class="device-list">'+(available.length?available.map(([id,device])=>'<button class="panel remote-device-card" data-device="'+id+'">'+icon('devices')+'<span><strong>Nexus '+(id==='mae'?'da ':'de ')+escapeHtml(device.name)+'</strong><small>'+device.id+' · '+(state.devices[id].paired?'Pareado':'Disponível')+'</small></span><span>→</span></button>').join(''):'<p class="empty-history">Nenhum dispositivo pessoal próximo foi detectado.</p>')+'</div>';
 }
 const device=NEXUS_DEVICES[remoteDevice],saved=state.devices[remoteDevice];
 if(!device||!deviceConnected(remoteDevice))return network+remoteNavigation()+'<p class="muted">Dispositivo fora da rede local.</p>';
 const heading=remoteNavigation()+head('NEXUS OS — '+escapeHtml(device.name.toUpperCase()),'CONEXÃO REMOTA');
 if(!saved.paired)return heading+'<section class="panel remote-surface"><h3>Dispositivo detectado.</h3><p>Proprietário: '+escapeHtml(device.name)+'</p><p>Conexão: Rede local</p><p>Status: Disponível</p>'+(saved.pairDue?'<div class="pairing-progress" role="status">Sincronizando dispositivos…<span></span></div>':'<button class="primary" data-device-pair>Solicitar pareamento</button>')+'</section>';
 const tabs=[['overview','Visão geral'],['diary','Diário'],['info','Informações do dispositivo'],['location','Localização'],['files','Arquivos compartilhados']];
 let body='';
 if(remoteSection==='diary')body=remoteDevice==='gustavo'?renderGustavoDiary():'<section class="panel"><h3>Diário de '+escapeHtml(device.name)+'</h3><p>Arquivo privado protegido.</p><p class="muted">Acesso indisponível. O pareamento não concede acesso aos registros privados.</p></section>';
 else if(remoteSection==='location')body='<h3>Última localização registrada</h3><p>Base oceânica</p><p class="meta">'+stampAt(device.arrival).date+' · '+stampAt(device.arrival).time+'</p>';
 else if(remoteSection==='files')body='<h3>Arquivos compartilhados</h3><p class="muted">Nenhum arquivo compartilhado disponível.</p>';
 else if(remoteSection==='info')body='<h3>Informações do dispositivo</h3><p>Proprietário: '+escapeHtml(device.name)+'</p><p>Identificador: '+device.id+'</p><p>Nexus OS · Rede local BASE_PIRATA_40</p>';
 else body='<h3>'+escapeHtml(device.name)+'</h3><p>Conexão: Conectado à rede local</p><p>Pareamento: Pareado</p><p>Bateria: leitura indisponível</p><p>Última sincronização: '+stampAt(saved.lastSync).date+' · '+stampAt(saved.lastSync).time+'</p>';
 return heading+'<section class="remote-surface"><div class="remote-tabs">'+tabs.map(([id,label])=>'<button class="secondary" data-remote-section="'+id+'" aria-pressed="'+(id===remoteSection)+'">'+label+'</button>').join('')+'</div><div class="remote-content">'+body+'</div></section>';
}
function devicesBack(){
 if(remoteSection==='diary'&&remoteDevice==='gustavo'&&gustavoFolder!=='all'){gustavoFolder='all';render();return;}
 if(remoteSection!=='overview'){remoteSection='overview';render();return;}
 if(remoteDevice){remoteDevice=null;render();return;}
 goHome();
}
content.addEventListener('click',event=>{
 if(state.page!=='devices'||!state.unlocked)return;
 if(event.target.closest('[data-device-search]')){processNarrativeEvents();render();return;}
 if(event.target.closest('[data-devices-home]')){goHome();return;}
 if(event.target.closest('[data-device-list]')){remoteDevice=null;remoteSection='overview';gustavoFolder='all';render();return;}
 if(event.target.closest('[data-remote-back]')){devicesBack();return;}
 const selected=event.target.closest('[data-device]');if(selected&&deviceConnected(selected.dataset.device)){remoteDevice=selected.dataset.device;remoteSection='overview';render();return;}
 if(event.target.closest('[data-device-pair]')&&deviceConnected(remoteDevice)){
  const saved=state.devices[remoteDevice];if(saved.paired||saved.pairDue)return;saved.pairDue=getGameDate().getTime()+1600;save();render();return;
 }
 const section=event.target.closest('[data-remote-section]');if(section&&deviceConnected(remoteDevice)&&state.devices[remoteDevice].paired&&['overview','diary','info','location','files'].includes(section.dataset.remoteSection)){remoteSection=section.dataset.remoteSection;render();}
});
content.addEventListener('toggle',event=>{
 const id=event.target.dataset?.archiveRecord;
 if(!id||!event.target.open)return;
 if(state.page==='diario'&&state.diaryUnlocked&&[ORIGINAL_DIARY,CONTROL_DIARY,...PIRATE_ARCHIVE].some(entry=>entry.id===id)){state.readDocuments['pirate:'+id]=true;save();return;}
 if(!remoteDiaryAccess('gustavo')||!state.gustavoDiaryUnlocked)return;
 if(!GUSTAVO_ARCHIVE.some(entry=>entry.id===id))return;
 const saved=state.devices.gustavo;if(!saved.read.includes(id)){saved.read.push(id);state.readDocuments['gustavo:'+id]=true;save();}
},true);
