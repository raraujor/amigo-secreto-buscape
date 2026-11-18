# Requisitos: Sugestão de presente nos links do amigo secreto

<!-- Os IDs são permanentes. Toda linha termina com a tag da sua fonte ou `[assumption]`. -->

## Análise da intenção <!-- section: intent-analysis -->

O organizador quer que cada pessoa veja, no link que já recebeu, a lista de presentes de quem ela tirou [desc]. Só o organizador escreve as listas, em um só lugar, e os participantes apenas leem [1.1:Q1] [1.1:Q6]. O sorteio já foi realizado e nada dos dados já gravados pode mudar [desc]; as listas ficam em dados novos e separados [Q7] e acompanham o nome da pessoa, não o sorteio [Q6].

## Requisitos funcionais <!-- section: functional-requirements -->

### Escrever as listas (organizador)

- **FR-001**: O sistema deve permitir ao organizador escrever a lista de presentes de cada participante, numa caixa de texto por pessoa, com um item por linha, cada item só de texto, sem endereço de loja nem link. [Q4] [Q8] [1.1:Q1] [1.1:Q2]
  - Dado Ana sem lista, quando o organizador escreve duas linhas, "Camisa tamanho M" e "Livro da coleção Clássicos", e salva, então a lista de Ana tem dois itens, na ordem escrita. [Q4] [1.1:Q2]
  - Dado uma linha com um endereço como https://loja.exemplo.test, quando a lista é salva, então ela é um item de texto comum, sem tratamento de link. [Q8]
  - Dado linhas em branco e espaços no começo e no fim das linhas, quando o organizador salva, então as linhas em branco são ignoradas e os espaços das pontas são tirados antes de contar. [assumption]
  - Dado exatamente 20 itens de 200 caracteres cada, quando o organizador salva, então a lista é aceita; dado 21 itens, então o sistema recusa, diz que o limite é 20 itens e não grava nada; dado um item de 201 caracteres, então recusa, diz o número da linha como foi digitada e não grava nada. O limite de 200 conta todos os caracteres da linha como aparecem na tela (acento e emoji contam como 1); havendo mais de 20 itens e um item longo ao mesmo tempo, a mensagem dos 21 itens vem primeiro. [Q3] [assumption]
  - refs: site/src/app/organizador/organizador.ts, site/src/app/dados/repositorio.ts, comum/planilha.ts
- **FR-002**: O sistema deve permitir ao organizador mudar ou apagar a lista de qualquer pessoa a qualquer momento, sem prazo. [1.1:Q3]
  - Dado uma lista salva, um link de quem a tirou já aberto e o encontro ainda por vir ou já passado, quando o organizador muda um item e salva, então a próxima leitura da lista, no toque em "Ver quem eu tirei", mostra a lista nova. [1.1:Q3]
  - Dado uma lista salva, quando o organizador abre a edição dela, então a caixa de texto mostra a lista atual, sem as linhas em branco e sem os espaços das pontas.
  - Dado que o organizador salva de novo a lista de uma pessoa, então a lista salva substitui a anterior e cada pessoa continua com uma lista só. [assumption]
  - Dado que o organizador apaga todo o texto de uma lista, ou deixa só linhas em branco, e salva, então a pessoa volta a ficar "sem lista" (FR-003, FR-005). [assumption]
  - Dado que o organizador salva a lista de Ana, então a lista de Bruno não muda. [assumption]
  - Dado que o salvamento falha (por exemplo, sem rede), então o sistema avisa o organizador, não grava nada e mantém na tela o texto digitado. [assumption]
  - Dado duas abas do organizador salvando a mesma lista, então vale a última gravação. [assumption]
  - refs: site/src/app/organizador/organizador.ts, site/src/app/dados/repositorio.ts
- **FR-003**: O sistema deve mostrar, na lista de participantes do organizador, "com lista" ou "sem lista" ao lado de cada nome. [Q5]
  - Dado 36 participantes e 3 com lista salva, quando o organizador abre a lista de participantes, então 3 aparecem como "com lista" e 33 como "sem lista", também depois de recarregar a página. [Q5]
  - Dado que o organizador salva a lista de uma pessoa, então o indicador dela passa a "com lista" assim que o salvamento termina. [assumption]
  - refs: site/src/app/organizador/organizador.ts

### Guardar as listas (organizador)

- **FR-004**: O sistema deve manter as listas ligadas ao nome da pessoa, e não ao sorteio, de modo que "Recomeçar do zero", um novo sorteio ou uma nova importação não as apaguem. [Q6]
  - Dado Bruno com lista salva e o organizador usando "Recomeçar do zero", quando o sorteio é refeito, então a lista de Bruno continua salva. [Q6]
  - Dado um novo sorteio em que Ana tirou Carla em vez de Bruno, quando Ana toca em "Ver quem eu tirei", então a página mostra a lista de Carla. [Q6]
  - Dado uma nova planilha com "Bruno" (maiúsculas, acentos e espaços extras contados como no cadastro atual), quando o organizador a importa, então a lista de Bruno continua valendo; dado um nome que não está mais na planilha, então a lista dele continua guardada, sem aparecer no indicador nem em nenhum link. [Q6] [codekb]
  - refs: site/src/app/dados/repositorio.ts (importarParticipantes, recomecar), comum/planilha.ts

### Ver a lista (participante)

- **FR-005**: O sistema deve mostrar, no link de cada participante, a lista de presentes de quem ele tirou, junto do nome do amigo, depois do toque em "Ver quem eu tirei", e deve ler a lista nesse toque. [desc] [1.1:Q1] [codekb]
  - Dado que Ana tirou Bruno e Bruno tem a lista "Camisa tamanho M" e "Livro da coleção Clássicos", quando Ana abre seu link e toca em "Ver quem eu tirei", então a página mostra "Ana, você saiu com: Bruno" e os dois itens, na ordem em que o organizador os escreveu. [desc] [1.1:Q2]
  - Dado um item com um endereço como https://loja.exemplo.test, quando a página o mostra, então o endereço aparece como texto, sem se poder tocar nele. [Q8]
  - Dado um item como `<b>negrito</b>` ou `<img src=x onerror=alert(1)>`, quando a página o mostra, então ele aparece literalmente como texto e nada é executado. [assumption]
  - Dado o link de Ana antes do toque em "Ver quem eu tirei", então a página não mostra o nome do amigo nem a lista dele. [codekb]
  - Dado o texto e o destaque do nome do amigo que a página já mostra, então eles continuam como estão. [codekb]
  - refs: site/src/app/link/link.ts, comum/pagina-link.ts, site/src/app/dados/repositorio.ts
- **FR-006**: O sistema deve mostrar, no lugar da lista, o aviso "A sugestão de presente de <nome> ainda não está disponível. Volte depois." quando quem a pessoa tirou ainda não tem lista. [Q2] [1.1:Q4] [Q1]
  - Dado que Ana tirou Bruno e Bruno está sem lista, quando Ana toca em "Ver quem eu tirei", então a página mostra o nome de Bruno e o aviso "A sugestão de presente de Bruno ainda não está disponível. Volte depois.", sem lista vazia. [Q2]
  - Dado o aviso na tela de Ana e o organizador salvando a lista de Bruno depois, quando Ana reabre o mesmo link e toca em "Ver quem eu tirei", então a página mostra a lista de Bruno, sem novo link. [1.1:Q4] [assumption]
  - Dado Bruno sem lista por muito tempo, então o aviso continua aparecendo até o organizador escrever a lista, porque todas as 36 pessoas terão lista. [Q1]
  - refs: site/src/app/link/link.ts, comum/pagina-link.ts
- **FR-007**: O sistema deve mostrar, em cada link, só a lista de quem aquele participante tirou. [assumption]
  - Dado que Ana tirou Bruno e Carla tirou Ana, quando Ana abre seu link e toca em "Ver quem eu tirei", então a página mostra a lista de Bruno e não mostra a lista de Ana nem a de Carla. [assumption]
  - Dado um token que não existe, então a página continua mostrando "Link inválido, fale com o organizador." e nenhuma lista. [codekb]
  - refs: site/src/app/link/link.ts, comum/pagina-link.ts
- **FR-008**: O sistema não deve esconder o nome do amigo nem mostrar o aviso de "ainda não disponível" quando a leitura da lista falha. [assumption]
  - Dado que Ana toca em "Ver quem eu tirei" e a leitura da lista de Bruno falha (por exemplo, sem rede), então a página mostra o nome de Bruno e uma mensagem de que a sugestão não pôde ser carregada agora e que é para tentar de novo, e não mostra o aviso do FR-006. [assumption]
  - refs: site/src/app/link/link.ts

## Requisitos não funcionais <!-- section: non-functional-requirements -->

- **NFR-001**: Salvar, ler e mostrar listas não altera nem apaga nenhum dos documentos já gravados do sorteio: meta de 0 documentos com conteúdo diferente do backup de 18/11/2026 em participantes (36), sorteio (1), links (36), mensagens (36) e dados do encontro (1), sem contar os campos de uso normal (a hora de abertura do link e o status e a hora das mensagens). [desc] [Q7]
- **NFR-002**: A página do link mostra a lista inteira, com 20 itens de 200 caracteres, inclusive um item de 200 caracteres sem espaço, numa tela de celular de 360 px de largura, sem rolagem horizontal. [assumption]
- **NFR-003**: Com o token de Ana só se consegue obter a lista de quem Ana tirou, e sem nenhum token ou login se obtém 0 listas. [assumption]
- **NFR-004**: Quem não é o organizador autenticado consegue 0 gravações, alterações ou exclusões de listas. [1.1:Q1]

## Restrições <!-- section: constraints -->

- Esta funcionalidade não pode alterar nem apagar o sorteio já realizado nem os dados já gravados [desc]. A meta do NFR-001 vale enquanto o organizador não recomeçar, sortear de novo nem importar outra planilha, ações que já existem e continuam como são.
- As listas ficam em dados novos e separados no mesmo banco [Q7].
- Um backup do banco foi feito antes de começar, em 18/11/2026 [desc].
- Continuam valendo as decisões D-001 (banco e login no Firebase, plano gratuito) e D-002 (site em Angular no GitHub Pages) [memory:D-001] [memory:D-002].
- Os links já enviados continuam valendo e não mudam [assumption].

## Fora do escopo <!-- section: out-of-scope -->

- Fotos ou imagens dos presentes [1.1:Q6].
- Marcar "já comprei este item" ou reservar itens [1.1:Q6].
- Preço, valor ou busca de produtos em lojas [1.1:Q6].
- Endereço de loja e link nos itens: cada item é só texto [Q8].
- Avisar as pessoas por WhatsApp para escreverem a sugestão [1.1:Q6].
- Escrita da lista pelo participante no próprio link [1.1:Q1].
- Mudar o sorteio já feito ou a forma como sortear, importar ou recomeçar funcionam hoje, além de manter as listas (FR-004) [desc] [Q6].
- Meta numérica de preenchimento das listas [1.1:Q5].
- Histórico das listas, aviso quando uma lista muda e atualização automática da tela já aberta [assumption].

## Suposições <!-- section: assumptions -->

- [assumption] Linhas em branco são ignoradas, os espaços das pontas são tirados e um texto vazio equivale a "sem lista". Motivo: não foi perguntado o que conta como lista existente.
- [assumption] O limite de 200 caracteres conta a linha inteira, como aparece na tela. Motivo: a Q3 não diz como contar.
- [assumption] Todo texto da lista aparece como texto, nunca como código. Motivo: a lista é texto livre digitado e mostrado para 36 pessoas.
- [assumption] A lista é lida no toque em "Ver quem eu tirei", e a lista nova aparece quando o participante reabre o link e toca de novo, sem atualização automática na tela aberta. Motivo: a Q4 da 1.1 diz "volte depois" e não pede atualização ao vivo.
- [assumption] Cada pessoa tem uma lista só, salvar substitui a anterior, e com duas abas vale a última gravação. Motivo: nada foi perguntado sobre edições simultâneas e há um único organizador.
- [assumption] O indicador "com lista" / "sem lista" atualiza assim que o salvamento termina. Motivo: a Q5 pede o indicador, mas não diz quando atualiza.
- [assumption] Cada link mostra só a lista de quem a pessoa tirou, e é aceitável que quem ler a lista de uma pessoa não descubra quem a tirou. Motivo: o resultado do sorteio é secreto e o pedido fala da sugestão "de quem a pessoa tirou".
- [assumption] Falha na leitura da lista mostra uma mensagem de tentar de novo, sem esconder o nome do amigo. Motivo: a página já mostra o resultado mesmo quando a leitura dos dados do encontro falha.
- [assumption] A tela de 360 px de largura representa o celular mais comum dos participantes. Motivo: o público tem pouca aptidão a tecnologia [1.1:Q6]; a largura não foi perguntada.
- [assumption] Quem mudar a grafia de um nome na planilha (além de maiúsculas, acentos e espaços) perde a ligação com a lista, que fica guardada sem aparecer; o organizador a reescreve. Motivo: a ligação é pelo nome [Q6].
- [assumption] Os links já enviados continuam valendo. Motivo: o pedido diz só que o sorteio já foi feito e que o banco não pode ser alterado.

## Perguntas em aberto <!-- section: open-questions -->

Nenhuma.
