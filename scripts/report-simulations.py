"""Build the visual report from the saved game simulations (requires matplotlib)."""
from pathlib import Path
import base64, json, statistics, hashlib
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
source = json.loads((ROOT/'docs/simulation-results.json').read_text())
rows = source['results']
assert len(rows) == 132
assert len({json.dumps(r['config'], sort_keys=True) for r in rows}) == 132
assert all(len(r['roster']) == r['config']['candidates'] for r in rows)
assert not any(r['violations'] for r in rows)
assert source['sourceHash'] == hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest()
base = [r for r in rows if r['config']['group'] == 'baseline']
metrics = [m for r in base for m in r['metrics']]
sum_metric = lambda key: sum(m[key] for m in metrics)
groups = ['baseline','no-promises','no-strategies','investments-only']
labels = ['Política atual','Sem promessas','Sem estratégias','Só investimentos']
sets = [[r for r in rows if r['config']['group']==g and r['config']['difficulty']=='normal'] for g in groups]
assert all(len(s)==18 for s in sets)
navy, teal, gold, blue, grey = '#193b59','#137e77','#c78329','#4876b5','#e5ebef'
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':11,'axes.labelcolor':navy,'text.color':navy,'xtick.color':navy,'ytick.color':navy,'axes.spines.top':False,'axes.spines.right':False,'axes.spines.left':False,'axes.edgecolor':'#c7d2dc','figure.facecolor':'white','axes.facecolor':'white'})
fmt = lambda value, digits=1: f'{value:,.{digits}f}'.replace(',', 'X').replace('.', ',').replace('X','.')
def clean(ax):
    ax.set_axisbelow(True)
    ax.grid(axis='x', color='#e7edf2', linewidth=.7)
    ax.tick_params(axis='y',length=0,pad=8)

# A comparable mean plus individual observations avoids hiding the small sample.
fig, ax = plt.subplots(figsize=(11,4.4),layout='constrained')
means = [statistics.mean(r['margin'] for r in s) for s in sets]
y=np.arange(4)
ax.barh(y,means,color=teal,height=.52,zorder=2)
for i,s in enumerate(sets):
    vals=sorted(r['margin'] for r in s)
    ax.scatter(vals,[i+.32]*len(vals),s=17,color=navy,alpha=.65,zorder=3)
    ax.text(means[i]+.6,i,fmt(means[i])+' p.p.',va='center',weight='bold')
ax.set_yticks(y,labels);ax.invert_yaxis();ax.set_xlim(0,max(r['margin'] for s in sets for r in s)+3)
ax.set_xlabel('Diferença final entre os dois primeiros (pontos percentuais)')
ax.set_title('Com estratégias, as eleições ficaram menos apertadas nesta amostra\nNormal · 18 partidas por política · barras: média; pontos: partidas',loc='left',pad=18,fontsize=13)
clean(ax)
fig.savefig(ROOT/'docs/simulation-charts/margens.png',dpi=160);plt.close(fig)

fig,ax=plt.subplots(figsize=(11,4.1),layout='constrained')
left=np.zeros(4)
for key,label,color in [('localSpent','Investimentos',teal),('promiseSpent','Promessas',gold),('strategySpent','Estratégias',blue)]:
    values=[]
    for s in sets:
        mm=[m for r in s for m in r['metrics']]
        values.append(100*sum(m[key] for m in mm)/sum(m['spent'] for m in mm))
    ax.barh(y,values,left=left,color=color,height=.55,label=label)
    for i,v in enumerate(values):
        if v>=8:ax.text(left[i]+v/2,i,fmt(v)+'%',va='center',ha='center',color='white',weight='bold')
    left+=values
ax.set_yticks(y,labels);ax.invert_yaxis();ax.set_xlim(0,100);ax.set_xlabel('Participação no dinheiro gasto (%)')
ax.set_title('Promessas e estratégias disputam o orçamento dos investimentos\nNormal · mesmo conjunto de 18 cenários por política',loc='left',pad=18,fontsize=13)
ax.legend(loc='upper center',bbox_to_anchor=(.5,-.20),ncol=3,frameon=False);ax.grid(False)
fig.savefig(ROOT/'docs/simulation-charts/orcamento.png',dpi=160);plt.close(fig)

fig,axs=plt.subplots(1,2,figsize=(12,4.7),layout='constrained',gridspec_kw={'width_ratios':[1.2,1]})
a=axs[0];keys=['debate','promise','local','attack','defend','support'];names=['Debates','Promessas','Investimentos','Ataques','Defesas','Apoios']
counts=[sum_metric(k) for k in keys]
a.barh(range(6),counts,color=teal,height=.55)
for i,v in enumerate(counts):a.text(v+90,i,fmt(v,0),va='center')
a.set_yticks(range(6),names);a.invert_yaxis();a.set_xlim(0,max(counts)*1.19);a.set_xlabel('Ações realizadas');a.set_title('Debates dominam os confrontos\n54 partidas da amostra principal',loc='left',pad=16,fontsize=12);clean(a)
a=axs[1];values=[sum_metric('unusedPromises')/sum_metric('promise')*100,sum_metric('zeroPresenceDuels')/(sum_metric('attack')+sum_metric('debate'))*100]
short=['Promessas sem investimento\nposterior na mesma UF²','Confrontos iniciados\ncom influência local zero']
a.barh(range(2),values,color=gold,height=.42)
for i,v in enumerate(values):a.text(v-2,i,fmt(v)+'%',va='center',ha='right',color='white',weight='bold')
a.set_yticks(range(2),short);a.invert_yaxis();a.set_xlim(0,100);a.set_xlabel('Percentual das respectivas ações (%)');a.set_title('Sinais de decisões pouco eficientes\n54 partidas da amostra principal',loc='left',pad=16,fontsize=12);clean(a)
fig.savefig(ROOT/'docs/simulation-charts/acoes.png',dpi=160);plt.close(fig)

order=[r for r in rows if r['config']['group']=='order']
changed=sum(r['winner']!=next(x for x in rows if x['config']['group']=='reverse-order' and x['config']['seed']==r['config']['seed'])['winner'] for r in order)
pres=[r for r in rows if r['config']['group']=='presidency']
runoffs=sum(r['runoff'] for r in rows)
summary={
 'partidas':len(rows),'principal':len(base),'segundos_turnos':runoffs,'violacoes':0,
 'margens_medias_normal':dict(zip(groups,means)),
 'eleicoes_apertadas_normal':{g:sum(r['margin']<5 for r in s) for g,s in zip(groups,sets)},
 'promessas_sem_investimento_posterior_pct':values[0], 'confrontos_sem_presenca_pct':values[1],
 'ordem_vencedor_alterado':changed,'pares_ordem':len(order),
 'acoes_principal':dict(zip(keys,counts)),
 'gastos_principal':{k:sum_metric(k) for k in ['localSpent','promiseSpent','strategySpent']}}
(ROOT/'docs/simulation-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')

body='''
<header><div class="eyebrow">Rumo ao Planalto · Estudo de balanceamento · 2 de novembro de 2026</div>
<h1>Mais ações ainda não significam melhores decisões.</h1>
<p class="lead">132 partidas simuladas apontam três prioridades: planejar o retorno das promessas, comparar confrontos com investimentos diretos e criar uma política de poupança para apoios.</p>
<div class="stats"><div><strong>132</strong><span>partidas válidas</span></div><div><strong>54</strong><span>na amostra principal</span></div><div><strong>0</strong><span>violações verificadas</span></div></div></header>
<section><h2>1. A agressividade atual não garantiu disputas mais equilibradas</h2>
<p>Nas comparações da dificuldade Normal, a diferença média final caiu de <b>19,0 para 5,6 pontos percentuais</b> quando as estratégias de campanha foram desativadas. Sem estratégias e sem promessas, caiu para <b>2,7 pontos</b>. A política atual teve apenas <b>2 de 18</b> eleições com diferença inferior a 5 pontos; as outras duas condições tiveram <b>9 de 18</b> e <b>15 de 18</b>.</p>
<figure>{{margens}}<figcaption>O resultado mede equilíbrio entre IAs nesta amostra; não mede dificuldade para uma pessoa nem determina qual política é “mais inteligente”. Cada ponto é uma eleição.</figcaption></figure>
<p class="insight"><b>Oportunidade:</b> manter as ações especiais, mas fazer a IA comparar o ganho esperado por real de uma estratégia com o melhor investimento disponível. Hoje as estratégias têm uma verba própria e são compradas antes dos investimentos.</p>
</section>
<section><h2>2. Só um quarto do gasto principal virou investimento direto</h2>
<p>Na amostra principal, <b>24,7%</b> do gasto foi para investimentos, <b>36,1%</b> para promessas e <b>39,3%</b> para estratégias. No Normal, remover apenas as promessas aumentou os investimentos, mas a diferença média entre os primeiros subiu para <b>22,7 pontos</b>: o dinheiro também migrou para mais confrontos.</p>
<figure>{{orcamento}}<figcaption>Comparação restrita ao Normal para manter os mesmos cenários. “Só investimentos” desativa promessas e estratégias; os apoios continuam habilitados, mas nenhum foi comprado.</figcaption></figure>
<p class="insight"><b>Oportunidade:</b> planejar o conjunto da rodada: reservar dinheiro para aproveitar as promessas e disputar os estados de maior retorno, antes de liberar o restante para confrontos.</p>
</section>
<section><h2>3. Debates sem presença local viraram a escolha dominante</h2>
<p>A amostra principal registrou <b>6.568 debates</b> e <b>228 ataques</b>. Em <b>96,0% dos confrontos</b>, quem iniciou tinha influência zero na UF. Nesse caso, perder um debate não retira pontos locais de quem já está em zero, embora o custo financeiro continue sendo pago. Ganhar pode transferir influência do adversário.</p>
<figure>{{acoes}}<figcaption>² A ausência de investimento posterior na mesma UF não mede benefícios indiretos de concentração, defesa territorial ou herança para eleições futuras. “Confrontos” inclui ataques e debates.</figcaption></figure>
<p class="insight"><b>Oportunidade:</b> primeiro comparar a eficiência do confronto com a de investir. Depois testar, separadamente, presença mínima para desafiar e uma revisão dos empates em debates. Exigir presença sem rever os empates pode tornar o debate pouco atraente, já que hoje o empate favorece o defensor.</p>
</section>
<section><h2>4. Muitas promessas não foram aproveitadas diretamente</h2>
<p><b>2.449 das 5.034 promessas (48,6%)</b> não tiveram investimento posterior da própria candidatura na mesma UF até o fim da eleição. A IA avalia potencial de ganho, mas não garante que financiará e executará esses investimentos. Também compra melhorias antes de definir os confrontos e investimentos da rodada.</p>
<p class="insight"><b>Oportunidade:</b> comprar uma promessa somente quando o número provável de investimentos futuros justificar o preço, considerando saldo, rodadas restantes, limite de influência e concentração. Benefícios futuros devem ser ponderados, não tratados como garantidos.</p>
</section>
<section><h2>5. Algumas ferramentas existem, mas quase não entram em jogo</h2>
<div class="table-wrap"><table><thead><tr><th>Ferramenta</th><th>Observação</th><th>Próximo teste recomendado</th></tr></thead><tbody>
<tr><td>Apoios</td><td>Nenhum nas 132 partidas, incluindo {{runoffs}} que chegaram ao segundo turno.</td><td>Reservar recursos quando um apoio concreto trouxer bom retorno. Depois comparar com preços proporcionais à influência recebida.</td></tr>
<tr><td>Defesa</td><td>117 compras e 21 utilizações na amostra principal: 17,9% foram consumidas numa disputa.</td><td>Estimar o risco real de ataque e o prazo de validade, em vez de considerar somente o dinheiro do adversário.</td></tr>
<tr><td>Interferência presidencial</td><td>Nenhuma nas 8 partidas adicionais com presidente e bônus ativos.</td><td>Testar uma reserva para a ação quando houver uma razão estratégica. O bônus de R$ 75 mil sozinho não assegura saldo para pagar R$ 500 mil ou R$ 1 milhão.</td></tr>
</tbody></table></div>
<p>Esses resultados mostram baixa utilização na amostra, não incapacidade técnica de executar as ações. A rotina de apoios exige saldo suficiente e não guarda dinheiro especificamente para chegar à primeira compra, de R$ 1 milhão. A interferência também compete com compras anteriores e com a parcela do orçamento destinada às estratégias.</p>
</section>
<section><h2>6. A ordem merece uma investigação própria</h2>
<p>Alterar a ordem das candidaturas mudou o vencedor em <b>{{changed}} dos 8 pares</b>, mantendo os perfis atribuídos a cada candidato. Isso revela sensibilidade, mas <b>não demonstra uma vantagem fixa de determinada posição</b>: a ordem também altera quem recebe cada rolagem do gerador aleatório.</p>
<p class="insight"><b>Oportunidade:</b> repetir o estudo com sequências de dados independentes por candidato; depois comparar a ordem fixa com uma rotação a cada rodada. Não recomendo mudar a regra apenas com estes oito pares.</p>
</section>
<section><h2>O que eu priorizaria</h2>
<ol class="priorities"><li><b>Uma comparação conjunta das ações.</b> Preservar as personalidades, mas comparar retorno por real entre investir, comprar promessa, atacar, debater e defender. A personalidade deve modular uma escolha viável, não justificar desperdício.</li>
<li><b>Promessas com plano de uso.</b> Prever quantos investimentos realmente cabem no orçamento e no calendário, e separar a verba necessária para realizá-los.</li>
<li><b>Poupança com objetivo.</b> Acumular para um apoio ou interferência específicos quando o ganho justificar esperar; abandonar o plano se a situação mudar.</li>
<li><b>Testes separados das regras dos confrontos.</b> Experimentar presença mínima e tratamento dos empates, sem alterar simultaneamente preços, renda e várias regras.</li>
<li><b>Repetir o torneio e incluir humanos.</b> Avaliar margem, viradas no segundo turno, diversidade de ações, aproveitamento de promessas e taxa de vitória contra estilos humanos distintos.</li></ol>
<p><b>A renda permanece sem teto.</b> Este estudo não alterou a economia, a IA nem as regras do jogo.</p>
</section>
<section class="method"><h2>Como ler este estudo</h2>
<ul><li><b>54 partidas principais:</b> 3 dificuldades × 3 durações (6, 10 e 14 rodadas) × 3 quantidades de candidatos (2, 6 e 10) × 2 sementes. Estratégias e apoios habilitados; nenhuma presidência nessa amostra.</li>
<li><b>54 comparações adicionais:</b> no Normal, 18 partidas sem promessas, 18 sem estratégias e 18 sem ambas. Os 18 cenários atuais do Normal já estão incluídos na amostra principal.</li>
<li><b>16 partidas de ordem:</b> oito pares com 6 candidatos, 10 rodadas e dificuldade Normal.</li><li><b>8 partidas presidenciais:</b> 6 candidatos, 10 rodadas, dificuldade Normal e bônus de presidência.</li>
<li>Todos os participantes usam a IA. A simulação chama as funções de produção de compras, investimentos, renda, fechamento e progressão de turnos; apenas apresentação e pausas de interface são removidas. Não acessa nem altera partidas salvas no navegador.</li>
<li>A mesma semente torna uma configuração reproduzível. Alterar a política pode mudar o consumo de números aleatórios: as comparações não mantêm cada rolagem individual pareada.</li>
<li>Os perfis variam por semente e são preservados nas comparações de ordem. Duas sementes por cenário são insuficientes para ranquear perfis ou estimar com precisão taxas de vitória. Não há teste de jogadores humanos nem comparação direta com a economia anterior.</li>
<li>“Apertada” significa diferença final inferior a 5 pontos percentuais entre os dois primeiros. Uma margem menor não prova, isoladamente, um jogo melhor.</li>
<li>Não houve saldo negativo, influência inválida ou eleição sem conclusão nas 132 partidas válidas. Uma partida foi repetida e produziu resultado idêntico.</li>
<li>A auditoria excluiu 18 resultados preliminares que pediam 10 candidatos, mas usavam a lista padrão de 6. Eles foram substituídos por execuções com 10 participantes e não entram nos totais deste relatório.</li></ul>
<p>Dados: <a href="simulation-results.json">resultados completos</a> · <a href="simulation-summary.json">resumo numérico</a> · <a href="../scripts/simulate-economy.cjs">simulador reproduzível</a>.</p>
<p class="hash">SHA-256 do index.html analisado: {{hash}}</p></section>
'''
for name in ['margens','orcamento','acoes']:
    data=base64.b64encode((ROOT/f'docs/simulation-charts/{name}.png').read_bytes()).decode()
    body=body.replace('{{'+name+'}}',f'<img src="data:image/png;base64,{data}" alt="Gráfico de {name} com valores descritos no texto" loading="lazy">')
body=body.replace('{{runoffs}}',str(runoffs)).replace('{{changed}}',str(changed)).replace('{{hash}}',source['sourceHash'])
style='''*{box-sizing:border-box}body{margin:0;background:#eef3f5;color:#193b59;font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}main{max-width:1120px;margin:32px auto;padding:52px;background:white;border-radius:16px}header{border-bottom:3px solid #137e77;padding-bottom:28px}h1{font-size:42px;line-height:1.15;max-width:870px;margin:18px 0}h2{font-size:26px;line-height:1.3;margin:0 0 18px}p{margin:12px 0}.eyebrow{font-size:12px;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;color:#137e77}.lead{font-size:20px;max-width:880px}.stats{display:flex;gap:60px;flex-wrap:wrap;margin-top:28px}.stats strong{font-size:35px;display:block;color:#137e77}.stats span{display:block;font-size:14px}section{padding-top:38px;margin-top:16px}figure{margin:24px 0}figure img{width:100%;height:auto;display:block}figcaption{font-size:13px;color:#526b80;margin-top:8px}.insight{border-left:4px solid #137e77;background:#f1f8f7;padding:16px 20px;margin-top:20px}.table-wrap{overflow:auto}table{border-collapse:collapse;width:100%;font-size:15px}th{text-align:left;color:#137e77}th,td{padding:14px 12px;border-bottom:1px solid #dce5e9;vertical-align:top}th:first-child,td:first-child{padding-left:0}li{margin-bottom:12px}.priorities li{padding-left:5px}.method{border-top:1px solid #dce5e9;margin-top:40px;font-size:14px}a{color:#137e77}.hash{font-family:monospace;overflow-wrap:anywhere;font-size:11px}@media(max-width:680px){main{margin:0;padding:24px 18px;border-radius:0}h1{font-size:31px}h2{font-size:23px}.lead{font-size:18px}.stats{gap:24px}}@media print{body{background:white}main{margin:0;padding:15px;max-width:none}section{break-inside:avoid}h1{font-size:32px}.table-wrap{overflow:visible}a{color:inherit}figure{break-inside:avoid}}'''
html=f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Rumo ao Planalto — relatório de 132 simulações</title><style>{style}</style></head><body><main>{body}</main></body></html>'
(ROOT/'docs/simulation-report.html').write_text(html)
print('Report created:',ROOT/'docs/simulation-report.html')
print(json.dumps(summary,ensure_ascii=False,indent=2))
