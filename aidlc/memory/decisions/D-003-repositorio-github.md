---
id: D-003
type: decision
title: Um repositório público no GitHub com as pastas site/ e envio/ e os tipos compartilhados em comum/
status: accepted
scope: project
tags: []
governs: ["site/**", "envio/**", "comum/**"]
refs: [NFR-002, NFR-006, unit/001-fatia-base]
evidence: ["Q1 da 2.7 (mesmo repositório, duas pastas)", "NFR-006"]
owner: ""
approved_by: [Rodrigo]
created: 2026-11-16
review_by: ""
supersedes: []
---

## Enunciado <!-- section: statement -->

Este projeto vira um repositório público no GitHub (o GitHub Pages gratuito exige repositório público). Pastas: `site/` (Angular), `envio/` (programa local, unit/004), `comum/` (tipos e funções puras usados pelos dois: participante, mensagem, sorteio). Nenhum dado da família entra no repositório; as planilhas reais ficam fora dele (`*.csv` ignorado, exceto fixtures fictícias em testes).

## Justificativa <!-- section: rationale -->

| Opção | Por que sim / por que não |
| ----- | ------------------------- |
| **Um repositório, três pastas** | Resposta da Q1 da 2.7; tipos compartilhados sem publicar pacote. |
| Dois repositórios | Recusado na Q1 da 2.7. |

## Evidência <!-- section: evidence -->

Q1 da 2.7; NFR-006.

## Exemplos <!-- section: examples -->

Nenhum.
