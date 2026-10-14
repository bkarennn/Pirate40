"""Isolated Chromium smoke test using only Python's standard library.
Run: python tests/diary.browser.py [path-to-chrome.exe]
No existing browser profile or player save is accessed.
"""
import base64, json, os, pathlib, socket, struct, subprocess, sys, tempfile, time, urllib.request

root = pathlib.Path(__file__).resolve().parent.parent
profile = tempfile.TemporaryDirectory(prefix='pirate40-diary-test-')
chrome = sys.argv[1] if len(sys.argv)>1 else r'C:\Program Files\Google\Chrome\Application\chrome.exe'
process = subprocess.Popen([chrome,'--headless=new','--remote-debugging-port=0', '--user-data-dir='+profile.name,'--no-first-run','--no-default-browser-check','about:blank'], stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
errors=[]
try:
    port_file=pathlib.Path(profile.name)/'DevToolsActivePort'
    for _ in range(100):
        if port_file.exists(): break
        time.sleep(.1)
    port=int(port_file.read_text().splitlines()[0])
    targets=json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json'))
    target=next(t for t in targets if t['type']=='page')
    address=urllib.parse.urlparse(target['webSocketDebuggerUrl'])
    sock=socket.create_connection(('127.0.0.1',port),timeout=15)
    key=base64.b64encode(os.urandom(16)).decode()
    sock.sendall((f'GET {address.path} HTTP/1.1\r\nHost: 127.0.0.1:{port}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n').encode())
    header=b''
    while not header.endswith(b'\r\n\r\n'): header+=sock.recv(1)
    assert header.split(b'\r\n',1)[0].split()[1]==b'101',header
    def receive(n):
        data=b''
        while len(data)<n:
            piece=sock.recv(n-len(data))
            if not piece: raise RuntimeError('Browser disconnected')
            data+=piece
        return data
    sequence=0
    def call(method,params=None):
        global sequence
        sequence+=1
        data=json.dumps({'id':sequence,'method':method,'params':params or {}}).encode()
        mask=os.urandom(4); size=len(data)
        header=bytes([129,128|size]) if size<126 else bytes([129,254])+struct.pack('!H',size) if size<65536 else bytes([129,255])+struct.pack('!Q',size)
        sock.sendall(header+mask+bytes(byte^mask[i%4] for i,byte in enumerate(data)))
        while True:
            first,second=receive(2); length=second&127
            if length==126: length=struct.unpack('!H',receive(2))[0]
            if length==127: length=struct.unpack('!Q',receive(8))[0]
            payload=receive(length)
            if first&15!=1: continue
            message=json.loads(payload)
            if message.get('method')=='Runtime.exceptionThrown': errors.append(message['params'])
            if message.get('id')==sequence:
                if 'error' in message: raise RuntimeError(message['error'])
                return message.get('result',{})
    def js(code):
        result=call('Runtime.evaluate',{'expression':code,'returnByValue':True})
        if 'exceptionDetails' in result: raise RuntimeError(result['exceptionDetails'])
        return result['result'].get('value')
    def wait(code):
        for _ in range(100):
            if js(code): return
            time.sleep(.1)
        raise AssertionError({'condition':code,'errors':errors,'state':js('JSON.stringify({url:location.href,ready:document.readyState,state:typeof state,profile:typeof state!==\"undefined\"?state.profile:null,save:localStorage.getItem(\"pirate40-save-v1\")})')})
    def click(selector):
        point=js('(()=>{const e=document.querySelector('+json.dumps(selector)+');e.scrollIntoView({block:"center"});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()')
        call('Input.dispatchMouseEvent',{'type':'mousePressed','button':'left','clickCount':1,**point})
        call('Input.dispatchMouseEvent',{'type':'mouseReleased','button':'left','clickCount':1,**point})
    def password(value):
        js('document.querySelector("#diaryPassword").value=""')
        click('#diaryPassword');call('Input.insertText',{'text':value})
    call('Runtime.enable');call('Page.enable')
    call('Page.navigate',{'url':(root/'index.html').as_uri()})
    wait('typeof renderDiary==="function" && typeof renderDevices==="function"')
    # Fresh game: use the real identity form and native unlock flow first.
    click('#playerName');call('Input.insertText',{'text':'Partida nova'});click('#identityForm button[type="submit"]')
    click('#scanButton');wait('state.unlocked');click('[data-go="diario"]')
    password('Amélie');click('#diaryUnlockForm button[type="submit"]')
    wait('!!document.querySelector("#personalDiaryTitle")')
    assert js('document.querySelectorAll(".archive-record").length===4')
    js('state.diaryUnlocked=false;save()')
    js('state.profile={name:"Teste",pronouns:"neutral"};state.diary=null;save();')
    call('Page.reload');wait('typeof state!=="undefined" && !!state.profile')
    click('#scanButton');wait('state.unlocked')
    click('[data-go="diario"]');click('#diaryUnlockForm button[type="submit"]');assert js('document.querySelector("#diaryLockFeedback").textContent')=='Digite uma senha para continuar.';password('errada');click('#diaryUnlockForm button[type="submit"]')
    assert js('document.querySelector("#diaryLockFeedback").textContent')=='Senha incorreta. Tente novamente.',js('JSON.stringify({form:document.querySelector("#diaryUnlockForm").outerHTML,value:document.querySelector("#diaryPassword").value,active:document.activeElement.tagName})')
    password(' Amélie ');click('#diaryUnlockForm button[type="submit"]')
    wait('!!document.querySelector("#personalDiaryTitle")')
    assert not js('!!document.querySelector("#diaryUnlockForm")')
    for record in ['beginning','mirage','base-2091']:
        selector=f'[data-archive-record="{record}"]'
        click(selector+' summary')
        assert js('document.querySelector('+json.dumps(selector)+').open')
        assert js('document.querySelector('+json.dumps(selector+' .archive-text')+').textContent === [ORIGINAL_DIARY,...PIRATE_ARCHIVE].find(e=>e.id==='+json.dumps(record)+').body')
        click(selector+' summary')
    click('#homeButton');click('[data-go="diario"]');assert js('!!document.querySelector("#personalDiaryTitle")')
    call('Page.reload');wait('typeof state!=="undefined" && !!state.profile');click('#scanButton');wait('state.unlocked');click('[data-go="diario"]');assert js('!!document.querySelector("#personalDiaryTitle")')
    for value in ['Amelie','amélie','amelie','AMELIE']:
        js('state.diaryUnlocked=false;render()');password(value)
        call('Input.dispatchKeyEvent',{'type':'keyDown','key':'Enter','code':'Enter','windowsVirtualKeyCode':13,'text':'\r'})
        call('Input.dispatchKeyEvent',{'type':'keyUp','key':'Enter','code':'Enter','windowsVirtualKeyCode':13})
        wait('!!document.querySelector("#personalDiaryTitle")')
    # Advance only this isolated fixture through the existing narrative clock.
    click('#homeButton');js('advanceGameTime(2040)')
    click('[data-go="devices"]');wait('!!document.querySelector("[data-device=gustavo]")')
    click('[data-device="gustavo"]');click('[data-device-pair]');wait('state.devices.gustavo.paired')
    click('[data-remote-section="diary"]');click('#gustavoUnlockForm button[type="submit"]')
    assert js('document.querySelector("#gustavoLockFeedback").textContent')=='Digite uma senha para continuar.'
    click('#gustavoPassword');call('Input.insertText',{'text':'errada'});click('#gustavoUnlockForm button[type="submit"]')
    assert js('document.querySelector("#gustavoLockFeedback").textContent')=='Senha incorreta. Tente novamente.'
    for value in ['Lisandra',' LISÁNDRA ','lisandra']:
        js('state.gustavoDiaryUnlocked=false;gustavoPasswordDraft="";render()')
        click('#gustavoPassword');call('Input.insertText',{'text':value})
        if value=='lisandra':
            call('Input.dispatchKeyEvent',{'type':'keyDown','key':'Enter','code':'Enter','windowsVirtualKeyCode':13,'text':'\r'})
            call('Input.dispatchKeyEvent',{'type':'keyUp','key':'Enter','code':'Enter','windowsVirtualKeyCode':13})
        else: click('#gustavoUnlockForm button[type="submit"]')
        wait('state.gustavoDiaryUnlocked && !document.querySelector("#gustavoUnlockForm")')
    for record in js('GUSTAVO_ARCHIVE.map(e=>e.id)'):
        selector=f'[data-archive-record="{record}"]'
        click(selector+' summary');assert js('document.querySelector('+json.dumps(selector)+').open')
        assert js('document.querySelector('+json.dumps(selector+' .archive-text')+').textContent===GUSTAVO_ARCHIVE.find(e=>e.id==='+json.dumps(record)+').body')
    click('[data-gustavo-folder="letters"]');assert js('document.querySelectorAll(".archive-record").length')==3
    click('[data-device-list]');click('[data-device="esther"]');click('[data-device-pair]');wait('state.devices.esther.paired')
    click('[data-remote-section="diary"]');assert js('document.querySelector(".remote-content").textContent.includes("Arquivo privado protegido")')
    assert not js('!!document.querySelector(".archive-record, #gustavoUnlockForm")')
    assert js('NEXUS_DEVICES.esther.records===ESTHER_ARCHIVE && ESTHER_ARCHIVE.length===3')
    call('Page.reload');wait('typeof state!=="undefined" && !!state.profile');click('#scanButton');wait('state.unlocked')
    assert js('state.diaryUnlocked && state.gustavoDiaryUnlocked && state.devices.gustavo.paired && state.devices.esther.paired')
    click('[data-go="devices"]');click('[data-device="gustavo"]');click('[data-remote-section="diary"]');assert js('document.querySelectorAll(".archive-record").length')==9
    click('[data-devices-home]');click('[data-go="sistema"]');click('#resetSave');click('#confirmRestart');wait('state.profile===null');assert js('state.diaryUnlocked===false && state.gustavoDiaryUnlocked===false')
    assert not errors,errors
    print('PASS Chromium: Gustavo pairing/passwords/nine records/three letters, Esther paired and locked, both unlocks persisted/reset; native clicks/Enter, error, all password variants, immediate unlock, three complete records, reopening, reload and legacy null diary; no JS exceptions.')
    call('Browser.close')
finally:
    try: process.wait(timeout=5)
    except subprocess.TimeoutExpired: process.kill();process.wait()
    try: profile.cleanup()
    except PermissionError: pass
