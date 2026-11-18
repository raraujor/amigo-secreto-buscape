# Memory index

One line per active item: `id | type | status | title | governs`. Kept by the agents and checked by `ra-aidlc gate`.

L-001 | lesson | accepted | Conferir no início que a versão do ra-aidlc instalado é a mesma das skills do projeto | .claude/skills/**, aidlc/**
L-002 | lesson | accepted | Em site estático com repositório público, perguntar cedo onde ficam os dados e os segredos | aidlc/intents/**
D-001 | decision | accepted | Banco e login no Firebase (Firestore + Auth), plano Spark gratuito | site/**, envio/**, firestore.rules
D-002 | decision | accepted | Site em Angular no GitHub Pages por GitHub Actions, rotas por hash | site/**, .github/workflows/**
D-003 | decision | accepted | Repositório público no GitHub com site/, envio/ e comum/ | site/**, envio/**, comum/**
D-004 | decision | accepted | Recomeçar do zero é a exceção explícita à trava do novo sorteio depois do envio | site/src/app/dados/repositorio.ts, site/src/app/organizador/organizador.ts, comum/confirmacao.ts
