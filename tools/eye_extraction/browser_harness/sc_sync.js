module.exports=async({js:rawjs,shot,sleep,logs})=>{
  const js=c=>rawjs(c);
  const alive=()=>js(`(window.dispatchEvent(new MouseEvent('mousemove',{clientX:300,clientY:300})),1)`);
  await sleep(2000);await js(`(window.__anatomyApp._enterMenu(),1)`);await sleep(1200);
  await js(`(document.querySelector('.menu-btn[data-system=eye]').click(),1)`);await sleep(5000);
  const ex=`window.__anatomyApp.currentExplorer`;
  const dump=tag=>js(`JSON.stringify({a:${ex}._active,btn:[...document.querySelectorAll('.eye-toggles .mode-toggle--active')].map(b=>b.id),txt:document.querySelector('#eye-explainer').textContent.slice(0,30)})`).then(r=>console.log(tag,r));
  const click=async id=>{await alive();await js(`(document.querySelector('#${id}').click(),1)`)};
  const tick=async n=>{await alive();await js(`(()=>{for(let i=0;i<${n};i++)${ex}._tick(0.05);return 1})()`)};
  await click('eye-gaze');await tick(20);await sleep(1200);await dump('gaze on');await shot('y1');
  await click('eye-gaze');await tick(20);await dump('gaze off (immediately)');
  await click('eye-tears');await tick(40);await dump('tears on (immediately)');
  await sleep(1500);await dump('tears on (+1.5 s)');await shot('y2');
  console.log('LOGS',JSON.stringify(logs.slice(0,3)));
};
