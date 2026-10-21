'use strict';
// Short, non-blocking motion. Every element remains visible without this script.
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const running = new Set(), pendingPhotos = new WeakMap();
  let catalogKey = null;
  const ease = 'cubic-bezier(.22,.61,.36,1)';
  function play(node, frames, options = {}) {
    if (!node || reduced.matches || typeof node.animate !== 'function') return;
    const animation = node.animate(frames, {duration:280, easing:ease, ...options});
    running.add(animation);
    animation.onfinish = animation.oncancel = () => running.delete(animation);
  }
  function enter(nodes) {
    [...nodes].slice(0,12).forEach((node,i) => play(node,
      [{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],
      {delay:Math.min(i*22,132),fill:'backwards'}));
  }
  function catalog(key) {
    if (key === catalogKey) return;
    catalogKey = key;
    if (!document.querySelector('#catalog').hidden) enter(document.querySelectorAll('.product-card,.empty'));
  }
  function product() {
    enter(document.querySelectorAll('.item-gallery,.item-summary,.item-information,.item-related'));
  }
  function profile() {
    const rows=document.querySelectorAll('.profile-listing,.profile-favorite,.profile-offer,.profile-saved-search');
    play(document.querySelector('.profile-section-heading'),[{opacity:0},{opacity:1}],{duration:180});
    if(rows.length)enter(rows);
    else play(document.querySelector('.profile-empty,.profile-settings'),[{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:230});
  }
  function photo(img) {
    if (!img) return;
    pendingPhotos.get(img)?.();
    const reveal = () => {
      img.removeEventListener('load',reveal);
      pendingPhotos.delete(img);
      play(img,[{opacity:.35},{opacity:1}],{duration:220});
    };
    pendingPhotos.set(img,()=>img.removeEventListener('load',reveal));
    if (img.complete && img.naturalWidth) reveal();
    else img.addEventListener('load',reveal,{once:true});
  }
  function favorite(id, saved) {
    if (!saved || reduced.matches) return;
    requestAnimationFrame(() => {
      document.querySelectorAll(`[data-heart="${id}"] svg,[data-item-save="${id}"] svg`).forEach(node =>
        play(node,[{transform:'scale(1)'},{transform:'scale(1.2)',offset:.45},{transform:'scale(1)'}],{duration:240}));
    });
  }
  document.addEventListener('toggle', e => {
    if (e.target.tagName !== 'DETAILS' || !e.target.open) return;
    [...e.target.children].filter(node=>node.tagName!=='SUMMARY').forEach(node=>
      play(node,[{opacity:0},{opacity:1}],{duration:200}));
  },true);
  reduced.addEventListener?.('change',e=>{
    if(e.matches) [...running].forEach(animation=>animation.cancel());
  });
  window.archiveMotion = {catalog, product, photo, favorite, profile};
  if (!document.querySelector('#productPage').hidden) product();
  else {
    enter(document.querySelectorAll('.page-heading,.results-toolbar'));
    catalog([...new Set([...document.querySelectorAll('.product-card [data-product]')].map(n=>n.dataset.product))].join(','));
  }
})();
