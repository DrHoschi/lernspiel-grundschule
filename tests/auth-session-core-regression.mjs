const mem=new Map();
globalThis.localStorage={getItem:k=>mem.has(k)?mem.get(k):null,setItem:(k,v)=>mem.set(k,String(v)),removeItem:k=>mem.delete(k),clear:()=>mem.clear()};
const {Auth}=await import('../src/auth/auth.js');
function assert(c,m){if(!c)throw new Error(m)} async function rejects(fn,part){let e=null;try{await fn()}catch(x){e=x}assert(e,'expected rejection');if(part)assert(String(e.message).includes(part),e.message)}
await rejects(()=>Auth.loginParent({email:'parent@example.test',password:'pw1234'}),'E-Mail oder Passwort');
const registered=Auth.registerDevelopmentParent({email:'parent@example.test',password:'pw1234'});
assert(registered.parentId.startsWith('parent:'),'parentId missing');
const locked=await Auth.loginParent({email:'parent@example.test',password:'pw1234'});
assert(locked.parentId===registered.parentId&&!locked.parentAreaUnlocked,'parent session wrong');
await rejects(()=>Promise.resolve(Auth.unlockParentArea('9999')),'Falscher Eltern-Code');
const parent=Auth.unlockParentArea('0000'); assert(parent.parentAreaUnlocked,'unlock missing');
const child=await Auth.createChild({displayName:'Mia',pin:['🍎','⭐','🚗','🌈']}); Auth.logout();
await rejects(()=>Auth.loginChild({childId:'child:unknown',pin:['🍎','⭐','🚗','🌈']}),'Unbekanntes');
await rejects(()=>Auth.loginChild({childId:child.childId,pin:['🐶','⭐','🚗','🌈']}),'PIN stimmt nicht');
const cs=await Auth.loginChild({childId:child.childId,pin:['🍎','⭐','🚗','🌈']});
assert(cs.childId===child.childId&&cs.parentId===parent.parentId&&cs.name==='Mia','child session wrong');
await rejects(()=>Auth.createChild({displayName:'Nope',pin:['🍎','🍎','🍎','🍎']}),'Parent-Session');
console.log('AUD-04A-I1 PASS');