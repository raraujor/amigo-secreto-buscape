# Amigo secreto da família 🎄

Sorteio de amigo secreto para a família, sem custo: o organizador importa a lista, sorteia e envia a cada pessoa um link pelo WhatsApp. Quem recebe abre o link, toca em **Ver quem eu tirei** e descobre o amigo secreto, sem ver o de mais ninguém.

**Site:** https://raraujor.github.io/amigo-secreto-buscape/

## Como funciona

**Organizador** (entra com e-mail e senha):

1. Informa os dados do encontro (data, local e valor sugerido).
2. Importa a lista em CSV, com as colunas `nome`, `whatsapp` e, opcionalmente, `responsavel` (para crianças sem WhatsApp: o link vai para o número do responsável, dizendo de quem é).
3. Sorteia. Cada pessoa tira exatamente uma outra e é tirada por exatamente uma, e ninguém tira a si mesmo.
4. Para cada pessoa, toca em **Enviar pelo WhatsApp**: abre a conversa com a mensagem e o link prontos.
5. Acompanha quem já viu o resultado e quando.

**Participante:** abre o link recebido, toca em **Ver quem eu tirei** e vê o amigo secreto e os dados do encontro. O link tem um identificador aleatório de 128 bits e só mostra o resultado daquela pessoa.

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

Para criar a conta do organizador, rode `npx tsx scripts/criar-organizador.ts` (a senha é pedida sem aparecer na tela). A configuração web do Firebase fica em `site/src/environments/environment.ts`; ela é pública por natureza.

## Estrutura

- `site/`: o site Angular
- `comum/`: funções puras com testes
- `envio/`: reservado para o envio automático pelo WhatsApp (ainda vazio)
- `firestore.rules`: regras de acesso do banco
- `aidlc/`: requisitos, histórias, decisões e planos do projeto, feitos com o RA AIDLC

## Licença

Veja [LICENSE](LICENSE).
