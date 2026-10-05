module.exports=async({js,shot,sleep,logs})=>{
  await sleep(2000);await js(`window.__anatomyApp._enterMenu()`);await sleep(1200);
  await js(`document.querySelector('.menu-btn[data-system=eye]').click()`);await sleep(5000);
  const ex=`window.__anatomyApp.currentExplorer`;
  const view=window=>0;
  // freeze auto-rotation at the front for the static look
  await js(`(()=>{const v=window.__anatomyApp.viewer;v.autoRotate=false;v.modelRoot.rotation.set(0,0,0)})()`);await sleep(800);await shot('l1_default');
  await js(`(()=>{const v=window.__anatomyApp.viewer;v.modelRoot.rotation.set(-0.15,0.7,0)})()`);await sleep(800);await shot('l2_angle');
  console.log('LOGS',JSON.stringify(logs.slice(0,8)));
};
