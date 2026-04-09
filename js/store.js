import { uuid } from './utils.js';

const LS = (k, v, del=false) => {
  if (del) localStorage.removeItem(k);
  if (v === undefined) {
    try { return JSON.parse(localStorage.getItem(k) || 'null'); }
    catch { return null; }
  } else {
    localStorage.setItem(k, JSON.stringify(v));
  }
};

const KEYS = {
  users: 'sbm_users',
  session: 'sbm_session',
  groups: 'sbm_groups',
  messages: 'sbm_messages',
  points: 'sbm_points'
};

// Simple SHA-256 to hash password (client-only demo; not secure for production)
async function sha(text){
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');
}

function ensureSeed(){
  if (LS('sbm_seeded')) return;
  const subjects = ['Math','Physics','Chemistry','Biology','English','History','Geography','Programming','Data Structures','Algorithms','DBMS','Operating Systems','Networks','Economics','Accounts'];
  const names = ['Aarav','Ishita','Rohan','Diya','Kunal','Sana','Vikram','Meera','Arjun','Riya','Kabir','Ananya'];
  const users = [];
  for(let i=0;i<12;i++){
    const id = uuid();
    const strengths = subjects.filter((_,idx)=> (idx+i)%3===0).slice(0,4);
    const weaknesses = subjects.filter((_,idx)=> (idx+i)%5===0).slice(0,3);
    users.push({
      id,
      name: names[i%names.length] + ' ' + String.fromCharCode(65+i),
      email: `user${i+1}@demo.test`,
      password: 'demo', // will be hashed on first login/sign-up
      bio: 'Passionate learner. Here to collaborate!',
      strengths, weaknesses,
      availability: ['Mon','Wed','Fri'].slice(0, 1 + (i%3)),
      avatarColor: `hsl(${i*30%360} 70% 55%)`,
      createdAt: Date.now() - (i*86400000)
    });
  }
  LS(KEYS.users, users);
  LS('sbm_seeded', true);
}
ensureSeed();

export const store = {
  async signup({name, email, password}){
    email = email.trim().toLowerCase();
    const users = LS(KEYS.users) || [];
    if(users.some(u=>u.email===email)) throw new Error('Email already registered');
    const user = {
      id: uuid(),
      name, email,
      password: await sha(password),
      bio: '',
      strengths: [], weaknesses: [],
      availability: [],
      avatarColor: `hsl(${Math.random()*360} 70% 55%)`,
      createdAt: Date.now()
    };
    users.push(user); LS(KEYS.users, users);
    LS(KEYS.session, {userId: user.id});
    return user;
  },

  async login({email, password}){
    email = email.trim().toLowerCase();
    const users = LS(KEYS.users) || [];
    const u = users.find(u=>u.email===email);
    if(!u) throw new Error('User not found');
    // Hash seed users' password on first login
    if (u.password === 'demo') u.password = await sha('demo');
    const hashed = await sha(password);
    if(u.password !== hashed) throw new Error('Invalid password');
    LS(KEYS.session, {userId: u.id});
    return u;
  },

  logout(){ LS(KEYS.session, null); },

  session(){ return LS(KEYS.session); },

  currentUser(){
    const s = LS(KEYS.session); if(!s) return null;
    const users = LS(KEYS.users) || [];
    return users.find(u=>u.id===s.userId) || null;
  },

  saveUser(user){
    const users = LS(KEYS.users) || [];
    const idx = users.findIndex(u=>u.id===user.id);
    if(idx>=0) users[idx] = user; else users.push(user);
    LS(KEYS.users, users);
  },

  users(){ return LS(KEYS.users) || []; },

  // Groups
  groups(){ return LS(KEYS.groups) || []; },
  saveGroup(g){
    const groups = LS(KEYS.groups) || [];
    const idx = groups.findIndex(x=>x.id===g.id);
    if(idx>=0) groups[idx]=g; else groups.push(g);
    LS(KEYS.groups, groups);
  },

  // Messages
  messages(groupId){
    const all = LS(KEYS.messages) || {};
    return all[groupId] || [];
  },
  addMessage(groupId, msg){
    const all = LS(KEYS.messages) || {};
    all[groupId] = all[groupId] || [];
    all[groupId].push(msg);
    LS(KEYS.messages, all);
  },

  // Points
  addPoints(userId, amount){
    const points = LS(KEYS.points) || {};
    points[userId] = (points[userId] || 0) + amount;
    LS(KEYS.points, points);
  },
  points(userId){ const points = LS(KEYS.points) || {}; return points[userId] || 0; }
};
