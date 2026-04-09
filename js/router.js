import { $, toast } from './utils.js';
import * as UI from './ui.js';

const routes = {
  '/': UI.Home,
  '/login': UI.Login,
  '/signup': UI.Signup,
  '/dashboard': UI.Dashboard,
  '/profile': UI.Profile,
  '/match': UI.Match,
  '/groups': UI.Groups,
  '/leaderboard': UI.Leaderboard,
  '/about': UI.About,
  '/settings': UI.Settings,
  '/chat/:id': (params)=> UI.Chat(params.id)
};

function parseHash(){
  const hash = location.hash.replace('#','') || '/';
  const parts = hash.split('/').filter(Boolean);
  if (parts[0]==='chat' && parts[1]) return { path:'/chat/:id', params:{id: parts[1]} };
  const path = '/' + parts.join('/');
  return { path, params:{} };
}

export function mountRouter(){
  const render = ()=>{
    const {path, params} = parseHash();
    const view = routes[path] || routes['/'];
    const node = (typeof view === 'function') ? view(params) : view;
    const app = document.getElementById('app');
    app.innerHTML = '';
    app.append(node);
    UI.mountCommonUI();
  };
  window.addEventListener('hashchange', render);
  render();
}
