// Idempotent local configuration; no Apple signing team or credentials are invented.
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'ios/App/App');
if(process.platform!=='darwin')throw Error('Execute a configuração iOS no macOS.');
const readPlist=file=>JSON.parse(execFileSync('plutil',['-convert','json','-o','-',file],{encoding:'utf8'}));
const infoFile=path.join(dir,'Info.plist'),info=readPlist(infoFile);
const googleFile=path.join(dir,'GoogleService-Info.plist'),configured=fs.existsSync(googleFile);
const appId=JSON.parse(fs.readFileSync(path.join(root,'capacitor.config.json'))).appId;
info.CFBundleDevelopmentRegion='pt_BR';
info.ITSAppUsesNonExemptEncryption=false;
if(configured){
 const google=readPlist(googleFile);
 if(google.BUNDLE_ID!==appId)throw Error('BUNDLE_ID do Firebase não corresponde ao appId do Capacitor.');
 if(!google.REVERSED_CLIENT_ID)throw Error('Habilite Google no Firebase e baixe novamente o GoogleService-Info.plist.');
 info.CFBundleURLTypes=[{CFBundleTypeRole:'Editor',CFBundleURLSchemes:[google.REVERSED_CLIENT_ID]}];
}else delete info.CFBundleURLTypes;
fs.writeFileSync(infoFile,JSON.stringify(info));execFileSync('plutil',['-convert','xml1',infoFile]);
const projectFile=path.join(root,'ios/App/App.xcodeproj/project.pbxproj');
let project=fs.readFileSync(projectFile,'utf8');
if(!project.includes('CODE_SIGN_ENTITLEMENTS = App/App.entitlements;'))project=project.replaceAll('INFOPLIST_FILE = App/Info.plist;','INFOPLIST_FILE = App/Info.plist;\n\t\t\t\tCODE_SIGN_ENTITLEMENTS = App/App.entitlements;');
function resource(name,refId,buildId,include){
 // Remove only entries owned by this script; preserve other project customizations.
 project=project.split('\n').filter(line=>!line.includes(refId)&&!line.includes(buildId)).join('\n');
 if(!include)return;
 project=project.replace('/* End PBXBuildFile section */',`\t\t${buildId} /* ${name} in Resources */ = {isa = PBXBuildFile; fileRef = ${refId} /* ${name} */; };\n/* End PBXBuildFile section */`);
 project=project.replace('/* End PBXFileReference section */',`\t\t${refId} /* ${name} */ = {isa = PBXFileReference; lastKnownFileType = text.xml; path = "${name}"; sourceTree = "<group>"; };\n/* End PBXFileReference section */`);
 project=project.replace('504EC3131FED79650016851F /* Info.plist */,',`504EC3131FED79650016851F /* Info.plist */,\n\t\t\t\t${refId} /* ${name} */,`);
 const resources=project.indexOf('/* Begin PBXResourcesBuildPhase section */'),files=project.indexOf('files = (',resources);
 if(files<0)throw Error('Estrutura Resources não encontrada.');
 const pos=files+'files = ('.length;project=project.slice(0,pos)+`\n\t\t\t\t${buildId} /* ${name} in Resources */,`+project.slice(pos);
}
resource('GoogleService-Info.plist','A11000000000000000000001','A11000000000000000000002',configured);
resource('PrivacyInfo.xcprivacy','A11000000000000000000003','A11000000000000000000004',true);
fs.writeFileSync(projectFile,project);
console.log(configured?'iOS: retorno Google e configuração Firebase preparados.':'iOS: estrutura pronta; adicione GoogleService-Info.plist para ativar os logins.');
