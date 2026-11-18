# Design: unit/002-preparacao

<!-- Design doc no formato do Elephant-Goldfish Model (ADR 0012), escrito na 3.1 antes de qualquer código. Quem não viu a conversa precisa entender o plano só por ele. -->

## Problema <!-- section: problem -->

A unit/002 deixa a preparação do sorteio segura: a planilha é conferida antes de entrar, o sorteio e a lista só podem ser refeitos enquanto nenhuma mensagem saiu, e o organizador vê o resultado completo. A 001 já entrega a importação simples, o sorteio, os links, o encontro (`lerEncontro`/`gravarEncontro`) e a leitura dos links; aqui entra o que sobra, conforme a seção "Entregas adicionais" do design da 001.

Critérios desta unidade (mapa de donos de `unit-of-work.md`, e o que a 001 antecipou):

| História | Critérios aqui | Requisitos |
| -------- | -------------- | ---------- |
| US2 | AC2 a AC8: responsável aceito, número em vários formatos, linha sem nome ou número, nome repetido, acentos (Excel em Windows-1252 e UTF-8, com `;` ou `,`), aviso de número repetido sem responsável, reimportação | FR-001, FR-002 |
| US3 | AC1 e AC2, já entregues na 001: aqui são testes de regressão do repositório (o que a página lê; corrigir o local depois do envio devolve o novo) | FR-003 |
| US4 | AC5 e AC6: novo sorteio antes do envio e a recusa depois dele; FR-005 como regressão | FR-004, FR-005 |
| US5 | AC1: o organizador vê os pares completos | FR-006 |
| US1 | a parte nova da área do organizador (resultado completo e encontro) só funciona com o login do organizador: provado nas regras do banco; a rota da área já é testada na 001 | NFR-007 |
| US9 | AC3 como regressão: link de um sorteio substituído mostra "link inválido" e nenhum link novo aparece como aberto (o registro das aberturas é da 005) | FR-007, FR-011 |

Fica para outras unidades: "Marcar como enviada" e o status por mensagem (003), o programa de envio (004), o registro das aberturas e a tela de acompanhamento (005). Esta unidade **lê** o status "enviada" para travar; quem o grava é a 003. Nos testes, uma mensagem enviada é gravada direto no banco, como o plano da 2.7 já previa.

## Plano técnico <!-- section: technical-plan -->

**Número de WhatsApp (`comum/whatsapp.ts`).** `normalizarWhatsapp` fica assim: só dígitos; zeros à esquerda saem; 10 ou 11 dígitos ganham `55`; o resto fica como está. O número guardado é `55` + DDD + número, só dígitos (por exemplo `5534999990000`). É válido quando bate com `55` seguido de 10 ou 11 dígitos. Ficam inválidos: menos de 10 dígitos, mais de 13, e o que o Excel mostra em notação científica (`3,4E+10` vira `3410`, curto demais).

**Validação da planilha (`comum/planilha.ts`), funções puras.**
- `decodificarCsv(bytes)`: tenta UTF-8 estrito e, se os bytes não forem UTF-8 válido (o Excel em português salva em Windows-1252), decodifica como `windows-1252`.
- `analisarPlanilha(linhas)`: devolve `{ erros, avisos }`. A linha `n` é a posição na lista mais 2 (o cabeçalho é a linha 1), que é a linha do Excel quando não há linhas em branco no meio da planilha; linhas em branco não contam, e campo com quebra de linha dentro das aspas não é suportado (a planilha é de nomes e números). Com qualquer erro a importação não é aceita; avisos não barram.
  - erro: `Linha n: falta o nome.`
  - erro: `Linha n: falta o número de WhatsApp.`
  - erro: `Linha n: o número de <nome> é inválido (<dígitos>).`
  - erro: `Nome repetido: <nome> (linhas a, b e c).` A comparação ignora maiúsculas e espaços extras ("Ana" e "ana " são o mesmo nome), mas **não** os acentos: "José" e "Jose" são nomes diferentes, para não barrar uma família que tem os dois.
  - erro: `A lista tem N pessoas; o limite é 80.` (um `writeBatch` aceita 500 operações, e cada pessoa pesa até 6 com o que se apaga e se grava).
  - aviso: `Linhas a, b e c: <nome>, <nome> e <nome> usam o mesmo número e nenhuma tem responsável; a mensagem não dirá de quem é o link.` Só quando duas ou mais linhas do mesmo número estão sem responsável; uma mãe sem responsável com filhos que a citam como responsável não gera aviso.
- Um responsável que não participa (por exemplo, "Pedro" para o "Luís") é aceito e não gera erro nem aviso.
- `prepararImportacao(bytes)`: junta tudo: decodifica, lê o CSV (`lerCsv`, que aceita `;` ou `,`), analisa e devolve `{ linhas, erros, avisos }`. Com erros, `linhas` vem vazia, então nada com erro chega ao banco. Planilha sem as colunas `nome` e `whatsapp` devolve o erro `A planilha precisa ter as colunas nome e whatsapp (e, se houver, responsavel).`

**Travas, no repositório (`site/src/app/dados/repositorio.ts`).**
- `envioIniciado(db)`: verdadeiro se existe ao menos uma `mensagens/*` com `status == "enviada"`. A consulta vai sempre ao servidor (`getDocsFromServer`, nunca ao cache) e **falha fechada**: se não conseguir conferir (sem rede, erro), lança `Error("ENVIO_INDEFINIDO")` e a operação não acontece. Só "enviada" trava; pendente e com falha não. O teste simula a falha com `disableNetwork` no emulador.
- `importarParticipantes`: se `envioIniciado`, lança `Error("ENVIO_INICIADO")` e nada muda. Senão, num único `writeBatch`, apaga os participantes antigos e o sorteio anterior (`sorteios/atual`, todos os `links` e todas as `mensagens`, que nesse ponto só podem estar pendentes ou com falha) e grava os novos. Links antigos deixam de existir, então mostram "Link inválido"; as aberturas somem junto.
- `gravarSorteio`: se `envioIniciado`, lança `Error("ENVIO_INICIADO")`. Senão, além do que já faz (apaga os links antigos e grava os novos com `abertoEm` nulo, num `writeBatch`), apaga as `mensagens` antigas.
- `lerResultado(db)`: lê os `links` do sorteio e devolve `{ participante, amigo }` na ordem da planilha, só para o organizador (as regras já negam a listagem a qualquer outra conta).
- Limite assumido: a conferência e a gravação são duas etapas, sem transação (o cliente do Firestore não faz consulta dentro de transação). Com um organizador só, o risco é de duas abas abertas ao mesmo tempo; fica registrado.

**Mensagens ao usuário (`comum/erros.ts`).** `mensagemDeErro(codigo, acao)`: `MINIMO_DOIS` ("São precisos ao menos 2 participantes para sortear."); `ENVIO_INICIADO` com `acao = "sortear"` ("Os links já saíram, então não dá para sortear de novo.") ou `acao = "importar"` ("Os links já saíram, então não dá para importar outra lista."); `ENVIO_INDEFINIDO` ("Não foi possível conferir se os links já saíram. Tente de novo."). Qualquer outro erro (inclusive permissão negada do banco) mostra só "Não foi possível concluir. Tente de novo.", sem repetir nomes nem números; os erros da planilha aparecem só na tela do organizador e não são registrados em console.

**Tela do organizador (`site/src/app/organizador/organizador.ts`).** Fina, só liga as funções acima: ao importar, chama `prepararImportacao` com os bytes do arquivo; com erros, mostra a lista de erros e não importa; sem erros, importa e mostra os avisos. Ao sortear com um sorteio já feito, pede confirmação ("Sortear de novo invalida os links atuais. Continuar?"). As recusas mostram `mensagemDeErro`. Nova seção "Resultado completo": a tabela "X tirou Y" só é lida e desenhada depois do toque em "Mostrar resultado (só você vê)", o botão passa a "Esconder resultado", e recarregar a página esconde de novo. As telas não têm teste automático (mesmo limite da 001); a tarefa T014 é uma verificação manual registrada em `testes/manual/preparacao-002.md`.

**Testes.** Funções puras com Vitest; travas e leituras no emulador do Firebase, em `testes/regras/regras.spec.ts`, com o mesmo gate da 001 (`aidlc/config.yaml` não muda).

## Alternativas consideradas <!-- section: alternatives -->

| Alternativa | Por que não |
| ----------- | ----------- |
| Travar pelo campo `sorteios/atual.enviosIniciados` | O campo já existe no esquema, mas teria de ser mantido junto com o status de cada mensagem; ler o status das próprias mensagens tem uma fonte só e é o que a 003 grava. |
| Transação do Firestore para conferir e gravar | O cliente do Firestore não consulta coleções dentro de transação; com um organizador só, ler do servidor e falhar fechado basta. |
| Validar a planilha só no banco (regras) | As regras não leem o CSV; o erro ficaria longe da linha que o causou. |
| Comparar nomes ignorando acentos | "José" e "Jose" podem ser duas pessoas da mesma família; barrar seria um erro pior do que deixar passar um nome escrito com e sem acento. |
| Detectar a codificação por heurística ou biblioteca | UTF-8 estrito com retorno para Windows-1252 cobre o Excel em português sem dependência nova. |
| Recusar o número repetido sem responsável | O pedido da família permite o mesmo número em várias pessoas; o aviso lembra que a mensagem não dirá de quem é o link, sem impedir. |
| Refazer o sorteio sem confirmação | Um clique sem querer invalidaria todos os links; um aviso na tela custa pouco. |
| Guardar o resultado completo num documento à parte | Os `links` já têm participante e amigo; um segundo documento duplicaria o dado. |

## Plano de implementação <!-- section: implementation-plan -->

Na ordem das tarefas (os testes de cada tarefa vêm antes do código):

1. `comum/whatsapp.ts`
2. `comum/planilha.ts`, `comum/planilha.spec.ts`
3. `comum/erros.ts`, `comum/erros.spec.ts`
4. `site/src/app/dados/repositorio.ts`, `testes/regras/regras.spec.ts`
5. `site/src/app/organizador/organizador.ts`, `site/src/styles.css`
6. `testes/manual/preparacao-002.md`, `testes/repo/repositorio.spec.ts` (já existe da 001; ganha o teste da verificação manual)
