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

test('full script parses; each person has one canonical ID and one group', () => {
  new vm.Script(script);
  const people = plain('PEOPLE');
  assert.equal(new Set(people.map(p => p.id)).size, people.length);
  assert.equal(people.length, 53);
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
