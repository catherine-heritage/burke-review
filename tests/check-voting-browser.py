"""Browser integration tests against demo Firebase Auth/Firestore emulators only."""
import functools, http.server, json, threading, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
root = Path(__file__).resolve().parents[1]
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server = http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(root.parent)))
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}/{root.name}/'
url=base+'round-3/'
urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:8086/emulator/v1/projects/demo-burke-logo/databases/(default)/documents',method='DELETE')).close()
config="export const firebaseConfig={apiKey:'demo-key',authDomain:'localhost',projectId:'demo-burke-logo',appId:'demo-burke-logo'};"
backend=(root/'round-3/firebase-voting.js').read_text().replace('getAuth, setPersistence','connectAuthEmulator, connectFirestoreEmulator, getAuth, setPersistence')
backend=backend.replace('let connecting;', """
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
connectAuthEmulator(getAuth(app), 'http://127.0.0.1:9098', { disableWarnings: true });
connectFirestoreEmulator(getFirestore(app), '127.0.0.1', 8086);
let connecting;
""").replace('    watchResults(next, error) {','    watchResults(next, error) { window.__resultsListeners = (window.__resultsListeners || 0) + 1;')

def emulator_context(browser):
 ctx=browser.new_context(viewport={'width':1448,'height':1086})
 ctx.route('**/round-3/vendor/firebase.js',lambda route:route.fulfill(path='/tmp/burke-test-firebase.js',content_type='text/javascript'))
 ctx.route('**/round-3/firebase-config.js',lambda route:route.fulfill(body=config,content_type='text/javascript'))
 ctx.route('**/round-3/firebase-voting.js',lambda route:route.fulfill(body=backend,content_type='text/javascript'))
 return ctx

def ready(page):
 page.wait_for_function("!document.querySelector('#cast-vote').disabled",timeout=20000)
def total(page,n):
 page.wait_for_function('(n)=>document.querySelector("#vote-total").textContent === `${n} ${n===1?"vote":"votes"}`',arg=n,timeout=15000)
def choose(page,values):
 for key,value in zip(['spacing','shape','weight','tracking','colour'],values):page.check(f'[name={key}][value="{value}"]')
def uid(page):
 return page.evaluate("async()=>{const sdk=await import('"+base+"round-3/vendor/firebase.js');return sdk.getAuth().currentUser.uid}")

with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 a_ctx=emulator_context(browser);b_ctx=emulator_context(browser)
 a=a_ctx.new_page();b=b_ctx.new_page();errors=[]
 for page in [a,b]:page.on('pageerror',lambda error:errors.append(str(error)))
 a.goto(url);ready(a)
 assert a.locator('#live-results').is_hidden()
 assert a.locator('#vote-after').is_hidden()
 assert a.evaluate('window.__resultsListeners || 0')==0
 choose(a,[1,1,1,1,2])
 a.screenshot(path='/tmp/burke-voting-before.png',full_page=True)
 a.evaluate("document.querySelector('#cast-vote').click();document.querySelector('#cast-vote').click()")
 total(a,1)
 assert a.locator('#vote-before').is_hidden()
 assert a.locator('#vote-after').is_visible()
 assert a.locator('#preference-breakdowns').evaluate('(e)=>e.compareDocumentPosition(document.querySelector("#top-combinations")) & Node.DOCUMENT_POSITION_FOLLOWING')
 assert a.locator('.preference-group').count()==5
 assert a.locator('.popular-combination').count()==1
 saved_uid=uid(a)
 b.goto(url);ready(b)
 assert uid(b)!=saved_uid
 assert b.locator('#live-results').is_hidden()
 assert b.evaluate('window.__resultsListeners || 0')==0
 b.click('#cast-vote');total(b,2);total(a,2)
 # Changing a vote updates both listeners while leaving total voter count unchanged.
 a.check('[name=spacing][value="0"]')
 assert 'Icon spacing: Wider' in a.locator('#your-vote').inner_text()
 assert a.locator('#update-vote').is_enabled()
 a.click('#update-vote')
 a.wait_for_function("document.querySelector('#your-vote').textContent.includes('Icon spacing: Original')")
 total(a,2);total(b,2)
 a.wait_for_function("document.querySelector('[aria-label=\"Icon spacing: Original\"]').getAttribute('aria-valuenow')==='100'")
 choose(b,[0,1,1,1,2]);b.click('#update-vote')
 a.wait_for_function("document.querySelectorAll('.popular-combination').length===1")
 assert '2 votes · 100%' in a.locator('.popular-combination').inner_text()
 # A reload and a second page retain the exact same anonymous identity and vote.
 a.reload();a.wait_for_selector('#live-results:not([hidden])');total(a,2)
 assert uid(a)==saved_uid
 assert [a.locator(f'[name={key}]:checked').input_value() for key in ['spacing','shape','weight','tracking','colour']]==['0','1','1','1','2']
 assert a.locator('#vote-before').is_hidden()
 a.goto(base);a.wait_for_selector('#live-results:not([hidden])');total(a,2);assert uid(a)==saved_uid
 # Four distinct combinations exercise the top-three limit and percentage denominator.
 for index,settings in enumerate([[0,0,0,0,0],[1,0,0,0,0],[0,0,1,0,1]]):
  extra=emulator_context(browser);page=extra.new_page();page.goto(url);ready(page)
  choose(page,settings);page.click('#cast-vote');total(page,3+index);total(a,3+index);extra.close()
 assert a.locator('.popular-combination').count()==3
 assert '2 votes · 40%' in a.locator('.popular-combination').first.inner_text()
 a.screenshot(path='/tmp/burke-voting-after.png',full_page=True)
 for width in [320,390,768,1100,1448]:
  a.set_viewport_size({'width':width,'height':900})
  assert a.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
  if width==390:a.screenshot(path='/tmp/burke-voting-mobile.png',full_page=True)
 assert not errors,errors
 print('PASS: real emulator anonymous auth, first vote, duplicate click, gated results, shared listener, vote update, stable total, restoration, same UID, both page routes and mobile layout')
 # Fault injection exercises UI failures without modifying emulator rules or live Firebase.
 c=browser.new_context().new_page()
 failed_backend="""let tries=0; export async function connectVoting(){if(++tries===1){const error=new Error();error.code='permission-denied';throw error;}return {watchVote(next){next({vote:null,cached:false,pending:false});return()=>{}},watchResults(){throw Error('Must not read results')},save(){return Promise.reject({code:'unavailable'})}}}"""
 c.route('**/round-3/firebase-voting.js',lambda route:route.fulfill(body=failed_backend,content_type='text/javascript'))
 c.goto(url);c.wait_for_selector('#retry-voting:not([hidden])')
 assert c.locator('.logo-stage svg').count()==4
 assert c.locator('#live-results').is_hidden()
 c.click('#retry-voting');ready(c);c.click('#cast-vote')
 c.wait_for_function("document.querySelector('#vote-notice').textContent.includes('could not connect')")
 assert c.locator('#vote-after').is_hidden()
 assert c.locator('#live-results').is_hidden()
 assert c.locator('#cast-vote').is_enabled()
 # A queued/unconfirmed vote must not unlock results or pretend it was recorded.
 d=browser.new_context().new_page()
 queued_backend="""let observer;export async function connectVoting(){return {watchVote(next){observer=next;next({vote:null,cached:false,pending:false});return()=>{}},watchResults(next){next({votes:[window.saved],cached:false});return()=>{}},save(vote){window.saved=vote;return new Promise(resolve=>{window.finish=()=>{observer({vote,cached:false,pending:false});resolve()}})}}}"""
 d.route('**/round-3/firebase-voting.js',lambda route:route.fulfill(body=queued_backend,content_type='text/javascript'))
 d.goto(url);ready(d);d.clock.install();d.click('#cast-vote')
 assert d.locator('#cast-vote').is_disabled()
 assert d.locator('#live-results').is_hidden()
 d.clock.fast_forward(10001)
 assert 'waiting for a connection' in d.locator('#vote-notice').inner_text()
 d.check('[name=shape][value="1"]')
 d.evaluate('window.finish()');total(d,1)
 assert 'Icon shape: Original' in d.locator('#your-vote').inner_text()
 assert d.locator('#update-vote').is_enabled()
 # Results errors retain the saved vote and support retry and stale-count messaging.
 e=browser.new_context().new_page()
 results_backend="""let tries=0;const vote={spacing:0,shape:0,weight:0,tracking:0,colour:0};export async function connectVoting(){return{watchVote(next){next({vote,cached:false,pending:false});return()=>{}},watchResults(next,error){window.failResults=()=>error({code:'unavailable'});if(++tries===1)error({code:'permission-denied'});else next({votes:[vote],cached:false});return()=>{}},save(){return Promise.resolve()}}}"""
 e.route('**/round-3/firebase-voting.js',lambda route:route.fulfill(body=results_backend,content_type='text/javascript'))
 e.goto(url);e.wait_for_selector('#retry-results:not([hidden])')
 assert e.locator('#vote-after').is_visible()
 assert e.locator('#results-content').is_hidden()
 e.click('#retry-results');total(e,1)
 e.evaluate('window.failResults()')
 assert 'last received counts' in e.locator('#results-status').inner_text()
 assert e.locator('#results-content').is_visible()
 print('PASS: results-read failure, retry and stale results preserve the confirmed vote')
 print('PASS: permission/network failure, retry, failed vote remains unrecorded, pending writes keep results hidden, and selection is captured at submission')
 browser.close()
server.shutdown()
