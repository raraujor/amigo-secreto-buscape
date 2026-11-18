# Histórias de usuário: Sorteio do amigo secreto da família

<!-- Agrupadas pela jornada do dia 28/11 (Q3): preparar → sortear → enviar → ver o resultado → acompanhar. Todas são must (Q1). Os requisitos não funcionais entram como critérios das histórias que os exercem. -->

## Personas <!-- section: personas -->

| Persona | Papel | Objetivo | Fonte |
| ------- | ----- | -------- | ----- |
| Organizador | Monta a lista, sorteia e envia os links pelo seu WhatsApp | Sortear 37 pessoas sem pagar nada e saber quem já abriu o link | [desc] [1.1:Q1] [2.4:Q2] |
| Participante | Recebe o seu link e descobre quem tirou | Ver quem tirou sem ver o dos outros | [desc] [FR-007] |
| Responsável | Recebe no seu número os links de crianças sem WhatsApp | Saber de quem é cada link e entregá-lo à criança certa | [desc] [2.3:Q7] |

## Histórias <!-- section: stories -->

### Preparar

### US1 Entrar na área do organizador (must)

Como organizador, quero entrar numa área protegida por usuário e senha, para que só eu possa preparar, sortear, ver o resultado e enviar. [NFR-007] [2.3:Q8]

- **US1-AC1**: Dado o usuário e a senha corretos, quando entro, então acesso importar, dados do encontro, sortear, resultado, envio e acompanhamento. [NFR-007]
- **US1-AC2**: Dado uma senha errada, quando tento entrar, então não vejo nenhum nome, número ou par. [NFR-007]
- **US1-AC3**: Dado a chave pública do banco e nenhuma senha, quando alguém tenta listar participantes, pares, números ou aberturas, então recebe 0 registros. [NFR-007]
- **US1-AC4**: Dado a chave pública e o identificador do link de Ana, quando alguém consulta o banco, então obtém só o resultado de Ana. [NFR-007]
- **US1-AC5**: Dado o repositório público, quando alguém procura em todos os arquivos, então não encontra o usuário, a senha, nem nomes ou números da família. [NFR-006] [NFR-007]
- **US1-AC6**: Dado a senha pré-definida do organizador, então ela tem ao menos 12 caracteres, com letras, números e símbolos. [NFR-007]

### US2 Importar a lista da família (must)

Como organizador, quero importar uma planilha CSV com nome, WhatsApp e responsável, para que eu não digite 37 pessoas uma a uma. [FR-001] [FR-002]

- **US2-AC1**: Dado um CSV com 37 linhas e as colunas nome, whatsapp e responsavel, quando importo, então vejo 37 participantes com nome, número e responsável. [FR-001] [NFR-003]
- **US2-AC2**: Dado Maria, João e Laura com o número 34999990000 e "Maria" como responsável de João e Laura, quando importo, então os três são aceitos e o sistema registra que os links de João e Laura vão para Maria. [FR-001] [FR-002]
- **US2-AC3**: Dado Pedro, que não está na lista, como responsável de Luís, quando importo, então a linha de Luís é aceita e a mensagem de Luís se dirige a Pedro. [FR-001]
- **US2-AC4**: Dado os números "(34) 99999-0000", "+55 34 99999-0000" e "3432100000" (10 dígitos), quando importo, então os três são aceitos no formato +55; dado "349999000" (9 dígitos), então a linha é apontada como inválida. [FR-001]
- **US2-AC5**: Dado uma linha sem nome, uma sem número, ou dois participantes chamados "Ana", quando importo, então o sistema aponta a linha e não aceita a importação. [FR-001]
- **US2-AC6**: Dado um CSV com "João" e "Conceição", salvo (a) com ";" pelo Excel em português e (b) com "," em UTF-8, quando importo cada um, então os nomes aparecem com os acentos certos. [FR-001]
- **US2-AC7**: Dado o mesmo número em duas linhas sem responsável, quando importo, então a importação é aceita e aparece um aviso nomeando as duas linhas. [FR-002]
- **US2-AC8**: Dado um sorteio feito e nenhuma mensagem enviada, quando importo de novo, então o sorteio anterior é descartado, os links anteriores mostram "link inválido" e as aberturas são zeradas; dado ao menos uma mensagem enviada, então a importação é recusada. [FR-001]

### US3 Informar os dados do encontro (must)

Como organizador, quero informar a data, o local e o valor sugerido do presente, para que todos vejam essas informações no seu link. [FR-003]

- **US3-AC1**: Dado que informei "20/12/2026", "Casa da vó" e "R$ 50", quando um participante vê o seu resultado, então a página mostra os três dados. [FR-003]
- **US3-AC2**: Dado que corrigi o local para "Casa da tia" depois do envio, quando um participante vê o seu resultado, então a página mostra "Casa da tia". [FR-003]

### Sortear

### US4 Sortear o amigo secreto (must)

Como organizador, quero sortear quem tira quem, para que cada pessoa tenha exatamente um amigo secreto e ninguém tire a si mesmo. [FR-004] [FR-005]

- **US4-AC1**: Dado 37 participantes, quando sorteio, então cada um tem exatamente um amigo secreto e cada um é tirado exatamente uma vez. [FR-004]
- **US4-AC2**: Dado listas de 2, 3 e 37 participantes, sorteadas 1.000 vezes cada num teste automático, então em nenhuma vez alguém tira a si mesmo. [FR-004]
- **US4-AC3**: Dado só dois participantes, que são um casal, quando sorteio, então o sorteio é feito e cada um tira o outro (não há restrição de pares). [FR-005]
- **US4-AC4**: Dado 0 ou 1 participante, quando tento sortear, então o sistema recusa e explica o motivo. [FR-004]
- **US4-AC5**: Dado um sorteio feito e nenhuma mensagem marcada como enviada, quando sorteio de novo, então o resultado novo substitui o anterior, os links antigos mostram "link inválido" e as aberturas são zeradas. [FR-004]
- **US4-AC6**: Dado ao menos uma mensagem marcada como enviada, quando tento sortear de novo, então o sistema recusa e explica que os links já saíram. [FR-004]

### US5 Ver o resultado completo (must)

Como organizador, quero ver quem tirou quem, para que eu possa tirar dúvidas da família. [FR-006]

- **US5-AC1**: Dado um sorteio de 37 pessoas, quando abro o resultado, então vejo os 37 pares, quem tirou quem. [FR-006]

### Enviar

### US6 Gerar as mensagens e os links (must)

Como organizador, quero uma mensagem pronta por participante, com o link certo e dirigida a quem recebe, para que cada número receba links fáceis de distinguir. [FR-007] [FR-008]

- **US6-AC1**: Dado Maria (sem responsável) e João e Laura com "Maria" como responsável, todos no número de Maria, quando gero as mensagens, então há três para o número de Maria, com os textos exatos "Oi Maria, este é o seu link do amigo secreto: <link>", "Oi Maria, este é o link do amigo secreto de João: <link>" e "Oi Maria, este é o link do amigo secreto de Laura: <link>". [FR-008]
- **US6-AC2**: Dado Ana sem responsável, quando gero as mensagens, então a dela é "Oi Ana, este é o seu link do amigo secreto: <link>". [FR-008]
- **US6-AC3**: Dado 37 participantes, quando gero os links, então há 37 identificadores diferentes, cada um com ao menos 128 bits aleatórios. [FR-007] [NFR-005]

### US7 Enviar todas as mensagens automaticamente (must)

Como organizador, quero que um programa no meu computador envie as mensagens pelo meu WhatsApp, para que eu não toque em "enviar" uma a uma. [FR-009] [NFR-004]

- **US7-AC1**: Dado 37 mensagens pendentes e o meu WhatsApp conectado no computador, quando inicio o envio, então as 37 são enviadas, cada uma ao número da sua linha. [FR-009]
- **US7-AC2**: Dado o envio em andamento, quando olho a minha área no site, então vejo cada mensagem como pendente, enviada ou com falha. [FR-009]
- **US7-AC3**: Dado 37 mensagens, quando o envio roda, então cada intervalo entre duas mensagens seguidas fica entre 15 e 45 segundos e os intervalos não são todos iguais. [NFR-004]
- **US7-AC4**: Dado que o envio a um número falhou, então essa mensagem fica "com falha" e o envio segue para a próxima. [FR-009]
- **US7-AC5**: Dado que o envio parou depois de 20 mensagens enviadas com sucesso, quando retomo, então só as 17 restantes são enviadas. [FR-009]

### US8 Enviar à mão como plano B (must)

Como organizador, quero a lista de links `wa.me` de cada participante e poder marcar uma mensagem como enviada, para que eu entregue os links mesmo se a automação falhar. [FR-010]

- **US8-AC1**: Dado a mensagem de Ana, quando toco no link `wa.me` dela, então o WhatsApp abre a conversa com o número de Ana e o texto pronto. [FR-010]
- **US8-AC2**: Dado que enviei à mão a mensagem de Ana, quando toco em "Marcar como enviada", então ela fica "enviada" e o envio automático não a reenvia. [FR-010]

### Ver o resultado

### US9 Ver quem eu tirei (must)

Como participante, quero abrir o meu link e ver quem eu tirei, para que eu compre o presente sem ninguém saber. [FR-007]

- **US9-AC1**: Dado que Ana tirou Bruno, quando Ana abre o link e toca em "Ver quem eu tirei", então vê "Ana, você tirou: Bruno" e a data, o local e o valor do encontro. [FR-007]
- **US9-AC2**: Dado o link de Ana, quando a página é aberta, então em nenhum momento aparece o amigo secreto de outro participante. [FR-007] [NFR-006]
- **US9-AC3**: Dado o link de Ana com um caractere trocado, ou de um sorteio substituído, quando é aberto, então mostra "link inválido, fale com o organizador" e nenhum nome. [FR-007] [NFR-005]
- **US9-AC4**: Dado o link de Ana aberto de novo antes da data do encontro, sem novo sorteio, então mostra de novo Bruno. [FR-007]
- **US9-AC5**: Dado que o registro da abertura falha, quando Ana toca em "Ver quem eu tirei", então vê o resultado mesmo assim. [FR-011]

### US10 Entregar o link de uma criança (must)

Como responsável, quero saber de quem é cada link que chega no meu número, para que eu entregue à criança certa sem ver o resultado dela por engano. [FR-007] [FR-008]

- **US10-AC1**: Dado que Maria recebeu as mensagens de João e Laura, quando lê as mensagens, então cada uma diz "link do amigo secreto de João" ou "de Laura". [FR-008]
- **US10-AC2**: Dado o link de João aberto por Maria, quando a página carrega e antes de tocar em "Ver quem eu tirei", então a página diz que o link é de João e não mostra o nome sorteado. [FR-007]

### Acompanhar

### US11 Acompanhar quem já abriu (must)

Como organizador, quero ver quem já abriu o resultado e quem ainda não, para que eu cobre os que faltam antes do encontro. [FR-011]

- **US11-AC1**: Dado que no link de Ana alguém tocou em "Ver quem eu tirei" em 28/11/2026 às 19:05 (Brasília) e no de Bruno não, quando abro o acompanhamento, então vejo Ana como "abriu", com essa data e hora, e Bruno como "não abriu". [FR-011]
- **US11-AC2**: Dado que o link de Ana só foi carregado (ex.: prévia do WhatsApp), sem toque no botão, então Ana aparece como "não abriu". [FR-011]
- **US11-AC3**: Dado que Maria tocou no botão do link de João, então João aparece como "abriu". [FR-011]
- **US11-AC4**: Dado que no link de Ana tocaram no botão 3 vezes, então Ana aparece uma vez, como "abriu", com a data e hora da primeira. [FR-011]
- **US11-AC5**: Dado a chave pública e o identificador do link de Ana, quando alguém tenta gravar a abertura de Bruno ou alterar qualquer outro dado, então nada é gravado. [NFR-007]

## Rastreabilidade <!-- section: traceability -->

| FR     | Histórias        | Situação |
| ------ | ---------------- | -------- |
| FR-001 | US2              | covered  |
| FR-002 | US2              | covered  |
| FR-003 | US3              | covered  |
| FR-004 | US4              | covered  |
| FR-005 | US4              | covered  |
| FR-006 | US5              | covered  |
| FR-007 | US6, US9, US10   | covered  |
| FR-008 | US6, US10        | covered  |
| FR-009 | US7              | covered  |
| FR-010 | US8              | covered  |
| FR-011 | US9, US11        | covered  |

Não funcionais: NFR-001, NFR-002 e NFR-008 são restrições de toda a solução, verificadas na escolha do banco e da hospedagem no plano de construção (o NFR-008 pela documentação do plano gratuito ou pela consulta periódica); NFR-003 em US2; NFR-004 em US7; NFR-005 em US6 e US9; NFR-006 em US1 e US9; NFR-007 em US1 e US11.

## Suposições <!-- section: assumptions -->

Nenhuma nova. As histórias herdam as suposições aceitas de requirements.md.
