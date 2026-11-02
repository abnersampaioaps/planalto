const fs=require('node:fs/promises');
const path=require('node:path');
const {build}=require('esbuild');
async function main(){
 const root=path.resolve(__dirname,'..'),out=path.join(root,'dist');
 await fs.mkdir(out,{recursive:true});
 for(const name of ['ui-v6.css','auth-config.js','auth.js','cloud-save.js'])await fs.copyFile(path.join(root,name),path.join(out,name));
 await fs.cp(path.join(root,'assets'),path.join(out,'assets'),{recursive:true});
 let html=await fs.readFile(path.join(root,'index.html'),'utf8');
 html=html.replace('<script src="./auth.js?v=2"','<script src="./native-runtime.js"></script>\n<script src="./auth.js?v=2"');
 await fs.writeFile(path.join(out,'index.html'),html);
 const configured=await fs.access(path.join(root,'ios/App/App/GoogleService-Info.plist')).then(()=>true,()=>false);
 await build({entryPoints:[path.join(root,'native-entry.js')],outfile:path.join(out,'native-runtime.js'),bundle:true,format:'iife',platform:'browser',target:'safari16',minify:true,logLevel:'info',banner:{js:'window.PLANALTO_NATIVE_AUTH_CONFIGURED='+configured+';'}});
 console.log('Aplicativo preparado em dist/ (SDKs incluídos, sem depender de CDN no iOS).');
}
main().catch(error=>{console.error(error.message);process.exitCode=1});
