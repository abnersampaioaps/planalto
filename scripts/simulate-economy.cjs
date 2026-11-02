// Headless balance study: execute production rules, replacing only browser UI.
// Run: node scripts/simulate-economy.cjs > results.json
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const definitions = script.slice(0, script.indexOf("\naddCandidateChoices('officialCandidates'"));
const sourceHash = crypto.createHash('sha256').update(html).digest('hex');
const setup = `
render=persist=toast=showOutcome=openStrategies=renderStrategySummary=()=>{};
queueDefensiveDuels=queueStrategySummary=()=>false;
var randomSeed=config.seed>>>0;
Math.random=()=>{randomSeed=(Math.imul(randomSeed,1664525)+1013904223)>>>0;return randomSeed/4294967296};
var pool=[...DEFAULT_CANDIDATES,...ELECTION_PRESETS[2026].filter(id=>!DEFAULT_CANDIDATES.includes(id))];
var roster=pool.slice(0,config.candidates);
if(roster.length!==config.candidates||new Set(roster).size!==config.candidates)throw new Error('Invalid simulation roster');
if(config.reverse)roster.reverse();
if(config.rotation){const offset=config.rotation%roster.length;roster=roster.slice(offset).concat(roster.slice(0,offset))}
game=newGame(roster[0],config.difficulty,config.rounds,roster,config.supports!==false);
game.player='__observer__'; // All candidates use AI; priority supports therefore have no human pause.
game.aiStrategies=drawAIStrategies([...game.active].sort());
if(config.tactic)for(const id of game.active)game.aiStrategies[id]=config.tactic;
game.strategiesEnabled=config.strategies!==false;
if(config.incumbent){game.incumbent=roster[config.incumbent-1];game.cash[game.incumbent]+=PRESIDENT_BONUS}
var promises=[],metrics={},snapshots=[],violations=[],ticks=0,phaseStarts={},lastPhase=0;
var row=(id,phase=game.phase)=>metrics[phase+':'+id]??(metrics[phase+':'+id]={id,phase,tactic:aiTactic(id).id,turns:0,local:0,promise:0,attack:0,debate:0,defend:0,interference:0,support:0,spent:0,localSpent:0,promiseSpent:0,strategySpent:0,supportSpent:0,defensesUsed:0,ties:0,zeroPresenceDuels:0,unusedPromises:0});
for(const [name,kind] of [['applyLocal','local'],['buyMultiplier','promise'],['buyCampaignStrategy','strategy'],['buySupport','support']]){
 const original=eval(name);
 globalThis[name]=function(...args){
  const id=args[0],before=game.cash[id],phase=game.phase;
  const ownBefore=kind==='strategy'&&args[1]!=='interference'?totalInfluence(id,args[2]):0;
  if(kind==='promise'&&config.noPromises)return null;
  const result=original(...args);
  if(result){
   const r=row(id,phase),cost=before-game.cash[id];r.spent+=cost;
   if(kind==='strategy'){
    r[args[1]]++;r.strategySpent+=cost;
    if(['attack','debate'].includes(args[1])&&ownBefore===0)r.zeroPresenceDuels++;
    const event=game.strategyEvents.at(-1);
    if(event.duel?.defenseUsed)row(event.target,phase).defensesUsed++;
    if(event.duel?.tied)r.ties++;
   }else{r[kind]++;r[kind+'Spent']+=cost}
   if(kind==='promise')promises.push({id,phase,uf:args[2],used:false});
   if(kind==='local')for(const promise of promises)if(promise.id===id&&promise.uf===args[1])promise.used=true;
  }
  return result;
 };
}
var originalAIPlay=aiPlay;
aiPlay=id=>{row(id).turns++;return originalAIPlay(id)};
var snapshot=()=>({phase:game.phase,round:game.round,maxRounds:game.maxRounds,ranking:nationalResult().ranked,cash:{...game.cash},locked:STATES.filter(s=>stateLockedBy(s.uf)).length,income:Object.fromEntries(game.active.map(id=>[id,income(id)]))});
while(ticks++<150){
 if(game.phase!==lastPhase){lastPhase=game.phase;phaseStarts[game.phase]=snapshot()}
 nextTurn();
 for(const id of game.active){
  if(!Number.isFinite(game.cash[id])||game.cash[id]<0)violations.push('invalid cash '+id);
  for(const s of STATES){const influence=totalInfluence(id,s.uf);if(!Number.isFinite(influence)||influence<0||influence>10.000001)violations.push('invalid influence '+id+' '+s.uf)}
 }
 if(game.done||game.pendingSecond){
  snapshots.push(snapshot());
  if(game.phase===1&&!majority(game.firstResult)){makeSecondRound(true);continue}
  break;
 }
}
if(ticks>=150)violations.push('simulation did not finish');
for(const promise of promises)if(!promise.used)row(promise.id,promise.phase).unusedPromises++;
var finalResult=nationalResult();
var output={config,sourceHash,roster,tactics:game.aiStrategies,incumbent:game.incumbent||null,ticks,runoff:game.phase===2,winner:finalResult.ranked[0].id,winnerTactic:aiTactic(finalResult.ranked[0].id).id,margin:finalResult.ranked[0].pct-finalResult.ranked[1].pct,validShare:finalResult.totalValid/totalValid,phaseStarts,snapshots,metrics:Object.values(metrics),violations};
`;
function simulate(config) {
 const context=vm.createContext({config,sourceHash,document:{getElementById:()=>({classList:{add(){},remove(){}}})}});
 vm.runInContext(definitions,context);
 vm.runInContext(setup,context,{timeout:60000});
 return JSON.parse(vm.runInContext('JSON.stringify(output)',context));
}
function matrix(seeds=4){
 const rows=[];
 for(const difficulty of ['easy','normal','hard'])for(const rounds of [6,10,14])for(const candidates of [2,6,10])for(let seed=1;seed<=seeds;seed++)rows.push({seed:1000+seed,difficulty,rounds,candidates,rotation:seed%candidates});
 return rows;
}
function studyMatrix(){
 const configs=matrix(2).map(c=>({...c,group:'baseline'}));
 for(const c of configs.filter(c=>c.difficulty==='normal'))configs.push(
  {...c,group:'no-promises',noPromises:true},
  {...c,group:'no-strategies',strategies:false},
  {...c,group:'investments-only',noPromises:true,strategies:false});
 for(let seed=1;seed<=8;seed++)configs.push(
  {seed:2000+seed,difficulty:'normal',rounds:10,candidates:6,group:'order',rotation:seed%6},
  {seed:2000+seed,difficulty:'normal',rounds:10,candidates:6,group:'reverse-order',rotation:seed%6,reverse:true});
 for(let seed=1;seed<=8;seed++)configs.push({seed:3000+seed,difficulty:'normal',rounds:10,candidates:6,rotation:seed%6,incumbent:1,group:'presidency'});
 return configs;
}
module.exports={simulate,matrix,studyMatrix,sourceHash};
if(require.main===module)process.stdout.write(JSON.stringify({sourceHash,results:studyMatrix().map(simulate)},null,2)+'\n');
