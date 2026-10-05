module.exports=async({js:rawjs,shot,sleep,logs})=>{
  const js=c=>rawjs(c.trim().startsWith('(')||c.includes('.toFixed')||c.includes('JSON')||c.includes('textContent')?c:`(()=>{${c};return 1})()`);
  const alive=()=>js(`window.dispatchEvent(new MouseEvent('mousemove',{clientX:300,clientY:300}))`);
  await sleep(2000);await js(`window.__anatomyApp._enterMenu()`);await sleep(1200);
  await js(`document.querySelector('.menu-btn[data-system=eye]').click()`);await sleep(5000);
  const ex=`window.__anatomyApp.currentExplorer`,V=`window.__anatomyApp.viewer`;
  const click=async id=>{await alive();await js(`document.querySelector('#${id}').click()`)};
  const tick=async(n,dt=0.05)=>{await alive();await js(`(()=>{for(let i=0;i<${n};i++)${ex}._tick(${dt})})()`)};
  const settle=async()=>{await sleep(600);await alive()};
  // GAZE: set timer so that after `n` ticks we sit mid-step
  await js(`${V}.modelRoot.rotation.set(0,0,0)`);await click('eye-gaze');
  for(const [name,mid] of [['out',0.9],['in',4.3],['up',7.7],['down',11.1]]){
    await js(`${ex}._timers.gaze=${mid-0.8};${ex}._gazeIdx=-1`);await tick(16);await settle();await shot('g_'+name);
    console.log('gaze',name,await js(`${ex}._yaw.toFixed(1)+' / '+${ex}._pitch.toFixed(1)+' | '+document.querySelector('#eye-explainer').textContent.slice(0,45)`));
  }
  await click('eye-gaze');await tick(60);
  // TEARS
  await click('eye-tears');await tick(60);await settle();await shot('t_tears');
  await click('eye-tears');await tick(60);
  // FOCUS: far then near
  await click('eye-focus');await js(`${ex}._timers.focus=0`);await tick(50);await settle();await shot('f_far');
  console.log('focus far k=',await js(`${ex}._focusK.toFixed(2)`));
  await js(`${ex}._timers.focus=3.5`);await tick(50);await settle();await shot('f_near');console.log('focus near k=',await js(`${ex}._focusK.toFixed(2)`));
  await click('eye-focus');await tick(60);
  // INSIDE (front, slightly angled)
  await js(`${V}.autoRotate=false;${V}.modelRoot.rotation.set(0,0.5,0)`);await click('eye-inside');await settle();await shot('i_inside');
  console.log('LOGS',JSON.stringify(logs.slice(0,4)));
};
