PIRATE 40 — Calendário oficial e registros offline

ABRIR
Abra index.html diretamente ou use Live Server. Recursos locais, sem APIs pagas,
GPS, câmera, sensores ou bibliotecas de mapas externas.

RELÓGIO
Nova partida: 31/03/2091 às 23:00. O relógio começa ao confirmar a identidade.
state.clock guarda startedReal, baseGame, offsetMs e rate no salvamento existente.
Horário = baseGame + (timestamp atual - startedReal) * rate + offsetMs.
Continua avançando com a página fechada, oculta ou o dispositivo bloqueado.
O intervalo de atualização serve apenas à interface e ao processamento online.
GAME_TIME_RATE em session.js define a proporção inicial (1:1); a taxa é salva.
Mudanças para trás no relógio do computador não fazem a narrativa retroceder.
Alterações manuais para frente afetam o tempo offline, pois não existe servidor.
advanceGameTime(minutes) permite saltos positivos e processa eventos vencidos.
getGameDate() e saveGameTime() expõem o calendário. resetGameTime() usa o reinício
completo para não deixar eventos futuros executados em uma data anterior.

EVENTOS OFICIAIS (timeline.js / STORY_EVENTS)
31/03 23:00 — ativação e registro da base oceânica.
01/04 00:31 — Kevin encontra o cachorro. As falas iniciais chegam a cada 3,5s.
01/04 00:49 — atividade física intensa, 150 BPM.
01/04 00:50 — movimento interrompido, 72 BPM; não declara morte nem a causa.
01/04 01:00 — deslocamento não programado.
01/04 10:00 — chegada à França, instalação desconhecida.
02/04 — Meu aniversário 🎂 / Mais um ano sobrevivendo. Visível antecipadamente,
sem idade, festa ou novas mensagens de personagens.

O motor processa todos os eventos vencidos em ordem e grava execução, notificação
e leitura separadamente. A abertura não marca registros automaticamente como lidos.
As notificações pendentes aparecem ao desbloquear, uma única vez.
O histórico biométrico e o de localização preservam horários oficiais dos eventos.
O calendário permite navegar por meses, selecionar dias e consultar registros.
Apenas o aniversário é antecipado; futuros acontecimentos não são revelados.

CACHORRO E FOTOS
Antes de 00:31, a conversa e a foto do cachorro ficam bloqueadas.
Retornos offline recuperam as mensagens iniciais até a pergunta de Kevin.
A decisão nunca é automática. Depois da escolha, as falas continuam com pausas
no grupo CANAL / BASE. Ambas as respostas levam ao acolhimento do cachorro.
Trocar de app ou recarregar mantém decisão, mensagens e desbloqueios.
O chip, os girassóis e os dois post-its continuam disponíveis na galeria.
As fotografias originais são reutilizadas em miniaturas e no ampliador, sem cópias.

MAPA
SVG local com 177 contornos Natural Earth (ver MAP-SOURCES.txt).
JOURNEY_WAYPOINTS define uma rota fixa entre a base oceânica e a França.
A posição é interpolada pelo horário entre 01:00 e 10:00, sem sorteio de coordenadas.
A página mostra diretamente o ponto atual ao retornar, sem reproduzir nove horas.
Controles de zoom, arraste, teclado e centralização continuam disponíveis.
O percurso e a posição são registros do dispositivo de 2091, não GPS real.
O localizador continua controlando a emissão do sinal, não a existência dos registros.

IA E AUSÊNCIA
As opções "O que aconteceu enquanto estive fora?" e "O que aconteceu recentemente?"
consultam registros reais da partida e contagem de mensagens recebidas.
O último acesso é atualizado enquanto o dispositivo está aberto e ao sair/bloquear.
A janela de ausência é mantida durante a sessão; perguntar novamente não a apaga.
O resumo recente cobre as últimas 24 horas narrativas. Não antecipa eventos.
As respostas continuam usando a animação de digitação e o histórico salvo.

INVASÃO
Condições de exploração preservadas; startSecurityAlarm() continua disponível.
A invasão não é disparada pelo relógio às 23:00. SECURITY_ALARM_SECONDS = 90
é sempre tempo real, separado do calendário e de advanceGameTime().
Portas manuais, áudio original, escolha de silenciar, vitória e falha preservados.
Uma derrota reinicia a sessão de segurança, mas preserva o relógio e o livro de
registros programados para evitar repetir eventos oficiais ou perder suas fotos.

IDENTIDADE E REINÍCIO
Nome, pronomes e reconhecimento facial fictício continuam funcionando.
Configurações > Gerenciamento da Partida > REINICIAR HISTÓRIA pede confirmação.
Ao confirmar: cancela timers, interrompe sons e restaura identidade, portas,
localizador, decisões, notas, fotos bloqueadas, BPM, calendário e históricos.
A data volta para 31/03/2091 às 23:00 e o relógio aguarda a nova identificação.
Apenas pirate40-save-v1 e pirate40-ia-v1 são removidos/recriados.
Salvamentos anteriores sem âncora offline mantêm seu horário e progresso; a âncora
é criada no primeiro carregamento desta versão e os eventos vencidos são registrados.

ARQUIVOS
script.js / style.css / index.html: dispositivo e aplicativos existentes.
session.js: identidade, tempo offline, sinais vitais e reinício.
timeline.js: agenda, histórico, ausência, resumo, calendário e posição na rota.
security.js / security.css: invasão, áudio e portas.
map.js / map.css / world-data.js: atlas SVG.
photos.js / characters.js: fotos e migração dos nomes Esther/Kevin.
ia.js / ia.css: conversas da IA.

TESTES
Execute node Pirate40/tests/game.test.cjs na pasta acima do projeto.
Usam relógio, áudio e DOM simulados. Cobrem a cronologia, retorno offline, escolha
do cachorro nos dois caminhos, fotos, biometria, rota, aniversário, resumos,
notificações sem duplicação, alarme independente, migração e reset seletivo.
A inspeção visual e reprodução real do som exigem um navegador; não havia um
navegador conectado no ambiente de edição.

CONTATOS E DIÁRIO
- personal.js reúne perfis, avatares provisórios, metadados do grupo e Diário.
- BASE_GROUP.created define a criação do grupo (15/01/2090); cinco integrantes.
- BASE_HISTORY é um histórico estático de 31/03/2091, sem notificações ou replay.
- Noah é migrado para Gustavo também em salvamentos antigos.
- ORIGINAL_DIARY é imutável. Apenas state.diary permite criar, editar e excluir registros pessoais; a interface diferencia a conexão de 2026 e as datas narrativas de 2091.
- As descobertas sobrevivem ao recarregamento e ao reinício por invasão, mas são apagadas no reinício completo da história.
- Testes: node tests/game.test.cjs (inclui perfis, integrantes, histórico, Diário e regressões).

DIÁRIO PROTEGIDO E TECH BANG
- equipment.js concentra telemetria fictícia, estado inicial editável em TECH_INITIAL e conversa interativa de aniversário. Não há controles de disparo.
- Eventos em timeline.js: lembrete privado da Mãe (31/03, 23:00), falha permanente da Tech Bang (01/04, 00:51), número desconhecido (02/04, 00:00). Processamento offline idempotente; respostas dependem de escolha.
- Diário bloqueado com senha narrativa, normalização de acentos e caixa; desbloqueio persistido. O registro sobre controle mundial não recebe data inventada.
- Reinício completo bloqueia o Diário e limpa conversas/telemetria. Reinício por invasão preserva os registros já recebidos.
- Testes incluem senha, escolhas com recarregamento, offline antes/depois de cada evento, preservação e reinício.

NOVAS CONVERSAS DA BASE
- group-story.js define DVD (01/04 06:00), alimentação (06:15), nome do cachorro (06:20) e retorno à base (02/04 09:00). Intervalos narrativos de 3 segundos; processamento offline idempotente.
- Histórico integrado ao grupo existente, ordenado por timestamp. Escolhas do cachorro e de Amélie permanecem preservadas.
- Painel remoto no grupo e em Segurança. Rotina automática às 06:16 mantém os cuidados mesmo offline; nunca há punição ao cachorro. Suprimento inteiramente fictício da base.
- Nome de até 24 caracteres, sem geração automática. Três respostas à descoberta do desaparecimento; apenas uma escolha. A conexão temporal ainda não é revelada.
- Estado em groupStory no mesmo salvamento. Reinício por invasão preserva os registros; Reiniciar História remove-os. Nenhum pareamento Wi-Fi adicionado.
