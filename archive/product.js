'use strict';
// A shareable product view, using the same catalog data and local actions.
let activeItem = null, activePhoto = 0, catalogScroll = 0;
const itemRoot = $('#productPage');
const catalogDocumentTitle = document.title;
const placeNames = {US:'США',MX:'Мексика',NL:'Нидерланды',UA:'Украина',ID:'Индонезия',CN:'Китай',SE:'Швеция',CZ:'Чехия',DK:'Дания',DE:'Германия',FR:'Франция',ES:'Испания',IT:'Италия',PT:'Португалия'};
const itemPlace = p => p.own ? p.location : placeNames[p.countryCode] || p.location;
const itemPhotos = p => p.images?.length ? p.images : [p.image];
function itemFavoriteButton(p) {
  const saved = favorites.includes(p.id);
  return `${icon('heart', saved)}<span>${saved ? 'В избранном' : 'В избранное'}</span>`;
}
function relatedItemCard(p) {
  return `<article class="item-related-card"><button data-open-item="${p.id}" class="item-related-image" aria-label="Открыть ${esc(p.brand+' '+p.name)}"><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy"></button><div><strong>${esc(p.brand)}</strong><span>${esc(p.size)}</span></div><button data-open-item="${p.id}" class="item-related-name">${esc(p.name)}</button><p>${money(p.price,p.currency)}${isSold(p) ? '<span>Продано</span>' : ''}</p></article>`;
}
function itemRelated(p) {
  return products.filter(x => x.id !== p.id && !isSold(x)&&isListed(x)).sort((a,b) =>
    ((b.category===p.category)*3+(b.brand===p.brand)*2) - ((a.category===p.category)*3+(a.brand===p.brand)*2)
  ).slice(0,4);
}
function renderItem(p) {
  activeItem = p.id; activePhoto = 0;
  const photos = itemPhotos(p), related = itemRelated(p);
  $('#catalog').hidden = true; itemRoot.hidden = false;
  document.title = `${p.brand} — ${p.name} | ARCHIVE`;
  const measurements = Object.entries(p.measurements || {}).filter(([,v]) => Number(v)>0);
  itemRoot.innerHTML = `
    <nav class="breadcrumb item-breadcrumb" aria-label="Хлебные крошки"><button data-item-back>Каталог</button><span>/</span><button data-item-category="${esc(p.category)}">${esc(p.category)}</button><span>/</span><span>${esc(p.brand)}</span></nav>
    <div class="item-layout">
      <section class="item-gallery" aria-label="Фотографии товара">
        <div class="item-main-photo"><button class="item-photo-open" data-item-zoom aria-label="Увеличить фотографию"><img id="itemImage" src="${esc(photos[0])}" alt="${esc(p.brand+' '+p.name)} — фото 1"></button><span class="item-photo-count" id="itemPhotoCount">1 / ${photos.length}</span>${photos.length>1?'<button class="item-photo-arrow item-prev" data-item-arrow="-1" aria-label="Предыдущее фото"><svg class="gallery-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg></button><button class="item-photo-arrow item-next" data-item-arrow="1" aria-label="Следующее фото"><svg class="gallery-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button>':''}<span class="item-zoom-label" aria-hidden="true">＋ Увеличить</span></div>
        <div class="item-photo-strip" aria-label="Выбор фотографии">${photos.map((url,i)=>`<button data-item-photo="${i}" class="${i===0?'selected':''}" aria-pressed="${i===0}" aria-label="Показать фото ${i+1}"><img src="${esc(url)}" alt="" loading="lazy"></button>`).join('')}</div>
      </section>
      <section class="item-summary" aria-labelledby="itemTitle">
        <div class="item-summary-top"><button class="item-designer" data-item-brand="${esc(p.brand)}">${esc(p.brand)}</button><button class="item-share" data-item-share>Поделиться</button></div>
        <h1 id="itemTitle">${esc(p.name)}</h1>
        <div class="item-size-condition"><span>Размер <strong>${esc(p.size)}</strong></span><span>${esc(p.condition)}</span></div>
        <div class="item-price">${money(p.price,p.currency)}${isSold(p)?'<span class="item-sold">Продано</span>':''}</div>
        <p class="item-shipping-short">${p.shipping ? esc(p.shipping) : 'Стоимость доставки не указана'}</p>
        <div class="item-actions">${isSold(p) ? '<div class="item-unavailable">Это объявление уже продано</div>' : p.sourceUrl ? `<a class="item-primary" href="${esc(p.sourceUrl)}" target="_blank" rel="noopener noreferrer">Посмотреть на ${esc(p.sourcePlatform)} </a>` : `<div class="item-unavailable">${p.status==='hidden'?'Снято с продажи':'Ваше объявление'}</div>`}${p.own?`<button class="item-offer" data-item-edit="${p.id}">Редактировать</button><button class="item-offer" data-item-profile>Мои объявления</button>`:!isSold(p)?`<button class="item-offer" data-item-offer="${p.id}">Предложить цену</button>`:''}<button class="item-save" data-item-save="${p.id}" aria-pressed="${favorites.includes(p.id)}">${itemFavoriteButton(p)}</button></div>
        <p class="item-action-note">${p.sourceUrl?'Покупка и связь с продавцом — на площадке объявления.':'Объявление сохранено в вашем браузере.'} Предложения по цене пока сохраняются только на этом устройстве.</p>
        <div class="item-condition"><strong>Состояние: ${esc(p.condition)}</strong><p>${esc(conditionDescriptions[p.condition] || 'Уточните состояние у продавца.')}</p></div>
        <div class="item-seller"><div class="item-seller-heading"><span class="item-avatar" aria-hidden="true">${esc(p.seller.slice(0,1))}</span><div><small>Продавец</small><button data-item-seller="${esc(p.seller)}">${esc(p.seller)}</button></div><span class="item-seller-place">${esc(itemPlace(p))}</span></div><button class="item-seller-closet" data-item-seller="${esc(p.seller)}">Другие вещи продавца </button></div>
      </section>
      <div class="item-information">
        <section class="item-info-section"><h2>О вещи</h2><dl class="item-facts"><div><dt>Дизайнер</dt><dd>${esc(p.brand)}</dd></div><div><dt>Категория</dt><dd>${esc(p.category)}</dd></div><div><dt>Размер на бирке</dt><dd>${esc(p.size)}</dd></div><div><dt>Раздел</dt><dd>${p.gender==='men'?'Мужское':p.gender==='women'?'Женское':'Унисекс'}</dd></div></dl><h3>Описание продавца</h3><p class="item-description" ${p.description?'data-i18n-ignore':''}>${p.description?esc(p.description):p.sourceUrl?'Описание продавца доступно в исходном объявлении. Перед покупкой уточните посадку и возможные недостатки вещи.':'Продавец пока не добавил описание.'}</p>${!p.description&&p.sourceUrl?`<a class="item-text-link" href="${esc(p.sourceUrl)}" target="_blank" rel="noopener noreferrer">Читать на ${esc(p.sourcePlatform)}</a>`:''}</section>
        <section class="item-info-section"><h2>Замеры</h2>${measurements.length?`<dl class="item-facts">${measurements.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)} см</dd></div>`).join('')}</dl>`:`<p>Замеры не добавлены. ${p.sourceUrl?'Проверьте их в исходном объявлении или уточните у продавца.':'Добавьте замеры, чтобы покупателю было проще выбрать размер.'}</p>`}<p class="item-secondary-note">Размеры разных брендов могут отличаться. Сравните замеры с вещью, которая хорошо на вас сидит.</p></section>
        <details class="item-info-section item-delivery"><summary>Доставка и покупка <span>＋</span></summary><p>Местоположение продавца: ${esc(itemPlace(p))}.</p><p>${p.shipping?esc(p.shipping):'Стоимость, сроки и возможность доставки в вашу страну уточняйте у продавца.'}</p><p>${p.sourceUrl?`Оплата и условия возврата определяются площадкой ${esc(p.sourcePlatform)}.`:'Оплата и отправка сообщений в ARCHIVE пока не подключены.'}</p></details>
        ${p.sourceUrl?`<div class="item-provenance"><span>Объявление ${esc(p.sourcePlatform)} № ${esc(p.sourceId)}</span><span>Данные на ${esc((p.sourceChecked||'').split('-').reverse().join('.'))}</span><a href="${esc(p.sourceUrl)}" target="_blank" rel="noopener noreferrer">Открыть оригинал</a></div>`:''}
      </div>
    </div>
    ${related.length?`<section class="item-related"><div class="item-section-heading"><h2>Вам может понравиться</h2><button data-item-back>К каталогу</button></div><div class="item-related-grid">${related.map(relatedItemCard).join('')}</div></section>`:''}`;
  window.archiveMotion?.product();
}
function detail(id) {
  window.archiveProfile?.leave(false);
  const p = products.find(x=>x.id===id); if(!p)return;
  if(activeItem===null) catalogScroll=window.scrollY;
  if(location.hash!==`#item/${id}`) history.pushState(null,'',`#item/${id}`);
  renderItem(p); window.scrollTo({top:0,behavior:'instant'});
}
function leaveItem(push=true) {
  if(activeItem===null)return;
  activeItem=null; itemRoot.hidden=true; $('#catalog').hidden=false; document.title=catalogDocumentTitle;
  if(push && location.hash!=='#catalog') history.pushState(null,'','#catalog');
}
function backToCatalog() {leaveItem(); window.scrollTo({top:catalogScroll,behavior:'instant'});}
function itemRoute() {
  const match=location.hash.match(/^#item\/(\d+)$/), p=match&&products.find(x=>x.id===Number(match[1]));
  if(p){if(activeItem===null)catalogScroll=window.scrollY;renderItem(p);window.scrollTo({top:0,behavior:'instant'});}
  else {leaveItem(false);if(match){toast('Объявление не найдено.');history.replaceState(null,'','#catalog');}window.scrollTo({top:catalogScroll,behavior:'instant'});}
}
function selectItemPhoto(index) {
  const p=products.find(x=>x.id===activeItem);if(!p)return;
  const photos=itemPhotos(p); activePhoto=(index+photos.length)%photos.length;
  $('#itemImage').src=photos[activePhoto];window.archiveMotion?.photo($('#itemImage'));$('#itemImage').alt=`${p.brand} ${p.name} — фото ${activePhoto+1}`;
  $('#itemPhotoCount').textContent=`${activePhoto+1} / ${photos.length}`;
  $$('[data-item-photo]').forEach(b=>{const selected=Number(b.dataset.itemPhoto)===activePhoto;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
}
function showItemZoom() {
  const p=products.find(x=>x.id===activeItem);if(!p)return;
  const photos=itemPhotos(p);$('#modal').classList.add('image-viewer');
  open(`<div class="item-lightbox"><img id="zoomImage" src="${esc(photos[activePhoto])}" alt="${esc(p.brand+' '+p.name)}"><div class="item-lightbox-controls"><button data-zoom-step="-1" aria-label="Предыдущее фото" ${photos.length===1?'disabled':''}><svg class="gallery-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg></button><span id="zoomCount">${activePhoto+1} / ${photos.length}</span><button data-zoom-step="1" aria-label="Следующее фото" ${photos.length===1?'disabled':''}><svg class="gallery-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button></div></div>`);
}
function zoomStep(step) {
  selectItemPhoto(activePhoto+step);const p=products.find(x=>x.id===activeItem);
  $('#zoomImage').src=itemPhotos(p)[activePhoto];window.archiveMotion?.photo($('#zoomImage'));$('#zoomCount').textContent=`${activePhoto+1} / ${itemPhotos(p).length}`;
}
itemRoot.addEventListener('click',async e=>{
  const button=e.target.closest('button');if(!button)return;
  const d=button.dataset;
  if('itemBack' in d)backToCatalog();
  else if('openItem' in d)detail(Number(d.openItem));
  else if('itemPhoto' in d)selectItemPhoto(Number(d.itemPhoto));
  else if('itemArrow' in d)selectItemPhoto(activePhoto+Number(d.itemArrow));
  else if('itemZoom' in d)showItemZoom();
  else if('itemSave' in d){toggle(Number(d.itemSave));const p=products.find(x=>x.id===activeItem);button.innerHTML=itemFavoriteButton(p);button.setAttribute('aria-pressed',String(favorites.includes(p.id)));}
  else if('itemOffer' in d)offer(Number(d.itemOffer));
  else if('itemEdit' in d)sell(Number(d.itemEdit));
  else if('itemProfile' in d)window.archiveProfile?.open('listings');
  else if('itemSeller' in d){leaveItem();reset(false);state.seller=d.itemSeller;render();jump();}
  else if('itemCategory' in d){leaveItem();reset(false);state.category=d.itemCategory;render();jump();}
  else if('itemBrand' in d){leaveItem();reset(false);state.brands=[d.itemBrand];render();jump();}
  else if('itemShare' in d){try{await navigator.clipboard.writeText(location.href);toast('Ссылка на вещь скопирована.');}catch{open(`<h2 class="modal-title">Ссылка на вещь</h2><label class="field">Скопируйте ссылку<input readonly value="${esc(location.href)}" id="shareUrl"></label>`);$('#shareUrl').select();}}
});
$('#modalContent').addEventListener('click',e=>{const b=e.target.closest('[data-zoom-step]');if(b)zoomStep(Number(b.dataset.zoomStep));});
$('#modal').addEventListener('close',()=>$('#modal').classList.remove('image-viewer'));
document.addEventListener('keydown',e=>{if(!$('#modal').classList.contains('image-viewer')||!$('#modal').open)return;if(e.key==='ArrowRight'){e.preventDefault();zoomStep(1);}if(e.key==='ArrowLeft'){e.preventDefault();zoomStep(-1);}});
document.addEventListener('click',e=>{if(e.target.closest('#home,#wishlist,#footerFavorites,[data-gender],[data-edit],[data-nav-category]'))leaveItem();},true);
$('#search').addEventListener('input',()=>leaveItem());
$('#searchForm').addEventListener('submit',()=>leaveItem());
window.addEventListener('popstate',itemRoute);
window.addEventListener('hashchange',itemRoute);
itemRoute();
