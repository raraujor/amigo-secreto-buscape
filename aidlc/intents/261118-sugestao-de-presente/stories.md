# Histórias de usuário: Sugestão de presente nos links do amigo secreto

## Personas <!-- section: personas -->

| Persona | Papel | Objetivo | Fonte |
| ------- | ----- | -------- | ----- |
| Organizador | Quem fez o pedido e escreve as listas de presentes | Escrever e manter, em um só lugar, a lista de presentes de cada pessoa | [1.1:Q1] [desc] |
| Participante | Uma das 36 pessoas, com menos aptidão a tecnologia | Ler, no link que já recebeu, a lista de presentes de quem tirou | [1.1:Q1] [1.1:Q6] [desc] |

## Histórias <!-- section: stories -->

As histórias seguem a ordem do uso: primeiro o organizador escreve, depois o participante lê [Q1]. Todas são `must` [Q2]. Neste arquivo, [Q1] a [Q3] são as perguntas da 2.4; as perguntas da 2.3 aparecem como [2.3:Qn]. Os critérios marcados [assumption] vêm de suposições de requirements.md, aceitas na aprovação da 2.3 (seção Suposições). Os requisitos não funcionais entram como critérios das histórias que eles afetam, sem histórias separadas [Q3].

**Escrever as listas**

### US1 Escrever a lista de uma pessoa (must)

Como organizador, quero escrever a lista de presentes de uma pessoa, para que quem a tirou saiba o que dar. [FR-001]

- **US1-AC1**: Dado Ana sem lista, quando escrevo duas linhas, "Camisa tamanho M" e "Livro da coleção Clássicos", e salvo, então a lista de Ana tem dois itens, na ordem escrita. [FR-001]
- **US1-AC2**: Dado linhas em branco e espaços no começo e no fim das linhas, quando salvo, então as linhas em branco são ignoradas e os espaços das pontas são tirados antes de contar. [FR-001] [assumption]
- **US1-AC3**: Dado exatamente 20 itens de 200 caracteres cada, quando salvo, então a lista é aceita. [FR-001]
- **US1-AC4**: Dado 21 itens, quando salvo, então o sistema recusa, mostra "O limite é de 20 itens por pessoa." e não grava nada. [FR-001] [assumption]
- **US1-AC5**: Dado um item de 201 caracteres (a linha inteira, contando acento e emoji como 1), quando salvo, então o sistema recusa, mostra "A linha 3 passa de 200 caracteres." (3 é o número da linha como foi digitada, contando as em branco) e não grava nada. [FR-001] [assumption]
- **US1-AC6**: Dado 21 itens e um item de 201 caracteres ao mesmo tempo, quando salvo, então só a mensagem dos 21 itens aparece primeiro; a do item longo aparece depois de corrigir os itens. [FR-001] [assumption]
- **US1-AC7**: Dado uma linha com "https://loja.exemplo.test", quando salvo, então ela é um item de texto comum, sem tratamento de link. [FR-001]
- **US1-AC8**: Dado alguém que não é o organizador autenticado, quando tenta gravar, alterar ou apagar uma lista, então consegue 0 gravações. [NFR-004]
- **US1-AC9**: Dado que salvo uma lista, então os documentos já gravados do sorteio continuam com o conteúdo do backup de 18/11/2026 (36 participantes, 1 sorteio, 36 links, 36 mensagens e 1 dado do encontro), sem contar a hora de abertura do link e o status e a hora das mensagens. [NFR-001]

### US2 Mudar ou apagar a lista de uma pessoa (must)

Como organizador, quero mudar ou apagar a lista de uma pessoa a qualquer momento, para corrigir um item ou acrescentar uma ideia nova, mesmo depois de os links terem sido enviados e lidos. [FR-002]

- **US2-AC1**: Dado uma lista salva e o link de quem a tirou já aberto, quando mudo um item e salvo, então a próxima leitura da lista, no toque em "Ver quem eu tirei", mostra a lista nova, sem prazo e com o encontro de 24/12/2026 ainda por vir ou já passado. [FR-002]
- **US2-AC2**: Dado uma lista salva, quando abro a edição dela, então a caixa de texto mostra a lista atual, sem as linhas em branco e sem os espaços das pontas. [FR-002] [assumption]
- **US2-AC3**: Dado que salvo de novo a lista de uma pessoa, então a lista salva substitui a anterior e a pessoa continua com uma lista só. [FR-002] [assumption]
- **US2-AC4**: Dado que apago todo o texto de uma lista, ou deixo só linhas em branco, e salvo, então a pessoa volta a ficar "sem lista", o mesmo estado de quem nunca teve lista. [FR-002] [assumption]
- **US2-AC5**: Dado que salvo a lista de Ana, então a lista de Bruno não muda. [FR-002] [assumption]
- **US2-AC6**: Dado que o salvamento falha (por exemplo, sem rede), então o sistema me avisa, não grava nada e mantém na tela o texto que digitei. [FR-002] [assumption]
- **US2-AC7**: Dado duas abas minhas salvando a mesma lista, então vale a última gravação. [FR-002] [assumption]
- **US2-AC8**: Dado alguém que não é o organizador autenticado, quando tenta mudar ou apagar uma lista, então consegue 0 alterações. [NFR-004]

### US3 Ver quem já tem lista (must)

Como organizador, quero ver na lista de participantes quem já tem lista e quem ainda não tem, para saber quem falta escrever. [FR-003]

- **US3-AC1**: Dado 36 participantes e 3 com lista salva, quando abro a lista de participantes, então 3 aparecem como "com lista" e 33 como "sem lista", também depois de recarregar a página. [FR-003]
- **US3-AC2**: Dado que salvo a lista de uma pessoa, então o indicador dela passa a "com lista" assim que o salvamento termina com sucesso; se o salvamento falha, o indicador continua como estava. [FR-003] [assumption]

### US4 Manter as listas quando o sorteio recomeça (must)

Como organizador, quero que as listas fiquem guardadas quando eu recomeçar do zero, sortear de novo ou importar outra planilha, para não ter de digitar tudo outra vez. [FR-004]

- **US4-AC1**: Dado Bruno com lista salva e eu usando "Recomeçar do zero", quando o sorteio é refeito, então a lista de Bruno continua salva. [FR-004]
- **US4-AC2**: Dado um novo sorteio em que Ana tirou Carla em vez de Bruno, quando Ana toca em "Ver quem eu tirei", então a página mostra a lista de Carla. [FR-004]
- **US4-AC3**: Dado uma nova planilha com "Bruno" (" bruno  " e "BRUNO" valem como "Bruno", porque o cadastro atual tira os espaços das pontas, junta espaços repetidos e ignora maiúsculas; "Brúno" não vale), quando a importo, então a lista de Bruno continua valendo para os nomes que valem como "Bruno". [FR-004]
- **US4-AC4**: Dado um nome que não está mais na planilha, quando a importo, então a lista dele continua guardada, sem aparecer no indicador nem em nenhum link. [FR-004]
- **US4-AC5**: Dado que uso "Recomeçar do zero", sortear de novo ou importar outra planilha, então essas ações continuam funcionando como hoje, além de manter as listas; para essas ações a meta do NFR-001 não vale, porque elas já apagam o sorteio. [2.3:Q6] [desc]
- **US4-AC6**: Dado que a grafia de um nome mudou na planilha além de maiúsculas e espaços (por exemplo, de "Bruno" para "Brúno"), quando a importo, então a lista do nome antigo continua guardada, sem aparecer, e a pessoa fica "sem lista" até eu escrever a lista dela. [FR-004] [assumption]

**Ler a lista**


### US5 Ver a lista de quem eu tirei (must)

Como participante, quero ver a lista de presentes de quem eu tirei, no link que já tenho, para saber o que dar. [FR-005] [FR-007]

- **US5-AC1**: Dado que Ana tirou Bruno e Bruno tem a lista "Camisa tamanho M" e "Livro da coleção Clássicos", quando Ana abre seu link e toca em "Ver quem eu tirei", então a página mostra "Ana, você saiu com: Bruno" e os dois itens, na ordem em que o organizador os escreveu. [FR-005]
- **US5-AC2**: Dado o link de Ana antes do toque em "Ver quem eu tirei", então a página não mostra o nome do amigo nem a lista dele, e a lista só é lida no toque em "Ver quem eu tirei". [FR-005] [assumption]
- **US5-AC3**: Dado o texto e o destaque do nome do amigo que a página já mostra, então eles continuam como estão. [FR-005]
- **US5-AC4**: Dado um item com "https://loja.exemplo.test", quando a página o mostra, então o endereço aparece como texto, sem se poder tocar nele. [2.3:Q8]
- **US5-AC5**: Dado um item como `<b>negrito</b>` ou `<img src=x onerror=alert(1)>`, quando a página o mostra, então ele aparece literalmente como texto e nada é executado. [FR-005] [assumption]
- **US5-AC6**: Dado que Ana tirou Bruno e Carla tirou Ana, quando Ana abre seu link e toca em "Ver quem eu tirei", então a página mostra a lista de Bruno e não mostra a lista de Ana nem a de Carla. [FR-007] [assumption]
- **US5-AC7**: Dado um token que não existe, então a página continua mostrando "Link inválido, fale com o organizador." e nenhuma lista. [FR-007]
- **US5-AC8**: Dado a lista inteira, com 20 itens de 200 caracteres, inclusive um item de 200 caracteres sem espaço, quando a página é aberta numa tela de celular de 360 px de largura, então não há rolagem horizontal na página inteira. [NFR-002] [assumption]
- **US5-AC9**: Dado o token de Ana, quando se tenta ler a lista de uma pessoa que Ana não tirou, então a leitura é negada, testada direto nas regras do banco, sem passar pela página; dado nenhum token e nenhum login, então se obtém 0 listas. [NFR-003] [assumption]
- **US5-AC10**: Dado que a página lê a lista, então os documentos já gravados do sorteio continuam com o conteúdo do backup de 18/11/2026 (36 participantes, 1 sorteio, 36 links, 36 mensagens e 1 dado do encontro), sem contar a hora de abertura do link e o status e a hora das mensagens. [NFR-001]
- **US5-AC11**: Dado um link enviado antes desta funcionalidade, quando a pessoa o abre, então ele continua funcionando e mostra o nome do amigo como antes. [FR-005] [assumption]

### US6 Ver o aviso quando a lista ainda não existe (must)

Como participante, quero saber que a lista de quem eu tirei ainda não está pronta, para voltar depois em vez de achar que o link quebrou. [FR-006]

- **US6-AC1**: Dado que Ana tirou Bruno e Bruno está sem lista, quando Ana toca em "Ver quem eu tirei", então a página mostra o nome de Bruno e o aviso "A sugestão de presente de Bruno ainda não está disponível. Volte depois.", sem lista vazia. [FR-006]
- **US6-AC2**: Dado o aviso na tela de Ana e o organizador salvando a lista de Bruno depois, quando Ana reabre o mesmo link e toca em "Ver quem eu tirei", então a página mostra a lista de Bruno, sem novo link. [FR-006] [assumption]
- **US6-AC3**: Dado Bruno sem lista, quando Ana abre o link e toca em "Ver quem eu tirei" em três dias diferentes, então o aviso aparece nas três vezes, até o organizador escrever a lista. [FR-006]

### US7 Não perder o nome do amigo quando a leitura da lista falha (must)

Como participante, quero ver o nome de quem tirei mesmo que a lista não carregue, para não ficar sem o resultado do sorteio. [FR-008]

- **US7-AC1**: Dado que Ana toca em "Ver quem eu tirei" e a leitura da lista de Bruno falha (por exemplo, sem rede), então a página mostra o nome de Bruno e a mensagem "Não foi possível carregar a sugestão agora. Recarregue a página para tentar de novo." [FR-008] [assumption]
- **US7-AC2**: Dado essa falha, então a página não mostra o aviso "A sugestão de presente de Bruno ainda não está disponível." [FR-008] [assumption]

## Rastreabilidade <!-- section: traceability -->

| FR     | Histórias | Situação |
| ------ | --------- | -------- |
| FR-001 | US1       | covered  |
| FR-002 | US2       | covered  |
| FR-003 | US3       | covered  |
| FR-004 | US4       | covered  |
| FR-005 | US5       | covered  |
| FR-006 | US6       | covered  |
| FR-007 | US5       | covered  |
| FR-008 | US7       | covered  |

Requisitos não funcionais, como critérios das histórias [Q3]:

| NFR     | Histórias | Situação | Critérios                                                                                      |
| ------- | --------- | -------- | ---------------------------------------------------------------------------------------------- |
| NFR-001 | US1, US5  | covered  | US1-AC9, US5-AC10 (US2 e US3 só mudam ou mostram listas e herdam US1-AC9; US4-AC5 explica a exceção) |
| NFR-002 | US5       | covered  | US5-AC8                                                                                        |
| NFR-003 | US5       | covered  | US5-AC9                                                                                        |
| NFR-004 | US1, US2  | covered  | US1-AC8, US2-AC8                                                                               |

## Suposições <!-- section: assumptions -->

- [assumption] Valem aqui as suposições de requirements.md aceitas na aprovação da 2.3: linhas em branco ignoradas e texto vazio igual a "sem lista"; limite de 200 caracteres contando a linha inteira; texto sempre mostrado como texto; lista lida no toque e atualizada ao reabrir o link; uma lista por pessoa com última gravação valendo; indicador atualizado ao terminar de salvar; só a lista de quem a pessoa tirou; mensagem de falha sem esconder o nome; tela de 360 px; grafia do nome ligada à lista; links já enviados continuam valendo.
- [assumption] Os textos exatos das mensagens de recusa do limite ("O limite é de 20 itens por pessoa." e "A linha 3 passa de 200 caracteres.") e da falha de leitura ("Não foi possível carregar a sugestão agora. Recarregue a página para tentar de novo.") foram escolhidos aqui. Motivo: os requisitos pedem a mensagem, mas não o texto.
