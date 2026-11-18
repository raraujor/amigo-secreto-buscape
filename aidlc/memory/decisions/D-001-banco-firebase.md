---
id: D-001
type: decision
title: Banco de dados e login no Firebase (Cloud Firestore + Authentication), plano Spark gratuito
status: accepted
scope: project
tags: []
governs: ["site/**", "envio/**", "firestore.rules"]
refs: [NFR-001, NFR-002, NFR-005, NFR-006, NFR-007, NFR-008, unit/001-fatia-base]
evidence: ["Q4 da 2.4 (banco externo gratuito)", "Q8 da 2.3 (usuário e senha)", "NFR-008 (sem pausa até o encontro)"]
owner: ""
approved_by: [Rodrigo]
created: 2026-11-16
review_by: ""
supersedes: []
---

## Enunciado <!-- section: statement -->

Os dados ficam no Cloud Firestore e o login do organizador no Firebase Authentication (e-mail e senha), no plano Spark gratuito, sem cartão de crédito. As regras de acesso do Firestore liberam tudo só para o UID do organizador; com a chave pública, permitem apenas `get` de um documento de link pelo identificador (nunca `list`) e a gravação única da própria abertura.

## Justificativa <!-- section: rationale -->

| Opção | Por que sim / por que não |
| ----- | ------------------------- |
| **Firebase (Firestore + Auth), Spark** | Gratuito sem cartão; não pausa por inatividade (NFR-008); regras distinguem `get` de `list`, o que dá "só o próprio resultado" pelo identificador sem servidor (NFR-007); login pronto; cota diária (50 mil leituras, 20 mil gravações) muito acima de 37 pessoas. |
| Supabase, plano Free | Postgres com RLS e login, mas o plano Free pausa o projeto após uma semana sem atividade; exigiria uma consulta periódica para manter vivo até o encontro (NFR-008). |
| Arquivo cifrado no próprio repositório | Sem serviço externo, mas não permite registrar aberturas (FR-011) nem status de envio, e contraria a Q4 da 2.4 ("não fica em arquivo"). |

Consequências: a configuração do Firebase (apiKey e projectId) é pública e fica no repositório; isso é esperado, a proteção está nas regras. A conta do organizador é criada uma vez, fora do repositório. Os testes das regras usam o emulador do Firebase, que exige Java 21 (o Java instalado hoje é o 8).

## Evidência <!-- section: evidence -->

Pesquisa de 16/11/2026: FAQ do Supabase sobre pausa de projetos Free por inatividade semanal; páginas de preço do Firebase (Spark sem cartão, cotas diárias de Firestore).

## Exemplos <!-- section: examples -->

Nenhum.
