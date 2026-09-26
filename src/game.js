// Reinos de Hierro — lógica del juego (Three.js)
import * as THREE from 'three';
import { RACES, ITEMS, QUESTS, ETYPES, SHOP, migrate } from './data.js';

const $=s=>document.querySelector(s);
const isTouch=matchMedia('(pointer:coarse)').matches;

const CAMP={x:72,z:58}, FOREST={x:-78,z:22,r:52}, LAKE={x:-12,z:-82};
const INV_MAX=20;

/* ---------- Utilidades ---------- */
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
const R=rng(20260926);
const sm=(e0,e1,x)=>{const t=Math.min(1,Math.max(0,(x-e0)/(e1-e0)));return t*t*(3-2*t);};
const lerp=(a,b,t)=>a+(b-a)*t;
function H(x,z){
  let h=Math.sin(x*0.045)*Math.cos(z*0.038)*3.2+Math.sin(x*0.012+1.3)*5+Math.cos(z*0.015+0.4)*4.5+Math.sin((x+z)*0.08)*0.7+1.5;
  h*=sm(24,46,Math.hypot(x,z));
  const fc=sm(18,34,Math.hypot(x-CAMP.x,z-CAMP.z)); h=h*fc+1.2*(1-fc);
  h-=(1-sm(8,28,Math.hypot(x-LAKE.x,z-LAKE.z)))*8;
  h+=sm(150,195,Math.max(Math.abs(x),Math.abs(z)))*28;
  return h;
}
const WATER=-3, WATER_BLOCK=-2.5;
function segDist(px,pz,ax,az,bx,bz){const dx=bx-ax,dz=bz-az;let t=((px-ax)*dx+(pz-az)*dz)/(dx*dx+dz*dz);t=Math.max(0,Math.min(1,t));return Math.hypot(px-ax-dx*t,pz-az-dz*t);}
const PATHS=[[0,0,CAMP.x,CAMP.z],[0,0,-46,16],[0,0,-10,-58]];
const onPath=(x,z)=>Math.min(...PATHS.map(p=>segDist(x,z,p[0],p[1],p[2],p[3])));
const matCache={};
const M=(c,e)=>{const k=c+'_'+(e||0);return matCache[k]||(matCache[k]=new THREE.MeshLambertMaterial({color:c,emissive:e||0}));};
const box=(w,h,d,c)=>new THREE.Mesh(new THREE.BoxGeometry(w,h,d),M(c));

/* ---------- Escena ---------- */
const canvas=$('#c');
const renderer=new THREE.WebGLRenderer({canvas,antialias:!isTouch,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,isTouch?1.5:2));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
const SKY=0xa9bfc9;
scene.background=new THREE.Color(SKY);
scene.fog=new THREE.Fog(SKY,45,isTouch?120:160);
const camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,0.1,400);
scene.add(new THREE.HemisphereLight(0xdfe8ee,0x4a5a3a,0.75));
const sun=new THREE.DirectionalLight(0xffe2b0,0.85);
sun.castShadow=true;
sun.shadow.mapSize.set(isTouch?1024:2048,isTouch?1024:2048);
Object.assign(sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,near:1,far:120});
scene.add(sun,sun.target);

// Terreno
const SEG=isTouch?120:160;
const tg=new THREE.PlaneGeometry(400,400,SEG,SEG);tg.rotateX(-Math.PI/2);
{
  const pos=tg.attributes.position,cols=new Float32Array(pos.count*3),c=new THREE.Color();
  const g1=new THREE.Color(0x5b7d38),g2=new THREE.Color(0x7c9442),dirt=new THREE.Color(0x8a6f4a),sand=new THREE.Color(0xb9a77a),rock=new THREE.Color(0x7c7a6e),camp=new THREE.Color(0x6e5a3c);
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),z=pos.getZ(i),h=H(x,z);pos.setY(i,h);
    c.copy(g1).lerp(g2,0.5+0.5*Math.sin(x*0.13+Math.cos(z*0.11)*2));
    const pd=onPath(x,z); if(pd<2.6) c.lerp(dirt,1-sm(1.4,2.6,pd));
    const dv=Math.hypot(x,z); if(dv<20) c.lerp(dirt,0.35*(1-dv/20));
    const dc=Math.hypot(x-CAMP.x,z-CAMP.z); if(dc<18) c.lerp(camp,0.7*(1-sm(10,18,dc)));
    if(h<-1.8) c.lerp(sand,sm(-1.8,-2.8,h));
    if(h>10) c.lerp(rock,sm(10,16,h));
    cols[i*3]=c.r;cols[i*3+1]=c.g;cols[i*3+2]=c.b;
  }
  tg.setAttribute('color',new THREE.BufferAttribute(cols,3));tg.computeVertexNormals();
}
const ground=new THREE.Mesh(tg,new THREE.MeshLambertMaterial({vertexColors:true}));ground.receiveShadow=true;scene.add(ground);
const water=new THREE.Mesh(new THREE.PlaneGeometry(400,400),new THREE.MeshLambertMaterial({color:0x3f6e7a,transparent:true,opacity:0.82}));
water.rotation.x=-Math.PI/2;water.position.y=WATER;scene.add(water);

const colliders=[];
// Árboles
{
  const trees=[];let tries=0;
  while(trees.length<(isTouch?220:300)&&tries<8000){tries++;
    let x,z;
    if(R()<0.6){const a=R()*6.283,d=Math.sqrt(R())*FOREST.r;x=FOREST.x+Math.cos(a)*d;z=FOREST.z+Math.sin(a)*d;}
    else{x=(R()-.5)*330;z=(R()-.5)*330;}
    if(Math.hypot(x,z)<36||Math.hypot(x-CAMP.x,z-CAMP.z)<27||H(x,z)<-2.2||onPath(x,z)<3.5) continue;
    trees.push({x,z,s:.8+R()*.6,pine:R()<.6});
  }
  const pines=trees.filter(t=>t.pine),oaks=trees.filter(t=>!t.pine);
  const trunk=new THREE.InstancedMesh(new THREE.CylinderGeometry(.22,.34,2.2,6),M(0x5a3f28),trees.length);
  const pc=new THREE.InstancedMesh(new THREE.ConeGeometry(1.7,4.4,7),M(0x2f5a33),pines.length);
  const oc=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(2,0),M(0x4f7a34),oaks.length);
  const m=new THREE.Matrix4(),q=new THREE.Quaternion(),s=new THREE.Vector3(),p=new THREE.Vector3();
  let pi=0,oi=0;
  trees.forEach((t,i)=>{
    const y=H(t.x,t.z);q.setFromAxisAngle(new THREE.Vector3(0,1,0),R()*6);
    s.set(t.s,t.s,t.s);p.set(t.x,y+1.1*t.s,t.z);m.compose(p,q,s);trunk.setMatrixAt(i,m);
    if(t.pine){p.set(t.x,y+(2.2+2.0)*t.s,t.z);m.compose(p,q,s);pc.setMatrixAt(pi++,m);}
    else{p.set(t.x,y+3.4*t.s,t.z);s.set(t.s,t.s*.9,t.s);m.compose(p,q,s);oc.setMatrixAt(oi++,m);}
    colliders.push({x:t.x,z:t.z,r:.5*t.s});
  });
  [trunk,pc,oc].forEach(im=>{im.castShadow=!isTouch;scene.add(im);});
  // Rocas
  const rocks=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,0),M(0x85837a),60);let n=0;
  while(n<60){const x=(R()-.5)*320,z=(R()-.5)*320;if(Math.hypot(x,z)<30||onPath(x,z)<3||Math.hypot(x-CAMP.x,z-CAMP.z)<22)continue;
    const sc=.5+R()*1.4;q.setFromEuler(new THREE.Euler(R()*3,R()*3,R()*3));s.set(sc,sc*.7,sc);p.set(x,H(x,z)+sc*.2,z);m.compose(p,q,s);rocks.setMatrixAt(n++,m);colliders.push({x,z,r:sc*.8});}
  scene.add(rocks);
}
// Aldea
function house(a,r,wallC,roofC){
  const x=Math.cos(a)*r,z=Math.sin(a)*r,g=new THREE.Group();
  const w=box(6,3.2,5,wallC);w.position.y=1.6;g.add(w);
  const beam=box(6.1,.25,5.1,0x4a3322);beam.position.y=3.2;g.add(beam);
  [-2.9,2.9].forEach(bx=>{const b=box(.25,3.2,.25,0x4a3322);b.position.set(bx,1.6,2.52);g.add(b);});
  const roof=new THREE.Mesh(new THREE.ConeGeometry(4.9,3.2,4),M(roofC));roof.rotation.y=Math.PI/4;roof.scale.set(1.05,1,.88);roof.position.y=4.8;g.add(roof);
  const door=box(1.2,2,.1,0x3a2618);door.position.set(0,1,2.53);g.add(door);
  const win=box(.9,.7,.1,0x2a2a2a);win.position.set(1.8,1.9,2.53);g.add(win);
  g.position.set(x,0,z);g.rotation.y=Math.atan2(-x,-z);
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  scene.add(g);colliders.push({x,z,r:3.6});
}
[[6.08,18,0xcdbb95,0x8a6d3b],[1.45,18,0xc4b08a,0x7a5a2e],[2.1,19,0xd2c29e,0x8a6d3b],[3.4,18,0xbfae8c,0x6b4a2a],[3.95,19,0xcdbb95,0x7a5a2e],[5.0,18,0xc9b690,0x8a6d3b],[5.55,20,0xd2c29e,0x6b4a2a]].forEach(h=>house(...h));
{ // pozo
  const g=new THREE.Group();const base=new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.3,1,10),M(0x8b867a));base.position.y=.5;g.add(base);
  [-0.9,0.9].forEach(px=>{const p=box(.15,2.2,.15,0x4a3322);p.position.set(px,1.6,0);g.add(p);});
  const rf=new THREE.Mesh(new THREE.ConeGeometry(1.5,.9,4),M(0x6b4a2a));rf.rotation.y=Math.PI/4;rf.position.y=3;g.add(rf);
  g.traverse(o=>{if(o.isMesh)o.castShadow=true;});scene.add(g);colliders.push({x:0,z:0,r:1.5});
}
{ // puesto del herrero
  const g=new THREE.Group();const t=box(3.2,1,1.3,0x6b4a2b);t.position.y=.5;g.add(t);
  [[-1.5,-.6],[1.5,-.6],[-1.5,.6],[1.5,.6]].forEach(([px,pz])=>{const p=box(.12,2.6,.12,0x4a3322);p.position.set(px,1.3,pz);g.add(p);});
  const cn=box(3.6,.12,1.8,0x8a2b24);cn.position.y=2.6;cn.rotation.x=.12;g.add(cn);
  const anv=box(.7,.5,.35,0x444444);anv.position.set(1.9,.55,1.4);g.add(anv);
  g.position.set(-9,0,6);g.rotation.y=Math.atan2(9,-6);g.traverse(o=>{if(o.isMesh)o.castShadow=true;});scene.add(g);colliders.push({x:-9,z:6,r:1.8});
}
// Campamento
let fireLight;
{
  const baseY=H(CAMP.x,CAMP.z);
  for(let i=0;i<4;i++){const a=i/4*6.283+.4,x=CAMP.x+Math.cos(a)*9,z=CAMP.z+Math.sin(a)*9;
    const t=new THREE.Mesh(new THREE.ConeGeometry(2.3,3,6),M(0x7a6a4a));t.position.set(x,baseY+1.5,z);t.castShadow=true;scene.add(t);colliders.push({x,z,r:2.1});}
  const fire=new THREE.Mesh(new THREE.ConeGeometry(.6,1.2,6),new THREE.MeshBasicMaterial({color:0xff8a2a}));fire.position.set(CAMP.x,baseY+.6,CAMP.z);scene.add(fire);
  fireLight=new THREE.PointLight(0xff9a40,1.2,16);fireLight.position.set(CAMP.x,baseY+2,CAMP.z);scene.add(fireLight);
  const gap=Math.atan2(-CAMP.z,-CAMP.x);
  for(let i=0;i<46;i++){const a=i/46*6.283;let d=Math.abs(((a-gap+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI);if(d<.35)continue;
    const x=CAMP.x+Math.cos(a)*18,z=CAMP.z+Math.sin(a)*18;const st=new THREE.Mesh(new THREE.CylinderGeometry(.18,.22,2.6,5),M(0x5a3f28));st.position.set(x,H(x,z)+1.2,z);st.castShadow=!isTouch;scene.add(st);colliders.push({x,z,r:.35});}
}

/* ---------- Personajes ---------- */
function weaponMesh(id){
  const it=ITEMS[id],g=new THREE.Group(),inner=new THREE.Group();g.add(inner);
  const wood=0x6b4a2b,steel=0xb9bec4;
  const add=(m,x,y,z)=>{m.position.set(x,y,z);inner.add(m);return m;};
  if(it.kind==='axe'){add(new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,1.2,5),M(wood)),0,.4,0);add(box(.07,.3,.36,steel),0,.9,.14);}
  else if(it.kind==='sword'){const L=id==='espada'?1.2:.8;add(box(.09,L,.03,steel),0,.18+L/2,0);add(box(.34,.06,.1,0x6b5a2b),0,.15,0);add(box(.06,.25,.06,wood),0,0,0);}
  else if(it.kind==='knife'){add(box(.08,.6,.03,steel),0,.45,0);add(box(.22,.05,.08,0x6b5a2b),0,.14,0);add(box(.06,.22,.06,wood),0,0,0);}
  else if(it.kind==='spear'){add(new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,2.4,5),M(wood)),0,.5,0);add(new THREE.Mesh(new THREE.ConeGeometry(.08,.34,6),M(steel)),0,1.85,0);}
  else if(it.kind==='bow'){const b=new THREE.Mesh(new THREE.TorusGeometry(.75,.035,4,14,Math.PI),M(wood));b.rotation.z=Math.PI/2;add(b,.0,0,0);
    add(new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,1.5,3),M(0xddd6c4)),0,0,0);return g;}
  inner.rotation.x=Math.PI/2;return g;
}
function makeHumanoid(o){
  const g=new THREE.Group(),sc=o.scale||1;
  const part=(w,h,d,c,px,py,pz,parent)=>{const m=box(w,h,d,c);m.position.set(px,py,pz);(parent||g).add(m);return m;};
  const pivot=(x,y,z)=>{const p=new THREE.Group();p.position.set(x,y,z);g.add(p);return p;};
  const legL=pivot(.18,.85,0),legR=pivot(-.18,.85,0);
  part(.28,.85,.3,o.pants,0,-.42,0,legL);part(.28,.85,.3,o.pants,0,-.42,0,legR);
  part(.3,.14,.36,0x3a2a1c,0,-.8,.03,legL);part(.3,.14,.36,0x3a2a1c,0,-.8,.03,legR);
  part(.78,.9,.44,o.tunic,0,1.3,0);
  part(.8,.12,.46,0x3a2a1c,0,.98,0);
  if(o.cross){part(.12,.7,.02,o.cross,0,1.32,.23);part(.6,.12,.02,o.cross,0,1.42,.23);}
  const armL=pivot(.5,1.66,0),armR=pivot(-.5,1.66,0);
  part(.22,.72,.24,o.tunic,0,-.34,0,armL);part(.22,.72,.24,o.tunic,0,-.34,0,armR);
  part(.2,.14,.22,o.skin,0,-.76,0,armL);part(.2,.14,.22,o.skin,0,-.76,0,armR);
  const head=new THREE.Group();head.position.y=1.98;g.add(head);
  part(.46,.46,.46,o.skin,0,0,0,head);
  part(.07,.07,.02,0x1a1a1a,.1,.04,.235,head);part(.07,.07,.02,0x1a1a1a,-.1,.04,.235,head);
  if(o.beard) part(.42,.24,.1,o.hair,0,-.2,.22,head);
  const hc=o.helmC||0x777777;
  switch(o.helm){
    case 'nasal':{const c=new THREE.Mesh(new THREE.ConeGeometry(.32,.42,8),M(hc));c.position.y=.36;head.add(c);part(.5,.08,.5,hc,0,.2,0,head);part(.06,.24,.04,hc,0,.06,.25,head);break;}
    case 'kettle':{const b=new THREE.Mesh(new THREE.CylinderGeometry(.44,.44,.04,10),M(hc));b.position.y=.2;head.add(b);const d=new THREE.Mesh(new THREE.SphereGeometry(.27,10,6,0,6.283,0,Math.PI/2),M(hc));d.position.y=.2;head.add(d);break;}
    case 'crest':{part(.5,.22,.5,hc,0,.24,0,head);part(.07,.2,.54,0xa1201e,0,.44,0,head);part(.06,.26,.16,hc,.25,-.02,.1,head);part(.06,.26,.16,hc,-.25,-.02,.1,head);break;}
    case 'round':{const d=new THREE.Mesh(new THREE.SphereGeometry(.28,10,6,0,6.283,0,Math.PI/2),M(hc));d.position.y=.12;head.add(d);break;}
    case 'hood':{part(.54,.54,.5,hc,0,.04,-.05,head);break;}
    case 'bald':break;
    default:{part(.48,.14,.48,o.hair,0,.25,0,head);part(.48,.4,.1,o.hair,0,0,-.22,head);}
  }
  const hand=new THREE.Group();hand.position.y=-.78;armR.add(hand);
  if(o.shield){let s;
    if(o.shield==='rect'){s=box(.08,.95,.62,o.shieldC);}
    else{s=new THREE.Mesh(new THREE.CylinderGeometry(.46,.46,.06,12),M(o.shieldC));s.rotation.z=Math.PI/2;const boss=new THREE.Mesh(new THREE.SphereGeometry(.09,6,4),M(0x999999));boss.position.y=.04;s.add(boss);}
    s.position.set(.16,-.45,.05);armL.add(s);}
  g.scale.setScalar(sc);
  g.traverse(m=>{if(m.isMesh)m.castShadow=true;});
  const h={group:g,legL,legR,armL,armR,hand,weapon:null};
  if(o.weapon) setWeapon(h,o.weapon);
  scene.add(g);return h;
}
function setWeapon(h,id){if(h.weapon)h.hand.remove(h.weapon);h.weapon=weaponMesh(id);h.weapon.traverse(m=>{if(m.isMesh)m.castShadow=true;});h.hand.add(h.weapon);}
function makeWolf(){
  const g=new THREE.Group(),c=0x6e6a64,d=0x55514b;
  const add=(m,x,y,z,p)=>{m.position.set(x,y,z);(p||g).add(m);return m;};
  add(box(.55,.5,1.2,c),0,.78,0);add(box(.42,.4,.45,c),0,.98,.76);add(box(.22,.18,.3,d),0,.9,1.1);
  [-.12,.12].forEach(x=>{const e=new THREE.Mesh(new THREE.ConeGeometry(.07,.18,4),M(d));e.position.set(x,1.25,.7);g.add(e);});
  const tail=add(box(.1,.1,.55,d),0,.9,-.8);tail.rotation.x=.5;
  const legs=[[.18,.45],[-.18,.45],[.18,-.45],[-.18,-.45]].map(([x,z])=>{const p=new THREE.Group();p.position.set(x,.55,z);g.add(p);add(box(.14,.55,.14,d),0,-.27,0,p);return p;});
  g.traverse(m=>{if(m.isMesh)m.castShadow=true;});scene.add(g);
  return {group:g,legs,wolf:true};
}
function hpBar(){
  const g=new THREE.Group();
  const bg=new THREE.Mesh(new THREE.PlaneGeometry(1,.12),new THREE.MeshBasicMaterial({color:0x111111,depthTest:false}));
  const fg=new THREE.Mesh(new THREE.PlaneGeometry(1,.12),new THREE.MeshBasicMaterial({color:0xc0392b,depthTest:false}));
  fg.position.z=.001;g.add(bg,fg);g.renderOrder=10;bg.renderOrder=10;fg.renderOrder=11;g.visible=false;scene.add(g);
  return {g,fg,set(r){fg.scale.x=Math.max(.001,r);fg.position.x=-(1-r)/2;}};
}

/* ---------- Estado ---------- */
let state=null,P=null,started=false,paused=false,isDead=false;
const NPCS=[];
const enemies=[],arrows=[],loot=[],herbs=[],floaters=[];
function newState(race){
  const r=RACES[race];
  return {v:1,race,hp:r.hp,maxHp:r.hp,str:r.str,def:r.def,level:1,xp:0,coins:15,
    inv:[{id:'pocion',q:2},{id:'pan',q:3}],eq:{weapon:r.weapon,armor:r.armor},
    quest:{idx:0,status:'available',progress:0},pos:{x:2,z:10},bossLoot:false,t:Date.now()};
}
const countItem=id=>state.inv.reduce((n,s)=>n+(s.id===id?s.q:0),0);
function addItem(id,q=1){
  const it=ITEMS[id];
  if(it.stack){const s=state.inv.find(s=>s.id===id);if(s){s.q+=q;onInvChange();return true;}}
  if(state.inv.length>=INV_MAX){toast('La mochila está llena');return false;}
  if(it.stack) state.inv.push({id,q}); else for(let i=0;i<q;i++){if(state.inv.length>=INV_MAX)break;state.inv.push({id,q:1});}
  onInvChange();return true;
}
function removeItem(id,q=1){
  for(let i=state.inv.length-1;i>=0&&q>0;i--){const s=state.inv[i];if(s.id!==id)continue;const k=Math.min(q,s.q);s.q-=k;q-=k;if(s.q<=0)state.inv.splice(i,1);}
  onInvChange();
}
function onInvChange(){checkQuest();scheduleSave();if($('#inv').style.display==='block')renderInv();}
const weapon=()=>ITEMS[state.eq.weapon];
const armorDef=()=>state.def+(ITEMS[state.eq.armor]?.def||0);
const xpNeed=()=>80+state.level*60;

/* ---------- Guardado (local + nube) ---------- */
const LS='reinos-hierro-partida-v1';
let savedGame=null,db=null,uid=null,saveTimer=0,autoT=0;
try{const s=localStorage.getItem(LS);if(s)savedGame=migrate(JSON.parse(s));}catch(e){}
const docPath=()=>`data/users/${uid}/partidas/principal`;
function scheduleSave(){clearTimeout(saveTimer);saveTimer=setTimeout(saveNow,1200);}
function saveNow(){
  if(!state)return;
  if(P){state.pos={x:+P.x.toFixed(2),z:+P.z.toFixed(2)};}
  state.t=Date.now();
  try{localStorage.setItem(LS,JSON.stringify(state));}catch(e){}
  if(db&&uid){db.doc(docPath()).set({save:JSON.parse(JSON.stringify(state))}).catch(e=>console.warn('save',e&&e.code));}
}
async function initCloud(){
  try{
    if(!window.claude||typeof window.claude.use!=='function')return;
    const [d,u]=await Promise.all([window.claude.use('db'),window.claude.use('user')]);
    if(!d||!u)return;
    const id=await u.id();if(!id)return;
    db=d;uid=id;
    $('#sync').textContent='☁️ Sincronizado';
    const snap=await db.doc(docPath()).get();
    if(snap.exists){const s=migrate(snap.data().save);if(s&&(!savedGame||s.t>savedGame.t)){savedGame=s;if(!started)refreshContinue();}}
    if(!started)$('#startNote').textContent='Tu partida se guarda en tu cuenta: puedes seguir en el móvil o en el escritorio.';
  }catch(e){console.warn('cloud',e);}
}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&started)saveNow();});

/* ---------- Pantalla inicial ---------- */
let chosen=null;
function statBar(label,v,max){return `<span>${label}</span><i style="width:${Math.round(v/max*100)}%"></i>`;}
function renderRaces(){
  $('#races').innerHTML=Object.entries(RACES).map(([k,r])=>`
    <button class="race" data-r="${k}">
      <div class="shield" style="background:linear-gradient(90deg,${r.c1} 50%,${r.c2} 50%)">${r.init}</div>
      <div style="flex:1">
        <h3>${r.name}</h3><p>${r.blurb}</p>
        <div class="sb">${statBar('Vida',r.hp,130)}${statBar('Fuerza',r.str*r.dmg,17)}${statBar('Defensa',r.def+ITEMS[r.armor].def,15)}${statBar('Velocidad',r.spd,1.25)}</div>
        <div class="gear">${ITEMS[r.weapon].icon} ${ITEMS[r.weapon].name} · ${ITEMS[r.armor].icon} ${ITEMS[r.armor].name}</div>
      </div>
    </button>`).join('');
  document.querySelectorAll('.race').forEach(b=>b.onclick=()=>{
    chosen=b.dataset.r;goArmed=false;clearTimeout(goTimer);$('#go').style.background='';$('#go').style.color='';$('#go').style.borderColor='';document.querySelectorAll('.race').forEach(x=>x.classList.toggle('sel',x===b));
    const g=$('#go');g.disabled=false;g.textContent=`Jugar con los ${RACES[chosen].name}`+(savedGame?' (partida nueva)':'');
    previewRace(chosen);
  });
}
function refreshContinue(){
  const c=$('#cont');
  if(savedGame&&RACES[savedGame.race]){c.style.display='';c.textContent=`Continuar: ${RACES[savedGame.race].name}, nivel ${savedGame.level}`;}
  else c.style.display='none';
}
let goArmed=false,goTimer=0;
$('#go').onclick=()=>{
  if(!chosen)return;
  if(savedGame&&!goArmed){
    goArmed=true;const g=$('#go');
    g.textContent=`Toca otra vez para reemplazar tu partida de ${RACES[savedGame.race].name}`;
    g.style.background='#b23a2b';g.style.color='#f4ecd6';g.style.borderColor='#b23a2b';
    clearTimeout(goTimer);goTimer=setTimeout(resetGo,5000);return;
  }
  goArmed=false;clearTimeout(goTimer);startGame(newState(chosen));
};
function resetGo(){goArmed=false;const g=$('#go');g.style.background='';g.style.color='';g.style.borderColor='';
  if(chosen)g.textContent=`Jugar con los ${RACES[chosen].name}`+(savedGame?' (partida nueva)':'');}
$('#cont').onclick=()=>{if(savedGame)startGame(JSON.parse(JSON.stringify(savedGame)));};
let preview=null;
function previewRace(k){
  if(preview)scene.remove(preview.group);
  const r=RACES[k];preview=makeHumanoid({...r.look,weapon:r.weapon});
  preview.group.position.set(2,H(2,10),10);preview.group.rotation.y=.6;
}

/* ---------- Mundo vivo ---------- */
function spawnNPCs(){
  const edda=makeHumanoid({tunic:0x6a4e6e,pants:0x4a3a4a,skin:0xe6c3a4,hair:0xcfcfcf,helm:'hood',helmC:0x5a4a5a});
  edda.group.position.set(4,0,-2.5);edda.group.rotation.y=Math.atan2(-2,12);
  const mark=new THREE.Mesh(new THREE.OctahedronGeometry(.28,0),new THREE.MeshBasicMaterial({color:0xe8c35a}));scene.add(mark);
  NPCS.push({id:'edda',name:'Edda la curandera',h:edda,x:4,z:-2.5,mark,talk:talkEdda});
  const osric=makeHumanoid({tunic:0x5b3b2b,pants:0x3a2e24,skin:0xd9a97f,hair:0x3a2a1a,beard:true,helm:'bald',weapon:'hacha'});
  osric.group.position.set(-7.6,0,4.2);osric.group.rotation.y=Math.atan2(7.6,-4.2);
  NPCS.push({id:'osric',name:'Osric el herrero',h:osric,x:-7.6,z:4.2,talk:talkOsric});
  NPCS.forEach(n=>{colliders.push({x:n.x,z:n.z,r:.5});});
}
function randIn(cx,cz,r){for(let i=0;i<40;i++){const a=R()*6.283,d=Math.sqrt(R())*r,x=cx+Math.cos(a)*d,z=cz+Math.sin(a)*d;if(H(x,z)>WATER_BLOCK+.5&&!colliders.some(c=>Math.hypot(c.x-x,c.z-z)<c.r+1))return{x,z};}return{x:cx,z:cz};}
function spawnEnemy(type,home,r){
  let m;
  if(type==='lobo')m=makeWolf();
  else if(type==='bandido')m=makeHumanoid({tunic:0x3b3a33,pants:0x2e2a24,skin:0xd9b08c,hair:0x2a2a26,helm:'hood',helmC:0x2a2a26,weapon:'seax'});
  else m=makeHumanoid({tunic:0x5a1f1f,pants:0x2e2a24,skin:0xd9b08c,hair:0x3a2a1a,beard:true,helm:'nasal',helmC:0x55504a,weapon:'hacha',shield:'round',shieldC:0x222222,scale:1.3});
  const e={type,m,home,r,hp:0,maxHp:ETYPES[type].hp,x:0,z:0,rot:0,cd:0,atkT:0,walk:0,wt:0,wx:0,wz:0,dead:false,resp:0,bar:hpBar(),hurtT:0};
  respawn(e);enemies.push(e);
}
function respawn(e){const p=randIn(e.home.x,e.home.z,e.r);e.x=p.x;e.z=p.z;e.hp=e.maxHp;e.dead=false;e.m.group.visible=true;e.aggro=false;e.bar.g.visible=false;}
function spawnWorld(){
  for(let i=0;i<9;i++)spawnEnemy('lobo',{x:FOREST.x,z:FOREST.z},40);
  for(let i=0;i<2;i++)spawnEnemy('lobo',{x:-40,z:-60},14);
  for(let i=0;i<5;i++)spawnEnemy('bandido',{x:CAMP.x,z:CAMP.z},13);
  spawnEnemy('jefe',{x:CAMP.x,z:CAMP.z},4);
  const hg=new THREE.IcosahedronGeometry(.28,0),hm=new THREE.MeshLambertMaterial({color:0x7be36a,emissive:0x2f8a2a});
  for(let i=0;i<11;i++){const p=randIn(FOREST.x,FOREST.z,44);const g=new THREE.Group();
    const c=new THREE.Mesh(hg,hm);c.position.y=.45;g.add(c);
    [-.2,0,.2].forEach(a=>{const l=box(.06,.5,.06,0x3f8a32);l.position.y=.2;l.rotation.z=a*2;g.add(l);});
    g.position.set(p.x,H(p.x,p.z),p.z);scene.add(g);herbs.push({x:p.x,z:p.z,g,active:true,resp:0});}
}
function dropLoot(x,z,what){
  const coins=what.coins, g=new THREE.Group();
  const m=coins?new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.08,10),new THREE.MeshLambertMaterial({color:0xd4d8dc,emissive:0x3a3a3a})):new THREE.Mesh(new THREE.BoxGeometry(.4,.35,.4),new THREE.MeshLambertMaterial({color:0x9a7a4a,emissive:0x3a2a10}));
  if(coins)m.rotation.x=Math.PI/2;g.add(m);
  const ox=(R()-.5)*1.2,oz=(R()-.5)*1.2;g.position.set(x+ox,H(x+ox,z+oz)+.5,z+oz);scene.add(g);
  loot.push({...what,g,x:x+ox,z:z+oz,t:90});
}

/* ---------- Jugador ---------- */
function buildPlayer(){
  const r=RACES[state.race];
  if(preview){scene.remove(preview.group);preview=null;}
  const h=makeHumanoid({...r.look,weapon:state.eq.weapon});
  P={h,x:state.pos.x,z:state.pos.z,rot:Math.PI,atkCd:0,atkT:0,walk:0,lastHurt:-99,regenT:0};
}
function startGame(s){
  state=s;started=true;
  if(!state.quest)state.quest={idx:0,status:'available',progress:0};
  buildPlayer();
  $('#start').style.display='none';
  ['#stats','#quest','#compass'].forEach(q=>$(q).style.display='');
  if(!isTouch){$('#help').style.display='';$('#bInvDesk').style.display='';setTimeout(()=>$('#help').style.display='none',14000);}
  else{$('#btns').style.visibility='visible';$('#joyHint').style.visibility='visible';}
  yaw=P.rot+Math.PI;
  checkQuest();updateHUD();saveNow();
  toast(state.quest.idx===0&&state.quest.status==='available'?'Habla con Edda la curandera, junto al pozo':`Bienvenido de vuelta`);
}

/* ---------- Entrada ---------- */
const keys={};let atkHeld=false,yaw=0,pitch=.42;
const joy={id:null,ox:0,oy:0,x:0,y:0};const drag={id:null,x:0,y:0,moved:0};
addEventListener('keydown',e=>{
  if(!started)return;const k=e.key.toLowerCase();keys[k]=true;
  if(k===' '){e.preventDefault();if(!paused)atkHeld=true;}
  if(k==='e'&&!paused)interact();
  if(k==='i'||k==='tab'){e.preventDefault();toggleInv();}
  if(k==='escape'){closeDialog();closeInv();}
});
addEventListener('keyup',e=>{const k=e.key.toLowerCase();keys[k]=false;if(k===' ')atkHeld=false;});
canvas.addEventListener('pointerdown',e=>{
  if(!started||paused)return;
  if(e.pointerType==='touch'&&e.clientX<innerWidth*.45&&joy.id===null){
    joy.id=e.pointerId;joy.ox=e.clientX;joy.oy=e.clientY;joy.x=joy.y=0;
    const j=$('#joy');j.style.display='block';j.style.left=e.clientX+'px';j.style.top=e.clientY+'px';$('#knob').style.transform='';
    $('#joyHint').style.visibility='hidden';
  }else if(drag.id===null){drag.id=e.pointerId;drag.x=e.clientX;drag.y=e.clientY;drag.moved=0;}
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove',e=>{
  if(e.pointerId===joy.id){let dx=e.clientX-joy.ox,dy=e.clientY-joy.oy;const d=Math.hypot(dx,dy),mx=50;if(d>mx){dx*=mx/d;dy*=mx/d;}
    joy.x=dx/mx;joy.y=dy/mx;$('#knob').style.transform=`translate(${dx}px,${dy}px)`;}
  else if(e.pointerId===drag.id){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;drag.moved+=Math.abs(dx)+Math.abs(dy);
    yaw-=dx*.006;pitch=Math.max(.08,Math.min(1.15,pitch+dy*.004));}
});
function endPtr(e){
  if(e.pointerId===joy.id){joy.id=null;joy.x=joy.y=0;$('#joy').style.display='none';}
  else if(e.pointerId===drag.id){if(drag.moved<8&&e.type==='pointerup'&&!paused&&started)attack();drag.id=null;}
}
canvas.addEventListener('pointerup',endPtr);canvas.addEventListener('pointercancel',endPtr);
function holdBtn(el,down,up){el.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();down();});if(up){el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('pointerleave',up);}}
holdBtn($('#bAtk'),()=>{if(!paused){atkHeld=true;attack();}},()=>atkHeld=false);
holdBtn($('#bUse'),()=>{if(!paused)interact();});
holdBtn($('#bInv'),toggleInv);
$('#bInvDesk').onclick=toggleInv;

/* ---------- Combate ---------- */
function nearestEnemy(maxD,facingOnly){
  let best=null,bd=maxD;const fx=Math.sin(P.rot),fz=Math.cos(P.rot);
  for(const e of enemies){if(e.dead)continue;const dx=e.x-P.x,dz=e.z-P.z,d=Math.hypot(dx,dz);
    if(d<bd&&(!facingOnly||(dx*fx+dz*fz)/d>0.3)){best=e;bd=d;}}
  return best;
}
function attack(){
  if(!started||paused||isDead||P.atkCd>0)return;
  const w=weapon();P.atkCd=w.ranged?.75:.55;P.atkT=.3;
  const t=w.ranged?(nearestEnemy(w.range,true)||nearestEnemy(9,false)):nearestEnemy(w.range+2.5,false);
  if(t)P.rot=Math.atan2(t.x-P.x,t.z-P.z);
  if(w.ranged){
    const a=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,w.kind==='spear'?1.7:.9,4),M(0x8a6a3a));
    const y=H(P.x,P.z)+1.55;a.position.set(P.x+Math.sin(P.rot)*.6,y,P.z+Math.cos(P.rot)*.6);
    let dir=new THREE.Vector3(Math.sin(P.rot),0,Math.cos(P.rot));
    if(t){const ty=H(t.x,t.z)+(t.type==='lobo'?.8:1.3);dir=new THREE.Vector3(t.x-a.position.x,ty-y,t.z-a.position.z).normalize();}
    a.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);scene.add(a);
    arrows.push({m:a,dir,life:1.3,dmg:rollDmg()});
  }else{
    const fx=Math.sin(P.rot),fz=Math.cos(P.rot);
    setTimeout(()=>{for(const e of enemies){if(e.dead)continue;const dx=e.x-P.x,dz=e.z-P.z,d=Math.hypot(dx,dz);
      const reach=w.range+(e.type==='jefe'?.6:.2);if(d<reach&&(d<.8||(dx*fx+dz*fz)/d>0.1))hitEnemy(e,rollDmg());}},110);
  }
}
function rollDmg(){const w=weapon(),r=RACES[state.race];let d=(w.dmg+state.str*.6)*r.dmg*(.85+Math.random()*.3);const crit=Math.random()<.1;if(crit)d*=1.6;return{v:Math.round(d),crit};}
function hitEnemy(e,{v,crit}){
  e.hp-=v;e.aggro=true;e.hurtT=.18;e.bar.g.visible=true;e.bar.set(Math.max(0,e.hp/e.maxHp));
  floatText(`${v}`,e.x,H(e.x,e.z)+(e.type==='lobo'?1.4:2.4),e.z,crit?'crit':'');
  if(e.hp<=0)killEnemy(e);
}
function killEnemy(e){
  const T=ETYPES[e.type];e.dead=true;e.m.group.visible=false;e.bar.g.visible=false;e.resp=e.type==='jefe'?180:40;
  gainXp(T.xp);
  const q=QUESTS[state.quest.idx];
  if(q&&state.quest.status==='active'&&q.type==='kill'&&q.target===e.type){state.quest.progress++;checkQuest();}
  if(e.type==='lobo'){if(Math.random()<.75)dropLoot(e.x,e.z,{item:'piel'});}
  else if(e.type==='bandido'){dropLoot(e.x,e.z,{coins:6+Math.floor(Math.random()*9)});if(Math.random()<.3)dropLoot(e.x,e.z,{item:'pan'});if(Math.random()<.12)dropLoot(e.x,e.z,{item:'pocion'});}
  else{dropLoot(e.x,e.z,{coins:60});
    if(q&&q.id==='jefe'&&countItem('sello')===0)dropLoot(e.x,e.z,{item:'sello'});
    if(!state.bossLoot){state.bossLoot=true;dropLoot(e.x,e.z,{item:'cota'});}
    toast('¡El jefe de los proscritos ha caído!');}
  updateHUD();scheduleSave();
}
function gainXp(n){
  state.xp+=n;
  while(state.xp>=xpNeed()){state.xp-=xpNeed();state.level++;state.maxHp+=12;state.str+=1;state.hp=state.maxHp;toast(`¡Nivel ${state.level}! Más vida y más fuerza`);}
  updateHUD();
}
function hurtPlayer(dmg){
  if(isDead)return;
  const d=armorDef(),v=Math.max(1,Math.round(dmg*(1-d/(d+20))*(.85+Math.random()*.3)));
  state.hp-=v;P.lastHurt=clock;floatText(`-${v}`,P.x,H(P.x,P.z)+2.4,P.z,'me');
  const h=$('#hurt');h.style.opacity=.9;setTimeout(()=>h.style.opacity=0,160);
  if(state.hp<=0){state.hp=0;die();}
  updateHUD();
}
function die(){
  isDead=true;const lost=Math.floor(state.coins*.2);state.coins-=lost;
  $('#deadTxt').textContent=lost?`Perdiste ${lost} peniques de plata en la huida.`:'Los aldeanos te llevaron de vuelta.';
  $('#dead').style.display='grid';atkHeld=false;
}
$('#revive').onclick=()=>{
  isDead=false;$('#dead').style.display='none';state.hp=Math.round(state.maxHp*.6);P.x=2;P.z=10;
  enemies.forEach(e=>{e.aggro=false;});updateHUD();saveNow();
};

/* ---------- Misiones y diálogos ---------- */
function checkQuest(){
  const q=QUESTS[state.quest.idx],s=state.quest;if(!q)return;
  if(s.status==='active'||s.status==='ready'){
    if(q.type!=='kill')s.progress=countItem(q.item);
    const was=s.status;s.status=s.progress>=q.goal?'ready':'active';
    if(was==='active'&&s.status==='ready')toast('Misión lista: vuelve con Edda la curandera');
  }
  updateHUD();
}
function openDialog(name,text,opts){
  paused=true;atkHeld=false;$('#dlgName').textContent=name;$('#dlgText').textContent=text;
  const box=$('#dlgOpts');box.innerHTML='';
  opts.forEach(o=>{const b=document.createElement('button');b.className='opt'+(o.main?' main':'');b.textContent=o.label;b.disabled=!!o.disabled;b.onclick=o.fn;box.appendChild(b);});
  $('#dialog').style.display='block';
}
function closeDialog(){if($('#dialog').style.display!=='block')return;$('#dialog').style.display='none';paused=$('#inv').style.display==='block';}
function talkEdda(){
  const q=QUESTS[state.quest.idx],s=state.quest.status,r=RACES[state.race];
  if(!q)return openDialog('Edda la curandera','La aldea te debe mucho. Sigue explorando: los lobos y los proscritos siempre vuelven.',[{label:'Adiós',fn:closeDialog}]);
  if(s==='available')openDialog('Edda la curandera',q.intro(r),[
    {label:`Aceptar: ${q.title}`,main:true,fn:()=>{state.quest.status='active';state.quest.progress=0;checkQuest();toast(`Nueva misión: ${q.title}`);closeDialog();scheduleSave();}},
    {label:'Ahora no',fn:closeDialog}]);
  else if(s==='active')openDialog('Edda la curandera',`${q.remind} (${q.label}: ${state.quest.progress}/${q.goal})`,[{label:'Voy para allá',fn:closeDialog}]);
  else{
    const rw=q.reward,items=rw.items.map(([id,n])=>`${ITEMS[id].icon} ${ITEMS[id].name}${n>1?' ×'+n:''}`).join(', ');
    openDialog('Edda la curandera',`${q.done}\n\nRecompensa: ${rw.coins} peniques de plata, ${rw.xp} de experiencia, ${items}.`,[
      {label:'Recibir recompensa',main:true,fn:()=>{
        if(q.type!=='kill')removeItem(q.item,q.goal);
        state.coins+=rw.coins;rw.items.forEach(([id,n])=>addItem(id,n));gainXp(rw.xp);
        state.quest={idx:state.quest.idx+1,status:'available',progress:0};
        closeDialog();toast(`Misión completada: ${q.title}`);updateHUD();saveNow();}}]);
  }
}
function talkOsric(){
  const pieles=countItem('piel');
  const opts=SHOP.map(id=>{const it=ITEMS[id];return{label:`Comprar ${it.icon} ${it.name}: ${it.price} peniques`,disabled:state.coins<it.price,
    fn:()=>{if(state.coins<it.price)return;if(addItem(id,1)){state.coins-=it.price;updateHUD();scheduleSave();toast(`Compraste ${it.name}`);}talkOsric();}};});
  if(pieles)opts.unshift({label:`Vender ${pieles} ${pieles>1?'pieles':'piel'} de lobo: ${pieles*ITEMS.piel.price} peniques`,main:true,fn:()=>{state.coins+=pieles*ITEMS.piel.price;removeItem('piel',pieles);updateHUD();talkOsric();}});
  opts.push({label:'Adiós',fn:closeDialog});
  openDialog('Osric el herrero',`Tienes ${state.coins} peniques de plata. Hierro, cuero y algo de comida. Y compro pieles de lobo, si traes.`,opts);
}
let nearNpc=null;
function interact(){if(nearNpc)nearNpc.talk();}

/* ---------- Mochila ---------- */
let selSlot=-1;
function toggleInv(){if(!started)return;if($('#inv').style.display==='block')closeInv();else{closeDialog();paused=true;atkHeld=false;selSlot=-1;renderInv();$('#inv').style.display='block';}}
function closeInv(){if($('#inv').style.display!=='block')return;$('#inv').style.display='none';paused=$('#dialog').style.display==='block';}
$('#invX').onclick=closeInv;
function renderInv(){
  const w=weapon(),a=ITEMS[state.eq.armor],r=RACES[state.race];
  $('#invStats').innerHTML=`<span>${r.name}</span><span>Nivel <b>${state.level}</b></span><span>Vida <b>${Math.ceil(state.hp)}/${state.maxHp}</b></span><span>Daño <b>${Math.round((w.dmg+state.str*.6)*r.dmg)}</b></span><span>Defensa <b>${armorDef()}</b></span><span>🪙 <b>${state.coins}</b></span>`;
  $('#eqW').innerHTML=`<span class="ic">${w.icon}</span><div>${w.name}<small>Arma · daño ${w.dmg}${w.ranged?' · a distancia':''}</small></div>`;
  $('#eqA').innerHTML=`<span class="ic">${a.icon}</span><div>${a.name}<small>Armadura · defensa ${a.def}</small></div>`;
  let html='';
  for(let i=0;i<INV_MAX;i++){const s=state.inv[i];html+=`<button class="slot${i===selSlot?' sel':''}" data-i="${i}" ${s?`aria-label="${ITEMS[s.id].name}"`:'aria-label="Vacío"'}>${s?ITEMS[s.id].icon+(s.q>1?`<b>${s.q}</b>`:''):''}</button>`;}
  $('#grid').innerHTML=html;
  document.querySelectorAll('.slot').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;if(!state.inv[i])return;selSlot=i;renderInv();});
  const d=$('#detail'),s=state.inv[selSlot];
  if(!s){d.innerHTML=state.inv.length?'Toca un objeto para ver qué puedes hacer con él.':'La mochila está vacía. Derrota enemigos y explora para encontrar objetos.';return;}
  const it=ITEMS[s.id];let stat='';
  if(it.type==='weapon')stat=` Daño ${it.dmg}${it.ranged?', a distancia':''}.`;if(it.type==='armor')stat=` Defensa ${it.def}.`;
  d.innerHTML=`<div class="n">${it.icon} ${it.name}${s.q>1?' ×'+s.q:''}</div>${it.desc}${stat}<div class="acts"></div>`;
  const acts=d.querySelector('.acts');
  const btn=(t,f)=>{const b=document.createElement('button');b.textContent=t;b.onclick=f;acts.appendChild(b);};
  if(it.type==='weapon'||it.type==='armor')btn('Equipar',()=>equip(selSlot));
  if(it.type==='use')btn(`Usar (+${it.heal} vida)`,()=>{if(state.hp>=state.maxHp){toast('Ya tienes la vida al máximo');return;}state.hp=Math.min(state.maxHp,state.hp+it.heal);floatText(`+${it.heal}`,P.x,H(P.x,P.z)+2.4,P.z,'heal');removeItem(s.id,1);if(!state.inv[selSlot]||state.inv[selSlot].id!==s.id)selSlot=-1;updateHUD();renderInv();});
  if(it.type!=='quest')btn('Tirar',()=>{removeItem(s.id,1);if(!state.inv[selSlot])selSlot=-1;renderInv();});
}
function equip(i){
  const s=state.inv[i],it=ITEMS[s.id],slot=it.type==='weapon'?'weapon':'armor';
  const old=state.eq[slot];state.inv.splice(i,1);state.eq[slot]=s.id;state.inv.push({id:old,q:1});
  if(slot==='weapon')setWeapon(P.h,s.id);
  selSlot=-1;toast(`Equipaste ${it.name}`);onInvChange();renderInv();
}

/* ---------- HUD ---------- */
let toastT=0;
function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('on'),2600);}
function updateHUD(){
  if(!state)return;const r=RACES[state.race];
  $('#who').textContent=`${r.name} · ${ITEMS[state.eq.weapon].icon}`;
  $('#hpbar i').style.width=(state.hp/state.maxHp*100)+'%';
  $('#xpbar i').style.width=(state.xp/xpNeed()*100)+'%';
  $('#hpTxt').textContent=`${Math.ceil(state.hp)}/${state.maxHp}`;$('#lvTxt').textContent=state.level;$('#coinTxt').textContent=state.coins;
  const q=QUESTS[state.quest.idx],s=state.quest.status;
  if(!q){$('#qT').textContent='Tierra en paz';$('#qP').textContent='Explora libremente. Los enemigos reaparecen.';}
  else{$('#qT').textContent=q.title;
    $('#qP').textContent=s==='available'?'Habla con Edda la curandera':s==='ready'?'Vuelve con Edda la curandera':`${q.label}: ${state.quest.progress}/${q.goal}`;}
}
function objective(){
  const q=QUESTS[state.quest.idx];if(!q)return null;const s=state.quest.status;
  if(s!=='active')return{x:4,z:-2.5,label:'Edda'};
  if(q.id==='lobos')return{x:FOREST.x,z:FOREST.z,label:'Bosque'};
  if(q.id==='hierbas'){let b=null,bd=1e9;herbs.forEach(h=>{if(!h.active)return;const d=Math.hypot(h.x-P.x,h.z-P.z);if(d<bd){bd=d;b=h;}});return b?{x:b.x,z:b.z,label:'Hierba'}:{x:FOREST.x,z:FOREST.z,label:'Bosque'};}
  return{x:CAMP.x,z:CAMP.z,label:'Campamento'};
}
const tmpV=new THREE.Vector3();
function floatText(t,x,y,z,cls){const el=document.createElement('div');el.className='dmg '+(cls||'');el.textContent=t;document.body.appendChild(el);floaters.push({el,x,y,z,t:0});}

/* ---------- Bucle ---------- */
let clock=0,last=performance.now();
function movable(x,z){return H(x,z)>WATER_BLOCK&&Math.abs(x)<172&&Math.abs(z)<172;}
function resolve(o,rad){for(const c of colliders){const dx=o.x-c.x,dz=o.z-c.z,rr=c.r+rad;if(dx>rr||dx<-rr||dz>rr||dz<-rr)continue;const d=Math.hypot(dx,dz);if(d<rr&&d>1e-4){o.x=c.x+dx/d*rr;o.z=c.z+dz/d*rr;}}}
function animHuman(h,walk,moving,atkT,ranged){
  const s=moving?Math.sin(walk):0;
  h.legL.rotation.x=s*.7;h.legR.rotation.x=-s*.7;h.armL.rotation.x=-s*.45;
  if(atkT>0){const k=1-atkT/.3;h.armR.rotation.x=ranged?-1.5:(-2.7+k*2.5);}else h.armR.rotation.x=s*.45;
}
function update(dt){
  clock+=dt;
  // Movimiento
  let ix=0,iy=0;
  if(keys['w']||keys['arrowup'])iy+=1;if(keys['s']||keys['arrowdown'])iy-=1;if(keys['d']||keys['arrowright'])ix+=1;if(keys['a']||keys['arrowleft'])ix-=1;
  if(joy.id!==null){ix+=joy.x;iy-=joy.y;}
  let mag=Math.min(1,Math.hypot(ix,iy));let moving=false;
  if(!isDead&&mag>.12){
    const fx=-Math.sin(yaw),fz=-Math.cos(yaw),rx=-fz,rz=fx;
    let dx=fx*iy+rx*ix,dz=fz*iy+rz*ix;const dl=Math.hypot(dx,dz);dx/=dl;dz/=dl;
    const sp=5.2*RACES[state.race].spd*(keys['shift']?1.5:1)*mag*(P.atkT>0?.5:1);
    const nx=P.x+dx*sp*dt,nz=P.z+dz*sp*dt;
    if(movable(nx,nz)){P.x=nx;P.z=nz;}else if(movable(nx,P.z))P.x=nx;else if(movable(P.x,nz))P.z=nz;
    resolve(P,.45);
    const target=Math.atan2(dx,dz);let diff=((target-P.rot+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;P.rot+=diff*Math.min(1,dt*12);
    P.walk+=dt*sp*1.6;moving=true;
  }
  P.atkCd-=dt;P.atkT=Math.max(0,P.atkT-dt);
  if(atkHeld)attack();
  const g=P.h.group;g.position.set(P.x,H(P.x,P.z),P.z);g.rotation.y=P.rot;animHuman(P.h,P.walk,moving,P.atkT,weapon().ranged);
  // Regeneración fuera de combate
  if(!isDead&&clock-P.lastHurt>6&&state.hp<state.maxHp){P.regenT+=dt;if(P.regenT>1){P.regenT=0;state.hp=Math.min(state.maxHp,state.hp+1+state.level*.3);updateHUD();}}
  // Enemigos
  for(const e of enemies)updateEnemy(e,dt);
  // Flechas
  for(let i=arrows.length-1;i>=0;i--){const a=arrows[i];a.life-=dt;a.m.position.addScaledVector(a.dir,32*dt);let hit=false;
    for(const e of enemies){if(e.dead)continue;const dy=a.m.position.y-H(e.x,e.z);if(Math.hypot(e.x-a.m.position.x,e.z-a.m.position.z)<(e.type==='jefe'?1.2:.9)&&dy>0&&dy<2.8){hitEnemy(e,a.dmg);hit=true;break;}}
    if(hit||a.life<=0||a.m.position.y<H(a.m.position.x,a.m.position.z)){scene.remove(a.m);arrows.splice(i,1);}}
  // Botín
  for(let i=loot.length-1;i>=0;i--){const l=loot[i];l.t-=dt;l.g.rotation.y+=dt*2;l.g.position.y=H(l.x,l.z)+.5+Math.sin(clock*3+i)*.12;
    if(!isDead&&Math.hypot(l.x-P.x,l.z-P.z)<1.7){let ok=true;
      if(l.coins){state.coins+=l.coins;floatText(`+${l.coins} 🪙`,P.x,H(P.x,P.z)+2.4,P.z,'heal');updateHUD();scheduleSave();}
      else{ok=addItem(l.item,1);if(ok)toast(`${ITEMS[l.item].icon} ${ITEMS[l.item].name}`);}
      if(ok){scene.remove(l.g);loot.splice(i,1);continue;}}
    if(l.t<=0){scene.remove(l.g);loot.splice(i,1);}}
  for(const h of herbs){
    if(!h.active){h.resp-=dt;if(h.resp<=0){h.active=true;h.g.visible=true;}continue;}
    h.g.children[0].rotation.y+=dt*1.5;
    if(Math.hypot(h.x-P.x,h.z-P.z)<1.6&&addItem('hierba',1)){h.active=false;h.g.visible=false;h.resp=70;toast('🌿 Hierba curativa');}
  }
  // PNJ cercano
  nearNpc=null;for(const n of NPCS){if(Math.hypot(n.x-P.x,n.z-P.z)<3.4)nearNpc=n;}
  const pr=$('#prompt');
  if(nearNpc){pr.style.display='block';pr.textContent=isTouch?`${nearNpc.name}: toca Hablar`:`E para hablar con ${nearNpc.name}`;}else pr.style.display='none';
  $('#bUse').classList.toggle('ready',!!nearNpc);
  autoT+=dt;if(autoT>20){autoT=0;saveNow();}
}
function updateEnemy(e,dt){
  const T=ETYPES[e.type];
  if(e.dead){e.resp-=dt;if(e.resp<=0&&Math.hypot(e.home.x-P.x,e.home.z-P.z)>25)respawn(e);return;}
  const dx=P.x-e.x,dz=P.z-e.z,d=Math.hypot(dx,dz);
  let mx=0,mz=0,sp=0;e.cd-=dt;e.atkT=Math.max(0,e.atkT-dt);
  const fromHome=Math.hypot(e.x-e.home.x,e.z-e.home.z);
  if(!isDead&&(d<T.aggro||(e.aggro&&d<T.aggro*2.2))&&fromHome<60){
    e.aggro=true;
    if(d>T.range*.85){mx=dx/d;mz=dz/d;sp=T.spd;}
    else if(e.cd<=0){e.cd=T.cd;e.atkT=.3;setTimeout(()=>{if(!e.dead&&Math.hypot(P.x-e.x,P.z-e.z)<T.range+.6)hurtPlayer(T.dmg);},180);}
    e.rot=Math.atan2(dx,dz);
  }else{
    e.aggro=false;
    if(fromHome>e.r+4){mx=(e.home.x-e.x)/fromHome;mz=(e.home.z-e.z)/fromHome;sp=T.spd*.6;}
    else{e.wt-=dt;if(e.wt<=0){e.wt=2+Math.random()*4;const a=Math.random()*6.283;const idle=Math.random()<.4;e.wx=idle?0:Math.sin(a);e.wz=idle?0:Math.cos(a);}
      mx=e.wx;mz=e.wz;sp=T.spd*.3;}
    if(mx||mz)e.rot=Math.atan2(mx,mz);
  }
  if(sp>0){const nx=e.x+mx*sp*dt,nz=e.z+mz*sp*dt;if(movable(nx,nz)){e.x=nx;e.z=nz;}resolve(e,e.type==='jefe'?.7:.45);e.walk+=dt*sp*1.8;}
  const y=H(e.x,e.z),g=e.m.group;g.position.set(e.x,y,e.z);g.rotation.y=e.rot;
  e.hurtT=Math.max(0,e.hurtT-dt);const base=e.type==='jefe'?1.3:1;g.scale.setScalar(base*(1+e.hurtT*.6));
  const moving=sp>0;
  if(e.m.wolf){const s=moving?Math.sin(e.walk*1.4):0;e.m.legs.forEach((l,i)=>l.rotation.x=(i%3===0?s:-s)*.6);g.rotation.x=e.atkT>0?-.25:0;}
  else animHuman(e.m,e.walk,moving,e.atkT,false);
  if(e.bar.g.visible){e.bar.g.position.set(e.x,y+(e.type==='lobo'?1.6:e.type==='jefe'?3.3:2.6),e.z);e.bar.g.quaternion.copy(camera.quaternion);}
}
function updateCamera(dt){
  let tx,tz,ty;
  if(started){tx=P.x;tz=P.z;ty=H(P.x,P.z)+1.6;}
  else{yaw+=dt*.08;tx=2;tz=10;ty=1.5;}
  const dist=started?7.5:9;
  let cx=tx+Math.sin(yaw)*dist*Math.cos(pitch),cz=tz+Math.cos(yaw)*dist*Math.cos(pitch),cy=ty+Math.sin(pitch)*dist;
  cy=Math.max(cy,H(cx,cz)+.8);
  camera.position.lerp(tmpV.set(cx,cy,cz),started?Math.min(1,dt*10):1);
  camera.lookAt(tx,ty,tz);
  sun.position.set(tx+25,ty+45,tz+18);sun.target.position.set(tx,ty,tz);
}
function frameUI(dt){
  // PNJ, marcas y fuego
  NPCS.forEach(n=>{n.h.group.position.y=H(n.x,n.z);animHuman(n.h,clock*2,false,0,false);});
  const edda=NPCS[0];
  if(edda&&state){const s=state.quest.status,show=QUESTS[state.quest.idx]&&s!=='active';edda.mark.visible=show;
    edda.mark.material.color.setHex(s==='ready'?0x8fe36a:0xe8c35a);edda.mark.position.set(edda.x,H(edda.x,edda.z)+2.9+Math.sin(clock*3)*.12,edda.z);edda.mark.rotation.y+=dt*2;}
  if(fireLight)fireLight.intensity=1.1+Math.sin(clock*13)*.15+Math.sin(clock*7.3)*.1;
  // Brújula
  if(started){const o=objective();const cmp=$('#compass');
    if(o){cmp.style.visibility='';const th=Math.atan2(o.x-P.x,o.z-P.z),ch=yaw+Math.PI;const rel=th-ch;
      $('#arrow svg').style.transform=`rotate(${-rel}rad)`;$('#cmpTxt').textContent=`${o.label} · ${Math.round(Math.hypot(o.x-P.x,o.z-P.z))} m`;}
    else cmp.style.visibility='hidden';}
  // Textos flotantes
  for(let i=floaters.length-1;i>=0;i--){const f=floaters[i];f.t+=dt;
    tmpV.set(f.x,f.y+f.t*1.2,f.z).project(camera);
    if(f.t>.9||tmpV.z>1){f.el.remove();floaters.splice(i,1);continue;}
    f.el.style.transform=`translate(${(tmpV.x*.5+.5)*innerWidth}px,${(-tmpV.y*.5+.5)*innerHeight}px) translate(-50%,-50%)`;f.el.style.opacity=1-f.t/.9;}
}
function loop(now){
  requestAnimationFrame(loop);
  const dt=Math.min(.05,(now-last)/1000);last=now;
  if(started&&!paused)update(dt);else clock+=dt;
  frameUI(dt);updateCamera(dt);renderer.render(scene,camera);
}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});

/* ---------- Inicio ---------- */
spawnNPCs();spawnWorld();renderRaces();refreshContinue();previewRace('vikingos');
$('#startNote').textContent='Tu partida se guarda automáticamente.';
initCloud();
requestAnimationFrame(loop);
