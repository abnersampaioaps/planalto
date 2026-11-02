/* Optional Firebase Authentication: browser popup or native iOS credentials. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else{root.PlanaltoAuth=api;api.mount(root)}
})(globalThis,function(){
 'use strict';
 const SDK_VERSION='12.19.0';
 function configurationValid(config){
  return Boolean(config&&['apiKey','authDomain','projectId','appId'].every(key=>typeof config[key]==='string'&&config[key].trim().length>0));
 }
 function supportedOrigin(location){
  return location.protocol==='https:'||(location.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(location.hostname));
 }
 function errorMessage(error){
  return ({
   'auth/popup-closed-by-user':'Login cancelado. Você pode continuar jogando ou tentar novamente.',
   'auth/cancelled-popup-request':'Já existe uma janela de login aberta.',
   'auth/popup-blocked':'O navegador bloqueou a janela. Permita popups para este site e tente novamente.',
   'auth/unauthorized-domain':'O login ainda não está habilitado para este endereço. Você pode continuar sem entrar.',
   'auth/operation-not-allowed':'O login com Google ainda não foi ativado neste jogo.',
   'auth/network-request-failed':'Não foi possível conectar. Confira sua conexão e tente novamente.',
   'auth/web-storage-unsupported':'O navegador bloqueou o armazenamento necessário para entrar. Abra o jogo em uma janela normal do navegador.',
   'auth/account-exists-with-different-credential':'Esta conta usa outra forma de acesso. Tente outra conta Google.',
   'auth/user-disabled':'O acesso desta conta foi desativado.',
   'auth/too-many-requests':'Muitas tentativas. Aguarde um pouco antes de tentar novamente.',
   'auth/operation-not-supported-in-this-environment':'Abra o jogo no seu navegador para entrar com Google.'
  })[error?.code]||'Não foi possível entrar na conta. Tente novamente ou continue jogando sem entrar.';
 }
 async function loadFirebase(){
  if(globalThis.PlanaltoFirebaseSdk)return globalThis.PlanaltoFirebaseSdk;
  const [app,auth,firestore]=await Promise.all([
   import('https://www.gstatic.com/firebasejs/'+SDK_VERSION+'/firebase-app.js'),
   import('https://www.gstatic.com/firebasejs/'+SDK_VERSION+'/firebase-auth.js'),
   import('https://www.gstatic.com/firebasejs/'+SDK_VERSION+'/firebase-firestore.js')
  ]);
  return {...app,...auth,...firestore};
 }
 function createController({config,location,loadSdk=loadFirebase,native=null,onChange=()=>{},onSession=()=>{}}){
  let sdk,auth,provider,initializing=null,unsubscribe=null;
  let state={phase:'idle',ready:false,busy:false,user:null,message:''};
  const update=patch=>{state={...state,...patch};onChange({...state});};
  async function initialize(){
   if(state.ready)return true;
   if(initializing)return initializing;
   if(!configurationValid(config)){update({phase:'unconfigured',message:'O login ainda não foi ativado. Você pode continuar jogando como visitante.'});return false}
   if(!native&&!supportedOrigin(location)){update({phase:'unsupported',message:'Para entrar, abra a versão online do jogo no navegador. O jogo local continua disponível sem login.'});return false}
   update({phase:'loading',busy:true,message:'Preparando acesso à conta…'});
   initializing=(async()=>{
    try{
     sdk=await loadSdk();
     const app=sdk.getApps().find(item=>item.name==='planalto-auth')||sdk.initializeApp(config,'planalto-auth');
     if(native){
      try{auth=sdk.initializeAuth(app,{persistence:sdk.indexedDBLocalPersistence})}
      catch(error){if(error.code!=='auth/already-initialized')throw error;auth=sdk.getAuth(app)}
     }else auth=sdk.getAuth(app);
     auth.languageCode='pt-BR';
     provider=new sdk.GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});
     if(unsubscribe)unsubscribe();
     await new Promise((resolve,reject)=>{
      unsubscribe=sdk.onAuthStateChanged(auth,user=>{
       // Only the SDK's verified auth state establishes the signed-in identity.
       onSession(user,{sdk,auth});
       update({ready:true,phase:'ready',user:user?{uid:user.uid,name:user.displayName||'Sua conta',email:user.email||''}:null,message:''});
       resolve();
      },reject);
     });
     return true;
    }catch(error){update({phase:'error',ready:false,message:errorMessage(error)});return false}
    finally{initializing=null;update({busy:false})}
   })();
   return initializing;
  }
  async function signIn(type='google'){
   if(!state.ready||state.busy||state.user||!['google','apple'].includes(type))return false;
   update({busy:true,message:'Conclua o login com '+(type==='apple'?'Apple':'Google')+'.'});
   try{
    // No asynchronous preparation before opening: keep the browser click gesture.
    if(native){
     const result=await (type==='apple'?native.signInWithApple({skipNativeAuth:true}):native.signInWithGoogle({skipNativeAuth:true}));
     if(!result.credential?.idToken||(type==='apple'&&!result.credential?.nonce))throw Error('Missing native credential');
     const credential=type==='apple'
      ?new sdk.OAuthProvider('apple.com').credential({idToken:result.credential.idToken,rawNonce:result.credential.nonce})
      :sdk.GoogleAuthProvider.credential(result.credential.idToken);
     await sdk.signInWithCredential(auth,credential);
    }else{
     const selected=type==='apple'?new sdk.OAuthProvider('apple.com'):provider;
     if(type==='apple'){selected.addScope('email');selected.addScope('name')}
     await sdk.signInWithPopup(auth,selected);
    }
    return true;
   }catch(error){update({message:errorMessage(error)});return false}
   finally{update({busy:false})}
  }
  async function signOut(){
   if(!state.ready||state.busy||!state.user)return false;
   update({busy:true,message:'Saindo da conta…'});
   try{await sdk.signOut(auth);return true}
   catch(error){update({message:'Não foi possível sair da conta. Confira sua conexão e tente novamente.'});return false}
   finally{update({busy:false})}
  }
  return {initialize,signIn,signOut,getState:()=>({...state})};
 }
 function mount(root){
  const doc=root.document,$=id=>doc.getElementById(id);
  const overlay=$('accountOverlay');if(!overlay)return;
  let trigger=null,startup=true;
  function render(state){
   const logged=Boolean(state.user);
   $('accountMenuBtn').textContent=logged?'Minha conta':'Entrar na conta';
   $('setupAccountBtn').textContent=logged?'Minha conta':'Entrar na conta';
   $('accountTitle').textContent=logged?'Sua conta':'Entre no Rumo ao Planalto';
   $('accountClose').textContent=logged?'Continuar':'Continuar como visitante';
   $('accountProfile').hidden=!logged;
   $('accountName').textContent=state.user?.name||'';
   $('accountEmail').textContent=state.user?.email||'';
   $('accountInitial').textContent=(state.user?.name||'G').slice(0,1).toLocaleUpperCase('pt-BR');
   $('accountStatus').textContent=state.message||(logged?'Você está conectado.':'O login é opcional. Você também pode jogar como visitante.');
   $('googleSignInBtn').hidden=logged;
   $('googleSignInBtn').disabled=!state.ready||state.busy;
   $('googleSignInBtn').textContent=state.busy?'Aguarde…':'Entrar com Google';
   $('appleSignInBtn').hidden=logged||(!root.PlanaltoNativeAuth&&!root.PLANALTO_APPLE_WEB_ENABLED);
   $('appleSignInBtn').disabled=!state.ready||state.busy;
   $('googleSignOutBtn').hidden=!logged;
   $('googleSignOutBtn').disabled=state.busy;
   $('accountRetryBtn').hidden=state.phase!=='error';
   $('accountOnlineLink').hidden=state.phase!=='unsupported';
   renderSync();
   if(startup&&logged&&state.ready){startup=false;overlay.classList.add('hidden')}
  }
  function renderSync(){
   const save=root.PlanaltoSave,status=save?.getStatus();
   $('accountSyncPanel').hidden=!status?.uid;
   $('accountSyncStatus').textContent=status?.message||'';
   $('accountSyncConflict').hidden=status?.phase!=='conflict';
   $('accountImportGuest').hidden=!save?.canImport()||!['synced','pending'].includes(status?.phase);
   $('accountSyncRetry').hidden=status?.phase==='conflict';
  }
  root.addEventListener('planalto:sync-status',renderSync);
  const controller=createController({config:root.PlanaltoNativeAuth&&root.PLANALTO_NATIVE_AUTH_CONFIGURED===false?null:root.PLANALTO_FIREBASE_CONFIG,location:root.location,native:root.PlanaltoNativeAuth,onChange:render,
   onSession:(user,{sdk,auth})=>root.PlanaltoSave?.setSession(user?.uid||null,user?root.PlanaltoCloud.firebaseAdapter(sdk,auth):null)});
  function open(button){
   startup=false;
   trigger=button.id==='accountMenuBtn'?$('headerMenuToggle'):button;
   overlay.classList.remove('hidden');$('accountTitle').focus();
   controller.initialize();
  }
  function close(){startup=false;overlay.classList.add('hidden');if(trigger?.isConnected)trigger.focus();trigger=null}
  for(const id of ['accountMenuBtn','setupAccountBtn'])$(id).addEventListener('click',event=>open(event.currentTarget));
  $('accountClose').addEventListener('click',close);
  $('googleSignInBtn').addEventListener('click',()=>controller.signIn());
  $('appleSignInBtn').addEventListener('click',()=>controller.signIn('apple'));
  $('googleSignOutBtn').addEventListener('click',()=>controller.signOut());
  $('accountRetryBtn').addEventListener('click',()=>controller.initialize());
  $('accountSyncRetry').addEventListener('click',()=>root.PlanaltoSave.sync());
  $('accountImportGuest').addEventListener('click',()=>root.PlanaltoSave.importGuest());
  for(const [id,choice] of [['accountUseCloud','cloud'],['accountUseLocal','local']])$(id).addEventListener('click',()=>root.PlanaltoSave.resolveConflict(choice).catch(()=>{$('accountSyncStatus').textContent='Não foi possível preservar a cópia de segurança. Nenhum progresso foi substituído.'}));
  overlay.addEventListener('click',event=>{if(event.target===overlay)close()});
  overlay.addEventListener('keydown',event=>{
   if(event.key==='Escape'){event.stopPropagation();close()}
   if(event.key==='Tab'){
    const focusable=[...overlay.querySelectorAll('button,a[href]')].filter(el=>!el.closest('[hidden]')&&!el.disabled),first=focusable[0],last=focusable.at(-1);
    if(event.shiftKey&&(doc.activeElement===first||doc.activeElement===$('accountTitle'))){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&doc.activeElement===last){event.preventDefault();first.focus()}
   }
  });
  render(controller.getState());
  // Restore a session only after the site owner supplies an actual configuration.
  controller.initialize();
  return controller;
 }
 return {configurationValid,supportedOrigin,errorMessage,createController,mount};
});
