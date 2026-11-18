# Intenção: Sorteio do amigo secreto da família

<!-- Toda afirmação termina com a tag da sua fonte (`[desc]`, `[Q<n>]`, `[memory:<id>]`) ou `[assumption]`. -->

## Problema <!-- section: problem -->

A família faz amigo secreto no Natal e precisa sortear quem tira quem, de modo que cada pessoa tire exatamente uma outra e seja tirada por exatamente uma [desc]. Os sites prontos que fazem isso (ex.: quemtirei.com.br) são caros, e o organizador não quer pagar para resolver o problema; quer uma solução própria [Q1]. O resultado precisa chegar a cada pessoa pelo WhatsApp, por um link que mostra quem ela tirou [desc], de graça e usando o número do próprio organizador [Q6]: o sistema gera links `wa.me` com a mensagem pronta e uma automação os envia, clicando neles pelo WhatsApp do organizador [Q6] [Q7]. O organizador sabe que essa automação é não oficial e tem risco baixo, mas real, de bloqueio do número [Q7]. Crianças sem WhatsApp recebem pelo número de um dos pais, então o mesmo número pode receber mais de um link [desc].

## Cliente <!-- section: customer -->

- **Organizador** (quem fez o pedido): monta a lista de nomes, roda o sorteio e distribui os links pelo seu WhatsApp [desc] [Q6]. Dói porque hoje a alternativa é pagar um site [Q1].
- **Participantes** (37 pessoas da família) [Q2]: precisam descobrir quem tiraram sem ver o resultado dos outros [desc]. Inclui crianças sem WhatsApp, cujo link vai para o número do pai ou da mãe [desc].

## Métricas de sucesso <!-- section: success-metrics -->

| Métrica | Hoje | Meta | Fonte |
| ------- | ---- | ---- | ----- |
| Participantes que viram quem tiraram pelo seu próprio link antes do encontro | 0 de 37 | 37 de 37 até 28/11/2026 | [Q2] [Q3] [Q4] |
| Sorteios em que alguém tirou a si mesmo ou um par proibido | — | 0 | [Q4] |
| Custo pago a serviços para sortear e distribuir | preço de um site pago | R$ 0 | [Q1] [Q6] |

## Gatilho <!-- section: trigger -->

O sorteio da família acontece em 28/11/2026, com 37 pessoas [Q2] [Q3]; a solução precisa estar pronta e testada antes dessa data, ou seja, em até 12 dias a partir de 16/11/2026 [Q3].

## Fronteira <!-- section: boundary -->

A primeira versão (a do sorteio de 28/11/2026) **não** faz [Q5] [Q6]:

- Lista de presentes dos participantes (fica para depois do dia 28) [Q5].
- Login ou cadastro com senha: cada pessoa acessa só pelo seu link [Q5].
- Vários grupos, outras famílias ou reaproveitamento para outros anos [Q5].
- Envio por API paga ou pela API oficial do WhatsApp: a distribuição usa links `wa.me` enviados por automação pelo número do organizador [Q6] [Q7].

## Suposições <!-- section: assumptions -->

- [assumption] Quem decide escopo e prioridade é o organizador (quem fez o pedido). Motivo: o pedido é dele e ninguém mais foi citado.
