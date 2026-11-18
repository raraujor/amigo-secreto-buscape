# Verificação manual da sugestão de presente (unit/001 da intenção 261118)

Marque com `[x]` depois de conferir no site publicado, com o celular. Só marcas: não escreva nomes, links nem tokens aqui.

Antes de tudo: as regras do banco foram publicadas com `npx firebase deploy --only firestore:rules --project amigo-secreto-buscape`, e só depois o site foi publicado.

- [ ] As regras do banco foram publicadas antes do site, e o link de um participante ainda abre e mostra o nome do amigo como antes
- [ ] Na tela do organizador, cada participante mostra "sem lista" e o botão "Lista de presentes"
- [ ] Abrir "Lista de presentes", escrever dois itens (um por linha) e salvar fecha a edição e o indicador vira "com lista" só depois do salvamento terminar
- [ ] Abrir de novo a lista mostra os itens salvos, sem linhas em branco
- [ ] Escrever 21 itens e salvar mostra "O limite é de 20 itens por pessoa." e o texto digitado continua na caixa
- [ ] Escrever uma linha de mais de 200 caracteres e salvar mostra "A linha N passa de 200 caracteres." e o texto continua na caixa
- [ ] Apagar todo o texto e salvar volta a pessoa para "sem lista"
- [ ] No link de quem tirou essa pessoa, antes do toque em "Ver quem eu tirei" não aparece nem o nome do amigo nem a lista
- [ ] Depois do toque, o link mostra o nome do amigo (como antes) e a "Sugestão de presente" com os itens na ordem escrita
- [ ] Sem lista, o link mostra "A sugestão de presente de" o nome "ainda não está disponível. Volte depois."
- [ ] Mudar a lista na tela do organizador e reabrir o link (tocando de novo em "Ver quem eu tirei") mostra a lista nova
- [ ] Um item com um endereço de site aparece como texto, sem poder tocar nele
- [ ] No celular, com a tela estreita (360 px), uma lista de 20 itens longos cabe sem rolagem horizontal
- [ ] Recomeçar do zero, ou sortear de novo antes do envio, mantém as listas e os indicadores "com lista"
- [ ] Depois de sortear de novo, o link novo de cada pessoa mostra a lista de quem ela tirou no novo sorteio
