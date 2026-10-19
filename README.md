# Rumo ao Planalto — V8.10

Simulador independente de estratégia eleitoral brasileira para navegador e celular, com layout horizontal.

**Jogar:** https://abnersampaioaps.github.io/planalto/

## V8.10 — saldo acumulado do primeiro para o segundo turno

Os dois finalistas conservam o **saldo financeiro restante ao fim do primeiro turno**. Na **primeira rodada do segundo turno**, seu caixa é calculado por:

`Caixa inicial 2º turno = saldo final 1º turno + R$ 250.000 + (R$ 50.000 × quantidade de estados liderados isoladamente)`.

- O bônus estadual é calculado após a retirada dos investimentos dos candidatos eliminados, considerando o mapa já recalculado apenas com os dois finalistas.
- Empates não geram bônus e o cálculo vale igualmente para jogador e IA.
- Os investimentos territoriais dos finalistas continuam preservados, e apenas o contador de ações **por rodada** é zerado.
- A regra vale em todas as dificuldades e se aplica quando um segundo turno é iniciado a partir desta versão, inclusive nas partidas antigas que ainda aguardam a transição. Quem já iniciou o segundo turno não recebe um crédito extra retroativamente.
- A partir da segunda rodada do segundo turno, continuam valendo os pagamentos normais de renda e de liderança.

## V8.9 — encerramento antecipado quando todos os estados estão fechados

- O **primeiro ou segundo turno** é concluído e apurado assim que as 27 UFs estiverem fechadas (algum candidato atingiu 10 pontos efetivos em cada uma), mesmo que ainda restem rodadas.
- Se o último estado for fechado pelo jogador, a apuração ocorre **imediatamente após o investimento**, sem precisar encerrar a rodada.
- Se o último estado for fechado durante ações da IA, a apuração ocorre **na mesma rodada**, antes de distribuir renda ou avançar a rodada. Nenhum outro adversário investe depois de todos os estados fecharem.
- O **aviso de apuração**, tanto do primeiro quanto do segundo turno, informa explicitamente que a disputa terminou antecipadamente porque todos os 27 estados foram fechados.
- No primeiro turno, seguem valendo a vitória por maioria absoluta dos votos válidos e, quando aplicável, a classificação dos dois finalistas. No segundo, ganha quem tiver mais votos válidos.
- Os investimentos dos finalistas continuam preservados. Se o segundo turno iniciar com os 27 estados ainda fechados, sua apuração também ocorre imediatamente.
- O motivo do encerramento é armazenado no salvamento, preservando a informação do aviso após recarregar a página. Salvamentos anteriores seguem compatíveis.

## V8.8 — nome completo e partido no ranking

- O gráfico de projeção nacional sempre exibe o **nome completo cadastrado do candidato e a sigla do partido entre parênteses**, por exemplo `Flávio Bolsonaro (PL)`.
- O CSS permite quebra de linha em vez de cortar o nome com reticências, inclusive no celular com dez participantes.
- A grade do ranking foi adaptada para acomodar nomes mais longos, preservando a barra e os percentuais.
- Não houve mudanças em investimentos, cálculo de votos, bônus, dificuldades, segundo turno ou partidas salvas.

## V8.7 — de 2 a 10 participantes em todas as dificuldades

- A tela inicial permite escolher **de 2 a 10 personagens**, sendo um controlado pelo jogador e de **1 a 9 pela IA**, independentemente da dificuldade (Iniciante, Normal ou Experiente).
- O limite de dez é aplicado à seleção, às validações da partida, ao carregamento de salvamentos e ao botão de nova eleição. Partidas anteriores de 2 a 6 participantes continuam válidas.
- Os adversários contam com **9 estratégias de IA**, preservando as cinco anteriores e acrescentando custo-benefício, estados em aberto, pressão nos rivais e consolidação de base.
- Para 7 a 10 participantes, o ranking ganha rolagem em telas menores para não deslocar excessivamente o mapa.
- Os **dois mais votados** continuam avançando ao segundo turno de **4 rodadas**, quando necessário. Os investimentos dos finalistas permanecem, e as ações pagas dos eliminados são descartadas.
- Orçamento, limite de influência, perfil de campanha e multiplicadores históricos (inclusive os reduzidos no Experiente) continuam iguais.

## V8.6 — bônus reduzidos na dificuldade Experiente

A dificuldade **Experiente** (hard) mantém as mesmas faixas históricas estaduais e os perfis fixos dos personagens, mas reduz os multiplicadores para **todos os participantes, incluindo o jogador e a IA**:

| Bônus por afinidade | Iniciante / Normal | Experiente |
|---|---:|---:|
| Forte | ×2 | ×1,5 |
| Moderada | ×1,5 | ×1,25 |
| Sem afinidade | ×1 | ×1 |

A influência efetiva utiliza agora **precisão de 0,25 ponto** (como 1,25 e 3,75), sem arredondar para 0,5. O teto estadual de 10 pontos e o fechamento do estado seguem inalterados. A IA continua utilizando até 95% do caixa disponível no nível Experiente (83% no Normal e 58% no Iniciante); todos os candidatos usam os mesmos multiplicadores reduzidos nesse nível.

A nova regra afeta a influência da partida de acordo com a dificuldade escolhida, inclusive partidas salvas: o salvamento continua utilizando a chave `rumo_ao_planalto_v8`. No modo Normal/Iniciante, os multiplicadores permanecem inalterados.

## V8.5 — eleitorado visível e segundo turno de 4 rodadas

- O texto **“Eleitorado simulado · N pessoas”** aparece também em telas horizontais de pouca altura, inclusive monitores de computador.
- A duração selecionada de **6, 10 ou 14 rodadas** vale somente para o **primeiro turno**.
- Quando houver segundo turno, ele sempre terá **4 rodadas**. As regras de até duas ações pagas por candidato e UF valem até a terceira rodada; a quarta é a última e libera mais ações, respeitando o teto de influência, o caixa e os estados fechados.
- Os investimentos estaduais dos dois finalistas continuam acumulados; as ações dos eliminados são retiradas. A duração de quatro rodadas se aplica aos segundos turnos iniciados após esta atualização.
- O salvamento continua na chave `rumo_ao_planalto_v8`. Partidas já iniciadas no segundo turno antes da atualização não são reiniciadas automaticamente.

## V8.4 — perfis de campanha fixos dos 23 personagens

A orientação de campanha é uma **regra fixa desta simulação, definida pelo usuário**, e não uma classificação ideológica oficial. Ela **não pode ser editada no formulário** nem alterada durante as partidas. A V8.4 adiciona os personagens históricos **Dilma Rousseff (PT)** e **Aécio Neves (PSDB)**, ambos identificados com os partidos de suas candidaturas presidenciais de 2014.

| Personagem | Partido | Perfil fixo no jogo |
|---|---|---|
| Lula | PT | Esquerda |
| Flávio Bolsonaro | PL | Direita |
| Ronaldo Caiado | PSD | Direita |
| Rui Costa Pimenta | PCO | Esquerda |
| Samara Martins | UP | Esquerda |
| Romeu Zema | Novo | Direita |
| Hertz Dias | PSTU | Esquerda |
| Edmilson Costa | PCB | Esquerda |
| Renan Santos | Missão | Direita |
| Wilson Grassi | Democrata | Centro |
| Clariana Barão | DC | Centro |
| Augusto Cury | Avante | Centro |
| Jair Bolsonaro | PL | Direita |
| Marina Silva | REDE | Esquerda |
| Ciro Gomes | PSDB | Centro |
| Simone Tebet | PSB | Centro |
| Tarcísio de Freitas | Republicanos | Direita |
| Fernando Haddad | PT | Esquerda |
| Geraldo Alckmin | PSB | Centro |
| José Serra | PSDB | Centro |
| Enéas Carneiro | PRONA (histórico) | Centro |
| Dilma Rousseff | PT | Esquerda |
| Aécio Neves | PSDB | Centro |

### Bônus estadual conforme a votação de 2022

A base histórica é a **porcentagem de votos válidos recebida por Lula no segundo turno presidencial de 2022, por UF**. Essa é uma regra de balanceamento fictícia, não uma medição da ideologia dos habitantes de cada estado.

| Percentual de Lula em 2022 | Perfil Esquerda | Perfil Centro | Perfil Direita |
|---|---:|---:|---:|
| 65% ou mais | ×2 | ×1 | ×1 |
| 55% a menos de 65% | ×1,5 | ×1,5 | ×1 |
| 45% a menos de 55% | ×1 | ×2 | ×1 |
| Mais de 35% a menos de 45% | ×1 | ×1,5 | ×1,5 |
| 35% ou menos | ×1 | ×1 | ×2 |

O perfil é consultado diretamente no cadastro fixo dos personagens. Saves anteriores da V8 que contenham `profileById` não substituem os perfis agora fixos; a chave de salvamento continua `rumo_ao_planalto_v8`. Investimentos, regras da IA, escolha de 2 a 10 candidaturas, renda e continuidade para o segundo turno são preservados.

## Novidades da V8

### Seleção de candidatos

A tela inicial permite escolher **de 2 a 10 participantes** e definir qual deles você controlará. Os demais, de um a nove, serão controlados pela IA. Para trocar um nome quando houver dez selecionados, desmarque outro antes. Com apenas dois participantes, a partida geralmente se encerra no primeiro turno, se alguém superar 50% dos votos válidos simulados.

O grupo de **12 candidaturas oficiais à Presidência em 2026** foi extraído do [TSE, 11/09/2026](https://www.tse.jus.br/comunicacao/noticias/2026/Setembro/eleicoes-2026-tem-12-candidaturas-na-disputa-pela-presidencia-da-republica):

| Candidato | Partido |
|---|---|
| Lula | PT |
| Flávio Bolsonaro | PL |
| Ronaldo Caiado | PSD |
| Rui Costa Pimenta | PCO |
| Samara Martins | UP |
| Romeu Zema | Novo |
| Hertz Dias | PSTU |
| Edmilson Costa | PCB |
| Renan Santos | Missão |
| Wilson Grassi | Democrata |
| Clariana Barão | DC |
| Augusto Cury | Avante |

Há ainda uma seção de **cenários alternativos e históricos** com Jair Bolsonaro, Marina Silva, Ciro Gomes, Simone Tebet, Tarcísio de Freitas, Fernando Haddad, Geraldo Alckmin, **José Serra (PSDB)**, **Enéas Carneiro (PRONA, partido histórico extinto)**, **Dilma Rousseff (PT)** e **Aécio Neves (PSDB)**. A presença deles nessa seção não significa candidatura à Presidência em 2026.

**Histórico da configuração:** a V8.2 utilizava perfis neutros (×1), e a V8.3 permitia escolher perfis editáveis. Na V8.4, todos os personagens receberam configurações fixas indicadas pelo usuário. São regras de jogo, não medições de ideologia política.

### Segundo turno com continuidade

Se ninguém alcançar mais de 50% dos votos válidos simulados no primeiro turno, os dois mais votados avançam. Em partidas com apenas duas candidaturas, a regra é a mesma: o segundo turno só acontece se ninguém superar 50%. **Todas as ações pagas acumuladas pelos dois finalistas são preservadas por estado**, inclusive sua influência multiplicada pelo perfil de afinidade. **As ações dos candidatos eliminados são retiradas**; votos e percentuais são recalculados somente com os finalistas.

Um estado que estava fechado porque um eliminado chegou a 10 pontos pode reabrir após a retirada dos investimentos desse personagem. Um estado fechado por um finalista permanece fechado. Os contadores **por rodada** são zerados, a rodada volta a 1 e cada finalista mantém o saldo que tinha no fim do primeiro turno, recebendo ainda R$ 250 mil e o bônus de R$ 50 mil por estado liderado no mapa recalculado; o investimento estadual acumulado não recomeça. A partir da V8.5, novos segundos turnos duram exatamente **4 rodadas**.

## Regras principais

- Mapa neutro ao iniciar uma eleição, com 27 unidades federativas.
- Percentual bruto por UF = influência efetiva do candidato / `max(10, soma das influências efetivas na UF)`. A parcela ainda não atribuída não aparece no gráfico.
- Ranking nacional e apuração utilizam apenas votos válidos simulados atribuídos aos candidatos, ponderados pelo eleitorado ilustrativo de cada UF.
- Cada ação estadual tem um custo fixo relacionado ao tamanho do eleitorado. As afinidades históricas dão multiplicadores de ×1, ×1,5 ou ×2 para personagens com esse recurso configurado.
- **Até duas ações por candidato e estado por rodada, exceto na última rodada de cada turno eleitoral**, em que não há limite por rodada.
- Uma UF fecha para todos quando qualquer candidato chega a **10 pontos efetivos de influência**. Os investimentos existentes permanecem.
- **R$ 250 mil iniciais e R$ 250 mil de renda-base a cada nova rodada**, mais **R$ 50 mil por UF liderada sem empate**.
- Todos obedecem às mesmas regras de saldo, investimento, fechamento e turnos.
- O salvamento das versões V8/V8.1 utiliza a chave local `rumo_ao_planalto_v8`, independente da V7. Uma partida anterior não é sobrescrita, mas não é migrada automaticamente.


### Logotipos e personagens históricos (V8.1)

Foram adicionados à pasta `assets/` os símbolos SVG do PSD, PCO, UP, Novo, PSTU, PCB, Missão e Avante. Também há símbolos carregados diretamente da Wikimedia Commons para os seguintes casos:

- [Democracia Cristã (DC)](https://commons.wikimedia.org/wiki/File:Logomarca_Democracia_Crist%C3%A3.svg)
- [Democrata 35](https://commons.wikimedia.org/wiki/File:Logomarca_O_Democrata_35.png)
- [PRONA — símbolo histórico](https://commons.wikimedia.org/wiki/File:PRONA_2004_2006.png)

O [TSE registra Enéas Carneiro como candidato do PRONA em 1994](https://www.tse.jus.br/eleicoes/eleicoes-anteriores/eleicoes-1994/relacao-do-candidatos-a-presidencia-da-republica-eleicoes-1994), e o [PSDB documenta a candidatura presidencial de José Serra em 2002](https://www.psdb.org.br/pe/nota-oficial-sobre-a-candidatura-de-jose-serra/). Esses personagens históricos aparecem somente na seção de partidas alternativas e não são apresentados como candidatos registrados em 2026.

## Fontes e licenças

- [TSE — Relação de candidaturas de 2026](https://www.tse.jus.br/comunicacao/noticias/2026/Setembro/eleicoes-2026-tem-12-candidaturas-na-disputa-pela-presidencia-da-republica)
- [TSE — Dados Abertos das eleições de 2022](https://dadosabertos.tse.jus.br/dataset/resultados-2022)
- [br-geojson: contornos estaduais (CC0/IBGE)](https://github.com/henriquemalvar/br-geojson)
- [partidos-brasil-svg: logotipos disponíveis (MIT)](https://github.com/avoarpj/partidos-brasil-svg), com atribuição em [assets/LICENSE-ATTRIBUTION.txt](assets/LICENSE-ATTRIBUTION.txt)

Os logotipos disponíveis no próprio repositório aparecem em SVG. Para **DC, Democrata e PRONA**, o jogo carrega imagens da Wikimedia Commons e mostra as siglas caso não seja possível obtê-las. **Este jogo não é afiliado ao TSE nem a candidatos ou partidos políticos.** Os resultados, percentuais, afinidades e orçamentos são fictícios, não representando pesquisa eleitoral, recomendação de voto ou projeção real.
