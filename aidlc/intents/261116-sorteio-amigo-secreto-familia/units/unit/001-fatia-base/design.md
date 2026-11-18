# Design: unit/001-fatia-base

<!-- Design doc no formato do Elephant-Goldfish Model (ADR 0012), escrito na 3.1 antes de qualquer código. Quem não viu a conversa precisa entender o plano só por ele. -->

## Problema <!-- section: problem -->

A unit/001 é a base de todo o sistema e uma fatia fina de ponta a ponta (2.7, Q2): o organizador entra com usuário e senha, importa um CSV, sorteia e cada participante abre um link que mostra quem tirou. Ela cria o que as outras unidades usam: o repositório, o site publicado, o banco com o esquema completo e as regras de acesso.

Critérios desta unidade (mapa de donos de `unit-of-work.md`):

| História | Critérios aqui | Requisitos |
| -------- | -------------- | ---------- |
| US1 | AC1 (entrar e ver a área com importar e sortear), AC2, AC3, AC4, AC5, AC6 | NFR-006, NFR-007 |
| US2 | AC1 (CSV com nome, whatsapp e responsavel; 37 linhas na tela) | FR-001, FR-002, NFR-003 |
| US4 | AC1 a AC4 (sorteio válido, sem autossorteio, sem pares proibidos, mínimo 2) | FR-004, FR-005 |
| US6 | AC3 (identificadores de 128 bits gerados no sorteio) | FR-007, FR-008, NFR-005 |
| US9 | AC1 (sem os dados do encontro), AC2, AC3 (identificador inexistente), AC4 | FR-007 |

Também: estrutura do repositório (D-003), Firebase (D-001), site Angular no GitHub Pages (D-002); NFR-001, NFR-002 e NFR-008 pela escolha do D-001; e o campo de abertura no esquema (FR-011). A regra de gravação pública da abertura é criada e testada aqui quanto ao que ela **impede**; o registro da abertura em si (US11-AC5) é provado na unit/005.

Fica para outras unidades: validações do CSV (formatos de número, nomes repetidos, linhas incompletas, Windows-1252), reimportação com sorteio existente, dados do encontro, resultado completo, novo sorteio e bloqueio após envio (002); mensagens `wa.me`, plano B e tela de status (003); programa de envio (004); registro e tela de aberturas (005).

## Plano técnico <!-- section: technical-plan -->

**Pré-requisitos, e quem providencia.** Antes da T009 (emulador) e da T014 (publicação):

| Item | Quem | Como |
| ---- | ---- | ---- |
| Java 21 (o emulador do Firebase não roda com o Java 8 instalado) | Rodrigo instala, ou autoriza o agente a rodar `winget install EclipseAdoptium.Temurin.21.JDK` | conferido pela T009 |
| Node 22 | já instalado (v22.17.0) | — |
| Dependências | T001: a raiz é um workspace npm (`"workspaces": ["site"]`) com `vitest`, `firebase-tools` e `tsx`; o projeto Angular é criado já na T001 com `ng new site`, e o `firebase` (SDK web) vai em `site/package.json`. O npm instala uma cópia só do `firebase`, na raiz, usada pelo site, por `repositorio.ts` e pelos testes | um `npm install` na raiz |
| Projeto Firebase no plano Spark, com login por e-mail e senha ligado, e a configuração web (apiKey, projectId, authDomain, appId) | Rodrigo, no console do Firebase | a configuração vai para `site/src/environments/environment.ts` (é pública por natureza) |
| Conta do organizador e seu UID | Rodrigo roda `scripts/criar-organizador.ts` (T008); o UID vai para `firestore.rules` | — |
| Desligar o cadastro público no Firebase Auth, se o console oferecer | Rodrigo | as regras negam acesso a outras contas de qualquer forma (T009) |
| `firebase login` e publicação das regras (`npx firebase deploy --only firestore:rules`) | Rodrigo, com o agente guiando | — |
| Repositório público no GitHub e Pages ligado em "GitHub Actions" | Rodrigo cria, ou autoriza o agente a criar com `gh repo create` | o nome do repositório define o `base-href` |

Os testes das regras não precisam de conta: o emulador usa o projeto fictício `demo-amigo-secreto`.

**Repositório (D-003).** Raiz com `package.json` (scripts de teste, `firebase-tools` e Vitest), `comum/` (TypeScript puro), `site/` (Angular), `envio/` (só README, unit/004), `firestore.rules`, `firebase.json`, `.github/workflows/pages.yml`. O `.gitignore` ignora `*.csv` fora de `testes/fixtures/`, `.env*`, chaves, `.firebase/`, `*-debug.log` e `.aidlc-junit.xml`.

**Fixture.** `testes/fixtures/familia-37.csv` tem 37 pessoas **inventadas**, com números de DDD `00` (inexistente) e alguns responsáveis. A planilha real da família nunca entra no repositório.

**Esquema no Firestore (D-001).** Todas as coleções nascem aqui, mesmo as que só ganham tela depois:

| Caminho | Campos | Quem lê | Quem grava |
| ------- | ------ | ------- | ---------- |
| `participantes/{id}` (id automático) | `nome`, `whatsapp` (só dígitos; 10 ou 11 dígitos recebem `55` na frente), `responsavel` (texto ou null), `ordem` | organizador | organizador |
| `sorteios/atual` | `id` (aleatório), `criadoEm`, `enviosIniciados` (false) | organizador | organizador |
| `links/{token}` | `participanteId`, `participante` (nome), `amigo` (nome), `sorteioId`, `abertoEm` (null) | organizador; visitante só `get` | organizador; visitante só muda `abertoEm` de null para `request.time` |
| `mensagens/{participanteId}` | `token`, `whatsapp`, `texto`, `status`, `atualizadoEm` | organizador | organizador (003, 004) |
| `config/encontro` | `data`, `local`, `valor` | organizador; visitante só `get` | organizador (002) |

**Regras (`firestore.rules`).** O organizador é o UID da conta, numa constante `ORGANIZADOR_UID` dentro das regras (UID não é segredo). Os testes leem esse UID do próprio `firestore.rules` e se conectam ao emulador com o mesmo SDK `firebase` do site: `connectFirestoreEmulator(db, 'localhost', 8080, { mockUserToken: { sub: uid } })` age como o organizador ou como outra conta, e sem `mockUserToken` age como visitante. Entre os testes, os dados do emulador são apagados pela rota REST do emulador (`DELETE /emulator/v1/projects/demo-amigo-secreto/databases/(default)/documents`). Não se usa `@firebase/rules-unit-testing`, para não ter duas cópias do SDK; antes de existir a conta real, a constante vale `organizador-de-teste`. O teste de senha errada cria um usuário qualquer no emulador do Auth e tenta entrar com outra senha. Em `links/{token}`: `get` para qualquer um; `list`, `create` e `delete` só para o organizador; `update` de visitante só se `resource.data.abertoEm == null`, `request.resource.data.diff(resource.data).affectedKeys().hasOnly(['abertoEm'])` e `request.resource.data.abertoEm == request.time`. Em `config/encontro`: `get` para qualquer um. Todo o resto: só o organizador. Uma consulta (`list`) negada devolve erro de permissão, o que equivale a "0 registros" do US1-AC3.

**Conta do organizador.** `scripts/criar-organizador.ts` roda no computador do organizador (`npx tsx scripts/criar-organizador.ts`). Pede e-mail e senha por prompt oculto (nunca por argumento nem variável de ambiente, para não ficar no histórico do terminal), valida com `senhaForte()` (12+ caracteres, com letra, número e símbolo), cria a conta pela API REST do Firebase Auth com a apiKey pública e imprime o UID. Não grava nada em arquivo. O script é a função `criarOrganizador({ argv, perguntar, criarConta })`, com o prompt e a chamada REST injetados; os testes passam versões falsas.

**Funções puras em `comum/`.**
- `lerCsv(texto)`: remove BOM; aceita CRLF e linhas vazias no fim; separador `,` ou `;` detectado no cabeçalho; campos entre aspas; cabeçalho sem diferença de maiúsculas e acentos (`nome`, `whatsapp`, `responsavel`/`Responsável`); devolve as linhas na ordem; aceita o mesmo número em várias linhas.
- `normalizarWhatsapp(texto)`: só dígitos; 10 ou 11 dígitos ganham `55`.
- `sortear(ids, aleatorio = aleatorioSeguro)`: `aleatorio` é uma função `() => number` em [0, 1); a padrão, `aleatorioSeguro`, usa `crypto.getRandomValues`; os testes injetam um gerador com semente fixa, para serem determinísticos. Permutação uniforme por Fisher-Yates, **descartada e refeita se alguém tirar a si mesmo** (em média ~2,7 tentativas). Todos os sorteios válidos têm a mesma chance, inclusive os com pares que se tiram mutuamente, para que saber o próprio amigo não revele nada sobre os outros. Recusa menos de 2 com o erro `MINIMO_DOIS`.
- `gerarToken()`: 16 bytes de `crypto.getRandomValues`, em base64url (22 caracteres).
- `montarLinks(participantes, pares, sorteioId, gerarToken)`: um link por participante com `participanteId`, nomes, `sorteioId` e `abertoEm: null`.
- `destinoDaRota(rota, logado)`: a área do organizador sem login vai para `#/entrar`; logado, abre a área; `#/l/:token` é pública e entrega o token.
- `estadoDaPaginaDoLink(doc | null, revelado)`: `invalido`, `fechado` ("Link de X" e o botão "Ver quem eu tirei") ou `aberto` ("X, você tirou: Y").
- `senhaForte(senha)`.

**Gravação no banco (`site/src/app/dados/repositorio.ts`).** Funções sem Angular, que recebem a instância do Firestore e são chamadas pelos componentes e pelos testes contra o emulador: `importarParticipantes(db, linhas)` e `gravarSorteio(db, sortear, gerarToken)`. Assim o teste prova o mesmo código que o site roda.

**Site (D-002).** Rotas por hash: `#/entrar`, `#/organizador` (protegida), `#/l/:token` (pública).
- Importar: lê o arquivo como UTF-8, chama `lerCsv` e `normalizarWhatsapp`, e `importarParticipantes` substitui todos os `participantes` num `writeBatch` (apaga os antigos e grava os novos). Mostra a lista com nome, número e responsável.
- Sortear: `gravarSorteio` lê `participantes`, chama `sortear` e `montarLinks`, consulta os `links` existentes e, num único `writeBatch` (37 × 2 + 1 operações, abaixo do limite de 500), apaga os links antigos, grava os novos e `sorteios/atual`. É atômico: ou tudo é gravado ou nada. As regras de quando se pode sortear de novo são da 002.
- Página do link: `get` de `links/{token}`; mostra "Link de X" e o botão; o nome do amigo só aparece na tela depois do toque. (O documento já chega ao navegador ao abrir; quem abrir as ferramentas do navegador vê o nome. O critério é não mostrar por engano.)

**Limite assumido.** As telas Angular não têm teste automático: o que só a tela mostra (37 linhas na lista, os botões, a publicação) é provado pela verificação manual da T015. Os testes da T013 provam a lógica que as telas chamam (rotas, CSV para a lista).

**Mensagens ao usuário.** "Link inválido, fale com o organizador." (identificador inexistente); "São precisos ao menos 2 participantes para sortear." (`MINIMO_DOIS`); "Usuário ou senha incorretos." (login).

**Publicação.** O workflow `pages.yml` roda os testes de `comum/` (sem emulador), constrói o Angular com `--base-href /<repositório>/` e publica no GitHub Pages. Os testes das regras rodam no gate local (precisam do Java 21).

**Testes e gate da 3.2.** Vitest na raiz cobre `comum/**/*.spec.ts`, `scripts/**/*.spec.ts`, `testes/regras/*.spec.ts` (regras e login contra os emuladores do Firestore e do Auth) e `testes/repo/*.spec.ts`. Comando do gate, gravado em `aidlc/config.yaml`: `npx firebase emulators:exec --project demo-amigo-secreto --only firestore,auth "npx vitest run --reporter=junit --outputFile=.aidlc-junit.xml"`. As telas Angular só chamam funções de `comum/` e o Firebase. Para o que só a tela mostra (37 linhas na lista, o botão, a publicação), a T015 é uma verificação manual registrada em `testes/manual/fatia-001.md`, só com marcas ok/falhou, sem nomes, links nem tokens; o teste dela confere que todas as marcas estão ok, o que registra a verificação humana mas não a substitui.

## Alternativas consideradas <!-- section: alternatives -->

| Alternativa | Por que não |
| ----------- | ----------- |
| Sorteio em ciclo único sobre a lista embaralhada | Correto (ninguém tira a si mesmo), mas nunca gera pares mútuos nem ciclos menores: saber quem você tirou revela informação sobre os outros. |
| Algoritmo de Sattolo | Mesmo problema: só gera ciclos únicos. |
| Supabase em vez de Firebase | O plano Free pausa após uma semana parado (NFR-008); ver D-001. |
| Senha conferida só na tela | Contornável lendo o código do site; NFR-007 exige a proteção no banco. |
| Senha do organizador por argumento ou `.env` | Fica no histórico do terminal ou arrisca ir para o repositório público (NFR-006). |
| Excluir os links antigos um a um | Uma falha no meio deixaria links válidos de dois sorteios; o `writeBatch` é atômico. |
| Rotas por caminho (`/l/<token>`) com 404.html | Funciona no GitHub Pages com um truque de redirecionamento; o hash é mais simples. |
| Testes de componente Angular (TestBed) no gate | Exigiria um segundo executor e um segundo relatório JUnit; a lógica fica em `comum/`. |

## Plano de implementação <!-- section: implementation-plan -->

Na ordem das tarefas:

1. `package.json`, `.gitignore`, `tsconfig.base.json`, `vitest.config.ts`, `envio/README.md`, `testes/repo/repositorio.spec.ts`
2. `comum/csv.ts`, `comum/csv.spec.ts`, `comum/whatsapp.ts`, `testes/fixtures/familia-37.csv`
3. `comum/sorteio.ts`, `comum/sorteio.spec.ts`
4. `comum/token.ts`, `comum/token.spec.ts`, `comum/links.ts`, `comum/links.spec.ts`
5. `comum/pagina-link.ts`, `comum/pagina-link.spec.ts`, `comum/rotas.ts`, `comum/rotas.spec.ts`
6. `comum/senha.ts`, `comum/senha.spec.ts`, `scripts/criar-organizador.ts`, `scripts/criar-organizador.spec.ts`
7. `firestore.rules`, `firebase.json`, `site/src/app/dados/repositorio.ts`, `testes/regras/regras.spec.ts`
8. `site/` (projeto Angular): `site/src/app/app.routes.ts`, `site/src/app/firebase.ts`, `site/src/app/entrar/entrar.component.ts`, `site/src/app/organizador/organizador.component.ts`, `site/src/app/link/link.component.ts`, `site/src/environments/environment.ts`
9. `.github/workflows/pages.yml`
10. `testes/manual/fatia-001.md`
11. `aidlc/config.yaml` (comando e relatório de teste)
