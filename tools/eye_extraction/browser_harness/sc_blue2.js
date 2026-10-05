module.exports=async({js,shot,sleep,logs})=>{
  await sleep(2000);await js(`(window.__anatomyApp._enterMenu(),1)`);await sleep(1200);
  await js(`(document.querySelector('.menu-btn[data-system=eye]').click(),1)`);await sleep(5000);
  const V=`window.__anatomyApp.viewer`,ex=`window.__anatomyApp.currentExplorer`;
  await js(`(${V}.autoRotate=false,${V}.modelRoot.rotation.set(0,0,0),${V}.setZoom(3.2),1)`);await sleep(600);
  const c=`${ex}._model.getObjectByName('cornea').material`;
  console.log('cornea props',await js(`JSON.stringify({env:${c}.envMapIntensity,cc:${c}.clearcoat,rough:${c}.roughness,spec:${c}.specularIntensity,emis:${c}.emissive.getHex(),ei:${c}.emissiveIntensity,hasEnv:!!${c}.envMap,sceneEnv:!!${V}.scene.environment,lights:${V}.scene.children.filter(o=>o.isLight).map(l=>l.type+':'+l.color.getHexString()+':'+l.intensity)})`));
  const variants={base:'1',noEnv:`(${c}.envMapIntensity=0,1)`,noClear:`(${c}.clearcoat=0,1)`,noSpec:`(${c}.specularIntensity=0,${c}.clearcoat=0,1)`};
  for(const [k,code] of Object.entries(variants)){await js(code);await shot('b_'+k);}
};
