---
id: D-002
type: decision
title: Site em Angular (TypeScript), publicado no GitHub Pages por GitHub Actions, com rotas por hash
status: accepted
scope: project
tags: []
governs: ["site/**", ".github/workflows/**"]
refs: [NFR-002, unit/001-fatia-base]
evidence: ["[desc]: 'Pode utilizar angular ou qualquer outro framework. a hospedagem será o github'"]
owner: ""
approved_by: [Rodrigo]
created: 2026-11-16
review_by: ""
supersedes: []
---

## Enunciado <!-- section: statement -->

O site é uma aplicação Angular em `site/`, construída e publicada no GitHub Pages por um workflow do GitHub Actions a cada push na branch principal. As rotas usam hash (`/#/l/<identificador>`), porque o GitHub Pages não reescreve caminhos para a aplicação. Testes com Vitest, com relatório JUnit para o gate da 3.2.

## Justificativa <!-- section: rationale -->

| Opção | Por que sim / por que não |
| ----- | ------------------------- |
| **Angular** | Citado no pedido; estrutura completa (rotas, formulários, testes) para as telas do organizador e a página do link. |
| Vite + TypeScript sem framework | Mais leve, mas cada tela seria montada à mão; o pedido citou Angular. |
| Svelte ou React | Bons, mas sem vantagem para este caso e sem menção no pedido. |

Consequências: o pacote do site é maior que o de uma página simples, o que não pesa para 37 acessos.

## Evidência <!-- section: evidence -->

Pedido original [desc].

## Exemplos <!-- section: examples -->

Nenhum.
