"""Browser regression check for Round 6's approved identities and optional competitor tools."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
import json,re,xml.etree.ElementTree as ET
from playwright.sync_api import sync_playwright, expect
ROOT=Path(__file__).resolve().parents[1]
OUTPUT=Path('/tmp/burke-approved-checks');OUTPUT.mkdir(exist_ok=True)
class Handler(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
 def do_GET(self):
  if self.path.startswith('/burke-review/'):
   self.path=self.path[len('/burke-review'):]
  super().do_GET()
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
# Normal display copies must preserve every supplied path and its approved fill.
NS='{http://www.w3.org/2000/svg}'
for code in ['BG','BD','BPM','BR']:
 for source,role in [('Logo','primary'),('Logo2','wordmark')]:
  raw=ET.parse(ROOT/f'round-6/assets/approved/Burke_{code}_{source}.svg').getroot()
  display=ET.parse(ROOT/f'round-6/assets/approved-rendered/{code}-{role}.svg').getroot()
  signature=lambda tree:[(e.get('d'),e.get('fill')) for e in tree.iter(NS+'path')]
  assert signature(raw)==signature(display),(code,role)
errors=[];failed=[];competitor_requests=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':1050})
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:failed.append(r.url) if r.status>=400 and '%7B' not in r.url and '{{' not in r.url else None)
 page.on('request',lambda r:competitor_requests.append(r.url) if '/competitors/' in r.url else None)
 page.add_init_script("localStorage.setItem('burkePaletteExplorer.v2',JSON.stringify({cur:{primary:'#2B2420'},tab:'compare'}))")
 page.goto(f'http://127.0.0.1:{server.server_port}/burke-review/round-6/',wait_until='networkidle')
 toggle=page.get_by_role('switch',name='Competitor colours',exact=False)
 expect(toggle).to_have_attribute('aria-checked','false')
 assert not competitor_requests,competitor_requests
 assert page.get_by_role('button',name='COMPETITOR COLOURS',exact=True).count()==0
 assert page.get_by_role('button',name=re.compile('Generate|Favourite|Load .* palette')).count()==0
 assert page.locator('.company-card .primary-logo').count()==4
 assert page.locator('.company-card .secondary-logo').count()==4
 expect(page.get_by_role('heading',name='Approved identity')).to_be_visible()
 page.screenshot(path=str(OUTPUT/'01-overview.png'),full_page=True)
 page.get_by_role('button',name='DEVELOPMENT',exact=True).click()
 expect(page.locator('.company-page-logos .secondary-logo')).to_be_visible()
 page.get_by_text('Tweak colours',exact=True).click()
 expect(page.get_by_role('textbox',name='Approved icon colour hex',exact=True)).to_have_value('#9E9E9E')
 expect(page.get_by_role('textbox',name='Approved company text hex',exact=True)).to_have_value('#939393')
 assert page.get_by_role('textbox',name='Approved icon colour hex',exact=True).get_attribute('readonly') is not None
 async_logo=page.locator('.company-page-logos .primary-logo')
 expect(async_logo).to_have_attribute('src',re.compile('blob:'))
 logo=page.evaluate("async()=>await(await fetch(document.querySelector('.company-page-logos .primary-logo').src)).text()")
 doc=ET.fromstring(logo);paths=list(doc.iter('{http://www.w3.org/2000/svg}path'))
 assert [el.get('fill').lower() for el in paths[:3]]==['#9e9e9e','#9e9e9e','#1b2e46']
 assert '#939393' in logo
 frame=page.frame_locator('iframe[title="Burke Development"]')
 expect(frame.locator('[data-secondary-logo]')).to_be_visible()
 expect(frame.locator('body')).to_contain_text('#9E9E9E')
 page.get_by_role('textbox',name='Accent 2 hex',exact=True).fill('#B6A272')
 page.get_by_role('textbox',name='Accent 2 hex',exact=True).press('Tab')
 expect(frame.locator('body')).to_contain_text('#B6A272')
 page.screenshot(path=str(OUTPUT/'02-development.png'),full_page=True)
 page.get_by_role('button',name='Brochure',exact=True).click()
 brochure=page.frame_locator('iframe[title="Burke Development brochure"]')
 expect(brochure.locator('#development .sheet').first).to_be_visible()
 expect(brochure.locator('#development img.logo').first).to_have_attribute('src',re.compile('blob:'))
 expect(brochure.locator('#development .info.supporting')).to_have_css('background-color','rgb(182, 162, 114)')
 brochure_logo=page.evaluate("async()=>{const f=document.querySelector('iframe[title=\"Burke Development brochure\"]').contentDocument;return await(await fetch(f.querySelector('#development img.logo').src)).text()}")
 assert '#939393' in brochure_logo and '#9e9e9e' in brochure_logo
 page.screenshot(path=str(OUTPUT/'03-brochure.png'),full_page=True)
 page.get_by_text('Readability checks',exact=True).click()
 expect(page.get_by_text('Company text on light',exact=True)).to_be_visible()
 toggle.click()
 expect(toggle).to_have_attribute('aria-checked','true')
 expect(page.get_by_role('button',name='COMPETITOR COLOURS',exact=True)).to_be_visible()
 expect(page.locator('.matches')).to_be_visible()
 page.get_by_role('button',name='COMPETITOR COLOURS',exact=True).click()
 expect(page.locator('.competitor-card').first).to_be_visible()
 page.get_by_role('textbox',name='Search',exact=True).fill('Mango')
 expect(page.locator('.competitor-card')).to_have_count(1)
 page.screenshot(path=str(OUTPUT/'04-competitors.png'),full_page=True)
 toggle.click()
 expect(page.get_by_role('heading',name='Approved identity')).to_be_visible()
 assert page.get_by_role('button',name='COMPETITOR COLOURS',exact=True).count()==0
 page.get_by_role('button',name='GROUP',exact=True).click()
 page.get_by_text('Tweak colours',exact=True).click()
 assert page.get_by_role('textbox',name='Accent 2 hex',exact=True).count()==0
 page.get_by_role('textbox',name='Primary hex',exact=True).fill('#20354B');page.get_by_role('textbox',name='Primary hex',exact=True).press('Tab')
 page.get_by_role('button',name='REALTY',exact=True).click()
 expect(page.get_by_role('textbox',name='Primary hex',exact=True)).to_have_value('#20354B')
 page.wait_for_function("async()=>{const im=document.querySelector('.company-page-logos .primary-logo');return im&&im.src.startsWith('blob:')&&(await(await fetch(im.src)).text()).includes('#20354B')}")
 page.get_by_role('button',name='ALL COMPANIES',exact=True).click()
 page.get_by_role('button',name='Restore approved colours',exact=True).click()
 page.wait_for_timeout(250);page.reload(wait_until='networkidle')
 expect(toggle).to_have_attribute('aria-checked','false')
 page.set_viewport_size({'width':390,'height':844})
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.screenshot(path=str(OUTPUT/'05-mobile.png'),full_page=True)
 page.get_by_role('button',name='PROPERTY MGMT',exact=True).click()
 expect(page.locator('.company-page-logos .secondary-logo')).to_be_visible()
 expect(page.frame_locator('iframe[title="Burke Property Management"]').locator('body')).to_contain_text('#1E4497')
 page.wait_for_timeout(250)
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.screenshot(path=str(OUTPUT/'06-mobile-company.png'),full_page=True)
 assert not errors,errors
 assert not failed,failed
 browser.close()
server.shutdown()
print('PASS: supplied Development icon/text colours, approved top-two-bar treatment, secondary logos, shared primary propagation, child Accent 2, Group without Accent 2, brochure recolouring, readability position, competitor toggle and route guard, no default competitor fetch, stale-palette isolation, mobile widths. No page errors or missing assets.')
