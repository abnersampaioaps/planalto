const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
// Load the production definitions without browser initialization.
const definitions = script.slice(0, script.indexOf("\naddCandidateChoices('officialCandidates'"));
const context = vm.createContext({});
vm.runInContext(definitions, context);
const run = expression => vm.runInContext(expression, context);
const plain = expression => JSON.parse(JSON.stringify(run(expression)));

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

test('campaign attacks, defense, recovery, cooldowns and limits use the same rules', () => {
 run("game=newGame('Lula','normal',10,['Lula','Jair Bolsonaro'],false);game.strategiesEnabled=true;game.cash.Lula=10000000;game.cash['Jair Bolsonaro']=10000000;game.localTotal.SP['Jair Bolsonaro']=10");
 assert.equal(run("buyCampaignStrategy('Lula','attack','SP','Jair Bolsonaro')"),true);
 assert.equal(run("totalInfluence('Jair Bolsonaro','SP')"),8);
 assert.equal(run("stateLockedBy('SP')"),null);
 assert.equal(run("game.cash.Lula"),9400000);
 assert.equal(run("buyCampaignStrategy('Lula','attack','RJ','Jair Bolsonaro')"),false);
 assert.equal(run("buyCampaignStrategy('Jair Bolsonaro','mobilize','SP')"),true);
 assert.equal(run("totalInfluence('Jair Bolsonaro','SP')"),9);
 run('game.round=2;game.localUsed=makeUses(game.active)');
 assert.ok(run("strategyReason('Lula','attack','SP','Jair Bolsonaro')").includes('anterior'));
 assert.equal(run("applyLocal('Jair Bolsonaro','SP')"),true);
 assert.equal(run("totalInfluence('Jair Bolsonaro','SP')"),10);
 run('game.round=3');
 assert.equal(run("buyCampaignStrategy('Jair Bolsonaro','defend','SP')"),true);
 assert.equal(run("buyCampaignStrategy('Lula','attack','SP','Jair Bolsonaro')"),true);
 assert.equal(run("totalInfluence('Jair Bolsonaro','SP')"),10);
 run('game.round=5');
 assert.equal(run("buyCampaignStrategy('Lula','attack','SP','Jair Bolsonaro')"),true);
 run('game.round=7');
 assert.ok(run("strategyReason('Lula','attack','SP','Jair Bolsonaro')").includes('três'));
});

test('last chance pays exactly once, respects maximum rounds and defaults off', () => {
 run("game=newGame('Lula','normal',6,['Lula','Jair Bolsonaro'],false);for(const s of STATES)game.localTotal[s.uf]['Jair Bolsonaro']=10");
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

test('debate outcomes and saved campaign strategy state preserve influence bounds', () => {
 run("game=newGame('Lula','normal',6,['Lula','Jair Bolsonaro'],false);game.strategiesEnabled=true;game.cash.Lula=10000000;game.localTotal.SP['Jair Bolsonaro']=1;var oldRandom=Math.random;Math.random=()=>0");
 assert.equal(run("buyCampaignStrategy('Lula','debate','SP','Jair Bolsonaro')"),true);
 assert.equal(run("totalInfluence('Lula','SP')"),1);
 run('game=JSON.parse(JSON.stringify(game));normalizePartyContext(game)');
 assert.equal(run('game.strategyUses.Lula'),1);
 run("game.round=3;Math.random=()=>.99;var beforeDebate=totalInfluence('Lula','SP');game.localTotal.RJ['Jair Bolsonaro']=2");
 assert.equal(run("buyCampaignStrategy('Lula','debate','RJ','Jair Bolsonaro')"),true);
 assert.equal(run("totalInfluence('Lula','RJ')"),0);
 run('Math.random=oldRandom');
});

test('strategy summaries are conditional, scoped to a round and preserve actual effects', () => {
 run("game=newGame('Lula','normal',6,['Lula','Jair Bolsonaro'],false);game.strategiesEnabled=true;game.cash.Lula=10000000;game.cash['Jair Bolsonaro']=10000000");
 assert.equal(run('queueStrategySummary(1,1)'),false);
 run("game.localTotal.SP['Jair Bolsonaro']=.5;var oldSummaryRandom=Math.random;Math.random=()=>0;buyCampaignStrategy('Lula','debate','SP','Jair Bolsonaro');Math.random=oldSummaryRandom;buyCampaignStrategy('Jair Bolsonaro','defend','RJ')");
 const events=plain('strategyRoundEvents(1,1)');
 assert.equal(events.length,2);
 assert.equal(events[0].effects[0].id,'Lula');
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
 assert.equal(run('game.cash.Lula'),150000);
 assert.equal(run("income('Lula')"),150000);
 run('game.localTotal.SP.Lula=1');
 assert.equal(run("income('Lula')"),200000);
 run("game.firstResult={ranked:[{id:'Lula'},{id:'José Serra'}]};var thirdCash=game.cash.Lula;makeSecondRound(true)");
 assert.equal(run('game.cash.Lula-thirdCash'),200000);
 run("game=continuationGame(thirdPrevious,thirdPlan,'Dilma Rousseff',uniquePartyRoster(thirdPlan,'Dilma Rousseff',['Dilma Rousseff',...thirdPlan.ids]))");
 assert.equal(run("income('Dilma Rousseff')"),350000);
 assert.equal(run("thirdConsecutiveAttempt('Lula','2014',[{year:'2002',winner:'Lula'},{year:'2006',winner:'Lula'},{year:'2010',winner:'José Serra'}])"),false);
 run("game=JSON.parse(JSON.stringify(game));normalizePartyContext(game)");
 assert.equal(run("income('Dilma Rousseff')"),350000);
});

test('presidential interference charges by direction, changes only this turn and is exclusive', () => {
 run("game=newGame('Lula','normal',10,['Lula','Jair Bolsonaro'],false);game.strategiesEnabled=true;game.incumbent='Lula';game.cash.Lula=5000000;game.cash['Jair Bolsonaro']=5000000");
 assert.equal(run("buyCampaignStrategy('Jair Bolsonaro','interference','SP','delay')"),false);
 assert.equal(run("buyCampaignStrategy('Lula','interference','SP','bad')"),false);
 assert.equal(run("buyCampaignStrategy('Lula','interference','SP','advance')"),true);
 assert.equal(run('game.maxRounds'),6);
 assert.equal(run('game.cash.Lula'),4000000);
 assert.equal(run("buyCampaignStrategy('Lula','interference','SP','delay')"),false);
 run('game.round=5');
 assert.equal(run("buyCampaignStrategy('Lula','interference','SP','advance')"),true);
 assert.equal(run('game.maxRounds'),5);
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

test('presidential AI can choose interference under the same rules', () => {
 run("game=newGame('Lula','normal',10,['Lula','Jair Bolsonaro'],false);game.strategiesEnabled=true;game.incumbent='Jair Bolsonaro';game.cash['Jair Bolsonaro']=2000000;aiCampaignStrategy('Jair Bolsonaro')");
 assert.equal(run('game.maxRounds'),14);
 assert.equal(run("game.cash['Jair Bolsonaro']"),1500000);
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

test('full script parses; each person has one canonical ID and one group', () => {
  new vm.Script(script);
  const people = plain('PEOPLE');
  assert.equal(new Set(people.map(p => p.id)).size, people.length);
  assert.equal(people.length, 72);
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
    run('for(const state of STATES) game.active.forEach((id,i)=>game.localTotal[state.uf][id]=i%4)');
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
  run("game=newGame('Ciro Gomes','normal',6,ELECTION_PRESETS[2002],true,'2002');for(const state of STATES){game.localTotal[state.uf]['Lula']=2;game.localTotal[state.uf]['José Serra']=2;game.localTotal[state.uf]['Anthony Garotinho']=1}game.firstResult=nationalResult();game.done=true");
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
 assert.equal(run("game.cash['José Serra']"),350000);
 assert.equal(run("income('José Serra')"),350000);
 assert.equal(run("income('Ciro Gomes')"),250000);
 run("game.round++;for(const id of game.active)game.cash[id]+=income(id)");
 assert.equal(run("game.cash['José Serra']-game.cash['Ciro Gomes']"),200000);
 run("game=JSON.parse(JSON.stringify(game));normalizePartyContext(game)");
 assert.equal(run("presidentBonus('José Serra')"),100000);
 run("game.firstResult={ranked:[{id:'José Serra'},{id:'Lula'}]};var cashBeforeRunoff=game.cash['José Serra'];makeSecondRound(true)");
 assert.equal(run("game.cash['José Serra']-cashBeforeRunoff"),350000);
 assert.equal(run("income('José Serra')"),350000);
 run("game.done=true;game.electionHistory.push({year:'2010',winner:'Lula',party:'PT'});var nextPlan=continuationPlan(game);game=continuationGame(game,nextPlan,'Lula',['Lula','José Serra','Ciro Gomes'])");
 assert.equal(run("presidentBonus('José Serra')"),0);
 assert.equal(run("presidentBonus('Lula')"),100000);
});

test('incumbents use the next official party, including the human winner, without rewriting history', () => {
 for(const player of ['Fernando Haddad','Jair Bolsonaro']) {
  run(`game=newGame(${JSON.stringify(player)},'normal',6,ELECTION_PRESETS[2018],true,'2018');game.done=true;game.electionHistory=[{year:'2018',winner:'Jair Bolsonaro',party:'PSL'}];var partyPlan=continuationPlan(game)`);
  assert.equal(run("continuationPerson(partyPlan,'Jair Bolsonaro').party"),'PL');
  assert.equal(run('partyPlan.party'),player==='Jair Bolsonaro'?'PL':'PT');
  run(`game=continuationGame(game,partyPlan,${JSON.stringify(player)},partyPlan.ids)`);
  assert.equal(run("who('Jair Bolsonaro').party"),'PL');
  assert.equal(run("presidentBonus('Jair Bolsonaro')"),100000);
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
  assert.equal(new Set([...groups.primary,...groups.other]).size,54);
  assert.equal(groups.primary.length+groups.other.length,54);
 }
 const custom=plain('initialCandidateGroups(null)');
 assert.deepEqual(custom.primary,plain('PEOPLE_2026.map(p=>p.id)'));
 assert.deepEqual(custom.other,plain('PEOPLE_ALTERNATE.map(p=>p.id)'));
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
 assert.equal(run("nominationGame.cash['Dilma Rousseff']"),350000);
 run('var originalNominationGame=game;game=nominationGame');
 assert.equal(run("presidentBonus('Dilma Rousseff')"),100000);
 assert.equal(run("presidentBonus('Lula')"),0);
 assert.equal(run("income('Dilma Rousseff')"),350000);
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
 assert.ok(elements.continuationRoster.innerHTML.includes('Atual presidente · +R$ 100 mil/rodada'));
 evaluate("changeContinuationPlayer(setupCampaign,'Dilma Rousseff');renderContinuation()");
 assert.ok(elements.continuationRoster.innerHTML.includes('Bônus da presidência · +R$ 100 mil/rodada'));
 assert.equal((elements.continuationRoster.innerHTML.match(/100 mil\/rodada/g)||[]).length,1);
 assert.equal(evaluate('continuationIncumbent(setupCampaign,setupCampaign.controlled,setupCampaign.selected)'),'Dilma Rousseff');
 evaluate("changeContinuationPlayer(setupCampaign,'Lula');renderContinuation()");
 assert.ok(elements.continuationRoster.innerHTML.includes('Atual presidente · +R$ 100 mil/rodada'));
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
