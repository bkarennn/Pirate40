# Diagnóstico do diário — 14/10/2026

URL examinada: https://pirate40.netlify.app/

O Chrome abriu o site real com perfil temporário e cache desativado. Um clique real em Desbloquear não gerou submit. O rastreamento identificou render() chamado pelo listener de document em script.js:310; renderDiary() recebeu diaryUnlocked=false e nenhum registro foi gerado. Não houve exceção JavaScript. requestSubmit(), usado apenas para isolar a causa no teste, validou a mesma entrada e exibiu os quatro registros imediatamente.

O script.js publicado contém e.target.closest('[data-wallpaper]'). Esse seletor também encontra o contêiner .device; qualquer clique dentro dele recria a tela e remove o formulário antes de sua ação padrão. O arquivo local já contém e.target.closest('button[data-wallpaper]'), na linha 309. Os arquivos personal.js, diary-archive.js e devices.js publicados também diferem dos locais. O problema foi reproduzido sem dados antigos nem cache pessoal: não exige limpar o progresso.

Nesta revisão, index.html recebeu identificação pirate40-build=diary-unlock-20261014 e versões por hash nos scripts e estilos. tests/diary.browser.py passou a iniciar uma partida pelo formulário real antes de testar a migração de um salvamento antigo. O teste usa o index.html do projeto, não uma página substituta.

Os diagnósticos foram injetados apenas no navegador temporário, sem registrar senhas; o script temporário foi removido. Nenhum log foi adicionado ao jogo.

Não foi encontrado netlify.toml, configuração local de publicação ou service worker. O repositório local aponta para bkarennn/Pirate40 no GitHub, mas isso não comprova qual pasta/commit a configuração privada do Netlify publica. É necessário publicar o conteúdo atualizado de Pirate40 como raiz do site (index.html na raiz), mantendo o mesmo domínio para preservar o localStorage. Esta sessão não publicou alterações nem confirmou uma versão corrigida no endereço público.

## Verificação de permanência

Nova execução em 14/10/2026: o Netlify ainda entrega o seletor amplo em script.js:309, que chama save/render na linha 310. O rastreamento observou false antes do clique, false após save e false em renderDiary; nenhum submit nem atribuição true ocorreram pelo clique. Após requestSubmit exclusivamente diagnóstico, houve uma única transição false → true. O estado persistiu por 16 segundos com a lista e 16 segundos com um registro aberto programaticamente, em partidas nova e salva. Clicar no título do registro publicado também recria o DOM e impede sua abertura nativa. Não foi observada reversão true → false por timers. Isso não equivale a sucesso do fluxo publicado.

No index.html local, clique real em partida nova e salvamento antigo passou pelos mesmos 16 + 16 segundos, com abertura nativa do registro, leitura integral, reabertura do aplicativo e recarga. O perfil de teste é descartável e não contém o progresso real do usuário.

renderDiary() agora captura falhas de montagem, registra console.error e exibe um alerta sem alterar diaryUnlocked. renderPersonalDiaryContent() mantém a montagem anterior. Um teste de falha injetada confirma que o formulário bloqueado não reaparece. index.html recebeu o hash atualizado de personal.js. Não há instrumentação temporária no aplicativo; o rastreamento é injetado somente por tests/diary-permanence.browser.py.
