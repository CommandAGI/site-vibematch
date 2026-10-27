# The touch icon (180 px) and the OG card (1200×630), drawn from the site's own wordmark, mark, fonts and the
# hero loop's poster: python3 redesign/cards.py
import pathlib
from playwright.sync_api import sync_playwright
root = pathlib.Path(__file__).resolve().parent.parent
wm = (root / "wordmark.svg").read_text().replace('fill="currentColor"', 'fill="#f6f4f9"')
og = f"""<style>@font-face{{font-family:S;src:url(../fonts/syne.woff2)}}body{{margin:0}}
.c{{width:1200px;height:630px;position:relative;overflow:hidden;background:#0c0a10 url(../media/auras.jpg) 50% 45%/cover;font-family:S;color:#f6f4f9}}
.c:before{{content:"";position:absolute;inset:0;background:radial-gradient(120% 90% at 50% 40%,#0c0a1010,#0c0a10d0 80%)}}
.w{{position:absolute;left:64px;top:56px;width:300px}}h1{{position:absolute;left:58px;bottom:70px;margin:0;font-weight:800;font-size:150px;line-height:.84;letter-spacing:-.055em}}
p{{position:absolute;left:64px;bottom:34px;margin:0;font-weight:700;font-size:15px;letter-spacing:.2em;text-transform:uppercase}}</style>
<div class="c"><div class="w">{wm}</div><h1>you need<br>a vibe.</h1><p>sixteen signals / two dials / three introductions</p></div>"""
(root / "redesign" / ".og.html").write_text(og)
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1200, "height": 630})
    pg.goto((root / "redesign" / ".og.html").as_uri().replace("/redesign/.og.html", "/redesign/.og.html")); pg.wait_for_timeout(500)
    pg.screenshot(path=str(root / "og.png"))
    pg = b.new_page(viewport={"width": 180, "height": 180})
    pg.goto((root / "mark.svg").as_uri()); pg.screenshot(path=str(root / "touch-icon.png"))
    b.close()
(root / "redesign" / ".og.html").unlink()
