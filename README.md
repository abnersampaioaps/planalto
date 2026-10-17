# Rumo ao Planalto — V7

Jogo independente de estratégia eleitoral brasileira, para navegador e celular (incluindo modo horizontal).

**Jogar:** https://abnersampaioaps.github.io/planalto/

## Candidaturas e filiações (referência: outubro/2026)

| Personagem | Partido | Espectro aproximado | Afinidade utilizada |
|---|---|---|---|
| Lula | PT | Centro-esquerda | Esquerda |
| Jair Bolsonaro | PL | Direita | Direita |
| Marina Silva | REDE | Centro-esquerda | Esquerda |
| Ciro Gomes | PSDB | Centro | Centro |
| Simone Tebet | PSB | Centro | Centro |
| Tarcísio de Freitas | Republicanos | Direita | Direita |
| Fernando Haddad | PT | Centro-esquerda | Esquerda |
| Geraldo Alckmin | PSB | Centro-direita | Direita |

A classificação ideológica é uma aproximação didática; não representa autodeclaração de cada político, nem consenso acadêmico. A filiação partidária é a referência utilizada no jogo e pode mudar com o tempo. Os sete valores disponíveis para a variável de espectro são **extrema esquerda, esquerda, centro-esquerda, centro, centro-direita, direita e extrema direita**. Nenhuma candidatura atual foi obrigatoriamente colocada nos extremos.

## Afinidade eleitoral — regra V7

A afinidade estadual usa exclusivamente as **porcentagens de votos válidos de Lula no segundo turno presidencial de 2022** como uma referência histórica de balanceamento (não previsão da eleição atual). São três grupos lúdicos: mais favorável à esquerda, competitivo e mais favorável à direita. A regra é simétrica para candidatos de esquerda e direita; os candidatos de centro recebem afinidade maior nos estados mais equilibrados.

**Multiplicadores usados:**

- Candidato de esquerda/centro-esquerda: ×2 em UFs onde Lula obteve **pelo menos 65%** em 2022; ×1,5 de **55% a menos de 65%**; ×1 nos demais estados.
- Candidato de direita/centro-direita: ×2 onde Lula obteve **até 35%**; ×1,5 onde obteve **mais de 35% e até 45%**; ×1 nos demais estados.
- Candidato de centro: ×2 onde Lula obteve **de 45% a 55%, inclusive**; ×1,5 entre **40–45% (45 excluído)** ou **55–60% (55 excluído)**; ×1 nos demais estados.

**Ações ≠ influência.** Cada ação é paga normalmente. Em uma UF com multiplicador ×2, duas ações pagas geram quatro pontos de influência. A barra estadual exibe os pontos efetivos, enquanto o jogo guarda separadamente as ações reais executadas.

**Fórmula de apoio de um candidato na UF:**
`influência efetiva do candidato / max(10, soma da influência efetiva de todos na UF)`.

A reserva de apoio ainda não atribuída fica somente no cálculo, nunca no ranking. O ranking nacional e a apuração do vencedor utilizam os **votos válidos simulados** atribuídos aos candidatos, ponderados pelo eleitorado de cada UF.

## Regras gerais

- O mapa começa neutro (sem investimentos nem votos atribuídos).
- No **1º ao 4º turno de rodada** (rodadas 1 a 4), até **2 ações diretas por candidato e por UF a cada rodada**. **Da rodada 5 em diante**, sem limite por rodada.
- Cada candidato pode fazer até dez ações pagas por UF, mas a **UF fecha assim que qualquer candidato atinge dez pontos efetivos de influência**. Todos os investimentos anteriores permanecem e ninguém mais pode investir naquela UF no mesmo turno eleitoral.
- Caixa inicial igual de **R$ 250 mil** para todos; cada rodada seguinte rende **R$ 250 mil + R$ 12 mil por UF com liderança isolada**. Estados neutros e empatados não geram bônus.
- Cinco adversários têm estratégias distintas: investir em grandes colégios eleitorais, arrecadar bônus, conquistar e fechar estados, disputar lideranças, defender território.
- Ninguém precisa obter vantagem inicial; as vantagens só existem quando há ação de campanha.
- Primeiro turno com seis candidaturas; mais de 50% dos votos válidos simulados encerra a disputa. Caso contrário, os dois mais votados disputam segundo turno, reiniciando o mapa e o orçamento da etapa.
- Os arquivos HTML, CSS, mapa e logotipos estão no próprio repositório; sem depender de chamadas remotas para desenho do mapa.
- A versão 7 inicia um **novo salvamento (`rumo_ao_planalto_v7`)**. Versões anteriores ficam intactas no armazenamento do navegador.

## Fontes e licenciamento

- [TSE — Dados Abertos das Eleições 2022](https://dadosabertos.tse.jus.br/dataset/resultados-2022)
- [Resultado por estado, segundo turno de 2022 (UOL/TSE)](https://noticias.uol.com.br/eleicoes/2022/analise/presidente-2-turno/resultado-da-eleicao-para-presidente-no-2-turno-em-todos-os-estados/)
- [Contornos geográficos, br-geojson (CC0/IBGE)](https://github.com/henriquemalvar/br-geojson)
- [Símbolos partidários SVG, avoarpj/partidos-brasil-svg (MIT)](https://github.com/avoarpj/partidos-brasil-svg). A atribuição e o texto da licença estão em [assets/LICENSE-ATTRIBUTION.txt](assets/LICENSE-ATTRIBUTION.txt).

Os símbolos e nomes dos partidos são utilizados para identificação informativa no simulador. Seu uso **não representa apoio, vínculo institucional ou autorização dos partidos**. As classificações ideológicas e as regras de bônus são hipóteses simplificadoras de um jogo, não pesquisas de intenção de voto, previsões ou alegações sobre toda a população de um estado.
