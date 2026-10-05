module.exports=async({js,shot,sleep,logs})=>{
  await sleep(2000);await js(`window.__anatomyApp._enterMenu()`);await sleep(1200);
  await js(`document.querySelector('.menu-btn[data-system=eye]').click()`);await sleep(4500);
  const ex=`window.__anatomyApp.currentExplorer`;
  const safe=async c=>js(`(()=>{try{return String(${c})}catch(e){return 'EXC '+e.stack.split('\\n').slice(0,4).join(' | ')}})()`);
  console.log('fps',await safe(`window.__anatomyApp.viewer.fps`),'rotY',await safe(`window.__anatomyApp.viewer.modelRoot.rotation.y.toFixed(2)`));
  console.log('click light',await safe(`(document.querySelector('#eye-light').click(),'ok')`));
  console.log('click focus',await safe(`(document.querySelector('#eye-focus').click(),'ok')`));
  console.log('click gaze',await safe(`(document.querySelector('#eye-gaze').click(),'ok')`));
  await sleep(2500);
  console.log('tick manual',await safe(`(${ex}._tick(0.05),'ok')`));
  console.log('yaw',await safe(`${ex}._yaw`),'texts',await safe(`JSON.stringify(${ex}._texts)`));
  console.log('fps',await safe(`window.__anatomyApp.viewer.fps`));
};
