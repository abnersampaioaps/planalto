# Rumo ao Planalto — v4

Jogo independente de estratégia eleitoral brasileira para computador e celular.

**Jogar:** https://abnersampaioaps.github.io/planalto/

## Mecânica

- Seis candidatos no primeiro turno (jogador e cinco IAs).
- Mapa interativo geográfico do Brasil com as 27 unidades federativas; estado pintado com a cor do líder, sem busca externa de contornos.
- Forças eleitorais estaduais iniciais e orçamento por personagem; são ajustes de balanceamento fictícios inspirados, quando indicado, no histórico eleitoral.
- **Investimento estadual de um clique:** custo próprio e fixo de cada estado calculado pelo tamanho do eleitorado simulado. Não há seletor de 1, 2 ou 3 níveis.
- **Até 2 investimentos diretos em cada estado por candidato por rodada**, inclusive para a IA. Os investimentos acumulam ao longo das rodadas e são mostrados em barras por candidato no painel do estado.
- No celular deitado (paisagem), o **mapa fica à esquerda e o painel de investimentos à direita**; há um layout vertical adaptável para o celular em pé.
- Ações regionais e nacionais mantidas, assim como o caixa e a apuração.
- Se ninguém ultrapassar metade dos votos válidos no primeiro turno, os dois mais votados disputam o segundo turno, sem transferências automáticas dos votos originais.
- Salvamento no próprio navegador, com versão de dados v4 (as versões anteriores não são restauradas nesta edição).

## Dados e avisos

Dados geográficos de [br-geojson (CC0/IBGE)](https://github.com/henriquemalvar/br-geojson); referência de eleições de [Dados Abertos TSE — resultados de 2022](https://dadosabertos.tse.jus.br/dataset/resultados-2022).

Este protótipo é fictício, sem qualquer vínculo com políticos ou campanhas. Os valores iniciais não são pesquisas ou projeções da eleição presente. O projeto não utiliza nem reproduz o código proprietário do jogo *270*.
