# Revisão da economia — proposta para teste

Revisão da economia anterior em 29/10/2026. O diagnóstico e as tabelas abaixo preservam a proposta original. **Implementado após aprovação:** caixa inicial de R$ 350 mil, renda base de R$ 300 mil, R$ 20 mil por liderança isolada com pelo menos 3 pontos, adicional presidencial de R$ 75 mil e preços locais de debates, ataques, defesas e promessas. **Sem teto de renda**, por solicitação do usuário; o ajuste de terceiro mandato permanece em −R$ 100 mil. As demais sugestões continuam pendentes e não foram aplicadas. A renda comum pode chegar a R$ 840 mil (27 UFs qualificadas), ou R$ 915 mil com adicional presidencial; esses valores decorrem do número de UFs, não de um teto financeiro. Os números abaixo vêm de cálculos sobre as funções existentes, não de testes de partidas com jogadores reais.

## Diagnóstico

1. **Renda de liderança cresce rápido demais.** Cada UF rende R$ 50 mil por rodada a quem liderar sozinho, mesmo com apenas 1 ponto. Roraima custa R$ 33 mil por investimento. Sem resposta dos adversários, os R$ 250 mil iniciais permitem ocupar RR, AC, AP, RO, TO e SE por R$ 227 mil: a renda seguinte sobe para R$ 550 mil e o caixa chega a R$ 573 mil. É um exemplo de abertura sem oposição, não uma garantia em partidas disputadas.
2. **Dados tornaram estratégias caras para o risco assumido.** A chance de vitória do desafiante é 44,3673% com 2 dados contra 2, e 15,2006% contra 3 dados. Sem limites de pontos interferindo, o ataque muda a diferença de influência em média em +0,331 ponto sem defesa, e −0,544 com defesa. O debate normal muda essa diferença em −0,225 ponto para quem inicia. Isso não mede diretamente os votos nacionais: local, pontuação, bloqueios e terceiros candidatos importam.
3. **Promessas têm preço nacional e benefício local.** As quatro melhorias custam R$ 150/200/250/300 mil, mas investimentos variam de R$ 33 mil a R$ 187 mil. Para a primeira promessa gerar influência equivalente ao seu custo, seriam necessárias cerca de 3,21 ações futuras em SP e 18,18 em RR, ignorando concentração, limites e herança. O segundo caso excede o necessário para fechar um estado partindo de zero.
4. **Apoios podem custar o mesmo entregando benefícios muito diferentes.** R$ 1/2/4 milhões dependem apenas da ordem da compra. O valor efetivamente transferível, os estados beneficiados e o espaço até o teto não entram no preço.
5. **Adiar a apuração compra renda adicional barata.** R$ 500 mil acrescentam quatro rodadas: somente a renda base já pode render R$ 1 milhão adicional, se as rodadas forem jogadas. Todos recebem renda, pode haver perda de até 2 pontos percentuais e fechamento antecipado; ainda assim, o preço merece revisão. O jogador também pode repetir a ação, enquanto a IA já se limita a uma interferência por turno.

## Configuração recomendada para um primeiro teste

### Caixa e renda

| Item | Atual | Proposta |
|---|---:|---:|
| Caixa inicial padrão | R$ 250 mil | R$ 350 mil |
| Renda base por rodada | R$ 250 mil | R$ 300 mil |
| Liderança em uma UF | R$ 50 mil | R$ 20 mil |
| Condição para gerar renda estadual | Qualquer liderança isolada | Liderança isolada com pelo menos 3 pontos de influência |
| Teto da renda estadual por candidato | R$ 1,35 milhão, se liderar as 27 UFs | R$ 200 mil por rodada |
| Adicional presidencial | R$ 100 mil | R$ 75 mil |
| Ajuste no terceiro mandato consecutivo | −R$ 100 mil | −R$ 75 mil |

Com a proposta, a renda recorrente de um presidente varia de R$ 375 mil a R$ 575 mil, contra até R$ 1,7 milhão hoje. Um candidato comum recebe entre R$ 300 mil e R$ 500 mil. O terceiro mandato conserva a penalidade, com base líquida de R$ 225 mil antes dos estados. O ajuste presidencial sobre o caixa de entrada pode continuar como hoje, usando os novos valores.

O objetivo é manter a recompensa por conquistar território sem financiar uma expansão apenas com ocupações de um ponto. Estados pequenos continuam sendo uma escolha de arrecadação; estados grandes continuam tendo mais peso eleitoral. O caixa inicial maior permite escolhas reais antes da primeira renda.

### Investimentos, promessas e estratégias

Use `C` como o custo atual de um investimento no estado. Arredonde os novos preços para múltiplos de R$ 5 mil.

| Ação | Atual | Proposta |
|---|---|---|
| Investimento estadual | R$ 33–187 mil | Manter a fórmula atual nesta primeira etapa |
| Primeira promessa | R$ 150 mil | 0,8 × C, mínimo de R$ 40 mil |
| Segunda promessa | R$ 200 mil | 1,1 × C, mínimo de R$ 40 mil |
| Terceira promessa | R$ 250 mil | 1,5 × C, mínimo de R$ 40 mil |
| Quarta promessa | R$ 300 mil | 2 × C, mínimo de R$ 40 mil |
| Debate regional | R$ 400 mil | 0,8 × C |
| Ataque ao candidato | R$ 600 mil | 1,25 × C |
| Defesa de campanha | R$ 250 mil | 1 × C |

Exemplos de preços propostos:

| Estado | Investimento | Debate | Ataque | Defesa | Promessas 1 / 2 / 3 / 4 |
|---|---:|---:|---:|---:|---|
| RR | R$ 33 mil | R$ 25 mil | R$ 40 mil | R$ 35 mil | R$ 40 / 40 / 50 / 65 mil |
| AM | R$ 50 mil | R$ 40 mil | R$ 65 mil | R$ 50 mil | R$ 40 / 55 / 75 / 100 mil |
| MG | R$ 117 mil | R$ 95 mil | R$ 145 mil | R$ 115 mil | R$ 95 / 130 / 175 / 235 mil |
| SP | R$ 187 mil | R$ 150 mil | R$ 235 mil | R$ 185 mil | R$ 150 / 205 / 280 / 375 mil |

As primeiras promessas passam a valer como preparação antecipada. As últimas continuam cobrando um prêmio pela velocidade de chegar a 10 pontos, sem necessariamente serem a forma mais barata de fazê-lo. Custos de estratégias acompanham o valor e o custo de reconstruir a influência local.

A concentração continua concedendo +0,1 na área e ×0,9 fora dela, contando somente promessas compradas ou herdadas. Os preços menores das promessas tornam mais fácil ativá-la; é preciso medir sua frequência antes de mudar também seu bônus.

### Freios para repetição e últimas rodadas

- Testar um acréscimo de **50% do preço-base por repetição ofensiva** do mesmo candidato contra o mesmo alvo e UF na mesma rodada. Debate e ataque compartilham esse contador: 100%, 150%, 200% etc. Reinicia na rodada seguinte. É uma proposta de regra adicional, não uma característica atual.
- Manter 2 investimentos por UF nas rodadas comuns e testar **3 na rodada final**, substituindo o limite atualmente removido. Isso reduz compras em massa no último instante, preservando algum espaço de recuperação.
- Manter o custo da defesa ligado ao estado e seu uso único. Um terceiro dado já reduz fortemente a chance do atacante; não acrescentaria bloqueio automático ou mais dados.

### Debate: decisão de regra, separada do preço

Reduzir seu custo não elimina a desvantagem estatística de iniciar um debate entre candidatos com pontos e espaço disponíveis. Para um debate mais justo, recomendo testar **novo lançamento em empate apenas no debate**. Sem defesa, isso torna a chance de vitória 50% para cada participante. Continua sendo uma aposta de expectativa zero em transferência de influência, não um ganho garantido; pode fazer sentido para quem precisa assumir risco. Ataques manteriam empate a favor do defensor.

Se a preferência for preservar a regra atual dos dados, manter o preço menor é possível, mas o debate deve ser tratado como escolha situacional de alto risco. A IA precisa avaliar os resultados possíveis, em vez de usá-lo só por ser barato.

### Apoios

Substituir a tabela fixa por preço calculado a partir dos pontos realmente transferíveis em cada UF:

`custo equivalente = soma(pontos concedidos na UF ÷ multiplicador atual do comprador na UF × custo de investimento da UF)`

`preço = máximo(R$ 150 mil, 0,8 × custo equivalente × (1 + 0,25 × apoios já comprados))`

Arredondar o resultado para R$ 50 mil. Desconsiderar pontos que ultrapassariam o teto de 10. Afinidade continua definindo quantos pontos o candidato consegue transferir. Manter até três apoios, um por rodada e a prioridade de quem estiver atrás.

É uma aproximação inicial de valor, não uma equivalência perfeita: apoios podem atuar onde investimentos comuns estão bloqueados e podem ser exclusivos. A IA deve comparar o ganho marginal de votos por real com outras ações e rejeitar negociações sem retorno suficiente, mesmo que tenha saldo.

### Interferência presidencial

| Ação | Atual | Proposta |
|---|---|---|
| Antecipar | R$ 1 milhão; próxima rodada | Manter |
| Adiar | R$ 500 mil; +4 rodadas | R$ 750 mil; +2 rodadas |
| Repetição | Jogador sem limite; IA uma por turno | Uma interferência por candidato e turno, para ambos |
| Penalidade nacional | Até −2 pontos percentuais | Manter |

A proposta reduz a possibilidade de comprar indefinidamente mais renda e tempo. Se for importante manter +4 rodadas, testar R$ 1,5 milhão no adiamento em vez de R$ 750 mil. O encerramento por estados fechados continua podendo ocorrer antes.

## Ajustes necessários na IA

Mudar apenas os números pode piorar sua eficiência:

- Promessas: hoje a IA compra até duas com valor estimado positivo antes de investir. Deve comparar o retorno futuro com investimentos e estratégias, levando em conta caixa e rodadas restantes; valor positivo sozinho não significa boa compra.
- Apoios: hoje a IA compra o melhor apoio com ganho positivo quando consegue pagar. Deve também comparar ganho por real e reservar dinheiro quando a oferta for ruim.
- Defesa e ataques: manter probabilidades reais dos dados, limites de pontos, risco de retaliação e custo de repetição na avaliação.
- Todos os preços, limites e adicionais devem ser idênticos para jogador e IA. A dificuldade deve continuar mudando a qualidade das decisões.

## Como validar

Aplicar a proposta como um conjunto experimental, preferencialmente com configuração de preços centralizada, e comparar com a economia atual usando as mesmas sementes. Cobrir partidas de 6/10/14 rodadas e 2/6/10 participantes, com e sem estratégias e apoios, incluindo segundo turno e continuidade.

Medir: diferença entre os dois primeiros ao longo da eleição; trocas de liderança; renda e dinheiro parado; distribuição dos gastos; utilização e repetição de estratégias; proporção de promessas efetivamente aproveitadas; incidência de concentração; duração real; e quantidade de painéis de dados por rodada. Complementar simulações com partidas humanas: mais estratégias não significa necessariamente uma partida mais divertida.

Prioridade: **renda de liderança → preços locais → decisões da IA → apoios e interferência → eventual ajuste de desempate do debate**. Os valores sugeridos são uma primeira configuração coerente para experimentar, não um equilíbrio já comprovado em partidas.
