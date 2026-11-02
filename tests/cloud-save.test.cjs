const test=require('node:test'),assert=require('node:assert/strict');
const {createManager,GAME_KEY,STATS_KEY,validateData}=require('../cloud-save.js');
const copy=x=>JSON.parse(JSON.stringify(x));
const game=round=>JSON.stringify({game:{version:15,round,active:['A','B'],all:['A','B'],localTotal:{}}});
const stats=winner=>JSON.stringify({version:1,records:[{id:'election',winner}]});
function backing(){const map=new Map();return {map,getItem:key=>map.get(key)||null,setItem:(key,value)=>map.set(key,value)}}
function server(){
 const records=new Map();let offline=false;
 return {records,setOffline:value=>{offline=value},
  async read(uid){if(offline)throw Error('offline');return copy(records.get(uid)||null)},
  async write(uid,revision,data){if(offline)throw Error('offline');const row=records.get(uid);if((row?.revision||0)!==revision)return {ok:false,remote:copy(row)};records.set(uid,{version:1,revision:revision+1,data:copy(data)});return {ok:true,revision:revision+1}}
 };
}
function manager(store,remote,options={}){
 const m=createManager({backing:store,delay:10,...options});
 return {m,async login(uid){m.setSession(uid,remote);await m.sync()},async stop(){m.setSession(null,null)}};
}
test('guest saves are preserved and never silently uploaded to a new account',async()=>{
 const local=backing(),remote=server(),{m,login,stop}=manager(local,remote);
 m.storage.setItem(GAME_KEY,game(4));m.storage.setItem(STATS_KEY,stats('A'));
 await login('user-a');assert.equal(m.storage.getItem(GAME_KEY),null);assert.equal(remote.records.size,0);
 assert.equal(m.canImport(),true);assert.equal(m.importGuest(),true);await m.sync();
 assert.equal(remote.records.get('user-a').data.game,game(4));
 assert.equal(m.importGuest(),false);
 await stop();assert.equal(m.storage.getItem(GAME_KEY),game(4));
 assert.equal(m.storage.getItem(STATS_KEY),stats('A'));
});
test('accounts and devices restore only their own game and statistics',async()=>{
 const local=backing(),remote=server(),a=manager(local,remote);
 await a.login('alice');a.m.storage.setItem(GAME_KEY,game(3));a.m.storage.setItem(STATS_KEY,stats('A'));await a.m.sync();
 await a.login('bob');assert.equal(a.m.storage.getItem(GAME_KEY),null);
 a.m.storage.setItem(GAME_KEY,game(8));await a.m.sync();
 await a.login('alice');assert.equal(a.m.storage.getItem(GAME_KEY),game(3));
 const b=manager(backing(),remote);await b.login('alice');assert.equal(b.m.storage.getItem(GAME_KEY),game(3));assert.equal(b.m.storage.getItem(STATS_KEY),stats('A'));
 await a.stop();await b.stop();
});
test('offline progress survives recreation and uploads after reconnection',async()=>{
 const store=backing(),remote=server(),a=manager(store,remote);await a.login('alice');
 remote.setOffline(true);a.m.storage.setItem(GAME_KEY,game(6));assert.equal(await a.m.sync(),false);assert.equal(a.m.getStatus().phase,'error');
 await a.stop();const b=manager(store,remote);await b.login('alice');assert.equal(b.m.storage.getItem(GAME_KEY),game(6));
 remote.setOffline(false);await b.m.sync();assert.equal(remote.records.get('alice').data.game,game(6));await b.stop();
});
test('conflicting devices require a choice and retain a backup before replacement',async()=>{
 const remote=server(),storeA=backing(),a=manager(storeA,remote),b=manager(backing(),remote);
 await a.login('alice');a.m.storage.setItem(GAME_KEY,game(1));await a.m.sync();await b.login('alice');
 a.m.storage.setItem(GAME_KEY,game(2));b.m.storage.setItem(GAME_KEY,game(3));await a.m.sync();await b.m.sync();
 assert.equal(b.m.getStatus().phase,'conflict');assert.equal(b.m.storage.getItem(GAME_KEY),game(3));assert.equal(remote.records.get('alice').data.game,game(2));
 await b.m.resolveConflict('cloud');assert.equal(b.m.storage.getItem(GAME_KEY),game(2));
 a.m.storage.setItem(GAME_KEY,game(4));b.m.storage.setItem(GAME_KEY,game(5));await b.m.sync();await a.m.sync();
 assert.equal(a.m.getStatus().phase,'conflict');await a.m.resolveConflict('local');
 assert.equal(remote.records.get('alice').data.game,game(4));assert.ok([...storeA.map.keys()].some(k=>k.endsWith(':conflict-backup')));
 await a.stop();await b.stop();
});
test('account changes during a delayed download never apply another users data',async()=>{
 const remote=server();remote.records.set('alice',{revision:1,data:{game:game(9),statistics:null}});
 let release;const original=remote.read;remote.read=uid=>uid==='alice'?new Promise(resolve=>{release=()=>original(uid).then(resolve)}):original(uid);
 const {m,login,stop}=manager(backing(),remote);m.setSession('alice',remote);const pending=m.sync();
 await login('bob');release();await pending;assert.equal(m.storage.getItem(GAME_KEY),null);assert.equal(m.getStatus().uid,'bob');await stop();
});
test('edits made while an upload is in flight remain dirty until uploaded',async()=>{
 const remote=server(),{m,login,stop}=manager(backing(),remote);await login('alice');
 let release;const original=remote.write;remote.write=(...args)=>new Promise(resolve=>{release=()=>original(...args).then(resolve)});
 m.storage.setItem(GAME_KEY,game(2));const upload=m.sync();await new Promise(resolve=>setImmediate(resolve));
 m.storage.setItem(GAME_KEY,game(3));release();await upload;
 assert.equal(remote.records.get('alice').data.game,game(2));assert.equal(m.getStatus().phase,'pending');
 remote.write=original;await m.sync();assert.equal(remote.records.get('alice').data.game,game(3));await stop();
});
test('invalid remote data cannot overwrite a valid local save',async()=>{
 const remote=server(),{m,login,stop}=manager(backing(),remote);await login('alice');m.storage.setItem(GAME_KEY,game(2));await m.sync();
 remote.records.set('alice',{revision:2,data:{game:'broken JSON',statistics:null}});await m.sync();
 assert.equal(m.storage.getItem(GAME_KEY),game(2));assert.equal(m.getStatus().phase,'error');assert.equal(validateData({game:'broken',statistics:null}),false);await stop();
});
test('cloud compare-and-swap detects a remote change between download and upload',async()=>{
 const remote=server(),{m,login,stop}=manager(backing(),remote);await login('alice');
 const write=remote.write;remote.write=(uid,revision,data)=>{remote.records.set(uid,{revision:1,data:{game:game(10),statistics:null}});return write(uid,revision,data)};
 m.storage.setItem(GAME_KEY,game(2));await m.sync();assert.equal(m.getStatus().phase,'conflict');assert.equal(m.storage.getItem(GAME_KEY),game(2));await stop();
});
