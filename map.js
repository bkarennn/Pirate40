// Offline SVG map. No network, geolocation, libraries or API keys.
const PLAYER_POSITION = {x:350, y:115}; // 170 E, 25 S — fictional ocean base.
const mapView = {zoom:1.2, x:350, y:100};
let mapCleanup = () => {};
function renderWorldMap() {
  const position=currentNarrativePosition();mapView.x=position.x;mapView.y=position.y;
  return head('Mapa', 'ATLAS LOCAL / 2091') + '<div class="atlas-heading"><div><p class="eyebrow">POSIÇÃO REGISTRADA</p><h3>'+escapeHtml(position.label)+'</h3></div><span class="atlas-signal">' + (state.locator ? 'Emissão ativa' : 'Última posição conhecida') + '</span></div><div class="atlas-wrap"><svg id="worldMap" class="world-map" tabindex="0" role="group" aria-label="Mapa interativo. Use mais e menos para zoom e as setas para mover." viewBox="170 10 360 180"><defs><pattern id="atlasGrid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" fill="none" stroke="#c9e6f2" stroke-width=".2"/></pattern></defs><rect x="0" y="0" width="720" height="180" fill="#aecddd"/><rect x="0" y="0" width="720" height="180" fill="url(#atlasGrid)"/><g class="atlas-countries">' + [0,360].map(offset => '<g transform="translate(' + offset + ' 0)">' + WORLD_COUNTRIES.map(c => '<path d="' + c.path + '"><title>' + escapeHtml(c.name) + '</title></path>').join('') + '</g>').join('') + '</g><g class="atlas-labels">' + [
    [314,117,'AUSTRÁLIA'],[354,134,'NOVA ZELÂNDIA'],[315,94,'PAPUA-NOVA GUINÉ'],[360,105,'FIJI'],[284,66,'CHINA'],[319,53,'JAPÃO'],[280,91,'INDONÉSIA'],[412,110,'PACÍFICO SUL'],[442,47,'AMÉRICA DO NORTE'],[481,105,'AMÉRICA DO SUL'],[182.35,40,'FRANÇA'],[202,89,'ÁFRICA'],[254,120,'OCEANO ÍNDICO']
  ].map(([x,y,name])=>'<text x="'+x+'" y="'+y+'">'+name+'</text>').join('') + '</g><g id="journeyRoute">' + routeMarkup() + '</g><g class="player-marker" transform="translate(' + position.x + ' ' + position.y + ')"><circle class="marker-halo" r="5"/><circle r="2"/><path d="M0-7V-4M0 4V7M-7 0H-4M4 0H7"/><text x="7" y="1">PIRATE 40</text></g></svg><div class="atlas-controls" aria-label="Controles do mapa"><button data-map-action="in" aria-label="Aumentar zoom">+</button><button data-map-action="out" aria-label="Diminuir zoom">−</button><button data-map-action="center" aria-label="Centralizar na posição de Pirate 40" title="Centralizar Pirate 40">⌖</button><button data-map-action="world" aria-label="Visão ampla" title="Visão ampla">◎</button></div><div class="atlas-bottom"><span>Trajeto fictício · sem GPS real</span><output id="mapZoom" aria-label="Nível de zoom"></output></div></div><p class="atlas-hint">Arraste para explorar · + / − para zoom · setas do teclado para mover</p><div class="atlas-details"><div><small>LOCALIZAÇÃO APROXIMADA</small><strong id="journeyLocation">'+escapeHtml(position.label)+'</strong></div><div><small>INSTALAÇÃO</small><strong>Não registrada</strong></div><div><small>PRECISÃO</small><strong>Sinal geográfico instável</strong></div></div><p class="atlas-credit">Cartografia: Natural Earth · referência geográfica simplificada · instalação fictícia · sem GPS.</p>' + renderNarrativeHistory('location');
}
function mountWorldMap() {
  mapCleanup();
  const svg = $('#worldMap'); if (!svg) return;
  const controller = new AbortController();
  const options = {signal:controller.signal};
  const clamp = (value,min,max) => Math.min(max,Math.max(min,value));
  let box, drag = null;
  function update() {
    const rect = svg.getBoundingClientRect();
    const ratio = (rect.width || 600) / (rect.height || 360);
    mapView.zoom = clamp(mapView.zoom,1,8);
    const width = Math.min(360,180 * ratio) / mapView.zoom;
    const height = width / ratio;
    mapView.x = clamp(mapView.x,width/2,720-width/2);
    mapView.y = clamp(mapView.y,height/2,180-height/2);
    box = {x:mapView.x-width/2,y:mapView.y-height/2,width,height};
    svg.setAttribute('viewBox', [box.x,box.y,width,height].join(' '));
    $('#mapZoom').textContent = mapView.zoom.toFixed(1) + '×';
    content.querySelector('[data-map-action="in"]').disabled = mapView.zoom >= 8;
    content.querySelector('[data-map-action="out"]').disabled = mapView.zoom <= 1;
  }
  function action(name) {
    if(name === 'in') mapView.zoom *= 1.35;
    if(name === 'out') mapView.zoom /= 1.35;
    if(name === 'world') { mapView.zoom=1; mapView.x=350;mapView.y=90; }
    if(name === 'center') {
      const position=currentNarrativePosition();mapView.zoom=2;mapView.x=position.x;mapView.y=position.y;
      const marker = svg.querySelector('.player-marker');
      if (marker.animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) marker.animate([{opacity:.2},{opacity:1}],{duration:650});
    }
    update();
  }
  content.querySelectorAll('[data-map-action]').forEach(button=>button.addEventListener('click',()=>action(button.dataset.mapAction),options));
  svg.addEventListener('pointerdown', e=>{if(e.button!==0 || drag) return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,cx:mapView.x,cy:mapView.y};svg.setPointerCapture(e.pointerId);svg.classList.add('dragging');},options);
  svg.addEventListener('pointermove', e=>{if(!drag || drag.id!==e.pointerId)return;const r=svg.getBoundingClientRect();mapView.x=drag.cx-(e.clientX-drag.x)*box.width/r.width;mapView.y=drag.cy-(e.clientY-drag.y)*box.height/r.height;update();},options);
  const end = e=>{if(drag && drag.id===e.pointerId){drag=null;svg.classList.remove('dragging');}};
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>svg.addEventListener(type,end,options));
  svg.addEventListener('keydown',e=>{
    const moves={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
    if(moves[e.key]){e.preventDefault();mapView.x+=moves[e.key][0]*box.width*.1;mapView.y+=moves[e.key][1]*box.height*.1;update();}
    if(['+','=','-'].includes(e.key)){e.preventDefault();action(e.key==='-'?'out':'in');}
    if(e.key==='Home'){e.preventDefault();action('center');}
  },options);
  const observer = new ResizeObserver(update); observer.observe(svg);
  mapCleanup = () => {controller.abort();observer.disconnect();};
  update();
}
