module.exports=async({js,shot,sleep,logs})=>{
  const alive=()=>js(`(window.dispatchEvent(new MouseEvent('mousemove',{clientX:300,clientY:300})),1)`);
  await sleep(2500);await shot('w0_welcome');
  await js(`(window.__anatomyApp._enterMenu(),1)`);await sleep(2500);await shot('w1_menu');
  for(const id of ['brain','heart','lungs','skeleton','muscles','digestive','nervous','eye']){
    await alive();await js(`(document.querySelector('.menu-btn[data-system=${id}]').click(),1)`);await sleep(5500);await alive();
    const info=await js(`JSON.stringify({ex:!!window.__anatomyApp.currentExplorer,real:window.__anatomyApp.currentExplorer._usedRealModel,cls:window.__anatomyApp.currentExplorer.constructor.name})`);
    console.log(id,info);
    await js(`(window.__anatomyApp.viewer.autoRotate=false,window.__anatomyApp.viewer.modelRoot.rotation.set(0,0,0),1)`);await shot('s_'+id);
    await js(`(document.querySelector('#back-btn, .back-btn, #btn-back')?.click(),1)`);await sleep(1200);
    await js(`(window.__anatomyApp._enterMenu(),1)`);await sleep(1200);
  }
  console.log('LOGS',JSON.stringify(logs.slice(0,8)));
};
