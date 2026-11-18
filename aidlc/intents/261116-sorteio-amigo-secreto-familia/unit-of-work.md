# Unidades de trabalho: Sorteio do amigo secreto da família

Na Construction, cada unidade ganha um `design.md` (design doc do EGM) e um `tasks.md` (spec-kit): estágios 3.1 e 3.2.

Um repositório só, com duas pastas: o site (GitHub Pages) e o programa de envio que roda no computador do organizador, compartilhando os tipos de dados (Q1). A primeira unidade é uma fatia fina de ponta a ponta (Q2). Cinco unidades médias (Q3). Plano aprovado por Rodrigo no chat em 16/11/2026; corrigido depois da revisão independente para que nenhuma unidade dependa de dado criado por uma unidade da qual não depende.

**Regra de fronteira:** a unit/001 cria o esquema completo do banco (participantes com responsável, dados do encontro, sorteio com identificadores dos links, mensagens com status, aberturas) e todas as regras de acesso. As unidades seguintes acrescentam telas e comportamento sobre esse esquema e testam com dados preparados no banco, sem esperar a tela de outra unidade.

## Unidades <!-- section: units -->

| Unidade                              | Responsabilidade | Tipo    | Tamanho |
| ------------------------------------ | ---------------- | ------- | ------- |
| unit/001-fatia-base                  | Estrutura do repositório (pastas do site e do envio, tipos de dados compartilhados); site publicado no GitHub Pages; banco gratuito escolhido e mantido ativo até a data do encontro (NFR-001, NFR-002, NFR-008); esquema completo e regras de acesso: com a chave pública, ler só o próprio resultado e gravar só a própria abertura (NFR-006, NFR-007); login do organizador, também usado pelo programa de envio; identificadores de link de 128 bits (NFR-005); fatia mínima: importar um CSV com as colunas nome, whatsapp e responsavel e mostrar os participantes (sem as validações e regras do responsável, que são da 002), sortear sem autossorteio para até 37 pessoas (NFR-003) e abrir um link que mostra "X, você tirou: Y" após "Ver quem eu tirei"; página de link inexistente | ui      | L       |
| unit/002-preparacao                  | Importação completa do CSV (responsável, formatos de número, separador e acentos, avisos e bloqueios, reimportação); dados do encontro e sua exibição na página do link; resultado completo; regras de novo sorteio e de reimportação conforme o status de envio já existente no esquema, com invalidação dos links e zeragem das aberturas | ui      | M       |
| unit/003-mensagens-e-envio-manual    | Gerar a mensagem e o link `wa.me` de cada participante com os textos exatos; lista do plano B; "Marcar como enviada"; tela de status pendente/enviada/com falha na área do organizador; página do link dizendo de quem é antes do toque | ui      | M       |
| unit/004-envio-automatico            | Programa no computador do organizador que entra com o login do organizador, lê as mensagens pendentes ou com falha, envia pelo WhatsApp dele com intervalo aleatório de 15 a 45 s, grava o status e retoma sem repetir as enviadas (inclusive as marcadas à mão) | service | L       |
| unit/005-acompanhamento              | Registrar a primeira abertura (toque em "Ver quem eu tirei") com data e hora de Brasília, sem bloquear o resultado se falhar; tela "abriu"/"não abriu" na área do organizador | ui      | S       |

## Dependências <!-- section: dependencies -->

```yaml
unit/001-fatia-base: []
unit/002-preparacao: [unit/001-fatia-base]
unit/003-mensagens-e-envio-manual: [unit/001-fatia-base, unit/002-preparacao]
unit/004-envio-automatico: [unit/001-fatia-base, unit/003-mensagens-e-envio-manual]
unit/005-acompanhamento: [unit/001-fatia-base]
```

## Mapa de histórias <!-- section: story-map -->

| História ou FR | Unidade                                                                 |
| -------------- | ----------------------------------------------------------------------- |
| US1            | unit/001-fatia-base, unit/002-preparacao, unit/003-mensagens-e-envio-manual, unit/005-acompanhamento |
| US2            | unit/001-fatia-base, unit/002-preparacao                                |
| US3            | unit/002-preparacao                                                     |
| US4            | unit/001-fatia-base, unit/002-preparacao                                |
| US5            | unit/002-preparacao                                                     |
| US6            | unit/001-fatia-base, unit/003-mensagens-e-envio-manual                  |
| US7            | unit/003-mensagens-e-envio-manual, unit/004-envio-automatico            |
| US8            | unit/003-mensagens-e-envio-manual, unit/004-envio-automatico            |
| US9            | unit/001-fatia-base, unit/002-preparacao, unit/005-acompanhamento       |
| US10           | unit/003-mensagens-e-envio-manual                                       |
| US11           | unit/005-acompanhamento                                                 |

Dono de cada critério, quando a história está em mais de uma unidade:

- **US1**: AC2 a AC6 na unit/001. O AC1 é dividido: a 001 prova entrar e ver a área com a tela de importar e sortear; cada unidade seguinte prova que a sua tela (dados do encontro e resultado na 002, envio na 003, acompanhamento na 005) só abre com o login. A dona do AC5 é a 001; as outras unidades o repetem no seu gate. Das regras de acesso criadas na 001, ela prova a leitura (AC3, AC4); a gravação anônima limitada à própria abertura é provada na 005 (US11-AC5).
- **US2**: AC1 (CSV com nome, whatsapp e responsavel, 37 linhas, mostrados na tela) na unit/001; AC2 a AC8 na unit/002.
- **US4**: AC1 a AC4 na unit/001; AC5 e AC6 na unit/002, testados com mensagens marcadas como enviadas direto no banco.
- **US6**: AC3 (identificadores de 128 bits, gerados no sorteio) na unit/001; AC1 e AC2 (textos) na unit/003.
- **US7**: AC2 (tela de status) na unit/003; AC1, AC3, AC4 e AC5 na unit/004.
- **US8**: AC1 e a marcação do AC2 na unit/003; o "envio automático não a reenvia" do AC2 na unit/004.
- **US9**: AC1 (sem os dados do encontro), AC2, AC4 e o identificador inexistente do AC3 na unit/001; os dados do encontro na página (via US3-AC1) e o sorteio substituído do AC3 na unit/002; AC5 na unit/005.
- **US9-AC2** (sigilo) é repetido como regressão no gate da 003 e da 005, que alteram a página do link.
- **US3-AC2** ("depois do envio") é testado na unit/002 com uma mensagem marcada como enviada direto no banco.

## Suposições <!-- section: assumptions -->

Nenhuma.
