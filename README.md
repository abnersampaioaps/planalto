# Rumo ao Planalto — v3

Simulador independente de estratégia eleitoral brasileira para navegador e celular.

**Jogar:** https://abnersampaioaps.github.io/planalto/ (após ativar o GitHub Pages em Settings → Pages, usando `main` e `/(root)`).

## Recursos

- 6 candidatos no 1º turno: o jogador e 5 rivais controlados pelo computador.
- Mapa geográfico real com as 27 unidades federativas, **incorporado no HTML** para funcionar sem buscar dados de outros servidores. Estado pintado pela cor de quem lidera.
- Painel superior de barras horizontais, nomes, posições, percentuais e votos válidos simulados.
- Influências iniciais distintas por candidato e estado e recursos de campanha diferentes para cada candidatura.
- **Até 2 investimentos diretos por estado, por candidato e por rodada**. A IA obedece ao mesmo limite. Mobilização regional: 1 uso por região/rodada. Campanha nacional: 1 uso por turno eleitoral (1º ou 2º).
- Mais de 50% dos votos válidos vence no 1º turno. Sem maioria absoluta, os dois primeiros disputam o 2º turno com nova distribuição simulada de preferências.
- Salvamento de partida local no navegador (versão 3 independente do salvamento da versão anterior).

## Critérios de referência

A força geográfica inicial de Lula e Jair Bolsonaro foi inspirada nas **proporções de votos válidos por UF no primeiro turno de 2022**; valores reescalados para um jogo com seis candidatos. Isso **não** é uma pesquisa, previsão da eleição atual ou percentual real dos candidatos no momento do jogo.

A força regional de Ciro Gomes, Marina Silva, Simone Tebet, Tarcísio de Freitas, Fernando Haddad e Geraldo Alckmin e todos os valores de orçamento são hipóteses de **balanceamento de jogo**, não dados oficiais.

Dados consultados: [TSE — Eleições 2022](https://dadosabertos.tse.jus.br/dataset/resultados-2022), [apuração estadual de 2022](https://jc.uol.com.br/politica/2022/10/15092402-veja-em-quais-estados-lula-e-bolsonaro-se-sairam-melhor-no-primeiro-turno-das-eleicoes-2022.html) e [contornos estaduais br-geojson (CC0/IBGE)](https://github.com/henriquemalvar/br-geojson).

Este é um jogo fictício, sem vínculo com políticos, campanhas ou com o jogo proprietário *270*.
