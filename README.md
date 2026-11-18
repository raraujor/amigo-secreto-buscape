# Amigo secreto da família 🎄

Sorteio de amigo secreto para a família, sem custo: o organizador importa a lista, sorteia e envia a cada pessoa um link pelo WhatsApp. Quem recebe abre o link, toca em **Ver quem eu tirei** e descobre o amigo secreto, sem ver o de mais ninguém.

**Site:** https://raraujor.github.io/amigo-secreto-buscape/

## Como funciona

**Organizador** (entra com e-mail e senha):

1. Informa os dados do encontro (data, local e valor sugerido).
2. Importa a lista em CSV, com as colunas `nome`, `whatsapp` e, opcionalmente, `responsavel` (para crianças sem WhatsApp: o link vai para o número do responsável, dizendo de quem é). O sistema confere a planilha (linha sem nome ou número, número inválido, nome repetido, acentos do Excel, limite de 80 pessoas) e só importa se estiver certa; avisa quando duas pessoas usam o mesmo número sem responsável.
3. Sorteia. Cada pessoa tira exatamente uma outra e é tirada por exatamente uma, e ninguém tira a si mesmo.
4. Para cada pessoa, toca em **Enviar pelo WhatsApp**: abre a conversa com a mensagem e o link prontos e já marca a mensagem como enviada (há **Desfazer** para quem tocou e não enviou).
5. Acompanha o status de cada mensagem (pendente, enviada ou com falha) e quem já viu o resultado, e pode ver o resultado completo, atrás de um botão.
6. Depois que alguma mensagem foi enviada, sortear de novo e importar outra lista ficam bloqueados; para corrigir, há **Recomeçar do zero**, com confirmação digitada.
7. Escreve a **lista de presentes** de cada pessoa (botão ao lado do nome na lista de participantes: um item por linha, até 20 itens de 200 caracteres) e vê quem já tem lista. As listas ficam ligadas ao nome e continuam guardadas quando o sorteio recomeça.

**Participante:** abre o link recebido, toca em **Ver quem eu tirei** e vê o amigo secreto, a lista de presentes dele (ou o aviso de que ainda não está disponível) e os dados do encontro. O link tem um identificador aleatório de 128 bits e só mostra o resultado daquela pessoa.

## Como é feito

| Parte | Tecnologia |
| ----- | ---------- |
| Site | Angular, publicado no GitHub Pages por GitHub Actions |
| Dados e login | Firebase (Cloud Firestore e Authentication), plano gratuito |
| Código compartilhado e testado | TypeScript puro em `comum/` (sorteio, leitura do CSV, mensagens) |
| Testes | Vitest, com as regras do banco testadas no emulador do Firebase |

O sigilo vem das regras de acesso em [`firestore.rules`](firestore.rules): só a conta do organizador lê e grava tudo; quem tem um link lê só aquele link e só registra a própria abertura, uma vez, com a hora do servidor. Nenhum dado da família fica neste repositório: as planilhas reais são ignoradas pelo git, e a planilha de testes (`testes/fixtures`) é inventada.

## Desenvolvimento

```bash
npm install
npx vitest run comum scripts testes/repo
```

Os testes das regras do banco exigem o emulador do Firebase, que precisa de **Java 21**:

```bash
npx firebase emulators:exec --project demo-amigo-secreto --only firestore,auth "npx vitest run"
```

As regras do banco (`firestore.rules`) são publicadas à parte do site, antes dele, com `npx firebase deploy --only firestore:rules --project amigo-secreto-buscape` (exige o login do organizador no Firebase); para voltar atrás, publique de novo as regras anteriores do git. Para criar a conta do organizador, rode `npx tsx scripts/criar-organizador.ts` (a senha é pedida sem aparecer na tela). Para guardar uma cópia dos dados do banco, rode `npx tsx scripts/backup.ts`: ele só lê, pede o e-mail e a senha do organizador (a senha sem aparecer na tela) e grava um arquivo JSON por coleção em `backups/`, pasta ignorada pelo git. Os arquivos têm os nomes, os telefones e os links da família, então guarde-os fora do repositório e do GitHub. A configuração web do Firebase fica em `site/src/environments/environment.ts`; ela é pública por natureza.

## Estrutura

- `site/`: o site Angular
- `comum/`: funções puras com testes
- `envio/`: reservado para o envio automático pelo WhatsApp (ainda vazio)
- `firestore.rules`: regras de acesso do banco
- `aidlc/`: requisitos, histórias, decisões e planos do projeto, feitos com o RA AIDLC

## Licença

Veja [LICENSE](LICENSE).
