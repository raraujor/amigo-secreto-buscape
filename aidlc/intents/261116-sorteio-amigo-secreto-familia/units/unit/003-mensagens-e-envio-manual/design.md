# Design: unit/003-mensagens-e-envio-manual

<!-- Design doc no formato do Elephant-Goldfish Model (ADR 0012), escrito na 3.1 antes de qualquer código. Quem não viu a conversa precisa entender o plano só por ele. -->

## Problema <!-- section: problem -->

A unit/003 dá ao organizador o controle do envio à mão: cada participante tem uma mensagem pronta, gravada no banco com um status (pendente, enviada ou com falha), e o organizador marca como "enviada" a que mandou pelo WhatsApp. É esse "enviada" que faz a trava da unit/002 (sortear de novo e importar recusados depois do envio) valer de verdade no site. O que a 001 antecipou fica como está e é reaproveitado: `comum/mensagens.ts` (texto e link `wa.me`) e o botão "Enviar pelo WhatsApp" da área do organizador.

Critérios desta unidade (mapa de donos de `unit-of-work.md`, e o que a 001 e a 002 já entregaram):

| História | Critérios aqui | Requisitos |
| -------- | -------------- | ---------- |
| US6 | AC1 e AC2: uma mensagem por participante, com os textos exatos; agora gravada no banco ao sortear (o AC3, token de 128 bits, é da 001) | FR-007, FR-008, NFR-005 |
| US7 | AC2: a área mostra cada mensagem como pendente, enviada ou com falha. O estado "com falha" só é provado com dado semeado direto no banco: quem o grava é a 004 (o envio automático, AC1, AC3 a AC5, também é da 004) | FR-009 |
| US8 | AC1: o link `wa.me` abre a conversa com o número e o texto pronto (plano B); AC2, a marcação: o toque em "Enviar pelo WhatsApp" abre a conversa e já marca como enviada (decisão do organizador depois da 1.1.0; o botão separado "Marcar como enviada" foi retirado) (o "o envio automático não a reenvia" é da 004). "Desfazer" é um acréscimo deste design, sem história própria | FR-010 |
| US10 | AC1: cada mensagem de um responsável diz de quem é o link; AC2: a página do link, antes do toque, diz de quem é e não mostra o nome sorteado (já entregue e testado na 001; aqui é regressão, junto com a US9-AC2, que os testes da 001 continuam provando no mesmo gate) | FR-007, FR-008 |
| US1 | a parte nova da área do organizador (mensagens e status) só funciona com a conta do organizador: a prova aceita são as regras do banco (T009); a rota da área, atrás do login, já é testada na 001 | NFR-007 |

Fica para outras unidades: o programa que envia sozinho e grava o status "com falha" (004), o registro das aberturas e a tela completa de acompanhamento (005). O teste de trava da T007 passa pelo caminho novo (`marcarEnviada` e `desfazerEnvio`); a trava em si (US4-AC6, US2-AC8) é da 002 e continua provada lá.

## Plano técnico <!-- section: technical-plan -->

**Mensagens (`comum/mensagens.ts`), funções puras.**
- `gerarMensagens(participantes, tokens, baseUrl)`: `participantes` é a lista `{ id, nome, whatsapp, responsavel }` na ordem da planilha, `tokens` é um `Map` de `id` do participante para o token do seu link (o `id` é o do documento em `participantes`, o mesmo que `lerParticipantes` devolve; em `gravarSorteio` os tokens são os que `montarLinks` já gerou com `gerarToken`, da 001), e `baseUrl` é o endereço da página do link (`https://…/#/l/`). Devolve, na mesma ordem, `{ participanteId, token, whatsapp, texto, status: "pendente" }`, com o texto de `montarMensagem` (os textos exatos das histórias) e o link `baseUrl + token`. O `whatsapp` é **o da linha do participante**, e não se procura o número do responsável pelo nome: uma criança, na planilha, já traz o número do responsável.
- `textoDaMensagem(gravada, participante, url)`: o texto da mensagem gravada, ou, num sorteio sem mensagens gravadas, o mesmo texto montado na hora com `montarMensagem`. É o que o botão do WhatsApp usa. Na tela, `url` é o endereço da página do link, `base + token`, com a mesma `base` (`origem + caminho + "#/l/"`) que a tela já usa para os links.
- `rotuloDoStatus(status)`: "Pendente", "✓ Enviada" ou "⚠ Com falha"; qualquer outro valor, ou nenhum, é "Pendente".
- `resumoDeEnvio(n)`: "" se `n` é zero, "1 enviada" ou "N enviadas".
- Erro novo em `comum/erros.ts`: `SORTEIO_MUDOU` → "O sorteio mudou. Recarregue a página e tente de novo."

**Repositório (`site/src/app/dados/repositorio.ts`).**
- `gravarSorteio(db, { sortearFn, gerarToken, baseUrl } = {})`: o 2º e o 3º parâmetros posicionais da 001 viram opções; os testes da 001 e da 002 chamam só com o banco e continuam valendo, e o único chamador do site é `organizador.ts`. Além do que já faz, grava no mesmo lote uma `mensagens/{participanteId}` por participante, com `token`, `whatsapp`, `texto`, `status: "pendente"` e `atualizadoEm`. O padrão de `baseUrl` é um endereço de exemplo (`https://exemplo.test/#/l/`), que serve aos testes; a tela passa sempre o endereço do site, e um teste confere que ela o faz (uma inspeção do código da tela, frágil de propósito: é o único jeito automático de proteger esse ponto sem rodar a tela). Com 80 pessoas o lote tem 321 operações (80 links e 80 mensagens apagados, 80 links e 80 mensagens novos, e o sorteio), abaixo de 500; um teste faz o sorteio de 80 pessoas sobre um sorteio anterior.
- `lerMensagens(db)`: devolve um mapa `participanteId → { token, whatsapp, texto, status }`; um status ausente ou desconhecido vira `pendente`, igual ao que a trava da 002 enxerga (só "enviada" trava).
- `marcarEnviada(db, mensagem)`: recebe `{ participanteId, token, whatsapp, texto }`. Só grava se o `links/{token}` ainda existe, para não criar uma "enviada" de um sorteio que já mudou (outra aba, sorteio refeito ou recomeço); senão lança `Error("SORTEIO_MUDOU")` e nada é criado. Se `mensagens/{participanteId}` existe, atualiza `status: "enviada"` e `atualizadoEm`; se não existe (sorteio feito antes desta unidade), cria a mensagem completa já como enviada.
- `desfazerEnvio(db, participanteId)`: volta o status de uma mensagem enviada para `pendente`. Se não existir (ou já não estiver enviada), lança `SORTEIO_MUDOU` e nada muda. Desfazer a **única** enviada solta a trava da 002 de propósito; a tela avisa e pede confirmação.
- Quem lê e grava `mensagens` é só o organizador: as regras da 001 negam `get`, `list`, `create`, `update` e `delete` a qualquer outra conta e à chave pública (o `links` aceita `get` por token, `mensagens` não). O texto gravado leva o link pessoal e fica no banco até o próximo sorteio, a reimportação ou o recomeço, que o apagam.
- Toda mudança nos participantes passa pela reimportação, que apaga as mensagens (002); a tela nunca usa o texto gravado de um sorteio anterior.

**Tela do organizador (`site/src/app/organizador/organizador.ts`).** Na lista de links, cada linha mostra o rótulo do status e três ações: "💬 Enviar pelo WhatsApp" (abre o `wa.me` com `textoDaMensagem` e já marca como enviada; o rótulo vira "Enviar de novo" quando já está enviada), "Desfazer" (só aparece quando já está enviada) e "Copiar link". O título da lista passa a mostrar `resumoDeEnvio` ("Links do sorteio (37) - data - 12 enviadas"; sem nada quando zero). Depois que alguma está enviada, um aviso explica: "Os links já saíram: sortear de novo e importar outra lista ficam bloqueados. Para refazer, use Recomeçar do zero." Ao desfazer a última enviada, pede confirmação: "Esta é a única mensagem enviada. Desfazer solta a trava e deixa sortear e importar de novo. Continuar?". O erro `SORTEIO_MUDOU` mostra o texto de `mensagemDeErro`. O toque no botão do WhatsApp marca como enviada, por decisão do organizador depois da 1.1.0 (uma tela mais simples, sem um segundo botão); quem tocou e não enviou usa "Desfazer". A tela do organizador ganhou também "Copiar resultado" no resultado completo (`comum/resultado.ts`), e as páginas ganharam `noindex` (`site/src/index.html`). As telas não têm teste automático (mesmo limite da 001 e da 002); a tarefa T010 é uma verificação manual em `testes/manual/mensagens-003.md`, com marcas `[x]` e sem nomes nem links, como as anteriores.

**Sorteios feitos antes desta unidade** não têm mensagens gravadas: a tela monta o texto na hora (`textoDaMensagem`) e o status aparece como "Pendente"; o contador conta só as mensagens gravadas como enviadas; o toque em "Enviar pelo WhatsApp" (`marcarEnviada`) cria a mensagem, já como enviada. Tocar em "Enviar de novo", numa mensagem já enviada, só abre a conversa e não grava nada; se `marcarEnviada` falhar (sorteio que mudou ou rede), a conversa abre mesmo assim e a tela mostra o erro. Não há migração.

**Testes.** Funções puras com Vitest; gravação, status e trava no emulador do Firebase, em `testes/regras/regras.spec.ts`, com o mesmo gate das unidades anteriores.

## Alternativas consideradas <!-- section: alternatives -->

| Alternativa | Por que não |
| ----------- | ----------- |
| Botão separado "Marcar como enviada" | Foi a escolha original (só o organizador sabe se enviou), mas deixava a tela com dois botões para a mesma ação; o organizador pediu que o toque no botão do WhatsApp já marque, com "Desfazer" para o toque sem envio. |
| `marcarEnviada` com `merge` sem conferir o link | Criaria uma "enviada" fantasma de um sorteio que já mudou, e ela travaria o sorteio sem nenhum link válido. |
| Guardar o status dentro do documento do link | `mensagens` já é o lugar previsto no esquema e é o que a unit/004 lê para enviar; o link é o que o participante lê, e o `links` aceita leitura por token. |
| Recalcular o texto da mensagem a cada abertura da tela | O texto fica gravado uma vez ao sortear: o organizador vê o mesmo que o programa de envio da 004 vai mandar. |
| `baseUrl` obrigatório em `gravarSorteio` | Quebraria os testes da 001 e da 002, que chamam só com o banco; o padrão de exemplo mais o teste de que a tela passa o endereço protege o único caminho de produção. |
| "Marcar todas como enviadas" | Cada mensagem é conferida; marcar tudo de uma vez esconderia as que não saíram. |
| Migrar os sorteios antigos para criar as mensagens | Só há um sorteio de teste; o toque em "Enviar pelo WhatsApp" já cria a mensagem, como enviada, quando falta. |

## Plano de implementação <!-- section: implementation-plan -->

Na ordem das tarefas (os testes de cada tarefa vêm antes do código):

1. `comum/mensagens.ts`, `comum/mensagens.spec.ts`, `comum/pagina-link.spec.ts`
2. `comum/erros.ts`, `comum/erros.spec.ts`
3. `site/src/app/dados/repositorio.ts`, `testes/regras/regras.spec.ts`
4. `site/src/app/organizador/organizador.ts` (o chamador de `gravarSorteio`), `site/src/styles.css`
5. `testes/manual/mensagens-003.md`, `testes/repo/repositorio.spec.ts` (já existe da 001; ganha o teste da verificação manual e o de que a tela passa o endereço do site)
6. Mudança de comportamento decidida pelo organizador depois da aprovação do plano, que o plano passa a descrever (seção Tela do organizador e tabela de alternativas): o toque em "Enviar pelo WhatsApp" abre a conversa e já marca como enviada (`marcarEnviada`), o botão separado "Marcar como enviada" foi retirado, o rótulo vira "Enviar de novo" quando já está enviada, e "Desfazer" corrige o toque sem envio. Isso muda o que o plano aprovado dizia (o botão não marcava), e a trava da 002 passa a valer já no primeiro toque.
7. Acréscimos feitos durante e depois da unidade, a pedido do organizador, fora do comportamento das mensagens: `comum/resultado.ts` e `comum/resultado.spec.ts` (botão "Copiar resultado" no resultado completo); `site/src/index.html`, `site/public/favicon.svg`, `site/public/favicon.ico`, `site/public/apple-touch-icon.png` e `site/public/og-imagem.jpg` (prévia do link no WhatsApp, favicon de Natal e, por último, `noindex, nofollow`); `scripts/backup.ts` e `scripts/backup.spec.ts` (backup somente leitura do banco: entra com a conta do organizador, lista as cinco coleções e grava arquivos JSON em `backups/`, sem script de restauração, com os dados reais da família, tokens e telefones em texto claro no disco, por isso a pasta fica no `.gitignore` e nunca vai ao git); `.gitignore` (a pasta `backups/`); `README.md` (o fluxo de envio atual, o `noindex` e o comando do backup). O teste do `noindex` e da prévia está em `testes/repo/repositorio.spec.ts`.
