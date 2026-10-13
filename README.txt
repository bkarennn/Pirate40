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
Testes de lógica com DOM e relógio simulados: oito aplicativos, contagem de 90s,
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
