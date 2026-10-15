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
 assert page.locator('#saved figure').count()==0
 for settings in combos[:6]:
  for key,value in zip(['spacing','shape','weight','tracking','colour'],settings):page.check(f'[name={key}][value="{value}"]')
  page.click('#add')
 assert page.locator('#saved figure').count()==6
 assert page.locator('#add').is_disabled()
 page.click('#clear-selection');assert page.locator('#saved input:checked').count()==0;assert page.locator('#copy').is_disabled()
 page.click('#select-all');assert page.locator('#saved input:checked').count()==6
 page.locator('#saved input').nth(1).uncheck()
 page.click('#copy');page.wait_for_function("document.querySelector('#status').textContent.startsWith('Link copied')")
 shared=page.evaluate('navigator.clipboard.readText()')
 assert 'compare=' in shared
 page.locator('#saved button').first.click();assert page.locator('#saved figure').count()==5
 page.reload();page.wait_for_selector('#preview svg');assert page.locator('#saved figure').count()==5
 page.goto(shared);page.wait_for_selector('#preview svg');assert page.locator('#saved figure').count()==5
 page.click('button[type=reset]');assert all(page.locator(f'[name={key}]:checked').input_value()=='0' for key in ['spacing','shape','weight','tracking','colour'])
 # Company switching preserves refinements and each company's accent choice.
 assert page.locator('#accent-swatches').is_hidden()
 page.check('[name=shape][value="1"]')
 for company in [1,2,3]:
  page.check(f'[name=company][value="{company}"]')
  assert page.locator('#accent-swatches button').count()==2
  assert page.locator('[name=shape]:checked').input_value()=='1'
  page.locator('#accent-swatches button').nth(1).click()
  assert page.locator('#accent-swatches button[aria-pressed=true]').get_attribute('aria-label')==['Clay Red','Slate Violet','Deep Teal'][company-1]
 page.check('[name=company][value="1"]')
 assert page.locator('#accent-swatches button').nth(1).get_attribute('aria-pressed')=='true'
 page.click('button[type=reset]')
 assert page.locator('#accent-swatches').is_hidden()
 # Share company and accent together, while retaining old five-digit links.
 page.goto(url+'#compare=00000,00100,0000010,0000011,0000020,0000031&logo=0000021')
 page.wait_for_function("document.querySelectorAll('#saved figure').length===6")
 assert page.locator('[name=company]:checked').input_value()=='2'
 assert page.locator('#accent-swatches button').nth(1).get_attribute('aria-pressed')=='true'
 assert 'Deep Teal' in page.locator('#saved figure').nth(5).inner_text()
 page.click('#copy');page.wait_for_function("document.querySelector('#status').textContent.startsWith('Link copied')")
 mixed_shared=page.evaluate('navigator.clipboard.readText()')
 page.goto(base+mixed_shared[mixed_shared.index('#'):])
 page.wait_for_selector('#preview svg')
 assert page.locator('#saved figure').count()==6
 assert page.locator('[name=company]:checked').input_value()=='2'
 page.check('[name=company][value="3"]')
 page.evaluate('document.activeElement.blur()');page.evaluate('scrollTo(0,0)')
 page.screenshot(path='/tmp/burke-round3-desktop.png',full_page=True)
 dimensions=page.locator('.saved-art svg').evaluate_all('(xs)=>xs.map(x=>[x.getBoundingClientRect().width,x.getBoundingClientRect().height])')
 assert all(abs(x[0]-dimensions[0][0])<0.1 and abs(x[1]-dimensions[0][1])<0.1 for x in dimensions),dimensions
 for width in [390,320,768]:
  page.set_viewport_size({'width':width,'height':844})
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),width
  assert page.locator('#preview svg').is_visible()
  if width==390:page.screenshot(path='/tmp/burke-round3-mobile.png',full_page=True)
 page.goto(url+'#compare=garbage,11112,11112,99999');page.wait_for_function("document.querySelectorAll('#saved figure').length===1");assert page.locator('#saved figure').count()==1
 # Clipboard fallback remains usable when access is denied.
 page.evaluate("Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(new Error('denied'))},configurable:true})")
 page.click('#copy');page.wait_for_selector('#share-link:visible');assert 'compare=11112' in page.input_value('#share-link')
 assert not errors,errors
 # All three rounds have working top navigation under the GitHub Pages subpath.
 for route,round_number in [('',3),('round-3/',3),('round-2/',2),('round-1/',1)]:
  page.goto(base+route);page.wait_for_selector('.review-masthead .round-nav')
  assert page.locator('.round-nav a[aria-current=page]').inner_text()==f'Round {round_number}'
  for link,target in zip(page.locator('.round-nav a').all(),['round-1/','round-2/','']):
   assert link.evaluate('(a)=>a.href')==base+target
  if round_number==2:
   page.click('#start-review');page.wait_for_selector('#focus-logo:visible');assert page.locator('#focus-logo').evaluate('(img)=>img.complete && img.naturalWidth>0')
  if round_number==1:
   assert page.locator('.item').count()>0
   assert page.locator('.item img').first.evaluate('(img)=>img.complete && img.naturalWidth>0')
  for width in [390,320,1440]:
   page.set_viewport_size({'width':width,'height':900})
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),(route,width)
 print('PASS: navigation across all three rounds, homepage, company and accent round trip')
 print('PASS: save limit, duplicates, select/clear, removal, persistence, share round trip, reset, clipboard fallback, malformed links, equal sizes and responsive layouts')
 browser.close()
server.shutdown()
