# Planejamento da IA: implementação e validação

Foram implementadas três prioridades do estudo: comparar o retorno das ações, financiar o uso das promessas e poupar para apoios ou interferência presidencial. Preços, renda sem teto e regras dos dados permanecem iguais.

## Comportamentos preservados

Os nove perfis mantêm suas prioridades de investimento, afinidades estaduais, orçamentos de estratégias e preferências por ataques, debates e defesa. Todas as finalistas continuam aumentando o esforço no segundo turno. O filtro econômico é comum: evita disputas cujo retorno esperado seja inferior ao investimento disponível, com tolerância de 5% para ações ofensivas.

Os testes verificam escolhas diferentes para perfis distintos no mesmo cenário, além dos nove perfis nas três dificuldades. Isso comprova diferenças de decisão, mas não garante a mesma variedade de ações em partidas completas. Nesta amostra, ataques ficaram raros e nenhuma defesa foi comprada. O perfil defensivo ainda prioriza proteção territorial nos investimentos; sua preferência por comprar defesa depende de uma ameaça economicamente plausível.

## Comparação de 24 partidas

Foram repetidas 24 configurações do estudo anterior, com os mesmos elencos, perfis e sementes iniciais. São 16 partidas no nível normal (2, 6 e 10 candidatos; 6, 10 e 14 rodadas, excluindo 10 candidatos/14 rodadas), quatro com seis candidatos/10 rodadas nos níveis fácil e difícil, e quatro com presidente candidato no nível normal. Todos os participantes são controlados pela IA.

| Indicador | Antes | Depois |
|---|---:|---:|
| Margem média entre os dois primeiros | 19,93 p.p. | 5,68 p.p. |
| Partidas com margem menor que 5 p.p. | 3 de 24 | 12 de 24 |
| Investimentos estaduais | 1.572 | 5.803 |
| Promessas compradas | 2.007 | 160 |
| Promessas sem investimento posterior na UF | 1.128 | 0 |
| Ataques | 84 | 5 |
| Debates | 2.937 | 482 |
| Defesas | 40 | 0 |
| Apoios comprados | 0 | 21 |
| Interferências presidenciais | 0 | 2 |

A amostra ficou mais disputada, as promessas passaram a ter uso posterior e a poupança viabilizou novas ações. A redução de ataques e defesas é uma limitação relevante: diversidade de prioridades foi preservada, mas essas duas ações ficaram pouco representadas. Não foram alterados seus preços ou forçadas compras de retorno inferior para aumentar sua frequência.

## Validação e limites

- 79 testes passaram, sem falhas, incluindo persistência dos planos, liberação de reservas inviáveis, compras futuras e intensidade no segundo turno.
- As 24 simulações terminaram sem saldo negativo, influência fora dos limites ou eleição sem conclusão.
- Os mesmos perfis foram atribuídos aos mesmos candidatos em todos os pares antes/depois.
- Mudanças nas decisões alteram o consumo da sequência aleatória; as sementes iguais não garantem os mesmos dados em todas as disputas.
- A amostra pequena e sem jogador humano indica oportunidades, não prova equilíbrio geral. Os totais por perfil também dependem das oportunidades e da duração de sua participação.
- “Promessa sem uso” significa ausência de investimento pago posterior naquela UF. Não mede todos os efeitos indiretos da concentração ou de eleições futuras.

Dados: [comparação após as melhorias](ai-improvement-results.json) e [estudo anterior](simulation-results.json). O estudo visual original foi preservado como registro da versão anterior.

## Reprodução

Com Node.js, use o simulador de produção para repetir exatamente as configurações registradas:

```js
const fs = require('node:fs');
const sim = require('./scripts/simulate-economy.cjs');
const previous = JSON.parse(fs.readFileSync('docs/ai-improvement-results.json', 'utf8'));
const results = previous.results.map(row => sim.simulate(row.config));
fs.writeFileSync('/tmp/planalto-ai-recheck.json', JSON.stringify({sourceHash: sim.sourceHash, results}, null, 2));
```

Execute a partir da raiz do projeto. Os hashes SHA-256 nos arquivos identificam as versões analisadas.
