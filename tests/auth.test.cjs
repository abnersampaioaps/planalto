const test=require('node:test');
const assert=require('node:assert/strict');
const {createController,configurationValid,supportedOrigin,errorMessage}=require('../auth.js');
const config={apiKey:'public-key',authDomain:'test.firebaseapp.com',projectId:'test',appId:'test-web-app'};
const location={protocol:'https:',hostname:'abnersampaioaps.github.io'};
function fixture({restored=null,loginError=null,logoutError=null}={}){
 let observer,initializations=0,loginCalls=0,logoutCalls=0,requestedParameters;
 const auth={};
 const sdk={
  getApps:()=>[],initializeApp:()=>{initializations++;return {}},getAuth:()=>auth,
  GoogleAuthProvider:class{setCustomParameters(parameters){requestedParameters=parameters}},
  onAuthStateChanged(_auth,callback){observer=callback;queueMicrotask(()=>callback(restored));return ()=>{}},
  async signInWithPopup(){loginCalls++;if(loginError)throw loginError;observer({uid:'verified-user',displayName:'Pessoa <teste>',email:'pessoa@example.com'});return {user:{uid:'verified-user'}}},
  async signOut(){logoutCalls++;if(logoutError)throw logoutError;observer(null)}
 };
 return {sdk,auth,emit:user=>observer(user),counts:()=>({initializations,loginCalls,logoutCalls}),parameters:()=>requestedParameters};
}
test('missing configuration and file URLs never load the remote SDK or fake a login',async()=>{
 let calls=0;const loadSdk=async()=>{calls++;throw Error('Must not load')};
 const missing=createController({config:null,location,loadSdk});
 assert.equal(await missing.initialize(),false);
 assert.equal(missing.getState().phase,'unconfigured');
 assert.equal(await missing.signIn(),false);
 const local=createController({config,location:{protocol:'file:',hostname:''},loadSdk});
 assert.equal(await local.initialize(),false);
 assert.equal(local.getState().phase,'unsupported');
 assert.equal(local.getState().user,null);assert.equal(calls,0);
 assert.equal(configurationValid({...config,appId:''}),false);
 assert.equal(supportedOrigin({protocol:'http:',hostname:'example.com'}),false);
 assert.equal(supportedOrigin({protocol:'http:',hostname:'localhost'}),true);
});
test('restored SDK identity is displayed and sign-out clears it',async()=>{
 const f=fixture({restored:{uid:'existing',displayName:'Nome',email:'nome@example.com'}});
 const controller=createController({config,location,loadSdk:async()=>f.sdk});
 await Promise.all([controller.initialize(),controller.initialize()]);
 assert.equal(f.counts().initializations,1);
 assert.equal(controller.getState().user.uid,'existing');
 assert.equal(controller.getState().ready,true);
 assert.equal(f.auth.languageCode,'pt-BR');
 assert.equal(await controller.signOut(),true);
 assert.equal(controller.getState().user,null);
 assert.equal(controller.getState().busy,false);
 assert.equal(f.counts().logoutCalls,1);
});
test('sign-in opens directly on the user action, deduplicates clicks and uses SDK identity',async()=>{
 const f=fixture();const controller=createController({config,location,loadSdk:async()=>f.sdk});
 await controller.initialize();
 const first=controller.signIn();
 assert.equal(f.counts().loginCalls,1);
 assert.equal(await controller.signIn(),false);
 assert.equal(await first,true);
 assert.equal(controller.getState().user.uid,'verified-user');
 assert.equal(controller.getState().user.name,'Pessoa <teste>');
 assert.deepEqual(f.parameters(),{prompt:'select_account'});
 f.emit(null);assert.equal(controller.getState().user,null);
});
test('cancelled and blocked popups leave the user signed out and allow another attempt',async()=>{
 for(const code of ['auth/popup-closed-by-user','auth/popup-blocked','auth/unauthorized-domain']){
  const f=fixture({loginError:{code,message:'raw credential details should not be shown'}});
  const controller=createController({config,location,loadSdk:async()=>f.sdk});await controller.initialize();
  assert.equal(await controller.signIn(),false);
  assert.equal(controller.getState().user,null);assert.equal(controller.getState().busy,false);
  assert.equal(controller.getState().message,errorMessage({code}));
  assert.doesNotMatch(controller.getState().message,/credential/);
  await controller.signIn();assert.equal(f.counts().loginCalls,2);
 }
});
test('failed SDK loading can be retried without inventing a session',async()=>{
 const f=fixture();let attempts=0;
 const controller=createController({config,location,loadSdk:async()=>{if(++attempts===1)throw Error('Offline');return f.sdk}});
 assert.equal(await controller.initialize(),false);
 assert.equal(controller.getState().phase,'error');assert.equal(controller.getState().busy,false);
 assert.equal(await controller.initialize(),true);assert.equal(controller.getState().ready,true);
 assert.equal(controller.getState().user,null);
});
test('failed sign-out preserves the verified identity and reports failure',async()=>{
 const f=fixture({restored:{uid:'existing'},logoutError:Error('Offline')});
 const controller=createController({config,location,loadSdk:async()=>f.sdk});await controller.initialize();
 assert.equal(await controller.signOut(),false);
 assert.equal(controller.getState().user.uid,'existing');
 assert.match(controller.getState().message,/Não foi possível sair/);
 assert.equal(controller.getState().busy,false);
});

test('native Google signs into the same Firebase JS session used by cloud saves',async()=>{
 const f=fixture();let exchanged=null,options=null,session=null;
 f.sdk.initializeAuth=(_app,opt)=>{options=opt;return f.auth};f.sdk.indexedDBLocalPersistence='indexedDB';
 f.sdk.GoogleAuthProvider.credential=token=>({provider:'google',token});
 f.sdk.signInWithCredential=async(_auth,credential)=>{exchanged=credential;f.emit({uid:'firebase-verified',displayName:'Jogador'})};
 const native={async signInWithGoogle(opts){assert.equal(opts.skipNativeAuth,true);return {user:{uid:'ignore-native-user'},credential:{idToken:'native-google-token'}}}};
 const controller=createController({config,location:{protocol:'capacitor:',hostname:'localhost'},native,loadSdk:async()=>f.sdk,onSession:user=>{session=user}});
 await controller.initialize();assert.deepEqual(options,{persistence:'indexedDB'});
 assert.equal(await controller.signIn(),true);assert.deepEqual(exchanged,{provider:'google',token:'native-google-token'});
 assert.equal(controller.getState().user.uid,'firebase-verified');assert.equal(session.uid,'firebase-verified');assert.equal(f.counts().loginCalls,0);
});

test('native Apple requires its nonce and exchanges credentials without a web popup',async()=>{
 for(const valid of [true,false]){
  const f=fixture();let exchanged=null;
  f.sdk.initializeAuth=()=>f.auth;f.sdk.OAuthProvider=class{constructor(id){assert.equal(id,'apple.com')}credential(value){return value}};
  f.sdk.signInWithCredential=async(_auth,credential)=>{exchanged=credential;f.emit({uid:'apple-verified'})};
  const native={async signInWithApple(opts){assert.equal(opts.skipNativeAuth,true);return {credential:{idToken:'apple-token',...(valid?{nonce:'original-nonce'}:{})}}}};
  const controller=createController({config,location:{protocol:'capacitor:'},native,loadSdk:async()=>f.sdk});await controller.initialize();
  assert.equal(await controller.signIn('apple'),valid);
  assert.deepEqual(exchanged,valid?{idToken:'apple-token',rawNonce:'original-nonce'}:null);
  assert.equal(f.counts().loginCalls,0);
 }
});

test('browser Apple uses the Apple provider with only name and email scopes',async()=>{
 const f=fixture();const scopes=[];let providerId;
 f.sdk.OAuthProvider=class{constructor(id){providerId=id}addScope(scope){scopes.push(scope)}};
 const controller=createController({config,location,loadSdk:async()=>f.sdk});await controller.initialize();
 assert.equal(await controller.signIn('apple'),true);assert.equal(providerId,'apple.com');assert.deepEqual(scopes,['email','name']);
});
