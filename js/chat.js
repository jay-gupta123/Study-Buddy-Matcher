import { store } from './store.js';
import { fmtTime, uuid } from './utils.js';

export function sendMessage(groupId, userId, text){
  const msg = { id: uuid(), groupId, userId, text, ts: Date.now() };
  store.addMessage(groupId, msg);
  store.addPoints(userId, 1); // gamification
  return msg;
}

export function getMessages(groupId){
  return store.messages(groupId);
}

export function groupMembers(group){
  const users = store.users(); const set = new Set(group.members);
  return users.filter(u=>set.has(u.id));
}

export function ensureWelcome(groupId){
  const msgs = store.messages(groupId);
  if (!msgs || msgs.length===0){
    store.addMessage(groupId, { id: uuid(), groupId, userId: 'system', text: 'Welcome to the group! 🎉 Share goals and plan a session.', ts: Date.now() });
  }
}

