# Diagnóstico do diário — 14/10/2026

URL examinada: https://pirate40.netlify.app/

O Chrome abriu o site real com perfil temporário e cache desativado. Um clique real em Desbloquear não gerou submit. O rastreamento identificou render() chamado pelo listener de document em script.js:310; renderDiary() recebeu diaryUnlocked=false e nenhum registro foi gerado. Não houve exceção JavaScript. requestSubmit(), usado apenas para isolar a causa no teste, validou a mesma entrada e exibiu os quatro registros imediatamente.

O script.js publicado contém e.target.closest('[data-wallpaper]'). Esse seletor também encontra o contêiner .device; qualquer clique dentro dele recria a tela e remove o formulário antes de sua ação padrão. O arquivo local já contém e.target.closest('button[data-wallpaper]'), na linha 309. Os arquivos personal.js, diary-archive.js e devices.js publicados também diferem dos locais. O problema foi reproduzido sem dados antigos nem cache pessoal: não exige limpar o progresso.

Nesta revisão, index.html recebeu identificação pirate40-build=diary-unlock-20261014 e versões por hash nos scripts e estilos. tests/diary.browser.py passou a iniciar uma partida pelo formulário real antes de testar a migração de um salvamento antigo. O teste usa o index.html do projeto, não uma página substituta.

Os diagnósticos foram injetados apenas no navegador temporário, sem registrar senhas; o script temporário foi removido. Nenhum log foi adicionado ao jogo.

Não foi encontrado netlify.toml, configuração local de publicação ou service worker. O repositório local aponta para bkarennn/Pirate40 no GitHub, mas isso não comprova qual pasta/commit a configuração privada do Netlify publica. É necessário publicar o conteúdo atualizado de Pirate40 como raiz do site (index.html na raiz), mantendo o mesmo domínio para preservar o localStorage. Esta sessão não publicou alterações nem confirmou uma versão corrigida no endereço público.
