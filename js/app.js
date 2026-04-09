import { mountRouter } from './router.js';
import { $, toast } from './utils.js';
import { store } from './store.js';

// Theme
const THEME_KEY = 'sbm_theme';
function applyTheme(){
  const t = localStorage.getItem(THEME_KEY) || 'dark';
  if (t==='light') document.documentElement.classList.add('light');
  else document.documentElement.classList.remove('light');
}
applyTheme();
document.addEventListener('click', (e)=>{
  if (e.target && e.target.id==='themeToggle'){
    const cur = localStorage.getItem(THEME_KEY) || 'dark';
    const next = cur==='dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    applyTheme();
  }
});

// Start
mountRouter();
