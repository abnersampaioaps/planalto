const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
// Load the production definitions without browser initialization.
const definitions = script.slice(0, script.indexOf("\naddCandidateChoices('officialCandidates'"));
let context;
test.beforeEach(() => {
 context = vm.createContext({});
 vm.runInContext(definitions, context);
 // Reproducible draws and a fresh VM prevent failed mocks leaking into later tests.
 vm.runInContext('Math.random=(()=>{let seed=123456789;return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}})()',context);
});
const run = expression => vm.runInContext(expression, context);
const plain = expression => JSON.parse(JSON.stringify(run(expression)));

test('player statistics count one applicable round per election and retain all-round records', () => {
 run("game=newGame('Ciro Gomes','normal',10,['Ciro Gomes','Lula','Jair Bolsonaro'],false,'2026');game.firstResult={totalValid:100,ranked:[{id:'Lula',votes:45,pct:45},{id:'Jair Bolsonaro',votes:35,pct:35},{id:'Ciro Gomes',votes:20,pct:20}]};game.secondResult={totalValid:100,ranked:[{id:'Lula',votes:55,pct:55},{id:'Jair Bolsonaro',votes:45,pct:45}]};game.done=true;var eliminated=electionStatisticsSnapshot(game)");
 assert.equal(run('eliminated.player.first.votes'),20);
 assert.equal(run('eliminated.player.second'),null);
 run("game=newGame('Lula','normal',10,['Lula','Jair Bolsonaro'],false,'2026');game.firstResult={totalValid:100,ranked:[{id:'Lula',votes:49,pct:49},{id:'Jair Bolsonaro',votes:40,pct:40}]};game.secondResult={totalValid:100,ranked:[{id:'Lula',votes:60,pct:60},{id:'Jair Bolsonaro',votes:40,pct:40}]};game.done=true;var winner=electionStatisticsSnapshot(game);var playerStats=summarizePlayerStatistics([eliminated,winner,{complete:true,winner:{id:'Lula'}},{...winner,complete:false}])");
 assert.equal(run('playerStats.elections'),2);
 assert.equal(run('playerStats.wins'),1);
 assert.equal(run('playerStats.runoffs'),1);
 assert.equal(run('playerStats.totalVotes'),80);
 assert.equal(run('playerStats.bestVotes'),60);
 assert.equal(run('playerStats.bestPct'),60);
});

test('statistics keep both round standings and the party at the time of the election', () => {
 run("game=newGame('Lula','normal',10,['Lula','Jair Bolsonaro'],false,'2026');game.firstResult={totalValid:100,ranked:[{id:'Lula',votes:45,pct:45},{id:'Jair Bolsonaro',votes:40,pct:40}]};game.secondResult={totalValid:100,ranked:[{id:'Jair Bolsonaro',votes:55,pct:55},{id:'Lula',votes:45,pct:45}]};game.done=true;recordElectionWinner();var completedStats=electionStatisticsSnapshot(game)");
 assert.equal(run('completedStats.complete'),true);
 assert.deepEqual(plain('completedStats.first.map(row=>row.id)'),['Lula','Jair Bolsonaro']);
 assert.deepEqual(plain('completedStats.second.map(row=>row.id)'),['Jair Bolsonaro','Lula']);
 assert.equal(run('completedStats.winner.id'),'Jair Bolsonaro');
 const party=run("game.candidateParties['Jair Bolsonaro']");
 run("game.candidateParties['Jair Bolsonaro']='OUTRO';game.firstResult.ranked[0].pct=1");
 assert.equal(run('game.electionHistory[0].statistics.winner.party'),party);
 assert.equal(run('game.electionHistory[0].statistics.first[0].pct'),45);
 assert.equal(run('summarizeElectionStatistics([completedStats]).parties[0][1]'),1);
 assert.equal(run('summarizeElectionStatistics([completedStats]).runoffs'),1);
});

test('statistics persist across games, update partial results, and do not duplicate on reload', () => {
 const storage=new Map();
 const isolated=vm.createContext({localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)}});
 vm.runInContext(definitions,isolated);
 const evaluate=code=>vm.runInContext(code,isolated);
 evaluate("game=newGame('Lula','normal',10,['Lula','Jair Bolsonaro'],false,'2026');game.firstResult={totalValid:100,ranked:[{id:'Lula',votes:50,pct:50},{id:'Jair Bolsonaro',votes:50,pct:50}]};game.pendingSecond=true;syncElectionStatistics();var firstStatsId=game.statisticsId");
 assert.equal(evaluate('summarizeElectionStatistics(readElectionStatistics()).completed'),0);
 evaluate("game.secondResult={totalValid:100,ranked:[{id:'Lula',votes:60,pct:60},{id:'Jair Bolsonaro',votes:40,pct:40}]};game.pendingSecond=false;game.done=true;recordElectionWinner();syncElectionStatistics();game=JSON.parse(JSON.stringify(game));electionStatisticsCache=[];syncElectionStatistics();recordElectionWinner();syncElectionStatistics()");
 assert.equal(evaluate('readElectionStatistics().length'),1);
 assert.equal(evaluate('readElectionStatistics()[0].id===firstStatsId'),true);
 assert.equal(evaluate('summarizeElectionStatistics(readElectionStatistics()).completed'),1);
 evaluate("var priorHistory=game.electionHistory;game=newGame('Lula','normal',10,['Lula','Jair Bolsonaro'],false,'2026');game.firstResult={totalValid:100,ranked:[{id:'Lula',votes:65,pct:65},{id:'Jair Bolsonaro',votes:35,pct:35}]};game.done=true;recordElectionWinner();syncElectionStatistics()");
 assert.equal(evaluate('readElectionStatistics().length'),2);
 assert.equal(evaluate('summarizeElectionStatistics(readElectionStatistics()).firstRoundWins'),1);
 evaluate("game=newGame('Lula','normal',10,['Lula','Jair Bolsonaro']);game.electionHistory=priorHistory;syncElectionStatistics()");
 assert.equal(evaluate('readElectionStatistics().length'),2);
 assert.equal(evaluate('readElectionStatistics().filter(row=>row.runoff===\'not-needed\')[0].second'),null);
});

test('legacy statistics preserve winners without inventing turn rankings and render safely', () => {
 const storage=new Map(),elements={};
 const isolated=vm.createContext({localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},document:{getElementById:id=>elements[id]??(elements[id]={})}});
 vm.runInContext(definitions,isolated);
 const evaluate=code=>vm.runInContext(code,isolated);
 evaluate("game=newGame('Lula','normal',10,['Lula','Jair Bolsonaro'],false,'2026');renderElectionStatistics()");
 assert.match(elements.statisticsElections.innerHTML,/primeira apuração/);
 evaluate("game.electionHistory=[{year:'2022',winner:'Lula',party:'PT <teste>'}];renderElectionStatistics();game=JSON.parse(JSON.stringify(game));renderElectionStatistics()");
 assert.equal(evaluate('readElectionStatistics().length'),1);
 assert.equal(evaluate('readElectionStatistics()[0].first'),null);
 assert.equal(evaluate('readElectionStatistics()[0].runoff'),'unknown');
 assert.match(elements.statisticsElections.innerHTML,/não foram salvas/);
 assert.match(elements.statisticsParties.innerHTML,/PT &lt;teste&gt;/);
 assert.doesNotMatch(elements.statisticsParties.innerHTML,/<teste>/);
 assert.equal(evaluate('summarizeElectionStatistics(readElectionStatistics()).firstRoundWins'),0);
 assert.equal(evaluate('summarizeElectionStatistics(readElectionStatistics()).completed'),1);
});

test('custom elections record the actual automatic runoff after human elimination', () => {
 run("game=newGame('Ciro Gomes','normal',6,['Ciro Gomes','Lula','José Serra'],false);game.firstResult={totalValid:100,ranked:[{id:'Lula',votes:45,pct:45},{id:'José Serra',votes:40,pct:40},{id:'Ciro Gomes',votes:15,pct:15}]};game.done=true;simulateAIRunoff=()=>{game.secondResult={totalValid:100,ranked:[{id:'José Serra',votes:55,pct:55},{id:'Lula',votes:45,pct:45}]};game.automaticRunoff=true};recordElectionWinner();var customStats=electionStatisticsSnapshot(game)");
 assert.equal(run('customStats.year'),null);
 assert.equal(run('customStats.winner.id'),'José Serra');
 assert.equal(run('customStats.automaticRunoff'),true);
 assert.equal(run('customStats.first[0].id'),'Lula');
 assert.equal(run('game.electionHistory.length'),0);
});

test('statistics remain usable and warn when browser storage cannot save', () => {
 const elements={};
 const isolated=vm.createContext({localStorage:{getItem(){throw Error('Unavailable')},setItem(){throw Error('Unavailable')}},document:{getElementById:id=>elements[id]??(elements[id]={})}});
 vm.runInContext(definitions,isolated);
 vm.runInContext("game=newGame('Lula','normal',10,['Lula','Jair Bolsonaro']);game.electionHistory=[{year:'2022',winner:'Lula',party:'PT'}];persist();renderElectionStatistics()",isolated);
 assert.match(elements.statisticsStorageNote.textContent,/apenas nesta sessão/);
 assert.match(elements.statisticsParties.innerHTML,/1 vitória/);
});

test('state income requires three influence and a sole lead, with no income cap', () => {
 run("game=newGame('Lula','normal',10,['Lula','Jair Bolsonaro'],false)");
 assert.deepEqual(plain('game.cash'),{'Lula':350000,'Jair Bolsonaro':350000});
 assert.equal(run("income('Lula')"),300000);
 run('game.localInfluence.SP.Lula=2.99');
 assert.equal(run("income('Lula')"),300000);
 run('game.localInfluence.SP.Lula=3');
 assert.equal(run("income('Lula')"),320000);
 run("game.localInfluence.SP['Jair Bolsonaro']=3");
 assert.equal(run("income('Lula')"),300000);
 assert.equal(run("income('Jair Bolsonaro')"),300000);
 run("game.localInfluence.SP['Jair Bolsonaro']=2;changeStrategyInfluence('Lula','SP',-1)");
 assert.equal(run("income('Lula')"),300000);
 run("changeStrategyInfluence('Lula','SP',1)");
 assert.equal(run("income('Lula')"),320000);
 run('for(const state of STATES)game.localInfluence[state.uf].Lula=3');
 assert.equal(run("income('Lula')"),840000);
 run("game.incumbent='Lula'");
 assert.equal(run("income('Lula')"),915000);
 run('game.cash.Lula=123456;game=JSON.parse(JSON.stringify(game));normalizePartyContext(game)');
 assert.equal(run('game.cash.Lula'),123456);
 assert.equal(run("income('Lula')"),915000);
});

test('local strategies charge the selected state price and reject insufficient funds for humans and AI', () => {
 const prices={SP:[187000,150000,235000,185000],AM:[50000,40000,65000,50000],RR:[33000,25000,40000,35000]};
 for(const [uf,[investment,...costs]] of Object.entries(prices)){
  assert.equal(run(`localCost(byUF.${uf})`),investment);
  for(const [index,type] of ['debate','attack','defend'].entries()){
   for(const id of ['Lula','Jair Bolsonaro']){
    const target=id==='Lula'?'Jair Bolsonaro':'Lula',cost=costs[index];
    run("game=newGame('Lula','normal',10,['Lula','Jair Bolsonaro'],false);game.strategiesEnabled=true");
    run(`game.localInfluence.${uf}.Lula=3;game.localInfluence.${uf}['Jair Bolsonaro']=3;game.cash[${JSON.stringify(id)}]=${cost-1}`);
    const purchase=`buyCampaignStrategy(${JSON.stringify(id)},'${type}','${uf}',${JSON.stringify(target)})`;
    assert.equal(run(purchase),false);
    assert.equal(run(`game.cash[${JSON.stringify(id)}]`),cost-1);
    run(`game.cash[${JSON.stringify(id)}]++`);
    assert.equal(run(purchase),true);
    assert.equal(run(`game.cash[${JSON.stringify(id)}]`),0);
   }
  }
 }
});

test('four promise prices scale by state with a forty thousand minimum and preserve saved levels', () => {
 for(const [uf,costs] of Object.entries({SP:[150000,205000,280000,375000],AM:[40000,55000,75000,100000],RR:[40000,40000,50000,65000]})){
  run("game=newGame('Lula','normal',10,['Lula','Jair Bolsonaro'],false)");
  for(const [level,cost] of costs.entries()){
   assert.equal(run(`stateMultiplierCost('Lula','${uf}')`),cost);
   run(`game.cash.Lula=${cost-1}`);
   assert.equal(run(`buyMultiplier('Lula',false,'${uf}')`),null);
   assert.equal(run(`multiplierLevel('Lula','${uf}')`),level);
   run('game.cash.Lula++');
   assert.equal(run(`buyMultiplier('Lula',false,'${uf}').cost`),cost);
   assert.equal(run('game.cash.Lula'),0);
   run('game=JSON.parse(JSON.stringify(game));normalizePartyContext(game)');
   assert.equal(run(`multiplierLevel('Lula','${uf}')`),level+1);
  }
  run('game.cash.Lula=1000000');
  assert.equal(run(`buyMultiplier('Lula',false,'${uf}')`),null);
  assert.equal(run('game.cash.Lula'),1000000);
 }
});

test('strategy selectors and confirmation refresh prices when the state changes', () => {
 const elements={};
 const isolated=vm.createContext({document:{getElementById:id=>elements[id]??(elements[id]={value:'',closest(){return {}}})}});
 vm.runInContext(definitions,isolated);
 const evaluate=code=>vm.runInContext(code,isolated);
 evaluate("game=newGame('Lula','normal',10,['Lula','Jair Bolsonaro'],false);game.strategiesEnabled=true;game.cash.Lula=100000;game.localInfluence.SP['Jair Bolsonaro']=game.localInfluence.AM['Jair Bolsonaro']=3");
 elements.strategyType={value:'attack',options:['debate','attack','defend'].map(value=>({value}))};
 elements.strategyUF={value:'SP',closest(){return {}}};
 elements.strategyTarget={value:'Jair Bolsonaro',closest(){return {}}};
 evaluate('renderStrategyPreview()');
 assert.equal(elements.strategyConfirm.textContent,'Lançar dados · R$ 235 mil');
 assert.equal(elements.strategyConfirm.disabled,true);
 elements.strategyUF.value='AM';
 evaluate('renderStrategyPreview()');
 assert.deepEqual(elements.strategyType.options.map(option=>option.textContent),['Debate regional · R$ 40 mil','Ataque ao candidato · R$ 65 mil','Defesa de campanha · R$ 50 mil']);
 assert.equal(elements.strategyType.value,'attack');
 assert.equal(elements.strategyConfirm.textContent,'Lançar dados · R$ 65 mil');
 assert.equal(elements.strategyConfirm.disabled,false);
});

test('candidate shortcut keeps the selected opponent and state without charging before confirmation', () => {
 const elements={};let focused=null;
 const element=id=>elements[id]??(elements[id]={value:'',options:['debate','attack','defend'].map(value=>({value})),classList:{add(){},remove(){}},closest(){return {}},querySelector(){return null},focus(){focused=id}});
 const isolated=vm.createContext({document:{getElementById:element}});
 vm.runInContext(definitions,isolated);
 const evaluate=code=>vm.runInContext(code,isolated);
 evaluate("game=newGame('Lula','normal',10,['Lula','Jair Bolsonaro','Ciro Gomes'],false);game.strategiesEnabled=true;selectedUF='SP';game.localInfluence.AM['Ciro Gomes']=3;game.strategyDefenses={[strategyKey('Ciro Gomes','AM')]:game.round+1}");
 assert.equal(evaluate("openCandidateActions('Ciro Gomes','AM')"),true);
 assert.match(elements.candidateActionsTitle.textContent,/Ciro.*Amazonas/);
 assert.match(elements.candidateActionsNotice.textContent,/3 dados contra seus 2/);
 assert.match(elements.candidateActionsOptions.innerHTML,/R\$ 40 mil/);
 assert.match(elements.candidateActionsOptions.innerHTML,/R\$ 65 mil/);
 assert.equal(evaluate('game.cash.Lula'),350000);
 for(const type of ['debate','attack']){
  evaluate("openCandidateActions('Ciro Gomes','AM')");
  assert.equal(evaluate(`chooseCandidateAction('${type}')`),true);
  assert.equal(elements.strategyType.value,type);
  assert.equal(elements.strategyUF.value,'AM');
  assert.equal(elements.strategyTarget.value,'Ciro Gomes');
  assert.equal(elements.strategyConfirm.disabled,false);
  assert.equal(focused,'strategyConfirm');
  assert.equal(evaluate('game.cash.Lula'),350000);
  assert.equal(evaluate('(game.strategyEvents||[]).length'),0);
 }
 assert.equal(evaluate("buyCampaignStrategy(game.player,'attack','AM','Ciro Gomes')"),true);
 assert.equal(evaluate('game.cash.Lula'),285000);
 assert.equal(evaluate('game.strategyEvents.at(-1).uf'),'AM');
 assert.equal(evaluate('game.strategyEvents.at(-1).target'),'Ciro Gomes');
});

test('candidate shortcut respects availability and refreshes stale eligibility', () => {
 const elements={};let restored=false;
 const element=id=>elements[id]??(elements[id]={classList:{add(){},remove(){}},querySelector(){return null},focus(){}});
 const isolated=vm.createContext({document:{getElementById:element},trigger:{isConnected:true,focus(){restored=true}}});
 vm.runInContext(definitions,isolated);
 const evaluate=code=>vm.runInContext(code,isolated);
 evaluate("game=newGame('Lula','normal',10,['Lula','Jair Bolsonaro'],false);game.strategiesEnabled=true");
 assert.equal(evaluate("openCandidateActions('Lula','SP')"),false);
 assert.equal(evaluate("openCandidateActions('Ciro Gomes','SP')"),false);
 assert.equal(evaluate("openCandidateActions('Jair Bolsonaro','XX')"),false);
 assert.match(evaluate("investmentCandidateName('Jair Bolsonaro','SP')"),/aria-haspopup="dialog"/);
 assert.doesNotMatch(evaluate("investmentCandidateName('Lula','SP')"),/<button/);
 evaluate("openCandidateActions('Jair Bolsonaro','SP',trigger)");
 assert.equal((elements.candidateActionsOptions.innerHTML.match(/ disabled/g)||[]).length,2);
 assert.match(elements.candidateActionsOptions.innerHTML,/influência neste estado/);
 evaluate('closeCandidateActions()');assert.equal(restored,true);
 evaluate("game.localInfluence.SP['Jair Bolsonaro']=3;openCandidateActions('Jair Bolsonaro','SP');game.cash.Lula=0");
 assert.equal(evaluate("chooseCandidateAction('attack')"),false);
 assert.match(elements.candidateActionsOptions.innerHTML,/Saldo insuficiente/);
 assert.equal(evaluate("chooseCandidateAction('defend')"),false);
 for(const change of ['game.done=true','game.done=false;game.pendingSecond=true','game.pendingSecond=false;game.strategiesEnabled=false']){
  evaluate(change);
  assert.equal(evaluate("openCandidateActions('Jair Bolsonaro','SP')"),false);
  assert.doesNotMatch(evaluate("investmentCandidateName('Jair Bolsonaro','SP')"),/<button/);
 }
});

test('AI can use local strategies with less than the former minimum budget', () => {
 run("game=newGame('Lula','normal',10,['Lula','Jair Bolsonaro'],false);game.strategiesEnabled=true;game.cash['Jair Bolsonaro']=100000;for(const state of STATES)game.localUsed[state.uf]['Jair Bolsonaro']=2;game.localInfluence.AC.Lula=5;game.localInfluence.AC['Jair Bolsonaro']=3");
 assert.ok(run("aiCampaignStrategy('Jair Bolsonaro')")>0);
 assert.ok(run("game.cash['Jair Bolsonaro']>=0&&game.cash['Jair Bolsonaro']<100000"));
 assert.ok(run("game.strategyEvents.every(event=>event.uf==='AC'&&event.id==='Jair Bolsonaro')"));
});

test('revenue AI values consolidating a three-point income lead over a one-point occupation', () => {
 run("game=newGame('Lula','easy',10,['Lula','Jair Bolsonaro'],false);var revenueTactic={id:'revenue'};var occupationScore=aiPriority('Lula',byUF.AM,revenueTactic,localCost(byUF.AM));game.localInfluence.AM.Lula=game.localTotal.AM.Lula=2");
 assert.ok(run("aiPriority('Lula',byUF.AM,revenueTactic,localCost(byUF.AM))>occupationScore"));
 assert.equal(run('game.localInfluence.AM.Lula'),2);
 assert.equal(run('game.localTotal.AM.Lula'),2);
});

test('concentration warning appears only near the threshold or while the penalty is active', () => {
 const elements={};
 const isolated=vm.createContext({document:{getElementById:id=>elements[id]??(elements[id]={setAttribute(){}})}});
 vm.runInContext(definitions,isolated);
 vm.runInContext("game=newGame('Lula','normal',10,['Lula','Jair Bolsonaro'],false);selectedUF='SP'",isolated);
 const renderWith=(states)=>{
  vm.runInContext('game.multiplierLevels='+JSON.stringify(Object.fromEntries(states.map(uf=>[uf,{Lula:1}])))+';renderMultiplierPanel()',isolated);
  return elements.multiplierPenaltyNote;
 };
 for(const states of [[],['SP'],['SP','BA'],['SP','RJ','BA'],['SP','RJ','PR','GO']]){
  assert.equal(renderWith(states).hidden,true,JSON.stringify(states));
 }
 for(const states of [['SP','RJ'],['SP','RJ','PR','SC','GO']]){
  const note=renderWith(states);
  assert.equal(note.hidden,false,JSON.stringify(states));
  assert.ok(note.textContent.startsWith('💡 Dica:'));
 }
 for(const states of [['SP','RJ','MG'],['SP','RJ','PR','SC','GO','DF']]){
  const note=renderWith(states);
  assert.equal(note.hidden,false,JSON.stringify(states));
  assert.ok(note.textContent.includes('×0,9'));
 }
 assert.equal(renderWith(['SP','RJ','MG','BA']).hidden,true);
 vm.runInContext("game.multiplierLevels={SP:{'Jair Bolsonaro':1},RJ:{'Jair Bolsonaro':1},MG:{'Jair Bolsonaro':1}};renderMultiplierPanel()",isolated);
 assert.equal(elements.multiplierPenaltyNote.hidden,true);
});

test('axis concentration protects every state in its axis and penalizes only the opposite axis', () => {
 const isolated=vm.createContext({});
 vm.runInContext(definitions,isolated);
 const evaluate=expression=>vm.runInContext(expression,isolated);
 for(const boosted of [
  ['AC','AM','AP','PA','RO','BA'],
  ['AC','AM','AP','PA','RO','RR'],
  ['SP','RJ','MG','PR','SC','GO']
 ]){
  evaluate("game=newGame('Lula','normal',10,['Lula','Jair Bolsonaro'],false)");
  evaluate('game.multiplierLevels='+JSON.stringify(Object.fromEntries(boosted.map(uf=>[uf,{Lula:1}]))));
  assert.equal(evaluate("concentrationStatus('Lula').kind"),'axis');
  const axis=evaluate("stateAxis(byUF['"+boosted[0]+"'].region)");
  const states=JSON.parse(evaluate('JSON.stringify(STATES)'));
  for(const state of states){
   const sameAxis=evaluate('stateAxis('+JSON.stringify(state.region)+')')===axis;
   const expected=boosted.includes(state.uf)?1.35:sameAxis?1.1:.9;
   assert.equal(evaluate("affinityMultiplier('Lula','"+state.uf+"')"),expected,state.uf);
   assert.equal(evaluate("affinityMultiplier('Jair Bolsonaro','"+state.uf+"')"),1);
  }
  const opposite=states.find(s=>evaluate('stateAxis('+JSON.stringify(s.region)+')')!==axis).uf;
  evaluate("game.multiplierLevels['"+opposite+"']={Lula:1}");
  assert.equal(evaluate("concentrationStatus('Lula').active"),false);
 }
 evaluate("game.multiplierLevels={AC:{Lula:1},AM:{Lula:1},AP:{Lula:1}}");
 assert.equal(evaluate("concentrationStatus('Lula').kind"),'region');
 assert.equal(evaluate("affinityMultiplier('Lula','PA')"),1.1);
 assert.equal(evaluate("affinityMultiplier('Lula','BA')"),.9);
 assert.equal(evaluate("affinityMultiplier('Lula','SP')"),.9);
});

test('regional concentration protects unboosted states throughout each concentrated region', () => {
 const isolated=vm.createContext({});
 vm.runInContext(definitions,isolated);
 const evaluate=expression=>vm.runInContext(expression,isolated);
 const states=JSON.parse(evaluate('JSON.stringify(STATES)'));
 for(const region of new Set(states.map(s=>s.region))){
  const boosted=states.filter(s=>s.region===region).slice(0,3).map(s=>s.uf);
  evaluate("game=newGame('Lula','normal',10,['Lula','Jair Bolsonaro'],false)");
  evaluate('game.multiplierLevels='+JSON.stringify(Object.fromEntries(boosted.map(uf=>[uf,{Lula:1}]))));
  assert.equal(evaluate("concentrationStatus('Lula').kind"),'region');
  for(const state of states){
   const expected=boosted.includes(state.uf)?1.35:state.region===region?1.1:.9;
   assert.equal(evaluate("affinityMultiplier('Lula','"+state.uf+"')"),expected,region+' / '+state.uf);
   assert.equal(evaluate("affinityMultiplier('Jair Bolsonaro','"+state.uf+"')"),1);
  }
  const outside=states.find(s=>s.region!==region).uf;
  evaluate("game.multiplierLevels['"+outside+"']={Lula:1}");
  assert.equal(evaluate("concentrationStatus('Lula').active"),false);
 }
});

test('concentration bonus is additive, temporary, non-stacking and only affects future investments', () => {
 run("game=newGame('Lula','normal',10,['Lula','Jair Bolsonaro'],false);game.cash.Lula=10000000;game.multiplierLevels={AC:{Lula:1},AM:{Lula:1}};applyLocal('Lula','PA')");
 assert.equal(run("totalInfluence('Lula','PA')"),1);
 assert.equal(run("multiplierAfterPromise('Lula','AP')"),1.35);
 assert.ok(run("buyMultiplier('Lula',false,'AP')"));
 assert.equal(run("affinityMultiplier('Lula','AP')"),1.35);
 assert.equal(run("affinityMultiplier('Lula','PA')"),1.1);
 assert.equal(run("totalInfluence('Lula','PA')"),1);
 assert.equal(run("applyLocal('Lula','PA')"),true);
 assert.equal(run("totalInfluence('Lula','PA')"),2.1);
 assert.equal(run("concentrationStatus('Lula').count"),3);
 assert.equal(run("multiplierLevel('Lula','PA')"),0);
 run("game.multiplierLevels.AC.Lula=4");
 assert.equal(run("affinityMultiplier('Lula','AC')"),2.1);
 assert.equal(run("buyMultiplier('Lula',false,'AC')"),null);
 run("game.multiplierLevels.RO={Lula:1};game.multiplierLevels.RR={Lula:1};game.multiplierLevels.TO={Lula:1}");
 assert.equal(run("concentrationStatus('Lula').kind"),'axis');
 assert.equal(run("affinityMultiplier('Lula','AC')"),2.1);
 assert.equal(run("affinityMultiplier('Lula','BA')"),1.1);
 assert.equal(run("affinityMultiplier('Lula','SP')"),.9);
 assert.equal(run("multiplierAfterPromise('Lula','SP')"),1.25);
 assert.ok(run("buyMultiplier('Lula',false,'SP')"));
 assert.equal(run("concentrationStatus('Lula').active"),false);
 assert.equal(run("affinityMultiplier('Lula','AC')"),2);
 assert.equal(run("affinityMultiplier('Lula','BA')"),1);
 assert.equal(run("totalInfluence('Lula','PA')"),2.1);
 run('game=JSON.parse(JSON.stringify(game));normalizePartyContext(game)');
 assert.equal(run("totalInfluence('Lula','PA')"),2.1);
});

test('promise panel previews concentration activation and removal with the actual resulting multiplier', () => {
 const elements={};
 const isolated=vm.createContext({document:{getElementById:id=>elements[id]??(elements[id]={setAttribute(){}})}});
 vm.runInContext(definitions,isolated);
 vm.runInContext("game=newGame('Lula','normal',10,['Lula','Jair Bolsonaro'],false);game.cash.Lula=1000000;game.multiplierLevels={AC:{Lula:1},AM:{Lula:1}};selectedUF='AP';renderMultiplierPanel()",isolated);
 assert.equal(elements.stateMultiplierEffect.textContent,'AP · ×1 → ×1,35');
 vm.runInContext("buyMultiplier('Lula',false,'AP');selectedUF='PA';renderMultiplierPanel()",isolated);
 assert.equal(elements.multiplierCurrent.textContent,'×1,1');
 assert.equal(elements.stateMultiplierEffect.textContent,'PA · ×1,1 → ×1,35');
 assert.ok(elements.multiplierPenaltyNote.textContent.includes('×0,1 extras em toda a região concentrada'));
 vm.runInContext("selectedUF='SP';renderMultiplierPanel()",isolated);
 assert.equal(elements.stateMultiplierEffect.textContent,'SP · ×0,9 → ×1,25');
 assert.notEqual(vm.runInContext('multiplierColor(0,false,true)',isolated),vm.runInContext('multiplierColor(0)',isolated));
});

test('result cards include historical party logos, percentages and bars', () => {
 run("game=newGame('Marina Silva','normal',10,ELECTION_PRESETS[2010],true,'2010')");
 const markup=run("outcomeRows({ranked:[{id:'Marina Silva',votes:600,pct:60},{id:'Dilma Rousseff',votes:400,pct:40}]})");
 assert.ok(markup.includes('party-pv.svg'));
 assert.ok(markup.includes('width:60%'));
 assert.ok(markup.includes('standing-pct'));
 assert.ok(markup.includes('Você ·'));
 assert.ok(!html.includes('Voltar ao menu inicial'));
});

test('history renders newest first without changing stored chronology; menu years descend', () => {
 const elements={};
 const isolated=vm.createContext({document:{getElementById:id=>elements[id]??(elements[id]={})}});
 vm.runInContext(definitions,isolated);
 vm.runInContext("game=newGame('Lula','normal',10,ELECTION_PRESETS[2002],true,'2002');game.electionHistory=[{year:'2002',winner:'Lula',party:'PT'},{year:'2006',winner:'Ciro Gomes',party:'PSB'}];renderElectionHistory()",isolated);
 const markup=elements.electionHistoryList.innerHTML;
 assert.ok(markup.indexOf('2006')<markup.indexOf('2002'));
 assert.equal(vm.runInContext('game.electionHistory[0].year',isolated),'2002');
 const select=html.match(/id="chooseElection"[^>]*>(.*?)<\/select>/)[1];
 assert.deepEqual([...select.matchAll(/value="(.*?)"/g)].map(match=>match[1]),['','2026','2022','2018','2014','2010','2006','2002']);
});

const setDice = (...faces) => run('var testDice='+JSON.stringify(faces)+';Math.random=()=>{if(!testDice.length)throw Error("Unexpected roll");return (testDice.shift()-.5)/6}');

test('campaign attacks use dice, consume defense once and allow investments to restore losses', () => {
 run("game=newGame('Lula','normal',10,['Lula','Jair Bolsonaro'],false);game.strategiesEnabled=true;game.cash.Lula=10000000;game.cash['Jair Bolsonaro']=10000000;game.localTotal.SP['Jair Bolsonaro']=game.localInfluence.SP['Jair Bolsonaro']=10;game.localInfluence.SP.Lula=3");
 setDice(6,6,1,1);
 assert.equal(run("buyCampaignStrategy('Lula','attack','SP','Jair Bolsonaro')"),true);
 assert.equal(run("totalInfluence('Jair Bolsonaro','SP')"),8);
 assert.equal(run("stateLockedBy('SP')"),null);
 assert.equal(run("game.cash.Lula"),9765000);
 assert.equal(run("buyCampaignStrategy('Lula','attack','RJ','Jair Bolsonaro')"),false);
 assert.equal(run("buyCampaignStrategy('Jair Bolsonaro','mobilize','SP')"),false);
 assert.equal(run("applyLocal('Jair Bolsonaro','SP')"),true);
 assert.equal(run("applyLocal('Jair Bolsonaro','SP')"),true);
 assert.equal(run("totalInfluence('Jair Bolsonaro','SP')"),10);
 assert.equal(run("buyCampaignStrategy('Jair Bolsonaro','defend','SP')"),true);
 assert.equal(run("buyCampaignStrategy('Jair Bolsonaro','defend','SP')"),false);
 setDice(6,6,1,1,1);
 assert.equal(run("buyCampaignStrategy('Lula','attack','SP','Jair Bolsonaro')"),true);
 assert.equal(run("totalInfluence('Jair Bolsonaro','SP')"),8);
 assert.equal(run("campaignDefenseActive('Jair Bolsonaro','SP')"),false);
 assert.equal(run('game.strategyEvents.at(-1).duel.defenderDice.length'),3);
 setDice(1,1,6,6);
 assert.equal(run("buyCampaignStrategy('Lula','attack','SP','Jair Bolsonaro')"),true);
 assert.equal(run("totalInfluence('Lula','SP')"),2);
 assert.equal(run("totalInfluence('Jair Bolsonaro','SP')"),8);
 for(let i=0;i<2;i++){
  setDice(6,6,1,1);
  assert.equal(run("buyCampaignStrategy('Lula','attack','SP','Jair Bolsonaro')"),true);
 }
 assert.equal(run("totalInfluence('Jair Bolsonaro','SP')"),4);
 run('game.cash.Lula=0');
 assert.equal(run("buyCampaignStrategy('Lula','attack','SP','Jair Bolsonaro')"),false);
});

 test('dice ties favor the defender, expired defenses add no die and losses never go below zero', () => {
 run("game=newGame('Lula','normal',10,['Lula','Jair Bolsonaro'],false);game.strategiesEnabled=true;game.cash.Lula=10000000;game.cash['Jair Bolsonaro']=10000000;game.localInfluence.SP.Lula=.5;game.localInfluence.SP['Jair Bolsonaro']=3;buyCampaignStrategy('Jair Bolsonaro','defend','SP');game.round=3");
 setDice(3,4,2,5);
 assert.equal(run("buyCampaignStrategy('Lula','attack','SP','Jair Bolsonaro')"),true);
 assert.equal(run('game.strategyEvents.at(-1).duel.tied'),true);
 assert.equal(run('game.strategyEvents.at(-1).duel.defenderDice.length'),2);
 assert.equal(run("totalInfluence('Lula','SP')"),0);
 assert.equal(run("totalInfluence('Jair Bolsonaro','SP')"),3);
 assert.ok(run('CAMPAIGN_DICE_CHANCES[1]>0&&CAMPAIGN_DICE_CHANCES[1]<CAMPAIGN_DICE_CHANCES[0]&&CAMPAIGN_DICE_CHANCES[0]<.5'));
 });

test('last chance pays exactly once, respects maximum rounds and defaults off', () => {
 run("game=newGame('Lula','normal',6,['Lula','Jair Bolsonaro'],false);for(const s of STATES)game.localTotal[s.uf]['Jair Bolsonaro']=game.localInfluence[s.uf]['Jair Bolsonaro']=10");
 assert.equal(run('beginLastChance()'),false);
 run('game.strategiesEnabled=true;game.round=5;var expectedIncome=income(game.player),cashBefore=game.cash[game.player]');
 assert.equal(run('beginLastChance()'),true);
 assert.equal(run('game.round'),6);
 assert.equal(run('game.cash[game.player]-cashBefore'),run('expectedIncome'));
 assert.equal(run('beginLastChance()'),false);
 assert.equal(run('game.cash[game.player]-cashBefore'),run('expectedIncome'));
 run('game.lastChanceUsed=false');
 assert.equal(run('beginLastChance()'),false);
});

test('debate transfers a point to either winner, respects bounds and persists its dice', () => {
 run("game=newGame('Lula','normal',6,['Lula','Jair Bolsonaro'],false);game.strategiesEnabled=true;game.cash.Lula=10000000;game.localInfluence.SP['Jair Bolsonaro']=2");
 setDice(6,5,1,2);
 assert.equal(run("buyCampaignStrategy('Lula','debate','SP','Jair Bolsonaro')"),true);
 assert.equal(run("totalInfluence('Lula','SP')"),1);
 assert.equal(run("totalInfluence('Jair Bolsonaro','SP')"),1);
 const first=plain('game.strategyEvents[0]');
 run('game=JSON.parse(JSON.stringify(game));normalizePartyContext(game)');
 assert.deepEqual(plain('game.strategyEvents[0]'),first);
 setDice(1,1,6,6);
 assert.equal(run("buyCampaignStrategy('Lula','debate','SP','Jair Bolsonaro')"),true);
 assert.equal(run("totalInfluence('Lula','SP')"),0);
 assert.equal(run("totalInfluence('Jair Bolsonaro','SP')"),2);
 run("game.localInfluence.RJ.Lula=9.5;game.localInfluence.RJ['Jair Bolsonaro']=.75");
 setDice(6,6,1,1);
 assert.equal(run("buyCampaignStrategy('Lula','debate','RJ','Jair Bolsonaro')"),true);
 assert.equal(run("totalInfluence('Lula','RJ')"),10);
 assert.equal(run("totalInfluence('Jair Bolsonaro','RJ')"),.25);
});

test('dice result panel reveals saved results and closes without another charge or roll', () => {
 const elements={},timers=[];
 const element=id=>elements[id]??(elements[id]={
  classList:{values:new Set(),add(...names){names.forEach(n=>this.values.add(n))},remove(...names){names.forEach(n=>this.values.delete(n))},contains(name){return this.values.has(name)}},
  setAttribute(){},removeAttribute(){},focus(){},disabled:false
 });
 const isolated=vm.createContext({document:{getElementById:element},window:{matchMedia:()=>({matches:false})},setTimeout:callback=>{timers.push(callback);return timers.length},clearTimeout(){}});
 const dice=Array.from({length:4},(_,i)=>element('die'+i));
 const totals=Array.from({length:2},(_,i)=>({querySelector:tag=>element('total'+i+tag)}));
 element('campaignDuelBoard').querySelectorAll=selector=>selector==='.campaign-die'?dice:totals;
 vm.runInContext(definitions,isolated);
 const evaluate=expression=>vm.runInContext(expression,isolated);
 evaluate("game=newGame('Lula','normal',6,['Lula','Jair Bolsonaro'],false);game.strategiesEnabled=true;game.cash.Lula=1000000;game.localInfluence.SP['Jair Bolsonaro']=3;var faces=[6,6,1,1];Math.random=()=>((faces.shift())-.5)/6;buyCampaignStrategy('Lula','attack','SP','Jair Bolsonaro');showCampaignDuel(game.strategyEvents.at(-1))");
 const cash=evaluate('game.cash.Lula');
 assert.equal(elements.campaignDuelContinue.disabled,true);
 assert.ok(elements.campaignDuelBoard.innerHTML.includes('Soma dos dados'));
 assert.ok(elements.campaignDuelResult.innerHTML.includes('-2 pontos'));
 assert.ok(elements.campaignDuelResult.innerHTML.includes('Lula venceu'));
 evaluate('closeCampaignDuel()');
 assert.equal(elements.campaignDuelOverlay.classList.contains('hidden'),false);
 assert.equal(dice[0].classList.contains('is-tumbling'),true);
 assert.equal(dice[2].classList.contains('is-tumbling'),false);
 const firstFace=dice[0].innerHTML;
 timers[0]();
 assert.notEqual(dice[0].innerHTML,firstFace);
 assert.equal(elements.campaignDuelContinue.disabled,true);
 const revealed=[];
 for(let i=1;i<timers.length;i++){
  timers[i]();
  assert.ok(dice.filter(die=>die.classList.contains('is-tumbling')).length<=1);
  dice.forEach((die,index)=>{if(die.classList.contains('is-settled')&&!revealed.includes(index))revealed.push(index)});
 }
 assert.deepEqual(revealed,[0,2,1,3]);
 assert.equal(elements.total0strong.textContent,12);
 assert.equal(elements.total1strong.textContent,2);
 assert.equal(elements.campaignDuelContinue.disabled,false);
 evaluate("renderStrategyPreview=()=>{};closeCampaignDuel();closeCampaignDuel()");
 assert.equal(elements.campaignDuelOverlay.classList.contains('hidden'),true);
 assert.equal(evaluate('game.cash.Lula'),cash);
 assert.equal(evaluate('game.strategyEvents.length'),1);
 assert.equal(evaluate('faces.length'),0);
 assert.equal(evaluate("(campaignDieMarkup(6).match(/class=\"is-pip\"/g)||[]).length"),6);
});

test('extra defense die is revealed last and reduced motion reveals all dice without timers', () => {
 for(const reduced of [false,true]){
  const timers=[],dice=Array.from({length:5},()=>({classList:{values:new Set(['is-pending']),add(name){this.values.add(name)},remove(...names){names.forEach(name=>this.values.delete(name))}},setAttribute(){}}));
  const totals=[{span:{},strong:{}},{span:{},strong:{}}].map(fields=>({querySelector:tag=>fields[tag]}));
  const board={querySelectorAll:selector=>selector==='.campaign-die'?dice:totals};
  const isolated=vm.createContext({document:{getElementById:()=>board},window:{matchMedia:()=>({matches:reduced})},setTimeout:callback=>{timers.push(callback);return timers.length}});
  vm.runInContext(definitions,isolated);
  vm.runInContext("Math.random=()=>{throw Error('Animation must not reroll')};var finished=false;animateCampaignDice({attackerDice:[6,5],defenderDice:[2,3,4],defenseUsed:true},()=>{finished=true})",isolated);
  if(reduced){assert.equal(timers.length,0)}else{
   const order=[];
   for(let i=0;i<timers.length;i++){
    timers[i]();
    assert.ok(dice.filter(die=>die.classList.values.has('is-tumbling')).length<=1);
    dice.forEach((die,index)=>{if(die.classList.values.has('is-settled')&&!order.includes(index))order.push(index)});
   }
   assert.deepEqual(order,[0,2,1,3,4]);
  }
  assert.equal(vm.runInContext('finished',isolated),true);
  assert.equal(totals[0].querySelector('strong').textContent,11);
  assert.equal(totals[1].querySelector('strong').textContent,9);
  assert.ok(dice.every(die=>!die.classList.values.has('is-pending')));
 }
});

function defensiveDuelHarness(){
 const elements={};
 const element=id=>elements[id]??(elements[id]={textContent:'',disabled:false,focus(){},classList:{values:new Set(['hidden']),add(name){this.values.add(name)},remove(name){this.values.delete(name)},contains(name){return this.values.has(name)}}});
 const isolated=vm.createContext({document:{getElementById:element},clearTimeout(){}});
 vm.runInContext(definitions,isolated);
 const evaluate=code=>vm.runInContext(code,isolated);
 evaluate(`game=newGame('Lula','normal',6,['Lula','Jair Bolsonaro','Ciro Gomes'],false);game.strategiesEnabled=true;
  game.cash['Jair Bolsonaro']=game.cash['Ciro Gomes']=2000000;
  game.localInfluence.SP.Lula=8;game.localInfluence.SP['Jair Bolsonaro']=3;game.localInfluence.SP['Ciro Gomes']=3;
  var shown=[],aiCalls=0,incomeCalls=0,conclusions=0,actualRender=render;
  showCampaignDuel=event=>{shown.push(event.id);$('campaignDuelOverlay').classList.remove('hidden');$('campaignDuelContinue').disabled=false};
  aiBuySupports=aiImproveMultipliers=aiPlay=()=>0;allStatesLocked=()=>false;
  aiCampaignStrategy=id=>{aiCalls++;var faces=[6,6,1,1];Math.random=()=>((faces.shift())-.5)/6;buyCampaignStrategy(id,id==='Jair Bolsonaro'?'attack':'debate','SP','Lula');
   if(id==='Ciro Gomes'){faces=[6,6,1,1];buyCampaignStrategy(id,'debate','SP','Jair Bolsonaro')}
   return 1;};
  income=()=>{incomeCalls++;return 250000};startSupportRound=()=>false;
  render=persist=toast=()=>{};concludePhase=()=>{conclusions++};
 `);
 return {evaluate,elements};
}

test('ending a round queues only new AI challenges to the player and resumes once after reload', () => {
 const {evaluate,elements}=defensiveDuelHarness();
 evaluate("game.strategyEvents=[{id:'Jair Bolsonaro',target:'Lula',duel:{},phase:1,round:0}];nextTurn()");
 assert.equal(evaluate('game.pendingCampaignDuels.events.length'),2);
 assert.equal(evaluate('game.round'),1);
 assert.equal(evaluate('incomeCalls'),0);
 assert.equal(evaluate('game.strategySummary'),undefined);
 assert.equal(evaluate("totalInfluence('Lula','SP')"),5);
 assert.deepEqual(JSON.parse(evaluate('JSON.stringify(shown)')),['Jair Bolsonaro']);
 evaluate('nextTurn()');
 assert.equal(evaluate('aiCalls'),2);
 evaluate('closeCampaignDuel()');
 assert.equal(evaluate('game.pendingCampaignDuels.index'),1);
 assert.deepEqual(JSON.parse(evaluate('JSON.stringify(shown)')),['Jair Bolsonaro','Ciro Gomes']);
 evaluate("game=JSON.parse(JSON.stringify(game));normalizePartyContext(game);$('campaignDuelOverlay').classList.add('hidden');actualRender();nextTurn()");
 assert.equal(evaluate('shown.at(-1)'),'Ciro Gomes');
 assert.equal(evaluate('aiCalls'),2);
 evaluate('closeCampaignDuel()');
 assert.equal(evaluate('game.pendingCampaignDuels'),undefined);
 assert.equal(evaluate('game.round'),2);
 assert.equal(evaluate('incomeCalls'),3);
 assert.equal(evaluate('game.strategySummary.round'),1);
 assert.equal(elements.strategiesOverlay?.classList.contains('hidden')??true,true);
 evaluate('closeCampaignDuel()');
 assert.equal(evaluate('incomeCalls'),3);
});

test('final-round and last-chance challenges finish before concluding and never pay duplicate income', () => {
 for(const lastChance of [false,true]){
  const {evaluate}=defensiveDuelHarness();
  evaluate(lastChance?'game.lastChancePending=true;resolveLastChance()':'game.round=game.maxRounds;nextTurn()');
  assert.equal(evaluate('conclusions'),0);
  assert.equal(evaluate('game.pendingCampaignDuels.kind'),lastChance?'lastChance':'round');
  evaluate('resolveLastChance();nextTurn()');
  assert.equal(evaluate('aiCalls'),2);
  evaluate('allStatesLocked=()=>true;closeCampaignDuel();closeCampaignDuel()');
  assert.equal(evaluate('conclusions'),1);
  assert.equal(evaluate('incomeCalls'),0);
  assert.equal(evaluate('game.pendingCampaignDuels'),undefined);
 }
});

test('ending a round without incoming duels advances immediately', () => {
 const {evaluate}=defensiveDuelHarness();
 evaluate('aiCampaignStrategy=()=>0;nextTurn()');
 assert.equal(evaluate('game.round'),2);
 assert.equal(evaluate('game.pendingCampaignDuels'),undefined);
 assert.equal(evaluate('shown.length'),0);
 assert.equal(evaluate('incomeCalls'),3);
});

test('strategy summaries are conditional, scoped to a round and preserve actual effects', () => {
 run("game=newGame('Lula','normal',6,['Lula','Jair Bolsonaro'],false);game.strategiesEnabled=true;game.cash.Lula=10000000;game.cash['Jair Bolsonaro']=10000000");
 assert.equal(run('queueStrategySummary(1,1)'),false);
 setDice(6,6,1,1);
 run("game.localTotal.SP['Jair Bolsonaro']=game.localInfluence.SP['Jair Bolsonaro']=.5;buyCampaignStrategy('Lula','debate','SP','Jair Bolsonaro');buyCampaignStrategy('Jair Bolsonaro','defend','RJ')");
 const events=plain('strategyRoundEvents(1,1)');
 assert.equal(events.length,2);
 assert.equal(events[0].effects[0].id,'Lula');
 assert.deepEqual(events[0].duel.attackerDice,[6,6]);
 assert.equal(events[0].effects[0].points,-events[0].effects[1].points);
 assert.ok(events[0].effects[0].points<=1);
 assert.deepEqual(events[1].effects,[]);
 assert.equal(run('queueStrategySummary(1,1)'),true);
 assert.equal(run('queueStrategySummary(1,1)'),false);
 assert.equal(run('queueStrategySummary(2,1)'),false);
 const markup=run('strategySummaryRows(game.strategySummary.events)');
 assert.ok(markup.includes('São Paulo'));
 assert.ok(markup.includes('Rio de Janeiro'));
 assert.ok(markup.includes('Sem alteração de pontos'));
 run('game=JSON.parse(JSON.stringify(game));normalizePartyContext(game)');
 assert.equal(run('game.strategySummary.events.length'),2);
 run('delete game.strategySummary;game.round=2');
 assert.equal(run('queueStrategySummary(1,2)'),false);
});

test('ranking heading includes election year in both rounds without inventing a custom year', () => {
 run("game=newGame('Lula','normal',6,ELECTION_PRESETS[2002],true,'2002')");
 assert.equal(run('projectionHeading()'),'2002 · Projeção nacional · votos válidos');
 run('game.phase=2');
 assert.equal(run('projectionHeading()'),'2002 · Segundo turno · votos válidos');
 run('game.electionYear=null');
 assert.equal(run('projectionHeading()'),'Segundo turno · votos válidos');
});

test('third consecutive attempt reduces fixed income, not state income or same-party successors', () => {
 run("game=newGame('Lula','normal',6,ELECTION_PRESETS[2006],true,'2006');game.done=true;game.electionHistory=[{year:'2002',winner:'Lula',party:'PT'},{year:'2006',winner:'Lula',party:'PT'}];var thirdPlan=continuationPlan(game);var thirdPrevious=game;game=continuationGame(game,thirdPlan,'Lula',thirdPlan.ids)");
 assert.equal(run('game.cash.Lula'),250000);
 assert.equal(run("income('Lula')"),200000);
 run('game.localTotal.SP.Lula=game.localInfluence.SP.Lula=3');
 assert.equal(run("income('Lula')"),220000);
 run("game.firstResult={ranked:[{id:'Lula'},{id:'José Serra'}]};var thirdCash=game.cash.Lula;makeSecondRound(true)");
 assert.equal(run('game.cash.Lula-thirdCash'),220000);
 run("game=continuationGame(thirdPrevious,thirdPlan,'Dilma Rousseff',uniquePartyRoster(thirdPlan,'Dilma Rousseff',['Dilma Rousseff',...thirdPlan.ids]))");
 assert.equal(run("income('Dilma Rousseff')"),375000);
 assert.equal(run("thirdConsecutiveAttempt('Lula','2014',[{year:'2002',winner:'Lula'},{year:'2006',winner:'Lula'},{year:'2010',winner:'José Serra'}])"),false);
 run("game=JSON.parse(JSON.stringify(game));normalizePartyContext(game)");
 assert.equal(run("income('Dilma Rousseff')"),375000);
});

test('presidential interference charges by direction, changes only this turn and is exclusive', () => {
 run("game=newGame('Lula','normal',10,['Lula','Jair Bolsonaro'],false);game.strategiesEnabled=true;game.incumbent='Lula';game.cash.Lula=5000000;game.cash['Jair Bolsonaro']=5000000");
 assert.equal(run("buyCampaignStrategy('Jair Bolsonaro','interference','SP','delay')"),false);
 assert.equal(run("buyCampaignStrategy('Lula','interference','SP','bad')"),false);
 assert.equal(run("buyCampaignStrategy('Lula','interference','SP','advance')"),true);
 assert.equal(run('game.maxRounds'),2);
 assert.equal(run('game.cash.Lula'),4000000);
 assert.equal(run("buyCampaignStrategy('Lula','interference','SP','advance')"),false);
 assert.equal(run("buyCampaignStrategy('Lula','interference','SP','delay')"),true);
 assert.equal(run('game.maxRounds'),6);
 assert.equal(run('game.cash.Lula'),3500000);
 run('game.round=4');
 assert.equal(run("buyCampaignStrategy('Lula','interference','SP','advance')"),true);
 assert.equal(run('game.maxRounds'),5);
 run('game.round=5');
 assert.equal(run("buyCampaignStrategy('Lula','interference','SP','advance')"),false);
 run('game.round=6;game.maxRounds=10');
 assert.equal(run("buyCampaignStrategy('Lula','interference','SP','delay')"),true);
 assert.equal(run('game.maxRounds'),14);
 assert.equal(run('game.roundsPerTurn'),10);
 run('game=JSON.parse(JSON.stringify(game));normalizePartyContext(game)');
 assert.equal(run('game.maxRounds'),14);
 assert.equal(run('game.strategyEvents[0].effects.length'),0);
 assert.ok(run('strategySummaryRows(game.strategyEvents)').includes('Todo o país'));
 run("game.firstResult={ranked:[{id:'Lula'},{id:'Jair Bolsonaro'}]};makeSecondRound(true)");
 assert.equal(run('game.maxRounds'),10);
});

test('presidential AI delays when behind near the deadline, once per turn even after saving', () => {
 run("game=newGame('Lula','normal',10,['Lula','Jair Bolsonaro'],false);game.strategiesEnabled=true;game.incumbent='Jair Bolsonaro';game.round=9;game.cash['Jair Bolsonaro']=600000;game.localInfluence.AC.Lula=5;game.localInfluence.AC['Jair Bolsonaro']=3;aiCampaignStrategy('Jair Bolsonaro')");
 assert.equal(run('game.maxRounds'),14);
 assert.equal(run("game.cash['Jair Bolsonaro']+game.strategyEvents.reduce((spent,event)=>spent+campaignStrategyCost(event.type,event.target,event.uf),0)"),600000);
 assert.ok(run("game.cash['Jair Bolsonaro']>=0"));
 assert.equal(run('game.strategyEvents[0].type'),'interference');
 assert.equal(run('game.strategyEvents[0].target'),'delay');
 run("game=JSON.parse(JSON.stringify(game));normalizePartyContext(game);game.round=13;game.cash['Jair Bolsonaro']=600000;aiCampaignStrategy('Jair Bolsonaro')");
 assert.equal(run('game.maxRounds'),14);
 assert.equal(run("game.strategyEvents.filter(event=>event.type==='interference').length"),1);
});

test('presidential AI advances a safe lead and respects cost, deadline and presidency', () => {
 for(const scenario of ['lead','poor','late','not-president','narrow-lead']){
  run("game=newGame('Lula','normal',10,['Lula','Jair Bolsonaro'],false);game.strategiesEnabled=true;game.incumbent='Jair Bolsonaro';game.round=8;game.cash['Jair Bolsonaro']=1200000;for(const s of STATES){game.localInfluence[s.uf].Lula=2;game.localInfluence[s.uf]['Jair Bolsonaro']=8}");
  if(scenario==='poor')run("game.cash['Jair Bolsonaro']=900000");
  if(scenario==='late')run('game.round=9');
  if(scenario==='not-president')run("game.incumbent='Lula'");
  if(scenario==='narrow-lead')run("for(const s of STATES){game.localInfluence[s.uf].Lula=4.9;game.localInfluence[s.uf]['Jair Bolsonaro']=5.1}");
  run("aiCampaignStrategy('Jair Bolsonaro')");
  assert.equal(run('game.maxRounds'),scenario==='lead'?9:10,scenario);
  if(scenario==='lead'){
   assert.equal(run("game.cash['Jair Bolsonaro']+game.strategyEvents.reduce((spent,event)=>spent+campaignStrategyCost(event.type,event.target,event.uf),0)"),1200000);
   assert.ok(run("game.cash['Jair Bolsonaro']>=0"));
   assert.equal(run('game.strategyEvents[0].target'),'advance');
  }
 }
});

test('a presidential party switch preserves both guaranteed candidates', () => {
 run("game=newGame('Lula','normal',6,ELECTION_PRESETS[2026],true,'2026');game.endless=true;game.done=true;game.electionHistory=[{year:'2026',winner:'Flávio Bolsonaro',party:'PL'}];Math.random=()=>0;var protectedPlan=continuationPlan(game)");
 assert.ok(run("protectedPlan.partyChanges.some(change=>change.id==='Flávio Bolsonaro')"));
 assert.ok(run("protectedPlan.ids.includes('Lula')&&protectedPlan.ids.includes('Flávio Bolsonaro')"));
 assert.notEqual(run("protectedPlan.parties['Flávio Bolsonaro']"),'PT');
 assert.equal(run('new Set(protectedPlan.ids.map(id=>protectedPlan.parties[id])).size'),run('protectedPlan.ids.length'));
 assert.equal(run('continuationIncumbent(protectedPlan,protectedPlan.player,protectedPlan.ids)'),'Flávio Bolsonaro');
 run('game=JSON.parse(JSON.stringify(game));normalizePartyContext(game)');
 assert.deepEqual(plain('continuationPlan(game)'),plain('protectedPlan'));
 run("game=continuationGame(game,protectedPlan,'Lula',protectedPlan.ids)");
 assert.equal(run('game.incumbent'),'Flávio Bolsonaro');
 assert.ok(run("game.active.includes('Flávio Bolsonaro')"));
});

test('saved draws repair a presidential switch collision without rerolling', () => {
 run("game=newGame('Lula','normal',6,ELECTION_PRESETS[2026],true,'2026');game.endless=true;game.done=true;game.electionHistory=[{year:'2026',winner:'Flávio Bolsonaro',party:'PL'}];var savedPlan=continuationPlan(game);savedPlan.parties['Flávio Bolsonaro']='PT';savedPlan.partyChanges=[{id:'Flávio Bolsonaro',from:'PL',to:'PT'}];savedPlan.ids=['Lula','Ronaldo Caiado'];savedPlan.choices.push('Flávio Bolsonaro');game.nextElectionPlan=savedPlan;Math.random=()=>{throw Error('Must not reroll')};var repairedPlan=continuationPlan(game)");
 assert.deepEqual(plain('repairedPlan.ids'),['Lula','Flávio Bolsonaro']);
 assert.equal(run("repairedPlan.parties['Flávio Bolsonaro']"),'PL');
 assert.deepEqual(plain('repairedPlan.partyChanges'),[]);
 assert.equal(run("repairedPlan.choices.includes('Flávio Bolsonaro')"),false);
 assert.deepEqual(plain('continuationPlan(game)'),plain('repairedPlan'));
 assert.deepEqual(plain('game.electionHistory'),[{year:'2026',winner:'Flávio Bolsonaro',party:'PL'}]);
});

test('Jones Manoel is available in custom and future pools, not historical presidential rosters', () => {
 assert.ok(run("initialCandidateGroups(null).other.includes('Jones Manoel')"));
 assert.ok(run("PEOPLE.some(p=>p.id==='Jones Manoel'&&p.party==='PSOL'&&!p.celebrity)"));
 assert.ok(Object.values(plain('ELECTION_PRESETS')).every(ids=>!ids.includes('Jones Manoel')));
 run("game=newGame('Jones Manoel','normal',6,['Jones Manoel','Lula'],true,'2026');game.endless=true;game.done=true;var jonesPlan=continuationPlan(game)");
 assert.ok(run("jonesPlan.ids.includes('Jones Manoel')"));
});

test('future party switches are rare, capped, compatible and preserve the human party', () => {
 run("var switchPlan={player:'Lula',party:'PT',ids:['Lula','Jair Bolsonaro','Jones Manoel'],parties:{Lula:'PT','Jair Bolsonaro':'PL','Jones Manoel':'PSOL'},choices:['Lula']};var switchRandom=Math.random;Math.random=()=>.9;drawPartySwitch(switchPlan)");
 assert.equal(run('switchPlan.partyChanges.length'),0);
 run('Math.random=()=>.2;drawPartySwitch(switchPlan);Math.random=switchRandom');
 assert.equal(run('switchPlan.partyChanges.length'),1);
 assert.equal(run('switchPlan.parties.Lula'),'PT');
 assert.equal(run('new Set(switchPlan.ids.map(id=>switchPlan.parties[id])).size'),3);
 assert.ok(run('switchPlan.partyChanges.every(c=>c.id!==switchPlan.player&&FUTURE_PARTY_FAMILIES[campaignProfile(c.id)].includes(c.to))'));
 assert.equal(run("personForElection('Jair Bolsonaro').party"),'PL');
 run("game=newGame('Lula','normal',6,ELECTION_PRESETS[2026],true,'2026');game.endless=true;game.done=true;var savedSwitchPlan=continuationPlan(game);var savedSwitchNext=continuationGame(game,savedSwitchPlan,'Lula',savedSwitchPlan.ids)");
 assert.deepEqual(plain('savedSwitchNext.futureParties'),plain('savedSwitchPlan.parties'));
 assert.deepEqual(plain('continuationPlan(game)'),plain('savedSwitchPlan'));
});

test('future party switches allow a lower-probability destination outside the political family', () => {
 run("var crossPlan={player:'Lula',party:'PT',ids:['Lula','Jair Bolsonaro'],parties:{Lula:'PT','Jair Bolsonaro':'PL'},choices:['Lula']};var crossRandom=Math.random;Math.random=()=>0;drawPartySwitch(crossPlan);Math.random=crossRandom");
 const change=plain('crossPlan.partyChanges[0]');
 assert.equal(change.id,'Jair Bolsonaro');
 assert.ok(!plain('FUTURE_PARTY_FAMILIES.right').includes(change.to));
 assert.equal(change.to,'PT');
 assert.ok(run("crossPlan.choices.includes('Jair Bolsonaro')"));
 assert.equal(run('crossPlan.parties.Lula'),'PT');
 assert.equal(run("campaignProfile('Jair Bolsonaro')"),'right');
 assert.equal(run('crossPlan.partyChanges.length'),1);
});

test('party members can leave or join the human party without duplicating electoral nominees', () => {
 run("var memberPlan={future:true,year:'2030',player:'Flávio Bolsonaro',party:'PL',ids:['Flávio Bolsonaro','Lula'],parties:{'Flávio Bolsonaro':'PL','Lula':'PT','Jair Bolsonaro':'PL','Romeu Zema':'NOVO'},choices:['Flávio Bolsonaro','Jair Bolsonaro']};var memberRandom=Math.random;var memberDraws=[0,.9,.9,0,.5,0];Math.random=()=>memberDraws.shift()??.5;drawPartySwitch(memberPlan);Math.random=memberRandom");
 assert.equal(run("memberPlan.parties['Flávio Bolsonaro']"),'PL');
 assert.equal(run('memberPlan.partyChanges[0].id'),'Jair Bolsonaro');
 assert.notEqual(run("memberPlan.parties['Jair Bolsonaro']"),'PL');
 assert.ok(!run("memberPlan.choices.includes('Jair Bolsonaro')"));
 assert.equal(run('new Set(memberPlan.ids.map(id=>memberPlan.parties[id])).size'),run('memberPlan.ids.length'));
 run("var incomingPlan={future:true,year:'2030',player:'Lula',party:'PT',ids:['Lula','Jair Bolsonaro'],parties:{Lula:'PT','Jair Bolsonaro':'PL','Jones Manoel':'PSOL'},choices:['Lula']};Math.random=()=>0;drawPartySwitch(incomingPlan);Math.random=memberRandom");
 assert.equal(run("incomingPlan.parties['Jair Bolsonaro']"),'PT');
 assert.ok(run("incomingPlan.choices.includes('Jair Bolsonaro')"));
 assert.equal(run('incomingPlan.ids.length'),2);
 assert.equal(run("incomingPlan.ids.filter(id=>incomingPlan.parties[id]==='PT').length"),1);
 run("incomingPlan.selected=[...incomingPlan.ids];incomingPlan.controlled='Lula';changeContinuationPlayer(incomingPlan,'Jair Bolsonaro')");
 assert.ok(run("incomingPlan.selected.includes('Jair Bolsonaro')&&!incomingPlan.selected.includes('Lula')"));
});

test('interference affordability depends on the selected direction', () => {
 run("game=newGame('Lula','normal',10,['Lula','Jair Bolsonaro'],false);game.strategiesEnabled=true;game.incumbent='Lula';game.cash.Lula=500000");
 assert.equal(run("buyCampaignStrategy('Lula','interference','SP','advance')"),false);
 assert.equal(run("buyCampaignStrategy('Lula','interference','SP','delay')"),true);
 assert.equal(run('game.cash.Lula'),0);
 assert.equal(run('game.maxRounds'),14);
});

test('setup keeps rules and trajectory details in the second step', () => {
 const first=html.slice(html.indexOf('<div id="setupStepCandidates">'),html.indexOf('<div id="setupStepOptions"'));
 const second=html.slice(html.indexOf('<div id="setupStepOptions"'),html.indexOf('id="resultOverlay"'));
 assert.ok(!first.includes('75 mil'));
 assert.ok(!first.includes('id="campaignHint"'));
 assert.ok(second.includes('id="campaignHint"'));
 assert.ok(second.includes('Como funciona a continuidade?'));
 assert.ok(second.includes('R$ 200 mil'));
 assert.ok(first.indexOf('id="chooseElection"')<first.indexOf('id="officialCandidates"'));
 assert.ok(first.indexOf('id="officialCandidates"')<first.indexOf('id="chooseP"'));
});

test('Luladroid unlocks in future elections from 2080, never in initial custom rosters', () => {
 run("var droidRandom=Math.random;Math.random=()=>.9;game=newGame('Lula','normal',6,['Lula','Jair Bolsonaro'],true,'2026');game.endless=true");
 for(const year of ['2030','2078']){
  run(`var lockedDroidPlan=futureElectionPlan(game,'${year}')`);
  assert.ok(!run("lockedDroidPlan.ids.includes('Luladroid da Silva')"));
  assert.ok(!run("lockedDroidPlan.choices.includes('Luladroid da Silva')"));
 }
 for(const year of ['2080','2082']){
  run(`var unlockedDroidPlan=futureElectionPlan(game,'${year}')`);
  assert.ok(run("unlockedDroidPlan.choices.includes('Luladroid da Silva')"));
  assert.equal(run("unlockedDroidPlan.parties['Luladroid da Silva']"),'PT');
  run("unlockedDroidPlan.selected=[...unlockedDroidPlan.ids];changeContinuationPlayer(unlockedDroidPlan,'Luladroid da Silva')");
  assert.ok(run("unlockedDroidPlan.selected.includes('Luladroid da Silva')"));
 }
 run('Math.random=droidRandom');
 assert.ok(!run("initialCandidateGroups(null).other.includes('Luladroid da Silva')"));
 assert.equal(run("validInitialRoster('Lula',['Lula','Luladroid da Silva'],null)"),false);
});

test('new elections start at x1 and third-term candidates can buy state promises', () => {
 for(const difficulty of ['easy','normal','hard']){
  run(`game=newGame('Lula','${difficulty}',6,['Lula','Jair Bolsonaro'],true,'2010');game.electionHistory=[{year:'2002',winner:'Lula'},{year:'2006',winner:'Lula'}];game.incumbent='Lula'`);
  assert.ok(run("game.active.every(id=>STATES.every(s=>affinityMultiplier(id,s.uf)===1))"));
  run("game.cash.Lula=1000000");
  assert.ok(run("buyMultiplier('Lula',false,'SP')"));
  assert.equal(run("affinityMultiplier('Lula','SP')"),1.25);
  run("game.player='Jair Bolsonaro'");
  assert.equal(run("affinityMultiplier('Lula','SP')"),1.25);
 }
});

test('interference preview is pure and loses two national percentage points proportionally', () => {
 run("game=newGame('Lula','normal',10,['Lula','Jair Bolsonaro'],false);game.strategiesEnabled=true;game.incumbent='Lula';game.cash.Lula=2000000;for(const s of STATES){game.localTotal[s.uf].Lula=game.localInfluence[s.uf].Lula=5;game.localTotal[s.uf]['Jair Bolsonaro']=game.localInfluence[s.uf]['Jair Bolsonaro']=3}");
 const snapshot=plain('game');
 const preview=plain("interferencePenalty('Lula')");
 assert.deepEqual(plain('game'),snapshot);
 assert.ok(Math.abs(preview.loss-2)<.00001);
 assert.equal(preview.allocations.length,27);
 const ratios=plain("interferencePenalty('Lula').allocations.map(a=>a.points/totalInfluence('Lula',a.uf))");
 assert.ok(ratios.every(r=>Math.abs(r-ratios[0])<1e-10));
 run("buyCampaignStrategy('Lula','interference','SP','delay')");
 assert.ok(Math.abs(run("nationalResult().ranked.find(r=>r.id==='Lula').pct")-preview.after)<.00001);
 assert.equal(run('game.maxRounds'),14);
 assert.equal(run('game.strategyEvents[0].effects.length'),27);
 assert.ok(run('strategySummaryRows(game.strategyEvents)').includes('São Paulo (SP)'));
 assert.equal(run("stateLockedBy('MA')"),null);
 run('game.round=2;game.localUsed=makeUses(game.active)');
 const before=run("totalInfluence('Lula','SP')");
 assert.equal(run("applyLocal('Lula','SP')"),true);
 assert.ok(run("totalInfluence('Lula','SP')")>before);
 const saved=plain('nationalResult()');
 run('game=JSON.parse(JSON.stringify(game));normalizePartyContext(game)');
 assert.deepEqual(plain('nationalResult()'),saved);
 assert.equal(run('nationalResult().totalValid+nationalResult().indecisos'),run('totalValid'));
});

test('interference handles no votes, shares below 2 percent and sole-candidate votes safely', () => {
 run("game=newGame('Lula','normal',10,['Lula','Jair Bolsonaro'],false);game.strategiesEnabled=true;game.incumbent='Lula';game.cash.Lula=2000000");
 assert.equal(run("interferencePenalty('Lula').loss"),0);
 run('game.localTotal.SP.Lula=game.localInfluence.SP.Lula=1');
 assert.ok(run("strategyReason('Lula','interference','SP','delay')").includes('Aguarde votos'));
 assert.equal(run("buyCampaignStrategy('Lula','interference','SP','delay')"),false);
 run("game.localTotal.SP.Lula=game.localInfluence.SP.Lula=.25;for(const s of STATES)game.localTotal[s.uf]['Jair Bolsonaro']=game.localInfluence[s.uf]['Jair Bolsonaro']=5");
 const preview=plain("interferencePenalty('Lula')");
 assert.ok(preview.before>0&&preview.before<2);
 assert.equal(preview.after,0);
 assert.equal(run("buyCampaignStrategy('Lula','interference','SP','advance')"),true);
 assert.equal(run("nationalResult().tally.Lula"),0);
 assert.ok(run("STATES.every(s=>totalInfluence('Lula',s.uf)>=0)"));
});

test('full script parses; each person has one canonical ID and one group', () => {
  new vm.Script(script);
  const people = plain('PEOPLE');
  assert.equal(new Set(people.map(p => p.id)).size, people.length);
  assert.equal(people.length, 73);
  assert.equal(people.filter(p => p.group === '2026').length, 12);
  assert.ok(people.every(p => ['left', 'center', 'right'].includes(p.axis)));
});

test('all seven rosters have unique, existing candidates and fit the limit', () => {
  const counts = {2002: 6, 2006: 7, 2010: 9, 2014: 11, 2018: 13, 2022: 11, 2026: 12};
  for (const [year, count] of Object.entries(counts)) {
    const ids = plain(`ELECTION_PRESETS[${year}]`);
    assert.equal(ids.length, count);
    assert.equal(new Set(ids).size, count);
    assert.ok(run(`validateCandidates(ELECTION_PRESETS[${year}][0], ELECTION_PRESETS[${year}])`));
    assert.equal(run(`matchingElection([...ELECTION_PRESETS[${year}]].reverse())`), year);
  }
  assert.equal(run("matchingElection(DEFAULT_CANDIDATES)"), '');
  assert.equal(run('matchingElection(ELECTION_PRESETS[2022].slice(1))'), '');
});

test('historical shortcuts use final candidates rather than vice candidates or withdrawn names', () => {
  assert.ok(run("ELECTION_PRESETS[2018].includes('Fernando Haddad') && !ELECTION_PRESETS[2018].includes('Lula')"));
  assert.ok(run("ELECTION_PRESETS[2022].includes('Padre Kelmon') && !ELECTION_PRESETS[2022].includes('Pablo Marçal')"));
  assert.ok(run("!ELECTION_PRESETS[2022].includes('Rui Costa Pimenta') && !ELECTION_PRESETS[2006].includes('Rui Costa Pimenta')"));
  assert.deepEqual(plain('ELECTION_PRESETS[2026]'), plain('PEOPLE_2026.map(p=>p.id)'));
});

test('all rosters initialize and conserve simulated votes, including thirteen candidates', () => {
  for (const year of Object.keys(plain('ELECTION_PRESETS'))) {
    run(`game=newGame(ELECTION_PRESETS[${year}][0], 'normal', 10, ELECTION_PRESETS[${year}], false)`);
    assert.equal(run('game.active.length'), run(`ELECTION_PRESETS[${year}].length`));
    assert.equal(run('game.supportsEnabled'), false);
    assert.equal(run('Object.keys(game.localTotal).length'), 27);
    run('for(const state of STATES) game.active.forEach((id,i)=>game.localTotal[state.uf][id]=game.localInfluence[state.uf][id]=i%4)');
    assert.equal(run('nationalResult().totalValid + nationalResult().indecisos'), run('totalValid'));
    assert.ok(run('game.active.every(id=>Number.isFinite(nationalResult().tally[id]))'));
  }
  assert.equal(run("validateCandidates('Lula',['Lula','Lula'])"), false);
  assert.equal(run('validateCandidates(PEOPLE[0].id,PEOPLE.slice(0,14).map(p=>p.id))'), false);
});

test('new people have distinct colors and every party has an image or local fallback', () => {
  assert.ok(run("PEOPLE.every(p=>partyIcon(p.id).includes('<img src=') && color(p.id)!=='#9bb0c8')"));
  for (const ids of Object.values(plain('ELECTION_PRESETS'))) {
    const colors = ids.map(id => run(`color(${JSON.stringify(id)})`));
    assert.equal(new Set(colors).size, ids.length);
  }
});

test('custom games use the last registered party instead of uncertain affiliation', () => {
  for(const [id,party] of [['Ana Maria Rangel','PRP'],['Ivan Pinheiro','PCB'],['João Amoêdo','NOVO']]) {
    assert.equal(run(`personForElection(${JSON.stringify(id)}).party`),party);
    assert.equal(run(`partySnapshot([${JSON.stringify(id)}])[${JSON.stringify(id)}]`),party);
    assert.ok(run(`partyIcon(${JSON.stringify(id)},personForElection(${JSON.stringify(id)}))`).includes('party-'+party.toLowerCase()+'.'));
  }
  assert.ok(run("PEOPLE.every(p=>!['A confirmar','Sem partido'].includes(personForElection(p.id).party))"));
});

test('every preset has exactly one historical party per candidate', () => {
  for(const [year,ids] of Object.entries(plain('ELECTION_PRESETS'))) {
    const parties=plain(`ELECTION_PARTIES[${year}]`);
    assert.equal(parties.length,ids.length);
    for(let i=0;i<ids.length;i++) {
      assert.equal(run(`personForElection(${JSON.stringify(ids[i])},${year}).party`),parties[i]);
      assert.ok(parties[i]);
    }
  }
});

test('current and historical labels are independent and can be switched repeatedly', () => {
  const cases=[['Jair Bolsonaro','PL',{2018:'PSL',2022:'PL'}],['Marina Silva','REDE',{2010:'PV',2014:'PSB',2018:'REDE'}],['Ciro Gomes','PSDB',{2002:'PPS',2018:'PDT',2022:'PDT'}],['Geraldo Alckmin','PSB',{2006:'PSDB',2018:'PSDB'}],['Simone Tebet','PSB',{2022:'MDB'}],['Cabo Daciolo','MOBILIZA',{2018:'PATRIOTA'}],['João Amoêdo','NOVO',{2018:'NOVO'}],['José Maria Eymael','DC',{2006:'PSDC',2014:'PSDC'}]];
  for(const [id,current,history] of cases) {
    for(const [year,party] of Object.entries(history)) {
      run(`setupElectionYear=${JSON.stringify(year)}`);
      assert.equal(run(`setupPerson(${JSON.stringify(id)}).party`),party);
      run('setupElectionYear=null');
      assert.equal(run(`setupPerson(${JSON.stringify(id)}).party`),current);
    }
  }
  assert.equal(run("personForElection('Michelle Bolsonaro',2002).party"),'PL');
});

test('historical games freeze parties for all candidates without changing profiles or votes', () => {
  run("game=newGame('Jair Bolsonaro','normal',10,ELECTION_PRESETS[2018],true,'2018')");
  const before=plain('game.candidateParties');
  run("setupElectionYear='2022'");
  assert.equal(run("who('Jair Bolsonaro').party"),'PSL');
  assert.equal(run("setupPerson('Jair Bolsonaro').party"),'PL');
  assert.equal(run("who('Marina Silva').party"),'REDE');
  assert.equal(run("campaignProfile('Ciro Gomes')"),'center');
  assert.deepEqual(plain('game.candidateParties'),before);
  assert.equal(run('game.electionYear'),'2018');
  const current=plain("newGame('Jair Bolsonaro','normal',10,ELECTION_PRESETS[2018],true)");
  assert.equal(current.candidateParties['Jair Bolsonaro'],'PL');
  assert.equal(current.electionYear,null);
  assert.deepEqual(current.localTotal,plain('game.localTotal'));
});

test('round trip and legacy restore keep saved parties, including in runoff supports', () => {
  const storage=new Map();
  const isolated=vm.createContext({localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},document:{getElementById:()=>({classList:{add(){}}})}});
  vm.runInContext(definitions,isolated);
  const check=code=>vm.runInContext(code,isolated);
  check("render=()=>{}; game=newGame('Jair Bolsonaro','normal',10,ELECTION_PRESETS[2018],false,'2018'); game.firstResult={ranked:[{id:'Jair Bolsonaro'},{id:'Fernando Haddad'}]}; makeSecondRound(); persist(); game=null;");
  assert.equal(check('restore()'),true);
  assert.equal(check('game.phase'),2);
  assert.equal(check("who('Jair Bolsonaro').party"),'PSL');
  assert.equal(check("who('Geraldo Alckmin').party"),'PSDB');
  assert.equal(check("supportSources().includes('Geraldo Alckmin')"),true);
  assert.equal(check('game.electionYear'),'2018');
  check("game=newGame('Luciano Bivar','normal',10,['Luciano Bivar','Lula']); delete game.candidateParties; delete game.electionYear; persist(); game=null;");
  assert.equal(check('restore()'),true);
  assert.equal(check("who('Luciano Bivar').party"),'PSL');
  assert.equal(check("personForElection('Luciano Bivar').party"),'MDB');
  assert.equal(check('game.electionYear'),null);
});

test('all current, historical and legacy parties have bundled logos', () => {
  const parties=plain('[...new Set([...PEOPLE.map(p=>p.party),...Object.values(LEGACY_PARTIES),...Object.values(ELECTION_PARTIES).flat()])]');
  for(const party of parties) {
    const src=run(`partyLogoSrc(${JSON.stringify(party)})`);
    if(['Sem partido','A confirmar'].includes(party)) {
      assert.equal(src,null);
      continue;
    }
    assert.ok(src?.startsWith('./assets/'),party);
    const bytes=fs.readFileSync(path.join(__dirname,'..',src));
    assert.ok(bytes.length>100,party);
    if(src.endsWith('.png')) assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    if(src.endsWith('.jpg')) assert.equal(bytes.subarray(0,3).toString('hex'),'ffd8ff');
    assert.ok(run(`partyIcon('Lula',{party:${JSON.stringify(party)}})`).includes(src));
  }
});

test('continuity advances sequentially, retains the player and keeps the original party', () => {
  assert.equal(run('nextElectionYear(null)'),null);
  assert.equal(run('nextElectionYear(2026)'),null);
  run("game=newGame('Ciro Gomes','hard',6,ELECTION_PRESETS[2002],false,'2002')");
  assert.equal(run('continuationPlan(game)'),null);
  for(const year of ['2006','2010','2014','2018','2022','2026']) {
    run('game.done=true');
    const plan=plain('continuationPlan(game)');
    assert.equal(plan.year,year);
    assert.equal(plan.party,'PPS');
    assert.ok(plan.ids.includes('Ciro Gomes'));
    assert.ok(plan.ids.length<=13);
    assert.equal(new Set(plan.ids).size,plan.ids.length);
    run(`game=newGame('Ciro Gomes','hard',6,${JSON.stringify(plan.ids)},false,${JSON.stringify(year)},'PPS')`);
    assert.equal(run("who('Ciro Gomes').party"),'PPS');
    assert.ok(run('Object.values(game.localTotal).every(state=>Object.values(state).every(n=>n===0))'));
    assert.ok(run('Object.values(game.cash).every(n=>n===START_CASH)'));
    run('game=JSON.parse(JSON.stringify(game));normalizePartyContext(game)');
    assert.equal(run("who('Ciro Gomes').party"),'PPS');
  }
  run('game.done=true');
  assert.equal(run('continuationPlan(game)'),null);
});

test('only same-party candidates are eligible; no artificial party changes', () => {
  run("setupElectionYear='2006';setupCampaign={player:'Ciro Gomes',party:'PPS',parties:{'Ciro Gomes':'PPS'}}");
  assert.equal(run("setupPerson('Cristovam Buarque').party"),'PDT');
  assert.equal(run("eligibleCampaignCandidate('Cristovam Buarque')"),false);
  assert.equal(run("eligibleCampaignCandidate('Ciro Gomes')"),true);
  assert.equal(run("setupPerson('Lula').party"),'PT');
  run("setupCampaign={party:'PT',parties:{Lula:'PT'}}");
  assert.equal(run("eligibleCampaignCandidate('Fernando Haddad')"),true);
  assert.equal(run("eligibleCampaignCandidate('José Serra')"),false);
  run('setupCampaign=null');
});

test('AI runoff determines an actual winner after player elimination and history is idempotent', () => {
  run("game=newGame('Ciro Gomes','normal',6,ELECTION_PRESETS[2002],true,'2002');for(const state of STATES){game.localTotal[state.uf]['Lula']=game.localInfluence[state.uf]['Lula']=2;game.localTotal[state.uf]['José Serra']=game.localInfluence[state.uf]['José Serra']=2;game.localTotal[state.uf]['Anthony Garotinho']=game.localInfluence[state.uf]['Anthony Garotinho']=1}game.firstResult=nationalResult();game.done=true");
  const levels=plain('game.localTotal');
  run('recordElectionWinner()');
  assert.equal(run('game.automaticRunoff'),true);
  assert.equal(run('game.secondResult.ranked.length'),2);
  assert.equal(run('game.electionHistory[0].winner'),run('game.secondResult.ranked[0].id'));
  assert.deepEqual(plain('game.localTotal'),levels);
  run('recordElectionWinner()');
  assert.equal(run('game.electionHistory.length'),1);
  const plan=plain('continuationPlan(game)');
  assert.ok(plan.ids.includes(plan.winner));
  assert.ok(plan.ids.includes('Ciro Gomes'));
  assert.equal(plan.history[0].year,'2002');
  run('game=JSON.parse(JSON.stringify(game));normalizePartyContext(game)');
  assert.equal(run('game.electionHistory.length'),1);
});

test('winner and player are retained even when the next preset has thirteen candidates', () => {
  run("game=newGame('Eduardo Jorge','normal',6,ELECTION_PRESETS[2014],false,'2014');game.done=true;game.electionHistory=[{year:'2014',winner:'Pastor Everaldo',party:'PSC'}]");
  const plan=plain('continuationPlan(game)');
  assert.equal(plan.ids.length,13);
  assert.ok(plan.ids.includes('Pastor Everaldo')&&plan.ids.includes('Eduardo Jorge'));
  assert.equal(new Set(plan.ids).size,13);
  assert.equal(plan.parties['Pastor Everaldo'],'PSC');
});

test('compact continuation rejects outsiders and other parties, retains history and settings', () => {
 run("game=newGame('Lula','hard',6,ELECTION_PRESETS[2002],false,'2002');game.done=true;game.electionHistory=[{year:'2002',winner:'José Serra',party:'PSDB'}];var compactPlan=continuationPlan(game)");
 assert.equal(run("continuationCandidates(compactPlan).includes('Fernando Haddad')"),false);
 assert.throws(()=>run("continuationGame(game,compactPlan,'Lula',['Lula','José Serra','Fernando Haddad'])"));
 assert.throws(()=>run("continuationGame(game,compactPlan,'Geraldo Alckmin',compactPlan.ids)"));
 assert.throws(()=>run("continuationGame(game,compactPlan,'Lula',['Lula','Cristovam Buarque'])"));
 run("var compactNext=continuationGame(game,compactPlan,'Lula',['Lula','José Serra'])");
 assert.equal(run('compactNext.electionYear'),'2006');
 assert.equal(run('compactNext.difficulty'),'hard');
 assert.equal(run('compactNext.roundsPerTurn'),6);
 assert.equal(run('compactNext.supportsEnabled'),false);
 assert.equal(run('compactNext.electionHistory[0].winner'),'José Serra');
 assert.equal(run('compactNext.campaignStartYear'),'2002');
});

test('initial election years only accept their own roster; custom remains unrestricted', () => {
 assert.equal(run("validInitialRoster('Lula',['Lula','José Serra'],'2002')"),true);
 assert.equal(run("validInitialRoster('Lula',['Lula','Fernando Haddad'],'2002')"),false);
 assert.equal(run("validInitialRoster('Lula',['Lula','Fernando Haddad'],null)"),true);
});

test('former presidents return for revenge; only the latest winner receives the income bonus', () => {
 run("game=newGame('Lula','normal',6,ELECTION_PRESETS[2006],false,'2006');game.done=true;game.electionHistory=[{year:'2002',winner:'Ciro Gomes',party:'PPS'},{year:'2006',winner:'José Serra',party:'PSDB'}];game.campaignStartYear='2002';var revengePlan=continuationPlan(game)");
 assert.ok(run("continuationCandidates(revengePlan).includes('Ciro Gomes')"));
 run("game=continuationGame(game,revengePlan,'Lula',['Lula','José Serra','Ciro Gomes'])");
 assert.equal(run('game.incumbent'),'José Serra');
 assert.equal(run("game.cash['José Serra']"),425000);
 assert.equal(run("income('José Serra')"),375000);
 assert.equal(run("income('Ciro Gomes')"),300000);
 run("game.round++;for(const id of game.active)game.cash[id]+=income(id)");
 assert.equal(run("game.cash['José Serra']-game.cash['Ciro Gomes']"),150000);
 run("game=JSON.parse(JSON.stringify(game));normalizePartyContext(game)");
 assert.equal(run("presidentBonus('José Serra')"),75000);
 run("game.firstResult={ranked:[{id:'José Serra'},{id:'Lula'}]};var cashBeforeRunoff=game.cash['José Serra'];makeSecondRound(true)");
 assert.equal(run("game.cash['José Serra']-cashBeforeRunoff"),375000);
 assert.equal(run("income('José Serra')"),375000);
 run("game.done=true;game.electionHistory.push({year:'2010',winner:'Lula',party:'PT'});var nextPlan=continuationPlan(game);game=continuationGame(game,nextPlan,'Lula',['Lula','José Serra','Ciro Gomes'])");
 assert.equal(run("presidentBonus('José Serra')"),0);
 assert.equal(run("presidentBonus('Lula')"),75000);
});

test('incumbents use the next official party, including the human winner, without rewriting history', () => {
 for(const player of ['Fernando Haddad','Jair Bolsonaro']) {
  run(`game=newGame(${JSON.stringify(player)},'normal',6,ELECTION_PRESETS[2018],true,'2018');game.done=true;game.electionHistory=[{year:'2018',winner:'Jair Bolsonaro',party:'PSL'}];var partyPlan=continuationPlan(game)`);
  assert.equal(run("continuationPerson(partyPlan,'Jair Bolsonaro').party"),'PL');
  assert.equal(run('partyPlan.party'),player==='Jair Bolsonaro'?'PL':'PT');
  run(`game=continuationGame(game,partyPlan,${JSON.stringify(player)},partyPlan.ids)`);
  assert.equal(run("who('Jair Bolsonaro').party"),'PL');
  assert.equal(run("presidentBonus('Jair Bolsonaro')"),75000);
  assert.equal(run('game.electionHistory[0].party'),'PSL');
  assert.ok(run("partyIcon('Jair Bolsonaro').includes('party-pl.svg')"));
  run('game=JSON.parse(JSON.stringify(game));normalizePartyContext(game)');
  assert.equal(run("who('Jair Bolsonaro').party"),'PL');
 }
 run("game=newGame('Lula','normal',6,ELECTION_PRESETS[2002],true,'2002');game.done=true;game.electionHistory=[{year:'2002',winner:'Ciro Gomes',party:'PPS'}];var absentPlan=continuationPlan(game)");
 assert.equal(run("continuationPerson(absentPlan,'Ciro Gomes').party"),'PPS');
});

test('the primary candidate list follows the year and custom restores the 2026 grouping', () => {
 for(const year of Object.keys(plain('ELECTION_PRESETS'))) {
  const groups=plain(`initialCandidateGroups(${JSON.stringify(year)})`);
  assert.deepEqual(groups.primary,plain(`ELECTION_PRESETS[${year}]`));
  assert.equal(new Set([...groups.primary,...groups.other]).size,63);
  assert.equal(groups.primary.length+groups.other.length,63);
 }
 const custom=plain('initialCandidateGroups(null)');
 assert.deepEqual(custom.primary,plain('PEOPLE_2026.map(p=>p.id)'));
 assert.deepEqual(custom.other,plain("PEOPLE.filter(p=>p.group==='alternativo'&&!p.celebrity&&!p.unlockYear).map(p=>p.id)"));
 for(const person of plain('FUTURE_PEOPLE')){
  assert.equal(custom.other.includes(person.id),!person.celebrity&&!person.unlockYear);
  assert.equal(run(`validInitialRoster('Lula',['Lula',${JSON.stringify(person.id)}],'2026')`),false);
 }
 assert.ok(run("validInitialRoster('Lulinha',['Lulinha','Janja'],null)"));
});

test('endless election plans persist and draw 2–10 people with at most one invited celebrity', () => {
 assert.equal(run("nextElectionYear('2026',false)"),null);
 assert.equal(run("nextElectionYear('2026',true)"),'2030');
 run("game=newGame('Lula','normal',6,ELECTION_PRESETS[2026],true,'2026');game.endless=true;game.done=true;game.electionHistory=[{year:'2026',winner:'Flávio Bolsonaro',party:'PL'}]");
 const first=plain('continuationPlan(game)');
 assert.deepEqual(plain('continuationPlan(game)'),first);
 assert.ok(first.ids.length>=2&&first.ids.length<=10);
 assert.equal(new Set(first.ids).size,first.ids.length);
 assert.ok(first.ids.includes('Lula')&&first.ids.includes('Flávio Bolsonaro'));
 assert.ok(run("continuationChoices(continuationPlan(game)).filter(isCelebrity).length<=1"));
 run('game=JSON.parse(JSON.stringify(game));normalizePartyContext(game)');
 assert.deepEqual(plain('continuationPlan(game)'),first);
 run("var futurePlan=continuationPlan(game);var chosenFuturePlayer=futurePlan.celebrity||game.player;game=continuationGame(game,futurePlan,chosenFuturePlayer,uniquePartyRoster(futurePlan,chosenFuturePlayer,[chosenFuturePlayer,...futurePlan.ids]))");
 assert.equal(run('game.candidateParties[game.player]'),'PT');
 assert.equal(run('game.electionYear'),'2030');
 assert.equal(run('game.endless'),true);
 assert.equal(run('game.electionHistory[0].party'),'PL');
 for(let i=0;i<20;i++) {
  run("game.done=true;game.electionHistory.push({year:game.electionYear,winner:game.player,party:game.candidateParties[game.player]});var laterPlan=continuationPlan(game);game=continuationGame(game,laterPlan,game.player,laterPlan.ids);game=JSON.parse(JSON.stringify(game));normalizePartyContext(game)");
  assert.equal(run('game.electionYear'),String(2034+4*i));
  assert.ok(run('game.all.length>=2&&game.all.length<=10'));
  assert.equal(run('game.electionHistory.length'),i+2);
 }
});

test('future mode permits same-party newcomers but rejects outsiders and invalid roster sizes', () => {
 run('var rosterRandom=Math.random;Math.random=()=>.9');
 run("game=newGame('Jair Bolsonaro','normal',6,ELECTION_PRESETS[2022],false,'2026');game.endless=true;game.done=true;var restrictedPlan=continuationPlan(game)");
 assert.ok(run("continuationChoices(restrictedPlan).includes('Nikolas Ferreira')"));
 assert.ok(run("continuationChoices(restrictedPlan).includes('Jair Renan Bolsonaro')"));
 assert.equal(run("continuationChoices(restrictedPlan).includes('Erika Hilton')"),false);
 assert.throws(()=>run("continuationGame(game,restrictedPlan,'Erika Hilton',[...restrictedPlan.ids.filter(id=>id!==game.player),'Erika Hilton'])"));
 assert.throws(()=>run("continuationGame(game,restrictedPlan,game.player,[game.player])"));
 run('Math.random=rosterRandom');
});

test('new future candidates join their party choices only after 2026', () => {
 run('var newcomerRandom=Math.random;Math.random=()=>.9');
 for(const [id,party] of [['Lulinha','PT'],['Janja','PT'],['Jair Renan Bolsonaro','PL'],['Arthur do Val','MISSAO'],['Kim Kataguiri','MISSAO'],['Amanda Vettorazzo','MISSAO']]){
  const person=plain(`PEOPLE.find(p=>p.id===${JSON.stringify(id)})`);
  assert.equal(person.party,party);
  assert.equal(person.future,true);
  assert.equal(person.celebrity,false);
  assert.ok(Object.values(plain('ELECTION_PRESETS')).every(ids=>!ids.includes(id)));
 }
 run("game=newGame('Lula','normal',6,ELECTION_PRESETS[2026],false,'2026');game.endless=true;game.done=true;var ptFuturePlan=continuationPlan(game)");
 assert.equal(run('ptFuturePlan.year'),'2030');
 assert.ok(run("continuationChoices(ptFuturePlan).includes('Lulinha') && continuationChoices(ptFuturePlan).includes('Janja')"));
 run("game=newGame('Renan Santos','normal',6,ELECTION_PRESETS[2026],false,'2026');game.endless=true;game.done=true;var missaoFuturePlan=continuationPlan(game)");
 assert.ok(run("['Arthur do Val','Kim Kataguiri','Amanda Vettorazzo'].every(id=>continuationChoices(missaoFuturePlan).includes(id))"));
 run('Math.random=newcomerRandom');
});

test('future draws cap all celebrities at two and separate their parties', () => {
 run("game=newGame('Lula','normal',6,ELECTION_PRESETS[2026],true,'2026')");
 for(let i=0;i<200;i++) {
  const plan=plain("futureElectionPlan(game,'2030')");
  const celebrities=plan.ids.filter(id=>run(`isCelebrity(${JSON.stringify(id)})`));
  assert.ok(celebrities.length<=2);
  assert.ok(celebrities.filter(id=>plan.parties[id]===plan.party).length<=1);
  assert.ok(celebrities.filter(id=>plan.parties[id]!==plan.party).length<=1);
  assert.ok(plan.ids.length>=2&&plan.ids.length<=10);
  assert.equal(new Set(plan.ids.map(id=>plan.parties[id])).size,plan.ids.length);
 }
 run("game=newGame('Felipe Neto','normal',6,['Felipe Neto','Monark'],true,'2026');game.candidateParties={'Felipe Neto':'PT',Monark:'PL'};game.electionHistory=[{year:'2026',winner:'Monark',party:'PL'}]");
 for(let i=0;i<20;i++)assert.equal(run("futureElectionPlan(game,'2030').ids.filter(isCelebrity).length"),2);
});

test('same-party candidacies remain valid initially but continuation replaces the party nominee', () => {
 assert.ok(run("validateCandidates('Lula',['Lula','Dilma Rousseff'])"));
 assert.equal(run("newGame('Lula','normal',6,['Lula','Dilma Rousseff']).all.length"),2);
 run("game=newGame('Lula','normal',6,ELECTION_PRESETS[2006],true,'2006');game.done=true;game.electionHistory=[{year:'2006',winner:'Lula',party:'PT'}];var nominationPlan=continuationPlan(game);nominationPlan.selected=[...nominationPlan.ids];nominationPlan.controlled='Lula'");
 assert.ok(run("!nominationPlan.ids.includes('Dilma Rousseff')"));
 assert.ok(run("continuationChoices(nominationPlan).includes('Dilma Rousseff')"));
 run("changeContinuationPlayer(nominationPlan,'Dilma Rousseff')");
 assert.ok(run("nominationPlan.selected.includes('Dilma Rousseff')&&!nominationPlan.selected.includes('Lula')"));
 assert.throws(()=>run("continuationGame(game,nominationPlan,'Dilma Rousseff',[...nominationPlan.selected,'Lula'])"));
 run("var nominationGame=continuationGame(game,nominationPlan,'Dilma Rousseff',nominationPlan.selected)");
 assert.equal(run('nominationGame.incumbent'),'Dilma Rousseff');
 assert.equal(run("nominationGame.cash['Dilma Rousseff']"),425000);
 run('var originalNominationGame=game;game=nominationGame');
 assert.equal(run("presidentBonus('Dilma Rousseff')"),75000);
 assert.equal(run("presidentBonus('Lula')"),0);
 assert.equal(run("income('Dilma Rousseff')"),375000);
 run('game=originalNominationGame');
 assert.equal(run('nominationGame.electionHistory[0].winner'),'Lula');
 run("changeContinuationPlayer(nominationPlan,'Lula')");
 assert.ok(run("nominationPlan.selected.includes('Lula')&&!nominationPlan.selected.includes('Dilma Rousseff')"));
});

test('continuation bonus label follows the chosen successor and returns to the president', () => {
 const elements={};
 const isolated=vm.createContext({document:{getElementById:id=>elements[id]??(elements[id]={})}});
 vm.runInContext(definitions,isolated);
 const evaluate=code=>vm.runInContext(code,isolated);
 evaluate("game=newGame('Lula','normal',6,ELECTION_PRESETS[2006],true,'2006');game.done=true;game.electionHistory=[{year:'2006',winner:'Lula',party:'PT'}];setupCampaign=continuationPlan(game);setupCampaign.selected=[...setupCampaign.ids];setupCampaign.controlled='Lula';renderContinuation()");
 assert.ok(elements.continuationRoster.innerHTML.includes('Presidente atual · +R$ 75 mil/rodada'));
 evaluate("changeContinuationPlayer(setupCampaign,'Dilma Rousseff');renderContinuation()");
 assert.ok(elements.continuationRoster.innerHTML.includes('Bônus da presidência · +R$ 75 mil/rodada'));
 assert.equal((elements.continuationRoster.innerHTML.match(/75 mil\/rodada/g)||[]).length,1);
 assert.equal(evaluate('continuationIncumbent(setupCampaign,setupCampaign.controlled,setupCampaign.selected)'),'Dilma Rousseff');
 evaluate("changeContinuationPlayer(setupCampaign,'Lula');renderContinuation()");
 assert.ok(elements.continuationRoster.innerHTML.includes('Presidente atual · +R$ 75 mil/rodada'));
 assert.ok(!elements.continuationRoster.innerHTML.includes('Bônus da presidência'));
 evaluate("setupCampaign.winner='José Serra';renderContinuation()");
 assert.ok(!elements.continuationRoster.innerHTML.includes('Bônus da presidência'));
});

test('AI strategies persist through saves and runoff, with legacy fallback', () => {
 run("game=newGame('Lula','normal',6,ELECTION_PRESETS[2026],true,'2026')");
 const assigned=plain('game.aiStrategies');
 assert.equal(Object.keys(assigned).length,11);
 const valid=plain('AI_TACTICS.map(t=>t.id)');
 assert.ok(Object.values(assigned).every(id=>valid.includes(id)));
 assert.equal(new Set(Object.values(assigned).slice(0,9)).size,9);
 run('game=JSON.parse(JSON.stringify(game));normalizePartyContext(game)');
 assert.deepEqual(plain('game.aiStrategies'),assigned);
 run("game.firstResult={ranked:[{id:'Lula'},{id:game.all[1]}]};makeSecondRound(true)");
 assert.deepEqual(plain('game.aiStrategies'),assigned);
 assert.equal(run('aiTactic(game.active[1]).id'),assigned[run('game.active[1]')]);
 run('delete game.aiStrategies');
 assert.equal(run('aiTactic(game.all[1]).id'),'popular');
});

test('AI personalities choose different sensible duels in the same position', () => {
 for(const [tactic,expected] of [['pressure','attack'],['challenge','debate']]){
  run(`game=newGame('Lula','normal',10,['Lula','Jair Bolsonaro'],false);game.phase=2;game.strategiesEnabled=true;game.aiStrategies['Jair Bolsonaro']='${tactic}';game.cash['Jair Bolsonaro']=350000;game.localInfluence.SP.Lula=3;game.localInfluence.SP['Jair Bolsonaro']=.3;for(const state of STATES)game.localUsed[state.uf]['Jair Bolsonaro']=2;Math.random=()=>.5;aiCampaignStrategy('Jair Bolsonaro')`);
  assert.equal(run('game.strategyEvents[0].type'),expected,tactic);
  assert.equal(run('game.strategyEvents[0].target'),'Lula');
  assert.equal(run('game.strategyEvents[0].uf'),'SP');
  assert.ok(run("game.cash['Jair Bolsonaro']>=0"));
 }
});

test('all profiles prefer useful investments over inferior attacks and maintain runoff effort', () => {
 const tactics=plain('AI_TACTICS.map(t=>t.id)');
 for(const difficulty of ['easy','normal','hard'])for(const tactic of tactics){
  const spent=[];
  for(const phase of [1,2]){
   run(`game=newGame('Lula','${difficulty}',10,['Lula','Jair Bolsonaro'],false);game.phase=${phase};game.round=2;game.strategiesEnabled=true;game.aiStrategies['Jair Bolsonaro']='${tactic}';game.cash['Jair Bolsonaro']=1000000;for(const s of STATES){game.localInfluence[s.uf].Lula=5;game.localInfluence[s.uf]['Jair Bolsonaro']=3}Math.random=()=>.9;aiCampaignStrategy('Jair Bolsonaro');var invested=aiPlay('Jair Bolsonaro')`);
   assert.equal(run('(game.strategyEvents||[]).length'),0);
   assert.ok(run('invested')>0);
   spent.push(run("1000000-game.cash['Jair Bolsonaro']"));
   assert.ok(run("game.cash['Jair Bolsonaro']>=0"));
  }
  assert.ok(spent[1]>=spent[0],`${difficulty}/${tactic}: ${spent}`);
 }
});

test('runoff leaders also increase investment effort, including beginners', () => {
 for(const difficulty of ['easy','normal','hard']){
  const spent=[];
  for(const phase of [1,2]){
   run(`game=newGame('Lula','${difficulty}',10,['Lula','Jair Bolsonaro'],false);game.phase=${phase};game.round=2;game.aiStrategies['Jair Bolsonaro']='defense';game.cash['Jair Bolsonaro']=1000000;for(const s of STATES){game.localTotal[s.uf]['Jair Bolsonaro']=game.localInfluence[s.uf]['Jair Bolsonaro']=3;game.localInfluence[s.uf].Lula=1}aiPlay('Jair Bolsonaro')`);
   spent.push(run("1000000-game.cash['Jair Bolsonaro']"));
   assert.ok(run("STATES.every(s=>game.localUsed[s.uf]['Jair Bolsonaro']<=2)"));
  }
  assert.ok(spent[1]>spent[0],`${difficulty}: ${spent}`);
 }
});

test('AI-only runoff finalists both adopt the aggressive policy after the human is eliminated', () => {
 run("game=newGame('Ciro Gomes','easy',10,['Ciro Gomes','Lula','Jair Bolsonaro'],false);game.firstResult={ranked:[{id:'Lula'},{id:'Jair Bolsonaro'},{id:'Ciro Gomes'}]};makeSecondRound(true)");
 assert.equal(run("game.active.includes(game.player)"),false);
 for(const candidate of ['Lula','Jair Bolsonaro']){
  run(`for(const s of STATES)for(const id of game.active)game.localInfluence[s.uf][id]=id===${JSON.stringify(candidate)}?3:5`);
  assert.equal(run(`aiCampaignPlan(${JSON.stringify(candidate)}).posture`),'comeback');
 }
});

test('aggressive AI avoids unfavorable defended duels and last-round defenses', () => {
 for(const tactic of plain('AI_TACTICS.map(t=>t.id)')){
  run(`game=newGame('Lula','hard',10,['Lula','Jair Bolsonaro'],false);game.phase=2;game.round=10;game.strategiesEnabled=true;game.aiStrategies['Jair Bolsonaro']='${tactic}';game.cash['Jair Bolsonaro']=1000000;game.localInfluence.SP.Lula=game.localInfluence.SP['Jair Bolsonaro']=3;game.strategyDefenses={[strategyKey('Lula','SP')]:11}`);
  assert.equal(run("aiCampaignStrategy('Jair Bolsonaro')"),0,tactic);
  assert.equal(run("game.cash['Jair Bolsonaro']"),1000000);
 }
});

test('AI protects valuable positions under credible threat and rejects unprofitable last-round promises', () => {
 for(const phase of [1,2]){
  run(`game=newGame('Lula','hard',10,['Lula','Jair Bolsonaro'],false);game.phase=${phase};game.aiStrategies['Jair Bolsonaro']='defense';game.strategiesEnabled=true;game.cash['Jair Bolsonaro']=1000000;for(const state of STATES){game.localInfluence[state.uf]['Jair Bolsonaro']=10;game.localTotal[state.uf]['Jair Bolsonaro']=10}`);
  assert.ok(run("aiCampaignStrategy('Jair Bolsonaro')")>0);
  assert.ok(run("campaignDefenseActive('Jair Bolsonaro','SP')"));
 }
 run("game=newGame('Lula','normal',10,['Lula','Jair Bolsonaro'],false);game.round=10;game.localTotal.SP['Jair Bolsonaro']=game.localInfluence.SP['Jair Bolsonaro']=1;game.cash['Jair Bolsonaro']=150000");
 assert.equal(run("aiImproveMultipliers('Jair Bolsonaro')"),0);
 assert.equal(run("game.cash['Jair Bolsonaro']"),150000);
 run("game.cash['Jair Bolsonaro']=337000");
 assert.equal(run("aiImproveMultipliers('Jair Bolsonaro')"),0);
 assert.equal(run("game.cash['Jair Bolsonaro']"),337000);
});

test('a profitable promise reserves follow-up investments and survives saving', () => {
 run("game=newGame('Lula','normal',10,['Lula','Jair Bolsonaro'],false);game.strategiesEnabled=true;game.cash['Jair Bolsonaro']=1000000;game.localTotal.SP['Jair Bolsonaro']=game.localInfluence.SP['Jair Bolsonaro']=1");
 assert.equal(run("aiImproveMultipliers('Jair Bolsonaro')"),1);
 assert.equal(run("game.aiPromisePlans['Jair Bolsonaro'].uf"),'SP');
 assert.ok(run("game.aiPromisePlans['Jair Bolsonaro'].remaining")>=4);
 const reserved=run("aiPromiseReserve('Jair Bolsonaro')");
 run("aiCampaignStrategy('Jair Bolsonaro')");
 assert.ok(run("game.cash['Jair Bolsonaro']")>=reserved);
 run("aiPlay('Jair Bolsonaro')");
 assert.equal(run("game.localUsed.SP['Jair Bolsonaro']"),2);
 assert.equal(run("game.localTotal.SP['Jair Bolsonaro']"),3);
 run("game=JSON.parse(JSON.stringify(game));normalizePartyContext(game);game.round++;game.localUsed=makeUses(game.active);game.cash['Jair Bolsonaro']+=income('Jair Bolsonaro')");
 assert.equal(run("aiImproveMultipliers('Jair Bolsonaro')"),0,'finish the existing plan before buying another');
 run("aiPlay('Jair Bolsonaro')");
 assert.equal(run("game.localUsed.SP['Jair Bolsonaro']"),2);
 assert.equal(run("game.localTotal.SP['Jair Bolsonaro']"),5);
 run('game.localInfluence.SP.Lula=10');
 assert.equal(run("aiPromiseCommitment('Jair Bolsonaro')"),null);
 assert.equal(run("aiPromiseReserve('Jair Bolsonaro')"),0);
});

const supportSavingsSetup="game=newGame('Lula','normal',10,['Lula','Jair Bolsonaro','Ciro Gomes'],true);for(const s of STATES){game.localTotal[s.uf]['Ciro Gomes']=game.localInfluence[s.uf]['Ciro Gomes']=8;game.localTotal[s.uf].Lula=game.localInfluence[s.uf].Lula=1;game.localTotal[s.uf]['Jair Bolsonaro']=game.localInfluence[s.uf]['Jair Bolsonaro']=1}game.firstResult={ranked:[{id:'Lula'},{id:'Jair Bolsonaro'}]};makeSecondRound(true);game.cash['Jair Bolsonaro']=400000;game.strategiesEnabled=true;";

test('AI accumulates savings across rounds, protects them and buys the planned support', () => {
 run(supportSavingsSetup);
 let bought=false,previousReserve=0;
 for(let round=1;round<=4;round++){
  bought=run("aiBuySupports('Jair Bolsonaro')")===1;
  if(bought)break;
  const reserved=run("aiSavingsReserve('Jair Bolsonaro')");
  assert.ok(reserved>previousReserve,'savings must accumulate rather than spend a fraction of past savings');
  previousReserve=reserved;
  run("aiImproveMultipliers('Jair Bolsonaro');aiCampaignStrategy('Jair Bolsonaro');aiPlay('Jair Bolsonaro')");
  assert.ok(run("game.cash['Jair Bolsonaro']")>=reserved);
  run("game=JSON.parse(JSON.stringify(game));normalizePartyContext(game);game.cash['Jair Bolsonaro']+=income('Jair Bolsonaro');game.round++;game.localUsed=makeUses(game.active);game.supportRoundPurchases={}");
 }
 assert.equal(bought,true);
 assert.equal(run("supportPurchaseCount('Jair Bolsonaro')"),1);
 assert.ok(run("supportPoints('Jair Bolsonaro','SP')")>0);
 assert.equal(run("game.aiSavingsPlans['Jair Bolsonaro']"),undefined);
 assert.ok(run("game.cash['Jair Bolsonaro']>=0"));
});

test('AI releases savings when the offer is lost, disabled or unreachable before the deadline', () => {
 for(const change of ["game.supportLocks['Ciro Gomes']='Lula'",'game.supportsEnabled=false','game.round=game.maxRounds']){
  run(supportSavingsSetup);
  assert.ok(run("aiSavingsReserve('Jair Bolsonaro')")>0);
  run(change);
  assert.equal(run("aiSavingsReserve('Jair Bolsonaro')"),0,change);
  assert.equal(run("game.aiSavingsPlans['Jair Bolsonaro']"),undefined);
 }
 run(supportSavingsSetup);
 run("game.firstRoundLevels=makeUses(game.all);game.firstRoundLevels.RR['Ciro Gomes']=1;game.cash['Jair Bolsonaro']=1000000");
 assert.equal(run("aiSupportChoice('Jair Bolsonaro')"),null,'an affordable but poor-value support must not be bought');
 assert.equal(run("aiBuySupports('Jair Bolsonaro')"),0);
 assert.equal(run("game.cash['Jair Bolsonaro']"),1000000);
});

test('presidential AI saves for a useful interference without spending the protected cash', () => {
 run("game=newGame('Lula','normal',10,['Lula','Jair Bolsonaro'],false);game.strategiesEnabled=true;game.incumbent='Jair Bolsonaro';game.round=8;game.cash['Jair Bolsonaro']=400000;for(const state of STATES){game.localInfluence[state.uf].Lula=5;game.localInfluence[state.uf]['Jair Bolsonaro']=3}");
 run("aiBuySupports('Jair Bolsonaro');var protectedCash=aiSavingsReserve('Jair Bolsonaro');aiImproveMultipliers('Jair Bolsonaro');aiCampaignStrategy('Jair Bolsonaro');aiPlay('Jair Bolsonaro')");
 assert.ok(run('protectedCash')>0);
 assert.ok(run("game.cash['Jair Bolsonaro']>=protectedCash"));
 run("game.cash['Jair Bolsonaro']+=income('Jair Bolsonaro');game.round++;game.localUsed=makeUses(game.active);aiBuySupports('Jair Bolsonaro');aiImproveMultipliers('Jair Bolsonaro');aiCampaignStrategy('Jair Bolsonaro')");
 assert.equal(run('game.maxRounds'),14);
 assert.equal(run("game.strategyEvents.filter(e=>e.type==='interference').length"),1);
 assert.equal(run("game.aiSavingsPlans['Jair Bolsonaro']"),undefined);
});

test('runoff preserves upgrades but drops first-round spending commitments', () => {
 run("game=newGame('Lula','normal',10,['Lula','Jair Bolsonaro','Ciro Gomes'],true);game.aiPromisePlans={'Jair Bolsonaro':{phase:1,uf:'SP',remaining:4}};game.aiSavingsPlans={'Jair Bolsonaro':{phase:1,round:1,type:'interference',source:'delay',cost:500000,reserve:300000}};game.multiplierLevels.SP['Jair Bolsonaro']=1;game.firstResult={ranked:[{id:'Lula'},{id:'Jair Bolsonaro'}]};makeSecondRound(true)");
 assert.deepEqual(plain('game.aiPromisePlans'),{});
 assert.deepEqual(plain('game.aiSavingsPlans'),{});
 assert.equal(run("multiplierLevel('Jair Bolsonaro','SP')"),1);
});

test('missing snapshots use the saved year; local logo references exist', () => {
  run("game=newGame('Marina Silva','normal',10,ELECTION_PRESETS[2010],true,'2010'); delete game.candidateParties; normalizePartyContext(game)");
  assert.equal(run("who('Marina Silva').party"),'PV');
  for(const party of plain('[...KNOWN_PARTY_LOGOS]')) {
    const svg=fs.readFileSync(path.join(__dirname,'..','assets','party-'+party.toLowerCase()+'.svg'),'utf8');
    assert.ok(svg.includes('<svg'));
    assert.ok(!/Warning: truncated output|Total output lines:/.test(svg),'Asset must not contain truncated tool output: '+party);
    assert.ok(!/<script|onload\s*=/i.test(svg));
  }
  assert.ok(run("partyIcon('Marina Silva').includes('party-pv.svg')"));
  assert.ok(run("partyIcon('Marina Silva',personForElection('Marina Silva')).includes('party-rede.svg')"));
});
