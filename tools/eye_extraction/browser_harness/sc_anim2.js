module.exports=async({js,shot,sleep,logs})=>{
  await sleep(2000);await js(`window.__anatomyApp._enterMenu()`);await sleep(1200);
  await js(`document.querySelector('.menu-btn[data-system=eye]').click()`);await sleep(5000);
  const ex=`window.__anatomyApp.currentExplorer`,V=`window.__anatomyApp.viewer`;
  const click=id=>js(`document.querySelector('#${id}').click()`);
  const state=async()=>js(`JSON.stringify({rotY:+${V}.modelRoot.rotation.y.toFixed(2),rotX:+${V}.modelRoot.rotation.x.toFixed(2),auto:${V}.autoRotate,pupil:+${ex}._pupilMm.toFixed(2),focus:+${ex}._focusK.toFixed(2),yaw:+${ex}._yaw.toFixed(1),pitch:+${ex}._pitch.toFixed(1),inside:${ex}._active.inside,fps:${V}.fps})`);
  console.log('start',await state());
  // LIGHT: bright then dim
  await click('eye-light');await sleep(3200);console.log('light bright',await state());await shot('m1_light_bright');
  await js(`${ex}._timers.light=3.6`);await sleep(3000);console.log('light dim',await state());await shot('m2_light_dim');await click('eye-light');await sleep(1500);
  console.log('after light off',await state());
  // FOCUS
  await click('eye-focus');await sleep(4200);console.log('focus far',await state());await shot('m3_focus_far');
  await js(`${ex}._timers.focus=3.6`);await sleep(3200);console.log('focus near',await state());await shot('m4_focus_near');await click('eye-focus');await sleep(1500);
  console.log('after focus off',await state());
  console.log('LOGS',JSON.stringify(logs.slice(0,6)));
};
