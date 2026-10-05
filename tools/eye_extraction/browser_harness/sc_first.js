module.exports=async({js,shot,sleep})=>{
  await sleep(2500);await shot('01_welcome');
  console.log('app',await js('typeof window.__anatomyApp'));
  await js(`window.__anatomyApp._enterMenu()`);await sleep(1500);await shot('02_menu');
  console.log('menu btns',await js(`[...document.querySelectorAll('.menu-btn')].map(b=>b.dataset.system).join(',')`));
  await js(`document.querySelector('.menu-btn[data-system=eye]').click()`);await sleep(4500);await shot('03_eye');
};
