module.exports=async({js,shot,sleep,logs})=>{
  const fs=require('fs');
  await sleep(2000);await js(`(window.__anatomyApp._enterMenu(),1)`);await sleep(1200);
  await js(`(document.querySelector('.menu-btn[data-system=eye]').click(),1)`);await sleep(5500);
  const V=`window.__anatomyApp.viewer`,ex=`window.__anatomyApp.currentExplorer`;
  await js(`(${V}.autoRotate=false,${V}.modelRoot.rotation.set(0,0,0),${V}.setZoom(3.2),1)`);await sleep(600);
  const C=`${ex}._model.getObjectByName('cornea').material`,L=`${ex}._model.getObjectByName('lens').material`;
  console.log('light dirs',await js(`JSON.stringify(${V}.scene.children.filter(o=>o.isLight).map(l=>l.type+' pos='+(l.position?[l.position.x,l.position.y,l.position.z].map(v=>+v.toFixed(2)).join(','):'')))`));
  const variants={
    base:'1',
    ccRough:`(${C}.clearcoatRoughness=0.2,${C}.roughness=0.2,1)`,
    ccLow:`(${C}.clearcoatRoughness=0.01,${C}.roughness=0.02,${C}.clearcoat=0.25,1)`,
    specLow:`(${C}.clearcoat=0,${C}.specularIntensity=0.2,${C}.roughness=0.05,1)`,
    lensMatte:`(${C}.clearcoat=1,${C}.clearcoatRoughness=0.01,${L}.clearcoat=0,${L}.roughness=0.6,${L}.envMapIntensity=0,1)`,
  };
  for(const [k,code] of Object.entries(variants)){await js(code);for(let i=0;i<3;i++){await shot(`v_${k}_${i}`);}}
};
