module.exports=async({js,shot,sleep})=>{
  await sleep(2000);await js(`window.__anatomyApp._enterMenu()`);await sleep(1200);
  await js(`document.querySelector('.menu-btn[data-system=eye]').click()`);await sleep(4500);
  const ex=`window.__anatomyApp.currentExplorer`;
  console.log('explorer ok',await js(`!!${ex} && !!${ex}._rig`));
  const click=id=>js(`document.querySelector('#${id}').click()`);
  // LIGHT
  await click('eye-light');await sleep(2200);await shot('a1_light_bright');
  console.log('pupil mm (bright)',await js(`${ex}._pupilMm.toFixed(2)`));
  await sleep(3500);await shot('a2_light_dim');console.log('pupil mm (dim)',await js(`${ex}._pupilMm.toFixed(2)`));await click('eye-light');await sleep(800);
  // FOCUS
  await click('eye-focus');await sleep(2000);await shot('b1_focus_far');await sleep(3800);await shot('b2_focus_near');
  console.log('focusK',await js(`${ex}._focusK.toFixed(2)`));await click('eye-focus');await sleep(600);
  // GAZE
  await click('eye-gaze');await sleep(1300);await shot('c1_gaze_out');await sleep(3400);await shot('c2_gaze_in');await sleep(3400);await shot('c3_gaze_up');
  console.log('globe yaw/pitch',await js(`${ex}._yaw.toFixed(1)+' / '+${ex}._pitch.toFixed(1)`));await click('eye-gaze');await sleep(600);
  // TEARS
  await click('eye-tears');await sleep(3000);await shot('d1_tears');
  console.log('tears visible/opacity/size',await js(`(()=>{const p=${ex}._rig.tears.points;return p.visible+' '+p.material.opacity.toFixed(2)+' size '+p.material.size})()`));await click('eye-tears');await sleep(500);
  // INSIDE
  await click('eye-inside');await sleep(1200);await shot('e1_inside');
};
