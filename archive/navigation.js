'use strict';
const departmentPanel=$('#departmentPopover');
let openDepartment=null,departmentCloseTimer;
const departmentGroups=[
  {title:'Верх',items:['Футболки','Лонгсливы','Худи и свитшоты','Рубашки','Трикотаж']},
  {title:'Одежда',items:['Брюки и джинсы','Верхняя одежда']},
  {title:'Обувь и аксессуары',items:['Обувь','Аксессуары']}
];
function syncDepartment() {
  $$('[data-department-toggle]').forEach(button=>button.setAttribute('aria-expanded',String(button.dataset.departmentToggle===openDepartment)));
  $$('[data-department-category]').forEach(button=>{
    const active=state.gender===openDepartment&&state.category===button.dataset.departmentCategory&&!state.archive&&!state.saved;
    button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));
  });
}
function closeDepartment(restoreFocus=false) {
  clearTimeout(departmentCloseTimer);
  const previous=openDepartment;openDepartment=null;departmentPanel.hidden=true;syncDepartment();
  if(restoreFocus&&previous)$(`[data-department-toggle="${previous}"]`)?.focus();
}
function showDepartment(gender,focusFirst=false) {
  if(!['men','women','unisex'].includes(gender))return;
  clearTimeout(departmentCloseTimer);
  if(openDepartment!==gender||departmentPanel.hidden){
    openDepartment=gender;
    const label=departmentNames[gender];
    const count=products.filter(p=>isListed(p)&&matchesDepartment(p,gender)).length;
    departmentPanel.innerHTML=`<div class="department-panel-inner wrap"><div class="department-heading"><h2 id="departmentTitle">${label}</h2><button data-close-department aria-label="Закрыть категории">✕</button></div><div class="department-columns">${departmentGroups.map(group=>`<section><h3>${esc(group.title)}</h3>${group.items.map(category=>`<button data-department-category="${esc(category)}" aria-pressed="false">${esc(category)}</button>`).join('')}</section>`).join('')}</div><button class="department-all" data-department-category="all" aria-pressed="false">Все вещи в разделе <span>${count}</span></button></div>`;
    departmentPanel.hidden=false;syncDepartment();
  }
  if(focusFirst)departmentPanel.querySelector('[data-department-category]')?.focus({preventScroll:true});
}
function chooseDepartmentCategory(gender,category) {
  if(!['men','women','unisex'].includes(gender)||(category!=='all'&&!categories.includes(category)))return;
  window.archiveProfile?.leave(false);if(typeof leaveItem==='function')leaveItem();
  reset(false);state.gender=gender;state.category=category;render();closeDepartment();jump();
}
function scheduleDepartmentClose(){clearTimeout(departmentCloseTimer);departmentCloseTimer=setTimeout(()=>closeDepartment(),160);}
$$('[data-department]').forEach(group=>{
  const gender=group.dataset.department;
  group.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch'&&window.matchMedia('(hover: hover) and (pointer: fine)').matches)showDepartment(gender);});
  group.addEventListener('pointerleave',()=>{if(!group.contains(document.activeElement)&&!departmentPanel.contains(document.activeElement))scheduleDepartmentClose();});
  group.addEventListener('keydown',e=>{
    if(e.key==='ArrowDown'){e.preventDefault();showDepartment(gender,true);}
    if(e.key==='Escape'&&openDepartment){e.preventDefault();closeDepartment(true);}
  });
});
$$('[data-department-toggle]').forEach(button=>button.onclick=()=>{
  const gender=button.dataset.departmentToggle;
  if(openDepartment===gender)closeDepartment();else showDepartment(gender,true);
});
departmentPanel.addEventListener('pointerenter',()=>clearTimeout(departmentCloseTimer));
departmentPanel.addEventListener('pointerleave',()=>{if(!departmentPanel.contains(document.activeElement))scheduleDepartmentClose();});
departmentPanel.addEventListener('click',e=>{
  const category=e.target.closest('[data-department-category]');
  if(category){chooseDepartmentCategory(openDepartment,category.dataset.departmentCategory);return;}
  if(e.target.closest('[data-close-department]'))closeDepartment(true);
});
departmentPanel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeDepartment(true);}});
document.addEventListener('pointerdown',e=>{if(openDepartment&&!e.target.closest('[data-department],#departmentPopover'))closeDepartment();});
document.addEventListener('focusin',e=>{if(openDepartment&&!e.target.closest('[data-department],#departmentPopover'))closeDepartment();});
document.addEventListener('click',e=>{if(e.target.closest('.main-nav [data-gender],.main-nav [data-edit],.main-nav [data-nav-category]'))closeDepartment();});
window.addEventListener('resize',()=>closeDepartment());
window.archiveDepartments={sync:syncDepartment};
