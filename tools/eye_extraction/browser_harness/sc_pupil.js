module.exports=async({js,shot,sleep,logs})=>{
  await sleep(2000);await js(`(window.__anatomyApp._enterMenu(),1)`);await sleep(1200);
  await js(`(document.querySelector('.menu-btn[data-system=eye]').click(),1)`);await sleep(5000);
  await js(`(window.__anatomyApp.viewer.autoRotate=false,window.__anatomyApp.viewer.modelRoot.rotation.set(0.05,0.12,0),window.__anatomyApp.viewer.setZoom(3.2),1)`);await sleep(700);await shot('q_pupil');
  console.log('LOGS',JSON.stringify(logs.slice(0,3)));
};
