module.exports=async({js,shot,sleep,logs})=>{
  await sleep(2000);await js(`(window.__anatomyApp._enterMenu(),1)`);await sleep(1200);
  await js(`(document.querySelector('.menu-btn[data-system=eye]').click(),1)`);await sleep(5500);
  const V=`window.__anatomyApp.viewer`,ex=`window.__anatomyApp.currentExplorer`;
  await js(`(${V}.autoRotate=false,${V}.modelRoot.rotation.set(0,0,0),${V}.setZoom(3.2),1)`);await sleep(600);
  const L=`${ex}._model.getObjectByName('lens').material`,C=`${ex}._model.getObjectByName('cornea').material`;
  console.log(await js(`JSON.stringify({lensEmi:${L}.emissive.getHexString(),lensEI:${L}.emissiveIntensity,corEmi:${C}.emissive.getHexString(),corEI:${C}.emissiveIntensity,hasTick:typeof ${ex}._model.userData.onFrame})`));
  await shot('e_base');
  await js(`(${L}.emissiveIntensity=0,1)`);await shot('e_lensEI0');
  await js(`(${C}.emissiveIntensity=0,1)`);await shot('e_bothEI0');
};
