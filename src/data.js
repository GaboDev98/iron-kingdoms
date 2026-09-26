// Datos del juego: pueblos, objetos, misiones y enemigos.
// Edita aquí para añadir contenido sin tocar la lógica.
/* ---------- Datos ---------- */
// Ambientación: el Danelaw (norte y este de Inglaterra bajo ley danesa), hacia el año 950.
export const RACES={
  vikingos:{name:'Vikingos',one:'colono danés',init:'V',c1:'#4f6272',c2:'#c9a15a',blurb:'Colonos daneses asentados en el Danelaw desde el siglo IX. El hacha de mango largo era su arma más temida.',hp:120,str:14,def:4,spd:1.0,dmg:1.12,weapon:'hacha',armor:'tunica',
    look:{tunic:0x4f6272,pants:0x3a3226,skin:0xe9c7a4,hair:0xc9a15a,beard:true,helm:'nasal',helmC:0x8a8f93,shield:'round',shieldC:0x9b2f2a}},
  anglosajones:{name:'Anglosajones',one:'guerrero anglosajón',init:'A',c1:'#7a6a3a',c2:'#7a2a1a',blurb:'Gente del reino de Inglaterra, unificado en 927. Lanza de fresno, seax y escudo redondo.',hp:112,str:11,def:5,spd:1.02,dmg:1.0,weapon:'lanza',armor:'tunica',
    look:{tunic:0x7a6a3a,pants:0x4a3e30,skin:0xecc9a8,hair:0x8a6a40,beard:true,helm:'none',shield:'round',shieldC:0x7a2a1a}},
  irlandeses:{name:'Irlandeses',one:'guerrero irlandés',init:'I',c1:'#3a5a3a',c2:'#b08d3c',blurb:'Guerreros gaélicos con poca armadura. Lanzaban jabalinas antes de trabarse cuerpo a cuerpo.',hp:95,str:10,def:3,spd:1.15,dmg:1.0,weapon:'jabalina',armor:'tunica',
    look:{tunic:0x3a5a3a,pants:0x4a3a2a,skin:0xf2d2b8,hair:0x7a4a22,beard:true,helm:'none',shield:'round',shieldC:0x5a3a2a}},
  escoceses:{name:'Escoceses',one:'guerrero de Alba',init:'E',c1:'#4a4a6a',c2:'#8a7a4a',blurb:'Del reino de Alba, al norte. Gaélicos en trato constante con los nórdicos; hacha de mano y escudo.',hp:108,str:12,def:4,spd:1.08,dmg:1.05,weapon:'hachamano',armor:'tunica',
    look:{tunic:0x4a4a6a,pants:0x3a3226,skin:0xecc9a8,hair:0x5a3a20,beard:true,helm:'none',shield:'round',shieldC:0x3a2a1a}},
  francos:{name:'Francos',one:'guerrero franco',init:'F',c1:'#2c4a8a',c2:'#b9bec4',blurb:'De Francia Occidental. Sus espadas eran las mejores de Europa; los reyes carolingios prohibían venderlas a los nórdicos.',hp:105,str:12,def:6,spd:1.0,dmg:1.08,weapon:'carolingia',armor:'tunica',
    look:{tunic:0x2c4a8a,pants:0x4a3e30,skin:0xecc6a2,hair:0x7a5230,helm:'nasal',helmC:0x9a9a9a,shield:'round',shieldC:0xb9bec4}},
  bizantinos:{name:'Bizantinos',one:'soldado romano de Oriente',init:'B',c1:'#7a1f3d',c2:'#c9a44c',blurb:'Romanos de Constantinopla: así se llamaban a sí mismos. Reclutaban mercenarios nórdicos, antecedente de la Guardia Varega.',hp:110,str:11,def:4,spd:0.97,dmg:1.0,weapon:'spathion',armor:'klibanion',
    look:{tunic:0x7a1f3d,pants:0x5a4a3a,skin:0xd9a97f,hair:0x2a1d14,beard:true,helm:'round',helmC:0x8a8a8a,shield:'round',shieldC:0x7a1f3d}},
};
const RACE_MAP={ingleses:'anglosajones',sajones:'anglosajones',romanos:'bizantinos'};
const ITEM_MAP={gladius:'spathion',scutum:'klibanion',francisca:'hachamano'};
export const ITEMS={
  hacha:{name:'Hacha danesa',icon:'🪓',type:'weapon',dmg:17,range:2.4,kind:'axe',price:45,desc:'Hacha de mango largo de los daneses.'},
  hachamano:{name:'Hacha de mano',icon:'🪓',type:'weapon',dmg:15,range:2.1,kind:'axe',price:30,desc:'Hacha corta de una mano.'},
  lanza:{name:'Lanza de fresno',icon:'🔱',type:'weapon',dmg:13,range:3.2,kind:'spear',price:25,desc:'El arma más común de la época.'},
  jabalina:{name:'Jabalinas',icon:'🔱',type:'weapon',dmg:12,range:18,ranged:true,kind:'spear',price:25,desc:'Se lanzan a distancia antes del choque.'},
  seax:{name:'Seax',icon:'🔪',type:'weapon',dmg:13,range:2.0,kind:'knife',price:25,desc:'Cuchillo largo de un filo.'},
  carolingia:{name:'Espada carolingia',icon:'🗡️',type:'weapon',dmg:17,range:2.4,kind:'sword',price:80,desc:'Espada franca de hoja ancha y recta.'},
  spathion:{name:'Spathion',icon:'🗡️',type:'weapon',dmg:15,range:2.3,kind:'sword',price:60,desc:'Espada recta bizantina.'},
  arco:{name:'Arco simple',icon:'🏹',type:'weapon',dmg:12,range:24,ranged:true,kind:'bow',price:40,desc:'Arco de una sola pieza de madera, el habitual en la época.'},
  espada:{name:'Espada vikinga',icon:'⚔️',type:'weapon',dmg:22,range:2.5,kind:'sword',price:120,desc:'Hoja con la inscripción +VLFBERH+T, forjada en tierras francas del Rin.'},
  tunica:{name:'Túnica de lana gruesa',icon:'🧥',type:'armor',def:2,price:10,desc:'Protección básica.'},
  klibanion:{name:'Klibanion',icon:'🛡️',type:'armor',def:6,price:60,desc:'Armadura de láminas bizantina.'},
  cota:{name:'Brynja (cota de malla)',icon:'⛓️',type:'armor',def:7,price:70,desc:'Anillas de hierro entrelazadas. Muy cara en esta época.'},
  pocion:{name:'Ungüento de hierbas',icon:'🫙',type:'use',heal:45,stack:true,price:12,desc:'Remedio de curandera. Recupera 45 de vida.'},
  pan:{name:'Pan de centeno',icon:'🍞',type:'use',heal:20,stack:true,price:4,desc:'Recupera 20 de vida.'},
  hierba:{name:'Hierba curativa',icon:'🌿',type:'mat',stack:true,price:3,desc:'La curandera Edda las necesita.'},
  piel:{name:'Piel de lobo',icon:'🐺',type:'mat',stack:true,price:6,desc:'El herrero te la compra.'},
  sello:{name:'Brazalete de plata del jefe',icon:'💍',type:'quest',desc:'Los jefes nórdicos lucían y repartían brazaletes de plata.'},
};
export const QUESTS=[
  {id:'lobos',title:'Lobos en el bosque',type:'kill',target:'lobo',goal:3,label:'Lobos cazados',
    intro:r=>`¡Bienvenido, ${r.one}! En esta aldea vivimos daneses y anglosajones, y a todos nos matan las ovejas los lobos del bosque del oeste. Caza tres y te pagaré en plata.`,
    remind:'Los lobos rondan el bosque. Sigue la flecha de la brújula.',done:'Ya no se oyen aullidos. Toma esto, te lo has ganado.',
    reward:{coins:30,xp:60,items:[['pocion',2]]}},
  {id:'hierbas',title:'Hierbas para Edda',type:'collect',item:'hierba',goal:5,label:'Hierbas',
    intro:()=>'Soy la curandera de la aldea y mis viejos huesos ya no aguantan el camino. Tráeme cinco hierbas curativas; brillan entre los árboles del bosque.',
    remind:'Las hierbas brillan en verde entre los árboles.',done:'Justo lo que necesitaba. Con esto prepararé ungüentos para todo el invierno.',
    reward:{coins:40,xp:90,items:[['pan',3]]}},
  {id:'jefe',title:'Los proscritos del camino',type:'item',item:'sello',goal:1,label:'Brazalete del jefe',
    intro:()=>'Unos proscritos acampan al final del camino de tierra y asaltan a los mercaderes que van a Jórvik. Derrota a su jefe y tráeme su brazalete de plata como prueba.',
    remind:'El campamento está al final del camino. Lleva ungüentos contigo.',done:'El camino a Jórvik vuelve a ser seguro. Esta espada era de mi hijo; la forjaron en tierras francas. Que te sirva mejor que a él.',
    reward:{coins:100,xp:180,items:[['espada',1]]}},
];
export const ETYPES={
  lobo:{name:'Lobo',hp:32,dmg:7,spd:4.4,aggro:15,range:1.8,cd:1.1,xp:20},
  bandido:{name:'Proscrito',hp:48,dmg:10,spd:3.4,aggro:14,range:2.0,cd:1.3,xp:30},
  jefe:{name:'Jefe de los proscritos',hp:170,dmg:17,spd:3.1,aggro:17,range:2.5,cd:1.6,xp:120},
};
export const SHOP=['pocion','pan','cota','arco','lanza'];
export function migrate(s){
  if(!s||!s.race)return null;
  s.race=RACE_MAP[s.race]||s.race;if(!RACES[s.race])return null;
  const fix=id=>ITEM_MAP[id]||id;
  s.inv=(s.inv||[]).map(x=>({...x,id:fix(x.id)})).filter(x=>ITEMS[x.id]);
  s.eq=s.eq||{};s.eq.weapon=fix(s.eq.weapon);s.eq.armor=fix(s.eq.armor);
  if(!ITEMS[s.eq.weapon])s.eq.weapon=RACES[s.race].weapon;
  if(!ITEMS[s.eq.armor])s.eq.armor=RACES[s.race].armor;
  return s;
}
