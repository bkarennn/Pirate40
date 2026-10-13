// Original local files are reused by both the gallery and message attachments.
const PHOTO_LIBRARY = [
 {id:'chip',file:'chip.png',title:'Chip',alt:'Chip eletrônico segurado por uma pinça.'},
 {id:'sunflowers',file:'girassois.png',title:'Girassóis plantados',alt:'Girassóis plantados em um canteiro.'},
 {id:'dog',file:'download (4).jpeg',title:'Cachorro encontrado na base',alt:'Cachorro deitado sobre um tecido estampado.'},
 {id:'note-time',file:'post1.jpeg',title:'Registro sem descrição',alt:'Fotografia de um post-it com o horário 00:31.'},
 {id:'note-flower',file:'WhatsApp Image 2026-10-13 at 17.45.27.jpeg',title:'Registro sem descrição',alt:'Fotografia de um post-it com um desenho de girassol.'}
];
function availablePhotos() {return PHOTO_LIBRARY.filter(photo=>photo.id!=='dog' || state.dogStory.photoUnlocked);}
function photoURL(photo) {return 'fotos/'+encodeURIComponent(photo.file);}
function photoThumbnail(id,inChat=false) {
 const photo=PHOTO_LIBRARY.find(item=>item.id===id);if(!photo || (id==='dog' && !state.dogStory.photoUnlocked))return '';
 return '<button type="button" class="photo-thumbnail '+(inChat?'chat-photo':'')+'" data-photo="'+photo.id+'" aria-label="Ampliar: '+escapeHtml(photo.title)+'"><img src="'+photoURL(photo)+'" alt="'+escapeHtml(photo.alt)+'" loading="lazy" decoding="async"><span>'+escapeHtml(photo.title)+'</span></button>';
}
let photoOpener=null;
function openPhoto(id,opener) {
 const photo=PHOTO_LIBRARY.find(item=>item.id===id);
 if(!photo || (id==='dog' && !state.dogStory.photoUnlocked) || !state.unlocked || state.security?.status==='failed')return;
 const viewer=document.getElementById('photoViewer');
 const image=document.getElementById('fullPhoto');
 photoOpener=opener || document.activeElement;
 document.getElementById('photoError').classList.add('hidden');
 image.alt=photo.alt;image.src=photoURL(photo);
 document.getElementById('photoCaption').textContent=photo.title;
 if(!viewer.open)viewer.showModal();
 document.getElementById('closePhoto').focus();
}
function closePhoto(restoreFocus=true) {
 const viewer=document.getElementById('photoViewer');
 if(!viewer.open)return;
 viewer.close();
 if(restoreFocus && photoOpener?.isConnected)photoOpener.focus();
 photoOpener=null;
}
document.getElementById('content').addEventListener('click',event=>{
 const photo=event.target.closest('[data-photo]');if(photo)openPhoto(photo.dataset.photo,photo);
});
document.getElementById('closePhoto').addEventListener('click',()=>closePhoto());
document.getElementById('photoViewer').addEventListener('cancel',event=>{event.preventDefault();closePhoto();});
document.getElementById('photoViewer').addEventListener('click',event=>{
 if(event.target===event.currentTarget) {
  const rect=event.currentTarget.getBoundingClientRect();
  if(event.clientX<rect.left || event.clientX>rect.right || event.clientY<rect.top || event.clientY>rect.bottom)closePhoto();
 }
});
document.getElementById('fullPhoto').addEventListener('error',()=>document.getElementById('photoError').classList.remove('hidden'));
document.getElementById('fullPhoto').addEventListener('load',()=>document.getElementById('photoError').classList.add('hidden'));
