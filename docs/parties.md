# Partidos: cadastro atual e contexto de eleição

Data da revisão: 20/10/2026. São dados estáticos do jogo, não uma consulta automática ao TSE a cada partida.

## Critérios

- Em Personalizada, filiação “A confirmar” ou “Sem partido” usa o último partido disponível nos registros eleitorais do jogo (ou cadastro legado). O cartão indica “último partido”; isso não afirma filiação atual. Anos específicos e partidas já salvas mantêm seus próprios registros.

- `PEOPLE` representa o cadastro padrão; `CURRENT_PARTY_UPDATES` corrige os partidos de campanha anteriormente usados como padrão. `LEGACY_PARTIES` existe apenas para migrar salvamentos antigos sem mudar suas siglas.
- `PARTIES_BY_ELECTION` contém as siglas usadas pelos candidatos presidenciais de cada atalho, mantendo denominações da época (PSL, PPS, PSDC, PPL etc.). Não existe um segundo cadastro da mesma pessoa.
- Candidatos adicionados manualmente a um ano em que não disputaram a Presidência usam o partido padrão, com aviso explícito. Não se presume sua filiação histórica.
- Personalizada restaura o cadastro atual, sem desfazer a seleção. Ajustar caixas dentro de um ano preserva aquele contexto; o texto informa “seleção personalizada”.
- A partida guarda `electionYear` e `candidateParties` para todos os participantes. Isso vale também para eliminados, apoios e segundo turno. A prévia de nova partida não consulta o snapshot de uma partida anterior.
- “Sem partido” é usado quando há notícia de desfiliação e nenhuma nova filiação confirmada nesta revisão. “A confirmar” é usado quando nem esse estado pode ser assegurado. Para falecidos, registra-se a última filiação, e não o sucessor moderno do partido.
- Os perfis Esquerda/Centro/Direita são regras de balanceamento: mudar a sigla não os altera.

## Atualizações e situações especiais

| Personagem | Padrão | Referência |
| --- | --- | --- |
| Enéas Carneiro | PR (último partido) | [Folha, falecimento em 2007](https://www1.folha.uol.com.br/folha/brasil/ult96u91951.shtml) |
| Anthony Garotinho | REPUBLICANOS | [Candidatura de 2026, Folha](https://www1.folha.uol.com.br/poder/eleicoes/candidatos/2026/rj/governador/garotinho-190002550196.shtml) |
| Heloísa Helena | REDE | [Câmara dos Deputados](https://www.camara.leg.br/deputados/234788?ano=2026) |
| Cristovam Buarque | PSB | [PSB, abril de 2026](https://psb40.org.br/cristovam-discute-candidatura-a-deputado-federal/) |
| Ana Maria Rangel | A confirmar | [Biografia com candidatura pelo PRP em 2006](https://pt.wikipedia.org/wiki/Ana_Maria_Rangel); não foi confirmada filiação atual, portanto PRP não é apresentado como atual. |
| Luciano Bivar | MDB | [Câmara dos Deputados](https://www.camara.leg.br/deputados/74478/biografia) |
| Ivan Pinheiro | A confirmar | [Relato e carta de afastamento do PCBR em 2025](https://marxismo.org.br/sobre-o-afastamento-organico-de-ivan-pinheiro-do-pcbr/); sem confirmação de nova filiação. |
| Pastor Everaldo | PODE | [Registro de candidatura de 2026 noticiado por O Dia](https://odia.ig.com.br/colunas/informe-do-dia/2026/09/7302137-tre-atropela-a-familia-everaldo.html) |
| João Amoêdo | Sem partido | [Desfiliação do Novo, CNN](https://www.cnnbrasil.com.br/politica/joao-amoedo-anuncia-desfiliacao-novo/); não foi encontrada nova filiação confirmada. |
| Henrique Meirelles | UNIAO | [Biografia e filiação desde 2022](https://pt.wikipedia.org/wiki/Henrique_Meirelles) |
| Álvaro Dias | MDB | [Nota do MDB de junho de 2026](https://www.mdb.org.br/mdb-reafirma-pre-candidaturas-de-rafael-greca-ao-governo-e-alvaro-dias-confira-nota-oficial-sobre-eleicoes-no-parana/) |
| João Goulart Filho | PCDOB | [PCdoB, direção e candidatura](https://pcdob.org.br/noticias/pcdob-df-lanca-pre-candidaturas-de-joao-goulart-e-ana-prestes/) |
| Soraya Thronicke | PSB | [Filiação em abril de 2026](https://www.bol.uol.com.br/noticias/2026/04/06/soraya-thronicke-deixa-o-podemos-e-se-filia-ao-psb-de-olho-na-reeleicao-ao-senado.amp.htm) |
| Padre Kelmon | PL | [Site do próprio candidato](https://padrekelmon.com.br/) |

Plínio de Arruda Sampaio (PSOL) e Levy Fidelix (PRTB) conservam seus últimos partidos e recebem a indicação de falecidos no cadastro.

## Conferências adicionais

- [TSE: chapas presidenciais de 2026 e partidos](https://www.tse.jus.br/comunicacao/noticias/2026/Setembro/tse-valida-seis-registros-de-candidatura-a-presidencia-da-republica).
- [Ciro Gomes no PSDB](https://www.psdb.org.br/acompanhe/notas-oficiais/psdb-nacional-da-boas-vindas-a-ciro-gomes/), [Simone Tebet no PSB](https://psb40.org.br/simone-tebet-oficializa-filiacao-ao-psb-para-disputar-o-senado-nas-eleicoes/), [Marina Silva na Rede](https://www.camara.leg.br/deputados/220637/biografia), [Alckmin no PSB](https://agenciabrasil.ebc.com.br/politica/noticia/2026-07/psb-oficializa-candidatura-de-geraldo-alckmin-vice-presidencia).
- [Pablo Marçal pelo PRTB em agosto de 2026](https://agenciabrasil.ebc.com.br/politica/noticia/2026-08/prtb-traz-pablo-marcal-para-disputar-presidencia), [Cabo Daciolo pelo Mobiliza em 2026](https://www.brasileleitoral.com.br/candidato/40002551740).
- Os partidos dos atalhos históricos seguem as tabelas de candidatos/resultados das fontes de 2002–2022 listadas no README. Exemplos: Marina PV em 2010 / PSB em 2014 / REDE em 2018; Ciro PPS em 2002 / PDT em 2018 e 2022; Jair Bolsonaro PSL em 2018 / PL em 2022; Alckmin PSDB em 2006 e 2018; Tebet MDB em 2022.

## Imagens

Os SVGs locais adicionais de MDB, PCdoB, PDT, Podemos, PV e União Brasil vêm do mesmo repositório MIT já usado no jogo (`avoarpj/partidos-brasil-svg`, revisão `59e77d7204ca13d5f720004794edc4272fa442ed`). A atribuição está em `assets/LICENSE-ATTRIBUTION.txt`.

DC, Democrata, PRONA, PR, PPS, PRP, PSL, PSDC, PSC, Patriota, PPL e PTB também têm imagens locais, obtidas da Wikimedia Commons, com fontes e licenças em [PARTY-LOGO-SOURCES.md](../assets/PARTY-LOGO-SOURCES.md). Nenhum partido cadastrado depende de imagem externa ou do logo de seu sucessor. O logo acompanha a sigla do contexto da eleição, não necessariamente a versão gráfica exata daquele ano. “Sem partido” usa S/P; “A confirmar” usa ?. O emblema de sigla continua como proteção contra falhas de carregamento.
