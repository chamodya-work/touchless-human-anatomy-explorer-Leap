module.exports=async({js,shot,sleep,logs})=>{
  await sleep(2000);await js(`(window.__anatomyApp._enterMenu(),1)`);await sleep(1200);
  await js(`(document.querySelector('.menu-btn[data-system=eye]').click(),1)`);await sleep(5000);
  const V=`window.__anatomyApp.viewer`,ex=`window.__anatomyApp.currentExplorer`;
  await js(`(${V}.autoRotate=false,${V}.modelRoot.rotation.set(0,0,0),${V}.setZoom(3.2),1)`);await sleep(600);
  const get=n=>`${ex}._model.getObjectByName('${n}')`;
  const variants={
    base:'1',
    noCornea:`(${get('cornea')}.visible=false,1)`,
    lensNoClearcoat:`(${get('cornea')}.visible=true,${get('lens')}.material.clearcoat=0,${get('lens')}.material.envMapIntensity=0,1)`,
    lensHidden:`(${get('lens')}.visible=false,1)`,
    vitHidden:`(${get('vitreous_body')}.visible=false,1)`,
  };
  for(const [k,code] of Object.entries(variants)){await js(code);await shot('b_'+k);}
  console.log('LOGS',JSON.stringify(logs.slice(0,3)));
};
