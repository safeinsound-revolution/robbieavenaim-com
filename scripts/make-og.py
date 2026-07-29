#!/usr/bin/env python3
"""Regenerate public/og.png — the 1200x630 social/preview card.

Renders a branded HTML card through headless Chrome. Run after changing the
hero photo or the tagline:

    python3 scripts/make-og.py

Requires Pillow and Google Chrome.
"""

import base64
import pathlib
import subprocess
import tempfile

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCE = ROOT / "public/images/hero/robbie-with-sarps.jpg"
OUTPUT = ROOT / "public/og.png"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

EYEBROW = "Drums / Sound / Installation"
NAME = "Robbie<br>Avenaim"
TAGLINE = "Australian drummer and sound artist working with robotic and kinetic percussion."
DOMAIN = "robbieavenaim.com"

PANEL_W, PANEL_H = 560, 630


def photo_panel() -> str:
    """Crop the hero to the photo panel's aspect ratio and return it as a data URI."""
    im = Image.open(SOURCE)
    w, h = im.size
    crop_w = int(h * PANEL_W / PANEL_H)
    left = min(int(w * 0.42), w - crop_w)  # keeps Robbie's face inside the panel
    panel = im.crop((left, 0, left + crop_w, h)).resize((PANEL_W * 2, PANEL_H * 2), Image.LANCZOS)
    with tempfile.NamedTemporaryFile(suffix=".jpg") as tmp:
        panel.save(tmp.name, quality=92)
        return base64.b64encode(pathlib.Path(tmp.name).read_bytes()).decode()


HTML = """<!doctype html>
<html><head><meta charset="utf-8"><style>
  * {{ margin:0; padding:0; box-sizing:border-box; }}
  html,body {{ width:1200px; height:630px; }}
  body {{
    background:#0a0a0b; color:#f4f3ee;
    font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue",Helvetica,Arial,sans-serif;
    display:flex; overflow:hidden;
  }}
  .text {{ width:640px; padding:64px 56px 60px 64px; display:flex; flex-direction:column; justify-content:center; }}
  .eyebrow {{
    font-family:"SF Mono",Menlo,Consolas,monospace;
    letter-spacing:0.18em; text-transform:uppercase;
    font-size:17px; color:#ff5a1f; margin-bottom:26px;
  }}
  h1 {{ font-size:88px; font-weight:700; line-height:0.98; letter-spacing:-0.03em; }}
  .rule {{ width:96px; height:4px; background:#ff5a1f; margin:34px 0 30px; }}
  p {{ font-size:26px; line-height:1.42; color:#c9c8c2; max-width:500px; }}
  .domain {{
    margin-top:auto; padding-top:40px;
    font-family:"SF Mono",Menlo,Consolas,monospace;
    font-size:19px; letter-spacing:0.06em; color:#9b9a94;
  }}
  .photo {{ position:relative; width:{panel_w}px; height:{panel_h}px; }}
  .photo img {{ width:100%; height:100%; object-fit:cover; object-position:50% 34%; }}
  .scrim {{
    position:absolute; inset:0;
    background:linear-gradient(to right,#0a0a0b 0%,rgba(10,10,11,0.55) 18%,rgba(10,10,11,0) 46%);
  }}
</style></head><body>
  <div class="text">
    <div class="eyebrow">{eyebrow}</div>
    <h1>{name}</h1>
    <div class="rule"></div>
    <p>{tagline}</p>
    <div class="domain">{domain}</div>
  </div>
  <div class="photo">
    <img src="data:image/jpeg;base64,{panel}" alt="">
    <div class="scrim"></div>
  </div>
</body></html>"""


def main() -> None:
    html = HTML.format(
        panel_w=PANEL_W,
        panel_h=PANEL_H,
        eyebrow=EYEBROW,
        name=NAME,
        tagline=TAGLINE,
        domain=DOMAIN,
        panel=photo_panel(),
    )
    with tempfile.TemporaryDirectory() as tmpdir:
        card = pathlib.Path(tmpdir) / "og-card.html"
        card.write_text(html)
        subprocess.run(
            [
                CHROME,
                "--headless=new",
                "--disable-gpu",
                "--hide-scrollbars",
                f"--screenshot={OUTPUT}",
                "--window-size=1200,630",
                "--force-device-scale-factor=1",
                card.as_uri(),
            ],
            check=True,
            capture_output=True,
        )
    print(f"wrote {OUTPUT.relative_to(ROOT)} ({Image.open(OUTPUT).size[0]}x{Image.open(OUTPUT).size[1]})")


if __name__ == "__main__":
    main()
