'use strict';
const profileRoot=$('#profilePage');
let profileActive=false,profileTab='listings',profileListingStatus='active';
const profileTabs={listings:'Мои объявления',favorites:'Избранное',offers:'Предложения',searches:'Сохранённые поиски',settings:'Настройки'};
const ownStatus=p=>p.status||'active';
function profileEmpty(title,text,action='sell') {
  return `<div class="profile-empty"><h2>${title}</h2><p>${text}</p><button class="profile-primary" ${action==='sell'?'data-profile-sell':'data-profile-catalog'}>${action==='sell'?'Добавить вещь':'Открыть каталог'}</button></div>`;
}
function profileListing(p) {
  const status=ownStatus(p),labels={active:'В продаже',sold:'Продано',hidden:'Снято с продажи'};
  return `<article class="profile-listing"><button data-profile-item="${p.id}" class="profile-listing-photo" aria-label="Открыть ${esc(p.name)}"><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy"></button><div class="profile-listing-info"><div class="profile-listing-top"><span class="profile-status">${labels[status]||labels.active}</span><strong>${money(p.price,p.currency)}</strong></div><p class="profile-listing-brand">${esc(p.brand)}</p><button class="profile-listing-name" data-profile-item="${p.id}">${esc(p.name)}</button><p class="profile-listing-meta">Размер ${esc(p.size)} · ${esc(p.condition)}</p><div class="profile-listing-actions"><button data-profile-edit="${p.id}">Редактировать</button>${status==='active'?`<button data-listing-status="sold" data-listing-id="${p.id}">Отметить проданным</button><button data-listing-status="hidden" data-listing-id="${p.id}">Снять с продажи</button>`:`<button data-listing-status="active" data-listing-id="${p.id}">Вернуть в продажу</button>`}</div></div></article>`;
}
function profileContent() {
  if(profileTab==='listings') {
    const list=custom.filter(p=>ownStatus(p)===profileListingStatus);
    return `<div class="profile-section-heading"><h1 id="profileHeading" tabindex="-1">Мои объявления</h1><button class="profile-primary" data-profile-sell>Добавить вещь</button></div><div class="profile-status-tabs" role="group" aria-label="Статус объявлений">${Object.entries({active:'В продаже',sold:'Продано',hidden:'Скрыто'}).map(([status,label])=>`<button data-profile-status="${status}" aria-pressed="${status===profileListingStatus}" class="${status===profileListingStatus?'selected':''}">${label}<span>${custom.filter(p=>ownStatus(p)===status).length}</span></button>`).join('')}</div>${list.length?`<div class="profile-listings">${list.map(profileListing).join('')}</div>`:profileEmpty(profileListingStatus==='active'?'Пока нет вещей в продаже':profileListingStatus==='sold'?'Пока нет проданных вещей':'Нет скрытых объявлений',profileListingStatus==='active'?'Добавленные вами вещи появятся здесь.':profileListingStatus==='sold'?'Отмеченные проданными объявления будут в этом разделе.':'Здесь будут вещи, которые вы сняли с продажи.')}`;
  }
  if(profileTab==='favorites') {
    const list=products.filter(p=>favorites.includes(p.id));
    return `<div class="profile-section-heading"><h1 id="profileHeading" tabindex="-1">Избранное</h1><span>${list.length} вещей</span></div>${list.length?`<div class="profile-favorites">${list.map(p=>`<div class="profile-favorite">${relatedItemCard(p)}<button class="profile-remove-favorite" data-profile-heart="${p.id}">Убрать из избранного</button></div>`).join('')}</div>`:profileEmpty('Пока ничего не сохранено','Нажмите на сердце у понравившейся вещи.','catalog')}`;
  }
  if(profileTab==='offers') {
    const list=read('offers',[]).slice().reverse();
    return `<div class="profile-section-heading"><h1 id="profileHeading" tabindex="-1">Предложения</h1><span>${list.length}</span></div><p class="profile-section-note">Здесь ваши предложения по цене. Они сохранены на устройстве и не отправлены продавцам.</p>${list.length?`<div class="profile-offers">${list.map(o=>`<article class="profile-offer"><div><button data-profile-item="${o.product}">${esc(o.name)}</button><time>${new Date(o.date).toLocaleDateString('ru-RU')}</time>${o.message?`<p data-i18n-ignore>${esc(o.message)}</p>`:''}</div><strong>${money(o.amount,o.currency)}</strong></article>`).join('')}</div>`:profileEmpty('Предложений пока нет','Предложить свою цену можно на странице вещи.','catalog')}`;
  }
  if(profileTab==='searches') {
    const list=read('searches',[]);
    return `<div class="profile-section-heading"><h1 id="profileHeading" tabindex="-1">Сохранённые поиски</h1><span>${list.length}</span></div>${list.length?list.map((item,i)=>`<button class="profile-saved-search" data-profile-search="${i}"><span>${esc(item.name)}</span><span>Открыть</span></button>`).join(''):profileEmpty('Сохранённых поисков пока нет','Настройте фильтры в каталоге и нажмите «Сохранить поиск».','catalog')}`;
  }
  const data=read('profile',{});
  return `<div class="profile-section-heading"><h1 id="profileHeading" tabindex="-1">Настройки профиля</h1></div><form id="profileSettings" class="profile-settings"><label class="field">Имя профиля<input name="name" required maxlength="40" value="${esc(data.name||'')}" placeholder="Как вас зовут"></label><label class="field">Город<input name="location" maxlength="70" value="${esc(data.location||'')}" placeholder="Город"></label><label class="field">О себе <span class="optional">необязательно</span><textarea name="bio" maxlength="240" placeholder="Несколько слов о себе">${esc(data.bio||'')}</textarea></label><label class="field">Язык интерфейса<select data-language-select data-i18n-ignore aria-label="Язык интерфейса"><option value="ru">Русский</option><option value="en">English</option></select><small class="profile-language-help">Применяется сразу.</small></label><p id="profileSettingsError" class="form-error" role="alert" hidden></p><button class="profile-primary" type="submit">Сохранить изменения</button><p class="profile-section-note">Профиль и объявления хранятся в этом браузере. Вход и синхронизация между устройствами пока не подключены.</p></form>`;
}
function renderProfile() {
  const data=read('profile',{}),name=data.name||'my.archive';
  $('#catalog').hidden=true;$('#productPage').hidden=true;profileRoot.hidden=false;
  document.title=`${profileTabs[profileTab]} | ARCHIVE`;
  profileRoot.innerHTML=`<div class="breadcrumb"><button data-profile-catalog>Каталог</button><span>/</span><span>Мой профиль</span></div><div class="profile-banner"><div class="profile-avatar" aria-hidden="true">${esc(name.slice(0,1).toUpperCase())}</div><div><h2>${esc(name)}</h2>${data.location?`<p>${esc(data.location)}</p>`:''}${data.bio?`<p class="profile-bio">${esc(data.bio)}</p>`:''}</div><button class="profile-edit" data-profile-tab="settings">Редактировать профиль</button></div><div class="profile-layout"><nav class="profile-nav" aria-label="Разделы профиля">${Object.entries(profileTabs).map(([tab,label])=>`<button data-profile-tab="${tab}" class="${tab===profileTab?'active':''}" ${tab===profileTab?'aria-current="page"':''}>${label}${tab==='listings'?`<span>${custom.length}</span>`:tab==='favorites'?`<span>${favorites.length}</span>`:''}</button>`).join('')}</nav><section class="profile-content">${profileContent()}</section></div><p class="profile-device-note">Личный профиль на этом устройстве</p>`;
  $('#wishlist').setAttribute('aria-pressed',String(profileTab==='favorites'));
  if(profileTab==='settings')$('#profileSettings').onsubmit=saveProfileSettings;
  window.archiveMotion?.profile();
}
function openProfile(tab='listings',status='active',push=true) {
  if(!profileTabs[tab])tab='listings';
  if(typeof closeDepartment==='function')closeDepartment();
  leaveItem(false);profileActive=true;profileTab=tab;profileListingStatus=['active','sold','hidden'].includes(status)?status:'active';
  const hash='#profile/'+tab;if(push&&location.hash!==hash)history.pushState(null,'',hash);
  renderProfile();window.scrollTo({top:0,behavior:'instant'});$('#profileHeading')?.focus({preventScroll:true});
}
function leaveProfile(push=true) {
  if(!profileActive)return;
  profileActive=false;profileRoot.hidden=true;
  if(activeItem===null){$('#catalog').hidden=false;document.title=catalogDocumentTitle;}
  if(push&&location.hash!=='#catalog')history.pushState(null,'','#catalog');
}
function profileRoute() {
  const match=location.hash.match(/^#profile(?:\/([^/]+))?$/);
  if(match)openProfile(match[1]||'listings','active',false);else leaveProfile(false);
}
function updateOwnStatus(id,status) {
  if(!['active','sold','hidden'].includes(status)||!custom.some(p=>p.id===id))return;
  const next=custom.map(p=>p.id===id?{...p,status}:p);
  if(write('listings',next)){custom=next;products=[...custom,...seed];render();profileListingStatus=status;renderProfile();toast(status==='active'?'Вещь снова в продаже.':status==='sold'?'Вещь отмечена проданной.':'Объявление снято с продажи.');}
}
function restoreProfileSearch(index) {
  const item=read('searches',[])[index];if(!item)return;
  leaveProfile();state={...freshState(),...item.state};state.conditions=state.conditions.map(normalizeCondition);
  $('#search').value=item.query;$('#minPrice').value=state.min??'';$('#maxPrice').value=state.max??'';$('#priceCurrency').value=state.priceCurrency||'USD';render();jump();
}
function saveProfileSettings(e) {
  e.preventDefault();const fd=new FormData(e.target),name=fd.get('name').trim();
  if(!name){fieldError($('#profileSettingsError'),'Введите имя профиля.');return;}
  const updated={...read('profile',{}),name,location:fd.get('location').trim(),bio:fd.get('bio').trim()},next=custom.map(p=>({...p,seller:name}));
  const previousProfile=localStorage.getItem('archive-profile'),previousListings=localStorage.getItem('archive-listings');
  try {localStorage.setItem('archive-listings',JSON.stringify(next));localStorage.setItem('archive-profile',JSON.stringify(updated));}
  catch {try{previousProfile===null?localStorage.removeItem('archive-profile'):localStorage.setItem('archive-profile',previousProfile);previousListings===null?localStorage.removeItem('archive-listings'):localStorage.setItem('archive-listings',previousListings);}catch{}fieldError($('#profileSettingsError'),'Не удалось сохранить изменения. Проверьте доступное место в браузере.');return;}
  custom=next;products=[...custom,...seed];render();renderProfile();toast('Профиль обновлён.');
}
profileRoot.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;const d=b.dataset;
  if('profileTab'in d)openProfile(d.profileTab);
  else if('profileStatus'in d){profileListingStatus=d.profileStatus;renderProfile();}
  else if('profileSell'in d)sell();
  else if('profileEdit'in d)sell(Number(d.profileEdit));
  else if('profileItem'in d||'openItem'in d)detail(Number(d.profileItem||d.openItem));
  else if('listingStatus'in d)updateOwnStatus(Number(d.listingId),d.listingStatus);
  else if('profileHeart'in d){toggle(Number(d.profileHeart));renderProfile();}
  else if('profileSearch'in d)restoreProfileSearch(Number(d.profileSearch));
  else if('profileCatalog'in d){leaveProfile();reset();jump();}
});
$('#account').classList.add('profile-trigger');$('#account').innerHTML=icon('user')+'<span>Профиль</span>';$('#account').onclick=()=>openProfile();$('#footerMyListings').onclick=()=>openProfile();
$('#wishlist').onclick=()=>openProfile('favorites');$('#footerFavorites').onclick=()=>openProfile('favorites');
document.addEventListener('click',e=>{if(e.target.closest('#home,.main-nav [data-gender]'))leaveProfile();},true);
$('#search').addEventListener('input',()=>leaveProfile());$('#searchForm').addEventListener('submit',()=>leaveProfile());
window.addEventListener('popstate',profileRoute);window.addEventListener('hashchange',profileRoute);
window.archiveProfile={open:openProfile,leave:leaveProfile};profileRoute();
