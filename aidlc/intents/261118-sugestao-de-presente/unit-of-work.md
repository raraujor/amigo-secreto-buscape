# Unidades de trabalho: Sugestão de presente nos links do amigo secreto

Na Construction, cada unidade ganha um `design.md` (design doc do EGM) e um `tasks.md` (spec-kit): estágios 3.1 e 3.2.

Uma unidade só, com tudo, por decisão do organizador (Q1), sem fatia fina separada (Q2): ela entrega a escrita das listas na tela do organizador e a leitura no link do participante. O trabalho todo fica no mesmo repositório e no mesmo site que já existem (organizador.ts, link.ts e repositorio.ts, lidos do código em 18/11/2026; o projeto não tem base de conhecimento do código, porque a 2.1 foi dispensada). As listas ficam em dados novos e separados, e os documentos do sorteio já gravado não mudam, com as ressalvas do NFR-001: a meta não vale para "Recomeçar do zero", novo sorteio e nova importação (US4-AC5) e não conta a hora de abertura do link nem o status e a hora das mensagens.

O tipo é `ui` porque o vocabulário do método não tem um tipo misto; o risco real está nos dados novos e nas regras de acesso, e por isso o plano da 3.1 os trata como o primeiro bloco de tarefas.

## Unidades <!-- section: units -->

| Unidade                         | Responsabilidade | Tipo | Tamanho |
| ------------------------------- | ---------------- | ---- | ------- |
| unit/001-sugestao-de-presente   | Dados novos das listas e regras de acesso (só o organizador autenticado grava; cada link lê só a lista de quem a pessoa tirou); tela do organizador para escrever, mudar, apagar e ver quem tem lista; listas que continuam guardadas ao recomeçar, sortear de novo ou importar outra planilha; limite de 20 itens e 200 caracteres, texto sempre mostrado como texto e tela de celular de 360 px; página do link com a lista, o aviso de lista inexistente e a mensagem de falha na leitura | ui | L |

## Dependências <!-- section: dependencies -->

```yaml
unit/001-sugestao-de-presente: []
```

## Mapa de histórias <!-- section: story-map -->

| História ou FR | Unidade                       |
| -------------- | ----------------------------- |
| US1            | unit/001-sugestao-de-presente |
| US2            | unit/001-sugestao-de-presente |
| US3            | unit/001-sugestao-de-presente |
| US4            | unit/001-sugestao-de-presente |
| US5            | unit/001-sugestao-de-presente |
| US6            | unit/001-sugestao-de-presente |
| US7            | unit/001-sugestao-de-presente |
| FR-001         | unit/001-sugestao-de-presente |
| FR-002         | unit/001-sugestao-de-presente |
| FR-003         | unit/001-sugestao-de-presente |
| FR-004         | unit/001-sugestao-de-presente |
| FR-005         | unit/001-sugestao-de-presente |
| FR-006         | unit/001-sugestao-de-presente |
| FR-007         | unit/001-sugestao-de-presente |
| FR-008         | unit/001-sugestao-de-presente |
| NFR-001        | unit/001-sugestao-de-presente |
| NFR-002        | unit/001-sugestao-de-presente |
| NFR-003        | unit/001-sugestao-de-presente |
| NFR-004        | unit/001-sugestao-de-presente |

Como a unidade é uma só, ela é dona de todos os critérios das sete histórias. Na 3.1, o plano deve organizar as tarefas em blocos com um teste de gate cada, nesta ordem de dependência interna (não é uma ordem de entrega, é o que depende do quê): (1) dados novos, regras de acesso e a ligação da lista ao nome, provados direto nas regras do banco com o emulador (NFR-003, NFR-004, US5-AC9); (2) a escrita e a tela do organizador (US1 a US3); (3) a manutenção das listas ao recomeçar, sortear de novo e importar (US4), com tarefa e prova próprias porque mexe em funções que já apagam coleções inteiras, e a prova deve mostrar que elas não apagam as listas; (4) a leitura na página do link (US5 a US7).

## Suposições <!-- section: assumptions -->

- [assumption] O modelo de acesso à lista (como o banco deixa um link ler só a lista de quem a pessoa tirou sem alterar os documentos do sorteio, e a chave do documento da lista) é uma decisão de desenho da 3.1 e precisa virar uma decisão proposta (D-NNN) levada ao seu aceite antes da 3.2. Se o plano não conseguir uma regra que satisfaça o NFR-003 sem alterar documentos existentes, a unidade volta a este estágio. Motivo: o visitante só tem o token do link e as regras do banco só veem o caminho do documento.
- [assumption] As regras do banco (firestore.rules) e o site são publicados à parte, e a 3.2 inclui publicar as regras novas antes do site, e provar no emulador que as regras antigas continuam valendo para os dados do sorteio. Motivo: o GitHub Pages só publica o site.
- [assumption] A comparação do NFR-001 com o backup de 18/11/2026 é feita no emulador com dados de teste inventados e da mesma forma do backup; o backup real, com dados da família, não entra no repositório. Motivo: dados reais nunca entram no repositório (NFR-006 da intenção anterior).
- [assumption] A 3.1 fixa a regra de nome como a do cadastro atual (tirar espaços das pontas, juntar espaços repetidos, ignorar maiúsculas, acento diferente não casa), como nas histórias US4-AC3 e US4-AC6, e a contagem de caracteres por pontos de código; o texto de FR-004 que cita "acentos" fica entendido assim. Motivo: o requisito aprovado remete ao cadastro atual.
- [assumption] Dois nomes que viram o mesmo nome normalizado não existem, porque a importação já recusa nome repetido. Motivo: regra de validação da importação (comum/planilha.ts).
- [assumption] A 3.1 inclui o plano de reversão das regras do banco (voltar às regras anteriores se as novas quebrarem o site) e não cria tela para ver ou apagar listas órfãs (nomes que saíram da planilha); isso fica fora do escopo. Motivo: nenhum requisito pede a tela e a falha de regras seria o pior caso com o sorteio já feito.
- Risco aceito pelo organizador: uma unidade só (tamanho L) significa uma revisão e um portão de implementação só; a sugestão de duas unidades (Q1, opção A) não foi adotada [Q1].
