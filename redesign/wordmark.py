# The wordmark, drawn once from Syne at weight 800: "vibematch" in lowercase, kerned by hand (tight, with the
# 'm' and 'a' locked together), and the i's dot replaced by a small aura of two overlapping glows.
# Run: python redesign/wordmark.py /path/to/Syne[wght].ttf  → wordmark.svg
import sys
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen

font = instantiateVariableFont(TTFont(sys.argv[1]), {"wght": 800})
gs, cmap = font.getGlyphSet(), font.getBestCmap()
word = "v" + "ı" + "bematch"
# Per-pair tracking in font units: Syne 800 is wide; the mark sits tighter than the font's own spacing.
KERN = {("v", "ı"): -40, ("ı", "b"): -30, ("b", "e"): -38, ("e", "m"): -34, ("m", "a"): -52,
        ("a", "t"): -40, ("t", "c"): -30, ("c", "h"): -36}
x, paths, dot_x = 0, [], None
for i, ch in enumerate(word):
    name = cmap[ord(ch)]
    pen = SVGPathPen(gs)
    from fontTools.pens.transformPen import TransformPen
    gs[name].draw(TransformPen(pen, (1, 0, 0, -1, x, 0)))
    paths.append(pen.getCommands())
    if ch == "ı":
        bp = BoundsPen(gs); gs[name].draw(bp); dot_x = x + (bp.bounds[0] + bp.bounds[2]) / 2
    x += gs[name].width + (KERN.get((ch, word[i + 1]), -28) if i + 1 < len(word) else 0)
x_height = font["OS/2"].sxHeight
top, bottom = -(x_height + 400), 30
w, h = x, bottom - top
dy = -(x_height + 150)
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 {top} {w:.0f} {h}" role="img" aria-labelledby="vm-t"><title id="vm-t">vibematch</title>
<defs><radialGradient id="vm-a"><stop offset="0" stop-color="#ff6f61"/><stop offset="1" stop-color="#ff6f61" stop-opacity="0"/></radialGradient><radialGradient id="vm-b"><stop offset="0" stop-color="#3fe0d0"/><stop offset="1" stop-color="#3fe0d0" stop-opacity="0"/></radialGradient></defs>
<path fill="currentColor" d="{' '.join(paths)}"/>
<circle cx="{dot_x - 78:.0f}" cy="{dy}" r="240" fill="url(#vm-a)"/><circle cx="{dot_x + 78:.0f}" cy="{dy}" r="240" fill="url(#vm-b)"/><circle cx="{dot_x:.0f}" cy="{dy}" r="62" fill="currentColor"/>
</svg>'''
open("wordmark.svg", "w").write(svg)
print(w, h, len(svg))
