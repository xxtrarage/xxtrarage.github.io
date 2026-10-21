'use strict';
const photoLimit = 20 * 1024 * 1024;
function fieldError(node, message) {
  node.textContent=message; node.hidden=!message;
}
function wholePrice(value) {
  const text=String(value).trim();
  return /^\d+$/.test(text) && Number.isSafeInteger(Number(text)) && Number(text)>=1 && Number(text)<=100000 ? Number(text) : null;
}
function offerPrice(price, percent) {return Math.max(1,Math.round(price*(100-percent)/100));}
function offer(id) {
  const p=products.find(x=>x.id===id);if(!p||isSold(p)||p.own)return;
  open(`<h2 class="modal-title">Предложить цену</h2><p class="offer-item-brand">${esc(p.brand)}</p><p class="modal-sub" data-i18n-ignore>${esc(p.name)}</p><div class="offer-current">Цена продавца <strong>${money(p.price,p.currency)}</strong></div>
    <form id="offerForm" novalidate><label class="field offer-amount-label" for="offerAmount">Ваше предложение</label><div class="amount-control"><input id="offerAmount" name="amount" type="text" inputmode="numeric" autocomplete="off" maxlength="6" placeholder="${offerPrice(p.price,10)}" aria-describedby="offerPriceHelp offerAmountError"><span>${p.currency==='USD'?'$':'€'}</span></div>
    <div class="offer-discounts" role="group" aria-label="Снизить цену продавца">${[5,10,20].map(n=>`<button type="button" data-discount="${n}" aria-pressed="false">−${n}%</button>`).join('')}</div><p id="offerPriceHelp" class="field-help">Целая сумма, без центов.</p><p id="offerAmountError" class="form-error" role="alert" hidden></p>
    <label class="field offer-comment">Комментарий <span class="optional">необязательно</span><textarea name="message" maxlength="500" rows="3" placeholder="Вопрос о размере или состоянии"></textarea></label><p id="offerError" class="form-error" role="alert" hidden></p><button class="outline form-primary" type="submit">Сохранить предложение</button><p class="note">Демонстрация: предложение сохранится на этом устройстве и не будет отправлено продавцу.</p></form>`);
  $('#modal').classList.add('offer-dialog');
  const input=$('#offerAmount'),error=$('#offerAmountError');
  $('#offerForm').addEventListener('click',e=>{
    const b=e.target.closest('[data-discount]');if(!b)return;
    input.value=String(offerPrice(p.price,Number(b.dataset.discount)));
    $$('[data-discount]').forEach(node=>node.setAttribute('aria-pressed',String(node===b)));
    input.setAttribute('aria-invalid','false');fieldError(error,'');input.focus();
  });
  input.oninput=()=>{fieldError(error,'');input.setAttribute('aria-invalid','false');$$('[data-discount]').forEach(b=>b.setAttribute('aria-pressed','false'));};
  $('#offerForm').onsubmit=e=>{
    e.preventDefault();const amount=wholePrice(input.value);
    if(amount===null){fieldError(error,'Введите целую сумму от 1 до 100 000.');input.setAttribute('aria-invalid','true');input.focus();return;}
    const fd=new FormData(e.target),arr=read('offers',[]);
    arr.push({product:p.id,name:p.name,amount,message:fd.get('message').trim(),currency:p.currency||'EUR',date:new Date().toISOString()});
    if(write('offers',arr,message=>fieldError($('#offerError'),message))){$('#modal').close();toast('Предложение сохранено. Отправка продавцу пока не подключена.');}
  };
}
function suggestedBrands(value) {
  const q=normalizeBrand(value);
  return brandDirectory.filter(b=>b.slug!=='vintage'&&(!q||[b.name,...(b.aliases||[])].some(name=>normalizeBrand(name).includes(q))))
    .sort((a,b)=>Number(normalizeBrand(b.name).startsWith(q))-Number(normalizeBrand(a.name).startsWith(q))||a.name.localeCompare(b.name,'en'));
}
function setupBrandPicker(onChoose=()=>{}) {
  const input=$('#listingBrand'),list=$('#brandSuggestions');let choices=[],active=-1;
  const close=()=>{list.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');active=-1;};
  const choose=name=>{input.value=name;fieldError($('#brandError'),'');input.setAttribute('aria-invalid','false');input.focus();close();onChoose();};
  function show(){
    choices=suggestedBrands(input.value);active=-1;
    list.scrollTop=0;
    $('#brandHelp').textContent=input.value.trim()?`Найдено брендов: ${choices.length}.`:`Все ${choices.length} брендов. Список можно прокрутить.`;
    list.innerHTML=choices.length?choices.map((b,i)=>`<button type="button" role="option" aria-selected="false" id="brandChoice${i}" data-brand-choice="${esc(b.name)}">${esc(b.name)}</button>`).join(''):'<p class="brand-suggestion-empty">Бренд не найден. Проверьте название.</p>';
    list.hidden=false;input.setAttribute('aria-expanded','true');input.removeAttribute('aria-activedescendant');
  }
  input.oninput=()=>{fieldError($('#brandError'),'');input.setAttribute('aria-invalid','false');show();};input.onfocus=show;
  input.onblur=e=>{if(!e.relatedTarget?.closest('#brandSuggestions'))close();};
  $('#listingForm').addEventListener('focusin',e=>{if(!e.target.closest('.brand-picker'))close();});
  $('#listingForm').addEventListener('click',e=>{if(!e.target.closest('.brand-picker'))close();});
  list.onclick=e=>{const b=e.target.closest('[data-brand-choice]');if(b)choose(b.dataset.brandChoice);};
  input.onkeydown=e=>{
    if(e.key==='Escape'&&!list.hidden){e.preventDefault();e.stopPropagation();close();return;}
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){
      e.preventDefault();if(list.hidden)show();if(!choices.length)return;
      active=active<0?(e.key==='ArrowDown'?0:choices.length-1):(active+(e.key==='ArrowDown'?1:-1)+choices.length)%choices.length;
      [...list.querySelectorAll('[role="option"]')].forEach((b,i)=>b.setAttribute('aria-selected',String(i===active)));
      input.setAttribute('aria-activedescendant','brandChoice'+active);$('#brandChoice'+active)?.scrollIntoView({block:'nearest'});
    }else if(e.key==='Enter'&&!list.hidden&&choices.length){e.preventDefault();choose(choices[Math.max(0,active)].name);}
  };
}
async function preparePhoto(file) {
  if(!file||!file.size)throw new Error('Добавьте фотографию вещи.');
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Выберите фотографию в формате JPG, PNG или WebP.');
  if(file.size>photoLimit)throw new Error('Файл больше 20 МБ. Выберите фотографию поменьше.');
  const url=URL.createObjectURL(file);
  try {
    const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('Не удалось открыть фото. Попробуйте другой файл.'));img.src=url;});
    if(!image.naturalWidth||!image.naturalHeight)throw new Error('Не удалось прочитать размеры фотографии.');
    const canvas=document.createElement('canvas'),ratio=Math.min(1,1600/Math.max(image.naturalWidth,image.naturalHeight));
    canvas.width=Math.max(1,Math.round(image.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(image.naturalHeight*ratio));
    const context=canvas.getContext('2d');if(!context)throw new Error('Не удалось обработать фото. Попробуйте ещё раз.');
    context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
    let result=canvas.toDataURL('image/jpeg',.84);
    for(const quality of [.72,.6,.48]){if(result.length<=750000)break;result=canvas.toDataURL('image/jpeg',quality);}
    if(result.length>1000000)throw new Error('Не удалось уменьшить фото. Попробуйте другой файл.');
    return result;
  } finally {URL.revokeObjectURL(url);}
}
function listingReady(values,hasPhoto,processing=false) {
  const brand=brandEntry(values.brand||'');
  return Boolean(hasPhoto&&!processing&&brand&&brand.slug!=='vintage'&&
    ['name','location','description'].every(name=>String(values[name]||'').trim())&&
    wholePrice(values.price)!==null&&categories.includes(values.category)&&conditions.includes(values.condition)&&
    ['men','women','unisex'].includes(values.gender)&&['EUR','USD'].includes(values.currency)&&values.size);
}
function sell(editId=null) {
  const existing=typeof editId==='number'?custom.find(p=>p.id===editId):null;
  if(typeof editId==='number'&&!existing)return;
  const requiredMark='<span class="required-mark" aria-hidden="true">*</span>';
  open(`<h2 class="modal-title">${existing?'Редактировать объявление':'Новое объявление'}</h2><p class="modal-sub">Добавьте фотографию, описание и цену.</p><p class="required-note">* — обязательные поля</p><form id="listingForm" class="form-grid">
    <div class="field brand-picker"><label for="listingBrand">Марка / дизайнер${requiredMark}</label><input id="listingBrand" name="brand" maxlength="60" placeholder="Начните вводить название" role="combobox" aria-autocomplete="list" aria-controls="brandSuggestions" aria-expanded="false" aria-describedby="brandHelp brandError" autocomplete="off" required><div id="brandSuggestions" class="brand-suggestions" role="listbox" aria-label="Бренды одежды" hidden></div><small id="brandHelp" class="field-help">Выберите бренд из подсказок.</small><p id="brandError" class="form-error" role="alert" hidden></p></div>
    <label class="field">Название вещи${requiredMark}<input name="name" maxlength="90" placeholder="Свободная хлопковая рубашка" required></label>
    <label class="field">Категория${requiredMark}<select name="category" required>${categories.map(v=>`<option>${v}</option>`).join('')}</select></label><label class="field">Раздел${requiredMark}<select name="gender" required><option value="unisex">Унисекс</option><option value="men">Мужское</option><option value="women">Женское</option></select></label>
    <label class="field">Размер${requiredMark}<select name="size" required>${['XXS','XS','S','M','L','XL','42','44','W30','W32','One size'].map(v=>`<option>${v}</option>`).join('')}</select></label><label class="field">Состояние${requiredMark}<select name="condition" required aria-describedby="conditionHint">${conditions.map(name=>`<option>${esc(name)}</option>`).join('')}</select><small class="condition-hint" id="conditionHint" aria-live="polite">${esc(conditionDescriptions[conditions[0]])}</small></label>
    <div class="field"><label for="listingPrice">Цена${requiredMark}</label><input id="listingPrice" name="price" type="text" inputmode="numeric" maxlength="6" required placeholder="150" aria-describedby="listingPriceError"><p id="listingPriceError" class="form-error" role="alert" hidden></p></div><label class="field">Валюта${requiredMark}<select name="currency" required><option value="EUR">EUR €</option><option value="USD">USD $</option></select></label>
    <label class="field">Город${requiredMark}<input name="location" maxlength="70" placeholder="Мурсия, Испания" required></label><label class="field wide">Описание и особенности${requiredMark}<textarea name="description" maxlength="1000" required placeholder="Укажите замеры, посадку и все недостатки вещи"></textarea></label>
    <div class="field wide photo-picker"><span>Фотография вещи${requiredMark}</span><input id="listingPhoto" name="photo" class="upload-input" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="photoHelp photoError" ${existing?'':'required'}><label class="photo-upload" for="listingPhoto"><img id="photoPreview" alt="Выбранная фотография" hidden><span class="upload-plus" id="photoPlus" aria-hidden="true">＋</span><span><strong id="photoTitle">Добавить фотографию</strong><small id="photoMeta">Нажмите, чтобы выбрать файл</small></span></label><small class="field-help" id="photoHelp">JPG, PNG или WebP до 20 МБ. Размер для сохранения уменьшим автоматически.</small><p class="photo-status" id="photoStatus" role="status"></p><p id="photoError" class="form-error" role="alert" hidden></p></div>
    <p id="listingError" class="form-error wide" role="alert" hidden></p><button id="listingSubmit" class="outline form-primary field wide" type="submit" disabled>${existing?'Сохранить изменения':'Разместить вещь'}</button><p class="note field wide">Объявление сохранится в этом браузере. Реальные сделки пока не подключены.</p></form>`);
  $('#modal').classList.add('listing-dialog');
  $('#listingForm select[name="condition"]').onchange=e=>{$('#conditionHint').textContent=conditionDescriptions[e.target.value];};
  const form=$('#listingForm'),photo=$('#listingPhoto'),submit=$('#listingSubmit');let prepared=existing?.image||null,processing=false,version=0;
  function updateReadiness() {
    const values={};
    for(const name of ['brand','name','location','description','price','category','condition','gender','currency','size'])values[name]=form.elements?.namedItem(name)?.value||'';
    const nativeValid=typeof form.matches==='function'?form.matches(':valid'):true;
    const ready=listingReady(values,Boolean(prepared),processing)&&nativeValid;
    submit.classList.toggle('is-ready',ready);submit.setAttribute('data-ready',String(ready));submit.disabled=!ready;
  }
  if(existing){
    for(const key of ['brand','name','location','description','price','category','condition','gender','currency','size']){const input=form.elements.namedItem(key);if(input)input.value=key==='gender'&&existing[key]==='all'?'unisex':existing[key]??'';}
    $('#conditionHint').textContent=conditionDescriptions[existing.condition]||'';
    $('#photoPreview').src=existing.image;$('#photoPreview').hidden=false;$('#photoPlus').hidden=true;$('#photoTitle').textContent='Заменить фотографию';$('#photoMeta').textContent='Текущая фотография';
  }
  setupBrandPicker(updateReadiness);
  form.addEventListener('input',updateReadiness);form.addEventListener('change',updateReadiness);
  updateReadiness();

  photo.onchange=async()=>{
    const current=++version,file=photo.files?.[0];prepared=null;photo.setAttribute('aria-invalid','false');fieldError($('#photoError'),'');$('#photoPreview').hidden=true;$('#photoPlus').hidden=false;$('#photoTitle').textContent='Добавить фотографию';$('#photoMeta').textContent='Нажмите, чтобы выбрать файл';
    if(!file){processing=false;updateReadiness();$('#photoStatus').textContent='';return;}
    processing=true;updateReadiness();$('#photoStatus').textContent='Подготавливаем фотографию…';
    try {const image=await preparePhoto(file);if(current!==version||$('#listingForm')!==form)return;prepared=image;$('#photoPreview').src=image;$('#photoPreview').hidden=false;$('#photoPlus').hidden=true;$('#photoTitle').textContent='Заменить фотографию';$('#photoMeta').textContent=file.name;$('#photoStatus').textContent='Фотография готова.';}
    catch(error){if(current===version&&$('#listingForm')===form){photo.setAttribute('aria-invalid','true');fieldError($('#photoError'),error.message);$('#photoStatus').textContent='';}}
    finally {if(current===version){processing=false;updateReadiness();}}
  };
  $('#listingPrice').oninput=()=>{fieldError($('#listingPriceError'),'');$('#listingPrice').setAttribute('aria-invalid','false');};
  $('#listingForm').onsubmit=async e=>{
    e.preventDefault();fieldError($('#listingError'),'');
    const fd=new FormData(e.target),brand=brandEntry(fd.get('brand').trim());
    if(!brand||brand.slug==='vintage'){fieldError($('#brandError'),'Выберите бренд одежды из подсказок.');$('#listingBrand').setAttribute('aria-invalid','true');$('#listingBrand').focus();return;}
    const price=wholePrice(fd.get('price'));
    if(price===null){fieldError($('#listingPriceError'),'Введите целую сумму от 1 до 100 000.');$('#listingPrice').setAttribute('aria-invalid','true');$('#listingPrice').focus();return;}
    if(processing){$('#photoStatus').textContent='Подождите, фотография ещё обрабатывается.';return;}
    if(!prepared){photo.setAttribute('aria-invalid','true');fieldError($('#photoError'),'Добавьте фотографию в формате JPG, PNG или WebP до 20 МБ.');photo.focus();return;}
    const item={...existing,id:existing?.id||Date.now(),status:existing?.status||'active',brand:brand.name,name:fd.get('name').trim(),category:fd.get('category'),gender:fd.get('gender'),size:fd.get('size'),condition:fd.get('condition'),price,currency:fd.get('currency')||'EUR',location:fd.get('location').trim(),description:fd.get('description').trim(),image:prepared,images:existing&&prepared===existing.image?(existing.images||[prepared]):[prepared],seller:read('profile',{name:'my.archive'}).name||'my.archive',own:true,archive:false};
    if(!item.name||!item.location||!item.description){fieldError($('#listingError'),'Заполните название вещи, город и описание.');return;}
    const next=existing?custom.map(p=>p.id===existing.id?item:p):[item,...custom];
    if(write('listings',next,message=>fieldError($('#listingError'),message))){custom=next;products=[...custom,...seed];if(typeof leaveItem==='function')leaveItem();reset();$('#modal').close();if(window.archiveProfile)window.archiveProfile.open('listings',item.status);else jump();toast(existing?'Изменения сохранены.':'Вещь добавлена в «Мои объявления».');}
  };
}
