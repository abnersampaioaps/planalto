# Rumo ao Planalto — v6

Simulador brasileiro de estratégia eleitoral para navegador e celular. Inspirado na experiência de jogos de conquista eleitoral, mas sem vínculo com o TSE nem com o jogo comercial 270.

**Jogar:** https://abnersampaioaps.github.io/planalto/

## Regras da versão 6

- **Mapa neutro:** as 27 unidades federativas começam sem investimentos e sem líder. Cinza indica estado sem liderança isolada ou empatado.
- **Apoio bruto estadual:** se o candidato investiu `I` vezes e todos os candidatos somam `T` investimentos naquela UF, `apoio = I / max(10, T)`. A parcela restante até dez investimentos é uma reserva interna de votos ainda não atribuídos.
- **Apenas votos válidos nos gráficos:** a parcela não atribuída nunca é exibida como candidato ou barra. O ranking nacional mostra `votos do candidato / soma dos votos atribuídos a todos os candidatos`. No início, todos estão com 0% porque ninguém recebeu votos; após um investimento isolado, o primeiro candidato tem 100% dos votos válidos, embora o apoio bruto daquela UF seja 10%.
- **Eleitorado ponderado:** cada UF possui uma estimativa ilustrativa de eleitores; o apoio bruto determina o número de votos simulados atribuído a cada candidato. Não há vínculo com resultados eleitorais atuais.
- **Investimento:** um clique equivale a um investimento estadual, com custo fixo por UF; cada candidato pode fazer até 2 por UF por rodada e acumular até 10 por UF.
- **Dinheiro:** R$ 250 mil iniciais para todos; R$ 250 mil de renda-base por nova rodada, acrescidos de R$ 12 mil por UF liderada sem empate. Apenas campanha estadual, sem ações regionais ou nacionais.
- **Dois turnos:** a maioria absoluta dos votos válidos simulados vence no primeiro turno; sem maioria, os dois mais votados disputam o segundo, que recomeça com mapa neutro e caixa inicial de R$ 250 mil para cada finalista.
- **Salvamento:** separado das versões anteriores, em uma chave v6 no navegador.

## Referências

- [Regras eleitorais brasileiras (TSE)](https://www.tse.jus.br/comunicacao/noticias/2022/Outubro/entenda-como-e-eleito-o-presidente-da-republica)
- [Contornos estaduais brasileiros, br-geojson (CC0/IBGE)](https://github.com/henriquemalvar/br-geojson)

**Importante:** os números, participações e candidatos são recursos de uma simulação fictícia. A reserva interna de apoio não atribuído não é uma classificação oficial de votos nulos ou brancos; trata-se de uma convenção de jogo.
