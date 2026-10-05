module.exports=async({js:rawjs,shot,sleep,logs})=>{
  const js=c=>rawjs(c);
  const alive=()=>js(`(window.dispatchEvent(new MouseEvent('mousemove',{clientX:300,clientY:300})),1)`);
  await sleep(2000);await js(`(window.__anatomyApp._enterMenu(),1)`);await sleep(1200);
  await js(`(document.querySelector('.menu-btn[data-system=eye]').click(),1)`);await sleep(5000);
  const ex=`window.__anatomyApp.currentExplorer`,V=`window.__anatomyApp.viewer`;
  const click=async id=>{await alive();await js(`(document.querySelector('#${id}').click(),1)`)};
  const tick=async n=>{await alive();await js(`(()=>{for(let i=0;i<${n};i++)${ex}._tick(0.05);return 1})()`)};
  await js(`(${V}.autoRotate=false,${V}.modelRoot.rotation.set(0,0,0),1)`);await sleep(600);await shot('p0_default');
  await click('eye-light');await js(`(${ex}._timers.light=3.6,1)`);await tick(50);await shot('p1_light_dim');await click('eye-light');await tick(40);
  await click('eye-gaze');await js(`(${ex}._timers.gaze=3.4,${ex}._gazeIdx=-1,1)`);await tick(12);await shot('p2_gaze_in');await click('eye-gaze');await tick(40);
  await click('eye-tears');await tick(50);await shot('p3_tears');await click('eye-tears');await tick(40);
  await js(`(${V}.autoRotate=false,${V}.modelRoot.rotation.set(0,0.45,0),${V}.setZoom(3.8),1)`);await click('eye-inside');await sleep(500);await shot('p4_inside');
  console.log('LOGS',JSON.stringify(logs.slice(0,4)));
};
