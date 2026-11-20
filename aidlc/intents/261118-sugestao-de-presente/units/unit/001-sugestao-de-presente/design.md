# Design: unit/001-sugestao-de-presente

<!-- Design doc no formato do Elephant-Goldfish Model (ADR 0012), escrito na 3.1 antes de qualquer código. Quem não viu a conversa precisa entender o plano só por ele. -->

## Problema <!-- section: problem -->

O sorteio já foi feito e os links já foram enviados. A unit/001 deixa o organizador escrever a lista de presentes de cada pessoa e faz o link de quem a tirou mostrar essa lista, sem alterar nenhum documento do sorteio já gravado. É a única unidade da intenção: entrega US1 a US7, FR-001 a FR-008 e NFR-001 a NFR-004 (mapa da 2.7).

| História | O que a unidade prova | Requisitos |
| -------- | --------------------- | ---------- |
| US1 | Escrever a lista de uma pessoa (caixa de texto, um item por linha, limites de 20 itens e 200 caracteres) e só o organizador gravar | FR-001, NFR-004, NFR-001 |
| US2 | Mudar e apagar a lista a qualquer momento | FR-002, NFR-004 |
| US3 | "com lista" ou "sem lista" ao lado de cada nome | FR-003 |
| US4 | As listas continuam guardadas ao recomeçar, sortear de novo ou importar outra planilha | FR-004 |
| US5 | Ver a lista de quem tirou, no toque em "Ver quem eu tirei", e só a dessa pessoa | FR-005, FR-007, NFR-001, NFR-002, NFR-003 |
| US6 | O aviso quando a lista ainda não existe | FR-006 |
| US7 | O nome do amigo continua aparecendo quando a leitura da lista falha | FR-008 |

Fica fora: fotos, "já comprei", preço, aviso por WhatsApp, escrita da lista pelo participante, endereço de loja como link, tela para listas de nomes que saíram da planilha, e qualquer mudança no jeito de sortear, importar ou recomeçar além de manter as listas.

## Plano técnico <!-- section: technical-plan -->

**Decisão central (D-005, proposta, a aceitar antes da 3.2).** Os documentos do sorteio não podem mudar. A regra do banco só enxerga o caminho do documento, então a lista de quem Ana tirou precisa estar num caminho que só Ana alcança: o token do link dela. Por isso há dois tipos de documento novos:

- `listas/{id}`: a lista de uma pessoa, ligada ao nome (FR-004). O `id` é `chaveDaLista(nome)`, que usa `chaveDoNome` de `comum/planilha.ts` (tira espaços das pontas, junta espaços repetidos, ignora maiúsculas, não ignora acento). Conteúdo: `{ nome, itens: string[], atualizadoEm }`. Só o organizador lê e grava.
- `presentes/{token}`: os itens da lista do amigo de quem tem aquele token. Conteúdo: `{ itens: string[], atualizadoEm }`, sem nome de ninguém. Quem sabe o token faz `get`; `list` e gravação só o organizador. É o que a página do link lê (FR-005, FR-007, NFR-003).

**Regras (`firestore.rules`).** Acrescentar `match /presentes/{token} { allow get: if true; allow list, write: if organizador(); }`. `listas` e qualquer outro caminho seguem na regra final, só do organizador (NFR-004). Nenhuma regra existente muda: o visitante continua gravando só `abertoEm` do próprio link. O NFR-003 é provado no emulador: o visitante não lista `presentes` nem `listas`, não lê `listas` (nem pelo nome), não grava nada, e o documento `presentes` só tem `itens` e `atualizadoEm`. O `get` de `presentes/{token}` fica liberado a quem sabe o token, como já é o do link: o "leitura negada" do critério US5-AC9 vale para tudo o que o token de Ana permite derivar (a lista pelo nome e a coleção inteira), e uma leitura de `presentes` com o token de outra pessoa só é possível a quem o conhece, o que a entropia de 128 bits do token impede (`comum/token.ts`). O desenho é aditivo e as regras antigas continuam valendo, o que um teste de regressão prova.

**Comportamento puro (`comum/lista.ts`).**
- `lerLista(texto)` devolve `{ itens }` ou um erro com código. Passos: separa por quebra de linha (aceita CRLF), tira os espaços das pontas de cada linha, ignora as linhas em branco, e conta os caracteres com `Intl.Segmenter` por grafema (cai em `Array.from` se não existir), de modo que acento e emoji contam como 1. Erros: `LISTA_ITENS_DEMAIS` (mais de 20 itens; vem antes do outro) e `LISTA_ITEM_LONGO` (uma linha com mais de 200 caracteres, com o número da linha como foi digitada, contando as em branco). Um endereço digitado é só texto.
- Em `comum/erros.ts`: `LISTA_ITENS_DEMAIS` → "O limite é de 20 itens por pessoa." e `LISTA_ITEM_LONGO` → "A linha N passa de 200 caracteres.".
- `chaveDaLista(nome)`: `"n_" + encodeURIComponent(chaveDoNome(nome.normalize("NFC")))`, com `chaveDoNome` exportada de `comum/planilha.ts`. O prefixo `n_` evita ids inválidos do Firestore (".", "..", "__x__"), e o NFC faz o "é" composto e o decomposto darem a mesma chave. A mesma função liga a lista ao participante e ao link (`link.amigo`), então a ligação é sempre a mesma.
- `textoDaLista(itens)`: os itens, um por linha, para preencher a caixa de edição.
- `resumoDeListas(participantes, listas)`: para cada participante, "com lista" ou "sem lista", pela `chaveDaLista` do nome; listas de nomes que não estão na planilha não entram.

**Comportamento da página do link (`comum/sugestao.ts`).** `estadoDaSugestao({ nome, itens, falhou })`, com o nome do amigo, os itens lidos (ou `null` se não há documento) e se a leitura falhou, devolve `{ tipo: "lista", itens }`, `{ tipo: "aviso", texto }` (com "A sugestão de presente de <nome> ainda não está disponível. Volte depois.") ou `{ tipo: "falha", texto }` ("Não foi possível carregar a sugestão agora. Recarregue a página para tentar de novo."). Documento inexistente (`null`) ou com a lista de itens vazia é "aviso"; erro de leitura é "falha", nunca "aviso". `comum/pagina-link.ts` não muda: ele segue dono do "Link inválido, fale com o organizador." e dos estados fechado e aberto, e a sugestão aparece embaixo do estado aberto.

**Repositório (`site/src/app/dados/repositorio.ts`).**
- `gravarLista(db, nome, texto)`: valida com `lerLista` (recusa sem gravar), acha, entre os links, quem tirou aquela pessoa (`chaveDaLista(link.amigo)`), e grava num commit só (um `writeBatch`) `listas/{id}` e `presentes/{token}` dessa pessoa, sem chamar `sincronizarPresentes`. Ou o commit confirma e a tela mostra a lista salva, ou falha e nada é gravado: o texto fica na tela e o indicador não muda. Texto sem itens apaga os dois. Sem sorteio, grava só a lista. Duas gravações seguidas valem pela última.
- `lerListas(db)`: as listas, para o indicador.
- `lerPresente(db, token)`: `itens` ou `null` (sem documento); erro de leitura é propagado.
- `sincronizarPresentes(db)`: refaz, a partir de `links` e `listas`, os documentos `presentes`: cria ou corrige os que faltam ou mudaram, e apaga os que não têm mais link ou lista. É idempotente, grava em commits de no máximo 200 operações, só mexe em `presentes` e usa `Timestamp.now()` do cliente em `atualizadoEm` (um valor de cliente não conta como operação extra). É chamada depois de `gravarSorteio` e ao abrir a tela do organizador, nunca dentro de `gravarLista`; se falhar, o erro é ignorado na abertura da tela e mostrado depois do sorteio, e os links já valem.
- `apagarSorteio` (usada por `importarParticipantes` e `recomecar`) passa a apagar também todos os `presentes` (listados pela coleção), nunca as `listas`. `gravarSorteio` também apaga os `presentes` antigos no seu lote e, depois do commit, chama `sincronizarPresentes`, que cria um por link novo cuja pessoa tirada tem lista (US4). O limite de 500 operações vale por commit (`writeBatch`). Contagem do commit de `gravarSorteio` com 80 pessoas: 240 exclusões (mensagens, links, presentes), 161 gravações (links, mensagens, sorteio) e 81 horas do servidor, 482 no total contando as horas, abaixo do limite de 500. `importarParticipantes` e `recomecar` não passam disso. Se `sincronizarPresentes` falhar depois do commit, os links já valem e o aviso aparece até a próxima sincronização, que acontece ao abrir a tela do organizador.
- Nenhuma função altera `links`, `participantes`, `mensagens`, `sorteios` ou `config` além do que já faziam (NFR-001).

**Limite das provas de tela.** As telas são provadas, como nas unidades anteriores do projeto, por testes que leem o código-fonte e por uma verificação manual (`testes/manual/lista-001.md`); o texto mantido na falha de salvamento, o indicador só mudar no sucesso, a leitura só no toque, o texto da lista como texto, o 360 px e a lista que aparece depois de mudar entram nessa verificação manual. A lógica que dá para testar de verdade fica em `comum/` (`lerLista`, `textoDaLista`, `resumoDeListas`, `estadoDaSugestao`).

**Telas.**
- Organizador (`site/src/app/organizador/organizador.ts`): ao lado de cada participante, "com lista" ou "sem lista" e um botão "Lista de presentes" que abre uma caixa de texto com a lista atual (de `lerListas`, com `textoDaLista`, sem linhas em branco nem espaços das pontas) e "Salvar". Erros do `lerLista` e falha de rede aparecem na tela, o texto digitado fica e nada é gravado (US2-AC6). Depois de um salvamento com sucesso a tela relê `lerListas` e o indicador muda; se falha, o indicador fica como estava.
- Página do link (`site/src/app/link/link.ts`): só em `revelar()`, depois de mostrar o nome do amigo, lê `presentes/{token}` e mostra a lista (cada item numa linha, por interpolação do Angular, nunca `innerHTML`, com quebra de linha forçada para itens longos em 360 px), o aviso ou a falha. A leitura nunca acontece antes do toque.

**Estilos (`site/src/styles.css`).** Cartões da lista de participantes, selo "com lista" e "sem lista", caixa de edição em largura total e quebra de itens longos em 360 px. Depois da primeira verificação no celular o organizador pediu um ajuste só de aparência, sem mudar comportamento, nas telas vizinhas do organizador: campo de arquivo em português ("Escolher planilha"), botões dos links do sorteio e do resultado completo em linha. Esse ajuste é cosmético e o organizador o conferiu no celular depois de publicado. Em `organizador.ts` isso troca as tabelas de participantes e de links por listas de cartões, passa o responsável para o texto de contato, põe "Copiar link" antes de "Desfazer" e encurta "Mostrar resultado (só você vê)" para "Mostrar resultado"; o campo de arquivo ganha o nome do arquivo escolhido e é limpo a cada escolha. Ler as listas nunca derruba a tela: se a leitura falhar na abertura os indicadores ficam "sem lista", e se falhar depois de salvar a gravação continua valendo.

**Publicação.** As regras vão ao banco antes do site: `npx firebase deploy --only firestore:rules --project amigo-secreto-buscape`, feito pelo organizador (exige o login dele no Firebase). Depois, o push na `main` publica o site. A reversão é republicar as regras anteriores (do git). A regra nova só acrescenta um caminho, então o site antigo continua funcionando com ela.

**Decisões pequenas.** O limite de 200 caracteres conta por grafema na linha inteira, como aparecem na tela ([FR-001] e [US1-AC5]); isso substitui a contagem por "pontos de código" que `unit-of-work.md` previa como suposição, porque emoji composto e acento decomposto contariam mais de 1. Sem `Intl.Segmenter`, cai em pontos de código. Os itens são guardados como `string[]` (a ordem é a digitada). Dois nomes que viram a mesma chave não existem, porque a importação já recusa nome repetido. A lista de um nome que saiu da planilha fica em `listas`, sem aparecer. Um documento `presentes` fora de sincronia se corrige por `sincronizarPresentes` (ao abrir a tela do organizador) ou salvando a lista de novo. Risco aceito: se um participante novo tiver o mesmo nome de alguém que saiu da planilha, ele herda a lista guardada desse nome; o organizador a vê ao abrir a edição e a corrige.

## Alternativas consideradas <!-- section: alternatives -->

| Alternativa | Por que não |
| ----------- | ----------- |
| Lista em `listas/{nome}` com leitura pública pelo nome | Qualquer pessoa com um link leria a lista de qualquer outra pelo nome, que dá para adivinhar. Fere o NFR-003. |
| Gravar a lista ou o token do amigo dentro do documento do link | Altera os 36 documentos do sorteio já gravados e fere o NFR-001. |
| Regra de leitura que consulta o link e compara o nome do amigo | A leitura direta não leva o token, e a regra teria de repetir a normalização de nomes. Frágil. |
| Contar caracteres por unidade UTF-16 ou ponto de código | Emoji composto e acento decomposto contariam mais de 1. O requisito diz "como aparecem na tela". |
| Gravar `presentes` no mesmo lote do sorteio | Passa de 500 operações com 80 pessoas contando as horas do servidor; a sincronização separada, repetível, é mais segura. |
| Duas unidades (dados e regras, depois telas) | O organizador escolheu uma unidade só (2.7, Q1). Os blocos de tarefas fazem o mesmo papel dentro dela. |
| Atualizar a tela do participante ao vivo | Não foi pedido; a lista nova aparece quando a pessoa reabre o link e toca de novo (suposição aceita na 2.3). |

## Plano de implementação <!-- section: implementation-plan -->

Na ordem das tarefas:

- `comum/lista.ts`
- `comum/lista.spec.ts`
- `comum/planilha.ts`
- `comum/erros.ts`
- `comum/erros.spec.ts`
- `comum/sugestao.ts`
- `comum/sugestao.spec.ts`
- `firestore.rules`
- `site/src/app/dados/repositorio.ts`
- `testes/regras/regras.spec.ts`
- `site/src/app/organizador/organizador.ts`
- `site/src/app/link/link.ts`
- `site/src/styles.css`
- `testes/repo/repositorio.spec.ts`
- `testes/manual/lista-001.md`
- `README.md`
