PIRATE 40 — Nexus personal / Segurança e Atlas

COMO ABRIR
Abra index.html diretamente no navegador ou use Live Server no VS Code.
Todos os recursos são locais. Não há bibliotecas, tiles, APIs ou chaves externas.
Reconhecimento facial, conexão, bateria e localização são fictícios.

SEGURANÇA
Desbloqueie o dispositivo e abra Segurança.
Em "Diagnóstico do dispositivo", clique em "Iniciar evento de invasão".
Outra forma: execute startSecurityAlarm() no console ou em um gatilho narrativo.
Não há disparo automático na história; a função fica pronta para integrá-lo.
Altere SECURITY_ALARM_SECONDS, no início de security.js, para ajustar os 90 segundos.
O evento abre os seis setores; todos são obrigatórios e fechados manualmente.
O prazo usa um timestamp persistido: trocar de app, bloquear ou recarregar não pausa o alarme.
Sucesso: invasão contida, portas permanecem seladas e jogo continua.
Falha: tela de eliminação por 4,5 segundos, seguida de reinício na tela de bloqueio.
O reinício limpa respostas, leituras, notificações e histórico da IA da sessão,
restaura o localizador e preserva anotações pessoais e papel de parede.
O botão de apagar progresso em Configurações continua sendo o reset completo.
O alarme é visual e textual, sem som.

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
Não substituem teste visual: não havia navegador conectado no ambiente de edição.
