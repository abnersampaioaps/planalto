# Rumo ao Planalto — V8.5

Simulador independente de estratégia eleitoral brasileira para navegador e celular, com layout horizontal.

**Jogar:** https://abnersampaioaps.github.io/planalto/

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

O perfil é consultado diretamente no cadastro fixo dos personagens. Saves anteriores da V8 que contenham `profileById` não substituem os perfis agora fixos; a chave de salvamento continua `rumo_ao_planalto_v8`. Investimentos, regras da IA, escolha de 2 a 6 candidaturas, renda e continuidade para o segundo turno são preservados.

## Novidades da V8

### Seleção de candidatos

A tela inicial permite escolher **de 2 a 6 participantes** e definir qual deles você controlará. Os demais, de um a cinco, serão controlados pela IA. Para trocar um nome quando houver seis selecionados, desmarque outro antes. Com apenas dois participantes, a partida geralmente se encerra no primeiro turno, se alguém superar 50% dos votos válidos simulados.

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

Um estado que estava fechado porque um eliminado chegou a 10 pontos pode reabrir após a retirada dos investimentos desse personagem. Um estado fechado por um finalista permanece fechado. Os contadores **por rodada** são zerados, a rodada volta a 1 e o caixa de cada finalista recomeça com R$ 250 mil; o investimento estadual acumulado não recomeça. A partir da V8.5, novos segundos turnos duram exatamente **4 rodadas**.

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
