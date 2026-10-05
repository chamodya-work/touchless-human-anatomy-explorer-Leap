module.exports=async({js,shot,sleep,logs})=>{
  const alive=()=>js(`window.dispatchEvent(new MouseEvent('mousemove',{clientX:300,clientY:300}))`);
  await sleep(2000);await js(`window.__anatomyApp._enterMenu()`);await sleep(1200);
  await js(`document.querySelector('.menu-btn[data-system=eye]').click()`);await sleep(5000);
  const ex=`window.__anatomyApp.currentExplorer`;
  const dump=async tag=>console.log(tag,await js(`JSON.stringify({active:${ex}._active,order:${ex}._order,btns:[...document.querySelectorAll('.eye-toggles .mode-toggle')].map(b=>b.id.replace('eye-','')+(b.classList.contains('mode-toggle--active')?'*':'')).join(','),text:document.querySelector('#eye-explainer').textContent.slice(0,40)})`));
  const click=async id=>{await alive();await js(`document.querySelector('#${id}').click()`)};
  await dump('start');
  await click('eye-gaze');await js(`(()=>{for(let i=0;i<30;i++)${ex}._tick(0.05)})()`);await dump('gaze on');
  await click('eye-gaze');await js(`(()=>{for(let i=0;i<30;i++)${ex}._tick(0.05)})()`);await dump('gaze off');
  await click('eye-tears');await js(`(()=>{for(let i=0;i<30;i++)${ex}._tick(0.05)})()`);await dump('tears on');
  await sleep(1500);await dump('tears on +1.5s');
  console.log('LOGS',JSON.stringify(logs.slice(0,3)));
};
