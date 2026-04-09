import { $, $$, el, toast, fmtTime } from './utils.js';
import { store } from './store.js';
import { suggestMatchesFor, suggestSmallGroups, createGroupFromUsers } from './matching.js';
import { sendMessage, getMessages, ensureWelcome, groupMembers } from './chat.js';

export function mountCommonUI(){
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
  const navToggle = $('#navToggle');
  const navLinks = $('#navLinks');
  if (navToggle) navToggle.addEventListener('click', ()=>{
    const shown = navLinks.style.display === 'flex';
    navLinks.style.display = shown ? 'none' : 'flex';
  });
  // Session UI
  const me = store.currentUser();
  const loginLink = $('#loginLink'), signupLink = $('#signupLink'), profileMenu = $('#profileMenu');
  if (me){
    loginLink?.classList.add('hidden'); signupLink?.classList.add('hidden');
    profileMenu?.classList.remove('hidden');
    $('#avatarDot').style.background = me.avatarColor;
  } else {
    loginLink?.classList.remove('hidden'); signupLink?.classList.remove('hidden');
    profileMenu?.classList.add('hidden');
  }
  $('#profileBtn')?.addEventListener('click', ()=>{
    const dd = $('#profileDropdown');
    dd.style.display = dd.style.display === 'block' ? 'none' : 'block';
  });
  $('#logoutBtn')?.addEventListener('click', ()=>{ store.logout(); location.hash = '#/login'; location.reload(); });
}

export function Home(){
  const me = store.currentUser();
  const hero = el('section', {class:'hero'}, [
    el('div', {}, [
      el('h1', {html:'Find your perfect <span class="code">Study Buddy</span>'}),
      el('p', {html:'Match your strengths with others’ needs and learn together. Build groups, chat, and earn points.'}),
      el('div', {class:'cta'}, [
        el('a', {href: me ? '#/match' : '#/signup', class:'btn btn-primary'}, [document.createTextNode(me ? 'Find Matches' : 'Get Started')]),
        el('a', {href:'#/about', class:'btn'}, [document.createTextNode('How it works')])
      ])
    ]),
    el('div', {class:'hero-card'}, [
      el('div', {class:'section-title', html:'Why Study Buddy Matcher?' }),
      el('div', {class:'grid grid-2'}, [
        el('div', {class:'kpi'}, [ el('div', {class:'num', html:'AI Matching'}), el('div', {class:'text-muted', html:'Pairing by strengths & weaknesses'}) ]),
        el('div', {class:'kpi'}, [ el('div', {class:'num', html:'Groups'}), el('div', {class:'text-muted', html:'Form dynamic study groups'}) ]),
        el('div', {class:'kpi'}, [ el('div', {class:'num', html:'Chat'}), el('div', {class:'text-muted', html:'Plan sessions and share notes'}) ]),
        el('div', {class:'kpi'}, [ el('div', {class:'num', html:'Points & Badges'}), el('div', {class:'text-muted', html:'Stay motivated'}) ]),
      ])
    ])
  ]);

  const how = el('section', {}, [
    el('h3', {class:'section-title', html:'Get started in 3 steps'}),
    el('div', {class:'grid grid-3'}, [
      card('Create profile', 'Add subjects you can teach and those you want to learn.'),
      card('Find matches', 'See recommended partners and small groups.'),
      card('Collaborate', 'Chat, plan sessions, and earn points.')
    ])
  ]);

  return el('div', {}, [hero, how]);

  function card(title, desc){
    return el('div', {class:'card'}, [ el('h4', {html:title}), el('p', {class:'text-muted', html:desc}) ]);
  }
}

export function Login(){
  const wrap = el('div', {class:'grid grid-2'}, [
    el('div', {class:'card'}, [
      el('h3', {html:'Welcome back'}),
      el('p', {class:'text-muted', html:'Log in to continue'}),
      form([
        ['email','Email','email'],
        ['password','Password','password'],
      ], async (data)=>{
        try{
          await store.login(data);
          toast('Logged in');
          location.hash = '#/dashboard';
          location.reload();
        }catch(e){ toast(e.message); }
      }, 'Login')
    ]),
    demoPanel()
  ]);
  return wrap;
}

export function Signup(){
  const wrap = el('div', {class:'grid grid-2'}, [
    el('div', {class:'card'}, [
      el('h3', {html:'Create account'}),
      form([
        ['name','Full Name','text'],
        ['email','Email','email'],
        ['password','Password','password'],
      ], async (data)=>{
        try{
          await store.signup(data);
          toast('Account created');
          location.hash = '#/profile';
          location.reload();
        }catch(e){ toast(e.message); }
      }, 'Sign up')
    ]),
    demoPanel()
  ]);
  return wrap;
}

export function Dashboard(){
  const me = store.currentUser();
  if(!me) return needAuth();
  const points = store.points(me.id);
  const top = el('div', {class:'grid grid-3'}, [
    stat('Points', points),
    stat('Strengths', me.strengths.length),
    stat('Weaknesses', me.weaknesses.length)
  ]);
  const quick = el('div', {class:'grid grid-3'}, [
    action('Find Matches', '#/match'),
    action('Edit Profile', '#/profile'),
    action('My Groups', '#/groups')
  ]);
  const box = el('div', {class:'card'}, [
    el('h3', {html:'Welcome, '+me.name}),
    el('p', {class:'text-muted', html:'Complete your profile to get better matches.'}),
    el('div', {class:'chips', id:'subjectsChips'})
  ]);
  const wrap = el('div', {}, [top, el('br'), quick, el('br'), box]);
  return wrap;

  function stat(name, value){
    return el('div', {class:'kpi'}, [ el('div', {class:'num', html:String(value)}), el('div', {class:'text-muted', html:name}) ]);
  }
  function action(name, href){ return el('a', {href, class:'card'}, [ el('h4', {html:name}), el('p', {class:'text-muted', html:'→'}) ]); }
}

export function Profile(){
  const me = store.currentUser(); if(!me) return needAuth();
  const ALL = subjects();
  const formEl = el('div', {class:'card'}, [
    el('h3', {html:'Profile'}),
    form([
      ['name','Full Name','text', me.name],
      ['email','Email','email', me.email, true],
      ['bio','Bio','textarea', me.bio || ''],
    ], (data)=>{
      me.name = data.name; me.bio = data.bio;
      store.saveUser(me); toast('Profile saved');
    }, 'Save Profile')
  ]);

  const pickers = el('div', {class:'grid grid-2'}, [
    picker('Strengths', me.strengths, sel=>{ me.strengths = sel; store.saveUser(me); }),
    picker('Weaknesses', me.weaknesses, sel=>{ me.weaknesses = sel; store.saveUser(me); })
  ]);
  const avail = el('div', {class:'card'}, [
    el('h4', {html:'Availability'}),
    chips(['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], me.availability || [], sel=>{ me.availability = sel; store.saveUser(me); })
  ]);

  const wrap = el('div', {}, [formEl, el('br'), pickers, el('br'), avail]);
  return wrap;

  function picker(title, selected, onChange){
    return el('div', {class:'card'}, [
      el('h4', {html:title}),
      chips(ALL, selected, onChange)
    ]);
  }
  function chips(items, selected, onChange){
    selected = new Set(selected);
    const box = el('div', {class:'chips'});
    const render = ()=>{
      box.innerHTML = '';
      items.forEach(s=>{
        const c = el('button', {class:'chip'+(selected.has(s)?' active':''), html:s, onclick:()=>{
          if(selected.has(s)) selected.delete(s); else selected.add(s);
          onChange([...selected]); render();
        }});
        box.append(c);
      });
    };
    render();
    return box;
  }
}

export function Match(){
  const me = store.currentUser(); if(!me) return needAuth();
  const matches = suggestMatchesFor(me.id, 6);
  const groups = suggestSmallGroups(me.id, 3, 4);

  const matchCards = el('div', {class:'grid grid-3'});
  matches.forEach(({u, score})=> matchCards.append(userCard(u, score)));

  const groupCards = el('div', {class:'grid grid-2'});
  groups.forEach(g=> groupCards.append(groupCard(g)));

  return el('div', {}, [
    el('div', {class:'section-title', html:'Recommended partners'}),
    matchCards,
    el('br'),
    el('div', {class:'section-title', html:'Suggested small groups'}),
    groupCards
  ]);

  function userCard(u, score){
    const card = el('div', {class:'card'}, [
      avatar(u),
      el('h4', {html:u.name}),
      el('div', {class:'text-muted', html:'Score: '+score.toFixed(1)}),
      el('div', {class:'chips', html: u.strengths.map(s=>`<span class="tag"><span class="dot"></span>${s}</span>`).join('')}),
      el('div', {class:'chips', html: u.weaknesses.map(s=>`<span class="badge warn">${s}</span>`).join('')}),
      el('div', {class:'chips', html: (u.availability||[]).map(s=>`<span class="badge info">${s}</span>`).join('')}),
      el('div', {class:'cta'},
        [el('button',{class:'btn btn-primary', html:'Create Group', onclick:()=>{
          const me = store.currentUser();
          const g = createGroupFromUsers([me.id, u.id], `Pair: ${me.name.split(' ')[0]} & ${u.name.split(' ')[0]}`);
          toast('Group created'); location.hash = '#/groups';
        }})])
    ]);
    return card;
  }

  function groupCard(g){
    const names = g.group.map(x=>x.name).join(', ');
    const btn = el('button', {class:'btn btn-primary', html:'Create this Group', onclick:()=>{
      const idz = g.group.map(x=>x.id);
      const name = 'Group: ' + g.group.map(x=>x.name.split(' ')[0]).slice(0,3).join('-');
      const created = createGroupFromUsers(idz, name);
      toast('Group created'); location.hash = '#/groups';
    }});
    return el('div', {class:'card'}, [
      el('h4', {html:`${names}`}),
      el('p', {class:'text-muted', html:'Compatibility score: '+g.score.toFixed(1)}),
      btn
    ]);
  }
}

export function Groups(){
  const me = store.currentUser(); if(!me) return needAuth();
  const groups = store.groups().filter(g=>g.members.includes(me.id));
  if (groups.length===0) return el('div', {class:'empty', html:'No groups yet. Go to Match to create one.'});
  const list = el('div', {class:'grid'});
  groups.forEach(g=>{
    const members = groupMembers(g);
    const card = el('div', {class:'card'}, [
      el('h4', {html:g.name}),
      el('p', {class:'text-muted', html: 'Members: ' + members.map(m=>m.name).join(', ')}),
      el('a', {href:`#/chat/${g.id}`, class:'btn btn-primary'}, [document.createTextNode('Open Chat')])
    ]);
    list.append(card);
  });
  return list;
}

export function Chat(groupId){
  const me = store.currentUser(); if(!me) return needAuth();
  const group = store.groups().find(g=>g.id===groupId);
  if (!group) return el('div', {class:'empty', html:'Group not found'});
  ensureWelcome(groupId);
  const box = el('div', {class:'chat'}, []);
  const msgsEl = el('div', {class:'msgs'});
  const input = el('input', {class:'input', placeholder:'Type a message...'});
  const sendBtn = el('button', {class:'btn btn-primary', html:'Send'});
  const form = el('div', {class:'msg-input'}, [input, sendBtn]);

  function render(){
    const msgs = getMessages(groupId);
    msgsEl.innerHTML = '';
    msgs.forEach(m=>{
      const isMe = m.userId === me.id;
      const row = el('div', {class:'msg'+(isMe?' me':'')}, [
        el('div', {html: m.userId==='system' ? 'System' : (isMe? 'You' : (store.users().find(u=>u.id===m.userId)?.name || 'User'))}),
        el('div', {class:'text-muted msg-meta', html: fmtTime(m.ts)}),
        el('div', {html: m.text})
      ]);
      msgsEl.append(row);
    });
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  sendBtn.addEventListener('click', ()=>{
    const text = input.value.trim(); if(!text) return;
    sendMessage(groupId, me.id, text); input.value=''; render();
  });
  input.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); sendBtn.click(); } });

  // Polling to simulate realtime
  const int = setInterval(render, 1000);
  const wrap = el('div', {}, [
    el('div', {class:'section-title', html:`Chat • ${group.name}`}),
    box
  ]);
  box.append(msgsEl, form);
  render();
  // stop polling on navigation
  window.addEventListener('hashchange', ()=> clearInterval(int), {once:true});
  return wrap;
}

export function Leaderboard(){
  const users = store.users();
  const rows = users.map(u=>({name:u.name, points: store.points(u.id)}))
                   .sort((a,b)=>b.points-a.points).slice(0, 20);
  const table = el('table', {class:'table'}, [
    el('thead', {}, [el('tr', {}, [el('th',{html:'#'}), el('th',{html:'Name'}), el('th',{html:'Points'})])]),
    el('tbody', {}, rows.map((r,i)=> el('tr', {}, [ el('td',{html:String(i+1)}), el('td',{html:r.name}), el('td',{html:String(r.points)}) ])))
  ]);
  return el('div', {class:'card'}, [ el('h3',{html:'Leaderboard'}), table ]);
}

export function About(){
  const box = el('div', {class:'grid grid-2'}, [
    el('div', {class:'card'}, [
      el('h3', {html:'What is Study Buddy Matcher?'}),
      el('p', {class:'text-muted', html:'A simple website that connects students with study partners and small groups based on complementary skills.'}),
      el('ul', {html:'<li>Dual role: mentor & learner</li><li>AI-like matching (client-side)</li><li>Group chat</li><li>Points & badges</li>'})
    ]),
    el('div', {class:'card'}, [
      el('h3', {html:'How does matching work?'}),
      el('p', {class:'text-muted', html:'We calculate a score using overlaps between strengths and weaknesses and availability. Higher score = better match.'}),
      el('div', {class:'badge info', html:'Client-side demo (no server)'})
    ])
  ]);
  return box;
}

export function Settings(){
  const me = store.currentUser(); if(!me) return needAuth();
  const card = el('div', {class:'card'}, [
    el('h3', {html:'Settings'}),
    el('p', {class:'text-muted', html:'Light/Dark theme, export your data.'}),
    el('div', {}, [
      el('button', {class:'btn', html:'Export my data', onclick:()=>{
        const data = {
          user: me,
          groups: store.groups().filter(g=>g.members.includes(me.id)),
          points: store.points(me.id)
        };
        const content = JSON.stringify(data, null, 2);
        const blob = new Blob([content], {type:'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href=url; a.download='sbm-data.json'; a.click(); URL.revokeObjectURL(url);
      }})
    ])
  ]);
  return card;
}

function avatar(u){
  const dot = el('div', {class:'tag', html:`<span class="dot" style="background:${u.avatarColor}"></span>${u.name.split(' ')[0]}`});
  return dot;
}

function form(fields, onSubmit, submitText){
  const formEl = el('form');
  fields.forEach(([name, label, type, value='', readonly=false])=>{
    formEl.append(el('label', {for:name, html:label}));
    if (type==='textarea'){
      formEl.append(el('textarea', {id:name, name, class:'input', rows:'3', html:value}));
    } else {
      formEl.append(el('input', {id:name, name, type, class:'input', value, ...(readonly?{readonly:'true'}:{}) }));
    }
  });
  const btn = el('button', {class:'btn btn-primary', html:submitText, type:'submit'});
  formEl.append(el('div', {style:'height:.3rem'}), btn);
  formEl.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(formEl).entries());
    await onSubmit(data);
  });
  return formEl;
}

function needAuth(){
  return el('div', {class:'empty', html:'Please log in to continue. Go to Login or Sign up.'});
}

function demoPanel(){
  const box = el('div', {class:'card'}, [
    el('h3', {html:'Demo Accounts'}),
    el('p', {class:'text-muted', html:'Use any of the seeded demo users to explore.'}),
    el('table', {class:'table'}, [
      el('thead', {}, [el('tr',{},[el('th',{html:'Email'}), el('th',{html:'Password'})])]),
      el('tbody', {}, Array.from({length:4}).map((_,i)=>{
        const email = `user${i+1}@demo.test`; const pwd = 'demo';
        const row = el('tr',{},[ el('td',{html:`<code class="code">${email}</code>`}), el('td',{html:`<code class="code">${pwd}</code>`}) ]);
        return row;
      }))
    ])
  ]);
  return box;
}

export function subjects(){
  return ['Math','Physics','Chemistry','Biology','English','History','Geography','Programming','Data Structures','Algorithms','DBMS','Operating Systems','Networks','Economics','Accounts'];
}
