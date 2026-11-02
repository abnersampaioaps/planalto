const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {doc,setDoc,getDoc,deleteDoc,serverTimestamp}=require('firebase/firestore');
test('Firestore enforces owner isolation, schema and monotonic revisions', {skip:!process.env.FIRESTORE_EMULATOR_HOST},async()=>{
 const env=await initializeTestEnvironment({projectId:'demo-planalto',firestore:{rules:fs.readFileSync(path.join(__dirname,'../firestore.rules'),'utf8')}});
 try{
  const owner=env.authenticatedContext('alice').firestore(),other=env.authenticatedContext('bob').firestore(),guest=env.unauthenticatedContext().firestore();
  const ref=db=>doc(db,'players','alice','saves','current');
  const data=revision=>({version:1,revision,data:{game:null,statistics:null},updatedAt:serverTimestamp()});
  await assertFails(setDoc(ref(guest),data(1)));
  await assertFails(setDoc(ref(other),data(1)));
  await assertFails(setDoc(ref(owner),data(2)));
  await assertSucceeds(setDoc(ref(owner),data(1)));
  await assertSucceeds(getDoc(ref(owner)));
  await assertFails(getDoc(ref(other)));await assertFails(getDoc(ref(guest)));
  await assertFails(setDoc(ref(owner),data(1)));
  await assertFails(setDoc(ref(owner),{...data(2),admin:true}));
  await assertFails(setDoc(ref(owner),{...data(2),data:{game:{secret:true},statistics:null}}));
  await assertSucceeds(setDoc(ref(owner),data(2)));
  assert.equal((await getDoc(ref(owner))).data().revision,2);
  await assertFails(deleteDoc(ref(other)));await assertSucceeds(deleteDoc(ref(owner)));
 }finally{await env.cleanup()}
});
