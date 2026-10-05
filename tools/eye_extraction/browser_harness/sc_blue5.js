module.exports=async({js,shot,sleep,logs})=>{
  const alive=()=>js(`(window.dispatchEvent(new MouseEvent('mousemove',{clientX:300,clientY:300})),1)`);
  await sleep(2000);await js(`(window.__anatomyApp._enterMenu(),1)`);await sleep(1200);
  await js(`(document.querySelector('.menu-btn[data-system=eye]').click(),1)`);await sleep(5500);
  const V=`window.__anatomyApp.viewer`,ex=`window.__anatomyApp.currentExplorer`;
  await js(`(${V}.autoRotate=false,${V}.modelRoot.rotation.set(0,0,0),${V}.setZoom(3.2),1)`);await sleep(800);
  const pos=await js(`(()=>{const v=${V}.camera.position.clone().set(-0.0006,0.00045,0.0098);${ex}._model.localToWorld(v);v.project(${V}.camera);return JSON.stringify([(v.x+1)/2*window.innerWidth,(1-v.y)/2*window.innerHeight])})()`);
  console.log('pupil px',pos);
  const g=n=>`${ex}._model.getObjectByName('${n}')`;
  const C=`${g('cornea')}.material`,L=`${g('lens')}.material`;
  const variants={base:'1',noEnv:`(${C}.envMapIntensity=0,1)`,noClear:`(${C}.clearcoat=0,1)`,restore_noCornea:`(${C}.clearcoat=1,${g('cornea')}.visible=false,1)`,corneaOn_lensHidden:`(${g('cornea')}.visible=true,${g('lens')}.visible=false,1)`};
  for(const [k,code] of Object.entries(variants)){await alive();await js(code);await alive();await shot('w_'+k);await alive();}
  console.log('cornea state',await js(`JSON.stringify({env:${C}.envMapIntensity,cc:${C}.clearcoat,blend:${C}.blending,op:${C}.opacity,col:${C}.color.getHexString()})`));
};
