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
        for _ in range(600):
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
    call('Runtime.enable');call('Page.enable');call('Network.enable');call('Network.setCacheDisabled',{'cacheDisabled':True})
    published=os.environ.get('PIRATE_DIARY_PUBLISHED')=='1'
    mobile=os.environ.get('PIRATE_DIARY_MOBILE')=='1'
    if mobile:
        call('Emulation.setDeviceMetricsOverride',{'width':393,'height':851,'deviceScaleFactor':2.75,'mobile':True})
        call('Emulation.setTouchEmulationEnabled',{'enabled':True,'maxTouchPoints':1})
        mouse_click=click
        def click(selector):
            point=js('(()=>{const e=document.querySelector('+json.dumps(selector)+');e.scrollIntoView({block:"center"});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()')
            call('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[point]})
            call('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
    call('Page.navigate',{'url':'https://pirate40.netlify.app/' if published else (root/'index.html').as_uri()})
    wait('typeof renderDiary==="function" && typeof renderDevices==="function"')
    click('#playerName');call('Input.insertText',{'text':'Teste permanencia'});click('#identityForm button[type="submit"]')
    for legacy in [False,True]:
        if legacy:
            js('state.diaryUnlocked=false;state.diary=[{id:"preserved",title:"Minha nota",body:"Preservar texto",at:state.gameTime}];save()')
            call('Page.reload');wait('typeof state!=="undefined" && !!state.profile')
        click('#scanButton');wait('state.unlocked');click('[data-go="diario"]')
        js("window.diaryTrace=[];let unlocked=state.diaryUnlocked;Object.defineProperty(state,'diaryUnlocked',{enumerable:true,configurable:true,get(){return unlocked},set(value){diaryTrace.push({step:'state-write',before:unlocked,after:value,stack:new Error().stack});unlocked=value}});for(const name of ['renderDiary','diaryEntriesMarkup','save','render']){const original=window[name];window[name]=function(){diaryTrace.push({step:name+' before',unlocked:state.diaryUnlocked,stack:new Error().stack});try{const result=original.apply(this,arguments);diaryTrace.push({step:name+' after',unlocked:state.diaryUnlocked});return result}catch(e){diaryTrace.push({step:'error',message:e.message});throw e}}}for(const type of ['click','submit'])document.addEventListener(type,e=>{if(e.target.closest('#diaryUnlockForm'))diaryTrace.push({step:type,unlocked:state.diaryUnlocked})},true)")
        password('Amélie');click('#diaryUnlockForm button[type="submit"]')
        if published:
            print('PUBLISHED CLICK',legacy,js('JSON.stringify(diaryTrace)'),flush=True)
            assert js('state.diaryUnlocked===false && !!document.querySelector("#diaryUnlockForm")')
            # Diagnostic only: isolate accepted password from the broken click default action.
            js('document.querySelector("#diaryUnlockForm").requestSubmit()')
        wait('state.diaryUnlocked && !document.querySelector("#diaryUnlockForm") && document.querySelectorAll(".archive-record").length===4')
        for _ in range(16):
            time.sleep(1)
            assert js('state.diaryUnlocked && !document.querySelector("#diaryUnlockForm") && document.querySelectorAll(".archive-record").length===4')
        click('[data-archive-record="beginning"] summary')
        if not published: assert js('document.querySelector("[data-archive-record=beginning]").open')
        # Published click re-renders even an unlocked record; observe separately.
        print('RECORD OPEN AFTER CLICK',js('document.querySelector("[data-archive-record=beginning]").open'),flush=True)
        if published: js('document.querySelector("[data-archive-record=beginning]").open=true')
        for _ in range(16):
            time.sleep(1)
            assert js('state.diaryUnlocked && !document.querySelector("#diaryUnlockForm") && document.querySelector("[data-archive-record=beginning]").open')
        assert js('document.querySelector("[data-archive-record=beginning] .archive-text").textContent===PIRATE_ARCHIVE.find(e=>e.id==="beginning").body')
        assert js('JSON.parse(localStorage.getItem(STORAGE_KEY)).diaryUnlocked===true')
        print('PERMANENCE PASS',{'published':published,'legacy':legacy,'mobile':mobile,'seconds':32},js('JSON.stringify(diaryTrace.filter(e=>e.step==="state-write" || e.step==="error" || e.step==="save after"))'),flush=True)
        click('#homeButton');click('[data-go="diario"]');assert js('state.diaryUnlocked && !document.querySelector("#diaryUnlockForm")')
        call('Page.reload');wait('typeof state!=="undefined" && !!state.profile')
        assert js('state.diaryUnlocked===true')
    assert not errors,errors
    call('Browser.close')

finally:
    try: process.wait(timeout=5)
    except subprocess.TimeoutExpired: process.kill();process.wait()
    try: profile.cleanup()
    except PermissionError: pass
