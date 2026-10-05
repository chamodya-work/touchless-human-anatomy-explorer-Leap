module.exports=async({js:rawjs,shot,sleep,logs})=>{
  const js=c=>rawjs(c);
  const alive=()=>js(`(window.dispatchEvent(new MouseEvent('mousemove',{clientX:300,clientY:300})),1)`);
  await sleep(2000);await js(`(window.__anatomyApp._enterMenu(),1)`);await sleep(1200);
  await js(`(document.querySelector('.menu-btn[data-system=eye]').click(),1)`);await sleep(5000);
  const ex=`window.__anatomyApp.currentExplorer`,V=`window.__anatomyApp.viewer`;
  const click=async id=>{await alive();await js(`(document.querySelector('#${id}').click(),1)`)};
  const tick=async n=>{await alive();await js(`(()=>{for(let i=0;i<${n};i++)${ex}._tick(0.05);return 1})()`)};
  await click('eye-focus');await js(`(${ex}._timers.focus=0,1)`);await tick(60);await shot('c_far');
  await js(`(${ex}._timers.focus=3.55,1)`);await tick(30);await shot('c_near');
  console.log('clip enabled',await js(`${V}.renderer.localClippingEnabled`),'k',await js(`${ex}._focusK.toFixed(2)`));
  console.log('LOGS',JSON.stringify(logs.slice(0,4)));
};
