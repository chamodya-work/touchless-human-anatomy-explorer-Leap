module.exports=async({js,shot,sleep,logs})=>{
  const alive=()=>js(`(window.dispatchEvent(new MouseEvent('mousemove',{clientX:300,clientY:300})),1)`);
  await sleep(2000);await js(`(window.__anatomyApp._enterMenu(),1)`);await sleep(1200);
  await js(`(document.querySelector('.menu-btn[data-system=eye]').click(),1)`);await sleep(5000);
  const V=`window.__anatomyApp.viewer`,ex=`window.__anatomyApp.currentExplorer`;
  const frames=()=>js(`(()=>{window.__f=window.__f||0;return ${V}._frameCount+':'+${V}.fps})()`);
  await alive();
  const t0=Date.now();await js(`(document.querySelector('#eye-tears').click(),1)`);console.log('click returned after',Date.now()-t0,'ms');
  for(const w of [500,1500,3000,6000]){await sleep(w);await alive();const t=Date.now();const f=await frames();console.log('t+',w,'frames/fps',f,'roundtrip',Date.now()-t,'ms');}
  await shot('z_tears_late');
  console.log('tears vis/op',await js(`(()=>{const p=${ex}._rig.tears.points;return p.visible+' '+p.material.opacity.toFixed(2)})()`));
  console.log('LOGS',JSON.stringify(logs.slice(0,3)));
};
