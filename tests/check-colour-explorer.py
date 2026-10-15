"""Local browser checks; mock voting transport never connects to production Firebase."""
import functools, http.server, threading
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(root.parent)))
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}/{root.name}/'
backend='''let vote=null,watch;export async function connectVoting(){return{watchVote(next){watch=next;next({vote,cached:false,pending:false});return()=>{}},watchResults(next){next({votes:[vote],cached:false});return()=>{}},async save(value){window.savedVotes??=[];window.savedVotes.push(value);vote=value;watch({vote,cached:false,pending:false})}}}'''
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':1448,'height':1100},permissions=['clipboard-read','clipboard-write'])
 context.route('**/round-3/firebase-voting.js',lambda route:route.fulfill(body=backend,content_type='text/javascript'))
 page=context.new_page();errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
 for route in ['', 'round-3/']:
  page.goto(base+route);page.wait_for_selector('#preview svg');page.wait_for_function("!document.querySelector('#cast-vote').disabled")
  explorer=page.locator('#colour-explorer')
  assert explorer.evaluate('(e)=>e.open')
  assert explorer.locator('.logo-stage, svg[role=img], img').count()==0
  assert explorer.evaluate('(e)=>!!(document.querySelector("#options").compareDocumentPosition(e)&Node.DOCUMENT_POSITION_FOLLOWING)&&!!(e.compareDocumentPosition(document.querySelector("#voting"))&Node.DOCUMENT_POSITION_FOLLOWING)')
  options=page.locator('#options').inner_html();parent=page.locator('#preview').inner_html()
  original=['#768290','#CC6E2F','#81376D','#317B82']
  def values():return page.locator('.accent-hex').evaluate_all('(es)=>es.map(e=>e.value)')
  def path_shapes():return page.locator('.subsidiary-grid path').evaluate_all('(ps)=>ps.map(p=>[p.getAttribute("d"),p.getAttribute("transform")])')
  geometry=path_shapes()
  assert values()==original
  assert 'main Burke navy stays fixed' in explorer.inner_text()
  assert page.locator('.family-swatches').count()==4
  assert page.locator('.family-choice').count()==8
  assert page.locator('.family-swatches input[type=color]').count()==0
  assert page.locator('.custom-colour-input').count()==4
  assert page.locator('.family-choice span:last-child').all_text_contents()==['Navy','Gold','Red','Orange','Purple','Blue','Green','Teal']
  assert page.locator('.lock-open:visible').count()==4
  # Swatches are native, full-spectrum colour pickers; input updates immediately.
  for i,colour in enumerate(['#00ffcc','#ff00ff','#0000ff','#f0a000']):
   picker=page.locator('.custom-colour-input').nth(i)
   assert picker.get_attribute('type')=='color'
   picker.evaluate('(e,value)=>{e.value=value;e.dispatchEvent(new Event("input",{bubbles:true}))}',colour)
   assert values()[i]==colour.upper()
   assert page.locator('.accent-lock').nth(i).get_attribute('aria-pressed')=='false'
   selector=['#preview','#preview-realty','#preview-development','#preview-management'][i]
   assert page.locator(selector+' [data-part=group] path').first.get_attribute('fill')==colour.upper()
  assert page.locator('#preview [data-part=burke] path').first.get_attribute('fill')=='#1B2E46'
  # Refinements leave manually selected colours in place.
  page.check('[name=spacing][value="1"]');assert values()==['#00FFCC','#FF00FF','#0000FF','#F0A000']
  page.check('[name=spacing][value="0"]')
  page.click('#reset-colours');assert values()==original
  for i,alternate in enumerate([1,0,1,0]):
   before=values();before_logos=page.locator('.logo-family').inner_html()
   picker=page.locator('.family-swatches').nth(i).locator('button').nth(alternate)
   picker.click()
   assert picker.get_attribute('aria-pressed')=='true'
   assert values()==before
   assert page.locator('.logo-family').inner_html()==before_logos
  # Family selection never activates a picker. The wheel is the only native
  # colour input; its click is tested with default action prevented for automation.
  for picker in page.locator('.custom-colour-input').all():
   assert picker.get_attribute('title')=='Choose custom colour'
   picker.evaluate('(e)=>e.addEventListener("click",event=>{window.pickerClicks=(window.pickerClicks||0)+1;event.preventDefault()})')
   picker.click()
  assert page.evaluate('window.pickerClicks')==4
  alternate_values=values()
  page.click('#shuffle-colours')
  assert all(a!=b for a,b in zip(alternate_values,values()))
  page.click('#reset-colours');assert values()==original
  page.locator('.accent-lock').nth(0).click()
  page.locator('.family-swatches').nth(0).locator('button').nth(1).click()
  assert page.locator('.accent-lock').nth(0).get_attribute('aria-pressed')=='true'
  assert values()==original
  page.click('#shuffle-colours')
  shuffled=values();assert shuffled[0]==original[0] and all(shuffled[i]!=original[i] for i in [1,2,3])
  assert page.locator('#preview').inner_html()==parent
  assert path_shapes()==geometry
  assert page.locator('#options').inner_html()==options
  assert page.locator('#live-results').is_hidden()
  for i,selector in enumerate(['#preview','#preview-realty','#preview-development','#preview-management']):
   assert page.locator(selector+' [data-part=group] path').evaluate_all('(ps)=>ps.every(p=>p.getAttribute("fill")==="'+shuffled[i]+'")')
  page.locator('#accent-1').fill('abc');assert values()[1]=='abc'
  page.locator('#accent-1').blur();assert values()[1]=='#AABBCC'
  assert page.locator('.custom-colour-input').nth(1).input_value()=='#aabbcc'
  previous=page.locator('#preview-realty').inner_html()
  page.locator('#accent-1').fill('#zzzzzz')
  assert page.locator('#accent-1').get_attribute('aria-invalid')=='true'
  assert page.locator('#accent-error-1').is_visible()
  assert page.locator('#preview-realty').inner_html()==previous
  page.locator('#accent-1').fill('#5476A1');page.locator('#accent-1').blur()
  for lock in page.locator('.accent-lock').all():
   if lock.get_attribute('aria-pressed')=='false':lock.click()
  locked=values();assert page.locator('#shuffle-colours').is_disabled()
  assert 'All colours are locked' in page.locator('#shuffle-help').inner_text()
  assert page.locator('#shuffle-help').is_visible()
  assert page.locator('.lock-closed:visible').count()==4
  page.locator('.accent-lock').nth(1).click()
  assert page.locator('#shuffle-colours').is_enabled()
  assert page.locator('#shuffle-help').is_hidden()
  page.locator('.accent-lock').nth(1).click()
  page.click('#copy-palette')
  page.wait_for_function("document.querySelector('.explorer-status').textContent==='Palette copied.'")
  copied=page.evaluate('navigator.clipboard.readText()');assert all(c in copied for c in locked+['#1B2E46','#B78352'])
  page.click('#reset-colours');assert values()==original
  assert all(lock.get_attribute('aria-pressed')=='false' for lock in page.locator('.accent-lock').all())
  assert page.locator('.lock-open:visible').count()==4
  assert page.locator('#shuffle-colours').is_enabled()
  assert page.locator('#preview').inner_html()==parent
  # Every existing refinement/treatment preserves edited accents and geometry.
  page.locator('#accent-1').fill('#A85649')
  for treatment in ['0','2','1','3']:
   page.check('[name=colour][value="'+treatment+'"]')
   for key in ['spacing','shape','weight','tracking']:page.check('[name='+key+'][value="1"]')
   assert page.locator('#preview-realty path').evaluate_all('(ps)=>ps.some(p=>p.getAttribute("fill")==="#A85649")')
  page.click('#cast-vote');page.wait_for_selector('#vote-after:not([hidden])')
  vote=page.locator('#your-vote').inner_text();results=page.locator('#results-content').inner_html()
  assert page.locator('#update-vote').is_disabled()
  assert page.evaluate('window.savedVotes')==[dict(spacing=1,shape=1,weight=1,tracking=1,colour=3)]
  page.click('#shuffle-colours');page.locator('#accent-2').fill('#41785C');page.click('#reset-colours')
  page.locator('.family-swatches').nth(2).locator('button').nth(1).click()
  assert page.locator('#your-vote').inner_text()==vote
  assert page.locator('#results-content').inner_html()==results
  assert page.locator('#update-vote').is_disabled()
  assert page.locator('[name=shape]:checked').input_value()=='1'
  assert page.locator('[name=colour]:checked').input_value()=='3'
  assert page.evaluate('window.savedVotes.length')==1
  assert "We're voting on the design, not the colours." in page.locator('#voting').inner_text()
  # Clipboard denial keeps manual copying usable.
  page.evaluate("Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw Error('Denied')}}})")
  page.click('#copy-palette');page.wait_for_function("document.querySelector('.explorer-status').textContent.includes('Copy unavailable')")
  for width in [320,390,700,768,1100,1448]:
   page.set_viewport_size({'width':width,'height':1000})
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
   assert page.locator('.accent-hex').evaluate_all('(es)=>es.every(e=>e.getBoundingClientRect().width>=100)')
   assert page.locator('.logo-stage svg').count()==4
   if width in [390,1448]:
    page.evaluate('document.activeElement.blur()')
    page.screenshot(path=f'/tmp/burke-explore-{width}.png',full_page=True)
  explorer.locator('summary').click();assert not explorer.evaluate('(e)=>e.open')
 assert not errors,errors
 browser.close()
server.shutdown()
print('PASS: both routes; expanded defaults; HEX validation; locks; shuffle; reset; clipboard success/failure; SVG geometry; fixed navy; parent accent exploration; paired family switches; all refinements; voting isolation; responsive layouts')
