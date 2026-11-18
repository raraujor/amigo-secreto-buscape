---
id: L-002
type: lesson
title: Em site estático com repositório público, perguntar cedo onde ficam os dados e os segredos
status: accepted
scope: project
tags: []
governs: ["aidlc/intents/**"]
refs: [NFR-002, NFR-006, NFR-007]
evidence: ["revisão Goldfish da 2.3 de 261116-sorteio-amigo-secreto-familia, 16/11/2026", "Q8 da 2.3 e Q4 da 2.4 da mesma intenção"]
owner: ""
approved_by: [Rodrigo]
created: 2026-11-16
review_by: ""
supersedes: []
---

## Enunciado <!-- section: statement -->

Quando a hospedagem é um site estático (ex.: GitHub Pages) num repositório público, a análise de requisitos (2.3) pergunta já na primeira rodada onde ficam os dados, quem pode ler e gravar o quê, e onde fica qualquer senha ou chave.

## Justificativa <!-- section: rationale -->

Um site estático não guarda dados nem confere senha, e tudo no repositório público é legível. Se a pergunta fica para depois, ela aparece na revisão independente ou numa decisão da etapa seguinte e obriga a reabrir os requisitos aprovados.

## Evidência <!-- section: evidence -->

Intenção 261116-sorteio-amigo-secreto-familia: a revisão da 2.3 apontou que o sigilo do sorteio não fechava com GitHub Pages público (NFR-006, NFR-007, Q8); na 2.4, a Q4 trouxe o banco de dados externo e a 2.3 foi reaberta.

## Exemplos <!-- section: examples -->

Nenhum.
