# Requisitos: Sorteio do amigo secreto da família

<!-- Os IDs são permanentes. Toda linha termina com a tag da sua fonte ou `[assumption]`. -->

## Análise da intenção <!-- section: intent-analysis -->

O organizador quer sortear o amigo secreto de 37 pessoas da família no dia 28/11/2026, sem pagar nenhum serviço [1.1:Q1] [1.1:Q2] [1.1:Q3]. Cada pessoa recebe pelo WhatsApp um link que mostra quem ela tirou, enviado automaticamente pelo número do organizador; um mesmo número pode receber links de várias pessoas, como o de uma mãe com filhos sem WhatsApp [desc] [1.1:Q6] [1.1:Q7] [Q7]. O organizador acompanha quem já abriu o link, e os dados ficam num banco de dados gratuito, não em arquivos [2.4:Q2] [2.4:Q4].

## Requisitos funcionais <!-- section: functional-requirements -->

### Participantes

- **FR-001**: O sistema deve permitir ao organizador importar os participantes de uma planilha, com o nome, o número de WhatsApp e, opcionalmente, o nome do responsável que recebe o link por quem não tem WhatsApp. [Q5] [Q7] [desc]
  - Dado uma planilha CSV com as colunas nome, WhatsApp e responsável e 37 linhas, quando o organizador a importa, então o sistema lista os 37 participantes com seus nomes, números e responsáveis. [Q5] [Q7] [1.1:Q2]
  - Dado que João tem o número da Maria e "Maria" na coluna responsável, quando o organizador importa, então o sistema registra que o link de João vai para Maria, no número da linha de João. [Q7]
  - Dado um responsável que não é participante (ex.: uma mãe que não joga), quando o organizador importa, então a linha é aceita e a mensagem se dirige a esse nome. [assumption]
  - Dado uma linha sem nome ou sem número, quando o organizador importa a planilha, então o sistema aponta a linha com problema e não aceita a importação até ela ser corrigida. [assumption]
  - Dado dois participantes com o mesmo nome, quando o organizador importa a planilha, então o sistema avisa o nome repetido e não aceita a importação. [assumption]
  - Dado o número "(34) 99999-0000", quando o organizador importa, então o sistema o guarda como +55 34 99999-0000; dado um número com menos de 10 dígitos depois de tirar o DDI, então aponta a linha como inválida. [assumption]
  - Dado um CSV separado por ";" ou por ",", com acentos em UTF-8 ou no padrão do Excel em português, quando o organizador importa, então os nomes aparecem com os acentos certos. [assumption]
  - Dado um sorteio feito e nenhuma mensagem enviada, quando o organizador importa a planilha de novo, então o sorteio anterior é descartado, os links anteriores mostram "link inválido" e os registros de abertura são zerados; dado ao menos uma mensagem enviada, então o sistema recusa a nova importação. [assumption]
- **FR-002**: O sistema deve aceitar o mesmo número de WhatsApp em mais de um participante. [desc]
  - Dado que Maria e seus filhos João e Laura têm o número de Maria na planilha, quando o organizador importa, então os três participantes são aceitos, cada um com esse número. [desc] [Q7]
  - Dado um número repetido em duas linhas, nenhuma delas com responsável, quando o organizador importa, então o sistema avisa (sem bloquear) que essas mensagens vão ao mesmo número sem dizer de quem é o link. [assumption]

### Dados do encontro

- **FR-003**: O sistema deve permitir ao organizador informar e corrigir a data, o local e o valor sugerido do presente, que valem para todos os participantes. [Q4]
  - Dado que o organizador informou "20/12/2026", "Casa da vó" e "R$ 50", quando um participante abre seu link, então a página mostra esses três dados. [Q4]
  - Dado que o organizador corrigiu o local depois do envio, quando um participante abre seu link, então a página mostra o local corrigido. [assumption]

### Sorteio

- **FR-004**: O sistema deve sortear, para cada participante, exatamente uma pessoa a presentear, de forma que cada participante seja tirado por exatamente uma pessoa. [desc]
  - Dado 37 participantes, quando o organizador sorteia, então cada um tem exatamente um amigo secreto e cada um aparece exatamente uma vez como amigo secreto de alguém. [desc] [1.1:Q2]
  - Dado listas de 2, 3 e 37 participantes, sorteadas 1.000 vezes cada, então em nenhuma vez alguém tira a si mesmo. [1.1:Q4]
  - Dado uma lista com menos de 2 participantes, quando o organizador tenta sortear, então o sistema recusa e explica o motivo. [assumption]
  - Dado um sorteio feito e nenhuma mensagem marcada como enviada (FR-009 ou FR-010), quando o organizador sorteia de novo, então o novo resultado substitui o anterior, os links anteriores mostram "link inválido" e os registros de abertura são zerados. [assumption]
  - Dado ao menos uma mensagem marcada como enviada, quando o organizador tenta sortear de novo, então o sistema recusa e explica que os links já saíram. [assumption]
- **FR-005**: O sistema não deve ter restrição de pares além de ninguém tirar a si mesmo. [Q1]
  - Dado um casal na lista, quando o organizador sorteia, então um pode tirar o outro. [Q1]
- **FR-006**: O sistema deve mostrar ao organizador o resultado completo do sorteio (quem tirou quem). [Q2]
  - Dado um sorteio feito, quando o organizador abre o resultado, então vê os 37 pares. [Q2] [1.1:Q2]

### Link de cada participante

- **FR-007**: O sistema deve gerar um link individual por participante, que mostra de quem é o link, o nome de quem ele tirou e os dados do encontro. [desc] [Q4] [Q7]
  - Dado que Ana tirou Bruno, quando o link de Ana é aberto e alguém toca em "Ver quem eu tirei", então a página mostra "Ana, você tirou: Bruno" e a data, o local e o valor sugerido. [desc] [Q4] [Q7] [assumption]
  - Dado o link de Ana, quando alguém o abre, então a página não mostra quem os outros participantes tiraram. [assumption]
  - Dado o link de Ana aberto várias vezes até a data do encontro (FR-003), sem novo sorteio, então mostra sempre o mesmo amigo secreto. [assumption]
  - Dado um identificador que não existe ou de um sorteio substituído, quando alguém abre o link, então a página mostra "link inválido, fale com o organizador" e nenhum nome. [assumption]
- **FR-008**: O sistema deve gerar, para cada participante, um link `wa.me` para o número desse participante com uma mensagem pronta que diz a quem se dirige, de quem é o link e contém o link individual. [1.1:Q6] [Q3] [Q7]
  - Dado que Maria participa e seus filhos João e Laura têm o número de Maria e "Maria" como responsável, quando o sistema gera as mensagens, então gera três mensagens para o número de Maria, com estes textos: "Oi Maria, este é o seu link do amigo secreto: <link>", "Oi Maria, este é o link do amigo secreto de João: <link>" e "Oi Maria, este é o link do amigo secreto de Laura: <link>". [Q3] [Q7] [desc]
  - Dado um participante sem responsável, quando o sistema gera sua mensagem, então ela se dirige ao próprio participante: "Oi Ana, este é o seu link do amigo secreto: <link>". [Q7]

### Envio pelo WhatsApp

- **FR-009**: O sistema deve enviar automaticamente as mensagens de todos os participantes pelo WhatsApp do organizador, abrindo cada link `wa.me` e enviando a mensagem, sem o organizador clicar em cada uma. [1.1:Q6] [1.1:Q7]
  - Dado 37 mensagens geradas e o WhatsApp do organizador conectado no computador, quando o organizador inicia o envio, então as 37 mensagens são enviadas, uma por participante, aos números da planilha. [1.1:Q7] [1.1:Q2]
  - Dado o envio em andamento, quando o organizador olha a lista na sua área do site, então vê cada mensagem como pendente, enviada ou com falha. [assumption]
  - Dado que o envio para um número falhou, então o sistema marca essa mensagem com falha e segue para a próxima. [assumption]
  - Dado que o envio parou no meio (ex.: queda de internet), quando o organizador o retoma, então só as mensagens pendentes ou com falha são enviadas. [assumption]
- **FR-010**: O sistema deve mostrar ao organizador a lista de links `wa.me` de cada participante, para que ele possa enviar à mão qualquer um deles. [assumption]
  - Dado que a automação falhou para Ana, quando o organizador clica no link `wa.me` de Ana, então o WhatsApp abre a conversa com o número de Ana e a mensagem pronta. [assumption]
  - Dado que o organizador enviou à mão a mensagem de Ana, quando ele toca em "Marcar como enviada", então a mensagem de Ana passa a constar como enviada e o envio automático não a reenvia. [assumption]

### Acompanhamento

- **FR-011**: O sistema deve registrar automaticamente quando cada participante vê o seu resultado (toca em "Ver quem eu tirei" no seu link) e mostrar ao organizador quem já abriu e quem não abriu. [2.4:Q2] [2.4:Q4]
  - Dado que no link de Ana alguém tocou em "Ver quem eu tirei" e no de Bruno não, quando o organizador abre o acompanhamento, então vê Ana como "abriu" (com data e hora da primeira vez, no horário de Brasília) e Bruno como "não abriu". [2.4:Q2] [2.4:Q4] [assumption]
  - Dado que o link de Ana só foi carregado, sem tocar em "Ver quem eu tirei" (ex.: prévia do link gerada pelo WhatsApp), então Ana continua como "não abriu". [assumption]
  - Dado que no link de João, cuja responsável é Maria, alguém tocou em "Ver quem eu tirei", então João aparece como "abriu", sem distinguir se foi ele ou Maria. [assumption]
  - Dado que no link de Ana tocaram em "Ver quem eu tirei" três vezes, quando o organizador abre o acompanhamento, então Ana aparece uma vez, como "abriu". [assumption]
  - Dado que o registro da abertura falha (banco fora do ar), quando alguém toca em "Ver quem eu tirei", então a página mostra o resultado mesmo assim. [assumption]

## Requisitos não funcionais <!-- section: non-functional-requirements -->

- **NFR-001**: Custo de operação de R$ 0 (nenhum serviço pago, nenhum plano pago). [1.1:Q1] [1.1:Q6]
- **NFR-002**: O site fica hospedado no GitHub (GitHub Pages ou equivalente gratuito do GitHub), sem servidor próprio pago; os participantes, os dados do encontro, o resultado do sorteio, o status de envio e o registro de aberturas ficam num banco de dados externo com plano gratuito, não em arquivos do site ou do repositório. [desc] [1.1:Q1] [2.4:Q4] [assumption]
- **NFR-003**: Suporta ao menos 37 participantes num sorteio. [1.1:Q2]
- **NFR-004**: O envio automático espera um intervalo aleatório entre 15 e 45 segundos entre mensagens, para reduzir o risco de bloqueio do número (37 mensagens em até ~30 minutos). [assumption]
- **NFR-005**: O link de um participante não pode ser adivinhado: contém um identificador aleatório de ao menos 128 bits, e trocar qualquer caractere dele não abre o resultado de outra pessoa. [assumption]
- **NFR-006**: Nenhum dado do sorteio (nomes, números de WhatsApp, pares) fica legível em público no repositório ou no site do GitHub; a página de um link revela apenas o resultado daquele participante. [assumption]
- **NFR-007**: Só o organizador, com um usuário e uma senha forte pré-definidos, consegue importar participantes, sortear, ver o resultado completo, corrigir os dados do encontro, ver o acompanhamento e enviar as mensagens; sem eles, quem tem o endereço do site só vê o resultado do link que recebeu. [Q8]
  - Dado a chave pública do banco (a que fica no código do site) e nenhuma senha, quando alguém tenta listar participantes, pares, números ou aberturas, então recebe 0 registros. [Q8] [2.4:Q4] [assumption]
  - Dado a chave pública e o identificador do link de Ana, quando alguém consulta o banco, então obtém só o resultado de Ana e só consegue gravar a abertura do link de Ana; nada mais é gravado ou alterado. [Q8] [2.4:Q4] [assumption]
  - Dado o usuário e a senha corretos, quando o organizador entra, então acessa importar, sortear, resultado, dados do encontro, acompanhamento e envio. [Q8]
  - Dado o repositório público, quando alguém lê todos os seus arquivos, então não encontra o usuário nem a senha do organizador. [Q8] [assumption]
  - A senha tem ao menos 12 caracteres, com letras, números e símbolos. [Q8] [assumption]
- **NFR-008**: O plano gratuito do banco de dados atende 37 participantes e fica disponível, sem ação manual do organizador, de 16/11/2026 até ao menos a data do encontro (FR-003). Antes da escolha do banco, conferir na documentação do plano que ele não pausa por inatividade em menos de 14 dias, ou prever uma consulta automática periódica que o mantenha ativo. [2.4:Q4] [1.1:Q2] [assumption]

## Restrições <!-- section: constraints -->

- Pronto e testado antes de 28/11/2026. [1.1:Q3]
- O envio usa o número de WhatsApp do próprio organizador, não uma conta comercial nem a API oficial. [1.1:Q6] [1.1:Q7]
- O envio automático roda no computador do organizador, com o WhatsApp dele conectado; não roda na hospedagem do GitHub. Ele lê as mensagens do banco com o acesso do organizador e grava ali o status de cada envio, que o organizador vê na sua área do site. [assumption]
- A ferramenta de automação e o banco de dados são escolhidos no plano de construção pelo critério do pedido: "veja qual é o melhor e gratuito". [desc] [2.4:Q4]
- Framework livre (Angular ou outro). [desc]
- O organizador aceitou o risco baixo, mas real, de bloqueio do número pela automação não oficial. [1.1:Q7]

## Fora do escopo <!-- section: out-of-scope -->

- Pares proibidos (casais, mesma casa, lista manual). [Q1]
- Tratar desistência ou entrada de participantes depois do sorteio; se acontecer, o organizador resolve à mão. [Q6]
- Lista de presentes. [1.1:Q5]
- Login ou cadastro com senha de participantes. [1.1:Q5]
- Vários grupos, outras famílias ou outros anos. [1.1:Q5]
- API paga ou oficial do WhatsApp. [1.1:Q6]

## Suposições <!-- section: assumptions -->

Aceitas pelo organizador no chat (16/11/2026), ainda como suposições:

- [assumption] FR-001: a planilha é um arquivo CSV (Excel e Google Planilhas salvam CSV), não um .xlsx. Motivo: a Q5 diz "planilha (CSV/Excel)" sem escolher; CSV basta. As colunas foram confirmadas na Q7.
- [assumption] FR-001: linha incompleta ou nome repetido barra a importação. Motivo: dois "Ana" tornariam a mensagem "link de Ana" ambígua; a família distingue (ex.: "Ana Paula").
- [assumption] FR-001: número sem código de país é tratado como brasileiro (+55). Motivo: família no Brasil (pedido em pt-BR).
- [assumption] FR-004: menos de 2 participantes é recusado. Motivo: com 1 pessoa não há sorteio possível.
- [assumption] FR-009: o envio pode ser retomado sem repetir mensagens já enviadas. Motivo: 37 envios em ~30 min podem ser interrompidos, e reenviar confundiria a família.
- [assumption] FR-010: a lista de links `wa.me` fica visível como plano B do envio automático. Motivo: risco de a automação falhar no dia.
- [assumption] NFR-004: intervalo de 15 a 45 s entre mensagens. Motivo: reduzir o risco de bloqueio aceito na 1.1 (Q7); valor ajustável.
- [assumption] NFR-005: link não adivinhável. Motivo: sem isso, um participante poderia ver o resultado de outro.
- [assumption] FR-001: o responsável pode não ser participante. Motivo: uma mãe pode receber os links dos filhos sem jogar.
- [assumption] FR-001: números com parênteses, espaços e traços são normalizados; menos de 10 dígitos é inválido.
- [assumption] FR-001: CSV com ";" ou "," e acentos do Excel em português.
- [assumption] FR-002: número repetido sem responsável gera aviso, sem bloquear.
- [assumption] FR-004: sortear de novo antes do envio substitui o resultado anterior.
- [assumption] FR-007: o mesmo link mostra sempre o mesmo resultado.
- [assumption] FR-009: a lista mostra pendente, enviada ou com falha, e uma falha não para o envio.
- [assumption] NFR-006: nada do sorteio fica público no GitHub.
- [assumption] Restrições: a automação roda no computador do organizador.

Da reabertura (2.4: Q2 e Q4) e da segunda revisão independente, a confirmar:

- [assumption] FR-011 e FR-007: a abertura conta quando alguém toca em "Ver quem eu tirei" na página, não quando ela só carrega. Motivo: a prévia de link do WhatsApp carrega a página sozinha e marcaria todos como "abriu".
- [assumption] FR-011: o link de uma criança aberto pelo responsável conta como "abriu"; mostra data e hora da primeira vez (Brasília); cada participante conta uma vez; se o registro falhar, o resultado aparece mesmo assim. Motivo: medir "37 de 37 viram" sem contar em dobro e sem prejudicar quem abre.
- [assumption] FR-004, FR-001 e FR-010: depois que uma mensagem é marcada como enviada (automática ou à mão), sortear de novo e reimportar a planilha ficam bloqueados; antes disso, um novo sorteio invalida os links antigos e zera as aberturas. Motivo: um link já entregue não pode mudar em silêncio.
- [assumption] FR-003: os dados do encontro podem ser corrigidos a qualquer momento e o link mostra a versão atual. Motivo: um erro de digitação no local precisa poder ser corrigido depois do envio.
- [assumption] FR-007: o link mostra o resultado até a data do encontro (FR-003), não só até 28/11; um link inexistente ou substituído mostra "link inválido". Motivo: o dia 28/11 é o do sorteio; a troca de presentes pode ser depois.
- [assumption] FR-007: a página não mostra o resultado dos outros. Motivo: "amigo secreto" é, por definição, segredo; a família não pode ver os pares de outros.
- [assumption] FR-008: o texto usa "de João" / "de Laura", sem "do"/"da". Motivo: a planilha não tem gênero.
- [assumption] NFR-002: o banco guarda também o resultado do sorteio e o status de envio, não só participantes e dados. Motivo: a Q4 da 2.4 diz "participantes e os dados"; sem isso, o resultado ficaria em arquivo.
- [assumption] NFR-007: a proteção vale contra quem consulta o banco com a chave pública (lê só o próprio link, grava só a própria abertura); o usuário e a senha não ficam no repositório; senha de 12+ caracteres. Motivo: num site estático a chave do banco é pública.
- [assumption] NFR-008: o banco fica ativo até a data do encontro; o plano é conferido antes da escolha ou mantido ativo por consulta periódica. Motivo: alguns planos gratuitos pausam projetos parados por cerca de 7 dias.
- [assumption] Restrições: a automação lê as mensagens do banco e grava o status ali, e o organizador vê o status no site. Motivo: um site estático não inicia um programa local; os dois precisam compartilhar o estado pelo banco.

## Perguntas em aberto <!-- section: open-questions -->

Nenhuma.
