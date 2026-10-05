module.exports=async({js,shot,sleep,logs,win})=>{
  const alive=()=>js(`window.dispatchEvent(new Event('mousemove'))`);
  await sleep(2000);await js(`window.__anatomyApp._enterMenu()`);await sleep(1200);
  await js(`document.querySelector('.menu-btn[data-system=eye]').click()`);await sleep(5000);
  const ex=`window.__anatomyApp.currentExplorer`,V=`window.__anatomyApp.viewer`;
  const click=async id=>{await alive();return js(`document.querySelector('#${id}').click()`)};
  const tick=async(n,dt=0.05)=>{await alive();await js(`(()=>{for(let i=0;i<${n};i++)${ex}._tick(${dt})})()`)};
  const st=()=>js(`JSON.stringify({rotY:+${V}.modelRoot.rotation.y.toFixed(2),zoom:+${V}.camera.position.z.toFixed(2),pupil:+${ex}._pupilMm.toFixed(2),focus:+${ex}._focusK.toFixed(2),yaw:+${ex}._yaw.toFixed(1),pitch:+${ex}._pitch.toFixed(1)})`);
  const settle=async()=>{await sleep(1500);await alive()};
  await js(`(()=>{${V}.modelRoot.rotation.set(0,0,0);})()`);
  // ---- gaze (front-ish view)
  await click('eye-gaze');
  for(const [name,t] of [['out',0.5],['in',3.9],['up',7.3],['down',10.7]]){
    await js(`${ex}._timers.gaze=${t};${ex}._gazeIdx=-1`);await tick(70);await settle();console.log('gaze',name,await st());await shot('g_'+name);
  }
  await click('eye-gaze');await tick(60);
  // ---- tears
  await click('eye-tears');await tick(80);await settle();await shot('t_tears');
  console.log('tears',await js(`(()=>{const p=${ex}._rig.tears.points;return p.visible+' op '+p.material.opacity.toFixed(2)+' size '+p.material.size.toFixed(3)})()`));
  await click('eye-tears');await tick(60);
  // ---- focus
  await click('eye-focus');await js(`${ex}._timers.focus=0`);await tick(90);await settle();console.log('focus far',await st());await shot('f_far');
  await js(`${ex}._timers.focus=3.6`);await tick(90);await settle();console.log('focus near',await st());await shot('f_near');
  await click('eye-focus');await tick(80);
  // ---- see inside, front
  await js(`${V}.modelRoot.rotation.set(0,0.35,0);${V}.autoRotate=false`);await click('eye-inside');await settle();await shot('i_inside');
  await click('eye-inside');
  // ---- selection by real mouse click on the iris
  await js(`${V}.modelRoot.rotation.set(0,0,0);${V}.autoRotate=false;${V}.setZoom(4.2)`);await sleep(2500);
  await win.webContents.sendInputEvent({type:'mouseMove',x:632,y:380});await sleep(500);
  await win.webContents.sendInputEvent({type:'mouseDown',x:632,y:380,button:'left',clickCount:1});await sleep(150);
  await win.webContents.sendInputEvent({type:'mouseUp',x:632,y:380,button:'left',clickCount:1});await sleep(1500);
  console.log('selected after click:',await js(`${V}.selected?${V}.selected.userData.partId:'none'`),'| panel:',await js(`(document.querySelector('.info-panel__title, #info-panel h2, .info-panel h2')||{}).textContent`));
  await shot('s_click');
  console.log('LOGS',JSON.stringify(logs.slice(0,6)));
};
