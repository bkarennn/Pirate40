PIRATE 40 — Nexus personal / Segurança e Atlas

COMO ABRIR
Abra index.html diretamente no navegador ou use Live Server no VS Code.
Todos os recursos são locais. Não há bibliotecas, tiles, APIs ou chaves externas.
Reconhecimento facial, conexão, bateria e localização são fictícios.

SEGURANÇA
Desbloqueie o dispositivo e abra Segurança.
Em "Diagnóstico do dispositivo", clique em "Iniciar evento de invasão".
Outra forma: execute startSecurityAlarm() no console ou em um gatilho narrativo.
Disparo automático: visite Mensagens, Mapa, Galeria, Anotações e Segurança,
e envie uma pergunta à IA. Volte à home e permaneça nela por 5 segundos.
Sair da home ou bloquear o dispositivo antes do disparo cancela a espera.
O evento acontece uma vez por partida. startSecurityAlarm() ignora a exploração,
mas não repete um evento concluído; reinicie a partida para testar outra vez.
Altere SECURITY_ALARM_SECONDS, no início de security.js, para ajustar os 90 segundos.
O evento abre os seis setores; todos são obrigatórios e fechados manualmente.
O prazo usa um timestamp persistido: trocar de app, bloquear ou recarregar não pausa o alarme.
Sucesso: invasão contida, portas permanecem seladas e jogo continua.
Falha: tela de eliminação por 4,5 segundos, seguida de reinício na tela de bloqueio.
O reinício limpa respostas, leituras, notificações e histórico da IA da sessão,
restaura o localizador e preserva anotações pessoais e papel de parede.
O botão de apagar progresso em Configurações continua sendo o reset completo.
O alarme usa o MP3 original da pasta em loop, com uma única instância de áudio.
O arquivo original não foi alterado. O som é preparado no desbloqueio.
Se o navegador bloquear a reprodução, clique em "Ativar som do alarme".
É possível silenciar e reativar o áudio durante a invasão.
Vitória, falha e reinício interrompem o som e retornam o áudio ao início.

DIÁLOGOS DA EMERGÊNCIA
BASE — CANAL DE EMERGÊNCIA recebe mensagens a cada 3,5 segundos.
Os remetentes, horários fictícios, histórico e leitura são salvos no navegador.
Novas mensagens não abrem o aplicativo nem apagam rascunhos de notas.
A contenção cancela falas de invasão ainda não enviadas e inicia quatro falas
de alívio. O histórico permanece após a vitória e a recarga.
A derrota limpa grupo, atividades, portas e disparo da partida.
Ajustes: SECURITY_HOME_DELAY_MS e SECURITY_MESSAGE_INTERVAL_MS em security.js.

MAPA
177 contornos de países, dados Natural Earth em domínio público.
Veja MAP-SOURCES.txt para origem e projeção.
Base fictícia: 25° S, 170° E, Pacífico Sul, próxima da Oceania.
Use + / −, arraste com mouse ou toque, ou use as setas com o mapa focado.
O botão ⌖ centraliza Pirate 40; ◎ restaura a visão ampla.
Home no teclado centraliza a posição. Zoom limitado de 1× a 8×.
Sem localizador, o marcador representa a última posição conhecida.
A cartografia interna da instalação continua indisponível nos arquivos narrativos.

ORGANIZAÇÃO
index.html, script.js, style.css: interface e recursos existentes.
ia.js, ia.css: assistente narrativo e suas respostas.
security.js, security.css: alarme, portas, contador e reinício.
map.js, map.css, world-data.js: atlas offline e controles.
Chaves de salvamento mantidas: pirate40-save-v1 e pirate40-ia-v1.

VALIDAÇÃO
Execute: node Pirate40/tests/game.test.cjs (a partir da pasta acima do projeto).
Testes de lógica com DOM e relógio simulados: nove aplicativos, contagem de 90s,
fechamento manual, clique duplicado, retomada, vitória, falha no limite,
reinício, preservação das notas, alertas, zoom, pan, centralização,
mensagens, IA, notas e persistência.
Também testados: preparação silenciosa, loop único, autoplay bloqueado,
ativação manual, parada na vitória/falha, seis pré-requisitos, espera na home,
mensagens em ordem, contadores de leitura e retomada do diálogo após recarga.
Áudio real e renderização não foram testados em navegador; os testes usam mocks.
Não substituem teste visual: não havia navegador conectado no ambiente de edição.

RITMO DAS CONVERSAS
Contatos e IA exibem “digitando…” antes de responder (1,4 a 3,4 segundos).
A duração é ajustada por typingDelay() em script.js. A pergunta aparece imediatamente.
A IA aceita uma pergunta por vez; respostas pendentes sobrevivem à recarga e são
canceladas no reinício. O grupo de emergência indica quem prepara a próxima fala.

GALERIA E PERSONAGENS
As fotografias originais de fotos/ são usadas sem renomear nem duplicar arquivos.
A pasta contém três imagens: cachorro, post-it 00:31 e post-it com girassol.
photos.js centraliza os caminhos, miniaturas e ampliação compartilhada com o chat.
Clique numa foto para ampliar; feche pelo X, Escape ou clique fora da janela.
O grupo CANAL / BASE contém a conversa antiga do cachorro (08/04/2091),
sem notificações automáticas e sem interferir na sequência da invasão.
characters.js migra nomes e identificadores antigos para Esther e Kevin,
preservando escolhas, leituras, respostas pendentes e o prazo da invasão.
Noah e os demais personagens permanecem inalterados.

CONVERSA INTERATIVA DO CACHORRO
Abra Mensagens > CANAL / BASE. As falas avançam com pausas enquanto o grupo
está aberto e o dispositivo desbloqueado; ficam pausadas durante a invasão.
A foto do cachorro só aparece na galeria após Kevin enviá-la no histórico.
Na pergunta de Kevin, escolha uma resposta. A decisão é única e salva; ambas
as versões terminam com o cachorro acolhido na base.
O campo dogStory do salvamento guarda mensagens, decisão, desbloqueio e conclusão.
Sair do app ou recarregar não reinicia a conversa. Saves anteriores começam
essa nova sequência sem alterar os outros aplicativos ou suas decisões.

IDENTIDADE, CALENDÁRIO E SINAIS VITAIS
Nova partida: nome obrigatório (até 32 caracteres), pronomes e reconhecimento
facial fictício. O perfil fica salvo; abrir novamente mostra apenas o desbloqueio.
Codinome Pirate 40 preservado. dialogueText(), playerTerms() e amelieAddress()
centralizam as adaptações. Amelie não ganha um novo evento nesta atualização.

Calendário inicial: 09/04/2091 às 23:00, independente da data do computador.
GAME_TIME_RATE em session.js controla a proporção (padrão 1:1).
O tempo avança com o dispositivo desbloqueado e a página visível; pausa ao
bloquear, trocar de aba ou fechar. Ao recarregar não acrescenta tempo ausente.
Funções: advanceGameTime(minutes), getGameDate(), saveGameTime(), resetGameTime().
Novas respostas, mensagens emergenciais e da IA usam o calendário.
O histórico antigo do cachorro e os registros antigos mantêm as datas originais.
O alarme continua usando prazo real de 90 segundos, independente do calendário.

Sinais Vitais: monitor fictício do corpo de 2091, com BPM e ECG animados.
A invasão eleva gradualmente a frequência; a contenção permite recuperação.
setVitalsState('rest'|'normal'|'tension'|'extreme') prepara eventos futuros,
sem criar sequestros ou usar sensores reais.

Configurações > Gerenciamento da Partida > REINICIAR HISTÓRIA abre confirmação.
Cancelar mantém o progresso. Reiniciar tudo interrompe áudio, cancela timers,
restaura todas as escolhas, notas, portas, desbloqueios, BPM, localizador e data,
e volta à identificação. Apenas pirate40-save-v1 e pirate40-ia-v1 são removidas
e recriadas com valores iniciais. Outros dados do navegador não são apagados.
A derrota continua sendo um reinício de sessão, preservando identidade, calendário,
anotações e papel de parede conforme a mecânica anterior.

Testes adicionais: validação de identidade, pronomes, ordem do reconhecimento,
virada da meia-noite, dias, pausa e retomada, BPM gradual, independência do prazo
da invasão, reset seletivo e cancelamento de desbloqueios pendentes.
