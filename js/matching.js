import { uuid } from './utils.js';
import { store } from './store.js';

/**
 * Compute compatibility score between two users.
 * Score = 2*(A.strength ∩ B.weakness) + 2*(B.strength ∩ A.weakness) + 1*(A.strength ∩ B.strength) - penalty(no availability overlap)
 */
export function pairScore(a, b){
  const set = arr => new Set(arr || []);
  const inter = (A,B) => [...A].filter(x=>B.has(x));
  const As = set(a.strengths), Aw = set(a.weaknesses), Av = set(a.availability||[]);
  const Bs = set(b.strengths), Bw = set(b.weaknesses), Bv = set(b.availability||[]);
  let score = 0;
  score += 2 * inter(As, Bw).length;
  score += 2 * inter(Bs, Aw).length;
  score += 1 * inter(As, Bs).length;
  const overlap = inter(Av, Bv).length;
  if (overlap === 0) score -= 1.5; else score += Math.min(1, overlap*0.5);
  return score;
}

export function suggestMatchesFor(userId, limit=5){
  const me = store.users().find(u=>u.id===userId); if(!me) return [];
  const others = store.users().filter(u=>u.id!==userId);
  const sorted = others.map(u=>({u, score: pairScore(me,u)})).sort((a,b)=>b.score-a.score);
  return sorted.slice(0, limit);
}

export function createGroupFromUsers(userIds, name){
  const g = { id: uuid(), name: name || 'Study Group', members: userIds, createdAt: Date.now() };
  store.saveGroup(g);
  return g;
}

export function suggestSmallGroups(userId, size=3, limit=4){
  const me = store.users().find(u=>u.id===userId); if(!me) return [];
  const others = store.users().filter(u=>u.id!==userId);
  // Greedy group formation: pick best partner, then add next best that improves aggregate pairScore with existing members
  const scores = new Map();
  const ps = (a,b)=>{
    const key = a.id<b.id ? a.id+'_'+b.id : b.id+'_'+a.id;
    if(scores.has(key)) return scores.get(key);
    const s = pairScore(a,b); scores.set(key,s); return s;
  };
  const candidates = others.map(u=>u).sort((x,y)=>ps(me,y)-ps(me,x));
  const groups = [];
  for (let c of candidates){
    let group = [me, c];
    while(group.length<size){
      const rest = others.filter(o=>!group.some(g=>g.id===o.id));
      if(rest.length===0) break;
      let best = null, bestGain = -1e9;
      for (let r of rest){
        const gain = group.reduce((acc, m)=> acc + ps(m,r), 0);
        if (gain > bestGain){ bestGain = gain; best = r; }
      }
      if (best) group.push(best); else break;
    }
    const score = group.reduce((acc, a, i)=> acc + group.slice(i+1).reduce((s,b)=> s + ps(a,b), 0), 0);
    groups.push({group, score});
    if(groups.length>=limit) break;
  }
  // Deduplicate by member sets
  const seen = new Set();
  const uniq = [];
  for (let g of groups){
    const ids = g.group.map(x=>x.id).sort().join('-');
    if(!seen.has(ids)){ seen.add(ids); uniq.push(g); }
  }
  return uniq.sort((a,b)=>b.score-a.score).slice(0, limit);
}
