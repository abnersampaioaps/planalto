# Rumo ao Planalto — V8.20

Continuidade histórica: ao terminar uma eleição anterior a 2026, avance para a próxima mantendo seu partido e escolhendo o mesmo candidato ou outro. Cada eleição reinicia orçamento e investimentos. [Regras da continuidade](docs/continuity.md).

Simulador independente de estratégia eleitoral brasileira para navegador e celular, com layout horizontal.

**Jogar:** https://abnersampaioaps.github.io/planalto/

## Seleção por eleição — 2002 a 2026

- Na primeira etapa, **Selecionar por eleição** marca os candidatos de 2002, 2006, 2010, 2014, 2018, 2022 ou os 12 personagens de 2026 já cadastrados. Trocar o ano substitui a seleção anterior; alterar as caixas permite personalizar a disputa.
- Cada pessoa tem um único cadastro e uma única caixa. Quem já está na lista de 2026 não se repete em **Outros personagens para partidas alternativas**.
- Os históricos e personagens alternativos permanecem nessa seção, com busca por nome/partido e filtro **Só selecionados**. Ao aplicar um ano histórico, a seção abre mostrando apenas os selecionados; desmarque o filtro para explorar os demais.
- O candidato controlado é preservado se participar do novo grupo; caso contrário, é selecionado o primeiro nome do atalho. A escolha continua editável.
- O limite passa a **13 participantes**, para acomodar 2018 sem cortar nomes. Contagens dos atalhos: 2002 (6), 2006 (7), 2010 (9), 2014 (11), 2018 (13), 2022 (11), 2026 (12).
- Os atalhos históricos consideram candidatos com votos válidos no primeiro turno: em 2006, Rui Costa Pimenta não entra no atalho; em 2014 entra Marina Silva, em 2018 Fernando Haddad e em 2022 Padre Kelmon, após as substituições de candidatura. Os personagens já existentes continuam disponíveis para seleção manual.
- O ano seleciona **participantes e partidos daquela eleição**. Personalizada usa o cadastro atual. Ajustar caixas depois de escolher um ano mantém o contexto daquele ano; quem não disputou essa eleição usa o partido atual, conforme aviso na tela. Para retornar aos partidos atuais sem perder as marcações, escolha Personalizada.
- Os partidos aparecem nos cartões, busca, seletor do jogador, resumo, ranking e apoios. A partida salva uma cópia das siglas de todos os participantes, inclusive os eliminados: novas configurações ou atualizações do cadastro não alteram uma partida em andamento. Salvamentos antigos preservam as siglas usadas antes dessa funcionalidade.
- O ano não altera regras, resultados, afinidades de 2022 ou perfis de jogo. Perfis são convenções de jogo, não classificações oficiais. Todos os partidos cadastrados têm imagem local, inclusive os históricos, sem substituí-los pelos sucessores. “Sem partido” e “A confirmar” usam marcadores neutros; o emblema de sigla permanece como proteção em caso de falha de carregamento.
- Filiações revisadas em outubro de 2026. Falecidos usam o último partido conhecido; casos incertos aparecem como **A confirmar**, sem inventar filiações. Fontes e critérios em [docs/parties.md](docs/parties.md).

Referências dos grupos: [2002 — Agência Brasil](https://memoria.ebc.com.br/agenciabrasil//node/581939), [2006 — relatório do TSE](https://sintse.tse.jus.br/documentos/2006/Out/19/tse-publicacao-em-secretaria/resolucao-no-22-444-de-9-de-outubro-de-2006-eleicoes-2006-presidente-e-vice-presidente-da-republica), resultados de [2010](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_2010), [2014](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_2014), [2018](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_2018) e [2022](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_2022). O grupo de 2026 conserva a lista existente no jogo.

Validação: `node --test tests/election-presets.test.cjs`.

## V8.20 — promessas exclusivamente estaduais e concentração geográfica

- **Programa Nacional removido** do seletor de estratégias, do mapa de multiplicadores e das decisões da IA. Compras antigas permanecem no histórico da partida salva, mas não podem ser repetidas. Só as **promessas estaduais** continuam disponíveis.
- Para cada candidatura, considera-se o conjunto de UFs com **bônus positivo comprado ou herdado** (nível acima de ×1), independentemente da intensidade do bônus.
- **Regra regional:** se houver **3 ou mais UFs com bônus e todas estiverem na mesma região** (Norte, Nordeste, Centro-Oeste, Sudeste ou Sul), os estados **sem bônus** terão multiplicador **×0,9** nas próximas ações.
- **Regra por eixo:** se houver **6 ou mais UFs com bônus e todas pertencerem ao mesmo eixo** — Norte + Nordeste ou Sul + Sudeste + Centro-Oeste —, os estados **sem bônus** terão multiplicador **×0,9** nas próximas ações.
- As penalidades **não se acumulam**: mesmo quando uma condição coincide com outra, o menor multiplicador é ×0,9. Estados com bônus mantêm ×1,25 a ×2 e nunca recebem a penalidade.
- A concentração é **dinâmica**: adicionar uma promessa em outra região/eixo pode desativar a penalidade. Ao sair da concentração, multiplicadores sem bônus voltam a ×1. Os pontos de influência já conquistados não são recalculados; somente futuros investimentos usam o multiplicador vigente na hora da ação.
- Ações no estado penalizado rendem corretamente **0,9 ponto**, com precisão decimal (sem arredondar para 1). Comprar a primeira promessa nesse estado faz suas próximas ações renderem **×1,25**, não ×1,15.
- O **mapa de multiplicadores** mostra UFs penalizadas em **laranja** e as com bônus no gradiente verde existente. O painel mostra a concentração ativa e os seus efeitos.
- A **IA** continua adquirindo apenas promessas estaduais com seu orçamento, avaliando o benefício futuro e estimando possíveis perdas por uma nova concentração.
- Os bônus herdados do segundo turno podem satisfazer os limites de concentração já na rodada inicial da eleição seguinte. A regra é válida mesmo com as estratégias especiais desativadas.

## V8.19 — herança pelo multiplicador final ×1,5+

- Os **dois finalistas do último segundo turno**, se disputarem a eleição imediatamente seguinte, começam com **×1,25** em cada UF na qual seu **multiplicador ao final do turno anterior era pelo menos ×1,5** (×1,5, ×1,75 ou ×2).
- Multiplicadores finais de **×1 ou ×1,25** retornam a **×1**; os demais candidatos também iniciam em ×1. O requisito antigo de **10 pontos de investimentos** foi eliminado.
- Ter 10 pontos investidos não é mais necessário nem suficiente. O bônus pertence individualmente a cada finalista, não ao partido ou substituto, e **não transfere pontos, ações, dinheiro nem votos**.
- O ×1,25 herdado vale apenas para **investimentos futuros**, podendo ser aumentado normalmente com novas promessas, até o teto de ×2.
- A regra vale tanto para o segundo turno jogado quanto para a simulação automática entre IAs. O novo registro guarda o multiplicador final em cada UF para ambos os finalistas.
- Partidas salvas com **segundo turno jogado e concluído** são recalculadas com os multiplicadores finais disponíveis, mesmo que guardem a antiga lista de estados com 10 pontos. Resultados automáticos antigos sem os multiplicadores finais não permitem reconstrução segura e não recebem herança presumida.
- Eleições decididas no primeiro turno não concedem essa herança. Nenhuma estratégia ou custo foi alterado.

## V8.18 — herança de multiplicadores entre eleições (regra histórica substituída pela V8.19)

- **Reinício padrão:** ao avançar para a próxima eleição da trajetória, todos os multiplicadores voltam para **×1**. Orçamento, ações pagas, apoios e pontos de influência não são transferidos.
- **Regra original da V8.18, substituída na V8.19:** exigia 10 pontos de investimentos próprios. A regra atual exige multiplicador final de pelo menos ×1,5 no estado. O vencedor e o segundo colocado têm o mesmo direito.
- Na regra atual, **pontos de investimento, apoios e estratégias não são critérios de elegibilidade**: importa somente o multiplicador final (×1,5 ou mais).
- O bônus inicial não gera votos: ele afeta **apenas os novos investimentos**, como qualquer outro multiplicador. Pode ser ampliado com promessas de campanha normais, respeitando o teto ×2.
- A herança é individual: se um finalista não disputar a próxima eleição, seu bônus não passa para outro candidato ou para o partido. Ela vale **somente para a eleição imediatamente seguinte**, sem acumular benefícios de eleições mais antigas.
- A mecânica funciona tanto com o segundo turno jogado pelo usuário quanto com o segundo turno automático entre IAs após sua eliminação. A finalização guarda os estados elegíveis dos dois finalistas.
- **Salvamentos existentes:** partidas antigas com segundo turno jogável concluído podem usar os multiplicadores finais salvos. Resultados automáticos antigos sem esse registro não terão bônus inferidos.
- **Eleição resolvida no primeiro turno:** nenhum bônus de segundo turno é concedido. As estratégias e seus custos permanecem inalterados.

## V8.17 — remover Mobilização de base

- A estratégia **Mobilização de base** foi retirada das opções de campanha e das decisões da IA, pois repetia grande parte do benefício obtido com um investimento estadual comum.
- Um investimento no **mesmo estado** já recupera influência perdida por estratégias adversárias, consumindo o custo e o limite de ações daquela UF; investimentos em outros estados não recuperam pontos no estado atacado.
- O histórico de mobilizações de partidas salvas permanece legível; apenas novas compras ficam indisponíveis.
- As demais estratégias, multiplicadores e regras de orçamento continuam inalterados.

## V8.16 — multiplicadores apenas para investimentos futuros

- A compra de promessas estaduais ou de um programa nacional **não altera pontos e votos de investimentos passados**. O novo multiplicador vale exclusivamente para ações estaduais pagas depois da compra.
- Cada ação registra seus pontos definitivos de influência com o multiplicador do momento. Exemplo: uma ação ×1, promessa para ×1,25 e depois uma ação ×1,25 totalizam **2,25 pontos**, e não 2,5.
- Compras sucessivas não recalculam o passado: 1 + 1 + 1,25 + 1,5 resulta em **4,75 pontos**. O limite de 10 pontos efetivos continua.
- A IA avalia o benefício potencial **de ações futuras**, e suas simulações contabilizam corretamente a influência que seria obtida ao investir com o multiplicador atual.
- O segundo turno mantém tanto os pontos conquistados em cada UF como o multiplicador obtido por cada finalista. Novas ações podem aproveitar bônus acumulados sem alterar pontos antigos.
- **Salvamentos anteriores:** na primeira abertura após a atualização, a influência já exibida é preservada como saldo inicial; a partir desse momento, apenas investimentos novos recebem multiplicadores posteriores. O novo registro de pontos por UF é persistido junto à partida.
- O painel estadual separa pontos já conquistados do multiplicador das próximas ações. Custos e limites de aquisição dos bônus permanecem inalterados.

## V8.15 — novo mapa de multiplicadores e promessas de campanha

O tabuleiro tem agora duas abas: **Mapa eleitoral** (padrão, com lideranças e investimentos) e **Multiplicadores** (mesma cartografia, colorida conforme o multiplicador do candidato humano em cada UF). Clicar no estado muda o painel de ações e mostra também os multiplicadores dos adversários.

- **Todas as candidaturas de uma nova partida começam com ×1 em cada estado**, independentemente do perfil político, da votação histórica ou da dificuldade. Aumentos só podem ser comprados durante a eleição, até **×2 por candidato e UF**, em passos de **×0,25**.
- **Promessa estadual:** R$ 150 mil na primeira compra da UF, aumentando R$ 50 mil por melhoria já comprada naquele estado. Cada compra eleva o multiplicador apenas da candidatura compradora na UF selecionada.
- **Programa nacional de campanha (histórico V8.15–V8.19; removido na V8.20):** custava R$ 1,5 milhão e aumentava em ×0,25 os multiplicadores de estados elegíveis. Não está mais disponível para compra.
- **Estados fechados:** não podem receber novas promessas. Multiplicadores comprados aplicam-se somente aos investimentos futuros, até o limite de 10 pontos efetivos; comprar uma promessa não fecha estados automaticamente.
- **IA:** faz compras usando o próprio dinheiro e avaliando o potencial dos próximos investimentos, não ganhos retroativos. Não recebe multiplicadores gratuitos. A quantidade de compras é limitada pela capacidade financeira e pelo teto de ×2.
- **Segundo turno:** os finalistas mantêm os multiplicadores adquiridos no primeiro turno; melhorias dos eliminados não são transferidas com seus apoios. Os apoios continuam seguindo suas regras de afinidade próprias.
- **Salvamentos antigos:** partidas V8.15 ou anteriores preservam os pontos já exibidos no momento da migração; melhorias compradas depois da atualização só afetarão investimentos posteriores. Partidas novas começam com todos os multiplicadores em ×1.
- **Compatibilidade:** a chave de salvamento local `rumo_ao_planalto_v8` permanece; os níveis são registrados na partida para preservar a continuidade.

## V8.14 — antecipação da apuração para a próxima rodada

- A estratégia **Interferência nas eleições → Antecipar** agora define a última rodada do turno atual como **a próxima rodada** (rodada atual + 1), em vez de reduzir quatro rodadas do prazo anterior.
- A rodada em andamento não termina imediatamente: os jogadores ainda podem concluir suas ações nela e jogar a última rodada antes da apuração.
- Antecipar só pode ser comprado **até a antepenúltima rodada** do calendário vigente (rodada atual ≤ rodada final − 2). Na penúltima e na última rodada, a compra é bloqueada, sem descontar dinheiro ou aplicar a penalidade.
- O custo de antecipação continua **R$ 1 milhão**, com redução da projeção nacional de até 2 pontos percentuais do usuário. O adiamento continua acrescentando quatro rodadas, por **R$ 500 mil**.
- A alteração vale no primeiro e no segundo turno. Não modifica a duração de eleições futuras, a regra de estados fechados ou o funcionamento das partidas salvas.

## V8.13 — IA adaptativa no Normal e Experiente

- No **Iniciante**, a IA mantém o comportamento anterior: o perfil de investimento permanece fixo e a política de orçamento não é alterada.
- No **Normal** e **Experiente**, os adversários preservam o perfil tático sorteado, mas passam a ajustar prioridades e despesas a cada decisão com base na diferença nacional de votos e nas rodadas restantes.
- **Liderando com folga:** valorizam defesa, consolidação de lideranças e reserva de dinheiro para rodadas futuras.
- **Disputa equilibrada:** buscam estados onde ultrapassar rivais ou melhorar a margem tem maior custo-benefício.
- **Perdendo com folga:** privilegiam ganho marginal de votos, disputam estados contestados e aumentam o investimento e o uso de estratégias.
- **Nas rodadas finais ou na última chance:** entram em modo ofensivo, reduzem reservas de caixa e priorizam oportunidades de voto antes da apuração.
- O **Experiente** utiliza ajustes mais fortes e pode assumir riscos maiores que o Normal; a dificuldade não altera votos diretamente nem concede recursos extras.
- No segundo turno, a política adaptativa também controla a proporção do orçamento destinada às estratégias, os investimentos estaduais e a intensificação da campanha no fim da disputa.
- Regras anteriores de custos, teto de influência, apoios, limites estaduais e compatibilidade de partidas salvas permanecem.

## V8.12 — estratégias livres e IA mais competitiva

- As estratégias de campanha não têm mais limite de três por turno nem de uma por rodada. Jogador e IA podem repetir ações, inclusive ofensivas contra o mesmo alvo e estado, enquanto houver saldo, influência aplicável e demais pré-requisitos. Proteções ativas no mesmo estado não se acumulam.
- A última chance também permite usar várias estratégias antes de encerrar a apuração; uma ação não encerra mais automaticamente essa oportunidade.
- A IA deixou de escolher estratégias aleatoriamente: avalia ganhos esperados de margem de votos por real gasto para ataques, debates e recuperação de influência, além de considerar defesas em estados relevantes no segundo turno.
- No segundo turno, a IA deixa de reservar caixa para investimentos estaduais e pode agir em mais de 12 estados/ações na mesma rodada, sempre respeitando o limite estadual por rodada, a influência máxima, o fechamento dos estados e o saldo disponível.
- Ao negociar apoios, a IA prioriza os candidatos eliminados com transferência efetiva e aumento estimado de votos. A limitação de até três apoios, com uma compra por rodada, permanece.
- Os custos das estratégias e as regras de afinidade e voto continuam iguais. As partidas salvas permanecem na chave `rumo_ao_planalto_v8`.

## V8.11 — Apoios do 1º turno

Na segunda etapa da configuração inicial, o jogador pode habilitar ou desabilitar **Apoios do 1º turno** para toda a partida. Quando habilitada, a mecânica aparece no segundo turno como uma janela separada, mantendo mapa e ranking limpos, especialmente em telas menores.

- Com a opção habilitada, cada finalista pode conquistar no máximo **três apoios**: o primeiro custa **R$ 1 milhão**, o segundo **R$ 2 milhões** e o terceiro **R$ 4 milhões**. Um finalista só pode negociar um apoio por rodada, e a IA segue as mesmas regras.
- Com a opção habilitada, no início de cada rodada do segundo turno, o finalista que estiver atrás na votação nacional recebe a primeira oportunidade de negociação. Quando for a IA, ela exerce essa prioridade antes das ações do jogador na rodada.
- A duração escolhida no menu — 6, 10 ou 14 rodadas — vale tanto para o primeiro quanto para o segundo turno. A apuração antecipada continua acontecendo quando todas as UFs fecham.
- Quando o finalista conquistar o apoio de um eliminado com o mesmo perfil de campanha, esse apoio fica exclusivo: o outro finalista não pode mais comprá-lo.
- A afinidade entre os perfis fixos define a parcela transferível: **70%** para a mesma orientação, **50%** quando um dos perfis é Centro e **30%** entre Esquerda e Direita.
- O apoio é distribuído por UF a partir das ações que o eliminado realizou no primeiro turno. Por exemplo, 6 ações em São Paulo geram até 4,2 pontos de influência para uma afinidade de 70%.
- A janela informa antes da compra os votos estimados, o custo, o percentual de afinidade e todos os estados em que o eliminado investiu. Em cada UF, a transferência respeita o teto de 10 pontos; a parcela que não couber não é reaproveitada em outro estado.
- Na lista estadual, cada ponto recebido por apoio mostra sua origem logo abaixo da influência efetiva, como `+1,5 de apoio de Nome do candidato`.
- Os candidatos eliminados continuam fora da apuração do segundo turno. O apoio adiciona influência estadual aos finalistas, e os votos são recalculados a partir desse novo mapa; portanto, não há soma duplicada de votos.
- Se as 27 UFs fecharem cedo no segundo turno, a apuração antecipada aguarda enquanto ainda houver algum apoio capaz de gerar influência. A rodada final continua sendo o limite normal da disputa.

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
- Os **dois mais votados** continuam avançando ao segundo turno, quando necessário. Os investimentos dos finalistas permanecem, e as ações pagas dos eliminados são descartadas.
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

## V8.5 — eleitorado visível e duração de turno

- O texto **“Eleitorado simulado · N pessoas”** aparece também em telas horizontais de pouca altura, inclusive monitores de computador.
- A duração selecionada de **6, 10 ou 14 rodadas** vale para cada turno da eleição.
- Quando houver segundo turno, ele herda a duração selecionada. As regras de até duas ações pagas por candidato e UF valem até a última rodada, que libera mais ações, respeitando o teto de influência, o caixa e os estados fechados.
- Os investimentos estaduais dos dois finalistas continuam acumulados, e as ações dos eliminados são retiradas.
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

Se ninguém alcançar mais de 50% dos votos válidos simulados no primeiro turno, os dois mais votados avançam. Em partidas com apenas duas candidaturas, a regra é a mesma: o segundo turno só acontece se ninguém superar 50%. **Todas as ações pagas acumuladas pelos dois finalistas são preservadas por estado**, inclusive sua influência multiplicada pelo perfil de afinidade. **As ações dos candidatos eliminados saem do mapa**; votos e percentuais são recalculados somente com os finalistas. A partir da V8.11, elas ficam registradas apenas como base para os apoios que cada finalista decidir negociar.

Um estado que estava fechado porque um eliminado chegou a 10 pontos pode reabrir após a retirada dos investimentos desse personagem. Um estado fechado por um finalista permanece fechado. Os contadores **por rodada** são zerados, a rodada volta a 1 e cada finalista mantém o saldo que tinha no fim do primeiro turno, recebendo ainda R$ 250 mil e o bônus de R$ 50 mil por estado liderado no mapa recalculado; o investimento estadual acumulado não recomeça. O segundo turno usa a mesma duração escolhida para o primeiro.

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

Os logotipos de todos os partidos cadastrados estão no próprio repositório, em SVG, PNG ou JPG, e não dependem de conexão. Fontes e licenças dos logos adicionais estão em [assets/PARTY-LOGO-SOURCES.md](assets/PARTY-LOGO-SOURCES.md). **Este jogo não é afiliado ao TSE nem a candidatos ou partidos políticos.** Os resultados, percentuais, afinidades e orçamentos são fictícios, não representando pesquisa eleitoral, recomendação de voto ou projeção real.
