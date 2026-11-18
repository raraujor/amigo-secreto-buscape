---
id: D-004
type: decision
title: Recomeçar do zero é a exceção explícita à trava do novo sorteio depois do envio
status: accepted
scope: project
tags: []
governs: ["site/src/app/dados/repositorio.ts", "site/src/app/organizador/organizador.ts", "comum/confirmacao.ts"]
refs: [FR-004, FR-001, unit/002-preparacao]
evidence: ["pedido do organizador no chat durante o plano da unit/002 (18/11/2026): precisa ter alguma forma de recomeçar, talvez um botão apartado", "Q6 da 2.3: desistência ou entrada depois do sorteio, o organizador resolve à mão"]
owner: ""
approved_by: [Rodrigo]
created: 2026-11-18
review_by: ""
supersedes: []
---

## Enunciado <!-- section: statement -->

Depois que uma mensagem foi marcada como enviada, sortear de novo e importar outra lista continuam recusados (FR-004 e FR-001, sem mudança). A única saída é um botão separado, "Recomeçar do zero", com a palavra RECOMEÇAR digitada como confirmação: ele apaga o sorteio, os links e as mensagens (inclusive as enviadas) e mantém a lista de participantes e os dados do encontro. Os links já entregues passam a mostrar "Link inválido".

## Justificativa <!-- section: rationale -->

| Opção | Por que sim / por que não |
| ----- | ------------------------- |
| **Botão separado com confirmação forte** | Dá a "mão" que a Q6 da 2.3 já previa, sem enfraquecer a trava: o clique comum em "Sortear" continua recusado depois do envio. |
| Soltar a trava no próprio "Sortear" | Um clique sem querer invalidaria links já entregues em silêncio, o que o FR-004 existe para evitar. |
| Sem saída | Qualquer erro depois do envio (alguém entrou ou saiu da família) só se corrigiria apagando dados no console do Firebase. |

Consequências: quem já recebeu um link precisa receber de novo; a tela mostra antes quantas mensagens enviadas e quantas aberturas serão perdidas. O requisito FR-004 não muda: recomeçar é uma ação à parte, não um sorteio.

## Evidência <!-- section: evidence -->

Pedido do organizador no chat em 18/11/2026; Q6 da 2.3.

## Exemplos <!-- section: examples -->

Nenhum.
