---
id: D-005
type: decision
title: A lista de presentes chega ao link por um documento derivado, chaveado pelo token de quem lê
status: accepted
scope: project
tags: []
governs: ["firestore.rules", "site/src/app/dados/repositorio.ts", "site/src/app/link/link.ts", "comum/lista.ts", "comum/sugestao.ts"]
refs: [NFR-003, NFR-004, NFR-001, FR-004, FR-005, FR-007, unit/001-sugestao-de-presente]
evidence: ["Plano da unit/001-sugestao-de-presente (3.1), design.md, seção Plano técnico", "Pedido do organizador (18/11/2026): não alterar o banco já gravado do sorteio"]
owner: ""
approved_by: [Rodrigo]
created: 2026-11-18
review_by: ""
supersedes: []
---

## Enunciado <!-- section: statement -->

As listas ficam em `listas/n_{chave-do-nome}` (só o organizador lê e grava). Para o link ler a lista de quem a pessoa tirou, o organizador grava, junto, um documento derivado `presentes/{token-de-quem-lê}` com os itens da lista do amigo dessa pessoa. A regra de acesso é a mesma do link: `get` liberado a quem sabe o token, e `list` e gravação só para o organizador. Nenhum documento já gravado do sorteio (participantes, sorteio, links, mensagens e dados do encontro) é alterado. Os documentos `presentes` são apagados quando o sorteio é recomeçado ou a planilha é importada de novo, e refeitos por uma sincronização (que também roda ao abrir a tela do organizador) depois que o sorteio é refeito; as listas nunca são apagadas por essas ações. Risco aceito: um participante novo com o mesmo nome de alguém que saiu da planilha herda a lista guardada desse nome.

## Justificativa <!-- section: rationale -->

| Opção | Por que sim / por que não |
| ----- | ------------------------- |
| **Documento derivado por token de quem lê** | A regra do banco só enxerga o caminho do documento; com o token no caminho, ele vira o segredo, como já é no link. Com o token de Ana só se alcança a lista de quem Ana tirou, e sem o token ninguém lista nada (NFR-003). O documento não traz nome de ninguém. Não altera nenhum documento existente (NFR-001). |
| Lista em `listas/{nome}` com leitura pública | O nome do amigo está no link de Ana, mas qualquer pessoa com um link leria a lista de qualquer outra pessoa pelo nome, e dá para adivinhar nomes da família. Fere o NFR-003. |
| Gravar `amigoToken` ou a lista dentro do documento do link | Altera os 36 documentos já gravados do sorteio e fere o NFR-001. |
| Regra que consulta o link (`get` de `links/{token}`) e compara o nome do amigo | O visitante não passa o token a uma leitura direta pelo nome; só a regra enxergaria o caminho. Exigiria repetir a normalização de nomes dentro das regras. Frágil. |

Observação sobre o critério US5-AC9 ("leitura negada" com o token de Ana): o `get` de `presentes/{token}` é liberado a quem sabe o token, como o do link. Com o token de Ana não se deriva nenhum outro caminho de leitura (a lista pelo nome e a coleção inteira são negadas), e o token de outra pessoa só é conhecido por ela, pela entropia de 128 bits.

Consequências: ao salvar uma lista, o organizador também grava o documento derivado de quem tirou a pessoa (um lote só). Ao sortear de novo, os documentos derivados são refeitos para os links novos. Se um dia o documento derivado ficar fora de sincronia com a lista, salvar a lista de novo o corrige. Não é possível ler uma lista pelo nome nem por quem a escreveu.

## Evidência <!-- section: evidence -->

Plano da unit/001-sugestao-de-presente (3.1), design.md; pedido do organizador de 18/11/2026 de não alterar o banco do sorteio já feito.

## Exemplos <!-- section: examples -->

Ana tirou Bruno e Carla tirou Ana. A lista de Bruno fica em `listas/n_bruno`. O documento `presentes/{token de Ana}` guarda os itens de Bruno, e `presentes/{token de Carla}` guarda os itens de Ana. Ana, com o próprio token, lê só os itens de Bruno.
