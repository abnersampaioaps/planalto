# Rumo ao Planalto — versão 5

Simulador eleitoral de estratégia para navegador e celular.

**Jogar:** https://abnersampaioaps.github.io/planalto/

## Regras

- 6 candidatos no primeiro turno; se ninguém atingir a maioria absoluta de votos válidos, os dois mais votados disputam o segundo.
- Mapa real das 27 unidades federativas incorporado no `index.html`; a cor de cada estado indica o líder da projeção simulada.
- Um investimento direto por clique, até 2 investimentos por candidato, por estado, por rodada. As barras do painel estadual mostram investimentos acumulados de todas as candidaturas.
- O custo de cada investimento é fixo por estado e varia com o eleitorado simulado, de aproximadamente R$ 33 mil (RR) a R$ 187 mil (SP).
- **Todos os candidatos iniciam cada turno eleitoral com R$ 250 mil**.
- **Bônus de R$ 12 mil por estado liderado**, creditado no início da próxima rodada. Não existem mobilizações regionais ou ações nacionais.
- Saldo sempre visível no cabeçalho; projeção nacional em ranking de barras horizontais. No celular horizontal, mapa à esquerda e investimentos à direita.
- Campanhas são salvas localmente no navegador (chave de dados v5).

## Referências e transparência

Os percentuais e orçamentos deste jogo são ficcionais, **não são pesquisas eleitorais e não prevêem eleições reais**. A influência territorial de Lula e Jair Bolsonaro foi inspirada nos resultados de 2022 e adaptada para jogabilidade; as lideranças de outros políticos em seus territórios são hipóteses de balanceamento, não percentuais ou vitórias reais.

- [Resultados eleitorais do TSE — 2022](https://dadosabertos.tse.jus.br/dataset/resultados-2022)
- [Estados do Brasil, br-geojson (CC0/IBGE)](https://github.com/henriquemalvar/br-geojson)
- [Entenda a apuração de votos válidos — TSE](https://www.tse.jus.br/comunicacao/noticias/2022/Outubro/entenda-como-e-eleito-o-presidente-da-republica)

A interface tem inspiração geral nos painéis institucionais de resultados eleitorais, mas o jogo é independente e **não é afiliado ao TSE** nem ao jogo comercial 270.
