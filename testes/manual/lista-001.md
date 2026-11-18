# Verificação manual da sugestão de presente (unit/001 da intenção 261118)

Marque com `[x]` depois de conferir no site publicado, com o celular. Só marcas: não escreva nomes, links nem tokens aqui.

Antes de tudo: as regras do banco foram publicadas com `npx firebase deploy --only firestore:rules --project amigo-secreto-buscape`, e só depois o site foi publicado.

- [x] As regras do banco foram publicadas antes do site, e o link de um participante ainda abre e mostra o nome do amigo como antes
- [x] Na tela do organizador, cada participante mostra "sem lista" e o botão "Lista de presentes"
- [x] Abrir "Lista de presentes", escrever dois itens (um por linha) e salvar fecha a edição e o indicador vira "com lista" só depois do salvamento terminar
- [x] Abrir de novo a lista mostra os itens salvos, sem linhas em branco
- [x] Escrever 21 itens e salvar mostra "O limite é de 20 itens por pessoa." e o texto digitado continua na caixa
- [x] Escrever uma linha de mais de 200 caracteres e salvar mostra "A linha N passa de 200 caracteres." e o texto continua na caixa
- [x] Apagar todo o texto e salvar volta a pessoa para "sem lista"
- [x] No link de quem tirou essa pessoa, antes do toque em "Ver quem eu tirei" não aparece nem o nome do amigo nem a lista
- [x] Depois do toque, o link mostra o nome do amigo (como antes) e a "Sugestão de presente" com os itens na ordem escrita
- [x] Sem lista, o link mostra "A sugestão de presente de" o nome "ainda não está disponível. Volte depois."
- [x] Mudar a lista na tela do organizador e reabrir o link (tocando de novo em "Ver quem eu tirei") mostra a lista nova
- [x] Um item com um endereço de site aparece como texto, sem poder tocar nele
- [x] No celular, com a tela estreita (360 px), uma lista de 20 itens longos cabe sem rolagem horizontal
- [x] Recomeçar do zero, ou sortear de novo antes do envio, mantém as listas e os indicadores "com lista"
- [x] Depois de sortear de novo, o link novo de cada pessoa mostra a lista de quem ela tirou no novo sorteio
