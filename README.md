# Rumo ao Planalto — V8

Simulador independente de estratégia eleitoral brasileira para navegador e celular, com layout horizontal.

**Jogar:** https://abnersampaioaps.github.io/planalto/

## Novidades da V8

### Seleção de candidatos

A tela inicial permite **escolher exatamente seis candidatos** e, entre eles, quem você controlará. Os demais cinco são controlados pela IA, com estratégias distintas. Para trocar uma opção, desmarque um nome e escolha outro.

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

Há ainda uma seção de **cenários alternativos** com Jair Bolsonaro, Marina Silva, Ciro Gomes, Simone Tebet, Tarcísio de Freitas, Fernando Haddad e Geraldo Alckmin. A presença deles nessa seção não significa candidatura à Presidência em 2026.

Para as novas figuras de 2026 sem uma classificação ideológica verificada individualmente no jogo, a **afinidade de campanha é neutra (×1)**. Isso evita atribuir automaticamente preferências ideológicas ou desempenhos eleitorais. Os personagens da versão anterior mantêm os multiplicadores de balanceamento que já possuíam.

### Segundo turno com continuidade

Se ninguém alcançar mais de 50% dos votos válidos simulados no primeiro turno, os dois mais votados avançam. **Todas as ações pagas acumuladas pelos dois finalistas são preservadas por estado**, inclusive sua influência multiplicada pelo perfil de afinidade. **As ações dos quatro eliminados são retiradas**; votos e percentuais são recalculados somente com os finalistas.

Um estado que estava fechado porque um eliminado chegou a 10 pontos pode reabrir após a retirada dos investimentos desse personagem. Um estado fechado por um finalista permanece fechado. Os contadores **por rodada** são zerados, a rodada volta a 1 e o caixa de cada finalista recomeça com R$ 250 mil; o investimento estadual acumulado não recomeça.

## Regras principais

- Mapa neutro ao iniciar uma eleição, com 27 unidades federativas.
- Percentual bruto por UF = influência efetiva do candidato / `max(10, soma das influências efetivas na UF)`. A parcela ainda não atribuída não aparece no gráfico.
- Ranking nacional e apuração utilizam apenas votos válidos simulados atribuídos aos candidatos, ponderados pelo eleitorado ilustrativo de cada UF.
- Cada ação estadual tem um custo fixo relacionado ao tamanho do eleitorado. As afinidades históricas dão multiplicadores de ×1, ×1,5 ou ×2 para personagens com esse recurso configurado.
- **Até duas ações por candidato e estado por rodada, exceto na última rodada de cada turno eleitoral**, em que não há limite por rodada.
- Uma UF fecha para todos quando qualquer candidato chega a **10 pontos efetivos de influência**. Os investimentos existentes permanecem.
- **R$ 250 mil iniciais e R$ 250 mil de renda-base a cada nova rodada**, mais **R$ 50 mil por UF liderada sem empate**.
- Todos obedecem às mesmas regras de saldo, investimento, fechamento e turnos.
- O salvamento da V8 utiliza a chave local `rumo_ao_planalto_v8`, independente da V7. Uma partida anterior não é sobrescrita, mas não é migrada automaticamente.

## Fontes e licenças

- [TSE — Relação de candidaturas de 2026](https://www.tse.jus.br/comunicacao/noticias/2026/Setembro/eleicoes-2026-tem-12-candidaturas-na-disputa-pela-presidencia-da-republica)
- [TSE — Dados Abertos das eleições de 2022](https://dadosabertos.tse.jus.br/dataset/resultados-2022)
- [br-geojson: contornos estaduais (CC0/IBGE)](https://github.com/henriquemalvar/br-geojson)
- [partidos-brasil-svg: logotipos disponíveis (MIT)](https://github.com/avoarpj/partidos-brasil-svg), com atribuição em [assets/LICENSE-ATTRIBUTION.txt](assets/LICENSE-ATTRIBUTION.txt)

Os partidos sem SVG local são exibidos por siglas textuais. **Este jogo não é afiliado ao TSE nem a candidatos ou partidos políticos.** Os resultados, percentuais, afinidades e orçamentos são fictícios, não representando pesquisa eleitoral, recomendação de voto ou projeção real.
