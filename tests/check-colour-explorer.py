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
  assert not explorer.evaluate('(e)=>e.open')
  assert explorer.locator('svg,img').count()==0
  assert explorer.evaluate('(e)=>!!(document.querySelector("#options").compareDocumentPosition(e)&Node.DOCUMENT_POSITION_FOLLOWING)&&!!(e.compareDocumentPosition(document.querySelector("#voting"))&Node.DOCUMENT_POSITION_FOLLOWING)')
  options=page.locator('#options').inner_html();parent=page.locator('#preview').inner_html()
  original=['#BD6C5A','#648EAB','#8F9868']
  def values():return page.locator('.accent-hex').evaluate_all('(es)=>es.map(e=>e.value)')
  def path_shapes():return page.locator('.subsidiary-grid path').evaluate_all('(ps)=>ps.map(p=>[p.getAttribute("d"),p.getAttribute("transform")])')
  geometry=path_shapes()
  explorer.locator('summary').click();assert values()==original
  assert 'navy and gold stay fixed' in explorer.inner_text()
  page.locator('.accent-lock').nth(0).check();page.click('#shuffle-colours')
  shuffled=values();assert shuffled[0]==original[0] and all(shuffled[i]!=original[i] for i in [1,2])
  assert page.locator('#preview').inner_html()==parent
  assert path_shapes()==geometry
  assert page.locator('#options').inner_html()==options
  assert page.locator('#live-results').is_hidden()
  for i,selector in enumerate(['#preview-realty','#preview-development','#preview-management']):
   assert page.locator(selector+' [data-part=group] path').evaluate_all('(ps)=>ps.every(p=>p.getAttribute("fill")==="'+shuffled[i]+'")')
  page.locator('#accent-1').fill('abc');assert values()[1]=='abc'
  page.locator('#accent-1').blur();assert values()[1]=='#AABBCC'
  previous=page.locator('#preview-development').inner_html()
  page.locator('#accent-1').fill('#zzzzzz')
  assert page.locator('#accent-1').get_attribute('aria-invalid')=='true'
  assert page.locator('#accent-error-1').is_visible()
  assert page.locator('#preview-development').inner_html()==previous
  page.locator('#accent-1').fill('#5476A1');page.locator('#accent-1').blur()
  for lock in page.locator('.accent-lock').all():lock.check()
  locked=values();page.click('#shuffle-colours');assert values()==locked
  assert 'All colours are locked' in page.locator('.explorer-status').inner_text()
  page.click('#copy-palette')
  page.wait_for_function("document.querySelector('.explorer-status').textContent==='Palette copied.'")
  copied=page.evaluate('navigator.clipboard.readText()');assert all(c in copied for c in locked+['#1B2E46','#B78352'])
  page.click('#reset-colours');assert values()==original
  assert not any(lock.is_checked() for lock in page.locator('.accent-lock').all())
  assert page.locator('#preview').inner_html()==parent
  # Every existing refinement/treatment preserves edited accents and geometry.
  page.locator('#accent-0').fill('#A85649')
  for treatment in ['0','2','1','3']:
   page.check('[name=colour][value="'+treatment+'"]')
   for key in ['spacing','shape','weight','tracking']:page.check('[name='+key+'][value="1"]')
   assert page.locator('#preview-realty path').evaluate_all('(ps)=>ps.some(p=>p.getAttribute("fill")==="#A85649")')
  page.click('#cast-vote');page.wait_for_selector('#vote-after:not([hidden])')
  vote=page.locator('#your-vote').inner_text();results=page.locator('#results-content').inner_html()
  assert page.locator('#update-vote').is_disabled()
  assert page.evaluate('window.savedVotes')==[dict(spacing=1,shape=1,weight=1,tracking=1,colour=3)]
  page.click('#shuffle-colours');page.locator('#accent-2').fill('#41785C');page.click('#reset-colours')
  assert page.locator('#your-vote').inner_text()==vote
  assert page.locator('#results-content').inner_html()==results
  assert page.locator('#update-vote').is_disabled()
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
   if width in [390,1448]:page.screenshot(path=f'/tmp/burke-explore-{width}.png',full_page=True)
  explorer.locator('summary').click();assert not explorer.evaluate('(e)=>e.open')
 assert not errors,errors
 browser.close()
server.shutdown()
print('PASS: both routes; collapsed defaults; HEX validation; locks; shuffle; reset; clipboard success/failure; SVG geometry; fixed parent; all refinements; voting isolation; responsive layouts')
