# Requisitos: Copiar a lista de presentes para o WhatsApp

<!-- Os IDs são permanentes. Toda linha termina com a tag da sua fonte ou `[assumption]`. -->

## Análise da intenção <!-- section: intent-analysis -->

O organizador escreve as listas de presentes e precisa mandá-las no WhatsApp para as pessoas revisarem [desc]. Para isso quer um botão que copie para a área de transferência a lista consolidada de todo mundo [desc] [Q1]. O texto sai com título e itens numerados para cada pessoa [Q2], a partir das listas já salvas [Q3]. Junto, a importação e o botão "Sortear" ficam escondidos depois que o sorteio é realizado e só volta se o organizador recomeçar [desc].

## Requisitos funcionais <!-- section: functional-requirements -->

### Copiar as listas (organizador)

- **FR-001**: O sistema deve oferecer um único botão "Exportar lista de presentes" que copia para a área de transferência, num texto só, as listas salvas de todas as pessoas que têm lista, na ordem da planilha, separadas por uma linha em branco. Não há botão de copiar por pessoa. [desc] [Q1] [Q3]
  - Dado Ana com a lista salva "Camisa tamanho M" e "Livro da coleção Clássicos", quando o organizador toca em "Exportar lista de presentes", então o texto copiado traz o título "Lista de presentes" uma única vez, uma linha em branco, "Ana:", uma quebra de linha, "1. Camisa tamanho M", outra quebra de linha e "2. Livro da coleção Clássicos". [Q2] [Q3] [desc]
  - Dado Ana e Carla com lista e Bruno sem lista, quando o organizador toca no botão, então o texto traz o título uma única vez, a lista de Ana, uma linha em branco e a lista de Carla, e não traz Bruno. [Q1] [Q2]
  - Dado a caixa de edição de uma pessoa aberta com texto ainda não salvo, quando o organizador toca no botão, então o que é copiado são as listas salvas, não o texto da caixa. [Q3]
  - Dado nenhuma pessoa com lista, quando o organizador vê o botão, então ele está desabilitado. [assumption]
  - refs: site/src/app/organizador/organizador.ts, comum/lista.ts
- **FR-002**: O sistema deve avisar o organizador do resultado do botão: "Copiado ✓" quando a cópia deu certo e uma mensagem de erro quando o navegador a recusou. [assumption]
  - Dado que o navegador recusa o acesso à área de transferência, quando o organizador toca no botão, então a tela mostra o erro e nada mais muda. [assumption]
  - refs: site/src/app/organizador/organizador.ts, comum/erros.ts

### Esconder importar e sortear depois do sorteio (organizador)

- **FR-003**: O sistema deve esconder a seção de importar a lista de participantes (campo de planilha) e o botão "Sortear" depois que um sorteio foi realizado, e só mostrá-los de novo quando o organizador recomeçar do zero. [desc]
  - Dado que ainda não há sorteio, quando o organizador abre a tela, então a importação e o botão "Sortear" aparecem. [desc]
  - Dado que o sorteio foi realizado (há links do sorteio), quando o organizador abre ou recarrega a tela, então a importação e o botão "Sortear" não aparecem. [desc]
  - Dado que o organizador acabou de sortear, então a importação e o botão somem logo em seguida, sem recarregar a tela. [desc]
  - Dado que o organizador recomeçou do zero, então a importação e o botão "Sortear" voltam a aparecer. [desc]
  - refs: site/src/app/organizador/organizador.ts

## Requisitos não funcionais <!-- section: non-functional-requirements -->

- **NFR-001**: Copiar as listas não altera nenhum dado gravado: o botão só lê as listas que a tela já carregou e não escreve no banco nem muda as regras de acesso. [assumption]
- **NFR-002**: O botão cabe em uma tela de celular de 360 px sem rolagem horizontal. [assumption]

## Restrições <!-- section: constraints -->

- O sorteio e os documentos gravados não podem mudar. [memory:D-005]
- Só o organizador vê e copia as listas; o link do leitor não ganha nada. [memory:D-005]

## Fora do escopo <!-- section: out-of-scope -->

- Botão de copiar por pessoa. [Q1]
- Enviar a lista direto pelo WhatsApp (abrir a conversa) ou por qualquer outro canal; só copiar. [desc]
- Importar de volta uma lista revisada colada no WhatsApp. [assumption]

## Suposições <!-- section: assumptions -->

- Com nenhuma lista, o botão fica desabilitado.
- O aviso de resultado e o erro seguem o padrão do botão "Copiar resultado".
- A cópia não escreve nada no banco.
- Cabe em 360 px como o resto da tela do organizador.
- Receber de volta a lista revisada fica fora do escopo.
- "Sorteio realizado" quer dizer que há links do sorteio gravados.

## Perguntas em aberto <!-- section: open-questions -->

Nenhuma.
