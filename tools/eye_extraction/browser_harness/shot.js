const {app,BrowserWindow}=require('electron');const fs=require('fs');
app.commandLine.appendSwitch('use-gl','angle');app.commandLine.appendSwitch('use-angle','swiftshader');app.commandLine.appendSwitch('enable-unsafe-swiftshader');
app.commandLine.appendSwitch('ignore-gpu-blocklist');app.commandLine.appendSwitch('disable-gpu-sandbox');app.commandLine.appendSwitch('enable-webgl');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
app.whenReady().then(async()=>{
  const win=new BrowserWindow({width:1280,height:800,show:true,webPreferences:{backgroundThrottling:false}});
  const logs=[];win.webContents.on('console-message',(e,l,m,line,src)=>{if(l>=2&&!/Security/.test(m)||/FAIL|rror|Uncaught/.test(m))logs.push(`[${l}] ${m.slice(0,200)}`)});
  await win.webContents.session.clearCache();await win.webContents.session.clearStorageData();await win.loadURL('http://localhost:8765/index.html');
  const js=c=>win.webContents.executeJavaScript(c,true);await js('window.__raf=0;(function l(){window.__raf++;requestAnimationFrame(l)})();1');
  const shot=async n=>{const a=await js('window.__raf');const t0=Date.now();while(Date.now()-t0<25000){const b=await js('window.__raf');if(b>a+5)break;await sleep(200)}await sleep(400);const img=await win.webContents.capturePage();fs.writeFileSync('/home/claude/shots/'+n+'.png',img.toPNG());};
  try{ await require(process.env.SCENARIO)({win,js,shot,sleep,logs}); }catch(e){console.log('SCENARIO ERROR',e)}
  console.log('LOGS',JSON.stringify(logs.slice(0,15)));app.quit();
});
