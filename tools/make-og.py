#!/usr/bin/env python3
"""Regenerate the og:image social card and the favicon set.

The outputs are committed, so this only needs running when the palette, the
tagline, or the headshot changes:

    python3 tools/make-og.py

Needs `rsvg-convert` (librsvg) on PATH and Pillow installed. Fonts are named
by family and resolved through fontconfig — the serif falls back to whatever
Times-alike is installed, which is close enough to the site's Georgia stack
for a raster card.
"""
import base64
import pathlib
import subprocess

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMG = ROOT / "assets" / "img"
BUILD = ROOT / "tools" / ".build"

# Brand tokens — keep in sync with :root in assets/css/style.scss.
NAVY, SURFACE, CYAN, PURPLE = "#1a1a2e", "#21213a", "#1fb7cc", "#6835a4"
INK, MUTED, FAINT = "#e8e9f2", "#a8adc4", "#838aa0"
SERIF, SANS = "Liberation Serif", "Inter"

portrait = base64.b64encode((IMG / "headshot_circle.jpeg").read_bytes()).decode()

og = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <clipPath id="circle"><circle cx="990" cy="250" r="118"/></clipPath>
    <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="{CYAN}"/>
      <stop offset="100%" stop-color="{PURPLE}"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="{NAVY}"/>
  <rect x="0" y="0" width="1200" height="10" fill="url(#rule)"/>

  <circle cx="990" cy="250" r="126" fill="{SURFACE}"/>
  <image xlink:href="data:image/jpeg;base64,{portrait}"
         x="872" y="132" width="236" height="236"
         preserveAspectRatio="xMidYMid slice" clip-path="url(#circle)"/>

  <text x="90" y="196" font-family="{SANS}" font-size="26" font-weight="600"
        letter-spacing="4" fill="{CYAN}">AI HARNESS ENGINEER</text>
  <text x="90" y="290" font-family="{SERIF}" font-size="82" font-weight="600"
        fill="{INK}">Philipp Guldimann</text>

  <text x="90" y="360" font-family="{SANS}" font-size="30" fill="{MUTED}">I build the scaffolding that makes AI</text>
  <text x="90" y="404" font-family="{SANS}" font-size="30" fill="{MUTED}">systems survive production.</text>

  <rect x="90" y="470" width="72" height="3" fill="{CYAN}"/>
  <text x="90" y="530" font-family="{SANS}" font-size="26" fill="{MUTED}">philippguldimann.ch</text>
  <text x="90" y="574" font-family="{SANS}" font-size="24" fill="{FAINT}">Evaluation · Agent reliability · Data pipelines</text>
</svg>'''

# Monogram, not the headshot: a face is unreadable at 16px.
icon = f'''<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="104" fill="{NAVY}"/>
  <rect x="88" y="352" width="336" height="26" fill="{CYAN}"/>
  <text x="256" y="320" font-family="{SERIF}" font-size="300" font-weight="600"
        text-anchor="middle" fill="{INK}">P</text>
</svg>'''


def render(svg, name, width, height):
    BUILD.mkdir(parents=True, exist_ok=True)
    src = BUILD / f"{pathlib.Path(name).stem}.svg"
    src.write_text(svg)
    subprocess.run(
        ["rsvg-convert", "-w", str(width), "-h", str(height), "-o", str(IMG / name), str(src)],
        check=True,
    )
    print(f"{name}: {Image.open(IMG / name).size}")


render(og, "og-card.png", 1200, 630)
for size, name in [(512, "icon-512.png"), (180, "apple-touch-icon.png"), (32, "favicon-32.png")]:
    render(icon, name, size, size)

# Multi-resolution .ico for legacy browser chrome.
Image.open(IMG / "icon-512.png").save(ROOT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
print(f"favicon.ico: {Image.open(ROOT / 'favicon.ico').size}")
