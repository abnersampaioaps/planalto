const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

test('menu options remain clickable when a browser drops focus before click',()=>{
 const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
 const start=html.indexOf("$('headerMenu').addEventListener('click'");
 const end=html.indexOf("for(const id of ['statisticsBtn'",start);
 assert.ok(start>=0&&end>start);
 const listeners={},documentListeners={};let focusReturned=false;
 const menu={open:true,addEventListener:(type,fn)=>{listeners[type]=fn},contains:target=>target?.inside===true};
 const button={inside:true,closest:selector=>selector==='button'?button:null};
 const context=vm.createContext({$:id=>id==='headerMenu'?menu:{focus(){focusReturned=true}},document:{addEventListener:(type,fn)=>{documentListeners[type]=fn}}});
 vm.runInContext(html.slice(start,end),context);
 // Safari can send focusout with no related target before dispatching click.
 listeners.focusout?.({currentTarget:menu,relatedTarget:null});
 assert.equal(menu.open,true);
 let activated=false;
 if(menu.open){activated=true;listeners.click({target:button});documentListeners.click({target:button})}
 assert.equal(activated,true);assert.equal(menu.open,false);
 menu.open=true;documentListeners.click({target:{inside:false}});assert.equal(menu.open,false);
 menu.open=true;listeners.keydown({key:'Escape',preventDefault(){},stopPropagation(){}});
 assert.equal(menu.open,false);assert.equal(focusReturned,true);
});
