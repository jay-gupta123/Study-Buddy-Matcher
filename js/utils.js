export const $ = (sel, el=document) => el.querySelector(sel);
export const $$ = (sel, el=document) => [...el.querySelectorAll(sel)];
export const el = (tag, attrs={}, children=[]) => {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v]) => {
    if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (k==='html') node.innerHTML = v;
    else node.setAttribute(k, v);
  });
  children.forEach(c => node.append(c));
  return node;
};
export const uuid = () => crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2);
export const toast = (msg) => {
  const t = $('#toast'); if(!t) return;
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
};
export const fmtTime = (ts) => new Date(ts).toLocaleString();
export const sleep = (ms) => new Promise(r => setTimeout(r, ms));
export const saveFile = (name, content) => {
  const blob = new Blob([content], {type:'text/plain'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
};
