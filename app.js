import './colour-lab/logo-data.js';
import {COMPANY_TEMPLATES} from './company-data.js';
import {LOGOS,PALETTES,APPLICATIONS,VARIATIONS,logoAsset,mockupAsset,availableVariations} from './data.js';
const $=id=>document.getElementById(id);
const label=logo=>`Logo ${logo}`;
const roles=['accent','primary','secondary','neutral1','neutral2'];
const allStages=['identity','mockups','website','children','group'];
let stages=[...allStages];
const stageNames={identity:'The logo',mockups:'In real life',website:'On a website',children:'Child companies',group:'Group of companies'};
const state={customMode:false,customColors:null,customBase:'gold',combinations:[{logo:1,palette:'blue'},{logo:3,palette:'green'}],railColumn:0,page:'intro',logo:1,stage:'identity',palettes:{1:'gold',2:'gold',3:'gold'},reviewed:new Set(),black:false,compare:'logos',comparisonView:'identity',compareLogo:1,comparePalette:'gold',viewerIndex:0,photos:[]};
try{const saved=JSON.parse(sessionStorage.getItem('burke-guided-review')||'null');if(saved){for(const l of LOGOS)if(PALETTES[saved.palettes?.[l]])state.palettes[l]=saved.palettes[l];state.reviewed=new Set((saved.reviewed||[]).filter(l=>LOGOS.includes(l)));}}catch{}
const palette=()=>state.palettes[state.logo];
function save(){try{sessionStorage.setItem('burke-guided-review',JSON.stringify({palettes:state.palettes,reviewed:[...state.reviewed]}));}catch{}}
function button(text,cls=''){const e=document.createElement('button');e.type='button';e.className=cls;e.textContent=text;return e;}
function image(src,alt){const e=document.createElement('img');e.src=src;e.alt=alt;e.decoding='async';return e;}
function logoTab(logo){const e=button('','logo-tab');e.append(image(reviewLogoAsset(logo,state.palettes[logo],'symbol'),''));const text=document.createElement('span');text.textContent=label(logo);e.append(text);return e;}
function paletteButton(key,onClick){const pal=PALETTES[key],e=button('','palette');e.setAttribute('aria-label',pal.name);e.innerHTML=`<span class="swatches" aria-hidden="true">${roles.map(r=>`<i style="background:${pal[r]}"></i>`).join('')}</span><span class="palette-name">${pal.name}</span>`;e.dataset.palette=key;e.addEventListener('click',onClick);return e;}
for(const logo of LOGOS){
const progress=logoTab(logo);progress.dataset.logo=logo;progress.addEventListener('click',()=>navigate('explore',logo,'identity',true));$('logo-progress').append(progress);
const compare=logoTab(logo);compare.dataset.logo=logo;compare.addEventListener('click',()=>{state.compareLogo=logo;renderComparison();});$('compare-logos').append(compare);}
for(const key of Object.keys(PALETTES)){
$('palettes').append(paletteButton(key,()=>{state.palettes[state.logo]=key;state.black=false;save();renderFocus();}));
$('compare-palettes').append(paletteButton(key,()=>{state.comparePalette=key;renderComparison();}));}
function navigate(page,logo=state.logo,stage=state.stage,keepScroll=false){
 const previousScroll=window.scrollY;
 const hash=page==='intro'?'#main':page==='compare'?'#compare':`#logo=${logo}&view=${stage}`;
 if(location.hash!==hash)history.pushState(null,'',hash);
 applyRoute();if(keepScroll==='content'){requestAnimationFrame(()=>{const el=state.page==='explore'?$(state.stage+'-stage'):$(state.comparisonView==='identity'?'combination-headings':'compare-row-'+state.comparisonView);const offset=stickyHeight();window.scrollTo({top:el.getBoundingClientRect().top+scrollY-offset-12,behavior:'instant'});});return;}if(keepScroll){window.scrollTo({top:previousScroll,behavior:'instant'});return;}window.scrollTo({top:0,behavior:'instant'});const heading=page==='explore'?$('focus-title'):page==='compare'?$('comparison-title'):$('intro-title');heading.focus({preventScroll:true});
}
function applyRoute(){
 const q=new URLSearchParams(location.hash.slice(1));const custom=(q.get('colours')||'').split(',');if(custom.length===5&&custom.every(c=>/^[0-9a-f]{6}$/i.test(c))){state.customMode=true;state.customColors=Object.fromEntries(roles.map((r,i)=>[r,'#'+custom[i].toUpperCase()]));stages=['identity','website'];}
 const logo=+q.get('logo'),stage=q.get('view');
 if(q.has('compare')){state.page='compare';const shared=parseChoices(q.get('set')).slice(0,3);if(shared.length){state.compare='logos';state.comparePalette=shared[0].palette;state.compareLogo=shared[0].logo;}if(state.compare==='combinations')state.compare='logos';}
 else if(LOGOS.includes(logo)){state.page='explore';state.logo=logo;state.stage=stages.includes(stage)?stage:'identity';state.black=false;}
 else state.page='intro';
 $('introduction').hidden=state.page!=='intro';$('exploration').hidden=state.page!=='explore';$('comparison').hidden=state.page!=='compare';
 if(state.page==='explore')renderFocus();if(state.page==='compare')renderComparison();renderRail();
}
window.addEventListener('popstate',applyRoute);window.addEventListener('hashchange',applyRoute);
$('all-logos').addEventListener('click',()=>navigate('intro'));
$('compare-link').addEventListener('click',()=>openCompare());
$('start-review').addEventListener('click',()=>navigate('explore',1,'identity'));
function openCompare(){if(state.page==='compare'){const previous=state.returnView||{logo:railChoice().logo,stage:'identity'};if(!state.returnView)state.palettes[previous.logo]=railChoice().palette;navigate('explore',previous.logo,previous.stage,true);return;}state.returnView={logo:state.logo,stage:state.stage};state.compare='logos';state.compareLogo=state.logo;state.comparePalette=palette();state.comparisonView=state.stage==='mockups'?'sign':state.stage==='group'?'identity':state.stage;navigate('compare',state.logo,state.stage,true);}
document.querySelectorAll('[data-stage]').forEach(e=>e.addEventListener('click',()=>navigate('explore',state.logo,e.dataset.stage,true)));
$('black').addEventListener('click',()=>{state.black=!state.black;renderFocus();});
function renderFocus(){
 if(state.stage==='website'){state.reviewed.add(state.logo);save();}
 $('focus-title').textContent=label(state.logo);$('focus-status').textContent=`${LOGOS.indexOf(state.logo)+1} of 3 identities`;
 $('compare-link').hidden=false;
 document.querySelectorAll('#logo-progress button').forEach(e=>{const l=+e.dataset.logo;e.setAttribute('aria-current',l===state.logo?'true':'false');e.querySelector('span').textContent=label(l);e.querySelector('img').src=reviewLogoAsset(l,state.palettes[l],'symbol');e.setAttribute('aria-label',label(l));});
 document.querySelectorAll('#palettes button').forEach(e=>e.setAttribute('aria-pressed',String(e.dataset.palette===palette()&&!state.black)));
 for(const stage of allStages){$(stage+'-stage').hidden=state.stage!==stage;document.querySelector('[data-stage='+stage+']')?.setAttribute('aria-current',state.stage===stage?'step':'false');}
 if(state.stage==='identity'){
 const p=state.black?null:palette();$('focus-logo').src=reviewLogoAsset(state.logo,p);$('focus-logo').alt=`${label(state.logo)} — ${p?PALETTES[p].name:'Original Black'}`;
 $('black').setAttribute('aria-pressed',String(state.black));$('black').textContent=state.black?'Return to '+PALETTES[palette()].name:'View in Original Black';
 $('variation-grid').replaceChildren();for(const key of availableVariations(p)){const fig=document.createElement('figure');const box=document.createElement('div');box.className='variation-image';box.append(image(reviewLogoAsset(state.logo,p,key),`${label(state.logo)} — ${VARIATIONS[key]}`));const cap=document.createElement('figcaption');cap.textContent=VARIATIONS[key];fig.append(box,cap);$('variation-grid').append(fig);}
 }else if(state.stage==='mockups'){
 state.photos=Object.keys(APPLICATIONS).map(application=>({logo:state.logo,palette:palette(),application,caption:APPLICATIONS[application]}));renderPhotos($('finished-gallery'),state.photos);
 }else if(state.stage==='children'){renderChildren($('children-gallery'),state.logo,palette());
 }else if(state.stage==='group'){renderGroup($('group-gallery'),state.logo,palette());
 }else{
 $('website-next').textContent=state.customMode?(nextLogo()?'Explore '+label(nextLogo())+' →':'Compare the identities →'):'Child companies →';
 let frame=$('website-frame');if(!frame){frame=websiteFrame(state.logo,palette(),'website-frame');$('website-mount').append(frame);}else syncFrame(frame,state.logo,palette());
 }
 const i=stages.indexOf(state.stage);$('journey-back').textContent=i?'← '+stageNames[stages[i-1]]:'← All logos';
 if(i<stages.length-1)$('journey-next').textContent=stageNames[stages[i+1]]+' →';
 else {const next=nextLogo();$('journey-next').textContent=next?`Explore ${label(next)} →`:'Compare the identities →';}
 renderRail();applyCustomView();
}
function nextLogo(){return LOGOS[LOGOS.indexOf(state.logo)+1]||null;}
$('journey-back').addEventListener('click',()=>{const i=stages.indexOf(state.stage);if(i)navigate('explore',state.logo,stages[i-1],'content');else navigate('intro');});
$('website-next').addEventListener('click',()=>$('journey-next').click());
$('journey-next').addEventListener('click',()=>{const i=stages.indexOf(state.stage);if(i<stages.length-1)navigate('explore',state.logo,stages[i+1],'content');else if(nextLogo())navigate('explore',nextLogo(),'identity','content');else openCompare();});
function renderPhotos(container,photos){
 while(container.children.length>photos.length)container.lastElementChild.remove();
 photos.forEach((photo,i)=>{let e=container.children[i];if(!e){e=button('','photo-button');const img=document.createElement('img');img.decoding='async';e.append(img);const cap=document.createElement('span');cap.className='photo-caption';cap.innerHTML='<span></span><span>Enlarge ↗</span>';e.append(cap);e.addEventListener('click',()=>{state.viewerIndex=i;renderViewer();$('viewer').showModal();});container.append(e);}
 const desc=`${label(photo.logo)} · ${PALETTES[photo.palette].name} · ${APPLICATIONS[photo.application]}`;e.setAttribute('aria-label',`Enlarge ${desc}`);const img=e.querySelector('img'),src=mockupAsset(photo.logo,photo.palette,photo.application);if(img.getAttribute('src')!==src)img.src=src;img.alt=desc;e.querySelector('.photo-caption span').textContent=photo.caption;});
}
function websiteFrame(logo,pal,id=''){
 const frame=document.createElement('iframe');frame.className='website-frame';if(id)frame.id=id;frame.title=`${label(logo)} website · ${PALETTES[pal].name}`;frame.src=`colour-lab/#embed=1&l=${logo}&p=${pal}`;frame.dataset.logo=logo;frame.dataset.palette=pal;
 frame.addEventListener('load',()=>syncFrame(frame,+frame.dataset.logo,frame.dataset.palette,JSON.parse(frame.dataset.colors||'null')));return frame;
}
function syncFrame(frame,logo,pal,colors=null){frame.dataset.logo=logo;frame.dataset.palette=pal;frame.dataset.colors=JSON.stringify(colors);frame.title=`${label(logo)} website · ${PALETTES[pal].name}`;frame.contentWindow?.postMessage({type:'burke-selection',logo,palette:pal,bw:false,colors:state.customMode?state.customColors:colors},location.origin);}
document.querySelectorAll('[data-compare]').forEach(e=>e.addEventListener('click',()=>{state.compare=e.dataset.compare;$('comparison-gallery').dataset.count='';renderComparison();}));
$('comparison-view').addEventListener('change',e=>{state.comparisonView=e.target.value;scrollToComparison(e.target.value);});
$('comparison-back').addEventListener('click',()=>navigate('explore',state.logo,'website','content'));
function comparisonChoices(){if(state.compare==='logos')return LOGOS.map(logo=>({logo,palette:state.comparePalette}));return Object.keys(PALETTES).map(palette=>({logo:state.compareLogo,palette}));}
function renderComparison(){
 const logos=state.compare==='logos',palettes=state.compare==='palettes',choices=comparisonChoices();
 $('comparison-title').textContent=logos?'Compare the logos':palettes?'Compare the colours':'Compare combinations';
 $('comparison-description').textContent=logos?'All three logos in the same colour palette. ':palettes?'One logo across all three palettes. ':'Choose a logo and palette for each option using the control rail.';
 document.querySelectorAll('[data-compare]').forEach(e=>e.setAttribute('aria-pressed',String(e.dataset.compare===state.compare)));
 $('compare-palettes').hidden=!logos;$('compare-logos').hidden=!palettes;$('add-combination').hidden=state.compare!=='combinations'||choices.length>=3;
 document.querySelectorAll('#compare-palettes button').forEach(e=>e.setAttribute('aria-pressed',String(e.dataset.palette===state.comparePalette)));
 document.querySelectorAll('#compare-logos button').forEach(e=>{e.setAttribute('aria-pressed',String(+e.dataset.logo===state.compareLogo));e.querySelector('img').src=reviewLogoAsset(+e.dataset.logo,state.palettes[+e.dataset.logo],'symbol');});
 const gallery=$('comparison-gallery');gallery.style.setProperty('--columns',choices.length);
 if(+gallery.dataset.count!==choices.length){
  gallery.replaceChildren();gallery.dataset.count=choices.length;
  const heads=document.createElement('div');heads.id='combination-headings';heads.className='compare-row-grid';gallery.append(heads);
  choices.forEach((_,i)=>{const cell=document.createElement('div');cell.className='combination-heading';const name=document.createElement('h2');const caption=document.createElement('p');caption.className='muted';cell.append(name,caption);if(state.compare==='combinations'&&choices.length>2){const remove=button('×','remove-combination');remove.setAttribute('aria-label','Remove option '+String.fromCharCode(65+i));remove.addEventListener('click',()=>{if(state.combinations.length>2){state.combinations.splice(i,1);state.railColumn=0;gallery.dataset.count='';renderComparison();}});cell.append(remove);}heads.append(cell);});
  for(const [key,title] of [['identity','Primary logo'],['horizontal','Secondary logo'],['icons','Favicons & symbol'],['sign','Signage'],['polo','Polo shirt'],['card','Business card'],['cap','Baseball cap'],['website','Website colour study'],['children','Child companies']]){
   const row=document.createElement('section');row.id='compare-row-'+key;row.className='comparison-row';const heading=document.createElement('h2');heading.textContent=title;row.append(heading);const grid=document.createElement('div');grid.className='compare-row-grid';row.append(grid);gallery.append(row);
   choices.forEach((c,i)=>{const cell=document.createElement('div');cell.className='compare-cell';
    if(key==='children'||key==='group'){}
    else if(key==='icons'){cell.classList.add('icon-applications');for(const [variation,name] of [['favDark','Dark favicon'],['favLight','Light favicon'],['symbol','Symbol']]){const fig=document.createElement('figure');fig.append(image(reviewLogoAsset(c.logo,c.palette,variation),name));const caption=document.createElement('figcaption');caption.textContent=name;fig.append(caption);cell.append(fig);}}
    else if(key==='website')renderColourStudy(cell,c);
    else if(key==='identity'||key==='horizontal')cell.append(image(reviewLogoAsset(c.logo,c.palette,key==='identity'?'stacked':key),label(c.logo)));
    else {const el=button('','photo-button');const img=document.createElement('img');img.decoding='async';img.loading='lazy';el.append(img);el.addEventListener('click',()=>{state.viewerIndex=+el.dataset.photoIndex;renderViewer();$('viewer').showModal();});cell.append(el);}
    grid.append(cell);
   });
  }
 }
 state.photos=[];
 [...$('combination-headings').children].forEach((cell,i)=>{const c=choices[i];cell.querySelector('h2').textContent=state.compare==='combinations'?'Option '+String.fromCharCode(65+i):logos?label(c.logo):PALETTES[c.palette].name;cell.querySelector('p').textContent=label(c.logo)+' · '+(state.customMode||c.colors?'Custom colours':PALETTES[c.palette].name);});
 for(const key of ['identity','horizontal','icons','sign','polo','card','cap','website','children']){
  [...$('compare-row-'+key).querySelector('.compare-row-grid').children].forEach((cell,i)=>{const c=choices[i],desc=label(c.logo)+' · '+PALETTES[c.palette].name;
   if(key==='children')renderChildren(cell,c.logo,c.palette);
   else if(key==='group')renderGroup(cell,c.logo,c.palette);
   else if(key==='icons'){['favDark','favLight','symbol'].forEach((v,j)=>{const img=cell.querySelectorAll('img')[j];img.src=reviewLogoAsset(c.logo,c.palette,v,c.colors);img.alt=desc+' · '+VARIATIONS[v];});}
   else if(key==='website')renderColourStudy(cell,c);
   else if(key==='identity'||key==='horizontal'){const img=cell.querySelector('img');img.src=reviewLogoAsset(c.logo,c.palette,key==='identity'?'stacked':key,c.colors);img.alt=desc+' · '+(key==='identity'?'Primary':'Secondary');}
   else {const el=cell.querySelector('button'),img=el.querySelector('img'),src=mockupAsset(c.logo,c.palette,key);el.dataset.photoIndex=state.photos.length;state.photos.push({...c,application:key});if(img.getAttribute('src')!==src)img.src=src;img.alt=desc+' · '+APPLICATIONS[key];el.setAttribute('aria-label','Enlarge '+img.alt);}
  });
 }
 renderRail();applyCustomView();
}
$('open-lab').addEventListener('click',openCustomEditor);
window.addEventListener('message',e=>{if(e.origin!==location.origin)return;const frame=[...document.querySelectorAll('iframe')].find(f=>f.contentWindow===e.source);if(!frame||!frame.getClientRects().length)return;const h=e.data?.type==='burke-lab-height'?e.data.height:e.data?.burkeH;if(Number.isFinite(h))frame.style.height=`${Math.max(400,Math.min(30000,h))}px`;});
function renderViewer(){const photo=state.photos[state.viewerIndex];$('viewer-image').src=mockupAsset(photo.logo,photo.palette,photo.application);const desc=`${label(photo.logo)} · ${PALETTES[photo.palette].name} · ${APPLICATIONS[photo.application]}`;$('viewer-image').alt=desc;$('viewer-title').textContent=desc;$('viewer-count').textContent=`${state.viewerIndex+1} / ${state.photos.length}`;}
function stepViewer(step){state.viewerIndex=(state.viewerIndex+step+state.photos.length)%state.photos.length;renderViewer();}
$('close-viewer').addEventListener('click',()=>$('viewer').close());$('viewer-prev').addEventListener('click',()=>stepViewer(-1));$('viewer-next').addEventListener('click',()=>stepViewer(1));
$('viewer').addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();stepViewer(-1);}if(e.key==='ArrowRight'){e.preventDefault();stepViewer(1);}});
$('viewer').addEventListener('click',e=>{if(e.target===$('viewer')){const r=$('viewer').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('viewer').close();}});

// Accept existing shared comparison URLs.
const validChoice=c=>c&&LOGOS.includes(c.logo)&&Object.hasOwn(PALETTES,c.palette)&&(!c.colors||roles.every(r=>/^#[0-9a-f]{6}$/i.test(c.colors[r])));
function parseChoices(value){return (value||'').split(',').map(x=>{const [base,hex]=x.split(':');const [l,p]=base.split('-');const result={logo:+l,palette:p};const values=(hex||'').split('.');if(values.length===5&&values.every(v=>/^[0-9a-f]{6}$/i.test(v)))result.colors=Object.fromEntries(roles.map((r,i)=>[r,'#'+values[i]]));return result;}).filter(validChoice);}
function choiceKey(c){return c.logo+'-'+c.palette+(c.colors?':'+roles.map(r=>c.colors[r].slice(1)).join('.'):'');}
function railChoice(){return state.page==='compare'?comparisonChoices()[Math.min(state.railColumn,comparisonChoices().length-1)]:{logo:state.logo,palette:palette()};}
function editRail(update){
 if(state.customMode&&update.palette){state.customBase=update.palette;state.customColors={...PALETTES[update.palette]};}
 if(state.page==='compare'){if(update.logo){state.compareLogo=update.logo;state.compare='palettes';}if(update.palette){state.comparePalette=update.palette;state.compare='logos';}renderComparison();}
 else{if(update.logo)navigate('explore',update.logo,state.stage,true);if(update.palette){state.palettes[state.logo]=update.palette;state.black=false;save();renderFocus();}}
}
function renderRail(){renderSticky();}

for(const l of LOGOS){const e=button('','sticky-choice');e.dataset.logo=l;e.setAttribute('aria-label',label(l));e.append(image(reviewLogoAsset(l,'gold','symbol'),''));const name=document.createElement('span');name.textContent=l;e.append(name);e.addEventListener('click',()=>editRail({logo:l}));$('sticky-logos').append(e);}
for(const [p,pal] of Object.entries(PALETTES)){const e=button('','sticky-choice');e.dataset.palette=p;e.setAttribute('aria-label',pal.name);const sw=document.createElement('span');sw.className='sticky-swatch';for(const role of roles){const i=document.createElement('i');i.style.background=pal[role];sw.append(i);}const name=document.createElement('span');name.textContent=pal.name;e.append(sw,name);e.addEventListener('click',()=>editRail({palette:p}));$('sticky-palettes').append(e);}
function stickyHeight(){const header=$('scroll-header'),hidden=header.hidden;header.hidden=false;const h=header.offsetHeight;header.hidden=hidden;return h;}
function positionSticky(){const main=$('main'),r=main.getBoundingClientRect(),s=getComputedStyle(main),header=$('scroll-header');header.style.left=(r.left+parseFloat(s.paddingLeft))+'px';header.style.right=(innerWidth-r.right+parseFloat(s.paddingRight))+'px';}
const controlAnchor=document.createElement('div');controlAnchor.id='control-anchor';
function updateSticky(){
 const header=$('scroll-header');if(state.page==='intro'){header.hidden=true;return;}
 const target=state.page==='compare'?$('comparison-gallery'):$('identity-stage');
 if(controlAnchor.nextElementSibling!==target)target.before(controlAnchor);
 if(header.parentElement!==controlAnchor)controlAnchor.append(header);
 header.hidden=false;controlAnchor.style.minHeight=header.offsetHeight+'px';document.documentElement.style.setProperty('--controls-height',header.offsetHeight+'px');
 const floating=controlAnchor.getBoundingClientRect().top<=8;header.classList.toggle('is-floating',floating);
 if(floating)positionSticky();else{header.style.left='';header.style.right='';}
}
function renderSticky(){
 const header=$('scroll-header');if(state.page==='intro'){header.hidden=true;return;}
 $('sticky-logos').parentElement.hidden=false;$('sticky-palettes').parentElement.hidden=false;
 $('sticky-custom').setAttribute('aria-expanded',String(!$('colour-editor').hidden));$('sticky-mode-control').hidden=false;$('sticky-mode').hidden=false;$('sticky-mode').disabled=state.page!=='compare'||state.customMode;$('sticky-mode').value=state.compare;
 const c=railChoice();document.querySelectorAll('#sticky-logos button').forEach(e=>{e.setAttribute('aria-pressed',String(+e.dataset.logo===c.logo));e.querySelector('img').src=reviewLogoAsset(+e.dataset.logo,c.palette,'symbol');});
 document.querySelectorAll('#sticky-palettes button').forEach(e=>e.setAttribute('aria-pressed',String(e.dataset.palette===c.palette)));
 $('sticky-column').hidden=true;$('sticky-column').replaceChildren();if(state.page==='compare'){comparisonChoices().forEach((_,i)=>{const o=document.createElement('option');o.value=i;o.textContent='Option '+String.fromCharCode(65+i);$('sticky-column').append(o);});$('sticky-column').value=state.railColumn;}
 const section=$('sticky-section');section.replaceChildren();const opts=state.page==='compare'?[['identity','Logos'],['horizontal','Secondary logos'],['icons','Favicons'],['sign','Signage'],['polo','Polo shirts'],['card','Business cards'],['cap','Caps'],['website','Website colour studies'],['children','Child companies']]:[['identity','The logo'],['mockups','In real life'],['website','On a website'],['children','Child companies'],['group','Group of companies']];
 for(const [key,name] of opts.filter(([key])=>!customReview()||!['mockups','children','group','sign','polo','card','cap'].includes(key))){const o=document.createElement('option');o.value=key;o.textContent=name;section.append(o);}section.value=state.page==='compare'?state.comparisonView:state.stage;
 $('sticky-compare').setAttribute('aria-checked',String(state.page==='compare'));$('sticky-compare').setAttribute('aria-label',state.page==='compare'?'Turn comparison off':'Turn comparison on');$('compare-link').setAttribute('aria-pressed',String(state.page==='compare'));updateSticky();
}
$('sticky-mode').addEventListener('change',e=>{state.compare=e.target.value;$('comparison-gallery').dataset.count='';renderComparison();});
$('sticky-column').addEventListener('change',e=>{state.railColumn=+e.target.value;renderRail();});
$('sticky-compare').addEventListener('click',openCompare);
function scrollToComparison(key){state.comparisonView=key;$('comparison-view').value=['horizontal','icons'].includes(key)?'identity':key;const row=$(key==='identity'?'combination-headings':'compare-row-'+key);window.scrollTo({top:row.getBoundingClientRect().top+scrollY-stickyHeight()-12,behavior:'instant'});$('sticky-section').value=key;updateSticky();}
$('sticky-section').addEventListener('change',e=>{if(state.page==='compare')scrollToComparison(e.target.value);else navigate('explore',state.logo,e.target.value,'content');});
let stickyTick=false;window.addEventListener('scroll',()=>{if(!stickyTick){stickyTick=true;requestAnimationFrame(()=>{stickyTick=false;updateSticky();});}},{passive:true});window.addEventListener('resize',()=>{positionSticky();updateSticky();});

document.querySelector('footer a').addEventListener('click',e=>{e.preventDefault();window.scrollTo({top:0,behavior:'instant'});});
document.querySelector('.skip').addEventListener('click',e=>{e.preventDefault();$('main').focus({preventScroll:true});$('main').scrollIntoView({block:'start'});});

const CHILDREN=[{name:'Realty',colour:'#BD6C5A'},{name:'Development',colour:'#648EAB'},{name:'Property Management',colour:'#4C968E'}];
function companyCard(name,art,caption=''){
 const fig=document.createElement('figure');fig.className='company-card';const box=document.createElement('div');box.className='company-art';box.append(art);const cap=document.createElement('figcaption');const title=document.createElement('h3');title.textContent=name;cap.append(title);if(caption){const p=document.createElement('p');p.className='muted';p.textContent=caption;cap.append(p);}fig.append(box,cap);return fig;
}
function renderChildren(container,logo,pal){
 container.replaceChildren();container.append(companyCard('Burke Group',image(reviewLogoAsset(logo,pal),'Burke Group'),PALETTES[pal].secondary));
 for(const company of CHILDREN){const holder=document.createElement('div');holder.className='child-logo';holder.innerHTML=COMPANY_TEMPLATES[logo].replaceAll('#1b2e46',PALETTES[pal].primary).replaceAll('#b78352',company.colour).replace('COMPANY_NAME',company.name.toUpperCase());const svg=holder.querySelector('svg');svg.setAttribute('role','img');svg.setAttribute('aria-label','Burke '+company.name);svg.querySelector('text').setAttribute('font-size',company.name.length>15?'38':'55');container.append(companyCard('Burke '+company.name,holder,company.colour));}
}
function renderGroup(container,logo,pal){container.replaceChildren();for(const [name,src] of [['Burke Group',reviewLogoAsset(logo,pal)],['SureBuilt','assets/companies/surebuilt.png'],['Slimlines','assets/companies/slimlines.png']])container.append(companyCard(name,image(src,name)));}

for(const id of ['open-guide','sticky-guide'])$(id).addEventListener('click',()=>$('control-guide').showModal());
$('close-guide').addEventListener('click',()=>$('control-guide').close());



function renderColourStudy(container,choice){
 const c=state.customMode?state.customColors:choice.colors||PALETTES[choice.palette];
 container.replaceChildren();const study=document.createElement('article');study.className='colour-study';study.setAttribute('aria-label',label(choice.logo)+' colour palette in a condensed website');
 for(const role of roles)study.style.setProperty('--'+role,c[role]);
 const nav=document.createElement('div');nav.className='study-nav';nav.append(image(reviewLogoAsset(choice.logo,choice.palette,'horizontal',choice.colors),'Burke Group'));
 const hero=document.createElement('div');hero.className='study-hero';hero.innerHTML='<p class="study-note">PRIMARY + NEUTRAL 2</p><h3>Built for what’s next.</h3><p>Confident spaces. Lasting value.</p><span class="study-button">Explore our work ↗</span><span class="study-link">Discover Burke →</span>';
 const band=document.createElement('div');band.className='study-band';band.innerHTML='<span class="study-note">NEUTRAL 1 + ACCENT</span><div><strong>01</strong><span>Property. Development.<br>Possibility.</span></div>';
 const dark=document.createElement('div');dark.className='study-dark';dark.innerHTML='<span class="study-note">PRIMARY + SECONDARY</span><h3>A shared ambition.</h3><p>A strong foundation for the future.</p><i aria-hidden="true"></i>';
 const swatches=document.createElement('div');swatches.className='study-swatches';for(const role of roles){const sw=document.createElement('span');sw.style.background=c[role];sw.title=role+': '+c[role];swatches.append(sw);}
 study.append(nav,hero,band,dark,swatches);container.append(study);
}

function reviewLogoAsset(logo,pal,variation='stacked',colors=null){
 if((!state.customMode&&!colors)||!pal)return logoAsset(logo,pal,variation);
 const art=window.BURKE_DATA?.logos[logo]?.[pal]?.[variation];if(!art)return logoAsset(logo,pal,variation);
 const c=colors||state.customColors,fill={symMain:c.primary,symSec:c.secondary,burke:c.primary,group:c.secondary,favDarkBg:c.primary,favLightBg:c.neutral1};
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox',art.vb);
 for(const [tag,attrs,role,original] of art.els){const el=document.createElementNS(svg.namespaceURI,tag);for(const [key,value] of Object.entries(attrs))el.setAttribute(key,value);el.setAttribute('fill',fill[role]||original);svg.append(el);}
 return 'data:image/svg+xml,'+encodeURIComponent(new XMLSerializer().serializeToString(svg));
}
function customReview(){return state.customMode||(state.page==='compare'&&comparisonChoices().some(c=>c.colors));}
function applyCustomView(){
 document.querySelectorAll('.focus-heading [data-stage]').forEach(e=>e.hidden=state.customMode&&!stages.includes(e.dataset.stage));
 for(const key of ['sign','polo','card','cap','children']){const row=$('compare-row-'+key);if(row)row.hidden=customReview();}
 document.querySelectorAll('#sticky-section option').forEach(e=>e.hidden=customReview()&&['sign','polo','card','cap','children','group','mockups'].includes(e.value));
 if(customReview()){$('comparison-description').textContent='Custom colours applied across every logo and website preview.';}
 updateEditorFields();
}
function repaintCustom(){if(state.page==='compare')renderComparison();else renderFocus();applyCustomView();}
function openCustomEditor(){
 if(state.page==='compare')state.compare='logos';
 if(!state.customMode){state.customBase=railChoice().palette;state.customColors={...PALETTES[state.customBase]};state.customMode=true;stages=['identity','website'];}
 $('colour-editor').hidden=false;if(state.page==='explore'&&!stages.includes(state.stage))navigate('explore',state.logo,'identity','content');else if(state.page==='compare'&&!['identity','horizontal','icons','website'].includes(state.comparisonView))state.comparisonView='identity';
 repaintCustom();if(state.page==='compare')scrollToComparison('identity');$('sticky-custom').setAttribute('aria-expanded','true');$('open-lab').setAttribute('aria-expanded','true');document.querySelector('#colour-fields input').focus({preventScroll:true});
}
for(const role of roles){const row=document.createElement('label');row.className='colour-field';const name=document.createElement('span');name.textContent=({neutral1:'Neutral 1',neutral2:'Neutral 2'}[role]||role[0].toUpperCase()+role.slice(1));const picker=document.createElement('input');picker.type='color';picker.dataset.role=role;picker.setAttribute('aria-label',name.textContent+' colour picker');const hex=document.createElement('input');hex.type='text';hex.dataset.hex=role;hex.setAttribute('aria-label',name.textContent+' HEX value');hex.maxLength=7;
 const apply=value=>{if(/^#[0-9a-f]{6}$/i.test(value)){state.customColors[role]=value.toUpperCase();hex.setAttribute('aria-invalid','false');repaintCustom();}else hex.setAttribute('aria-invalid','true');};picker.addEventListener('input',()=>apply(picker.value));hex.addEventListener('input',()=>apply(hex.value));row.append(name,picker,hex);$('colour-fields').append(row);}
function updateEditorFields(){if(!state.customColors)return;for(const role of roles){document.querySelector('[data-role='+role+']').value=state.customColors[role];const hex=document.querySelector('[data-hex='+role+']');if(document.activeElement!==hex)hex.value=state.customColors[role];}}
$('sticky-custom').addEventListener('click',openCustomEditor);
$('close-colour-editor').addEventListener('click',()=>{$('colour-editor').hidden=true;$('open-lab').setAttribute('aria-expanded','false');$('sticky-custom').setAttribute('aria-expanded','false');});
$('reset-custom').addEventListener('click',()=>{state.customColors={...PALETTES[state.customBase]};repaintCustom();});
$('exit-custom').addEventListener('click',()=>{state.customMode=false;stages=[...allStages];$('colour-editor').hidden=true;repaintCustom();});



const feedbackRanks={logos:{},palettes:{}};
function rankControl(group,key,name,art){
 const card=document.createElement('div');card.className='feedback-card';card.append(art);const title=document.createElement('h3');title.textContent=name;const labelEl=document.createElement('label');labelEl.textContent='Your ranking';const select=document.createElement('select');select.dataset.rankGroup=group;select.dataset.rankKey=key;select.setAttribute('aria-label',name+' ranking');select.required=true;
 for(const [value,text] of [['','Choose rank'],['1','1st'],['2','2nd'],['3','3rd']]){const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option);}
 select.addEventListener('change',()=>{const ranks=feedbackRanks[group],previous=ranks[key]||'',next=select.value;const other=Object.keys(ranks).find(k=>k!==String(key)&&ranks[k]===next&&next);if(other)ranks[other]=previous;ranks[key]=next;document.querySelectorAll('[data-rank-group='+group+']').forEach(el=>el.value=ranks[el.dataset.rankKey]||'');$('feedback-status').textContent='';});labelEl.append(select);card.append(title,labelEl);$('feedback-'+group).append(card);
}
for(const logo of LOGOS)rankControl('logos',String(logo),label(logo),image(logoAsset(logo,null),label(logo)+' in black'));
for(const [key,pal] of Object.entries(PALETTES)){const sw=document.createElement('div');sw.className='feedback-swatches';for(const role of roles){const colour=document.createElement('i');colour.style.background=pal[role];colour.title=role+' '+pal[role];sw.append(colour);}rankControl('palettes',key,pal.name,sw);}
function feedbackText(){const lines=['BURKE GROUP — IDENTITY REVIEW FEEDBACK','Name: '+$('feedback-name').value.trim(),'','Logo rankings (black artwork):'];for(const rank of ['1','2','3']){const logo=Object.keys(feedbackRanks.logos).find(key=>feedbackRanks.logos[key]===rank);lines.push(['','1st','2nd','3rd'][rank]+': '+label(+logo));}lines.push('','Colour palette rankings:');for(const rank of ['1','2','3']){const key=Object.keys(feedbackRanks.palettes).find(key=>feedbackRanks.palettes[key]===rank);lines.push(['','1st','2nd','3rd'][rank]+': '+PALETTES[key].name);}return lines.join('\n');}
function validateFeedback(){if(!$('feedback-name').value.trim())$('feedback-name').value='';if(!$('feedback-form').reportValidity()){$('feedback-status').textContent='Please rank all three logos and all three palettes, and add your name.';return false;}return true;}
$('provide-feedback').addEventListener('click',()=>{$('colour-editor').hidden=true;$('feedback-dialog').showModal();});
$('close-feedback').addEventListener('click',()=>$('feedback-dialog').close());
$('feedback-form').addEventListener('submit',e=>e.preventDefault());
$('copy-feedback').addEventListener('click',async()=>{if(!validateFeedback())return;const text=feedbackText();try{await navigator.clipboard.writeText(text);$('feedback-status').textContent='Answers copied. Open an email to Catherine to send them.';}catch{const area=document.createElement('textarea');area.value=text;$('feedback-form').append(area);area.select();const copied=document.execCommand('copy');area.remove();$('feedback-status').textContent=copied?'Answers copied. Open an email to Catherine to send them.':'Copying was unavailable. Use Email Catherine to open your answers in an email.';}});
$('email-feedback').addEventListener('click',e=>{if(!validateFeedback()){e.preventDefault();return;}e.currentTarget.href='mailto:catherine@heritageholdings.ky?subject='+encodeURIComponent('Burke Group identity review — '+$('feedback-name').value.trim())+'&body='+encodeURIComponent(feedbackText());$('feedback-status').textContent='Your email app will open with your answers. Send the email to complete your feedback.';});

applyRoute();
