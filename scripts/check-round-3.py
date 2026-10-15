import functools,http.server,threading,itertools,json
from pathlib import Path
from playwright.sync_api import sync_playwright
root=str(Path(__file__).resolve().parents[1])
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(Path(root).parent)))
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}/burke-review/'
url=base+'round-3/'
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':1440,'height':1100},permissions=['clipboard-read','clipboard-write'])
 page=context.new_page(); errors=[]
 page.on('pageerror',lambda error:errors.append(str(error)))
 page.goto(url);page.wait_for_selector('#preview svg')
 results=page.evaluate('''async () => {
 const {makeLogo,companies}=await import('./logo-renderer.js');
 async function pixels(svg){
  const img=new Image(); img.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(new XMLSerializer().serializeToString(svg))));
  await img.decode(); const c=document.createElement('canvas');c.width=1080;c.height=936;
  const ctx=c.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,1080,936);ctx.drawImage(img,0,0,1080,936);
  return ctx.getImageData(0,0,1080,936).data;
 }
 const settings=[[0,0,0,0,0],[0,0,1,0,0],[0,0,0,0,1],[1,0,0,0,0],[0,1,0,0,0],[0,0,0,0,2],[0,0,0,1,0]];
 const results=[];
 for(let company=0;company<4;company++) for(let accent=0;accent<companies[company].accents.length;accent++) for(let i=0;i<7;i++){
  const reference=new DOMParser().parseFromString(companies[company].sources[i],'image/svg+xml').documentElement;
  if(company===0&&(i===5||i===6)) [...reference.children].filter(x=>x.localName==='path').forEach(x=>x.remove());
  // Owner-approved correction: use the earlier tighter BURKE placement.
  if(company===0&&i===6){
   const earlier=new DOMParser().parseFromString(companies[1].sources[6],'image/svg+xml').documentElement;
   reference.querySelector('g').replaceWith(earlier.querySelector('g').cloneNode(true));
  }
  if(company) reference.querySelectorAll('[fill="#a67c52"]').forEach(path=>path.setAttribute('fill',companies[company].accents[accent].value));
  const a=await pixels(reference),b=await pixels(makeLogo([...settings[i],company,accent]));
  let different=0,max=0;for(let j=0;j<a.length;j++){if(a[j]!==b[j])different++;max=Math.max(max,Math.abs(a[j]-b[j]));}
  results.push({company,accent,reference:i,differentChannels:different,maxDifference:max});
 }
 return results;
}''')
 print('Single-option pixel comparisons:',len(results),'references with accents')
 assert all(r['differentChannels']==0 for r in results),results
 combos=list(itertools.product(range(2),range(2),range(2),range(2),range(3)))
 page.evaluate('''async (combos)=>{
 const {makeLogo,companies}=await import('./logo-renderer.js');
 for(let company=0;company<4;company++) for(let accent=0;accent<companies[company].accents.length;accent++) for(const combo of combos){
  const settings=[...combo,company,accent];
  const svg=makeLogo(settings);document.body.append(svg);
  if(svg.querySelectorAll('path').length!==[13,14,19,26][company]||svg.querySelector('text')||svg.outerHTML.includes('NaN'))throw Error('Bad SVG '+settings);
  for(const path of svg.querySelectorAll('path')){
   const b=path.getBBox();if(!b.width||!b.height)throw Error('Empty outline '+settings);
  }
  const b=svg.getBBox();if(b.x<0||b.y<0||b.x+b.width>1080||b.y+b.height>935.4)throw Error('Clipped '+settings);
  const palette=new Set([...svg.querySelectorAll('path')].map(path=>path.getAttribute('fill').toLowerCase()));
  for(const fill of palette) if(!['#1b2e46',companies[company].accents[accent].value.toLowerCase()].includes(fill)) throw Error('Unexpected colour '+settings);
  if([...svg.querySelector('[data-part=burke]').children].some(path=>path.getAttribute('fill')!=='#1b2e46'))throw Error('Changed Burke navy');
  svg.remove();
 }
}''',combos)
 print('All 336 company / accent / refinement combinations: valid outlines, fixed navy and no clipping')
 # The four company previews share every refinement setting.
 assert page.locator('.logo-stage svg').count()==4
 assert page.locator('select, #saved, #add, .favourites, .company-selector, #accent-swatches').count()==0
 for settings in combos:
  for key,value in zip(['spacing','shape','weight','tracking','colour'],settings):page.check(f'[name={key}][value="{value}"]')
  assert page.locator('.logo-stage svg').count()==4
  for index,expected in enumerate(['Burke Group','Burke Realty','Burke Development','Burke Property Management']):
   logo=page.locator('.logo-stage svg').nth(index)
   assert expected in logo.get_attribute('aria-label')
   assert logo.get_attribute('viewBox')=='160 150 760 680'
 assert page.locator('#preview-status').inner_text().startswith('All four logos updated:')
 # Old comparison storage and fragments must not recreate the removed interface.
 page.evaluate("localStorage.setItem('burke-round-3-favourites-v1',JSON.stringify(['00000','11112']))")
 page.goto(url+'#compare=00000,11112&logo=11112');page.wait_for_selector('.logo-stage svg')
 assert page.locator('.logo-stage svg').count()==4
 assert page.locator('.favourites, #saved, #add').count()==0
 assert page.locator('[name=colour]:checked').input_value()=='2'
 page.goto(url+'#logo=bad');page.wait_for_function("document.querySelector('[name=colour]:checked').value==='0'")
 page.evaluate('document.activeElement.blur()');page.evaluate('scrollTo(0,0)')
 page.set_viewport_size({'width':1448,'height':1086})
 page.screenshot(path='/tmp/burke-round3-layout-desktop.png',full_page=True)
 # No part of any supplied logo is clipped by the common artboard crop.
 assert page.locator('.logo-stage svg').evaluate_all("""svgs=>svgs.every(svg=>{const b=svg.getBBox();return b.x>=160&&b.x+b.width<=920&&b.y>=150&&b.y+b.height<=830})""")
 for width in [390,320,768,1100]:
  page.set_viewport_size({'width':width,'height':844})
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),width
  for preview in page.locator('.logo-stage svg').all():assert preview.is_visible()
  if width==390:page.screenshot(path='/tmp/burke-round3-layout-mobile.png',full_page=True)
 # All three rounds keep working navigation under the Pages repository path.
 for route,round_number in [('',3),('round-3/',3),('round-2/',2),('round-1/',1)]:
  page.goto(base+route);page.wait_for_selector('.review-masthead .round-nav')
  assert page.locator('.round-nav a[aria-current=page]').inner_text()==f'Round {round_number}'
  for link,target in zip(page.locator('.round-nav a').all(),['round-1/','round-2/','']):
   assert link.evaluate('(a)=>a.href')==base+target
  if round_number==3:
   assert page.locator('.logo-stage svg').count()==4
   assert page.locator('#add, .favourites').count()==0
   assert page.locator('.review-wordmark img').evaluate('(img)=>img.complete&&img.naturalWidth>0')
  if round_number==2:
   page.click('#start-review');page.wait_for_selector('#focus-logo:visible');assert page.locator('#focus-logo').evaluate('(img)=>img.complete && img.naturalWidth>0')
  if round_number==1:
   assert page.locator('.item').count()>0
   assert page.locator('.item img').first.evaluate('(img)=>img.complete && img.naturalWidth>0')
 assert not errors,errors
 print('PASS: simultaneous four-company previews, all 48 UI settings, comparison removed, legacy links, responsive layout, navigation and existing rounds')
 browser.close()
server.shutdown()
