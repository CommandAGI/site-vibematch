# Screenshots of the site at the brief's widths and with reduced motion: python3 redesign/shots.py [base-url] [out-dir]
# With no url it serves this folder itself. Full pages at 1440, 768, 390 and 320, and the first screen of each.
import functools, http.server, sys, threading, pathlib
from playwright.sync_api import sync_playwright
root = pathlib.Path(__file__).resolve().parent.parent
out = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else root / "tests" / ".out" / "shots"); out.mkdir(parents=True, exist_ok=True)
base = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] != "-" else None
if not base:
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    h = functools.partial(Quiet, directory=str(root))
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), h); threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{srv.server_port}/"
pages = {"home": "", "app": "app/", "about": "about.html", "es-home": "es/", "zh-home": "zh-Hans/"}
with sync_playwright() as p:
    b = p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
    for w, hgt in [(1440, 900), (768, 1024), (390, 844), (320, 640)]:
        for motion in ["no-preference", "reduce"]:
            if motion == "reduce" and w not in (1440, 390): continue
            ctx = b.new_context(viewport={"width": w, "height": hgt}, reduced_motion=motion)
            pg = ctx.new_page(); errs = []
            pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
            for name, path in pages.items():
                if w in (768, 320) and name in ("es-home", "zh-home"): continue
                pg.goto(base + path, wait_until="load"); pg.wait_for_timeout(1200)
                tag = f"{name}-{w}{'-reduced' if motion == 'reduce' else ''}"
                pg.screenshot(path=str(out / f"{tag}-top.png"))
                # A full-page capture grows the viewport, which no scroll timeline expects: it shows each scene's end state.
                pg.evaluate("document.querySelectorAll('.rise,.sum .num,.h1-big').forEach(e => e.style.animation = 'none')")
                pg.screenshot(path=str(out / f"{tag}-full.png"), full_page=True)
            if errs: print(w, motion, "errors:", errs)
            ctx.close()
    b.close()
print(out)
