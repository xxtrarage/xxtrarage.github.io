'use strict';
(() => {
  let language=read('language','ru')==='en'?'en':'ru';
  const english=window.ARCHIVE_EN||{},texts=new WeakMap(),attributes=new WeakMap();
  const sentences=Object.keys(english).filter(key=>/[.…]$/.test(key)).sort((a,b)=>b.length-a.length);
  const protectedText='script,style,textarea,[data-i18n-ignore],.brand-name,.product-name,.product-brand-row h3,.seller-name,.item-designer,#itemTitle,.item-related-name,.item-related-card strong,.offer-item-brand,.profile-listing-name,.profile-listing-brand,.profile-banner h2,.profile-banner p,.profile-offer p,.profile-offer button,.item-seller-heading button,[data-profile-search]>span:first-child';
  function phrase(value) {
    if(english[value])return english[value];
    let match;
    if((match=value.match(/^(.*) \| ARCHIVE$/)))return phrase(match[1])+' | ARCHIVE';
    if((match=value.match(/^(\d+) объявлений$/)))return `${match[1]} ${Number(match[1])===1?'listing':'listings'}`;
    if((match=value.match(/^(\d+) вещей$/)))return `${match[1]} ${Number(match[1])===1?'item':'items'}`;
    if((match=value.match(/^Показано (\d+) из (\d+) объявлений$/)))return `Showing ${match[1]} of ${match[2]} listings`;
    if((match=value.match(/^Показать все \((\d+)\)$/)))return `Show all (${match[1]})`;
    if((match=value.match(/^Все (\d+) брендов\. Список можно прокрутить\.$/)))return `All ${match[1]} brands. Scroll to browse.`;
    if((match=value.match(/^Найдено брендов: (\d+)\.$/)))return `${match[1]} matching brands.`;
    if((match=value.match(/^Все вещи продавца (.+)$/)))return `All items by ${match[1]}`;
    if((match=value.match(/^Вещи продавца (.+)$/)))return `Items by ${match[1]}`;
    if((match=value.match(/^Размер (.+?)(?: · (.+))?$/)))return `Size ${match[1]}${match[2]?' · '+phrase(match[2]):''}`;
    if((match=value.match(/^Состояние: (.+)$/)))return 'Condition: '+phrase(match[1]);
    if((match=value.match(/^Категории: (.+)$/)))return 'Categories: '+phrase(match[1]);
    if((match=value.match(/^Местоположение продавца: (.+)\.$/)))return 'Seller location: '+phrase(match[1])+'.';
    if((match=value.match(/^Объявление (.+) № (.+)$/)))return `${match[1]} listing #${match[2]}`;
    if((match=value.match(/^Данные на (.+)$/)))return 'Data as of '+match[1];
    if((match=value.match(/^Читать на (.+)$/)))return 'Read on '+match[1];
    if((match=value.match(/^Посмотреть на (.+)$/)))return 'View on '+match[1];
    if((match=value.match(/^Оплата и условия возврата определяются площадкой (.+)\.$/)))return `Payment and return terms are set by ${match[1]}.`;
    if((match=value.match(/^Открыть (.+)$/)))return 'Open '+match[1];
    if((match=value.match(/^Убрать фильтр (.+)$/)))return 'Remove filter: '+phrase(match[1]);
    if((match=value.match(/^(?:Показать фото|Фотография) (\d+)$/)))return 'Photo '+match[1];
    if((match=value.match(/^от (\d+)(.*)$/)))return `from ${match[1]}${match[2].replace(/до (\d+)/,'to $1')}`;
    if((match=value.match(/^до (\d+)(.*)$/)))return `up to ${match[1]}${match[2]}`;
    // Paragraphs combine several independently translated UI sentences.
    let output=value;for(const source of sentences)if(output.includes(source))output=output.replaceAll(source,english[source]);
    return output;
  }
  function translate(value) {
    if(language==='ru')return value;
    const trimmed=value.trim();if(!trimmed)return value;
    return value.replace(trimmed,phrase(trimmed));
  }
  function applyText(node) {
    if(!node.parentElement||node.parentElement.closest(protectedText))return;
    const previous=texts.get(node),source=previous&&node.nodeValue===previous.output?previous.source:node.nodeValue;
    const output=translate(source);if(node.nodeValue!==output)node.nodeValue=output;
    texts.set(node,{source,output});
  }
  function applyAttribute(node,name) {
    if(node.closest('[data-i18n-ignore]:not([data-language-select])'))return;
    let saved=attributes.get(node);if(!saved){saved=new Map();attributes.set(node,saved);}
    const value=node.getAttribute(name),previous=saved.get(name);
    const source=previous&&value===previous.output?previous.source:value,output=translate(source);
    if(value!==output)node.setAttribute(name,output);saved.set(name,{source,output});
  }
  let frame=null;
  const observer=new MutationObserver(()=>{if(frame===null)frame=requestAnimationFrame(()=>{frame=null;apply();});});
  function watch(){observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','title','aria-label']});}
  function apply() {
    observer.disconnect();
    try {
      document.documentElement.lang=language;
      // Keep category and condition values canonical when translating option labels.
      document.querySelectorAll('option:not([value])').forEach(option=>option.setAttribute('value',option.textContent));
      const walker=document.createTreeWalker(document.documentElement,NodeFilter.SHOW_TEXT);let node;
      while((node=walker.nextNode()))applyText(node);
      document.querySelectorAll('[placeholder],[title],[aria-label],meta[name="description"]').forEach(element=>{
        for(const name of ['placeholder','title','aria-label',...(element.tagName==='META'?['content']:[])])if(element.hasAttribute(name))applyAttribute(element,name);
      });
      document.querySelectorAll('[data-language-select]').forEach(select=>{select.value=language;});
      document.querySelectorAll('.currency').forEach(node=>{node.textContent=(language==='en'?'EN':'RU')+' · EUR / USD';});
    } finally {watch();}
  }
  function setLanguage(next) {
    if(!['ru','en'].includes(next))return;
    if(!write('language',next)){apply();return;}
    language=next;apply();
  }
  document.addEventListener('change',e=>{if(e.target.matches('[data-language-select]'))setLanguage(e.target.value);});
  window.archiveI18n={setLanguage,getLanguage:()=>language,t:translate,apply};apply();
})();
