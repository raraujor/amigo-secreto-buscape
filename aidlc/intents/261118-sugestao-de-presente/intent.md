# Intenção: Sugestão de presente nos links do amigo secreto

<!-- Toda afirmação termina com a tag da sua fonte (`[desc]`, `[Q<n>]`, `[memory:<id>]`) ou `[assumption]`. -->

## Problema <!-- section: problem -->

O sorteio já foi realizado e os links já foram enviados às pessoas [desc]. Quem tirou alguém precisa saber o que dar de presente, e o organizador quer que a sugestão de presente de cada pessoa seja vista no link de quem a tirou [desc]. A lista de presentes tinha ficado fora da versão 1 [desc]. O pedido original previa que a sugestão também fosse escrita no link [desc]; o organizador decidiu depois que só ele escreve as listas, em um só lugar, e que os participantes apenas leem, porque são pessoas com menos aptidão a tecnologia [Q1] [Q6]. Cada lista é uma sequência de itens, um por linha, e cada item pode ter o endereço de uma loja [Q2]. Não há prazo para escrever ou mudar uma lista [Q3]. Enquanto a lista de uma pessoa não existir, o link de quem a tirou mostra um aviso de que a sugestão ainda não está disponível e que é para voltar depois, e a lista aparece no mesmo link quando existir [Q4] (o texto exato do aviso é uma suposição, abaixo). O sorteio feito não pode ser alterado: o organizador pediu que não se altere o banco de dados e que um backup seja feito antes de começar [desc].

## Cliente <!-- section: customer -->

- **Organizador** (quem fez o pedido): escreve e mantém a lista de presentes de cada pessoa, em um só lugar [Q1] [Q6].
- **Participantes** (36 pessoas) [desc]: usam o link que já receberam [desc] e leem a lista de presentes da pessoa que tiraram, sem escrever nada [Q1] [Q6]. São pessoas com menos aptidão a tecnologia [Q6].

## Métricas de sucesso <!-- section: success-metrics -->

| Métrica | Hoje | Meta | Fonte |
| ------- | ---- | ---- | ----- |
| Meta numérica de preenchimento das listas | não existe [desc] | sem meta numérica, por decisão do organizador ("Não precisa medir") | [Q5] |
| Documentos já gravados (participantes, sorteio, links, mensagens e dados do encontro) diferentes do backup de 18/11/2026 depois da funcionalidade | 36 participantes, 1 sorteio, 36 links, 36 mensagens e 1 config, conforme o backup | 0 documentos alterados ou apagados | [desc] |

## Gatilho <!-- section: trigger -->

O sorteio foi concluído e os links já foram enviados [desc]; o encontro é em 24/12/2026 [desc]. O organizador quer priorizar agora a sugestão de presente nos links [desc].

## Fronteira <!-- section: boundary -->

Esta primeira versão da sugestão **não** faz o que segue [Q1] [Q6] [desc]:

- Fotos ou imagens dos presentes [Q6].
- Marcar "já comprei este item" ou reservar itens [Q6].
- Preço, valor ou busca de produtos em lojas [Q6].
- Avisar as pessoas por WhatsApp para escreverem a sugestão [Q6].
- Escrita da lista pelo participante no próprio link: só o organizador escreve [Q1].
- Refazer o sorteio, nem apagar ou trocar dados já gravados dele [desc].

## Suposições <!-- section: assumptions -->

- [assumption] "Não alterar o banco de dados" quer dizer não alterar nem apagar os dados já gravados do sorteio; guardar as listas novas, em dados novos e separados, é permitido. Motivo: a funcionalidade exige guardar as listas em algum lugar e o pedido não diz onde. Deve virar pergunta na etapa 2.3, junto com a reconfirmação de que o prazo e o aviso valem para o organizador.
- [assumption] O aviso da Q4 usa o texto da opção escolhida, ajustado ao fato de que quem escreve é o organizador (por exemplo, "A sugestão de presente de <nome> ainda não está disponível. Volte depois."). Motivo: a opção Q4-A foi escrita pensando que a própria pessoa escreveria.
- [assumption] A resposta "sem prazo" (Q3-A) vale para o organizador escrever e mudar as listas, e a lista nunca é bloqueada. Motivo: a Q3 foi escrita pensando na própria pessoa.
- [assumption] A tela de acompanhamento de quem já tem lista (Q6, opção E) não foi excluída nem incluída pelo organizador; a etapa 2.3 pergunta. Motivo: o organizador marcou só A a D como fora do escopo [Q6].
- [assumption] A lista de uma pessoa aparece só no link de quem a tirou, e nenhum outro link a mostra. Motivo: o pedido pede a sugestão "de quem a pessoa tirou" no link e o resultado do sorteio é secreto [desc].
