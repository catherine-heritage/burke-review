import functools,http.server,threading,itertools,json
from pathlib import Path
from playwright.sync_api import sync_playwright
root=str(Path(__file__).resolve().parents[1])
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=root))
threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/round-3/'
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':1440,'height':1100},permissions=['clipboard-read','clipboard-write'])
 page=context.new_page(); errors=[]
 page.on('pageerror',lambda error:errors.append(str(error)))
 page.goto(url);page.wait_for_selector('#preview svg')
 results=page.evaluate('''async () => {
 const {makeLogo}=await import('./round-3.js');
 const {sources}=await import('./source-data.js');
 async function pixels(svg){
  const img=new Image(); img.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(new XMLSerializer().serializeToString(svg))));
  await img.decode(); const c=document.createElement('canvas');c.width=1080;c.height=936;
  const ctx=c.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,1080,936);ctx.drawImage(img,0,0,1080,936);
  return ctx.getImageData(0,0,1080,936).data;
 }
 const settings=[[0,0,0,0,0],[0,0,1,0,0],[0,0,0,0,1],[1,0,0,0,0],[0,1,0,0,0],[0,0,0,0,2],[0,0,0,1,0]];
 const results=[];
 for(let i=0;i<7;i++){
  const reference=new DOMParser().parseFromString(sources[i],'image/svg+xml').documentElement;
  // User requested removal of isolated dots; compound letter paths stay intact.
  if(i===5||i===6) [...reference.children].filter(x=>x.localName==='path').forEach(x=>x.remove());
  const a=await pixels(reference),b=await pixels(makeLogo(settings[i]));
  let different=0,max=0;for(let j=0;j<a.length;j++){if(a[j]!==b[j])different++;max=Math.max(max,Math.abs(a[j]-b[j]));}
  results.push({reference:i,differentChannels:different,maxDifference:max});
 }
 return results;
}''')
 print('Single-option pixel comparisons:',json.dumps(results))
 assert all(r['differentChannels']==0 for r in results),results
 combos=list(itertools.product(range(2),range(2),range(2),range(2),range(3)))
 page.evaluate('''async (combos)=>{
 const {makeLogo}=await import('./round-3.js');
 for(const settings of combos){
  const svg=makeLogo(settings);document.body.append(svg);
  if(svg.querySelectorAll('path').length!==13||svg.querySelector('text')||svg.outerHTML.includes('NaN'))throw Error('Bad SVG '+settings);
  for(const path of svg.querySelectorAll('path')){
   const b=path.getBBox();if(!b.width||!b.height)throw Error('Empty outline '+settings);
  }
  const b=svg.getBBox();if(b.x<0||b.y<0||b.x+b.width>1080||b.y+b.height>935.4)throw Error('Clipped '+settings);
  svg.remove();
 }
}''',combos)
 print('All 48 combinations: valid outlined geometry, no clipping')
 assert page.locator('#saved figure').count()==0
 for settings in combos[:6]:
  for key,value in zip(['spacing','shape','weight','tracking','colour'],settings):page.select_option(f'[name={key}]',str(value))
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
 page.click('button[type=reset]');assert all(page.input_value(f'[name={key}]')=='0' for key in ['spacing','shape','weight','tracking','colour'])
 # Distinct options for a readable comparison screenshot.
 page.goto(url+'#compare=00000,00100,00001,10000,01000,00010');page.wait_for_function("document.querySelectorAll('#saved figure').length===6")
 page.evaluate('document.activeElement.blur()'); page.evaluate('scrollTo(0,0)')
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
 print('PASS: save limit, duplicates, select/clear, removal, persistence, share round trip, reset, clipboard fallback, malformed links, equal sizes and responsive layouts')
 browser.close()
server.shutdown()
