(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else{
  root.PlanaltoCloud=api;
  let backing;try{backing=root.localStorage}catch(error){backing={getItem(){return null},setItem(){throw error}}}
  root.PlanaltoSave=api.createManager({backing,
   onBeforeSwitch:()=>root.dispatchEvent(new Event('planalto:profile-will-change')),
   onSwitch:()=>root.dispatchEvent(new Event('planalto:profile-changed')),
   onStatus:()=>root.dispatchEvent(new Event('planalto:sync-status'))});
  root.addEventListener('online',()=>root.PlanaltoSave.sync());
  root.document.addEventListener('visibilitychange',()=>{if(!root.document.hidden)root.PlanaltoSave.sync()});
 }
})(globalThis,function(){
 'use strict';
 const GAME_KEY='rumo_ao_planalto_v8',STATS_KEY='rumo_ao_planalto_statistics_v1';
 const keys={[GAME_KEY]:'game',[STATS_KEY]:'statistics'};
 const MAX_BYTES=850000;
 const empty=()=>({version:1,revision:0,dirty:false,change:0,data:{game:null,statistics:null}});
 const clone=value=>JSON.parse(JSON.stringify(value));
 function validateData(data){
  if(!data||typeof data!=='object'||Object.keys(data).some(key=>!['game','statistics'].includes(key)))return false;
  try{
   if(data.game!==null){const g=JSON.parse(data.game);if(!g?.game||!Array.isArray(g.game.active)||!Array.isArray(g.game.all)||!g.game.localTotal)return false}
   if(data.statistics!==null){const s=JSON.parse(data.statistics);if(!Array.isArray(s?.records))return false}
   return ['game','statistics'].every(key=>data[key]===null||typeof data[key]==='string');
  }catch(e){return false}
 }
 function createManager({backing,onBeforeSwitch=()=>{},onSwitch=()=>{},onStatus=()=>{},delay=900}){
  let uid=null,cloud=null,timer=null,epoch=0,status={phase:'guest',message:'Modo visitante · salvo neste dispositivo.'};
  const memory=new Map(),running=new Map();let conflict=null;
  const key=id=>'planalto:profile:'+encodeURIComponent(id);
  function read(id){
   if(memory.has(id))return memory.get(id);
   let value=empty();
   const raw=backing.getItem(key(id));
   if(raw){const stored=JSON.parse(raw);if(!validateData(stored.data)||!Number.isInteger(stored.revision)||stored.revision<0)throw Error('invalid-local');value=stored}
   memory.set(id,value);return value;
  }
  function write(id,value){backing.setItem(key(id),JSON.stringify(value));memory.set(id,value)}
  function notify(phase,message){status={phase,message};onStatus({...status,uid})}
  function schedule(){clearTimeout(timer);if(uid&&cloud&&!conflict)timer=setTimeout(()=>sync(),delay)}
  const storage={
   getItem(name){if(!uid||!keys[name])return backing.getItem(name);return read(uid).data[keys[name]]},
   setItem(name,value){
    if(!uid||!keys[name]){backing.setItem(name,value);return}
    const current=read(uid),field=keys[name];if(current.data[field]===value)return;
    const next=clone(current);next.data[field]=value;next.dirty=true;next.change++;
    try{write(uid,next)}catch(error){notify('error','Não foi possível salvar neste dispositivo. Libere espaço antes de continuar.');throw error}
    if(!conflict)notify('pending','Progresso salvo neste dispositivo · aguardando sincronização.');schedule();
   }
  };
  function setSession(nextUid,nextCloud){
   if(nextUid===uid){cloud=nextCloud;if(uid)sync();return}
   onBeforeSwitch();clearTimeout(timer);epoch++;conflict=null;
   uid=nextUid||null;cloud=nextCloud||null;
   notify(uid?'loading':'guest',uid?'Carregando seu progresso…':'Modo visitante · salvo neste dispositivo.');
   onSwitch();if(uid)sync();
  }
  async function sync(){
   if(!uid||!cloud||conflict)return false;
   const id=uid,remoteStore=cloud,session=epoch;
   const operation=id+':'+session;
   if(running.has(operation))return running.get(operation);
   const active=()=>uid===id&&epoch===session;
   const task=(async()=>{
    try{
     const remote=await remoteStore.read(id);
     if(!active())return false;
     if(remote&&(!validateData(remote.data)||!Number.isInteger(remote.revision)||remote.revision<1))throw Error('invalid-remote');
     let local=read(id);const revision=remote?.revision||0;
     if(local.dirty&&local.revision!==revision){
      conflict={remote};notify('conflict','Há progressos diferentes neste dispositivo e na nuvem. Escolha qual continuar.');return false;
     }
     if(!local.dirty){
      if(remote&&(local.revision!==revision||JSON.stringify(local.data)!==JSON.stringify(remote.data))){
       write(id,{...empty(),revision,data:clone(remote.data)});onSwitch();
      }else if(!remote&&local.revision>0){
       conflict={remote:null};notify('conflict','O salvamento remoto foi removido. Escolha se deseja reenviar a cópia deste dispositivo.');return false;
      }
      notify('synced',remote?'Progresso sincronizado com sua conta.':'Conta pronta · comece uma partida ou importe seu progresso de visitante.');return true;
     }
     const sent=clone(local);
     if(new TextEncoder().encode(JSON.stringify(sent.data)).length>MAX_BYTES)throw Error('too-large');
     const result=await remoteStore.write(id,local.revision,sent.data);
     if(!active())return false;
     if(!result.ok){conflict={remote:result.remote};notify('conflict','Outro dispositivo atualizou sua partida. Escolha qual progresso continuar.');return false}
     local=read(id);write(id,{...local,revision:result.revision,dirty:local.change!==sent.change});
     notify(local.change!==sent.change?'pending':'synced',local.change!==sent.change?'Salvando as alterações mais recentes…':'Progresso sincronizado com sua conta.');
     if(local.change!==sent.change)schedule();return true;
    }catch(error){
     if(active())notify('error',error.message==='too-large'?'Seu histórico excede o limite de sincronização. A cópia neste dispositivo foi preservada.':error.message==='invalid-remote'||error.message==='invalid-local'?'O salvamento não pôde ser validado. Nenhum progresso foi substituído.':'Sem sincronização no momento. Seu progresso permanece neste dispositivo; tente novamente quando houver conexão.');
     return false;
    }
   })();
   running.set(operation,task);try{return await task}finally{running.delete(operation)}
  }
  async function resolveConflict(choice){
   if(!uid||!conflict||!['local','cloud'].includes(choice))return false;
   const local=read(uid),remote=conflict.remote;
   if(remote&&(!validateData(remote.data)||!Number.isInteger(remote.revision)))return false;
   // Keep the discarded side recoverable locally before any explicit replacement.
   backing.setItem(key(uid)+':conflict-backup',JSON.stringify({local,remote}));
   if(choice==='cloud'){
    write(uid,{...empty(),revision:remote?.revision||0,data:clone(remote?.data||empty().data)});conflict=null;onSwitch();notify('synced','Progresso da nuvem carregado.');return true;
   }
   write(uid,{...local,revision:remote?.revision||0,dirty:true,change:local.change+1});conflict=null;return sync();
  }
  function importGuest(){
   if(!uid||conflict)return false;
   const local=read(uid);if(local.data.game||local.data.statistics)return false;
   const data={game:backing.getItem(GAME_KEY),statistics:backing.getItem(STATS_KEY)};
   if(!validateData(data)||(!data.game&&!data.statistics))return false;
   write(uid,{...local,data,dirty:true,change:local.change+1});onSwitch();schedule();notify('pending','Progresso do visitante copiado para esta conta. Sincronização pendente.');return true;
  }
  function canImport(){
   try{const local=uid?read(uid):null;return Boolean(local&&!local.data.game&&!local.data.statistics&&!conflict&&(backing.getItem(GAME_KEY)||backing.getItem(STATS_KEY)))}catch(e){return false}
  }
  return {storage,setSession,sync,resolveConflict,importGuest,canImport,getStatus:()=>({...status,uid}),getConflict:()=>conflict?clone(conflict):null};
 }
 function firebaseAdapter(sdk,auth){
  const db=sdk.getFirestore(auth.app);
  const ref=uid=>sdk.doc(db,'players',uid,'saves','current');
  const ensure=uid=>{if(auth.currentUser?.uid!==uid)throw Error('account-changed')};
  return {
   async read(uid){
    ensure(uid);let timer;
    try{const snap=await Promise.race([sdk.getDocFromServer(ref(uid)),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('offline')),10000)})]);ensure(uid);return snap.exists()?snap.data():null}finally{clearTimeout(timer)}
   },
   async write(uid,revision,data){
    ensure(uid);
    return sdk.runTransaction(db,async transaction=>{
     ensure(uid);const target=ref(uid),snap=await transaction.get(target),remote=snap.exists()?snap.data():null;
     if((remote?.revision||0)!==revision)return {ok:false,remote};
     transaction.set(target,{version:1,revision:revision+1,data,updatedAt:sdk.serverTimestamp()});return {ok:true,revision:revision+1};
    });
   }
  };
 }
 return {createManager,validateData,firebaseAdapter,GAME_KEY,STATS_KEY,MAX_BYTES};
});
